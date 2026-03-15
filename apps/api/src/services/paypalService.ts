/**
 * PayPal Invoicing API integration
 * Docs: https://developer.paypal.com/docs/invoicing/
 *
 * Env vars needed:
 *   PAYPAL_CLIENT_ID=...
 *   PAYPAL_CLIENT_SECRET=...
 *   PAYPAL_MODE=sandbox  (or "live")
 */

const PAYPAL_MODE       = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_CLIENT_ID  = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || '';

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// ─────────────────────────────────────────
// GET ACCESS TOKEN
// ─────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env');
  }

  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// ─────────────────────────────────────────
// CREATE PAYPAL INVOICE
// ─────────────────────────────────────────
export interface PayPalInvoiceInput {
  invoiceNumber: string;
  clientName:    string;
  clientEmail:   string;
  lineItems:     { description: string; quantity: number; unitPrice: number }[];
  currency:      string;
  taxRate?:      number;
  discount?:     number;
  dueDate?:      string;
  notes?:        string;
  freelancerName:  string;
  freelancerEmail: string;
}

export interface PayPalInvoiceResult {
  paypalInvoiceId: string;
  paymentUrl:      string;
}

export async function createPayPalInvoice(input: PayPalInvoiceInput): Promise<PayPalInvoiceResult> {
  const token = await getAccessToken();

  // Build invoice payload
  const payload: Record<string, unknown> = {
    detail: {
      invoice_number: input.invoiceNumber,
      reference:      input.invoiceNumber,
      invoice_date:   new Date().toISOString().split('T')[0],
      currency_code:  input.currency,
      note:           input.notes || '',
      payment_term: input.dueDate
        ? { term_type: 'DUE_ON_DATE', due_date: input.dueDate.split('T')[0] }
        : { term_type: 'NET_30' },
    },
    invoicer: {
      name:  { full_name: input.freelancerName },
      email_address: input.freelancerEmail,
    },
    primary_recipients: [
      {
        billing_info: {
          name:          { full_name: input.clientName },
          email_address: input.clientEmail,
        },
      },
    ],
    items: input.lineItems.map(item => ({
      name:      item.description,
      quantity:  String(item.quantity),
      unit_amount: {
        currency_code: input.currency,
        value:         item.unitPrice.toFixed(2),
      },
    })),
    configuration: {
      allow_tip:             false,
      tax_calculated_after_discount: true,
    },
  };

  // Add tax if provided
  if (input.taxRate && input.taxRate > 0) {
    (payload as Record<string, unknown>).items = (payload.items as Record<string, unknown>[]).map(item => ({
      ...item,
      tax: {
        name:    'Tax',
        percent: String(input.taxRate),
      },
    }));
  }

  // Add discount if provided
  if (input.discount && input.discount > 0) {
    payload.configuration = {
      ...(payload.configuration as object),
      discount: {
        invoice_discount: {
          amount: {
            currency_code: input.currency,
            value:         input.discount.toFixed(2),
          },
        },
      },
    };
  }

  // Create draft invoice
  const createRes = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`PayPal invoice creation failed: ${err}`);
  }

  const createdInvoice = await createRes.json() as { href: string };
  // Extract invoice ID from href
  const invoiceId = createdInvoice.href.split('/').pop() as string;

  // Send the invoice
  await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${invoiceId}/send`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ send_to_invoicer: true }),
  });

  // Get invoice details for payment URL
  const detailRes = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${invoiceId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const detail = await detailRes.json() as {
    id: string;
    detail: { metadata: { payer_view_url: string } };
  };

  const paymentUrl = detail?.detail?.metadata?.payer_view_url
    || `https://www.paypal.com/invoice/p/#${invoiceId}`;

  return { paypalInvoiceId: invoiceId, paymentUrl };
}

// ─────────────────────────────────────────
// CANCEL PAYPAL INVOICE
// ─────────────────────────────────────────
export async function cancelPayPalInvoice(paypalInvoiceId: string): Promise<void> {
  const token = await getAccessToken();

  await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${paypalInvoiceId}/cancel`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({ subject: 'Invoice cancelled', note: 'This invoice has been cancelled.' }),
  });
}

// ─────────────────────────────────────────
// GET PAYPAL INVOICE STATUS
// ─────────────────────────────────────────
export async function getPayPalInvoiceStatus(paypalInvoiceId: string): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYPAL_BASE_URL}/v2/invoicing/invoices/${paypalInvoiceId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to fetch PayPal invoice status');

  const data = await res.json() as { status: string };
  return data.status;
}
