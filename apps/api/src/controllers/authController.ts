import { type Request, type Response, type NextFunction } from 'express';
import prisma from '../config/database';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import type { AuthenticatedRequest } from '../types';

// GET /api/auth/me  — returns full user profile from DB
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        avatarUrl: true,
        timezone: true,
        createdAt: true,
        branding: {
          select: {
            logoUrl: true,
            primaryColor: true,
            companyName: true,
            customDomain: true,
          },
        },
      },
    });

    if (!profile) throw AppError.notFound('User not found');

    sendSuccess(res, { user: profile });
  } catch (error) {
    next(error);
  }
}

// PUT /api/auth/me  — update profile
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { fullName, timezone, avatarUrl } = req.body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(fullName && { fullName }),
        ...(timezone && { timezone }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        plan: true,
        avatarUrl: true,
        timezone: true,
      },
    });

    sendSuccess(res, { user: updated }, 'Profile updated');
  } catch (error) {
    next(error);
  }
}
