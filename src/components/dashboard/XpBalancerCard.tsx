import React from 'react';
import { useApp } from '../../context/AppContext';
import { Trophy, Flame, Zap, Swords } from 'lucide-react';

export const XpBalancerCard: React.FC = () => {
  const { users, userXpMap } = useApp();

  if (users.length < 2) return null;

  const user1 = users[0];
  const user2 = users[1];

  const xp1 = userXpMap[user1.id] || 0;
  const xp2 = userXpMap[user2.id] || 0;

  const totalXp = xp1 + xp2;
  const pct1 = totalXp === 0 ? 50 : Math.round((xp1 / totalXp) * 100);
  const pct2 = totalXp === 0 ? 50 : 100 - pct1;

  const xpDiff = Math.abs(xp1 - xp2);
  let leaderText = 'Рівність балів! 🤝 Нічия в боротьбі';
  if (xp1 > xp2) {
    leaderText = `+${xpDiff} XP на користь ${user1.first_name} 👑`;
  } else if (xp2 > xp1) {
    leaderText = `+${xpDiff} XP на користь ${user2.first_name} 👑`;
  }

  return (
    <div className="p-[2px] rounded-3xl bg-gradient-to-r from-amber-400 via-purple-500 to-pink-500 shadow-2xl shadow-purple-500/20 relative overflow-hidden transition-transform duration-300 hover:scale-[1.01]">
      {/* Outer Glow Overlay */}
      <div className="bg-slate-950/95 backdrop-blur-xl rounded-[22px] p-4 relative overflow-hidden">
        {/* Ambient Lighting Background Effect */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-20 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Distinctive Header Arena Badge */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/30">
              <Swords className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-black text-white text-sm tracking-tight uppercase">
                  XP Балансир
                </h3>
                <span className="bg-amber-400/20 text-amber-300 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-amber-400/30 uppercase tracking-widest">
                  АРЕНА
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Перетягування каната балів</p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900/90 px-2.5 py-1 rounded-full border border-amber-500/30 text-amber-300 text-[10px] font-extrabold shadow-inner">
            <Trophy className="w-3 h-3 text-amber-400 animate-bounce" />
            <span>Сезон</span>
          </div>
        </div>

        {/* User Profiles & XP Scores */}
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          {/* User 1 Arena Pill */}
          <div className="flex items-center space-x-2.5 bg-gradient-to-r from-indigo-950/80 to-slate-900/80 p-3 rounded-2xl border border-indigo-500/40 shadow-inner">
            <img
              src={user1.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Dmitry'}
              alt={user1.first_name}
              className="w-9 h-9 rounded-full object-cover border-2 border-indigo-400 shadow-md shrink-0"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold text-slate-200 truncate">{user1.first_name}</p>
              <p className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-indigo-100 flex items-center gap-1 leading-none mt-0.5">
                {xp1} <span className="text-[10px] font-bold text-indigo-400/80">XP</span>
              </p>
            </div>
          </div>

          {/* User 2 Arena Pill */}
          <div className="flex items-center justify-end space-x-2.5 bg-gradient-to-l from-pink-950/80 to-slate-900/80 p-3 rounded-2xl border border-pink-500/40 shadow-inner text-right">
            <div className="overflow-hidden">
              <p className="text-xs font-extrabold text-slate-200 truncate">{user2.first_name}</p>
              <p className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-100 to-pink-300 flex items-center justify-end gap-1 leading-none mt-0.5">
                {xp2} <span className="text-[10px] font-bold text-pink-400/80">XP</span>
              </p>
            </div>
            <img
              src={user2.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Elena'}
              alt={user2.first_name}
              className="w-9 h-9 rounded-full object-cover border-2 border-pink-400 shadow-md shrink-0"
            />
          </div>
        </div>

        {/* 3D Tug-of-War Neon Progress Track */}
        <div className="relative mb-3 pt-1">
          <div className="h-5 bg-slate-950 rounded-full overflow-hidden flex border-2 border-slate-800 p-0.5 shadow-inner relative">
            {/* Left Bar (Indigo) */}
            <div
              style={{ width: `${pct1}%` }}
              className="h-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 rounded-l-full transition-all duration-700 ease-out relative flex items-center justify-start pl-2"
            >
              {pct1 > 18 && (
                <span className="text-[10px] font-black text-white drop-shadow">
                  {pct1}%
                </span>
              )}
            </div>

            {/* Right Bar (Pink) */}
            <div
              style={{ width: `${pct2}%` }}
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 rounded-r-full transition-all duration-700 ease-out relative flex items-center justify-end pr-2"
            >
              {pct2 > 18 && (
                <span className="text-[10px] font-black text-white drop-shadow">
                  {pct2}%
                </span>
              )}
            </div>

            {/* Center Dynamic Lightning Pin */}
            <div
              style={{ left: `${pct1}%` }}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg shadow-amber-400/50 border-2 border-slate-950 transition-all duration-700 ease-out z-10"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-slate-950" />
            </div>
          </div>
        </div>

        {/* Glowing Leader Status Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/60 to-slate-900 rounded-xl p-2.5 text-center border border-amber-400/40 flex items-center justify-center space-x-2 shadow-inner">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-400/30 animate-pulse" />
          <span className="text-xs font-black text-amber-200 tracking-tight">{leaderText}</span>
        </div>
      </div>
    </div>
  );
};
