/**
 * PDF generation via HTML template + puppeteer
 * Install: npm install puppeteer --save in apps/api
 */

interface ProposalPDFData {
  type:           'proposal';
  title:          string;
  number:         string;
  clientName:     string;
  clientEmail:    string;
  clientCompany?: string;
  freelancerName: string;
  brandColor?:    string;
  introduction?:  string;
  scope?:         string;
  lineItems:      { description: string; quantity: number; unitPrice: number; amount: number }[];
  subtotal:       number;
  total:          number;
  currency:       string;
  validUntil?:    string;
  terms?:         string;
  notes?:         string;
  createdAt:      string;
}

interface ContractPDFData {
  type:            'contract';
  title:           string;
  number:          string;
  clientName:      string;
  clientEmail:     string;
  clientCompany?:  string;
  freelancerName:  string;
  brandColor?:     string;
  body:            string;
  value?:          number;
  currency:        string;
  startDate?:      string;
  endDate?:        string;
  signatureName?:  string;
  signatureDate?:  string;
  signedAt?:       string;
  createdAt:       string;
}

type PDFData = ProposalPDFData | ContractPDFData;

function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─────────────────────────────────────────
// PROPOSAL
// ─────────────────────────────────────────
function generateProposalHTML(data: ProposalPDFData): string {
  const color = data.brandColor || '#6C63FF'; // ✅ declared here

  const lineItemsHTML = data.lineItems.map(item => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: right;">${formatCurrency(item.unitPrice, data.currency)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #f3f4f6; text-align: right; font-weight: 500;">${formatCurrency(item.amount, data.currency)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; padding: 48px; font-size: 14px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid ${color}; }
    .brand { font-size: 22px; font-weight: 800; color: ${color}; }
    .doc-type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; }
    .meta .number { font-size: 18px; font-weight: 700; color: #111827; }
    .meta .date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
    .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; }
    .party .name { font-weight: 600; font-size: 15px; }
    .party .detail { color: #6b7280; font-size: 13px; margin-top: 2px; }
    .section { margin-bottom: 28px; }
    .section h2 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #374151; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .section p { color: #4b5563; white-space: pre-wrap; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #f9fafb; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
    thead th:not(:first-child) { text-align: center; }
    thead th:last-child { text-align: right; }
    .totals { margin-left: auto; width: 240px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
    .total-row.final { border-top: 2px solid ${color}; border-bottom: none; padding-top: 10px; font-weight: 700; font-size: 15px; color: ${color}; }
    .valid-until { margin-top: 24px; padding: 12px 16px; background: #f0fdf4; border-radius: 8px; font-size: 13px; color: #166534; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${data.freelancerName}</div>
      <div class="doc-type">Proposal</div>
    </div>
    <div class="meta">
      <div class="number">${data.number}</div>
      <div class="date">Issued ${formatDate(data.createdAt)}</div>
      ${data.validUntil ? `<div class="date">Valid until ${formatDate(data.validUntil)}</div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>From</h3>
      <div class="name">${data.freelancerName}</div>
    </div>
    <div class="party">
      <h3>Prepared For</h3>
      <div class="name">${data.clientName}</div>
      ${data.clientCompany ? `<div class="detail">${data.clientCompany}</div>` : ''}
      <div class="detail">${data.clientEmail}</div>
    </div>
  </div>

  <div class="section">
    <h2>${data.title}</h2>
  </div>

  ${data.introduction ? `
  <div class="section">
    <h2>Introduction</h2>
    <p>${data.introduction}</p>
  </div>` : ''}

  ${data.scope ? `
  <div class="section">
    <h2>Scope of Work</h2>
    <p>${data.scope}</p>
  </div>` : ''}

  <div class="section">
    <h2>Pricing</h2>
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
      <div class="total-row final">
        <span>Total</span>
        <span>${formatCurrency(data.total, data.currency)}</span>
      </div>
    </div>
  </div>

  ${data.terms ? `
  <div class="section">
    <h2>Terms & Conditions</h2>
    <p>${data.terms}</p>
  </div>` : ''}

  ${data.notes ? `
  <div class="section">
    <h2>Notes</h2>
    <p>${data.notes}</p>
  </div>` : ''}

  ${data.validUntil ? `
  <div class="valid-until">
    ✓ This proposal is valid until ${formatDate(data.validUntil)}
  </div>` : ''}

  <div class="footer">Generated by Frely · ${data.number}</div>
</body>
</html>`;
}

// ─────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────
function generateContractHTML(data: ContractPDFData): string {
  const color = data.brandColor || '#6C63FF'; // ✅ declared here — was missing before

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: white; padding: 48px; font-size: 14px; line-height: 1.8; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid ${color}; }
    .brand { font-size: 22px; font-weight: 800; color: ${color}; }
    .doc-type { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-top: 2px; }
    .meta { text-align: right; }
    .meta .number { font-size: 18px; font-weight: 700; }
    .meta .date { font-size: 12px; color: #6b7280; margin-top: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .party h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin-bottom: 8px; }
    .party .name { font-weight: 600; }
    .party .detail { color: #6b7280; font-size: 13px; }
    .body { white-space: pre-wrap; color: #374151; margin-bottom: 32px; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; }
    .sig-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 12px; }
    .sig-name { font-size: 18px; font-family: Georgia, serif; font-style: italic; color: #111827; border-bottom: 1px solid #374151; padding-bottom: 4px; min-height: 32px; }
    .sig-date { font-size: 12px; color: #6b7280; margin-top: 6px; }
    .signed-badge { display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; margin-top: 8px; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">${data.freelancerName}</div>
      <div class="doc-type">Contract</div>
    </div>
    <div class="meta">
      <div class="number">${data.number}</div>
      <div class="date">Issued ${formatDate(data.createdAt)}</div>
    </div>
  </div>

  <div style="margin-bottom: 24px;">
    <h1 style="font-size: 22px; font-weight: 700; color: #111827;">${data.title}</h1>
    ${data.value ? `<p style="color: #6b7280; margin-top: 4px;">Contract Value: <strong style="color: #111827;">${formatCurrency(data.value, data.currency)}</strong></p>` : ''}
    ${data.startDate ? `<p style="color: #6b7280; margin-top: 2px; font-size: 13px;">Period: ${formatDate(data.startDate)}${data.endDate ? ` – ${formatDate(data.endDate)}` : ''}</p>` : ''}
  </div>

  <div class="parties">
    <div class="party">
      <h3>Service Provider</h3>
      <div class="name">${data.freelancerName}</div>
    </div>
    <div class="party">
      <h3>Client</h3>
      <div class="name">${data.clientName}</div>
      ${data.clientCompany ? `<div class="detail">${data.clientCompany}</div>` : ''}
      <div class="detail">${data.clientEmail}</div>
    </div>
  </div>

  <div class="body">${data.body}</div>

  <div class="signatures">
    <div class="sig-block">
      <h3>Service Provider</h3>
      <div class="sig-name">${data.freelancerName}</div>
      <div class="sig-date">${formatDate(data.createdAt)}</div>
    </div>
    <div class="sig-block">
      <h3>Client Signature</h3>
      ${data.signatureName
        ? `<div class="sig-name">${data.signatureName}</div>
           <div class="sig-date">${data.signatureDate ? formatDate(data.signatureDate) : ''}</div>
           <div class="signed-badge">✓ Digitally signed</div>`
        : `<div class="sig-name" style="color: #d1d5db;">Awaiting signature...</div>`
      }
    </div>
  </div>

  <div class="footer">Generated by Frely · ${data.number}</div>
</body>
</html>`;
}

// ─────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────
export async function generatePDF(data: PDFData): Promise<Buffer> {
  const puppeteer = await import('puppeteer').catch(() => null);

  if (!puppeteer) {
    throw new Error('PDF generation requires puppeteer: npm install puppeteer');
  }

  const html = data.type === 'proposal'
    ? generateProposalHTML(data as ProposalPDFData)
    : generateContractHTML(data as ContractPDFData);

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

export { generateProposalHTML, generateContractHTML };
export type { ProposalPDFData, ContractPDFData };