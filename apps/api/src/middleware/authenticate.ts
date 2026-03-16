import { type Request, type Response, type NextFunction } from 'express';
import { auth } from '../config/auth';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';
import { toNodeHandler } from 'better-auth/node';

// Verify session from Better Auth
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Better Auth reads the session from cookies or Bearer token automatically
    const session = await auth.api.getSession({
      headers: new Headers(req.headers as Record<string, string>),
    });

    if (!session?.user) {
      throw AppError.unauthorized('You must be logged in to access this resource');
    }

    // Fetch full user from DB to get custom fields (plan, role)
    const dbUser = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { plan: true, role: true, fullName: true },
    });

    // Attach user to request
    req.user = {
      id:           session.user.id,
      email:        session.user.email,
      name:         session.user.name,
      fullName:     dbUser?.fullName || session.user.name,
      plan:         (dbUser?.plan as string) || 'STARTER',
      role:         dbUser?.role || 'USER',
      emailVerified: session.user.emailVerified,
    };

    next();
  } catch (error) {
    next(error);
  }
}

// Export Better Auth handler for mounting all auth routes
export const authHandler = toNodeHandler(auth);