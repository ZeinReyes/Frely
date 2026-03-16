import cloudinary from '../config/cloudinary';
import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type { UpdateFileInput, ListFilesInput } from '../validators/fileValidators';
import type { UploadedFile } from 'express-fileupload';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip',
  'video/mp4', 'video/quicktime',
];

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

// ─────────────────────────────────────────
// LIST FILES
// ─────────────────────────────────────────
export async function listFiles(userId: string, input: ListFilesInput) {
  const { projectId, clientId } = input;

  // Verify ownership
  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw AppError.notFound('Project not found');
  }
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
    if (!client) throw AppError.notFound('Client not found');
  }

  const files = await prisma.file.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(clientId  && { clientId }),
    },
    orderBy: { createdAt: 'desc' },
  });

  return files;
}

// ─────────────────────────────────────────
// UPLOAD FILE
// ─────────────────────────────────────────
export async function uploadFile(
  userId: string,
  file: UploadedFile,
  projectId?: string,
  clientId?: string,
  isClientVisible = true
) {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw AppError.badRequest(`File type ${file.mimetype} is not allowed`);
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    throw AppError.badRequest('File size exceeds the 50MB limit');
  }

  // Verify ownership
  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw AppError.notFound('Project not found');
  }
  if (clientId) {
    const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
    if (!client) throw AppError.notFound('Client not found');
  }

  // Upload to Cloudinary
  const folder = projectId
    ? `Frely/${userId}/projects/${projectId}`
    : `Frely/${userId}/clients/${clientId}`;

  const result = await cloudinary.uploader.upload(file.tempFilePath || file.data.toString('base64'), {
    folder,
    resource_type: 'auto',
    use_filename:  true,
    unique_filename: true,
  });

  // Save to database
  const savedFile = await prisma.file.create({
    data: {
      projectId:       projectId  || null,
      clientId:        clientId   || null,
      name:            file.name,
      cloudinaryId:    result.public_id,
      cloudinaryUrl:   result.secure_url,
      mimeType:        file.mimetype,
      size:            file.size,
      uploadedBy:      userId,
      isClientVisible,
    },
  });

  return savedFile;
}

// ─────────────────────────────────────────
// UPDATE FILE
// ─────────────────────────────────────────
export async function updateFile(
  userId: string,
  fileId: string,
  input: UpdateFileInput
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedBy: userId },
  });

  if (!file) throw AppError.notFound('File not found');

  const updated = await prisma.file.update({
    where: { id: fileId },
    data:  input,
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE FILE
// ─────────────────────────────────────────
export async function deleteFile(userId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedBy: userId },
  });

  if (!file) throw AppError.notFound('File not found');

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(file.cloudinaryId, { resource_type: 'auto' });
  } catch {
    // Log but don't fail if Cloudinary deletion fails
    console.warn('Failed to delete from Cloudinary:', file.cloudinaryId);
  }

  await prisma.file.delete({ where: { id: fileId } });
}

// ─────────────────────────────────────────
// GET FILE BY ID
// ─────────────────────────────────────────
export async function getFileById(userId: string, fileId: string) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedBy: userId },
  });

  if (!file) throw AppError.notFound('File not found');
  return file;
}
