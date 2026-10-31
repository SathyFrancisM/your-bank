import bcrypt from 'bcrypt';
import { Employee } from '../models/Employee.js';
import { Manager } from '../models/Manager.js';
import { Customer } from '../models/Customer.js';
import { Account } from '../models/Account.js';
import { Transaction } from '../models/Transaction.js';
import { Loan } from '../models/Loan.js';
import { Fd } from '../models/Fd.js';
import { Rd } from '../models/Rd.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { RiskScore } from '../models/RiskScore.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { ScreenRecording } from '../models/ScreenRecording.js';
import { store } from '../services/store.js';

export const seedDataDirectly = async () => {
  try {
    const employees = store.getCollection('employees');
    const managers = store.getCollection('managers');
    const customers = store.getCollection('customers');
    const accounts = store.getCollection('accounts');
    const transactions = store.getCollection('transactions');
    const loans = store.getCollection('loans');
    const fds = store.getCollection('fds');
    const rds = store.getCollection('rds');
    const auditLogs = store.getCollection('auditlogs');
    const notifications = store.getCollection('notifications');
    const riskScores = store.getCollection('riskscores');
    const loginRequests = store.getCollection('loginrequests');
    const recordings = store.getCollection('screenrecordings');

    await Promise.all([
      Employee.deleteMany({}),
      Manager.deleteMany({}),
      Customer.deleteMany({}),
      Account.deleteMany({}),
      Transaction.deleteMany({}),
      Loan.deleteMany({}),
      Fd.deleteMany({}),
      Rd.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
      RiskScore.deleteMany({}),
      LoginRequest.deleteMany({}),
      ScreenRecording.deleteMany({})
    ]);

    await Employee.insertMany(employees.map(e => ({ ...e, _id: undefined })));
    await Manager.insertMany(managers.map(m => ({ ...m, _id: undefined })));
    await Customer.insertMany(customers.map(c => ({ ...c, _id: undefined })));
    await Account.insertMany(accounts.map(a => ({ ...a, _id: undefined })));
    await Transaction.insertMany(transactions.map(t => ({ ...t, _id: undefined })));
    await Loan.insertMany(loans.map(l => ({ ...l, _id: undefined })));
    await Fd.insertMany(fds.map(f => ({ ...f, _id: undefined })));
    await Rd.insertMany(rds.map(r => ({ ...r, _id: undefined })));
    await AuditLog.insertMany(auditLogs.map(a => ({ ...a, _id: undefined })));
    await Notification.insertMany(notifications.map(n => ({ ...n, _id: undefined })));
    await RiskScore.insertMany(riskScores.map(r => ({ ...r, _id: undefined })));
    await LoginRequest.insertMany(loginRequests.map(l => ({ ...l, _id: undefined })));
    await ScreenRecording.insertMany(recordings.map(s => ({ ...s, _id: undefined })));

    console.log('[DB] Auto-seed completed successfully with all original accounts.');
  } catch (error) {
    console.error('[DB] Auto-seed failed:', error.message);
  }
};
