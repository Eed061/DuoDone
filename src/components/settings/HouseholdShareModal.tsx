import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Share2, Copy, Check, QrCode, Users, Edit3, RotateCcw, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { triggerSuccessHaptic } from '../../services/telegram';
import { EditUserModal } from '../layout/EditUserModal';

export const HouseholdShareModal: React.FC = () => {
  const { household, updateHousehold, users, resetCycle, factoryReset } = useApp();
  const [copied, setCopied] = useState(false);
  const [nameInput, setNameInput] = useState(household.name || 'Наш дім');
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showFactoryConfirm, setShowFactoryConfirm] = useState(false);
  const [showResetCycleConfirm, setShowResetCycleConfirm] = useState(false);

  const user1Name = users[0]?.first_name || 'Партнер 1';
  const user2Name = users[1]?.first_name || 'Партнер 2';
  const inviteCode = household.invite_code || 'DUO7789';

  const inviteLink = `https://duodone-one.vercel.app/?invite=${inviteCode}&u1=${encodeURIComponent(user1Name)}&u2=${encodeURIComponent(user2Name)}`;

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

  const handleConfirmResetCycle = () => {
    resetCycle();
    setShowResetCycleConfirm(false);
  };

  const handleConfirmFactoryReset = () => {
    factoryReset();
    setShowFactoryConfirm(false);
  };

  return (
    <>
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
          <Users className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-bold text-white text-base">Налаштування Простору та Партнерів</h3>
            <p className="text-xs text-slate-400">Імена партнерів, фото, назва дому та скидання</p>
          </div>
        </div>

        {/* Rename Partners Section */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">Партнери у застосунку</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-semibold text-indigo-300">{user1Name}</span> та{' '}
              <span className="font-semibold text-pink-300">{user2Name}</span>
            </p>
          </div>
          <button
            onClick={() => setShowEditUserModal(true)}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center space-x-1 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Змінити імена/фото</span>
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

        {/* Cycle & Reset Control Buttons */}
        <div className="pt-2 space-y-2 border-t border-slate-700/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Керування циклами та Даними
          </h4>

          <div className="grid grid-cols-1 gap-2">
            {/* Reset Cycle Button */}
            {!showResetCycleConfirm ? (
              <button
                onClick={() => setShowResetCycleConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  <span>Почати новий місячний цикл</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-xl p-3 text-center space-y-2 animate-fadeIn">
                <p className="text-xs text-indigo-200 font-semibold">
                  Обнулити бали XP та розпочати новий місяць?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowResetCycleConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleConfirmResetCycle}
                    className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    Так, почати цикл
                  </button>
                </div>
              </div>
            )}

            {/* Factory Reset Button */}
            {!showFactoryConfirm ? (
              <button
                onClick={() => setShowFactoryConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-rose-400" />
                  <span>Почати заново (Заводські налаштування)</span>
                </div>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </button>
            ) : (
              <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 text-center space-y-2 animate-fadeIn">
                <p className="text-xs text-rose-200 font-semibold">
                  Увага! Скинути ВСІ дані, бали та повернути шаблонні завдання й призи?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFactoryConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                  >
                    Скасувати
                  </button>
                  <button
                    onClick={handleConfirmFactoryReset}
                    className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                  >
                    Скинути все!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invite Partner Link */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 p-3.5 rounded-xl border border-indigo-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
              Запрошення партнера
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
              Код: {inviteCode}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Надішліть це посилання партнеру: у нього автоматично відкриються встановлені імена (<span className="text-indigo-300 font-semibold">{user1Name}</span> та <span className="text-pink-300 font-semibold">{user2Name}</span>).
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
