import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type {
  CreateTimeEntryInput,
  UpdateTimeEntryInput,
  StartTimerInput,
  ListTimeEntriesInput,
} from '../validators/timeEntryValidators';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
export function calcDuration(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─────────────────────────────────────────
// LIST TIME ENTRIES
// ─────────────────────────────────────────
export async function listTimeEntries(userId: string, input: ListTimeEntriesInput) {
  const { projectId, taskId, page, limit } = input;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(projectId && { projectId }),
    ...(taskId    && { taskId }),
  };

  const [entries, total] = await Promise.all([
    prisma.timeEntry.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { startTime: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        task:    { select: { id: true, title: true } },
      },
    }),
    prisma.timeEntry.count({ where }),
  ]);

  // Calculate totals
  const totalSeconds   = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableSeconds = entries
    .filter(e => e.isBillable)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  return { entries, total, totalSeconds, billableSeconds };
}

// ─────────────────────────────────────────
// GET ACTIVE TIMER
// ─────────────────────────────────────────
export async function getActiveTimer(userId: string) {
  const entry = await prisma.timeEntry.findFirst({
    where:   { userId, endTime: null },
    orderBy: { startTime: 'desc' },
    include: {
      project: { select: { id: true, name: true } },
      task:    { select: { id: true, title: true } },
    },
  });

  return entry;
}

// ─────────────────────────────────────────
// START TIMER
// ─────────────────────────────────────────
export async function startTimer(userId: string, input: StartTimerInput) {
  // Stop any existing active timer first
  const existing = await getActiveTimer(userId);
  if (existing) {
    const now      = new Date();
    const duration = calcDuration(existing.startTime, now);
    await prisma.timeEntry.update({
      where: { id: existing.id },
      data:  { endTime: now, duration },
    });
  }

  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });
  if (!project) throw AppError.notFound('Project not found');

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      projectId:   input.projectId,
      taskId:      input.taskId,
      description: input.description,
      startTime:   new Date(),
      isBillable:  input.isBillable ?? true,
    },
    include: {
      project: { select: { id: true, name: true } },
      task:    { select: { id: true, title: true } },
    },
  });

  return entry;
}

// ─────────────────────────────────────────
// STOP TIMER
// ─────────────────────────────────────────
export async function stopTimer(userId: string) {
  const entry = await getActiveTimer(userId);
  if (!entry) throw AppError.notFound('No active timer running');

  const now      = new Date();
  const duration = calcDuration(entry.startTime, now);

  const updated = await prisma.timeEntry.update({
    where: { id: entry.id },
    data:  { endTime: now, duration },
    include: {
      project: { select: { id: true, name: true } },
      task:    { select: { id: true, title: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// CREATE TIME ENTRY (manual)
// ─────────────────────────────────────────
export async function createTimeEntry(userId: string, input: CreateTimeEntryInput) {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });
  if (!project) throw AppError.notFound('Project not found');

  const startTime = new Date(input.startTime);
  const endTime   = input.endTime ? new Date(input.endTime) : undefined;
  const duration  = endTime ? calcDuration(startTime, endTime) : undefined;

  if (endTime && endTime <= startTime) {
    throw AppError.badRequest('End time must be after start time');
  }

  const entry = await prisma.timeEntry.create({
    data: {
      userId,
      projectId:   input.projectId,
      taskId:      input.taskId,
      description: input.description,
      startTime,
      endTime,
      duration,
      isBillable:  input.isBillable ?? true,
    },
    include: {
      project: { select: { id: true, name: true } },
      task:    { select: { id: true, title: true } },
    },
  });

  return entry;
}

// ─────────────────────────────────────────
// UPDATE TIME ENTRY
// ─────────────────────────────────────────
export async function updateTimeEntry(
  userId: string,
  entryId: string,
  input: UpdateTimeEntryInput
) {
  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, userId },
  });
  if (!entry) throw AppError.notFound('Time entry not found');

  const startTime = input.startTime ? new Date(input.startTime) : entry.startTime;
  const endTime   = input.endTime   ? new Date(input.endTime)   : entry.endTime;
  const duration  = endTime ? calcDuration(startTime, endTime) : entry.duration;

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: {
      ...(input.description !== undefined && { description: input.description }),
      ...(input.isBillable  !== undefined && { isBillable:  input.isBillable }),
      startTime,
      ...(endTime && { endTime }),
      ...(duration && { duration }),
    },
    include: {
      project: { select: { id: true, name: true } },
      task:    { select: { id: true, title: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE TIME ENTRY
// ─────────────────────────────────────────
export async function deleteTimeEntry(userId: string, entryId: string) {
  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, userId },
  });
  if (!entry) throw AppError.notFound('Time entry not found');

  await prisma.timeEntry.delete({ where: { id: entryId } });
}

// ─────────────────────────────────────────
// GET PROJECT TIME SUMMARY
// ─────────────────────────────────────────
export async function getProjectTimeSummary(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw AppError.notFound('Project not found');

  const entries = await prisma.timeEntry.findMany({
    where: { projectId, userId, endTime: { not: null } },
  });

  const totalSeconds    = entries.reduce((s, e) => s + (e.duration || 0), 0);
  const billableSeconds = entries.filter(e => e.isBillable).reduce((s, e) => s + (e.duration || 0), 0);
  const totalHours      = totalSeconds / 3600;
  const billableHours   = billableSeconds / 3600;

  return {
    totalSeconds,
    billableSeconds,
    totalHours:    Math.round(totalHours    * 100) / 100,
    billableHours: Math.round(billableHours * 100) / 100,
    entryCount:    entries.length,
  };
}
