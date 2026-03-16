import { Router } from 'express';
import * as aiController from '../controllers/aiController';

const router = Router();

router.post('/proposal',              aiController.generateProposal);
router.post('/contract-clauses',      aiController.generateClauses);
router.post('/email',                 aiController.generateEmail);
router.post('/invoice-items',         aiController.generateLineItems);
router.get('/project/:projectId/summary', aiController.generateSummary);
router.get('/history',                aiController.getHistory);

export default router;
