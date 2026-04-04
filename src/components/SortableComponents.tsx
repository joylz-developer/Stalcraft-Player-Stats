import React from 'react';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, Activity } from 'lucide-react';
import { ICON_MAP } from '../constants';
import { cn } from '../utils/cn';
import { evaluateFormula, formatStatValue, formatCustomValue } from '../utils/formulas';
import { useStore } from '../store/useStore';

export function SortableStatGroup({ group, groupIdx, statsItems, setStatsItems, updateStatGroup, removeStatGroup, addStatItem, removeStatItem, updateStatItem, setFocusedInput, isEditMode, onEditItem, previewData }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 50, opacity: 0.5 } : {})
  };

  const Icon = ICON_MAP[group.icon as keyof typeof ICON_MAP] || Activity;

  return (
    <div ref={setNodeRef} style={style} className="group/block bg-zinc-900/50 border border-zinc-800/50 rounded-3xl flex flex-col relative h-full">
      {/* Hover actions for the block */}
      {isEditMode && (
        <div className="absolute top-4 right-4 opacity-0 group-hover/block:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-2 bg-zinc-900/90 p-1 rounded-lg backdrop-blur-sm border border-zinc-800 z-10">
          <div {...attributes} {...listeners} className="p-1.5 cursor-grab text-zinc-400 hover:text-white touch-none">
            <GripVertical className="w-4 h-4" />
          </div>
          <button onClick={(e) => { e.preventDefault(); removeStatGroup(groupIdx); }} className="p-1.5 text-zinc-400 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="px-6 py-4 border-b border-zinc-800/50 bg-zinc-900/50 flex items-center gap-3 rounded-t-3xl">
        <div className="p-2 bg-zinc-800 rounded-xl relative group/icon">
          <Icon className="h-5 w-5 text-emerald-500" />
          {isEditMode && (
            <select
              value={group.icon}
              onChange={(e) => updateStatGroup(groupIdx, 'icon', e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer"
            >
              {Object.keys(ICON_MAP).map(iconName => (
                <option key={iconName} value={iconName}>{iconName}</option>
              ))}
            </select>
          )}
        </div>
        <input
          type="text"
          value={group.title}
          onChange={(e) => updateStatGroup(groupIdx, 'title', e.target.value)}
          placeholder="Название блока"
          className="font-semibold text-zinc-100 bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-500/50 rounded px-1 w-full max-w-[200px]"
          readOnly={!isEditMode}
        />
      </div>
      <div className="p-2 flex-1">
        <div className="w-full text-sm">
          <SortableContext items={group.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col w-full">
              {group.items.map((item: any) => {
                const originalIndex = statsItems[groupIdx].items.findIndex((i: any) => i.id === item.id);
                return (
                  <SortableStatItem 
                    key={item.id} 
                    item={item} 
                    groupIdx={groupIdx} 
                    itemIdx={originalIndex} 
                    statsItems={statsItems}
                    setStatsItems={setStatsItems}
                    removeStatItem={removeStatItem}
                    updateStatItem={updateStatItem}
                    setFocusedInput={setFocusedInput}
                    isLast={originalIndex === group.items.length - 1}
                    isEditMode={isEditMode}
                    onEditItem={onEditItem}
                    previewData={previewData}
                  />
                );
              })}
            </div>
          </SortableContext>
        </div>
        {isEditMode && (
          <button
            onClick={() => addStatItem(groupIdx)}
            className="mt-2 w-full py-2 bg-zinc-800/30 hover:bg-zinc-800/50 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1 border border-dashed border-zinc-700/50"
          >
            <Plus className="w-4 h-4" />
            Добавить атрибут
          </button>
        )}
      </div>
    </div>
  );
}

export function SortableStatItem({ item, groupIdx, itemIdx, statsItems, setStatsItems, removeStatItem, updateStatItem, setFocusedInput, isLast, isEditMode, onEditItem, previewData }: any) {
  const { uiConfig } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 50, opacity: 0.5 } : {})
  };

  const previewValue = evaluateFormula(item.formula, previewData?.stats || []);
  let displayVal = '—';
  if (item.format === 'auto') {
      const match = item.formula.match(/^\{([^}]+)\}$/);
      if (match && previewData?.stats) {
        const stat = previewData.stats.find((s: any) => s.id === match[1]);
        if (stat) {
          displayVal = formatStatValue(stat.id, stat.type, stat.value, item.roundToK !== false);
        } else {
          displayVal = formatCustomValue(previewValue, 'number', uiConfig.formats, item.roundToK !== false);
        }
      } else {
        displayVal = formatCustomValue(previewValue, 'number', uiConfig.formats, item.roundToK !== false);
      }
  } else {
      displayVal = formatCustomValue(previewValue, item.format, uiConfig.formats, item.roundToK !== false);
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onDoubleClick={(e) => {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
        onEditItem(item, groupIdx, itemIdx);
      }}
      className={cn(
        "group/item transition-colors hover:bg-zinc-800/30 relative flex w-full items-center cursor-pointer select-none",
        !isLast && "border-b border-zinc-800/30"
      )}
    >
      <div className="py-2 px-4 w-full flex items-center justify-between gap-2">
        {isEditMode && (
          <div {...attributes} {...listeners} className="absolute left-1 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 cursor-grab text-zinc-500 hover:text-white touch-none transition-opacity shrink-0 bg-zinc-900/80 p-1 rounded backdrop-blur-sm z-10">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="text-zinc-400 break-words flex-1 pl-4">
          {item.title || 'Без названия'}
        </div>
        <div className="text-zinc-500 font-mono text-xs break-words flex-1 text-right pr-4">
          {displayVal}
        </div>
        {isEditMode && (
          <div className="absolute right-2 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg backdrop-blur-sm border border-zinc-800 z-10">
            <button onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeStatItem(groupIdx, itemIdx); }} className="p-1 text-zinc-500 hover:text-red-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SortableHighlightItem({ item, idx, updateItem, removeItem, setFocusedInput, isEditMode, onEditItem, previewData }: any) {
  const { uiConfig } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    ...(isDragging ? { position: 'relative' as const, zIndex: 50, opacity: 0.5 } : {})
  };

  const previewValue = evaluateFormula(item.formula, previewData?.stats || []);
  const displayVal = formatCustomValue(previewValue, item.format, uiConfig.formats, item.roundToK !== false);
  const colorObj = uiConfig.colors.find((c: any) => c.id === item.color);
  const hexColor = colorObj ? colorObj.hex : undefined;
  const legacyBgClass = !colorObj && item.color ? item.color.replace('text-', 'bg-') : 'bg-white';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      onDoubleClick={(e) => {
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
        onEditItem(item, null, idx);
      }}
      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center cursor-pointer hover:border-zinc-700 transition-colors relative group/hl select-none"
    >
      {isEditMode && (
        <div {...attributes} {...listeners} className="absolute left-2 opacity-0 group-hover/hl:opacity-100 cursor-grab text-zinc-500 hover:text-white touch-none transition-opacity bg-zinc-900/80 p-1 rounded backdrop-blur-sm z-10">
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-between w-full pl-6 pr-8">
        <div className="flex items-center gap-4">
          <div className={cn("w-3 h-3 rounded-full", hexColor ? "" : legacyBgClass)} style={hexColor ? { backgroundColor: hexColor } : {}} />
          <span className="text-zinc-300 font-medium">{item.title || 'Без названия'}</span>
        </div>
        <div className="text-zinc-500 font-mono text-xs break-words max-w-[200px] text-right">
          {displayVal}
        </div>
      </div>

      {isEditMode && (
        <button 
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeItem(idx); }} 
          className="absolute right-4 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover/hl:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
