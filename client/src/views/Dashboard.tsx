import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { api } from '../lib/api';
import { boom, catBus, fmtDate, fmtTime, timeAgo } from '../lib/utils';
import { haptic, tgConfirm } from '../lib/tg';
import type { Counter, LogEntry, Role, SpaceState, Task } from '../types';
import { Avatar, Button, Card, Modal, SectionTitle, Spinner } from '../components/ui';
import { PhotoPicker } from '../components/PhotoPicker';
import { Lightbox, PhotoThumbs } from '../components/Lightbox';
import { InviteModal } from '../components/SpaceModals';

const other = (r: Role): Role => (r === 'p1' ? 'p2' : 'p1');

export function Dashboard() {
  const { state, me } = useApp();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [completing, setCompleting] = useState<{ kind: 'task'; item: Task } | { kind: 'counter'; item: Counter } | null>(null);
  const [detail, setDetail] = useState<{ kind: 'task' | 'counter'; item: Task | Counter } | null>(null);

  if (!state) return <DashboardSkeleton />;

  return (
    <div className="space-y-3">
      {!me?.quickstartDismissed && <QuickStartBanner onInvite={() => setInviteOpen(true)} />}
      <CycleBanner state={state} />
      {state.space.showBalancer && <XpBalancerCard state={state} />}
      <PingPongCard state={state} onDo={(t) => setCompleting({ kind: 'task', item: t })} onOpen={(t) => setDetail({ kind: 'task', item: t })} />
      <CountersSection
        state={state}
        onDo={(c) => setCompleting({ kind: 'counter', item: c })}
        onOpen={(c) => setDetail({ kind: 'counter', item: c })}
      />
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
      <CompleteModal target={completing} onClose={() => setCompleting(null)} />
      <ItemDetailModal target={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton h-24 rounded-3xl" />
      <div className="skeleton h-32 rounded-3xl" />
      <div className="skeleton h-64 rounded-3xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
function QuickStartBanner({ onInvite }: { onInvite: () => void }) {
  const { t, setMeAndSpaces, me } = useApp();
  const dismiss = async () => {
    haptic('light');
    try {
      const r = await api.patch<any>('/me', { quickstartDismissed: true });
      setMeAndSpaces(r);
    } catch {
      /* ignore */
    }
  };
  if (!me) return null;
  return (
    <div className="anim-pop relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-cyan-500/10 p-4">
      <button onClick={dismiss} className="absolute top-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-slate-200" aria-label="close">
        ✕
      </button>
      <div className="mb-2 text-base font-bold text-white">{t('qs.title')}</div>
      <ol className="mb-3 space-y-1 text-sm text-slate-200">
        <li>1. {t('qs.l1')}</li>
        <li>2. {t('qs.l2')}</li>
        <li>3. {t('qs.l3')}</li>
      </ol>
      <Button size="sm" onClick={onInvite}>
        💌 {t('qs.invite')}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function CycleBanner({ state }: { state: SpaceState }) {
  const { t, run, applyState, setTab } = useApp();
  const now = useNow();
  const [busy, setBusy] = useState(false);
  const { cycle, space } = state;
  if (space.cyclePeriod === 'off' || cycle.endsAt == null) return null;
  const expired = now >= cycle.endsAt;
  const total = cycle.endsAt - cycle.startedAt;
  const pct = Math.min(100, Math.max(0, ((now - cycle.startedAt) / total) * 100));

  const reset = async () => {
    if (!(await tgConfirm(t('cycle.resetConfirm')))) return;
    setBusy(true);
    const s = await run(() => api.post<SpaceState>(`/spaces/${space.id}/cycle/reset`));
    setBusy(false);
    if (s) {
      applyState(s);
      boom('small');
    }
  };

  if (expired) {
    return (
      <div className="anim-pop rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/25 to-rose-500/20 p-4">
        <div className="text-lg font-extrabold text-white">{t('cycle.ended')}</div>
        <div className="mb-3 text-sm text-amber-100/80">
          {space.rewardType === 'text' && space.rewardText ? `🎁 ${t('cycle.prize')}: ${space.rewardText}` : t('cycle.endedDesc')}
        </div>
        <div className="flex gap-2">
          {space.rewardType === 'roulette' && (
            <Button size="sm" onClick={() => setTab('roulette')}>
              🎡 {t('cycle.toRoulette')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={reset} loading={busy}>
            {t('cycle.newCycle')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="!p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">⏳ {t('cycle.left')}</div>
          <div className="text-xl font-extrabold text-white tabular-nums">{fmtDuration(cycle.endsAt - now, t)}</div>
        </div>
        <Button size="sm" variant="secondary" onClick={reset} loading={busy}>
          {t('cycle.reset')}
        </Button>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </Card>
  );
}

import { fmtDuration } from '../lib/utils';

// ---------------------------------------------------------------------------
export function XpBalancerCard({ state }: { state: SpaceState }) {
  const { t } = useApp();
  const { p1, p2 } = state.xp;
  const total = p1 + p2;
  const p1Pct = total === 0 ? 50 : (p1 / total) * 100;
  const leader: Role | null = p1 === p2 ? null : p1 > p2 ? 'p1' : 'p2';
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold uppercase tracking-wider text-slate-400">⚖️ {t('bal.title')}</div>
        <div className="text-xs text-slate-400">
          {leader ? (
            <>
              <span className="font-semibold text-white">{t('bal.leader', { name: state.space[leader].name })}</span> {t('bal.diff', { n: Math.abs(p1 - p2) })}
            </>
          ) : (
            t('bal.tie')
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <Avatar value={state.space.p1.avatar} size={40} ring={leader === 'p1' ? 'ring-amber-400' : undefined} />
          <div className="mt-1 text-lg font-extrabold text-violet-300 tabular-nums">{p1}</div>
        </div>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="absolute inset-y-0 left-0 rounded-l-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-700"
            style={{ width: `${p1Pct}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 rounded-r-full bg-gradient-to-l from-cyan-600 to-cyan-400 transition-all duration-700"
            style={{ width: `${100 - p1Pct}%` }}
          />
          <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-white/60" />
          <div
            className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 text-center text-[11px] leading-5 shadow transition-all duration-700"
            style={{ left: `${p1Pct}%` }}
          >
            🪢
          </div>
        </div>
        <div className="flex flex-col items-center">
          <Avatar value={state.space.p2.avatar} size={40} ring={leader === 'p2' ? 'ring-amber-400' : undefined} />
          <div className="mt-1 text-lg font-extrabold text-cyan-300 tabular-nums">{p2}</div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
function PingPongCard({ state, onDo, onOpen }: { state: SpaceState; onDo: (t: Task) => void; onOpen: (t: Task) => void }) {
  const { t, nameOf } = useApp();
  const tasks = state.tasks.filter((x) => x.active && x.showOnDashboard);
  const symmetric = state.space.mode === 'symmetric';
  return (
    <div>
      <SectionTitle>
        {symmetric ? '🏓 ' : '⚡ '}
        {symmetric ? t('pp.title') : t('pp.balancerTitle')}
      </SectionTitle>
      {tasks.length === 0 && <Card className="text-center text-sm text-slate-400">{t('pp.empty')}</Card>}
      <div className="space-y-2.5">
        {tasks.map((task) => {
          const mine = task.turnRole === state.actingRole;
          const turnOwner = state.space[task.turnRole];
          return (
            <div
              key={task.id}
              onClick={() => onOpen(task)}
              className={`flex cursor-pointer items-center gap-3 rounded-3xl border p-3 transition active:scale-[0.99] ${
                symmetric && mine ? 'border-violet-400/40 bg-violet-500/10' : 'border-white/5 bg-slate-900/80'
              }`}
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-800 text-2xl">{task.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold text-white">{task.title}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-bold text-amber-300">+{task.xp} XP</span>
                  {task.photoRequired && <span className="rounded-full bg-sky-400/15 px-2 py-0.5 text-sky-300">📷 {t('pp.photo')}</span>}
                  {symmetric ? (
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${mine ? 'bg-violet-500/25 text-violet-200' : 'bg-slate-800 text-slate-300'}`}>
                      <Avatar value={turnOwner.avatar} size={14} />
                      {mine ? t('pp.yourTurn') : t('pp.turn', { name: turnOwner.name })}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-slate-300">{t('pp.anyone')}</span>
                  )}
                </div>
                <div className="mt-1 truncate text-[11px] text-slate-500">
                  {task.lastDoneAt && task.lastDoneBy
                    ? t('pp.lastBy', { name: nameOf(task.lastDoneBy), ago: timeAgo(task.lastDoneAt, t) })
                    : t('pp.never')}
                </div>
              </div>
              <Button
                size="sm"
                variant={!symmetric || mine ? 'success' : 'secondary'}
                onClick={(e) => {
                  e.stopPropagation();
                  haptic('light');
                  onDo(task);
                }}
              >
                ✓ {t('pp.do')}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function CountersSection({ state, onDo, onOpen }: { state: SpaceState; onDo: (c: Counter) => void; onOpen: (c: Counter) => void }) {
  const { t, run, applyState } = useApp();
  const [expanded, setExpanded] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const active = state.counters.filter((c) => c.active);
  const shown = active.filter((c) => c.showOnDashboard);
  const hidden = active.filter((c) => !c.showOnDashboard);
  const list = expanded ? [...shown, ...hidden] : shown;
  if (active.length === 0) return null;

  const tap = async (c: Counter) => {
    haptic('light');
    if (c.photoMode !== 'none') return onDo(c);
    setPending(c.id);
    const r = await run(() => api.post<{ state: SpaceState }>(`/spaces/${state.space.id}/counters/${c.id}/increment`, {}));
    setPending(null);
    if (r) {
      applyState(r.state);
      haptic('success');
      catBus.emit({ type: 'done', name: state.space[state.actingRole].name });
    }
  };

  return (
    <div>
      <SectionTitle>🔢 {t('ct.title')}</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {list.map((c) => (
          <div key={c.id} onClick={() => onOpen(c)} className="flex cursor-pointer flex-col rounded-3xl border border-white/5 bg-slate-900/80 p-3 active:scale-[0.98]">
            <div className="flex items-start justify-between">
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-right">
                <span className="block text-2xl leading-none font-extrabold text-white tabular-nums">{c.cycleTotal}</span>
                <span className="text-[10px] text-slate-500">{t('ct.total')}</span>
              </span>
            </div>
            <div className="mt-1.5 line-clamp-2 min-h-[2.5em] text-[13px] leading-tight font-semibold text-slate-200">{c.title}</div>
            <div className="mt-1 flex items-center gap-1 text-[10px]">
              {c.xp > 0 && <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 font-bold text-amber-300">+{c.xp} XP</span>}
              {c.photoMode === 'required' && <span className="rounded-full bg-sky-400/15 px-1.5 py-0.5 text-sky-300">📷</span>}
              {c.photoMode === 'optional' && <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-slate-400">📷?</span>}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                tap(c);
              }}
              disabled={pending === c.id}
              className="mt-2 h-10 rounded-2xl bg-gradient-to-r from-cyan-500/80 to-violet-500/80 text-base font-extrabold text-white active:scale-95 disabled:opacity-60"
            >
              {pending === c.id ? <Spinner className="h-4 w-4" /> : `+${c.step}`}
            </button>
          </div>
        ))}
      </div>
      {hidden.length > 0 && (
        <button onClick={() => setExpanded((x) => !x)} className="mt-2.5 w-full rounded-2xl bg-white/5 py-2.5 text-sm font-semibold text-slate-300">
          {expanded ? t('ct.showLess') : t('ct.showMore', { n: hidden.length })}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
function CompleteModal({
  target,
  onClose,
}: {
  target: { kind: 'task'; item: Task } | { kind: 'counter'; item: Counter } | null;
  onClose: () => void;
}) {
  const { t, state, applyState, toast, errText } = useApp();
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outOfTurn, setOutOfTurn] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  useEffect(() => {
    if (target) {
      setPhotos([]);
      setOutOfTurn(false);
      setPickerKey((k) => k + 1);
    }
  }, [target]);

  if (!target || !state) return null;
  const { item } = target;
  const isTask = target.kind === 'task';
  const photoMode = isTask ? ((item as Task).photoRequired ? 'required' : 'optional') : (item as Counter).photoMode;
  const required = photoMode === 'required';
  const xp = item.xp;
  const actor = state.space[state.actingRole];
  const symmetricWrongTurn = isTask && state.space.mode === 'symmetric' && (item as Task).turnRole !== state.actingRole;

  const submit = async (force = false) => {
    if (symmetricWrongTurn && !force && !outOfTurn) {
      setOutOfTurn(true);
      haptic('warning');
      return;
    }
    setBusy(true);
    try {
      const path = isTask
        ? `/spaces/${state.space.id}/tasks/${item.id}/complete`
        : `/spaces/${state.space.id}/counters/${item.id}/increment`;
      const r = await api.post<{ state: SpaceState }>(path, { photos, force: force || outOfTurn });
      applyState(r.state);
      haptic('success');
      boom(xp >= 3 ? 'big' : 'small');
      toast(t('cm.success', { xp }), 'ok');
      catBus.emit({ type: 'done', name: actor.name });
      onClose();
    } catch (e: any) {
      if (e?.code === 'out_of_turn') {
        setOutOfTurn(true);
      } else {
        toast(errText(e), 'err');
        haptic('error');
      }
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = !uploading && (!required || photos.length >= 1);

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="text-2xl">{item.emoji}</span>
          <span className="truncate">{item.title}</span>
        </span>
      }
      footer={
        outOfTurn ? (
          <div className="space-y-2">
            <div className="rounded-2xl bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              ⚠️ {t('cm.outOfTurn', { name: state.space[(item as Task).turnRole].name })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button variant="success" onClick={() => submit(true)} loading={busy} disabled={!canSubmit}>
                {t('cm.outOfTurnBtn')}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="success" size="lg" className="w-full" onClick={() => submit(false)} loading={busy} disabled={!canSubmit}>
            {uploading ? t('cm.uploading') : t('cm.confirm', { xp })}
          </Button>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Avatar value={actor.avatar} size={24} />
          {t('cm.as', { name: actor.name })}
        </div>
        {photoMode !== 'none' && (
          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-white">📷 {t('cm.photos')}</span>
              <span className={`text-xs ${required ? 'text-sky-300' : 'text-slate-500'}`}>{required ? t('cm.photosReq') : t('cm.photosOpt')}</span>
            </div>
            <PhotoPicker key={pickerKey} spaceId={state.space.id} max={2} onChange={setPhotos} onBusyChange={setUploading} />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
function ItemDetailModal({ target, onClose }: { target: { kind: 'task' | 'counter'; item: Task | Counter } | null; onClose: () => void }) {
  const { t, state, lang, run, applyState, nameOf } = useApp();
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; i: number } | null>(null);
  const spaceId = state?.space.id;
  const itemId = target?.item.id;
  const logsVersion = state?.logs[0]?.id;

  useEffect(() => {
    if (!itemId || !spaceId) return;
    let cancelled = false;
    api
      .get<{ logs: LogEntry[] }>(`/spaces/${spaceId}/logs?itemId=${encodeURIComponent(itemId)}&from=0`)
      .then((r) => !cancelled && setLogs(r.logs))
      .catch(() => !cancelled && setLogs([]));
    return () => {
      cancelled = true;
    };
  }, [itemId, spaceId, logsVersion]);

  useEffect(() => {
    if (!target) setLogs(null);
  }, [target]);

  if (!target || !state) return null;
  const { item } = target;

  const undo = async (log: LogEntry) => {
    if (!(await tgConfirm(t('td.undoConfirm')))) return;
    const s = await run(() => api.del<SpaceState>(`/spaces/${state.space.id}/logs/${log.id}`));
    if (s) {
      applyState(s);
      setLogs((ls) => ls?.filter((l) => l.id !== log.id) ?? null);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="text-2xl">{item.emoji}</span>
          <span className="truncate">{item.title}</span>
        </span>
      }
    >
      {target.kind === 'task' && state.space.mode === 'symmetric' && (
        <div className="mb-3 flex items-center gap-2 rounded-2xl bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
          <Avatar value={state.space[(item as Task).turnRole].avatar} size={22} />
          {t('pp.turn', { name: state.space[(item as Task).turnRole].name })}
        </div>
      )}
      <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t('td.history')}</div>
      {logs === null ? (
        <div className="py-6 text-center">
          <Spinner />
        </div>
      ) : logs.length === 0 ? (
        <div className="py-6 text-center text-sm text-slate-500">{t('td.empty')}</div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="rounded-2xl border border-white/5 bg-slate-950/40 p-3">
              <div className="flex items-center gap-2">
                <Avatar value={state.space[l.role].avatar} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    {nameOf(l.role)}{' '}
                    {l.outOfTurn && <span className="ml-1 rounded-full bg-amber-500/15 px-1.5 text-[10px] text-amber-300">{t('td.outOfTurn')}</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtDate(l.createdAt, lang, { day: 'numeric', month: 'short', weekday: 'short' })} · {fmtTime(l.createdAt, lang)}
                  </div>
                </div>
                <span className="text-sm font-bold text-amber-300">+{l.xp}</span>
                <button onClick={() => undo(l)} className="rounded-lg px-2 py-1 text-xs text-slate-500 active:bg-white/5">
                  ↶
                </button>
              </div>
              {l.photos.length > 0 && (
                <div className="mt-2">
                  <PhotoThumbs photos={l.photos} size={72} onOpen={(i) => setLightbox({ photos: l.photos, i })} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.i} onClose={() => setLightbox(null)} />}
    </Modal>
  );
}

export { other };
