import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { Avatar } from './ui';
import { CreateSpaceModal, JoinModal, ProfileModal } from './SpaceModals';
import { haptic } from '../lib/tg';
import type { Role } from '../types';

export function Header() {
  const { t, state, spaces, activeId, setActive } = useApp();
  const [menu, setMenu] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  const current = spaces.find((s) => s.id === activeId);
  const spaceName = state?.space.name || current?.name || '…';

  const partner = (r: Role) => {
    if (!state) return null;
    const p = state.space[r];
    const isMe = state.actingRole === r;
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <Avatar value={p.avatar} size={30} ring={isMe ? 'ring-violet-400' : p.linked ? 'ring-slate-700' : 'ring-slate-800'} />
        <div className="min-w-0 leading-tight">
          <div className="max-w-[64px] truncate text-[13px] font-semibold text-slate-100">{p.name}</div>
          <div className={`text-[10px] ${isMe ? 'text-violet-300' : 'text-slate-500'}`}>
            {isMe ? `● ${t('hdr.me')}` : p.linked ? '' : t('hdr.waiting')}
          </div>
        </div>
      </div>
    );
  };

  return (
    <header className="pt-safe px-safe relative z-30 shrink-0 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-2.5">
        <div ref={ref} className="relative min-w-0 flex-1">
          <button
            onClick={() => {
              setMenu((m) => !m);
              haptic('select');
            }}
            className="flex max-w-full items-center gap-1.5 rounded-xl py-1 pr-2 text-left active:opacity-70"
          >
            <span className="truncate text-[17px] font-extrabold text-white">{spaceName}</span>
            <span className={`text-xs text-slate-400 transition ${menu ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {menu && (
            <div className="anim-pop absolute top-full left-0 z-40 mt-1 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
              <div className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">{t('hdr.spaces')}</div>
              <div className="scroll-y max-h-72">
                {spaces.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActive(s.id);
                      setMenu(false);
                      haptic('select');
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${s.id === activeId ? 'bg-violet-500/10' : 'active:bg-white/5'}`}
                  >
                    <span className="flex -space-x-2">
                      <Avatar value={s.p1Avatar} size={26} />
                      <Avatar value={s.p2Avatar} size={26} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{s.name}</span>
                      <span className="block truncate text-xs text-slate-400">
                        {s.p1Name} & {s.p2Name}
                      </span>
                    </span>
                    {s.id === activeId && <span className="text-violet-300">✓</span>}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/5 p-2">
                <button
                  onClick={() => {
                    setMenu(false);
                    setCreateOpen(true);
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-violet-300 active:bg-white/5"
                >
                  + {t('hdr.create')}
                </button>
                <button
                  onClick={() => {
                    setMenu(false);
                    setJoinOpen(true);
                  }}
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-300 active:bg-white/5"
                >
                  🔑 {t('hdr.joinCode')}
                </button>
              </div>
            </div>
          )}
        </div>
        {state && (
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-2 rounded-2xl bg-white/5 px-2 py-1 active:scale-95" aria-label={t('hdr.profile')}>
            {partner('p1')}
            <span className="text-xs text-slate-600">&</span>
            {partner('p2')}
          </button>
        )}
      </div>
      <CreateSpaceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  );
}

export function BottomNav() {
  const { t, tab, setTab } = useApp();
  const items = [
    { id: 'home', icon: '🏠', label: t('nav.home') },
    { id: 'calendar', icon: '📅', label: t('nav.calendar') },
    { id: 'roulette', icon: '🎡', label: t('nav.roulette') },
    { id: 'settings', icon: '⚙️', label: t('nav.settings') },
  ] as const;
  return (
    <nav className="pb-safe px-safe relative z-30 shrink-0 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const active = tab === it.id;
          return (
            <button
              key={it.id}
              onClick={() => {
                if (!active) haptic('select');
                setTab(it.id);
              }}
              className="flex flex-col items-center gap-0.5 py-2"
            >
              <span className={`grid h-8 w-14 place-items-center rounded-full text-xl transition ${active ? 'bg-violet-500/20' : ''}`}>
                {it.icon}
              </span>
              <span className={`text-[11px] font-semibold ${active ? 'text-violet-300' : 'text-slate-500'}`}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
