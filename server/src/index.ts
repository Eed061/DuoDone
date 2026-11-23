import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import express from 'express';

try {
  process.loadEnvFile?.('.env');
} catch {
  /* no .env file — rely on real environment variables */
}

const { apiRouter } = await import('./routes.js');
const { attachRealtime } = await import('./realtime.js');
const { UPLOAD_DIR, ensureLocalUpload, storageDriver } = await import('./storage.js');

const PORT = Number(process.env.PORT || 3001);
const BOT_TOKEN = process.env.BOT_TOKEN || '8610123389:AAEB_fhurfxpSJZxQtceltu7ez4WhMMYjAo';
const BOT_USERNAME = process.env.BOT_USERNAME || 'DuoDone_bot';
const ALLOW_INSECURE_TG = process.env.ALLOW_INSECURE_TG === '1';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(
  '/api',
  apiRouter({
    botToken: BOT_TOKEN,
    allowInsecureTg: ALLOW_INSECURE_TG,
    publicConfig: {
      botUsername: BOT_USERNAME,
      appShortName: process.env.TG_APP_SHORT_NAME || '',
      publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, ''),
      telegramAuth: !!BOT_TOKEN || ALLOW_INSECURE_TG,
      wsEnabled: true,
    },
  }),
);

// Uploaded photos: serve from disk, or lazy-fetch from Firebase/GitHub cloud storage on cache miss
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));
app.get(/^\/uploads\/(.+)$/, async (req, res) => {
  const key = (req.params as any)[0] || '';
  const full = await ensureLocalUpload(key);
  if (!full) return res.status(404).end();
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(full);
});

// Built client (production)
const DIST = path.resolve('client/dist');
if (fs.existsSync(DIST)) {
  app.use(
    express.static(DIST, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  app.get(/^(?!\/(api|uploads|ws)\b).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

const server = http.createServer(app);
attachRealtime(server);
server.listen(PORT, () => {
  console.log(
    `DuoDone server on http://localhost:${PORT}  (storage: ${storageDriver}, telegram auth: ${
      BOT_TOKEN ? 'signed' : ALLOW_INSECURE_TG ? 'INSECURE dev' : 'off'
    })`,
  );
});
