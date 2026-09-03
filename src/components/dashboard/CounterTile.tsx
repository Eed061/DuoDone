import React from 'react';
import { Counter } from '../../types';
import { Plus, Camera, Info } from 'lucide-react';

interface CounterTileProps {
  counter: Counter;
  onIncrement: (counter: Counter) => void;
  onOpenDetails: (counter: Counter) => void;
}

export const CounterTile: React.FC<CounterTileProps> = ({ counter, onIncrement, onOpenDetails }) => {
  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:border-slate-600 transition-all duration-200">
      {/* Top row: Icon, title, info button */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
            {counter.icon}
          </div>
          <div>
            <h4 className="font-bold text-white text-sm tracking-tight leading-tight">{counter.title}</h4>
            {counter.photo_mode === 'required' && (
              <span className="text-[10px] text-pink-400 font-semibold flex items-center gap-0.5 mt-0.5">
                <Camera className="w-2.5 h-2.5" /> Фото доказ
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onOpenDetails(counter)}
          className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
          title="Історія та статистика"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Counter number & Increment Button */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Всього</span>
          <p className="text-2xl font-black text-white tracking-tight leading-none mt-0.5">
            {counter.total_count}
          </p>
        </div>

        <button
          onClick={() => onIncrement(counter)}
          className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold flex items-center justify-center shadow-lg shadow-indigo-600/25 active:scale-95 transition-transform"
          title="Додати +1"
        >
          {counter.photo_mode === 'required' ? (
            <Camera className="w-5 h-5" />
          ) : (
            <Plus className="w-6 h-6 stroke-[3px]" />
          )}
        </button>
      </div>
    </div>
  );
};
