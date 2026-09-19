import React, { useState, useMemo } from 'react';
import { Stats, Trade, Settings } from '../../types.ts';
import {
  groupByField,
  runMonteCarloSimulation,
} from '../../lib/analytics.ts';
import RDistributionChart from '../charts/RDistributionChart.tsx';
import MonteCarloChart from '../charts/MonteCarloChart.tsx';
import {
  fmtMoney,
  fmtSigned,
  fmtPct,
  pnlColor,
} from '../../lib/format.ts';
import {
  BarChart3,
  Dices,
  Layers,
  Clock,
  Calendar,
  HeartPulse,
  Coins,
  RefreshCw,
  Star,
} from 'lucide-react';

interface AnalyticsProps {
  stats: Stats;
  settings: Settings;
  trades: Trade[];
}

export default function Analytics({ stats, settings, trades }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'strategy' | 'session' | 'asset' | 'dow' | 'emotion' | 'rating'>('strategy');

  // Monte Carlo controls
  const [simStartingCap, setSimStartingCap] = useState<number>(settings.accountBalance || 10000);
  const [simTradeCount, setSimTradeCount] = useState<number>(100);
  const [simSeed, setSimSeed] = useState<number>(0);

  const monteCarlo = useMemo(() => {
    return runMonteCarloSimulation(trades, simStartingCap, simTradeCount, 200);
  }, [trades, simStartingCap, simTradeCount, simSeed]);

  // Groupings
  const byStrategy = useMemo(() => groupByField(trades, (t) => t.strategy || 'Discretionary'), [trades]);
  const bySession = useMemo(() => groupByField(trades, (t) => t.session || 'London'), [trades]);
  const byAsset = useMemo(() => groupByField(trades, (t) => t.assetClass || 'forex'), [trades]);
  const byEmotion = useMemo(() => groupByField(trades, (t) => t.emotion || 'Disciplined'), [trades]);
  const byRating = useMemo(
    () =>
      groupByField(trades, (t) => {
        if (!t.rating) return 'Unrated';
        const labels: Record<number, string> = {
          5: '5★ A+ Setup (Elite)',
          4: '4★ High Quality (Disciplined)',
          3: '3★ Standard Setup',
          2: '2★ Low Quality (Chased)',
          1: '1★ Impulsive / Tilt',
        };
        return labels[t.rating] || `${t.rating} Stars`;
      }),
    [trades]
  );

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDow = useMemo(
    () =>
      groupByField(trades, (t) => {
        const d = new Date(t.datetime);
        return isNaN(d.getTime()) ? undefined : daysOfWeek[d.getDay()];
      }),
    [trades]
  );

  const currentGroupData =
    activeTab === 'strategy'
      ? byStrategy
      : activeTab === 'session'
      ? bySession
      : activeTab === 'asset'
      ? byAsset
      : activeTab === 'dow'
      ? byDow
      : activeTab === 'emotion'
      ? byEmotion
      : byRating;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Quantitative Analytics & Edge Discovery
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Multi-dimensional performance attribution, R-distribution, and Monte Carlo probability modeling
        </p>
      </div>

      {/* Advanced Statistical Ratios Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Sharpe Ratio</div>
          <div className="text-xl font-black font-mono text-slate-100 mt-1">
            {stats.sharpeRatio.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Annualized risk-adjusted</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Sortino Ratio</div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {stats.sortinoRatio.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Downside volatility penalty</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Recovery Factor</div>
          <div className="text-xl font-black font-mono text-sky-400 mt-1">
            {stats.recoveryFactor.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Net P&L / Max DD</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Kelly Criterion</div>
          <div className="text-xl font-black font-mono text-amber-400 mt-1">
            {stats.kellyCriterion.toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Optimal theoretical risk</div>
        </div>
      </div>

      {/* Section 1: Breakdown Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100">Attribution Breakdown Matrix</h2>
            <p className="text-xs text-slate-400">Discover which setups and factors drive your edge</p>
          </div>

          {/* Tab selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('strategy')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'strategy'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Strategy</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('session')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'session'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Session</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('asset')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'asset'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Asset Class</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dow')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'dow'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Day of Week</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('emotion')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'emotion'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Psychology</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rating')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'rating'
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Trade Rating (5★)</span>
            </button>
          </div>
        </div>

        {/* Table of Breakdown */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800/80 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-3">Segment Name</th>
                <th className="pb-3">Trades</th>
                <th className="pb-3">Win Rate</th>
                <th className="pb-3">Avg R:R</th>
                <th className="pb-3 text-right">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {currentGroupData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No data recorded for this segment.
                  </td>
                </tr>
              ) : (
                currentGroupData.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-slate-200">
                      {row.label}
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {row.count}{' '}
                      <span className="text-slate-500 text-[11px]">
                        ({row.wins}W / {row.losses}L)
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-200">
                          {row.winRate.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-slate-950 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className={`h-full rounded-full ${
                              row.winRate >= 50 ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${row.winRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-slate-300">
                      {row.avgR > 0 ? '+' : ''}
                      {row.avgR.toFixed(2)}R
                    </td>
                    <td className={`py-3 font-mono font-bold text-right ${pnlColor(row.pnl)}`}>
                      {fmtSigned(row.pnl)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: R-Multiple Distribution Histogram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-100">R-Multiple Strike Distribution</h2>
            <p className="text-xs text-slate-400">
              Distribution of risk-multiples achieved across all recorded trades
            </p>
          </div>
          <div className="text-xs font-mono text-slate-300">
            Avg: <span className={pnlColor(stats.avgR)}>{stats.avgR > 0 ? '+' : ''}{stats.avgR.toFixed(2)}R</span>
          </div>
        </div>

        <RDistributionChart rMultiples={stats.rMults} height={200} />
      </div>

      {/* Section 3: Monte Carlo Simulation Engine */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Dices className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Monte Carlo Forward Simulation (200 Paths)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Stress-test your statistical expectancy and model probability of ruin across future trades
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Capital:</span>
              <input
                type="number"
                value={simStartingCap}
                onChange={(e) => setSimStartingCap(Number(e.target.value) || 10000)}
                className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={() => setSimSeed((s) => s + 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resimulate</span>
            </button>
          </div>
        </div>

        <MonteCarloChart
          result={monteCarlo}
          startingCapital={simStartingCap}
          height={260}
        />
      </div>
    </div>
  );
}
