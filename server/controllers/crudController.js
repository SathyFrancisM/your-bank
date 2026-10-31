import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

const pickSearchFields = (query, fields = []) => {
  const terms = [];
  fields.forEach((field) => {
    if (query[field]) {
      terms.push({ [field]: new RegExp(String(query[field]), 'i') });
    }
  });
  return terms.length ? { $or: terms } : {};
};

export const buildCrudController = (model, searchFields = [], collectionName = '') => {
  const getColName = () => collectionName || (model?.modelName ? model.modelName.toLowerCase() + 's' : 'records');

  return {
    list: async (req, res) => {
      const col = getColName();
      if (demoMode) {
        const data = store.find(col, req.query, { searchFields, limit: 100 });
        return res.json({ data });
      }
      try {
        const filter = pickSearchFields(req.query, searchFields);
        const data = await model.find(filter).sort({ createdAt: -1 }).limit(100);
        return res.json({ data });
      } catch (err) {
        const data = store.find(col, req.query, { searchFields, limit: 100 });
        return res.json({ data });
      }
    },
    getOne: async (req, res) => {
      const col = getColName();
      if (demoMode) {
        const item = store.findById(col, req.params.id);
        if (!item) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: item });
      }
      try {
        const item = await model.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: item });
      } catch (err) {
        const item = store.findById(col, req.params.id);
        if (!item) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: item });
      }
    },
    create: async (req, res) => {
      const col = getColName();
      if (demoMode) {
        const created = store.create(col, req.body);
        return res.status(201).json({ data: created });
      }
      try {
        const created = await model.create(req.body);
        return res.status(201).json({ data: created });
      } catch (err) {
        const created = store.create(col, req.body);
        return res.status(201).json({ data: created });
      }
    },
    update: async (req, res) => {
      const col = getColName();
      if (demoMode) {
        const updated = store.findByIdAndUpdate(col, req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: updated });
      }
      try {
        const updated = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: updated });
      } catch (err) {
        const updated = store.findByIdAndUpdate(col, req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Record not found' });
        return res.json({ data: updated });
      }
    },
    remove: async (req, res) => {
      const col = getColName();
      if (demoMode) {
        const deleted = store.findByIdAndDelete(col, req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Record not found' });
        return res.json({ message: 'Deleted successfully' });
      }
      try {
        const deleted = await model.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Record not found' });
        return res.json({ message: 'Deleted successfully' });
      } catch (err) {
        const deleted = store.findByIdAndDelete(col, req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Record not found' });
        return res.json({ message: 'Deleted successfully' });
      }
    }
  };
};
