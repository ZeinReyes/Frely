import { Router } from 'express';
import * as contractController from '../controllers/contractController';
import { validate } from '../middleware/validate';
import { createContractSchema, updateContractSchema } from '../validators/proposalValidators';

const router = Router();

router.get('/',          contractController.listContracts);
router.post('/',         validate(createContractSchema), contractController.createContract);
router.get('/:id',       contractController.getContract);
router.put('/:id',       validate(updateContractSchema), contractController.updateContract);
router.post('/:id/send', contractController.sendContract);
router.get('/:id/pdf',   contractController.downloadContractPDF);
router.delete('/:id',    contractController.deleteContract);

export default router;