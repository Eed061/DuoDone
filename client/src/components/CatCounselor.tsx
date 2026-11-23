import { useEffect, useState } from 'react';
import { useApp } from '../store';
import { catBus } from '../lib/utils';

export function CatCounselor() {
  const { state, pick } = useApp();
  const [bubble, setBubble] = useState<string | null>(null);

  const enabled = !!state?.space.catEnabled;
  const catName = state?.space.catName || 'Мурчик';

  useEffect(() => {
    if (!enabled || !state) {
      setBubble(null);
      return;
    }
    const show = (text: string) => setBubble(text);

    const unsub = catBus.on((ev) => {
      if (ev.type === 'done') show(pick('cat.done', { name: ev.name, cat: catName }));
      else if (ev.type === 'cycle') show(pick('cat.cycle', { cat: catName }));
      else show(pick('cat.hello', { cat: catName }));
    });

    const helloTimer = setTimeout(() => {
      show(pick('cat.hello', { cat: catName }));
    }, 3500);

    const periodic = setInterval(() => {
      const { p1, p2 } = state.xp;
      if (p1 === p2 && p1 > 0) show(pick('cat.tie', { cat: catName }));
      else if (p1 !== p2) {
        const leader = p1 > p2 ? state.space.p1.name : state.space.p2.name;
        show(pick('cat.leader', { name: leader, cat: catName }));
      } else {
        show(pick('cat.hello', { cat: catName }));
      }
    }, 55000);

    return () => {
      unsub();
      clearTimeout(helloTimer);
      clearInterval(periodic);
    };
  }, [enabled, catName, state?.space.id, pick]);

  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(null), 6500);
    return () => clearTimeout(t);
  }, [bubble]);

  if (!enabled || !bubble) return null;

  return (
    <div
      onClick={() => setBubble(null)}
      className="anim-pop fixed right-3 z-40 flex max-w-xs cursor-pointer items-end gap-2"
      style={{ bottom: 'calc(var(--safe-bottom) + 74px)' }}
    >
      <div className="rounded-2xl rounded-br-sm border border-violet-400/30 bg-slate-900/95 px-3.5 py-2.5 text-xs leading-snug text-slate-100 shadow-2xl backdrop-blur">
        <div className="mb-0.5 font-extrabold text-violet-300">🐾 {catName}</div>
        <div>{bubble}</div>
      </div>
      <div className="anim-cat grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet-400/40 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-2xl shadow-lg">
        🐱
      </div>
    </div>
  );
}
