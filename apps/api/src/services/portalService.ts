import prisma from '../config/database';
import { AppError } from '../utils/AppError';

// ─────────────────────────────────────────
// GET PORTAL DATA BY TOKEN
// ─────────────────────────────────────────
export async function getPortalByToken(token: string) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
    select: {
      id:          true,
      name:        true,
      email:       true,
      company:     true,
      avatarUrl:   true,
      portalToken: true,
    },
  });

  if (!client) throw AppError.notFound('Portal not found');
  return client;
}

// ─────────────────────────────────────────
// GET PORTAL PROJECTS
// ─────────────────────────────────────────
export async function getPortalProjects(token: string) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
  });

  if (!client) throw AppError.notFound('Portal not found');

  const projects = await prisma.project.findMany({
    where:   { clientId: client.id },
    orderBy: { createdAt: 'desc' },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where:   { isClientVisible: true },
            select:  { id: true, title: true, status: true, priority: true, dueDate: true },
            orderBy: { position: 'asc' },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  // Add task progress to each project
  const projectsWithProgress = await Promise.all(
    projects.map(async (project) => {
      const tasks = await prisma.task.findMany({
        where:  { projectId: project.id, isClientVisible: true },
        select: { status: true },
      });

      const total    = tasks.length;
      const done     = tasks.filter(t => t.status === 'DONE').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : 0;

      return { ...project, progress, taskCount: total, doneCount: done };
    })
  );

  return projectsWithProgress;
}

// ─────────────────────────────────────────
// GET PORTAL PROJECT DETAIL
// ─────────────────────────────────────────
export async function getPortalProject(token: string, projectId: string) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
  });

  if (!client) throw AppError.notFound('Portal not found');

  const project = await prisma.project.findFirst({
    where: { id: projectId, clientId: client.id },
    include: {
      milestones: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            where:   { isClientVisible: true },
            select:  { id: true, title: true, status: true, priority: true, dueDate: true },
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  if (!project) throw AppError.notFound('Project not found');

  // Get client-visible tasks
  const tasks = await prisma.task.findMany({
    where:   { projectId, isClientVisible: true },
    orderBy: [{ status: 'asc' }, { position: 'asc' }],
    select: {
      id:       true,
      title:    true,
      status:   true,
      priority: true,
      dueDate:  true,
    },
  });

  // Get client-visible files
  const files = await prisma.file.findMany({
    where:   { projectId, isClientVisible: true },
    orderBy: { createdAt: 'desc' },
    select: {
      id:            true,
      name:          true,
      cloudinaryUrl: true,
      mimeType:      true,
      size:          true,
      createdAt:     true,
    },
  });

  const total    = tasks.length;
  const done     = tasks.filter(t => t.status === 'DONE').length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return { ...project, tasks, files, progress, taskCount: total, doneCount: done };
}

// ─────────────────────────────────────────
// APPROVE MILESTONE (client action)
// ─────────────────────────────────────────
export async function approveMilestone(token: string, milestoneId: string) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
  });

  if (!client) throw AppError.notFound('Portal not found');

  // Verify milestone belongs to this client's project
  const milestone = await prisma.milestone.findFirst({
    where: {
      id:      milestoneId,
      project: { clientId: client.id },
    },
  });

  if (!milestone) throw AppError.notFound('Milestone not found');

  if (milestone.status !== 'AWAITING_APPROVAL') {
    throw AppError.badRequest('Milestone is not awaiting approval');
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data:  { status: 'APPROVED' },
  });

  return updated;
}

// ─────────────────────────────────────────
// ADD COMMENT FROM CLIENT
// ─────────────────────────────────────────
export async function addPortalComment(
  token: string,
  taskId: string,
  content: string
) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
  });

  if (!client) throw AppError.notFound('Portal not found');

  // Verify task is visible to client
  const task = await prisma.task.findFirst({
    where: {
      id:              taskId,
      isClientVisible: true,
      project:         { clientId: client.id },
    },
  });

  if (!task) throw AppError.notFound('Task not found');

  const comment = await prisma.comment.create({
    data: {
      taskId,
      clientId: client.id,
      content,
    },
  });

  return comment;
}

// ─────────────────────────────────────────
// GET PORTAL FILES
// ─────────────────────────────────────────
export async function getPortalFiles(token: string, projectId?: string) {
  const client = await prisma.client.findFirst({
    where: { portalToken: token },
  });

  if (!client) throw AppError.notFound('Portal not found');

  const files = await prisma.file.findMany({
    where: {
      isClientVisible: true,
      ...(projectId
        ? { projectId }
        : { project: { clientId: client.id } }),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id:            true,
      name:          true,
      cloudinaryUrl: true,
      mimeType:      true,
      size:          true,
      createdAt:     true,
      project:       { select: { id: true, name: true } },
    },
  });

  return files;
}
