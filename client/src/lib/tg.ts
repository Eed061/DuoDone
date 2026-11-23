/**
 * Safe wrappers around the Telegram WebApp API.
 * Every call is guarded so the app never crashes in a regular browser or an old Telegram client.
 */
type TgWebApp = any;

export const tg = (): TgWebApp | null => {
  try {
    return (window as any).Telegram?.WebApp ?? null;
  } catch {
    return null;
  }
};

export const isTelegram = () => !!tg()?.initData;
export const initData = (): string => tg()?.initData || '';
export const startParam = (): string | null => tg()?.initDataUnsafe?.start_param || null;

const atLeast = (v: string) => {
  try {
    return !!tg()?.isVersionAtLeast?.(v);
  } catch {
    return false;
  }
};

export function tgInit() {
  const w = tg();
  if (!w) return;
  try {
    w.ready();
  } catch {}
  try {
    w.expand();
  } catch {}
  if (atLeast('6.1')) {
    try {
      w.setHeaderColor('#020617');
      w.setBackgroundColor('#020617');
    } catch {}
  }
  if (atLeast('7.10')) {
    try {
      w.setBottomBarColor?.('#020617');
    } catch {}
  }
  if (atLeast('7.7')) {
    try {
      w.disableVerticalSwipes?.();
    } catch {}
  }
}

type Haptic = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'select';
export function haptic(kind: Haptic = 'light') {
  const w = tg();
  try {
    if (w?.HapticFeedback && atLeast('6.1')) {
      if (kind === 'success' || kind === 'error' || kind === 'warning') w.HapticFeedback.notificationOccurred(kind);
      else if (kind === 'select') w.HapticFeedback.selectionChanged();
      else w.HapticFeedback.impactOccurred(kind);
      return;
    }
  } catch {}
  try {
    if (kind !== 'select') navigator.vibrate?.(kind === 'heavy' || kind === 'error' ? 30 : 10);
  } catch {}
}

export function openLink(url: string) {
  const w = tg();
  try {
    if (url.startsWith('https://t.me/') && w?.openTelegramLink && atLeast('6.1')) {
      w.openTelegramLink(url);
      return;
    }
    if (w?.openLink) {
      w.openLink(url);
      return;
    }
  } catch {}
  window.open(url, '_blank', 'noopener');
}

export function shareToTelegram(url: string, text: string) {
  openLink(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
}

export function tgConfirm(message: string): Promise<boolean> {
  const w = tg();
  return new Promise((resolve) => {
    try {
      if (w?.showConfirm && atLeast('6.2')) {
        w.showConfirm(message, (ok: boolean) => resolve(!!ok));
        return;
      }
    } catch {}
    resolve(window.confirm(message));
  });
}
