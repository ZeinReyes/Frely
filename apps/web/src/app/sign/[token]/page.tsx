'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useContractByToken, useSignContract } from '@/hooks/useProposals';
import { ContractStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, FileText, PenLine, CreditCard,
  Calendar, DollarSign, Milestone,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

type PaymentMilestone = { label: string; percent: number; dueOn?: string };

function PaymentScheduleSection({
  schedule,
  depositPercent,
  milestones,
  value,
  currency,
}: {
  schedule?:       string;
  depositPercent?: number;
  milestones?:     PaymentMilestone[];
  value?:          number;
  currency:        string;
}) {
  if (!schedule) return null;

  const fmt = (amount: number) => formatCurrency(amount, currency);
  const pct = (p: number)      => value ? fmt((value * p) / 100) : `${p}%`;

  const dueOnLabel = (dueOn?: string) => {
    if (!dueOn || dueOn === 'completion') return 'On completion';
    if (dueOn === 'signing')             return 'On signing';
    const d = new Date(dueOn);
    return isNaN(d.getTime()) ? dueOn : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-gray-900">Payment Schedule</h2>
      </div>

      {schedule === 'UPFRONT' && (
        <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-gray-900">Full payment on signing</span>
          </div>
          {value && <span className="text-lg font-bold text-primary">{fmt(value)}</span>}
        </div>
      )}

      {schedule === 'SPLIT_50_50' && (
        <div className="space-y-3">
          {[
            { label: 'Deposit (50%)',       due: 'On signing',    amount: value ? value * 0.5 : null },
            { label: 'Final payment (50%)', due: 'On completion', amount: value ? value * 0.5 : null },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> {item.due}
                </p>
              </div>
              {item.amount && <span className="text-base font-bold text-gray-900">{fmt(item.amount)}</span>}
            </div>
          ))}
        </div>
      )}

      {schedule === 'CUSTOM' && depositPercent && (
        <div className="space-y-3">
          {[
            { label: `Deposit (${depositPercent}%)`,        due: 'On signing',    amount: value ? (value * depositPercent) / 100 : null },
            { label: `Remaining (${100 - depositPercent}%)`, due: 'On completion', amount: value ? value - (value * depositPercent) / 100 : null },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> {item.due}
                </p>
              </div>
              {item.amount && <span className="text-base font-bold text-gray-900">{fmt(item.amount)}</span>}
            </div>
          ))}
        </div>
      )}

      {schedule === 'MILESTONE' && (
        <div className="space-y-3">
          {depositPercent && depositPercent > 0 && (
            <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-100 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Deposit ({depositPercent}%)</p>
                <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> Due on signing
                </p>
              </div>
              <span className="text-base font-bold text-primary">{pct(depositPercent)}</span>
            </div>
          )}
          {milestones?.map((ms, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <div className="flex items-center gap-2">
                  <Milestone className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900">{ms.label}</p>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3 w-3" /> {dueOnLabel(ms.dueOn)} · {ms.percent}%
                </p>
              </div>
              <span className="text-base font-bold text-gray-900">{pct(ms.percent)}</span>
            </div>
          ))}
          {milestones && milestones.length > 0 && value && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total contract value</span>
              <span className="text-base font-bold text-gray-900">{fmt(value)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SignContractPage() {
  const { token }         = useParams<{ token: string }>();
  const [name, setName]   = useState('');
  const [signed, setSigned] = useState(false);

  const { data, isLoading } = useContractByToken(token);
  const signContract        = useSignContract();

  const contract    = data?.contract;
  const milestones  = contract?.paymentMilestones as PaymentMilestone[] | undefined;

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
              ? `Thank you, ${name}. The contract has been successfully signed. You'll receive a welcome email shortly with your client portal link.`
              : `This contract was signed by ${contract.signatureName} on ${contract.signedAt ? formatDate(contract.signedAt) : ''}.`
            }
          </p>
          {signed && contract.paymentSchedule && (
            <div className="text-left mt-6 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">What's next</p>
              {contract.paymentSchedule === 'UPFRONT' && (
                <p className="text-sm text-gray-700">You'll receive an invoice for the full amount shortly.</p>
              )}
              {contract.paymentSchedule === 'SPLIT_50_50' && (
                <p className="text-sm text-gray-700">You'll receive a deposit invoice (50%) shortly. The final payment will be due on completion.</p>
              )}
              {contract.paymentSchedule === 'MILESTONE' && (
                <p className="text-sm text-gray-700">
                  {contract.depositPercent
                    ? `A deposit invoice (${contract.depositPercent}%) has been sent. Remaining invoices will be sent as milestones are completed.`
                    : 'Invoices will be sent as each milestone is completed.'
                  }
                </p>
              )}
              {contract.paymentSchedule === 'CUSTOM' && (
                <p className="text-sm text-gray-700">You'll receive a deposit invoice shortly. The remaining balance will be due on completion.</p>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">You can close this page.</p>
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
            <span className="text-white font-bold text-sm">F</span>
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
                <dd className="font-medium text-gray-900 mt-0.5">
                  {formatCurrency(Number(contract.value), contract.currency)}
                </dd>
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

        {/* Payment schedule */}
        <PaymentScheduleSection
          schedule={contract.paymentSchedule}
          depositPercent={contract.depositPercent}
          milestones={milestones}
          value={contract.value ? Number(contract.value) : undefined}
          currency={contract.currency}
        />

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