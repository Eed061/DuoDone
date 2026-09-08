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

  const rawCode = (req.query.code as string) || (req.body && req.body.household && req.body.household.invite_code);
  if (!rawCode) {
    return res.status(400).json({ error: 'Missing invite code parameter' });
  }

  const code = String(rawCode).toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const requestingUserId = (req.query.userId as string) || (req.body && req.body.requestingUserId);
  const requestingTgId = (req.query.tgId as string) || (req.body && req.body.requestingTgId);
  const requestingTgUsername = (req.query.tgUsername as string) || (req.body && req.body.requestingTgUsername);

  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.household) {
        return res.status(400).json({ error: 'Invalid payload: missing household' });
      }

      // Check access control if 2 real partners are already registered
      const existingData = globalMemoryStore[code];
      if (existingData && existingData.users) {
        const realMembers = existingData.users.filter((u: any) => !u.is_placeholder);
        
        if (realMembers.length >= 2) {
          const realMemberTgIds = realMembers.map((u: any) => String(u.telegram_id || ''));
          const realMemberTgUsernames = realMembers.map((u: any) => String(u.telegram_username || '').replace('@', '').toLowerCase());
          
          let isAuthorized = false;

          if (requestingTgId && realMemberTgIds.includes(String(requestingTgId))) {
            isAuthorized = true;
          } else if (requestingTgUsername && requestingTgUsername !== '' && realMemberTgUsernames.includes(String(requestingTgUsername).toLowerCase())) {
            isAuthorized = true;
          } else if (!requestingTgId && !requestingTgUsername && requestingUserId) {
            const matchedMember = realMembers.find((u: any) => String(u.id) === String(requestingUserId));
            if (matchedMember && !matchedMember.telegram_id) {
              isAuthorized = true;
            }
          }

          if (!isAuthorized) {
            return res.status(403).json({
              error: 'space_full',
              is_locked: true,
              message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний новий простір!'
            });
          }
        }
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
      const realMembers = (memoryData.users || []).filter((u: any) => !u.is_placeholder);
      
      if (realMembers.length >= 2) {
        const realMemberTgIds = realMembers.map((u: any) => String(u.telegram_id || ''));
        const realMemberTgUsernames = realMembers.map((u: any) => String(u.telegram_username || '').replace('@', '').toLowerCase());
        
        let isAuthorized = false;

        if (requestingTgId && realMemberTgIds.includes(String(requestingTgId))) {
          isAuthorized = true;
        } else if (requestingTgUsername && requestingTgUsername !== '' && realMemberTgUsernames.includes(String(requestingTgUsername).toLowerCase())) {
          isAuthorized = true;
        } else if (!requestingTgId && !requestingTgUsername && requestingUserId) {
          const matchedMember = realMembers.find((u: any) => String(u.id) === String(requestingUserId));
          if (matchedMember && !matchedMember.telegram_id) {
            isAuthorized = true;
          }
        }

        if (!isAuthorized) {
          return res.status(403).json({
            error: 'space_full',
            is_locked: true,
            message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний новий простір!'
          });
        }
      }

      return res.status(200).json(memoryData);
    }

    return res.status(404).json({ error: 'Household not found for code: ' + code });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
