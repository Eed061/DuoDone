import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cloudSyncEnabled, ghPutFile, restoreDbIfNeeded } from './cloudSync.js';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'duodone.db');
await restoreDbIfNeeded(DB_PATH);

export const db = new DatabaseSync(DB_PATH);

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tg_id TEXT UNIQUE,
  tg_username TEXT,
  first_name TEXT,
  lang TEXT NOT NULL DEFAULT 'uk',
  quickstart_dismissed INTEGER NOT NULL DEFAULT 0,
  recovery_key TEXT UNIQUE,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  p1_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  p2_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  p1_name TEXT NOT NULL,
  p2_name TEXT NOT NULL,
  p1_avatar TEXT NOT NULL DEFAULT '🦊',
  p2_avatar TEXT NOT NULL DEFAULT '🐰',
  mode TEXT NOT NULL DEFAULT 'symmetric',
  show_balancer INTEGER NOT NULL DEFAULT 1,
  cycle_period TEXT NOT NULL DEFAULT 'weekly',
  cycle_days INTEGER NOT NULL DEFAULT 7,
  cycle_started_at INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'roulette',
  reward_text TEXT NOT NULL DEFAULT '',
  cat_enabled INTEGER NOT NULL DEFAULT 1,
  cat_name TEXT NOT NULL DEFAULT 'Мурчик',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS prefs (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  acting_role TEXT,
  PRIMARY KEY (user_id, space_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  title TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 1,
  photo_required INTEGER NOT NULL DEFAULT 0,
  turn_role TEXT NOT NULL DEFAULT 'p1',
  last_done_at INTEGER,
  last_done_by TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  show_on_dashboard INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS counters (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  title TEXT NOT NULL,
  step INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 1,
  photo_mode TEXT NOT NULL DEFAULT 'none',
  active INTEGER NOT NULL DEFAULT 1,
  show_on_dashboard INTEGER NOT NULL DEFAULT 1,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  item_id TEXT NOT NULL,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  role TEXT NOT NULL,
  user_id TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL DEFAULT 0,
  photos TEXT NOT NULL DEFAULT '[]',
  out_of_turn INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_space_time ON logs(space_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_item ON logs(item_id, created_at);

CREATE TABLE IF NOT EXISTS roulette (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  pool TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS cycles (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  started_at INTEGER NOT NULL,
  ended_at INTEGER NOT NULL,
  p1_xp INTEGER NOT NULL,
  p2_xp INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_spaces_p1 ON spaces(p1_user_id);
CREATE INDEX IF NOT EXISTS idx_spaces_p2 ON spaces(p2_user_id);
`);

export const uid = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
let syncPending = false;
let inTx = 0;

async function flushDbSnapshot() {
  if (!cloudSyncEnabled) return;
  if (syncing) {
    syncPending = true;
    return;
  }
  syncing = true;
  const snapPath = path.join(DATA_DIR, `snap-${Date.now()}.db`);
  try {
    try {
      fs.unlinkSync(snapPath);
    } catch {}
    const escaped = snapPath.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${escaped}'`);
    const buf = await fs.promises.readFile(snapPath);
    await ghPutFile('db/duodone.db', buf, 'sync db snapshot');
  } catch (e) {
    console.error('[cloudSync] snapshot failed:', e);
  } finally {
    try {
      await fs.promises.unlink(snapPath);
    } catch {}
    syncing = false;
    if (syncPending) {
      syncPending = false;
      scheduleDbSync();
    }
  }
}

export function scheduleDbSync() {
  if (!cloudSyncEnabled) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    flushDbSnapshot();
  }, 1800);
}

export function tx<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  inTx++;
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  } finally {
    inTx--;
    if (inTx === 0) scheduleDbSync();
  }
}

export type Row = Record<string, any>;
export const get = (sql: string, ...p: any[]) => db.prepare(sql).get(...p) as Row | undefined;
export const all = (sql: string, ...p: any[]) => db.prepare(sql).all(...p) as Row[];
export const run = (sql: string, ...p: any[]) => {
  const res = db.prepare(sql).run(...p);
  if (inTx === 0 && !/UPDATE\s+sessions\s+SET\s+last_seen/i.test(sql)) {
    scheduleDbSync();
  }
  return res;
};
