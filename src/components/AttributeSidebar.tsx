import React from 'react';
import { Activity, Loader2, ChevronDown, Search } from 'lucide-react';
import { Region, ProfileData } from '../types';
import { STAT_NAMES } from '../constants';
import { formatStatValue } from '../utils/formulas';

export function AttributeSidebar({ 
  previewLoading, 
  previewNickname, 
  setPreviewNickname, 
  previewRegion, 
  setPreviewRegion, 
  attributeSearch, 
  setAttributeSearch, 
  previewData, 
  focusedInput 
}: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sticky top-4 h-full max-h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Атрибуты</h3>
        </div>
        {previewLoading && <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />}
      </div>
      
      <div className="mb-3 flex gap-2 shrink-0">
        <input
          type="text"
          value={previewNickname}
          onChange={(e) => setPreviewNickname(e.target.value)}
          placeholder="Никнейм для предпросмотра"
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none"
        />
        <div className="relative w-20 shrink-0">
          <select
            value={previewRegion}
            onChange={(e) => setPreviewRegion(e.target.value as Region)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-6 py-2 text-xs text-white focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
          >
            <option value="ru">RU</option>
            <option value="eu">EU</option>
            <option value="na">NA</option>
            <option value="sea">SEA</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </div>
        </div>
      </div>

      <div className="mb-3 relative shrink-0">
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

      <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
        {Object.entries(STAT_NAMES)
          .filter(([key, name]) => 
            key.toLowerCase().includes(attributeSearch.toLowerCase()) || 
            name.toLowerCase().includes(attributeSearch.toLowerCase())
          )
          .map(([key, name]) => {
            const stat = previewData?.stats.find((s: any) => s.id === key);
            return (
              <div 
                key={key} 
                onClick={() => {
                  if (focusedInput?.insert) {
                    focusedInput.insert(key);
                  }
                }}
                className="group flex flex-col p-2 rounded-lg hover:bg-zinc-900 cursor-pointer transition-colors border border-transparent hover:border-zinc-800"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-emerald-400 transition-colors">{name}</span>
                  <span className="text-[10px] text-zinc-600 font-mono bg-zinc-900/50 px-1.5 py-0.5 rounded">{key}</span>
                </div>
                {stat && (
                  <div className="mt-1 text-xs text-zinc-500 flex justify-between">
                    <span>Значение:</span>
                    <span className="font-mono text-zinc-400">{formatStatValue(stat.id, stat.type, stat.value)}</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
