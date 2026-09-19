import { Trade } from '../types.ts';
import { uid } from './format.ts';
import { ASSET_CLASS, DEFAULT_LOT_SIZES } from './constants.ts';
import { detectSession } from './trade.ts';

export function generateDemo(): Trade[] {
  const instruments = [
    { sym: 'EURUSD', p: 1.085, mult: 100000, pipDelta: 0.0001, class: 'forex' as const },
    { sym: 'GBPUSD', p: 1.268, mult: 100000, pipDelta: 0.0001, class: 'forex' as const },
    { sym: 'USDJPY', p: 151.2, mult: 100000, pipDelta: 0.01, class: 'forex' as const },
    { sym: 'GBPJPY', p: 191.5, mult: 100000, pipDelta: 0.01, class: 'forex' as const },
    { sym: 'XAUUSD', p: 2380.0, mult: 100, pipDelta: 0.1, class: 'metal' as const },
    { sym: 'NAS100', p: 18450.0, mult: 1, pipDelta: 1, class: 'index' as const },
    { sym: 'US30', p: 39500.0, mult: 1, pipDelta: 1, class: 'index' as const },
    { sym: 'BTCUSD', p: 64500.0, mult: 1, pipDelta: 1, class: 'crypto' as const },
    { sym: 'SOLUSD', p: 148.5, mult: 1, pipDelta: 0.01, class: 'crypto' as const },
  ];

  const strategies = [
    'Liquidity Sweep',
    'Order Block (SMC)',
    'Breakout',
    'Fair Value Gap (FVG)',
    'Trend Continuation',
    'London Open Breakout',
    'NY Open Scalp',
  ];

  const timeframes = ['5m', '15m', '30m', '1H', '4H'];

  const scenarios = [
    { win: true, r: 2.5, emotion: 'Disciplined', tags: ['A+ Setup', 'Followed Plan'], notes: 'Clean Asian liquidity sweep during London open. Waited for 5m displacement and took 2.5R target.' },
    { win: true, r: 1.8, emotion: 'Confident', tags: ['Clean R:R'], notes: '4H order block mitigation with strong bullish divergence. Took partials at previous high.' },
    { win: false, r: -1.0, emotion: 'Patient', tags: ['Followed Plan'], notes: 'Valid setup but sudden CPI high-impact news whip caused stop out. Acceptable loss within risk budget.' },
    { win: true, r: 3.2, emotion: 'Disciplined', tags: ['A+ Setup', 'Trailing Stop'], notes: 'Textbook FVG fill with 15m structural break. Trailed stop below higher lows.' },
    { win: false, r: -1.0, emotion: 'Disciplined', tags: ['Followed Plan'], notes: 'Failed retest of daily support. Cut cleanly at stop loss with zero tilt.' },
    { win: true, r: 2.1, emotion: 'Patient', tags: ['Key Level Reaction'], notes: 'London session range low reclaim. Smooth delivery into target.' },
    { win: false, r: -1.6, emotion: 'FOMO', tags: ['FOMO', 'Early Exit'], notes: 'Chased the breakout candle without waiting for candle close or retest. Poor discipline.' },
    { win: true, r: 1.5, emotion: 'Confident', tags: ['Top of Range'], notes: 'Range high rejection with high volume wick rejection.' },
    { win: false, r: -1.0, emotion: 'Anxious', tags: ['Chased'], notes: 'Entered too early before London killzone started. Chopped out in Asian consolidation.' },
    { win: true, r: 4.0, emotion: 'Disciplined', tags: ['A+ Setup', 'Clean R:R'], notes: 'Monster trend continuation trade after NY morning reversal. 4R achieved effortlessly.' },
    { win: false, r: -1.2, emotion: 'Revenge', tags: ['Revenge Trade', 'Overleveraged'], notes: 'Took immediate trade after previous loss to make back money. Broke max risk rule.' },
    { win: true, r: 2.0, emotion: 'Disciplined', tags: ['Followed Plan'], notes: 'Disciplined pullback entry on standard 15m trend.' },
  ];

  const trades: Trade[] = [];
  const now = new Date();

  for (let i = 0; i < 52; i++) {
    const inst = instruments[Math.floor(Math.random() * instruments.length)];
    const sc = scenarios[Math.floor(Math.random() * scenarios.length)];
    const daysAgo = Math.floor((52 - i) * 0.85);
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);

    const hours = [2, 7, 9, 10, 13, 14, 15, 17, 20];
    const hour = hours[Math.floor(Math.random() * hours.length)];
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    d.setHours(hour, minute, 0, 0);

    const dStr = d.toISOString().slice(0, 16);
    const session = detectSession(dStr);
    const direction = Math.random() > 0.48 ? 'Long' : 'Short';

    let lots = 0.5;
    if (inst.sym === 'XAUUSD') lots = 0.4;
    else if (inst.sym === 'NAS100' || inst.sym === 'US30') lots = 1.0;
    else if (inst.sym === 'BTCUSD') lots = 0.1;
    else if (inst.sym === 'SOLUSD') lots = 2.0;
    else lots = 1.0;

    const riskDistance = inst.p * 0.0035; // ~0.35% price move
    const entry = Number((inst.p + (Math.random() - 0.5) * inst.p * 0.02).toFixed(inst.class === 'forex' ? (inst.sym.includes('JPY') ? 3 : 5) : 2));

    const slDiff = riskDistance;
    const stopLoss = Number((direction === 'Long' ? entry - slDiff : entry + slDiff).toFixed(inst.class === 'forex' ? (inst.sym.includes('JPY') ? 3 : 5) : 2));

    const rewardDiff = riskDistance * Math.max(1.5, Math.abs(sc.r));
    const target = Number((direction === 'Long' ? entry + rewardDiff : entry - rewardDiff).toFixed(inst.class === 'forex' ? (inst.sym.includes('JPY') ? 3 : 5) : 2));

    // exit calculation
    const move = sc.win ? riskDistance * sc.r : -riskDistance * Math.abs(sc.r);
    const exit = Number((direction === 'Long' ? entry + move : entry - move).toFixed(inst.class === 'forex' ? (inst.sym.includes('JPY') ? 3 : 5) : 2));

    const commission = Number((lots * 4.5).toFixed(2));
    const swap = Math.random() > 0.7 ? Number((Math.random() * 3).toFixed(2)) : 0;

    let rating = 3;
    if (sc.tags.includes('A+ Setup')) rating = 5;
    else if (sc.emotion === 'Revenge') rating = 1;
    else if (sc.emotion === 'FOMO' || sc.tags.includes('Chased')) rating = 2;
    else if (sc.win && sc.emotion === 'Disciplined') rating = 4;
    else if (sc.win) rating = 4;
    else if (!sc.win && sc.emotion === 'Disciplined') rating = 3;

    trades.push({
      id: uid(),
      datetime: dStr,
      symbol: inst.sym,
      assetClass: inst.class,
      direction,
      entry,
      exit,
      lots,
      lotMultiplier: inst.mult,
      stopLoss,
      target,
      commission,
      swap,
      session,
      strategy: strategies[Math.floor(Math.random() * strategies.length)],
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      emotion: sc.emotion,
      confidence: sc.win ? 4 : 3,
      rating,
      tags: sc.tags,
      notes: sc.notes,
      checklist: {
        biasConfirmed: true,
        keyLevelSwept: sc.win,
        riskWithinLimit: sc.emotion !== 'Revenge',
        validRiskReward: true,
        noHighImpactNews: !sc.tags.includes('News Event'),
      },
    });
  }

  return trades;
}
