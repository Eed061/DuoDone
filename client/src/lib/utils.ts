import confetti from 'canvas-confetti';
import type { Lang, PublicConfig } from '../types';
import type { makeT } from './i18n';

type TT = ReturnType<typeof makeT>['t'];

export function timeAgo(ts: number, t: TT, now = Date.now()) {
  const diff = Math.max(0, now - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return t('misc.justNow');
  if (m < 60) return t('misc.minAgo', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('misc.hAgo', { n: h });
  return t('misc.dAgo', { n: Math.floor(h / 24) });
}

export function fmtDuration(ms: number, t: TT) {
  const total = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(total / 1440);
  const h = Math.floor((total % 1440) / 60);
  const m = total % 60;
  if (d > 0) return `${d}${t('cycle.d')} ${h}${t('cycle.h')}`;
  if (h > 0) return `${h}${t('cycle.h')} ${m}${t('cycle.m')}`;
  return `${m}${t('cycle.m')}`;
}

const LOCALES: Record<Lang, string> = {
  uk: 'uk-UA',
  en: 'en-GB',
  pl: 'pl-PL',
  de: 'de-DE',
  es: 'es-ES',
};
const locale = (lang: Lang) => LOCALES[lang] || 'uk-UA';
export const fmtTime = (ts: number, lang: Lang) =>
  new Date(ts).toLocaleTimeString(locale(lang), { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (ts: number, lang: Lang, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(ts).toLocaleDateString(locale(lang), opts);
export const fmtMonth = (d: Date, lang: Lang) => {
  const s = d.toLocaleDateString(locale(lang), { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const weekdayNames = (lang: Lang) => {
  // Monday-first
  const base = new Date(2024, 0, 1); // Monday
  return Array.from({ length: 7 }, (_, i) =>
    new Date(base.getTime() + i * 86400000).toLocaleDateString(locale(lang), { weekday: 'short' }),
  );
};

export function boom(kind: 'small' | 'big' = 'small') {
  try {
    const opts = { disableForReducedMotion: true, zIndex: 9999 } as const;
    if (kind === 'big') {
      confetti({ ...opts, particleCount: 160, spread: 100, origin: { y: 0.6 } });
      setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 60, spread: 70, origin: { x: 0, y: 0.7 } }), 200);
      setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.7 } }), 350);
    } else {
      confetti({ ...opts, particleCount: 70, spread: 65, origin: { y: 0.75 }, scalar: 0.9 });
    }
  } catch {
    /* ignore */
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy method (Telegram iOS WebView) */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.fontSize = '16px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export function inviteLinks(code: string, cfg: PublicConfig | null) {
  const origin = cfg?.publicUrl || window.location.origin;
  const web = `${origin}/?join=${encodeURIComponent(code)}`;
  let tgLink: string | null = null;
  if (cfg?.botUsername) {
    tgLink = cfg.appShortName
      ? `https://t.me/${cfg.botUsername}/${cfg.appShortName}?startapp=join_${code}`
      : `https://t.me/${cfg.botUsername}?startapp=join_${code}`;
  }
  return { web, tg: tgLink, primary: tgLink || web };
}

/** Tiny event bus (used by the cat counselor). */
type CatEvent = { type: 'done'; name: string } | { type: 'cycle' } | { type: 'hello' };
const listeners = new Set<(e: CatEvent) => void>();
export const catBus = {
  emit: (e: CatEvent) => listeners.forEach((l) => l(e)),
  on: (l: (e: CatEvent) => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export const isUrlAvatar = (a: string) => a.startsWith('/') || a.startsWith('http');

export const EMOJIS = [
  '🍽️', '🗑️', '🧺', '🍳', '🛏️', '🧹', '🪟', '🪴', '🛒', '🐾', '🧽', '🚿', '🛁', '🧼', '👕', '🧦',
  '🍲', '☕', '🥗', '🧊', '🚗', '🔧', '💡', '📦', '📚', '💪', '🏃', '🧘', '💊', '💧', '🌱', '🐶',
  '🐱', '👶', '💸', '📅', '✅', '⭐', '❤️', '🔥', '🎯', '🏆', '🎁', '🧸', '🪣', '🧯', '🪥', '🌙',
];
export const AVATARS = ['🦊', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐧', '🦄', '🐙', '🐱', '🐶', '🦉', '🐢', '😎', '🥰', '🤓', '👑'];
