import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Image as ImageIcon, Flame } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { activityLogs, users } = useApp();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const monthNames = [
    'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
    'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  // Change month
  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };
  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  // Filter logs for the active month
  const monthLogs = activityLogs.filter((log) => {
    const d = new Date(log.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  // Filter logs for the selected day
  const selectedDayLogs = monthLogs.filter((log) => {
    return new Date(log.created_at).getDate() === selectedDay;
  });

  // Helper to check user activity on a specific day
  const getDayActivity = (day: number) => {
    const dayLogs = monthLogs.filter((log) => new Date(log.created_at).getDate() === day);
    const user1Active = dayLogs.some((l) => l.user_id === users[0]?.id);
    const user2Active = dayLogs.some((l) => l.user_id === users[1]?.id);
    return { count: dayLogs.length, user1Active, user2Active };
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Month Selector Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 shadow-lg flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="w-4 h-4 text-indigo-400" />
          <h2 className="font-extrabold text-white text-base">
            {monthNames[month]} {year}
          </h2>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
        {/* Day name headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayNames.map((d, i) => (
            <span key={i} className="text-xs font-bold text-slate-400 uppercase">
              {d}
            </span>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty padding slots before 1st day */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-11" />
          ))}

          {/* Days 1 to N */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const isSelected = dayNum === selectedDay;
            const activity = getDayActivity(dayNum);

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`h-11 rounded-xl flex flex-col items-center justify-between p-1 transition-all duration-150 relative border ${
                  isSelected
                    ? 'bg-indigo-600/90 border-indigo-400 text-white font-black shadow-md scale-105 z-10'
                    : 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-xs font-bold leading-none">{dayNum}</span>

                {/* Activity Dots */}
                <div className="flex items-center space-x-1 mb-0.5">
                  {activity.user1Active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm" />
                  )}
                  {activity.user2Active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 shadow-sm" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Timeline & Details */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg">
        <h3 className="font-bold text-white text-sm tracking-tight mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            Стрічка подій за {selectedDay} {monthNames[month]}
          </span>
          <span className="text-xs text-slate-400 font-semibold bg-slate-900 px-2 py-0.5 rounded-md border border-slate-700">
            {selectedDayLogs.length} подій
          </span>
        </h3>

        {selectedDayLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-medium bg-slate-900/40 rounded-xl border border-slate-800">
            В цей день активності не зафіксовано.
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayLogs.map((log) => {
              const author = users.find((u) => u.id === log.user_id);
              return (
                <div
                  key={log.id}
                  className="bg-slate-900/70 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                      {log.entity_icon || '📋'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100 text-xs">{log.entity_title}</span>
                        {log.xp_earned > 0 && (
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            +{log.xp_earned} XP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <img
                            src={author?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Log'}
                            alt={author?.first_name}
                            className="w-3.5 h-3.5 rounded-full"
                          />
                          {author?.first_name}
                        </span>
                        <span>•</span>
                        <span>{formatTime(log.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {log.photo_url && (
                    <button
                      onClick={() => setLightboxPhoto(log.photo_url!)}
                      className="flex items-center space-x-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-indigo-500/30 transition-all"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Фото</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox photo viewer */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-2 right-2 bg-slate-900 text-white p-2 rounded-full z-10"
            >
              ✕
            </button>
            <img
              src={lightboxPhoto}
              alt="Proof"
              className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
