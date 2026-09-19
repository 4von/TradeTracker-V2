import { Trade } from '../types.ts';
import { parseDate } from './format.ts';
import { PIP_SIZES } from './constants.ts';

export function detectSession(dateStr: string): string {
  const d = parseDate(dateStr);
  if (!d) return 'London';
  // Use UTC or local hour
  const h = d.getHours();
  if (h >= 0 && h < 7) return 'Asian';
  if (h >= 7 && h < 12) return 'London';
  if (h >= 12 && h < 16) return 'NY Overlap';
  if (h >= 16 && h < 21) return 'New York';
  return 'Sydney';
}

export function unitsOf(t: Pick<Trade, 'lots' | 'lotMultiplier'>): number {
  return (Number(t.lots) || 0) * (Number(t.lotMultiplier) || 0);
}

export function grossPnl(t: Pick<Trade, 'lots' | 'lotMultiplier' | 'entry' | 'exit' | 'direction'>): number {
  const u = unitsOf(t);
  const e = Number(t.entry) || 0;
  const x = Number(t.exit) || 0;
  return (t.direction === 'Long' ? x - e : e - x) * u;
}

export function netPnl(t: Pick<Trade, 'lots' | 'lotMultiplier' | 'entry' | 'exit' | 'direction' | 'commission' | 'swap'>): number {
  return grossPnl(t) - (Number(t.commission) || 0) - (Number(t.swap) || 0);
}

export function rMultiple(t: Trade): number | null {
  const e = Number(t.entry) || 0;
  const sl = Number(t.stopLoss) || 0;
  if (!sl || !e) return null;
  const riskAmount = Math.abs(e - sl) * unitsOf(t) + (Number(t.commission) || 0);
  if (riskAmount <= 0) return null;
  return netPnl(t) / riskAmount;
}

export function plannedRR(t: Pick<Trade, 'entry' | 'stopLoss' | 'target'>): number | null {
  const e = Number(t.entry) || 0;
  const sl = Number(t.stopLoss) || 0;
  const tp = Number(t.target) || 0;
  if (!e || !sl || !tp) return null;
  const risk = Math.abs(e - sl);
  const reward = Math.abs(tp - e);
  if (risk <= 0) return null;
  return reward / risk;
}

export function calculatePipDifference(symbol: string, p1: number, p2: number): number {
  const pipSize = PIP_SIZES[symbol] || 0.0001;
  return Math.abs(p1 - p2) / pipSize;
}

export function pipDifference(t: Pick<Trade, 'symbol' | 'entry' | 'exit' | 'direction'>): number {
  const pipSize = PIP_SIZES[t.symbol] || 0.0001;
  const e = Number(t.entry) || 0;
  const x = Number(t.exit) || 0;
  if (!x) return 0;
  const diff = t.direction === 'Long' ? x - e : e - x;
  return diff / pipSize;
}

export { computeStats } from './analytics.ts';

export function calculatePositionSize(
  symbol: string,
  accountBalance: number,
  riskPercent: number,
  entry: number,
  stopLoss: number,
  lotMultiplier: number
): { lots: number; riskAmount: number; pipsRisk: number; marginRequired: number } {
  const riskAmount = (accountBalance * (riskPercent / 100));
  const diff = Math.abs(entry - stopLoss);
  const pipSize = PIP_SIZES[symbol] || 0.0001;
  const pipsRisk = diff > 0 ? diff / pipSize : 0;

  if (diff <= 0 || lotMultiplier <= 0) {
    return { lots: 0.1, riskAmount, pipsRisk: 0, marginRequired: 0 };
  }

  // riskAmount = lots * lotMultiplier * diff
  // lots = riskAmount / (lotMultiplier * diff)
  const exactLots = riskAmount / (lotMultiplier * diff);
  const lots = Math.max(0.01, Math.round(exactLots * 100) / 100);
  const marginRequired = (lots * lotMultiplier * entry) / 100; // Assuming 1:100 leverage

  return { lots, riskAmount, pipsRisk, marginRequired };
}
