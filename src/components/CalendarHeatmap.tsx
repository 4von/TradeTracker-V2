import React, { useState } from 'react';
import { Trade } from '../types.ts';
import { calendarData } from '../lib/analytics.ts';
import { netPnl, rMultiple } from '../lib/trade.ts';
import { fmtSigned, fmtMoney, fmtDate, pnlColor, pnlBg } from '../lib/format.ts';
import { X, Calendar as CalIcon } from 'lucide-react';

interface CalendarHeatmapProps {
  trades: Trade[];
  weeks?: number;
}

export default function CalendarHeatmap({ trades, weeks = 15 }: CalendarHeatmapProps) {
  const days = calendarData(trades, weeks);
  const [selectedDay, setSelectedDay] = useState<{
    date: Date;
    key: string;
    pnl: number;
    count: number;
    trades: Trade[];
  } | null>(null);

  // Group days by columns (weeks: Sunday/Monday to Saturday)
  const columns: (typeof days)[] = [];
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  const dow = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const getDayColor = (pnl: number, count: number, isFuture: boolean) => {
    if (isFuture) return 'bg-slate-900/40 border-slate-900 opacity-40';
    if (count === 0) return 'bg-slate-900 border-slate-800/80 hover:border-slate-700';
    if (pnl > 500) return 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold';
    if (pnl > 150) return 'bg-emerald-600/80 border-emerald-500 text-white';
    if (pnl > 0) return 'bg-emerald-900/70 border-emerald-700/60 text-emerald-200';
    if (pnl < -500) return 'bg-rose-600 border-rose-500 text-white font-bold';
    if (pnl < -150) return 'bg-rose-700/80 border-rose-600 text-white';
    return 'bg-rose-950/70 border-rose-800/60 text-rose-200';
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex gap-1.5 items-start min-w-full">
          {/* Day of week column */}
          <div className="flex flex-col gap-1.5 pr-2 pt-0.5 text-[10px] text-slate-500 font-mono select-none">
            {dow.map((d, i) => (
              <div key={i} className="h-4 sm:h-5 flex items-center justify-end">
                {d}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {columns.map((col, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1.5 flex-1 min-w-[18px]">
              {col.map((day) => {
                const colorClass = getDayColor(day.pnl, day.count, day.isFuture);
                return (
                  <button
                    key={day.key}
                    type="button"
                    disabled={day.isFuture || day.count === 0}
                    onClick={() => setSelectedDay(day)}
                    className={`h-4 sm:h-5 w-full rounded border text-[10px] flex items-center justify-center transition-all duration-150 relative group ${colorClass} ${
                      day.count > 0 ? 'cursor-pointer hover:scale-110 z-10' : 'cursor-default'
                    }`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-slate-900 border border-slate-700 text-slate-100 text-[11px] p-2 rounded-lg shadow-xl whitespace-nowrap z-50">
                      <div className="font-semibold text-slate-200">{fmtDate(day.key)}</div>
                      {day.count > 0 ? (
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`font-mono font-bold ${pnlColor(day.pnl)}`}>
                            {fmtSigned(day.pnl)}
                          </span>
                          <span className="text-slate-400">({day.count} {day.count === 1 ? 'trade' : 'trades'})</span>
                        </div>
                      ) : (
                        <div className="text-slate-500 text-[10px]">No trading activity</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-2">
          <span>Activity Intensity:</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-rose-700/80 border border-rose-600 inline-block"></span>
            <span className="w-3 h-3 rounded bg-rose-950/70 border border-rose-800 inline-block"></span>
            <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800 inline-block"></span>
            <span className="w-3 h-3 rounded bg-emerald-900/70 border border-emerald-700 inline-block"></span>
            <span className="w-3 h-3 rounded bg-emerald-500 border border-emerald-400 inline-block"></span>
          </div>
        </div>
        <div className="text-slate-400">
          Showing last <span className="text-slate-200 font-semibold">{weeks} weeks</span> of trading
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CalIcon className="w-4 h-4 text-sky-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {fmtDate(selectedDay.key)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 my-2 px-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Day's Net P&L</span>
                <div className={`text-lg font-mono font-bold ${pnlColor(selectedDay.pnl)}`}>
                  {fmtSigned(selectedDay.pnl)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400">Trades Executed</span>
                <div className="text-lg font-mono font-bold text-slate-200">
                  {selectedDay.count}
                </div>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {selectedDay.trades.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{t.symbol}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          t.direction === 'Long'
                            ? 'bg-sky-500/15 text-sky-400'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}
                      >
                        {t.direction}
                      </span>
                      <span className="text-slate-400 text-[11px]">{t.session}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      {t.strategy || 'Discretionary'} • {t.lots} lots
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold text-sm ${pnlColor(netPnl(t))}`}>
                      {fmtSigned(netPnl(t))}
                    </div>
                    {rMultiple(t) !== null && (
                      <span className="text-slate-400 font-mono text-[10px]">
                        {(rMultiple(t) ?? 0) > 0 ? '+' : ''}{(rMultiple(t) ?? 0).toFixed(2)}R
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
