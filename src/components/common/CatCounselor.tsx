import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X } from 'lucide-react';
import { triggerHaptic } from '../../services/telegram';

const CAT_QUOTES = [
  'Підбивати підсумки місяця краще за келихом вина 🍷 Але дивіться, щоб не дійшло до поножовщини! 😅',
  'Всесвіт надав вам другу половинку для кохання, а не для війни через посуд! Посуд зачекає до завтра 💖',
  'Будь-який побутовий конфлікт завжди вирішується обіймами... і шматочком ковбаски 🍖',
  'Життя надто коротке, щоб сваритися через розкидані шкарпетки. Залиште пилосос і сходіть на фільм 🎬',
  'Якщо хтось забув винести сміття — не сумуйте, просто закрутіть рулетку на масаж 💆‍♂️',
  'Кава у ліжко здатна пробачити навіть непомиту пательню. Випробувано! ☕',
  'Замість суперечок про вечерю — просто замовте піцу. Шлунок ситий, родина ціла! 🍕',
  'Диван не питає, хто скільки балів заробив. Диван просто чекає на вас обох 🛋️',
  'Непомита чашка — це не зрада батьківщини. Видихніть і поцілуйтесь 💋',
  'Пам’ятайте: перемагає не той, у кого більше XP, а той, хто першим зробив обійми 🤝',
  'Келих вина + обійми = 0 претензій щодо прибирання. Перевірено мур-експертами! 🥂',
  'Найкращий спосіб вибачити за незорієнтовані тапочки — це вечеря у ліжку 🥞',
  'Я Барсік Всемогутній і я наказую вам негайно обійнятися і забути про пилосос! 🐾',
];

interface CatCounselorProps {
  forceShow?: boolean;
  onForceClose?: () => void;
}

export const CatCounselor: React.FC<CatCounselorProps> = ({ forceShow, onForceClose }) => {
  const { household } = useApp();
  const isEnabled = household.cat_counselor_enabled !== false; // enabled by default
  const catName = household.cat_counselor_name || 'Барсік Всемогутній';

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

    // Initial delayed popup (after 25s)
    const initialTimer = setTimeout(() => {
      pickRandomQuote();
      setVisible(true);
    }, 25000);

    // Infrequent periodic popup (every 3.5 minutes)
    const interval = setInterval(() => {
      pickRandomQuote();
      setVisible(true);
    }, 210000);

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
    <div className="fixed bottom-16 right-2 left-2 z-50 max-w-sm mx-auto animate-slideUp border-none">
      <div className="relative flex items-end space-x-2">
        {/* Realistic Peeking Cat Head Cutout (no box container) */}
        <div className="relative shrink-0 -mb-2 group">
          <img
            src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&auto=format&fit=crop&q=80"
            alt={catName}
            className="w-16 h-16 rounded-full object-cover border-2 border-amber-400 shadow-2xl ring-4 ring-amber-500/20 transform hover:scale-110 transition-transform"
          />
          <span className="absolute -top-1 -right-1 text-base drop-shadow animate-bounce">
            🐾
          </span>
        </div>

        {/* Speech Bubble floating next to Peeking Cat */}
        <div className="flex-1 bg-gradient-to-br from-slate-900/95 via-amber-950/95 to-slate-900/95 border-2 border-amber-400/80 rounded-2xl rounded-bl-none p-3 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Close Button ✕ */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 text-amber-200/70 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors z-10"
            title="Сховати котика"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-5">
            <div className="flex items-center space-x-1.5 mb-1">
              <span className="font-extrabold text-amber-300 text-xs tracking-tight">
                {catName} 🐱
              </span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold border border-amber-500/30">
                Мудрість
              </span>
            </div>

            <p className="text-xs text-slate-100 font-medium leading-snug tracking-tight">
              "{currentQuote}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
