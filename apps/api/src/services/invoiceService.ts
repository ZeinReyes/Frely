import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { generateInvoicePDF } from '../utils/invoicePdfGenerator';
import { createPayPalInvoice, cancelPayPalInvoice } from './paypalService';
import { scheduleReminders, cancelReminders } from '../jobs/reminderQueue';
import type { CreateInvoiceInput, UpdateInvoiceInput } from '../validators/invoiceValidators';

function generateNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${year}-${rand}`;
}

function calcTotals(
  lineItems: { amount: number }[],
  taxRate: number,
  discount: number
) {
  const subtotal  = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discounted = subtotal - discount;
  const taxAmount = (discounted * taxRate) / 100;
  const total     = discounted + taxAmount;
  return { subtotal, taxAmount, total };
}

// ─────────────────────────────────────────
// LIST
// ─────────────────────────────────────────
export async function listInvoices(userId: string, filters?: {
  clientId?: string;
  status?:   string;
  projectId?: string;
}) {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      ...(filters?.clientId  && { clientId:  filters.clientId }),
      ...(filters?.status    && { status:    filters.status as never }),
      ...(filters?.projectId && { projectId: filters.projectId }),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      client:  { select: { id: true, name: true, email: true, company: true } },
      project: { select: { id: true, name: true } },
    },
  });

  // Auto-mark overdue
  const now = new Date();
  const updated = await Promise.all(
    invoices.map(async (inv) => {
      if (
        inv.status === 'SENT' &&
        inv.dueDate &&
        new Date(inv.dueDate) < now
      ) {
        return prisma.invoice.update({
          where: { id: inv.id },
          data:  { status: 'OVERDUE' },
          include: {
            client:  { select: { id: true, name: true, email: true, company: true } },
            project: { select: { id: true, name: true } },
          },
        });
      }
      return inv;
    })
  );

  return updated;
}

// ─────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────
export async function getInvoiceById(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    include: {
      client:    { select: { id: true, name: true, email: true, company: true } },
      project:   { select: { id: true, name: true } },
      milestone: { select: { id: true, title: true } },
      payments:  true,
    },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');
  return invoice;
}

// ─────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────
export async function createInvoice(userId: string, input: CreateInvoiceInput) {
  const client = await prisma.client.findFirst({ where: { id: input.clientId, userId } });
  if (!client) throw AppError.notFound('Client not found');

  const taxRate  = input.taxRate  || 0;
  const discount = input.discount || 0;
  const { subtotal, taxAmount, total } = calcTotals(input.lineItems, taxRate, discount);

  const invoice = await prisma.invoice.create({
    data: {
      userId,
      clientId:     input.clientId,
      projectId:    input.projectId,
      milestoneId:  input.milestoneId,
      invoiceNumber: generateNumber(),
      title:        input.title,
      lineItems:    input.lineItems as never,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      currency:     input.currency || 'USD',
      status:       'DRAFT',
      dueDate:      input.dueDate ? new Date(input.dueDate) : undefined,
      notes:        input.notes,
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });

  return invoice;
}

// ─────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────
export async function updateInvoice(
  userId: string,
  invoiceId: string,
  input: UpdateInvoiceInput
) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw AppError.notFound('Invoice not found');
  if (invoice.status !== 'DRAFT') throw AppError.badRequest('Only draft invoices can be edited');

  const taxRate  = input.taxRate  ?? Number(invoice.taxRate);
  const discount = input.discount ?? Number(invoice.discount);
  const lineItems = input.lineItems || invoice.lineItems as { amount: number }[];
  const { subtotal, taxAmount, total } = calcTotals(lineItems, taxRate, discount);

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      ...input,
      lineItems: input.lineItems as never,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      total,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// SEND (mark as sent)
// ─────────────────────────────────────────
export async function sendInvoice(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where:   { id: invoiceId, userId },
    include: { client: true },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { status: 'SENT' },
  });

  // Auto-schedule reminders if due date set
  if (invoice.dueDate) {
    await scheduleReminders(invoiceId, invoice.dueDate).catch(() => {});
  }

  return updated;
}

// ─────────────────────────────────────────
// SEND VIA PAYPAL
// ─────────────────────────────────────────
export async function sendInvoiceViaPayPal(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where:   { id: invoiceId, userId },
    include: { client: true },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');
  if (invoice.status !== 'DRAFT') throw AppError.badRequest('Invoice already sent');

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true },
  });

  const lineItems = invoice.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[];

  const result = await createPayPalInvoice({
    invoiceNumber:   invoice.invoiceNumber,
    clientName:      invoice.client.name,
    clientEmail:     invoice.client.email,
    lineItems:       lineItems.map(i => ({
      description: i.description,
      quantity:    i.quantity,
      unitPrice:   i.unitPrice,
    })),
    currency:        invoice.currency,
    taxRate:         Number(invoice.taxRate),
    discount:        Number(invoice.discount),
    dueDate:         invoice.dueDate?.toISOString(),
    notes:           invoice.notes || undefined,
    freelancerName:  user?.name  || 'Freelancer',
    freelancerEmail: user?.email || '',
  });

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status:          'SENT',
      stripeInvoiceId: result.paypalInvoiceId, // reusing field for PayPal ID
      stripePaymentUrl: result.paymentUrl,
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// MARK AS PAID
// ─────────────────────────────────────────
export async function markInvoicePaid(userId: string, invoiceId: string, paidAt?: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw AppError.notFound('Invoice not found');

  await cancelReminders(invoiceId).catch(() => {});

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    },
    include: {
      client: { select: { id: true, name: true, email: true, company: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────
export async function deleteInvoice(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId } });
  if (!invoice) throw AppError.notFound('Invoice not found');
  if (invoice.status === 'PAID') throw AppError.badRequest('Cannot delete a paid invoice');
  await prisma.invoice.delete({ where: { id: invoiceId } });
}

// ─────────────────────────────────────────
// GET PDF
// ─────────────────────────────────────────
export async function getInvoicePDF(userId: string, invoiceId: string): Promise<Buffer> {
  const invoice = await prisma.invoice.findFirst({
    where:   { id: invoiceId, userId },
    include: { client: true },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true, email: true },
  });

  const lineItems = invoice.lineItems as {
    description: string; quantity: number; unitPrice: number; amount: number;
  }[];

  return generateInvoicePDF({
    invoiceNumber:   invoice.invoiceNumber,
    title:           invoice.title,
    clientName:      invoice.client.name,
    clientEmail:     invoice.client.email,
    clientCompany:   invoice.client.company || undefined,
    freelancerName:  user?.name  || 'Freelancer',
    freelancerEmail: user?.email || '',
    lineItems,
    subtotal:        Number(invoice.subtotal),
    taxRate:         Number(invoice.taxRate),
    taxAmount:       Number(invoice.taxAmount),
    discount:        Number(invoice.discount),
    total:           Number(invoice.total),
    currency:        invoice.currency,
    status:          invoice.status,
    dueDate:         invoice.dueDate?.toISOString(),
    paidAt:          invoice.paidAt?.toISOString(),
    notes:           invoice.notes || undefined,
    paymentUrl:      invoice.stripePaymentUrl || undefined,
    createdAt:       invoice.createdAt.toISOString(),
  });
}

// ─────────────────────────────────────────
// GET STATS
// ─────────────────────────────────────────
export async function getInvoiceStats(userId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { userId },
    select: { status: true, total: true, currency: true },
  });

  const stats = {
    total:     invoices.length,
    draft:     invoices.filter(i => i.status === 'DRAFT').length,
    sent:      invoices.filter(i => i.status === 'SENT').length,
    paid:      invoices.filter(i => i.status === 'PAID').length,
    overdue:   invoices.filter(i => i.status === 'OVERDUE').length,
    totalPaid: invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.total), 0),
    totalPending: invoices
      .filter(i => ['SENT', 'OVERDUE'].includes(i.status))
      .reduce((sum, i) => sum + Number(i.total), 0),
  };

  return stats;
}
