import { Trade } from '../types.ts';
import { netPnl, rMultiple } from './trade.ts';
import { ASSET_CLASS, DEFAULT_LOT_SIZES } from './constants.ts';
import { uid, nowLocal } from './format.ts';

export function exportCsv(trades: Trade[]): void {
  const headers = [
    'Date/Time',
    'Symbol',
    'Asset Class',
    'Direction',
    'Lots',
    'Entry',
    'Exit',
    'Stop Loss',
    'Target',
    'Commission',
    'Swap',
    'Net P&L',
    'R-Multiple',
    'Session',
    'Strategy',
    'Timeframe',
    'Emotion',
    'Confidence',
    'Rating',
    'Tags',
    'Notes',
  ];

  const rows = trades.map((t) => [
    t.datetime,
    t.symbol,
    t.assetClass,
    t.direction,
    t.lots,
    t.entry,
    t.exit,
    t.stopLoss ?? '',
    t.target ?? '',
    t.commission,
    t.swap,
    netPnl(t).toFixed(2),
    rMultiple(t)?.toFixed(2) ?? '',
    t.session,
    t.strategy,
    t.timeframe,
    t.emotion || '',
    t.confidence,
    t.rating || '',
    `"${(t.tags || []).join(';')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TradeTracker_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateSampleCsv(): void {
  const sampleData = `Date/Time,Symbol,Asset Class,Direction,Lots,Entry,Exit,Stop Loss,Target,Commission,Swap,Session,Strategy,Timeframe,Emotion,Confidence,Tags,Notes
2026-09-18T08:30,EURUSD,forex,Long,1.5,1.08250,1.08650,1.08100,1.08700,7.5,0,London,Order Block (SMC),15m,Disciplined,4,A+ Setup;Followed Plan,"Clean 4H order block tap with London open volume surge."
2026-09-18T14:15,XAUUSD,metal,Short,0.5,2365.20,2351.80,2371.00,2345.00,5.0,0,NY Overlap,Liquidity Sweep,5m,Patient,5,Clean R:R,"Took buy-side liquidity above Asian high and dropped."
2026-09-17T10:00,BTCUSD,crypto,Long,0.1,64200,63400,63800,65500,2.0,0,London,Breakout,1H,FOMO,2,FOMO;Early Exit,"Entered late after green candle, stopped out on retest."`;

  const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TradeTracker_Sample_Template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCsv(text: string): Trade[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const delim = headerLine.includes(';') ? ';' : headerLine.includes('\t') ? '\t' : ',';
  const headers = headerLine.split(delim).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const getIdx = (...names: string[]) =>
    headers.findIndex((h) => names.some((n) => h.includes(n.toLowerCase())));

  const dtIdx = getIdx('date', 'time');
  const symIdx = getIdx('symbol', 'pair', 'instrument');
  const dirIdx = getIdx('direction', 'type', 'side');
  const lotsIdx = getIdx('lot', 'size', 'volume', 'qty');
  const entryIdx = getIdx('entry', 'open', 'price in');
  const exitIdx = getIdx('exit', 'close', 'price out');
  const slIdx = getIdx('stop', 'sl');
  const tpIdx = getIdx('target', 'tp');
  const commIdx = getIdx('comm', 'fee');
  const swapIdx = getIdx('swap');
  const sessIdx = getIdx('session');
  const stratIdx = getIdx('strategy', 'setup');
  const tfIdx = getIdx('timeframe', 'tf');
  const emoIdx = getIdx('emotion', 'psychology');
  const ratingIdx = getIdx('rating', 'quality', 'stars');
  const tagIdx = getIdx('tag');
  const notesIdx = getIdx('note', 'comment');

  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV line parser with quotes handling
    const line = lines[i];
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delim && !inQuotes) {
        cells.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim().replace(/^"|"$/g, ''));

    const symbol = (symIdx >= 0 ? cells[symIdx] : 'EURUSD') || 'EURUSD';
    const cleanSym = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const entry = Number(entryIdx >= 0 ? cells[entryIdx] : 0) || 1.0;
    const exit = Number(exitIdx >= 0 ? cells[exitIdx] : 0) || entry;
    const lots = Number(lotsIdx >= 0 ? cells[lotsIdx] : 0.1) || 0.1;
    const dirRaw = (dirIdx >= 0 ? cells[dirIdx] : 'Long') || 'Long';
    const direction = dirRaw.toLowerCase().startsWith('s') ? 'Short' : 'Long';
    const stopLoss = slIdx >= 0 && cells[slIdx] ? Number(cells[slIdx]) : null;
    const target = tpIdx >= 0 && cells[tpIdx] ? Number(cells[tpIdx]) : null;
    const commission = commIdx >= 0 && cells[commIdx] ? Number(cells[commIdx]) : 0;
    const swap = swapIdx >= 0 && cells[swapIdx] ? Number(cells[swapIdx]) : 0;
    const datetime = (dtIdx >= 0 && cells[dtIdx]) ? cells[dtIdx] : nowLocal();
    const strategy = (stratIdx >= 0 ? cells[stratIdx] : 'Discretionary') || 'Discretionary';
    const session = (sessIdx >= 0 ? cells[sessIdx] : 'London') || 'London';
    const timeframe = (tfIdx >= 0 ? cells[tfIdx] : '15m') || '15m';
    const emotion = (emoIdx >= 0 ? cells[emoIdx] : 'Disciplined') || 'Disciplined';
    const tagsRaw = tagIdx >= 0 ? cells[tagIdx] : '';
    const tags = tagsRaw ? tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : [];
    const notes = notesIdx >= 0 ? cells[notesIdx] : '';

    trades.push({
      id: uid(),
      datetime,
      symbol: cleanSym,
      assetClass: ASSET_CLASS[cleanSym] || 'forex',
      direction,
      entry,
      exit,
      lots,
      lotMultiplier: DEFAULT_LOT_SIZES[cleanSym] || 100000,
      stopLoss,
      target,
      commission,
      swap,
      session,
      strategy,
      timeframe,
      emotion,
      confidence: 3,
      rating: ratingIdx >= 0 && cells[ratingIdx] && !isNaN(Number(cells[ratingIdx])) ? Math.min(5, Math.max(1, Math.round(Number(cells[ratingIdx])))) : undefined,
      tags,
      notes,
    });
  }

  return trades;
}

export const exportTradesToCsv = exportCsv;
export const parseCsvTrades = parseCsv;
