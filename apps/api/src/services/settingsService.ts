import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ─────────────────────────────────────────
// GET USER PROFILE
// ─────────────────────────────────────────
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id:        true,
      name:      true,
      email:     true,
      fullName:  true,
      timezone:  true,
      plan:      true,
      role:      true,
      image:     true,
      createdAt: true,
    },
  });
  if (!user) throw AppError.notFound('User not found');
  return user;
}

// ─────────────────────────────────────────
// UPDATE USER PROFILE
// ─────────────────────────────────────────
export async function updateProfile(
  userId: string,
  input: { name?: string; fullName?: string; timezone?: string; image?: string }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  input,
    select: {
      id:        true,
      name:      true,
      email:     true,
      fullName:  true,
      timezone:  true,
      plan:      true,
      image:     true,
    },
  });
  return user;
}

// ─────────────────────────────────────────
// GET BRANDING
// ─────────────────────────────────────────
export async function getBranding(userId: string) {
  const branding = await prisma.branding.findUnique({
    where: { userId },
  });
  return branding;
}

// ─────────────────────────────────────────
// UPDATE BRANDING
// ─────────────────────────────────────────
export async function updateBranding(
  userId: string,
  input: {
    companyName?:  string;
    primaryColor?: string;
    logoUrl?:      string;
    faviconUrl?:   string;
  }
) {
  const branding = await prisma.branding.upsert({
    where:  { userId },
    create: { userId, ...input },
    update: input,
  });
  return branding;
}

// ─────────────────────────────────────────
// GET PAYMENT SETTINGS
// ─────────────────────────────────────────
export async function getPaymentSettings(userId: string) {
  // Stored as metadata on user or separate table
  // For now return from a simple key-value approach
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true },
  });
  if (!user) throw AppError.notFound('User not found');

  // We'll store payment settings in branding metadata
  const branding = await prisma.branding.findUnique({ where: { userId } });

  return {
    paypalClientId:     (branding as Record<string, unknown> | null)?.paypalClientId     as string || '',
    paypalClientSecret: (branding as Record<string, unknown> | null)?.paypalClientSecret as string || '',
    paypalMode:         (branding as Record<string, unknown> | null)?.paypalMode         as string || 'sandbox',
    paypalEmail:        (branding as Record<string, unknown> | null)?.paypalEmail        as string || '',
    paymongoPublicKey:  (branding as Record<string, unknown> | null)?.paymongoPublicKey  as string || '',
    paymongoSecretKey:  (branding as Record<string, unknown> | null)?.paymongoSecretKey  as string || '',
  };
}

// ─────────────────────────────────────────
// UPDATE PAYMENT SETTINGS
// ─────────────────────────────────────────
export async function updatePaymentSettings(
  userId: string,
  input: {
    paypalClientId?:     string;
    paypalClientSecret?: string;
    paypalMode?:         string;
    paypalEmail?:        string;
    paymongoPublicKey?:  string;
    paymongoSecretKey?:  string;
  }
) {
  // Store alongside branding
  const branding = await prisma.branding.upsert({
    where:  { userId },
    create: { userId, ...(input as Record<string, unknown>) },
    update: input as Record<string, unknown>,
  });
  return { success: true };
}