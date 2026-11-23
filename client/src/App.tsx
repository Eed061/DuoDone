import { useState } from 'react';
import { AppProvider, useApp } from './store';
import { Header, BottomNav } from './components/Header';
import { CatCounselor } from './components/CatCounselor';
import { Dashboard } from './views/Dashboard';
import { CalendarView } from './views/CalendarView';
import { RouletteWheel } from './views/RouletteWheel';
import { Settings } from './views/Settings';
import { Button, Card, Field, inputCls, Spinner } from './components/ui';

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

function Shell() {
  const { booted, bootError, spaces, activeId, tab, online, toasts, t, retryBoot } = useApp();

  return (
    <div className="app-shell flex flex-col bg-slate-950 text-slate-100">
      {/* Toasts */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[70] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
        style={{ top: 'calc(var(--safe-top) + 10px)' }}
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            className={`anim-pop pointer-events-auto rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-2xl backdrop-blur ${
              x.kind === 'err'
                ? 'border-rose-400/40 bg-rose-950/90 text-rose-100'
                : x.kind === 'ok'
                  ? 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'
                  : 'border-white/10 bg-slate-900/95 text-white'
            }`}
          >
            {x.text}
          </div>
        ))}
      </div>

      {bootError ? (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div className="mb-3 text-4xl">⚡</div>
          <div className="mb-4 max-w-xs text-sm text-slate-300">{t(`err.${bootError}` as any)}</div>
          <Button onClick={retryBoot}>{t('common.retry')}</Button>
        </div>
      ) : !booted ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Spinner className="h-7 w-7" />
          <div className="text-sm text-slate-400">{t('common.loading')}</div>
        </div>
      ) : spaces.length === 0 || !activeId ? (
        <Onboarding />
      ) : (
        <>
          <Header />
          {!online && (
            <div className="bg-amber-500/15 px-4 py-1.5 text-center text-xs font-semibold text-amber-200">{t('misc.offline')}</div>
          )}
          <main className="scroll-y px-safe flex-1">
            <div className="mx-auto max-w-md px-4 pt-3 pb-24">
              {tab === 'home' && <Dashboard />}
              {tab === 'calendar' && <CalendarView />}
              {tab === 'roulette' && <RouletteWheel />}
              {tab === 'settings' && <Settings />}
            </div>
          </main>
          <CatCounselor />
          <BottomNav />
        </>
      )}
    </div>
  );
}

function Onboarding() {
  const { t, createSpace, joinByCode, restore, lang, setMeAndSpaces, run } = useApp();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [rKey, setRKey] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const [busyCreate, setBusyCreate] = useState(false);
  const [busyJoin, setBusyJoin] = useState(false);

  const onCreate = async () => {
    setBusyCreate(true);
    await createSpace(name.trim() || t('onb.spaceNamePh'));
    setBusyCreate(false);
  };

  const onJoin = async () => {
    if (!code.trim()) return;
    setBusyJoin(true);
    await joinByCode(code.trim());
    setBusyJoin(false);
  };

  return (
    <div className="scroll-y pt-safe pb-safe px-safe flex-1">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-3xl shadow-xl shadow-fuchsia-500/25">
            💞
          </div>
          <h1 className="text-2xl font-extrabold text-white">{t('onb.welcome')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('onb.desc')}</p>
        </div>

        <Card className="space-y-3">
          <Field label={t('onb.spaceName')}>
            <input
              className={inputCls}
              value={name}
              maxLength={60}
              placeholder={t('onb.spaceNamePh')}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onCreate()}
            />
          </Field>
          <Button className="w-full" size="lg" onClick={onCreate} loading={busyCreate}>
            ✨ {t('onb.create')}
          </Button>
        </Card>

        <div className="my-4 flex items-center gap-3 text-xs uppercase text-slate-600">
          <span className="h-px flex-1 bg-white/10" />
          {t('common.or')}
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Card className="space-y-3">
          <Field label={t('onb.join')}>
            <input
              className={`${inputCls} text-center font-mono tracking-widest uppercase`}
              value={code}
              placeholder={t('onb.codePh')}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && onJoin()}
            />
          </Field>
          <Button variant="secondary" className="w-full" onClick={onJoin} loading={busyJoin} disabled={!code.trim()}>
            🔑 {t('onb.joinBtn')}
          </Button>
        </Card>

        <div className="mt-6 text-center">
          <button onClick={() => setShowRestore((s) => !s)} className="text-xs font-semibold text-slate-400 underline">
            {t('onb.restore')}
          </button>
          {showRestore && (
            <div className="mt-3 flex gap-2">
              <input
                className={`${inputCls} text-center font-mono tracking-widest uppercase`}
                value={rKey}
                placeholder={t('onb.restorePh')}
                onChange={(e) => setRKey(e.target.value.toUpperCase())}
              />
              <Button variant="secondary" onClick={() => restore(rKey)} disabled={!rKey.trim()}>
                →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
