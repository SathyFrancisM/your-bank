import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { employeeDashboard, managerDashboard, adminDashboard, auditorDashboard } from '../controllers/dashboardController.js';

export const dashboardRoutes = Router();

dashboardRoutes.use(protect);
dashboardRoutes.get('/employee', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), employeeDashboard);
dashboardRoutes.get('/manager', requireRole('Admin', 'Manager'), managerDashboard);
dashboardRoutes.get('/admin', requireRole('Admin'), adminDashboard);
dashboardRoutes.get('/auditor', requireRole('Admin', 'Auditor'), auditorDashboard);
