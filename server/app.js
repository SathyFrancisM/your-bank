import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { authRoutes } from './routes/authRoutes.js';
import { employeeRoutes } from './routes/employeeRoutes.js';
import { customerRoutes } from './routes/customerRoutes.js';
import { accountRoutes } from './routes/accountRoutes.js';
import { transactionRoutes } from './routes/transactionRoutes.js';
import { fdRoutes } from './routes/fdRoutes.js';
import { rdRoutes } from './routes/rdRoutes.js';
import { loanRoutes } from './routes/loanRoutes.js';
import { reportRoutes } from './routes/reportRoutes.js';
import { auditRoutes } from './routes/auditRoutes.js';
import { riskRoutes } from './routes/riskRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { managerRoutes } from './routes/managerRoutes.js';
import { recordingRoutes } from './routes/recordingRoutes.js';
import { adminRoutes } from './routes/adminRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/error.js';

export const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'banking-portal-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fds', fdRoutes);
app.use('/api/rds', rdRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/risk', riskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);
