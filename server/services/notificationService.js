import { Notification } from '../models/Notification.js';
import { demoMode } from '../config/db.js';

let socketServer = null;

export const setSocketServer = (server) => {
  socketServer = server;
};

export const createNotification = async ({ targetRole, employeeId = '', title, message, type = 'info', priority = 'normal', metadata = {} }) => {
  if (demoMode) {
    return { targetRole, employeeId, title, message, type, priority, metadata, demoMode: true, _id: `demo-notification-${Date.now()}` };
  }
  const notification = await Notification.create({ targetRole, employeeId, title, message, type, priority, metadata });
  if (socketServer) {
    socketServer.emit('notification', notification);
  }
  return notification;
};
