import React, { useState } from 'react';
import { Stats, Settings, Trade } from '../../types.ts';
import EquityChart from '../charts/EquityChart.tsx';
import DrawdownChart from '../charts/DrawdownChart.tsx';
import CalendarHeatmap from '../CalendarHeatmap.tsx';
import {
  fmtMoney,
  fmtSigned,
  fmtPct,
  fmtDate,
  pnlColor,
  pnlBg,
} from '../../lib/format.ts';
import { netPnl, rMultiple } from '../../lib/trade.ts';
import {
  TrendingUp,
  Percent,
  Award,
  Flame,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Bot,
  PlusCircle,
  Target,
} from 'lucide-react';

interface DashboardProps {
  stats: Stats;
  settings: Settings;
  trades?: Trade[];
  setPage: (p: string) => void;
  onSelectTrade: (t: Trade) => void;
  onOpenAddTrade: () => void;
  onOpenAiCoach: () => void;
}

export default function Dashboard({
  stats,
  settings,
  trades = [],
  setPage,
  onSelectTrade,
  onOpenAddTrade,
  onOpenAiCoach,
}: DashboardProps) {
  const [chartMode, setChartMode] = useState<'equity' | 'drawdown'>('equity');

  const recentTrades = stats.sorted.slice().reverse().slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Performance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical edge, risk metrics, and trade journal analytics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setPage('goals')}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Target className="w-3.5 h-3.5 text-sky-400" />
            <span>Monthly Goals</span>
          </button>
          <button
            type="button"
            onClick={onOpenAiCoach}
            className="px-3.5 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>AI Coach Audit</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddTrade}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Trade</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Net P&L */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Net P&L</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono tracking-tight ${pnlColor(stats.total)}`}>
              {fmtSigned(stats.total)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {fmtPct(stats.totalPct)} on account
            </div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Win Rate</span>
            <Percent className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono text-slate-100">
              {stats.winRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {stats.wins.length}W / {stats.losses.length}L
            </div>
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Profit Factor</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono text-amber-400">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Payoff: {stats.rr.toFixed(2)} : 1
            </div>
          </div>
        </div>

        {/* Expectancy */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Expectancy</span>
            <Compass className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono ${pnlColor(stats.expectancy)}`}>
              {fmtSigned(stats.expectancy)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Avg R: {stats.avgR > 0 ? '+' : ''}{stats.avgR.toFixed(2)}R
            </div>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>Max Drawdown</span>
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono text-rose-400">
              -{stats.maxDDPct.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              -{fmtMoney(stats.maxDD)} peak-to-trough
            </div>
          </div>
        </div>

        {/* Van Tharp SQN */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            <span>SQN Score</span>
            <Flame className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-black font-mono text-orange-400">
              {stats.sqn.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              {stats.sqnRating}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Performance Trajectory</h2>
            <p className="text-xs text-slate-400">
              {chartMode === 'equity'
                ? 'Cumulative equity curve with high water mark'
                : 'Underwater peak-to-trough drawdown depth'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setChartMode('equity')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                chartMode === 'equity'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Equity Curve
            </button>
            <button
              type="button"
              onClick={() => setChartMode('drawdown')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                chartMode === 'drawdown'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Drawdown
            </button>
          </div>
        </div>

        {chartMode === 'equity' ? (
          <EquityChart data={stats.equity} height={280} />
        ) : (
          <DrawdownChart data={stats.equity} height={220} />
        )}
      </div>

      {/* Two Column Layout: Calendar Heatmap & Recent Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Heatmap (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Daily P&L Heatmap</h2>
              <p className="text-xs text-slate-400">Consistency tracker and activity intensity</p>
            </div>
            <button
              type="button"
              onClick={() => setPage('history')}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              <span>View Full Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <CalendarHeatmap trades={stats.sorted} weeks={15} />
        </div>

        {/* Quick Streaks & Discipline Score (1 Col) */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h2 className="text-sm font-bold text-slate-100 mb-3 pb-2 border-b border-slate-800">
              Streak & Direction Edge
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="text-slate-400">Current Streak:</span>
                <span className="font-mono font-bold text-slate-200">
                  {stats.curStreak} {stats.curIsWin ? 'Win' : 'Loss'}
                  {stats.curStreak > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Max Win Streak</div>
                  <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
                    {stats.maxWinStreak}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Max Loss Streak</div>
                  <div className="text-base font-black font-mono text-rose-400 mt-0.5">
                    {stats.maxLossStreak}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Long Positions ({stats.longStats.count}):</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {fmtSigned(stats.longStats.pnl)} (
                      {stats.longStats.count > 0
                        ? ((stats.longStats.win / stats.longStats.count) * 100).toFixed(0)
                        : 0}
                      % win)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{
                        width: `${
                          stats.longStats.count > 0
                            ? (stats.longStats.win / stats.longStats.count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                    <span>Short Positions ({stats.shortStats.count}):</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {fmtSigned(stats.shortStats.pnl)} (
                      {stats.shortStats.count > 0
                        ? ((stats.shortStats.win / stats.shortStats.count) * 100).toFixed(0)
                        : 0}
                      % win)
                    </span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full"
                      style={{
                        width: `${
                          stats.shortStats.count > 0
                            ? (stats.shortStats.win / stats.shortStats.count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Coach Banner */}
          <div className="bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 border border-violet-500/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-xs font-bold text-violet-200">AI Quantitative Audit</h3>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Have Gemini analyze your win rates, psychological tilt triggers, and risk execution to spot invisible leaks.
                </p>
                <button
                  type="button"
                  onClick={onOpenAiCoach}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run Full AI Journal Audit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trades Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Recent Executions</h2>
            <p className="text-xs text-slate-400">Last 6 recorded trades</p>
          </div>
          <button
            type="button"
            onClick={() => setPage('history')}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            <span>All Trades ({stats.n})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTrades.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            No trades logged yet. Click "Log Trade" or load sample demo data in Settings!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800/80 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">Date / Session</th>
                  <th className="pb-2.5">Symbol</th>
                  <th className="pb-2.5">Direction</th>
                  <th className="pb-2.5">Lots</th>
                  <th className="pb-2.5">Strategy</th>
                  <th className="pb-2.5">Emotion</th>
                  <th className="pb-2.5 text-right">R-Multiple</th>
                  <th className="pb-2.5 text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {recentTrades.map((t) => {
                  const pnl = netPnl(t);
                  const r = rMultiple(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTrade(t)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 font-mono text-slate-300">
                        {fmtDate(t.datetime)}
                        <span className="text-slate-500 text-[10px] ml-1.5">({t.session})</span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-200">{t.symbol}</td>
                      <td className="py-2.5">
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
                      <td className="py-2.5 font-mono text-slate-300">{t.lots}</td>
                      <td className="py-2.5 text-slate-400">{t.strategy || 'Discretionary'}</td>
                      <td className="py-2.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.emotion || 'Disciplined'}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-right text-slate-300">
                        {r !== null ? (
                          <span className={pnlColor(r)}>
                            {r > 0 ? '+' : ''}
                            {r.toFixed(2)}R
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={`py-2.5 font-mono font-bold text-right ${pnlColor(pnl)}`}>
                        {fmtSigned(pnl)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
