import { Router } from 'express';
import * as reminderController from '../controllers/reminderController';

const router = Router({ mergeParams: true });

// All mounted under /api/invoices/:invoiceId/reminders
router.get('/',         reminderController.getReminders);
router.post('/enable',  reminderController.enableReminders);
router.post('/disable', reminderController.disableReminders);
router.post('/send',    reminderController.sendReminder);

export default router;
