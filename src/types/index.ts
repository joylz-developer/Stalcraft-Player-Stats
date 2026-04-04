export type Region = 'eu' | 'ru' | 'na' | 'sea';

export interface StatItem {
  id: string;
  type: 'INTEGER' | 'DECIMAL' | 'DURATION' | 'DATE';
  value: any;
}

export interface ProfileData {
  username: string;
  uuid: string;
  status: string;
  alliance: string;
  lastLogin: string;
  displayedAchievements: string[];
  stats: StatItem[];
}

export interface UserData {
  id: string;
  username: string;
  role: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

export interface HighlightConfig {
  id?: number | string;
  title: string;
  formula: string;
  color: string;
  format: 'number' | 'percent' | 'ratio' | 'duration' | 'duration_hours';
  roundToK?: boolean;
}
