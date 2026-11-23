import express from 'express';
import { apiRouter } from '../server/src/routes.js';
import { UPLOAD_DIR, ensureLocalUpload } from '../server/src/storage.js';
import { ensureDbReady, flushDbSyncNow, refreshDbFromCloudIfNeeded } from '../server/src/db.js';

const BOT_TOKEN = process.env.BOT_TOKEN || '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const BOT_USERNAME = process.env.BOT_USERNAME || 'DuoDone_bot';
const ALLOW_INSECURE_TG = process.env.ALLOW_INSECURE_TG === '1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

const SKIP_DB_PATHS = new Set(['/api/health', '/api/config', '/api/bot']);

app.use(async (req, res, next) => {
  if (req.path.startsWith('/uploads/') || SKIP_DB_PATHS.has(req.path)) {
    return next();
  }
  const isMutating = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  const forceRefresh = isMutating && req.path !== '/api/upload';
  try {
    await ensureDbReady();
    await refreshDbFromCloudIfNeeded(forceRefresh);
  } catch (e) {
    console.error('DB init error:', e);
  }
  if (isMutating) {
    const origJson = res.json.bind(res);
    res.json = ((body: any) => {
      flushDbSyncNow()
        .catch(() => {})
        .finally(() => origJson(body));
      return res;
    }) as any;
  }
  next();
});

app.use(
  '/api',
  apiRouter({
    botToken: BOT_TOKEN,
    allowInsecureTg: ALLOW_INSECURE_TG,
    publicConfig: {
      botUsername: BOT_USERNAME,
      appShortName: process.env.TG_APP_SHORT_NAME || '',
      publicUrl: (process.env.PUBLIC_URL || 'https://duo-done.vercel.app').replace(/\/+$/, ''),
      telegramAuth: !!BOT_TOKEN || ALLOW_INSECURE_TG,
      wsEnabled: false,
    },
  }),
);

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));
app.get(/^\/uploads\/(.+)$/, async (req, res) => {
  const key = (req.params as any)[0] || '';
  const full = await ensureLocalUpload(key);
  if (!full) return res.status(404).end();
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(full);
});

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({ error: 'handler_crash', message: String(err?.message || err) });
  }
}
