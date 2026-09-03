import { Household, Task, Counter, ActivityLog, RouletteItem, User } from '../types';

const STORAGE_KEYS = {
  USERS: 'duodone_users',
  HOUSEHOLD: 'duodone_household',
  TASKS: 'duodone_tasks',
  COUNTERS: 'duodone_counters',
  ACTIVITY_LOGS: 'duodone_activity_logs',
  ROULETTE_ITEMS: 'duodone_roulette_items',
  ACTIVE_USER_ID: 'duodone_active_user_id',
};

// Seed default users
const defaultUsers: User[] = [
  {
    id: 'user-he-101',
    first_name: 'Дмитро',
    role_title: 'Він',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry&backgroundColor=b6e3f4',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-she-102',
    first_name: 'Олена',
    role_title: 'Вона',
    avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=ffdfbf',
    created_at: new Date().toISOString(),
  },
];

// Seed default household space
const defaultHousehold: Household = {
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
const defaultTasks: Task[] = [
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
const defaultCounters: Counter[] = [
  {
    id: 'counter-windows-1',
    household_id: 'hh-main-001',
    created_by_user_id: 'user-he-101',
    title: 'Миття вікон',
    icon: '🪟',
    photo_mode: 'required',
    step: 1,
    total_count: 2,
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
    total_count: 14,
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
    total_count: 9,
    show_on_dashboard: true,
    created_at: new Date().toISOString(),
  },
];

// Seed default roulette sectors (Section 6 of ТЗ)
const defaultRouletteItems: RouletteItem[] = [
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

// Initial activity logs
const defaultLogs: ActivityLog[] = [
  {
    id: 'log-1',
    household_id: 'hh-main-001',
    user_id: 'user-he-101',
    entity_type: 'duodone_task',
    entity_id: 'task-dishes-1',
    entity_title: 'Миття посуду',
    entity_icon: '🧽',
    xp_earned: 2,
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log-2',
    household_id: 'hh-main-001',
    user_id: 'user-she-102',
    entity_type: 'duodone_task',
    entity_id: 'task-trash-2',
    entity_title: 'Виніс сміття',
    entity_icon: '🗑️',
    xp_earned: 1,
    created_at: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
  {
    id: 'log-3',
    household_id: 'hh-main-001',
    user_id: 'user-he-101',
    entity_type: 'counter',
    entity_id: 'counter-vacuum-2',
    entity_title: 'Пилососіння',
    entity_icon: '🧹',
    xp_earned: 0,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'log-4',
    household_id: 'hh-main-001',
    user_id: 'user-she-102',
    entity_type: 'counter',
    entity_id: 'counter-flowers-3',
    entity_title: 'Полив квітів',
    entity_icon: '🪴',
    xp_earned: 0,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

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
      this.setItem(STORAGE_KEYS.USERS, defaultUsers);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOUSEHOLD)) {
      this.setItem(STORAGE_KEYS.HOUSEHOLD, defaultHousehold);
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
      this.setItem(STORAGE_KEYS.ACTIVE_USER_ID, defaultUsers[0].id);
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

  public updateHousehold(updates: Partial<Household>): Household {
    const current = this.getHousehold();
    const updated = { ...current, ...updates };
    this.setItem(STORAGE_KEYS.HOUSEHOLD, updated);
    return updated;
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
  public completeTask(taskId: string, userId: string, photoUrl?: string | null): { task: Task; log: ActivityLog } {
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
      photo_url: photoUrl || null,
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

  public incrementCounter(counterId: string, userId: string, photoUrl?: string | null): { counter: Counter; log: ActivityLog } {
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

    const log: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: counter.household_id,
      user_id: userId,
      entity_type: 'counter',
      entity_id: counter.id,
      entity_title: counter.title,
      entity_icon: counter.icon,
      xp_earned: 0,
      photo_url: photoUrl || null,
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

  // Reset current cycle / clear XP for new month
  public resetCycle(nextEndDateISO: string): void {
    this.updateHousehold({ period_end_date: nextEndDateISO });
  }
}

export const storage = new StorageService();
