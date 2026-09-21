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

  // в”Ђв”Ђ Real-time subscription via Firebase onValue (WebSocket) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  // This is the key fix: onValue() opens a persistent WebSocket to Firebase.
  // When partner saves data, Firebase pushes it to this client in ~100ms.
  // No polling. No Vercel. No cold starts.
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

    let isFirstCall = true;

    onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // No data yet in Firebase вЂ” this is normal for a brand new space.
          isFirstCall = false;
          return;
        }

        const data = snapshot.val() as CloudState;
        if (!data || !data.household) {
          isFirstCall = false;
          return;
        }

        // First call: always apply (syncs state on startup with partner's data)
        if (isFirstCall) {
          isFirstCall = false;
          // If firebase has data and it's different from what we wrote, apply it
          if (data.updatedAt && data.updatedAt !== this.lastWrittenAt) {
            onUpdate(data);
          }
          return;
        }

        // Subsequent calls: only apply if strictly newer than our last write
        // This prevents our own push from echoing back and overwriting local state
        if (data.updatedAt && data.updatedAt > this.lastWrittenAt) {
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('DuoDone: Firebase onValue error:', error);
        // If access denied, notify caller
        if (error.message?.includes('Permission denied')) {
          this.unsubscribe();
          if (onDenied) onDenied();
        }
      }
    );
  }

  // в”Ђв”Ђ Check space access via API (join_check) в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
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

  // в”Ђв”Ђ Stop listening в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
  public unsubscribe(): void {
    if (this.currentListener) {
      off(this.currentListener);
      this.currentListener = null;
    }
    this.lastWrittenAt = '';
  }
}

export const cloudSync = new FirebaseSyncService();

