import { Customer } from '../models/Customer.js';
import { buildCrudController } from './crudController.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

const crud = buildCrudController(Customer, ['name', 'phone', 'aadhaar', 'pan', 'customerId'], 'customers');

export const listCustomers = crud.list;
export const getCustomer = crud.getOne;
export const createCustomer = crud.create;
export const updateCustomer = crud.update;
export const deleteCustomer = crud.remove;

export const searchCustomers = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (demoMode) {
    const data = store.find('customers', q ? { q } : {}, {
      searchFields: ['name', 'phone', 'aadhaar', 'pan', 'customerId'],
      limit: 15
    });
    return res.json({ data });
  }

  try {
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
    return res.json({ data });
  } catch (err) {
    const data = store.find('customers', q ? { q } : {}, {
      searchFields: ['name', 'phone', 'aadhaar', 'pan', 'customerId'],
      limit: 15
    });
    return res.json({ data });
  }
};
