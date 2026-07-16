import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listRd, getRd, calculateRd, createRd } from '../controllers/rdController.js';

export const rdRoutes = Router();

rdRoutes.use(protect);
rdRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listRd);
rdRoutes.get('/:id', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), getRd);
rdRoutes.post('/calculate', requireRole('Admin', 'Manager', 'Teller'), calculateRd);
rdRoutes.post('/', requireRole('Admin', 'Manager', 'Teller'), createRd);
