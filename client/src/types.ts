export type Role = 'p1' | 'p2';
export type Lang = 'uk' | 'en';
export type PhotoMode = 'none' | 'optional' | 'required';

export interface User {
  id: string;
  firstName: string | null;
  tgUsername: string | null;
  isTelegram: boolean;
  lang: Lang;
  quickstartDismissed: boolean;
  recoveryKey: string;
}

export interface SpaceSummary {
  id: string;
  name: string;
  role: Role;
  p1Name: string;
  p2Name: string;
  p1Avatar: string;
  p2Avatar: string;
  hasPartner: boolean;
}

export interface Partner {
  name: string;
  avatar: string;
  linked: boolean;
}

export interface Space {
  id: string;
  name: string;
  inviteCode: string;
  mode: 'symmetric' | 'balancer';
  showBalancer: boolean;
  cyclePeriod: 'weekly' | 'monthly' | 'custom' | 'off';
  cycleDays: number;
  rewardType: 'roulette' | 'text';
  rewardText: string;
  catEnabled: boolean;
  catName: string;
  p1: Partner;
  p2: Partner;
}

export interface Task {
  id: string;
  emoji: string;
  title: string;
  xp: number;
  photoRequired: boolean;
  turnRole: Role;
  lastDoneAt: number | null;
  lastDoneBy: Role | null;
  active: boolean;
  showOnDashboard: boolean;
  sort: number;
}

export interface Counter {
  id: string;
  emoji: string;
  title: string;
  step: number;
  xp: number;
  photoMode: PhotoMode;
  active: boolean;
  showOnDashboard: boolean;
  sort: number;
  cycleTotal: number;
}

export interface LogEntry {
  id: string;
  kind: 'task' | 'counter';
  itemId: string;
  title: string;
  emoji: string;
  role: Role;
  xp: number;
  amount: number;
  photos: string[];
  outOfTurn: boolean;
  createdAt: number;
}

export interface RouletteItem {
  id: string;
  pool: 'reward' | 'penalty';
  text: string;
}

export interface CycleHistory {
  id: string;
  startedAt: number;
  endedAt: number;
  p1Xp: number;
  p2Xp: number;
}

export interface SpaceState {
  space: Space;
  myRole: Role;
  actingRole: Role;
  canSwitchRole: boolean;
  cycle: { startedAt: number; endsAt: number | null; expired: boolean };
  xp: { p1: number; p2: number };
  tasks: Task[];
  counters: Counter[];
  logs: LogEntry[];
  roulette: RouletteItem[];
  history: CycleHistory[];
  serverTime: number;
}

export interface PublicConfig {
  botUsername: string;
  appShortName: string;
  publicUrl: string;
  telegramAuth: boolean;
  wsEnabled?: boolean;
}
