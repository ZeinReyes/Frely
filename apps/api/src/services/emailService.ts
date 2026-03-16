/**
 * Email service using Brevo (formerly Sendinblue)
 * Env vars needed:
 *   BREVO_API_KEY=your_api_key
 *   BREVO_FROM_NAME=Your Name
 *   BREVO_FROM_EMAIL=you@yourdomain.com
 */
import logger from '../config/logger';

const BREVO_API_KEY  = process.env.BREVO_API_KEY || '';
const FROM_NAME      = process.env.BREVO_FROM_NAME  || 'Frely';
const FROM_EMAIL     = process.env.BREVO_FROM_EMAIL || 'noreply@Frely.app';
const BREVO_API_URL  = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailOptions {
  to:      string;
  subject: string;
  html:    string;
  name?:   string;
}

export async function sendEmail({ to, subject, html, name }: SendEmailOptions): Promise<void> {
  if (!BREVO_API_KEY) {
    logger.warn(`Email skipped (no BREVO_API_KEY): ${subject} -> ${to}`);
    return;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method:  'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to:     [{ email: to, name: name || to }],
        subject,
        htmlContent: html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Brevo API error: ${err}`);
    }

    logger.info(`Email sent via Brevo to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Failed to send email via Brevo:', { to, subject, error });
    throw error;
  }
}

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
    name:    clientName,
    subject: `Invoice ${invoiceNumber}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 0;">
        <div style="font-size:20px;font-weight:800;color:#6C63FF;margin-bottom:24px">Frely</div>
        <h2 style="color:#111827;margin-bottom:8px">Invoice ${invoiceNumber}</h2>
        <p style="color:#6b7280;">Hi ${clientName}, you have a new invoice waiting for payment.</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:20px 0;">
          <p style="margin:0;color:#6b7280;font-size:13px">Amount due</p>
          <p style="margin:4px 0;font-size:24px;font-weight:700;color:#6C63FF">${total}</p>
          <p style="margin:0;color:#6b7280;font-size:13px">Due: ${dueDate}</p>
        </div>
        <a href="${paymentUrl}" style="display:inline-block;background:#6C63FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Pay Now</a>
      </div>
    `,
  });
}

export async function sendPaymentReminderEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  total: string,
  daysOverdue: number,
  paymentUrl: string
): Promise<void> {
  const urgency = daysOverdue === 0 ? 'friendly' : daysOverdue <= 7 ? 'firm' : 'urgent';
  const subjects: Record<string, string> = {
    friendly: `Friendly reminder: Invoice ${invoiceNumber} is due today`,
    firm:     `Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
    urgent:   `Action required: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
  };

  await sendEmail({
    to,
    name:    clientName,
    subject: subjects[urgency],
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:40px 0;">
        <div style="font-size:20px;font-weight:800;color:#6C63FF;margin-bottom:24px">Frely</div>
        <h2 style="color:#111827;">Payment Reminder</h2>
        <p style="color:#6b7280;">Hi ${clientName},</p>
        <p style="color:#374151;">
          ${urgency === 'friendly'
            ? `Friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> is due today.`
            : `Invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> is now <strong>${daysOverdue} days overdue</strong>.`
          }
        </p>
        <a href="${paymentUrl}" style="display:inline-block;background:#6C63FF;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Pay Now</a>
        <p style="margin-top:24px;font-size:12px;color:#9ca3af;">If you have already paid, please ignore this message.</p>
      </div>
    `,
  });
}