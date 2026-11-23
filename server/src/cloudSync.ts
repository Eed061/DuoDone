import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Cloud persistence for SQLite DB snapshots + uploaded photos.
 * Primary driver: Firebase Realtime Database (zero-config, works on Render Free & Vercel Serverless).
 * Secondary driver: Private GitHub repository (GITHUB_STORAGE_REPO + GITHUB_STORAGE_TOKEN).
 */

const FIREBASE_DB_URL = (
  process.env.FIREBASE_DB_URL || 'https://duodone-f4f09-default-rtdb.europe-west1.firebasedatabase.app'
).replace(/\/+$/, '');

const GH_REPO = process.env.GITHUB_STORAGE_REPO || '';
const GH_TOKEN = process.env.GITHUB_STORAGE_TOKEN || '';
const GH_BRANCH = process.env.GITHUB_STORAGE_BRANCH || 'main';

export const firebaseEnabled = Boolean(FIREBASE_DB_URL && process.env.DISABLE_FIREBASE_SYNC !== '1');
export const ghSyncEnabled = Boolean(GH_REPO && GH_TOKEN);
export const cloudSyncEnabled = firebaseEnabled || ghSyncEnabled;

export let localDbUpdatedAt = 0;
let lastCheckedAt = 0;
let lastRemoteEtag = '';

const fbKey = (remotePath: string) => remotePath.replace(/[^A-Za-z0-9_\-/]/g, '_').replace(/\./g, '_dot_');

export async function fbGetRemoteUpdatedAt(remotePath: string, force = false): Promise<number> {
  if (!firebaseEnabled) return 0;
  const now = Date.now();
  // TTL cache (2.5s) on read-only polls so burst GET requests don't hit Firebase repeatedly
  if (!force && now - lastCheckedAt < 2500) {
    return localDbUpdatedAt;
  }
  lastCheckedAt = now;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}/updatedAt.json`);
    if (!res.ok) return 0;
    const ts = await res.json();
    return typeof ts === 'number' ? ts : 0;
  } catch {
    return 0;
  }
}

async function fbGetFile(remotePath: string): Promise<{ buf: Buffer; updatedAt: number } | null> {
  if (!firebaseEnabled) return null;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}.json`, {
      headers: { 'X-Firebase-ETag': 'true' },
    });
    if (!res.ok) return null;
    const etag = res.headers.get('etag') || '';
    const data: any = await res.json();
    if (!data?.b64) return null;
    if (remotePath === 'db/duodone.db' && etag) lastRemoteEtag = etag;
    return { buf: Buffer.from(data.b64, 'base64'), updatedAt: Number(data.updatedAt || Date.now()) };
  } catch {
    return null;
  }
}

async function fbPutFile(remotePath: string, buf: Buffer): Promise<number> {
  if (!firebaseEnabled) return 0;
  try {
    const now = Date.now();
    const isDb = remotePath === 'db/duodone.db';
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Firebase-ETag': 'true',
    };
    if (isDb && lastRemoteEtag && lastRemoteEtag !== 'null_etag') {
      reqHeaders['if-match'] = lastRemoteEtag;
    }
    let res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}.json`, {
      method: 'PUT',
      headers: reqHeaders,
      body: JSON.stringify({ b64: buf.toString('base64'), updatedAt: now }),
    });
    if (res.status === 412) {
      res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Firebase-ETag': 'true' },
        body: JSON.stringify({ b64: buf.toString('base64'), updatedAt: now }),
      });
    }
    if (!res.ok) return 0;
    const newEtag = res.headers.get('etag') || '';
    if (isDb && newEtag) lastRemoteEtag = newEtag;
    lastCheckedAt = Date.now();
    return now;
  } catch {
    return 0;
  }
}

const ghHeaders = () => ({
  Authorization: `Bearer ${GH_TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'DuoDone-CloudSync',
});
const shaCache = new Map<string, string>();

export async function ghGetFile(remotePath: string): Promise<Buffer | null> {
  const fb = await fbGetFile(remotePath);
  if (fb) {
    if (remotePath === 'db/duodone.db') {
      localDbUpdatedAt = fb.updatedAt;
      lastCheckedAt = Date.now();
    }
    return fb.buf;
  }
  if (!ghSyncEnabled) return null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${remotePath}?ref=${encodeURIComponent(GH_BRANCH)}`, {
      headers: ghHeaders(),
    });
    if (!res.ok) return null;
    const meta: any = await res.json();
    if (meta?.sha) shaCache.set(remotePath, meta.sha);
    if (meta?.content && meta?.encoding === 'base64') {
      return Buffer.from(meta.content.replace(/\s+/g, ''), 'base64');
    }
    return null;
  } catch {
    return null;
  }
}

export async function ghPutFile(remotePath: string, buf: Buffer, message: string): Promise<boolean> {
  let ok = false;
  if (firebaseEnabled) {
    const ts = await fbPutFile(remotePath, buf);
    if (ts > 0) {
      if (remotePath === 'db/duodone.db') localDbUpdatedAt = ts;
      ok = true;
    }
  }
  if (ghSyncEnabled) {
    try {
      const apiBase = `https://api.github.com/repos/${GH_REPO}/contents`;
      let sha = shaCache.get(remotePath);
      if (!sha) {
        const probe = await fetch(`${apiBase}/${remotePath}?ref=${encodeURIComponent(GH_BRANCH)}`, { headers: ghHeaders() });
        if (probe.ok) sha = ((await probe.json()) as any)?.sha;
      }
      const body: Record<string, any> = { message, content: buf.toString('base64'), branch: GH_BRANCH };
      if (sha) body.sha = sha;
      const res = await fetch(`${apiBase}/${remotePath}`, {
        method: 'PUT',
        headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const out: any = await res.json();
        if (out?.content?.sha) shaCache.set(remotePath, out.content.sha);
        ok = true;
      }
    } catch {
      /* ignore */
    }
  }
  return ok;
}

export async function restoreDbIfNeeded(dbFilePath: string, force = false) {
  if (!cloudSyncEnabled) return false;
  if (!force && fs.existsSync(dbFilePath) && fs.statSync(dbFilePath).size > 4096) return false;
  const buf = await ghGetFile('db/duodone.db');
  if (buf && buf.length > 0) {
    await fs.promises.mkdir(path.dirname(dbFilePath), { recursive: true });
    await fs.promises.writeFile(dbFilePath, buf);
    console.log(`[cloudSync] Restored SQLite DB (${buf.length} bytes)`);
    return true;
  }
  return false;
}

let cachedBotToken: string | undefined = process.env.BOT_TOKEN || undefined;
const CFG_KEY = '9GtehqoSZwwghcODQzCdeDctl9DYOciaapzfjXoGaVE';

export async function resolveBotToken(): Promise<string | undefined> {
  if (cachedBotToken) return cachedBotToken;
  if (!FIREBASE_DB_URL) return undefined;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/v2_storage/_cfg_v2.json`);
    if (!res.ok) return undefined;
    const data: any = await res.json();
    if (!data?.ct) return undefined;
    const raw = Buffer.from(data.ct, 'base64url');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const enc = raw.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(CFG_KEY, 'base64url'), iv);
    decipher.setAuthTag(tag);
    cachedBotToken = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return cachedBotToken;
  } catch {
    return undefined;
  }
}
