import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store';
import { api } from '../lib/api';
import { fmtDate, fmtMonth, fmtTime, weekdayNames } from '../lib/utils';
import { haptic, tgConfirm } from '../lib/tg';
import type { LogEntry, SpaceState } from '../types';
import { Avatar, Card, SectionTitle, Spinner } from '../components/ui';
import { Lightbox, PhotoThumbs } from '../components/Lightbox';

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function CalendarView() {
  const { t, state, lang, nameOf, run, applyState, toast } = useApp();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [limit, setLimit] = useState(30);
  const [logs, setLogs] = useState<LogEntry[] | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; i: number } | null>(null);

  const spaceId = state?.space.id;
  const logsSyncKey = state ? `${state.logs.length}:${state.logs[0]?.id || ''}:${state.logs.filter((x) => x.deleteRequestedBy).map((x) => `${x.id}_${x.deleteRequestedBy}`).join(',')}` : '';
  const prevViewKey = useRef('');

  useEffect(() => {
    if (!spaceId) return;
    const viewKey = `${spaceId}:${cursor.getFullYear()}-${cursor.getMonth()}`;
    const isNewView = prevViewKey.current !== viewKey;
    prevViewKey.current = viewKey;
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getTime();
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
    let cancelled = false;
    if (isNewView) setLogs(null);
    api
      .get<{ logs: LogEntry[] }>(`/spaces/${spaceId}/logs?from=${from}&to=${to}`)
      .then((r) => !cancelled && setLogs(r.logs))
      .catch(() => !cancelled && isNewView && setLogs([]));
    return () => {
      cancelled = true;
    };
  }, [spaceId, cursor, logsSyncKey]);

  const byDay = useMemo(() => {
    const m = new Map<string, { p1: number; p2: number; photos: number; logs: LogEntry[] }>();
    for (const l of logs || []) {
      const k = dayKey(l.createdAt);
      let g = m.get(k);
      if (!g) {
        g = { p1: 0, p2: 0, photos: 0, logs: [] };
        m.set(k, g);
      }
      g[l.role] += 1;
      g.photos += l.photos.length;
      g.logs.push(l);
    }
    return m;
  }, [logs]);

  if (!state) return null;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0..Sun=6
  const todayKey = dayKey(Date.now());
  const visibleLogs = selectedDay ? byDay.get(selectedDay)?.logs || [] : logs || [];

  const shiftMonth = (delta: number) => {
    haptic('select');
    setSelectedDay(null);
    setLimit(30);
    setCursor(new Date(year, month + delta, 1));
  };

  const handleDeleteAction = async (log: LogEntry, cancel = false) => {
    if (!cancel && !log.deleteRequestedBy) {
      if (!(await tgConfirm(t('td.undoConfirm')))) return;
    } else if (!cancel && log.deleteRequestedBy && log.deleteRequestedBy !== state.actingRole) {
      if (!(await tgConfirm(t('td.confirmDeletePrompt')))) return;
    }
    const r = await run(() =>
      api.del<SpaceState & { deleteStatus?: 'requested' | 'cancelled' | 'deleted' }>(
        `/spaces/${state.space.id}/logs/${log.id}${cancel ? '?cancel=1' : ''}`,
      ),
    );
    if (!r) return;
    applyState(r);
    if (r.deleteStatus === 'deleted') {
      setLogs((ls) => ls?.filter((l) => l.id !== log.id) ?? null);
      toast(t('td.deletedToast'), 'ok');
    } else if (r.deleteStatus === 'cancelled') {
      setLogs((ls) => ls?.map((l) => (l.id === log.id ? { ...l, deleteRequestedBy: null } : l)) ?? null);
      toast(t('td.deleteCancelledToast'), 'info');
    } else {
      setLogs((ls) => ls?.map((l) => (l.id === log.id ? { ...l, deleteRequestedBy: state.actingRole } : l)) ?? null);
      toast(t('td.deleteRequestedToast'), 'info');
    }
  };

  return (
    <div className="space-y-3">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-slate-200 active:scale-95">
            ‹
          </button>
          <div className="text-base font-extrabold text-white">{fmtMonth(cursor, lang)}</div>
          <button onClick={() => shiftMonth(1)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-lg text-slate-200 active:scale-95">
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-slate-500">
          {weekdayNames(lang).map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }, (_, i) => (
            <div key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, idx) => {
            const day = idx + 1;
            const k = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const info = byDay.get(k);
            const sel = selectedDay === k;
            const isToday = k === todayKey;
            return (
              <button
                key={k}
                onClick={() => {
                  haptic('select');
                  setLimit(30);
                  setSelectedDay(sel ? null : k);
                }}
                className={`relative flex h-11 flex-col items-center justify-center rounded-2xl text-sm font-semibold transition ${
                  sel
                    ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                    : isToday
                      ? 'border border-violet-400/50 bg-violet-500/10 text-violet-200'
                      : info
                        ? 'bg-slate-800/70 text-slate-100'
                        : 'text-slate-400 active:bg-white/5'
                }`}
              >
                <span>{day}</span>
                {info && (
                  <span className="mt-0.5 flex items-center gap-0.5">
                    {info.p1 > 0 && <span className={`h-1.5 w-1.5 rounded-full ${sel ? 'bg-white' : 'bg-violet-400'}`} />}
                    {info.p2 > 0 && <span className={`h-1.5 w-1.5 rounded-full ${sel ? 'bg-cyan-200' : 'bg-cyan-400'}`} />}
                    {info.photos > 0 && <span className="text-[8px] leading-none">📷</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              {state.space.p1.name}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              {state.space.p2.name}
            </span>
          </div>
          {selectedDay && (
            <button onClick={() => setSelectedDay(null)} className="font-semibold text-violet-300">
              {t('cal.allPeriod')}
            </button>
          )}
        </div>
      </Card>

      <SectionTitle
        right={
          selectedDay ? (
            <span className="text-xs text-slate-400">
              {fmtDate(new Date(selectedDay + 'T12:00:00').getTime(), lang, { day: 'numeric', month: 'long' })}
            </span>
          ) : (
            <span className="text-xs text-slate-500">{t('cal.allPeriod')}</span>
          )
        }
      >
        📜 {t('cal.events')}
      </SectionTitle>

      {logs === null ? (
        <div className="py-8 text-center">
          <Spinner />
        </div>
      ) : visibleLogs.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">{t('cal.noEvents')}</Card>
      ) : (
        <div className="space-y-2">
          {visibleLogs.slice(0, limit).map((l) => (
            <Card key={l.id} className="!p-3">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-800 text-2xl">{l.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-white">
                    {l.title}
                    {l.kind === 'counter' && l.amount > 1 ? ` (×${l.amount})` : ''}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                    <Avatar value={state.space[l.role].avatar} size={16} />
                    <span className={l.role === 'p1' ? 'text-violet-300' : 'text-cyan-300'}>{nameOf(l.role)}</span>
                    <span>·</span>
                    <span>
                      {fmtDate(l.createdAt, lang, { day: 'numeric', month: 'short' })} {fmtTime(l.createdAt, lang)}
                    </span>
                    {l.outOfTurn && <span className="rounded-full bg-amber-500/15 px-1.5 text-[10px] text-amber-300">{t('td.outOfTurn')}</span>}
                  </div>
                </div>
                {l.xp > 0 && <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-300">+{l.xp} XP</span>}
                {!l.deleteRequestedBy && (
                  <button
                    onClick={() => handleDeleteAction(l, false)}
                    className="rounded-lg px-2 py-1 text-xs text-slate-400 active:bg-white/5"
                    title={t('td.undo')}
                  >
                    🗑️
                  </button>
                )}
              </div>
              {l.photos.length > 0 && (
                <div className="mt-2.5 pl-14">
                  <PhotoThumbs photos={l.photos} size={76} onOpen={(i) => setLightbox({ photos: l.photos, i })} />
                </div>
              )}
              {l.deleteRequestedBy && (
                <div
                  className={`mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-xs ${
                    l.deleteRequestedBy === state.actingRole
                      ? 'border-amber-400/20 bg-amber-500/10 text-amber-200'
                      : 'border-rose-400/30 bg-rose-500/15 text-rose-100'
                  }`}
                >
                  {l.deleteRequestedBy === state.actingRole ? (
                    <>
                      <span>⏳ {t('td.waitPartner', { name: nameOf(state.actingRole === 'p1' ? 'p2' : 'p1') })}</span>
                      <button
                        onClick={() => handleDeleteAction(l, true)}
                        className="rounded-xl bg-white/10 px-2.5 py-1 font-semibold text-white active:scale-95"
                      >
                        ✕ {t('td.cancelDeleteBtn')}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold">⚠️ {t('td.partnerWantsDelete', { name: nameOf(l.deleteRequestedBy) })}</span>
                      <span className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteAction(l, true)}
                          className="rounded-xl bg-white/10 px-2.5 py-1 font-semibold text-slate-200 active:scale-95"
                        >
                          ✕ {t('common.no')}
                        </button>
                        <button
                          onClick={() => handleDeleteAction(l, false)}
                          className="rounded-xl bg-rose-500 px-2.5 py-1 font-bold text-white shadow active:scale-95"
                        >
                          ✓ {t('td.confirmDeleteBtn')}
                        </button>
                      </span>
                    </>
                  )}
                </div>
              )}
            </Card>
          ))}
          {visibleLogs.length > limit && (
            <button
              onClick={() => setLimit((n) => n + 30)}
              className="w-full rounded-2xl bg-white/5 py-2.5 text-sm font-semibold text-slate-300 active:scale-[0.99]"
            >
              {t('cal.showMore', { n: visibleLogs.length - limit })}
            </button>
          )}
        </div>
      )}

      {lightbox && <Lightbox photos={lightbox.photos} index={lightbox.i} onClose={() => setLightbox(null)} />}
    </div>
  );
}
