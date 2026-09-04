import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { LANGUAGES, Language } from '../../i18n/translations';
import { Globe, ChevronDown, Check } from 'lucide-react';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLangOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 relative z-30">
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

      {/* Custom Dropdown List */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-slate-950 border border-slate-700/80 hover:border-indigo-500/80 rounded-xl py-3 px-3.5 flex items-center justify-between text-xs font-bold text-white transition-all shadow-inner active:scale-[0.99]"
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-lg">{selectedLangOption.flag}</span>
            <span className="text-sm font-extrabold">{selectedLangOption.nativeName}</span>
            <span className="text-slate-500 text-xs font-medium">({selectedLangOption.name})</span>
          </div>

          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
        </button>

        {/* Dropdown Options List */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border-2 border-indigo-500/50 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeIn divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
            {LANGUAGES.map((langOption) => {
              const isSelected = language === langOption.code;
              return (
                <button
                  key={langOption.code}
                  type="button"
                  onClick={() => handleSelectLanguage(langOption.code as Language)}
                  className={`w-full py-3 px-4 text-xs font-bold flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-300'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{langOption.flag}</span>
                    <div className="text-left">
                      <p className="font-extrabold text-sm text-white">{langOption.nativeName}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{langOption.name}</p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
