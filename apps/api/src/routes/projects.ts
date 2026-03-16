import { Router } from 'express';
import * as projectController from '../controllers/projectController';
import * as taskController from '../controllers/taskController';
import { validate } from '../middleware/validate';
import { limitProjects } from '../middleware/planLimits';
import {
  createProjectSchema,
  updateProjectSchema,
  listProjectsSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
} from '../validators/projectValidators';

const router = Router();

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────
router.get('/',     validate(listProjectsSchema, 'query'), projectController.listProjects);
router.post('/',    limitProjects(), validate(createProjectSchema), projectController.createProject);
router.get('/:id',  projectController.getProject);
router.put('/:id',  validate(updateProjectSchema), projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.get('/:id/board', projectController.getKanbanBoard);

// ─────────────────────────────────────────
// TASKS (nested under projects for creation)
// ─────────────────────────────────────────
router.post('/:id/tasks', validate(createTaskSchema), taskController.createTask);

export default router;
