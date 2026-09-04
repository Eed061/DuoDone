import React, { useState } from 'react';
import { Task, Counter } from '../../types';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle, MONTH_NAMES } from '../../i18n/translations';
import { X, Clock, Image as ImageIcon } from 'lucide-react';

interface CounterDetailModalProps {
  entity: Task | Counter;
  entityType: 'duodone_task' | 'counter';
  onClose: () => void;
}

export const CounterDetailModal: React.FC<CounterDetailModalProps> = ({
  entity,
  entityType,
  onClose,
}) => {
  const { activityLogs, users, language, t } = useApp();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Filter activity logs for this entity
  const logs = activityLogs.filter(
    (l) => l.entity_type === entityType && l.entity_id === entity.id
  );

  // Calculate breakdown per user
  const userStats = users.map((u) => {
    const userLogs = logs.filter((l) => l.user_id === u.id);
    return {
      user: u,
      count: userLogs.length,
    };
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate();
    const months = MONTH_NAMES[language] || MONTH_NAMES.uk;
    const month = months[d.getMonth()]?.substring(0, 3).toLowerCase() || '';
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner">
              {entity.icon}
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                {translateEntityTitle(entity.title, language)}
              </h3>
              <p className="text-xs text-slate-400">
                {entityType === 'duodone_task' ? t('cdm_duodone_task') : t('cdm_counter')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Breakdown Stats */}
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              {t('cdm_total_actions', { count: logs.length })}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {userStats.map((stat) => (
                <div
                  key={stat.user.id}
                  className="flex items-center justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800"
                >
                  <div className="flex items-center space-x-2">
                    <img
                      src={stat.user.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Stat'}
                      alt={stat.user.first_name}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-xs text-slate-300 font-medium">{stat.user.first_name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-400">
                    {t('cdm_times', { count: stat.count })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              {t('cdm_timeline', { count: logs.length })}
            </h4>

            {logs.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs font-medium bg-slate-900/40 rounded-xl">
                {t('cdm_empty')}
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const author = users.find((u) => u.id === log.user_id);
                  return (
                    <div
                      key={log.id}
                      className="bg-slate-800/40 hover:bg-slate-800/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={author?.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Log'}
                          alt={author?.first_name}
                          className="w-7 h-7 rounded-full border border-slate-700"
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-200">{author?.first_name}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(log.created_at)}</p>
                        </div>
                      </div>

                      {log.photo_url && (
                        <button
                          onClick={() => setSelectedPhoto(log.photo_url!)}
                          className="flex items-center space-x-1 bg-slate-700/60 hover:bg-slate-700 text-indigo-300 text-xs font-medium px-2 py-1 rounded-lg border border-slate-600/40"
                        >
                          <ImageIcon className="w-3 h-3 text-indigo-400" />
                          <span>{t('calendar_photo_btn')}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lightbox photo viewer */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
            <div className="relative max-w-sm w-full">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-2 right-2 bg-slate-900 text-white p-2 rounded-full z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={selectedPhoto}
                alt="Full Proof"
                className="w-full max-h-[80vh] object-contain rounded-2xl border border-slate-700 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
