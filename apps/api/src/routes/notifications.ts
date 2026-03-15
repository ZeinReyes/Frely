import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/stream',        notificationController.stream);
router.get('/',              notificationController.list);
router.get('/unread-count',  notificationController.getUnreadCount);
router.post('/mark-all-read', notificationController.markAllRead);
router.patch('/:id/read',    notificationController.markRead);
router.delete('/:id',        notificationController.remove);

export default router;
