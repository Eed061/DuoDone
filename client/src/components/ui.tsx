import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { resolveMediaUrl } from '../lib/api';
import { isUrlAvatar } from '../lib/utils';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      className="anim-fade fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="anim-pop sheet flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-2">
          <div className="min-w-0 flex-1 truncate text-lg font-bold text-white">{title}</div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-slate-300 active:scale-95"
            aria-label="close"
          >
            ✕
          </button>
        </div>
        <div className="scroll-y min-h-0 flex-1 px-5 pb-4">{children}</div>
        {footer && (
          <div className="border-t border-white/5 bg-slate-900 px-5 pt-3" style={{ paddingBottom: 'calc(var(--safe-bottom) + 12px)' }}>
            {footer}
          </div>
        )}
        {!footer && <div style={{ height: 'var(--safe-bottom)' }} />}
      </div>
    </div>,
    document.body,
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
};
export function Button({ variant = 'primary', size = 'md', loading, className = '', children, disabled, ...rest }: BtnProps) {
  const v = {
    primary: 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20',
    secondary: 'bg-white/8 text-slate-100 border border-white/10',
    ghost: 'bg-transparent text-slate-300',
    danger: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20',
  }[variant];
  const s = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-11 px-4 text-[15px] rounded-2xl', lg: 'h-13 px-5 text-base rounded-2xl' }[size];
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 ${v} ${s} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; desc?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
      role="switch"
      aria-checked={checked}
    >
      <span className="min-w-0">
        <span className="block text-[15px] text-slate-100">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-slate-400">{desc}</span>}
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-violet-500' : 'bg-slate-700'}`}>
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
}) {
  return (
    <div className="flex gap-1 rounded-2xl bg-slate-950/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition ${
            value === o.value ? 'bg-slate-700 text-white shadow' : 'text-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: React.ReactNode; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full h-12 rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-base text-white placeholder:text-slate-500 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/20';

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`rounded-3xl border border-white/5 bg-slate-900/80 p-4 shadow-xl shadow-black/20 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-2 mt-6 flex items-center justify-between px-1">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">{children}</h2>
      {right}
    </div>
  );
}

export function Avatar({ value, size = 36, ring }: { value: string; size?: number; ring?: string }) {
  const style = { width: size, height: size, fontSize: size * 0.55 };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-slate-800 ${ring ? `ring-2 ${ring}` : ''}`}
      style={style}
    >
      {isUrlAvatar(value) ? <img src={resolveMediaUrl(value)} alt="" className="h-full w-full object-cover" draggable={false} /> : <span>{value}</span>}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return <span className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white ${className}`} />;
}
