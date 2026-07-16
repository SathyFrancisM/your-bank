import { Account } from '../models/Account.js';
import { Customer } from '../models/Customer.js';
import { writeAuditLog } from '../services/auditService.js';
import { buildCrudController } from './crudController.js';

const crud = buildCrudController(Account, ['accountNumber', 'customerName', 'customerId', 'type', 'branch']);

export const listAccounts = crud.list;
export const getAccount = crud.getOne;

export const openAccount = async (req, res) => {
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
  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action: 'Open Account', module: 'Accounts', entityType: 'Account', entityId: account._id.toString(), metadata: { accountNumber: account.accountNumber } });
  return res.status(201).json({ data: account });
};

const setStatus = async (req, res, status, action) => {
  const account = await Account.findByIdAndUpdate(req.params.id, { status, ...(status === 'Frozen' ? { frozenAt: new Date(), freezeReason: req.body.freezeReason || 'Operational control' } : {}) }, { new: true });
  if (!account) {
    return res.status(404).json({ message: 'Account not found' });
  }
  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action, module: 'Accounts', entityType: 'Account', entityId: account._id.toString(), metadata: { status } });
  return res.json({ data: account });
};

export const closeAccount = async (req, res) => setStatus(req, res, 'Closed', 'Close Account');
export const freezeAccount = async (req, res) => setStatus(req, res, 'Frozen', 'Freeze Account');
export const activateAccount = async (req, res) => setStatus(req, res, 'Active', 'Activate Account');
export const updateAccount = crud.update;
export const deleteAccount = crud.remove;
