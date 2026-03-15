'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Download, Trash2, Receipt, Pencil,
  User, Building2, CheckCircle2, ExternalLink,
  Copy, Check, AlertCircle, Calendar,
} from 'lucide-react';
import {
  useInvoice, useSendInvoice, useSendInvoicePayPal,
  useMarkInvoicePaid, useDeleteInvoice, invoicesApi,
} from '@/hooks/useInvoices';
import { ReminderPanel } from '@/components/ui/ReminderPanel';
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function InvoiceDetailPage() {
  const { id }    = useParams<{ id: string }>();
  const router    = useRouter();
  const [showDelete,  setShowDelete]  = useState(false);
  const [showPaid,    setShowPaid]    = useState(false);
  const [copiedLink,  setCopiedLink]  = useState(false);

  const { data, isLoading } = useInvoice(id);
  const sendInvoice         = useSendInvoice();
  const sendPayPal          = useSendInvoicePayPal();
  const markPaid            = useMarkInvoicePaid();
  const deleteInvoice       = useDeleteInvoice();

  const invoice = data?.invoice;

  const handleDelete = async () => {
    await deleteInvoice.mutateAsync(id);
    router.push('/invoices');
  };

  const copyPaymentLink = () => {
    if (!invoice?.stripePaymentUrl) return;
    navigator.clipboard.writeText(invoice.stripePaymentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) {
    return <div className="page-container text-center py-20"><p className="text-gray-500">Invoice not found.</p></div>;
  }

  const lineItems = invoice.lineItems as { description: string; quantity: number; unitPrice: number; amount: number }[];
  const isOverdue = invoice.status !== 'PAID' && invoice.dueDate && new Date(invoice.dueDate) < new Date();

  return (
    <div className="page-container max-w-4xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{invoice.invoiceNumber}</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {invoice.status === 'DRAFT' && (
            <Button size="sm" variant="secondary" onClick={() => router.push(`/invoices/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {invoice.status === 'DRAFT' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => sendInvoice.mutate(id)} loading={sendInvoice.isPending}>
                <Send className="h-4 w-4" /> Mark sent
              </Button>
              <Button size="sm" variant="primary" onClick={() => sendPayPal.mutate(id)} loading={sendPayPal.isPending}>
                <Send className="h-4 w-4" /> Send via PayPal
              </Button>
            </>
          )}
          {['SENT', 'OVERDUE', 'VIEWED'].includes(invoice.status) && (
            <Button size="sm" variant="secondary" onClick={() => setShowPaid(true)}>
              <CheckCircle2 className="h-4 w-4" /> Mark as paid
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => window.open(invoicesApi.getPDFUrl(id), '_blank')}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          {invoice.status !== 'PAID' && (
            <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {isOverdue && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
          <AlertCircle className="h-5 w-5 text-danger shrink-0" />
          <p className="text-sm text-red-800 font-medium">
            This invoice is overdue — due {formatDate(invoice.dueDate!)}
          </p>
        </div>
      )}
      {invoice.status === 'PAID' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">
            Paid in full{invoice.paidAt ? ` on ${formatDate(invoice.paidAt)}` : ''}
          </p>
        </div>
      )}
      {invoice.stripePaymentUrl && invoice.status !== 'PAID' && (
        <div className="card p-4 mb-6">
          <p className="text-xs text-gray-500 mb-2 font-medium">PayPal payment link</p>
          <div className="flex items-center gap-2">
            <a
              href={invoice.stripePaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-xs text-primary hover:underline truncate"
            >
              {invoice.stripePaymentUrl}
            </a>
            <button onClick={copyPaymentLink} className="shrink-0 text-gray-500 hover:text-primary transition-colors">
              {copiedLink ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            <a href={invoice.stripePaymentUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-gray-500 hover:text-primary transition-colors">
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Line Items</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">Description</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Qty</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Unit Price</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lineItems.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice, invoice.currency)}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200 bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-2 text-xs text-gray-500 text-right">Subtotal</td>
                  <td className="px-6 py-2 text-sm text-gray-900 text-right">{formatCurrency(Number(invoice.subtotal), invoice.currency)}</td>
                </tr>
                {Number(invoice.discount) > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-2 text-xs text-gray-500 text-right">Discount</td>
                    <td className="px-6 py-2 text-sm text-green-600 text-right">-{formatCurrency(Number(invoice.discount), invoice.currency)}</td>
                  </tr>
                )}
                {Number(invoice.taxRate) > 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-2 text-xs text-gray-500 text-right">Tax ({Number(invoice.taxRate)}%)</td>
                    <td className="px-6 py-2 text-sm text-gray-900 text-right">{formatCurrency(Number(invoice.taxAmount), invoice.currency)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-primary">
                  <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-900 text-right">Total Due</td>
                  <td className="px-6 py-3 text-base font-bold text-primary text-right">{formatCurrency(Number(invoice.total), invoice.currency)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.notes && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{invoice.client.name}</p>
                <p className="text-xs text-gray-500">{invoice.client.email}</p>
                {invoice.client.company && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />{invoice.client.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd><InvoiceStatusBadge status={invoice.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total</dt>
                <dd className="font-bold text-primary">{formatCurrency(Number(invoice.total), invoice.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Currency</dt>
                <dd className="text-gray-900">{invoice.currency}</dd>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Due date</dt>
                  <dd className={`${isOverdue ? 'text-danger font-medium' : 'text-gray-900'}`}>
                    {formatDate(invoice.dueDate)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(invoice.createdAt)}</dd>
              </div>
              {invoice.paidAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Paid</dt>
                  <dd className="text-green-600 font-medium">{formatDate(invoice.paidAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-5 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
            <button
              onClick={() => window.open(invoicesApi.getPDFUrl(id), '_blank')}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4 text-gray-400" /> Download PDF
            </button>
            {invoice.status === 'DRAFT' && (
              <>
                <button
                  onClick={() => sendInvoice.mutate(id)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4 text-gray-400" /> Mark as sent
                </button>
                <button
                  onClick={() => sendPayPal.mutate(id)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4" /> Send via PayPal
                </button>
              </>
            )}
            {['SENT', 'OVERDUE', 'VIEWED'].includes(invoice.status) && (
              <button
                onClick={() => setShowPaid(true)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark as paid
              </button>
            )}
          </div>

          {/* Reminders */}
          <ReminderPanel
            invoiceId={id}
            status={invoice.status}
            hasDueDate={!!invoice.dueDate}
          />
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete invoice"
          description={`Delete "${invoice.title}"? This cannot be undone.`}
          confirmLabel="Delete invoice"
          loading={deleteInvoice.isPending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
      {showPaid && (
        <ConfirmModal
          title="Mark as paid"
          description={`Mark "${invoice.title}" as paid? This will record today as the payment date.`}
          confirmLabel="Mark as paid"
          loading={markPaid.isPending}
          onConfirm={async () => { await markPaid.mutateAsync({ id }); setShowPaid(false); }}
          onClose={() => setShowPaid(false)}
        />
      )}
    </div>
  );
}
