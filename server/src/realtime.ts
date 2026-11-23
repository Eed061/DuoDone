import type { Server } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { userFromToken } from './auth.js';
import { get } from './db.js';

const clients = new Map<string, Set<WebSocket>>();

export function attachRealtime(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '/ws', 'http://localhost');
    const user = userFromToken(url.searchParams.get('token'));
    if (!user) {
      ws.close(4001, 'unauthorized');
      return;
    }
    const uid = user.id as string;
    if (!clients.has(uid)) clients.set(uid, new Set());
    clients.get(uid)!.add(ws);
    (ws as any).isAlive = true;
    ws.on('pong', () => ((ws as any).isAlive = true));
    ws.on('message', (data) => {
      if (data.toString() === 'ping') ws.send('pong');
    });
    ws.on('close', () => {
      const set = clients.get(uid);
      set?.delete(ws);
      if (set && set.size === 0) clients.delete(uid);
    });
    ws.send(JSON.stringify({ type: 'hello' }));
  });

  const interval = setInterval(() => {
    for (const ws of wss.clients) {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        continue;
      }
      (ws as any).isAlive = false;
      try {
        ws.ping();
      } catch {
        /* ignore */
      }
    }
  }, 25_000);
  wss.on('close', () => clearInterval(interval));
}

export function notifyUsers(userIds: (string | null | undefined)[], msg: object) {
  const payload = JSON.stringify(msg);
  for (const id of new Set(userIds.filter(Boolean) as string[])) {
    for (const ws of clients.get(id) || []) {
      if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
  }
}

/** Tells both partners of the space that its state changed — clients refetch. */
export function notifySpace(spaceId: string, extraUserIds: (string | null | undefined)[] = []) {
  const s = get(`SELECT p1_user_id, p2_user_id FROM spaces WHERE id = ?`, spaceId);
  notifyUsers([s?.p1_user_id, s?.p2_user_id, ...extraUserIds], { type: 'space', spaceId });
}
