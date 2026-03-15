import { type Request, type Response, type NextFunction } from 'express';
import * as timeEntryService from '../services/timeEntryService';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function listTimeEntries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { entries, total, totalSeconds, billableSeconds } =
      await timeEntryService.listTimeEntries(user.id, req.query as never);
    res.status(200).json({
      success: true,
      data: entries,
      pagination: {
        page:       Number(req.query.page  || 1),
        limit:      Number(req.query.limit || 50),
        total,
        totalPages: Math.ceil(total / Number(req.query.limit || 50)),
      },
      summary: { totalSeconds, billableSeconds },
    });
  } catch (error) { next(error); }
}

export async function getActiveTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const entry = await timeEntryService.getActiveTimer(user.id);
    sendSuccess(res, { entry });
  } catch (error) { next(error); }
}

export async function startTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const entry = await timeEntryService.startTimer(user.id, req.body);
    sendCreated(res, { entry }, 'Timer started');
  } catch (error) { next(error); }
}

export async function stopTimer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const entry = await timeEntryService.stopTimer(user.id);
    sendSuccess(res, { entry }, 'Timer stopped');
  } catch (error) { next(error); }
}

export async function createTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const entry = await timeEntryService.createTimeEntry(user.id, req.body);
    sendCreated(res, { entry }, 'Time entry created');
  } catch (error) { next(error); }
}

export async function updateTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const entry = await timeEntryService.updateTimeEntry(user.id, req.params.id as string, req.body);
    sendSuccess(res, { entry }, 'Time entry updated');
  } catch (error) { next(error); }
}

export async function deleteTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await timeEntryService.deleteTimeEntry(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function getProjectTimeSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const summary = await timeEntryService.getProjectTimeSummary(user.id, req.params.projectId as string);
    sendSuccess(res, { summary });
  } catch (error) { next(error); }
}
