import { Transaction } from '../models/Transaction.js';
import { AuditLog } from '../models/AuditLog.js';
import { Employee } from '../models/Employee.js';
import { RiskScore } from '../models/RiskScore.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

const bucketByDay = (records) => {
  const buckets = {};
  records.forEach((record) => {
    const key = new Date(record.createdAt || Date.now()).toISOString().slice(0, 10);
    buckets[key] = (buckets[key] || 0) + 1;
  });
  return buckets;
};

export const managerReports = async (_req, res) => {
  let transactions, logs, employees, risks;

  if (demoMode) {
    transactions = store.find('transactions', {}, { limit: 500 });
    logs = store.find('auditlogs', {}, { limit: 500 });
    employees = store.find('employees', {}, { limit: 100 });
    risks = store.find('riskscores', {}, { limit: 100 });
  } else {
    try {
      [transactions, logs, employees, risks] = await Promise.all([
        Transaction.find({}).sort({ createdAt: -1 }).limit(500),
        AuditLog.find({}).sort({ createdAt: -1 }).limit(500),
        Employee.find({}).limit(100),
        RiskScore.find({}).sort({ score: -1 }).limit(100)
      ]);
    } catch {
      transactions = store.find('transactions', {}, { limit: 500 });
      logs = store.find('auditlogs', {}, { limit: 500 });
      employees = store.find('employees', {}, { limit: 100 });
      risks = store.find('riskscores', {}, { limit: 100 });
    }
  }

  const report = {
    daily: bucketByDay(transactions.slice(0, 100)),
    weekly: bucketByDay(logs.slice(0, 100)),
    monthly: bucketByDay(transactions.slice(0, 300)),
    cashFlow: transactions.reduce((acc, txn) => acc + (txn.type === 'Deposit' ? txn.amount : -txn.amount), 0),
    suspiciousActivities: logs.filter((log) => String(log.action || '').includes('Failed') || log.riskScore > 60).length,
    employeePerformance: employees.map((employee) => ({ employeeId: employee.employeeId, name: employee.name, role: employee.role })),
    riskAnalysis: risks.slice(0, 20)
  };

  return res.json({ data: report });
};
