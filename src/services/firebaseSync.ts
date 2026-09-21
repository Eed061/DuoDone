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
  serverTimestamp,
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

// в”Ђв”Ђв”Ђ Firebase init (safe: only once) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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

// в”Ђв”Ђв”Ђ Sanitize invite code в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export function sanitizeCode(code: string): string {
  return (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

// в”Ђв”Ђв”Ђ FirebaseSyncService в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
export class FirebaseSyncService {
  private pushTimer: any = null;
  private currentListener: DatabaseReference | null = null;
  private lastWrittenAt = '';

  // в”Ђв”Ђ Push full state to Firebase RTDB в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  // Debounced 250ms so rapid UI clicks collapse into one write.
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

      // Mark own write time so the onValue listener ignores this echo
      this.lastWrittenAt = dataToSave.updatedAt;

      try {
        // PRIMARY: direct Firebase SDK write (always works вЂ” no Vercel, no cold start)
        await set(spaceRef(code), dataToSave);
      } catch (err) {
        console.warn('DuoDone: Firebase write failed, retrying via API...', err);
        // FALLBACK: Vercel API (keeps Vercel store in sync for access control)
        fetch(`/api/sync?code=${code}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        }).catch(() => {});
      }
    }, 250);
  }

  // в”Ђв”Ђ Fetch once from Firebase в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  public async fetchHouseholdByCode(
    inviteCode: string,
    _requestingUserId?: string,
    _requestingTgId?: string | number,
    _requestingTgUsername?: string
  ): Promise<CloudState | null> {
    if (!inviteCode) return null;
    const code = sanitizeCode(inviteCode);

    try {
      const snapshot = await get(spaceRef(code));
      if (snapshot.exists()) {
        const data = snapshot.val() as CloudState;
        if (data && data.household) return data;
      }
    } catch (err) {
      console.warn('DuoDone: fetchHouseholdByCode Firebase error:', err);
    }

    // Fallback to Vercel API if Firebase unavailable
    try {
      const res = await fetch(`/api/sync?code=${code}`);
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) return data;
      }
    } catch {}

    return null;
  }

  // ── Real-time subscription via Firebase onValue (WebSocket) ────────────────
  // onValue() opens a persistent WebSocket to Firebase.
  // When partner saves data, Firebase pushes it to this client in ~100ms.
  // Firebase SDK automatically reconnects after iOS background suspension.
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

    // lastSeenAt tracks the updatedAt of the last data we APPLIED.
    // It's separate from lastWrittenAt (our own writes).
    let lastSeenAt = '';

    onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // No data yet in Firebase — normal for a brand new space.
          return;
        }

        const data = snapshot.val() as CloudState;
        if (!data || !data.household) return;

        const incomingAt = data.updatedAt || '';

        // Skip if this is a pure echo of our own latest write
        // AND we haven't seen anything newer from the partner yet
        if (incomingAt && incomingAt === this.lastWrittenAt && incomingAt === lastSeenAt) {
          return;
        }

        // Apply if:
        // 1. We haven't seen this version yet (covers first load + iOS reconnect)
        // 2. The data is newer than what we last saw
        if (!lastSeenAt || incomingAt > lastSeenAt) {
          // Don't apply our own echo (we already have this data locally)
          if (incomingAt && incomingAt === this.lastWrittenAt) {
            // It's our own data echoed back — update lastSeenAt but don't re-apply
            lastSeenAt = incomingAt;
            return;
          }
          lastSeenAt = incomingAt;
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('DuoDone: Firebase onValue error:', error);
        if (error.message?.includes('Permission denied')) {
          this.unsubscribe();
          if (onDenied) onDenied();
        }
      }
    );

    // iOS fix: when user returns to Telegram from background,
    // Firebase SDK reconnects automatically, but we add a visibilitychange
    // listener to force a one-time re-fetch in case reconnect is slow.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        get(spaceRef(code)).then((snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.val() as CloudState;
          if (!data?.household) return;
          const incomingAt = data.updatedAt || '';
          if (incomingAt && incomingAt > lastSeenAt && incomingAt !== this.lastWrittenAt) {
            lastSeenAt = incomingAt;
            onUpdate(data);
          }
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    // Store cleanup function to remove listener on unsubscribe
    (this as any)._visibilityCleanup = () => {
      document.removeEventListener('visibilitychange', onVisible);
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

    // Check Firebase directly: count real members
    try {
      const snapshot = await get(spaceRef(code));
      if (snapshot.exists()) {
        const data = snapshot.val() as CloudState;
        const realMembers = (data.users || []).filter((u: User) => !u.is_placeholder);
        if (realMembers.length >= 2) {
          // Space is full вЂ” check if requesting user is one of the members
          const memberTgIds = realMembers.map((u: User) => String(u.telegram_id || '').trim()).filter(Boolean);
          const memberUserIds = realMembers.map((u: User) => String(u.id || ''));
          const memberTgUsernames = realMembers
            .map((u: User) => String(u.telegram_username || '').replace('@', '').toLowerCase())
            .filter(Boolean);

          const allowed =
            (requestingTgId && memberTgIds.includes(String(requestingTgId))) ||
            (requestingTgUsername && memberTgUsernames.includes(String(requestingTgUsername).toLowerCase())) ||
            (requestingUserId && memberUserIds.includes(requestingUserId)) ||
            !realMembers.some((u: User) => u.telegram_id); // migration: no TG IDs yet

          if (!allowed) {
            return {
              allowed: false,
              is_locked: true,
              message: 'Р¦РµР№ РїСЂРѕСЃС‚С–СЂ РІР¶Рµ СЃС„РѕСЂРјРѕРІР°РЅРёР№ РґР»СЏ 2 РїР°СЂС‚РЅРµСЂС–РІ. РЎС‚РІРѕСЂС–С‚СЊ СЃРІС–Р№ РІР»Р°СЃРЅРёР№!',
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
    // Clean up iOS visibilitychange listener if one was registered
    if ((this as any)._visibilityCleanup) {
      (this as any)._visibilityCleanup();
      (this as any)._visibilityCleanup = null;
    }
    this.lastWrittenAt = '';
  }

}

export const cloudSync = new FirebaseSyncService();
