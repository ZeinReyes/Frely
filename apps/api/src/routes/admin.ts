import { Router } from 'express';
import * as adminController from '../controllers/adminController';

const router = Router();

// Dashboard
router.get('/stats',                    adminController.getStats);

// Users
router.get('/users',                    adminController.listUsers);
router.patch('/users/:id/plan',         adminController.updateUserPlan);
router.patch('/users/:id/role',         adminController.updateUserRole);
router.delete('/users/:id',             adminController.deleteUser);

// Landing content
router.get('/landing',                  adminController.getLandingContent);
router.put('/landing/:key',             adminController.updateLandingContent);

// Plans
router.get('/plans',                    adminController.getPlans);
router.put('/plans/:id',                adminController.updatePlan);

export default router;
