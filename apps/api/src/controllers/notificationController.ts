import { type Request, type Response, type NextFunction } from 'express';
import * as notificationService from '../services/notificationService';
import { addClient, removeClient } from '../services/sseService';
import { sendSuccess, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

// ─────────────────────────────────────────
// SSE STREAM ENDPOINT
// GET /api/notifications/stream
// ─────────────────────────────────────────
export async function stream(req: Request, res: Response): Promise<void> {
  const { user } = req as AuthenticatedRequest;

  // SSE headers
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Register this connection
  addClient(user.id, res);

  // Send initial unread count
  const count = await notificationService.getUnreadCount(user.id);
  res.write(`event: unread_count\ndata: ${JSON.stringify({ count })}\n\n`);

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(user.id, res);
  });
}

// ─────────────────────────────────────────
// REST ENDPOINTS
// ─────────────────────────────────────────
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const limit    = Number(req.query.limit) || 20;
    const notifications = await notificationService.listNotifications(user.id, limit);
    sendSuccess(res, { notifications });
  } catch (error) { next(error); }
}

export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const count    = await notificationService.getUnreadCount(user.id);
    sendSuccess(res, { count });
  } catch (error) { next(error); }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const notification = await notificationService.markAsRead(user.id, req.params.id as string);
    sendSuccess(res, { notification });
  } catch (error) { next(error); }
}

export async function markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await notificationService.markAllAsRead(user.id);
    sendSuccess(res, {}, 'All notifications marked as read');
  } catch (error) { next(error); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await notificationService.deleteNotification(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}
