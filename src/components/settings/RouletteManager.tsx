import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RouletteItem } from '../../types';
import { Disc, Plus, Trash2, Gift, AlertTriangle } from 'lucide-react';

export const RouletteManager: React.FC = () => {
  const { rouletteItems, saveRouletteItem, deleteRouletteItem, household } = useApp();
  const [activeTab, setActiveTab] = useState<'reward' | 'penalty'>('reward');
  const [text, setText] = useState('');

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

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
        <Disc className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-white text-base">Сектори Рулетки Долі</h3>
          <p className="text-xs text-slate-400">Налаштування варіантів Призів та Покарань</p>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => setActiveTab('reward')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'reward'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>Призи переможця ({rouletteItems.filter((i) => i.type === 'reward').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('penalty')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
            activeTab === 'penalty'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Покарання ({rouletteItems.filter((i) => i.type === 'penalty').length})</span>
        </button>
      </div>

      {/* Add new sector form */}
      <form onSubmit={handleAdd} className="flex space-x-2">
        <input
          type="text"
          placeholder={activeTab === 'reward' ? 'Новий приз (наприклад: Масаж 30 хв)' : 'Нове покарання (наприклад: Миття вікон)'}
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
          <span>Додати</span>
        </button>
      </form>

      {/* Sector list */}
      <div className="space-y-1.5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-slate-800"
          >
            <span className="text-xs font-semibold text-slate-200">{item.text}</span>
            <button
              onClick={() => deleteRouletteItem(item.id)}
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
