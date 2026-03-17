/**
 * Email service using Brevo (formerly Sendinblue)
 * Env vars needed:
 *   BREVO_API_KEY=your_api_key
 *   BREVO_FROM_NAME=Frely
 *   BREVO_FROM_EMAIL=noreply@frely.ph
 */
import logger from '../config/logger';

const BREVO_API_KEY = process.env.BREVO_API_KEY  || '';
const FROM_NAME     = process.env.BREVO_FROM_NAME  || 'Frely';
const FROM_EMAIL    = process.env.BREVO_FROM_EMAIL || 'noreply@frely.ph';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

interface SendEmailOptions {
  to:       string;
  subject:  string;
  html:     string;
  name?:    string;
  // Freelancer branding — when set, email appears to come from the freelancer
  fromName?: string;
  replyTo?:  string;
  attachment?: {
    name:    string;   // filename e.g. "PROP-2026-1234.pdf"
    content: string;   // base64 encoded content
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  name,
  fromName,
  replyTo,
  attachment,
}: SendEmailOptions): Promise<void> {
  if (!BREVO_API_KEY) {
    logger.warn(`Email skipped (no BREVO_API_KEY): ${subject} -> ${to}`);
    return;
  }
 
  const senderName = fromName ? `${fromName} via ${FROM_NAME}` : FROM_NAME;
 
  const payload: Record<string, unknown> = {
    sender:      { name: senderName, email: FROM_EMAIL },
    to:          [{ email: to, name: name || to }],
    subject,
    htmlContent: html,
  };
 
  if (replyTo) {
    payload.replyTo = { email: replyTo, name: fromName || FROM_NAME };
  }
 
  // Brevo accepts attachments as an array of { name, content } (base64)
  if (attachment) {
    payload.attachment = [{ name: attachment.name, content: attachment.content }];
  }
 
  try {
    const response = await fetch(BREVO_API_URL, {
      method:  'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
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

// ─────────────────────────────────────────
// INVOICE EMAIL
// ─────────────────────────────────────────
export async function sendInvoiceEmail(
  to: string,
  clientName: string,
  invoiceNumber: string,
  total: string,
  dueDate: string,
  paymentUrl: string,
  // Optional freelancer branding
  senderName?: string,
  senderEmail?: string,
  brandColor = '#6C63FF',
): Promise<void> {
  await sendEmail({
    to,
    name:     clientName,
    subject:  `Invoice ${invoiceNumber}`,
    fromName: senderName,
    replyTo:  senderEmail,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="background:${brandColor};padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${senderName || 'Frely'}</h1>
            ${senderEmail ? `<p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${senderEmail}</p>` : ''}
          </div>
          <div style="padding:32px;">
            <h2 style="color:#111827;margin:0 0 8px;">Invoice ${invoiceNumber}</h2>
            <p style="color:#6b7280;margin:0 0 20px;">Hi ${clientName}, you have a new invoice waiting for payment.</p>
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:24px;">
              <p style="margin:0;color:#6b7280;font-size:13px;">Amount due</p>
              <p style="margin:4px 0;font-size:24px;font-weight:700;color:${brandColor};">${total}</p>
              <p style="margin:0;color:#6b7280;font-size:13px;">Due: ${dueDate}</p>
            </div>
            <div style="text-align:center;">
              <a href="${paymentUrl}" style="display:inline-block;background:${brandColor};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                Pay Now
              </a>
            </div>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#ccc;font-size:11px;">
              Sent via <a href="https://frely.ph" style="color:#ccc;text-decoration:none;">Frely</a>
            </p>
          </div>
        </div>
      </body>
      </html>
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
  paymentUrl: string,
  senderName?: string,
  senderEmail?: string,
  brandColor = '#6C63FF',
): Promise<void> {
  const urgency = daysOverdue === 0 ? 'friendly' : daysOverdue <= 7 ? 'firm' : 'urgent';
  const subjects: Record<string, string> = {
    friendly: `Friendly reminder: Invoice ${invoiceNumber} is due today`,
    firm:     `Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
    urgent:   `Action required: Invoice ${invoiceNumber} is ${daysOverdue} days overdue`,
  };

  await sendEmail({
    to,
    name:     clientName,
    subject:  subjects[urgency],
    fromName: senderName,
    replyTo:  senderEmail,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="background:${brandColor};padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${senderName || 'Frely'}</h1>
            ${senderEmail ? `<p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${senderEmail}</p>` : ''}
          </div>
          <div style="padding:32px;">
            <h2 style="color:#111827;margin:0 0 8px;">Payment Reminder</h2>
            <p style="color:#6b7280;margin:0 0 16px;">Hi ${clientName},</p>
            <p style="color:#374151;margin:0 0 24px;">
              ${urgency === 'friendly'
                ? `Friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> is due today.`
                : `Invoice <strong>${invoiceNumber}</strong> for <strong>${total}</strong> is now <strong>${daysOverdue} days overdue</strong>.`
              }
            </p>
            <div style="text-align:center;">
              <a href="${paymentUrl}" style="display:inline-block;background:${brandColor};color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
                Pay Now
              </a>
            </div>
            <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              If you have already paid, please ignore this message.
            </p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#ccc;font-size:11px;">
              Sent via <a href="https://frely.ph" style="color:#ccc;text-decoration:none;">Frely</a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  });
}

// ─────────────────────────────────────────
// PROPOSAL EMAIL
// ─────────────────────────────────────────
export async function sendProposalEmail({
  to,
  clientName,
  senderName,
  senderEmail,
  title,
  total,
  currency,
  validUntil,
  pdfBuffer,
  proposalNumber,
  brandColor = '#6C63FF',
}: {
  to:             string;
  clientName:     string;
  senderName:     string;
  senderEmail:    string;
  title:          string;
  total:          number;
  currency:       string;
  validUntil?:    string;
  pdfBuffer:      Buffer;
  proposalNumber: string;
  brandColor?:    string;
}): Promise<void> {
  const formattedTotal = new Intl.NumberFormat('en-US', {
    style:    'currency',
    currency,
  }).format(total);

  const validUntilFormatted = validUntil
    ? new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  await sendEmail({
    to,
    name:     clientName,
    subject:  `Proposal from ${senderName}: ${title}`,
    fromName: senderName,
    replyTo:  senderEmail,
    // Attach the PDF — base64 encoded for Brevo
    attachment: {
      name:    `${proposalNumber}.pdf`,
      content: pdfBuffer.toString('base64'),
    },
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <div style="background:${brandColor};padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${senderName}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${senderEmail}</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 8px;color:#333;font-size:15px;">Hi ${clientName},</p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Please find the attached proposal for your review. Feel free to reply to this email if you have any questions.
            </p>

            <div style="border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Proposal</p>
              <p style="margin:0 0 12px;color:#111;font-size:16px;font-weight:600;">${title}</p>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#555;font-size:13px;">Total value</span>
                <span style="color:#111;font-size:18px;font-weight:700;">${formattedTotal}</span>
              </div>
              ${validUntilFormatted ? `
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f0f0f0;">
                <span style="color:#999;font-size:12px;">Valid until ${validUntilFormatted}</span>
              </div>` : ''}
            </div>

            <!-- PDF attachment notice -->
            <div style="background:#f9fafb;border:1px dashed #e5e7eb;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:600;">📎 ${proposalNumber}.pdf</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Proposal attached to this email</p>
            </div>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;text-align:center;">
              To accept or discuss this proposal, simply reply to this email.
            </p>
          </div>

          <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#ccc;font-size:11px;">
              Sent via <a href="https://frely.ph" style="color:#ccc;text-decoration:none;">Frely</a>
              &nbsp;·&nbsp; You received this because ${senderName} sent you a proposal
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  });
}

// ─────────────────────────────────────────
// CONTRACT EMAIL
// ─────────────────────────────────────────
export async function sendContractEmail({
  to,
  clientName,
  senderName,
  senderEmail,
  title,
  signingUrl,
  brandColor = '#6C63FF',
}: {
  to:          string;
  clientName:  string;
  senderName:  string;
  senderEmail: string;
  title:       string;
  signingUrl:  string;
  brandColor?: string;
}): Promise<void> {
  await sendEmail({
    to,
    name:     clientName,
    subject:  `Contract for your review: ${title}`,
    fromName: senderName,
    replyTo:  senderEmail,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <div style="background:${brandColor};padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${senderName}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${senderEmail}</p>
          </div>

          <div style="padding:32px;">
            <p style="margin:0 0 8px;color:#333;font-size:15px;">Hi ${clientName},</p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Please review and sign the contract below to get started.
            </p>

            <div style="border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:24px;">
              <p style="margin:0 0 4px;color:#999;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Contract</p>
              <p style="margin:0;color:#111;font-size:16px;font-weight:600;">${title}</p>
            </div>

            <div style="text-align:center;margin-bottom:16px;">
              <a href="${signingUrl}"
                 style="display:inline-block;padding:14px 32px;background:${brandColor};color:#fff;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
                Review &amp; Sign Contract
              </a>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;word-break:break-all;">
              Or open this link: <a href="${signingUrl}" style="color:${brandColor};">${signingUrl}</a>
            </p>
            <p style="color:#bbb;font-size:11px;text-align:center;margin-top:8px;">
              This link is unique to you — please do not share it.
            </p>
          </div>

          <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#ccc;font-size:11px;">
              Sent via <a href="https://frely.ph" style="color:#ccc;text-decoration:none;">Frely</a>
              &nbsp;·&nbsp; You received this because ${senderName} sent you a contract
            </p>
          </div>

        </div>
      </body>
      </html>
    `,
  });
}

export async function sendPortalWelcomeEmail({
  to,
  clientName,
  senderName,
  senderEmail,
  portalUrl,
  brandColor = '#6C63FF',
  pdfBuffer,
  contractNumber,
}: {
  to:              string;
  clientName:      string;
  senderName:      string;
  senderEmail:     string;
  portalUrl:       string;
  brandColor?:     string;
  pdfBuffer?:      Buffer;   // signed contract PDF
  contractNumber?: string;   // used as filename
}): Promise<void> {
  await sendEmail({
    to,
    name:     clientName,
    subject:  `Your project portal is ready`,
    fromName: senderName,
    replyTo:  senderEmail,
    ...(pdfBuffer && contractNumber && {
      attachment: {
        name:    `${contractNumber}-signed.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    }),
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
 
          <div style="background:${brandColor};padding:32px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${senderName}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${senderEmail}</p>
          </div>
 
          <div style="padding:32px;">
            <p style="margin:0 0 8px;color:#333;font-size:15px;">Hi ${clientName},</p>
            <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">
              Thank you for signing the contract! I've set up a dedicated project portal where you can
              track progress, view milestones, and stay updated throughout our project.
            </p>
 
            <!-- Portal CTA -->
            <div style="border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:16px;text-align:center;">
              <p style="margin:0 0 4px;color:#111;font-size:15px;font-weight:600;">Your Client Portal</p>
              <p style="margin:0 0 16px;color:#999;font-size:13px;">View project progress, milestones, and updates</p>
              <a href="${portalUrl}"
                 style="display:inline-block;padding:12px 28px;background:${brandColor};color:#fff;
                        border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
                Open My Portal
              </a>
            </div>
 
            <!-- PDF attachment notice (only shown when PDF is attached) -->
            ${pdfBuffer && contractNumber ? `
            <div style="background:#f9fafb;border:1px dashed #e5e7eb;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 4px;font-size:13px;color:#374151;font-weight:600;">📎 ${contractNumber}-signed.pdf</p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">Your signed contract is attached for your records</p>
            </div>` : ''}
 
            <p style="margin:0 0 8px;color:#999;font-size:12px;text-align:center;">
              Bookmark the portal link — it's your personal access to the project.
            </p>
            <p style="color:#bbb;font-size:12px;text-align:center;word-break:break-all;">
              <a href="${portalUrl}" style="color:${brandColor};">${portalUrl}</a>
            </p>
          </div>
 
          <div style="padding:20px 32px;border-top:1px solid #f0f0f0;text-align:center;">
            <p style="margin:0;color:#ccc;font-size:11px;">
              Sent via <a href="https://frely.ph" style="color:#ccc;text-decoration:none;">Frely</a>
              &nbsp;·&nbsp; Questions? Reply to this email
            </p>
          </div>
 
        </div>
      </body>
      </html>
    `,
  });
}