import prisma from '../config/database';
import { notifyContractSigned } from './notificationService';
import { Decimal } from '@prisma/client/runtime/library';
import { AppError } from '../utils/AppError';
import { generatePDF } from '../utils/pdfGenerator';
import { sendContractEmail, sendPortalWelcomeEmail, sendInvoiceEmail } from './emailService';
import { scheduleReminders } from '../jobs/reminderQueue';
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
// HELPERS
// ─────────────────────────────────────────
async function sendInvoiceNow(
  invoice: { id: string; invoiceNumber: string; dueDate: Date | null; currency: string; total: Decimal | string | number; title: string },
  client:  { email: string; name: string },
  userId:  string,
  amount:  number,
  dueLabel?: string,
  context?: {
    projectName?:     string;
    milestoneName?:   string;
    paymentSchedule?: string;
    invoiceTitle?:    string;
  },
) {
  const [user, branding] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.branding.findUnique({ where: { userId } }),
  ]);

  const formattedTotal = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: invoice.currency,
  }).format(amount);

  const formattedDue = dueLabel ?? (invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Upon receipt');

  await sendInvoiceEmail(
    client.email,
    client.name,
    invoice.invoiceNumber,
    formattedTotal,
    formattedDue,
    `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
    branding?.companyName || user?.name || 'Freelancer',
    user?.email ?? 'noreply@frely.ph',
    branding?.primaryColor || '#6C63FF',
    context ?? { invoiceTitle: invoice.title },
  ).catch(() => {});

  // Only schedule reminders if due date is more than 1 hour in the future
  if (invoice.dueDate) {
    const due     = new Date(invoice.dueDate);
    const oneHour = 60 * 60 * 1000;
    if (due.getTime() > Date.now() + oneHour) {
      await scheduleReminders(invoice.id, due).catch(() => {});
    }
  }
}

// ─────────────────────────────────────────
// LIST CONTRACTS
// ─────────────────────────────────────────
export async function listContracts(userId: string, clientId?: string) {
  return prisma.contract.findMany({
    where:   { userId, ...(clientId && { clientId }) },
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });
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
    where:   { signToken },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
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

  return prisma.contract.create({
    data: {
      userId,
      clientId:          input.clientId,
      projectId:         input.projectId,
      proposalId:        input.proposalId,
      contractNumber:    generateNumber('CONTRACT'),
      signToken:         uuidv4(),
      title:             input.title,
      body:              input.body,
      currency:          input.currency || 'USD',
      value:             input.value,
      startDate:         input.startDate ? new Date(input.startDate) : undefined,
      endDate:           input.endDate   ? new Date(input.endDate)   : undefined,
      status:            'DRAFT',
      paymentSchedule:   input.paymentSchedule,
      depositPercent:    input.depositPercent,
      paymentMilestones: input.paymentMilestones as never,
    },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });
}

// ─────────────────────────────────────────
// UPDATE CONTRACT
// ─────────────────────────────────────────
export async function updateContract(userId: string, contractId: string, input: UpdateContractInput) {
  const contract = await prisma.contract.findFirst({ where: { id: contractId, userId } });
  if (!contract) throw AppError.notFound('Contract not found');
  if (contract.status === 'SIGNED') throw AppError.badRequest('Cannot edit a signed contract');

  return prisma.contract.update({
    where: { id: contractId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:   input.endDate   ? new Date(input.endDate)   : undefined,
    },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });
}

// ─────────────────────────────────────────
// SEND CONTRACT
// ─────────────────────────────────────────
export async function sendContract(userId: string, contractId: string) {
  const contract = await prisma.contract.findFirst({
    where:   { id: contractId, userId },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });
  if (!contract) throw AppError.notFound('Contract not found');

  const updated = await prisma.contract.update({
    where: { id: contractId },
    data:  { status: 'SENT', sentAt: new Date() },
  });

  const [user, branding] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.branding.findUnique({ where: { userId } }),
  ]);

  const APP_URL    = process.env.NEXT_PUBLIC_APP_URL || 'https://frely.ph';
  const signingUrl = `${APP_URL}/sign/${contract.signToken}`;

  await sendContractEmail({
    to:          contract.client.email,
    clientName:  contract.client.name,
    senderName:  branding?.companyName || user?.name || 'Freelancer',
    senderEmail: user?.email ?? 'noreply@frely.ph',
    title:       contract.title,
    signingUrl,
    brandColor:  branding?.primaryColor || '#6C63FF',
  }).catch(() => {});

  return updated;
}

// ─────────────────────────────────────────
// SIGN CONTRACT (client action via sign token)
// ─────────────────────────────────────────
export async function signContract(signToken: string, input: SignContractInput) {
  const contract = await prisma.contract.findFirst({
    where:   { signToken },
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });
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
    include: { client: { select: { id: true, name: true, email: true, company: true } } },
  });

  // ── Auto-create project ──────────────────────────────────────────
  const project = await prisma.project.create({
    data: {
      userId:      updated.userId,
      clientId:    updated.clientId,
      name:        updated.title,
      description: `Auto-created from contract ${updated.contractNumber}`,
      status:      'ACTIVE',
      startDate:   updated.startDate ?? new Date(),
      endDate:     updated.endDate   ?? undefined,
      budget:      updated.value     ?? undefined,
    },
  });

  const milestones = updated.paymentMilestones as
    | { label: string; percent: number; dueOn?: string }[]
    | null;

  const parseDueOn = (dueOn?: string): Date | undefined => {
    if (!dueOn || dueOn === 'signing' || dueOn === 'completion') return undefined;
    const d = new Date(dueOn);
    return isNaN(d.getTime()) ? undefined : d;
  };

  // ── MILESTONE ────────────────────────────────────────────────────
  if (updated.paymentSchedule === 'MILESTONE' && milestones?.length) {

    // Deposit on signing
    if (updated.depositPercent && updated.depositPercent > 0) {
      const depositAmount  = (Number(updated.value ?? 0) * updated.depositPercent) / 100;
      const depositInvoice = await prisma.invoice.create({
        data: {
          userId:        updated.userId,
          clientId:      updated.clientId,
          projectId:     project.id,
          invoiceNumber: generateNumber('INV'),
          title:         `${updated.title} — Deposit (${updated.depositPercent}%)`,
          lineItems:     [{ description: `Deposit (${updated.depositPercent}%)`, quantity: 1, unitPrice: depositAmount, amount: depositAmount }],
          subtotal:      depositAmount,
          taxRate:       0,
          taxAmount:     0,
          discount:      0,
          total:         depositAmount,
          currency:      updated.currency,
          status:        'SENT',
          sentAt:        new Date(),
          dueDate:       new Date(),
        },
      });
      await sendInvoiceNow(
        depositInvoice,
        updated.client,
        updated.userId,
        depositAmount,
        'Upon signing',
        {
          projectName:     project.name,
          paymentSchedule: 'MILESTONE',
          invoiceTitle:    depositInvoice.title,
        },
      );
    }

    // Milestone invoices — sent when milestone is completed
    for (const [i, ms] of milestones.entries()) {
      const milestone = await prisma.milestone.create({
        data: {
          projectId:   project.id,
          title:       ms.label,
          description: `${ms.percent}% — ${ms.label}`,
          dueDate:     parseDueOn(ms.dueOn),
          status:      i === 0 ? 'IN_PROGRESS' : 'PENDING',
          order:       i,
        },
      });

      const milestoneAmount = updated.value ? (Number(updated.value) * ms.percent) / 100 : 0;
      const dueDate         = ms.dueOn === 'completion' ? updated.endDate ?? undefined : parseDueOn(ms.dueOn);

      await prisma.invoice.create({
        data: {
          userId:        updated.userId,
          clientId:      updated.clientId,
          projectId:     project.id,
          milestoneId:   milestone.id,
          invoiceNumber: generateNumber('INV'),
          title:         `${updated.title} — ${ms.label}`,
          lineItems:     [{ description: ms.label, quantity: 1, unitPrice: milestoneAmount, amount: milestoneAmount }],
          subtotal:      milestoneAmount,
          taxRate:       0,
          taxAmount:     0,
          discount:      0,
          total:         milestoneAmount,
          currency:      updated.currency,
          status:        'DRAFT',
          dueDate:       dueDate ?? undefined,
        },
      });
    }

  // ── UPFRONT ──────────────────────────────────────────────────────
  } else if (updated.paymentSchedule === 'UPFRONT' || !updated.paymentSchedule) {
    const amount  = Number(updated.value ?? 0);
    const invoice = await prisma.invoice.create({
      data: {
        userId:        updated.userId,
        clientId:      updated.clientId,
        projectId:     project.id,
        invoiceNumber: generateNumber('INV'),
        title:         updated.title,
        lineItems:     [{ description: `As per contract ${updated.contractNumber}`, quantity: 1, unitPrice: amount, amount }],
        subtotal:      amount,
        taxRate:       0,
        taxAmount:     0,
        discount:      0,
        total:         amount,
        currency:      updated.currency,
        status:        'SENT',
        sentAt:        new Date(),
        dueDate:       updated.startDate ?? new Date(),
      },
    });
    await sendInvoiceNow(
      invoice,
      updated.client,
      updated.userId,
      amount,
      undefined,
      {
        projectName:     project.name,
        paymentSchedule: 'UPFRONT',
        invoiceTitle:    invoice.title,
      },
    );

  // ── SPLIT_50_50 ───────────────────────────────────────────────────
  } else if (updated.paymentSchedule === 'SPLIT_50_50') {
    const half   = Number(updated.value ?? 0) / 2;
    const splits = [
      { label: 'Deposit (50%)',       dueDate: updated.startDate ?? new Date(), sendNow: true  },
      { label: 'Final payment (50%)', dueDate: updated.endDate   ?? undefined,  sendNow: false },
    ];

    for (const split of splits) {
      const invoice = await prisma.invoice.create({
        data: {
          userId:        updated.userId,
          clientId:      updated.clientId,
          projectId:     project.id,
          invoiceNumber: generateNumber('INV'),
          title:         `${updated.title} — ${split.label}`,
          lineItems:     [{ description: split.label, quantity: 1, unitPrice: half, amount: half }],
          subtotal:      half,
          taxRate:       0,
          taxAmount:     0,
          discount:      0,
          total:         half,
          currency:      updated.currency,
          status:        split.sendNow ? 'SENT' : 'DRAFT',
          sentAt:        split.sendNow ? new Date() : undefined,
          dueDate:       split.dueDate ? new Date(split.dueDate) : undefined,
        },
      });
      if (split.sendNow) {
        await sendInvoiceNow(
          invoice,
          updated.client,
          updated.userId,
          half,
          undefined,
          {
            projectName:     project.name,
            paymentSchedule: 'SPLIT_50_50',
            invoiceTitle:    invoice.title,
          },
        );
      }
    }

  // ── CUSTOM ────────────────────────────────────────────────────────
  } else if (updated.paymentSchedule === 'CUSTOM' && updated.depositPercent) {
    const depositAmount   = (Number(updated.value ?? 0) * updated.depositPercent) / 100;
    const remainingAmount = Number(updated.value ?? 0) - depositAmount;

    const invoices = [
      { label: `Deposit (${updated.depositPercent}%)`, amount: depositAmount,   dueDate: updated.startDate ?? new Date(), sendNow: true  },
      { label: 'Remaining balance',                     amount: remainingAmount, dueDate: updated.endDate   ?? undefined,  sendNow: false },
    ];

    for (const inv of invoices) {
      const invoice = await prisma.invoice.create({
        data: {
          userId:        updated.userId,
          clientId:      updated.clientId,
          projectId:     project.id,
          invoiceNumber: generateNumber('INV'),
          title:         `${updated.title} — ${inv.label}`,
          lineItems:     [{ description: inv.label, quantity: 1, unitPrice: inv.amount, amount: inv.amount }],
          subtotal:      inv.amount,
          taxRate:       0,
          taxAmount:     0,
          discount:      0,
          total:         inv.amount,
          currency:      updated.currency,
          status:        inv.sendNow ? 'SENT' : 'DRAFT',
          sentAt:        inv.sendNow ? new Date() : undefined,
          dueDate:       inv.dueDate ? new Date(inv.dueDate) : undefined,
        },
      });
      if (inv.sendNow) {
        await sendInvoiceNow(
          invoice,
          updated.client,
          updated.userId,
          inv.amount,
          undefined,
          {
            projectName:     project.name,
            paymentSchedule: 'CUSTOM',
            invoiceTitle:    invoice.title,
          },
        );
      }
    }
  }

  // ── Branding + PDF + welcome email ───────────────────────────────
  const [user, branding, pdfBuffer] = await Promise.all([
    prisma.user.findUnique({ where: { id: updated.userId }, select: { name: true, email: true } }),
    prisma.branding.findUnique({ where: { userId: updated.userId } }),
    getContractPDF(updated.userId, updated.id).catch(() => undefined),
  ]);

  const APP_URL      = process.env.NEXT_PUBLIC_APP_URL || 'https://frely.ph';
  const clientRecord = await prisma.client.findUnique({
    where:  { id: updated.clientId },
    select: { portalToken: true },
  });

  const portalUrl  = `${APP_URL}/portal/${clientRecord?.portalToken}`;
  const senderName = branding?.companyName || user?.name || 'Freelancer';

  await notifyContractSigned(updated.userId, {
    id:            updated.id,
    title:         updated.title,
    signatureName: updated.signatureName || input.signatureName,
  }).catch(() => {});

  await sendPortalWelcomeEmail({
    to:             updated.client.email,
    clientName:     updated.client.name,
    senderName,
    senderEmail:    user?.email ?? 'noreply@frely.ph',
    portalUrl,
    brandColor:     branding?.primaryColor || '#6C63FF',
    pdfBuffer,
    contractNumber: updated.contractNumber,
  }).catch(() => {});

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
    where:   { id: contractId, userId },
    include: { client: true },
  });
  if (!contract) throw AppError.notFound('Contract not found');

  const [user, branding] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.branding.findUnique({ where: { userId } }),
  ]);

  const freelancerName = branding?.companyName || user?.name || 'Freelancer';

  return generatePDF({
    type:           'contract',
    title:          contract.title,
    number:         contract.contractNumber,
    clientName:     contract.client.name,
    clientEmail:    contract.client.email,
    clientCompany:  contract.client.company || undefined,
    freelancerName,
    brandColor:     branding?.primaryColor || undefined,
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
}