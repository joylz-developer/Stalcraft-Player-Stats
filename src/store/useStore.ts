import { create } from 'zustand';
import { UserData, HighlightConfig, StatGroupConfig, ToastMessage } from '../types';
import { DEFAULT_UI_CONFIG, DEFAULT_STATS_CONFIG } from '../constants';

interface AppState {
  user: UserData | null;
  uiConfig: any;
  highlightsConfig: HighlightConfig[];
  statsConfig: StatGroupConfig[];
  myCharacters: any[];
  toasts: ToastMessage[];
  
  setUser: (user: UserData | null) => void;
  setUiConfig: (config: any) => void;
  setHighlightsConfig: (config: HighlightConfig[]) => void;
  setStatsConfig: (config: StatGroupConfig[]) => void;
  setMyCharacters: (chars: any[]) => void;
  
  addToast: (message: string, type?: 'success' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  uiConfig: DEFAULT_UI_CONFIG,
  highlightsConfig: [],
  statsConfig: DEFAULT_STATS_CONFIG,
  myCharacters: [],
  toasts: [],
  
  setUser: (user) => set({ user }),
  setUiConfig: (uiConfig) => set({ uiConfig }),
  setHighlightsConfig: (highlightsConfig) => set({ highlightsConfig }),
  setStatsConfig: (statsConfig) => set({ statsConfig }),
  setMyCharacters: (myCharacters) => set({ myCharacters }),
  
  addToast: (message, type = 'success') => set((state) => ({
    toasts: [...state.toasts, { id: Math.random().toString(36).substring(2, 9), message, type }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),
}));
