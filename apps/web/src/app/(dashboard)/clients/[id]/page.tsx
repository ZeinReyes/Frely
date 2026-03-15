'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone,
  Building2, Copy, ExternalLink, FolderKanban, Receipt, Check,
} from 'lucide-react';
import { useClient, useClientProjects, useClientInvoices } from '@/hooks/useClients';
import { ClientStatusBadge } from '@/components/ui/ClientStatusBadge';
import { HealthScore } from '@/components/ui/HealthScore';
import { ClientFormModal } from '@/components/ui/ClientFormModal';
import { DeleteClientModal } from '@/components/ui/DeleteClientModal';
import { Button } from '@/components/ui/button';
import { getInitials, formatDate, formatCurrency } from '@/lib/utils';

export default function ClientDetailPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [showEdit,   setShowEdit]   = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const { data: clientData, isLoading } = useClient(id);
  const { data: projectsData }          = useClientProjects(id);
  const { data: invoicesData }          = useClientInvoices(id);

  const client   = clientData?.client;
  const projects = projectsData?.projects || [];
  const invoices = invoicesData?.invoices || [];

  const copyPortalLink = () => {
    const link = `${window.location.origin}/portal/${client?.portalToken}`;
    navigator.clipboard.writeText(link);
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

  if (!client) {
    return <div className="page-container"><p className="text-gray-500">Client not found.</p></div>;
  }

  return (
    <div className="page-container">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </button>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
            {client.avatarUrl
              ? <img src={client.avatarUrl} alt={client.name} className="w-14 h-14 rounded-full object-cover" />
              : <span className="text-xl font-bold text-primary">{getInitials(client.name)}</span>
            }
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <ClientStatusBadge status={client.status} />
              <HealthScore score={client.healthScore} showLabel />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <a href={`mailto:${client.email}`} className="text-primary hover:underline">{client.email}</a>
              </li>
              {client.phone && (
                <li className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{client.phone}</span>
                </li>
              )}
              {client.company && (
                <li className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{client.company}</span>
                </li>
              )}
            </ul>
          </div>

          {client.notes && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{client.notes}</p>
            </div>
          )}

          {client.tags.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <span key={tag} className="badge-default">{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Client Portal</h3>
            <p className="text-xs text-gray-500 mb-3">Share this link with your client so they can view project progress.</p>
            <Button variant="secondary" size="sm" className="w-full" onClick={copyPortalLink}>
              {copied
                ? <><Check className="h-4 w-4 text-secondary" /> Copied!</>
                : <><Copy className="h-4 w-4" /> Copy portal link</>
              }
            </Button>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Added</dt>
                <dd className="text-gray-900">{formatDate(client.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Projects</dt>
                <dd className="text-gray-900">{client._count?.projects || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Invoices</dt>
                <dd className="text-gray-900">{client._count?.invoices || 0}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-gray-400" /> Projects
              </h3>
              <Button size="sm" variant="secondary" onClick={() => router.push('/projects')}>
                <ExternalLink className="h-3.5 w-3.5" /> View all
              </Button>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No projects yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Name</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden sm:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden md:table-cell">Tasks</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden lg:table-cell">Budget</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {projects.map((p: { id: string; name: string; status: string; _count: { tasks: number }; budget?: number | null }) => (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/projects/${p.id}`)}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 hidden sm:table-cell"><span className="badge-default">{p.status}</span></td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{p._count.tasks}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {p.budget ? formatCurrency(Number(p.budget)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-400" /> Invoices
              </h3>
              <Button size="sm" variant="secondary" onClick={() => router.push('/invoices')}>
                <ExternalLink className="h-3.5 w-3.5" /> View all
              </Button>
            </div>
            {invoices.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No invoices yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Invoice</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden sm:table-cell">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden md:table-cell">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2 hidden lg:table-cell">Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map((inv: { id: string; invoiceNumber: string; title: string; total: number; currency: string; status: string; dueDate?: string | null }) => (
                    <tr key={inv.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">#{inv.invoiceNumber}</p>
                        <p className="text-xs text-gray-500">{inv.title}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                        {formatCurrency(Number(inv.total), inv.currency)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="badge-default">{inv.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                        {inv.dueDate ? formatDate(inv.dueDate) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showEdit   && <ClientFormModal client={client} onClose={() => setShowEdit(false)} />}
      {showDelete && (
        <DeleteClientModal
          clientId={client.id}
          clientName={client.name}
          onClose={() => { setShowDelete(false); router.push('/clients'); }}
        />
      )}
    </div>
  );
}