import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, Counter, PhotoMode } from '../../types';
import { Plus, Trash2, Edit, Camera, Sparkles, Check } from 'lucide-react';

export const TaskManager: React.FC = () => {
  const { tasks, counters, saveTask, deleteTask, saveCounter, deleteCounter, activeUser, household } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'counters'>('tasks');
  const [showForm, setShowForm] = useState(false);

  // New Task state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskIcon, setTaskIcon] = useState('🧽');
  const [taskXp, setTaskXp] = useState(2);
  const [taskPhotoRequired, setTaskPhotoRequired] = useState(false);

  // New Counter state
  const [counterTitle, setCounterTitle] = useState('');
  const [counterIcon, setCounterIcon] = useState('🪴');
  const [counterPhotoMode, setCounterPhotoMode] = useState<PhotoMode>('none');
  const [counterStep, setCounterStep] = useState(1);

  const emojiList = ['🧽', '🗑️', '🧹', '🚽', '🪟', '🪴', '🧺', '🍳', '🛒', '🚗', '🐈', '🚿'];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      household_id: household.id,
      title: taskTitle.trim(),
      icon: taskIcon,
      xp_points: taskXp,
      photo_required: taskPhotoRequired,
      current_turn_user_id: activeUser.id,
      is_active: true,
      show_on_dashboard: true,
      created_at: new Date().toISOString(),
    };

    saveTask(newTask);
    setTaskTitle('');
    setShowForm(false);
  };

  const handleCreateCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTitle.trim()) return;

    const newCounter: Counter = {
      id: `counter-${Date.now()}`,
      household_id: household.id,
      created_by_user_id: activeUser.id,
      title: counterTitle.trim(),
      icon: counterIcon,
      photo_mode: counterPhotoMode,
      step: counterStep,
      total_count: 0,
      show_on_dashboard: true,
      created_at: new Date().toISOString(),
    };

    saveCounter(newCounter);
    setCounterTitle('');
    setShowForm(false);
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
      {/* Header & Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => { setActiveSubTab('tasks'); setShowForm(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DuoDone Завдання
          </button>
          <button
            onClick={() => { setActiveSubTab('counters'); setShowForm(false); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'counters'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Лічильники
          </button>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Створити</span>
        </button>
      </div>

      {/* Dynamic Creation Form */}
      {showForm && (
        <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/30 animate-fadeIn space-y-3">
          <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
            {activeSubTab === 'tasks' ? 'Створити нове DuoDone Завдання' : 'Створити новий Лічильник'}
          </h4>

          {activeSubTab === 'tasks' ? (
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Назва завдання</label>
                <input
                  type="text"
                  placeholder="Наприклад: Помити підлогу"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Оберіть емодзі</label>
                <div className="flex space-x-1.5 overflow-x-auto py-1">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setTaskIcon(emoji)}
                      className={`text-xl p-1.5 rounded-xl border transition-transform ${
                        taskIcon === emoji
                          ? 'bg-indigo-600/40 border-indigo-400 scale-110'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Вартість XP (1 - 5)</label>
                  <select
                    value={taskXp}
                    onChange={(e) => setTaskXp(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((num) => (
                      <option key={num} value={num}>{num} XP</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    id="photoReq"
                    checked={taskPhotoRequired}
                    onChange={(e) => setTaskPhotoRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <label htmlFor="photoReq" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Обов’язкове фото
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Зберегти завдання
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateCounter} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">Назва лічильника</label>
                <input
                  type="text"
                  placeholder="Наприклад: Купівля корму коту"
                  value={counterTitle}
                  onChange={(e) => setCounterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300">Оберіть емодзі</label>
                <div className="flex space-x-1.5 overflow-x-auto py-1">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCounterIcon(emoji)}
                      className={`text-xl p-1.5 rounded-xl border transition-transform ${
                        counterIcon === emoji
                          ? 'bg-indigo-600/40 border-indigo-400 scale-110'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Режим фото підтвердження</label>
                  <select
                    value={counterPhotoMode}
                    onChange={(e) => setCounterPhotoMode(e.target.value as PhotoMode)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="none">Без фото</option>
                    <option value="optional">За бажанням</option>
                    <option value="required">Обов’язково</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Крок підрахунку</label>
                  <input
                    type="number"
                    min="1"
                    value={counterStep}
                    onChange={(e) => setCounterStep(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Зберегти лічильник
              </button>
            </form>
          )}
        </div>
      )}

      {/* List items */}
      <div className="space-y-2">
        {activeSubTab === 'tasks' ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{task.icon}</span>
                <div>
                  <h5 className="font-bold text-xs text-slate-200">{task.title}</h5>
                  <span className="text-[10px] text-amber-400 font-semibold">{task.xp_points} XP</span>
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          counters.map((counter) => (
            <div
              key={counter.id}
              className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{counter.icon}</span>
                <div>
                  <h5 className="font-bold text-xs text-slate-200">{counter.title}</h5>
                  <span className="text-[10px] text-indigo-400 font-semibold">Всього: {counter.total_count}</span>
                </div>
              </div>
              <button
                onClick={() => deleteCounter(counter.id)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
