import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listAccounts, getAccount, openAccount, updateAccount, closeAccount, freezeAccount, activateAccount, deleteAccount } from '../controllers/accountController.js';

export const accountRoutes = Router();

accountRoutes.use(protect);
accountRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listAccounts);
accountRoutes.get('/:id', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), getAccount);
accountRoutes.post('/open', requireRole('Admin', 'Manager', 'Teller'), openAccount);
accountRoutes.put('/:id', requireRole('Admin', 'Manager'), updateAccount);
accountRoutes.post('/:id/close', requireRole('Admin', 'Manager'), closeAccount);
accountRoutes.post('/:id/freeze', requireRole('Admin', 'Manager'), freezeAccount);
accountRoutes.post('/:id/activate', requireRole('Admin', 'Manager'), activateAccount);
accountRoutes.delete('/:id', requireRole('Admin'), deleteAccount);
