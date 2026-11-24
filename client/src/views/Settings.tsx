import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api, saveSpace, setToken } from '../lib/api';
import { copyText, EMOJIS, fmtDate } from '../lib/utils';
import { haptic, tgConfirm } from '../lib/tg';
import type { Counter, Lang, PhotoMode, Role, RouletteItem, SpaceState, SpaceSummary, Task, User } from '../types';
import { Avatar, Button, Card, Field, inputCls, Modal, SectionTitle, Segmented, Toggle } from '../components/ui';
import { CreateSpaceModal, InviteBlock, JoinModal, ProfileModal } from '../components/SpaceModals';

type SettingsSection = 'game' | 'content' | 'space' | 'data';

export function Settings() {
  const { t, state, me, spaces, activeId, setActive, lang, run, applyState, setMeAndSpaces, toast, restore, retryBoot } = useApp();
  const [section, setSection] = useState<SettingsSection>('game');
  const [spaceName, setSpaceName] = useState(state?.space.name || '');
  const [catName, setCatName] = useState(state?.space.catName || '');
  const [rewardText, setRewardText] = useState(state?.space.rewardText || '');
  const [cycleDays, setCycleDays] = useState(String(state?.space.cycleDays || 7));
  const [rlPool, setRlPool] = useState<'reward' | 'penalty'>('reward');
  const [newRl, setNewRl] = useState('');
  const [taskModal, setTaskModal] = useState<{ task?: Task } | null>(null);
  const [counterModal, setCounterModal] = useState<{ counter?: Counter } | null>(null);
  const [rlModal, setRlModal] = useState<RouletteItem | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreKey, setRestoreKey] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  useEffect(() => {
    if (!state) return;
    setSpaceName(state.space.name);
    setCatName(state.space.catName);
    setRewardText(state.space.rewardText);
    setCycleDays(String(state.space.cycleDays));
  }, [state?.space.id, state?.space.name, state?.space.catName, state?.space.rewardText, state?.space.cycleDays]);

  if (!state) return null;
  const sid = state.space.id;

  const patchSpace = async (body: Record<string, any>) => {
    const s = await run(() => api.patch<SpaceState>(`/spaces/${sid}`, body));
    if (s) applyState(s);
  };

  const setLang = async (l: Lang) => {
    haptic('select');
    const r = await run(() => api.patch<{ user: User; spaces: SpaceSummary[] }>('/me', { lang: l }));
    if (r) setMeAndSpaces(r);
  };

  const unlink = async () => {
    if (!(await tgConfirm(t('st.unlinkConfirm')))) return;
    const s = await run(() => api.post<SpaceState>(`/spaces/${sid}/unlink`));
    if (s) applyState(s);
  };

  const leave = async () => {
    if (!(await tgConfirm(t('st.leaveConfirm')))) return;
    const r = await run(() => api.post<{ spaces: SpaceSummary[] }>(`/spaces/${sid}/leave`));
    if (r) setMeAndSpaces(r);
  };

  const deleteSpace = async () => {
    if (!(await tgConfirm(t('st.deleteConfirm', { name: state.space.name })))) return;
    const r = await run(() => api.del<{ spaces: SpaceSummary[] }>(`/spaces/${sid}`));
    if (r) setMeAndSpaces(r);
  };

  const factoryReset = async () => {
    if (!(await tgConfirm(t('st.factoryResetConfirm')))) return;
    setResetBusy(true);
    const s = await run(() => api.post<SpaceState>(`/spaces/${sid}/factory-reset`));
    setResetBusy(false);
    if (s) {
      applyState(s);
      haptic('success');
      toast(t('st.factoryResetDone'), 'ok');
    }
  };

  const addRl = async () => {
    const text = newRl.trim();
    if (!text) return;
    const s = await run(() => api.post<SpaceState>(`/spaces/${sid}/roulette`, { pool: rlPool, text }));
    if (s) {
      setNewRl('');
      applyState(s);
      haptic('light');
    }
  };

  const delRl = async (id: string) => {
    const s = await run(() => api.del<SpaceState>(`/spaces/${sid}/roulette/${id}`));
    if (s) applyState(s);
  };

  const partnerRole: Role = state.myRole === 'p1' ? 'p2' : 'p1';
  const partnerLinked = state.space[partnerRole].linked;

  const navItems: { id: SettingsSection; icon: string; label: string; badge?: number }[] = [
    { id: 'game', icon: '🎮', label: t('st.navGame') },
    {
      id: 'content',
      icon: '📋',
      label: t('st.navContent'),
      badge: state.tasks.length + (state.space.showCounters !== false ? state.counters.length : 0),
    },
    { id: 'space', icon: '🏠', label: t('st.navSpace'), badge: spaces.length },
    { id: 'data', icon: '🛠️', label: t('st.navData') },
  ];

  return (
    <div className="space-y-3 pb-4">
      {/* Top Bar: Title + Info Button */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <h1 className="text-lg font-extrabold text-white">⚙️ {t('st.title')}</h1>
        <button
          type="button"
          onClick={() => {
            haptic('light');
            setInfoOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-2xl border border-violet-400/30 bg-violet-500/15 px-3.5 py-1.5 text-xs font-bold text-violet-200 shadow active:scale-95"
        >
          <span>ℹ️</span>
          <span>{t('st.infoBtn')}</span>
        </button>
      </div>

      {/* Category Navigation Tabs */}
      <div className="grid grid-cols-4 gap-1.5 rounded-2xl border border-white/5 bg-slate-900/90 p-1.5">
        {navItems.map((it) => {
          const active = section === it.id;
          return (
            <button
              key={it.id}
              type="button"
              onClick={() => {
                haptic('select');
                setSection(it.id);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-xl py-2 px-1 text-center transition ${
                active
                  ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                  : 'text-slate-400 active:bg-white/5'
              }`}
            >
              <span className="text-base leading-none">{it.icon}</span>
              <span className="max-w-full truncate text-[11px] font-bold">{it.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* SECTION 1: GAME, CYCLE, CAT & LANGUAGE                              */}
      {/* =================================================================== */}
      {section === 'game' && (
        <div className="anim-fade space-y-2">
          <SectionTitle>🎮 {t('st.game')}</SectionTitle>
          <Card className="space-y-4">
            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('st.mode')}</div>
              <Segmented
                value={state.space.mode}
                onChange={(m) => patchSpace({ mode: m })}
                options={[
                  { value: 'symmetric', label: `🏓 ${t('st.modeSymmetric')}` },
                  { value: 'balancer', label: `⚖️ ${t('st.modeBalancer')}` },
                ]}
              />
              <div className="mt-1.5 text-xs text-slate-400">
                {state.space.mode === 'symmetric' ? t('st.modeSymmetricDesc') : t('st.modeBalancerDesc')}
              </div>
            </div>

            <div className="divide-y divide-white/5 border-y border-white/5 py-1">
              <Toggle
                checked={state.space.showBalancer}
                onChange={(v) => patchSpace({ showBalancer: v })}
                label={t('st.showBalancer')}
              />
              <Toggle
                checked={state.space.showCounters !== false}
                onChange={(v) => patchSpace({ showCounters: v })}
                label={t('st.showCounters')}
              />
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('st.cycle')}</div>
              <Segmented
                value={state.space.cyclePeriod}
                onChange={(p) => patchSpace({ cyclePeriod: p })}
                options={[
                  { value: 'weekly', label: t('st.weekly') },
                  { value: 'monthly', label: t('st.monthly') },
                  { value: 'custom', label: t('st.custom') },
                  { value: 'off', label: t('st.off') },
                ]}
              />
              {state.space.cyclePeriod === 'custom' && (
                <div className="mt-2">
                  <Field label={t('st.days')}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={365}
                      className={inputCls}
                      value={cycleDays}
                      onChange={(e) => setCycleDays(e.target.value)}
                      onBlur={() => patchSpace({ cycleDays: Math.max(1, Math.min(365, Number(cycleDays) || 7)) })}
                    />
                  </Field>
                </div>
              )}
            </div>

            {state.space.cyclePeriod !== 'off' && (
              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('st.rewardType')}</div>
                <Segmented
                  value={state.space.rewardType}
                  onChange={(rt) => patchSpace({ rewardType: rt })}
                  options={[
                    { value: 'roulette', label: `🎡 ${t('st.rewardRoulette')}` },
                    { value: 'text', label: `🏆 ${t('st.rewardText')}` },
                  ]}
                />
                {state.space.rewardType === 'text' && (
                  <input
                    className={`${inputCls} mt-2`}
                    value={rewardText}
                    maxLength={200}
                    placeholder={t('st.rewardTextPh')}
                    onChange={(e) => setRewardText(e.target.value)}
                    onBlur={() => rewardText !== state.space.rewardText && patchSpace({ rewardText })}
                  />
                )}
              </div>
            )}
          </Card>

          <SectionTitle>🐱 {t('st.cat')}</SectionTitle>
          <Card className="space-y-3">
            <Toggle
              checked={state.space.catEnabled}
              onChange={(v) => patchSpace({ catEnabled: v })}
              label={t('st.catEnabled')}
            />
            {state.space.catEnabled && (
              <Field label={t('st.catName')}>
                <input
                  className={inputCls}
                  value={catName}
                  maxLength={30}
                  onChange={(e) => setCatName(e.target.value)}
                  onBlur={() => catName.trim() && catName !== state.space.catName && patchSpace({ catName: catName.trim() })}
                />
              </Field>
            )}
          </Card>

          <SectionTitle>🌐 {t('st.lang')}</SectionTitle>
          <Card>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {(
                [
                  { value: 'uk', label: '🇺🇦 Українська' },
                  { value: 'en', label: '🇬🇧 English' },
                  { value: 'pl', label: '🇵🇱 Polski' },
                  { value: 'de', label: '🇩🇪 Deutsch' },
                  { value: 'es', label: '🇪🇸 Español' },
                ] as { value: Lang; label: string }[]
              ).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setLang(o.value)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    lang === o.value ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' : 'bg-slate-950/60 text-slate-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 2: CONTENT (TASKS, COUNTERS WITH TOGGLE, ROULETTE EDIT)     */}
      {/* =================================================================== */}
      {section === 'content' && (
        <div className="anim-fade space-y-2">
          {/* Tasks manager */}
          <SectionTitle
            right={
              <Button size="sm" onClick={() => setTaskModal({})}>
                + {t('st.addTask')}
              </Button>
            }
          >
            🏓 {t('st.tasks')} ({state.tasks.length})
          </SectionTitle>
          <Card className="divide-y divide-white/5 !p-2">
            {state.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2.5 p-2">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-xl">{task.emoji}</span>
                <button onClick={() => setTaskModal({ task })} className="min-w-0 flex-1 text-left">
                  <div className={`truncate text-sm font-semibold ${task.active ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {task.title}
                  </div>
                  <div className="text-xs text-slate-400">
                    +{task.xp} XP {task.photoRequired ? '· 📷' : ''} {!task.showOnDashboard ? '· 🙈' : ''}
                  </div>
                </button>
                <button
                  onClick={() =>
                    run(() => api.patch<SpaceState>(`/spaces/${sid}/tasks/${task.id}`, { active: !task.active })).then((s) => s && applyState(s))
                  }
                  className={`rounded-xl px-2.5 py-1 text-xs font-semibold ${
                    task.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {task.active ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => setTaskModal({ task })} className="rounded-xl bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  ✎
                </button>
              </div>
            ))}
          </Card>

          {/* Counters manager with master slider toggle */}
          <SectionTitle
            right={
              <div className="flex items-center gap-2">
                {state.space.showCounters !== false && (
                  <Button size="sm" onClick={() => setCounterModal({})}>
                    + {t('st.addCounter')}
                  </Button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.space.showCounters !== false}
                  onClick={() => {
                    haptic('select');
                    patchSpace({ showCounters: state.space.showCounters === false });
                  }}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                    state.space.showCounters !== false ? 'bg-violet-500' : 'bg-slate-700'
                  }`}
                  title={t('st.showCounters')}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      state.space.showCounters !== false ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            }
          >
            🔢 {t('st.counters')} ({state.counters.length})
          </SectionTitle>
          {state.space.showCounters !== false && (
            <Card className="divide-y divide-white/5 !p-2">
              {state.counters.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 p-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-800 text-xl">{c.emoji}</span>
                  <button onClick={() => setCounterModal({ counter: c })} className="min-w-0 flex-1 text-left">
                    <div className={`truncate text-sm font-semibold ${c.active ? 'text-white' : 'text-slate-500 line-through'}`}>{c.title}</div>
                    <div className="text-xs text-slate-400">
                      +{c.step} · +{c.xp} XP {c.photoMode !== 'none' ? `· 📷(${c.photoMode})` : ''} {!c.showOnDashboard ? '· 🙈' : ''}
                    </div>
                  </button>
                  <button
                    onClick={() =>
                      run(() => api.patch<SpaceState>(`/spaces/${sid}/counters/${c.id}`, { showOnDashboard: !c.showOnDashboard })).then(
                        (s) => s && applyState(s),
                      )
                    }
                    className={`rounded-xl px-2 py-1 text-xs ${c.showOnDashboard ? 'bg-violet-500/15 text-violet-300' : 'bg-slate-800 text-slate-500'}`}
                    title={t('ie.showOnDashboard')}
                  >
                    🏠
                  </button>
                  <button onClick={() => setCounterModal({ counter: c })} className="rounded-xl bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                    ✎
                  </button>
                </div>
              ))}
            </Card>
          )}

          {/* Roulette manager (with full edit & delete) */}
          <SectionTitle>🎡 {t('st.roulette')}</SectionTitle>
          <Card className="space-y-3">
            <Segmented
              value={rlPool}
              onChange={setRlPool}
              options={[
                { value: 'reward', label: `🎁 ${t('rl.rewards')} (${state.roulette.filter((x) => x.pool === 'reward').length})` },
                { value: 'penalty', label: `🎲 ${t('rl.penalties')} (${state.roulette.filter((x) => x.pool === 'penalty').length})` },
              ]}
            />
            <div className="flex gap-2">
              <input
                className={inputCls}
                value={newRl}
                maxLength={80}
                placeholder={t('st.addItem')}
                onChange={(e) => setNewRl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRl()}
              />
              <Button onClick={addRl} disabled={!newRl.trim()}>
                +
              </Button>
            </div>
            <div className="divide-y divide-white/5">
              {state.roulette
                .filter((r) => r.pool === rlPool)
                .map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                    <button
                      type="button"
                      onClick={() => setRlModal(r)}
                      className="min-w-0 flex-1 truncate text-left font-medium text-slate-100 active:text-violet-300"
                    >
                      {r.text}
                    </button>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRlModal(r)}
                        className="rounded-xl bg-white/5 px-2.5 py-1 text-xs text-slate-300 active:bg-white/10"
                        title={t('common.edit')}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => delRl(r.id)}
                        className="rounded-xl bg-rose-500/10 px-2.5 py-1 text-xs text-rose-300 active:bg-rose-500/20"
                        title={t('common.delete')}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 3: SPACE, PARTNERS & MULTI-SPACE SWITCHER                   */}
      {/* =================================================================== */}
      {section === 'space' && (
        <div className="anim-fade space-y-2">
          <SectionTitle>🏠 {t('st.space')}</SectionTitle>
          <Card className="space-y-4">
            <Field label={t('st.spaceName')}>
              <input
                className={inputCls}
                value={spaceName}
                maxLength={60}
                onChange={(e) => setSpaceName(e.target.value)}
                onBlur={() => spaceName.trim() && spaceName !== state.space.name && patchSpace({ name: spaceName.trim() })}
              />
            </Field>

            <button
              onClick={() => setProfileOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-left active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Avatar value={state.space.p1.avatar} size={32} />
                <span className="font-semibold text-white">{state.space.p1.name}</span>
                <span className="text-slate-600">&</span>
                <Avatar value={state.space.p2.avatar} size={32} />
                <span className="font-semibold text-white">{state.space.p2.name}</span>
              </span>
              <span className="text-xs font-semibold text-violet-300">✎ {t('common.edit')}</span>
            </button>

            <InviteBlock state={state} />

            {partnerLinked && (
              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                <Button variant="secondary" onClick={unlink}>
                  🔓 {t('st.unlink')}
                </Button>
                <Button variant="secondary" onClick={leave}>
                  🚪 {t('st.leave')}
                </Button>
              </div>
            )}
          </Card>

          <SectionTitle>🗂️ {t('st.mySpaces')}</SectionTitle>
          <Card className="space-y-2">
            {spaces.map((s) => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left ${
                  s.id === activeId ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/5 bg-slate-950/40'
                }`}
              >
                <span className="flex -space-x-2">
                  <Avatar value={s.p1Avatar} size={28} />
                  <Avatar value={s.p2Avatar} size={28} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-white">{s.name}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {s.p1Name} & {s.p2Name}
                  </span>
                </span>
                {s.id === activeId && <span className="text-violet-300">✓</span>}
              </button>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button size="sm" variant="secondary" onClick={() => setCreateOpen(true)}>
                + {t('hdr.create')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setJoinOpen(true)}>
                🔑 {t('hdr.joinCode')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* =================================================================== */}
      {/* SECTION 4: DATA, FACTORY RESET, CYCLE HISTORY & ACCOUNT             */}
      {/* =================================================================== */}
      {section === 'data' && (
        <div className="anim-fade space-y-2">
          {/* Cycle history */}
          {state.history.length > 0 && (
            <>
              <SectionTitle>🏆 {t('st.history')}</SectionTitle>
              <Card className="divide-y divide-white/5 !p-3">
                {state.history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between py-2 text-xs">
                    <span className="text-slate-400">
                      {fmtDate(h.startedAt, lang)} — {fmtDate(h.endedAt, lang)}
                    </span>
                    <span className="font-bold text-white">
                      <span className="text-violet-300">
                        {state.space.p1.name}: {h.p1Xp}
                      </span>{' '}
                      ·{' '}
                      <span className="text-cyan-300">
                        {state.space.p2.name}: {h.p2Xp}
                      </span>
                    </span>
                  </div>
                ))}
              </Card>
            </>
          )}

          {/* Factory Reset (keep space & partners, reset history & settings) */}
          <SectionTitle>🔄 {t('st.factoryReset')}</SectionTitle>
          <Card className="space-y-3">
            <div className="text-xs leading-relaxed text-slate-400">{t('st.factoryResetDesc')}</div>
            <Button variant="secondary" className="w-full" onClick={factoryReset} loading={resetBusy}>
              🔄 {t('st.factoryReset')}
            </Button>
          </Card>

          {/* Account & recovery */}
          <SectionTitle>🔐 {t('st.account')}</SectionTitle>
          <Card className="space-y-3">
            {me?.isTelegram && me.tgUsername && <div className="text-xs text-emerald-300">✈️ {t('st.telegramAcc', { u: me.tgUsername })}</div>}
            <div className="text-xs text-slate-400">{t('st.recoveryDesc')}</div>
            {me?.recoveryKey && (
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 p-2 pl-3">
                <span className="flex-1 font-mono text-sm font-bold tracking-wider text-white">{me.recoveryKey}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    if (await copyText(me.recoveryKey)) toast(t('common.copied'), 'ok');
                  }}
                >
                  {t('common.copy')}
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <button onClick={() => setRestoreOpen(true)} className="text-xs font-semibold text-violet-300 underline">
                {t('st.restoreOther')}
              </button>
              <button
                onClick={async () => {
                  if (!(await tgConfirm(t('st.deleteAccountConfirm')))) return;
                  const r = await run(() => api.del<{ ok: boolean }>('/me'));
                  if (r?.ok) {
                    setToken(null);
                    saveSpace(null);
                    retryBoot();
                  }
                }}
                className="text-xs font-semibold text-rose-400 underline"
              >
                {t('st.deleteAccount')}
              </button>
            </div>
          </Card>

          {/* Delete space */}
          <div className="pt-2">
            <Button variant="danger" className="w-full" onClick={deleteSpace}>
              🗑️ {t('st.deleteSpace')} «{state.space.name}»
            </Button>
          </div>
        </div>
      )}

      <div className="pt-3 text-center text-xs text-slate-600">{t('st.version')}</div>

      <InfoGuideModal open={infoOpen} onClose={() => setInfoOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
      <CreateSpaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <TaskEditModal open={!!taskModal} task={taskModal?.task} onClose={() => setTaskModal(null)} />
      <CounterEditModal open={!!counterModal} counter={counterModal?.counter} onClose={() => setCounterModal(null)} />
      <RouletteEditModal open={!!rlModal} item={rlModal} onClose={() => setRlModal(null)} />
      <Modal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        title={t('onb.restore')}
        footer={
          <Button
            className="w-full"
            onClick={async () => {
              if (await restore(restoreKey)) setRestoreOpen(false);
            }}
            disabled={!restoreKey.trim()}
          >
            {t('onb.restoreBtn')}
          </Button>
        }
      >
        <input
          className={`${inputCls} text-center font-mono tracking-widest uppercase`}
          value={restoreKey}
          placeholder={t('onb.restorePh')}
          onChange={(e) => setRestoreKey(e.target.value.toUpperCase())}
        />
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
function InfoGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useApp();
  const blocks = [
    { title: t('info.s1Title'), body: t('info.s1Body') },
    { title: t('info.s2Title'), body: t('info.s2Body') },
    { title: t('info.s3Title'), body: t('info.s3Body') },
    { title: t('info.s4Title'), body: t('info.s4Body') },
    { title: t('info.s5Title'), body: t('info.s5Body') },
  ];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`ℹ️ ${t('info.title')}`}
      footer={
        <Button className="w-full" onClick={onClose}>
          {t('common.done')}
        </Button>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-slate-400">{t('info.sub')}</p>
        {blocks.map((b, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-slate-950/50 p-3.5">
            <div className="mb-1 text-sm font-bold text-white">{b.title}</div>
            <div className="whitespace-pre-line text-xs leading-relaxed text-slate-300">{b.body}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function RouletteEditModal({ open, item, onClose }: { open: boolean; item: RouletteItem | null; onClose: () => void }) {
  const { t, state, run, applyState } = useApp();
  const [text, setText] = useState('');
  const [pool, setPool] = useState<'reward' | 'penalty'>('reward');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !item) return;
    setText(item.text);
    setPool(item.pool);
  }, [open, item]);

  if (!state || !item) return null;
  const sid = state.space.id;

  const save = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const s = await run(() =>
      api.patch<SpaceState>(`/spaces/${sid}/roulette/${item.id}`, {
        text: text.trim(),
        pool,
      }),
    );
    setBusy(false);
    if (s) {
      applyState(s);
      haptic('success');
      onClose();
    }
  };

  const del = async () => {
    const s = await run(() => api.del<SpaceState>(`/spaces/${sid}/roulette/${item.id}`));
    if (s) {
      applyState(s);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t('common.edit')}: ${t('st.editRoulette')}`}
      footer={
        <div className="flex gap-2">
          <Button variant="danger" onClick={del}>
            🗑️
          </Button>
          <Button className="flex-1" onClick={save} loading={busy} disabled={!text.trim()}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label={t('st.roulettePool')}>
          <Segmented
            value={pool}
            onChange={setPool}
            options={[
              { value: 'reward', label: `🎁 ${t('rl.rewards')}` },
              { value: 'penalty', label: `🎲 ${t('rl.penalties')}` },
            ]}
          />
        </Field>
        <Field label={t('ie.title')}>
          <input
            className={inputCls}
            value={text}
            maxLength={80}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function EmojiGrid({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input className={`${inputCls} !w-20 text-center text-2xl`} value={value} maxLength={8} onChange={(e) => onChange(e.target.value)} />
        <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto py-1">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => onChange(e)}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${
                value === e ? 'bg-violet-500/30 ring-2 ring-violet-400' : 'bg-slate-800'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskEditModal({ open, task, onClose }: { open: boolean; task?: Task; onClose: () => void }) {
  const { t, state, run, applyState } = useApp();
  const [emoji, setEmoji] = useState('✅');
  const [title, setTitle] = useState('');
  const [xp, setXp] = useState(2);
  const [photoRequired, setPhotoRequired] = useState(false);
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [active, setActive] = useState(true);
  const [turnRole, setTurnRole] = useState<Role>('p1');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmoji(task?.emoji || '🍽️');
    setTitle(task?.title || '');
    setXp(task?.xp || 2);
    setPhotoRequired(task?.photoRequired ?? false);
    setShowOnDashboard(task?.showOnDashboard ?? true);
    setActive(task?.active ?? true);
    setTurnRole(task?.turnRole || 'p1');
  }, [open, task]);

  if (!state) return null;
  const sid = state.space.id;

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const body = { emoji: emoji || '✅', title: title.trim(), xp, photoRequired, showOnDashboard, active, turnRole };
    const s = await run(() =>
      task ? api.patch<SpaceState>(`/spaces/${sid}/tasks/${task.id}`, body) : api.post<SpaceState>(`/spaces/${sid}/tasks`, body),
    );
    setBusy(false);
    if (s) {
      applyState(s);
      onClose();
    }
  };

  const del = async () => {
    if (!task) return;
    if (!(await tgConfirm(t('ie.deleteConfirm', { name: task.title })))) return;
    const s = await run(() => api.del<SpaceState>(`/spaces/${sid}/tasks/${task.id}`));
    if (s) {
      applyState(s);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? `${t('common.edit')}: ${t('ie.task')}` : t('st.addTask')}
      footer={
        <div className="flex gap-2">
          {task && (
            <Button variant="danger" onClick={del}>
              🗑️
            </Button>
          )}
          <Button className="flex-1" onClick={save} loading={busy} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label={t('ie.emoji')}>
          <EmojiGrid value={emoji} onChange={setEmoji} />
        </Field>
        <Field label={t('ie.title')}>
          <input className={inputCls} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t('ie.xp')}>
          <Segmented
            value={String(xp)}
            onChange={(v) => setXp(Number(v))}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `+${n}` }))}
          />
        </Field>
        {state.space.mode === 'symmetric' && (
          <Field label={t('ie.turn')}>
            <Segmented
              value={turnRole}
              onChange={setTurnRole}
              options={[
                { value: 'p1', label: state.space.p1.name },
                { value: 'p2', label: state.space.p2.name },
              ]}
            />
          </Field>
        )}
        <Toggle checked={photoRequired} onChange={setPhotoRequired} label={t('ie.photoRequired')} />
        <Toggle checked={showOnDashboard} onChange={setShowOnDashboard} label={t('ie.showOnDashboard')} />
        <Toggle checked={active} onChange={setActive} label={t('ie.active')} />
      </div>
    </Modal>
  );
}

function CounterEditModal({ open, counter, onClose }: { open: boolean; counter?: Counter; onClose: () => void }) {
  const { t, state, run, applyState } = useApp();
  const [emoji, setEmoji] = useState('⭐');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState(1);
  const [xp, setXp] = useState(1);
  const [photoMode, setPhotoMode] = useState<PhotoMode>('none');
  const [showOnDashboard, setShowOnDashboard] = useState(true);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmoji(counter?.emoji || '🧹');
    setTitle(counter?.title || '');
    setStep(counter?.step || 1);
    setXp(counter?.xp ?? 1);
    setPhotoMode(counter?.photoMode || 'none');
    setShowOnDashboard(counter?.showOnDashboard ?? true);
    setActive(counter?.active ?? true);
  }, [open, counter]);

  if (!state) return null;
  const sid = state.space.id;

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    const body = { emoji: emoji || '⭐', title: title.trim(), step, xp, photoMode, showOnDashboard, active };
    const s = await run(() =>
      counter ? api.patch<SpaceState>(`/spaces/${sid}/counters/${counter.id}`, body) : api.post<SpaceState>(`/spaces/${sid}/counters`, body),
    );
    setBusy(false);
    if (s) {
      applyState(s);
      onClose();
    }
  };

  const del = async () => {
    if (!counter) return;
    if (!(await tgConfirm(t('ie.deleteConfirm', { name: counter.title })))) return;
    const s = await run(() => api.del<SpaceState>(`/spaces/${sid}/counters/${counter.id}`));
    if (s) {
      applyState(s);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={counter ? `${t('common.edit')}: ${t('ie.counter')}` : t('st.addCounter')}
      footer={
        <div className="flex gap-2">
          {counter && (
            <Button variant="danger" onClick={del}>
              🗑️
            </Button>
          )}
          <Button className="flex-1" onClick={save} loading={busy} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <Field label={t('ie.emoji')}>
          <EmojiGrid value={emoji} onChange={setEmoji} />
        </Field>
        <Field label={t('ie.title')}>
          <input className={inputCls} value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={t('ie.step')}>
          <Segmented
            value={String(step)}
            onChange={(v) => setStep(Number(v))}
            options={[1, 2, 3, 5, 10].map((n) => ({ value: String(n), label: `+${n}` }))}
          />
        </Field>
        <Field label={t('ie.xp')}>
          <Segmented
            value={String(xp)}
            onChange={(v) => setXp(Number(v))}
            options={[0, 1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `+${n}` }))}
          />
        </Field>
        <Field label={t('ie.photoMode')}>
          <Segmented
            value={photoMode}
            onChange={setPhotoMode}
            options={[
              { value: 'none', label: t('ie.photoNone') },
              { value: 'optional', label: t('ie.photoOptional') },
              { value: 'required', label: t('ie.photoRequiredShort') },
            ]}
          />
        </Field>
        <Toggle checked={showOnDashboard} onChange={setShowOnDashboard} label={t('ie.showOnDashboard')} />
        <Toggle checked={active} onChange={setActive} label={t('ie.active')} />
      </div>
    </Modal>
  );
}
