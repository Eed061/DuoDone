import fs from 'node:fs';
import path from 'node:path';

/**
 * Free cloud persistence backed by a private GitHub repository (GITHUB_STORAGE_REPO + GITHUB_STORAGE_TOKEN).
 * Why: Render's Free Web Service has an ephemeral filesystem that resets on redeploy/sleep.
 * With this module:
 *  - On server startup, the latest SQLite database snapshot (db/duodone.db) is restored before SQLite opens it.
 *  - Every write transaction schedules a debounced consistent snapshot (`VACUUM INTO`) uploaded to GitHub.
 *  - Every uploaded photo is pushed to GitHub (`uploads/<key>`) and transparently lazy-fetched if missing locally.
 */

const REPO = process.env.GITHUB_STORAGE_REPO || ''; // e.g. "Eed061/duodone-storage"
const TOKEN = process.env.GITHUB_STORAGE_TOKEN || '';
const BRANCH = process.env.GITHUB_STORAGE_BRANCH || 'main';

export const cloudSyncEnabled = Boolean(REPO && TOKEN);

const apiBase = () => `https://api.github.com/repos/${REPO}/contents`;
const headers = () => ({
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'DuoDone-CloudSync',
});

const shaCache = new Map<string, string>();

export async function ghGetFile(remotePath: string): Promise<Buffer | null> {
  if (!cloudSyncEnabled) return null;
  try {
    const res = await fetch(`${apiBase()}/${remotePath}?ref=${encodeURIComponent(BRANCH)}`, {
      headers: headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const meta: any = await res.json();
    if (meta?.sha) shaCache.set(remotePath, meta.sha);
    if (meta?.content && meta?.encoding === 'base64') {
      return Buffer.from(meta.content.replace(/\s+/g, ''), 'base64');
    }
    if (meta?.download_url) {
      const raw = await fetch(meta.download_url, { headers: headers() });
      if (!raw.ok) return null;
      return Buffer.from(await raw.arrayBuffer());
    }
    return null;
  } catch (e) {
    console.error('[cloudSync] get failed:', remotePath, e);
    return null;
  }
}

export async function ghPutFile(remotePath: string, buf: Buffer, message: string): Promise<boolean> {
  if (!cloudSyncEnabled) return false;
  try {
    let sha = shaCache.get(remotePath);
    if (!sha) {
      const probe = await fetch(`${apiBase()}/${remotePath}?ref=${encodeURIComponent(BRANCH)}`, {
        headers: headers(),
      });
      if (probe.ok) {
        const meta: any = await probe.json();
        sha = meta?.sha;
      }
    }
    const body: Record<string, any> = {
      message,
      content: buf.toString('base64'),
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    let res = await fetch(`${apiBase()}/${remotePath}`, {
      method: 'PUT',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // If SHA was stale, re-fetch SHA once and retry
    if (res.status === 409 || res.status === 422) {
      const probe = await fetch(`${apiBase()}/${remotePath}?ref=${encodeURIComponent(BRANCH)}`, {
        headers: headers(),
      });
      if (probe.ok) {
        const meta: any = await probe.json();
        if (meta?.sha) body.sha = meta.sha;
      }
      res = await fetch(`${apiBase()}/${remotePath}`, {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      console.error('[cloudSync] put status', res.status, remotePath);
      return false;
    }
    const out: any = await res.json();
    if (out?.content?.sha) shaCache.set(remotePath, out.content.sha);
    return true;
  } catch (e) {
    console.error('[cloudSync] put failed:', remotePath, e);
    return false;
  }
}

export async function restoreDbIfNeeded(dbFilePath: string) {
  if (!cloudSyncEnabled) return;
  if (fs.existsSync(dbFilePath) && fs.statSync(dbFilePath).size > 4096) return;
  const buf = await ghGetFile('db/duodone.db');
  if (buf && buf.length > 0) {
    await fs.promises.mkdir(path.dirname(dbFilePath), { recursive: true });
    await fs.promises.writeFile(dbFilePath, buf);
    console.log(`[cloudSync] Restored SQLite DB from ${REPO} (${buf.length} bytes)`);
  }
}
