'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal';
import { FolderKanban, Calendar, CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-primary rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export default function PortalPage() {
  const { token } = useParams<{ token: string }>();
  const router    = useRouter();

  const { data: clientData, isLoading: clientLoading } = useQuery({
    queryKey: ['portal', token, 'client'],
    queryFn:  () => portalApi.getClient(token),
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['portal', token, 'projects'],
    queryFn:  () => portalApi.getProjects(token),
  });

  const client   = clientData?.client;
  const projects = projectsData?.projects || [];

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal not found</h1>
        <p className="text-gray-500">This link may be invalid or expired.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome{client.name ? `, ${client.name.split(' ')[0]}` : ''}! 👋
        </h1>
        {client.company && (
          <p className="text-gray-500 mt-1 flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {client.company}
          </p>
        )}
        <p className="text-gray-500 mt-1">
          Here's an overview of your active projects.
        </p>
      </div>

      {/* Projects */}
      {projectsLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No projects yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project: {
            id: string;
            name: string;
            description?: string;
            status: string;
            endDate?: string;
            progress: number;
            taskCount: number;
            doneCount: number;
            milestones: { id: string; title: string; status: string }[];
          }) => (
            <div
              key={project.id}
              onClick={() => router.push(`/portal/${token}/projects/${project.id}`)}
              className="card p-6 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                    <FolderKanban className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{project.name}</h2>
                    {project.description && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{project.description}</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors mt-1" />
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span>{project.doneCount} of {project.taskCount} tasks completed</span>
                  <span className="font-medium text-primary">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {project.endDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {formatDate(project.endDate)}
                  </span>
                )}
                {project.milestones.length > 0 && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {project.milestones.filter(m => m.status === 'COMPLETED').length}/{project.milestones.length} milestones
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
