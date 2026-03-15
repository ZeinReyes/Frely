import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validators/authValidators';

const router = Router();

// Protected — requires session
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, validate(updateProfileSchema), authController.updateMe);

export default router;

// NOTE: All sign-up, sign-in, sign-out, forgot-password, reset-password,
// verify-email routes are handled automatically by Better Auth at /api/auth/*
// See app.ts where authHandler is mounted.
