import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { generatePDF } from '../utils/pdfGenerator';
import type {
  CreateContractInput,
  UpdateContractInput,
  SignContractInput,
} from '../validators/proposalValidators';

function generateNumber(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${rand}`;
}

// ─────────────────────────────────────────
// LIST CONTRACTS
// ─────────────────────────────────────────
export async function listContracts(userId: string, clientId?: string) {
  const contracts = await prisma.contract.findMany({
    where: { userId, ...(clientId && { clientId }) },
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return contracts;
}

// ─────────────────────────────────────────
// GET CONTRACT BY ID
// ─────────────────────────────────────────
export async function getContractById(userId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, userId },
    include: {
      client:   { select: { id: true, name: true, email: true, company: true } },
      project:  { select: { id: true, name: true } },
      proposal: { select: { id: true, proposalNumber: true, title: true } },
    },
  });
  if (!contract) throw AppError.notFound('Contract not found');
  return contract;
}

// ─────────────────────────────────────────
// GET CONTRACT BY SIGN TOKEN (public)
// ─────────────────────────────────────────
export async function getContractBySignToken(signToken: string) {
  const contract = await prisma.contract.findFirst({
    where: { signToken },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  if (!contract) throw AppError.notFound('Contract not found');
  return contract;
}

// ─────────────────────────────────────────
// CREATE CONTRACT
// ─────────────────────────────────────────
export async function createContract(userId: string, input: CreateContractInput) {
  const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
  if (!client) throw AppError.notFound('Client not found');

  const { v4: uuidv4 } = await import('uuid');

  const contract = await prisma.contract.create({
    data: {
      userId,
      clientId:       input.clientId,
      projectId:      input.projectId,
      proposalId:     input.proposalId,
      contractNumber: generateNumber('CONTRACT'),
      signToken:      uuidv4(),
      title:          input.title,
      body:           input.body,
      currency:       input.currency || 'USD',
      value:          input.value,
      startDate:      input.startDate ? new Date(input.startDate) : undefined,
      endDate:        input.endDate   ? new Date(input.endDate)   : undefined,
      status:         'DRAFT',
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return contract;
}

// ─────────────────────────────────────────
// UPDATE CONTRACT
// ─────────────────────────────────────────
export async function updateContract(
  userId: string,
  contractId: string,
  input: UpdateContractInput
) {
  const contract = await prisma.contract.findFirst({ where: { id: contractId, userId } });
  if (!contract) throw AppError.notFound('Contract not found');
  if (contract.status === 'SIGNED') throw AppError.badRequest('Cannot edit a signed contract');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:   input.endDate   ? new Date(input.endDate)   : undefined,
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return updated;
}

// ─────────────────────────────────────────
// SEND CONTRACT
// ─────────────────────────────────────────
export async function sendContract(userId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({ where: { id: contractId, userId } });
  if (!contract) throw AppError.notFound('Contract not found');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data:  { status: 'SENT', sentAt: new Date() },
  });
  return updated;
}

// ─────────────────────────────────────────
// SIGN CONTRACT (client action via sign token)
// ─────────────────────────────────────────
export async function signContract(signToken: string, input: SignContractInput) {
  const contract = await prisma.contract.findFirst({ where: { signToken } });
  if (!contract) throw AppError.notFound('Contract not found');
  if (contract.status === 'SIGNED') throw AppError.badRequest('Contract already signed');

  const updated = await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status:        'SIGNED',
      signatureName: input.signatureName,
      signatureDate: input.signatureDate ? new Date(input.signatureDate) : new Date(),
      signedAt:      new Date(),
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });
  return updated;
}

// ─────────────────────────────────────────
// DELETE CONTRACT
// ─────────────────────────────────────────
export async function deleteContract(userId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({ where: { id: contractId, userId } });
  if (!contract) throw AppError.notFound('Contract not found');
  await prisma.contract.delete({ where: { id: contractId } });
}

// ─────────────────────────────────────────
// GENERATE CONTRACT PDF
// ─────────────────────────────────────────
export async function getContractPDF(userId: string, contractId: string): Promise<Buffer> {
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, userId },
    include: { client: true },
  });
  if (!contract) throw AppError.notFound('Contract not found');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

  const pdf = await generatePDF({
    type:           'contract',
    title:          contract.title,
    number:         contract.contractNumber,
    clientName:     contract.client.name,
    clientEmail:    contract.client.email,
    clientCompany:  contract.client.company || undefined,
    freelancerName: user?.name || 'Freelancer',
    body:           contract.body,
    value:          contract.value ? Number(contract.value) : undefined,
    currency:       contract.currency,
    startDate:      contract.startDate?.toISOString(),
    endDate:        contract.endDate?.toISOString(),
    signatureName:  contract.signatureName || undefined,
    signatureDate:  contract.signatureDate?.toISOString(),
    signedAt:       contract.signedAt?.toISOString(),
    createdAt:      contract.createdAt.toISOString(),
  });

  return pdf;
}
