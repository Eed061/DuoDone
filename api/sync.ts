import type { VercelRequest, VercelResponse } from '@vercel/node';

// Persistent in-memory cache for household state on Vercel instance
const globalMemoryStore: Record<string, any> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers so web, mobile (Capacitor), and Telegram WebApp can connect seamlessly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawCode = (req.query.code as string) || (req.body && req.body.household && req.body.household.invite_code) || 'DUO-7789';
  const code = String(rawCode).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const requestingUserId = (req.query.userId as string) || (req.body && req.body.requestingUserId);

  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.household) {
        return res.status(400).json({ error: 'Invalid payload: missing household' });
      }

      // Check access control if attempting to join as 3rd member
      const existingData = globalMemoryStore[code];
      if (existingData && existingData.users && existingData.users.length >= 2) {
        const existingUserIds = existingData.users.map((u: any) => u.id);
        const isExistingMember = requestingUserId && existingUserIds.includes(requestingUserId);
        
        // If 2 partners are registered and a 3rd new user attempts to overwrite, reject
        if (!isExistingMember && payload.users && payload.users.length > 2) {
          return res.status(403).json({
            error: 'space_full',
            is_locked: true,
            message: 'Цей простір вже сформований для 2 партнерів. Створіть свій новий простір!'
          });
        }
      }

      // Auto-lock household if 2 members present
      const usersList = payload.users || [];
      const isLocked = usersList.length >= 2;

      const dataToSave = {
        ...payload,
        household: {
          ...payload.household,
          is_locked: isLocked,
        },
        updatedAt: new Date().toISOString(),
      };

      globalMemoryStore[code] = dataToSave;

      // Asynchronously backup to secondary REST store for cross-region persistence
      try {
        fetch('https://api.restful-api.dev/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'DUODONE_HH_' + code, data: dataToSave })
        }).catch(() => {});
      } catch {}

      return res.status(200).json({ success: true, code, updatedAt: dataToSave.updatedAt, is_locked: isLocked });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error saving state' });
    }
  }

  if (req.method === 'GET') {
    let memoryData = globalMemoryStore[code];

    if (!memoryData) {
      // Attempt retrieval from secondary REST backup store
      try {
        const resBackup = await fetch('https://api.restful-api.dev/objects');
        if (resBackup.ok) {
          const objects: any[] = await resBackup.json();
          const found = objects.reverse().find((o: any) => o.name === 'DUODONE_HH_' + code && o.data && o.data.household);
          if (found && found.data) {
            memoryData = found.data;
            globalMemoryStore[code] = memoryData;
          }
        }
      } catch {}
    }

    if (memoryData) {
      // Access control check for 3rd party
      if (req.query.action === 'join_check' && requestingUserId) {
        const userIds = (memoryData.users || []).map((u: any) => u.id);
        const isMember = userIds.includes(requestingUserId);
        if (!isMember && userIds.length >= 2) {
          return res.status(403).json({
            error: 'space_full',
            is_locked: true,
            message: 'Цей простір вже сформований для 2 партнерів. Створіть свій новий простір!'
          });
        }
      }
      return res.status(200).json(memoryData);
    }

    return res.status(404).json({ error: 'Household not found for code: ' + code });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
