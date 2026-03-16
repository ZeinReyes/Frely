import { type Request, type Response, type NextFunction } from 'express';
import * as aiService from '../services/aiService';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';
import type { AuthenticatedRequest } from '../types';

// ─────────────────────────────────────────
// GENERATE PROPOSAL
// ─────────────────────────────────────────
export async function generateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { projectDescription, clientName, currency = 'USD' } = req.body;

    if (!projectDescription) throw AppError.badRequest('Project description is required');

    const result = await aiService.generateProposal({
      projectDescription,
      clientName:     clientName || 'Client',
      freelancerName: user.name,
      currency,
    });

    // Save suggestion
    await prisma.aISuggestion.create({
      data: {
        userId:          user.id,
        type:            'PROPOSAL',
        inputPrompt:     projectDescription,
        suggestedOutput: result as never,
      },
    });

    sendSuccess(res, { proposal: result });
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// GENERATE CONTRACT CLAUSES
// ─────────────────────────────────────────
export async function generateClauses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { description } = req.body;

    if (!description) throw AppError.badRequest('Description is required');

    const clauses = await aiService.generateContractClauses(description);

    await prisma.aISuggestion.create({
      data: {
        userId:          user.id,
        type:            'CONTRACT_CLAUSES',
        inputPrompt:     description,
        suggestedOutput: { clauses } as never,
      },
    });

    sendSuccess(res, { clauses });
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// GENERATE CLIENT EMAIL
// ─────────────────────────────────────────
export async function generateEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { scenario, clientName, context, invoiceNumber, amount, projectName } = req.body;

    if (!scenario) throw AppError.badRequest('Scenario is required');

    const result = await aiService.generateClientEmail({
      scenario,
      clientName:     clientName || 'Client',
      freelancerName: user.name,
      context,
      invoiceNumber,
      amount,
      projectName,
    });

    await prisma.aISuggestion.create({
      data: {
        userId:          user.id,
        type:            'EMAIL',
        inputPrompt:     `${scenario}: ${context || ''}`,
        suggestedOutput: result as never,
      },
    });

    sendSuccess(res, { email: result });
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// GENERATE PROJECT SUMMARY
// ─────────────────────────────────────────
export async function generateSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { projectId } = req.params;

    const project = await prisma.project.findFirst({
      where:   { id: projectId as string, userId: user.id },
      include: {
        client:     { select: { name: true } },
        tasks:      { select: { status: true } },
        milestones: { select: { title: true, status: true } },
        timeEntries: { select: { duration: true } },
      },
    });

    if (!project) throw AppError.notFound('Project not found');

    const tasksDone  = project.tasks.filter(t => t.status === 'DONE').length;
    const tasksTotal = project.tasks.length;
    const progress   = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
    const hoursLogged = project.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0) / 3600;

    const summary = await aiService.generateProjectSummary({
      projectName:  project.name,
      clientName:   project.client.name,
      status:       project.status,
      progress,
      tasksDone,
      tasksTotal,
      milestones:   project.milestones,
      hoursLogged:  Math.round(hoursLogged),
      startDate:    project.startDate?.toISOString().split('T')[0],
      endDate:      project.endDate?.toISOString().split('T')[0],
    });

    await prisma.aISuggestion.create({
      data: {
        userId:          user.id,
        type:            'PROJECT_SUMMARY',
        inputPrompt:     projectId as string,
        suggestedOutput: { summary } as never,
      },
    });

    sendSuccess(res, { summary });
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// GENERATE INVOICE LINE ITEMS
// ─────────────────────────────────────────
export async function generateLineItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const { projectDescription, currency = 'USD' } = req.body;

    if (!projectDescription) throw AppError.badRequest('Project description is required');

    const lineItems = await aiService.generateInvoiceItems(projectDescription, currency);

    await prisma.aISuggestion.create({
      data: {
        userId:          user.id,
        type:            'INVOICE_ITEMS',
        inputPrompt:     projectDescription,
        suggestedOutput: { lineItems } as never,
      },
    });

    sendSuccess(res, { lineItems });
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// GET AI SUGGESTION HISTORY
// ─────────────────────────────────────────
export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const suggestions = await prisma.aISuggestion.findMany({
      where:   { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take:    20,
    });
    sendSuccess(res, { suggestions });
  } catch (error) { next(error); }
}
