import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listAuditLogs } from '../controllers/auditController.js';

export const auditRoutes = Router();

auditRoutes.use(protect, requireRole('Admin', 'Manager', 'Auditor'));
auditRoutes.get('/', listAuditLogs);
