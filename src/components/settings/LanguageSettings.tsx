import React from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, Language } from '../../i18n/translations';
import { Globe, Check } from 'lucide-react';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useApp();

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
        <Globe className="w-4 h-4 text-indigo-400" />
        <div>
          <h3 className="font-extrabold text-white text-sm">
            {t('settings_language')}
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            {t('settings_language_desc')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {LANGUAGES.map((langOption) => {
          const isSelected = language === langOption.code;
          return (
            <button
              key={langOption.code}
              onClick={() => setLanguage(langOption.code as Language)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-500/10'
                  : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{langOption.flag}</span>
                <span>{langOption.nativeName}</span>
              </div>

              {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
