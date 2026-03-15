import { Router } from 'express';
import * as portalController from '../controllers/portalController';

const router = Router();

// All portal routes are public (token-based, no JWT required)
router.get('/:token',                                    portalController.getPortal);
router.get('/:token/projects',                           portalController.getPortalProjects);
router.get('/:token/projects/:projectId',                portalController.getPortalProject);
router.post('/:token/milestones/:milestoneId/approve',   portalController.approveMilestone);
router.post('/:token/tasks/:taskId/comments',            portalController.addComment);
router.get('/:token/files',                              portalController.getPortalFiles);

export default router;
