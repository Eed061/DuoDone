import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, Counter, PhotoMode } from '../../types';
import { translateEntityTitle } from '../../i18n/translations';
import { Plus, Trash2, Eye, EyeOff, Edit3, X } from 'lucide-react';

export const TaskManager: React.FC = () => {
  const { tasks, counters, saveTask, deleteTask, saveCounter, deleteCounter, activeUser, household, language, t } = useApp();

  const EMOJI_CATEGORIES = [
    {
      key: 'cat_household',
      emojis: ['🧽', '🗑️', '🧹', '🚽', '🪟', '🧺', '🛁', '🪠', '🧼', '🧯', '🧦', '👗', '👔', '🛏️', '🛋️', '🔑'],
    },
    {
      key: 'cat_food',
      emojis: ['🍳', '🥣', '☕', '🥂', '🛒', '🍲', '🍕', '🥐', '🍏', '🍇', '🍰', '🍣', '🍷', '🍺', '🥤', '🍼'],
    },
    {
      key: 'cat_home_pets',
      emojis: ['🪴', '🐈', '🐕', '🐱', '🐶', '🦜', '🐠', '🌱', '💐', '🌻', '🌸', '🌵', '🐾'],
    },
    {
      key: 'cat_auto',
      emojis: ['🚗', '🔧', '🪛', '🔨', '⚡', '📦', '💻', '📱', '🎮', '🚲', '⛽', '🛵'],
    },
    {
      key: 'cat_romance',
      emojis: ['💖', '❤️', '👩‍❤️‍👨', '💍', '🎁', '🏖️', '🎬', '🍿', '🏋️‍♀️', '🧘‍♂️', '💊', '💅', '🎉'],
    },
  ];

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'counters'>('tasks');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  const [activeCategoryIdx, setActiveCategoryIdx] = useState(0);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskIcon, setTaskIcon] = useState('🧽');
  const [taskXp, setTaskXp] = useState(2);
  const [taskPhotoRequired, setTaskPhotoRequired] = useState(false);

  // Counter form state
  const [counterTitle, setCounterTitle] = useState('');
  const [counterIcon, setCounterIcon] = useState('🪴');
  const [counterPhotoMode, setCounterPhotoMode] = useState<PhotoMode>('none');
  const [counterStep, setCounterStep] = useState(1);

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskIcon('🧽');
    setTaskXp(2);
    setTaskPhotoRequired(false);
    setShowForm(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskIcon(task.icon);
    setTaskXp(task.xp_points);
    setTaskPhotoRequired(task.photo_required);
    setShowForm(true);
  };

  const openCreateCounter = () => {
    setEditingCounter(null);
    setCounterTitle('');
    setCounterIcon('🪴');
    setCounterPhotoMode('none');
    setCounterStep(1);
    setShowForm(true);
  };

  const openEditCounter = (counter: Counter) => {
    setEditingCounter(counter);
    setCounterTitle(counter.title);
    setCounterIcon(counter.icon);
    setCounterPhotoMode(counter.photo_mode);
    setCounterStep(counter.step || 1);
    setShowForm(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTask) {
      saveTask({
        ...editingTask,
        title: taskTitle.trim(),
        icon: taskIcon || '🧽',
        xp_points: taskXp,
        photo_required: taskPhotoRequired,
      });
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        household_id: household.id,
        title: taskTitle.trim(),
        icon: taskIcon || '🧽',
        xp_points: taskXp,
        photo_required: taskPhotoRequired,
        current_turn_user_id: activeUser.id,
        is_active: true,
        show_on_dashboard: true,
        created_at: new Date().toISOString(),
      };
      saveTask(newTask);
    }

    setTaskTitle('');
    setEditingTask(null);
    setShowForm(false);
  };

  const handleSaveCounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterTitle.trim()) return;

    if (editingCounter) {
      saveCounter({
        ...editingCounter,
        title: counterTitle.trim(),
        icon: counterIcon || '🪴',
        photo_mode: counterPhotoMode,
        step: counterStep,
      });
    } else {
      const newCounter: Counter = {
        id: `counter-${Date.now()}`,
        household_id: household.id,
        created_by_user_id: activeUser.id,
        title: counterTitle.trim(),
        icon: counterIcon || '🪴',
        photo_mode: counterPhotoMode,
        step: counterStep,
        total_count: 0,
        show_on_dashboard: true,
        created_at: new Date().toISOString(),
      };
      saveCounter(newCounter);
    }

    setCounterTitle('');
    setEditingCounter(null);
    setShowForm(false);
  };

  const toggleTaskVisibility = (task: Task) => {
    saveTask({ ...task, show_on_dashboard: !task.show_on_dashboard });
  };

  const toggleCounterVisibility = (counter: Counter) => {
    saveCounter({ ...counter, show_on_dashboard: !counter.show_on_dashboard });
  };

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg space-y-4">
      {/* Header & Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => { setActiveSubTab('tasks'); setShowForm(false); setEditingTask(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'tasks'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tm_tasks_tab', { count: tasks.length })}
          </button>
          <button
            onClick={() => { setActiveSubTab('counters'); setShowForm(false); setEditingCounter(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'counters'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('tm_counters_tab', { count: counters.length })}
          </button>
        </div>

        <button
          onClick={() => {
            if (activeSubTab === 'tasks') openCreateTask();
            else openCreateCounter();
          }}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>{t('create_btn')}</span>
        </button>
      </div>

      {/* Dynamic Creation/Editing Form */}
      {showForm && (
        <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/30 animate-fadeIn space-y-3 relative">
          <button
            onClick={() => { setShowForm(false); setEditingTask(null); setEditingCounter(null); }}
            className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <h4 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
            {activeSubTab === 'tasks'
              ? editingTask ? t('tm_edit_task') : t('tm_create_task')
              : editingCounter ? t('tm_edit_counter') : t('tm_create_counter')}
          </h4>

          {activeSubTab === 'tasks' ? (
            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">{t('tm_task_title_label')}</label>
                <input
                  type="text"
                  placeholder={t('tm_task_title_ph')}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Emoji picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">{t('tm_emoji_label')}</label>
                  <span className="text-[10px] text-indigo-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md">
                    {t('tm_selected', { icon: taskIcon })}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={taskIcon}
                    onChange={(e) => setTaskIcon(e.target.value)}
                    placeholder={t('tm_emoji_ph')}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-center text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-1 overflow-x-auto py-1 border-t border-b border-slate-800">
                  {EMOJI_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategoryIdx(idx)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${
                        activeCategoryIdx === idx
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t(cat.key)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-8 gap-1 py-1 max-h-32 overflow-y-auto">
                  {EMOJI_CATEGORIES[activeCategoryIdx].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setTaskIcon(emoji)}
                      className={`text-xl p-1.5 rounded-xl border transition-all ${
                        taskIcon === emoji
                          ? 'bg-indigo-600/50 border-indigo-400 scale-110 shadow-md'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">{t('tm_xp_cost')}</label>
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
                    {t('tm_photo_req')}
                  </label>
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingTask(null); }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {editingTask ? t('tm_save_changes') : t('tm_create_task_btn')}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSaveCounter} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300">{t('tm_counter_title_label')}</label>
                <input
                  type="text"
                  placeholder={t('tm_counter_title_ph')}
                  value={counterTitle}
                  onChange={(e) => setCounterTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 mt-1 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Emoji picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">{t('tm_emoji_label')}</label>
                  <span className="text-[10px] text-indigo-400 font-bold bg-slate-800 px-2 py-0.5 rounded-md">
                    {t('tm_selected', { icon: counterIcon })}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={counterIcon}
                    onChange={(e) => setCounterIcon(e.target.value)}
                    placeholder={t('tm_emoji_ph')}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-center text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex space-x-1 overflow-x-auto py-1 border-t border-b border-slate-800">
                  {EMOJI_CATEGORIES.map((cat, idx) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setActiveCategoryIdx(idx)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap transition-colors ${
                        activeCategoryIdx === idx
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t(cat.key)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-8 gap-1 py-1 max-h-32 overflow-y-auto">
                  {EMOJI_CATEGORIES[activeCategoryIdx].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setCounterIcon(emoji)}
                      className={`text-xl p-1.5 rounded-xl border transition-all ${
                        counterIcon === emoji
                          ? 'bg-indigo-600/50 border-indigo-400 scale-110 shadow-md'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">{t('tm_photo_mode_label')}</label>
                  <select
                    value={counterPhotoMode}
                    onChange={(e) => setCounterPhotoMode(e.target.value as PhotoMode)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="none">{t('tm_photo_none')}</option>
                    <option value="optional">{t('tm_photo_optional')}</option>
                    <option value="required">{t('tm_photo_required')}</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">{t('tm_counter_step')}</label>
                  <input
                    type="number"
                    min="1"
                    value={counterStep}
                    onChange={(e) => setCounterStep(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCounter(null); }}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
                >
                  {editingCounter ? t('tm_save_changes') : t('tm_create_counter_btn')}
                </button>
              </div>
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
                  <h5 className="font-bold text-xs text-slate-200">
                    {translateEntityTitle(task.title, language)}
                  </h5>
                  <span className="text-[10px] text-amber-400 font-semibold">{task.xp_points} XP</span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openEditTask(task)}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleTaskVisibility(task)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    task.show_on_dashboard
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {task.show_on_dashboard ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
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
                  <h5 className="font-bold text-xs text-slate-200">
                    {translateEntityTitle(counter.title, language)}
                  </h5>
                  <span className="text-[10px] text-indigo-400 font-semibold">
                    {t('tm_total_count', { count: counter.total_count })}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => openEditCounter(counter)}
                  className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleCounterVisibility(counter)}
                  className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1 transition-colors ${
                    counter.show_on_dashboard
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                >
                  {counter.show_on_dashboard ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => deleteCounter(counter.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
