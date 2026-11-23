import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Lang, PublicConfig, Role, SpaceState, SpaceSummary, User } from './types';
import { api, ApiError, getSavedSpace, getToken, saveSpace, setToken } from './lib/api';
import { makeT } from './lib/i18n';
import * as tg from './lib/tg';

type Toast = { id: number; text: string; kind: 'ok' | 'err' | 'info' };
type Tab = 'home' | 'calendar' | 'roulette' | 'settings';

interface Ctx {
  booted: boolean;
  bootError: string | null;
  config: PublicConfig | null;
  me: User | null;
  spaces: SpaceSummary[];
  activeId: string | null;
  state: SpaceState | null;
  lang: Lang;
  tab: Tab;
  online: boolean;
  setTab: (t: Tab) => void;
  t: ReturnType<typeof makeT>['t'];
  pick: ReturnType<typeof makeT>['pick'];
  errText: (e: unknown) => string;
  setActive: (id: string | null) => void;
  refreshMe: () => Promise<void>;
  refreshState: () => Promise<void>;
  applyState: (s: SpaceState) => void;
  setMeAndSpaces: (r: { user?: User; spaces: SpaceSummary[] }) => void;
  toast: (text: string, kind?: Toast['kind']) => void;
  toasts: Toast[];
  /** runs an API action, shows a toast on error, returns undefined on failure */
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  joinByCode: (code: string) => Promise<boolean>;
  createSpace: (name: string) => Promise<boolean>;
  nameOf: (r: Role) => string;
  restore: (key: string) => Promise<boolean>;
  retryBoot: () => void;
}

const AppContext = createContext<Ctx>(null as any);
export const useApp = () => useContext(AppContext);

function readJoinParam(): string | null {
  try {
    const u = new URL(window.location.href);
    const j = u.searchParams.get('join') || u.searchParams.get('tgWebAppStartParam');
    if (j) {
      u.searchParams.delete('join');
      window.history.replaceState(null, '', u.pathname + (u.search === '?' ? '' : u.search) + u.hash);
      return j;
    }
  } catch {}
  return null;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [booted, setBooted] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootNonce, setBootNonce] = useState(0);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [state, setState] = useState<SpaceState | null>(null);
  const [tab, setTab] = useState<Tab>('home');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine !== false);
  const activeRef = useRef<string | null>(null);
  const reqSeq = useRef(0);

  const lang: Lang = me?.lang === 'en' ? 'en' : 'uk';
  const { t, pick, err } = useMemo(() => makeT(lang), [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), kind === 'err' ? 4200 : 2600);
  }, []);

  const errText = useCallback((e: unknown) => (e instanceof ApiError ? err(e.code) : t('err.generic')), [err, t]);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (e) {
        toast(errText(e), 'err');
        tg.haptic('error');
        return undefined;
      }
    },
    [errText, toast],
  );

  const setActive = useCallback((id: string | null) => {
    activeRef.current = id;
    setActiveId(id);
    saveSpace(id);
    setState((s) => (s && s.space.id === id ? s : null));
  }, []);

  const applyState = useCallback((s: SpaceState) => {
    if (s.space.id === activeRef.current) setState(s);
  }, []);

  const refreshState = useCallback(async () => {
    const id = activeRef.current;
    if (!id) return;
    const seq = ++reqSeq.current;
    try {
      const s = await api.get<SpaceState>(`/spaces/${id}/state`);
      if (seq === reqSeq.current && id === activeRef.current) setState(s);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 404)) {
        // space was deleted or we were unlinked → fall back to another space
        const r = await api.get<{ user: User; spaces: SpaceSummary[] }>('/me').catch(() => null);
        if (r) {
          setMe(r.user);
          setSpaces(r.spaces);
          setActive(r.spaces[0]?.id ?? null);
        }
      }
    }
  }, [setActive]);

  const setMeAndSpaces = useCallback(
    (r: { user?: User; spaces: SpaceSummary[] }) => {
      if (r.user) setMe(r.user);
      setSpaces(r.spaces);
      const cur = activeRef.current;
      if (!cur || !r.spaces.some((s) => s.id === cur)) setActive(r.spaces[0]?.id ?? null);
    },
    [setActive],
  );

  const refreshMe = useCallback(async () => {
    try {
      const r = await api.get<{ user: User; spaces: SpaceSummary[] }>('/me');
      setMeAndSpaces(r);
    } catch {
      /* ignore */
    }
  }, [setMeAndSpaces]);

  const joinByCode = useCallback(
    async (code: string) => {
      try {
        const r = await api.post<{ spaceId: string; already: boolean; spaces: SpaceSummary[] }>('/spaces/join', { code });
        setSpaces(r.spaces);
        setActive(r.spaceId);
        setTab('home');
        const name = r.spaces.find((s) => s.id === r.spaceId)?.name || '';
        toast(r.already ? t('misc.already') : t('misc.joined', { name }), 'ok');
        tg.haptic('success');
        return true;
      } catch (e) {
        toast(errText(e), 'err');
        tg.haptic('error');
        return false;
      }
    },
    [errText, setActive, t, toast],
  );

  const createSpace = useCallback(
    async (name: string) => {
      const r = await run(() => api.post<{ spaceId: string; spaces: SpaceSummary[] }>('/spaces', { name }));
      if (!r) return false;
      setSpaces(r.spaces);
      setActive(r.spaceId);
      setTab('home');
      toast(t('misc.created'), 'ok');
      return true;
    },
    [run, setActive, t, toast],
  );

  const restore = useCallback(
    async (key: string) => {
      try {
        const r = await api.post<{ token: string }>('/auth/recover', { key });
        setToken(r.token);
        saveSpace(null);
        activeRef.current = null;
        setBootNonce((n) => n + 1);
        return true;
      } catch (e) {
        toast(errText(e), 'err');
        return false;
      }
    },
    [errText, toast],
  );

  // ---------------- boot ----------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setBootError(null);
      tg.tgInit();
      try {
        const cfg = await api.get<PublicConfig>('/config').catch(() => null);
        if (!cancelled) setConfig(cfg);

        let startParam: string | null = tg.startParam();
        if (tg.isTelegram()) {
          try {
            const r = await api.post<{ token: string; startParam: string | null }>('/auth/telegram', {
              initData: tg.initData(),
            });
            setToken(r.token);
            startParam = r.startParam || startParam;
          } catch (e) {
            // server has no BOT_TOKEN configured → fall back to device session
            if (!getToken()) {
              const g = await api.post<{ token: string }>('/auth/guest', {
                lang: navigator.language?.startsWith('en') ? 'en' : 'uk',
              });
              setToken(g.token);
            }
          }
        }
        if (!getToken()) {
          const g = await api.post<{ token: string }>('/auth/guest', { lang: navigator.language?.startsWith('en') ? 'en' : 'uk' });
          setToken(g.token);
        }
        let r: { user: User; spaces: SpaceSummary[] };
        try {
          r = await api.get('/me');
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) {
            const g = await api.post<{ token: string }>('/auth/guest', {});
            setToken(g.token);
            r = await api.get('/me');
          } else throw e;
        }
        if (cancelled) return;
        setMe(r.user);
        setSpaces(r.spaces);
        const saved = getSavedSpace();
        const initial = r.spaces.find((s) => s.id === saved)?.id ?? r.spaces[0]?.id ?? null;
        activeRef.current = initial;
        setActiveId(initial);
        setBooted(true);

        const joinRaw = readJoinParam() || (startParam && /^join_/i.test(startParam) ? startParam : null);
        if (joinRaw) {
          const code = joinRaw.replace(/^join_/i, '');
          try {
            const j = await api.post<{ spaceId: string; already: boolean; spaces: SpaceSummary[] }>('/spaces/join', { code });
            if (cancelled) return;
            setSpaces(j.spaces);
            activeRef.current = j.spaceId;
            setActiveId(j.spaceId);
            saveSpace(j.spaceId);
            const name = j.spaces.find((s) => s.id === j.spaceId)?.name || '';
            const { t: tt } = makeT(r.user.lang);
            toast(j.already ? tt('misc.already') : tt('misc.joined', { name }), 'ok');
          } catch (e) {
            const { err: ee } = makeT(r.user.lang);
            toast(e instanceof ApiError ? ee(e.code) : ee('generic'), 'err');
          }
        }
      } catch (e) {
        if (!cancelled) setBootError(e instanceof ApiError ? e.code : 'network_error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootNonce]);

  // load state when active space changes
  useEffect(() => {
    if (booted && activeId) refreshState();
  }, [booted, activeId, refreshState]);

  // ---------------- realtime ----------------
  useEffect(() => {
    if (!booted) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ping: ReturnType<typeof setInterval> | null = null;

    const connect = () => {
      const token = getToken();
      if (!token || closed) return;
      try {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        ws = new WebSocket(`${proto}://${window.location.host}/ws?token=${encodeURIComponent(token)}`);
      } catch {
        schedule();
        return;
      }
      ws.onopen = () => {
        retry = 0;
        refreshState();
        refreshMe();
        ping = setInterval(() => {
          try {
            ws?.send('ping');
          } catch {}
        }, 20000);
      };
      ws.onmessage = (ev) => {
        if (typeof ev.data !== 'string' || ev.data === 'pong') return;
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'space' && msg.spaceId === activeRef.current) refreshState();
          if (msg.type === 'spaces') refreshMe();
        } catch {}
      };
      ws.onclose = () => {
        if (ping) clearInterval(ping);
        ping = null;
        schedule();
      };
      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };
    };
    const schedule = () => {
      if (closed) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(connect, Math.min(15000, 1000 * 2 ** retry++));
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshState();
        refreshMe();
        if (!ws || ws.readyState > 1) {
          retry = 0;
          connect();
        }
      }
    };
    const onOnline = () => {
      setOnline(true);
      onVisible();
    };
    const onOffline = () => setOnline(false);

    connect();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    // fallback polling when the socket is down (some corporate proxies block WS)
    const poll = setInterval(() => {
      if (document.visibilityState === 'visible' && (!ws || ws.readyState !== 1)) refreshState();
    }, 15000);

    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      if (ping) clearInterval(ping);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onVisible);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      try {
        ws?.close();
      } catch {}
    };
  }, [booted, bootNonce, refreshMe, refreshState]);

  const nameOf = useCallback((r: Role) => (state ? state.space[r].name : r), [state]);

  const value: Ctx = {
    booted,
    bootError,
    config,
    me,
    spaces,
    activeId,
    state,
    lang,
    tab,
    online,
    setTab,
    t,
    pick,
    errText,
    setActive,
    refreshMe,
    refreshState,
    applyState,
    setMeAndSpaces,
    toast,
    toasts,
    run,
    joinByCode,
    createSpace,
    nameOf,
    restore,
    retryBoot: () => setBootNonce((n) => n + 1),
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
