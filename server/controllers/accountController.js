import { Account } from '../models/Account.js';
import { Customer } from '../models/Customer.js';
import { writeAuditLog } from '../services/auditService.js';
import { buildCrudController } from './crudController.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

const crud = buildCrudController(Account, ['accountNumber', 'customerName', 'customerId', 'type', 'branch'], 'accounts');

export const listAccounts = crud.list;
export const getAccount = crud.getOne;

export const openAccount = async (req, res) => {
  if (demoMode) {
    const account = store.create('accounts', req.body);
    const customer = store.findOne('customers', { customerId: account.customerId });
    if (customer) {
      customer.accounts = customer.accounts || [];
      customer.accounts.push({
        accountNumber: account.accountNumber,
        type: account.type,
        status: account.status,
        balance: account.balance
      });
    }
    await writeAuditLog({
      actorId: req.user.employeeId,
      actorRole: req.user.role,
      employeeName: req.user.name,
      action: 'Open Account',
      module: 'Accounts',
      entityType: 'Account',
      entityId: account._id.toString(),
      metadata: { accountNumber: account.accountNumber }
    });
    return res.status(201).json({ data: account });
  }

  try {
    const account = await Account.create(req.body);
    await Customer.updateOne(
      { customerId: account.customerId },
      {
        $push: {
          accounts: {
            accountNumber: account.accountNumber,
            type: account.type,
            status: account.status,
            balance: account.balance
          }
        }
      }
    );
    await writeAuditLog({
      actorId: req.user.employeeId,
      actorRole: req.user.role,
      employeeName: req.user.name,
      action: 'Open Account',
      module: 'Accounts',
      entityType: 'Account',
      entityId: account._id.toString(),
      metadata: { accountNumber: account.accountNumber }
    });
    return res.status(201).json({ data: account });
  } catch (err) {
    const account = store.create('accounts', req.body);
    return res.status(201).json({ data: account });
  }
};

const setStatus = async (req, res, status, action) => {
  if (demoMode) {
    const update = {
      status,
      ...(status === 'Frozen' ? { frozenAt: new Date().toISOString(), freezeReason: req.body.freezeReason || 'Operational control' } : {})
    };
    const account = store.findByIdAndUpdate('accounts', req.params.id, update, { new: true });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await writeAuditLog({
      actorId: req.user.employeeId,
      actorRole: req.user.role,
      employeeName: req.user.name,
      action,
      module: 'Accounts',
      entityType: 'Account',
      entityId: account._id.toString(),
      metadata: { status }
    });
    return res.json({ data: account });
  }

  try {
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { status, ...(status === 'Frozen' ? { frozenAt: new Date(), freezeReason: req.body.freezeReason || 'Operational control' } : {}) },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    await writeAuditLog({
      actorId: req.user.employeeId,
      actorRole: req.user.role,
      employeeName: req.user.name,
      action,
      module: 'Accounts',
      entityType: 'Account',
      entityId: account._id.toString(),
      metadata: { status }
    });
    return res.json({ data: account });
  } catch (err) {
    const account = store.findByIdAndUpdate('accounts', req.params.id, { status }, { new: true });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    return res.json({ data: account });
  }
};

export const closeAccount = async (req, res) => setStatus(req, res, 'Closed', 'Close Account');
export const freezeAccount = async (req, res) => setStatus(req, res, 'Frozen', 'Freeze Account');
export const activateAccount = async (req, res) => setStatus(req, res, 'Active', 'Activate Account');
export const updateAccount = crud.update;
export const deleteAccount = crud.remove;
