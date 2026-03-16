import { type Request, type Response, type NextFunction } from 'express';
import * as adminService from '../services/adminService';
import { sendSuccess, sendNoContent } from '../utils/response';

// ─────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────
export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getAdminStats();
    sendSuccess(res, stats);
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────
export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page   = Number(req.query.page)   || 1;
    const limit  = Number(req.query.limit)  || 20;
    const search = req.query.search as string | undefined;
    const result = await adminService.listUsers(page, limit, search);
    sendSuccess(res, result);
  } catch (error) { next(error); }
}

export async function updateUserPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminService.updateUserPlan(req.params.id as string, req.body.plan);
    sendSuccess(res, { user }, 'Plan updated');
  } catch (error) { next(error); }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await adminService.updateUserRole(req.params.id as string, req.body.role);
    sendSuccess(res, { user }, 'Role updated');
  } catch (error) { next(error); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await adminService.deleteUser(req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// LANDING CONTENT
// ─────────────────────────────────────────
export async function getLandingContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const content = await adminService.getLandingContent();
    sendSuccess(res, { content });
  } catch (error) { next(error); }
}

export async function updateLandingContent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.params;
    const result  = await adminService.updateLandingContent(key as string, req.body.value);
    sendSuccess(res, { content: result }, 'Content updated');
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// PLANS
// ─────────────────────────────────────────
export async function getPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plans = await adminService.getPlans();
    sendSuccess(res, { plans });
  } catch (error) { next(error); }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const plan = await adminService.updatePlan(req.params.id as string, req.body);
    sendSuccess(res, { plan }, 'Plan updated');
  } catch (error) { next(error); }
}
