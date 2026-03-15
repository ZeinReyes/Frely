import { type Request, type Response, type NextFunction } from 'express';
import * as projectService from '../services/projectService';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { projects, total } = await projectService.listProjects(user.id, req.query as never);
    sendPaginated(res, projects, {
      page:  Number(req.query.page  || 1),
      limit: Number(req.query.limit || 20),
      total,
    });
  } catch (error) { next(error); }
}

export async function getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const project = await projectService.getProjectById(user.id, req.params.id as string);
    sendSuccess(res, { project });
  } catch (error) { next(error); }
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const project = await projectService.createProject(user.id, req.body);
    sendCreated(res, { project }, 'Project created successfully');
  } catch (error) { next(error); }
}

export async function updateProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const project = await projectService.updateProject(user.id, req.params.id as string, req.body);
    sendSuccess(res, { project }, 'Project updated successfully');
  } catch (error) { next(error); }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await projectService.deleteProject(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function getKanbanBoard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const board = await projectService.getKanbanBoard(user.id, req.params.id as string);
    sendSuccess(res, { board });
  } catch (error) { next(error); }
}
