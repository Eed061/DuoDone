import os from 'node:os';
import path from 'node:path';
import express from 'express';

// On serverless (Vercel), /tmp is writable
if (!process.env.DATA_DIR && process.env.VERCEL) {
  process.env.DATA_DIR = path.join(os.tmpdir(), 'duodone-data');
}

const { apiRouter } = await import('../server/src/routes.js');
const { UPLOAD_DIR, ensureLocalUpload } = await import('../server/src/storage.js');
const { flushDbSyncNow, refreshDbFromCloudIfNeeded } = await import('../server/src/db.js');

const BOT_TOKEN = process.env.BOT_TOKEN || '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const BOT_USERNAME = process.env.BOT_USERNAME || 'DuoDone_bot';
const ALLOW_INSECURE_TG = process.env.ALLOW_INSECURE_TG === '1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

// Sync DB from/to Firebase across serverless invocations
app.use(async (req, res, next) => {
  await refreshDbFromCloudIfNeeded().catch(() => {});
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
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
      publicUrl: (process.env.PUBLIC_URL || 'https://duodone-one.vercel.app').replace(/\/+$/, ''),
      telegramAuth: !!BOT_TOKEN || ALLOW_INSECURE_TG,
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

export default app;
