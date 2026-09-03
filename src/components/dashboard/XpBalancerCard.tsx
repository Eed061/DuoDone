import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Flame, Sparkles } from 'lucide-react';

export const XpBalancerCard: React.FC = () => {
  const { users, userXpMap, household } = useApp();

  if (users.length < 2) return null;

  const user1 = users[0];
  const user2 = users[1];

  const xp1 = userXpMap[user1.id] || 0;
  const xp2 = userXpMap[user2.id] || 0;

  const totalXp = xp1 + xp2;
  const pct1 = totalXp === 0 ? 50 : Math.round((xp1 / totalXp) * 100);
  const pct2 = totalXp === 0 ? 50 : 100 - pct1;

  const xpDiff = Math.abs(xp1 - xp2);
  let leaderText = 'Рівність балів! 🤝';
  if (xp1 > xp2) {
    leaderText = `+${xpDiff} XP на користь ${user1.first_name} 👑`;
  } else if (xp2 > xp1) {
    leaderText = `+${xpDiff} XP на користь ${user2.first_name} 👑`;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Балансир балів (XP-баланс)</h3>
            <p className="text-[11px] text-slate-400">Перетягування каната цього місяця</p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-700/60 text-slate-300 rounded-full border border-slate-600/40">
          Спільний залік
        </span>
      </div>

      {/* User Profiles & Current XP */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* User 1 */}
        <div className="flex items-center space-x-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40">
          <img
            src={user1.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry'}
            alt={user1.first_name}
            className="w-8 h-8 rounded-full border border-indigo-400/40"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user1.first_name}</p>
            <p className="text-sm font-extrabold text-indigo-400 flex items-center gap-1">
              {xp1} <span className="text-[10px] font-normal text-slate-400">XP</span>
            </p>
          </div>
        </div>

        {/* User 2 */}
        <div className="flex items-center justify-end space-x-2 bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/40 text-right">
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user2.first_name}</p>
            <p className="text-sm font-extrabold text-pink-400 flex items-center justify-end gap-1">
              {xp2} <span className="text-[10px] font-normal text-slate-400">XP</span>
            </p>
          </div>
          <img
            src={user2.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena'}
            alt={user2.first_name}
            className="w-8 h-8 rounded-full border border-pink-400/40"
          />
        </div>
      </div>

      {/* Progress Bar (Tug of War) */}
      <div className="relative mb-2.5">
        <div className="h-4 bg-slate-900 rounded-full overflow-hidden flex border border-slate-700/80 p-0.5">
          <div
            style={{ width: `${pct1}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-l-full transition-all duration-500 ease-out relative"
          >
            {pct1 > 15 && (
              <span className="absolute left-2 top-0 bottom-0 flex items-center text-[9px] font-bold text-white">
                {pct1}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${pct2}%` }}
            className="h-full bg-gradient-to-r from-pink-400 to-pink-600 rounded-r-full transition-all duration-500 ease-out relative"
          >
            {pct2 > 15 && (
              <span className="absolute right-2 top-0 bottom-0 flex items-center text-[9px] font-bold text-white">
                {pct2}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Leader status banner */}
      <div className="bg-slate-900/80 rounded-xl p-2 text-center border border-slate-700/50 flex items-center justify-center space-x-1.5">
        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-xs font-bold text-slate-200">{leaderText}</span>
      </div>
    </div>
  );
};
