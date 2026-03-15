import { z } from 'zod';

// ─────────────────────────────────────────
// PROJECT
// ─────────────────────────────────────────

export const createProjectSchema = z.object({
  clientId:    z.string().uuid('Invalid client ID'),
  name:        z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  description: z.string().max(1000).optional(),
  status:      z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional().default('ACTIVE'),
  startDate:   z.string().datetime().optional(),
  endDate:     z.string().datetime().optional(),
  budget:      z.number().positive().optional(),
});

export const updateProjectSchema = createProjectSchema.partial().omit({ clientId: true });

export const listProjectsSchema = z.object({
  page:     z.coerce.number().min(1).default(1),
  limit:    z.coerce.number().min(1).max(100).default(20),
  search:   z.string().optional(),
  status:   z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  clientId: z.string().optional(),
  sortBy:   z.enum(['name', 'createdAt', 'startDate', 'endDate']).default('createdAt'),
  sortDir:  z.enum(['asc', 'desc']).default('desc'),
});

// ─────────────────────────────────────────
// TASK
// ─────────────────────────────────────────

export const createTaskSchema = z.object({
  projectId:       z.string().uuid('Invalid project ID'),
  milestoneId:     z.string().uuid().optional(),
  parentId:        z.string().uuid().optional(),
  title:           z.string().min(1, 'Title is required').max(200).trim(),
  description:     z.string().max(5000).optional(),
  status:          z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional().default('TODO'),
  priority:        z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
  dueDate:         z.string().datetime().optional(),
  position:        z.number().optional().default(0),
  isClientVisible: z.boolean().optional().default(true),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const moveTaskSchema = z.object({
  status:   z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']),
  position: z.number().min(0),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000).trim(),
});

export const listTasksSchema = z.object({
  status:   z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsInput  = z.infer<typeof listProjectsSchema>;
export type CreateTaskInput    = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput    = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput      = z.infer<typeof moveTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
