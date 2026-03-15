import { type Request, type Response, type NextFunction } from 'express';
import * as portalService from '../services/portalService';
import { sendSuccess, sendCreated } from '../utils/response';

// GET /api/portal/:token
export async function getPortal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await portalService.getPortalByToken(req.params.token as string);
    sendSuccess(res, { client });
  } catch (error) { next(error); }
}

// GET /api/portal/:token/projects
export async function getPortalProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await portalService.getPortalProjects(req.params.token as string);
    sendSuccess(res, { projects });
  } catch (error) { next(error); }
}

// GET /api/portal/:token/projects/:projectId
export async function getPortalProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await portalService.getPortalProject(
      req.params.token     as string,
      req.params.projectId as string
    );
    sendSuccess(res, { project });
  } catch (error) { next(error); }
}

// POST /api/portal/:token/milestones/:milestoneId/approve
export async function approveMilestone(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const milestone = await portalService.approveMilestone(
      req.params.token       as string,
      req.params.milestoneId as string
    );
    sendSuccess(res, { milestone }, 'Milestone approved');
  } catch (error) { next(error); }
}

// POST /api/portal/:token/tasks/:taskId/comments
export async function addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const comment = await portalService.addPortalComment(
      req.params.token  as string,
      req.params.taskId as string,
      req.body.content
    );
    sendCreated(res, { comment }, 'Comment added');
  } catch (error) { next(error); }
}

// GET /api/portal/:token/files
export async function getPortalFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const files = await portalService.getPortalFiles(
      req.params.token as string,
      req.query.projectId as string | undefined
    );
    sendSuccess(res, { files });
  } catch (error) { next(error); }
}
