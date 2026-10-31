import { AuditLog } from '../models/AuditLog.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

export const listAuditLogs = async (req, res) => {
  const filter = req.user.role === 'Admin' ? {} : { actorId: req.user.employeeId };
  if (demoMode) {
    const data = store.find('auditlogs', filter, { limit: 200 });
    return res.json({ data });
  }
  try {
    const data = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.json({ data });
  } catch {
    const data = store.find('auditlogs', filter, { limit: 200 });
    return res.json({ data });
  }
};
