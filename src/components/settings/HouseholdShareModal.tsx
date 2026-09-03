import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Share2, Copy, Check, QrCode, Users, Edit3 } from 'lucide-react';
import { triggerSuccessHaptic } from '../../services/telegram';
import { EditUserModal } from '../layout/EditUserModal';

export const HouseholdShareModal: React.FC = () => {
  const { household, updateHousehold, users } = useApp();
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(household.name || 'Наш дім');
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  const inviteLink = `https://t.me/DuoDone_bot?start=join_${household.invite_code || 'DUO7789'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    triggerSuccessHaptic();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateHousehold({ name: nameInput.trim() });
    }
  };

  return (
    <>
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
          <Users className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-white text-base">Налаштування Простору та Партнерів</h3>
            <p className="text-xs text-slate-400">Імена партнерів, назва дому та лінк підключення</p>
          </div>
        </div>

        {/* Rename Partners Section */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">Імена партнерів у застосунку</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Зараз: <span className="font-semibold text-indigo-300">{users[0]?.first_name || 'Він'}</span> та{' '}
              <span className="font-semibold text-pink-300">{users[1]?.first_name || 'Вона'}</span>
            </p>
          </div>
          <button
            onClick={() => setShowEditUserModal(true)}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center space-x-1 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Змінити імена</span>
          </button>
        </div>

        {/* Household Name Form */}
        <form onSubmit={handleSaveName} className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-300">Назва вашого простору</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl"
            >
              Оновити
            </button>
          </div>
        </form>

        {/* Invite Partner Link */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
              Запрошення партнера
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
              Код: {household.invite_code || 'DUO7789'}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Надішліть це посилання партнеру для синхронізації в одному спільному «Домі» (максимум 2 користувачі).
          </p>

          <div className="flex space-x-2">
            <input
              type="text"
              readOnly
              value={inviteLink}
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-indigo-300 font-mono select-all focus:outline-none"
            />
            <button
              onClick={copyLink}
              className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Скопійовано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Копіювати</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showEditUserModal && <EditUserModal onClose={() => setShowEditUserModal(false)} />}
    </>
  );
};
