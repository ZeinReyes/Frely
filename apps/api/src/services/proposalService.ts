import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { generatePDF } from '../utils/pdfGenerator';
import { sendProposalEmail } from './emailService';
import type {
  CreateProposalInput,
  UpdateProposalInput,
} from '../validators/proposalValidators';

function generateNumber(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${rand}`;
}

// ─────────────────────────────────────────
// LIST PROPOSALS
// ─────────────────────────────────────────
export async function listProposals(userId: string, clientId?: string) {
  const proposals = await prisma.proposal.findMany({
    where:   { userId, ...(clientId && { clientId }) },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return proposals;
}

// ─────────────────────────────────────────
// GET PROPOSAL BY ID
// ─────────────────────────────────────────
export async function getProposalById(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where:   { id: proposalId, userId },
    include: {
      client:  { select: { id: true, name: true, email: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });
  if (!proposal) throw AppError.notFound('Proposal not found');
  return proposal;
}

// ─────────────────────────────────────────
// CREATE PROPOSAL
// ─────────────────────────────────────────
export async function createProposal(userId: string, input: CreateProposalInput) {
  const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
  if (!client) throw AppError.notFound('Client not found');

  const total = input.lineItems.reduce((sum, item) => sum + item.amount, 0);

  const proposal = await prisma.proposal.create({
    data: {
      userId,
      clientId:       input.clientId,
      projectId:      input.projectId,
      proposalNumber: generateNumber('PROP'),
      title:          input.title,
      introduction:   input.introduction,
      scope:          input.scope,
      terms:          input.terms,
      lineItems:      input.lineItems as never,
      subtotal:       total,
      total,
      currency:       input.currency || 'USD',
      validUntil:     input.validUntil ? new Date(input.validUntil) : undefined,
      notes:          input.notes,
      status:         'DRAFT',
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });

  return proposal;
}

// ─────────────────────────────────────────
// UPDATE PROPOSAL
// ─────────────────────────────────────────
export async function updateProposal(
  userId: string,
  proposalId: string,
  input: UpdateProposalInput
) {
  const proposal = await prisma.proposal.findFirst({ where: { id: proposalId, userId } });
  if (!proposal) throw AppError.notFound('Proposal not found');
  if (proposal.status !== 'DRAFT') throw AppError.badRequest('Only draft proposals can be edited');

  const total = input.lineItems
    ? input.lineItems.reduce((sum, item) => sum + item.amount, 0)
    : undefined;

  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      ...input,
      lineItems:  input.lineItems as never,
      subtotal:   total,
      total,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return updated;
}

// ─────────────────────────────────────────
// SEND PROPOSAL
// ─────────────────────────────────────────
export async function sendProposal(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where:   { id: proposalId, userId },
    include: { client: true },
  });
  if (!proposal) throw AppError.notFound('Proposal not found');
  if (!proposal.client.email) throw AppError.badRequest('Client has no email address');
 
  // Fetch freelancer branding
  const [user, branding] = await Promise.all([
    prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true },
    }),
    prisma.branding.findUnique({
      where:  { userId },
      select: { companyName: true, primaryColor: true },
    }),
  ]);
 
  const senderName  = branding?.companyName || user?.name || 'Your Freelancer';
  const senderEmail = user?.email           || '';
  const brandColor  = branding?.primaryColor || '#6C63FF';
 
  // Generate the PDF to attach
  const pdfBuffer = await generatePDF({
    type:          'proposal',
    title:         proposal.title,
    number:        proposal.proposalNumber,
    clientName:    proposal.client.name,
    clientEmail:   proposal.client.email,
    clientCompany: proposal.client.company || undefined,
    freelancerName: senderName,
    brandColor,
    introduction:  proposal.introduction || undefined,
    scope:         proposal.scope        || undefined,
    lineItems:     proposal.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[],
    subtotal:      Number(proposal.subtotal),
    total:         Number(proposal.total),
    currency:      proposal.currency,
    validUntil:    proposal.validUntil?.toISOString(),
    terms:         proposal.terms  || undefined,
    notes:         proposal.notes  || undefined,
    createdAt:     proposal.createdAt.toISOString(),
  });
 
  // Send email with PDF attached — no platform link
  await sendProposalEmail({
    to:             proposal.client.email,
    clientName:     proposal.client.name,
    senderName,
    senderEmail,
    title:          proposal.title,
    total:          Number(proposal.total),
    currency:       proposal.currency,
    validUntil:     proposal.validUntil?.toISOString(),
    pdfBuffer,
    proposalNumber: proposal.proposalNumber,
    brandColor,
  });
 
  // Mark proposal as sent
  const updated = await prisma.proposal.update({
    where: { id: proposalId },
    data:  { status: 'SENT', sentAt: new Date() },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
 
  // Auto-upgrade client status: LEAD → PROPOSAL_SENT only (never downgrade)
  await prisma.client.updateMany({
    where: { id: proposal.clientId, userId, status: 'LEAD' },
    data:  { status: 'PROPOSAL_SENT' },
  });
 
  return updated;
}

// ─────────────────────────────────────────
// DELETE PROPOSAL
// ─────────────────────────────────────────
export async function deleteProposal(userId: string, proposalId: string) {
  const proposal = await prisma.proposal.findFirst({ where: { id: proposalId, userId } });
  if (!proposal) throw AppError.notFound('Proposal not found');
  await prisma.proposal.delete({ where: { id: proposalId } });
}

// ─────────────────────────────────────────
// GENERATE PROPOSAL PDF
// ─────────────────────────────────────────
export async function getProposalPDF(userId: string, proposalId: string): Promise<Buffer> {
  const proposal = await prisma.proposal.findFirst({
    where:   { id: proposalId, userId },
    include: { client: true },
  });
  if (!proposal) throw AppError.notFound('Proposal not found');

  const [user, branding] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.branding.findUnique({ where: { userId } }),
  ]);

  const freelancerName = branding?.companyName || user?.name || 'Freelancer';

  const pdf = await generatePDF({
    type:          'proposal',
    title:         proposal.title,
    number:        proposal.proposalNumber,
    clientName:    proposal.client.name,
    clientEmail:   proposal.client.email,
    clientCompany: proposal.client.company || undefined,
    freelancerName,
    brandColor:    branding?.primaryColor || undefined,
    introduction:  proposal.introduction  || undefined,
    scope:         proposal.scope         || undefined,
    lineItems:     proposal.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[],
    subtotal:      Number(proposal.subtotal),
    total:         Number(proposal.total),
    currency:      proposal.currency,
    validUntil:    proposal.validUntil?.toISOString(),
    terms:         proposal.terms  || undefined,
    notes:         proposal.notes  || undefined,
    createdAt:     proposal.createdAt.toISOString(),
  });

  return pdf;
}