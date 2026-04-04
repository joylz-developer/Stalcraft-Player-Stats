import { 
  Search, User, Shield, Crosshair, Activity, AlertCircle, MapPin, Loader2, 
  Target, Skull, Coins, Map, Swords, Home, Trophy, Percent, Clock, Calendar,
  Settings, LogOut, Plus, Trash2, Save
} from 'lucide-react';

export interface StatItemConfig {
  id: string;
  title: string;
  formula: string;
  format: 'auto' | 'number' | 'percent' | 'ratio' | 'duration' | 'duration_hours' | 'date' | 'distance';
  isHidden: boolean;
  roundToK?: boolean;
}

export interface StatGroupConfig {
  id: string;
  title: string;
  icon: string;
  items: StatItemConfig[];
}

export const ICON_MAP: Record<string, any> = {
  Activity, Crosshair, Target, Skull, Coins, AlertCircle, Map, Swords, Home, MapPin,
  Search, User, Shield, Loader2, Trophy, Percent, Clock, Calendar, Settings, LogOut, Plus, Trash2, Save
};

export const ALLIANCE_MAP: Record<string, { name: string, color: string, bg: string }> = {
  'stalker': { name: 'Сталкеры', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  'bandit': { name: 'Бандиты', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  'duty': { name: 'Долг', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
  'freedom': { name: 'Свобода', color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
  'merc': { name: 'Наемники', color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  'covenant': { name: 'Завет', color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20' },
};

export const STAT_NAMES: Record<string, string> = {
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

export const DEFAULT_UI_CONFIG = {
  formats: [
    { id: 'auto', label: 'Автоматически', suffix: '', formula: 'x' },
    { id: 'number', label: 'Число', suffix: '', formula: 'x' },
    { id: 'ratio', label: 'Дробь (2 знака)', suffix: '', formula: 'x.toFixed(2)' },
    { id: 'percent', label: 'Процент', suffix: '%', formula: 'x.toFixed(1)' },
    { id: 'duration', label: 'Время (Дни и часы)', suffix: '', formula: 'Math.floor(x / 86400000) + " д. " + Math.floor((x / 3600000) % 24) + " ч."' },
    { id: 'duration_hours', label: 'Время (Только часы)', suffix: ' ч.', formula: 'Math.floor(x / 3600000)' },
    { id: 'date', label: 'Дата', suffix: '', formula: 'new Date(x)' },
    { id: 'distance', label: 'Дистанция (км)', suffix: ' км', formula: '(x / 100000).toFixed(1)' }
  ],
  colors: [
    { id: 'text-white', label: 'Белый', hex: '#ffffff' },
    { id: 'text-emerald-400', label: 'Изумрудный', hex: '#34d399' },
    { id: 'text-blue-400', label: 'Синий', hex: '#60a5fa' },
    { id: 'text-amber-400', label: 'Желтый', hex: '#fbbf24' },
    { id: 'text-red-400', label: 'Красный', hex: '#f87171' },
    { id: 'text-purple-400', label: 'Фиолетовый', hex: '#c084fc' }
  ]
};
