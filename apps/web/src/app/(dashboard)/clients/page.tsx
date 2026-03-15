'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Users, Mail, Building2,
  MoreHorizontal, Pencil, Trash2, ExternalLink,
} from 'lucide-react';
import { useClients } from '@/hooks/useClients';
import { ClientStatusBadge } from '@/components/ui/ClientStatusBadge';
import { HealthScore } from '@/components/ui/HealthScore';
import { ClientFormModal } from '@/components/ui/ClientFormModal';
import { DeleteClientModal } from '@/components/ui/DeleteClientModal';
import { Button } from '@/components/ui/button';
import { getInitials, formatDate } from '@/lib/utils';
import type { Client, ClientStatus } from '@/types/client';

const STATUS_FILTERS: { label: string; value: ClientStatus | 'ALL' }[] = [
  { label: 'All',           value: 'ALL' },
  { label: 'Leads',         value: 'LEAD' },
  { label: 'Proposal Sent', value: 'PROPOSAL_SENT' },
  { label: 'Active',        value: 'ACTIVE' },
  { label: 'Completed',     value: 'COMPLETED' },
  { label: 'Inactive',      value: 'INACTIVE' },
];

export default function ClientsPage() {
  const router = useRouter();
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'ALL'>('ALL');
  const [showCreate,   setShowCreate]   = useState(false);
  const [editClient,   setEditClient]   = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [openMenu,     setOpenMenu]     = useState<string | null>(null);

  const { data, isLoading } = useClients({
    search:  search || undefined,
    status:  statusFilter === 'ALL' ? undefined : statusFilter,
    limit:   50,
  });

  const clients: Client[] = data?.data || [];
  const total: number     = data?.pagination?.total || 0;

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{total} total client{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState onAdd={() => setShowCreate(true)} hasSearch={!!search} />
      ) : (
        <div className="card overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Company</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Health</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Projects</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 hidden xl:table-cell">Added</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/clients/${client.id}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                        {client.avatarUrl
                          ? <img src={client.avatarUrl} alt={client.name} className="w-8 h-8 rounded-full object-cover" />
                          : <span className="text-xs font-semibold text-primary">{getInitials(client.name)}</span>
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />{client.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {client.company
                      ? <span className="text-sm text-gray-700 flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-gray-400" />{client.company}</span>
                      : <span className="text-sm text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <HealthScore score={client.healthScore} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-gray-700">{client._count?.projects || 0}</span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-sm text-gray-500">{formatDate(client.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === client.id ? null : client.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {openMenu === client.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                          <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-modal py-1 w-44">
                            <button
                              onClick={() => { router.push(`/clients/${client.id}`); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <ExternalLink className="h-4 w-4" /> View details
                            </button>
                            <button
                              onClick={() => { setEditClient(client); setOpenMenu(null); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => { setDeleteClient(client); setOpenMenu(null); }}
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

      {showCreate  && <ClientFormModal onClose={() => setShowCreate(false)} />}
      {editClient  && <ClientFormModal client={editClient} onClose={() => setEditClient(null)} />}
      {deleteClient && (
        <DeleteClientModal
          clientId={deleteClient.id}
          clientName={deleteClient.name}
          onClose={() => setDeleteClient(null)}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="card p-12 text-center">
      <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {hasSearch ? 'No clients found' : 'No clients yet'}
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        {hasSearch ? 'Try adjusting your search or filter' : 'Add your first client to get started'}
      </p>
      {!hasSearch && (
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" />
          Add your first client
        </Button>
      )}
    </div>
  );
}