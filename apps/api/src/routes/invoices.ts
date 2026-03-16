import { limitInvoices } from '../middleware/planLimits';
import { Router } from 'express';
import * as invoiceController from '../controllers/invoiceController';
import { validate } from '../middleware/validate';
import { createInvoiceSchema, updateInvoiceSchema, markPaidSchema } from '../validators/invoiceValidators';

const router = Router();

router.get('/',              invoiceController.listInvoices);
router.get('/stats',         invoiceController.getStats);
router.post('/', limitInvoices(),             validate(createInvoiceSchema), invoiceController.createInvoice);
router.get('/:id',           invoiceController.getInvoice);
router.put('/:id',           validate(updateInvoiceSchema), invoiceController.updateInvoice);
router.post('/:id/send',     invoiceController.sendInvoice);
router.post('/:id/send-paypal', invoiceController.sendInvoicePayPal);
router.post('/:id/mark-paid', validate(markPaidSchema), invoiceController.markPaid);
router.get('/:id/pdf',       invoiceController.downloadPDF);
router.delete('/:id',        invoiceController.deleteInvoice);

export default router;
