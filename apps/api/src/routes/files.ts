import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { validate } from '../middleware/validate';
import { updateFileSchema, listFilesSchema } from '../validators/fileValidators';

const router = Router();

router.get('/',    validate(listFilesSchema, 'query'), fileController.listFiles);
router.post('/',   fileController.uploadFile);
router.get('/:id', fileController.getFile);
router.put('/:id', validate(updateFileSchema), fileController.updateFile);
router.delete('/:id', fileController.deleteFile);

export default router;
