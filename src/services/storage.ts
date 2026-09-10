import { Household, Task, Counter, ActivityLog, RouletteItem, User } from '../types';

const STORAGE_KEYS = {
  USERS: 'duodone_users',
  HOUSEHOLD: 'duodone_household',
  TASKS: 'duodone_tasks',
  COUNTERS: 'duodone_counters',
  ACTIVITY_LOGS: 'duodone_activity_logs',
  ROULETTE_ITEMS: 'duodone_roulette_items',
  ACTIVE_USER_ID: 'duodone_active_user_id',
  HOUSEHOLDS_LIST: 'duodone_households_list',
};

// Seed default users
export const defaultUsers: User[] = [
  {
    id: 'user-he-101',
    first_name: 'Партнер 1',
    role_title: 'Партнер 1',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry&backgroundColor=b6e3f4',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-she-102',
    first_name: 'Партнер 2',
    role_title: 'Партнер 2',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=ffdfbf',
    created_at: new Date().toISOString(),
  },
];

// Seed default household space
export const defaultHousehold: Household = {
  id: 'hh-main-001',
  name: 'Наш затишний дім',
  invite_code: 'DUO-7789',
  duodone_mode: 'balancer',
  period_type: 'monthly',
  period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
  reward_type: 'roulette',
  fixed_reward_text: 'Переможець отримує романтичну вечерю в ресторані',
  created_at: new Date().toISOString(),
  show_balancer_widget: true,
};

// Seed default DuoDone tasks (Section 6 of ТЗ)
export const defaultTasks: Task[] = [
  {
    id: 'task-dishes-1',
    household_id: 'hh-main-001',
    title: 'Миття посуду',
    icon: '🧽',
    xp_points: 2,
    photo_required: false,
    current_turn_user_id: 'user-he-101',
    last_action_timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    is_active: true,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-trash-2',
    household_id: 'hh-main-001',
    title: 'Виніс сміття',
    icon: '🗑️',
    xp_points: 1,
    photo_required: false,
    current_turn_user_id: 'user-she-102',
    last_action_timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
    is_active: true,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-cleaning-3',
    household_id: 'hh-main-001',
    title: 'Вологе прибирання',
    icon: '🧹',
    xp_points: 3,
    photo_required: false,
    current_turn_user_id: 'user-he-101',
    last_action_timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    is_active: true,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-bathroom-4',
    household_id: 'hh-main-001',
    title: 'Миття санвузла',
    icon: '🚽',
    xp_points: 4,
    photo_required: true,
    current_turn_user_id: 'user-she-102',
    last_action_timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    is_active: true,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
];

// Seed default counters (Section 6 of ТЗ)
export const defaultCounters: Counter[] = [
  {
    id: 'counter-windows-1',
    household_id: 'hh-main-001',
    created_by_user_id: 'user-he-101',
    title: 'Миття вікон',
    icon: '🪟',
    photo_mode: 'required',
    step: 1,
    total_count: 0,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'counter-vacuum-2',
    household_id: 'hh-main-001',
    created_by_user_id: 'user-she-102',
    title: 'Пилососіння',
    icon: '🧹',
    photo_mode: 'none',
    step: 1,
    total_count: 0,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'counter-flowers-3',
    household_id: 'hh-main-001',
    created_by_user_id: 'user-he-101',
    title: 'Полив квітів',
    icon: '🪴',
    photo_mode: 'none',
    step: 1,
    total_count: 0,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
];

// Seed default roulette sectors (Section 6 of ТЗ)
export const defaultRouletteItems: RouletteItem[] = [
  {
    id: 'roul-r1',
    household_id: 'hh-main-001',
    type: 'reward',
    text: 'Масаж спини 25 хв',
    is_default: true,
  },
  {
    id: 'roul-r2',
    household_id: 'hh-main-001',
    type: 'reward',
    text: 'Кава у ліжко ☕',
    is_default: true,
  },
  {
    id: 'roul-r3',
    household_id: 'hh-main-001',
    type: 'reward',
    text: 'Вибір фільму без суперечок 🎬',
    is_default: true,
  },
  {
    id: 'roul-r4',
    household_id: 'hh-main-001',
    type: 'reward',
    text: 'День без домашніх справ 🏖️',
    is_default: true,
  },
  {
    id: 'roul-p1',
    household_id: 'hh-main-001',
    type: 'penalty',
    text: 'Миття всього посуду 3 дні поспіль 🥣',
    is_default: true,
  },
  {
    id: 'roul-p2',
    household_id: 'hh-main-001',
    type: 'penalty',
    text: 'Повний закуп у супермаркеті 🛒',
    is_default: true,
  },
  {
    id: 'roul-p3',
    household_id: 'hh-main-001',
    type: 'penalty',
    text: 'Приготування складної вечері 🍲',
    is_default: true,
  },
  {
    id: 'roul-p4',
    household_id: 'hh-main-001',
    type: 'penalty',
    text: 'Миття взуття в коридорі 👟',
    is_default: true,
  },
];

// Initial activity logs (Empty so all users start clean at 0 XP)
const defaultLogs: ActivityLog[] = [];

class StorageService {
  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  }

  public initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const initialUserId = `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const initialUsers: User[] = [
        {
          id: initialUserId,
          first_name: 'Партнер 1',
          role_title: 'Партнер 1',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry&backgroundColor=b6e3f4',
          created_at: new Date().toISOString(),
        },
        {
          id: `usr-partner-2-${Date.now()}`,
          first_name: 'Партнер',
          role_title: 'Партнер 2',
          avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=ffdfbf',
          is_placeholder: true,
          created_at: new Date().toISOString(),
        },
      ];
      this.setItem(STORAGE_KEYS.USERS, initialUsers);
      this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, initialUserId);

      if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLD)) {
        const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
        const uniqueHousehold: Household = {
          id: `hh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: 'Наш затишний дім',
          invite_code: `DUO-${randomCodeSuffix}`,
          duodone_mode: 'balancer',
          period_type: 'monthly',
          period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          reward_type: 'roulette',
          created_at: new Date().toISOString(),
          show_balancer_widget: true,
          owner_user_id: initialUserId,
          is_locked: false,
          members: [{ userId: initialUserId, role: 'p1', joinedAt: new Date().toISOString() }],
        };
        this.setItem(STORAGE_KEYS.HOUSEHOLD, uniqueHousehold);
        this.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, [uniqueHousehold]);
      }
    }

    if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLD)) {
      const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
      const activeUId = this.getActiveUserId();
      const uniqueHousehold: Household = {
        id: `hh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: 'Наш затишний дім',
        invite_code: `DUO-${randomCodeSuffix}`,
        duodone_mode: 'balancer',
        period_type: 'monthly',
        period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
        reward_type: 'roulette',
        created_at: new Date().toISOString(),
        show_balancer_widget: true,
        owner_user_id: activeUId,
        is_locked: false,
        members: [{ userId: activeUId, role: 'p1', joinedAt: new Date().toISOString() }],
      };
      this.setItem(STORAGE_KEYS.HOUSEHOLD, uniqueHousehold);
      this.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, [uniqueHousehold]);
    }

    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      this.setItem(STORAGE_KEYS.TASKS, defaultTasks);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COUNTERS)) {
      this.setItem(STORAGE_KEYS.COUNTERS, defaultCounters);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROULETTE_ITEMS)) {
      this.setItem(STORAGE_KEYS.ROULETTE_ITEMS, defaultRouletteItems);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
      this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, defaultLogs);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID)) {
      const users = this.getUsers();
      this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, users[0]?.id || 'user-he-101');
    }
  }

  // Users
  public getUsers(): User[] {
    return this.getItem(STORAGE_KEYS.USERS, defaultUsers);
  }

  public updateUser(userId: string, updates: Partial<User>): User[] {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updates };
      this.setItem(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  public getActiveUserId(): string {
    return this.getItem(STORAGE_KEYS.ACTIVE_USER_ID, defaultUsers[0].id);
  }

  public setActiveUserId(userId: string): void {
    this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, userId);
  }

  // Household
  public getHousehold(): Household {
    return this.getItem(STORAGE_KEYS.HOUSEHOLD, defaultHousehold);
  }

  public saveHousehold(hh: Household): void {
    this.setItem(STORAGE_KEYS.HOUSEHOLD, hh);
  }

  public saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  public saveTasks(tasks: Task[]): void {
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  public saveCounters(counters: Counter[]): void {
    this.setItem(STORAGE_KEYS.COUNTERS, counters);
  }

  public saveActivityLogs(logs: ActivityLog[]): void {
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);
  }

  public saveRouletteItems(items: RouletteItem[]): void {
    this.setItem(STORAGE_KEYS.ROULETTE_ITEMS, items);
  }

  // Households List (Multi-Space)
  public getHouseholdsList(): Household[] {
    const list = this.getItem<Household[]>(STORAGE_KEYS.HOUSEHOLDS_LIST, []);
    if (list.length === 0) {
      const current = this.getHousehold();
      this.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, [current]);
      return [current];
    }
    return list;
  }

  public saveHouseholdToList(hh: Household): Household[] {
    const list = this.getHouseholdsList();
    const idx = list.findIndex((h) => h.id === hh.id || h.invite_code === hh.invite_code);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...hh };
    } else {
      list.push(hh);
    }
    this.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, list);
    return list;
  }

  public createNewHouseholdSpace(
    name?: string,
    ownerUserId?: string,
    ownerTgUser?: { id: number | string; first_name?: string; username?: string }
  ): Household {
    const randomCodeSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `DUO-${randomCodeSuffix}`;
    const u1Id = ownerUserId || `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const u2Id = `usr-partner-2-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newHousehold: Household = {
      id: `hh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name || `Простір #${randomCodeSuffix}`,
      invite_code: code,
      duodone_mode: 'balancer',
      period_type: 'monthly',
      period_end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      reward_type: 'roulette',
      created_at: new Date().toISOString(),
      show_balancer_widget: true,
      owner_user_id: u1Id,
      owner_telegram_id: ownerTgUser?.id || null,
      is_locked: false,
      members: [{
        userId: u1Id,
        telegram_id: ownerTgUser?.id || null,
        telegram_username: ownerTgUser?.username || null,
        role: 'p1' as const,
        joinedAt: new Date().toISOString(),
      }],
    };

    const freshUsers: User[] = [
      {
        id: u1Id,
        first_name: ownerTgUser?.first_name || 'Партнер 1',
        telegram_id: ownerTgUser?.id || null,
        telegram_username: ownerTgUser?.username || null,
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry&backgroundColor=b6e3f4',
        is_placeholder: false,
        created_at: new Date().toISOString(),
      },
      {
        id: u2Id,
        first_name: 'Партнер',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=ffdfbf',
        is_placeholder: true,
        created_at: new Date().toISOString(),
      },
    ];

    const freshTasks = defaultTasks.map((t) => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHousehold.id,
      current_turn_user_id: u1Id,
    }));

    const freshCounters = defaultCounters.map((c) => ({
      ...c,
      id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHousehold.id,
      created_by_user_id: u1Id,
      total_count: 0,
    }));

    const freshRoulette = defaultRouletteItems.map((r) => ({
      ...r,
      id: `roul-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHousehold.id,
    }));

    this.saveHousehold(newHousehold);
    this.saveHouseholdToList(newHousehold);
    this.saveUsers(freshUsers);
    this.setActiveUserId(u1Id);
    this.saveTasks(freshTasks);
    this.saveCounters(freshCounters);
    this.saveRouletteItems(freshRoulette);
    this.saveActivityLogs([]);

    return newHousehold;
  }

  public updateHousehold(updates: Partial<Household>): Household {
    const current = this.getHousehold();
    const updated = { ...current, ...updates };
    this.setItem(STORAGE_KEYS.HOUSEHOLD, updated);
    this.saveHouseholdToList(updated);
    return updated;
  }

  public deleteHouseholdSpace(householdId: string): Household[] {
    const list = this.getHouseholdsList().filter((h) => h.id !== householdId);
    this.setItem(STORAGE_KEYS.HOUSEHOLDS_LIST, list);
    // Also delete snapshot
    try { localStorage.removeItem(`duodone_space_${householdId}`); } catch {}
    return list;
  }

  // Per-space snapshot: saves current space data under its household ID
  public saveSpaceSnapshot(householdId?: string): void {
    const hhId = householdId || this.getHousehold().id;
    if (!hhId) return;
    const snapshot = {
      users: this.getUsers(),
      tasks: this.getTasks(),
      counters: this.getCounters(),
      activityLogs: this.getActivityLogs(),
      rouletteItems: this.getRouletteItems(),
      activeUserId: this.getActiveUserId(),
      userRole: localStorage.getItem('duodone_user_role') || 'p1',
    };
    try {
      localStorage.setItem(`duodone_space_${hhId}`, JSON.stringify(snapshot));
    } catch {}
  }

  // Restores space data from snapshot
  public loadSpaceSnapshot(householdId: string): boolean {
    try {
      const raw = localStorage.getItem(`duodone_space_${householdId}`);
      if (!raw) return false;
      const snapshot = JSON.parse(raw);
      if (snapshot.users) this.saveUsers(snapshot.users);
      if (snapshot.tasks) this.saveTasks(snapshot.tasks);
      if (snapshot.counters) this.saveCounters(snapshot.counters);
      if (snapshot.activityLogs) this.saveActivityLogs(snapshot.activityLogs);
      if (snapshot.rouletteItems) this.saveRouletteItems(snapshot.rouletteItems);
      if (snapshot.activeUserId) this.setActiveUserId(snapshot.activeUserId);
      if (snapshot.userRole) localStorage.setItem('duodone_user_role', snapshot.userRole);
      return true;
    } catch {
      return false;
    }
  }

  // Tasks
  public getTasks(): Task[] {
    return this.getItem(STORAGE_KEYS.TASKS, defaultTasks);
  }

  public saveTask(task: Task): void {
    const tasks = this.getTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.push(task);
    }
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  public deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  // Action completion for DuoDone Ping-Pong Task
  public completeTask(taskId: string, userId: string, photoUrl?: string | null, photoUrls?: string[]): { task: Task; log: ActivityLog } {
    const tasks = this.getTasks();
    const users = this.getUsers();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');

    const task = tasks[taskIndex];
    // Find the other partner to pass turn to
    const partner = users.find((u) => u.id !== userId) || users[0];

    const updatedTask: Task = {
      ...task,
      current_turn_user_id: partner.id,
      last_action_timestamp: new Date().toISOString(),
    };

    tasks[taskIndex] = updatedTask;
    this.setItem(STORAGE_KEYS.TASKS, tasks);

    const primaryPhoto = photoUrl || (photoUrls && photoUrls[0]) || null;
    const allPhotos = photoUrls || (photoUrl ? [photoUrl] : []);

    // Create log
    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: task.household_id,
      user_id: userId,
      entity_type: 'duodone_task',
      entity_id: task.id,
      entity_title: task.title,
      entity_icon: task.icon,
      xp_earned: task.xp_points,
      photo_url: primaryPhoto,
      photo_urls: allPhotos.length > 0 ? allPhotos : undefined,
      created_at: new Date().toISOString(),
    };

    const logs = this.getActivityLogs();
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);

    return { task: updatedTask, log };
  }

  // Counters
  public getCounters(): Counter[] {
    return this.getItem(STORAGE_KEYS.COUNTERS, defaultCounters);
  }

  public saveCounter(counter: Counter): void {
    const counters = this.getCounters();
    const idx = counters.findIndex((c) => c.id === counter.id);
    if (idx >= 0) {
      counters[idx] = counter;
    } else {
      counters.push(counter);
    }
    this.setItem(STORAGE_KEYS.COUNTERS, counters);
  }

  public deleteCounter(counterId: string): void {
    const counters = this.getCounters().filter((c) => c.id !== counterId);
    this.setItem(STORAGE_KEYS.COUNTERS, counters);
  }

  public incrementCounter(counterId: string, userId: string, photoUrl?: string | null, photoUrls?: string[]): { counter: Counter; log: ActivityLog } {
    const counters = this.getCounters();
    const index = counters.findIndex((c) => c.id === counterId);
    if (index === -1) throw new Error('Counter not found');

    const counter = counters[index];
    const updatedCounter: Counter = {
      ...counter,
      total_count: counter.total_count + (counter.step || 1),
    };

    counters[index] = updatedCounter;
    this.setItem(STORAGE_KEYS.COUNTERS, counters);

    const primaryPhoto = photoUrl || (photoUrls && photoUrls[0]) || null;
    const allPhotos = photoUrls || (photoUrl ? [photoUrl] : []);

    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: counter.household_id,
      user_id: userId,
      entity_type: 'counter',
      entity_id: counter.id,
      entity_title: counter.title,
      entity_icon: counter.icon,
      xp_earned: 0,
      photo_url: primaryPhoto,
      photo_urls: allPhotos.length > 0 ? allPhotos : undefined,
      created_at: new Date().toISOString(),
    };

    const logs = this.getActivityLogs();
    logs.unshift(log);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);

    return { counter: updatedCounter, log };
  }

  // Activity Logs
  public getActivityLogs(): ActivityLog[] {
    return this.getItem(STORAGE_KEYS.ACTIVITY_LOGS, defaultLogs);
  }

  // Roulette Items
  public getRouletteItems(): RouletteItem[] {
    return this.getItem(STORAGE_KEYS.ROULETTE_ITEMS, defaultRouletteItems);
  }

  public saveRouletteItem(item: RouletteItem): void {
    const items = this.getRouletteItems();
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      items[idx] = item;
    } else {
      items.push(item);
    }
    this.setItem(STORAGE_KEYS.ROULETTE_ITEMS, items);
  }

  public deleteRouletteItem(itemId: string): void {
    const items = this.getRouletteItems().filter((i) => i.id !== itemId);
    this.setItem(STORAGE_KEYS.ROULETTE_ITEMS, items);
  }

  // Reset current cycle: clears activity logs & zeros out counter totals for a new month
  public resetCycle(nextEndDateISO: string): void {
    this.updateHousehold({ period_end_date: nextEndDateISO });
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, []);

    // Reset counters to 0 for new cycle
    const counters = this.getCounters().map((c) => ({ ...c, total_count: 0 }));
    this.setItem(STORAGE_KEYS.COUNTERS, counters);
  }

  // Factory Reset: Wipes all data and resets completely back to initial template defaults
  public factoryReset(): void {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('duodone_welcome_dismissed');

    this.setItem(STORAGE_KEYS.USERS, defaultUsers);
    this.setItem(STORAGE_KEYS.HOUSEHOLD, defaultHousehold);
    this.setItem(STORAGE_KEYS.TASKS, defaultTasks);
    this.setItem(STORAGE_KEYS.COUNTERS, defaultCounters);
    this.setItem(STORAGE_KEYS.ROULETTE_ITEMS, defaultRouletteItems);
    this.setItem(STORAGE_KEYS.ACTIVITY_LOGS, defaultLogs);
    this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, defaultUsers[0].id);
  }
}

export const storage = new StorageService();
