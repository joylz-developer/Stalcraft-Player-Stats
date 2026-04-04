import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ProfileData } from '../types';
import { STAT_NAMES } from '../constants';
import { formatStatValue } from '../utils/formulas';

export function AttributeTooltip({ previewData }: { previewData: ProfileData | null }) {
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, attr: string | null }>({ visible: false, x: 0, y: 0, attr: null });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Используем closest() для стабильного срабатывания при наведении
      const attrElement = target?.closest?.('[data-attr]') as HTMLElement;
      
      if (attrElement && attrElement.dataset && attrElement.dataset.attr) {
        setTooltip({
          visible: true,
          x: e.clientX,
          y: e.clientY,
          attr: attrElement.dataset.attr
        });
      } else {
        setTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!tooltip.visible || !tooltip.attr) return null;

  const name = STAT_NAMES[tooltip.attr] || tooltip.attr;
  const stat = previewData?.stats.find(s => s.id === tooltip.attr);
  const rawValue = stat ? stat.value : '—';
  const formattedValue = stat ? formatStatValue(stat.id, stat.type, stat.value) : '—';

  const x = Math.min(tooltip.x + 15, window.innerWidth - 220);
  const y = Math.min(tooltip.y + 15, window.innerHeight - 120);

  // Формируем саму верстку тултипа
  const tooltipContent = (
    <div 
      className="fixed z-[9999] pointer-events-none bg-zinc-900 border border-zinc-700 shadow-xl rounded-lg p-3 text-sm flex flex-col gap-1 min-w-[200px]"
      style={{ left: x, top: y }}
    >
      <div className="font-bold text-emerald-400 mb-1">{name}</div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-500">ID:</span>
        <span className="text-zinc-300 font-mono">{tooltip.attr}</span>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-zinc-500">Значение:</span>
        <span className="text-zinc-300 font-mono">{String(rawValue)}</span>
      </div>
      {stat && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500">Формат:</span>
          <span className="text-zinc-300 font-mono">{formattedValue}</span>
        </div>
      )}
    </div>
  );

  // Возвращаем тултип через createPortal, чтобы вытащить его из родительских div-ов 
  // прямо в корень документа. Функция createPortal у вас уже импортирована в файле.
  return createPortal(tooltipContent, document.body);
}
