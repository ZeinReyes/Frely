import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import {
  scheduleReminders,
  sendManualReminder,
  cancelReminders,
} from '../jobs/reminderQueue';

// ─────────────────────────────────────────
// GET REMINDERS FOR INVOICE
// ─────────────────────────────────────────
export async function getInvoiceReminders(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');

  const reminders = await prisma.paymentReminder.findMany({
    where:   { invoiceId },
    orderBy: { createdAt: 'desc' },
  });

  return reminders;
}

// ─────────────────────────────────────────
// ENABLE AUTO REMINDERS FOR INVOICE
// ─────────────────────────────────────────
export async function enableReminders(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');
  if (!invoice.dueDate) throw AppError.badRequest('Invoice must have a due date to enable reminders');
  if (invoice.status === 'PAID') throw AppError.badRequest('Cannot enable reminders for a paid invoice');

  await scheduleReminders(invoiceId, invoice.dueDate);
  return { scheduled: true };
}

// ─────────────────────────────────────────
// DISABLE AUTO REMINDERS
// ─────────────────────────────────────────
export async function disableReminders(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');

  await cancelReminders(invoiceId);
  return { cancelled: true };
}

// ─────────────────────────────────────────
// SEND MANUAL REMINDER NOW
// ─────────────────────────────────────────
export async function sendReminder(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
  if (!invoice) throw AppError.notFound('Invoice not found');
  if (invoice.status === 'PAID') throw AppError.badRequest('Invoice is already paid');

  await sendManualReminder(invoiceId);
  return { queued: true };
}

// ─────────────────────────────────────────
// GET ALL REMINDER STATS
// ─────────────────────────────────────────
export async function getReminderStats(userId: string) {
  const invoices = await prisma.invoice.findMany({
    where: { userId, status: { in: ['SENT', 'OVERDUE'] } },
    include: { reminders: true },
  });

  return {
    pendingPayment: invoices.length,
    withReminders:  invoices.filter(i => i.reminders.length > 0).length,
    overdue:        invoices.filter(i => i.status === 'OVERDUE').length,
  };
}
