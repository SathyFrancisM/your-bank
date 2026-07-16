import bcrypt from 'bcrypt';
import { Employee } from '../models/Employee.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { RiskScore } from '../models/RiskScore.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { createOtpSession, verifyOtpSession } from '../services/otpService.js';
import { createLoginSession, getLoginSession, updateLoginSession, deleteLoginSession } from '../services/authSessionService.js';
import { evaluateLoginSecurity } from '../services/loginSecurity.js';
import { calculateEmployeeRisk } from '../services/riskEngine.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { startRecordingSession } from '../services/recordingService.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { demoEmployees, demoLoginRequests } from '../services/demoStore.js';
import { demoMode } from '../config/db.js';

const mapEmployee = (employee) => ({
  id: employee._id,
  employeeId: employee.employeeId,
  name: employee.name,
  role: employee.role,
  email: employee.email,
  phone: employee.phone,
  department: employee.department,
  branch: employee.branch,
  permissions: employee.permissions,
  officeLocation: employee.officeLocation,
  status: employee.status
});

const parseUserAgent = (userAgent = '') => {
  const agent = String(userAgent);
  const browser = /Edg\//.test(agent) ? 'Microsoft Edge' : /Chrome\//.test(agent) ? 'Google Chrome' : /Firefox\//.test(agent) ? 'Mozilla Firefox' : /Safari\//.test(agent) ? 'Safari' : 'Unknown Browser';
  const os = /Windows NT/.test(agent) ? 'Windows' : /Mac OS X/.test(agent) ? 'macOS' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : 'Unknown OS';
  const device = /Mobile|Android|iPhone|iPad/.test(agent) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
};

const issueTokens = async (employee, context, previousRefreshToken = null) => {
  const payload = { sub: employee._id.toString(), employeeId: employee.employeeId, role: employee.role, name: employee.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  if (demoMode) {
    return { accessToken, refreshToken };
  }
  await RefreshToken.deleteMany({ employeeId: employee.employeeId });
  if (previousRefreshToken) {
    await RefreshToken.deleteOne({ token: previousRefreshToken });
  }
  await RefreshToken.create({ employeeId: employee.employeeId, token: refreshToken, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  await Employee.findByIdAndUpdate(employee._id, {
    lastKnownDevice: context.device,
    lastKnownBrowser: context.browser,
    lastKnownIpAddress: context.ipAddress,
    lastLoginAt: new Date()
  });
  return { accessToken, refreshToken };
};

export const employeeLogin = async (req, res) => {
  const { employeeId, password, location = {}, currentTime, timezone, vpnDetected = false } = req.body;
  const employee = demoMode ? demoEmployees.find((item) => item.employeeId === employeeId) : await Employee.findOne({ employeeId });
  if (!employee) {
    return res.status(401).json({ message: 'Invalid employee credentials' });
  }

  const valid = demoMode ? password === 'Bank@123' : await bcrypt.compare(password, employee.passwordHash);
  const { browser, os, device } = parseUserAgent(req.body.userAgent || req.headers['user-agent']);
  const ipAddress = req.body.ipAddress || req.ip || req.socket.remoteAddress || '';

  if (!valid) {
    employee.failedLoginCount += 1;
    if (!demoMode) {
      await employee.save();
    }
    await writeAuditLog({
      actorId: employee.employeeId,
      actorRole: employee.role,
      employeeName: employee.name,
      action: 'Employee Login Failed',
      module: 'Authentication',
      ipAddress,
      device,
      browser,
      os,
      location,
      metadata: { employeeId }
    });
    return res.status(401).json({ message: 'Invalid employee credentials' });
  }

  const securityAssessment = evaluateLoginSecurity({
    employee,
    device,
    browser,
    ipAddress,
    location,
    timestamp: currentTime,
    timezone,
    vpnDetected
  });

  const { sessionId, otp } = createOtpSession({
    employee: mapEmployee(employee),
    context: { device, browser, os, ipAddress, location, timezone },
    securityAssessment,
    currentTime: currentTime || new Date().toISOString()
  });

  const loginSessionId = createLoginSession({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    role: employee.role,
    device,
    browser,
    os,
    ipAddress,
    location,
    timezone,
    securityAssessment,
    otpSessionId: sessionId,
    state: securityAssessment.allowImmediately ? 'OTP_PENDING' : 'MANAGER_PENDING'
  });

  await writeAuditLog({
    actorId: employee.employeeId,
    actorRole: employee.role,
    employeeName: employee.name,
    action: 'Employee Login Initiated',
    module: 'Authentication',
    ipAddress,
    device,
    browser,
    os,
    location,
    metadata: { securityAssessment, loginSessionId }
  });

  return res.json({
    otpSessionId: sessionId,
    loginSessionId,
    otpDelivery: 'simulated',
    demoOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
    securityAssessment,
    employee: mapEmployee(employee)
  });
};

export const verifyOtp = async (req, res) => {
  const { otpSessionId, otp } = req.body;
  const verification = verifyOtpSession(otpSessionId, otp);
  if (!verification.ok) {
    return res.status(400).json({ message: verification.message });
  }

  const session = getLoginSession(verification.payload ? otpSessionId : '');
  const employee = demoMode ? demoEmployees.find((item) => item.employeeId === verification.payload.employee.employeeId) : await Employee.findOne({ employeeId: verification.payload.employee.employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const context = verification.payload.context;

  if (verification.payload.securityAssessment.allowImmediately) {
    const tokens = await issueTokens(employee, context);
    const risk = calculateEmployeeRisk({ loginReasons: verification.payload.securityAssessment.reasons });
    const riskRecord = demoMode ? {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
      suggestedAction: risk.suggestedAction
    } : await RiskScore.findOneAndUpdate(
      { employeeId: employee.employeeId },
      {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        score: risk.score,
        level: risk.level,
        reasons: risk.reasons,
        suggestedAction: risk.suggestedAction,
        recentSignals: verification.payload.securityAssessment.riskSignals,
        updatedAtSource: 'login'
      },
      { upsert: true, new: true }
    );

    await createNotification({
      targetRole: employee.role,
      employeeId: employee.employeeId,
      title: 'Login verified',
      message: 'Your login was verified with zero trust checks and OTP.',
      type: 'success',
      priority: 'normal'
    });

    await startRecordingSession({
      employeeId: employee.employeeId,
      employeeName: employee.name,
      notes: 'Auto-started after successful login'
    });

    await writeAuditLog({
      actorId: employee.employeeId,
      actorRole: employee.role,
      employeeName: employee.name,
      action: 'Employee Login Verified',
      module: 'Authentication',
      ipAddress: context.ipAddress,
      device: context.device,
      browser: context.browser,
      os: context.os,
      location: context.location,
      riskScore: riskRecord.score,
      metadata: { allowImmediately: true }
    });

    deleteLoginSession(otpSessionId);
    return res.json({
      authenticated: true,
      requiresManagerApproval: false,
      employee: mapEmployee(employee),
      ...tokens,
      risk: riskRecord
    });
  }

    const loginRequest = demoMode ? {
      _id: `demo-${Date.now()}`,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      reason: verification.payload.securityAssessment.reasons,
      location: context.location,
      ipAddress: context.ipAddress,
      device: context.device,
      browser: context.browser,
      os: context.os,
      timezone: context.timezone,
      officeMatch: verification.payload.securityAssessment.officeMatch,
      timeWindowMatch: verification.payload.securityAssessment.timeWindowMatch,
      deviceMatch: verification.payload.securityAssessment.deviceMatch,
      browserMatch: verification.payload.securityAssessment.browserMatch,
      riskScore: calculateEmployeeRisk({ loginReasons: verification.payload.securityAssessment.reasons }).score,
      status: 'Pending',
      loginSessionId: verification.payload ? session?.sessionId || otpSessionId : otpSessionId
    } : await LoginRequest.create({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    reason: verification.payload.securityAssessment.reasons,
    location: context.location,
    ipAddress: context.ipAddress,
    device: context.device,
    browser: context.browser,
    os: context.os,
    timezone: context.timezone,
    officeMatch: verification.payload.securityAssessment.officeMatch,
    timeWindowMatch: verification.payload.securityAssessment.timeWindowMatch,
    deviceMatch: verification.payload.securityAssessment.deviceMatch,
    browserMatch: verification.payload.securityAssessment.browserMatch,
    riskScore: calculateEmployeeRisk({ loginReasons: verification.payload.securityAssessment.reasons }).score,
    status: 'Pending',
    loginSessionId: verification.payload ? session?.sessionId || otpSessionId : otpSessionId
  });

  if (demoMode) {
    demoLoginRequests.unshift(loginRequest);
  }

  await createNotification({
    targetRole: 'Manager',
    employeeId: employee.employeeId,
    title: 'Unusual login detected',
    message: `${employee.name} requires manager approval to continue.`,
    type: 'warning',
    priority: 'high',
    metadata: { loginRequestId: loginRequest._id.toString() }
  });

  await writeAuditLog({
    actorId: employee.employeeId,
    actorRole: employee.role,
    employeeName: employee.name,
    action: 'Manager Approval Requested',
    module: 'Authentication',
    ipAddress: context.ipAddress,
    device: context.device,
    browser: context.browser,
    os: context.os,
    location: context.location,
    metadata: { loginRequestId: loginRequest._id.toString(), reasons: verification.payload.securityAssessment.reasons }
  });

  deleteLoginSession(otpSessionId);
  return res.json({
    authenticated: false,
    requiresManagerApproval: true,
    loginRequestId: loginRequest._id,
    reasons: verification.payload.securityAssessment.reasons,
    employee: mapEmployee(employee)
  });
};

export const finalizeLogin = async (req, res) => {
  const { loginRequestId } = req.params;
  const loginRequest = demoMode ? demoLoginRequests.find((item) => item._id === loginRequestId) : await LoginRequest.findById(loginRequestId);
  if (!loginRequest) {
    return res.status(404).json({ message: 'Login request not found' });
  }

  if (loginRequest.status !== 'Approved') {
    return res.status(409).json({ message: 'Manager approval pending' });
  }

  const employee = demoMode ? demoEmployees.find((item) => item.employeeId === loginRequest.employeeId) : await Employee.findOne({ employeeId: loginRequest.employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const tokens = await issueTokens(employee, {
    device: loginRequest.device,
    browser: loginRequest.browser,
    os: loginRequest.os,
    ipAddress: loginRequest.ipAddress,
    location: loginRequest.location
  });

  const risk = calculateEmployeeRisk({ loginReasons: loginRequest.reason });
  const riskRecord = demoMode ? {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    score: risk.score,
    level: risk.level,
    reasons: risk.reasons,
    suggestedAction: risk.suggestedAction,
    updatedAtSource: 'manager-approved-login'
  } : await RiskScore.findOneAndUpdate(
    { employeeId: employee.employeeId },
    {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
      suggestedAction: risk.suggestedAction,
      updatedAtSource: 'manager-approved-login'
    },
    { upsert: true, new: true }
  );

  await startRecordingSession({ employeeId: employee.employeeId, employeeName: employee.name, notes: 'Auto-started after manager approval' });
  await writeAuditLog({
    actorId: employee.employeeId,
    actorRole: employee.role,
    employeeName: employee.name,
    action: 'Manager Approved Login Finalized',
    module: 'Authentication',
    ipAddress: loginRequest.ipAddress,
    device: loginRequest.device,
    browser: loginRequest.browser,
    os: loginRequest.os,
    location: loginRequest.location,
    riskScore: riskRecord.score,
    metadata: { loginRequestId }
  });

  return res.json({
    authenticated: true,
    requiresManagerApproval: false,
    employee: mapEmployee(employee),
    ...tokens,
    risk: riskRecord
  });
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) {
    return res.status(401).json({ message: 'Refresh token not recognized' });
  }

  const employee = await Employee.findOne({ employeeId: stored.employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const tokens = await issueTokens(employee, {
    device: employee.lastKnownDevice,
    browser: employee.lastKnownBrowser,
    ipAddress: employee.lastKnownIpAddress,
    location: employee.officeLocation
  }, refreshToken);

  return res.json(tokens);
};

export const logout = async (req, res) => {
  const { refreshToken, recordingId } = req.body;
  if (refreshToken) {
    await RefreshToken.deleteOne({ token: refreshToken });
  }
  if (recordingId) {
    const { stopRecordingSession } = await import('../services/recordingService.js');
    await stopRecordingSession(recordingId);
  }
  return res.json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  const employee = await Employee.findOne({ employeeId: req.user.employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  return res.json({ employee: mapEmployee(employee) });
};
