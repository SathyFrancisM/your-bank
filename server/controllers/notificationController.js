import { Notification } from '../models/Notification.js';

export const listNotifications = async (req, res) => {
  const filter = req.user.role === 'Admin' ? {} : { $or: [{ targetRole: req.user.role }, { employeeId: req.user.employeeId }] };
  const data = await Notification.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ data });
};

export const markNotificationRead = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { readAt: new Date() }, { new: true });
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  return res.json({ data: notification });
};
