import { type Response } from 'express';

// ─────────────────────────────────────────
// CONNECTION STORE
// ─────────────────────────────────────────
const clients = new Map<string, Set<Response>>();

export function addClient(userId: string, res: Response) {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId)!.add(res);
}

export function removeClient(userId: string, res: Response) {
  const userClients = clients.get(userId);
  if (!userClients) return;
  userClients.delete(res);
  if (userClients.size === 0) clients.delete(userId);
}

// ─────────────────────────────────────────
// SEND EVENT TO USER
// ─────────────────────────────────────────
export function sendToUser(userId: string, event: string, data: unknown) {
  const userClients = clients.get(userId);
  if (!userClients) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const res of userClients) {
    try {
      res.write(payload);
    } catch {
      userClients.delete(res);
    }
  }
}

// ─────────────────────────────────────────
// BROADCAST TO ALL USERS
// ─────────────────────────────────────────
export function broadcast(event: string, data: unknown) {
  for (const userId of clients.keys()) {
    sendToUser(userId, event, data);
  }
}

export function getConnectedCount(): number {
  let count = 0;
  for (const set of clients.values()) count += set.size;
  return count;
}
