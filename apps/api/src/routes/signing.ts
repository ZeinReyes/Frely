import { Router } from 'express';
import * as contractController from '../controllers/contractController';
import { validate } from '../middleware/validate';
import {
  signContractSchema,
} from '../validators/proposalValidators';

const router = Router();

// Public signing route — no auth
router.get('/:token',         contractController.getContractByToken);
router.post('/:token',        validate(signContractSchema), contractController.signContract);

export default router;
