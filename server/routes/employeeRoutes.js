import { Router } from 'express';
import bcrypt from 'bcrypt';
import { buildCrudController } from '../controllers/crudController.js';
import { Employee } from '../models/Employee.js';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';

const crud = buildCrudController(Employee, ['employeeId', 'name', 'email', 'phone', 'role'], 'employees');

export const employeeRoutes = Router();

employeeRoutes.use(protect, requireRole('Admin', 'Manager', 'Auditor'));
employeeRoutes.get('/', crud.list);
employeeRoutes.get('/:id', crud.getOne);

employeeRoutes.post('/', requireRole('Admin'), async (req, res, next) => {
  if (req.body.password && !req.body.passwordHash) {
    try {
      req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
    } catch {
      // fallback
    }
  }
  return crud.create(req, res, next);
});

employeeRoutes.put('/:id', requireRole('Admin'), async (req, res, next) => {
  if (req.body.password) {
    try {
      req.body.passwordHash = await bcrypt.hash(req.body.password, 10);
      delete req.body.password;
    } catch {
      // fallback
    }
  }
  return crud.update(req, res, next);
});

employeeRoutes.delete('/:id', requireRole('Admin'), crud.remove);
