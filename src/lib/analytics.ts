import { Trade, Stats, EquityPoint, MonteCarloResult } from '../types.ts';
import { netPnl, rMultiple } from './trade.ts';
import { localDateKey, fmtMoney } from './format.ts';

export function computeStats(trades: Trade[], accountBalance: number): Stats {
  const sorted = trades.slice().sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  const n = sorted.length;
  const total = sorted.reduce((s, t) => s + netPnl(t), 0);
  const totalGross = sorted.reduce(
    (s, t) => s + (netPnl(t) + (Number(t.commission) || 0) + (Number(t.swap) || 0)),
    0
  );
  const totalCosts = sorted.reduce(
    (s, t) => s + ((Number(t.commission) || 0) + (Number(t.swap) || 0)),
    0
  );

  const wins = sorted.filter((t) => netPnl(t) > 0);
  const losses = sorted.filter((t) => netPnl(t) < 0);
  const breakevens = sorted.filter((t) => Math.abs(netPnl(t)) < 0.0001);

  const grossProfit = wins.reduce((s, t) => s + netPnl(t), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + netPnl(t), 0));
  const decided = wins.length + losses.length;
  const winRate = decided ? (wins.length / decided) * 100 : 0;
  const avgWin = wins.length ? grossProfit / wins.length : 0;
  const avgLoss = losses.length ? grossLoss / losses.length : 0;
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
  const expectancy = n ? total / n : 0;
  const rr = avgLoss > 0 ? avgWin / avgLoss : 0;

  const rMults = sorted
    .map(rMultiple)
    .filter((r): r is number => r !== null && isFinite(r));
  const avgR = rMults.length ? rMults.reduce((a, b) => a + b, 0) / rMults.length : 0;
  const totalR = rMults.reduce((a, b) => a + b, 0);

  // Equity Curve & Drawdowns
  let eq = 0;
  let peak = 0;
  let maxDD = 0;
  let maxDDPct = 0;

  const equity: EquityPoint[] = sorted.map((t, idx) => {
    const p = netPnl(t);
    eq += p;
    peak = Math.max(peak, eq);
    const dd = peak - eq;
    maxDD = Math.max(maxDD, dd);
    const baseBal = accountBalance > 0 ? accountBalance : 10000;
    const effectiveCapital = baseBal + peak;
    const ddPct = effectiveCapital > 0 ? (dd / effectiveCapital) * 100 : 0;
    maxDDPct = Math.max(maxDDPct, ddPct);

    return {
      x: t.datetime,
      y: eq,
      tradeIndex: idx + 1,
      pnl: p,
      r: rMultiple(t),
      peak,
      drawdown: dd,
      drawdownPct: ddPct,
    };
  });

  const currentDD = peak - eq;
  const currentEffective = (accountBalance > 0 ? accountBalance : 10000) + peak;
  const currentDDPct = currentEffective > 0 ? (currentDD / currentEffective) * 100 : 0;

  // Recovery factor
  const recoveryFactor = maxDD > 0 ? total / maxDD : total > 0 ? 99 : 0;

  // Standard Deviation & Sharpe / Sortino / SQN
  const pnls = sorted.map(netPnl);
  const meanPnl = n ? total / n : 0;
  const variance = n > 1 ? pnls.reduce((acc, p) => acc + Math.pow(p - meanPnl, 2), 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);

  // Downside deviation for Sortino
  const downsideVariance = n > 1
    ? pnls.filter((p) => p < 0).reduce((acc, p) => acc + Math.pow(p, 2), 0) / n
    : 0;
  const downsideDev = Math.sqrt(downsideVariance);

  const sharpeRatio = stdDev > 0 ? (meanPnl / stdDev) * Math.sqrt(252) : 0;
  const sortinoRatio = downsideDev > 0 ? (meanPnl / downsideDev) * Math.sqrt(252) : 0;

  // Van Tharp System Quality Number (SQN)
  let sqn = 0;
  let sqnRating = 'Insufficient Data';
  if (rMults.length >= 5) {
    const meanR = avgR;
    const rVar = rMults.reduce((acc, r) => acc + Math.pow(r - meanR, 2), 0) / (rMults.length - 1);
    const rStd = Math.sqrt(rVar);
    if (rStd > 0) {
      sqn = Math.sqrt(Math.min(rMults.length, 100)) * (meanR / rStd);
      if (sqn < 1.6) sqnRating = 'Poor / Below Average';
      else if (sqn < 2.0) sqnRating = 'Average';
      else if (sqn < 3.0) sqnRating = 'Good';
      else if (sqn < 5.0) sqnRating = 'Excellent';
      else sqnRating = 'Exceptional (Holy Grail)';
    }
  }

  // Kelly Criterion: K% = W - (1 - W) / R
  let kellyCriterion = 0;
  if (winRate > 0 && rr > 0) {
    const w = winRate / 100;
    kellyCriterion = Math.max(0, Math.min(25, (w - (1 - w) / rr) * 100));
  }

  const totalLots = sorted.reduce((s, t) => s + (Number(t.lots) || 0), 0);
  const avgLots = n ? totalLots / n : 0;
  const best = n ? sorted.reduce((a, b) => (netPnl(b) > netPnl(a) ? b : a)) : null;
  const worst = n ? sorted.reduce((a, b) => (netPnl(b) < netPnl(a) ? b : a)) : null;

  // Streaks
  let curStreak = 0;
  let curIsWin: boolean | null = null;
  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let rw = 0;
  let rl = 0;

  sorted.forEach((t) => {
    const w = netPnl(t) > 0;
    if (w) {
      rw++;
      rl = 0;
      maxWinStreak = Math.max(maxWinStreak, rw);
    } else if (netPnl(t) < 0) {
      rl++;
      rw = 0;
      maxLossStreak = Math.max(maxLossStreak, rl);
    }
  });

  if (sorted.length) {
    const lastWin = netPnl(sorted[sorted.length - 1]) > 0;
    curIsWin = lastWin;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if ((netPnl(sorted[i]) > 0) === lastWin) curStreak++;
      else break;
    }
  }

  const longs = sorted.filter((t) => t.direction === 'Long');
  const shorts = sorted.filter((t) => t.direction === 'Short');
  const longStats = {
    count: longs.length,
    pnl: longs.reduce((s, t) => s + netPnl(t), 0),
    win: longs.filter((t) => netPnl(t) > 0).length,
  };
  const shortStats = {
    count: shorts.length,
    pnl: shorts.reduce((s, t) => s + netPnl(t), 0),
    win: shorts.filter((t) => netPnl(t) > 0).length,
  };

  const totalPct = accountBalance > 0 ? (total / accountBalance) * 100 : 0;

  return {
    sorted,
    n,
    total,
    totalGross,
    totalCosts,
    wins,
    losses,
    breakevens,
    grossProfit,
    grossLoss,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    rr,
    equity,
    maxDD,
    maxDDPct,
    currentDD,
    currentDDPct,
    recoveryFactor,
    sharpeRatio,
    sortinoRatio,
    sqn,
    sqnRating,
    kellyCriterion,
    totalLots,
    avgLots,
    best,
    worst,
    curStreak,
    curIsWin,
    maxWinStreak,
    maxLossStreak,
    rMults,
    avgR,
    totalR,
    longStats,
    shortStats,
    totalPct,
  };
}

export function groupByPeriod(trades: Trade[], period: 'day' | 'week' | 'month') {
  const map = new Map<string, { pnl: number; count: number; wins: number }>();
  trades.forEach((t) => {
    const d = new Date(t.datetime);
    let key: string;
    if (period === 'day') key = localDateKey(d);
    else if (period === 'week') {
      const dt = new Date(d);
      dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      key = localDateKey(dt);
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!map.has(key)) map.set(key, { pnl: 0, count: 0, wins: 0 });
    const o = map.get(key)!;
    o.pnl += netPnl(t);
    o.count++;
    if (netPnl(t) > 0) o.wins++;
  });

  return [...map.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, v]) => ({ key: k, label: k, ...v }));
}

export function groupByField(trades: Trade[], fn: (t: Trade) => string | undefined) {
  const map = new Map<string, { pnl: number; count: number; wins: number; losses: number; rSum: number; rN: number }>();
  trades.forEach((t) => {
    const k = fn(t);
    if (!k) return;
    if (!map.has(k)) map.set(k, { pnl: 0, count: 0, wins: 0, losses: 0, rSum: 0, rN: 0 });
    const o = map.get(k)!;
    const p = netPnl(t);
    o.pnl += p;
    o.count++;
    if (p > 0) o.wins++;
    else if (p < 0) o.losses++;
    const r = rMultiple(t);
    if (r !== null && isFinite(r)) {
      o.rSum += r;
      o.rN++;
    }
  });

  return [...map.entries()]
    .map(([k, v]) => ({
      label: k,
      ...v,
      winRate: v.count > 0 ? (v.wins / v.count) * 100 : 0,
      avgR: v.rN ? v.rSum / v.rN : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);
}

export function calendarData(trades: Trade[], weeks: number = 16) {
  const byDay = new Map<string, { pnl: number; count: number; trades: Trade[] }>();
  trades.forEach((t) => {
    const k = localDateKey(new Date(t.datetime));
    if (!byDay.has(k)) byDay.set(k, { pnl: 0, count: 0, trades: [] });
    const o = byDay.get(k)!;
    o.pnl += netPnl(t);
    o.count++;
    o.trades.push(t);
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7) - 1));
  const start = new Date(end);
  start.setDate(start.getDate() - (weeks * 7 - 1));

  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const k = localDateKey(cur);
    const rec = byDay.get(k) || { pnl: 0, count: 0, trades: [] };
    days.push({
      date: new Date(cur),
      key: k,
      ...rec,
      isFuture: cur > today,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function runMonteCarloSimulation(
  trades: Trade[],
  startingCapital: number = 10000,
  simTradesCount: number = 100,
  numSimulations: number = 200
): MonteCarloResult {
  const pnls = trades.map(netPnl);
  const fallbackPnls = [150, -100, 220, -100, 180, -110, 300, -100, -100, 210];
  const pool = pnls.length >= 5 ? pnls : fallbackPnls;

  const allPaths: number[][] = [];
  let countDD10 = 0;
  let countDD20 = 0;
  let countDoubled = 0;
  const targetDouble = startingCapital * 2;

  for (let s = 0; s < numSimulations; s++) {
    const path: number[] = [startingCapital];
    let balance = startingCapital;
    let peak = balance;
    let hitDD10 = false;
    let hitDD20 = false;
    let hitDouble = false;

    for (let i = 0; i < simTradesCount; i++) {
      const randomTradePnl = pool[Math.floor(Math.random() * pool.length)];
      balance += randomTradePnl;
      path.push(balance);

      peak = Math.max(peak, balance);
      const ddPct = peak > 0 ? ((peak - balance) / peak) * 100 : 0;
      if (ddPct >= 10) hitDD10 = true;
      if (ddPct >= 20) hitDD20 = true;
      if (balance >= targetDouble) hitDouble = true;
    }

    if (hitDD10) countDD10++;
    if (hitDD20) countDD20++;
    if (hitDouble) countDoubled++;
    allPaths.push(path);
  }

  // Calculate percentiles for each step
  const percentile5: number[] = [];
  const percentile50: number[] = [];
  const percentile95: number[] = [];

  for (let step = 0; step <= simTradesCount; step++) {
    const stepValues = allPaths.map((p) => p[step]).sort((a, b) => a - b);
    percentile5.push(stepValues[Math.floor(numSimulations * 0.05)]);
    percentile50.push(stepValues[Math.floor(numSimulations * 0.5)]);
    percentile95.push(stepValues[Math.floor(numSimulations * 0.95)]);
  }

  return {
    percentile5,
    percentile50,
    percentile95,
    allPaths: allPaths.slice(0, 20), // Return sample paths for visualization
    probDrawdown10: Math.round((countDD10 / numSimulations) * 100),
    probDrawdown20: Math.round((countDD20 / numSimulations) * 100),
    probDoubling: Math.round((countDoubled / numSimulations) * 100),
    medianFinal: percentile50[simTradesCount],
  };
}
