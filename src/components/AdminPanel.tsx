import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Loader2, Trash2, Plus, Save } from 'lucide-react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  rectSortingStrategy 
} from '@dnd-kit/sortable';

import { cn } from '../utils/cn';
import { Region, ProfileData, UserData, HighlightConfig, StatGroupConfig, StatItemConfig } from '../types';
import { SortableHighlightItem, SortableStatGroup } from './SortableComponents';
import { EditAttributeModal } from './EditAttributeModal';
import { AttributeTooltip } from './AttributeTooltip';

export function AdminPanel({ config, statsConfig, uiConfig, myCharacters, onSave, onClose, addToast }: { config: HighlightConfig[], statsConfig: StatGroupConfig[], uiConfig: any, myCharacters: any[], onSave: (c: HighlightConfig[], s: StatGroupConfig[], u: any) => void, onClose: () => void, addToast: (msg: string, type?: 'success'|'error') => void }) {
  const [activeTab, setActiveTab] = useState<'highlights' | 'stats' | 'users' | 'ui_settings'>('highlights');
  const [items, setItems] = useState<HighlightConfig[]>(config.map((c, i) => ({ ...c, id: c.id || `h_${Date.now()}_${i}` })));
  const [statsItems, setStatsItems] = useState<StatGroupConfig[]>(statsConfig);
  const [localUiConfig, setLocalUiConfig] = useState(() => {
    const formats = (uiConfig.formats || []).map((fmt: any) => {
      if (fmt.formula) {
        let f = fmt.formula;
        if (f.includes('toLocaleString')) {
          f = f.replace(/\.toLocaleString\("ru-RU",\s*\{\s*minimumFractionDigits:\s*(\d+),\s*maximumFractionDigits:\s*\d+\s*\}\)/g, '.toFixed($1)');
          f = f.replace(/\.toLocaleString\("ru-RU",\s*\{\s*maximumFractionDigits:\s*(\d+)\s*\}\)/g, '.toFixed($1)');
        }
        if (f.includes('toLocaleDateString')) {
          f = f.replace(/\.toLocaleDateString\("ru-RU"\)/g, '');
        }
        return { ...fmt, formula: f };
      }
      let formula = 'x';
      if (fmt.special === 'duration') formula = 'Math.floor(x / 86400000) + " д. " + Math.floor((x / 3600000) % 24) + " ч."';
      else if (fmt.special === 'duration_hours') formula = 'Math.floor(x / 3600000)';
      else if (fmt.special === 'date') formula = 'new Date(x)';
      else if (fmt.special === 'distance') formula = `(x / 100000).toFixed(${fmt.decimals || 1})`;
      else if (fmt.id === 'ratio') formula = 'x.toFixed(2)';
      else if (fmt.id === 'percent') formula = 'x.toFixed(1)';
      else {
        if (fmt.multiplier && fmt.multiplier !== 1) formula = `x * ${fmt.multiplier}`;
        if (fmt.decimals) formula = `(${formula}).toFixed(${fmt.decimals})`;
      }
      return { ...fmt, formula };
    });
    return { ...uiConfig, formats };
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [focusedInput, setFocusedInput] = useState<{ type: 'highlight' | 'stat', groupIndex?: number, itemIndex: number, ref?: HTMLInputElement | null, insert?: (attr: string) => void } | null>(null);
  const [attributeSearch, setAttributeSearch] = useState('');
  const [previewData, setPreviewData] = useState<ProfileData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewNickname, setPreviewNickname] = useState('');
  const [previewRegion, setPreviewRegion] = useState<Region>('ru');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState<{ groupIdx: number | null, itemIdx: number, item: any } | null>(null);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onSaveRef.current(items, statsItems, localUiConfig);
    }, 1000);
    return () => clearTimeout(timer);
  }, [items, statsItems, localUiConfig]);

  const onEditItem = (item: any, groupIdx: number | null, itemIdx: number) => {
    setEditingItem({ item, groupIdx, itemIdx });
  };

  useEffect(() => {
    if (myCharacters.length > 0 && !previewNickname) {
      setPreviewNickname(myCharacters[0].name);
      setPreviewRegion(myCharacters[0].region);
    }
  }, [myCharacters]);

  useEffect(() => {
    if ((activeTab === 'highlights' || activeTab === 'stats') && previewNickname) {
      const timer = setTimeout(() => {
        setPreviewLoading(true);
        axios.get(`/api/profile/${previewRegion}/${encodeURIComponent(previewNickname)}`)
          .then(res => setPreviewData(res.data))
          .catch(err => {
            console.error('Preview fetch error', err);
            setPreviewData(null);
          })
          .finally(() => setPreviewLoading(false));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, previewNickname, previewRegion]);

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
      addToast('Роль успешно изменена');
    } catch (e: any) {
      addToast(e.response?.data?.error || 'Ошибка при изменении роли', 'error');
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), title: 'Новый стат', formula: '{kil}', color: 'text-white', format: 'number' }]);
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
    if (!focusedInput) return;
    
    if (focusedInput.insert) {
      focusedInput.insert(key);
      return;
    }
    
    // Fallback for old inputs if any
    if (focusedInput.ref) {
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
      
      setTimeout(() => {
        input.focus();
        const newPos = start + attribute.length;
        input.setSelectionRange(newPos, newPos);
      }, 0);
    }
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
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
    newGroups[groupIndex].items[itemIndex].isHidden = true;
    setStatsItems(newGroups);
  };

  return (
    <>
      <AttributeTooltip previewData={previewData} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 w-full shadow-2xl"
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
        <button
          onClick={() => setActiveTab('ui_settings')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            activeTab === 'ui_settings' ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Настройки UI
        </button>
      </div>

      {(activeTab === 'highlights' || activeTab === 'stats') && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {activeTab === 'highlights' && (
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id as string)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4 pr-2">
                    {items.map((item, idx) => (
                      <SortableHighlightItem
                        key={item.id}
                        item={item}
                        idx={idx}
                        updateItem={updateItem}
                        removeItem={removeItem}
                        setFocusedInput={setFocusedInput}
                        isEditMode={isEditMode}
                        onEditItem={onEditItem}
                        previewData={previewData}
                        uiConfig={localUiConfig}
                      />
                    ))}
                  </div>
                </SortableContext>
                <div className="flex justify-between items-center border-t border-zinc-800 pt-6 mt-4">
                  <div className="flex items-center gap-4">
                    {isEditMode && (
                      <button
                        onClick={addItem}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить показатель
                      </button>
                    )}
                  </div>
                </div>
              </DndContext>
            )}

            {activeTab === 'stats' && (
              <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <SortableContext items={statsItems.map(g => g.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pr-2">
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
                      isEditMode={isEditMode}
                      onEditItem={onEditItem}
                      previewData={previewData}
                      uiConfig={localUiConfig}
                    />
                  ))}
                  
                  {/* Hidden items block */}
                  <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-4 space-y-4 col-span-full">
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
                <div className="flex justify-between items-center border-t border-zinc-800 pt-6 mt-4">
                  <div className="flex items-center gap-4">
                    {isEditMode && (
                      <button
                        onClick={addStatGroup}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить блок
                      </button>
                    )}
                  </div>
                </div>
              </DndContext>
            )}
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

      {activeTab === 'ui_settings' && (
        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Форматы отображения</h3>
            <div className="space-y-2">
              {localUiConfig.formats.map((fmt: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center bg-zinc-900 p-2 rounded-lg">
                  <input value={fmt.label} onChange={e => {
                    const newFormats = [...localUiConfig.formats];
                    newFormats[idx].label = e.target.value;
                    setLocalUiConfig({ ...localUiConfig, formats: newFormats });
                  }} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white flex-1" placeholder="Название" />
                  <input value={fmt.suffix || ''} onChange={e => {
                    const newFormats = [...localUiConfig.formats];
                    newFormats[idx].suffix = e.target.value;
                    setLocalUiConfig({ ...localUiConfig, formats: newFormats });
                  }} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white w-24" placeholder="Суффикс (напр. %)" />
                  <input value={fmt.formula || 'x'} onChange={e => {
                    const newFormats = [...localUiConfig.formats];
                    newFormats[idx].formula = e.target.value;
                    setLocalUiConfig({ ...localUiConfig, formats: newFormats });
                  }} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white flex-1 font-mono" placeholder="Формула (напр. x * 100)" title="JavaScript формула, где x - исходное значение" />
                  <button onClick={() => {
                    if (fmt.id === 'auto') return addToast('Нельзя удалить автоматический формат', 'error');
                    const newFormats = localUiConfig.formats.filter((_: any, i: number) => i !== idx);
                    setLocalUiConfig({ ...localUiConfig, formats: newFormats });
                  }} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
              <button onClick={() => {
                const newId = 'custom_' + Date.now();
                setLocalUiConfig({
                  ...localUiConfig,
                  formats: [...localUiConfig.formats, { id: newId, label: 'Новый формат', suffix: '', formula: 'x' }]
                });
              }} className="text-sm text-emerald-400 flex items-center gap-1 mt-2"><Plus className="w-4 h-4"/> Добавить формат</button>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Цвета акцента</h3>
            <div className="space-y-2">
              {localUiConfig.colors.map((col: any, idx: number) => (
                <div key={idx} className="flex gap-2 items-center bg-zinc-900 p-2 rounded-lg">
                  <div className={cn("w-4 h-4 rounded-full shrink-0", col.hex ? "" : col.bgClass)} style={col.hex ? { backgroundColor: col.hex } : {}} />
                  <input value={col.label} onChange={e => {
                    const newColors = [...localUiConfig.colors];
                    newColors[idx].label = e.target.value;
                    setLocalUiConfig({ ...localUiConfig, colors: newColors });
                  }} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-white flex-1" placeholder="Название" />
                  <input type="color" value={col.hex || '#ffffff'} onChange={e => {
                    const newColors = [...localUiConfig.colors];
                    newColors[idx].hex = e.target.value;
                    setLocalUiConfig({ ...localUiConfig, colors: newColors });
                  }} className="bg-zinc-950 border border-zinc-800 rounded p-0 w-10 h-8 cursor-pointer" title="Выбрать цвет" />
                  <button onClick={() => {
                    const newColors = localUiConfig.colors.filter((_: any, i: number) => i !== idx);
                    setLocalUiConfig({ ...localUiConfig, colors: newColors });
                  }} className="p-2 text-red-400 hover:bg-red-400/10 rounded"><Trash2 className="w-4 h-4"/></button>
                </div>
              ))}
              <button onClick={() => {
                const newId = 'color_' + Date.now();
                setLocalUiConfig({
                  ...localUiConfig,
                  colors: [...localUiConfig.colors, { id: newId, label: 'Новый цвет', hex: '#ffffff' }]
                });
              }} className="text-sm text-emerald-400 flex items-center gap-1 mt-2"><Plus className="w-4 h-4"/> Добавить цвет</button>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {editingItem && (
          <EditAttributeModal
            item={editingItem.item}
            uiConfig={localUiConfig}
            onSave={(updatedItem: any) => {
              // Update the item in statsItems or items
              if (activeTab === 'stats') {
                setStatsItems(statsItems.map(group => ({
                  ...group,
                  items: group.items.map(i => i.id === updatedItem.id ? updatedItem : i)
                })));
              } else {
                setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
              }
            }}
            onClose={() => setEditingItem(null)}
            previewLoading={previewLoading}
            previewNickname={previewNickname}
            setPreviewNickname={setPreviewNickname}
            previewRegion={previewRegion}
            setPreviewRegion={setPreviewRegion}
            attributeSearch={attributeSearch}
            setAttributeSearch={setAttributeSearch}
            previewData={previewData}
          />
        )}
      </AnimatePresence>

      {/* Floating Edit Mode Button */}
      {(activeTab === 'highlights' || activeTab === 'stats') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "px-6 py-3 rounded-full font-medium shadow-2xl transition-all flex items-center gap-2 border",
              isEditMode 
                ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/50" 
                : "bg-zinc-900/90 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200 backdrop-blur-md"
            )}
          >
            {isEditMode ? <Save className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
            {isEditMode ? "Выйти из редактирования" : "Режим редактирования"}
          </button>
        </div>
      )}
    </motion.div>
    </>
  );
}
