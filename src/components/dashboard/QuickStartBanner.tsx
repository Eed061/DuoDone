import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickStartBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('duodone_welcome_dismissed') === 'true';
  });

  const { t } = useApp();

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('duodone_welcome_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/90 via-slate-800 to-purple-950/90 border-2 border-indigo-500/50 rounded-2xl p-4 shadow-2xl relative overflow-hidden animate-fadeIn mb-4">
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
          🚀
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex items-center space-x-1.5">
            <h3 className="font-extrabold text-white text-base tracking-tight">
              {t('quick_start_title')}
            </h3>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {t('quick_start_desc')}
          </p>

          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-1.5 active:scale-95 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3px]" />
              <span>{t('quick_start_btn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
