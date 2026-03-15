'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useContractByToken, useSignContract } from '@/hooks/useProposals';
import { ContractStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, PenLine } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function SignContractPage() {
  const { token }     = useParams<{ token: string }>();
  const [name, setName] = useState('');
  const [signed, setSigned] = useState(false);

  const { data, isLoading } = useContractByToken(token);
  const signContract        = useSignContract();

  const contract = data?.contract;

  const handleSign = async () => {
    if (!name.trim()) return;
    await signContract.mutateAsync({ token, signatureName: name.trim() });
    setSigned(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract not found</h1>
          <p className="text-gray-500">This link may be invalid or expired.</p>
        </div>
      </div>
    );
  }

  if (signed || contract.status === 'SIGNED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Contract Signed!</h1>
          <p className="text-gray-500 mb-4">
            {signed
              ? `Thank you, ${name}. The contract has been successfully signed.`
              : `This contract was signed by ${contract.signatureName} on ${contract.signedAt ? formatDate(contract.signedAt) : ''}.`
            }
          </p>
          <p className="text-xs text-gray-400">You can close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">Contract Signing</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Contract header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{contract.title}</h1>
                <p className="text-sm text-gray-500">{contract.contractNumber}</p>
              </div>
            </div>
            <ContractStatusBadge status={contract.status} />
          </div>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Client</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{contract.client.name}</dd>
            </div>
            {contract.value && (
              <div>
                <dt className="text-gray-500">Contract Value</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{formatCurrency(Number(contract.value), contract.currency)}</dd>
              </div>
            )}
            {contract.startDate && (
              <div>
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{formatDate(contract.startDate)}</dd>
              </div>
            )}
            {contract.endDate && (
              <div>
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{formatDate(contract.endDate)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Contract body */}
        <div className="card p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Contract Terms</h2>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
              {contract.body}
            </pre>
          </div>
        </div>

        {/* Signature section */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-gray-900">Sign this Contract</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            By typing your full name below and clicking "Sign Contract", you agree to the terms outlined above.
            This constitutes a legally binding digital signature.
          </p>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Full name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your full name to sign"
                className="input text-lg font-serif italic"
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleSign(); }}
              />
              {name && (
                <p className="text-xs text-gray-500 mt-1">
                  Preview: <span className="font-serif italic text-gray-900">{name}</span>
                </p>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Signed on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <Button
              className="w-full"
              size="lg"
              disabled={!name.trim()}
              loading={signContract.isPending}
              onClick={handleSign}
            >
              <CheckCircle2 className="h-4 w-4" />
              Sign Contract
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
