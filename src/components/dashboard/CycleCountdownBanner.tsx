import React from 'react';
import { useApp } from '../../context/AppContext';
import { Timer, Trophy, Sparkles, ArrowRight, Gift } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

interface CycleCountdownBannerProps {
  onOpenRoulette: () => void;
}

export const getUkrainianDaysText = (days: number): string => {
  const abs = Math.abs(days);
  const lastDigit = abs % 10;
  const lastTwoDigits = abs % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'днів';
  if (lastDigit === 1) return 'день';
  if (lastDigit >= 2 && lastDigit <= 4) return 'дні';
  return 'днів';
};

export const CycleCountdownBanner: React.FC<CycleCountdownBannerProps> = ({ onOpenRoulette }) => {
  const { household, activeUser, partnerUser, userXpMap } = useApp();

  const cycleType = household.cycle_type || 'monthly';
  if (cycleType === 'off') return null;

  const endDate = household.period_end_date ? new Date(household.period_end_date).getTime() : 0;
  const now = Date.now();
  const diffMs = endDate - now;
  const remainingDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const activeXp = userXpMap[activeUser.id] || 0;
  const partnerXp = userXpMap[partnerUser.id] || 0;
  const isWinner = activeXp > partnerXp;
  const isTie = activeXp === partnerXp;

  const handleClick = () => {
    triggerHaptic('medium');
    onOpenRoulette();
  };

  // Cycle finished state
  if (remainingDays <= 0) {
    return (
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-purple-950/90 border-2 border-amber-500/60 rounded-2xl p-4 shadow-2xl relative overflow-hidden animate-pulse mb-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-start space-x-3 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {isWinner ? '👑' : isTie ? '🤝' : '⚡'}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">
                Раунд Завершено! 🏆
              </span>
            </div>

            <h3 className="font-extrabold text-white text-sm leading-snug">
              {isWinner
                ? 'Ви чудово попрацювали цього циклу! 🌟'
                : isTie
                ? 'Нічия в балах! Рівна боротьба 🤝'
                : 'Нажаль, цього циклу удача була на боці партнера...'}
            </h3>

            <p className="text-xs text-slate-300 font-medium">
              {isWinner
                ? 'Час крутнути Колесо Фортуни для отримання заслуженого призу! 🎁'
                : isTie
                ? 'Обоє заслуговуєте на нагороду! Крутіть рулетку 🎡'
                : 'Крутніть колесо покарання або привітайте переможця ⚡'}
            </p>

            <button
              onClick={handleClick}
              className="mt-2.5 w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Gift className="w-4 h-4" />
              <span>Перейти до Рулетки 🎡</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active cycle countdown state
  return (
    <div
      onClick={handleClick}
      className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/40 hover:border-indigo-400/70 rounded-2xl p-3.5 shadow-xl relative overflow-hidden cursor-pointer active:scale-[0.99] transition-all mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-white text-xs tracking-tight">
                ⏳ До кінця циклу:
              </span>
              <span className="font-black text-amber-400 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30">
                {remainingDays} {getUkrainianDaysText(remainingDays)}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 font-medium mt-0.5 flex items-center space-x-1">
              <span>
                {activeXp > partnerXp ? (
                  <>Ви лідируєте з <strong className="text-emerald-400">{activeXp} XP</strong> (партнер {partnerXp} XP)</>
                ) : activeXp < partnerXp ? (
                  <>Лідирує {partnerUser.first_name} з <strong className="text-amber-400">{partnerXp} XP</strong> (у вас {activeXp} XP)</>
                ) : (
                  <>Рівна кількість балів: <strong className="text-indigo-300">{activeXp} XP</strong></>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white shrink-0">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
