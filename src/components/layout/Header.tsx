import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, ArrowRightLeft, Edit2, Check, X } from 'lucide-react';

export const Header: React.FC = () => {
  const { household, users, activeUser, partnerUser, switchActiveUser, updateHousehold } = useApp();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(activeUser.first_name);

  const handleSaveName = () => {
    if (tempName.trim()) {
      activeUser.first_name = tempName.trim();
      setIsEditingName(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: App Logo & Household Name */}
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-base">
            🏓
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight">DuoDone</h1>
              <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" />
              {household.name || 'Наш дім'}
            </p>
          </div>
        </div>

        {/* Right: Partner Role Quick Switcher (Zero friction) */}
        <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/60">
          {users.map((u) => {
            const isActive = u.id === activeUser.id;
            return (
              <button
                key={u.id}
                onClick={() => switchActiveUser(u.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Грати як ${u.first_name}`}
              >
                <span>{u.id === users[0]?.id ? '👨' : '👩'}</span>
                <span>{u.first_name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
