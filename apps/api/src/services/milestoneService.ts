import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
  UpdateMilestoneStatusInput,
  ReorderMilestonesInput,
} from '../validators/milestoneValidators';

// ─────────────────────────────────────────
// GET MILESTONES FOR PROJECT
// ─────────────────────────────────────────
export async function getMilestones(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  const milestones = await prisma.milestone.findMany({
    where:   { projectId },
    orderBy: { order: 'asc' },
    include: {
      _count: {
        select: { tasks: true, invoices: true },
      },
      tasks: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  return milestones;
}

// ─────────────────────────────────────────
// GET SINGLE MILESTONE
// ─────────────────────────────────────────
export async function getMilestoneById(userId: string, milestoneId: string) {
  const milestone = await prisma.milestone.findFirst({
    where: {
      id:      milestoneId,
      project: { userId },
    },
    include: {
      tasks: {
        orderBy: { position: 'asc' },
        select: {
          id:       true,
          title:    true,
          status:   true,
          priority: true,
          dueDate:  true,
        },
      },
      _count: {
        select: { tasks: true, invoices: true },
      },
    },
  });

  if (!milestone) throw AppError.notFound('Milestone not found');
  return milestone;
}

// ─────────────────────────────────────────
// CREATE MILESTONE
// ─────────────────────────────────────────
export async function createMilestone(userId: string, input: CreateMilestoneInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  // Get highest order to append at end
  const lastMilestone = await prisma.milestone.findFirst({
    where:   { projectId: input.projectId },
    orderBy: { order: 'desc' },
    select:  { order: true },
  });

  const order = (lastMilestone?.order ?? -1) + 1;

  const milestone = await prisma.milestone.create({
    data: {
      projectId:   input.projectId,
      title:       input.title,
      description: input.description,
      dueDate:     input.dueDate ? new Date(input.dueDate) : undefined,
      order,
    },
    include: {
      _count: { select: { tasks: true } },
    },
  });

  return milestone;
}

// ─────────────────────────────────────────
// UPDATE MILESTONE
// ─────────────────────────────────────────
export async function updateMilestone(
  userId: string,
  milestoneId: string,
  input: UpdateMilestoneInput
) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
  });

  if (!milestone) throw AppError.notFound('Milestone not found');

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// UPDATE MILESTONE STATUS
// ─────────────────────────────────────────
export async function updateMilestoneStatus(
  userId: string,
  milestoneId: string,
  input: UpdateMilestoneStatusInput
) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
  });

  if (!milestone) throw AppError.notFound('Milestone not found');

  // Auto-complete all tasks when milestone is marked completed
  if (input.status === 'COMPLETED') {
    await prisma.task.updateMany({
      where:  { milestoneId, status: { not: 'DONE' } },
      data:   { status: 'DONE' },
    });
  }

  const updated = await prisma.milestone.update({
    where: { id: milestoneId },
    data:  { status: input.status },
    include: {
      _count: { select: { tasks: true } },
      tasks:  { select: { id: true, status: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE MILESTONE
// ─────────────────────────────────────────
export async function deleteMilestone(userId: string, milestoneId: string) {
  const milestone = await prisma.milestone.findFirst({
    where: { id: milestoneId, project: { userId } },
  });

  if (!milestone) throw AppError.notFound('Milestone not found');

  // Unlink tasks before deleting
  await prisma.task.updateMany({
    where: { milestoneId },
    data:  { milestoneId: null },
  });

  await prisma.milestone.delete({ where: { id: milestoneId } });
}

// ─────────────────────────────────────────
// REORDER MILESTONES
// ─────────────────────────────────────────
export async function reorderMilestones(
  userId: string,
  projectId: string,
  input: ReorderMilestonesInput
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  // Update all orders in a transaction
  await prisma.$transaction(
    input.milestones.map(({ id, order }) =>
      prisma.milestone.update({
        where: { id },
        data:  { order },
      })
    )
  );

  return getMilestones(userId, projectId);
}

// ─────────────────────────────────────────
// GET MILESTONE PROGRESS
// ─────────────────────────────────────────
export function calculateProgress(tasks: { status: string }[]) {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'DONE').length;
  return Math.round((done / tasks.length) * 100);
}
