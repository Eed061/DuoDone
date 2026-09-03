import React from 'react';
import { useApp } from '../../context/AppContext';
import { Layout, Check, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

export const DashboardConfigurator: React.FC = () => {
  const { household, updateHousehold, tasks, counters, saveTask, saveCounter } = useApp();

  const toggleBalancer = () => {
    updateHousehold({ show_balancer_widget: !household.show_balancer_widget });
  };

  const toggleTaskVisibility = (task: typeof tasks[0]) => {
    saveTask({ ...task, show_on_dashboard: !task.show_on_dashboard });
  };

  const toggleCounterVisibility = (counter: typeof counters[0]) => {
    saveCounter({ ...counter, show_on_dashboard: !counter.show_on_dashboard });
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-3">
        <Layout className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-bold text-white text-base">Конфігуратор Головного Екрана</h3>
          <p className="text-xs text-slate-400">Оберіть віджети та плитки для швидкого доступу</p>
        </div>
      </div>

      {/* 1. Balancer Widget Toggle */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-700/50">
        <div>
          <h4 className="text-xs font-bold text-slate-200">Відображати віджет балансу XP</h4>
          <p className="text-[11px] text-slate-400">Графічний балансир перетягування каната вгорі</p>
        </div>
        <button
          onClick={toggleBalancer}
          className="text-2xl transition-transform active:scale-95"
        >
          {household.show_balancer_widget ? (
            <ToggleRight className="w-8 h-8 text-indigo-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-500" />
          )}
        </button>
      </div>

      {/* 2. Ping-Pong Tasks visibility toggles */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Активні черги Пінг-понгу ({tasks.length})
        </h4>
        <div className="space-y-1.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">{task.icon}</span>
                <span className="text-xs font-semibold text-slate-200">{task.title}</span>
              </div>
              <button
                onClick={() => toggleTaskVisibility(task)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  task.show_on_dashboard
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {task.show_on_dashboard ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Показати</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Сховати</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Counters visibility toggles */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          Швидкі плитки Лічильників ({counters.length})
        </h4>
        <div className="space-y-1.5">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="flex items-center justify-between bg-slate-900/40 p-2.5 rounded-xl border border-slate-800"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-lg">{counter.icon}</span>
                <span className="text-xs font-semibold text-slate-200">{counter.title}</span>
              </div>
              <button
                onClick={() => toggleCounterVisibility(counter)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                  counter.show_on_dashboard
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {counter.show_on_dashboard ? (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>На головній</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>В архіві</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
