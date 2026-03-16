import { Router } from 'express';
import * as clientController from '../controllers/clientController';
import { validate } from '../middleware/validate';
import { limitClients } from '../middleware/planLimits';
import {
  createClientSchema,
  updateClientSchema,
  listClientsSchema,
} from '../validators/clientValidators';

const router = Router();

router.get('/',    validate(listClientsSchema, 'query'), clientController.listClients);
router.post('/',   limitClients(), validate(createClientSchema), clientController.createClient);
router.get('/:id',  clientController.getClient);
router.put('/:id',  validate(updateClientSchema), clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.get('/:id/projects', clientController.getClientProjects);
router.get('/:id/invoices', clientController.getClientInvoices);
router.post('/:id/regenerate-portal-token', clientController.regeneratePortalToken);

export default router;