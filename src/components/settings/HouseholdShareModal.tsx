import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';
import { Copy, Check, Users, Edit3, RotateCcw, RefreshCw, AlertTriangle, ArrowRight, Send } from 'lucide-react';
import { triggerSuccessHaptic, openTelegramLink } from '../../services/telegram';
import { EditUserModal } from '../layout/EditUserModal';

export const HouseholdShareModal: React.FC = () => {
  const { household, updateHousehold, users, resetCycle, factoryReset, language, t } = useApp();
  const [copiedCard, setCopiedCard] = useState(false);
  const [nameInput, setNameInput] = useState(household.name || 'Наш дім');
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showFactoryConfirm, setShowFactoryConfirm] = useState(false);
  const [showResetCycleConfirm, setShowResetCycleConfirm] = useState(false);

  const rawUser1Name = users[0]?.first_name || 'Партнер 1';
  const rawUser2Name = users[1]?.first_name || 'Партнер 2';
  const user1Name = translateEntityTitle(rawUser1Name, language);
  const user2Name = translateEntityTitle(rawUser2Name, language);

  const inviteCode = household.invite_code || 'DUO7789';
  const botInviteLink = `https://t.me/DuoDone_bot?start=accept_${inviteCode}`;

  const handleSendTelegramInvite = () => {
    const messageText = t('hsm_invite_msg', { partner: user2Name, link: botInviteLink });
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(botInviteLink)}&text=${encodeURIComponent(messageText)}`;

    if (navigator.share) {
      navigator.share({
        title: t('hsm_invite_title'),
        text: messageText,
        url: botInviteLink,
      }).catch(() => {
        openTelegramLink(shareUrl);
      });
    } else {
      openTelegramLink(shareUrl);
    }
  };

  const handleCopyInviteCardText = () => {
    const cardText = t('hsm_invite_msg', { partner: user2Name, link: botInviteLink });
    navigator.clipboard.writeText(cardText);
    triggerSuccessHaptic();
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
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
            <h3 className="font-bold text-white text-base">{t('hsm_title')}</h3>
            <p className="text-xs text-slate-400">{t('hsm_subtitle')}</p>
          </div>
        </div>

        {/* Rename Partners Section */}
        <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">{t('hsm_partners_in_app')}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-semibold text-indigo-300">{user1Name}</span> {t('and')}{' '}
              <span className="font-semibold text-pink-300">{user2Name}</span>
            </p>
          </div>
          <button
            onClick={() => setShowEditUserModal(true)}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 flex items-center space-x-1 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{t('hsm_edit_data')}</span>
          </button>
        </div>

        {/* Household Name Form */}
        <form onSubmit={handleSaveName} className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-300">{t('hsm_space_name_label')}</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={translateEntityTitle(nameInput, language)}
              onChange={(e) => setNameInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl"
            >
              {t('update_btn')}
            </button>
          </div>
        </form>

        {/* Cycle & Reset Control Buttons */}
        <div className="pt-2 space-y-2 border-t border-slate-700/60">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {t('hsm_cycle_control_header')}
          </h4>

          <div className="grid grid-cols-1 gap-2">
            {!showResetCycleConfirm ? (
              <button
                onClick={() => setShowResetCycleConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 text-indigo-400" />
                  <span>{t('hsm_start_new_cycle')}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="bg-indigo-950/80 border border-indigo-500/50 rounded-xl p-3 text-center space-y-2 animate-fadeIn">
                <p className="text-xs text-indigo-200 font-semibold">
                  {t('hsm_reset_cycle_confirm')}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowResetCycleConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmResetCycle}
                    className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg"
                  >
                    {t('hsm_confirm_cycle')}
                  </button>
                </div>
              </div>
            )}

            {!showFactoryConfirm ? (
              <button
                onClick={() => setShowFactoryConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-2">
                  <RefreshCw className="w-4 h-4 text-rose-400" />
                  <span>{t('hsm_factory_reset')}</span>
                </div>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              </button>
            ) : (
              <div className="bg-rose-950/80 border border-rose-500/50 rounded-xl p-3 text-center space-y-2 animate-fadeIn">
                <p className="text-xs text-rose-200 font-semibold">
                  {t('hsm_factory_reset_confirm')}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFactoryConfirm(false)}
                    className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={handleConfirmFactoryReset}
                    className="flex-1 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg"
                  >
                    {t('hsm_reset_all_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invite Partner Section */}
        <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-slate-900 p-3.5 rounded-xl border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
              {t('hsm_partner_invite')}
            </span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-md font-mono font-bold">
              {t('hsm_invite_code', { code: inviteCode })}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            {t('hsm_invite_desc')}
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={handleSendTelegramInvite}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{t('share_card_btn')}</span>
            </button>

            <button
              onClick={handleCopyInviteCardText}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center space-x-1 border border-slate-700 transition-colors"
            >
              {copiedCard ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">{t('invite_copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('copy_invite_btn')}</span>
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
