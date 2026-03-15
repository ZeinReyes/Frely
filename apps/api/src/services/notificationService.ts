import prisma from '../config/database';
import { AppError } from '../utils/AppError';
import { sendToUser } from './sseService';

// ─────────────────────────────────────────
// NOTIFICATION TYPES
// ─────────────────────────────────────────
export type NotificationType =
  | 'MILESTONE_APPROVED'
  | 'INVOICE_PAID'
  | 'CONTRACT_SIGNED'
  | 'NEW_COMMENT'
  | 'INVOICE_OVERDUE'
  | 'PROPOSAL_ACCEPTED'
  | 'PROJECT_CREATED'
  | 'PAYMENT_RECEIVED';

interface CreateNotificationInput {
  userId:   string;
  type:     NotificationType;
  title:    string;
  message:  string;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────
// CREATE NOTIFICATION
// ─────────────────────────────────────────
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId:   input.userId,
      type:     input.type,
      title:    input.title,
      message:  input.message,
      metadata: input.metadata as never,
      isRead:   false,
    },
  });

  // Push via SSE
  sendToUser(input.userId, 'notification', notification);

  return notification;
}

// ─────────────────────────────────────────
// LIST NOTIFICATIONS
// ─────────────────────────────────────────
export async function listNotifications(userId: string, limit = 20) {
  const notifications = await prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
  });
  return notifications;
}

// ─────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────
export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return count;
}

// ─────────────────────────────────────────
// MARK AS READ
// ─────────────────────────────────────────
export async function markAsRead(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw AppError.notFound('Notification not found');

  return prisma.notification.update({
    where: { id: notificationId },
    data:  { isRead: true },
  });
}

// ─────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────
export async function markAllAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data:  { isRead: true },
  });

  // Notify client that count is now 0
  sendToUser(userId, 'unread_count', { count: 0 });
  return { success: true };
}

// ─────────────────────────────────────────
// DELETE NOTIFICATION
// ─────────────────────────────────────────
export async function deleteNotification(userId: string, notificationId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });
  if (!notification) throw AppError.notFound('Notification not found');

  await prisma.notification.delete({ where: { id: notificationId } });
}

// ─────────────────────────────────────────
// HELPERS — called from other services
// ─────────────────────────────────────────
export async function notifyMilestoneApproved(
  userId: string,
  milestone: { id: string; title: string },
  project:   { id: string; name: string }
) {
  return createNotification({
    userId,
    type:    'MILESTONE_APPROVED',
    title:   'Milestone approved',
    message: `"${milestone.title}" in ${project.name} has been approved by your client.`,
    metadata: { milestoneId: milestone.id, projectId: project.id },
  });
}

export async function notifyInvoicePaid(
  userId: string,
  invoice: { id: string; invoiceNumber: string; total: number; currency: string }
) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: invoice.currency,
  }).format(invoice.total);

  return createNotification({
    userId,
    type:    'INVOICE_PAID',
    title:   'Invoice paid! 🎉',
    message: `${invoice.invoiceNumber} for ${amount} has been paid.`,
    metadata: { invoiceId: invoice.id },
  });
}

export async function notifyContractSigned(
  userId: string,
  contract: { id: string; title: string; signatureName: string }
) {
  return createNotification({
    userId,
    type:    'CONTRACT_SIGNED',
    title:   'Contract signed',
    message: `"${contract.title}" has been signed by ${contract.signatureName}.`,
    metadata: { contractId: contract.id },
  });
}

export async function notifyInvoiceOverdue(
  userId: string,
  invoice: { id: string; invoiceNumber: string; total: number; currency: string }
) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: invoice.currency,
  }).format(invoice.total);

  return createNotification({
    userId,
    type:    'INVOICE_OVERDUE',
    title:   'Invoice overdue',
    message: `${invoice.invoiceNumber} for ${amount} is past due.`,
    metadata: { invoiceId: invoice.id },
  });
}

export async function notifyNewComment(
  userId: string,
  comment: { taskTitle: string; projectName: string; taskId: string; projectId: string }
) {
  return createNotification({
    userId,
    type:    'NEW_COMMENT',
    title:   'New comment',
    message: `Your client commented on "${comment.taskTitle}" in ${comment.projectName}.`,
    metadata: { taskId: comment.taskId, projectId: comment.projectId },
  });
}
