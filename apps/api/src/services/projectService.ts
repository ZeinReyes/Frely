import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type {
  CreateProjectInput,
  UpdateProjectInput,
  ListProjectsInput,
} from '../validators/projectValidators';

// ─────────────────────────────────────────
// LIST PROJECTS
// ─────────────────────────────────────────
export async function listProjects(userId: string, input: ListProjectsInput) {
  const { page, limit, search, status, clientId, sortBy, sortDir } = input;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status   && { status }),
    ...(clientId && { clientId }),
    ...(search   && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortDir },
      include: {
        client: { select: { id: true, name: true, avatarUrl: true } },
        _count: {
          select: { tasks: true, milestones: true },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { projects, total };
}

// ─────────────────────────────────────────
// GET PROJECT BY ID
// ─────────────────────────────────────────
export async function getProjectById(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      client: { select: { id: true, name: true, email: true, avatarUrl: true } },
      milestones: { orderBy: { order: 'asc' } },
      _count: { select: { tasks: true, files: true, timeEntries: true } },
    },
  });

  if (!project) throw AppError.notFound('Project not found');
  return project;
}

// ─────────────────────────────────────────
// CREATE PROJECT
// ─────────────────────────────────────────
export async function createProject(userId: string, input: CreateProjectInput) {
  // Verify client belongs to this user
  const client = await prisma.client.findFirst({
    where: { id: input.clientId, userId },
  });

  if (!client) throw AppError.notFound('Client not found');

  const project = await prisma.project.create({
    data: {
      userId,
      clientId:    input.clientId,
      name:        input.name,
      description: input.description,
      status:      input.status || 'ACTIVE',
      startDate:   input.startDate ? new Date(input.startDate) : undefined,
      endDate:     input.endDate   ? new Date(input.endDate)   : undefined,
      budget:      input.budget,
    },
    include: {
      client: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return project;
}

// ─────────────────────────────────────────
// UPDATE PROJECT
// ─────────────────────────────────────────
export async function updateProject(
  userId: string,
  projectId: string,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...input,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate:   input.endDate   ? new Date(input.endDate)   : undefined,
    },
    include: {
      client: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────
export async function deleteProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  await prisma.project.delete({ where: { id: projectId } });
}

// ─────────────────────────────────────────
// GET KANBAN BOARD
// Returns tasks grouped by status
// ─────────────────────────────────────────
export async function getKanbanBoard(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  const tasks = await prisma.task.findMany({
    where:   { projectId, parentId: null }, // only top-level tasks
    orderBy: { position: 'asc' },
    include: {
      subtasks: {
        orderBy: { position: 'asc' },
        select: { id: true, title: true, status: true },
      },
      _count: { select: { comments: true } },
    },
  });

  // Group by status
  const board = {
    TODO:        tasks.filter((t) => t.status === 'TODO'),
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
    REVIEW:      tasks.filter((t) => t.status === 'REVIEW'),
    DONE:        tasks.filter((t) => t.status === 'DONE'),
  };

  return board;
}
