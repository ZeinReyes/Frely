import { z } from 'zod';

export const createMilestoneSchema = z.object({
  projectId:   z.string().uuid('Invalid project ID'),
  title:       z.string().min(1, 'Title is required').max(200).trim(),
  description: z.string().max(1000).optional(),
  dueDate:     z.string().datetime().optional(),
  order:       z.number().min(0).optional().default(0),
});

export const updateMilestoneSchema = createMilestoneSchema
  .partial()
  .omit({ projectId: true });

export const updateMilestoneStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'IN_PROGRESS',
    'AWAITING_APPROVAL',
    'APPROVED',
    'COMPLETED',
  ]),
});

export const reorderMilestonesSchema = z.object({
  milestones: z.array(
    z.object({
      id:    z.string().uuid(),
      order: z.number().min(0),
    })
  ),
});

export type CreateMilestoneInput       = z.infer<typeof createMilestoneSchema>;
export type UpdateMilestoneInput       = z.infer<typeof updateMilestoneSchema>;
export type UpdateMilestoneStatusInput = z.infer<typeof updateMilestoneStatusSchema>;
export type ReorderMilestonesInput     = z.infer<typeof reorderMilestonesSchema>;
