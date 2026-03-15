import { type Request, type Response, type NextFunction } from 'express';
import * as invoiceService from '../services/invoiceService';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoices = await invoiceService.listInvoices(user.id, {
      clientId:  req.query.clientId  as string,
      status:    req.query.status    as string,
      projectId: req.query.projectId as string,
    });
    sendSuccess(res, { invoices });
  } catch (error) { next(error); }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.getInvoiceById(user.id, req.params.id as string);
    sendSuccess(res, { invoice });
  } catch (error) { next(error); }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.createInvoice(user.id, req.body);
    sendCreated(res, { invoice }, 'Invoice created');
  } catch (error) { next(error); }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.updateInvoice(user.id, req.params.id as string, req.body);
    sendSuccess(res, { invoice }, 'Invoice updated');
  } catch (error) { next(error); }
}

export async function sendInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.sendInvoice(user.id, req.params.id as string);
    sendSuccess(res, { invoice }, 'Invoice marked as sent');
  } catch (error) { next(error); }
}

export async function sendInvoicePayPal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.sendInvoiceViaPayPal(user.id, req.params.id as string);
    sendSuccess(res, { invoice }, 'Invoice sent via PayPal');
  } catch (error) { next(error); }
}

export async function markPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const invoice = await invoiceService.markInvoicePaid(user.id, req.params.id as string, req.body.paidAt);
    sendSuccess(res, { invoice }, 'Invoice marked as paid');
  } catch (error) { next(error); }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await invoiceService.deleteInvoice(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function downloadPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const pdf = await invoiceService.getInvoicePDF(user.id, req.params.id as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
}

export async function getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const stats = await invoiceService.getInvoiceStats(user.id);
    sendSuccess(res, { stats });
  } catch (error) { next(error); }
}
