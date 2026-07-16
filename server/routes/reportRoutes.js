import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { managerReports } from '../controllers/reportController.js';

export const reportRoutes = Router();

reportRoutes.use(protect, requireRole('Admin', 'Manager'));
reportRoutes.get('/', managerReports);
reportRoutes.get('/manager', managerReports);
