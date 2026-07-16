import { Customer } from '../models/Customer.js';
import { buildCrudController } from './crudController.js';

const crud = buildCrudController(Customer, ['name', 'phone', 'aadhaar', 'pan', 'customerId']);

export const listCustomers = crud.list;
export const getCustomer = crud.getOne;
export const createCustomer = crud.create;
export const updateCustomer = crud.update;
export const deleteCustomer = crud.remove;

export const searchCustomers = async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q
    ? {
        $or: [
          { name: new RegExp(q, 'i') },
          { phone: new RegExp(q, 'i') },
          { aadhaar: new RegExp(q, 'i') },
          { pan: new RegExp(q, 'i') },
          { customerId: new RegExp(q, 'i') }
        ]
      }
    : {};
  const data = await Customer.find(filter).sort({ createdAt: -1 }).limit(15);
  res.json({ data });
};
