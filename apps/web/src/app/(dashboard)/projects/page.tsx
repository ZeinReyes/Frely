'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, FolderKanban, MoreHorizontal,
  Pencil, Trash2, ExternalLink,
} from 'lucide-react';
import { useProjects, useDeleteProject } from '@/hooks/useProjects';
import { ProjectStatusBadge } from '@/components/ui/ProjectStatusBadge';
import { ProjectFormModal } from '@/components/ui/ProjectFormModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency, getInitials } from '@/lib/utils';
import type { Project, ProjectStatus } from '@/types/project';

const STATUS_FILTERS: { label: string; value: ProjectStatus | 'ALL' }[] = [
  { label: 'All',       value: 'ALL' },
  { label: 'Active',    value: 'ACTIVE' },
  { label: 'On Hold',   value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<ProjectStatus | 'ALL'>('ALL');
  const [showCreate,    setShowCreate]    = useState(false);
  const [editProject,   setEditProject]   = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const deleteProjectMutation = useDeleteProject();

  const { data, isLoading } = useProjects({
    search: search || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    limit:  50,
  });

  const projects: Project[] = data?.data || [];
  const total: number       = data?.pagination?.total || 0;

  const handleDelete = async () => {
    if (!deleteProject) return;
    await deleteProjectMutation.mutateAsync(deleteProject.id);
    setDeleteProject(null);
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{total} total project{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
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
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {search ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {search ? 'Try adjusting your search' : 'Create your first project to get started'}
          </p>
          {!search && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card p-5 cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded bg-primary-100 flex items-center justify-center shrink-0">
                    <FolderKanban className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{project.name}</h3>
                </div>
                <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {openMenu === project.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-lg shadow-modal py-1 w-44">
                        <button
                          onClick={() => { router.push(`/projects/${project.id}`); setOpenMenu(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <ExternalLink className="h-4 w-4" /> Open board
                        </button>
                        <button
                          onClick={() => { setEditProject(project); setOpenMenu(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => { setDeleteProject(project); setOpenMenu(null); }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-danger hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {project.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center gap-2 mb-3">
                <ProjectStatusBadge status={project.status} />
                {project.budget && (
                  <span className="text-xs text-gray-500">{formatCurrency(Number(project.budget))}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {getInitials(project.client.name)}
                    </span>
                  </div>
                  <span>{project.client.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>{project._count?.tasks || 0} tasks</span>
                  {project.endDate && <span>Due {formatDate(project.endDate)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate    && <ProjectFormModal onClose={() => setShowCreate(false)} />}
      {editProject   && <ProjectFormModal project={editProject} onClose={() => setEditProject(null)} />}
      {deleteProject && (
        <ConfirmModal
          title="Delete project"
          description={`Are you sure you want to delete "${deleteProject.name}"? This will also delete all tasks, milestones, files, and time entries. This action cannot be undone.`}
          confirmLabel="Delete project"
          loading={deleteProjectMutation.isPending}
          onConfirm={handleDelete}
          onClose={() => setDeleteProject(null)}
        />
      )}
    </div>
  );
}