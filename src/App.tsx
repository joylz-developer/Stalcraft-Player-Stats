import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, User, Shield, Crosshair, Activity, MapPin, Loader2, 
  Target, Skull, Coins, Map, Swords, Home, Trophy, Percent, Clock, Calendar,
  Settings, LogOut
} from 'lucide-react';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ICON_MAP, ALLIANCE_MAP, STAT_NAMES, DEFAULT_STATS_CONFIG, DEFAULT_UI_CONFIG } from './constants';
import { Region, StatItem, ProfileData, UserData, ToastMessage, HighlightConfig, StatItemConfig, StatGroupConfig } from './types';
import { cn } from './utils/cn';
import { Toast } from './components/Toast';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { formatStatValue, formatCustomValue, evaluateFormula } from './utils/formulas';

const savedToken = localStorage.getItem('session_token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

export default function App() {
  const [region, setRegion] = useState<Region>('ru');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showChars, setShowChars] = useState(false);
  
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = React.useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const handleSaveConfig = async (newConfig: HighlightConfig[], newStatsConfig: StatGroupConfig[], newUiConfig: any) => {
    try {
      await axios.post('/api/admin/highlights', newConfig);
      await axios.post('/api/admin/settings/stats_config', newStatsConfig);
      await axios.post('/api/admin/settings/ui_config', newUiConfig);
      setHighlightsConfig(newConfig);
      setStatsConfig(newStatsConfig);
      setUiConfig(newUiConfig);
      addToast('Изменения сохранены');
    } catch (e) {
      console.error('Failed to save config', e);
      addToast('Ошибка при сохранении', 'error');
    }
  };

  const [user, setUser] = useState<UserData | null>(null);
  const [highlightsConfig, setHighlightsConfig] = useState<HighlightConfig[]>([]);
  const [statsConfig, setStatsConfig] = useState<StatGroupConfig[]>([]);
  const [uiConfig, setUiConfig] = useState(DEFAULT_UI_CONFIG);
  const [showAdmin, setShowAdmin] = useState(false);
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const popupRef = React.useRef<Window | null>(null);

  useEffect(() => {
    fetchUser();
    fetchHighlights();
    fetchStatsConfig();
    fetchUiConfig();

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

  const fetchUiConfig = async () => {
    try {
      const res = await axios.get('/api/settings/ui_config');
      if (res.data) {
        setUiConfig(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch UI config');
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
        <style>{`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}</style>
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </div>

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

      <div className={cn("relative z-10 mx-auto px-4 py-8 sm:px-6 lg:px-8", showAdmin && user?.role === 'admin' ? "w-full max-w-none" : "max-w-6xl")}>
        
        <AnimatePresence mode="wait">
          {showAdmin && user?.role === 'admin' ? (
            <ErrorBoundary>
              <AdminPanel 
                config={highlightsConfig} 
                statsConfig={statsConfig}
                uiConfig={uiConfig}
                myCharacters={myCharacters}
                onSave={handleSaveConfig} 
                onClose={() => setShowAdmin(false)}
                addToast={addToast}
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
                            // Добавили передачу параметра config.roundToK !== false
                            const displayVal = formatCustomValue(val, config.format, uiConfig.formats, config.roundToK !== false);
                            const colorObj = uiConfig.colors.find((c: any) => c.id === config.color);
                            const hexColor = colorObj ? colorObj.hex : undefined;
                            const legacyColorClass = !colorObj ? config.color : undefined;

                            return (
                              <div key={idx} className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4 text-center">
                                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">{config.title}</div>
                                <div className={cn("text-2xl font-bold", hexColor ? "" : legacyColorClass)} style={hexColor ? { color: hexColor } : {}}>{displayVal}</div>
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
                            className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl flex flex-col"
                          >
                            <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center gap-3 rounded-t-3xl">
                              <div className="p-2 bg-zinc-800 rounded-xl">
                                <Icon className="h-5 w-5 text-emerald-500" />
                              </div>
                              <h3 className="font-semibold text-zinc-100">{group.title}</h3>
                            </div>
                            <div className="p-2 flex-1">
                              <div className="w-full text-sm flex flex-col">
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
                                          // Добавили item.roundToK !== false
                                          displayVal = formatStatValue(stat.id, stat.type, stat.value, item.roundToK !== false);
                                        } else {
                                          return null;
                                        }
                                      } else {
                                        // Добавили item.roundToK !== false
                                        displayVal = formatCustomValue(val, 'number', uiConfig.formats, item.roundToK !== false);
                                      }
                                    } else if (val !== null) {
                                      // Добавили item.roundToK !== false
                                      displayVal = formatCustomValue(val, item.format, uiConfig.formats, item.roundToK !== false);
                                    }

                                    return (
                                      <div 
                                        key={item.id} 
                                        className={cn(
                                          "flex justify-between items-center py-3 px-4 transition-colors hover:bg-zinc-800/30",
                                          idx !== visibleItems.length - 1 && "border-b border-zinc-800/30"
                                        )}
                                      >
                                        <div className="text-zinc-400 truncate pr-4">
                                          {item.title}
                                        </div>
                                        <div className="text-right font-medium text-zinc-200 shrink-0">
                                          {displayVal}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
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
