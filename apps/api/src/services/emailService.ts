import { Resend } from 'resend';
import logger from '../config/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `${process.env.RESEND_FROM_NAME || 'Vyrn'} <${process.env.RESEND_FROM_EMAIL || 'noreply@vyrn.app'}>`;

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<void> {
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Failed to send email:', { to, subject, error });
    throw error;
  }
}

// ─────────────────────────────────────────
// INVOICE EMAIL
// ─────────────────────────────────────────

export async function sendInvoiceEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  total: string,
  dueDate: string,
  paymentUrl: string
): Promise<void> {
  await sendEmail({
    to,
    subject: `Invoice ${invoiceNumber} from Vyrn`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 0;">
        <h2 style="color: #111827;">Invoice ${invoiceNumber}</h2>
        <p style="color: #6B7280;">Hi ${clientName}, you have a new invoice waiting for payment.</p>
        <p style="color: #111827; font-size: 24px; font-weight: 700;">${total}</p>
        <p style="color: #6B7280;">Due: ${dueDate}</p>
        <a href="${paymentUrl}" style="display: inline-block; background: #6C63FF; color: #FFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Pay Now
        </a>
      </div>
    `,
  });
}

// ─────────────────────────────────────────
// PAYMENT REMINDER EMAIL
// ─────────────────────────────────────────

export async function sendPaymentReminderEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  total: string,
  daysOverdue: number,
  paymentUrl: string
): Promise<void> {
  const urgency = daysOverdue === 0
    ? 'friendly'
    : daysOverdue <= 7
    ? 'firm'
    : 'urgent';

  const subjects: Record<string, string> = {
    friendly: `Friendly reminder: Invoice ${invoiceNumber} is due today`,
    firm: `Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
    urgent: `Action required: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
  };

  await sendEmail({
    to,
    subject: subjects[urgency],
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 0;">
        <h2 style="color: #111827;">Payment Reminder</h2>
        <p style="color: #6B7280;">Hi ${clientName},</p>
        <p style="color: #6B7280;">
          ${urgency === 'friendly'
            ? `This is a friendly reminder that invoice ${invoiceNumber} for ${total} is due today.`
            : `Invoice ${invoiceNumber} for ${total} is now ${daysOverdue} days overdue.`
          }
        </p>
        <a href="${paymentUrl}" style="display: inline-block; background: #6C63FF; color: #FFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Pay Now
        </a>
      </div>
    `,
  });
}
