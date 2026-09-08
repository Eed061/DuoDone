import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Home, Sparkles } from 'lucide-react';

interface CreateSpaceModalProps {
  onClose: () => void;
}

export const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ onClose }) => {
  const { createNewHousehold, t } = useApp();
  const [spaceName, setSpaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createNewHousehold(spaceName.trim() || undefined);
      onClose();
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">{t('csm_title')}</h3>
            <p className="text-xs text-slate-400">{t('csm_subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('csm_name_label')}</span>
            </label>
            <input
              type="text"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              placeholder={t('csm_name_ph')}
              autoFocus
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? t('csm_creating') : t('csm_submit_btn')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
