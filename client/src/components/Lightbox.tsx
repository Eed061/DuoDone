import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveMediaUrl } from '../lib/api';

/** Fullscreen photo viewer (1–2 photos). Tap outside / ✕ to close, arrows or swipe to switch. */
export function Lightbox({ photos, index = 0, onClose }: { photos: string[]; index?: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [startX, setStartX] = useState<number | null>(null);
  useEffect(() => setI(index), [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => Math.min(photos.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photos.length, onClose]);
  if (!photos.length) return null;
  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-[60] flex flex-col bg-black/95"
      onClick={onClose}
      onTouchStart={(e) => setStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (startX == null) return;
        const dx = e.changedTouches[0].clientX - startX;
        if (dx < -50) setI((x) => Math.min(photos.length - 1, x + 1));
        if (dx > 50) setI((x) => Math.max(0, x - 1));
        setStartX(null);
      }}
    >
      <div className="flex items-center justify-between px-4" style={{ paddingTop: 'calc(var(--safe-top) + 12px)' }}>
        <span className="text-sm text-slate-300">
          {photos.length > 1 ? `${i + 1} / ${photos.length}` : ''}
        </span>
        <button className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-3">
        <img
          src={resolveMediaUrl(photos[i])}
          alt=""
          className="max-h-full max-w-full rounded-xl object-contain"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
      {photos.length > 1 && (
        <div className="flex justify-center gap-2" style={{ paddingBottom: 'calc(var(--safe-bottom) + 16px)' }}>
          {photos.map((p, k) => (
            <button
              key={p}
              onClick={(e) => {
                e.stopPropagation();
                setI(k);
              }}
              className={`h-14 w-14 overflow-hidden rounded-lg border-2 ${k === i ? 'border-white' : 'border-transparent opacity-60'}`}
            >
              <img src={resolveMediaUrl(p)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function PhotoThumbs({ photos, onOpen, size = 56 }: { photos: string[]; onOpen: (i: number) => void; size?: number }) {
  if (!photos.length) return null;
  return (
    <div className="flex gap-2">
      {photos.map((p, i) => (
        <button
          key={p}
          onClick={(e) => {
            e.stopPropagation();
            onOpen(i);
          }}
          className="overflow-hidden rounded-xl border border-white/10 bg-slate-800"
          style={{ width: size, height: size }}
        >
          <img src={resolveMediaUrl(p)} alt="" loading="lazy" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
