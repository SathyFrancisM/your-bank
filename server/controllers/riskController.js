import { RiskScore } from '../models/RiskScore.js';
import { Transaction } from '../models/Transaction.js';
import { LoginRequest } from '../models/LoginRequest.js';
import { calculateEmployeeRisk } from '../services/riskEngine.js';

export const listRiskScores = async (_req, res) => {
  const data = await RiskScore.find({}).sort({ score: -1 }).limit(100);
  res.json({ data });
};

export const employeeRiskSummary = async (req, res) => {
  const employeeId = req.params.employeeId;
  const [riskRecord, loginRequests, transactions] = await Promise.all([
    RiskScore.findOne({ employeeId }),
    LoginRequest.find({ employeeId }).sort({ createdAt: -1 }).limit(20),
    Transaction.find({ createdBy: employeeId }).sort({ createdAt: -1 }).limit(50)
  ]);

  const recentTransactions = transactions.slice(0, 10).length;
  const repeatedCustomerAccess = new Set(transactions.map((txn) => txn.customerId)).size < transactions.length ? 1 : 0;
  const largeTransaction = Math.max(0, ...transactions.map((txn) => txn.amount || 0));
  const computed = calculateEmployeeRisk({
    loginReasons: loginRequests[0]?.reason || [],
    recentTransactionCount: recentTransactions,
    repeatedCustomerAccess,
    highValueTransaction: largeTransaction
  });

  res.json({ data: { riskRecord, loginRequests, transactions, computed } });
};
