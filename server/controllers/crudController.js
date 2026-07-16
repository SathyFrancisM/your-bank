const pickSearchFields = (query, fields = []) => {
  const terms = [];
  fields.forEach((field) => {
    if (query[field]) {
      terms.push({ [field]: new RegExp(String(query[field]), 'i') });
    }
  });
  return terms.length ? { $or: terms } : {};
};

export const buildCrudController = (model, searchFields = []) => ({
  list: async (req, res) => {
    const filter = pickSearchFields(req.query, searchFields);
    const data = await model.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json({ data });
  },
  getOne: async (req, res) => {
    const item = await model.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ data: item });
  },
  create: async (req, res) => {
    const created = await model.create(req.body);
    return res.status(201).json({ data: created });
  },
  update: async (req, res) => {
    const updated = await model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ data: updated });
  },
  remove: async (req, res) => {
    const deleted = await model.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Record not found' });
    }
    return res.json({ message: 'Deleted successfully' });
  }
});
