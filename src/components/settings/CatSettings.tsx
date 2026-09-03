import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, ToggleLeft, ToggleRight, MessageSquare, Cat } from 'lucide-react';
import { CatCounselor } from '../common/CatCounselor';

export const CatSettings: React.FC = () => {
  const { household, updateHousehold } = useApp();
  const [showTestPopup, setShowTestPopup] = useState(false);

  const isEnabled = household.cat_counselor_enabled !== false;
  const currentName = household.cat_counselor_name || 'Мур-Амур';

  const nameOptions = ['Мур-Амур', 'Ді-Ді', 'Барсік Всемогутній', 'Пушистик'];

  const toggleEnabled = () => {
    updateHousehold({ cat_counselor_enabled: !isEnabled });
  };

  const handleSelectName = (name: string) => {
    updateHousehold({ cat_counselor_name: name });
  };

  return (
    <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg space-y-3.5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-xl">
            🐱
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Консультант-Котик</h3>
            <p className="text-xs text-slate-400">Кумедні мотивуючі поради для підтримки миру</p>
          </div>
        </div>

        <button
          onClick={toggleEnabled}
          className="text-2xl transition-transform active:scale-95"
          title={isEnabled ? 'Вимкнути котика' : 'Увімкнути котика'}
        >
          {isEnabled ? (
            <ToggleRight className="w-8 h-8 text-amber-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-500" />
          )}
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-3 animate-fadeIn">
          {/* Name Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1.5 block">
              Оберіть ім'я вашого котика:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {nameOptions.map((name) => {
                const isSelected = currentName === name;
                return (
                  <button
                    key={name}
                    onClick={() => handleSelectName(name)}
                    className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400/80 shadow-sm'
                        : 'bg-slate-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span>🐾</span>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trigger on demand */}
          <button
            onClick={() => setShowTestPopup(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <MessageSquare className="w-4 h-4 stroke-[2.5px]" />
            <span>Попросити пораду прямо зараз 🐾</span>
          </button>
        </div>
      )}

      {/* Test Popup on Demand */}
      {showTestPopup && (
        <CatCounselor
          forceShow={true}
          onForceClose={() => setShowTestPopup(false)}
        />
      )}
    </div>
  );
};
