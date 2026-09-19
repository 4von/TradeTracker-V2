import React, { useState, useMemo, useRef } from 'react';
import { Trade, Settings } from '../../types.ts';
import { netPnl, rMultiple, pipDifference } from '../../lib/trade.ts';
import {
  fmtMoney,
  fmtSigned,
  fmtDate,
  pnlColor,
  pnlBg,
} from '../../lib/format.ts';
import { exportTradesToCsv, parseCsvTrades } from '../../lib/csv.ts';
import {
  Search,
  Filter,
  Download,
  Upload,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Trash2,
  Edit,
  ExternalLink,
  Star,
  CalendarDays,
} from 'lucide-react';
import TradeCalendar from '../TradeCalendar.tsx';

interface HistoryProps {
  trades: Trade[];
  settings: Settings;
  onSelectTrade: (t: Trade) => void;
  onEditTrade: (t: Trade) => void;
  onDeleteTrade: (id: string) => void;
  onOpenAddTrade: () => void;
  onImportTrades: (imported: Trade[]) => void;
}

export default function History({
  trades,
  settings,
  onSelectTrade,
  onEditTrade,
  onDeleteTrade,
  onOpenAddTrade,
  onImportTrades,
}: HistoryProps) {
  const [search, setSearch] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'Long' | 'Short'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'win' | 'loss' | 'be'>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [assetFilter, setAssetFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'pnl-desc' | 'pnl-asc' | 'r-desc' | 'rating-desc'>('date-desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'calendar'>('table');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Sort
  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchSym = t.symbol.toLowerCase().includes(q);
          const matchStrat = (t.strategy || '').toLowerCase().includes(q);
          const matchNotes = (t.notes || '').toLowerCase().includes(q);
          const matchTags = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
          if (!matchSym && !matchStrat && !matchNotes && !matchTags) return false;
        }

        // Direction
        if (directionFilter !== 'all' && t.direction !== directionFilter) return false;

        // Session
        if (sessionFilter !== 'all' && t.session !== sessionFilter) return false;

        // Asset
        if (assetFilter !== 'all' && t.assetClass !== assetFilter) return false;

        // 5-Star Rating Filter
        if (ratingFilter !== 'all') {
          const minRating = parseInt(ratingFilter, 10);
          if (!t.rating || t.rating < minRating) return false;
        }

        // Outcome
        const pnl = netPnl(t);
        if (outcomeFilter === 'win' && pnl <= 0) return false;
        if (outcomeFilter === 'loss' && pnl >= 0) return false;
        if (outcomeFilter === 'be' && Math.abs(pnl) > 1) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
        if (sortBy === 'date-asc') return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
        if (sortBy === 'pnl-desc') return netPnl(b) - netPnl(a);
        if (sortBy === 'pnl-asc') return netPnl(a) - netPnl(b);
        if (sortBy === 'r-desc') return (rMultiple(b) || -99) - (rMultiple(a) || -99);
        if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        return 0;
      });
  }, [trades, search, directionFilter, outcomeFilter, sessionFilter, assetFilter, ratingFilter, sortBy]);

  // Aggregate stats of current filtered list
  const filteredPnl = filtered.reduce((acc, t) => acc + netPnl(t), 0);
  const filteredWins = filtered.filter((t) => netPnl(t) > 0).length;
  const filteredWinRate = filtered.length > 0 ? (filteredWins / filtered.length) * 100 : 0;

  const handleExportCsv = () => {
    exportTradesToCsv(filtered);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const imported = parseCsvTrades(text);
        if (imported.length > 0) {
          onImportTrades(imported);
          alert(`Successfully imported ${imported.length} trades!`);
        } else {
          alert('No valid trade records found in CSV file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Trade Journal Log
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical executions, risk accounting, tags, and trade post-mortems
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddTrade}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-950 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Trade</span>
          </button>
        </div>
      </div>

      {/* Filtered Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Matched Trades</span>
          <div className="text-lg font-mono font-bold text-slate-100">
            {filtered.length} <span className="text-xs text-slate-500">/ {trades.length}</span>
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Filtered Net P&L</span>
          <div className={`text-lg font-mono font-black ${pnlColor(filteredPnl)}`}>
            {fmtSigned(filteredPnl)}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Filtered Win Rate</span>
          <div className="text-lg font-mono font-bold text-slate-100">
            {filteredWinRate.toFixed(1)}%
          </div>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">Wins / Losses</span>
          <div className="text-lg font-mono font-bold text-slate-200">
            <span className="text-emerald-400">{filteredWins}W</span> /{' '}
            <span className="text-rose-400">{filtered.length - filteredWins}L</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search symbol, tag, setup, note..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          {/* Outcome Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'win', 'loss'] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcomeFilter(o)}
                className={`px-3 py-1 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                  outcomeFilter === o
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {o}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'Long', 'Short'] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirectionFilter(d)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  directionFilter === d
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Session Dropdown */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Sessions</option>
            <option value="London">London</option>
            <option value="New York">New York</option>
            <option value="Asian">Asian</option>
            <option value="Sydney">Sydney</option>
          </select>

          {/* Asset Class Dropdown */}
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Asset Classes</option>
            <option value="forex">Forex</option>
            <option value="metal">Metals</option>
            <option value="index">Indices</option>
            <option value="crypto">Crypto</option>
          </select>

          {/* 5-Star Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="all">All Ratings (★)</option>
            <option value="5">5★ A+ Setup Only</option>
            <option value="4">4★+ High Discipline</option>
            <option value="3">3★+ Acceptable</option>
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="pnl-desc">Highest P&L</option>
            <option value="pnl-asc">Lowest P&L</option>
            <option value="r-desc">Highest R-Multiple</option>
            <option value="rating-desc">Highest Rated (5★ First)</option>
          </select>

          {/* Table vs Card vs Calendar View Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-slate-800 text-sky-400' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                viewMode === 'calendar'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Trade Calendar View"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trades Content */}
      {viewMode === 'calendar' ? (
        <TradeCalendar
          trades={filtered}
          allTrades={trades}
          settings={settings}
          onSelectTrade={onSelectTrade}
          onEditTrade={onEditTrade}
          onOpenAddTrade={onOpenAddTrade}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
          No trades matched the selected filters. Try clearing your search or filters.
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/60 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Entry / Exit</th>
                  <th className="py-3 px-3">Lots</th>
                  <th className="py-3 px-3">Strategy</th>
                  <th className="py-3 px-3">Session</th>
                  <th className="py-3 px-3">Emotion</th>
                  <th className="py-3 px-3">Quality</th>
                  <th className="py-3 px-3 text-right">R-Multiple</th>
                  <th className="py-3 px-4 text-right">Net P&L</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map((t) => {
                  const pnl = netPnl(t);
                  const r = rMultiple(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTrade(t)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {fmtDate(t.datetime)}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-100">{t.symbol}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.direction === 'Long'
                              ? 'bg-sky-500/15 text-sky-400'
                              : 'bg-orange-500/15 text-orange-400'
                          }`}
                        >
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {t.entry} <span className="text-slate-600">→</span> {t.exit ?? '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{t.lots}</td>
                      <td className="py-3 px-3 text-slate-300">{t.strategy || 'Discretionary'}</td>
                      <td className="py-3 px-3 text-slate-400">{t.session}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.emotion || 'Disciplined'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {t.rating && t.rating > 0 ? (
                          <div className="flex items-center gap-0.5" title={`${t.rating} Stars Quality`}>
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${
                                  i < t.rating!
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-transparent text-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-right text-slate-300">
                        {r !== null ? (
                          <span className={pnlColor(r)}>
                            {r > 0 ? '+' : ''}
                            {r.toFixed(2)}R
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`py-3 px-4 font-mono font-black text-right ${pnlColor(pnl)}`}>
                        {fmtSigned(pnl)}
                      </td>
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTrade(t)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Delete trade?')) onDeleteTrade(t.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const pnl = netPnl(t);
            const r = rMultiple(t);
            return (
              <div
                key={t.id}
                onClick={() => onSelectTrade(t)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 cursor-pointer transition-all shadow-md group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-white">{t.symbol}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        t.direction === 'Long'
                          ? 'bg-sky-500/15 text-sky-400'
                          : 'bg-orange-500/15 text-orange-400'
                      }`}
                    >
                      {t.direction}
                    </span>
                    <span className="text-slate-500 text-xs font-mono">{t.lots} lots</span>
                    {t.rating && t.rating > 0 && (
                      <div className="flex items-center gap-0.5 ml-1" title={`${t.rating}/5 Stars`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-2.5 h-2.5 ${
                              i < t.rating!
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-transparent text-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className={`font-mono font-black text-base ${pnlColor(pnl)}`}>
                    {fmtSigned(pnl)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Entry → Exit</span>
                    <span className="font-mono text-slate-300">
                      {t.entry} → {t.exit ?? 'Open'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Realized R</span>
                    <span className={`font-mono font-bold ${r !== null ? pnlColor(r) : 'text-slate-400'}`}>
                      {r !== null ? `${r > 0 ? '+' : ''}${r.toFixed(2)}R` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{t.strategy || 'Discretionary'}</span>
                  <span>{fmtDate(t.datetime)}</span>
                </div>

                {t.tags && t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
