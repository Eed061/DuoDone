export type DuoDoneMode = 'symmetric' | 'balancer';
export type PeriodType = 'weekly' | 'monthly';
export type RewardType = 'fixed' | 'roulette';
export type PhotoMode = 'none' | 'optional' | 'required';
export type EntityType = 'duodone_task' | 'counter';
export type RouletteType = 'reward' | 'penalty';

export interface User {
  id: string;
  telegram_id?: number | null;
  first_name: string;
  avatar_url?: string;
  role_title?: string; // e.g. "Він", "Вона", "Партнер 1"
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  duodone_mode: DuoDoneMode;
  period_type: PeriodType;
  period_end_date: string;
  reward_type: RewardType;
  fixed_reward_text?: string | null;
  created_at: string;
  // Dashboard Config
  show_balancer_widget: boolean;
  pinned_task_ids?: string[];
  pinned_counter_ids?: string[];
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  icon: string;
  xp_points: number; // 1 to 5
  photo_required: boolean;
  current_turn_user_id: string; // user id whose turn it is in symmetric mode
  last_action_timestamp?: string; // timestamp when last completed
  is_active: boolean;
  show_on_dashboard: boolean;
  created_at: string;
}

export interface Counter {
  id: string;
  household_id: string;
  created_by_user_id: string;
  title: string;
  icon: string;
  photo_mode: PhotoMode;
  step: number; // default 1
  total_count: number; // aggregate count
  show_on_dashboard: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  household_id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_title?: string;
  entity_icon?: string;
  xp_earned: number;
  photo_url?: string | null;
  created_at: string; // ISO string
}

export interface RouletteItem {
  id: string;
  household_id: string;
  type: RouletteType;
  text: string;
  is_default: boolean;
}
