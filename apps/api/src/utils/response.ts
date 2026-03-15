import { type Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data, ...(message && { message }) });
}

export function sendCreated<T>(res: Response, data: T, message?: string) {
  return sendSuccess(res, data, message, 201);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: { page: number; limit: number; total: number }
) {
  return res.status(200).json({
    success: true,
    data,
    pagination: { ...pagination, totalPages: Math.ceil(pagination.total / pagination.limit) },
  });
}

export function sendNoContent(res: Response) {
  return res.status(204).send();
}
