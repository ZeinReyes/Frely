'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Download, Trash2, FileText,
  Calendar, User, Building2, CheckCircle2, Clock,
  Copy, Check, Pencil,
} from 'lucide-react';
import { useProposal, useSendProposal, useDeleteProposal } from '@/hooks/useProposals';
import { ProposalStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProposalDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const { data, isLoading }  = useProposal(id);
  const sendProposal         = useSendProposal();
  const deleteProposal       = useDeleteProposal();

  const proposal = data?.proposal;

  const handleDelete = async () => {
    await deleteProposal.mutateAsync(id);
    router.push('/proposals');
  };

  const handleDownload = () => {
    window.open(`${API_URL}/api/proposals/${id}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Proposal not found.</p>
      </div>
    );
  }

  const lineItems = proposal.lineItems as {
    description: string; quantity: number; unitPrice: number; amount: number;
  }[];

  return (
    <div className="page-container max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to proposals
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{proposal.proposalNumber}</span>
              <ProposalStatusBadge status={proposal.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {proposal.status === 'DRAFT' && (
            <Button size="sm" variant="secondary" onClick={() => router.push(`/proposals/${id}/edit`)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {proposal.status === 'DRAFT' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendProposal.mutate(id)}
              loading={sendProposal.isPending}
            >
              <Send className="h-4 w-4" /> Mark as sent
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleDownload}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Introduction */}
          {proposal.introduction && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Introduction</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{proposal.introduction}</p>
            </div>
          )}

          {/* Scope */}
          {proposal.scope && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Scope of Work</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{proposal.scope}</p>
            </div>
          )}

          {/* Line items */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pricing</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice, proposal.currency)}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount, proposal.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary bg-primary-50">
                  <td colSpan={3} className="px-6 py-3 text-sm font-bold text-gray-900 text-right">Total</td>
                  <td className="px-6 py-3 text-base font-bold text-primary text-right">
                    {formatCurrency(Number(proposal.total), proposal.currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Terms */}
          {proposal.terms && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Terms & Conditions</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{proposal.terms}</p>
            </div>
          )}

          {/* Notes */}
          {proposal.notes && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client info */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{proposal.client.name}</p>
                <p className="text-xs text-gray-500">{proposal.client.email}</p>
                {proposal.client.company && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {proposal.client.company}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd><ProposalStatusBadge status={proposal.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total</dt>
                <dd className="font-semibold text-gray-900">{formatCurrency(Number(proposal.total), proposal.currency)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Currency</dt>
                <dd className="text-gray-900">{proposal.currency}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(proposal.createdAt)}</dd>
              </div>
              {proposal.sentAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sent</dt>
                  <dd className="text-gray-900">{formatDate(proposal.sentAt)}</dd>
                </div>
              )}
              {proposal.validUntil && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Valid until</dt>
                  <dd className="text-gray-900">{formatDate(proposal.validUntil)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick actions */}
          <div className="card p-5 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4 text-gray-400" /> Download PDF
            </button>
            {proposal.status === 'DRAFT' && (
              <button
                onClick={() => sendProposal.mutate(id)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4 text-gray-400" /> Mark as sent
              </button>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-danger hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete proposal
            </button>
          </div>
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete proposal"
          description={`Delete "${proposal.title}"? This cannot be undone.`}
          confirmLabel="Delete proposal"
          loading={deleteProposal.isPending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
