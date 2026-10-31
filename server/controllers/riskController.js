import { RiskScore } from '../models/RiskScore.js';
import { Transaction } from '../models/Transaction.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { calculateEmployeeRisk } from '../services/riskEngine.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

export const listRiskScores = async (_req, res) => {
  if (demoMode) {
    const data = store.find('riskscores', {}, { limit: 100 });
    return res.json({ data });
  }
  try {
    const data = await RiskScore.find({}).sort({ score: -1 }).limit(100);
    return res.json({ data });
  } catch {
    const data = store.find('riskscores', {}, { limit: 100 });
    return res.json({ data });
  }
};

export const employeeRiskSummary = async (req, res) => {
  const employeeId = req.params.employeeId;
  let riskRecord, loginRequests, transactions;

  if (demoMode) {
    riskRecord = store.findOne('riskscores', { employeeId });
    loginRequests = store.find('loginrequests', { employeeId }, { limit: 20 });
    transactions = store.find('transactions', { createdBy: employeeId }, { limit: 50 });
  } else {
    try {
      [riskRecord, loginRequests, transactions] = await Promise.all([
        RiskScore.findOne({ employeeId }),
        LoginRequest.find({ employeeId }).sort({ createdAt: -1 }).limit(20),
        Transaction.find({ createdBy: employeeId }).sort({ createdAt: -1 }).limit(50)
      ]);
    } catch {
      riskRecord = store.findOne('riskscores', { employeeId });
      loginRequests = store.find('loginrequests', { employeeId }, { limit: 20 });
      transactions = store.find('transactions', { createdBy: employeeId }, { limit: 50 });
    }
  }

  const txns = transactions || [];
  const reqs = loginRequests || [];
  const recentTransactions = txns.slice(0, 10).length;
  const repeatedCustomerAccess = new Set(txns.map((txn) => txn.customerId)).size < txns.length ? 1 : 0;
  const largeTransaction = Math.max(0, ...txns.map((txn) => txn.amount || 0));
  const computed = calculateEmployeeRisk({
    loginReasons: reqs[0]?.reason || [],
    recentTransactionCount: recentTransactions,
    repeatedCustomerAccess,
    highValueTransaction: largeTransaction
  });

  return res.json({ data: { riskRecord, loginRequests: reqs, transactions: txns, computed } });
};
