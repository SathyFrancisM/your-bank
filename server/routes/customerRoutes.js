import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, searchCustomers } from '../controllers/customerController.js';

export const customerRoutes = Router();

customerRoutes.use(protect);
customerRoutes.get('/search', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), searchCustomers);
customerRoutes.get('/', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), listCustomers);
customerRoutes.get('/:id', requireRole('Admin', 'Manager', 'Teller', 'Auditor'), getCustomer);
customerRoutes.post('/', requireRole('Admin', 'Manager', 'Teller'), createCustomer);
customerRoutes.put('/:id', requireRole('Admin', 'Manager', 'Teller'), updateCustomer);
customerRoutes.delete('/:id', requireRole('Admin', 'Manager'), deleteCustomer);
