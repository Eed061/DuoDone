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

  if (req.method === 'POST') {
    try {
      const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!payload || !payload.household) {
        return res.status(400).json({ error: 'Invalid payload: missing household' });
      }

      const dataToSave = {
        ...payload,
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

      return res.status(200).json({ success: true, code, updatedAt: dataToSave.updatedAt });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Server error saving state' });
    }
  }

  if (req.method === 'GET') {
    const memoryData = globalMemoryStore[code];
    if (memoryData) {
      return res.status(200).json(memoryData);
    }

    // Attempt retrieval from secondary REST backup store
    try {
      const resBackup = await fetch('https://api.restful-api.dev/objects');
      if (resBackup.ok) {
        const objects: any[] = await resBackup.json();
        const found = objects.reverse().find((o: any) => o.name === 'DUODONE_HH_' + code && o.data && o.data.household);
        if (found && found.data) {
          globalMemoryStore[code] = found.data;
          return res.status(200).json(found.data);
        }
      }
    } catch {}

    return res.status(404).json({ error: 'Household not found for code: ' + code });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
