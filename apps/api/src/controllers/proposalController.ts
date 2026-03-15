import { type Request, type Response, type NextFunction } from 'express';
import * as proposalService from '../services/proposalService';
import * as contractService from '../services/contractService';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import type { AuthenticatedRequest } from '../types';

// ─────────────────────────────────────────
// PROPOSALS
// ─────────────────────────────────────────
export async function listProposals(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const proposals = await proposalService.listProposals(user.id, req.query.clientId as string);
    sendSuccess(res, { proposals });
  } catch (error) { next(error); }
}

export async function getProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const proposal = await proposalService.getProposalById(user.id, req.params.id as string);
    sendSuccess(res, { proposal });
  } catch (error) { next(error); }
}

export async function createProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const proposal = await proposalService.createProposal(user.id, req.body);
    sendCreated(res, { proposal }, 'Proposal created');
  } catch (error) { next(error); }
}

export async function updateProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const proposal = await proposalService.updateProposal(user.id, req.params.id as string, req.body);
    sendSuccess(res, { proposal }, 'Proposal updated');
  } catch (error) { next(error); }
}

export async function sendProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const proposal = await proposalService.sendProposal(user.id, req.params.id as string);
    sendSuccess(res, { proposal }, 'Proposal sent');
  } catch (error) { next(error); }
}

export async function deleteProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await proposalService.deleteProposal(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function downloadProposalPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const pdf = await proposalService.getProposalPDF(user.id, req.params.id as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="proposal-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
}

// ─────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────
export async function listContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const contracts = await contractService.listContracts(user.id, req.query.clientId as string);
    sendSuccess(res, { contracts });
  } catch (error) { next(error); }
}

export async function getContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const contract = await contractService.getContractById(user.id, req.params.id as string);
    sendSuccess(res, { contract });
  } catch (error) { next(error); }
}

export async function getContractByToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contract = await contractService.getContractBySignToken(req.params.token as string);
    sendSuccess(res, { contract });
  } catch (error) { next(error); }
}

export async function createContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const contract = await contractService.createContract(user.id, req.body);
    sendCreated(res, { contract }, 'Contract created');
  } catch (error) { next(error); }
}

export async function updateContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const contract = await contractService.updateContract(user.id, req.params.id as string, req.body);
    sendSuccess(res, { contract }, 'Contract updated');
  } catch (error) { next(error); }
}

export async function sendContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const contract = await contractService.sendContract(user.id, req.params.id as string);
    sendSuccess(res, { contract }, 'Contract sent');
  } catch (error) { next(error); }
}

export async function signContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const contract = await contractService.signContract(req.params.token as string, req.body);
    sendSuccess(res, { contract }, 'Contract signed successfully');
  } catch (error) { next(error); }
}

export async function deleteContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    await contractService.deleteContract(user.id, req.params.id as string);
    sendNoContent(res);
  } catch (error) { next(error); }
}

export async function downloadContractPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const pdf = await contractService.getContractPDF(user.id, req.params.id as string);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="contract-${req.params.id}.pdf"`);
    res.send(pdf);
  } catch (error) { next(error); }
}
