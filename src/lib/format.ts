import { PRICE_DECIMALS } from './constants.ts';

let CURRENCY = '$';

export function setCurrency(c: string) {
  CURRENCY = c || '$';
}

export function getCurrency(): string {
  return CURRENCY;
}

export const fmtMoney = (n: number, dec: number = 2): string => {
  if (isNaN(n) || !isFinite(n)) return `${CURRENCY}0.00`;
  return (
    CURRENCY +
    Math.abs(n).toLocaleString('en-US', {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
    })
  );
};

export const fmtSigned = (n: number, dec: number = 2): string => {
  if (!isFinite(n)) return '—';
  const sign = n > 0 ? '+' : n < 0 ? '-' : '';
  return sign + fmtMoney(n, dec);
};

export const fmtNum = (n: number, dec: number = 2): string => {
  if (isNaN(n) || !isFinite(n)) return '0.00';
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
};

export const fmtPct = (n: number, dec: number = 2): string => {
  if (isNaN(n) || !isFinite(n)) return '0.00%';
  return `${n >= 0 ? '+' : ''}${n.toFixed(dec)}%`;
};

export const fmtPrice = (n: number, sym: string): string => {
  if (isNaN(n)) return '—';
  const d = PRICE_DECIMALS[sym] ?? 2;
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

export const pnlColor = (n: number): string => {
  if (n > 0) return 'text-emerald-400';
  if (n < 0) return 'text-rose-400';
  return 'text-slate-400';
};

export const pnlBg = (n: number): string => {
  if (n > 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (n < 0) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

export const nowLocal = (): string => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export const parseDate = (s: string): Date | null => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

export const fmtDate = (s: string): string => {
  const d = parseDate(s);
  return d
    ? d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

export const fmtDateTime = (s: string): string => {
  const d = parseDate(s);
  return d
    ? d.toLocaleString('en-US', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '—';
};

export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const uid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// Subtle audio feedback using Web Audio API (safe, zero external dependency)
export function playTradeSound(type: 'win' | 'loss' | 'click') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'win') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'loss') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(220.0, now + 0.2); // A3
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    // ignore audio block
  }
}

export const playTone = (freqOrType: any, duration?: number, type?: any) => {
  if (typeof freqOrType === 'string') {
    playTradeSound(freqOrType as any);
  } else if (typeof freqOrType === 'number') {
    if (freqOrType > 500) playTradeSound('win');
    else if (freqOrType < 300) playTradeSound('loss');
    else playTradeSound('click');
  } else {
    playTradeSound('click');
  }
};
