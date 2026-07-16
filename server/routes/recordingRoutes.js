import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { listRecordings, stopRecording } from '../controllers/recordingController.js';

export const recordingRoutes = Router();

recordingRoutes.use(protect, requireRole('Admin', 'Manager'));
recordingRoutes.get('/', listRecordings);
recordingRoutes.patch('/:id/stop', stopRecording);
