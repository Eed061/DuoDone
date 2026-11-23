import { useState } from 'react';
import { useApp } from '../store';
import { boom } from '../lib/utils';
import { haptic } from '../lib/tg';
import { Avatar, Button, Card, Modal, Segmented } from '../components/ui';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#6366f1', '#14b8a6', '#f43f5e'];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const s = polar(cx, cy, r, a1);
  const e = polar(cx, cy, r, a0);
  const large = a1 - a0 <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y} Z`;
}

const shortLabel = (s: string) => (s.length > 16 ? s.slice(0, 15) + '…' : s);

export function RouletteWheel() {
  const { t, state, setTab } = useApp();
  const [pool, setPool] = useState<'reward' | 'penalty'>('reward');
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  if (!state) return null;

  const items = state.roulette.filter((r) => r.pool === pool);
  const n = items.length;
  const { p1, p2 } = state.xp;
  const leader = p1 === p2 ? null : p1 > p2 ? state.space.p1 : state.space.p2;

  const switchPool = (p: 'reward' | 'penalty') => {
    if (spinning) return;
    haptic('select');
    setPool(p);
  };

  const spin = () => {
    if (spinning || n < 2) return;
    haptic('medium');
    setSpinning(true);
    setWinner(null);
    const idx = Math.floor(Math.random() * n);
    const slice = 360 / n;
    const jitter = (Math.random() - 0.5) * slice * 0.65;
    const targetMod = (360 - (idx + 0.5) * slice + jitter + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = 360 * (6 + Math.floor(Math.random() * 3)) + ((targetMod - currentMod + 360) % 360);
    setRotation((r) => r + delta);

    setTimeout(() => {
      setSpinning(false);
      setWinner(items[idx]?.text ?? null);
      haptic('success');
      boom('big');
    }, 4300);
  };

  return (
    <div className="space-y-4">
      <Segmented
        value={pool}
        onChange={switchPool}
        options={[
          { value: 'reward', label: `🎁 ${t('rl.rewards')}` },
          { value: 'penalty', label: `🎲 ${t('rl.penalties')}` },
        ]}
      />

      <div className="text-center text-xs text-slate-400">
        {pool === 'reward' ? t('rl.rewardsHint') : t('rl.penaltiesHint')}
        {leader && (
          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-slate-200">
            <Avatar value={leader.avatar} size={14} />
            {t('rl.winner', { name: leader.name })}
          </span>
        )}
      </div>

      {state.space.rewardType === 'text' && state.space.rewardText && pool === 'reward' && (
        <Card className="border-amber-400/30 bg-amber-500/10 text-center">
          <div className="text-xs font-bold uppercase text-amber-300">🏆 {t('rl.fixedPrize')}</div>
          <div className="mt-1 text-base font-extrabold text-white">{state.space.rewardText}</div>
        </Card>
      )}

      {n < 2 ? (
        <Card className="space-y-3 py-8 text-center">
          <div className="text-4xl">🎡</div>
          <div className="text-sm text-slate-400">{t('rl.empty')}</div>
          <Button size="sm" variant="secondary" onClick={() => setTab('settings')}>
            ⚙️ {t('nav.settings')}
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative my-2 h-80 w-80 max-w-full">
            {/* Pointer */}
            <div className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
              <div className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-amber-400" />
            </div>

            <div
              className="h-full w-full rounded-full p-2 shadow-2xl shadow-violet-500/20"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.18, 1)' : 'none',
              }}
            >
              <svg viewBox="0 0 320 320" className="h-full w-full overflow-visible">
                <circle cx="160" cy="160" r="156" fill="#0f172a" stroke="#ffffff22" strokeWidth="4" />
                {items.map((it, i) => {
                  const slice = 360 / n;
                  const a0 = i * slice;
                  const a1 = (i + 1) * slice;
                  const mid = a0 + slice / 2;
                  const color = COLORS[i % COLORS.length];
                  return (
                    <g key={it.id}>
                      <path d={wedgePath(160, 160, 150, a0, a1)} fill={color} stroke="#020617" strokeWidth="2" />
                      <g transform={`translate(160,160) rotate(${mid - 90})`}>
                        <text
                          x="84"
                          y="4"
                          fill="#fff"
                          fontSize={n > 10 ? 9 : 11}
                          fontWeight="700"
                          textAnchor="middle"
                          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                        >
                          {shortLabel(it.text)}
                        </text>
                      </g>
                    </g>
                  );
                })}
                <circle cx="160" cy="160" r="26" fill="#020617" stroke="#fff" strokeWidth="4" />
              </svg>
            </div>

            <button
              onClick={spin}
              disabled={spinning}
              className="absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-2xl active:scale-95"
              aria-label={t('rl.spin')}
            >
              🎯
            </button>
          </div>

          <Button size="lg" className="mt-2 w-60" onClick={spin} loading={spinning}>
            🎡 {spinning ? t('rl.spinning') : t('rl.spin')}
          </Button>
        </div>
      )}

      {items.length > 0 && (
        <Card className="!p-3">
          <div className="flex flex-wrap gap-1.5">
            {items.map((it, i) => (
              <span
                key={it.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/60 px-2.5 py-1 text-xs text-slate-200"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {it.text}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={!!winner}
        onClose={() => setWinner(null)}
        title={pool === 'reward' ? `🎁 ${t('rl.rewards')}` : `🎲 ${t('rl.penalties')}`}
        footer={
          <Button className="w-full" onClick={() => setWinner(null)}>
            {t('common.done')}
          </Button>
        }
      >
        <div className="py-4 text-center">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('rl.result')}</div>
          <div className="mt-2 text-2xl font-extrabold text-white">{winner}</div>
        </div>
      </Modal>
    </div>
  );
}
