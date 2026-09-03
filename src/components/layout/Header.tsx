import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, Users, ArrowRightLeft } from 'lucide-react';

export const Header: React.FC = () => {
  const { household, users, activeUser, switchActiveUser } = useApp();

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: App Logo & Household */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-lg">
            🏓
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight">DuoDone</h1>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-indigo-500/30">
                PWA / Mini App
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" />
              {household.name || 'Наш дім'}
            </p>
          </div>
        </div>

        {/* Right: Partner Switcher (Interactive Demo mode) */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1.5 flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" />
          </span>
          <div className="flex space-x-1">
            {users.map((u) => {
              const isActive = u.id === activeUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchActiveUser(u.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  title={`Переключитися на роль: ${u.first_name}`}
                >
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt={u.first_name} className="w-4 h-4 rounded-full" />
                  ) : (
                    <span>👤</span>
                  )}
                  <span>{u.first_name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
