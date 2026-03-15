import { type Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  fullName: string;
  plan: string;
  emailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export type AuthenticatedRequest = Request & { user: AuthUser };

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;
