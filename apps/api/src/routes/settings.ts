import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';

const router = Router();

router.get('/profile',          settingsController.getProfile);
router.put('/profile',          settingsController.updateProfile);
router.get('/branding',         settingsController.getBranding);
router.put('/branding',         settingsController.updateBranding);
router.get('/payments',         settingsController.getPaymentSettings);
router.put('/payments',         settingsController.updatePaymentSettings);

export default router;
