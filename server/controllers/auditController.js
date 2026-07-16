import { AuditLog } from '../models/AuditLog.js';

export const listAuditLogs = async (req, res) => {
  const filter = req.user.role === 'Admin' ? {} : { actorId: req.user.employeeId };
  const data = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json({ data });
};
