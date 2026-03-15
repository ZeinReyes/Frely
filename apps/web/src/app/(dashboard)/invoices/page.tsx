'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Receipt, MoreHorizontal, Send,
  Download, Trash2, CheckCircle2, ExternalLink,
  TrendingUp, Clock, AlertCircle, DollarSign, Pencil,
} from 'lucide-react';
import {
  useInvoices, useInvoiceStats, useSendInvoice,
  useMarkInvoicePaid, useDeleteInvoice, invoicesApi,
} from '@/hooks/useInvoices';
import { InvoiceStatusBadge } from '@/components/ui/InvoiceStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Invoice } from '@/types/invoice';

export default function InvoicesPage() {
  const router = useRouter();
  const [openMenu,    setOpenMenu]    = useState<string | null>(null);
  const [deleteInv,   setDeleteInv]   = useState<Invoice | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoiceData, isLoading } = useInvoices(statusFilter ? { status: statusFilter } : undefined);
  const { data: statsData }              = useInvoiceStats();
  const sendInvoice     = useSendInvoice();
  const markPaid        = useMarkInvoicePaid();
  const deleteInvoice   = useDeleteInvoice();

  const invoices: Invoice[] = invoiceData?.invoices || [];
  const stats               = statsData?.stats;

  const handleDelete = async () => {
    if (!deleteInv) return;
    await deleteInvoice.mutateAsync(deleteInv.id);
    setDeleteInv(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} total</p>
        </div>
        <Button onClick={() => router.push('/invoices/new')}>
          <Plus className="h-4 w-4" /> New invoice
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" /> Total earned
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs text-green-600 mt-0.5">{stats.paid} paid</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Clock className="h-3.5 w-3.5" /> Pending
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.totalPending)}</p>
            <p className="text-xs text-blue-600 mt-0.5">{stats.sent} sent</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <AlertCircle className="h-3.5 w-3.5" /> Overdue
            </div>
            <p className="text-xl font-bold text-danger">{stats.overdue}</p>
            <p className="text-xs text-gray-500 mt-0.5">invoices</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
              <Receipt className="h-3.5 w-3.5" /> Draft
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.draft}</p>
            <p className="text-xs text-gray-500 mt-0.5">not sent yet</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              statusFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No invoices yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first invoice to start getting paid</p>
          <Button onClick={() => router.push('/invoices/new')}>
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        </div>
      ) : (
        <div className="card overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Due</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/invoices/${invoice.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{invoice.title}</p>
                    <p className="text-xs text-gray-500">{invoice.invoiceNumber}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-700">{invoice.client.name}</p>
                    {invoice.client.company && (
                      <p className="text-xs text-gray-500">{invoice.client.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <InvoiceStatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 hidden lg:table-cell">
                    {formatCurrency(Number(invoice.total), invoice.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm hidden xl:table-cell">
                    {invoice.dueDate ? (
                      <span className={new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' ? 'text-danger font-medium' : 'text-gray-500'}>
                        {formatDate(invoice.dueDate)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === invoice.id ? null : invoice.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === invoice.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-modal py-1 w-48">
                            <button
                              onClick={() => { router.push(`/invoices/${invoice.id}`); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="h-4 w-4" /> View
                            </button>
                            {invoice.status === 'DRAFT' && (
                              <button
                                onClick={() => { router.push(`/invoices/${invoice.id}/edit`); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="h-4 w-4" /> Edit
                              </button>
                            )}
                            {invoice.status === 'DRAFT' && (
                              <button
                                onClick={() => { sendInvoice.mutate(invoice.id); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Send className="h-4 w-4" /> Mark as sent
                              </button>
                            )}
                            {['SENT', 'OVERDUE', 'VIEWED'].includes(invoice.status) && (
                              <button
                                onClick={() => { markPaid.mutate({ id: invoice.id }); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle2 className="h-4 w-4" /> Mark as paid
                              </button>
                            )}
                            <button
                              onClick={() => { window.open(invoicesApi.getPDFUrl(invoice.id), '_blank'); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4" /> Download PDF
                            </button>
                            {invoice.status !== 'PAID' && (
                              <button
                                onClick={() => { setDeleteInv(invoice); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteInv && (
        <ConfirmModal
          title="Delete invoice"
          description={`Delete "${deleteInv.title}"? This cannot be undone.`}
          confirmLabel="Delete invoice"
          loading={deleteInvoice.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteInv(null)}
        />
      )}
    </div>
  );
}
