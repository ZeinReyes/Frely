import { type Request, type Response, type NextFunction } from 'express';
import * as fileService from '../services/fileService';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { AppError } from '../utils/AppError';
import type { AuthenticatedRequest } from '../types';
import type { UploadedFile } from 'express-fileupload';

export async function listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const files = await fileService.listFiles(user.id, req.query as never);
    sendSuccess(res, { files });
  } catch (error) { next(error); }
}

export async function uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;

    if (!req.files || !req.files.file) {
      throw AppError.badRequest('No file provided');
    }

    const file            = req.files.file as UploadedFile;
    const { projectId, clientId, isClientVisible } = req.body;

    const saved = await fileService.uploadFile(
      user.id,
      file,
      projectId,
      clientId,
      isClientVisible !== 'false'
    );

    sendCreated(res, { file: saved }, 'File uploaded successfully');
  } catch (error) { next(error); }
}

export async function updateFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const file = await fileService.updateFile(user.id, req.params.id as string, req.body);
    sendSuccess(res, { file }, 'File updated');
  } catch (error) { next(error); }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await fileService.deleteFile(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function getFile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const file = await fileService.getFileById(user.id, req.params.id as string);
    sendSuccess(res, { file });
  } catch (error) { next(error); }
}
