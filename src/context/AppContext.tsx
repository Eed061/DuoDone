import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Household, Task, Counter, ActivityLog, RouletteItem } from '../types';
import { storage } from '../services/storage';
import { cloudSync, CloudState } from '../services/firebaseSync';
import { triggerHaptic, triggerSuccessHaptic, initTelegramWebApp, getTelegramUser } from '../services/telegram';
import { Language, getTranslation } from '../i18n/translations';

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
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
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
  joinHouseholdByCode: (code: string) => Promise<boolean>;
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
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('duodone_language') as Language) || 'uk';
  });

  const handleSetLanguage = (lang: Language) => {
    triggerHaptic('medium');
    setLanguageState(lang);
    localStorage.setItem('duodone_language', lang);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  // Helper to push full state to cloud
  const pushStateToCloud = (
    currentHousehold: Household,
    currentUsers: User[],
    currentTasks: Task[],
    currentCounters: Counter[],
    currentLogs: ActivityLog[],
    currentRoulette: RouletteItem[]
  ) => {
    if (currentHousehold && currentHousehold.invite_code) {
      cloudSync.pushState({
        household: currentHousehold,
        users: currentUsers,
        tasks: currentTasks,
        counters: currentCounters,
        activityLogs: currentLogs,
        rouletteItems: currentRoulette,
      });
    }
  };

  const loadAllData = async () => {
    let storedUsers = storage.getUsers();
    let storedHousehold = storage.getHousehold();
    const telegramUser = getTelegramUser();

    // Check URL parameters and Telegram WebApp start_param
    const urlParams = new URLSearchParams(window.location.search);
    const rawInviteParam = urlParams.get('invite') || urlParams.get('start') || '';
    const roleParam = urlParams.get('role');
    const tgStartParam = (window as any).Telegram?.WebApp?.initDataUnsafe?.start_param || '';
    const fullStart = rawInviteParam || tgStartParam || '';

    // Extract invite code if passed (e.g., DUO-7789 or accept_DUO-7789)
    let extractedCode = '';
    if (fullStart) {
      const match = fullStart.match(/([A-Z0-9]{3,4}-?[A-Z0-9]{3,4})/i);
      if (match) extractedCode = match[1];
      else if (fullStart.includes('_')) extractedCode = fullStart.split('_')[1];
      else extractedCode = fullStart;
    }

    const isInvitedPartner = fullStart.includes('accept') || fullStart.includes('join') || roleParam === 'p2' || Boolean(extractedCode);

    // If invited by code, attempt to fetch existing household from cloud
    if (extractedCode) {
      const cloudData = await cloudSync.fetchHouseholdByCode(extractedCode);
      if (cloudData && cloudData.household) {
        storedHousehold = cloudData.household;
        storedUsers = cloudData.users || storedUsers;
        storage.saveHousehold(storedHousehold);
        storage.saveUsers(storedUsers);
        if (cloudData.tasks) storage.saveTasks(cloudData.tasks);
        if (cloudData.counters) storage.saveCounters(cloudData.counters);
        if (cloudData.activityLogs) storage.saveActivityLogs(cloudData.activityLogs);
        if (cloudData.rouletteItems) storage.saveRouletteItems(cloudData.rouletteItems);
      }
    }

    if (telegramUser && storedUsers.length >= 2) {
      const currentTgId = telegramUser.id;
      const currentTgUsername = telegramUser.username ? telegramUser.username.replace('@', '').toLowerCase() : '';

      const u1TgId = storedUsers[0].telegram_id;
      const u1TgUsername = storedUsers[0].telegram_username ? String(storedUsers[0].telegram_username).replace('@', '').toLowerCase() : '';

      const u2TgId = storedUsers[1].telegram_id;
      const u2TgUsername = storedUsers[1].telegram_username ? String(storedUsers[1].telegram_username).replace('@', '').toLowerCase() : '';

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
      } else if (
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

    const savedRole = localStorage.getItem('duodone_user_role');
    if (savedRole === 'p2' && storedUsers[1]) {
      storage.setActiveUserId(storedUsers[1].id);
    } else if (savedRole === 'p1' && storedUsers[0]) {
      storage.setActiveUserId(storedUsers[0].id);
    }

    const loadedTasks = storage.getTasks();
    const loadedCounters = storage.getCounters();
    const loadedLogs = storage.getActivityLogs();
    const loadedRoulette = storage.getRouletteItems();

    setUsers(storedUsers);
    setActiveUserId(storage.getActiveUserId());
    setHousehold(storedHousehold);
    setTasks(loadedTasks);
    setCounters(loadedCounters);
    setActivityLogs(loadedLogs);
    setRouletteItems(loadedRoulette);

    // Initial push to cloud to seed if new
    pushStateToCloud(storedHousehold, storedUsers, loadedTasks, loadedCounters, loadedLogs, loadedRoulette);

    // Subscribe to cloud real-time updates for this household code
    if (storedHousehold.invite_code) {
      cloudSync.subscribeToHousehold(storedHousehold.invite_code, (cloudData: CloudState) => {
        if (cloudData) {
          if (cloudData.household) {
            setHousehold(cloudData.household);
            storage.saveHousehold(cloudData.household);
          }
          if (cloudData.users) {
            setUsers(cloudData.users);
            storage.saveUsers(cloudData.users);
          }
          if (cloudData.tasks) {
            setTasks(cloudData.tasks);
            storage.saveTasks(cloudData.tasks);
          }
          if (cloudData.counters) {
            setCounters(cloudData.counters);
            storage.saveCounters(cloudData.counters);
          }
          if (cloudData.activityLogs) {
            setActivityLogs(cloudData.activityLogs);
            storage.saveActivityLogs(cloudData.activityLogs);
          }
          if (cloudData.rouletteItems) {
            setRouletteItems(cloudData.rouletteItems);
            storage.saveRouletteItems(cloudData.rouletteItems);
          }
        }
      });
    }
  };

  // Initialize storage & state
  useEffect(() => {
    initTelegramWebApp();
    storage.initStorage();
    loadAllData();

    return () => {
      cloudSync.unsubscribe();
    };
  }, []);

  const activeUser = useMemo(() => {
    return users.find((u) => u.id === activeUserId) || users[0] || ({ id: 'fallback', first_name: 'Користувач' } as User);
  }, [users, activeUserId]);

  const partnerUser = useMemo(() => {
    return users.find((u) => u.id !== activeUserId) || users[1] || ({ id: 'partner', first_name: 'Партнер' } as User);
  }, [users, activeUserId]);

  // Calculate XP per user
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
    pushStateToCloud(household, updatedUsers, tasks, counters, activityLogs, rouletteItems);
  };

  const handleUpdateHousehold = (updates: Partial<Household>) => {
    triggerHaptic('medium');
    const updated = storage.updateHousehold(updates);
    setHousehold(updated);
    pushStateToCloud(updated, users, tasks, counters, activityLogs, rouletteItems);
  };

  const handleCompleteTask = async (taskId: string, photoUrl?: string | null) => {
    triggerSuccessHaptic();
    const { task, log } = storage.completeTask(taskId, activeUser.id, photoUrl);

    const updatedTasks = tasks.map((t) => (t.id === taskId ? task : t));
    const updatedLogs = [log, ...activityLogs];

    setTasks(updatedTasks);
    setActivityLogs(updatedLogs);

    pushStateToCloud(household, users, updatedTasks, counters, updatedLogs, rouletteItems);
    window.dispatchEvent(new CustomEvent('duodone_task_completed'));
  };

  const handleIncrementCounter = async (counterId: string, photoUrl?: string | null) => {
    triggerSuccessHaptic();
    const { counter, log } = storage.incrementCounter(counterId, activeUser.id, photoUrl);

    const updatedCounters = counters.map((c) => (c.id === counterId ? counter : c));
    const updatedLogs = [log, ...activityLogs];

    setCounters(updatedCounters);
    setActivityLogs(updatedLogs);

    pushStateToCloud(household, users, tasks, updatedCounters, updatedLogs, rouletteItems);
    window.dispatchEvent(new CustomEvent('duodone_task_completed'));
  };

  const handleSaveTask = (task: Task) => {
    triggerHaptic('medium');
    storage.saveTask(task);
    const updatedTasks = storage.getTasks();
    setTasks(updatedTasks);
    pushStateToCloud(household, users, updatedTasks, counters, activityLogs, rouletteItems);
  };

  const handleDeleteTask = (taskId: string) => {
    triggerHaptic('medium');
    storage.deleteTask(taskId);
    const updatedTasks = storage.getTasks();
    setTasks(updatedTasks);
    pushStateToCloud(household, users, updatedTasks, counters, activityLogs, rouletteItems);
  };

  const handleSaveCounter = (counter: Counter) => {
    triggerHaptic('medium');
    storage.saveCounter(counter);
    const updatedCounters = storage.getCounters();
    setCounters(updatedCounters);
    pushStateToCloud(household, users, tasks, updatedCounters, activityLogs, rouletteItems);
  };

  const handleDeleteCounter = (counterId: string) => {
    triggerHaptic('medium');
    storage.deleteCounter(counterId);
    const updatedCounters = storage.getCounters();
    setCounters(updatedCounters);
    pushStateToCloud(household, users, tasks, updatedCounters, activityLogs, rouletteItems);
  };

  const handleSaveRouletteItem = (item: RouletteItem) => {
    triggerHaptic('medium');
    storage.saveRouletteItem(item);
    const updatedRoulette = storage.getRouletteItems();
    setRouletteItems(updatedRoulette);
    pushStateToCloud(household, users, tasks, counters, activityLogs, updatedRoulette);
  };

  const handleDeleteRouletteItem = (itemId: string) => {
    triggerHaptic('medium');
    storage.deleteRouletteItem(itemId);
    const updatedRoulette = storage.getRouletteItems();
    setRouletteItems(updatedRoulette);
    pushStateToCloud(household, users, tasks, counters, activityLogs, updatedRoulette);
  };

  const handleResetCycle = () => {
    triggerSuccessHaptic();
    const days = household.cycle_days || (household.cycle_type === 'weekly' ? 7 : 30);
    const nextDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    storage.resetCycle(nextDate.toISOString());

    const updatedHousehold = storage.getHousehold();
    const updatedCounters = storage.getCounters();

    setHousehold(updatedHousehold);
    setActivityLogs([]);
    setCounters(updatedCounters);

    pushStateToCloud(updatedHousehold, users, tasks, updatedCounters, [], rouletteItems);
  };

  const handleFactoryReset = () => {
    triggerSuccessHaptic();
    storage.factoryReset();
    localStorage.removeItem('duodone_user_role');
    loadAllData();
  };

  const joinHouseholdByCode = async (code: string): Promise<boolean> => {
    triggerHaptic('heavy');
    const cloudData = await cloudSync.fetchHouseholdByCode(code);

    if (cloudData && cloudData.household) {
      storage.saveHousehold(cloudData.household);
      if (cloudData.users) storage.saveUsers(cloudData.users);
      if (cloudData.tasks) storage.saveTasks(cloudData.tasks);
      if (cloudData.counters) storage.saveCounters(cloudData.counters);
      if (cloudData.activityLogs) storage.saveActivityLogs(cloudData.activityLogs);
      if (cloudData.rouletteItems) storage.saveRouletteItems(cloudData.rouletteItems);

      // Set partner 2 role for joining user
      if (cloudData.users && cloudData.users[1]) {
        storage.setActiveUserId(cloudData.users[1].id);
        localStorage.setItem('duodone_user_role', 'p2');
      }

      setHousehold(cloudData.household);
      setUsers(cloudData.users || []);
      setTasks(cloudData.tasks || []);
      setCounters(cloudData.counters || []);
      setActivityLogs(cloudData.activityLogs || []);
      setRouletteItems(cloudData.rouletteItems || []);

      cloudSync.subscribeToHousehold(cloudData.household.invite_code, (newCloudData: CloudState) => {
        if (newCloudData) {
          if (newCloudData.household) setHousehold(newCloudData.household);
          if (newCloudData.users) setUsers(newCloudData.users);
          if (newCloudData.tasks) setTasks(newCloudData.tasks);
          if (newCloudData.counters) setCounters(newCloudData.counters);
          if (newCloudData.activityLogs) setActivityLogs(newCloudData.activityLogs);
          if (newCloudData.rouletteItems) setRouletteItems(newCloudData.rouletteItems);
        }
      });

      return true;
    }

    return false;
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
        language,
        setLanguage: handleSetLanguage,
        t,
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
        joinHouseholdByCode,
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
