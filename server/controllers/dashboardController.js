import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Customer } from '../models/Customer.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { RiskScore } from '../models/RiskScore.js';
import { ScreenRecording } from '../models/ScreenRecording.js';
import { demoDashboard } from '../services/demoStore.js';
import { demoMode } from '../config/db.js';

export const employeeDashboard = async (req, res) => {
  if (demoMode) {
    return res.json({ data: demoDashboard.employee });
  }
  const [customers, accounts, transactions, notifications, logs] = await Promise.all([
    Customer.countDocuments(),
    Account.countDocuments(),
    Transaction.find({ createdBy: req.user.employeeId }).sort({ createdAt: -1 }).limit(20),
    Notification.find({ $or: [{ targetRole: req.user.role }, { employeeId: req.user.employeeId }] }).sort({ createdAt: -1 }).limit(10),
    AuditLog.find({ actorId: req.user.employeeId }).sort({ createdAt: -1 }).limit(10)
  ]);

  res.json({ data: { customers, accounts, transactions, notifications, logs } });
};

export const managerDashboard = async (_req, res) => {
  if (demoMode) {
    return res.json({ data: demoDashboard.manager });
  }
  const [requests, recordings, risks, employees] = await Promise.all([
    LoginRequest.find({}).sort({ createdAt: -1 }).limit(20),
    ScreenRecording.find({}).sort({ createdAt: -1 }).limit(20),
    RiskScore.find({}).sort({ updatedAt: -1 }).limit(20),
    AuditLog.find({}).sort({ createdAt: -1 }).limit(20)
  ]);

  res.json({ data: { requests, recordings, risks, employees } });
};

export const adminDashboard = async (_req, res) => {
  if (demoMode) {
    return res.json({ data: demoDashboard.admin });
  }
  const [employees, managers, logs, risks] = await Promise.all([
    AuditLog.countDocuments({ module: 'Authentication' }),
    LoginRequest.countDocuments(),
    AuditLog.countDocuments(),
    RiskScore.countDocuments()
  ]);
  res.json({ data: { employees, managers, logs, risks } });
};

export const auditorDashboard = async (_req, res) => {
  if (demoMode) {
    return res.json({ data: demoDashboard.auditor });
  }
  const [logs, risks, recordings] = await Promise.all([
    AuditLog.find({}).sort({ createdAt: -1 }).limit(30),
    RiskScore.find({}).sort({ score: -1 }).limit(30),
    ScreenRecording.find({}).sort({ createdAt: -1 }).limit(30)
  ]);
  res.json({ data: { logs, risks, recordings } });
};
