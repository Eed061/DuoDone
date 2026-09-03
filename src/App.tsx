import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Navbar, TabType } from './components/layout/Navbar';
import { QuickStartBanner } from './components/dashboard/QuickStartBanner';
import { XpBalancerCard } from './components/dashboard/XpBalancerCard';
import { PingPongCard } from './components/dashboard/PingPongCard';
import { CounterTile } from './components/dashboard/CounterTile';
import { CounterModal } from './components/counters/CounterModal';
import { CounterDetailModal } from './components/counters/CounterDetailModal';
import { CalendarView } from './components/calendar/CalendarView';
import { RouletteWheel } from './components/roulette/RouletteWheel';
import { DashboardConfigurator } from './components/settings/DashboardConfigurator';
import { HouseholdShareModal } from './components/settings/HouseholdShareModal';
import { TaskManager } from './components/settings/TaskManager';
import { RouletteManager } from './components/settings/RouletteManager';
import { Task, Counter } from './types';
import { ChevronDown, ChevronUp } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { household, tasks, counters, completeTask, incrementCounter } = useApp();
  const [activeCameraAction, setActiveCameraAction] = useState<{
    type: 'task' | 'counter';
    entity: Task | Counter;
    photoRequired: boolean;
  } | null>(null);

  const [activeDetailEntity, setActiveDetailEntity] = useState<{
    entity: Task | Counter;
    type: 'duodone_task' | 'counter';
  } | null>(null);

  const [showAllCounters, setShowAllCounters] = useState(false);

  // Filter tasks & counters visible on dashboard
  const visibleTasks = tasks.filter((t) => t.is_active && t.show_on_dashboard);
  const visibleCounters = counters.filter((c) => c.show_on_dashboard);
  const hiddenCounters = counters.filter((c) => !c.show_on_dashboard);

  const displayedCounters = showAllCounters ? counters : visibleCounters;

  // Handle task completion request
  const handleTaskActionRequest = (task: Task, isOutOfTurn: boolean) => {
    if (task.photo_required) {
      setActiveCameraAction({
        type: 'task',
        entity: task,
        photoRequired: true,
      });
    } else {
      // Direct completion without photo requirement
      completeTask(task.id);
    }
  };

  // Handle counter click request
  const handleCounterIncrementRequest = (counter: Counter) => {
    if (counter.photo_mode === 'required') {
      setActiveCameraAction({
        type: 'counter',
        entity: counter,
        photoRequired: true,
      });
    } else if (counter.photo_mode === 'optional') {
      setActiveCameraAction({
        type: 'counter',
        entity: counter,
        photoRequired: false,
      });
    } else {
      incrementCounter(counter.id);
    }
  };

  const handleCameraConfirm = async (photoUrl?: string | null) => {
    if (!activeCameraAction) return;

    if (activeCameraAction.type === 'task') {
      await completeTask(activeCameraAction.entity.id, photoUrl);
    } else {
      await incrementCounter(activeCameraAction.entity.id, photoUrl);
    }

    setActiveCameraAction(null);
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* 0. Quick Start Banner (Can be closed in 1 tap) */}
      <QuickStartBanner />

      {/* 1. DuoDone Balancer Widget */}
      {household.show_balancer_widget && <XpBalancerCard />}

      {/* 2. DuoDone Ping-Pong Tasks Section */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-base">🏓</span>
            <h3 className="font-extrabold text-white text-sm tracking-tight">
              Блок «DuoDone» (Черга завдань)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {visibleTasks.length} активних
          </span>
        </div>

        {visibleTasks.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Немає закріплених завдань. Увімкніть їх у Налаштуваннях!
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTasks.map((task) => (
              <PingPongCard
                key={task.id}
                task={task}
                onActionRequest={handleTaskActionRequest}
                onOpenDetails={(t) => setActiveDetailEntity({ entity: t, type: 'duodone_task' })}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Counters Section */}
      <section className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <span className="text-base">🔢</span>
            <h3 className="font-extrabold text-white text-sm tracking-tight">
              Блок «Лічильники» (Плитки дій)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {displayedCounters.length} на екрані
          </span>
        </div>

        {displayedCounters.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-6 text-center text-slate-400 text-xs">
            Немає доданих лічильників.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayedCounters.map((counter) => (
              <CounterTile
                key={counter.id}
                counter={counter}
                onIncrement={handleCounterIncrementRequest}
                onOpenDetails={(c) => setActiveDetailEntity({ entity: c, type: 'counter' })}
              />
            ))}
          </div>
        )}

        {/* Hidden counters expand button */}
        {hiddenCounters.length > 0 && (
          <button
            onClick={() => setShowAllCounters(!showAllCounters)}
            className="w-full py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700/60 flex items-center justify-center space-x-1 transition-colors"
          >
            <span>
              {showAllCounters
                ? 'Сховати додаткові лічильники'
                : `Більше лічильників (+${hiddenCounters.length})`}
            </span>
            {showAllCounters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </section>

      {/* Camera Capture Modal */}
      {activeCameraAction && (
        <CounterModal
          title={activeCameraAction.entity.title}
          icon={activeCameraAction.entity.icon}
          photoRequired={activeCameraAction.photoRequired}
          onConfirm={handleCameraConfirm}
          onClose={() => setActiveCameraAction(null)}
        />
      )}

      {/* Entity Details Modal */}
      {activeDetailEntity && (
        <CounterDetailModal
          entity={activeDetailEntity.entity}
          entityType={activeDetailEntity.type}
          onClose={() => setActiveDetailEntity(null)}
        />
      )}
    </div>
  );
};

export const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-md mx-auto w-full p-4">
        {activeTab === 'dashboard' && <DashboardContent />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'roulette' && <RouletteWheel />}
        {activeTab === 'settings' && (
          <div className="space-y-4 pb-20 animate-fadeIn">
            <DashboardConfigurator />
            <HouseholdShareModal />
            <TaskManager />
            <RouletteManager />
          </div>
        )}
      </main>

      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
