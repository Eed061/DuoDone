import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { all, ensureDbReady, get, run, tx, uid, Row } from './db.js';
import {
  createSession,
  createUser,
  parseInitDataInsecure,
  requireAuth,
  upsertTelegramUser,
  validateInitData,
} from './auth.js';
import { isOwnUrl, saveImage } from './storage.js';
import { notifySpace, notifyUsers } from './realtime.js';
import { DEFAULT_NAMES, isTemplateName, normalizeLang, seedSpace } from './seed.js';

type Role = 'p1' | 'p2';
const other = (r: Role): Role => (r === 'p1' ? 'p2' : 'p1');
const DAY = 86_400_000;

class HttpError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}
const fail = (status: number, code: string): never => {
  throw new HttpError(status, code);
};
const h =
  (fn: (req: Request, res: Response) => any) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve()
      .then(() => fn(req, res))
      .catch(next);

const str = (v: unknown, max: number, fallback?: string): string => {
  if (typeof v !== 'string') {
    if (fallback !== undefined) return fallback;
    return fail(400, 'invalid_input');
  }
  const s = v.trim().slice(0, max);
  if (!s && fallback === undefined) fail(400, 'invalid_input');
  return s || (fallback as string);
};
const int = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const bool = (v: unknown) => (v ? 1 : 0);
const has = (o: any, k: string) => o && Object.prototype.hasOwnProperty.call(o, k);

const avatar = (v: unknown) => {
  if (isOwnUrl(v)) return v;
  return str(v, 16);
};

// ---------- invite code ----------
function newInviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let len = 4; len <= 8; len++) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const bytes = crypto.randomBytes(len);
      let c = 'DUO-';
      for (let i = 0; i < len; i++) c += alphabet[bytes[i] % alphabet.length];
      if (!get(`SELECT 1 FROM spaces WHERE invite_code = ?`, c)) return c;
    }
  }
  return 'DUO-' + crypto.randomBytes(6).toString('hex').toUpperCase();
}
const normalizeCode = (raw: unknown) => {
  let c = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/^(JOIN_|ACCEPT_)/, '')
    .replace(/\s+/g, '');
  if (c && !c.startsWith('DUO-')) c = c.startsWith('DUO') ? 'DUO-' + c.slice(3) : 'DUO-' + c;
  return c;
};

// ---------- access ----------
function membership(spaceId: string, userId: string) {
  const space = get(`SELECT * FROM spaces WHERE id = ?`, spaceId);
  if (!space) fail(404, 'space_not_found');
  const role: Role | null = space!.p1_user_id === userId ? 'p1' : space!.p2_user_id === userId ? 'p2' : null;
  if (!role) fail(403, 'forbidden');
  return { space: space!, role: role! };
}

function actingRoleFor(space: Row, userId: string, role: Role): Role {
  const pref = get(`SELECT acting_role FROM prefs WHERE user_id = ? AND space_id = ?`, userId, space.id)?.acting_role as
    | Role
    | undefined;
  if (pref && pref !== role && !space[`${pref}_user_id`]) return pref;
  return role;
}

function cycleEnd(space: Row): number | null {
  const start = space.cycle_started_at as number;
  switch (space.cycle_period) {
    case 'off':
      return null;
    case 'weekly':
      return start + 7 * DAY;
    case 'monthly': {
      const d = new Date(start);
      d.setMonth(d.getMonth() + 1);
      return d.getTime();
    }
    case 'custom':
      return start + Math.max(1, space.cycle_days || 1) * DAY;
    default:
      return start + 7 * DAY;
  }
}

// ---------- mappers ----------
const mapTask = (t: Row) => ({
  id: t.id,
  emoji: t.emoji,
  title: t.title,
  xp: t.xp,
  photoRequired: !!t.photo_required,
  turnRole: t.turn_role as Role,
  lastDoneAt: t.last_done_at ?? null,
  lastDoneBy: t.last_done_by ?? null,
  active: !!t.active,
  showOnDashboard: !!t.show_on_dashboard,
  sort: t.sort,
});
const mapCounter = (c: Row) => ({
  id: c.id,
  emoji: c.emoji,
  title: c.title,
  step: c.step,
  xp: c.xp,
  photoMode: c.photo_mode as 'none' | 'optional' | 'required',
  active: !!c.active,
  showOnDashboard: !!c.show_on_dashboard,
  sort: c.sort,
  cycleTotal: c.cycle_total ?? 0,
});
const mapLog = (l: Row) => ({
  id: l.id,
  kind: l.kind as 'task' | 'counter',
  itemId: l.item_id,
  title: l.title,
  emoji: l.emoji,
  role: l.role as Role,
  xp: l.xp,
  amount: l.amount,
  photos: JSON.parse(l.photos || '[]') as string[],
  outOfTurn: !!l.out_of_turn,
  deleteRequestedBy: (l.delete_requested_by as Role | null) ?? null,
  createdAt: l.created_at,
});

function spaceList(userId: string) {
  return all(
    `SELECT id, name, p1_user_id, p2_user_id, p1_name, p2_name, p1_avatar, p2_avatar, created_at FROM spaces
     WHERE p1_user_id = ? OR p2_user_id = ? ORDER BY created_at ASC`,
    userId,
    userId,
  ).map((s) => ({
    id: s.id,
    name: s.name,
    role: (s.p1_user_id === userId ? 'p1' : 'p2') as Role,
    p1Name: s.p1_name,
    p2Name: s.p2_name,
    p1Avatar: s.p1_avatar,
    p2Avatar: s.p2_avatar,
    hasPartner: !!(s.p1_user_id && s.p2_user_id),
  }));
}

function mapUser(u: Row) {
  return {
    id: u.id,
    firstName: u.first_name ?? null,
    tgUsername: u.tg_username ?? null,
    isTelegram: !!u.tg_id,
    lang: u.lang,
    quickstartDismissed: !!u.quickstart_dismissed,
    recoveryKey: u.recovery_key,
  };
}

function buildState(spaceId: string, userId: string) {
  const { space, role } = membership(spaceId, userId);
  const acting = actingRoleFor(space, userId, role);
  const start = space.cycle_started_at as number;
  const end = cycleEnd(space);
  const tasks = all(`SELECT * FROM tasks WHERE space_id = ? ORDER BY sort ASC, created_at ASC`, spaceId).map(mapTask);
  const counters = all(
    `SELECT c.*, COALESCE((SELECT SUM(l.amount) FROM logs l WHERE l.kind = 'counter' AND l.item_id = c.id AND l.created_at >= ?), 0) AS cycle_total
     FROM counters c WHERE c.space_id = ? ORDER BY c.sort ASC, c.created_at ASC`,
    start,
    spaceId,
  ).map(mapCounter);
  const logs = all(
    `SELECT * FROM logs WHERE space_id = ? AND created_at >= ? ORDER BY created_at DESC LIMIT 500`,
    spaceId,
    start,
  ).map(mapLog);
  const xpRows = all(
    `SELECT role, SUM(xp) AS xp FROM logs WHERE space_id = ? AND created_at >= ? GROUP BY role`,
    spaceId,
    start,
  );
  const xp = { p1: 0, p2: 0 };
  for (const r of xpRows) xp[r.role as Role] = r.xp || 0;
  const roulette = all(`SELECT id, pool, text FROM roulette WHERE space_id = ? ORDER BY created_at ASC`, spaceId);
  const history = all(
    `SELECT id, started_at, ended_at, p1_xp, p2_xp FROM cycles WHERE space_id = ? ORDER BY ended_at DESC LIMIT 12`,
    spaceId,
  ).map((c) => ({ id: c.id, startedAt: c.started_at, endedAt: c.ended_at, p1Xp: c.p1_xp, p2Xp: c.p2_xp }));

  return {
    space: {
      id: space.id,
      name: space.name,
      inviteCode: space.invite_code,
      mode: space.mode,
      showBalancer: !!space.show_balancer,
      showCounters: space.show_counters === undefined ? true : !!space.show_counters,
      cyclePeriod: space.cycle_period,
      cycleDays: space.cycle_days,
      rewardType: space.reward_type,
      rewardText: space.reward_text,
      catEnabled: !!space.cat_enabled,
      catName: space.cat_name,
      p1: { name: space.p1_name, avatar: space.p1_avatar, linked: !!space.p1_user_id },
      p2: { name: space.p2_name, avatar: space.p2_avatar, linked: !!space.p2_user_id },
    },
    myRole: role,
    actingRole: acting,
    canSwitchRole: !space[`${other(role)}_user_id`],
    cycle: { startedAt: start, endsAt: end, expired: end !== null && Date.now() >= end },
    xp,
    tasks,
    counters,
    logs,
    roulette,
    history,
    serverTime: Date.now(),
  };
}

function createSpace(user: Row, name: string) {
  const lang = normalizeLang(user.lang);
  const id = uid();
  const now = Date.now();
  const p1Name = user.first_name?.trim() || DEFAULT_NAMES[lang].p1;
  tx(() => {
    run(
      `INSERT INTO spaces (id, name, invite_code, p1_user_id, p1_name, p2_name, cat_name, cycle_started_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      id,
      name,
      newInviteCode(),
      user.id,
      p1Name,
      DEFAULT_NAMES[lang].p2,
      DEFAULT_NAMES[lang].cat,
      now,
      now,
    );
    seedSpace(id, lang);
  });
  return id;
}

// =====================================================================
export function apiRouter(config: { botToken?: string; allowInsecureTg: boolean; publicConfig: object }) {
  const r = express.Router();
  r.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Setup-Secret');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });
  r.use(express.json({ limit: '200kb' }));
  r.use((_req, _res, next) => {
    ensureDbReady().then(() => next(), next);
  });
  r.use((_req, res, next) => {
    // iOS Safari / Telegram WebView must never serve stale API state from cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });

  r.get('/config', (_req, res) => res.json(config.publicConfig));
  r.get('/health', (_req, res) => res.json({ ok: true }));

  r.post(
    '/setup-bot',
    h(async (req, res) => {
      if (!config.botToken) return res.status(400).json({ error: 'no_bot_token' });
      const expected = process.env.SETUP_SECRET || crypto.createHash('sha256').update(config.botToken).digest('hex').slice(0, 16);
      const provided = String(req.headers['x-setup-secret'] || req.query.secret || '');
      if (provided !== expected) return res.status(403).json({ error: 'forbidden' });
      const pubUrl = (config.publicConfig as any)?.publicUrl || `${req.protocol}://${req.get('host')}`;
      const hookRes = await fetch(`https://api.telegram.org/bot${config.botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `${pubUrl}/api/bot` }),
      }).then((x) => x.json());
      const menuRes = await fetch(`https://api.telegram.org/bot${config.botToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: 'Відкрити DuoDone 🏓',
            web_app: { url: pubUrl },
          },
        }),
      }).then((x) => x.json());
      const cleanDesc =
        'DuoDone 🏓 — гейміфікований трекер спільних побутових справ і звичок для двох партнерів!\n\n• 🏓 Симетричний Пінг-понг задач\n• ⚖️ XP-Балансир\n• 🎡 Рулетка нагород та завдань\n• 📅 Календар і фото-підтвердження\n\nНатисни «Розпочати» або кнопку «Відкрити DuoDone», щоб увійти!';
      const cleanShort = 'DuoDone 🏓 — спільні справи для двох: пінг-понг задач, XP-балансир та рулетка нагород!';
      for (const lc of ['', 'uk', 'ru', 'en', 'pl', 'de', 'es']) {
        await fetch(`https://api.telegram.org/bot${config.botToken}/setMyDescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lc ? { description: cleanDesc, language_code: lc } : { description: cleanDesc }),
        });
        await fetch(`https://api.telegram.org/bot${config.botToken}/setMyShortDescription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lc ? { short_description: cleanShort, language_code: lc } : { short_description: cleanShort }),
        });
      }
      res.json({ pubUrl, webhook: hookRes, menuButton: menuRes, descCleanedForLangs: ['', 'uk', 'ru', 'en', 'pl', 'de', 'es'] });
    }),
  );

  // ---------- Telegram Bot Webhook (/api/bot) ----------
  r.all(
    '/bot',
    h(async (req, res) => {
      if (req.method !== 'POST' || !config.botToken) return res.status(200).send('DuoDone Bot Webhook Running');
      const update = req.body;
      const msg = update?.message;
      const text = typeof msg?.text === 'string' ? msg.text : '';
      if (msg?.chat?.id && (text.startsWith('/start') || text.startsWith('/help'))) {
        const chatId = msg.chat.id;
        const firstName = String(msg.from?.first_name || 'Друже')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1] : '';
        const isInvite = /^(join_|accept_|DUO-)/i.test(startParam);
        const pubUrl = (config.publicConfig as any)?.publicUrl || `${req.protocol}://${req.get('host')}`;
        const rawCode = isInvite ? normalizeCode(startParam) : '';
        const appUrl = isInvite ? `${pubUrl}/?join=${encodeURIComponent(rawCode)}` : pubUrl;

        let joinedSpaceName: string | null = null;
        let spaceFullName: string | null = null;
        if (isInvite && rawCode && msg.from?.id) {
          try {
            const tgUser = upsertTelegramUser(msg.from);
            tx(() => {
              const space = get(`SELECT * FROM spaces WHERE invite_code = ?`, rawCode);
              if (!space) return;
              if (space.p1_user_id === tgUser.id || space.p2_user_id === tgUser.id) {
                joinedSpaceName = space.name;
                return;
              }
              let slot: Role | null = null;
              if (!space.p2_user_id) slot = 'p2';
              else if (!space.p1_user_id) slot = 'p1';
              if (!slot) {
                spaceFullName = space.name;
                return;
              }
              const nameCol = `${slot}_name`;
              const newName =
                isTemplateName(space[nameCol]) && tgUser.first_name ? String(tgUser.first_name).slice(0, 40) : space[nameCol];
              run(
                `UPDATE spaces SET ${slot}_user_id = ?, ${nameCol} = ? WHERE id = ? AND ${slot}_user_id IS NULL`,
                tgUser.id,
                newName,
                space.id,
              );
              run(`DELETE FROM prefs WHERE space_id = ? AND acting_role = ?`, space.id, slot);
              joinedSpaceName = space.name;
            });
          } catch (e) {
            console.error('Bot auto-join error:', e);
          }
        }

        const welcome = joinedSpaceName
          ? `🤝 <b>Ви успішно приєдналися до простору «${joinedSpaceName}»!</b> 🎉\n\nТисни кнопку нижче, щоб відкрити ваш спільний простір у DuoDone 🚀`
          : spaceFullName
            ? `⚠️ <b>Простір «${spaceFullName}» вже заповнений</b> (у ньому вже є 2 партнери).\n\nЯкщо це ваш простір — попросіть партнера натиснути «Відв’язати партнера» в Налаштуваннях і перейти за посиланням знову.`
            : isInvite
              ? `🤝 <b>Запрошення отримано!</b>\n\nВітаємо у спільному просторі DuoDone! 🎉\nТисни кнопку нижче, щоб приєднатися до простору партнера 🚀`
              : `🏓 Привіт, ${firstName}! Вітаємо у DuoDone — офіційній зоні побутового миру та справедливості! 🤝\n\n• 🏓 <b>Симетричний Пінг-понг</b>: помив посуд ➔ тапнув ➔ хід перелетів до партнера.\n• ⚖️ <b>XP Балансир</b>: заробляй бали за справи та перетягуй канат на свій бік.\n• 🎡 <b>Рулетка Долі</b>: розіграш призів та завдань наприкінці циклу.\n\nТисни кнопку нижче! 🚀`;
        await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: welcome,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: joinedSpaceName
                      ? `✅ Відкрити «${joinedSpaceName}» 🚀`
                      : isInvite
                        ? '✅ Приєднатися до простору 🚀'
                        : '🏓 Відкрити DuoDone 🚀',
                    web_app: { url: appUrl },
                  },
                ],
              ],
            },
          }),
        }).catch(() => {});
      }
      res.status(200).json({ ok: true });
    }),
  );

  // ---------- auth ----------
  r.post(
    '/auth/telegram',
    h((req, res) => {
      const initData = String(req.body?.initData || '');
      if (!initData) fail(400, 'no_init_data');
      let parsed = config.botToken ? validateInitData(initData, config.botToken) : null;
      if (!parsed && config.allowInsecureTg) parsed = parseInitDataInsecure(initData);
      if (!parsed) fail(401, 'invalid_init_data');
      const user = upsertTelegramUser(parsed!.user);
      res.json({ token: createSession(user.id), startParam: parsed!.startParam ?? null });
    }),
  );

  r.post(
    '/auth/guest',
    h((req, res) => {
      const user = createUser({ lang: normalizeLang(req.body?.lang) });
      res.json({ token: createSession(user.id) });
    }),
  );

  r.post(
    '/auth/recover',
    h((req, res) => {
      const key = String(req.body?.key || '')
        .trim()
        .toUpperCase();
      const user = key ? get(`SELECT * FROM users WHERE recovery_key = ?`, key) : undefined;
      if (!user) fail(404, 'recovery_not_found');
      res.json({ token: createSession(user!.id) });
    }),
  );

  // ---------- everything below requires auth ----------
  r.use(requireAuth);

  r.get(
    '/me',
    h((req, res) => {
      const u = req.user!;
      res.json({ user: mapUser(u), spaces: spaceList(u.id) });
    }),
  );

  r.patch(
    '/me',
    h((req, res) => {
      const u = req.user!;
      if (has(req.body, 'lang')) run(`UPDATE users SET lang = ? WHERE id = ?`, normalizeLang(req.body.lang), u.id);
      if (has(req.body, 'quickstartDismissed'))
        run(`UPDATE users SET quickstart_dismissed = ? WHERE id = ?`, bool(req.body.quickstartDismissed), u.id);
      const nu = get(`SELECT * FROM users WHERE id = ?`, u.id)!;
      res.json({ user: mapUser(nu), spaces: spaceList(u.id) });
    }),
  );

  r.delete(
    '/me',
    h((req, res) => {
      const u = req.user!;
      tx(() => {
        // Delete solo spaces where no partner is linked; unlink from shared spaces
        run(`DELETE FROM spaces WHERE p1_user_id = ? AND p2_user_id IS NULL`, u.id);
        run(`DELETE FROM spaces WHERE p2_user_id = ? AND p1_user_id IS NULL`, u.id);
        run(`UPDATE spaces SET p1_user_id = NULL WHERE p1_user_id = ?`, u.id);
        run(`UPDATE spaces SET p2_user_id = NULL WHERE p2_user_id = ?`, u.id);
        run(`DELETE FROM users WHERE id = ?`, u.id);
      });
      res.json({ ok: true });
    }),
  );

  // ---------- uploads ----------
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024, files: 1 } });
  r.post(
    '/upload',
    upload.single('file'),
    h(async (req, res) => {
      const f = req.file;
      if (!f) fail(400, 'no_file');
      if (!/^image\//.test(f!.mimetype)) fail(400, 'not_an_image');
      const spaceId = typeof req.body?.spaceId === 'string' ? req.body.spaceId : '';
      let hint = 'avatars';
      if (spaceId) {
        membership(spaceId, req.user!.id);
        hint = spaceId;
      }
      const url = await saveImage(f!.buffer, f!.mimetype, hint);
      res.json({ url });
    }),
  );

  // ---------- spaces ----------
  r.post(
    '/spaces',
    h((req, res) => {
      const lang = normalizeLang(req.user!.lang);
      const name = str(req.body?.name, 60, DEFAULT_NAMES[lang].home);
      const id = createSpace(req.user!, name);
      res.json({ spaceId: id, spaces: spaceList(req.user!.id) });
    }),
  );

  r.post(
    '/spaces/join',
    h((req, res) => {
      const u = req.user!;
      const code = normalizeCode(req.body?.code);
      if (!code) fail(400, 'invalid_code');
      const result = tx(() => {
        const space = get(`SELECT * FROM spaces WHERE invite_code = ?`, code);
        if (!space) fail(404, 'invite_not_found');
        if (space!.p1_user_id === u.id || space!.p2_user_id === u.id) return { spaceId: space!.id, already: true };
        let slot: Role | null = null;
        if (!space!.p2_user_id) slot = 'p2';
        else if (!space!.p1_user_id) slot = 'p1';
        if (!slot) fail(403, 'space_full');
        const nameCol = `${slot}_name`;
        // Telegram name is used only if the slot still has a template name — custom names are never overwritten.
        const newName = isTemplateName(space![nameCol]) && u.first_name ? String(u.first_name).slice(0, 40) : space![nameCol];
        run(`UPDATE spaces SET ${slot}_user_id = ?, ${nameCol} = ? WHERE id = ? AND ${slot}_user_id IS NULL`, u.id, newName, space!.id);
        run(`DELETE FROM prefs WHERE space_id = ? AND acting_role = ?`, space!.id, slot);
        return { spaceId: space!.id, already: false, other: space![`${other(slot!)}_user_id`] as string | null };
      });
      if (!result.already) {
        notifySpace(result.spaceId);
        notifyUsers([result.other], { type: 'spaces' });
      }
      res.json({ spaceId: result.spaceId, already: result.already, spaces: spaceList(u.id) });
    }),
  );

  r.get(
    '/spaces/:id/state',
    h((req, res) => res.json(buildState(String(req.params.id), req.user!.id))),
  );

  r.patch(
    '/spaces/:id',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const b = req.body || {};
      const sets: string[] = [];
      const vals: any[] = [];
      const set = (col: string, v: any) => {
        sets.push(`${col} = ?`);
        vals.push(v);
      };
      if (has(b, 'name')) set('name', str(b.name, 60));
      if (has(b, 'mode')) set('mode', b.mode === 'balancer' ? 'balancer' : 'symmetric');
      if (has(b, 'showBalancer')) set('show_balancer', bool(b.showBalancer));
      if (has(b, 'showCounters')) set('show_counters', bool(b.showCounters));
      if (has(b, 'cyclePeriod'))
        set('cycle_period', ['weekly', 'monthly', 'custom', 'off'].includes(b.cyclePeriod) ? b.cyclePeriod : 'weekly');
      if (has(b, 'cycleDays')) set('cycle_days', int(b.cycleDays, 1, 365, 7));
      if (has(b, 'rewardType')) set('reward_type', b.rewardType === 'text' ? 'text' : 'roulette');
      if (has(b, 'rewardText')) set('reward_text', str(b.rewardText, 200, ''));
      if (has(b, 'catEnabled')) set('cat_enabled', bool(b.catEnabled));
      if (has(b, 'catName')) set('cat_name', str(b.catName, 30));
      if (has(b, 'p1Name')) set('p1_name', str(b.p1Name, 40));
      if (has(b, 'p2Name')) set('p2_name', str(b.p2Name, 40));
      if (has(b, 'p1Avatar')) set('p1_avatar', avatar(b.p1Avatar));
      if (has(b, 'p2Avatar')) set('p2_avatar', avatar(b.p2Avatar));
      if (sets.length) run(`UPDATE spaces SET ${sets.join(', ')} WHERE id = ?`, ...vals, space.id);
      notifySpace(space.id);
      if (has(b, 'name') || has(b, 'p1Name') || has(b, 'p2Name') || has(b, 'p1Avatar') || has(b, 'p2Avatar'))
        notifyUsers([space.p1_user_id, space.p2_user_id], { type: 'spaces' });
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.post(
    '/spaces/:id/acting-role',
    h((req, res) => {
      const { space, role } = membership(String(req.params.id), req.user!.id);
      const want: Role = req.body?.role === 'p2' ? 'p2' : 'p1';
      if (want !== role && space[`${want}_user_id`]) fail(409, 'role_locked');
      run(
        `INSERT INTO prefs (user_id, space_id, acting_role) VALUES (?,?,?)
         ON CONFLICT(user_id, space_id) DO UPDATE SET acting_role = excluded.acting_role`,
        req.user!.id,
        space.id,
        want,
      );
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.post(
    '/spaces/:id/unlink',
    h((req, res) => {
      const { space, role } = membership(String(req.params.id), req.user!.id);
      const partnerCol = `${other(role)}_user_id`;
      const partnerId = space[partnerCol];
      if (!partnerId) fail(400, 'no_partner');
      // the slot becomes open again; we also rotate the invite code so old links stop working
      run(`UPDATE spaces SET ${partnerCol} = NULL, invite_code = ? WHERE id = ?`, newInviteCode(), space.id);
      run(`DELETE FROM prefs WHERE space_id = ? AND user_id = ?`, space.id, partnerId);
      notifySpace(space.id, [partnerId]);
      notifyUsers([partnerId], { type: 'spaces' });
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.post(
    '/spaces/:id/leave',
    h((req, res) => {
      const { space, role } = membership(String(req.params.id), req.user!.id);
      const partnerId = space[`${other(role)}_user_id`];
      if (!partnerId) {
        run(`DELETE FROM spaces WHERE id = ?`, space.id);
      } else {
        run(`UPDATE spaces SET ${role}_user_id = NULL WHERE id = ?`, space.id);
        run(`DELETE FROM prefs WHERE space_id = ? AND user_id = ?`, space.id, req.user!.id);
        notifySpace(space.id);
        notifyUsers([partnerId], { type: 'spaces' });
      }
      res.json({ spaces: spaceList(req.user!.id) });
    }),
  );

  r.post(
    '/spaces/:id/rotate-code',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      run(`UPDATE spaces SET invite_code = ? WHERE id = ?`, newInviteCode(), space.id);
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.delete(
    '/spaces/:id',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const users = [space.p1_user_id, space.p2_user_id];
      run(`DELETE FROM spaces WHERE id = ?`, space.id);
      notifyUsers(users, { type: 'spaces' });
      notifyUsers(users, { type: 'space', spaceId: space.id });
      res.json({ spaces: spaceList(req.user!.id) });
    }),
  );

  r.post(
    '/spaces/:id/cycle/reset',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const now = Date.now();
      tx(() => {
        const rows = all(
          `SELECT role, SUM(xp) AS xp FROM logs WHERE space_id = ? AND created_at >= ? GROUP BY role`,
          space.id,
          space.cycle_started_at,
        );
        const xp = { p1: 0, p2: 0 } as Record<Role, number>;
        for (const row of rows) xp[row.role as Role] = row.xp || 0;
        run(
          `INSERT INTO cycles (id, space_id, started_at, ended_at, p1_xp, p2_xp) VALUES (?,?,?,?,?,?)`,
          uid(),
          space.id,
          space.cycle_started_at,
          now,
          xp.p1,
          xp.p2,
        );
        run(`UPDATE spaces SET cycle_started_at = ? WHERE id = ?`, now, space.id);
      });
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  // ---------- logs ----------
  r.get(
    '/spaces/:id/logs',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const from = Number(req.query.from) || 0;
      const to = Number(req.query.to) || Date.now() + DAY;
      const itemId = typeof req.query.itemId === 'string' ? req.query.itemId : null;
      const rows = itemId
        ? all(
            `SELECT * FROM logs WHERE space_id = ? AND item_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 200`,
            space.id,
            itemId,
            from,
            to,
          )
        : all(
            `SELECT * FROM logs WHERE space_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC LIMIT 2000`,
            space.id,
            from,
            to,
          );
      res.json({ logs: rows.map(mapLog) });
    }),
  );

  r.delete(
    '/spaces/:id/logs/:logId',
    h((req, res) => {
      const { space, role } = membership(String(req.params.id), req.user!.id);
      const acting = actingRoleFor(space, req.user!.id, role);
      const log = get(`SELECT * FROM logs WHERE id = ? AND space_id = ?`, String(req.params.logId), space.id);
      if (!log) fail(404, 'not_found');
      const cancel = req.query.cancel === '1';

      let deleteStatus: 'requested' | 'cancelled' | 'deleted' = 'requested';
      tx(() => {
        if (cancel || log!.delete_requested_by === acting) {
          run(`UPDATE logs SET delete_requested_by = NULL WHERE id = ?`, log!.id);
          deleteStatus = 'cancelled';
          return;
        }
        if (!log!.delete_requested_by) {
          run(`UPDATE logs SET delete_requested_by = ? WHERE id = ?`, acting, log!.id);
          deleteStatus = 'requested';
          return;
        }
        // Second partner confirmed deletion (log.delete_requested_by !== acting)
        run(`DELETE FROM logs WHERE id = ?`, log!.id);
        deleteStatus = 'deleted';
        if (log!.kind === 'task') {
          const task = get(`SELECT * FROM tasks WHERE id = ?`, log!.item_id);
          if (task && task.last_done_at === log!.created_at) {
            const prev = get(`SELECT * FROM logs WHERE item_id = ? ORDER BY created_at DESC LIMIT 1`, task.id);
            run(
              `UPDATE tasks SET turn_role = ?, last_done_at = ?, last_done_by = ? WHERE id = ?`,
              log!.role,
              prev?.created_at ?? null,
              prev?.role ?? null,
              task.id,
            );
          }
        }
      });
      notifySpace(space.id);
      res.json({ ...buildState(space.id, req.user!.id), deleteStatus });
    }),
  );

  const parsePhotos = (v: unknown): string[] => {
    if (v == null) return [];
    if (!Array.isArray(v)) return fail(400, 'invalid_photos');
    if (v.length > 2) fail(400, 'too_many_photos');
    if (!v.every(isOwnUrl)) fail(400, 'invalid_photos');
    return v as string[];
  };

  // ---------- tasks ----------
  const taskFields = (b: any, partial: boolean) => {
    const out: Record<string, any> = {};
    if (!partial || has(b, 'emoji')) out.emoji = str(b.emoji, 16, '✅');
    if (!partial || has(b, 'title')) out.title = str(b.title, 80);
    if (!partial || has(b, 'xp')) out.xp = int(b.xp, 1, 5, 1);
    if (!partial || has(b, 'photoRequired')) out.photo_required = bool(b.photoRequired);
    if (!partial || has(b, 'active')) out.active = has(b, 'active') ? bool(b.active) : 1;
    if (!partial || has(b, 'showOnDashboard')) out.show_on_dashboard = has(b, 'showOnDashboard') ? bool(b.showOnDashboard) : 1;
    if (has(b, 'turnRole')) out.turn_role = b.turnRole === 'p2' ? 'p2' : 'p1';
    if (has(b, 'sort')) out.sort = int(b.sort, 0, 100000, 0);
    return out;
  };

  r.post(
    '/spaces/:id/tasks',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const f = taskFields(req.body || {}, false);
      const maxSort = get(`SELECT COALESCE(MAX(sort), -1) AS m FROM tasks WHERE space_id = ?`, space.id)!.m;
      run(
        `INSERT INTO tasks (id, space_id, emoji, title, xp, photo_required, active, show_on_dashboard, turn_role, sort, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        uid(),
        space.id,
        f.emoji,
        f.title,
        f.xp,
        f.photo_required,
        f.active,
        f.show_on_dashboard,
        f.turn_role || 'p1',
        maxSort + 1,
        Date.now(),
      );
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.patch(
    '/spaces/:id/tasks/:taskId',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const f = taskFields(req.body || {}, true);
      const keys = Object.keys(f);
      if (keys.length)
        run(
          `UPDATE tasks SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND space_id = ?`,
          ...keys.map((k) => f[k]),
          String(req.params.taskId),
          space.id,
        );
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.delete(
    '/spaces/:id/tasks/:taskId',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      run(`DELETE FROM tasks WHERE id = ? AND space_id = ?`, String(req.params.taskId), space.id);
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.post(
    '/spaces/:id/tasks/:taskId/complete',
    h((req, res) => {
      const u = req.user!;
      const { space, role } = membership(String(req.params.id), u.id);
      const acting = actingRoleFor(space, u.id, role);
      const photos = parsePhotos(req.body?.photos);
      const force = !!req.body?.force;
      const result = tx(() => {
        const task = get(`SELECT * FROM tasks WHERE id = ? AND space_id = ?`, String(req.params.taskId), space.id);
        if (!task) fail(404, 'not_found');
        if (!task!.active) fail(400, 'inactive');
        if (task!.photo_required && photos.length < 1) fail(400, 'photo_required');
        const outOfTurn = space.mode === 'symmetric' && task!.turn_role !== acting;
        if (outOfTurn && !force) fail(409, 'out_of_turn');
        const now = Date.now();
        const logId = uid();
        run(
          `INSERT INTO logs (id, space_id, kind, item_id, title, emoji, role, user_id, xp, amount, photos, out_of_turn, created_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          logId,
          space.id,
          'task',
          task!.id,
          task!.title,
          task!.emoji,
          acting,
          u.id,
          task!.xp,
          1,
          JSON.stringify(photos),
          outOfTurn ? 1 : 0,
          now,
        );
        run(
          `UPDATE tasks SET turn_role = ?, last_done_at = ?, last_done_by = ? WHERE id = ?`,
          other(acting),
          now,
          acting,
          task!.id,
        );
        return logId;
      });
      notifySpace(space.id);
      res.json({ logId: result, state: buildState(space.id, u.id) });
    }),
  );

  // ---------- counters ----------
  const counterFields = (b: any, partial: boolean) => {
    const out: Record<string, any> = {};
    if (!partial || has(b, 'emoji')) out.emoji = str(b.emoji, 16, '⭐');
    if (!partial || has(b, 'title')) out.title = str(b.title, 80);
    if (!partial || has(b, 'step')) out.step = int(b.step, 1, 100, 1);
    if (!partial || has(b, 'xp')) out.xp = int(b.xp, 0, 5, 1);
    if (!partial || has(b, 'photoMode'))
      out.photo_mode = ['none', 'optional', 'required'].includes(b.photoMode) ? b.photoMode : 'none';
    if (!partial || has(b, 'active')) out.active = has(b, 'active') ? bool(b.active) : 1;
    if (!partial || has(b, 'showOnDashboard')) out.show_on_dashboard = has(b, 'showOnDashboard') ? bool(b.showOnDashboard) : 1;
    if (has(b, 'sort')) out.sort = int(b.sort, 0, 100000, 0);
    return out;
  };

  r.post(
    '/spaces/:id/counters',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const f = counterFields(req.body || {}, false);
      const maxSort = get(`SELECT COALESCE(MAX(sort), -1) AS m FROM counters WHERE space_id = ?`, space.id)!.m;
      run(
        `INSERT INTO counters (id, space_id, emoji, title, step, xp, photo_mode, active, show_on_dashboard, sort, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        uid(),
        space.id,
        f.emoji,
        f.title,
        f.step,
        f.xp,
        f.photo_mode,
        f.active,
        f.show_on_dashboard,
        maxSort + 1,
        Date.now(),
      );
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.patch(
    '/spaces/:id/counters/:counterId',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const f = counterFields(req.body || {}, true);
      const keys = Object.keys(f);
      if (keys.length)
        run(
          `UPDATE counters SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ? AND space_id = ?`,
          ...keys.map((k) => f[k]),
          String(req.params.counterId),
          space.id,
        );
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.delete(
    '/spaces/:id/counters/:counterId',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      run(`DELETE FROM counters WHERE id = ? AND space_id = ?`, String(req.params.counterId), space.id);
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.post(
    '/spaces/:id/counters/:counterId/increment',
    h((req, res) => {
      const u = req.user!;
      const { space, role } = membership(String(req.params.id), u.id);
      const acting = actingRoleFor(space, u.id, role);
      const photos = parsePhotos(req.body?.photos);
      const c = get(`SELECT * FROM counters WHERE id = ? AND space_id = ?`, String(req.params.counterId), space.id);
      if (!c) fail(404, 'not_found');
      if (!c!.active) fail(400, 'inactive');
      if (c!.photo_mode === 'required' && photos.length < 1) fail(400, 'photo_required');
      if (c!.photo_mode === 'none' && photos.length > 0) fail(400, 'photos_not_allowed');
      const logId = uid();
      run(
        `INSERT INTO logs (id, space_id, kind, item_id, title, emoji, role, user_id, xp, amount, photos, out_of_turn, created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,0,?)`,
        logId,
        space.id,
        'counter',
        c!.id,
        c!.title,
        c!.emoji,
        acting,
        u.id,
        c!.xp,
        c!.step,
        JSON.stringify(photos),
        Date.now(),
      );
      notifySpace(space.id);
      res.json({ logId, state: buildState(space.id, u.id) });
    }),
  );

  // ---------- roulette ----------
  r.post(
    '/spaces/:id/roulette',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      const pool = req.body?.pool === 'penalty' ? 'penalty' : 'reward';
      const count = get(`SELECT COUNT(*) AS n FROM roulette WHERE space_id = ? AND pool = ?`, space.id, pool)!.n;
      if (count >= 24) fail(400, 'too_many_items');
      run(
        `INSERT INTO roulette (id, space_id, pool, text, created_at) VALUES (?,?,?,?,?)`,
        uid(),
        space.id,
        pool,
        str(req.body?.text, 80),
        Date.now(),
      );
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  r.delete(
    '/spaces/:id/roulette/:itemId',
    h((req, res) => {
      const { space } = membership(String(req.params.id), req.user!.id);
      run(`DELETE FROM roulette WHERE id = ? AND space_id = ?`, String(req.params.itemId), space.id);
      notifySpace(space.id);
      res.json(buildState(space.id, req.user!.id));
    }),
  );

  // ---------- errors ----------
  r.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code });
    if (err?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'file_too_large' });
    console.error(err);
    res.status(500).json({ error: 'server_error' });
  });

  return r;
}
