import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listLoans, getLoan, calculateLoanEmi, createLoan } from '../controllers/loanController.js';

export const loanRoutes = Router();

loanRoutes.use(protect);
loanRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listLoans);
loanRoutes.get('/:id', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), getLoan);
loanRoutes.post('/calculate-emi', requireRole('Admin', 'Manager', 'Teller'), calculateLoanEmi);
loanRoutes.post('/', requireRole('Admin', 'Manager', 'Teller'), createLoan);
