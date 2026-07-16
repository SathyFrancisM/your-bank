import { Rd } from '../models/Rd.js';
import { calculateRdMaturity } from '../utils/calculators.js';
import { buildCrudController } from './crudController.js';
import { writeAuditLog } from '../services/auditService.js';

const crud = buildCrudController(Rd, ['rdNumber', 'customerName', 'customerId']);

export const listRd = crud.list;
export const getRd = crud.getOne;

export const calculateRd = async (req, res) => {
  const result = calculateRdMaturity(req.body);
  res.json({ data: result });
};

export const createRd = async (req, res) => {
  const computed = calculateRdMaturity(req.body);
  const rd = await Rd.create({
    rdNumber: `RD${Date.now()}`,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    monthlyDeposit: Number(req.body.monthlyDeposit),
    interestRate: Number(req.body.interestRate),
    tenureMonths: Number(req.body.tenureMonths),
    maturityAmount: computed.maturityAmount,
    maturityDate: computed.maturityDate,
    createdBy: req.user.employeeId
  });
  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action: 'RD Creation', module: 'RD', entityType: 'RD', entityId: rd._id.toString(), metadata: { customerId: rd.customerId } });
  return res.status(201).json({ data: rd });
};
