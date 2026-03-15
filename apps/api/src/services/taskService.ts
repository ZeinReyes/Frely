import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import type {
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  CreateCommentInput,
} from '../validators/projectValidators';

// ─────────────────────────────────────────
// GET TASK BY ID
// ─────────────────────────────────────────
export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    include: {
      subtasks: { orderBy: { position: 'asc' } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          // author info from user if authorId is set
        },
      },
      milestone: { select: { id: true, title: true } },
      _count: { select: { comments: true, subtasks: true } },
    },
  });

  if (!task) throw AppError.notFound('Task not found');
  return task;
}

// ─────────────────────────────────────────
// CREATE TASK
// ─────────────────────────────────────────
export async function createTask(userId: string, input: CreateTaskInput) {
  // Verify project belongs to user
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
  });

  if (!project) throw AppError.notFound('Project not found');

  // Get highest position in the column to append at bottom
  const lastTask = await prisma.task.findFirst({
    where:   { projectId: input.projectId, status: input.status || 'TODO' },
    orderBy: { position: 'desc' },
    select:  { position: true },
  });

  const position = (lastTask?.position ?? -1) + 1;

  const task = await prisma.task.create({
    data: {
      projectId:       input.projectId,
      milestoneId:     input.milestoneId,
      parentId:        input.parentId,
      title:           input.title,
      description:     input.description,
      status:          input.status      || 'TODO',
      priority:        input.priority    || 'MEDIUM',
      dueDate:         input.dueDate ? new Date(input.dueDate) : undefined,
      position,
      isClientVisible: input.isClientVisible ?? true,
    },
    include: {
      subtasks: true,
      _count: { select: { comments: true } },
    },
  });

  return task;
}

// ─────────────────────────────────────────
// UPDATE TASK
// ─────────────────────────────────────────
export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });

  if (!task) throw AppError.notFound('Task not found');

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    },
    include: {
      subtasks: true,
      _count: { select: { comments: true } },
    },
  });

  return updated;
}

// ─────────────────────────────────────────
// MOVE TASK (drag and drop)
// Updates status and position in one call
// ─────────────────────────────────────────
export async function moveTask(
  userId: string,
  taskId: string,
  input: MoveTaskInput
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });

  if (!task) throw AppError.notFound('Task not found');

  // Reorder other tasks in the target column to make space
  await prisma.task.updateMany({
    where: {
      projectId: task.projectId,
      status:    input.status,
      position:  { gte: input.position },
      id:        { not: taskId },
    },
    data: { position: { increment: 1 } },
  });

  // Move the task
  const updated = await prisma.task.update({
    where: { id: taskId },
    data:  { status: input.status, position: input.position },
  });

  return updated;
}

// ─────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────
export async function deleteTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });

  if (!task) throw AppError.notFound('Task not found');

  await prisma.task.delete({ where: { id: taskId } });
}

// ─────────────────────────────────────────
// COMMENTS
// ─────────────────────────────────────────
export async function getComments(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });

  if (!task) throw AppError.notFound('Task not found');

  const comments = await prisma.comment.findMany({
    where:   { taskId },
    orderBy: { createdAt: 'asc' },
  });

  return comments;
}

export async function createComment(
  userId: string,
  taskId: string,
  input: CreateCommentInput
) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });

  if (!task) throw AppError.notFound('Task not found');

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId: userId,
      content:  input.content,
    },
  });

  return comment;
}

export async function deleteComment(userId: string, commentId: string) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, authorId: userId },
  });

  if (!comment) throw AppError.notFound('Comment not found');

  await prisma.comment.delete({ where: { id: commentId } });
}
