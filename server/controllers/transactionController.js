import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { buildCrudController } from './crudController.js';

const crud = buildCrudController(Transaction, ['transactionId', 'accountNumber', 'customerId', 'channel', 'type']);

const saveTransaction = async ({ req, type, channel, amount, fromAccount, toAccount, narration, beneficiary, status = 'Success', metadata = {} }) => {
  const transaction = await Transaction.create({
    transactionId: `TXN${Date.now()}`,
    customerId: fromAccount?.customerId || toAccount?.customerId || req.body.customerId,
    accountNumber: fromAccount?.accountNumber || toAccount?.accountNumber || req.body.accountNumber,
    type,
    channel,
    amount,
    narration,
    beneficiary,
    createdBy: req.user.employeeId,
    branch: req.body.branch || fromAccount?.branch || toAccount?.branch,
    status,
    metadata,
    balanceBefore: metadata.balanceBefore,
    balanceAfter: metadata.balanceAfter
  });

  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action: type, module: 'Transactions', entityType: 'Transaction', entityId: transaction._id.toString(), metadata: { channel, amount, ...metadata } });
  return transaction;
};

export const listTransactions = crud.list;

export const deposit = async (req, res) => {
  const account = await Account.findOne({ accountNumber: req.body.accountNumber });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  const balanceBefore = account.balance;
  account.balance += Number(req.body.amount);
  await account.save();
  const transaction = await saveTransaction({ req, type: 'Deposit', channel: req.body.channel || 'Cash', amount: Number(req.body.amount), toAccount: account, narration: req.body.narration, metadata: { balanceBefore, balanceAfter: account.balance } });
  await createNotification({ targetRole: 'Manager', title: 'Deposit completed', message: `Deposit of ₹${req.body.amount} posted to ${account.accountNumber}`, type: 'success', metadata: { transactionId: transaction._id.toString() } });
  return res.status(201).json({ data: transaction });
};

export const withdraw = async (req, res) => {
  const account = await Account.findOne({ accountNumber: req.body.accountNumber });
  if (!account) return res.status(404).json({ message: 'Account not found' });
  const amount = Number(req.body.amount);
  if (account.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
  const balanceBefore = account.balance;
  account.balance -= amount;
  await account.save();
  const transaction = await saveTransaction({ req, type: 'Withdraw', channel: req.body.channel || 'Cash', amount, fromAccount: account, narration: req.body.narration, metadata: { balanceBefore, balanceAfter: account.balance } });
  return res.status(201).json({ data: transaction });
};

export const transfer = async (req, res) => {
  const fromAccount = await Account.findOne({ accountNumber: req.body.fromAccountNumber });
  const toAccount = await Account.findOne({ accountNumber: req.body.toAccountNumber });
  if (!fromAccount || !toAccount) return res.status(404).json({ message: 'Account not found' });
  const amount = Number(req.body.amount);
  if (fromAccount.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
  const balanceBefore = fromAccount.balance;
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  await Promise.all([fromAccount.save(), toAccount.save()]);
  const transaction = await saveTransaction({ req, type: 'Transfer', channel: req.body.channel || 'Internal', amount, fromAccount, toAccount, beneficiary: req.body.beneficiary, narration: req.body.narration, metadata: { balanceBefore, balanceAfter: fromAccount.balance } });
  return res.status(201).json({ data: transaction });
};

export const historyByAccount = async (req, res) => {
  const data = await Transaction.find({ accountNumber: req.params.accountNumber }).sort({ createdAt: -1 }).limit(100);
  res.json({ data });
};
