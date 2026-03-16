import { type Request, type Response, type NextFunction } from 'express';
import * as settingsService from '../services/settingsService';
import { sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const profile  = await settingsService.getProfile(user.id);
    sendSuccess(res, { profile });
  } catch (error) { next(error); }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const profile  = await settingsService.updateProfile(user.id, req.body);
    sendSuccess(res, { profile }, 'Profile updated');
  } catch (error) { next(error); }
}

export async function getBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user }  = req as AuthenticatedRequest;
    const branding  = await settingsService.getBranding(user.id);
    sendSuccess(res, { branding });
  } catch (error) { next(error); }
}

export async function updateBranding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user }  = req as AuthenticatedRequest;
    const branding  = await settingsService.updateBranding(user.id, req.body);
    sendSuccess(res, { branding }, 'Branding updated');
  } catch (error) { next(error); }
}

export async function getPaymentSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user }   = req as AuthenticatedRequest;
    const settings   = await settingsService.getPaymentSettings(user.id);
    sendSuccess(res, { settings });
  } catch (error) { next(error); }
}

export async function updatePaymentSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await settingsService.updatePaymentSettings(user.id, req.body);
    sendSuccess(res, {}, 'Payment settings updated');
  } catch (error) { next(error); }
}
