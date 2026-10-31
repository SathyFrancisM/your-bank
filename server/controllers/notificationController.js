import { Notification } from '../models/Notification.js';
import { demoMode } from '../config/db.js';
import { store } from '../services/store.js';

export const listNotifications = async (req, res) => {
  const isAdm = req.user.role === 'Admin';
  if (demoMode) {
    const list = store.getCollection('notifications');
    const data = isAdm
      ? list.slice(0, 100)
      : list.filter((n) => n.targetRole === req.user.role || n.employeeId === req.user.employeeId).slice(0, 100);
    return res.json({ data });
  }

  try {
    const filter = isAdm ? {} : { $or: [{ targetRole: req.user.role }, { employeeId: req.user.employeeId }] };
    const data = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.json({ data });
  } catch {
    const list = store.getCollection('notifications');
    const data = isAdm
      ? list.slice(0, 100)
      : list.filter((n) => n.targetRole === req.user.role || n.employeeId === req.user.employeeId).slice(0, 100);
    return res.json({ data });
  }
};

export const markNotificationRead = async (req, res) => {
  if (demoMode) {
    const notification = store.findByIdAndUpdate('notifications', req.params.id, { readAt: new Date().toISOString() }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ data: notification });
  }

  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { readAt: new Date() }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.json({ data: notification });
  } catch {
    const notification = store.findByIdAndUpdate('notifications', req.params.id, { readAt: new Date().toISOString() }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    return res.json({ data: notification });
  }
};
