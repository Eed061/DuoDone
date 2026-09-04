import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Household, Task, Counter, ActivityLog, RouletteItem } from '../types';
import { storage } from '../services/storage';
import { triggerHaptic, triggerSuccessHaptic, initTelegramWebApp, getTelegramUser } from '../services/telegram';

interface AppContextType {
  users: User[];
  activeUser: User;
  partnerUser: User;
  household: Household;
  tasks: Task[];
  counters: Counter[];
  activityLogs: ActivityLog[];
  rouletteItems: RouletteItem[];
  userXpMap: Record<string, number>;
  switchActiveUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  updateHousehold: (updates: Partial<Household>) => void;
  completeTask: (taskId: string, photoUrl?: string | null) => Promise<void>;
  incrementCounter: (counterId: string, photoUrl?: string | null) => Promise<void>;
  saveTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  saveCounter: (counter: Counter) => void;
  deleteCounter: (counterId: string) => void;
  saveRouletteItem: (item: RouletteItem) => void;
  deleteRouletteItem: (itemId: string) => void;
  resetCycle: () => void;
  factoryReset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [household, setHousehold] = useState<Household>({} as Household);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [rouletteItems, setRouletteItems] = useState<RouletteItem[]>([]);

  const loadAllData = () => {
    let storedUsers = storage.getUsers();
    const telegramUser = getTelegramUser();

    // Check URL parameters and Telegram WebApp start_param
    const urlParams = new URLSearchParams(window.location.search);
    const inviteParam = urlParams.get('invite') || urlParams.get('start');
    const roleParam = urlParams.get('role');
    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param;
    const fullStart = inviteParam || tgStartParam || '';

    const isInvitedPartner = fullStart.includes('accept') || fullStart.includes('join') || roleParam === 'p2';

    if (telegramUser && storedUsers.length >= 2) {
      const currentTgId = telegramUser.id;
      const currentTgUsername = telegramUser.username ? telegramUser.username.replace('@', '').toLowerCase() : '';

      const u1TgId = storedUsers[0].telegram_id;
      const u1TgUsername = storedUsers[0].telegram_username ? String(storedUsers[0].telegram_username).replace('@', '').toLowerCase() : '';

      const u2TgId = storedUsers[1].telegram_id;
      const u2TgUsername = storedUsers[1].telegram_username ? String(storedUsers[1].telegram_username).replace('@', '').toLowerCase() : '';

      // Check Partner 2 match or Invite Link
      if (
        isInvitedPartner ||
        (u2TgId && String(u2TgId) === String(currentTgId)) ||
        (u2TgUsername && currentTgUsername && u2TgUsername === currentTgUsername)
      ) {
        storedUsers[1].telegram_id = currentTgId;
        if (telegramUser.username) storedUsers[1].telegram_username = telegramUser.username;
        storage.updateUser(storedUsers[1].id, storedUsers[1]);
        storage.setActiveUserId(storedUsers[1].id);
        localStorage.setItem('duodone_user_role', 'p2');
      }
      // Check Partner 1 match or Creator device
      else if (
        (u1TgId && String(u1TgId) === String(currentTgId)) ||
        (u1TgUsername && currentTgUsername && u1TgUsername === currentTgUsername) ||
        !isInvitedPartner
      ) {
        storedUsers[0].telegram_id = currentTgId;
        if (telegramUser.username) storedUsers[0].telegram_username = telegramUser.username;
        storage.updateUser(storedUsers[0].id, storedUsers[0]);
        storage.setActiveUserId(storedUsers[0].id);
        localStorage.setItem('duodone_user_role', 'p1');
      }
    } else if (isInvitedPartner && storedUsers[1]) {
      storage.setActiveUserId(storedUsers[1].id);
      localStorage.setItem('duodone_user_role', 'p2');
    }

    // Process custom user names from invite link if passed
    if (fullStart) {
      const u1Name = urlParams.get('u1');
      const u2Name = urlParams.get('u2');

      if (u1Name && storedUsers[0]) storedUsers[0].first_name = u1Name;
      if (u2Name && storedUsers[1]) storedUsers[1].first_name = u2Name;

      if (storedUsers[0]) storage.updateUser(storedUsers[0].id, storedUsers[0]);
      if (storedUsers[1]) storage.updateUser(storedUsers[1].id, storedUsers[1]);
    }

    // Honor explicitly saved user role on this device
    const savedRole = localStorage.getItem('duodone_user_role');
    if (savedRole === 'p2' && storedUsers[1]) {
      storage.setActiveUserId(storedUsers[1].id);
    } else if (savedRole === 'p1' && storedUsers[0]) {
      storage.setActiveUserId(storedUsers[0].id);
    }

    setUsers(storage.getUsers());
    setActiveUserId(storage.getActiveUserId());
    setHousehold(storage.getHousehold());
    setTasks(storage.getTasks());
    setCounters(storage.getCounters());
    setActivityLogs(storage.getActivityLogs());
    setRouletteItems(storage.getRouletteItems());
  };

  // Initialize storage & state
  useEffect(() => {
    initTelegramWebApp();
    storage.initStorage();
    loadAllData();
  }, []);

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || users[0] || ({ id: 'fallback', first_name: 'Користувач' } as User);
  }, [users, activeUserId]);

  const partnerUser = useMemo(() => {
    return users.find((u) => u.id !== activeUserId) || users[1] || ({ id: 'partner', first_name: 'Партнер' } as User);
  }, [users, activeUserId]);

  // Calculate XP per user for the current period
  const userXpMap = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      map[u.id] = 0;
    });

    activityLogs.forEach((log) => {
      if (map[log.user_id] !== undefined) {
        map[log.user_id] += log.xp_earned || 0;
      }
    });

    return map;
  }, [users, activityLogs]);

  const switchActiveUser = (userId: string) => {
    triggerHaptic('light');
    setActiveUserId(userId);
    storage.setActiveUserId(userId);
    const role = userId === users[1]?.id ? 'p2' : 'p1';
    localStorage.setItem('duodone_user_role', role);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    triggerHaptic('medium');
    const updatedUsers = storage.updateUser(userId, updates);
    setUsers([...updatedUsers]);
  };

  const handleUpdateHousehold = (updates: Partial<Household>) => {
    triggerHaptic('medium');
    const updated = storage.updateHousehold(updates);
    setHousehold(updated);
  };

  const handleCompleteTask = async (taskId: string, photoUrl?: string | null) => {
    triggerSuccessHaptic();
    const { task, log } = storage.completeTask(taskId, activeUser.id, photoUrl);

    setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
    setActivityLogs((prev) => [log, ...prev]);

    // Dispatch cat reaction event
    window.dispatchEvent(new CustomEvent('duodone_task_completed'));
  };

  const handleIncrementCounter = async (counterId: string, photoUrl?: string | null) => {
    triggerSuccessHaptic();
    const { counter, log } = storage.incrementCounter(counterId, activeUser.id, photoUrl);

    setCounters((prev) => prev.map((c) => (c.id === counterId ? counter : c)));
    setActivityLogs((prev) => [log, ...prev]);

    // Dispatch cat reaction event
    window.dispatchEvent(new CustomEvent('duodone_task_completed'));
  };

  const handleSaveTask = (task: Task) => {
    triggerHaptic('medium');
    storage.saveTask(task);
    setTasks(storage.getTasks());
  };

  const handleDeleteTask = (taskId: string) => {
    triggerHaptic('medium');
    storage.deleteTask(taskId);
    setTasks(storage.getTasks());
  };

  const handleSaveCounter = (counter: Counter) => {
    triggerHaptic('medium');
    storage.saveCounter(counter);
    setCounters(storage.getCounters());
  };

  const handleDeleteCounter = (counterId: string) => {
    triggerHaptic('medium');
    storage.deleteCounter(counterId);
    setCounters(storage.getCounters());
  };

  const handleSaveRouletteItem = (item: RouletteItem) => {
    triggerHaptic('medium');
    storage.saveRouletteItem(item);
    setRouletteItems(storage.getRouletteItems());
  };

  const handleDeleteRouletteItem = (itemId: string) => {
    triggerHaptic('medium');
    storage.deleteRouletteItem(itemId);
    setRouletteItems(storage.getRouletteItems());
  };

  const handleResetCycle = () => {
    triggerSuccessHaptic();
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1);
    storage.resetCycle(nextDate.toISOString());

    setHousehold(storage.getHousehold());
    setActivityLogs([]);
    setCounters(storage.getCounters());
  };

  const handleFactoryReset = () => {
    triggerSuccessHaptic();
    storage.factoryReset();
    localStorage.removeItem('duodone_user_role');
    loadAllData();
  };

  return (
    <AppContext.Provider
      value={{
        users,
        activeUser,
        partnerUser,
        household,
        tasks,
        counters,
        activityLogs,
        rouletteItems,
        userXpMap,
        switchActiveUser,
        updateUser: handleUpdateUser,
        updateHousehold: handleUpdateHousehold,
        completeTask: handleCompleteTask,
        incrementCounter: handleIncrementCounter,
        saveTask: handleSaveTask,
        deleteTask: handleDeleteTask,
        saveCounter: handleSaveCounter,
        deleteCounter: handleDeleteCounter,
        saveRouletteItem: handleSaveRouletteItem,
        deleteRouletteItem: handleDeleteRouletteItem,
        resetCycle: handleResetCycle,
        factoryReset: handleFactoryReset,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
