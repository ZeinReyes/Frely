import { z } from 'zod';

export const uploadFileSchema = z.object({
  projectId:      z.string().uuid().optional(),
  clientId:       z.string().uuid().optional(),
  isClientVisible: z.boolean().optional().default(true),
}).refine(
  (d) => d.projectId || d.clientId,
  { message: 'Either projectId or clientId is required' }
);

export const updateFileSchema = z.object({
  name:            z.string().min(1).max(200).optional(),
  isClientVisible: z.boolean().optional(),
});

export const listFilesSchema = z.object({
  projectId: z.string().uuid().optional(),
  clientId:  z.string().uuid().optional(),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type ListFilesInput  = z.infer<typeof listFilesSchema>;
