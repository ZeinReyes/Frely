import { Router } from 'express';
import * as proposalController from '../controllers/proposalController';
import { validate } from '../middleware/validate';
import {
  createProposalSchema,
  updateProposalSchema,
  createContractSchema,
  updateContractSchema,
  signContractSchema,
} from '../validators/proposalValidators';

const router = Router();

// ─────────────────────────────────────────
// PROPOSALS
// ─────────────────────────────────────────
router.get('/proposals',          proposalController.listProposals);
router.post('/proposals',         validate(createProposalSchema), proposalController.createProposal);
router.get('/proposals/:id',      proposalController.getProposal);
router.put('/proposals/:id',      validate(updateProposalSchema), proposalController.updateProposal);
router.post('/proposals/:id/send', proposalController.sendProposal);
router.get('/proposals/:id/pdf',   proposalController.downloadProposalPDF);
router.delete('/proposals/:id',    proposalController.deleteProposal);

// ─────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────
router.get('/contracts',           proposalController.listContracts);
router.post('/contracts',          validate(createContractSchema), proposalController.createContract);
router.get('/contracts/:id',       proposalController.getContract);
router.put('/contracts/:id',       validate(updateContractSchema), proposalController.updateContract);
router.post('/contracts/:id/send', proposalController.sendContract);
router.get('/contracts/:id/pdf',   proposalController.downloadContractPDF);
router.delete('/contracts/:id',    proposalController.deleteContract);

// Public signing route — no auth
router.get('/sign/:token',         proposalController.getContractByToken);
router.post('/sign/:token',        validate(signContractSchema), proposalController.signContract);

export default router;
