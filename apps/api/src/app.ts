import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import fileUpload from 'express-fileupload';

import { auth } from './config/auth';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { authenticate } from './middleware/authenticate';

// Routes
import authRoutes   from './routes/auth';
import clientRoutes  from './routes/clients';
import projectRoutes from './routes/projects';
import taskRoutes      from './routes/tasks';
import milestoneRoutes, { milestoneItemRouter } from './routes/milestones';
import timeEntryRoutes from './routes/timeEntries';
import fileRoutes      from './routes/files';
import portalRoutes    from './routes/portal';

const app = express();

// ─────────────────────────────────────────
// Security
// ─────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// ─────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────
app.use(
  '/api/',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  })
);

app.use(
  '/api/auth/sign-in',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many login attempts' } },
  })
);

// ─────────────────────────────────────────
// General Middleware
// ─────────────────────────────────────────
app.use(compression());
app.use(cookieParser());
app.use(fileUpload({
  useTempFiles:  true,
  tempFileDir:   '/tmp/',
  limits:        { fileSize: 50 * 1024 * 1024 }, // 50MB
  abortOnLimit:  true,
}));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ─────────────────────────────────────────
// Better Auth — handles ALL auth routes:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   POST /api/auth/forget-password
//   POST /api/auth/reset-password
//   GET  /api/auth/verify-email
//   GET  /api/auth/get-session
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
app.use('/api/user', authRoutes);

// Future routes added here per module:
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/projects', authenticate, projectRoutes);
app.use('/api/tasks',    authenticate, taskRoutes);
app.use('/api/projects/:projectId/milestones', authenticate, milestoneRoutes);
app.use('/api/milestones', authenticate, milestoneItemRouter);
app.use('/api/time-entries', authenticate, timeEntryRoutes);
app.use('/api/files',        authenticate, fileRoutes);
app.use('/api/portal',       portalRoutes); // no auth — token-based
// app.use('/api/invoices',     authenticate, invoiceRoutes);
// app.use('/api/proposals',    authenticate, proposalRoutes);
// app.use('/api/contracts',    authenticate, contractRoutes);
// app.use('/api/files',        authenticate, fileRoutes);
app.use('/api/portal',       portalRoutes); // no auth — token-based
// app.use('/api/notifications',authenticate, notificationRoutes);
// app.use('/api/ai',           authenticate, aiRoutes);
// app.use('/api/analytics',    authenticate, analyticsRoutes);
// app.use('/api/portal',       portalRoutes);
// app.use('/api/webhooks',     webhookRoutes);

// ─────────────────────────────────────────
// Error Handling (must be last)
// ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
