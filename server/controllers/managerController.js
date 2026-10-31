import { LoginRequest } from '../models/LoginRequest.js';
import { ScreenRecording } from '../models/ScreenRecording.js';
import { RiskScore } from '../models/RiskScore.js';
import { Employee } from '../models/Employee.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { demoMode } from '../config/db.js';
import { store, demoDashboard } from '../services/store.js';

export const pendingLoginRequests = async (_req, res) => {
  if (demoMode) {
    const data = store.find('loginrequests', { status: 'Pending' });
    return res.json({ data });
  }
  try {
    const requests = await LoginRequest.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(100);
    return res.json({ data: requests });
  } catch {
    const data = store.find('loginrequests', { status: 'Pending' });
    return res.json({ data });
  }
};

export const approveLoginRequest = async (req, res) => {
  const { id } = req.params;
  if (demoMode) {
    const request = store.findById('loginrequests', id) || store.findOne('loginrequests', { _id: id });
    if (!request) {
      return res.status(404).json({ message: 'Login request not found' });
    }
    request.status = 'Approved';
    request.managerDecision = 'Approved';
    request.approvedBy = req.user.employeeId;
    request.approvedAt = new Date().toISOString();
    return res.json({ data: request });
  }

  try {
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
  } catch (err) {
    const request = store.findById('loginrequests', id);
    if (request) {
      request.status = 'Approved';
      request.managerDecision = 'Approved';
      request.approvedBy = req.user.employeeId;
      request.approvedAt = new Date().toISOString();
      return res.json({ data: request });
    }
    return res.status(500).json({ message: 'Failed to approve: ' + err.message });
  }
};

export const rejectLoginRequest = async (req, res) => {
  const { id } = req.params;
  if (demoMode) {
    const request = store.findById('loginrequests', id) || store.findOne('loginrequests', { _id: id });
    if (!request) {
      return res.status(404).json({ message: 'Login request not found' });
    }
    request.status = 'Rejected';
    request.managerDecision = 'Rejected';
    request.rejectedBy = req.user.employeeId;
    request.rejectedAt = new Date().toISOString();
    return res.json({ data: request });
  }

  try {
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
  } catch (err) {
    const request = store.findById('loginrequests', id);
    if (request) {
      request.status = 'Rejected';
      request.managerDecision = 'Rejected';
      return res.json({ data: request });
    }
    return res.status(500).json({ message: 'Failed to reject: ' + err.message });
  }
};

export const managerDashboard = async (_req, res) => {
  if (demoMode) {
    return res.json({ data: demoDashboard.manager });
  }

  try {
    const [requests, recordings, risks, employees] = await Promise.all([
      LoginRequest.find({}).sort({ createdAt: -1 }).limit(20),
      ScreenRecording.find({}).sort({ createdAt: -1 }).limit(20),
      RiskScore.find({}).sort({ updatedAt: -1 }).limit(20),
      Employee.find({}).sort({ createdAt: -1 }).limit(20)
    ]);
    return res.json({ data: { requests, recordings, risks, employees } });
  } catch {
    return res.json({ data: demoDashboard.manager });
  }
};
