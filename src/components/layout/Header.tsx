import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { translateEntityTitle } from '../../i18n/translations';
import { Users, Edit3 } from 'lucide-react';
import { EditUserModal } from './EditUserModal';

export const Header: React.FC = () => {
  const { household, activeUser, partnerUser, language } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Left: App Logo & Household Name */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold text-base">
              🏓
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-white text-base tracking-tight">DuoDone</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                {translateEntityTitle(household.name || 'Наш дім', language)}
              </p>
            </div>
          </div>

          {/* Right: Non-clickable Pair Status Display */}
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
    </>
  );
};
