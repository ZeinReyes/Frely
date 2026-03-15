import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  projectId:   z.string().uuid('Invalid project ID'),
  taskId:      z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  startTime:   z.string().datetime(),
  endTime:     z.string().datetime().optional(),
  isBillable:  z.boolean().optional().default(true),
});

export const updateTimeEntrySchema = z.object({
  description: z.string().max(500).optional(),
  startTime:   z.string().datetime().optional(),
  endTime:     z.string().datetime().optional(),
  isBillable:  z.boolean().optional(),
});

export const startTimerSchema = z.object({
  projectId:   z.string().uuid('Invalid project ID'),
  taskId:      z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  isBillable:  z.boolean().optional().default(true),
});

export const listTimeEntriesSchema = z.object({
  projectId: z.string().uuid().optional(),
  taskId:    z.string().uuid().optional(),
  page:      z.coerce.number().min(1).default(1),
  limit:     z.coerce.number().min(1).max(100).default(50),
});

export type CreateTimeEntryInput  = z.infer<typeof createTimeEntrySchema>;
export type UpdateTimeEntryInput  = z.infer<typeof updateTimeEntrySchema>;
export type StartTimerInput       = z.infer<typeof startTimerSchema>;
export type ListTimeEntriesInput  = z.infer<typeof listTimeEntriesSchema>;
