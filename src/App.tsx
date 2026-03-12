import React, { useState, useEffect, Component, ErrorInfo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, User, Shield, Crosshair, Activity, AlertCircle, MapPin, Loader2, 
  Target, Skull, Coins, Map, Swords, Home, Trophy, Percent, Clock, Calendar,
  Settings, LogOut, Plus, Trash2, Save, ChevronUp, ChevronDown, GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const savedToken = localStorage.getItem('session_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ICON_MAP: Record<string, any> = {
  Activity, Crosshair, Target, Skull, Coins, AlertCircle, Map, Swords, Home, MapPin,
  Search, User, Shield, Loader2, Trophy, Percent, Clock, Calendar, Settings, LogOut, Plus, Trash2, Save
};

type Region = 'eu' | 'ru' | 'na' | 'sea';

interface StatItem {
  id: string;
  type: 'INTEGER' | 'DECIMAL' | 'DURATION' | 'DATE';
  value: any;
}

interface ProfileData {
  username: string;
  uuid: string;
  status: string;
  alliance: string;
  lastLogin: string;
  displayedAchievements: string[];
  stats: StatItem[];
}

interface UserData {
  id: string;
  username: string;
  role: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  props!: { children: React.ReactNode };
  state = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-8 max-w-lg w-full text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
            <p className="text-zinc-400">
              Произошла непредвиденная ошибка в работе приложения. Пожалуйста, перезагрузите страницу или обратитесь в поддержку.
            </p>
            {this.state.error && (
              <div className="bg-zinc-950 p-4 rounded-lg text-left overflow-auto text-xs font-mono text-red-400 border border-red-500/20">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface HighlightConfig {
  id?: number;
  title: string;
  formula: string;
  color: string;
  format: 'number' | 'percent' | 'ratio' | 'duration' | 'duration_hours';
}

export interface StatItemConfig {
  id: string;
  title: string;
  formula: string;
  format: 'auto' | 'number' | 'percent' | 'ratio' | 'duration' | 'duration_hours' | 'date' | 'distance';
  isHidden: boolean;
}

export interface StatGroupConfig {
  id: string;
  title: string;
  icon: string;
  items: StatItemConfig[];
}

const ALLIANCE_MAP: Record<string, { name: string, color: string, bg: string }> = {
  'stalker': { name: 'Сталкеры', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'bandit': { name: 'Бандиты', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  'duty': { name: 'Долг', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  'freedom': { name: 'Свобода', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  'merc': { name: 'Наемники', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  'covenant': { name: 'Завет', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
};

const STAT_NAMES: Record<string, string> = {
  "kil": "Убийств игроков",
  "dea": "Всего смертей",
  "ast": "Помощи в убийстве",
  "npc-kil": "Убито NPC",
  "mut-kil": "Убито мутантов",
  "kni-kil": "Убийств ножом",
  "exp-kil": "Убийств взрывом",
  "max-kil-ser": "Максимальная серия убийств",
  "suicides": "Самоубийств",
  "sho-fir": "Сделано выстрелов",
  "sho-hit": "Попаданий",
  "sho-hea": "Попаданий в голову",
  "sho-bod": "Попаданий в тело",
  "sho-lim": "Попаданий по конечностям",
  "dam-dea-all": "Нанесено урона (всего)",
  "dam-dea-pla": "Нанесено урона (игрокам)",
  "dam-rec-all": "Получено урона (всего)",
  "dam-rec-pla": "Получено урона (от игроков)",
  "dam-exp": "Урон от взрывов",
  "mut-dog-kil": "Убито слепых псов",
  "mut-pse-kil": "Убито псевдособак",
  "mut-boar-kil": "Убито кабанов",
  "mut-flsh-kil": "Убито плотей",
  "mut-krv-kil": "Убито кровососов",
  "mut-gig-kil": "Убито псевдогигантов",
  "mut-chi-kill": "Убито химер",
  "mut-psi-kil": "Убито пси-собак",
  "mut-tush-kil": "Убито тушканов",
  "mut-elp-kil": "Убито снорков",
  "dis-on-foo": "Пройдено пешком",
  "dis-sne": "Пройдено крадучись",
  "dis-cra": "Пройдено в присяде",
  "dis-air": "В полете/падении",
  "art-col": "Собрано артефактов",
  "sgn-fnd": "Найдено сигналов",
  "que-fin": "Выполнено квестов",
  "ach-gai": "Получено достижений",
  "ach-points": "Очки достижений",
  "med-sup-use": "Использовано медицины",
  "foo-eat": "Съедено еды",
  "gre-thr": "Брошено гранат",
  "scr-thr": "Брошено болтов",
  "scn-cnt": "Использовано сканеров",
  "wea-fix": "Починок оружия",
  "arm-fix": "Починок брони",
  "equ-upg": "Попыток заточки",
  "suc-equ-upg": "Успешных заточек",
  "tra": "Совершено обменов",
  "ite-bou-tra": "Куплено предметов",
  "ite-sol-tra": "Продано предметов",
  "mon-gai-tra": "Заработано на торговле",
  "mon-gai-que": "Заработано на квестах",
  "max-mon-amo": "Максимум денег на счету",
  "tpacks-delivered": "Доставлено рюкзаков",
  "tpacks-money": "Заработано на рюкзаках",
  "tpacks-distance": "Дистанция доставки рюкзаков",
  "tpacks-inter": "Перехвачено рюкзаков",
  "hid-plc": "Найдено тайников",
  "air-drops-hckd": "Взломано аирдропов",
  "mining-count": "Добыто ресурсов (установки)",
  "deaths-bf": "Смертей (Сессионки)",
  "kills-bf": "Убийств (Сессионки)",
  "part-bf": "Сыграно (Сессионки)",
  "won-bf": "Выиграно (Сессионки)",
  "lost-bf": "Проиграно (Сессионки)",
  "fights-part": "Сыграно дуэлей",
  "won-fights-personal": "Выиграно дуэлей",
  "won-fights-equal": "Выиграно равных дуэлей",
  "bul-dea": "Смертей от пуль",
  "ble-to-dea": "Смертей от кровотечения",
  "rad-dea": "Смертей от радиации",
  "col-dea": "Смертей от холода",
  "fal-dea": "Смертей от падения",
  "ano-dea": "Смертей от аномалий",
  "ste-ano-dea": "Смертей от 'Жарки'",
  "ele-ano-dea": "Смертей от 'Электры'",
  "fun-ano-dea": "Смертей от 'Воронки'",
  "cir-ano-dea": "Смертей от 'Карусели'",
  "tra-ano-dea": "Смертей от 'Трамплина'",
  "lig-ano-dea": "Смертей от 'Зажигалки'",
  "pla-tim": "Время в игре",
  "par-tim": "Время в отряде",
  "reg-tim": "Дата регистрации",
  "hid-ktch-crft": "Скрафчено на кухне",
  "hid-wrk-crft": "Скрафчено на верстаке",
  "hid-lab-crft": "Скрафчено в медблоке",
  "hid-mat-mon": "Потрачено деталей",
  "hid-enrg": "Потрачено энергии",
  "incident-part": "Участий в событиях",
  "incident-win": "Побед в событиях",
  "completed-ops": "Завершено операций",
  "kills-ops": "Убийств в операциях",
  "cha-mes-sen": "Сообщений в чат"
};

export const DEFAULT_STATS_CONFIG: StatGroupConfig[] = [
  { id: 'g_1', title: 'Общая статистика', icon: 'Activity', items: ['pla-tim', 'reg-tim', 'ach-points', 'ach-gai', 'que-fin', 'sgn-fnd', 'art-col', 'cha-mes-sen'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_2', title: 'Боевая эффективность (PvP)', icon: 'Crosshair', items: ['kil', 'dea', 'ast', 'max-kil-ser', 'kni-kil', 'exp-kil', 'dam-dea-pla', 'dam-rec-pla'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_3', title: 'Оружие и Точность', icon: 'Target', items: ['sho-fir', 'sho-hit', 'sho-hea', 'sho-bod', 'sho-lim', 'gre-thr', 'scr-thr', 'wea-fix', 'arm-fix'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_4', title: 'Охота на мутантов', icon: 'Skull', items: ['mut-kil', 'mut-boar-kil', 'mut-flsh-kil', 'mut-dog-kil', 'mut-pse-kil', 'mut-tush-kil', 'mut-krv-kil', 'mut-psi-kil', 'mut-chi-kill', 'mut-gig-kil', 'mut-elp-kil'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_5', title: 'Экономика и Торговля', icon: 'Coins', items: ['max-mon-amo', 'tra', 'ite-bou-tra', 'ite-sol-tra', 'mon-gai-tra', 'mon-gai-que', 'equ-upg', 'suc-equ-upg'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_6', title: 'Выживание и Смерти', icon: 'AlertCircle', items: ['suicides', 'ano-dea', 'bul-dea', 'ble-to-dea', 'rad-dea', 'fal-dea', 'col-dea', 'ste-ano-dea', 'ele-ano-dea', 'fun-ano-dea', 'cir-ano-dea', 'tra-ano-dea', 'lig-ano-dea'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_7', title: 'Активности', icon: 'Map', items: ['tpacks-delivered', 'tpacks-money', 'tpacks-distance', 'tpacks-inter', 'air-drops-hckd', 'hid-plc', 'mining-count', 'incident-part', 'incident-win', 'completed-ops', 'kills-ops'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_8', title: 'Сессионные бои и Дуэли', icon: 'Swords', items: ['part-bf', 'won-bf', 'lost-bf', 'kills-bf', 'deaths-bf', 'fights-part', 'won-fights-personal', 'won-fights-equal'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_9', title: 'Убежище', icon: 'Home', items: ['hid-ktch-crft', 'hid-wrk-crft', 'hid-lab-crft', 'hid-mat-mon', 'hid-enrg'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) },
  { id: 'g_10', title: 'Перемещение', icon: 'MapPin', items: ['dis-on-foo', 'dis-sne', 'dis-cra', 'dis-air'].map(k => ({ id: k, title: STAT_NAMES[k] || k, formula: `{${k}}`, format: 'auto', isHidden: false })) }
];

const formatStatValue = (id: string, type: string, value: any) => {
  if (type === 'DURATION') {
    const hours = Math.floor(value / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days} д. ${remHours} ч.`;
  }
  if (type === 'DATE') {
    return new Date(value).toLocaleDateString('ru-RU');
  }
  if (type === 'DECIMAL') {
    if (id.startsWith('dis-') || id.startsWith('tpacks-distance')) {
      return (value / 100000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' км';
    }
    return Number(value).toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  }
  if (type === 'INTEGER') {
    return Number(value).toLocaleString('ru-RU');
  }
  return String(value);
};

const evaluateFormula = (formula: string, stats: StatItem[]) => {
  let parsedFormula = formula;
  const matches = formula.match(/\{([^}]+)\}/g);
  if (matches) {
    for (const match of matches) {
      const statId = match.slice(1, -1);
      const stat = stats.find(s => s.id === statId);
      const value = stat ? Number(stat.value) || 0 : 0;
      parsedFormula = parsedFormula.replace(match, String(value));
    }
  }
  
  try {
    // Basic sanitization to prevent executing arbitrary code
    if (/[^0-9+\-*/().\s]/.test(parsedFormula)) {
      return 0;
    }
    const result = new Function(`return ${parsedFormula}`)();
    const numResult = Number(result);
    return isNaN(numResult) || !isFinite(numResult) ? 0 : numResult;
  } catch (e) {
    return 0;
  }
};

export default function App() {
  const [region, setRegion] = useState<Region>('ru');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showChars, setShowChars] = useState(false);
  
  const [user, setUser] = useState<UserData | null>(null);
  const [highlightsConfig, setHighlightsConfig] = useState<HighlightConfig[]>([]);
  const [statsConfig, setStatsConfig] = useState<StatGroupConfig[]>([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const popupRef = React.useRef<Window | null>(null);

  useEffect(() => {
    fetchUser();
    fetchHighlights();
    fetchStatsConfig();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data.session_id) {
          localStorage.setItem('session_token', event.data.session_id);
          axios.defaults.headers.common['Authorization'] = `Bearer ${event.data.session_id}`;
        }
        fetchUser();
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyCharacters();
    } else {
      setMyCharacters([]);
    }
  }, [user]);

  const fetchMyCharacters = async () => {
    try {
      const res = await axios.get('/api/user/characters');
      setMyCharacters(res.data);
    } catch (e) {
      console.error('Failed to fetch characters');
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchUser = async () => {
    // Avoid 401 error on initial load if no token exists
    if (!localStorage.getItem('session_token')) {
      setUser(null);
      return;
    }
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data);
    } catch (e) {
      setUser(null);
      // If 401, clear the invalid token
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        localStorage.removeItem('session_token');
        delete axios.defaults.headers.common['Authorization'];
      }
    }
  };

  const fetchHighlights = async () => {
    try {
      const res = await axios.get('/api/highlights');
      setHighlightsConfig(res.data);
    } catch (e) {
      console.error('Failed to fetch highlights config');
    }
  };

  const fetchStatsConfig = async () => {
    try {
      const res = await axios.get('/api/settings/stats_config');
      if (res.data) {
        setStatsConfig(Array.isArray(res.data) ? res.data : (res.data.value || DEFAULT_STATS_CONFIG));
      } else {
        setStatsConfig(DEFAULT_STATS_CONFIG);
      }
    } catch (e) {
      console.error('Failed to fetch stats config');
      setStatsConfig(DEFAULT_STATS_CONFIG);
    }
  };

  const handleLogin = async () => {
    try {
      const origin = window.location.origin;
      const authId = Math.random().toString(36).substring(2, 15);
      const res = await axios.get(`/api/auth/url?origin=${encodeURIComponent(origin)}&auth_id=${encodeURIComponent(authId)}`);
      const popup = window.open(res.data.url, 'oauth_popup', 'width=600,height=700');
      popupRef.current = popup;
      
      // Fallback polling in case postMessage fails (e.g. due to Cross-Origin-Opener-Policy)
      const pollTimer = setInterval(async () => {
        let isClosed = false;
        try {
          isClosed = popup?.closed ?? true;
        } catch (e) {
          // Cross-origin access might throw, assume it's open
        }

        if (isClosed) {
          clearInterval(pollTimer);
          popupRef.current = null;
          fetchUser();
        } else {
          try {
            const statusRes = await axios.get(`/api/auth/status?auth_id=${encodeURIComponent(authId)}`);
            console.log('Auth status check:', statusRes.data);
            if (statusRes.data && statusRes.data.success && statusRes.data.session_id) {
              const token = statusRes.data.session_id;
              localStorage.setItem('session_token', token);
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
              clearInterval(pollTimer);
              fetchUser();
              try {
                popup?.close();
                popupRef.current = null;
              } catch (err) {
                console.error('Could not close popup automatically:', err);
              }
            }
          } catch (e) {
            // Not logged in yet, continue polling
          }
        }
      }, 1000);
    } catch (e) {
      console.error('Failed to get auth URL');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {
      console.error('Failed to logout');
    } finally {
      localStorage.removeItem('session_token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setShowAdmin(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setLoading(true);
    setError(null);
    setProfileData(null);

    try {
      const response = await axios.get(`/api/profile/${region}/${encodeURIComponent(nickname.trim())}`);
      setProfileData(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Игрок не найден. Проверьте никнейм и регион.');
      } else {
        setError(err.response?.data?.message || err.message || 'Произошла ошибка при получении данных.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatValue = (id: string) => profileData?.stats.find(s => s.id === id)?.value;
  const allianceInfo = profileData?.alliance ? ALLIANCE_MAP[profileData.alliance] : null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30 pb-20">
        {/* Background effects */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full opacity-50" />
        </div>

      {/* Header / Auth */}
      <div className="relative z-20 flex justify-end p-4 gap-4">
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">
              Привет, <span className="text-zinc-200 font-medium">{user.username}</span>
              {user.role === 'admin' && <span className="ml-2 text-emerald-400 text-xs border border-emerald-500/30 px-2 py-0.5 rounded-full">Admin</span>}
            </span>
            
            {myCharacters.length > 0 && (
              <div 
                className="relative"
                onMouseEnter={() => setShowChars(true)}
                onMouseLeave={() => setShowChars(false)}
              >
                <button className="text-sm text-zinc-400 hover:text-zinc-200 flex items-center gap-1 py-2 transition-colors">
                  <User className="w-4 h-4" />
                  Персонажи
                </button>
                <AnimatePresence>
                  {showChars && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full pt-2 w-64 z-50"
                    >
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 overflow-hidden">
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 mb-1">
                          Ваши персонажи
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {Array.isArray(myCharacters) && myCharacters.map((char: any, index: number) => (
                            <button
                              key={char.uuid || char.name || index}
                              onClick={() => {
                                setNickname(char.name);
                                setRegion(char.region);
                                setShowChars(false);
                                // Trigger search
                                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                                // We need to handle this specially since state updates are async
                                setLoading(true);
                                setError(null);
                                setProfileData(null);
                                axios.get(`/api/profile/${char.region}/${encodeURIComponent(char.name)}`)
                                  .then(res => setProfileData(res.data))
                                  .catch(err => {
                                    if (err.response?.status === 404) setError('Игрок не найден.');
                                    else setError('Ошибка при получении данных.');
                                  })
                                  .finally(() => setLoading(false));
                              }}
                              className="w-full text-left px-3 py-2.5 hover:bg-emerald-500/10 rounded-lg text-sm text-zinc-300 hover:text-emerald-400 transition-all flex justify-between items-center group/item"
                            >
                              <span className="font-medium truncate mr-2">{char.name}</span>
                              <span className="text-[10px] font-bold text-zinc-500 group-hover/item:text-emerald-500/70 uppercase bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 transition-colors">{char.region}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {user.role === 'admin' && (
              <button
                onClick={() => setShowAdmin(!showAdmin)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300"
                title="Панель администратора"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-red-400"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            Войти через EXBO
          </button>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <AnimatePresence mode="wait">
          {showAdmin && user?.role === 'admin' ? (
            <ErrorBoundary>
              <AdminPanel 
                config={highlightsConfig} 
                statsConfig={statsConfig}
                myCharacters={myCharacters}
                onSave={async (newConfig, newStatsConfig) => {
                  try {
                    await axios.post('/api/admin/highlights', newConfig);
                    await axios.post('/api/admin/settings/stats_config', newStatsConfig);
                    setHighlightsConfig(newConfig);
                    setStatsConfig(newStatsConfig);
                    setShowAdmin(false);
                  } catch (e) {
                    alert('Ошибка сохранения');
                  }
                }} 
                onClose={() => setShowAdmin(false)} 
              />
            </ErrorBoundary>
          ) : (
            <motion.div
              key="main"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
                  Stalcraft Stats
                </h1>
                <p className="text-zinc-400 max-w-xl mx-auto">
                  Введите никнейм игрока и выберите регион, чтобы получить подробную статистику из базы данных EXBO.
                </p>
              </div>

              <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                onSubmit={handleSearch}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-6 shadow-2xl mb-8 max-w-4xl mx-auto"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-zinc-500" />
                    </div>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Никнейм игрока..."
                      className="block w-full pl-11 pr-4 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                      required
                    />
                  </div>
                  <div className="relative w-full md:w-56">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-zinc-500" />
                    </div>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value as Region)}
                      className="block w-full pl-11 pr-10 py-3 bg-zinc-950/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all appearance-none cursor-pointer hover:bg-zinc-900/50"
                    >
                      <option value="ru" className="bg-zinc-900">RU (Россия)</option>
                      <option value="eu" className="bg-zinc-900">EU (Европа)</option>
                      <option value="na" className="bg-zinc-900">NA (Сев. Америка)</option>
                      <option value="sea" className="bg-zinc-900">SEA (Азия)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !nickname.trim()}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                    <span>Найти</span>
                  </button>
                </div>
              </motion.form>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 mb-8 max-w-4xl mx-auto"
                  >
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </motion.div>
                )}

                {profileData && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Header Card */}
                    <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
                      <div className="absolute -right-20 -top-20 w-64 h-64 bg-zinc-800/30 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="w-32 h-32 bg-zinc-950 rounded-full flex items-center justify-center shrink-0 border-4 border-zinc-800 shadow-2xl relative z-10">
                        <User className="h-16 w-16 text-zinc-600" />
                      </div>
                      
                      <div className="flex-1 text-center md:text-left relative z-10 w-full">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                          {profileData.username}
                        </h2>
                        <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                          {allianceInfo && (
                            <span className={cn("px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border", allianceInfo.bg, allianceInfo.color)}>
                              <Shield className="h-4 w-4" />
                              {allianceInfo.name}
                            </span>
                          )}
                          {profileData.lastLogin && (
                            <span className="px-4 py-1.5 bg-zinc-800/80 border border-zinc-700/50 rounded-full text-sm text-zinc-300 flex items-center gap-2">
                              <Clock className="h-4 w-4 text-zinc-400" />
                              Был в сети: {new Date(profileData.lastLogin).toLocaleDateString('ru-RU')}
                            </span>
                          )}
                        </div>

                        {/* Dynamic Highlights Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                          {highlightsConfig.map((config, idx) => {
                            const val = evaluateFormula(config.formula, profileData.stats);
                            let displayVal = String(val);
                            if (config.format === 'percent') displayVal = val.toFixed(1) + '%';
                            if (config.format === 'ratio') displayVal = val.toFixed(2);
                            if (config.format === 'number') displayVal = val.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                            if (config.format === 'duration') {
                              const hours = Math.floor(val / (1000 * 60 * 60));
                              const days = Math.floor(hours / 24);
                              const remHours = hours % 24;
                              displayVal = `${days} д. ${remHours} ч.`;
                            }
                            if (config.format === 'duration_hours') {
                              const hours = Math.floor(val / (1000 * 60 * 60));
                              displayVal = `${hours} ч.`;
                            }

                            return (
                              <div key={idx} className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{config.title}</div>
                                <div className={cn("text-2xl font-bold", config.color)}>{displayVal}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {statsConfig.map((group, groupIdx) => {
                        const visibleItems = group.items.filter(item => !item.isHidden);
                        if (visibleItems.length === 0) return null;

                        const Icon = ICON_MAP[group.icon] || Activity;

                        return (
                          <motion.div
                            key={group.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIdx * 0.05 }}
                            className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden flex flex-col"
                          >
                            <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center gap-3">
                              <div className="p-2 bg-zinc-800 rounded-xl">
                                <Icon className="h-5 w-5 text-emerald-500" />
                              </div>
                              <h3 className="font-semibold text-zinc-100">{group.title}</h3>
                            </div>
                            <div className="p-2 flex-1">
                              <table className="w-full text-sm">
                                <tbody>
                                  {visibleItems.map((item, idx) => {
                                    const val = evaluateFormula(item.formula, profileData.stats);
                                    if (val === null && item.format !== 'auto') return null;
                                    
                                    let displayVal = String(val);
                                    if (item.format === 'auto') {
                                      // Fallback to old format logic if it's a simple key
                                      const match = item.formula.match(/^\{([^}]+)\}$/);
                                      if (match) {
                                        const statId = match[1];
                                        const stat = profileData.stats.find(s => s.id === statId);
                                        if (stat) {
                                          displayVal = formatStatValue(stat.id, stat.type, stat.value);
                                        } else {
                                          return null;
                                        }
                                      } else {
                                        displayVal = Number(val).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
                                      }
                                    } else if (val !== null) {
                                      if (item.format === 'percent') displayVal = val.toFixed(1) + '%';
                                      if (item.format === 'ratio') displayVal = val.toFixed(2);
                                      if (item.format === 'number') displayVal = val.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
                                      if (item.format === 'duration') {
                                        const hours = Math.floor(val / (1000 * 60 * 60));
                                        const days = Math.floor(hours / 24);
                                        const remHours = hours % 24;
                                        displayVal = `${days} д. ${remHours} ч.`;
                                      }
                                      if (item.format === 'duration_hours') {
                                        const hours = Math.floor(val / (1000 * 60 * 60));
                                        displayVal = `${hours} ч.`;
                                      }
                                      if (item.format === 'date') {
                                        displayVal = new Date(val).toLocaleDateString('ru-RU');
                                      }
                                      if (item.format === 'distance') {
                                        displayVal = (val / 100000).toLocaleString('ru-RU', { maximumFractionDigits: 1 }) + ' км';
                                      }
                                    }

                                    return (
                                      <tr 
                                        key={item.id} 
                                        className={cn(
                                          "transition-colors hover:bg-zinc-800/30",
                                          idx !== visibleItems.length - 1 && "border-b border-zinc-800/30"
                                        )}
                                      >
                                        <td className="py-3 px-4 text-zinc-400">
                                          {item.title}
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium text-zinc-200">
                                          {displayVal}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </ErrorBoundary>
  );
}

function AdminPanel({ config, statsConfig, myCharacters, onSave, onClose }: { config: HighlightConfig[], statsConfig: StatGroupConfig[], myCharacters: any[], onSave: (c: HighlightConfig[], s: StatGroupConfig[]) => void, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'stats' | 'users'>('highlights');
  const [items, setItems] = useState<HighlightConfig[]>(config);
  const [statsItems, setStatsItems] = useState<StatGroupConfig[]>(statsConfig);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [focusedInput, setFocusedInput] = useState<{ type: 'highlight' | 'stat', groupIndex?: number, itemIndex: number, ref: HTMLInputElement | null } | null>(null);
  const [attributeSearch, setAttributeSearch] = useState('');
  const [previewData, setPreviewData] = useState<ProfileData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewCharIndex, setPreviewCharIndex] = useState(0);

  useEffect(() => {
    if ((activeTab === 'highlights' || activeTab === 'stats') && myCharacters.length > 0) {
      const char = myCharacters[previewCharIndex];
      if (!char) return;
      setPreviewLoading(true);
      axios.get(`/api/profile/${char.region}/${encodeURIComponent(char.name)}`)
        .then(res => setPreviewData(res.data))
        .catch(err => console.error('Preview fetch error', err))
        .finally(() => setPreviewLoading(false));
    }
  }, [activeTab, myCharacters, previewCharIndex]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await axios.get('/api/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error('Failed to fetch users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await axios.post(`/api/admin/users/${userId}/role`, { role: newRole });
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Ошибка при изменении роли');
    }
  };

  const addItem = () => {
    setItems([...items, { title: 'Новый стат', formula: '{kil}', color: 'text-white', format: 'number' }]);
  };

  const updateItem = (index: number, field: keyof HighlightConfig, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const insertAttribute = (key: string) => {
    if (focusedInput === null || focusedInput.ref === null) return;
    
    const input = focusedInput.ref;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const attribute = `{${key}}`;
    
    const newValue = text.substring(0, start) + attribute + text.substring(end);
    
    if (focusedInput.type === 'highlight') {
      updateItem(focusedInput.itemIndex, 'formula', newValue);
    } else if (focusedInput.type === 'stat' && focusedInput.groupIndex !== undefined) {
      updateStatItem(focusedInput.groupIndex, focusedInput.itemIndex, 'formula', newValue);
    }
    
    // Restore focus and selection after state update
    setTimeout(() => {
      input.focus();
      const newPos = start + attribute.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const updateStatGroup = (groupIndex: number, field: keyof StatGroupConfig, value: any) => {
    const newGroups = [...statsItems];
    newGroups[groupIndex] = { ...newGroups[groupIndex], [field]: value };
    setStatsItems(newGroups);
  };

  const addStatGroup = () => {
    setStatsItems([...statsItems, { id: `g_${Date.now()}`, title: 'Новый блок', icon: 'Activity', items: [] }]);
  };

  const removeStatGroup = (groupIndex: number) => {
    setStatsItems(statsItems.filter((_, i) => i !== groupIndex));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if it's a highlight item
    const activeHighlightIndex = items.findIndex((i: any) => i.id === active.id);
    if (activeHighlightIndex !== -1) {
      const overHighlightIndex = items.findIndex((i: any) => i.id === over.id);
      if (overHighlightIndex !== -1) {
        setItems(arrayMove(items, activeHighlightIndex, overHighlightIndex));
        return;
      }
    }

    const activeGroup = statsItems.find((g: any) => g.id === active.id || g.items.find((i: any) => i.id === active.id));
    const overGroup = statsItems.find((g: any) => g.id === over.id || g.items.find((i: any) => i.id === over.id));

    if (activeGroup && overGroup) {
      if (activeGroup.id === active.id && overGroup.id === over.id) {
        const oldIndex = statsItems.findIndex((g: any) => g.id === active.id);
        const newIndex = statsItems.findIndex((g: any) => g.id === over.id);
        setStatsItems(arrayMove(statsItems, oldIndex, newIndex));
      } else {
        const activeItemIndex = activeGroup.items.findIndex((i: any) => i.id === active.id);
        const overItemIndex = overGroup.items.findIndex((i: any) => i.id === over.id);
        
        if (activeGroup === overGroup) {
          const newGroups = [...statsItems];
          const group = newGroups.find((g: any) => g.id === activeGroup.id);
          group.items = arrayMove(group.items, activeItemIndex, overItemIndex);
          setStatsItems(newGroups);
        } else {
          const newGroups = [...statsItems];
          const activeGroupInNew = newGroups.find((g: any) => g.id === activeGroup.id);
          const overGroupInNew = newGroups.find((g: any) => g.id === over.id) || newGroups.find((g: any) => g.items.find((i: any) => i.id === over.id));
          const [item] = activeGroupInNew.items.splice(activeItemIndex, 1);
          const overItemIndexInGroup = overGroupInNew.items.findIndex((i: any) => i.id === over.id);
          overGroupInNew.items.splice(overItemIndexInGroup !== -1 ? overItemIndexInGroup : overGroupInNew.items.length, 0, item);
          setStatsItems(newGroups);
        }
      }
    }
  };

  const updateStatItem = (groupIndex: number, itemIndex: number, field: keyof StatItemConfig, value: any) => {
    const newGroups = [...statsItems];
    const newItems = [...newGroups[groupIndex].items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    newGroups[groupIndex].items = newItems;
    setStatsItems(newGroups);
  };

  const addStatItem = (groupIndex: number) => {
    const newGroups = [...statsItems];
    newGroups[groupIndex].items.push({ id: `i_${Date.now()}`, title: 'Новый атрибут', formula: '{kil}', format: 'auto', isHidden: false });
    setStatsItems(newGroups);
  };

  const removeStatItem = (groupIndex: number, itemIndex: number) => {
    const newGroups = [...statsItems];
    newGroups[groupIndex].items = newGroups[groupIndex].items.filter((_, i) => i !== itemIndex);
    setStatsItems(newGroups);
  };


function SortableStatGroup({ group, groupIdx, statsItems, setStatsItems, updateStatGroup, removeStatGroup, addStatItem, removeStatItem, updateStatItem, setFocusedInput }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: group.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-white">
          <GripVertical className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={group.title}
          onChange={(e) => updateStatGroup(groupIdx, 'title', e.target.value)}
          placeholder="Название блока"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none font-bold"
        />
        <div className="relative w-40">
          <select
            value={group.icon}
            onChange={(e) => updateStatGroup(groupIdx, 'icon', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
          >
            {Object.keys(ICON_MAP).map(iconName => (
              <option key={iconName} value={iconName}>{iconName}</option>
            ))}
          </select>
        </div>
        <button onClick={() => removeStatGroup(groupIdx)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2 pl-8 border-l-2 border-zinc-800/50 ml-2">
        <SortableContext items={group.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
          {group.items.map((item: any, itemIdx: number) => (
            <SortableStatItem 
              key={item.id} 
              item={item} 
              groupIdx={groupIdx} 
              itemIdx={itemIdx} 
              statsItems={statsItems}
              setStatsItems={setStatsItems}
              removeStatItem={removeStatItem}
              updateStatItem={updateStatItem}
              setFocusedInput={setFocusedInput}
            />
          ))}
        </SortableContext>
        <button
          onClick={() => addStatItem(groupIdx)}
          className="mt-2 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Добавить атрибут
        </button>
      </div>
    </div>
  );
}

function SortableStatItem({ item, groupIdx, itemIdx, statsItems, setStatsItems, removeStatItem, updateStatItem, setFocusedInput }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-center">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-white">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 flex gap-4 items-center">
        <input
          type="text"
          value={item.title}
          onChange={(e) => updateStatItem(groupIdx, itemIdx, 'title', e.target.value)}
          placeholder="Название"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <input
          type="text"
          value={item.formula || ''}
          onChange={(e) => updateStatItem(groupIdx, itemIdx, 'formula', e.target.value)}
          onFocus={() => setFocusedInput(item.id)}
          placeholder="Формула"
          className="w-40 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <button onClick={() => removeStatItem(groupIdx, itemIdx)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SortableHighlightItem({ item, idx, updateItem, removeItem, setFocusedInput }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-500 hover:text-white mt-1 md:mt-0">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="flex-1 space-y-3 w-full">
        <div className="flex gap-3">
          <input
            type="text"
            value={item.title}
            onChange={(e) => updateItem(idx, 'title', e.target.value)}
            placeholder="Название (напр. K/D)"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <div className="relative w-40">
            <select
              value={item.color}
              onChange={(e) => updateItem(idx, 'color', e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
            >
              <option value="text-white">Белый</option>
              <option value="text-emerald-400">Изумрудный</option>
              <option value="text-blue-400">Синий</option>
              <option value="text-amber-400">Желтый</option>
              <option value="text-red-400">Красный</option>
              <option value="text-purple-400">Фиолетовый</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <div className="relative w-32">
            <select
              value={item.format}
              onChange={(e) => updateItem(idx, 'format', e.target.value as any)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
            >
              <option value="number">Число</option>
              <option value="ratio">Дробь (2.00)</option>
              <option value="percent">Процент (%)</option>
              <option value="duration">Время (дн. ч.)</option>
              <option value="duration_hours">Время (часы)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
              <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
        <div>
          <input
            type="text"
            value={item.formula}
            onFocus={(e) => setFocusedInput({ type: 'highlight', itemIndex: idx, ref: e.target })}
            onChange={(e) => updateItem(idx, 'formula', e.target.value)}
            placeholder="Формула (напр. {kil} / {dea})"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
          />
          <p className="text-[10px] text-zinc-500 mt-1">
            Используйте ID статистики в фигурных скобках, например: <code className="text-emerald-400/70">{'{sho-hea} / {sho-hit} * 100'}</code>
          </p>
        </div>
      </div>
      <button
        onClick={() => removeItem(idx)}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-6xl mx-auto shadow-2xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="w-6 h-6 text-emerald-500" />
            Панель администратора
          </h2>
        </div>
        <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors">
          Назад
        </button>
      </div>

      <div className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab('highlights')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'highlights' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Хайлайты (Статистика)
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'stats' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Статистика (Блоки)
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'users' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Пользователи
        </button>
      </div>

      {(activeTab === 'highlights' || activeTab === 'stats') && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {activeTab === 'highlights' && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4 pr-2">
                    {items.map((item, idx) => (
                      <SortableHighlightItem
                        key={item.id}
                        item={item}
                        idx={idx}
                        updateItem={updateItem}
                        removeItem={removeItem}
                        setFocusedInput={setFocusedInput}
                      />
                    ))}
                  </div>
                </SortableContext>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-6 mt-4">
                  <button
                    onClick={addItem}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Добавить показатель
                  </button>
                  <button
                    onClick={() => onSave(items, statsItems)}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить настройки
                  </button>
                </div>
              </DndContext>
            )}

            {activeTab === 'stats' && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={statsItems.map(g => g.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-6 pr-2">
                  {statsItems.map((group, groupIdx) => (
                    <SortableStatGroup 
                      key={group.id} 
                      group={{...group, items: group.items.filter((i: any) => !i.isHidden)}} 
                      groupIdx={groupIdx} 
                      statsItems={statsItems}
                      setStatsItems={setStatsItems}
                      updateStatGroup={updateStatGroup}
                      removeStatGroup={removeStatGroup}
                      addStatItem={addStatItem}
                      removeStatItem={removeStatItem}
                      updateStatItem={updateStatItem}
                      setFocusedInput={setFocusedInput}
                    />
                  ))}
                  
                  {/* Hidden items block */}
                  <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-4 space-y-4">
                    <h3 className="text-red-400 font-bold text-sm">Скрытые атрибуты</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {statsItems.flatMap(g => g.items).filter(i => i.isHidden).map(item => (
                        <div key={item.id} className="bg-red-900/20 border border-red-900/30 rounded-lg p-2 text-xs text-red-300">
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Атрибуты</h3>
                </div>
                {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
              </div>
              
              {myCharacters.length > 0 && (
                <div className="mb-3 relative">
                  <select
                    value={previewCharIndex}
                    onChange={(e) => setPreviewCharIndex(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                  >
                    {myCharacters.map((char, idx) => (
                      <option key={idx} value={idx}>{char.name} ({char.region})</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="mb-3 relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3 w-3 text-zinc-500" />
                </div>
                <input
                  type="text"
                  placeholder="Поиск атрибута..."
                  value={attributeSearch}
                  onChange={(e) => setAttributeSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(STAT_NAMES)
                  .filter(([key, name]) => 
                    key.toLowerCase().includes(attributeSearch.toLowerCase()) || 
                    name.toLowerCase().includes(attributeSearch.toLowerCase())
                  )
                  .map(([key, name]) => {
                    const stat = previewData?.stats.find(s => s.id === key);
                    const rawValue = stat ? stat.value : '—';
                    const formattedValue = stat ? formatStatValue(stat.id, stat.type, stat.value) : '—';
                    
                    return (
                      <button
                        key={key}
                        onClick={() => insertAttribute(key)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/10 text-[11px] transition-all flex flex-col group/attr"
                      >
                        <div className="flex justify-between items-start w-full mb-1">
                          <span className="font-mono text-emerald-500 font-bold group-hover/attr:scale-105 transition-transform">{"{" + key + "}"}</span>
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] text-zinc-300 font-mono bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800 truncate max-w-[100px] text-right" title="Сырое значение (используется в формулах)">
                              {String(rawValue)}
                            </span>
                            {stat?.type === 'DURATION' && (
                              <span className="text-[9px] text-zinc-500 mt-0.5">{formattedValue}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-zinc-500 truncate group-hover/attr:text-zinc-300">{name}</span>
                      </button>
                    );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 italic">
                В формулах используются сырые числовые значения.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Пользователь</th>
                    <th className="px-4 py-3 font-medium">EXBO ID</th>
                    <th className="px-4 py-3 font-medium">Роль</th>
                    <th className="px-4 py-3 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 text-zinc-200 font-medium">{u.username}</td>
                      <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{u.id.substring(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium border",
                          u.role === 'admin' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-800 text-zinc-300 border-zinc-700"
                        )}>
                          {u.role === 'admin' ? 'Администратор' : 'Пользователь'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block w-32">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer"
                          >
                            <option value="user">Пользователь</option>
                            <option value="admin">Администратор</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                  Пользователи не найдены
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
