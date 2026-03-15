'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalApi } from '@/lib/portal';
import {
  ArrowLeft, CheckCircle2, Circle, Clock, Flag,
  Calendar, Download, FileText, Image, File,
  MessageSquare, CheckCheck, AlertCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  TODO:        'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  REVIEW:      'bg-purple-100 text-purple-700',
  DONE:        'bg-green-100 text-green-700',
};

const MILESTONE_STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING:            <Circle className="h-5 w-5 text-gray-400" />,
  IN_PROGRESS:        <Clock className="h-5 w-5 text-blue-500" />,
  AWAITING_APPROVAL:  <Flag className="h-5 w-5 text-amber-500" />,
  APPROVED:           <CheckCircle2 className="h-5 w-5 text-green-500" />,
  COMPLETED:          <CheckCircle2 className="h-5 w-5 text-primary" />,
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-5 w-5 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

// ─────────────────────────────────────────
// MILESTONE CARD
// ─────────────────────────────────────────
function MilestoneCard({
  milestone,
  token,
  projectId,
}: {
  milestone: {
    id: string;
    title: string;
    description?: string;
    status: string;
    dueDate?: string;
    tasks: { id: string; title: string; status: string }[];
  };
  token:     string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => portalApi.approveMilestone(token, milestone.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', token, 'project', projectId] });
    },
  });

  const done     = milestone.tasks.filter(t => t.status === 'DONE').length;
  const total    = milestone.tasks.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className={`border rounded-lg overflow-hidden ${
      milestone.status === 'AWAITING_APPROVAL' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start gap-3 p-4">
        <div className="mt-0.5 shrink-0">
          {MILESTONE_STATUS_ICONS[milestone.status] || <Circle className="h-5 w-5 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-gray-900">{milestone.title}</h3>
            {milestone.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                {formatDate(milestone.dueDate)}
              </span>
            )}
          </div>
          {milestone.description && (
            <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
          )}
          {total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{done}/{total} tasks</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Awaiting approval banner */}
      {milestone.status === 'AWAITING_APPROVAL' && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between bg-amber-100 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <p className="text-sm text-amber-800 font-medium">Your approval is needed</p>
            </div>
            <button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white text-xs font-medium rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {approveMutation.isPending ? 'Approving...' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {/* Approved badge */}
      {(milestone.status === 'APPROVED' || milestone.status === 'COMPLETED') && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {milestone.status === 'APPROVED' ? 'Approved by you' : 'Completed'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// PORTAL PROJECT DETAIL PAGE
// ─────────────────────────────────────────
export default function PortalProjectPage() {
  const { token, projectId } = useParams<{ token: string; projectId: string }>();
  const router               = useRouter();
  const [comment, setComment]     = useState('');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['portal', token, 'project', projectId],
    queryFn:  () => portalApi.getProject(token, projectId),
  });

  const project = data?.project;

  const handleComment = async (taskId: string) => {
    if (!comment.trim()) return;
    setSubmitting(true);
    await portalApi.addComment(token, taskId, comment.trim());
    setComment('');
    setSubmitting(false);
    queryClient.invalidateQueries({ queryKey: ['portal', token, 'project', projectId] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Project not found.</p>
      </div>
    );
  }

  const awaitingApproval = project.milestones?.filter(
    (m: { status: string }) => m.status === 'AWAITING_APPROVAL'
  ).length || 0;

  return (
    <div>
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> All projects
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-500 mt-1">{project.description}</p>
        )}
      </div>

      {/* Approval alert */}
      {awaitingApproval > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{awaitingApproval} milestone{awaitingApproval > 1 ? 's' : ''}</span> {awaitingApproval > 1 ? 'are' : 'is'} awaiting your approval below.
          </p>
        </div>
      )}

      {/* Overall progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-primary">{project.progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${project.progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {project.doneCount} of {project.taskCount} tasks completed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — milestones + tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Milestones</h2>
              <div className="space-y-3">
                {project.milestones.map((milestone: {
                  id: string;
                  title: string;
                  description?: string;
                  status: string;
                  dueDate?: string;
                  tasks: { id: string; title: string; status: string }[];
                }) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    token={token}
                    projectId={projectId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {project.tasks && project.tasks.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Tasks</h2>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2.5">Task</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2.5 hidden sm:table-cell">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2.5 hidden md:table-cell">Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {project.tasks.map((task: {
                      id: string;
                      title: string;
                      status: string;
                      priority: string;
                      dueDate?: string;
                    }) => (
                      <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {task.status === 'DONE'
                              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                              : <Circle className="h-4 w-4 text-gray-300 shrink-0" />
                            }
                            <span className={`text-sm ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {task.title}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-600'}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                          {task.dueDate ? formatDate(task.dueDate) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right — files */}
        <div className="space-y-6">
          {project.files && project.files.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3">Files</h2>
              <div className="card overflow-hidden divide-y divide-gray-100">
                {project.files.map((file: {
                  id: string;
                  name: string;
                  cloudinaryUrl: string;
                  mimeType: string;
                  size: number;
                  createdAt: string;
                }) => (
                  <a
                    key={file.id}
                    href={file.cloudinaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <Download className="h-4 w-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Project info */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Project Info</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">{project.status}</dd>
              </div>
              {project.startDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Started</dt>
                  <dd className="text-gray-900">{formatDate(project.startDate)}</dd>
                </div>
              )}
              {project.endDate && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Due date</dt>
                  <dd className="text-gray-900">{formatDate(project.endDate)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
