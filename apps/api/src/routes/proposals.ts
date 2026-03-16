import { Router } from 'express';
import * as proposalController from '../controllers/proposalController';
import { validate } from '../middleware/validate';
import { createProposalSchema, updateProposalSchema } from '../validators/proposalValidators';

const router = Router();

router.get('/',          proposalController.listProposals);
router.post('/',         validate(createProposalSchema), proposalController.createProposal);
router.get('/:id',       proposalController.getProposal);
router.put('/:id',       validate(updateProposalSchema), proposalController.updateProposal);
router.post('/:id/send', proposalController.sendProposal);
router.get('/:id/pdf',   proposalController.downloadProposalPDF);
router.delete('/:id',    proposalController.deleteProposal);

export default router;