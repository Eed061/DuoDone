import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  off,
  DatabaseReference,
  Database,
} from 'firebase/database';
import { Household, Task, Counter, ActivityLog, RouletteItem, User } from '../types';

export interface CloudState {
  household: Household;
  users: User[];
  tasks: Task[];
  counters: Counter[];
  activityLogs: ActivityLog[];
  rouletteItems: RouletteItem[];
  updatedAt: string;
  updatedByUserId?: string;
}

// ─── Firebase init (safe: only once) ─────────────────────────────────────────
const FIREBASE_CONFIG = {
  databaseURL: 'https://duodone-f4f09-default-rtdb.europe-west1.firebasedatabase.app',
};

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
}

function getDb(): Database {
  return getDatabase(getFirebaseApp());
}

function spaceRef(code: string): DatabaseReference {
  return ref(getDb(), `spaces/${code}`);
}

// ─── Sanitize & Extract invite code ─────────────────────────────────────────
export function sanitizeCode(code: string): string {
  return (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export function extractInviteCode(param: string): string {
  if (!param) return '';
  let cleaned = String(param).trim();
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {}

  if (cleaned.toLowerCase().startsWith('accept_')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.toLowerCase().startsWith('join_')) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.includes('_')) {
    const parts = cleaned.split('_');
    cleaned = parts[parts.length - 1];
  }

  const match = cleaned.match(/[A-Z0-9]{3,6}(?:-[A-Z0-9]{2,6})?/i);
  return match ? sanitizeCode(match[0]) : sanitizeCode(cleaned);
}

// ─── FirebaseSyncService ─────────────────────────────────────────────────────
export class FirebaseSyncService {
  private pushTimer: any = null;
  private currentListener: DatabaseReference | null = null;
  private lastWrittenAt = '';

  // ── Push full state to Firebase RTDB (REST + WebSocket SDK) ──────────────
  public pushState(
    state: Omit<CloudState, 'updatedAt'>,
    _requestingUserId?: string
  ): void {
    if (!state.household?.invite_code) return;

    if (this.pushTimer) clearTimeout(this.pushTimer);

    this.pushTimer = setTimeout(async () => {
      const code = sanitizeCode(state.household.invite_code);
      const dataToSave: CloudState = {
        ...state,
        updatedAt: new Date().toISOString(),
      };

      this.lastWrittenAt = dataToSave.updatedAt;

      // 1. Direct REST PUT to Firebase RTDB (synchronous, 100% reliable across all browsers and iOS WKWebView)
      try {
        fetch(`${FIREBASE_CONFIG.databaseURL}/spaces/${code}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        }).catch((e) => console.warn('DuoDone: Firebase REST PUT error:', e));
      } catch {}

      // 2. Direct Firebase SDK write (fires Realtime listeners immediately)
      try {
        await set(spaceRef(code), dataToSave);
      } catch (err) {
        console.warn('DuoDone: Firebase SDK set failed:', err);
      }

      // 3. Fallback Vercel API
      try {
        const apiUrl = typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}/api/sync?code=${code}`
          : `/api/sync?code=${code}`;
        fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        }).catch(() => {});
      } catch {}
    }, 150);
  }

  // ── Immediate synchronous push (for explicit user actions: share, create) ──
  public async pushStateImmediate(
    state: Omit<CloudState, 'updatedAt'>
  ): Promise<void> {
    if (!state.household?.invite_code) return;
    if (this.pushTimer) clearTimeout(this.pushTimer);

    const code = sanitizeCode(state.household.invite_code);
    const dataToSave: CloudState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    this.lastWrittenAt = dataToSave.updatedAt;

    try {
      await fetch(`${FIREBASE_CONFIG.databaseURL}/spaces/${code}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      });
    } catch {}

    try {
      await set(spaceRef(code), dataToSave);
    } catch {}
  }

  // ── Fetch once from Firebase (Direct REST + SDK get + Vercel API fallback) ─
  public async fetchHouseholdByCode(
    inviteCode: string,
    _requestingUserId?: string,
    _requestingTgId?: string | number,
    _requestingTgUsername?: string
  ): Promise<CloudState | null> {
    if (!inviteCode) return null;
    const code = sanitizeCode(inviteCode);

    // 1. PRIMARY: Direct Firebase REST API (fast, reliable, no WebSocket dependencies)
    try {
      const res = await fetch(`${FIREBASE_CONFIG.databaseURL}/spaces/${code}.json`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) return data;
      }
    } catch (err) {
      console.warn('DuoDone: fetchHouseholdByCode REST error:', err);
    }

    // 2. Firebase SDK get()
    try {
      const snapshot = await get(spaceRef(code));
      if (snapshot.exists()) {
        const data = snapshot.val() as CloudState;
        if (data && data.household) return data;
      }
    } catch (err) {
      console.warn('DuoDone: fetchHouseholdByCode Firebase SDK error:', err);
    }

    // 3. Fallback to Vercel API if Firebase unavailable
    try {
      const apiUrl = typeof window !== 'undefined' && window.location?.origin
        ? `${window.location.origin}/api/sync?code=${code}`
        : `/api/sync?code=${code}`;
      const res = await fetch(apiUrl);
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) return data;
      }
    } catch {}

    return null;
  }

  // ── Real-time subscription via Firebase onValue + iOS Visibility & Polling Fallback ──
  public subscribeToHousehold(
    inviteCode: string,
    requestingUserId: string,
    onUpdate: (data: CloudState) => void,
    onDenied?: () => void,
    _requestingTgId?: string | number,
    _requestingTgUsername?: string
  ): void {
    if (!inviteCode) return;
    const code = sanitizeCode(inviteCode);

    // Stop any existing subscription first
    this.unsubscribe();

    const dbRef = spaceRef(code);
    this.currentListener = dbRef;

    let lastSeenAt = '';

    const handleIncomingData = (data: CloudState) => {
      if (!data || !data.household) return;
      const incomingAt = data.updatedAt || '';

      if (incomingAt && incomingAt === this.lastWrittenAt && incomingAt === lastSeenAt) {
        return;
      }

      if (!lastSeenAt || incomingAt > lastSeenAt) {
        if (incomingAt && incomingAt === this.lastWrittenAt) {
          lastSeenAt = incomingAt;
          return;
        }
        lastSeenAt = incomingAt;
        onUpdate(data);
      }
    };

    // 1. Realtime WebSocket listener via Firebase SDK
    onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.val() as CloudState;
        handleIncomingData(data);
      },
      (error) => {
        console.warn('DuoDone: Firebase onValue error:', error);
        if (error.message?.includes('Permission denied')) {
          this.unsubscribe();
          if (onDenied) onDenied();
        }
      }
    );

    // 2. Direct REST poll check helper (guarantees sync on iOS when WebSockets pause)
    const checkViaRest = async () => {
      try {
        const res = await fetch(`${FIREBASE_CONFIG.databaseURL}/spaces/${code}.json`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = (await res.json()) as CloudState;
          if (data && data.household) {
            handleIncomingData(data);
          }
        }
      } catch {}
    };

    // 3. iOS foreground return listener (visibilitychange)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        checkViaRest();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // 4. Periodic polling backup (every 3.5s) while app is open
    const pollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkViaRest();
      }
    }, 3500);

    (this as any)._cleanup = () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(pollInterval);
    };
  }

  // ── Check space access via API (join_check) ──────────────────────────────
  public async checkSpaceAccess(
    inviteCode: string,
    requestingUserId?: string,
    requestingTgId?: string | number,
    requestingTgUsername?: string
  ): Promise<{ allowed: boolean; is_locked?: boolean; message?: string }> {
    const code = sanitizeCode(inviteCode);
    if (!code) return { allowed: true };

    try {
      const data = await this.fetchHouseholdByCode(code);
      if (data && data.users) {
        const realMembers = (data.users || []).filter((u: User) => !u.is_placeholder);
        if (realMembers.length >= 2) {
          const memberTgIds = realMembers.map((u: User) => String(u.telegram_id || '').trim()).filter(Boolean);
          const memberUserIds = realMembers.map((u: User) => String(u.id || ''));
          const memberTgUsernames = realMembers
            .map((u: User) => String(u.telegram_username || '').replace('@', '').toLowerCase())
            .filter(Boolean);

          const allowed =
            (requestingTgId && memberTgIds.includes(String(requestingTgId))) ||
            (requestingTgUsername && memberTgUsernames.includes(String(requestingTgUsername).toLowerCase())) ||
            (requestingUserId && memberUserIds.includes(requestingUserId)) ||
            !realMembers.some((u: User) => u.telegram_id);

          if (!allowed) {
            return {
              allowed: false,
              is_locked: true,
              message: 'Цей простір вже сформований для 2 партнерів. Створіть свій власний!',
            };
          }
        }
      }
    } catch {}

    return { allowed: true };
  }

  // ── Stop listening ─────────────────────────────────────────────────────────
  public unsubscribe(): void {
    if (this.currentListener) {
      off(this.currentListener);
      this.currentListener = null;
    }
    if ((this as any)._cleanup) {
      (this as any)._cleanup();
      (this as any)._cleanup = null;
    }
    this.lastWrittenAt = '';
  }
}

export const cloudSync = new FirebaseSyncService();
