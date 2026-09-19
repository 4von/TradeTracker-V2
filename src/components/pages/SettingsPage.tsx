import React, { useState } from 'react';
import { Settings, Trade, MonthlyGoals } from '../../types.ts';
import { generateDemo } from '../../lib/demo.ts';
import { DEFAULT_MONTHLY_GOALS } from '../../lib/constants.ts';
import {
  Save,
  RotateCcw,
  Sparkles,
  Trash2,
  Download,
  Upload,
  Coins,
  ShieldAlert,
  Volume2,
  Info,
  Target,
} from 'lucide-react';

interface SettingsPageProps {
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onResetTrades: () => void;
  onLoadDemoTrades: () => void;
  trades: Trade[];
}

export default function SettingsPage({
  settings,
  onUpdateSettings,
  onResetTrades,
  onLoadDemoTrades,
  trades,
}: SettingsPageProps) {
  const [balance, setBalance] = useState<number>(settings.accountBalance || 10000);
  const [currency, setCurrency] = useState<string>(settings.currency || 'USD');
  const [defaultRisk, setDefaultRisk] = useState<number>(settings.defaultRisk || 1.0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(settings.soundEnabled ?? true);
  const [targetProfit, setTargetProfit] = useState<number>(
    settings.monthlyGoals?.targetProfit ?? DEFAULT_MONTHLY_GOALS.targetProfit
  );
  const [targetWinRate, setTargetWinRate] = useState<number>(
    settings.monthlyGoals?.targetWinRate ?? DEFAULT_MONTHLY_GOALS.targetWinRate
  );
  const [targetTrades, setTargetTrades] = useState<number>(
    settings.monthlyGoals?.targetTrades ?? DEFAULT_MONTHLY_GOALS.targetTrades ?? 25
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const currentGoals = settings.monthlyGoals || DEFAULT_MONTHLY_GOALS;
    const updatedGoals: MonthlyGoals = {
      ...currentGoals,
      targetProfit: Number(targetProfit) || 1500,
      targetWinRate: Number(targetWinRate) || 60,
      targetTrades: Number(targetTrades) || 25,
    };

    onUpdateSettings({
      accountBalance: Number(balance) || 10000,
      currency,
      defaultRisk: Number(defaultRisk) || 1.0,
      soundEnabled,
      monthlyGoals: updatedGoals,
    });
    alert('Settings saved successfully!');
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ settings, trades }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradetracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          System Settings & Risk Parameters
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure account capital, risk budgets, contract sizing, and dataset backups
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account & Risk Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Coins className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-slate-100">Account & Risk Controls</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Starting Capital
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Base Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Max Risk Per Trade (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={defaultRisk}
                onChange={(e) => setDefaultRisk(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 bg-slate-950 border-slate-700"
              />
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-slate-400" />
                <span>Enable Interactive Trading Audio Effects (Win/Loss Tones & Feedback)</span>
              </span>
            </label>
          </div>
        </div>

        {/* Monthly Goals & Performance Targets Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Target className="w-4 h-4 text-sky-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100">Monthly Targets Baseline</h2>
              <p className="text-[11px] text-slate-400">
                Default benchmarks for your Monthly Goals sidebar widget and tracking dashboard
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Monthly Profit Target ({currency})
              </label>
              <input
                type="number"
                step="50"
                min="0"
                value={targetProfit}
                onChange={(e) => setTargetProfit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Win Rate (%)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="100"
                value={targetWinRate}
                onChange={(e) => setTargetWinRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Trade Volume (Per Month)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={targetTrades}
                onChange={(e) => setTargetTrades(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-right">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </form>

      {/* Dataset & Demo Management */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h2 className="text-sm font-bold text-slate-100">Dataset & Sample Records</h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-200">
              Load 50+ Institutional Sample Trades
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 max-w-md">
              Populates your journal with a realistic 45-day multi-asset history across Forex, Gold, and Indices with tags, R-multiples, and emotions. Perfect for testing Monte Carlo and AI features!
            </div>
          </div>
          <button
            type="button"
            onClick={onLoadDemoTrades}
            className="px-4 py-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>Load Sample Dataset</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export JSON */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-300">Backup All Journal Data</div>
              <div className="text-[10px] text-slate-500">Download complete JSON snapshot</div>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Reset All */}
          <div className="p-3 rounded-xl bg-slate-950 border border-rose-900/40 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-300">Purge Current Journal</div>
              <div className="text-[10px] text-slate-500">Delete all recorded trades</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('Warning: This will permanently delete all trades in your journal. Continue?')) {
                  onResetTrades();
                }
              }}
              className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Methodology Info Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2.5">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Info className="w-4 h-4 text-sky-400" />
          <span>Institutional Methodology & Formulae</span>
        </div>
        <p className="leading-relaxed">
          <strong className="text-slate-300">R-Multiple Accounting:</strong> Measures performance in units of risk (R) rather than raw dollars, normalizing trades regardless of account size or lot fluctuations.
        </p>
        <p className="leading-relaxed">
          <strong className="text-slate-300">Van Tharp SQN (System Quality Number):</strong> Evaluates system tradability: SQN = √N × (Mean PnL / StdDev PnL). Scores above 2.5 indicate an institutional-grade edge.
        </p>
        <p className="leading-relaxed">
          <strong className="text-slate-300">Monte Carlo Simulation:</strong> Reshuffles historical trade sequences with replacement over 200 random walks to determine the empirical probability of a 10% or 20% drawdown under your current statistical parameters.
        </p>
      </div>
    </div>
  );
}
