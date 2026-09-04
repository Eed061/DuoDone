import React from 'react';
import { Home, Calendar, Disc, Settings } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';
import { useApp } from '../../context/AppContext';

export type TabType = 'dashboard' | 'calendar' | 'roulette' | 'settings';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { t } = useApp();

  const tabs = [
    { id: 'dashboard' as TabType, label: t('nav_dashboard'), icon: Home },
    { id: 'calendar' as TabType, label: t('nav_calendar'), icon: Calendar },
    { id: 'roulette' as TabType, label: t('nav_roulette'), icon: Disc, badge: t('badge_final') },
    { id: 'settings' as TabType, label: t('nav_settings'), icon: Settings },
  ];

  const handleTabClick = (tab: TabType) => {
    triggerHaptic('light');
    setActiveTab(tab);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center w-full py-1.5 px-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-indigo-400 font-bold bg-slate-800/80 scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.75px]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-black px-1 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
