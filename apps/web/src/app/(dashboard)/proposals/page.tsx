'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, MoreHorizontal, Send,
  Download, Trash2, ExternalLink, Pencil
} from 'lucide-react';
import { useProposals, useSendProposal, useDeleteProposal } from '@/hooks/useProposals';
import { ProposalStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Proposal } from '@/types/proposal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProposalsPage() {
  const router = useRouter();
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const [deleteProposal, setDeleteProposal] = useState<Proposal | null>(null);

  const { data, isLoading }  = useProposals();
  const sendProposal         = useSendProposal();
  const deleteProposalMutation = useDeleteProposal();

  const proposals: Proposal[] = data?.proposals || [];

  const handleDelete = async () => {
    if (!deleteProposal) return;
    await deleteProposalMutation.mutateAsync(deleteProposal.id);
    setDeleteProposal(null);
  };

  const handleDownload = (id: string, number: string) => {
    window.open(`${API_URL}/api/proposals/${id}/pdf`, '_blank');
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Proposals</h1>
          <p className="page-subtitle">{proposals.length} total</p>
        </div>
        <Button onClick={() => router.push('/proposals/new')}>
          <Plus className="h-4 w-4" /> New proposal
        </Button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : proposals.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No proposals yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first proposal to send to a client</p>
          <Button onClick={() => router.push('/proposals/new')}>
            <Plus className="h-4 w-4" /> New proposal
          </Button>
        </div>
      ) : (
        <div className="card overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Proposal</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Total</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {proposals.map((proposal) => (
                <tr
                  key={proposal.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/proposals/${proposal.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{proposal.title}</p>
                    <p className="text-xs text-gray-500">{proposal.proposalNumber}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-700">{proposal.client.name}</p>
                    {proposal.client.company && (
                      <p className="text-xs text-gray-500">{proposal.client.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ProposalStatusBadge status={proposal.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 hidden lg:table-cell">
                    {formatCurrency(Number(proposal.total), proposal.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden xl:table-cell">
                    {formatDate(proposal.createdAt)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === proposal.id ? null : proposal.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === proposal.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-modal py-1 w-48">
                            <button
                              onClick={() => { router.push(`/proposals/${proposal.id}`); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="h-4 w-4" /> View
                            </button>
                            {proposal.status === 'DRAFT' && (
                              <button
                                onClick={() => { router.push(`/proposals/${proposal.id}/edit`); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="h-4 w-4" /> Edit
                              </button>
                            )}
                            {proposal.status === 'DRAFT' && (
                              <button
                                onClick={() => { sendProposal.mutate(proposal.id); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Send className="h-4 w-4" /> Mark as sent
                              </button>
                            )}
                            <button
                              onClick={() => { handleDownload(proposal.id, proposal.proposalNumber); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4" /> Download PDF
                            </button>
                            <button
                              onClick={() => { setDeleteProposal(proposal); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
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

      {deleteProposal && (
        <ConfirmModal
          title="Delete proposal"
          description={`Delete "${deleteProposal.title}"? This cannot be undone.`}
          confirmLabel="Delete proposal"
          loading={deleteProposalMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteProposal(null)}
        />
      )}
    </div>
  );
}
