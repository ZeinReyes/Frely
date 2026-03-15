'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Send, Download, Trash2, ScrollText,
  User, Building2, Copy, Check, CheckCircle2,
  PenLine, Calendar, DollarSign,
} from 'lucide-react';
import { useContract, useSendContract, useDeleteContract } from '@/hooks/useProposals';
import { ContractStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function ContractDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const { data, isLoading } = useContract(id);
  const sendContract        = useSendContract();
  const deleteContract      = useDeleteContract();

  const contract = data?.contract;

  const handleDelete = async () => {
    await deleteContract.mutateAsync(id);
    router.push('/contracts');
  };

  const handleDownload = () => {
    window.open(`${API_URL}/api/contracts/${id}/pdf`, '_blank');
  };

  const copySignLink = () => {
    if (!contract) return;
    navigator.clipboard.writeText(`${APP_URL}/sign/${contract.signToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-gray-500">Contract not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to contracts
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
            <ScrollText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{contract.contractNumber}</span>
              <ContractStatusBadge status={contract.status} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {contract.status === 'DRAFT' && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => sendContract.mutate(id)}
              loading={sendContract.isPending}
            >
              <Send className="h-4 w-4" /> Mark as sent
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={copySignLink}>
            {copied ? <><Check className="h-4 w-4 text-green-500" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy sign link</>}
          </Button>
          <Button size="sm" variant="secondary" onClick={handleDownload}>
            <Download className="h-4 w-4" /> PDF
          </Button>
          <Button size="sm" variant="danger" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Signed banner */}
          {contract.status === 'SIGNED' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Contract signed</p>
                <p className="text-xs text-green-700">
                  Signed by <strong>{contract.signatureName}</strong>
                  {contract.signedAt ? ` on ${formatDate(contract.signedAt)}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Signing link */}
          {contract.status !== 'SIGNED' && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-2">
                <PenLine className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-gray-900">Client signing link</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Share this link with your client to sign the contract.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate">
                  {APP_URL}/sign/{contract.signToken}
                </code>
                <button
                  onClick={copySignLink}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors shrink-0"
                >
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            </div>
          )}

          {/* Contract body */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contract Terms</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {contract.body}
            </pre>
          </div>

          {/* Signature block */}
          {contract.status === 'SIGNED' && contract.signatureName && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Signature</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Client</p>
                  <p className="text-xl font-serif italic text-gray-900 border-b border-gray-300 pb-1">
                    {contract.signatureName}
                  </p>
                  {contract.signatureDate && (
                    <p className="text-xs text-gray-500 mt-1">{formatDate(contract.signatureDate)}</p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full mt-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Digitally signed
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Client</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{contract.client.name}</p>
                <p className="text-xs text-gray-500">{contract.client.email}</p>
                {contract.client.company && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 className="h-3 w-3" />
                    {contract.client.company}
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
                <dd><ContractStatusBadge status={contract.status} /></dd>
              </div>
              {contract.value && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Value</dt>
                  <dd className="font-semibold text-gray-900">{formatCurrency(Number(contract.value), contract.currency)}</dd>
                </div>
              )}
              {contract.startDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Start date</dt>
                  <dd className="text-gray-900">{formatDate(contract.startDate)}</dd>
                </div>
              )}
              {contract.endDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">End date</dt>
                  <dd className="text-gray-900">{formatDate(contract.endDate)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(contract.createdAt)}</dd>
              </div>
              {contract.sentAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sent</dt>
                  <dd className="text-gray-900">{formatDate(contract.sentAt)}</dd>
                </div>
              )}
              {contract.signedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Signed</dt>
                  <dd className="text-gray-900">{formatDate(contract.signedAt)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actions</h3>
            <button
              onClick={copySignLink}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
              {copied ? 'Copied!' : 'Copy sign link'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4 text-gray-400" /> Download PDF
            </button>
            {contract.status === 'DRAFT' && (
              <button
                onClick={() => sendContract.mutate(id)}
                className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Send className="h-4 w-4 text-gray-400" /> Mark as sent
              </button>
            )}
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-danger hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Delete contract
            </button>
          </div>
        </div>
      </div>

      {showDelete && (
        <ConfirmModal
          title="Delete contract"
          description={`Delete "${contract.title}"? This cannot be undone.`}
          confirmLabel="Delete contract"
          loading={deleteContract.isPending}
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
