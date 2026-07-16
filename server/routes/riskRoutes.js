import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listRiskScores, employeeRiskSummary } from '../controllers/riskController.js';

export const riskRoutes = Router();

riskRoutes.use(protect);
riskRoutes.get('/', requireRole('Admin', 'Manager', 'Auditor'), listRiskScores);
riskRoutes.get('/:employeeId', requireRole('Admin', 'Manager', 'Auditor'), employeeRiskSummary);
