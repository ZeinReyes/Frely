function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export interface InvoicePDFData {
  invoiceNumber:   string;
  title:           string;
  clientName:      string;
  clientEmail:     string;
  clientCompany?:  string;
  freelancerName:  string;
  freelancerEmail: string;
  lineItems:       { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal:        number;
  taxRate:         number;
  taxAmount:       number;
  discount:        number;
  total:           number;
  currency:        string;
  status:          string;
  dueDate?:        string;
  paidAt?:         string;
  notes?:          string;
  paymentUrl?:     string;
  createdAt:       string;
}

export function generateInvoiceHTML(data: InvoicePDFData): string {
  const lineItemsHTML = data.lineItems.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(item.unitPrice, data.currency)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${formatCurrency(item.amount, data.currency)}</td>
    </tr>
  `).join('');

  const statusColor = data.status === 'PAID'
    ? '#16a34a' : data.status === 'OVERDUE'
    ? '#dc2626' : '#6C63FF';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; padding: 48px; font-size: 14px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #6C63FF; }
    .brand { font-size: 22px; font-weight: 800; color: #6C63FF; }
    .doc-type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; }
    .meta .number { font-size: 18px; font-weight: 700; }
    .meta .date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background: ${statusColor}20; color: ${statusColor}; margin-top: 6px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; }
    .party .name { font-weight: 600; font-size: 15px; }
    .party .detail { color: #6b7280; font-size: 13px; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #f9fafb; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    .totals { margin-left: auto; width: 260px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    .total-row.final { border-top: 2px solid #6C63FF; border-bottom: none; padding-top: 10px; font-weight: 700; font-size: 16px; color: #6C63FF; }
    .due-box { margin-top: 24px; padding: 14px 16px; background: #fef9c3; border-radius: 8px; font-size: 13px; display: flex; justify-content: space-between; }
    .paid-box { margin-top: 24px; padding: 14px 16px; background: #f0fdf4; border-radius: 8px; font-size: 13px; color: #166534; }
    .payment-link { margin-top: 20px; padding: 14px 16px; background: #eff6ff; border-radius: 8px; font-size: 12px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${data.freelancerName}</div>
      <div class="doc-type">Invoice</div>
    </div>
    <div class="meta">
      <div class="number">${data.invoiceNumber}</div>
      <div class="date">Issued ${formatDate(data.createdAt)}</div>
      ${data.dueDate ? `<div class="date">Due ${formatDate(data.dueDate)}</div>` : ''}
      <div class="status-badge">${data.status}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <div class="name">${data.freelancerName}</div>
      <div class="detail">${data.freelancerEmail}</div>
    </div>
    <div class="party">
      <h3>Bill To</h3>
      <div class="name">${data.clientName}</div>
      ${data.clientCompany ? `<div class="detail">${data.clientCompany}</div>` : ''}
      <div class="detail">${data.clientEmail}</div>
    </div>
  </div>

  <h2 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #111827;">${data.title}</h2>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>${lineItemsHTML}</tbody>
  </table>

  <div class="totals">
    <div class="total-row">
      <span>Subtotal</span>
      <span>${formatCurrency(data.subtotal, data.currency)}</span>
    </div>
    ${data.discount > 0 ? `
    <div class="total-row">
      <span>Discount</span>
      <span>-${formatCurrency(data.discount, data.currency)}</span>
    </div>` : ''}
    ${data.taxRate > 0 ? `
    <div class="total-row">
      <span>Tax (${data.taxRate}%)</span>
      <span>${formatCurrency(data.taxAmount, data.currency)}</span>
    </div>` : ''}
    <div class="total-row final">
      <span>Total Due</span>
      <span>${formatCurrency(data.total, data.currency)}</span>
    </div>
  </div>

  ${data.status === 'PAID' && data.paidAt ? `
  <div class="paid-box">
    ✓ Paid in full on ${formatDate(data.paidAt)}
  </div>` : data.dueDate ? `
  <div class="due-box">
    <span>Payment due</span>
    <strong>${formatDate(data.dueDate)}</strong>
  </div>` : ''}

  ${data.paymentUrl ? `
  <div class="payment-link">
    <strong style="color: #1d4ed8;">Pay online:</strong>
    <span style="color: #1d4ed8; margin-left: 8px;">${data.paymentUrl}</span>
  </div>` : ''}

  ${data.notes ? `
  <div style="margin-top: 24px;">
    <h3 style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 6px;">Notes</h3>
    <p style="font-size: 13px; color: #4b5563;">${data.notes}</p>
  </div>` : ''}

  <div class="footer">Generated by Vyrn · ${data.invoiceNumber}</div>
</body>
</html>`;
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);
  if (!puppeteer) throw new Error('PDF generation requires puppeteer: npm install puppeteer');

  const html    = generateInvoiceHTML(data);
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format:          'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
