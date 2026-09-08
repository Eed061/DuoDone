import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';
import { X, Home, Check, Trash2, UserX, Edit2, Plus, ShieldCheck, Lock } from 'lucide-react';
import { CreateSpaceModal } from '../layout/CreateSpaceModal';

interface SpaceManagementModalProps {
  onClose: () => void;
}

export const SpaceManagementModal: React.FC<SpaceManagementModalProps> = ({ onClose }) => {
  const { household, householdsList, switchHousehold, renameHousehold, deleteHousehold, disconnectPartner, language, t } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDisconnectId, setConfirmDisconnectId] = useState<string | null>(null);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);

  const handleStartRename = (hhId: string, currentName: string) => {
    setEditingId(hhId);
    setEditNameInput(translateEntityTitle(currentName, language));
  };

  const handleSaveRename = (hhId: string) => {
    if (editNameInput.trim()) {
      renameHousehold(hhId, editNameInput.trim());
    }
    setEditingId(null);
  };

  const handleConfirmDelete = (hhId: string) => {
    deleteHousehold(hhId);
    setConfirmDeleteId(null);
  };

  const handleConfirmDisconnect = (hhId: string) => {
    disconnectPartner(hhId);
    setConfirmDisconnectId(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">{t('sm_title')}</h3>
                <p className="text-xs text-slate-400">{t('sm_subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List of Spaces */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {householdsList.map((hh) => {
              const isActive = hh.id === household.id;
              const isEditing = editingId === hh.id;
              const isLocked = Boolean(hh.is_locked);

              return (
                <div
                  key={hh.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="bg-slate-900 border border-indigo-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(hh.id)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg text-xs font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 truncate">
                          <h4 className="font-extrabold text-white text-xs truncate">
                            {translateEntityTitle(hh.name, language)}
                          </h4>
                          <button
                            onClick={() => handleStartRename(hh.id, hh.name)}
                            className="text-slate-400 hover:text-indigo-300 p-1"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {hh.invite_code}
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded-full border ${
                            isLocked
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {isLocked ? t('hsm_space_status_locked') : t('hsm_space_status_open')}
                        </span>
                      </div>
                    </div>

                    {/* Switch / Active Badge */}
                    {isActive ? (
                      <span className="bg-indigo-600/30 text-indigo-300 text-[10px] font-black px-2.5 py-1 rounded-xl border border-indigo-500/40 shrink-0">
                        {t('sm_active_badge')}
                      </span>
                    ) : (
                      <button
                        onClick={() => switchHousehold(hh.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-xl border border-slate-700 transition-colors shrink-0"
                      >
                        {t('sm_switch_btn')}
                      </button>
                    )}
                  </div>

                  {/* Confirmation or Actions Row */}
                  {confirmDeleteId === hh.id ? (
                    <div className="mt-3 bg-rose-950/80 border border-rose-500/50 rounded-xl p-2.5 text-center space-y-2 animate-fadeIn">
                      <p className="text-[11px] text-rose-200 font-semibold">{t('sm_delete_confirm')}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => handleConfirmDelete(hh.id)}
                          className="flex-1 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg"
                        >
                          {t('sm_delete_space')}
                        </button>
                      </div>
                    </div>
                  ) : confirmDisconnectId === hh.id ? (
                    <div className="mt-3 bg-amber-950/80 border border-amber-500/50 rounded-xl p-2.5 text-center space-y-2 animate-fadeIn">
                      <p className="text-[11px] text-amber-200 font-semibold">{t('sm_disconnect_confirm')}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setConfirmDisconnectId(null)}
                          className="flex-1 py-1 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
                        >
                          {t('cancel')}
                        </button>
                        <button
                          onClick={() => handleConfirmDisconnect(hh.id)}
                          className="flex-1 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg"
                        >
                          {t('sm_disconnect_partner')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                      {isLocked && (
                        <button
                          onClick={() => setConfirmDisconnectId(hh.id)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <UserX className="w-3 h-3" />
                          <span>{t('sm_disconnect_partner')}</span>
                        </button>
                      )}

                      {householdsList.length > 1 && (
                        <button
                          onClick={() => setConfirmDeleteId(hh.id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{t('sm_delete_space')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Create Space */}
          <button
            onClick={() => setShowCreateSpaceModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md active:scale-95 transition-all mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t('hsm_space_create_btn')}</span>
          </button>
        </div>
      </div>

      {showCreateSpaceModal && <CreateSpaceModal onClose={() => setShowCreateSpaceModal(false)} />}
    </>
  );
};
