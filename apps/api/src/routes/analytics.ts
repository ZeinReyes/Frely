import { Router } from 'express';
import { analytics } from '../controllers/analyticsController';

const router = Router();

router.get('/', analytics);

export default router;
