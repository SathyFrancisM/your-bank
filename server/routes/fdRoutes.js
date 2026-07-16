import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listFd, getFd, calculateFd, createFd, prematureWithdrawFd } from '../controllers/fdController.js';

export const fdRoutes = Router();

fdRoutes.use(protect);
fdRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listFd);
fdRoutes.get('/:id', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), getFd);
fdRoutes.post('/calculate', requireRole('Admin', 'Manager', 'Teller'), calculateFd);
fdRoutes.post('/', requireRole('Admin', 'Manager', 'Teller'), createFd);
fdRoutes.post('/:id/premature-withdrawal', requireRole('Admin', 'Manager'), prematureWithdrawFd);
