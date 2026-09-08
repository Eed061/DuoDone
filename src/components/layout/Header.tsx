import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';
import { Users, Edit3, ChevronDown, Plus, Check, Home, ShieldCheck, Settings } from 'lucide-react';
import { EditUserModal } from './EditUserModal';
import { CreateSpaceModal } from './CreateSpaceModal';
import { SpaceManagementModal } from '../settings/SpaceManagementModal';

export const Header: React.FC = () => {
  const { household, householdsList, switchHousehold, activeUser, partnerUser, language, t } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSpaceDropdown, setShowSpaceDropdown] = useState(false);
  const [showCreateSpaceModal, setShowCreateSpaceModal] = useState(false);
  const [showSpaceManagementModal, setShowSpaceManagementModal] = useState(false);

  const handleCreateSpace = () => {
    setShowSpaceDropdown(false);
    setShowCreateSpaceModal(true);
  };

  const handleSelectSpace = (hhId: string) => {
    setShowSpaceDropdown(false);
    switchHousehold(hhId);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between relative">
          {/* Left: App Logo & Household Space Switcher */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-base shrink-0">
              🏓
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowSpaceDropdown(!showSpaceDropdown)}
                className="flex flex-col text-left group focus:outline-none"
              >
                <div className="flex items-center space-x-1">
                  <h1 className="font-extrabold text-white text-base tracking-tight">DuoDone</h1>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                    LIVE
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-semibold flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
                  <Home className="w-3 h-3 text-indigo-400" />
                  <span className="truncate max-w-[120px]">
                    {translateEntityTitle(household.name || 'Наш дім', language)}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSpaceDropdown ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Space Switcher Dropdown Menu */}
              {showSpaceDropdown && (
                <div className="absolute top-11 left-0 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl p-2.5 shadow-2xl z-50 animate-fadeIn space-y-2">
                  <div className="px-2 py-1 flex items-center justify-between border-b border-slate-800">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      {t('header_my_spaces')}
                    </span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono font-bold">
                      {householdsList.length}
                    </span>
                  </div>

                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {householdsList.map((hh) => {
                      const isActive = hh.id === household.id;
                      return (
                        <button
                          key={hh.id}
                          onClick={() => handleSelectSpace(hh.id)}
                          className={`w-full p-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-all ${
                            isActive
                              ? 'bg-indigo-600/30 text-white border border-indigo-500/50'
                              : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <div className="truncate">
                              <div className="truncate text-xs">{translateEntityTitle(hh.name, language)}</div>
                              <div className="text-[9px] text-slate-500 font-mono flex items-center gap-1">
                                <span>{hh.invite_code}</span>
                                {hh.is_locked && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400 inline" />}
                              </div>
                            </div>
                          </div>
                          {isActive && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={handleCreateSpace}
                      className="py-2 px-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-[10px] font-black flex items-center justify-center space-x-1 shadow-md active:scale-95 transition-all truncate"
                    >
                      <Plus className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('header_create_space')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSpaceDropdown(false);
                        setShowSpaceManagementModal(true);
                      }}
                      className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center space-x-1 border border-slate-700 transition-all truncate"
                    >
                      <Settings className="w-3 h-3 shrink-0" />
                      <span className="truncate">{t('sm_manage_spaces_btn')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Pair Status & Profile Edit Trigger */}
          <div className="flex items-center space-x-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner">
            {/* Active User */}
            <div className="flex items-center space-x-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <img
                src={activeUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Active'}
                alt={activeUser.first_name}
                className="w-5 h-5 rounded-full object-cover border border-emerald-400/60"
              />
              <span className="font-black text-white text-xs tracking-tight">
                {translateEntityTitle(activeUser.first_name, language)}
              </span>
            </div>

            <span className="text-slate-600 text-xs font-light">|</span>

            {/* Partner User */}
            <div className="flex items-center space-x-1">
              <img
                src={partnerUser.avatar_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=Partner'}
                alt={partnerUser.first_name}
                className="w-4 h-4 rounded-full object-cover opacity-80"
              />
              <span className="font-semibold text-slate-400 text-xs">
                {translateEntityTitle(partnerUser.first_name, language)}
              </span>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {showEditModal && <EditUserModal onClose={() => setShowEditModal(false)} />}
      {showCreateSpaceModal && <CreateSpaceModal onClose={() => setShowCreateSpaceModal(false)} />}
      {showSpaceManagementModal && <SpaceManagementModal onClose={() => setShowSpaceManagementModal(false)} />}
    </>
  );
};
