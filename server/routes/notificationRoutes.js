import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { listNotifications, markNotificationRead } from '../controllers/notificationController.js';

export const notificationRoutes = Router();

notificationRoutes.use(protect);
notificationRoutes.get('/', listNotifications);
notificationRoutes.patch('/:id/read', markNotificationRead);
