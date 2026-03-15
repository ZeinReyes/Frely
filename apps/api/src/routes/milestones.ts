import { Router } from 'express';
import * as milestoneController from '../controllers/milestoneController';
import { validate } from '../middleware/validate';
import {
  createMilestoneSchema,
  updateMilestoneSchema,
  updateMilestoneStatusSchema,
  reorderMilestonesSchema,
} from '../validators/milestoneValidators';

const router = Router({ mergeParams: true }); // mergeParams to access :projectId

// All routes are nested under /api/projects/:projectId/milestones
router.get('/',    milestoneController.getMilestones);
router.post('/',   validate(createMilestoneSchema), milestoneController.createMilestone);
router.post('/reorder', validate(reorderMilestonesSchema), milestoneController.reorderMilestones);

// Single milestone routes — mounted separately at /api/milestones
export const milestoneItemRouter = Router();
milestoneItemRouter.get('/:id',    milestoneController.getMilestone);
milestoneItemRouter.put('/:id',    validate(updateMilestoneSchema), milestoneController.updateMilestone);
milestoneItemRouter.patch('/:id/status', validate(updateMilestoneStatusSchema), milestoneController.updateMilestoneStatus);
milestoneItemRouter.delete('/:id', milestoneController.deleteMilestone);

export default router;
