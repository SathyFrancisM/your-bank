import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { recordSecurityEvent, securityOverview, clearSecurityBlock } from '../controllers/securityController.js';

export const securityRoutes = Router();

securityRoutes.use(protect);
securityRoutes.post('/events', recordSecurityEvent);
securityRoutes.get('/overview', securityOverview);
securityRoutes.post('/clear-block', clearSecurityBlock);