import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { get, run, uid, Row } from './db.js';

export interface TgUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

/**
 * Validates Telegram WebApp initData according to
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateInitData(initData: string, botToken: string, maxAgeSec = 60 * 60 * 24 * 7) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  const a = Buffer.from(calc, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) return null;
  let user: TgUser | null = null;
  try {
    user = JSON.parse(params.get('user') || 'null');
  } catch {
    user = null;
  }
  if (!user?.id) return null;
  return { user, startParam: params.get('start_param') };
}

/** Parses initData WITHOUT signature check — only for local development (ALLOW_INSECURE_TG=1). */
export function parseInitDataInsecure(initData: string) {
  const params = new URLSearchParams(initData);
  try {
    const user = JSON.parse(params.get('user') || 'null') as TgUser | null;
    if (!user?.id) return null;
    return { user, startParam: params.get('start_param') };
  } catch {
    return null;
  }
}

const newRecoveryKey = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(12);
  let s = '';
  for (let i = 0; i < 12; i++) s += alphabet[bytes[i] % alphabet.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}`;
};

export function createUser(fields: { tgId?: string; tgUsername?: string; firstName?: string; lang?: string }) {
  const id = uid();
  run(
    `INSERT INTO users (id, tg_id, tg_username, first_name, lang, recovery_key, created_at) VALUES (?,?,?,?,?,?,?)`,
    id,
    fields.tgId ?? null,
    fields.tgUsername ?? null,
    fields.firstName ?? null,
    fields.lang === 'en' ? 'en' : 'uk',
    newRecoveryKey(),
    Date.now(),
  );
  return get(`SELECT * FROM users WHERE id = ?`, id)!;
}

export function upsertTelegramUser(tg: TgUser) {
  const tgId = String(tg.id);
  const existing = get(`SELECT * FROM users WHERE tg_id = ?`, tgId);
  const firstName = [tg.first_name, tg.last_name].filter(Boolean).join(' ').trim() || tg.username || null;
  if (existing) {
    // Only Telegram profile fields are refreshed. Custom names inside spaces are never touched.
    run(`UPDATE users SET tg_username = ?, first_name = ? WHERE id = ?`, tg.username ?? null, firstName, existing.id);
    return get(`SELECT * FROM users WHERE id = ?`, existing.id)!;
  }
  return createUser({
    tgId,
    tgUsername: tg.username,
    firstName: firstName ?? undefined,
    lang: tg.language_code === 'en' ? 'en' : 'uk',
  });
}

export function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const now = Date.now();
  run(`INSERT INTO sessions (token, user_id, created_at, last_seen) VALUES (?,?,?,?)`, token, userId, now, now);
  return token;
}

export function userFromToken(token: string | undefined | null): Row | undefined {
  if (!token) return undefined;
  const s = get(`SELECT * FROM sessions WHERE token = ?`, token);
  if (!s) return undefined;
  const now = Date.now();
  if (now - s.last_seen > 60_000) run(`UPDATE sessions SET last_seen = ? WHERE token = ?`, now, token);
  return get(`SELECT * FROM users WHERE id = ?`, s.user_id);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Row;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : undefined;
  const user = userFromToken(token);
  if (!user) return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  next();
}
