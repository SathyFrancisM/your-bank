import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listTransactions, deposit, withdraw, transfer, historyByAccount } from '../controllers/transactionController.js';

export const transactionRoutes = Router();

const transactionWriteLimiter = rateLimit({ windowMs: 5 * 60 * 1000, limit: 25, standardHeaders: true, legacyHeaders: false });

transactionRoutes.use(protect);
transactionRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listTransactions);
transactionRoutes.get('/account/:accountNumber', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), historyByAccount);
transactionRoutes.post('/deposit', requireRole('Admin', 'Manager', 'Teller'), transactionWriteLimiter, deposit);
transactionRoutes.post('/withdraw', requireRole('Admin', 'Manager', 'Teller'), transactionWriteLimiter, withdraw);
transactionRoutes.post('/transfer', requireRole('Admin', 'Manager', 'Teller'), transactionWriteLimiter, transfer);
