import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),
  timezone: z.string().optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
