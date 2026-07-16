import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { pendingLoginRequests, approveLoginRequest, rejectLoginRequest, managerDashboard } from '../controllers/managerController.js';

export const managerRoutes = Router();

managerRoutes.use(protect, requireRole('Admin', 'Manager'));
managerRoutes.get('/dashboard', managerDashboard);
managerRoutes.get('/login-requests', pendingLoginRequests);
managerRoutes.patch('/login-requests/:id/approve', approveLoginRequest);
managerRoutes.patch('/login-requests/:id/reject', rejectLoginRequest);
