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

const FIREBASE_DB_URL = 'https://duodone-f4f09-default-rtdb.europe-west1.firebasedatabase.app';

export class FirebaseSyncService {
  private pushTimer: any = null;
  // Per-instance tracking so multiple simultaneous subscriptions don't conflict
  private lastKnownUpdatedAt = '';
  private activePollInterval: any = null;
  private currentPollCode = '';
  private consecutiveErrors = 0;

  public sanitizeCode(code: string): string {
    return (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  // Push current household state to cloud (Dual-write: Vercel serverless + direct Firebase RTDB)
  public pushState(state: Omit<CloudState, 'updatedAt'>, requestingUserId?: string): void {
    if (!state.household?.invite_code) return;

    if (this.pushTimer) clearTimeout(this.pushTimer);

    this.pushTimer = setTimeout(async () => {
      try {
        const code = this.sanitizeCode(state.household.invite_code);
        const dataToSave: CloudState = {
          ...state,
          updatedAt: new Date().toISOString(),
        };

        // Update immediately so our own push doesn't trigger a pull-back in polling
        this.lastKnownUpdatedAt = dataToSave.updatedAt;

        // 1. Send to Vercel serverless endpoint
        fetch(`/api/sync?code=${code}&userId=${requestingUserId || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dataToSave, requestingUserId }),
        }).catch(() => {});

        // 2. Direct fast push to Firebase Realtime Database
        fetch(`${FIREBASE_DB_URL}/households/${code}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave),
        }).catch(() => {});

      } catch (err) {
        console.warn('Cloud push warning:', err);
      }
    }, 250);
  }

  // Check if household space is full (2 members locked) for a 3rd user
  public async checkSpaceAccess(
    inviteCode: string,
    requestingUserId?: string,
    requestingTgId?: string | number,
    requestingTgUsername?: string
  ): Promise<{ allowed: boolean; is_locked?: boolean; message?: string }> {
    const code = this.sanitizeCode(inviteCode);
    if (!code) return { allowed: true };
    try {
      const url = `/api/sync?code=${code}&action=join_check&userId=${requestingUserId || ''}&tgId=${requestingTgId || ''}&tgUsername=${requestingTgUsername || ''}`;
      const res = await fetch(url);
      if (res.status === 403) {
        const body = await res.json();
        return { allowed: false, is_locked: true, message: body.message };
      }
    } catch {}
    return { allowed: true };
  }

  // Fetch household state from cloud by invite code with requestingUserId access control
  public async fetchHouseholdByCode(
    inviteCode: string,
    requestingUserId?: string,
    requestingTgId?: string | number,
    requestingTgUsername?: string
  ): Promise<CloudState | null> {
    if (!inviteCode) return null;
    const code = this.sanitizeCode(inviteCode);

    // 1. Try Vercel Serverless Endpoint
    try {
      const url = `/api/sync?code=${code}&userId=${requestingUserId || ''}&tgId=${requestingTgId || ''}&tgUsername=${requestingTgUsername || ''}`;
      const res = await fetch(url);
      if (res.status === 403) return null;
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) {
          return data;
        }
      }
    } catch (err) {
      console.warn('fetchHouseholdByCode api error:', err);
    }

    // 2. Direct fallback to Firebase Realtime Database
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/households/${code}.json`);
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) {
          return data;
        }
      }
    } catch (err) {
      console.warn('fetchHouseholdByCode direct firebase error:', err);
    }

    return null;
  }

  // Subscribe to real-time changes for a household (Polling Engine).
  // Performs an initial seed fetch before starting the interval so that the
  // first poll tick does NOT spuriously fire onUpdate with stale cloud data.
  public subscribeToHousehold(
    inviteCode: string,
    requestingUserId: string,
    onUpdate: (data: CloudState) => void,
    onDenied?: () => void,
    requestingTgId?: string | number,
    requestingTgUsername?: string
  ): void {
    if (!inviteCode) return;
    const code = this.sanitizeCode(inviteCode);

    // Stop any previous subscription
    this.unsubscribe();
    this.currentPollCode = code;
    this.consecutiveErrors = 0;

    // Seed lastKnownUpdatedAt so the first poll tick won't immediately fire onUpdate
    this.fetchHouseholdByCode(code, requestingUserId, requestingTgId, requestingTgUsername)
      .then((seedData) => {
        if (seedData?.updatedAt) {
          if (!this.lastKnownUpdatedAt || seedData.updatedAt > this.lastKnownUpdatedAt) {
            this.lastKnownUpdatedAt = seedData.updatedAt;
          }
        }
      })
      .catch(() => {});

    this.activePollInterval = setInterval(async () => {
      // Guard: stop if subscription changed to another code
      if (this.currentPollCode !== code) {
        clearInterval(this.activePollInterval);
        this.activePollInterval = null;
        return;
      }

      try {
        const freshData = await this.fetchHouseholdByCode(
          code,
          requestingUserId,
          requestingTgId,
          requestingTgUsername
        );

        this.consecutiveErrors = 0;

        if (freshData && freshData.household) {
          if (
            freshData.updatedAt &&
            freshData.updatedAt !== this.lastKnownUpdatedAt &&
            // Only accept data strictly newer than our last known timestamp
            freshData.updatedAt > this.lastKnownUpdatedAt
          ) {
            this.lastKnownUpdatedAt = freshData.updatedAt;
            onUpdate(freshData);
          }
        } else if (freshData === null) {
          // null = 403 access denied
          const access = await this.checkSpaceAccess(code, requestingUserId);
          if (!access.allowed) {
            this.unsubscribe();
            if (onDenied) onDenied();
          }
        }
      } catch {
        this.consecutiveErrors++;
        if (this.consecutiveErrors >= 10) {
          console.warn('DuoDone: Polling stopped after 10 consecutive errors for code:', code);
          this.unsubscribe();
        }
      }
    }, 3000);
  }

  // Stop active listener and reset state
  public unsubscribe(): void {
    if (this.activePollInterval) {
      clearInterval(this.activePollInterval);
      this.activePollInterval = null;
    }
    this.currentPollCode = '';
    // Reset lastKnownUpdatedAt so next subscription starts fresh
    this.lastKnownUpdatedAt = '';
    this.consecutiveErrors = 0;
  }
}

export const cloudSync = new FirebaseSyncService();
