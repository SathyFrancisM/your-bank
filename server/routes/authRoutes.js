import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerEmployee, employeeLogin, verifyOtp, finalizeLogin, refreshToken, logout, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

export const authRoutes = Router();

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const otpLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const refreshLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });

authRoutes.post('/register', registerLimiter, registerEmployee);
authRoutes.post('/employee-login', loginLimiter, employeeLogin);
authRoutes.post('/verify-otp', otpLimiter, verifyOtp);
authRoutes.post('/finalize-login/:loginRequestId', otpLimiter, finalizeLogin);
authRoutes.post('/refresh-token', refreshLimiter, refreshToken);
authRoutes.post('/logout', protect, logout);
authRoutes.get('/me', protect, me);

