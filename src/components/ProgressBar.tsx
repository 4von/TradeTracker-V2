import React from 'react';
import { CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

export type ProgressBarColor = 'auto' | 'emerald' | 'sky' | 'amber' | 'violet' | 'rose';
export type ProgressBarSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  sublabel?: string;
  currentLabel?: string;
  targetLabel?: string;
  colorScheme?: ProgressBarColor;
  size?: ProgressBarSize;
  showPercentage?: boolean;
  showStatusIcon?: boolean;
  isNegative?: boolean;
  animate?: boolean;
  className?: string;
}

export default function ProgressBar({
  value,
  max,
  label,
  sublabel,
  currentLabel,
  targetLabel,
  colorScheme = 'auto',
  size = 'md',
  showPercentage = true,
  showStatusIcon = true,
  isNegative = false,
  animate = true,
  className = '',
}: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const clampedWidth = Math.min(100, Math.max(0, percentage));
  const isComplete = percentage >= 100;
  const isNear = percentage >= 80 && percentage < 100;

  // Resolve color dynamically if 'auto'
  const resolvedColor = (() => {
    if (colorScheme !== 'auto') return colorScheme;
    if (isNegative) return 'rose';
    if (isComplete) return 'emerald';
    if (isNear) return 'sky';
    return 'violet';
  })();

  // Style mappings
  const colorStyles: Record<string, { bar: string; glow: string; text: string; badge: string }> = {
    emerald: {
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]',
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    sky: {
      bar: 'bg-gradient-to-r from-sky-500 to-blue-500',
      glow: 'shadow-[0_0_12px_rgba(14,165,233,0.35)]',
      text: 'text-sky-400',
      badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    },
    violet: {
      bar: 'bg-gradient-to-r from-violet-500 to-indigo-500',
      glow: 'shadow-[0_0_12px_rgba(139,92,246,0.35)]',
      text: 'text-violet-400',
      badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    },
    amber: {
      bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.35)]',
      text: 'text-amber-400',
      badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    rose: {
      bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
      glow: 'shadow-[0_0_12px_rgba(244,63,94,0.35)]',
      text: 'text-rose-400',
      badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
  };

  const currentTheme = colorStyles[resolvedColor] || colorStyles.sky;

  const heightClasses: Record<ProgressBarSize, string> = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {/* Header labels */}
      {(label || currentLabel || targetLabel || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            {label && (
              <span className="font-semibold text-slate-200 truncate">
                {label}
              </span>
            )}
            {sublabel && (
              <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                ({sublabel})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            {currentLabel && (
              <span className={`font-bold ${isNegative ? 'text-rose-400' : currentTheme.text}`}>
                {currentLabel}
              </span>
            )}
            {targetLabel && (
              <>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{targetLabel}</span>
              </>
            )}
            {showPercentage && (
              <span
                className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isNegative
                    ? colorStyles.rose.badge
                    : isComplete
                    ? colorStyles.emerald.badge
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {isNegative ? '-' : ''}
                {Math.abs(percentage).toFixed(0)}%
              </span>
            )}
            {showStatusIcon && isComplete && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            {showStatusIcon && isNegative && (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
          </div>
        </div>
      )}

      {/* Track & Filled Bar */}
      <div
        className={`w-full bg-slate-900/90 border border-slate-800/80 rounded-full overflow-hidden p-0.5 relative ${heightClasses[size]}`}
        role="progressbar"
        aria-valuenow={Math.round(clampedWidth)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out relative ${currentTheme.bar} ${
            isComplete ? currentTheme.glow : ''
          }`}
          style={{ width: `${clampedWidth}%` }}
        >
          {/* Subtle sheen highlight on completion */}
          {isComplete && (
            <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
