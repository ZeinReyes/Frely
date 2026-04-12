import prisma from '../config/database';
import { sendInvoiceEmail } from '../services/emailService';
import { scheduleReminders } from './reminderQueue';
import logger from '../config/logger';

export async function sendDueInvoices() {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dueInvoices = await prisma.invoice.findMany({
    where: {
      status:  'DRAFT',
      dueDate: { lte: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    },
    include: {
      client: { select: { name: true, email: true } },
      user:   { select: { name: true, email: true } },
    },
  });

  for (const invoice of dueInvoices) {
    try {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data:  { status: 'SENT' },
      });

      const branding = await prisma.branding.findUnique({
        where: { userId: invoice.userId },
      });

      const formattedTotal = new Intl.NumberFormat('en-US', {
        style:    'currency',
        currency: invoice.currency,
      }).format(Number(invoice.total));

      const formattedDue = invoice.dueDate
        ? new Date(invoice.dueDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
          })
        : 'Upon receipt';

      await sendInvoiceEmail(
        invoice.client.email,
        invoice.client.name,
        invoice.invoiceNumber,
        formattedTotal,
        formattedDue,
        `${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}`,
        branding?.companyName || invoice.user.name,
        invoice.user.email,
        branding?.primaryColor || '#6C63FF',
      );

      // Auto-schedule reminders now that invoice is sent
      if (invoice.dueDate) {
        await scheduleReminders(invoice.id, invoice.dueDate).catch(() => {});
      }

      logger.info(`Auto-sent invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
    } catch (err) {
      logger.error(`Failed to auto-send invoice ${invoice.id}:`, err);
    }
  }
}