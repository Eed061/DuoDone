import React from 'react';
import { Task } from '../../types';
import { useApp } from '../../context/AppContext';
import { Clock, Camera, CheckCircle2, Lock } from 'lucide-react';

interface PingPongCardProps {
  task: Task;
  onActionRequest: (task: Task, isOutofTurn: boolean) => void;
  onOpenDetails: (task: Task) => void;
}

export const PingPongCard: React.FC<PingPongCardProps> = ({ task, onActionRequest, onOpenDetails }) => {
  const { users, activeUser } = useApp();

  const turnUser = users.find((u) => u.id === task.current_turn_user_id) || users[0];
  const isMyTurn = activeUser.id === task.current_turn_user_id;

  // Calculate elapsed time since last action
  const formatTimeWaiting = (timestamp?: string) => {
    if (!timestamp) return 'Очікує виконання';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    if (hours < 1) return 'Менше години тому';
    if (hours < 24) return `Висить ${hours} год`;
    const days = Math.floor(hours / 24);
    return `Висить ${days} дн`;
  };

  const handleButtonClick = () => {
    if (isMyTurn) {
      onActionRequest(task, false);
    }
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg hover:border-slate-600/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        {/* Left: Icon & Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onOpenDetails(task)}>
          <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
            {task.icon}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-white text-base tracking-tight">{task.title}</h4>
              <span className="bg-amber-500/10 text-amber-300 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border border-amber-500/20">
                +{task.xp_points} XP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              {formatTimeWaiting(task.last_action_timestamp)}
            </p>
          </div>
        </div>

        {/* Right: Turn status pill */}
        <div className="flex flex-col items-end">
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${
              isMyTurn
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <img
              src={turnUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Turn'}
              alt={turnUser.first_name}
              className="w-4 h-4 rounded-full"
            />
            <span>{isMyTurn ? 'Твоя черга! 🏓' : turnUser.first_name}</span>
          </div>
          {task.photo_required && (
            <span className="text-[10px] text-pink-400 font-medium flex items-center gap-0.5 mt-1">
              <Camera className="w-2.5 h-2.5" /> Фотофіксація
            </span>
          )}
        </div>
      </div>

      {/* Action area */}
      <div className="mt-4 pt-3 border-t border-slate-700/50">
        <button
          onClick={handleButtonClick}
          disabled={!isMyTurn}
          className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-md ${
            isMyTurn
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 active:scale-[0.98]'
              : 'bg-slate-800/80 text-slate-500 border border-slate-700/60 cursor-not-allowed opacity-80'
          }`}
        >
          {isMyTurn ? (
            <>
              {task.photo_required ? <Camera className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>Зроблено! Передати хід 🏓</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Зараз хід партнера ({turnUser.first_name})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
