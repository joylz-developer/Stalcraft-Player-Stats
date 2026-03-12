import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, User, Shield, Crosshair, Activity, AlertCircle, MapPin, Loader2, 
  Target, Skull, Coins, Map, Swords, Home, Trophy, Percent, Clock, Calendar,
  Settings, LogOut, Plus, Trash2, Save
} from 'lucide-react';
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

interface HighlightConfig {
  id?: number;
  title: string;
  formula: string;
  color: string;
  format: 'number' | 'percent' | 'ratio';
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

const STAT_GROUPS = [
  { title: 'Общая статистика', icon: Activity, keys: ['pla-tim', 'reg-tim', 'ach-points', 'ach-gai', 'que-fin', 'sgn-fnd', 'art-col', 'cha-mes-sen'] },
  { title: 'Боевая эффективность (PvP)', icon: Crosshair, keys: ['kil', 'dea', 'ast', 'max-kil-ser', 'kni-kil', 'exp-kil', 'dam-dea-pla', 'dam-rec-pla'] },
  { title: 'Оружие и Точность', icon: Target, keys: ['sho-fir', 'sho-hit', 'sho-hea', 'sho-bod', 'sho-lim', 'gre-thr', 'scr-thr', 'wea-fix', 'arm-fix'] },
  { title: 'Охота на мутантов', icon: Skull, keys: ['mut-kil', 'mut-boar-kil', 'mut-flsh-kil', 'mut-dog-kil', 'mut-pse-kil', 'mut-tush-kil', 'mut-krv-kil', 'mut-psi-kil', 'mut-chi-kill', 'mut-gig-kil', 'mut-elp-kil'] },
  { title: 'Экономика и Торговля', icon: Coins, keys: ['max-mon-amo', 'tra', 'ite-bou-tra', 'ite-sol-tra', 'mon-gai-tra', 'mon-gai-que', 'equ-upg', 'suc-equ-upg'] },
  { title: 'Выживание и Смерти', icon: AlertCircle, keys: ['suicides', 'ano-dea', 'bul-dea', 'ble-to-dea', 'rad-dea', 'fal-dea', 'col-dea', 'ste-ano-dea', 'ele-ano-dea', 'fun-ano-dea', 'cir-ano-dea', 'tra-ano-dea', 'lig-ano-dea'] },
  { title: 'Активности', icon: Map, keys: ['tpacks-delivered', 'tpacks-money', 'tpacks-distance', 'tpacks-inter', 'air-drops-hckd', 'hid-plc', 'mining-count', 'incident-part', 'incident-win', 'completed-ops', 'kills-ops'] },
  { title: 'Сессионные бои и Дуэли', icon: Swords, keys: ['part-bf', 'won-bf', 'lost-bf', 'kills-bf', 'deaths-bf', 'fights-part', 'won-fights-personal', 'won-fights-equal'] },
  { title: 'Убежище', icon: Home, keys: ['hid-ktch-crft', 'hid-wrk-crft', 'hid-lab-crft', 'hid-mat-mon', 'hid-enrg'] },
  { title: 'Перемещение', icon: MapPin, keys: ['dis-on-foo', 'dis-sne', 'dis-cra', 'dis-air'] }
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const popupRef = React.useRef<Window | null>(null);

  useEffect(() => {
    fetchUser();
    fetchHighlights();

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
            <AdminPanel 
              config={highlightsConfig} 
              onSave={async (newConfig) => {
                try {
                  await axios.post('/api/admin/highlights', newConfig);
                  setHighlightsConfig(newConfig);
                  setShowAdmin(false);
                } catch (e) {
                  alert('Ошибка сохранения');
                }
              }} 
              onClose={() => setShowAdmin(false)} 
            />
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

                            return (
                              <div key={idx} className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{config.title}</div>
                                <div className={cn("text-2xl font-bold", config.color)}>{displayVal}</div>
                              </div>
                            );
                          })}
                          <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                            <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Время в игре</div>
                            <div className="text-lg font-bold text-purple-400 mt-1">
                              {formatStatValue('pla-tim', 'DURATION', getStatValue('pla-tim') || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {STAT_GROUPS.map((group, groupIdx) => {
                        const groupStats = group.keys
                          .map(key => profileData.stats.find(s => s.id === key))
                          .filter(Boolean) as StatItem[];

                        if (groupStats.length === 0) return null;

                        const Icon = group.icon;

                        return (
                          <motion.div
                            key={group.title}
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
                                  {groupStats.map((stat, idx) => (
                                    <tr 
                                      key={stat.id} 
                                      className={cn(
                                        "transition-colors hover:bg-zinc-800/30",
                                        idx !== groupStats.length - 1 && "border-b border-zinc-800/30"
                                      )}
                                    >
                                      <td className="py-3 px-4 text-zinc-400">
                                        {STAT_NAMES[stat.id] || stat.id}
                                      </td>
                                      <td className="py-3 px-4 text-right font-medium text-zinc-200">
                                        {formatStatValue(stat.id, stat.type, stat.value)}
                                      </td>
                                    </tr>
                                  ))}
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
  );
}

function AdminPanel({ config, onSave, onClose }: { config: HighlightConfig[], onSave: (c: HighlightConfig[]) => void, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'users'>('highlights');
  const [items, setItems] = useState<HighlightConfig[]>(config);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [focusedInput, setFocusedInput] = useState<{ index: number, ref: HTMLInputElement | null } | null>(null);

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
    updateItem(focusedInput.index, 'formula', newValue);
    
    // Restore focus and selection after state update
    setTimeout(() => {
      input.focus();
      const newPos = start + attribute.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

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
          onClick={() => setActiveTab('users')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'users' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Пользователи
        </button>
      </div>

      {activeTab === 'highlights' && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
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
                        onFocus={(e) => setFocusedInput({ index: idx, ref: e.target })}
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
              ))}
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800 pt-6">
              <button
                onClick={addItem}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Добавить показатель
              </button>
              <button
                onClick={() => onSave(items)}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                <Save className="w-4 h-4" />
                Сохранить настройки
              </button>
            </div>
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Атрибуты</h3>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(STAT_NAMES).map(([key, name]) => (
                  <button
                    key={key}
                    onClick={() => insertAttribute(key)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-500/10 text-[11px] transition-all flex flex-col group/attr"
                  >
                    <span className="font-mono text-emerald-500 font-bold group-hover/attr:scale-105 transition-transform">{"{" + key + "}"}</span>
                    <span className="text-zinc-500 truncate group-hover/attr:text-zinc-300">{name}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-zinc-800 text-[10px] text-zinc-500 italic">
                Нажмите на атрибут, чтобы вставить его в текущую формулу
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
