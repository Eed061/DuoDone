import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Household, Task, Counter, ActivityLog, RouletteItem } from '../types';
import { storage, defaultTasks, defaultCounters, defaultRouletteItems, defaultUsers } from '../services/storage';
import { cloudSync, CloudState } from '../services/firebaseSync';
import { triggerHaptic, triggerSuccessHaptic, initTelegramWebApp, getTelegramUser } from '../services/telegram';
import { Language, getTranslation } from '../i18n/translations';

interface AppContextType {
  users: User[];
  activeUser: User;
  partnerUser: User;
  household: Household;
  householdsList: Household[];
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
  switchHousehold: (householdId: string) => void;
  createNewHousehold: (name?: string) => Promise<Household>;
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
  joinHouseholdByCode: (code: string) => Promise<{ success: boolean; reason?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [activeUserId, setActiveUserId] = useState<string>('');
  const [household, setHousehold] = useState<Household>({} as Household);
  const [householdsList, setHouseholdsList] = useState<Household[]>([]);
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
    if (urlParams.get('reset') === 'true' || urlParams.get('clear') === 'true') {
      localStorage.clear();
      storage.initStorage();
    }

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
    const activeUId = storage.getActiveUserId();

    // If invited by code, check pair access control before loading
    if (extractedCode) {
      const access = await cloudSync.checkSpaceAccess(extractedCode, activeUId);
      if (access.allowed) {
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
    }

    if (telegramUser && storedUsers.length >= 1) {
      const currentTgId = telegramUser.id;
      const currentTgUsername = telegramUser.username ? telegramUser.username.replace('@', '').toLowerCase() : '';

      const u1TgId = storedUsers[0]?.telegram_id;
      const u1TgUsername = storedUsers[0]?.telegram_username ? String(storedUsers[0].telegram_username).replace('@', '').toLowerCase() : '';

      const u2TgId = storedUsers[1]?.telegram_id;
      const u2TgUsername = storedUsers[1]?.telegram_username ? String(storedUsers[1].telegram_username).replace('@', '').toLowerCase() : '';

      if (
        isInvitedPartner && storedUsers[1]
      ) {
        storedUsers[1] = {
          ...storedUsers[1],
          telegram_id: currentTgId,
          telegram_username: telegramUser.username || storedUsers[1].telegram_username,
          first_name: storedUsers[1].is_placeholder ? (telegramUser.first_name || 'Партнер 2') : storedUsers[1].first_name,
          is_placeholder: false,
        };
        storage.saveUsers(storedUsers);
        storage.setActiveUserId(storedUsers[1].id);
        localStorage.setItem('duodone_user_role', 'p2');
      } else if (
        (u2TgId && String(u2TgId) === String(currentTgId)) ||
        (u2TgUsername && currentTgUsername && u2TgUsername === currentTgUsername)
      ) {
        storedUsers[1].telegram_id = currentTgId;
        if (telegramUser.username) storedUsers[1].telegram_username = telegramUser.username;
        storage.saveUsers(storedUsers);
        storage.setActiveUserId(storedUsers[1].id);
        localStorage.setItem('duodone_user_role', 'p2');
      } else {
        storedUsers[0].telegram_id = currentTgId;
        if (telegramUser.username) storedUsers[0].telegram_username = telegramUser.username;
        if (!storedUsers[0].first_name || storedUsers[0].first_name === 'Партнер 1') {
          storedUsers[0].first_name = telegramUser.first_name || 'Партнер 1';
        }
        storage.saveUsers(storedUsers);
        storage.setActiveUserId(storedUsers[0].id);
        localStorage.setItem('duodone_user_role', 'p1');
      }
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
    const loadedHouseholdsList = storage.getHouseholdsList();

    setUsers(storedUsers);
    setActiveUserId(storage.getActiveUserId());
    setHousehold(storedHousehold);
    setHouseholdsList(loadedHouseholdsList);
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
            storage.saveHouseholdToList(cloudData.household);
            setHouseholdsList(storage.getHouseholdsList());
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

  // Switch Active Space / Household
  const handleSwitchHousehold = (householdId: string) => {
    triggerHaptic('medium');
    const list = storage.getHouseholdsList();
    const target = list.find((h) => h.id === householdId);
    if (target) {
      setHousehold(target);
      storage.saveHousehold(target);
      if (target.invite_code) {
        cloudSync.subscribeToHousehold(target.invite_code, (cloudData: CloudState) => {
          if (cloudData) {
            if (cloudData.household) {
              setHousehold(cloudData.household);
              storage.saveHousehold(cloudData.household);
              storage.saveHouseholdToList(cloudData.household);
              setHouseholdsList(storage.getHouseholdsList());
            }
            if (cloudData.users) setUsers(cloudData.users);
            if (cloudData.tasks) setTasks(cloudData.tasks);
            if (cloudData.counters) setCounters(cloudData.counters);
            if (cloudData.activityLogs) setActivityLogs(cloudData.activityLogs);
            if (cloudData.rouletteItems) setRouletteItems(cloudData.rouletteItems);
          }
        });
      }
    }
  };

  // Create New Space / Household
  const handleCreateNewHousehold = async (name?: string): Promise<Household> => {
    triggerSuccessHaptic();
    const newHh = storage.createNewHouseholdSpace(name, activeUser.id);

    // Fresh users state: Creator is User 1 (p1), Partner 2 is unjoined (waiting)
    const freshUsers: User[] = [
      {
        id: activeUser.id || 'user-he-101',
        first_name: activeUser.first_name || 'Партнер 1',
        telegram_id: activeUser.telegram_id,
        telegram_username: activeUser.telegram_username,
        avatar_url: activeUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry&backgroundColor=b6e3f4',
        created_at: activeUser.created_at || new Date().toISOString(),
      },
      {
        id: `usr-partner-2-${Date.now()}`,
        first_name: 'Партнер',
        avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena&backgroundColor=ffdfbf',
        created_at: new Date().toISOString(),
      },
    ];

    const freshTasks = defaultTasks.map((t) => ({
      ...t,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHh.id,
      current_turn_user_id: freshUsers[0].id,
    }));

    const freshCounters = defaultCounters.map((c) => ({
      ...c,
      id: `cnt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHh.id,
      created_by_user_id: freshUsers[0].id,
      total_count: 0,
    }));

    const freshRoulette = defaultRouletteItems.map((r) => ({
      ...r,
      id: `roul-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      household_id: newHh.id,
    }));

    const freshLogs: ActivityLog[] = [];

    storage.saveHousehold(newHh);
    storage.saveHouseholdToList(newHh);
    storage.saveUsers(freshUsers);
    storage.saveTasks(freshTasks);
    storage.saveCounters(freshCounters);
    storage.saveRouletteItems(freshRoulette);
    storage.saveActivityLogs(freshLogs);
    storage.setActiveUserId(freshUsers[0].id);

    const updatedList = storage.getHouseholdsList();
    setHouseholdsList(updatedList);
    setHousehold(newHh);
    setUsers(freshUsers);
    setActiveUserId(freshUsers[0].id);
    setTasks(freshTasks);
    setCounters(freshCounters);
    setRouletteItems(freshRoulette);
    setActivityLogs(freshLogs);

    pushStateToCloud(newHh, freshUsers, freshTasks, freshCounters, freshLogs, freshRoulette);

    if (newHh.invite_code) {
      cloudSync.subscribeToHousehold(newHh.invite_code, (cloudData: CloudState) => {
        if (cloudData && cloudData.household) {
          setHousehold(cloudData.household);
          storage.saveHousehold(cloudData.household);
          storage.saveHouseholdToList(cloudData.household);
          setHouseholdsList(storage.getHouseholdsList());
        }
      });
    }

    return newHh;
  };

  const handleFactoryReset = () => {
    triggerSuccessHaptic();
    localStorage.clear();
    storage.initStorage();
    const freshUsers = storage.getUsers();
    const freshHousehold = storage.getHousehold();
    const freshTasks = storage.getTasks();
    const freshCounters = storage.getCounters();
    const freshLogs = storage.getActivityLogs();
    const freshRoulette = storage.getRouletteItems();
    pushStateToCloud(freshHousehold, freshUsers, freshTasks, freshCounters, freshLogs, freshRoulette);
    window.location.reload();
  };

  const joinHouseholdByCode = async (code: string): Promise<{ success: boolean; reason?: string }> => {
    triggerHaptic('heavy');

    // Access control check for 3rd party
    const access = await cloudSync.checkSpaceAccess(code, activeUserId);
    if (!access.allowed) {
      return { success: false, reason: 'space_full' };
    }

    const cloudData = await cloudSync.fetchHouseholdByCode(code);

    if (cloudData && cloudData.household) {
      let updatedUsers = [...(cloudData.users || [])];
      const tgUser = getTelegramUser();
      const currentActiveId = activeUserId || `usr-p2-${Date.now()}`;

      if (updatedUsers.length < 2) {
        updatedUsers.push({
          id: currentActiveId,
          first_name: tgUser?.first_name || 'Партнер 2',
          telegram_id: tgUser?.id,
          telegram_username: tgUser?.username,
          is_placeholder: false,
          created_at: new Date().toISOString(),
        });
      } else {
        updatedUsers[1] = {
          ...updatedUsers[1],
          id: currentActiveId,
          first_name: tgUser?.first_name || (updatedUsers[1].is_placeholder ? 'Партнер 2' : updatedUsers[1].first_name),
          telegram_id: tgUser?.id || updatedUsers[1].telegram_id,
          telegram_username: tgUser?.username || updatedUsers[1].telegram_username,
          is_placeholder: false,
        };
      }

      const realUsersCount = updatedUsers.filter((u) => !u.is_placeholder).length;
      const updatedHousehold = {
        ...cloudData.household,
        is_locked: realUsersCount >= 2,
      };

      storage.saveHousehold(updatedHousehold);
      storage.saveHouseholdToList(updatedHousehold);
      storage.saveUsers(updatedUsers);
      if (cloudData.tasks) storage.saveTasks(cloudData.tasks);
      if (cloudData.counters) storage.saveCounters(cloudData.counters);
      if (cloudData.activityLogs) storage.saveActivityLogs(cloudData.activityLogs);
      if (cloudData.rouletteItems) storage.saveRouletteItems(cloudData.rouletteItems);

      storage.setActiveUserId(updatedUsers[1].id);
      setActiveUserId(updatedUsers[1].id);
      localStorage.setItem('duodone_user_role', 'p2');

      setHousehold(updatedHousehold);
      setHouseholdsList(storage.getHouseholdsList());
      setUsers(updatedUsers);
      if (cloudData.tasks) setTasks(cloudData.tasks);
      if (cloudData.counters) setCounters(cloudData.counters);
      if (cloudData.activityLogs) setActivityLogs(cloudData.activityLogs);
      if (cloudData.rouletteItems) setRouletteItems(cloudData.rouletteItems);

      pushStateToCloud(
        updatedHousehold,
        updatedUsers,
        cloudData.tasks || tasks,
        cloudData.counters || counters,
        cloudData.activityLogs || activityLogs,
        cloudData.rouletteItems || rouletteItems
      );

      cloudSync.subscribeToHousehold(updatedHousehold.invite_code, (newCloudData: CloudState) => {
        if (newCloudData) {
          if (newCloudData.household) {
            setHousehold(newCloudData.household);
            storage.saveHousehold(newCloudData.household);
            storage.saveHouseholdToList(newCloudData.household);
            setHouseholdsList(storage.getHouseholdsList());
          }
          if (newCloudData.users) setUsers(newCloudData.users);
          if (newCloudData.tasks) setTasks(newCloudData.tasks);
          if (newCloudData.counters) setCounters(newCloudData.counters);
          if (newCloudData.activityLogs) setActivityLogs(newCloudData.activityLogs);
          if (newCloudData.rouletteItems) setRouletteItems(newCloudData.rouletteItems);
        }
      });

      return { success: true };
    }

    return { success: false, reason: 'not_found' };
  };

  return (
    <AppContext.Provider
      value={{
        users,
        activeUser,
        partnerUser,
        household,
        householdsList,
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
        switchHousehold: handleSwitchHousehold,
        createNewHousehold: handleCreateNewHousehold,
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
