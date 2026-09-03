import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Check, Edit3, User as UserIcon } from 'lucide-react';

interface EditUserModalProps {
  onClose: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({ onClose }) => {
  const { users, updateUser } = useApp();

  const user1 = users[0] || { id: 'u1', first_name: 'Партнер 1' };
  const user2 = users[1] || { id: 'u2', first_name: 'Партнер 2' };

  const [name1, setName1] = useState(user1.first_name);
  const [name2, setName2] = useState(user2.first_name);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name1.trim()) {
      updateUser(user1.id, { first_name: name1.trim() });
    }
    if (name2.trim()) {
      updateUser(user2.id, { first_name: name2.trim() });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm p-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Імена Партнерів</h3>
            <p className="text-xs text-slate-400">Вкажіть ваші власні імена чи милі прізвиська</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Partner 1 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
            <label className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
              <span>👨</span> Партнер 1
            </label>
            <input
              type="text"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              placeholder="Наприклад: Олександр або Він"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Partner 2 */}
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
            <label className="text-[11px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1">
              <span>👩</span> Партнер 2
            </label>
            <input
              type="text"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              placeholder="Наприклад: Катерина або Вона"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-lg shadow-indigo-500/25"
            >
              <Check className="w-4 h-4" />
              <span>Зберегти імена</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
