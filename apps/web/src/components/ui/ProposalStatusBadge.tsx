import { cn } from '@/lib/utils';
import type { ProposalStatus, ContractStatus } from '@/types/proposal';

const PROPOSAL_CONFIG: Record<ProposalStatus, { label: string; className: string }> = {
  DRAFT:    { label: 'Draft',    className: 'bg-gray-100 text-gray-600' },
  SENT:     { label: 'Sent',     className: 'bg-blue-100 text-blue-700' },
  VIEWED:   { label: 'Viewed',   className: 'bg-purple-100 text-purple-700' },
  ACCEPTED: { label: 'Accepted', className: 'bg-green-100 text-green-700' },
  DECLINED: { label: 'Declined', className: 'bg-red-100 text-red-700' },
};

const CONTRACT_CONFIG: Record<ContractStatus, { label: string; className: string }> = {
  DRAFT:     { label: 'Draft',     className: 'bg-gray-100 text-gray-600' },
  SENT:      { label: 'Sent',      className: 'bg-blue-100 text-blue-700' },
  VIEWED:    { label: 'Viewed',    className: 'bg-purple-100 text-purple-700' },
  SIGNED:    { label: 'Signed',    className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
};

export function ProposalStatusBadge({ status }: { status: ProposalStatus }) {
  const config = PROPOSAL_CONFIG[status];
  return <span className={cn('badge', config.className)}>{config.label}</span>;
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const config = CONTRACT_CONFIG[status];
  return <span className={cn('badge', config.className)}>{config.label}</span>;
}
