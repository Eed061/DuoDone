import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { Disc, Trophy, Sparkles, RotateCw, AlertTriangle, Gift, ArrowRight } from 'lucide-react';
import { triggerHaptic, triggerSuccessHaptic } from '../../services/telegram';

export const RouletteWheel: React.FC = () => {
  const { users, userXpMap, rouletteItems, household, resetCycle } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerItem, setWinnerItem] = useState<string | null>(null);
  const [selectedPoolType, setSelectedPoolType] = useState<'reward' | 'penalty'>('reward');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (users.length < 2) return null;

  const user1 = users[0];
  const user2 = users[1];

  const xp1 = userXpMap[user1.id] || 0;
  const xp2 = userXpMap[user2.id] || 0;

  let periodWinner = user1;
  let periodLoser = user2;
  let isTie = xp1 === xp2;

  if (xp2 > xp1) {
    periodWinner = user2;
    periodLoser = user1;
  }

  // Filter items for selected pool
  const activeSectors = rouletteItems.filter((i) => i.type === selectedPoolType);

  const colors = [
    '#6366f1', '#ec4899', '#10b981', '#f59e0b',
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6'
  ];

  // Render Wheel on canvas
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || activeSectors.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    ctx.clearRect(0, 0, width, height);

    const numSectors = activeSectors.length;
    const anglePerSector = (2 * Math.PI) / numSectors;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotation * Math.PI) / 180);

    for (let i = 0; i < numSectors; i++) {
      const startAngle = i * anglePerSector;
      const endAngle = startAngle + anglePerSector;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Sector Text
      ctx.save();
      ctx.rotate(startAngle + anglePerSector / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';

      const text = activeSectors[i].text;
      const truncated = text.length > 20 ? text.substring(0, 18) + '...' : text;
      ctx.fillText(truncated, radius - 20, 4);
      ctx.restore();
    }

    // Center pin
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#6366f1';
    ctx.stroke();

    ctx.restore();
  };

  useEffect(() => {
    drawWheel();
  }, [rotation, activeSectors, selectedPoolType]);

  const spinWheel = () => {
    if (spinning || activeSectors.length === 0) return;
    setSpinning(true);
    setWinnerItem(null);
    triggerHaptic('heavy');

    const numSectors = activeSectors.length;
    const winningIndex = Math.floor(Math.random() * numSectors);
    const anglePerSector = 360 / numSectors;

    // Calculate rotation angle to align winning sector under top pointer
    // Top pointer is at 270 deg (or 0 relative to canvas top)
    const targetSectorAngle = 360 - winningIndex * anglePerSector - anglePerSector / 2;
    const extraTurns = 360 * 5; // 5 full spins
    const totalNewRotation = rotation + extraTurns + (targetSectorAngle - (rotation % 360));

    setRotation(totalNewRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinnerItem(activeSectors[winningIndex].text);
      triggerSuccessHaptic();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, 4000);
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Winner Summary Banner */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center text-2xl mb-2 shadow-inner">
          👑
        </div>

        <h2 className="font-extrabold text-white text-lg tracking-tight">
          Підсумки періоду (Фінал)
        </h2>

        {!isTie ? (
          <p className="text-xs text-slate-300 mt-1">
            Переможець місяця: <span className="font-bold text-amber-400">{periodWinner.first_name}</span> (з перевагою у {Math.abs(xp1 - xp2)} XP!)
          </p>
        ) : (
          <p className="text-xs text-amber-300 mt-1 font-semibold">
            Нічия в балах! Боротьба була рівною 🤝
          </p>
        )}

        {/* Reward mode switcher */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60 max-w-xs mx-auto mt-4">
          <button
            onClick={() => setSelectedPoolType('reward')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              selectedPoolType === 'reward'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Призи (Переможцю)</span>
          </button>
          <button
            onClick={() => setSelectedPoolType('penalty')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1 ${
              selectedPoolType === 'penalty'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Штрафи (Тому хто поступився)</span>
          </button>
        </div>
      </div>

      {/* Wheel Canvas Container */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-center relative">
        {/* Top Pointer */}
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 z-20 drop-shadow-md -mb-3" />

        <div className="relative my-2">
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="rounded-full shadow-2xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
            style={{
              transform: `rotate(${rotation}deg)`,
            }}
          />
        </div>

        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={spinning || activeSectors.length === 0}
          className={`mt-4 w-full max-w-xs py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-xl active:scale-95 ${
            spinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-indigo-500/25'
          }`}
        >
          <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
          <span>{spinning ? 'Обертається...' : 'КРУТИТИ РУЛЕТКУ 🎡'}</span>
        </button>

        {/* Result Winner Display */}
        {winnerItem && (
          <div className="mt-4 bg-slate-900 border-2 border-amber-400/80 rounded-2xl p-4 text-center max-w-xs w-full animate-bounce">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Випадковий вибір долі:
            </span>
            <p className="font-extrabold text-white text-base mt-0.5">{winnerItem}</p>
          </div>
        )}
      </div>

      {/* New Month Cycle Reset */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-lg text-center">
        <p className="text-xs text-slate-400 mb-2">
          Після розіграшу підсумків ви можете закрити раунд і почати новий місяць з чистим балансом XP.
        </p>
        <button
          onClick={resetCycle}
          className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
        >
          <span>Почати новий місячний цикл</span>
          <ArrowRight className="w-4 h-4 text-indigo-400" />
        </button>
      </div>
    </div>
  );
};
