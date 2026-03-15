import { type Request, type Response, type NextFunction } from 'express';
import * as reminderService from '../services/reminderService';
import { sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function getReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const reminders = await reminderService.getInvoiceReminders(user.id, req.params.invoiceId as string);
    sendSuccess(res, { reminders });
  } catch (error) { next(error); }
}

export async function enableReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await reminderService.enableReminders(user.id, req.params.invoiceId as string);
    sendSuccess(res, result, 'Reminders enabled');
  } catch (error) { next(error); }
}

export async function disableReminders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await reminderService.disableReminders(user.id, req.params.invoiceId as string);
    sendSuccess(res, result, 'Reminders disabled');
  } catch (error) { next(error); }
}

export async function sendReminder(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await reminderService.sendReminder(user.id, req.params.invoiceId as string);
    sendSuccess(res, result, 'Reminder queued');
  } catch (error) { next(error); }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const stats = await reminderService.getReminderStats(user.id);
    sendSuccess(res, { stats });
  } catch (error) { next(error); }
}
