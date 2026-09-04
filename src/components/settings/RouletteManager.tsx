import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RouletteItem } from '../../types';
import { translateEntityTitle } from '../../i18n/translations';
import { Disc, Plus, Trash2, Gift, AlertTriangle, Edit3, Check, X } from 'lucide-react';

export const RouletteManager: React.FC = () => {
  const { rouletteItems, saveRouletteItem, deleteRouletteItem, household, language, t } = useApp();
  const [activeTab, setActiveTab] = useState<'reward' | 'penalty'>('reward');
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const filteredItems = rouletteItems.filter((i) => i.type === activeTab);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newItem: RouletteItem = {
      id: `roul-${Date.now()}`,
      household_id: household.id,
      type: activeTab,
      text: text.trim(),
      is_default: false,
    };

    saveRouletteItem(newItem);
    setText('');
  };

  const startEdit = (item: RouletteItem) => {
    setEditingId(item.id);
    setEditText(item.text);
  };

  const saveEdit = (item: RouletteItem) => {
    if (editText.trim()) {
      saveRouletteItem({ ...item, text: editText.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
        <Disc className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-white text-base">{t('rm_title')}</h3>
          <p className="text-xs text-slate-400">{t('rm_subtitle')}</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => { setActiveTab('reward'); setEditingId(null); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'reward'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>
            {t('rm_prizes_tab', { count: rouletteItems.filter((i) => i.type === 'reward').length })}
          </span>
        </button>
        <button
          onClick={() => { setActiveTab('penalty'); setEditingId(null); }}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'penalty'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>
            {t('rm_penalties_tab', { count: rouletteItems.filter((i) => i.type === 'penalty').length })}
          </span>
        </button>
      </div>

      {/* Add new sector form */}
      <form onSubmit={handleAdd} className="flex space-x-2">
        <input
          type="text"
          placeholder={activeTab === 'reward' ? t('rm_prize_ph') : t('rm_penalty_ph')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          required
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add_btn')}</span>
        </button>
      </form>

      {/* Sector list */}
      <div className="space-y-1.5">
        {filteredItems.map((item) => {
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-slate-800"
            >
              {isEditing ? (
                <div className="flex items-center space-x-1.5 w-full">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1 bg-slate-800 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  />
                  <button
                    onClick={() => saveEdit(item)}
                    className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs font-semibold text-slate-200">
                    {translateEntityTitle(item.text, language)}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-slate-400 hover:text-indigo-300 p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteRouletteItem(item.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
