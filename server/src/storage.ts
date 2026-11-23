import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './db.js';
import { cloudSyncEnabled, ghGetFile, ghPutFile } from './cloudSync.js';

export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const S3_BUCKET = process.env.S3_BUCKET;
const S3_PUBLIC_URL = (process.env.S3_PUBLIC_URL || '').replace(/\/+$/, '');
export const storageDriver: 'local' | 'github' | 's3' =
  S3_BUCKET && S3_PUBLIC_URL ? 's3' : cloudSyncEnabled ? 'github' : 'local';

let s3Client: any = null;
async function getS3() {
  if (s3Client) return s3Client;
  const { S3Client } = await import('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.S3_REGION || 'auto',
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === '1',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  });
  return s3Client;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export async function saveImage(buf: Buffer, mime: string, spaceHint = 'misc'): Promise<string> {
  const ext = EXT[mime] || 'jpg';
  const d = new Date();
  const key = `${spaceHint}/${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}/${crypto
    .randomBytes(16)
    .toString('base64url')}.${ext}`;

  if (storageDriver === 's3') {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const s3 = await getS3();
    await s3.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buf,
        ContentType: mime,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return `${S3_PUBLIC_URL}/${key}`;
  }

  const full = path.join(UPLOAD_DIR, key);
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buf);

  if (cloudSyncEnabled) {
    const ok = await ghPutFile(`uploads/${key}`, buf, `upload ${key}`);
    if (!ok && process.env.VERCEL) {
      throw new Error('cloud_upload_failed');
    }
  }
  return `/uploads/${key}`;
}

export async function ensureLocalUpload(relKey: string): Promise<string | null> {
  const clean = relKey.replace(/^\/+/, '');
  if (!/^[A-Za-z0-9_\-/]+\.[a-z]+$/.test(clean) || clean.includes('..')) return null;
  const full = path.join(UPLOAD_DIR, clean);
  if (fs.existsSync(full)) return full;
  if (!cloudSyncEnabled) return null;
  const buf = await ghGetFile(`uploads/${clean}`);
  if (!buf) return null;
  await fs.promises.mkdir(path.dirname(full), { recursive: true });
  await fs.promises.writeFile(full, buf);
  return full;
}

export function isOwnUrl(url: unknown): url is string {
  if (typeof url !== 'string' || url.length > 600) return false;
  if (storageDriver === 's3') return url.startsWith(S3_PUBLIC_URL + '/');
  return /^\/uploads\/[A-Za-z0-9_\-/]+\.[a-z]+$/.test(url) && !url.includes('..');
}
