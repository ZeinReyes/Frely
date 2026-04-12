import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import fileUpload from 'express-fileupload';
import cron from 'node-cron';

import { auth } from './config/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticate } from './middleware/authenticate';
import { requireAdmin }  from './middleware/requireAdmin';

// Routes
import authRoutes         from './routes/auth';
import clientRoutes       from './routes/clients';
import projectRoutes      from './routes/projects';
import taskRoutes         from './routes/tasks';
import milestoneRoutes, { milestoneItemRouter } from './routes/milestones';
import timeEntryRoutes    from './routes/timeEntries';
import fileRoutes         from './routes/files';
import portalRoutes       from './routes/portal';
import proposalRoutes     from './routes/proposals';
import contractRoutes     from './routes/contracts';
import signingRoutes      from './routes/signing';
import invoiceRoutes      from './routes/invoices';
import reminderRoutes     from './routes/reminders';
import notificationRoutes from './routes/notifications';
import aiRoutes           from './routes/ai';
import analyticsRoutes    from './routes/analytics';
import settingsRoutes     from './routes/settings';
import adminRoutes        from './routes/admin';

const app = express();

// ─────────────────────────────────────────
// Security
// ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// ─────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max:      1000,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  })
);

app.use(
  '/api/auth/sign-in',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      10,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' } },
  })
);

// ─────────────────────────────────────────
// General Middleware
// ─────────────────────────────────────────
app.use(compression());
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir:  '/tmp/',
  limits:       { fileSize: 50 * 1024 * 1024 },
  abortOnLimit: true,
}));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─────────────────────────────────────────
// Better Auth — must be BEFORE json parser
// ─────────────────────────────────────────
app.all('/api/auth/*', toNodeHandler(auth));

// ─────────────────────────────────────────
// JSON body parser (AFTER Better Auth)
// ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'vyrn-api', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────

// Auth
app.use('/api/user', authRoutes);

// Core
app.use('/api/clients',   authenticate, clientRoutes);
app.use('/api/projects',  authenticate, projectRoutes);
app.use('/api/tasks',     authenticate, taskRoutes);
app.use('/api/projects/:projectId/milestones', authenticate, milestoneRoutes);
app.use('/api/milestones', authenticate, milestoneItemRouter);
app.use('/api/time-entries', authenticate, timeEntryRoutes);
app.use('/api/files',     authenticate, fileRoutes);

// Public landing content (no auth)
app.get('/api/public/landing', async (_req, res, next) => {
  try {
    const adminSvc = await import('./services/adminService');
    const [content, plans] = await Promise.all([adminSvc.getLandingContent(), adminSvc.getPlans()]);
    res.json({ success: true, data: { content, plans } });
  } catch (error) { next(error); }
});

// Portal — public (token-based, no auth)
app.use('/api/portal', portalRoutes);

// Proposals & Contracts (authenticated)
app.use('/api/proposals', authenticate, proposalRoutes);
app.use('/api/contracts', authenticate, contractRoutes);

// Public contract signing — no auth
app.use('/api/sign', signingRoutes);

// Invoices & Reminders
app.use('/api/invoices', authenticate, invoiceRoutes);
app.use('/api/invoices/:invoiceId/reminders', authenticate, reminderRoutes);

// Notifications
app.use('/api/notifications', authenticate, notificationRoutes);

// AI
app.use('/api/ai', authenticate, aiRoutes);

// Analytics
app.use('/api/analytics', authenticate, analyticsRoutes);

// Settings
app.use('/api/settings', authenticate, settingsRoutes);

// Admin
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

// ─────────────────────────────────────────
// Error Handling (must be last)
// ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─────────────────────────────────────────
// Background Workers & Cron Jobs
// ─────────────────────────────────────────

// Start BullMQ reminder worker
import('./jobs/reminderQueue').then(({ startReminderWorker }) => {
  startReminderWorker();
}).catch(err => console.error('Failed to start reminder worker:', err));

// Every day at 8:00 AM — send DRAFT invoices that are due today
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Running invoice auto-send job...');
  const { sendDueInvoices } = await import('./jobs/invoiceScheduler');
  await sendDueInvoices().catch(err => console.error('invoiceScheduler error:', err));
});

// Every day at 00:01 AM — mark SENT invoices past due date as OVERDUE
cron.schedule('1 0 * * *', async () => {
  console.log('⏰ Running overdue sweep...');
  const { sweepOverdueInvoices } = await import('./jobs/reminderQueue');
  await sweepOverdueInvoices().catch(err => console.error('overdueSweep error:', err));
});

export default app;