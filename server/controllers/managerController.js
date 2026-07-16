import { LoginRequest } from '../models/LoginRequest.js';
import { ScreenRecording } from '../models/ScreenRecording.js';
import { RiskScore } from '../models/RiskScore.js';
import { Employee } from '../models/Employee.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { demoMode } from '../config/db.js';
import { demoLoginRequests, demoDashboard } from '../services/demoStore.js';

export const pendingLoginRequests = async (_req, res) => {
  if (demoMode) {
    return res.json({ data: demoLoginRequests.filter((request) => request.status === 'Pending') });
  }
  const requests = await LoginRequest.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(100);
  res.json({ data: requests });
};

export const approveLoginRequest = async (req, res) => {
  const { id } = req.params;
  if (demoMode) {
    const request = demoLoginRequests.find((item) => item._id === id);
    if (!request) {
      return res.status(404).json({ message: 'Login request not found' });
    }
    request.status = 'Approved';
    request.managerDecision = 'Approved';
    request.approvedBy = req.user.employeeId;
    request.approvedAt = new Date().toISOString();
    return res.json({ data: request });
  }
  const request = await LoginRequest.findById(id);
  if (!request) {
    return res.status(404).json({ message: 'Login request not found' });
  }

  request.status = 'Approved';
  request.managerDecision = 'Approved';
  request.approvedBy = req.user.employeeId;
  request.approvedAt = new Date();
  await request.save();

  await createNotification({
    targetRole: 'Teller',
    employeeId: request.employeeId,
    title: 'Login approved',
    message: 'Your manager approved the login request.',
    type: 'success',
    priority: 'high',
    metadata: { loginRequestId: request._id.toString() }
  });

  await writeAuditLog({
    actorId: req.user.employeeId,
    actorRole: req.user.role,
    employeeName: req.user.name,
    action: 'Manager Approved Login',
    module: 'Manager Panel',
    entityType: 'LoginRequest',
    entityId: request._id.toString(),
    metadata: { employeeId: request.employeeId }
  });

  return res.json({ data: request });
};

export const rejectLoginRequest = async (req, res) => {
  const { id } = req.params;
  if (demoMode) {
    const request = demoLoginRequests.find((item) => item._id === id);
    if (!request) {
      return res.status(404).json({ message: 'Login request not found' });
    }
    request.status = 'Rejected';
    request.managerDecision = 'Rejected';
    request.rejectedBy = req.user.employeeId;
    request.rejectedAt = new Date().toISOString();
    return res.json({ data: request });
  }
  const request = await LoginRequest.findById(id);
  if (!request) {
    return res.status(404).json({ message: 'Login request not found' });
  }

  request.status = 'Rejected';
  request.managerDecision = 'Rejected';
  request.rejectedBy = req.user.employeeId;
  request.rejectedAt = new Date();
  await request.save();

  await createNotification({
    targetRole: 'Teller',
    employeeId: request.employeeId,
    title: 'Login rejected',
    message: 'Your manager rejected the unusual login request.',
    type: 'error',
    priority: 'high',
    metadata: { loginRequestId: request._id.toString() }
  });

  await writeAuditLog({
    actorId: req.user.employeeId,
    actorRole: req.user.role,
    employeeName: req.user.name,
    action: 'Manager Rejected Login',
    module: 'Manager Panel',
    entityType: 'LoginRequest',
    entityId: request._id.toString(),
    metadata: { employeeId: request.employeeId }
  });

  return res.json({ data: request });
};

export const managerDashboard = async (_req, res) => {
  const [requests, recordings, risks, employees] = await Promise.all([
    LoginRequest.find({}).sort({ createdAt: -1 }).limit(20),
    ScreenRecording.find({}).sort({ createdAt: -1 }).limit(20),
    RiskScore.find({}).sort({ updatedAt: -1 }).limit(20),
    Employee.find({}).sort({ createdAt: -1 }).limit(20)
  ]);

  res.json({ data: { requests, recordings, risks, employees } });
};
