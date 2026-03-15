import { type Request, type Response, type NextFunction } from 'express';
import * as clientService from '../services/clientService';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

// GET /api/clients
export async function listClients(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { clients, total } = await clientService.listClients(user.id, req.query as never);
    sendPaginated(res, clients, {
      page:  Number(req.query.page  || 1),
      limit: Number(req.query.limit || 20),
      total,
    });
  } catch (error) { next(error); }
}

// GET /api/clients/:id
export async function getClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const client = await clientService.getClientById(user.id, req.params.id as string);
    sendSuccess(res, { client });
  } catch (error) { next(error); }
}

// POST /api/clients
export async function createClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const client = await clientService.createClient(user.id, req.body);
    sendCreated(res, { client }, 'Client created successfully');
  } catch (error) { next(error); }
}

// PUT /api/clients/:id
export async function updateClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const client = await clientService.updateClient(user.id, req.params.id as string, req.body);
    sendSuccess(res, { client }, 'Client updated successfully');
  } catch (error) { next(error); }
}

// DELETE /api/clients/:id
export async function deleteClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await clientService.deleteClient(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

// GET /api/clients/:id/projects
export async function getClientProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const projects = await clientService.getClientProjects(user.id, req.params.id as string);
    sendSuccess(res, { projects });
  } catch (error) { next(error); }
}

// GET /api/clients/:id/invoices
export async function getClientInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoices = await clientService.getClientInvoices(user.id, req.params.id as string);
    sendSuccess(res, { invoices });
  } catch (error) { next(error); }
}

// POST /api/clients/:id/regenerate-portal-token
export async function regeneratePortalToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const result = await clientService.regeneratePortalToken(user.id, req.params.id as string);
    sendSuccess(res, result, 'Portal token regenerated');
  } catch (error) { next(error); }
}