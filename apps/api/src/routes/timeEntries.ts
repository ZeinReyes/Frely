import { Router } from 'express';
import * as timeEntryController from '../controllers/timeEntryController';
import { validate } from '../middleware/validate';
import {
  createTimeEntrySchema,
  updateTimeEntrySchema,
  startTimerSchema,
  listTimeEntriesSchema,
} from '../validators/timeEntryValidators';

const router = Router();

// List & create
router.get('/',    validate(listTimeEntriesSchema, 'query'), timeEntryController.listTimeEntries);
router.post('/',   validate(createTimeEntrySchema), timeEntryController.createTimeEntry);

// Timer controls
router.get('/active',     timeEntryController.getActiveTimer);
router.post('/start',     validate(startTimerSchema), timeEntryController.startTimer);
router.post('/stop',      timeEntryController.stopTimer);

// Project summary
router.get('/summary/:projectId', timeEntryController.getProjectTimeSummary);

// Single entry
router.put('/:id',    validate(updateTimeEntrySchema), timeEntryController.updateTimeEntry);
router.delete('/:id', timeEntryController.deleteTimeEntry);

export default router;
