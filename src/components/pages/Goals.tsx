import React, { useState, useMemo } from 'react';
import { Trade, Settings, MonthlyGoals } from '../../types.ts';
import {
  getMonthGoalSummary,
  getAvailableMonths,
  getCurrentMonthKey,
  formatMonthLabel,
} from '../../lib/goals.ts';
import { fmtMoney, fmtSigned, pnlColor, pnlBg, fmtDate } from '../../lib/format.ts';
import { netPnl, rMultiple } from '../../lib/trade.ts';
import ProgressBar from '../ProgressBar.tsx';
import {
  Target,
  Trophy,
  TrendingUp,
  Flame,
  Calendar,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';

interface GoalsProps {
  trades: Trade[];
  settings: Settings;
  onUpdateSettings: (newPartial: Partial<Settings>) => void;
  onSelectTrade?: (t: Trade) => void;
  onOpenAddTrade?: () => void;
}

export default function Goals({
  trades,
  settings,
  onUpdateSettings,
  onSelectTrade,
  onOpenAddTrade,
}: GoalsProps) {
  const currentMonthKey = getCurrentMonthKey();
  const availableMonths = useMemo(() => getAvailableMonths(trades), [trades]);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [isEditingTargets, setIsEditingTargets] = useState<boolean>(false);

  // Current summary for chosen month
  const summary = useMemo(() => {
    return getMonthGoalSummary(trades, selectedMonth, settings.monthlyGoals);
  }, [trades, selectedMonth, settings.monthlyGoals]);

  // Form states for target editing
  const [profitTargetInput, setProfitTargetInput] = useState<number>(summary.targetProfit);
  const [winRateTargetInput, setWinRateTargetInput] = useState<number>(summary.targetWinRate);
  const [tradesTargetInput, setTradesTargetInput] = useState<number>(summary.targetTrades);

  // Sync inputs when selected month changes
  const handleSelectMonth = (m: string) => {
    setSelectedMonth(m);
    const mSummary = getMonthGoalSummary(trades, m, settings.monthlyGoals);
    setProfitTargetInput(mSummary.targetProfit);
    setWinRateTargetInput(mSummary.targetWinRate);
    setTradesTargetInput(mSummary.targetTrades);
    setIsEditingTargets(false);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanProfit = Math.max(0, Number(profitTargetInput) || 1500);
    const cleanWinRate = Math.min(100, Math.max(1, Number(winRateTargetInput) || 60));
    const cleanTrades = Math.max(1, Number(tradesTargetInput) || 20);

    const currentGoals = settings.monthlyGoals || {
      targetProfit: 1500,
      targetWinRate: 60,
      targetTrades: 25,
      maxMonthlyLoss: 1000,
    };

    // Save as month override if not editing global, or update base
    const isCurrent = selectedMonth === currentMonthKey;
    const updatedGoals: MonthlyGoals = {
      ...currentGoals,
      targetProfit: isCurrent ? cleanProfit : currentGoals.targetProfit,
      targetWinRate: isCurrent ? cleanWinRate : currentGoals.targetWinRate,
      targetTrades: isCurrent ? cleanTrades : currentGoals.targetTrades,
      monthOverrides: {
        ...(currentGoals.monthOverrides || {}),
        [selectedMonth]: {
          targetProfit: cleanProfit,
          targetWinRate: cleanWinRate,
          targetTrades: cleanTrades,
        },
      },
    };

    onUpdateSettings({ monthlyGoals: updatedGoals });
    setIsEditingTargets(false);
  };

  // Calculate consecutive wins needed to reach target win rate
  const winsNeededForTarget = useMemo(() => {
    if (summary.winRate >= summary.targetWinRate) return 0;
    // targetWR = (wins + x) / (total + x) => solve for x
    const target = summary.targetWinRate / 100;
    if (target >= 1) return 99;
    const needed = (target * summary.tradeCount - summary.wins) / (1 - target);
    return Math.max(0, Math.ceil(needed));
  }, [summary]);

  // Projected run rate based on average daily pace
  const projectedMonthEndPnl = useMemo(() => {
    if (!summary.isCurrentMonth || summary.daysElapsed <= 0) return summary.netPnl;
    const dailyPace = summary.netPnl / summary.daysElapsed;
    return dailyPace * summary.daysInMonth;
  }, [summary]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Month Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Monthly Trading Goals & Targets
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              Discipline Tracker
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Define institutional profit objectives, win-rate benchmarks, and track monthly execution pacing
          </p>
        </div>

        {/* Month Selector Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => handleSelectMonth(e.target.value)}
              className="pl-3 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:border-sky-500 focus:outline-hidden cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)} {m === currentMonthKey ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingTargets((prev) => !prev)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>{isEditingTargets ? 'Close Config' : 'Set Targets'}</span>
          </button>
        </div>
      </div>

      {/* Target Configuration Panel (Collapsible) */}
      {isEditingTargets && (
        <form
          onSubmit={handleSaveTargets}
          className="bg-slate-900/90 border border-sky-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">
                Set Targets for {summary.monthLabel}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">
              Customize targets for this month or update baseline parameters
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Monthly Profit Target ({settings.currency || '$'})
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={profitTargetInput}
                onChange={(e) => setProfitTargetInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Target realized net profits for the calendar month
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Win Rate (%)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={winRateTargetInput}
                onChange={(e) => setWinRateTargetInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Recommended institutional baseline: 50% - 65%
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Target Trade Volume (Max / Month)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={tradesTargetInput}
                onChange={(e) => setTradesTargetInput(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Prevents overtrading and enforces selective A+ setups
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingTargets(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Save Targets
            </button>
          </div>
        </form>
      )}

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Month Net P&L Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Month Realized P&L</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                summary.isProfitAchieved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Target: {fmtMoney(summary.targetProfit, 0)}
            </span>
          </div>

          <div className={`text-2xl font-mono font-black ${pnlColor(summary.netPnl)}`}>
            {fmtSigned(summary.netPnl)}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              {summary.netPnl >= summary.targetProfit ? (
                <span className="text-emerald-400 font-semibold">
                  +{fmtMoney(summary.profitDelta, 0)} above target!
                </span>
              ) : (
                <span>
                  {fmtMoney(Math.abs(summary.profitDelta), 0)} to target
                </span>
              )}
            </span>
            <span className="font-mono font-bold text-slate-300">
              {summary.profitProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Month Win Rate</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                summary.isWinRateAchieved ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              Target: {summary.targetWinRate}%
            </span>
          </div>

          <div
            className={`text-2xl font-mono font-black ${
              summary.winRate >= summary.targetWinRate
                ? 'text-emerald-400'
                : summary.winRate >= 50
                ? 'text-sky-400'
                : 'text-amber-400'
            }`}
          >
            {summary.winRate.toFixed(1)}%
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              <span className="text-emerald-400 font-bold">{summary.wins}W</span>
              {' / '}
              <span className="text-rose-400 font-bold">{summary.losses}L</span>
              {summary.breakevens > 0 && <span> / {summary.breakevens}BE</span>}
            </span>
            <span className="font-mono text-slate-300">
              {summary.winRateDelta >= 0 ? '+' : ''}
              {summary.winRateDelta.toFixed(1)}% delta
            </span>
          </div>
        </div>

        {/* Trade Count / Volume Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Volume & Frequency</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              Budget: {summary.targetTrades} trades
            </span>
          </div>

          <div className="text-2xl font-mono font-black text-slate-100">
            {summary.tradeCount}{' '}
            <span className="text-xs font-normal text-slate-500">
              / {summary.targetTrades}
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              {summary.tradeCount <= summary.targetTrades ? (
                <span className="text-emerald-400">Patience maintained</span>
              ) : (
                <span className="text-amber-400">Volume exceeded</span>
              )}
            </span>
            <span className="font-mono text-slate-300">
              {summary.tradesProgress.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Pacing & Projections Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Month-End Projection</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {summary.isCurrentMonth
                ? `${summary.daysRemaining} days left`
                : 'Finished Month'}
            </span>
          </div>

          <div className={`text-2xl font-mono font-black ${pnlColor(projectedMonthEndPnl)}`}>
            {fmtSigned(projectedMonthEndPnl)}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>
              {summary.isCurrentMonth && summary.daysRemaining > 0 && !summary.isProfitAchieved ? (
                <span>Need {fmtMoney(summary.dailyRunRateNeeded, 0)}/day</span>
              ) : summary.isProfitAchieved ? (
                <span className="text-emerald-400">Target surpassed!</span>
              ) : (
                <span>Finalized</span>
              )}
            </span>
            <span className="font-semibold text-slate-300">
              {summary.statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Main Targets Tracking & Deep Progress Bars Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Target Deep-Dive Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Monthly Profit Target</h2>
                <p className="text-[11px] text-slate-400">
                  Target: {fmtMoney(summary.targetProfit, 0)} net profit
                </p>
              </div>
            </div>

            {summary.isProfitAchieved ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                <span>Goal Met</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                {summary.profitProgress.toFixed(1)}% Achieved
              </span>
            )}
          </div>

          {/* High-Resolution Progress Bar */}
          <div className="space-y-2 py-2">
            <ProgressBar
              value={summary.netPnl}
              max={summary.targetProfit}
              label="Realized Net P&L Progress"
              currentLabel={fmtSigned(summary.netPnl)}
              targetLabel={fmtMoney(summary.targetProfit)}
              colorScheme={summary.netPnl < 0 ? 'rose' : summary.isProfitAchieved ? 'emerald' : 'sky'}
              size="lg"
              isNegative={summary.netPnl < 0}
              showPercentage={true}
              showStatusIcon={true}
            />

            {/* Milestones Markers: 25%, 50%, 75%, 100%, 125% */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
              <span>$0</span>
              <span className={summary.profitProgress >= 25 ? 'text-sky-400 font-bold' : ''}>25%</span>
              <span className={summary.profitProgress >= 50 ? 'text-sky-400 font-bold' : ''}>50%</span>
              <span className={summary.profitProgress >= 75 ? 'text-sky-400 font-bold' : ''}>75%</span>
              <span className={summary.profitProgress >= 100 ? 'text-emerald-400 font-bold' : ''}>
                100% 🎯
              </span>
            </div>
          </div>

          {/* Detailed Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Gross Profit</span>
              <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
                +{fmtMoney(summary.grossProfit)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Gross Loss</span>
              <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                -{fmtMoney(summary.grossLoss)}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Remaining to Goal</span>
              <div className="text-sm font-mono font-bold text-slate-200 mt-0.5">
                {summary.netPnl >= summary.targetProfit
                  ? 'Completed 🏆'
                  : fmtMoney(Math.max(0, summary.targetProfit - summary.netPnl))}
              </div>
            </div>
          </div>
        </div>

        {/* Win-Rate Target Deep-Dive Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-100">Win Rate Target</h2>
                <p className="text-[11px] text-slate-400">
                  Target: {summary.targetWinRate}% minimum win frequency
                </p>
              </div>
            </div>

            {summary.isWinRateAchieved ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>On Benchmark</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                {summary.winRateDelta.toFixed(1)}% Gap
              </span>
            )}
          </div>

          {/* High-Resolution Progress Bar */}
          <div className="space-y-2 py-2">
            <ProgressBar
              value={summary.winRate}
              max={summary.targetWinRate}
              label="Win Rate Achievement"
              currentLabel={`${summary.winRate.toFixed(1)}%`}
              targetLabel={`${summary.targetWinRate}%`}
              colorScheme={summary.isWinRateAchieved ? 'emerald' : summary.winRate >= summary.targetWinRate * 0.85 ? 'sky' : 'amber'}
              size="lg"
              showPercentage={true}
              showStatusIcon={true}
            />

            {/* Scale markers */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1 pt-1">
              <span>0%</span>
              <span className={summary.winRate >= 30 ? 'text-slate-400' : ''}>30%</span>
              <span className={summary.winRate >= 50 ? 'text-sky-400 font-bold' : ''}>50%</span>
              <span className={summary.winRate >= summary.targetWinRate ? 'text-emerald-400 font-bold' : ''}>
                {summary.targetWinRate}% Target
              </span>
              <span>100%</span>
            </div>
          </div>

          {/* Tactical Win Rate Coaching Tip */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-sky-400 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Execution Pacing Advice</span>
            </div>
            {summary.winRate >= summary.targetWinRate ? (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Your execution quality is exceeding institutional standards. Continue prioritizing high-liquidity sessions and strictly enforcing invalidation levels.
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Currently {Math.abs(summary.winRateDelta).toFixed(1)}% below your target win rate.
                {winsNeededForTarget > 0 && (
                  <strong className="text-slate-200">
                    {' '}You need approximately {winsNeededForTarget} consecutive disciplined wins to reach the {summary.targetWinRate}% threshold.
                  </strong>
                )}{' '}
                Filter out secondary discretionary setups and stick exclusively to your verified A+ playbook.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trades Breakdown & Contribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Trades Contributing to {summary.monthLabel} Goals ({summary.tradeCount})
            </h3>
          </div>

          {onOpenAddTrade && (
            <button
              type="button"
              onClick={onOpenAddTrade}
              className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Log New Trade</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {summary.trades.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No trades recorded yet in {summary.monthLabel}. Log executions to start tracking progress towards your targets.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800 bg-slate-950/60 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Symbol</th>
                  <th className="py-3 px-3">Direction</th>
                  <th className="py-3 px-3">Setup</th>
                  <th className="py-3 px-3">Session</th>
                  <th className="py-3 px-3 text-right">R-Multiple</th>
                  <th className="py-3 px-4 text-right">Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {summary.trades.map((t) => {
                  const pnl = netPnl(t);
                  const r = rMultiple(t);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTrade?.(t)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-300">{fmtDate(t.datetime)}</td>
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
                      <td className="py-3 px-3 text-slate-300">{t.strategy || 'Discretionary'}</td>
                      <td className="py-3 px-3 text-slate-400">{t.session}</td>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Months Comparison */}
      {availableMonths.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Monthly Targets History</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableMonths.map((m) => {
              const mStats = getMonthGoalSummary(trades, m, settings.monthlyGoals);
              const isSelected = m === selectedMonth;
              return (
                <div
                  key={m}
                  onClick={() => handleSelectMonth(m)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-850 border-sky-500/60 shadow-md shadow-sky-950'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">
                      {mStats.monthLabel}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        mStats.isProfitAchieved
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : mStats.netPnl < 0
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {mStats.profitProgress.toFixed(0)}% Profit Goal
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <ProgressBar
                      value={mStats.netPnl}
                      max={mStats.targetProfit}
                      currentLabel={fmtSigned(mStats.netPnl, 0)}
                      targetLabel={fmtMoney(mStats.targetProfit, 0)}
                      colorScheme={mStats.netPnl < 0 ? 'rose' : mStats.isProfitAchieved ? 'emerald' : 'sky'}
                      size="xs"
                      showPercentage={false}
                      showStatusIcon={false}
                    />

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Win Rate: <strong className="text-slate-200">{mStats.winRate.toFixed(1)}%</strong></span>
                      <span>{mStats.tradeCount} trades</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
