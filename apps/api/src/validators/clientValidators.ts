import { z } from 'zod';

export const createClientSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email:   z.string().email('Invalid email address').toLowerCase(),
  phone:   z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  notes:   z.string().max(1000).optional(),
  tags:    z.array(z.string()).optional().default([]),
  status:  z.enum(['LEAD', 'PROPOSAL_SENT', 'ACTIVE', 'COMPLETED', 'INACTIVE']).optional().default('LEAD'),
});

export const updateClientSchema = createClientSchema.partial();

export const listClientsSchema = z.object({
  page:    z.coerce.number().min(1).default(1),
  limit:   z.coerce.number().min(1).max(100).default(20),
  search:  z.string().optional(),
  status:  z.enum(['LEAD', 'PROPOSAL_SENT', 'ACTIVE', 'COMPLETED', 'INACTIVE']).optional(),
  sortBy:  z.enum(['name', 'createdAt', 'healthScore', 'status']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsInput  = z.infer<typeof listClientsSchema>;