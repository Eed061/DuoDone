import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { prepareImage } from '../lib/image';
import { useApp } from '../store';
import { haptic } from '../lib/tg';
import { Spinner } from './ui';

type Item = { id: number; preview: string; url?: string; status: 'uploading' | 'done' | 'error'; blob?: Blob };

/**
 * Photo picker for iOS / Telegram WebView:
 *  - plain <input type="file" accept="image/*" multiple> WITHOUT `capture` (capture breaks gallery choice in Telegram iOS)
 *  - images are compressed on the client and uploaded immediately; only URLs are passed up.
 */
export function PhotoPicker({
  spaceId,
  max = 2,
  onChange,
  onBusyChange,
}: {
  spaceId: string;
  max?: number;
  onChange: (urls: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { t, toast } = useApp();
  const [items, setItems] = useState<Item[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    onChange(items.filter((i) => i.status === 'done' && i.url).map((i) => i.url!));
    onBusyChange?.(items.some((i) => i.status === 'uploading'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.preview)), []);

  const upload = async (id: number, blob: Blob) => {
    try {
      const url = await api.upload(blob, spaceId);
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, url, status: 'done', blob: undefined } : x)));
    } catch {
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status: 'error' } : x)));
      toast(t('err.upload_failed'), 'err');
    }
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const free = max - itemsRef.current.length;
    const list = Array.from(files).slice(0, Math.max(0, free));
    if (inputRef.current) inputRef.current.value = '';
    // process sequentially: decoding several 12MP photos at once can crash iOS WebView
    for (const f of list) {
      const id = ++seq.current;
      let blob: Blob;
      try {
        blob = await prepareImage(f);
      } catch {
        toast(t('err.not_an_image'), 'err');
        continue;
      }
      const preview = URL.createObjectURL(blob);
      setItems((xs) => [...xs, { id, preview, status: 'uploading', blob }]);
      upload(id, blob);
    }
    haptic('light');
  };

  const remove = (id: number) => {
    setItems((xs) => {
      const it = xs.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.preview);
      return xs.filter((x) => x.id !== id);
    });
  };

  const retry = (it: Item) => {
    if (!it.blob) return;
    setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, status: 'uploading' } : x)));
    upload(it.id, it.blob);
  };

  return (
    <div className="flex gap-3">
      {items.map((it) => (
        <div key={it.id} className="relative h-24 w-24 overflow-hidden rounded-2xl border border-white/10 bg-slate-800">
          <img src={it.preview} alt="" className="h-full w-full object-cover" />
          {it.status === 'uploading' && (
            <div className="absolute inset-0 grid place-items-center bg-black/50">
              <Spinner />
            </div>
          )}
          {it.status === 'error' && (
            <button onClick={() => retry(it)} className="absolute inset-0 grid place-items-center bg-rose-900/70 text-2xl">
              ↻
            </button>
          )}
          <button
            onClick={() => remove(it.id)}
            className="absolute top-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-sm text-white"
            aria-label="remove"
          >
            ✕
          </button>
        </div>
      ))}
      {items.length < max && (
        <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-white/15 bg-slate-950/40 text-center text-slate-400 active:scale-95">
          <span>
            <span className="block text-2xl">📷</span>
            <span className="block px-1 text-[11px] leading-tight">{t('cm.addPhoto')}</span>
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max - items.length > 1}
            className="sr-only"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      )}
    </div>
  );
}
