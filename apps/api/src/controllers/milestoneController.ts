import { type Request, type Response, type NextFunction } from 'express';
import * as milestoneService from '../services/milestoneService';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function getMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestones = await milestoneService.getMilestones(user.id, req.params.projectId as string);
    sendSuccess(res, { milestones });
  } catch (error) { next(error); }
}

export async function getMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestone = await milestoneService.getMilestoneById(user.id, req.params.id as string);
    sendSuccess(res, { milestone });
  } catch (error) { next(error); }
}

export async function createMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestone = await milestoneService.createMilestone(user.id, req.body);
    sendCreated(res, { milestone }, 'Milestone created successfully');
  } catch (error) { next(error); }
}

export async function updateMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestone = await milestoneService.updateMilestone(user.id, req.params.id as string, req.body);
    sendSuccess(res, { milestone }, 'Milestone updated');
  } catch (error) { next(error); }
}

export async function updateMilestoneStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestone = await milestoneService.updateMilestoneStatus(user.id, req.params.id as string, req.body);
    sendSuccess(res, { milestone }, 'Milestone status updated');
  } catch (error) { next(error); }
}

export async function deleteMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await milestoneService.deleteMilestone(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function reorderMilestones(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const milestones = await milestoneService.reorderMilestones(
      user.id,
      req.params.projectId as string,
      req.body
    );
    sendSuccess(res, { milestones });
  } catch (error) { next(error); }
}
