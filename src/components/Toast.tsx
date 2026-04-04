import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';
import { ToastMessage } from '../types';

export function Toast({ toast, onClose }: { toast: ToastMessage, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg overflow-hidden relative pointer-events-auto flex flex-col w-64 animate-in slide-in-from-right-8 fade-in duration-300">
      <div className="p-3 flex justify-between items-center">
        <span className={cn("text-sm font-medium", toast.type === 'error' ? 'text-red-400' : 'text-emerald-400')}>
          {toast.message}
        </span>
        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-1 bg-zinc-700 w-full">
        <div className={cn("h-full", toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: '100%', animation: 'shrink 3s linear forwards' }} />
      </div>
    </div>
  );
}
