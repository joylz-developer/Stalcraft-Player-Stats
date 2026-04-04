import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { FormulaInput } from './FormulaInput';
import { evaluateFormula, formatStatValue, formatCustomValue } from '../utils/formulas';
import { AttributeSidebar } from './AttributeSidebar';

export function EditAttributeModal({ 
  item, 
  onSave, 
  onClose, 
  previewLoading, 
  previewNickname, 
  setPreviewNickname, 
  previewRegion, 
  setPreviewRegion, 
  attributeSearch, 
  setAttributeSearch, 
  previewData,
  uiConfig
}: any) {
  const [editedItem, setEditedItem] = useState(item);
  const formulaRef = React.useRef<any>(null);

  const isInitialMount = React.useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onSave(editedItem);
  }, [editedItem]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleInsert = (attr: string) => {
    formulaRef.current?.insertAttribute(attr);
  };

  const previewValue = evaluateFormula(editedItem.formula, previewData?.stats || []);
  let formattedPreview = '—';
  if (editedItem.format === 'auto') {
    const match = editedItem.formula.match(/^\{([^}]+)\}$/);
    if (match && previewData?.stats) {
      const stat = previewData.stats.find((s: any) => s.id === match[1]);
      if (stat) {
        formattedPreview = formatStatValue(stat.id, stat.type, stat.value, editedItem.roundToK !== false);
      } else {
        formattedPreview = formatCustomValue(previewValue, 'number', uiConfig.formats, editedItem.roundToK !== false);
      }
    } else {
      formattedPreview = formatCustomValue(previewValue, 'number', uiConfig.formats, editedItem.roundToK !== false);
    }
  } else {
    formattedPreview = formatCustomValue(previewValue, editedItem.format, uiConfig.formats, editedItem.roundToK !== false);
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 w-full max-w-5xl flex flex-col lg:flex-row gap-6 max-h-[90vh] relative z-10 shadow-2xl"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Left side: Edit Form */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Редактирование атрибута</h2>
            <p className="text-sm text-zinc-400">Настройте название, формулу и формат отображения.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Название</label>
              <input
                type="text"
                value={editedItem.title}
                onChange={(e) => setEditedItem({ ...editedItem, title: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Например: K/D"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Формула расчета</label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 min-h-[100px]">
                <FormulaInput
                  ref={formulaRef}
                  value={editedItem.formula || ''}
                  onChange={(val: string) => setEditedItem({ ...editedItem, formula: val })}
                  placeholder="Введите формулу (напр. {kills} / {deaths})"
                  className="text-white font-mono text-sm outline-none"
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-zinc-500">
                  Используйте подсказки справа для вставки атрибутов.
                </p>
                <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-xs text-zinc-500">Результат:</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{formattedPreview}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Формат отображения</label>
              <div className="grid grid-cols-2 gap-2">
                {uiConfig.formats.map((opt: any) => (
                  <button
                    key={opt.id}
                    onClick={() => setEditedItem({ ...editedItem, format: opt.id })}
                    className={cn(
                      "px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left border",
                      editedItem.format === opt.id 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50" 
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {editedItem.color !== undefined && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Цвет акцента</label>
                <div className="grid grid-cols-3 gap-2">
                  {uiConfig.colors.map((opt: any) => (
                    <button
                      key={opt.id}
                      onClick={() => setEditedItem({ ...editedItem, color: opt.id })}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 border",
                        editedItem.color === opt.id 
                          ? "bg-zinc-800 text-white border-zinc-600" 
                          : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", opt.hex ? "" : opt.bgClass)} style={opt.hex ? { backgroundColor: opt.hex } : {}} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ПЕРЕКЛЮЧАТЕЛЬ ОКРУГЛЕНИЯ */}
            <div 
              onClick={() => setEditedItem({ ...editedItem, roundToK: editedItem.roundToK === false ? true : false })}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-800/80 transition-colors mt-2 select-none"
            >
              <div>
                <div className="text-sm font-medium text-zinc-200">Округлять до тысяч (к)</div>
                <div className="text-xs text-zinc-500 mt-0.5">Сокращает большие числа: 15 500 → 15.5к</div>
              </div>
              <div className={cn(
                "w-11 h-6 rounded-full transition-colors relative shrink-0",
                editedItem.roundToK !== false ? "bg-emerald-500" : "bg-zinc-700"
              )}>
                <div className={cn(
                  "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                  editedItem.roundToK !== false ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>

        {/* Right side: Attribute Sidebar */}
        <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-800 pt-6 lg:pt-0 lg:pl-6">
          <AttributeSidebar 
            previewLoading={previewLoading}
            previewNickname={previewNickname}
            setPreviewNickname={setPreviewNickname}
            previewRegion={previewRegion}
            setPreviewRegion={setPreviewRegion}
            attributeSearch={attributeSearch}
            setAttributeSearch={setAttributeSearch}
            previewData={previewData}
            focusedInput={{ insert: handleInsert }}
          />
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
