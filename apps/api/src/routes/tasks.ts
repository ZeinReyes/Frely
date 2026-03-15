import { Router } from 'express';
import * as taskController from '../controllers/taskController';
import { validate } from '../middleware/validate';
import {
  updateTaskSchema,
  moveTaskSchema,
  createCommentSchema,
} from '../validators/projectValidators';

const router = Router();

router.get('/:id',     taskController.getTask);
router.put('/:id',     validate(updateTaskSchema),  taskController.updateTask);
router.patch('/:id/move', validate(moveTaskSchema), taskController.moveTask);
router.delete('/:id',  taskController.deleteTask);
router.get('/:id/comments',  taskController.getComments);
router.post('/:id/comments', validate(createCommentSchema), taskController.createComment);
router.delete('/comments/:id', taskController.deleteComment);

export default router;
