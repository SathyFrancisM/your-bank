import { Transaction } from '../models/Transaction.js';
import { Account } from '../models/Account.js';
import { writeAuditLog } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { buildCrudController } from './crudController.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

const crud = buildCrudController(Transaction, ['transactionId', 'accountNumber', 'customerId', 'channel', 'type'], 'transactions');

const saveTransaction = async ({ req, type, channel, amount, fromAccount, toAccount, narration, beneficiary, status = 'Success', metadata = {} }) => {
  const doc = {
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
    balanceAfter: metadata.balanceAfter,
    createdAt: new Date().toISOString()
  };

  let transaction = null;
  if (demoMode) {
    transaction = store.create('transactions', doc);
  } else {
    try {
      transaction = await Transaction.create(doc);
    } catch {
      transaction = store.create('transactions', doc);
    }
  }

  await writeAuditLog({
    actorId: req.user.employeeId,
    actorRole: req.user.role,
    employeeName: req.user.name,
    action: type,
    module: 'Transactions',
    entityType: 'Transaction',
    entityId: (transaction._id || transaction.id).toString(),
    metadata: { channel, amount, ...metadata }
  });
  return transaction;
};

export const listTransactions = crud.list;

export const deposit = async (req, res) => {
  const accNum = req.body.accountNumber;
  const amount = Number(req.body.amount);

  if (demoMode) {
    const account = store.findOne('accounts', { accountNumber: accNum });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const balanceBefore = account.balance;
    account.balance += amount;
    const transaction = await saveTransaction({
      req,
      type: 'Deposit',
      channel: req.body.channel || 'Cash',
      amount,
      toAccount: account,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: account.balance }
    });
    await createNotification({
      targetRole: 'Manager',
      title: 'Deposit completed',
      message: `Deposit of ₹${amount} posted to ${account.accountNumber}`,
      type: 'success',
      metadata: { transactionId: (transaction._id || transaction.id).toString() }
    });
    return res.status(201).json({ data: transaction });
  }

  try {
    const account = await Account.findOne({ accountNumber: accNum });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    const balanceBefore = account.balance;
    account.balance += amount;
    await account.save();
    const transaction = await saveTransaction({
      req,
      type: 'Deposit',
      channel: req.body.channel || 'Cash',
      amount,
      toAccount: account,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: account.balance }
    });
    await createNotification({
      targetRole: 'Manager',
      title: 'Deposit completed',
      message: `Deposit of ₹${amount} posted to ${account.accountNumber}`,
      type: 'success',
      metadata: { transactionId: (transaction._id || transaction.id).toString() }
    });
    return res.status(201).json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ message: 'Deposit failed: ' + err.message });
  }
};

export const withdraw = async (req, res) => {
  const accNum = req.body.accountNumber;
  const amount = Number(req.body.amount);

  if (demoMode) {
    const account = store.findOne('accounts', { accountNumber: accNum });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const balanceBefore = account.balance;
    account.balance -= amount;
    const transaction = await saveTransaction({
      req,
      type: 'Withdraw',
      channel: req.body.channel || 'Cash',
      amount,
      fromAccount: account,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: account.balance }
    });
    return res.status(201).json({ data: transaction });
  }

  try {
    const account = await Account.findOne({ accountNumber: accNum });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const balanceBefore = account.balance;
    account.balance -= amount;
    await account.save();
    const transaction = await saveTransaction({
      req,
      type: 'Withdraw',
      channel: req.body.channel || 'Cash',
      amount,
      fromAccount: account,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: account.balance }
    });
    return res.status(201).json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ message: 'Withdraw failed: ' + err.message });
  }
};

export const transfer = async (req, res) => {
  const fromAccNum = req.body.fromAccountNumber;
  const toAccNum = req.body.toAccountNumber;
  const amount = Number(req.body.amount);

  if (demoMode) {
    const fromAccount = store.findOne('accounts', { accountNumber: fromAccNum });
    const toAccount = store.findOne('accounts', { accountNumber: toAccNum });
    if (!fromAccount || !toAccount) return res.status(404).json({ message: 'Account not found' });
    if (fromAccount.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const balanceBefore = fromAccount.balance;
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    const transaction = await saveTransaction({
      req,
      type: 'Transfer',
      channel: req.body.channel || 'Internal',
      amount,
      fromAccount,
      toAccount,
      beneficiary: req.body.beneficiary,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: fromAccount.balance }
    });
    return res.status(201).json({ data: transaction });
  }

  try {
    const fromAccount = await Account.findOne({ accountNumber: fromAccNum });
    const toAccount = await Account.findOne({ accountNumber: toAccNum });
    if (!fromAccount || !toAccount) return res.status(404).json({ message: 'Account not found' });
    if (fromAccount.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    const balanceBefore = fromAccount.balance;
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    await Promise.all([fromAccount.save(), toAccount.save()]);
    const transaction = await saveTransaction({
      req,
      type: 'Transfer',
      channel: req.body.channel || 'Internal',
      amount,
      fromAccount,
      toAccount,
      beneficiary: req.body.beneficiary,
      narration: req.body.narration,
      metadata: { balanceBefore, balanceAfter: fromAccount.balance }
    });
    return res.status(201).json({ data: transaction });
  } catch (err) {
    return res.status(500).json({ message: 'Transfer failed: ' + err.message });
  }
};

export const historyByAccount = async (req, res) => {
  const accNum = req.params.accountNumber;
  if (demoMode) {
    const data = store.find('transactions', { accountNumber: accNum }, { limit: 100 });
    return res.json({ data });
  }
  try {
    const data = await Transaction.find({ accountNumber: accNum }).sort({ createdAt: -1 }).limit(100);
    return res.json({ data });
  } catch {
    const data = store.find('transactions', { accountNumber: accNum }, { limit: 100 });
    return res.json({ data });
  }
};
