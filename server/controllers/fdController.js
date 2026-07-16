import { Fd } from '../models/Fd.js';
import { calculateFdMaturity } from '../utils/calculators.js';
import { buildCrudController } from './crudController.js';
import { writeAuditLog } from '../services/auditService.js';

const crud = buildCrudController(Fd, ['fdNumber', 'customerName', 'customerId']);

export const listFd = crud.list;
export const getFd = crud.getOne;

export const calculateFd = async (req, res) => {
  const result = calculateFdMaturity(req.body);
  res.json({ data: result });
};

export const createFd = async (req, res) => {
  const computed = calculateFdMaturity(req.body);
  const fd = await Fd.create({
    fdNumber: `FD${Date.now()}`,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    principal: Number(req.body.principal),
    interestRate: Number(req.body.interestRate),
    tenureMonths: Number(req.body.tenureMonths),
    maturityAmount: computed.maturityAmount,
    maturityDate: computed.maturityDate,
    lockPeriodMonths: computed.lockPeriodMonths,
    createdBy: req.user.employeeId
  });
  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action: 'FD Creation', module: 'FD', entityType: 'FD', entityId: fd._id.toString(), metadata: { customerId: fd.customerId } });
  return res.status(201).json({ data: fd });
};

export const prematureWithdrawFd = async (req, res) => {
  const fd = await Fd.findByIdAndUpdate(req.params.id, { status: 'Prematurely Closed' }, { new: true });
  if (!fd) return res.status(404).json({ message: 'FD not found' });
  return res.json({ data: fd });
};
