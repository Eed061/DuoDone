import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../store';
import { catBus } from '../lib/utils';
import { haptic } from '../lib/tg';

export function CatCounselor() {
  const { state, pick } = useApp();
  const [bubble, setBubble] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastTextRef = useRef<string>('');
  const stepRef = useRef(0);

  const enabled = !!state?.space.catEnabled;
  const catName = state?.space.catName || 'Мурчик';

  const pickUnique = useCallback(
    (pool: 'cat.hello' | 'cat.done' | 'cat.leader' | 'cat.tie' | 'cat.cycle', vars: Record<string, string | number>) => {
      let text = pick(pool, vars);
      for (let i = 0; i < 5 && text === lastTextRef.current; i++) {
        text = pick(pool, vars);
      }
      lastTextRef.current = text;
      return text;
    },
    [pick],
  );

  const sayNext = useCallback(() => {
    const cur = stateRef.current;
    if (!cur) return;
    const { p1, p2 } = cur.xp;
    const turn = stepRef.current++;
    if (turn % 3 === 1 && (p1 > 0 || p2 > 0)) {
      if (p1 === p2) {
        setBubble(pickUnique('cat.tie', { cat: catName }));
        return;
      }
      const leader = p1 > p2 ? cur.space.p1.name : cur.space.p2.name;
      setBubble(pickUnique('cat.leader', { name: leader, cat: catName }));
      return;
    }
    setBubble(pickUnique('cat.hello', { cat: catName }));
  }, [catName, pickUnique]);

  useEffect(() => {
    if (!enabled || !stateRef.current) {
      setBubble(null);
      return;
    }

    const unsub = catBus.on((ev) => {
      if (ev.type === 'done') setBubble(pickUnique('cat.done', { name: ev.name, cat: catName }));
      else if (ev.type === 'cycle') setBubble(pickUnique('cat.cycle', { cat: catName }));
      else sayNext();
    });

    const helloTimer = setTimeout(() => {
      sayNext();
    }, 2500);

    const periodic = setInterval(() => {
      sayNext();
    }, 28000);

    return () => {
      unsub();
      clearTimeout(helloTimer);
      clearInterval(periodic);
    };
  }, [enabled, catName, state?.space.id, pickUnique, sayNext]);

  useEffect(() => {
    if (!bubble) return;
    const t = setTimeout(() => setBubble(null), 8000);
    return () => clearTimeout(t);
  }, [bubble]);

  if (!enabled) return null;

  return (
    <div
      className="fixed right-3 z-40 flex max-w-xs items-end gap-2"
      style={{ bottom: 'calc(var(--safe-bottom) + 74px)' }}
    >
      {bubble && (
        <div
          onClick={() => setBubble(null)}
          className="anim-pop cursor-pointer rounded-2xl rounded-br-sm border border-violet-400/30 bg-slate-900/95 px-3.5 py-2.5 text-xs leading-snug text-slate-100 shadow-2xl backdrop-blur"
        >
          <div className="mb-0.5 flex items-center justify-between gap-2 font-extrabold text-violet-300">
            <span>🐾 {catName}</span>
            <span className="text-[10px] text-slate-500">✕</span>
          </div>
          <div>{bubble}</div>
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          haptic('light');
          sayNext();
        }}
        title={catName}
        className="anim-cat grid h-11 w-11 shrink-0 place-items-center rounded-full border border-violet-400/40 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-2xl shadow-lg active:scale-90"
      >
        🐱
      </button>
    </div>
  );
}
