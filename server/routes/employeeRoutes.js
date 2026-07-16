import { Router } from 'express';
import { buildCrudController } from '../controllers/crudController.js';
import { Employee } from '../models/Employee.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const crud = buildCrudController(Employee, ['employeeId', 'name', 'email', 'phone', 'role']);

export const employeeRoutes = Router();

employeeRoutes.use(protect, requireRole('Admin', 'Manager', 'Auditor'));
employeeRoutes.get('/', crud.list);
employeeRoutes.get('/:id', crud.getOne);
employeeRoutes.post('/', requireRole('Admin'), crud.create);
employeeRoutes.put('/:id', requireRole('Admin'), crud.update);
employeeRoutes.delete('/:id', requireRole('Admin'), crud.remove);
