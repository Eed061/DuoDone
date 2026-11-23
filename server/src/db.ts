import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { cloudSyncEnabled, fbGetRemoteUpdatedAt, ghPutFile, localDbUpdatedAt, restoreDbIfNeeded } from './cloudSync.js';

export const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'duodone.db');

const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

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
`;

export type Row = Record<string, any>;

interface DbAdapter {
  exec(sql: string): void;
  get(sql: string, ...p: any[]): Row | undefined;
  all(sql: string, ...p: any[]): Row[];
  run(sql: string, ...p: any[]): void;
  exportBytes(): Promise<Buffer>;
  close(): void;
}

let NativeDatabaseSync: any = undefined;
async function getNativeSqlite() {
  if (NativeDatabaseSync !== undefined) return NativeDatabaseSync;
  try {
    const mod = await import('node:sqlite');
    NativeDatabaseSync = mod.DatabaseSync;
  } catch {
    NativeDatabaseSync = null;
  }
  return NativeDatabaseSync;
}

let SQLJs: any = null;
async function getSqlJs() {
  if (SQLJs) return SQLJs;
  const initSqlJs = (await import('sql.js')).default;
  SQLJs = await initSqlJs();
  return SQLJs;
}

async function openAdapter(): Promise<DbAdapter> {
  const Native = await getNativeSqlite();
  if (Native) {
    const ndb = new Native(DB_PATH);
    ndb.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;');
    ndb.exec(SCHEMA_SQL);
    return {
      exec: (sql) => ndb.exec(sql),
      get: (sql, ...p) => ndb.prepare(sql).get(...p) as Row | undefined,
      all: (sql, ...p) => ndb.prepare(sql).all(...p) as Row[],
      run: (sql, ...p) => {
        ndb.prepare(sql).run(...p);
      },
      exportBytes: async () => {
        const snapPath = path.join(DATA_DIR, `snap-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
        try {
          const escaped = snapPath.replace(/'/g, "''");
          ndb.exec(`VACUUM INTO '${escaped}'`);
          return await fs.promises.readFile(snapPath);
        } finally {
          try {
            await fs.promises.unlink(snapPath);
          } catch {}
        }
      },
      close: () => {
        try {
          ndb.close();
        } catch {}
      },
    };
  }

  // Fallback: sql.js (pure WASM SQLite — works on Node 18/20/22 on Vercel Serverless)
  const SQL = await getSqlJs();
  const initial = fs.existsSync(DB_PATH) ? await fs.promises.readFile(DB_PATH) : undefined;
  const sdb = new SQL.Database(initial && initial.length > 0 ? new Uint8Array(initial) : undefined);
  sdb.run(SCHEMA_SQL);

  const bindParams = (p: any[]) => p.map((x) => (x === undefined ? null : x));

  return {
    exec: (sql) => sdb.run(sql),
    get: (sql, ...p) => {
      const stmt = sdb.prepare(sql);
      try {
        stmt.bind(bindParams(p));
        if (stmt.step()) return stmt.getAsObject() as Row;
        return undefined;
      } finally {
        stmt.free();
      }
    },
    all: (sql, ...p) => {
      const stmt = sdb.prepare(sql);
      const rows: Row[] = [];
      try {
        stmt.bind(bindParams(p));
        while (stmt.step()) rows.push(stmt.getAsObject() as Row);
        return rows;
      } finally {
        stmt.free();
      }
    },
    run: (sql, ...p) => {
      sdb.run(sql, bindParams(p));
    },
    exportBytes: async () => {
      const bytes: Uint8Array = sdb.export();
      const buf = Buffer.from(bytes);
      await fs.promises.writeFile(DB_PATH, buf).catch(() => {});
      return buf;
    },
    close: () => {
      try {
        sdb.close();
      } catch {}
    },
  };
}

let adapter: DbAdapter | null = null;
let initPromise: Promise<void> | null = null;

export async function ensureDbReady(): Promise<void> {
  if (adapter) return;
  if (!initPromise) {
    initPromise = (async () => {
      await restoreDbIfNeeded(DB_PATH);
      adapter = await openAdapter();
    })();
  }
  await initPromise;
}

export const uid = (bytes = 12) => crypto.randomBytes(bytes).toString('base64url');

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncing = false;
let syncPending = false;
let inTx = 0;

async function flushDbSnapshot() {
  if (!cloudSyncEnabled || !adapter) return;
  if (syncing) {
    syncPending = true;
    return;
  }
  syncing = true;
  try {
    const buf = await adapter.exportBytes();
    await ghPutFile('db/duodone.db', buf, 'sync db snapshot');
  } catch (e) {
    console.error('[cloudSync] snapshot failed:', e);
  } finally {
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
  }, 1200);
}

export async function flushDbSyncNow() {
  if (!cloudSyncEnabled) return;
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  await flushDbSnapshot();
}

export async function refreshDbFromCloudIfNeeded() {
  await ensureDbReady();
  if (!cloudSyncEnabled || syncTimer || syncing) return;
  const remoteTs = await fbGetRemoteUpdatedAt('db/duodone.db');
  if (remoteTs > localDbUpdatedAt) {
    adapter?.close();
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        fs.unlinkSync(DB_PATH + suffix);
      } catch {}
    }
    await restoreDbIfNeeded(DB_PATH, true);
    adapter = await openAdapter();
  }
}

export function tx<T>(fn: () => T): T {
  adapter!.exec('BEGIN IMMEDIATE');
  inTx++;
  try {
    const r = fn();
    adapter!.exec('COMMIT');
    return r;
  } catch (e) {
    adapter!.exec('ROLLBACK');
    throw e;
  } finally {
    inTx--;
    if (inTx === 0) scheduleDbSync();
  }
}

export const get = (sql: string, ...p: any[]) => adapter!.get(sql, ...p);
export const all = (sql: string, ...p: any[]) => adapter!.all(sql, ...p);
export const run = (sql: string, ...p: any[]) => {
  adapter!.run(sql, ...p);
  if (inTx === 0 && !/UPDATE\s+sessions\s+SET\s+last_seen/i.test(sql)) {
    scheduleDbSync();
  }
};
