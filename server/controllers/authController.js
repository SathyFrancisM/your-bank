import bcrypt from 'bcrypt';
import { Employee } from '../models/Employee.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { RiskScore } from '../models/RiskScore.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { createOtpSession, deleteOtpSession, verifyOtpSession } from '../services/otpService.js';
import { createLoginSession, getLoginSession, updateLoginSession, deleteLoginSession } from '../services/authSessionService.js';
import { sendOtpEmail, sendWelcomeEmail } from '../services/emailService.js';
import { evaluateLoginSecurity } from '../services/loginSecurity.js';
import { calculateEmployeeRisk } from '../services/riskEngine.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { startRecordingSession } from '../services/recordingService.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { store } from '../services/store.js';
import * as db from '../config/db.js';
import { env } from '../config/env.js';
import { clearEmployeeBlock, isEmployeeBlocked } from '../services/securityEngine.js';

// Always read demoMode dynamically to avoid stale module-load value
const isDemoMode = () => db.demoMode;

const mapEmployee = (employee) => ({
  id: employee._id?.toString() || employee.id || employee.employeeId,
  employeeId: employee.employeeId,
  name: employee.name,
  role: employee.role,
  email: employee.email,
  phone: employee.phone,
  department: employee.department,
  branch: employee.branch,
  permissions: employee.permissions || [],
  officeLocation: employee.officeLocation,
  status: employee.status || 'Active'
});

const parseUserAgent = (userAgent = '') => {
  const agent = String(userAgent);
  const browser = /Edg\//.test(agent) ? 'Microsoft Edge' : /Chrome\//.test(agent) ? 'Google Chrome' : /Firefox\//.test(agent) ? 'Mozilla Firefox' : /Safari\//.test(agent) ? 'Safari' : 'Unknown Browser';
  const os = /Windows NT/.test(agent) ? 'Windows' : /Mac OS X/.test(agent) ? 'macOS' : /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : 'Unknown OS';
  const device = /Mobile|Android|iPhone|iPad/.test(agent) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
};

const issueTokens = async (employee, context = {}, previousRefreshToken = null) => {
  const empId = employee.employeeId;
  const payload = {
    sub: (employee._id || employee.id || empId).toString(),
    employeeId: empId,
    role: employee.role,
    name: employee.name
  };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (isDemoMode()) {
    store.saveRefreshToken(empId, refreshToken, expiresAt);
    store.updateEmployee(empId, {
      lastKnownDevice: context.device,
      lastKnownBrowser: context.browser,
      lastKnownIpAddress: context.ipAddress,
      lastLoginAt: new Date().toISOString()
    });
    return { accessToken, refreshToken };
  }

  try {
    await RefreshToken.deleteMany({ employeeId: empId });
    if (previousRefreshToken) {
      await RefreshToken.deleteOne({ token: previousRefreshToken });
    }
    await RefreshToken.create({
      employeeId: empId,
      token: refreshToken,
      expiresAt
    });
    await Employee.findOneAndUpdate(
      { employeeId: empId },
      {
        lastKnownDevice: context.device,
        lastKnownBrowser: context.browser,
        lastKnownIpAddress: context.ipAddress,
        lastLoginAt: new Date()
      }
    );
  } catch (err) {
    console.warn('[AUTH] issueTokens db error (falling back to store):', err.message);
    store.saveRefreshToken(empId, refreshToken, expiresAt);
  }

  return { accessToken, refreshToken };
};

// ─── Generate a unique employeeId for a given role prefix ─────────────────────
const generateEmployeeId = async (role) => {
  const prefix = role === 'Admin' ? 'ADM' : role === 'Manager' ? 'MGR' : role === 'Teller' ? 'TEL' : role === 'Auditor' ? 'AUD' : 'EMP';
  const existing = isDemoMode()
    ? store.find('employees', {}).filter((e) => e.employeeId.startsWith(prefix))
    : await Employee.find({ employeeId: new RegExp(`^${prefix}`) }).lean().catch(() => store.find('employees', {}).filter((e) => e.employeeId.startsWith(prefix)));
  const nums = existing.map((e) => parseInt(e.employeeId.slice(3), 10)).filter(Number.isFinite);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
};

export const registerEmployee = async (req, res) => {
  const { name, email, phone, password, role = 'Teller', department, branch, officeLatitude, officeLongitude } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  const validRoles = ['Admin', 'Manager', 'Teller', 'Auditor'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: `Role must be one of: ${validRoles.join(', ')}` });
  }

  // Check email uniqueness
  const emailLower = email.trim().toLowerCase();
  const existingByEmail = isDemoMode()
    ? store.findOne('employees', { email: emailLower })
    : await Employee.findOne({ email: emailLower }).lean().catch(() => store.findOne('employees', { email: emailLower }));

  if (existingByEmail) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const employeeId = await generateEmployeeId(role);

  const defaultPermissions = {
    Admin: ['all'],
    Manager: ['approve-login', 'view-risk', 'view-recordings'],
    Teller: ['operate-customers'],
    Auditor: ['audit-read']
  };

  const newEmployee = {
    employeeId,
    name: name.trim(),
    email: emailLower,
    phone: phone ? phone.trim() : '',
    passwordHash,
    role,
    department: department ? department.trim() : (role === 'Auditor' ? 'Audit' : role === 'Manager' ? 'Operations' : 'Branch Ops'),
    branch: branch ? branch.trim() : 'Head Office',
    status: 'Active',
    permissions: defaultPermissions[role] || ['operate-customers'],
    officeLocation: {
      latitude: officeLatitude ? Number(officeLatitude) : 28.6139,
      longitude: officeLongitude ? Number(officeLongitude) : 77.209,
      address: branch ? branch.trim() : 'Head Office'
    },
    lastKnownDevice: null,
    lastKnownBrowser: null,
    lastKnownIpAddress: null,
    failedLoginCount: 0,
    screenRecordingEnabled: true,
    createdAt: new Date().toISOString()
  };

  let saved;
  if (isDemoMode()) {
    saved = store.create('employees', newEmployee);
  } else {
    try {
      saved = await Employee.create(newEmployee);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ message: 'Employee ID conflict. Please try again.' });
      }
      // DB failed — fall back to in-memory
      saved = store.create('employees', newEmployee);
    }
  }

  await writeAuditLog({
    actorId: saved.employeeId,
    actorRole: saved.role,
    employeeName: saved.name,
    action: 'Employee Registered',
    module: 'Authentication',
    ipAddress: req.ip || '127.0.0.1',
    metadata: { employeeId: saved.employeeId, role: saved.role }
  });

  // Send welcome email with Employee ID (non-blocking)
  sendWelcomeEmail(saved.email, saved.name, saved.employeeId, saved.role).catch(() => {});

  return res.status(201).json({
    message: 'Account created successfully',
    employeeId: saved.employeeId,
    name: saved.name,
    email: saved.email,
    role: saved.role
  });
};

export const employeeLogin = async (req, res) => {
  const { employeeId, password, location = {}, currentTime, timezone, vpnDetected = false } = req.body;
  if (!employeeId || !password) {
    return res.status(400).json({ message: 'Employee ID and password are required' });
  }

  const cleanEmployeeId = String(employeeId).trim().toUpperCase();

  // Find original employee account
  let employee = null;
  if (isDemoMode()) {
    employee = store.findOne('employees', { employeeId: cleanEmployeeId });
  } else {
    try {
      employee = await Employee.findOne({ employeeId: cleanEmployeeId });
    } catch {
      employee = store.findOne('employees', { employeeId: cleanEmployeeId });
    }
  }

  if (!employee) {
    return res.status(401).json({ message: 'Invalid employee credentials' });
  }

  // Real bcrypt verification against the employee's genuine password hash
  let valid = false;
  if (employee.passwordHash) {
    try {
      valid = await bcrypt.compare(password, employee.passwordHash);
    } catch (err) {
      valid = false;
    }
  }

  const { browser, os, device } = parseUserAgent(req.body.userAgent || req.headers['user-agent']);
  const ipAddress = req.body.ipAddress || req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!valid) {
    employee.failedLoginCount = (employee.failedLoginCount || 0) + 1;
    if (isDemoMode()) {
      store.updateEmployee(employee.employeeId, { failedLoginCount: employee.failedLoginCount });
    } else {
      try {
        if (typeof employee.save === 'function') await employee.save();
      } catch {
        store.updateEmployee(employee.employeeId, { failedLoginCount: employee.failedLoginCount });
      }
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
      metadata: { employeeId: cleanEmployeeId, failedLoginCount: employee.failedLoginCount }
    });
    return res.status(401).json({ message: 'Invalid employee credentials' });
  }

  // Reset failed login count on successful password check
  employee.failedLoginCount = 0;
  if (isDemoMode()) {
    store.updateEmployee(employee.employeeId, { failedLoginCount: 0 });
  } else {
    try {
      if (typeof employee.save === 'function') await employee.save();
    } catch {
      store.updateEmployee(employee.employeeId, { failedLoginCount: 0 });
    }
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
    state: securityAssessment.allowImmediately ? 'OTP_PENDING' : 'MANAGER_PENDING'
  });

  const { sessionId, otp } = await createOtpSession({
    employee: mapEmployee(employee),
    context: { device, browser, os, ipAddress, location, timezone },
    securityAssessment,
    currentTime: currentTime || new Date().toISOString(),
    loginSessionId
  });

  let otpDelivery = 'simulated';
  let demoOtp = undefined;

  const hasSmtp = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
  if (hasSmtp) {
    try {
      await sendOtpEmail(employee.email, otp, employee.name);
      otpDelivery = 'email';
    } catch (error) {
      console.warn(`[AUTH] Failed to send OTP email to ${employee.email}:`, error.message);
      otpDelivery = 'simulated';
      demoOtp = otp;
    }
  } else {
    otpDelivery = 'simulated';
    demoOtp = otp;
    console.log(`[AUTH] Verification OTP for ${employee.employeeId} (${employee.name} - ${employee.role}): ${otp}`);
  }

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
    otpDelivery,
    demoOtp,
    securityAssessment,
    employee: mapEmployee(employee)
  });
};

export const verifyOtp = async (req, res) => {
  const { otpSessionId, otp } = req.body;
  const verification = await verifyOtpSession(otpSessionId, otp);
  if (!verification.ok) {
    return res.status(400).json({ message: verification.message });
  }

  const loginSessionId = verification.payload.loginSessionId;
  const session = getLoginSession(loginSessionId);
  const empId = verification.payload.employee.employeeId;

  let employee = null;
  if (isDemoMode()) {
    employee = store.findOne('employees', { employeeId: empId });
  } else {
    try {
      employee = await Employee.findOne({ employeeId: empId });
    } catch {
      employee = store.findOne('employees', { employeeId: empId });
    }
  }

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const context = verification.payload.context || {};

  if (verification.payload.securityAssessment.allowImmediately) {
    const tokens = await issueTokens(employee, context);
    const risk = calculateEmployeeRisk({ loginReasons: verification.payload.securityAssessment.reasons || [] });

    let riskRecord = null;
    if (isDemoMode()) {
      riskRecord = store.findByIdAndUpdate('riskscores', employee.employeeId, {
        employeeId: employee.employeeId,
        employeeName: employee.name,
        score: risk.score,
        level: risk.level,
        reasons: risk.reasons,
        suggestedAction: risk.suggestedAction,
        updatedAt: new Date().toISOString()
      }, { upsert: true });
    } else {
      try {
        riskRecord = await RiskScore.findOneAndUpdate(
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
      } catch {
        riskRecord = { score: risk.score, level: risk.level, reasons: risk.reasons, suggestedAction: risk.suggestedAction };
      }
    }

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
      riskScore: riskRecord?.score || risk.score,
      metadata: { allowImmediately: true }
    });

    deleteLoginSession(loginSessionId);

    return res.json({
      authenticated: true,
      requiresManagerApproval: false,
      employee: mapEmployee(employee),
      ...tokens,
      risk: riskRecord || risk
    });
  }

  // Escalated unusual login request
  const requestDoc = {
    employeeId: employee.employeeId,
    employeeName: employee.name,
    reason: verification.payload.securityAssessment.reasons || [],
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
    riskScore: calculateEmployeeRisk({ loginReasons: verification.payload.securityAssessment.reasons || [] }).score,
    status: 'Pending',
    loginSessionId: session?.sessionId || loginSessionId,
    createdAt: new Date().toISOString()
  };

  let loginRequest = null;
  if (isDemoMode()) {
    loginRequest = store.create('loginrequests', requestDoc);
    // Smooth auto-approval simulation in demo/development mode after 1.5 seconds
    setTimeout(() => {
      loginRequest.status = 'Approved';
      loginRequest.managerDecision = 'Approved';
      loginRequest.approvedBy = 'SYS-MANAGER';
      loginRequest.approvedAt = new Date().toISOString();
    }, 1500);
  } else {
    try {
      loginRequest = await LoginRequest.create(requestDoc);
    } catch {
      loginRequest = store.create('loginrequests', requestDoc);
    }
  }

  await createNotification({
    targetRole: 'Manager',
    employeeId: employee.employeeId,
    title: 'Unusual login detected',
    message: `${employee.name} requires manager approval to continue.`,
    type: 'warning',
    priority: 'high',
    metadata: { loginRequestId: (loginRequest._id || loginRequest.id).toString() }
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
    metadata: {
      loginRequestId: (loginRequest._id || loginRequest.id).toString(),
      reasons: verification.payload.securityAssessment.reasons
    }
  });

  deleteLoginSession(loginSessionId);

  return res.json({
    authenticated: false,
    requiresManagerApproval: true,
    loginRequestId: loginRequest._id || loginRequest.id,
    reasons: verification.payload.securityAssessment.reasons,
    employee: mapEmployee(employee)
  });
};

export const finalizeLogin = async (req, res) => {
  const { loginRequestId } = req.params;

  let loginRequest = null;
  if (isDemoMode()) {
    loginRequest = store.findById('loginrequests', loginRequestId) || store.findOne('loginrequests', { _id: loginRequestId });
  } else {
    try {
      loginRequest = await LoginRequest.findById(loginRequestId);
    } catch {
      loginRequest = store.findById('loginrequests', loginRequestId);
    }
  }

  if (!loginRequest) {
    return res.status(404).json({ message: 'Login request not found' });
  }

  if (loginRequest.status !== 'Approved') {
    return res.status(409).json({ message: 'Manager approval pending' });
  }

  let employee = null;
  if (isDemoMode()) {
    employee = store.findOne('employees', { employeeId: loginRequest.employeeId });
  } else {
    try {
      employee = await Employee.findOne({ employeeId: loginRequest.employeeId });
    } catch {
      employee = store.findOne('employees', { employeeId: loginRequest.employeeId });
    }
  }

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

  const risk = calculateEmployeeRisk({ loginReasons: loginRequest.reason || [] });
  let riskRecord = null;

  if (isDemoMode()) {
    riskRecord = store.findByIdAndUpdate('riskscores', employee.employeeId, {
      employeeId: employee.employeeId,
      employeeName: employee.name,
      score: risk.score,
      level: risk.level,
      reasons: risk.reasons,
      suggestedAction: risk.suggestedAction,
      updatedAtSource: 'manager-approved-login',
      updatedAt: new Date().toISOString()
    }, { upsert: true });
  } else {
    try {
      riskRecord = await RiskScore.findOneAndUpdate(
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
    } catch {
      riskRecord = { score: risk.score, level: risk.level, reasons: risk.reasons, suggestedAction: risk.suggestedAction };
    }
  }

  await startRecordingSession({
    employeeId: employee.employeeId,
    employeeName: employee.name,
    notes: 'Auto-started after manager approval'
  });

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
    riskScore: riskRecord?.score || risk.score,
    metadata: { loginRequestId }
  });

  return res.json({
    authenticated: true,
    requiresManagerApproval: false,
    employee: mapEmployee(employee),
    ...tokens,
    risk: riskRecord || risk
  });
};

export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }

  let employee = null;
  if (isDemoMode()) {
    const stored = store.hasRefreshToken(token);
    if (!stored) {
      return res.status(401).json({ message: 'Refresh token not recognized' });
    }
    employee = store.findOne('employees', { employeeId: payload.employeeId });
  } else {
    try {
      const stored = await RefreshToken.findOne({ token });
      if (!stored) {
        return res.status(401).json({ message: 'Refresh token not recognized' });
      }
      employee = await Employee.findOne({ employeeId: stored.employeeId });
    } catch {
      employee = store.findOne('employees', { employeeId: payload.employeeId });
    }
  }

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  if (isEmployeeBlocked(employee.employeeId)) {
    return res.status(403).json({ message: 'Session terminated due to security policy violation' });
  }

  const tokens = await issueTokens(employee, {
    device: employee.lastKnownDevice,
    browser: employee.lastKnownBrowser,
    ipAddress: employee.lastKnownIpAddress,
    location: employee.officeLocation
  }, token);

  return res.json(tokens);
};

export const logout = async (req, res) => {
  const { refreshToken: token, recordingId } = req.body;
  if (token) {
    if (isDemoMode()) {
      store.deleteRefreshToken(token);
    } else {
      try {
        await RefreshToken.deleteOne({ token });
      } catch {
        store.deleteRefreshToken(token);
      }
    }
  }

  if (req.user?.employeeId) {
    clearEmployeeBlock(req.user.employeeId);
    await writeAuditLog({
      actorId: req.user.employeeId,
      actorRole: req.user.role,
      employeeName: req.user.name,
      action: req.body?.reason ? 'Security Policy Logout' : 'Employee Logout',
      module: 'Authentication',
      riskScore: Number(req.body?.securityScore || 0),
      metadata: { reason: req.body?.reason || 'Manual logout', securityAction: req.body?.securityAction || '' }
    });
  }

  if (recordingId) {
    const { stopRecordingSession } = await import('../services/recordingService.js');
    await stopRecordingSession(recordingId);
  }

  return res.json({ message: 'Logged out successfully' });
};

export const me = async (req, res) => {
  let employee = null;
  if (isDemoMode()) {
    employee = store.findOne('employees', { employeeId: req.user.employeeId });
  } else {
    try {
      employee = await Employee.findOne({ employeeId: req.user.employeeId });
    } catch {
      employee = store.findOne('employees', { employeeId: req.user.employeeId });
    }
  }

  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  return res.json({ employee: mapEmployee(employee) });
};
