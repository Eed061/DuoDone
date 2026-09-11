import type { VercelRequest, VercelResponse } from '@vercel/node';

// Use globalThis to persist state across warm serverless re-invocations on Vercel.
// This survives function restarts within the same instance (warm starts).
// Data is lost on cold starts, but that is acceptable for the MVP.
declare const globalThis: any;
if (!globalThis.__duodoneStore) {
  globalThis.__duodoneStore = {};
}
const globalMemoryStore: Record<string, any> = globalThis.__duodoneStore;

/**
 * Checks whether the requesting user is an authorized member of a household.
 * SOFT mode: if the stored household has fewer than 2 real members, anyone can access.
 * STRICT mode: if 2 real members exist, only those members can access.
 */
function isAuthorized(
  storedData: any,
  requestingUserId?: string,
  requestingTgId?: string,
  requestingTgUsername?: string,
  strict = true
): boolean {
  if (!storedData?.users) return true;

  const realMembers = storedData.users.filter((u: any) => !u.is_placeholder);

  // Space not yet full — allow anyone to read/write (joining in progress)
  if (realMembers.length < 2) return true;

  // Space full (2 real members) — strict access control
  if (!strict) return true;

  const memberTgIds = realMembers.map((u: any) => String(u.telegram_id || '').trim()).filter(Boolean);
  const memberTgUsernames = realMembers.map((u: any) =>
    String(u.telegram_username || '').replace('@', '').toLowerCase().trim()
  ).filter(Boolean);
  const memberUserIds = realMembers.map((u: any) => String(u.id || ''));

  // Match by Telegram ID (most reliable)
  if (requestingTgId && requestingTgId !== '' && memberTgIds.includes(requestingTgId)) return true;

  // Match by Telegram username (fallback)
  if (requestingTgUsername && requestingTgUsername !== '' &&
      memberTgUsernames.includes(requestingTgUsername.toLowerCase())) return true;

  // Match by internal user ID (for non-Telegram users or first launch)
  if (requestingUserId && memberUserIds.includes(requestingUserId)) return true;

  // Last resort: if none of the stored members have telegram_id set yet,
  // allow access (migration scenario — creator hasn't fully linked TG yet)
  const anyMemberHasTg = realMembers.some((u: any) => u.telegram_id);
  if (!anyMemberHasTg && requestingUserId) return true;

  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS — allow web, mobile (Capacitor), Telegram WebApp
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawCode =
    (req.query.code as string) ||
    (req.body && req.body.household && req.body.household.invite_code);

  if (!rawCode) {
    return res.status(400).json({ error: 'Missing invite code parameter' });
  }

  const code = String(rawCode).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const requestingUserId = ((req.query.userId as string) || (req.body && req.body.requestingUserId) || '').trim();
  const requestingTgId = ((req.query.tgId as string) || (req.body && req.body.requestingTgId) || '').trim();
  const requestingTgUsername = ((req.query.tgUsername as string) || (req.body && req.body.requestingTgUsername) || '')
    .toLowerCase()
    .replace('@', '')
    .trim();

  // ── POST: Save state ──────────────────────────────────────────────────────
  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.household) {
        return res.status(400).json({ error: 'Invalid payload: missing household' });
      }

      const existingData = globalMemoryStore[code];

      // Access control: only authorized members can overwrite a locked space
      if (existingData && !isAuthorized(existingData, requestingUserId, requestingTgId, requestingTgUsername)) {
        return res.status(403).json({
          error: 'space_full',
          is_locked: true,
          message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний новий простір!',
        });
      }

      const usersList = payload.users || [];
      const realUsersCount = usersList.filter((u: any) => !u.is_placeholder).length;
      const isLocked = realUsersCount >= 2;

      const dataToSave = {
        ...payload,
        household: {
          ...payload.household,
          is_locked: isLocked,
        },
        updatedAt: new Date().toISOString(),
      };

      globalMemoryStore[code] = dataToSave;

      return res.status(200).json({
        success: true,
        code,
        updatedAt: dataToSave.updatedAt,
        is_locked: isLocked,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error saving state' });
    }
  }

  // ── GET: Fetch state ──────────────────────────────────────────────────────
  if (req.method === 'GET') {
    // Special join-check action
    const action = req.query.action as string;
    if (action === 'join_check') {
      const memData = globalMemoryStore[code];
      if (memData && !isAuthorized(memData, requestingUserId, requestingTgId, requestingTgUsername)) {
        return res.status(403).json({
          error: 'space_full',
          is_locked: true,
          message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний новий простір!',
        });
      }
      return res.status(200).json({ allowed: true });
    }

    const memoryData = globalMemoryStore[code];

    if (memoryData) {
      // Access control for locked spaces
      if (!isAuthorized(memoryData, requestingUserId, requestingTgId, requestingTgUsername)) {
        return res.status(403).json({
          error: 'space_full',
          is_locked: true,
          message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний новий простір!',
        });
      }
      return res.status(200).json(memoryData);
    }

    return res.status(404).json({ error: 'Household not found for code: ' + code });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
