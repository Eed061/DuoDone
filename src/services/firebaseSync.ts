import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, child, off } from 'firebase/database';
import { Household, Task, Counter, ActivityLog, RouletteItem, User } from '../types';

// Firebase configuration for real-time cloud synchronization
const firebaseConfig = {
  apiKey: "AIzaSyD-DuoDoneSyncApiKey2026",
  authDomain: "duodone-sync.firebaseapp.com",
  databaseURL: "https://duodone-sync-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "duodone-sync",
  storageBucket: "duodone-sync.appspot.com",
  messagingSenderId: "109876543210",
  appId: "1:109876543210:web:duodone123456789"
};

let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
} catch (e) {
  console.warn('Firebase init warning:', e);
}

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

let activeListenerRef: any = null;
let activeListenerCallback: any = null;

export class FirebaseSyncService {
  private isDebouncingPush = false;
  private pushTimer: any = null;

  public sanitizeCode(code: string): string {
    return (code || 'DUO-7789').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  // Push current household state to cloud
  public pushState(state: Omit<CloudState, 'updatedAt'>): void {
    if (!db || !state.household?.invite_code) return;

    // Debounce rapid local edits (e.g. typing names or multiple taps)
    if (this.pushTimer) clearTimeout(this.pushTimer);

    this.pushTimer = setTimeout(() => {
      try {
        const code = this.sanitizeCode(state.household.invite_code);
        const dataToSave: CloudState = {
          ...state,
          updatedAt: new Date().toISOString(),
        };

        const dbRef = ref(db, `households/${code}`);
        set(dbRef, dataToSave).catch((err) => {
          console.error('Cloud sync push error:', err);
        });
      } catch (err) {
        console.error('Cloud sync error:', err);
      }
    }, 200);
  }

  // Fetch household state from cloud by invite code
  public async fetchHouseholdByCode(inviteCode: string): Promise<CloudState | null> {
    if (!db || !inviteCode) return null;
    try {
      const code = this.sanitizeCode(inviteCode);
      const dbRef = ref(db);
      const snapshot = await get(child(dbRef, `households/${code}`));
      if (snapshot.exists()) {
        return snapshot.val() as CloudState;
      }
      return null;
    } catch (err) {
      console.error('Fetch household cloud error:', err);
      return null;
    }
  }

  // Subscribe to real-time changes for a household
  public subscribeToHousehold(inviteCode: string, onUpdate: (data: CloudState) => void): void {
    if (!db || !inviteCode) return;
    try {
      const code = this.sanitizeCode(inviteCode);
      const dbRef = ref(db, `households/${code}`);

      if (activeListenerRef && activeListenerCallback) {
        off(activeListenerRef, 'value', activeListenerCallback);
      }

      activeListenerRef = dbRef;
      activeListenerCallback = (snapshot: any) => {
        if (snapshot.exists()) {
          const val = snapshot.val() as CloudState;
          onUpdate(val);
        }
      };

      onValue(dbRef, activeListenerCallback);
    } catch (err) {
      console.error('Realtime subscription error:', err);
    }
  }

  // Stop active listener
  public unsubscribe(): void {
    if (activeListenerRef && activeListenerCallback) {
      try {
        off(activeListenerRef, 'value', activeListenerCallback);
      } catch {}
      activeListenerRef = null;
      activeListenerCallback = null;
    }
  }
}

export const cloudSync = new FirebaseSyncService();
