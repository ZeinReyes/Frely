import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type { CreateClientInput, UpdateClientInput, ListClientsInput } from '../validators/clientValidators';

// ─────────────────────────────────────────
// LIST CLIENTS
// ─────────────────────────────────────────
export async function listClients(userId: string, input: ListClientsInput) {
  const { page, limit, search, status, sortBy, sortDir } = input;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status && { status }),
    ...(search && {
      OR: [
        { name:    { contains: search, mode: 'insensitive' as const } },
        { email:   { contains: search, mode: 'insensitive' as const } },
        { company: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      select: {
        id:          true,
        name:        true,
        email:       true,
        phone:       true,
        company:     true,
        avatarUrl:   true,
        status:      true,
        tags:        true,
        healthScore: true,
        createdAt:   true,
        _count: {
          select: {
            projects: true,
            invoices: true,
          },
        },
      },
    }),
    prisma.client.count({ where }),
  ]);

  return { clients, total };
}

// ─────────────────────────────────────────
// GET CLIENT BY ID
// ─────────────────────────────────────────
export async function getClientById(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    include: {
      _count: {
        select: {
          projects: true,
          invoices: true,
          files:    true,
        },
      },
    },
  });

  if (!client) throw AppError.notFound('Client not found');
  return client;
}

// ─────────────────────────────────────────
// CREATE CLIENT
// ─────────────────────────────────────────
export async function createClient(userId: string, input: CreateClientInput) {
  // Check for duplicate email within this user's clients
  const existing = await prisma.client.findFirst({
    where: { userId, email: input.email },
  });

  if (existing) {
    throw AppError.conflict('A client with this email already exists');
  }

  const client = await prisma.client.create({
    data: {
      userId,
      name:    input.name,
      email:   input.email,
      phone:   input.phone,
      company: input.company,
      notes:   input.notes,
      tags:    input.tags || [],
      status:  input.status || 'LEAD',
    },
  });

  return client;
}

// ─────────────────────────────────────────
// UPDATE CLIENT
// ─────────────────────────────────────────
export async function updateClient(
  userId: string,
  clientId: string,
  input: UpdateClientInput
) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  // If email is being changed, check for duplicates
  if (input.email && input.email !== client.email) {
    const existing = await prisma.client.findFirst({
      where: { userId, email: input.email, NOT: { id: clientId } },
    });
    if (existing) throw AppError.conflict('A client with this email already exists');
  }

  const updated = await prisma.client.update({
    where: { id: clientId },
    data:  input,
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE CLIENT
// ─────────────────────────────────────────
export async function deleteClient(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  await prisma.client.delete({ where: { id: clientId } });
}

// ─────────────────────────────────────────
// GET CLIENT PROJECTS
// ─────────────────────────────────────────
export async function getClientProjects(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  const projects = await prisma.project.findMany({
    where: { clientId, userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      name:        true,
      status:      true,
      startDate:   true,
      endDate:     true,
      budget:      true,
      createdAt:   true,
      _count: {
        select: { tasks: true },
      },
    },
  });

  return projects;
}

// ─────────────────────────────────────────
// GET CLIENT INVOICES
// ─────────────────────────────────────────
export async function getClientInvoices(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  const invoices = await prisma.invoice.findMany({
    where: { clientId, userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id:            true,
      invoiceNumber: true,
      title:         true,
      total:         true,
      currency:      true,
      status:        true,
      dueDate:       true,
      paidAt:        true,
      createdAt:     true,
    },
  });

  return invoices;
}

// ─────────────────────────────────────────
// REGENERATE PORTAL TOKEN
// ─────────────────────────────────────────
export async function regeneratePortalToken(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  const { v4: uuidv4 } = await import('uuid');

  const updated = await prisma.client.update({
    where: { id: clientId },
    data:  { portalToken: uuidv4() },
    select: { portalToken: true },
  });

  return updated;
}