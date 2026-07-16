import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { adminOverview } from '../controllers/adminController.js';
import { buildCrudController } from '../controllers/crudController.js';
import { Manager } from '../models/Manager.js';

const managerCrud = buildCrudController(Manager, ['managerId', 'employeeId', 'name', 'branch']);

export const adminRoutes = Router();

adminRoutes.use(protect, requireRole('Admin'));
adminRoutes.get('/overview', adminOverview);
adminRoutes.get('/managers', managerCrud.list);
adminRoutes.get('/managers/:id', managerCrud.getOne);
adminRoutes.post('/managers', managerCrud.create);
adminRoutes.put('/managers/:id', managerCrud.update);
adminRoutes.delete('/managers/:id', managerCrud.remove);
