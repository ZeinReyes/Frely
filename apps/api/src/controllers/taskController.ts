import { type Request, type Response, type NextFunction } from 'express';
import * as taskService from '../services/taskService';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const task = await taskService.getTaskById(user.id, req.params.id as string);
    sendSuccess(res, { task });
  } catch (error) { next(error); }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const task = await taskService.createTask(user.id, req.body);
    sendCreated(res, { task }, 'Task created successfully');
  } catch (error) { next(error); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const task = await taskService.updateTask(user.id, req.params.id as string, req.body);
    sendSuccess(res, { task }, 'Task updated successfully');
  } catch (error) { next(error); }
}

export async function moveTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const task = await taskService.moveTask(user.id, req.params.id as string, req.body);
    sendSuccess(res, { task });
  } catch (error) { next(error); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await taskService.deleteTask(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const comments = await taskService.getComments(user.id, req.params.id as string);
    sendSuccess(res, { comments });
  } catch (error) { next(error); }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const comment = await taskService.createComment(user.id, req.params.id as string, req.body);
    sendCreated(res, { comment }, 'Comment added');
  } catch (error) { next(error); }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await taskService.deleteComment(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}
