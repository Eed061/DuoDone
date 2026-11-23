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

const fbKey = (remotePath: string) => remotePath.replace(/[^A-Za-z0-9_\-/]/g, '_').replace(/\./g, '_dot_');

export async function fbGetRemoteUpdatedAt(remotePath: string): Promise<number> {
  if (!firebaseEnabled) return 0;
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
    const res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}.json`);
    if (!res.ok) return null;
    const data: any = await res.json();
    if (!data?.b64) return null;
    return { buf: Buffer.from(data.b64, 'base64'), updatedAt: Number(data.updatedAt || Date.now()) };
  } catch {
    return null;
  }
}

async function fbPutFile(remotePath: string, buf: Buffer): Promise<number> {
  if (!firebaseEnabled) return 0;
  try {
    const now = Date.now();
    const res = await fetch(`${FIREBASE_DB_URL}/v2_storage/${fbKey(remotePath)}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b64: buf.toString('base64'), updatedAt: now }),
    });
    return res.ok ? now : 0;
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
    if (remotePath === 'db/duodone.db') localDbUpdatedAt = fb.updatedAt;
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
