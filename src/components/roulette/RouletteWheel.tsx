import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { Disc, Trophy, Sparkles, RotateCw, AlertTriangle, Gift, ArrowRight, Calendar, Settings, Check, Clock } from 'lucide-react';
import { triggerHaptic, triggerSuccessHaptic } from '../../services/telegram';
import { CycleType } from '../../types';
import { getUkrainianDaysText } from '../dashboard/CycleCountdownBanner';

export const RouletteWheel: React.FC = () => {
  const { users, activeUser, partnerUser, userXpMap, rouletteItems, household, updateHousehold, resetCycle } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerItem, setWinnerItem] = useState<string | null>(null);
  const [selectedPoolType, setSelectedPoolType] = useState<'reward' | 'penalty'>('reward');
  const [customDaysInput, setCustomDaysInput] = useState<string>(
    household.cycle_days ? String(household.cycle_days) : '40'
  );
  const [showCustomInput, setShowCustomInput] = useState<boolean>(household.cycle_type === 'custom');

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
    '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
    '#d946ef', '#f97316', '#06b6d4', '#a855f7'
  ];

  // Draw Wheel on canvas with crisp resolution
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas || activeSectors.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = 280;
    const displayHeight = 280;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    const centerX = displayWidth / 2;
    const centerY = displayHeight / 2;
    const radius = Math.min(centerX, centerY) - 12;

    ctx.clearRect(0, 0, displayWidth, displayHeight);

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

      // Sector Gradient Fill
      const sectorColor = colors[i % colors.length];
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
      grad.addColorStop(0, sectorColor);
      grad.addColorStop(1, adjustColorBrightness(sectorColor, -25));

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Inner sector divider rim
      ctx.beginPath();
      ctx.arc(0, 0, radius - 2, startAngle, endAngle);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();

      // Sector Text
      ctx.save();
      ctx.rotate(startAngle + anglePerSector / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;

      const text = activeSectors[i].text;
      const truncated = text.length > 18 ? text.substring(0, 16) + '...' : text;
      ctx.fillText(truncated, radius - 18, 4);
      ctx.restore();
    }

    // Outer Rim Glow Circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Center Gold Pin Hub
    const hubGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    hubGrad.addColorStop(0, '#fef08a');
    hubGrad.addColorStop(0.5, '#eab308');
    hubGrad.addColorStop(1, '#854d0e');

    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    // Center Star / Icon Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px sans-serif';
    ctx.fillText('👑', 0, 0);

    ctx.restore();
  };

  // Helper color adjuster for sector gradients
  function adjustColorBrightness(hex: string, percent: number) {
    let num = parseInt(hex.replace('#', ''), 16),
      amt = Math.round(2.55 * percent),
      R = (num >> 16) + amt,
      G = ((num >> 8) & 0x00ff) + amt,
      B = (num & 0x0000ff) + amt;
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

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

    // Center angle of winning sector in standard canvas coords (0° is 3 o'clock)
    const centerAngleOfSector = winningIndex * anglePerSector + anglePerSector / 2;
    // Top pointer is located at 12 o'clock (270°)
    let targetRotation = 270 - centerAngleOfSector;

    // Calculate rotation delta from current rotation
    const currentRotationMod = rotation % 360;
    let delta = (targetRotation - currentRotationMod) % 360;
    if (delta < 0) delta += 360;

    const extraSpins = 360 * 6; // 6 full turns
    const totalNewRotation = rotation + extraSpins + delta;

    setRotation(totalNewRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinnerItem(activeSectors[winningIndex].text);
      triggerSuccessHaptic();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 4000);
  };

  // Cycle Config Handler
  const handleSetCycleType = (type: CycleType, days?: number) => {
    triggerHaptic('medium');
    if (type === 'custom') {
      setShowCustomInput(true);
      const targetDays = days || parseInt(customDaysInput, 10) || 40;
      const periodEndDate = new Date(Date.now() + targetDays * 86400000).toISOString();
      updateHousehold({
        cycle_type: 'custom',
        cycle_days: targetDays,
        period_end_date: periodEndDate,
      });
    } else if (type === 'weekly') {
      setShowCustomInput(false);
      const periodEndDate = new Date(Date.now() + 7 * 86400000).toISOString();
      updateHousehold({
        cycle_type: 'weekly',
        cycle_days: 7,
        period_end_date: periodEndDate,
      });
    } else if (type === 'monthly') {
      setShowCustomInput(false);
      const periodEndDate = new Date(Date.now() + 30 * 86400000).toISOString();
      updateHousehold({
        cycle_type: 'monthly',
        cycle_days: 30,
        period_end_date: periodEndDate,
      });
    } else {
      setShowCustomInput(false);
      updateHousehold({
        cycle_type: 'off',
      });
    }
  };

  const handleSaveCustomDays = () => {
    const parsed = parseInt(customDaysInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleSetCycleType('custom', parsed);
    }
  };

  // Current Cycle info
  const currentCycleType = household.cycle_type || 'monthly';
  const endDateMs = household.period_end_date ? new Date(household.period_end_date).getTime() : 0;
  const remainingDays = Math.max(0, Math.ceil((endDateMs - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-5 pb-20 animate-fadeIn">
      {/* Winner Summary Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-amber-400/40 text-amber-300 mx-auto flex items-center justify-center text-3xl mb-2 shadow-inner">
          👑
        </div>

        <h2 className="font-extrabold text-white text-lg tracking-tight">
          Підсумки періоду (Фінал)
        </h2>

        {!isTie ? (
          <p className="text-xs text-slate-300 mt-1">
            Переможець циклу: <span className="font-bold text-amber-400">{periodWinner.first_name}</span> (з перевагою у {Math.abs(xp1 - xp2)} XP!)
          </p>
        ) : (
          <p className="text-xs text-amber-300 mt-1 font-semibold">
            Нічия в балах! Боротьба була рівною 🤝
          </p>
        )}

        {/* Reward mode switcher */}
        <div className="flex bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/80 max-w-xs mx-auto mt-4 shadow-inner">
          <button
            onClick={() => setSelectedPoolType('reward')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              selectedPoolType === 'reward'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Призи (Переможцю)</span>
          </button>
          <button
            onClick={() => setSelectedPoolType('penalty')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              selectedPoolType === 'penalty'
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Штрафи (Поступаючому)</span>
          </button>
        </div>
      </div>

      {/* Cyber-Gold Wheel Canvas Container */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center relative">
        {/* Glowing Cyber Pointer */}
        <div className="z-20 -mb-4 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 drop-shadow-[0_4px_10px_rgba(245,158,11,0.8)]" />
        </div>

        {/* Wheel Border Ring */}
        <div className="relative p-2 rounded-full bg-gradient-to-b from-amber-400/80 via-amber-600/50 to-slate-800 border-4 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.3)] my-2">
          <canvas
            ref={canvasRef}
            style={{
              width: 280,
              height: 280,
              transform: `rotate(${rotation}deg)`,
            }}
            className="rounded-full shadow-2xl transition-transform duration-[4000ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
          />
        </div>

        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={spinning || activeSectors.length === 0}
          className={`mt-4 w-full max-w-xs py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-xl ${
            spinning
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 shadow-amber-500/30 shadow-lg'
          }`}
        >
          <RotateCw className={`w-5 h-5 ${spinning ? 'animate-spin' : ''}`} />
          <span>{spinning ? 'Обертається...' : 'КРУТИТИ РУЛЕТКУ 🎡'}</span>
        </button>

        {/* Result Announcement Display */}
        {winnerItem && (
          <div className="mt-4 bg-slate-900/90 border-2 border-amber-400 rounded-2xl p-4 text-center max-w-xs w-full animate-bounce shadow-2xl">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-400">
              Випадковий вибір долі:
            </span>
            <p className="font-extrabold text-white text-base mt-1 leading-snug">{winnerItem}</p>
          </div>
        )}
      </div>

      {/* Cycle Configuration Selector Section ("коли бажаєте завершити цикл?") */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2.5">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="font-extrabold text-white text-sm">
            Коли бажаєте завершити цикл?
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Оберіть періодичність підбиття підсумків балів XP та розіграшу рулетки:
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Weekly */}
          <button
            onClick={() => handleSetCycleType('weekly')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
              currentCycleType === 'weekly'
                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📅 Щотижня (7д)</span>
            {currentCycleType === 'weekly' && <Check className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Monthly */}
          <button
            onClick={() => handleSetCycleType('monthly')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
              currentCycleType === 'monthly'
                ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>📆 Щомісяця (30д)</span>
            {currentCycleType === 'monthly' && <Check className="w-4 h-4 text-indigo-400" />}
          </button>

          {/* Custom */}
          <button
            onClick={() => handleSetCycleType('custom')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
              currentCycleType === 'custom'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span>⚙️ Свій термін</span>
            {currentCycleType === 'custom' && <Check className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Off */}
          <button
            onClick={() => handleSetCycleType('off')}
            className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
              currentCycleType === 'off'
                ? 'bg-slate-700/50 border-slate-600 text-slate-200'
                : 'bg-slate-800/60 border-slate-700/70 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span>⏸️ Без таймера</span>
            {currentCycleType === 'off' && <Check className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Custom Days Input */}
        {showCustomInput && currentCycleType === 'custom' && (
          <div className="pt-2 flex items-center space-x-2 animate-fadeIn">
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                max="365"
                value={customDaysInput}
                onChange={(e) => setCustomDaysInput(e.target.value)}
                placeholder="Кількість днів (напр. 40)"
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl py-2 px-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">днів</span>
            </div>

            <button
              onClick={handleSaveCustomDays}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-colors"
            >
              Встановити
            </button>
          </div>
        )}

        {/* Current status detail */}
        {currentCycleType !== 'off' && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 flex items-center justify-between mt-2">
            <span>Залишилось до завершення:</span>
            <span className="font-extrabold text-amber-400">
              {remainingDays} {getUkrainianDaysText(remainingDays)}
            </span>
          </div>
        )}
      </div>

      {/* Cycle Reset Action */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-center space-y-2">
        <p className="text-xs text-slate-400">
          Після визначення переможця та розіграшу ви можете скинути рахунок і почати новий цикл.
        </p>
        <button
          onClick={resetCycle}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border border-slate-700/80"
        >
          <span>Почати новий цикл 🔄</span>
          <ArrowRight className="w-4 h-4 text-indigo-400" />
        </button>
      </div>
    </div>
  );
};
