import { Loan } from '../models/Loan.js';
import { calculateEmi } from '../utils/calculators.js';
import { buildCrudController } from './crudController.js';
import { writeAuditLog } from '../services/auditService.js';

const crud = buildCrudController(Loan, ['loanNumber', 'customerName', 'customerId', 'type']);

export const listLoans = crud.list;
export const getLoan = crud.getOne;

export const calculateLoanEmi = async (req, res) => {
  const emi = calculateEmi(req.body);
  res.json({ data: { emi } });
};

export const createLoan = async (req, res) => {
  const emi = calculateEmi(req.body);
  const loan = await Loan.create({
    loanNumber: `LN${Date.now()}`,
    customerId: req.body.customerId,
    customerName: req.body.customerName,
    type: req.body.type,
    amount: Number(req.body.amount),
    interestRate: Number(req.body.interestRate),
    tenureMonths: Number(req.body.tenureMonths),
    emi,
    approvalStatus: req.body.approvalStatus || 'Pending',
    riskScore: Number(req.body.riskScore || 0),
    remarks: req.body.remarks
  });
  await writeAuditLog({ actorId: req.user.employeeId, actorRole: req.user.role, employeeName: req.user.name, action: 'Loan Creation', module: 'Loans', entityType: 'Loan', entityId: loan._id.toString(), metadata: { customerId: loan.customerId, type: loan.type } });
  return res.status(201).json({ data: loan });
};
