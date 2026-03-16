import { Queue, Worker, Job } from 'bullmq';
import prisma from '../config/database';
import { sendEmail } from '../services/emailService';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
};

// ─────────────────────────────────────────
// QUEUE
// ─────────────────────────────────────────
export const reminderQueue = new Queue('payment-reminders', { connection });

// ─────────────────────────────────────────
// REMINDER TYPES
// ─────────────────────────────────────────
export type ReminderType =
  | 'DUE_SOON'       // 3 days before due
  | 'DUE_TODAY'      // on due date
  | 'OVERDUE_7'      // 7 days overdue
  | 'OVERDUE_14'     // 14 days overdue
  | 'MANUAL';        // manually triggered

const REMINDER_SUBJECTS: Record<ReminderType, string> = {
  DUE_SOON:   'Invoice due in 3 days',
  DUE_TODAY:  'Invoice due today',
  OVERDUE_7:  'Invoice 7 days overdue',
  OVERDUE_14: 'Invoice 14 days overdue — action required',
  MANUAL:     'Payment reminder',
};

// ─────────────────────────────────────────
// SEND REMINDER EMAIL
// ─────────────────────────────────────────
async function sendReminderEmail(
  invoice: {
    id:            string;
    invoiceNumber: string;
    title:         string;
    total:         number;
    currency:      string;
    dueDate?:      Date | null;
    stripePaymentUrl?: string | null;
    client: { name: string; email: string };
  },
  type: ReminderType,
  freelancerName: string
) {
  const subject = REMINDER_SUBJECTS[type];
  const payLink = invoice.stripePaymentUrl
    ? `<p style="margin-top:16px"><a href="${invoice.stripePaymentUrl}" style="background:#6C63FF;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Pay Now</a></p>`
    : '';

  const dueText = invoice.dueDate
    ? `Due date: <strong>${new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong><br/>`
    : '';

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: invoice.currency,
  }).format(Number(invoice.total));

  const html = `
    <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111827">
      <div style="font-size:20px;font-weight:800;color:#6C63FF;margin-bottom:24px">Frely</div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:8px">${subject}</h2>
      <p style="color:#6b7280;margin-bottom:24px">Hi ${invoice.client.name},</p>
      <p style="color:#374151;margin-bottom:16px">
        This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> from <strong>${freelancerName}</strong> is pending payment.
      </p>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px">
        <p style="margin:0;font-size:14px;color:#6b7280">${invoice.title}</p>
        <p style="margin:4px 0 8px;font-size:22px;font-weight:700;color:#6C63FF">${amount}</p>
        <p style="margin:0;font-size:13px;color:#6b7280">${dueText}Invoice: ${invoice.invoiceNumber}</p>
      </div>
      ${payLink}
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">
        If you have already paid, please disregard this message. Contact ${freelancerName} if you have any questions.
      </p>
    </div>
  `;

  await sendEmail({
    to:      invoice.client.email,
    subject: `${subject} — ${invoice.invoiceNumber}`,
    html,
  });
}

// ─────────────────────────────────────────
// WORKER
// ─────────────────────────────────────────
export function startReminderWorker() {
  const worker = new Worker(
    'payment-reminders',
    async (job: Job) => {
      const { invoiceId, type } = job.data as { invoiceId: string; type: ReminderType };

      const invoice = await prisma.invoice.findUnique({
        where:   { id: invoiceId },
        include: { client: true, user: { select: { name: true, email: true } } },
      });

      if (!invoice || ['PAID', 'CANCELLED'].includes(invoice.status)) {
        return { skipped: true };
      }

      const alreadySent = await prisma.paymentReminder.findFirst({
        where: { invoiceId, type },
      });
      if (alreadySent) return { skipped: true, reason: 'already sent' };

      await sendReminderEmail(
        {
          id:              invoice.id,
          invoiceNumber:   invoice.invoiceNumber,
          title:           invoice.title,
          total:           Number(invoice.total),
          currency:        invoice.currency,
          dueDate:         invoice.dueDate,
          stripePaymentUrl: invoice.stripePaymentUrl,
          client:          { name: invoice.client.name, email: invoice.client.email },
        },
        type,
        invoice.user.name
      );

      await prisma.paymentReminder.create({
        data: { invoiceId, type, sentAt: new Date() },
      });

      return { sent: true };
    },
    { connection }
  );

  worker.on('failed', (job, err) => {
    console.error(`Reminder job ${job?.id} failed:`, err.message);
  });

  console.log('✅ Payment reminder worker started');
  return worker;
}

// ─────────────────────────────────────────
// SCHEDULE REMINDERS FOR AN INVOICE
// ─────────────────────────────────────────
export async function scheduleReminders(invoiceId: string, dueDate: Date) {
  const now = Date.now();

  const schedules: { type: ReminderType; delay: number }[] = [
    { type: 'DUE_SOON',   delay: Math.max(0, dueDate.getTime() - 3 * 24 * 60 * 60 * 1000 - now) },
    { type: 'DUE_TODAY',  delay: Math.max(0, dueDate.getTime() - now) },
    { type: 'OVERDUE_7',  delay: Math.max(0, dueDate.getTime() + 7 * 24 * 60 * 60 * 1000 - now) },
    { type: 'OVERDUE_14', delay: Math.max(0, dueDate.getTime() + 14 * 24 * 60 * 60 * 1000 - now) },
  ];

  for (const schedule of schedules) {
    if (schedule.delay >= 0) {
      await reminderQueue.add(
        `reminder-${invoiceId}-${schedule.type}`,
        { invoiceId, type: schedule.type },
        {
          delay:    schedule.delay,
          jobId:    `${invoiceId}-${schedule.type}`,
          attempts: 3,
          backoff:  { type: 'exponential', delay: 5000 },
        }
      );
    }
  }
}

// ─────────────────────────────────────────
// SEND MANUAL REMINDER
// ─────────────────────────────────────────
export async function sendManualReminder(invoiceId: string) {
  await reminderQueue.add(
    `manual-${invoiceId}`,
    { invoiceId, type: 'MANUAL' as ReminderType },
    { attempts: 3 }
  );
}

// ─────────────────────────────────────────
// CANCEL SCHEDULED REMINDERS
// ─────────────────────────────────────────
export async function cancelReminders(invoiceId: string) {
  const types: ReminderType[] = ['DUE_SOON', 'DUE_TODAY', 'OVERDUE_7', 'OVERDUE_14'];
  for (const type of types) {
    const job = await reminderQueue.getJob(`${invoiceId}-${type}`);
    if (job) await job.remove();
  }
}

// ─────────────────────────────────────────
// DAILY OVERDUE SWEEP
// ─────────────────────────────────────────
export async function sweepOverdueInvoices() {
  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: 'SENT', dueDate: { lt: new Date() } },
  });

  for (const invoice of overdueInvoices) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data:  { status: 'OVERDUE' },
    });
  }

  console.log(`Swept ${overdueInvoices.length} overdue invoices`);
  return overdueInvoices.length;
}