import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Heart } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

const CAT_QUOTES = [
  'Підбивати підсумки місяця краще за келихом вина 🍷 Але дивіться, щоб не дійшло до поножовщини! 😅',
  'Пам’ятайте: Всесвіт надав вам другу половинку не для суперечок через посуд! А посуд зачекає до завтра ✨',
  'Життя — це не пуста, як зв’язала! Побутові проблеми дрібні, а ваше кохання — це цілий Всесвіт 💖',
  'Будь-який побутовий конфлікт завжди вирішується обіймами. І шматочком ковбаски 🍖',
  'Я котик з великими очима 🐱 і вважаю, що ви обоє — котики! Залиште пилосос і сходіть на побачення 🎬',
  'Нерви дорожчі за розкидані шкарпетки 🧦 Якщо хтось забув винести сміття — закрутіть рулетку на масаж 💆‍♂️',
  'Келих вина + гарний настрій = 0 претензій щодо прибирання. Перевірено мур-експертами! 🥂',
  'Життя надто коротке, щоб сваритися через миття вікон. Обійміться просто зараз! 🥰',
];

interface CatCounselorProps {
  forceShow?: boolean;
  onForceClose?: () => void;
}

export const CatCounselor: React.FC<CatCounselorProps> = ({ forceShow, onForceClose }) => {
  const { household } = useApp();
  const isEnabled = household.cat_counselor_enabled !== false; // enabled by default
  const catName = household.cat_counselor_name || 'Мур-Амур';

  const [visible, setVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState('');

  const pickRandomQuote = () => {
    const idx = Math.floor(Math.random() * CAT_QUOTES.length);
    setCurrentQuote(CAT_QUOTES[idx]);
  };

  useEffect(() => {
    if (!isEnabled) {
      setVisible(false);
      return;
    }

    // Initial delayed popup after 6 seconds
    const initialTimer = setTimeout(() => {
      pickRandomQuote();
      setVisible(true);
    }, 6000);

    // Periodic random popup every 60 seconds
    const interval = setInterval(() => {
      pickRandomQuote();
      setVisible(true);
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isEnabled]);

  useEffect(() => {
    if (forceShow) {
      pickRandomQuote();
      setVisible(true);
    }
  }, [forceShow]);

  if (!isEnabled || !visible) return null;

  const handleClose = () => {
    triggerHaptic('light');
    setVisible(false);
    if (onForceClose) onForceClose();
  };

  return (
    <div className="fixed bottom-20 right-3 left-3 z-50 max-w-sm mx-auto animate-bounceIn">
      <div className="bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-purple-950/95 border-2 border-amber-400/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md relative overflow-hidden flex items-start space-x-3">
        {/* Decorative ambient glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Close Button ✕ */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-amber-200/60 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors z-10"
          title="Сховати котика"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cat Avatar with big eyes */}
        <div className="relative shrink-0 pt-1">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-amber-500/30">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-3xl shadow-inner animate-pulse">
              🐱
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black px-1 py-0.2 rounded-full border border-slate-900 shadow">
            🐾
          </span>
        </div>

        {/* Speech Bubble Content */}
        <div className="flex-1 pr-5">
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="font-extrabold text-amber-300 text-xs tracking-tight">
              Котик {catName}
            </span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold border border-amber-500/30">
              Порада дня ✨
            </span>
          </div>

          <p className="text-xs text-slate-100 font-medium leading-snug">
            "{currentQuote}"
          </p>
        </div>
      </div>
    </div>
  );
};
