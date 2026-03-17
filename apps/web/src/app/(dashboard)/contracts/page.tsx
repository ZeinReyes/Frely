'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, ScrollText, MoreHorizontal, Send,
  Download, Trash2, ExternalLink, Copy, Check, Pencil,
} from 'lucide-react';
import { useContracts, useSendContract, useDeleteContract } from '@/hooks/useProposals';
import { ContractStatusBadge } from '@/components/ui/ProposalStatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { Contract } from '@/types/proposal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function ContractsPage() {
  const router = useRouter();
  const [openMenu,         setOpenMenu]         = useState<string | null>(null);
  const [deleteContract,   setDeleteContract]   = useState<Contract | null>(null);
  const [sendContractTarget, setSendContractTarget] = useState<Contract | null>(null);
  const [copiedId,         setCopiedId]         = useState<string | null>(null);

  const { data, isLoading }    = useContracts();
  const sendContractMutation   = useSendContract();
  const deleteContractMutation = useDeleteContract();

  const contracts: Contract[] = data?.contracts || [];

  const handleDelete = async () => {
    if (!deleteContract) return;
    await deleteContractMutation.mutateAsync(deleteContract.id);
    setDeleteContract(null);
  };

  const handleSend = async () => {
    if (!sendContractTarget) return;
    await sendContractMutation.mutateAsync(sendContractTarget.id);
    setSendContractTarget(null);
  };

  const copySignLink = (contract: Contract) => {
    navigator.clipboard.writeText(`${APP_URL}/sign/${contract.signToken}`);
    setCopiedId(contract.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Contracts</h1>
          <p className="page-subtitle">{contracts.length} total</p>
        </div>
        <Button onClick={() => router.push('/contracts/new')}>
          <Plus className="h-4 w-4" /> New contract
        </Button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="card p-12 text-center">
          <ScrollText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No contracts yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create a contract and send it to a client for signing</p>
          <Button onClick={() => router.push('/contracts/new')}>
            <Plus className="h-4 w-4" /> New contract
          </Button>
        </div>
      ) : (
        <div className="card overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Contract</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Value</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Created</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contracts.map((contract) => (
                <tr
                  key={contract.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/contracts/${contract.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{contract.title}</p>
                    <p className="text-xs text-gray-500">{contract.contractNumber}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm text-gray-700">{contract.client.name}</p>
                    {contract.client.company && (
                      <p className="text-xs text-gray-500">{contract.client.company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ContractStatusBadge status={contract.status} />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 hidden lg:table-cell">
                    {contract.value ? formatCurrency(Number(contract.value), contract.currency) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden xl:table-cell">
                    {formatDate(contract.createdAt)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === contract.id ? null : contract.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === contract.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-modal py-1 w-48">
                            <button
                              onClick={() => { router.push(`/contracts/${contract.id}`); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="h-4 w-4" /> View
                            </button>
                            {contract.status !== 'SIGNED' && (
                              <button
                                onClick={() => { router.push(`/contracts/${contract.id}/edit`); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil className="h-4 w-4" /> Edit
                              </button>
                            )}
                            {contract.status === 'DRAFT' && (
                              <button
                                onClick={() => { setSendContractTarget(contract); setOpenMenu(null); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Send className="h-4 w-4" /> Send to client
                              </button>
                            )}
                            <button
                              onClick={() => { copySignLink(contract); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              {copiedId === contract.id
                                ? <><Check className="h-4 w-4 text-green-500" /> Copied!</>
                                : <><Copy className="h-4 w-4" /> Copy sign link</>
                              }
                            </button>
                            <button
                              onClick={() => { window.open(`${API_URL}/api/contracts/${contract.id}/pdf`, '_blank'); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Download className="h-4 w-4" /> Download PDF
                            </button>
                            <button
                              onClick={() => { setDeleteContract(contract); setOpenMenu(null); }}
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

      {/* Send confirmation modal */}
      {sendContractTarget && (
        <ConfirmModal
          title="Send contract to client"
          description={`This will email the contract to ${sendContractTarget.client.name} (${sendContractTarget.client.email}) with a link to review and sign it.`}
          confirmLabel="Send contract"
          loading={sendContractMutation.isPending}
          onConfirm={handleSend}
          onClose={() => setSendContractTarget(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteContract && (
        <ConfirmModal
          title="Delete contract"
          description={`Delete "${deleteContract.title}"? This cannot be undone.`}
          confirmLabel="Delete contract"
          loading={deleteContractMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteContract(null)}
        />
      )}
    </div>
  );
}