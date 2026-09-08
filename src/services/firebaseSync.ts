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

let activePollInterval: any = null;
let lastKnownUpdatedAt = '';

export class FirebaseSyncService {
  private pushTimer: any = null;

  public sanitizeCode(code: string): string {
    return (code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  }

  // Push current household state to cloud
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

        lastKnownUpdatedAt = dataToSave.updatedAt;

        // 1. Send to Vercel serverless endpoint with requestingUserId
        fetch(`/api/sync?code=${code}&userId=${requestingUserId || ''}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...dataToSave, requestingUserId }),
        }).catch(() => {});

        // 2. Backup send to secondary global REST API
        fetch('https://api.restful-api.dev/objects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'DUODONE_HH_' + code, data: dataToSave }),
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
      if (res.status === 403) {
        // Forbidden to 3rd party
        return null;
      }
      if (res.ok) {
        const data = (await res.json()) as CloudState;
        if (data && data.household) {
          if (data.updatedAt) lastKnownUpdatedAt = data.updatedAt;
          return data;
        }
      }
    } catch {}

    // 2. Try Secondary REST Backup Store
    try {
      const res = await fetch('https://api.restful-api.dev/objects');
      if (res.ok) {
        const objects: any[] = await res.json();
        const found = objects
          .reverse()
          .find((o: any) => o.name === 'DUODONE_HH_' + code && o.data && o.data.household);

        if (found && found.data) {
          const data = found.data as CloudState;
          const realMembers = (data.users || []).filter((u: User) => !u.is_placeholder);
          if (realMembers.length >= 2) {
            const memberTgIds = realMembers.map((u: User) => String(u.telegram_id || ''));
            const memberTgUsernames = realMembers.map((u: User) => String(u.telegram_username || '').replace('@', '').toLowerCase());
            let isAuth = false;
            if (requestingTgId && memberTgIds.includes(String(requestingTgId))) isAuth = true;
            else if (requestingTgUsername && memberTgUsernames.includes(String(requestingTgUsername).toLowerCase())) isAuth = true;
            else if (!requestingTgId && !requestingTgUsername && requestingUserId) {
              const m = realMembers.find((u: User) => String(u.id) === String(requestingUserId));
              if (m && !m.telegram_id) isAuth = true;
            }
            if (!isAuth) {
              return null;
            }
          }
          if (data.updatedAt) lastKnownUpdatedAt = data.updatedAt;
          return data;
        }
      }
    } catch (err) {
      console.warn('Fetch backup error:', err);
    }

    return null;
  }

  // Subscribe to real-time changes for a household (Polling Engine)
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

    this.unsubscribe();

    activePollInterval = setInterval(async () => {
      try {
        const freshData = await this.fetchHouseholdByCode(code, requestingUserId, requestingTgId, requestingTgUsername);
        if (freshData && freshData.household) {
          if (freshData.updatedAt && freshData.updatedAt !== lastKnownUpdatedAt) {
            lastKnownUpdatedAt = freshData.updatedAt;
            onUpdate(freshData);
          }
        } else {
          // Verify if space was locked and access denied
          const access = await this.checkSpaceAccess(code, requestingUserId);
          if (!access.allowed) {
            this.unsubscribe();
            if (onDenied) onDenied();
          }
        }
      } catch {}
    }, 2500);
  }

  // Stop active listener
  public unsubscribe(): void {
    if (activePollInterval) {
      clearInterval(activePollInterval);
      activePollInterval = null;
    }
  }
}

export const cloudSync = new FirebaseSyncService();
