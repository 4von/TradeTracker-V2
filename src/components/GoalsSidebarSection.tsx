import React, { useState } from 'react';
import { Trade, Settings, MonthlyGoals } from '../types.ts';
import { getMonthGoalSummary, getCurrentMonthKey, formatMonthShort } from '../lib/goals.ts';
import { fmtMoney, fmtSigned } from '../lib/format.ts';
import ProgressBar from './ProgressBar.tsx';
import { Target, Sliders, ChevronRight, Check, X, Trophy, TrendingUp } from 'lucide-react';

interface GoalsSidebarSectionProps {
  trades: Trade[];
  settings: Settings;
  onUpdateSettings: (newPartial: Partial<Settings>) => void;
  onNavigateToGoals: () => void;
}

export default function GoalsSidebarSection({
  trades,
  settings,
  onUpdateSettings,
  onNavigateToGoals,
}: GoalsSidebarSectionProps) {
  const currentMonthKey = getCurrentMonthKey();
  const summary = getMonthGoalSummary(trades, currentMonthKey, settings.monthlyGoals);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profitInput, setProfitInput] = useState<string>(
    String(summary.targetProfit || 1500)
  );
  const [winRateInput, setWinRateInput] = useState<string>(
    String(summary.targetWinRate || 60)
  );

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newProfit = Math.max(0, Number(profitInput) || 1500);
    const newWinRate = Math.min(100, Math.max(1, Number(winRateInput) || 60));

    const updatedGoals: MonthlyGoals = {
      ...(settings.monthlyGoals || {
        targetProfit: 1500,
        targetWinRate: 60,
        targetTrades: 25,
      }),
      targetProfit: newProfit,
      targetWinRate: newWinRate,
    };

    onUpdateSettings({ monthlyGoals: updatedGoals });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfitInput(String(summary.targetProfit || 1500));
    setWinRateInput(String(summary.targetWinRate || 60));
    setIsEditing(false);
  };

  return (
    <div className="mx-3 my-2 p-3 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/90 shadow-lg relative group">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div
          onClick={onNavigateToGoals}
          className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Target className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-tight">
            Monthly Goals
          </span>
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
            {formatMonthShort(currentMonthKey)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isEditing) {
              handleCancel();
            } else {
              setProfitInput(String(summary.targetProfit || 1500));
              setWinRateInput(String(summary.targetWinRate || 60));
              setIsEditing(true);
            }
          }}
          title={isEditing ? 'Cancel Edit' : 'Edit Targets'}
          className="p-1 rounded-md text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {isEditing ? <X className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Edit Targets Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-2.5 py-1 text-xs animate-in fade-in duration-200">
          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">
              Profit Target ({settings.currency || '$'})
            </label>
            <input
              type="number"
              step="50"
              value={profitInput}
              onChange={(e) => setProfitInput(e.target.value)}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 font-medium mb-1">
              Win Rate Target (%)
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="100"
              value={winRateInput}
              onChange={(e) => setWinRateInput(e.target.value)}
              className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="submit"
              className="flex-1 py-1 px-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Regular Progress Bars Display */
        <div className="space-y-3">
          {/* Win Rate Progress Bar */}
          <ProgressBar
            value={summary.winRate}
            max={summary.targetWinRate}
            label="Win Rate"
            currentLabel={`${summary.winRate.toFixed(1)}%`}
            targetLabel={`${summary.targetWinRate}%`}
            colorScheme={summary.isWinRateAchieved ? 'emerald' : summary.winRate >= summary.targetWinRate * 0.85 ? 'sky' : 'amber'}
            size="xs"
            showPercentage={true}
            showStatusIcon={true}
          />

          {/* Profit Target Progress Bar */}
          <ProgressBar
            value={summary.netPnl}
            max={summary.targetProfit}
            label="Net Profit"
            currentLabel={fmtSigned(summary.netPnl, 0)}
            targetLabel={fmtMoney(summary.targetProfit, 0)}
            colorScheme={summary.netPnl < 0 ? 'rose' : summary.isProfitAchieved ? 'emerald' : 'sky'}
            size="xs"
            isNegative={summary.netPnl < 0}
            showPercentage={true}
            showStatusIcon={true}
          />

          {/* Mini Status & Footer CTA */}
          <div className="pt-1 flex items-center justify-between border-t border-slate-800/60 text-[10px]">
            <span
              className={`font-semibold ${
                summary.status === 'achieved'
                  ? 'text-emerald-400'
                  : summary.status === 'on_track'
                  ? 'text-sky-400'
                  : summary.status === 'drawdown'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {summary.statusLabel}
            </span>

            <button
              type="button"
              onClick={onNavigateToGoals}
              className="text-slate-400 hover:text-sky-300 flex items-center gap-0.5 font-medium transition-colors cursor-pointer"
            >
              <span>Full Goals</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
