import { Trade, MonthlyGoals } from '../types.ts';
import { netPnl } from './trade.ts';
import { DEFAULT_MONTHLY_GOALS } from './constants.ts';

export interface MonthGoalSummary {
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "September 2026"
  isCurrentMonth: boolean;
  trades: Trade[];
  tradeCount: number;
  wins: number;
  losses: number;
  breakevens: number;
  netPnl: number;
  grossProfit: number;
  grossLoss: number;
  winRate: number;
  targetProfit: number;
  targetWinRate: number;
  targetTrades: number;
  profitProgress: number; // raw percentage, e.g. 84.5%
  profitProgressClamped: number; // clamped 0-100 for bar width
  winRateProgress: number; // raw percentage of target achieved
  winRateProgressClamped: number;
  tradesProgress: number;
  winRateDelta: number; // winRate - targetWinRate
  profitDelta: number; // netPnl - targetProfit
  isProfitAchieved: boolean;
  isWinRateAchieved: boolean;
  isTradeVolumeHit: boolean;
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  dailyRunRateNeeded: number;
  status: 'achieved' | 'on_track' | 'behind' | 'drawdown';
  statusLabel: string;
}

export function getCurrentMonthKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function formatMonthShort(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

export function getAvailableMonths(trades: Trade[]): string[] {
  const current = getCurrentMonthKey();
  const set = new Set<string>();
  set.add(current);

  trades.forEach((t) => {
    if (t.datetime && t.datetime.length >= 7) {
      set.add(t.datetime.slice(0, 7));
    }
  });

  return Array.from(set).sort((a, b) => b.localeCompare(a));
}

export function getMonthGoalSummary(
  trades: Trade[],
  monthKey: string = getCurrentMonthKey(),
  goalsConfig?: MonthlyGoals
): MonthGoalSummary {
  const goals = goalsConfig || DEFAULT_MONTHLY_GOALS;
  const override = goals.monthOverrides?.[monthKey];

  const targetProfit = override?.targetProfit ?? goals.targetProfit ?? DEFAULT_MONTHLY_GOALS.targetProfit ?? 1500;
  const targetWinRate = override?.targetWinRate ?? goals.targetWinRate ?? DEFAULT_MONTHLY_GOALS.targetWinRate ?? 60;
  const targetTrades = override?.targetTrades ?? goals.targetTrades ?? DEFAULT_MONTHLY_GOALS.targetTrades ?? 25;

  const currentMonthKey = getCurrentMonthKey();
  const isCurrentMonth = monthKey === currentMonthKey;

  // Filter trades for this month
  const monthTrades = trades.filter((t) => t.datetime && t.datetime.startsWith(monthKey));

  let wins = 0;
  let losses = 0;
  let breakevens = 0;
  let netProfitLoss = 0;
  let grossProfit = 0;
  let grossLoss = 0;

  monthTrades.forEach((t) => {
    const p = netPnl(t);
    netProfitLoss += p;
    if (p > 0.01) {
      wins++;
      grossProfit += p;
    } else if (p < -0.01) {
      losses++;
      grossLoss += Math.abs(p);
    } else {
      breakevens++;
    }
  });

  const tradeCount = monthTrades.length;
  const winRate = tradeCount > 0 ? (wins / tradeCount) * 100 : 0;

  // Progress metrics
  const profitProgress = targetProfit > 0 ? (netProfitLoss / targetProfit) * 100 : 0;
  const profitProgressClamped = Math.min(100, Math.max(0, profitProgress));

  const winRateProgress = targetWinRate > 0 ? (winRate / targetWinRate) * 100 : 0;
  const winRateProgressClamped = Math.min(100, Math.max(0, winRateProgress));

  const tradesProgress = targetTrades > 0 ? (tradeCount / targetTrades) * 100 : 0;

  const winRateDelta = winRate - targetWinRate;
  const profitDelta = netProfitLoss - targetProfit;

  const isProfitAchieved = netProfitLoss >= targetProfit && targetProfit > 0;
  const isWinRateAchieved = winRate >= targetWinRate && tradeCount >= 5;
  const isTradeVolumeHit = tradeCount >= targetTrades && targetTrades > 0;

  // Calendar time metrics
  const [yearStr, monthStr] = monthKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIdx = parseInt(monthStr, 10); // 1-12
  const daysInMonth = new Date(year, monthIdx, 0).getDate();

  const now = new Date();
  let daysElapsed = daysInMonth;
  let daysRemaining = 0;

  if (isCurrentMonth) {
    daysElapsed = Math.min(daysInMonth, Math.max(1, now.getDate()));
    daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  }

  const profitGap = Math.max(0, targetProfit - netProfitLoss);
  const dailyRunRateNeeded = daysRemaining > 0 ? profitGap / daysRemaining : profitGap;

  // Status classification
  let status: 'achieved' | 'on_track' | 'behind' | 'drawdown' = 'behind';
  let statusLabel = 'In Progress';

  if (isProfitAchieved && isWinRateAchieved) {
    status = 'achieved';
    statusLabel = 'Targets Crushed! 🏆';
  } else if (isProfitAchieved) {
    status = 'achieved';
    statusLabel = 'Profit Target Met! 🎯';
  } else if (netProfitLoss < 0) {
    status = 'drawdown';
    statusLabel = 'In Drawdown ⚠️';
  } else {
    // Expected run rate based on elapsed days
    const expectedPnlByNow = (targetProfit / daysInMonth) * daysElapsed;
    if (netProfitLoss >= expectedPnlByNow * 0.85) {
      status = 'on_track';
      statusLabel = 'On Track 🟢';
    } else {
      status = 'behind';
      statusLabel = 'Behind Pace ⏳';
    }
  }

  return {
    monthKey,
    monthLabel: formatMonthLabel(monthKey),
    isCurrentMonth,
    trades: monthTrades,
    tradeCount,
    wins,
    losses,
    breakevens,
    netPnl: netProfitLoss,
    grossProfit,
    grossLoss,
    winRate,
    targetProfit,
    targetWinRate,
    targetTrades,
    profitProgress,
    profitProgressClamped,
    winRateProgress,
    winRateProgressClamped,
    tradesProgress,
    winRateDelta,
    profitDelta,
    isProfitAchieved,
    isWinRateAchieved,
    isTradeVolumeHit,
    daysInMonth,
    daysElapsed,
    daysRemaining,
    dailyRunRateNeeded,
    status,
    statusLabel,
  };
}
