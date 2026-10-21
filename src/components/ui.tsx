import React from 'react';
import { cn } from '../lib/utils';

export function Card({ className, children, glass }: { className?: string; children: React.ReactNode; glass?: boolean }) {
  return <div className={cn(glass ? 'card-glass' : 'card', className)}>{children}</div>;
}

export function SectionTitle({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 rounded-xl bg-brand-500/15 p-2 text-brand-300">{icon}</div>}
        <div>
          <h2 className="text-lg font-bold text-slate-100 sm:text-xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const tones: Record<string, string> = {
    brand: 'bg-gradient-to-r from-brand-500 to-brand-300',
    green: 'bg-gradient-to-r from-emerald-500 to-emerald-300',
    amber: 'bg-gradient-to-r from-amber-500 to-amber-300',
    red: 'bg-gradient-to-r from-rose-500 to-rose-300',
  };
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', tones[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function Ring({ value, size = 92, stroke = 9, label, sub }: { value: number; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="transition-all duration-700"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#598cff" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-extrabold text-slate-100">{label ?? `${Math.round(value)}%`}</div>
        {sub && <div className="text-[10px] uppercase tracking-wide text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function Stat({ icon, label, value, tone = 'brand' }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'brand' | 'green' | 'amber' | 'violet' }) {
  const tones: Record<string, string> = {
    brand: 'text-brand-300 bg-brand-500/15',
    green: 'text-emerald-300 bg-emerald-500/15',
    amber: 'text-amber-300 bg-amber-500/15',
    violet: 'text-violet-300 bg-violet-500/15',
  };
  return (
    <Card className="p-4">
      <div className={cn('mb-3 inline-flex rounded-xl p-2', tones[tone])}>{icon}</div>
      <div className="text-2xl font-extrabold text-slate-100">{value}</div>
      <div className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
    </Card>
  );
}

const DIFF_TONE: Record<string, string> = {
  easy: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
  medium: 'border-amber-400/30 bg-amber-500/10 text-amber-300',
  hard: 'border-rose-400/30 bg-rose-500/10 text-rose-300',
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', DIFF_TONE[difficulty] || 'chip')}>{difficulty}</span>;
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('chip', className)}>{children}</span>;
}

export function EmptyState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: React.ReactNode }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 p-10 text-center">
      <div className="rounded-2xl bg-white/5 p-4 text-slate-400">{icon}</div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="max-w-md text-sm text-slate-400">{message}</p>
      {action}
    </Card>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={cn('card max-h-[90vh] w-full overflow-y-auto rounded-b-none p-5 animate-pop sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <button className="btn-ghost !px-2.5 !py-1.5" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white', className)} />
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-white/15')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  );
}
