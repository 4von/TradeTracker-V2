import React, { useState } from 'react';
import { Settings } from '../types.ts';
import { PIP_SIZES, DEFAULT_LOT_SIZES } from '../lib/constants.ts';
import { fmtMoney, fmtNum } from '../lib/format.ts';
import { Calculator, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface PositionCalculatorProps {
  settings: Settings;
  onApplyToTrade?: (details: {
    symbol: string;
    lots: number;
    entry: number;
    stopLoss: number;
  }) => void;
}

export default function PositionCalculator({
  settings,
  onApplyToTrade,
}: PositionCalculatorProps) {
  const [balance, setBalance] = useState<number>(settings.accountBalance || 10000);
  const [riskPercent, setRiskPercent] = useState<number>(settings.defaultRisk || 1);
  const [symbol, setSymbol] = useState<string>('EURUSD');
  const [direction, setDirection] = useState<'Long' | 'Short'>('Long');
  const [entry, setEntry] = useState<string>('1.08500');
  const [stopLoss, setStopLoss] = useState<string>('1.08250');
  const [target, setTarget] = useState<string>('1.09100');

  const symbols = Object.keys(settings.lotSizes || DEFAULT_LOT_SIZES);
  const lotMultiplier = settings.lotSizes[symbol] || DEFAULT_LOT_SIZES[symbol] || 100000;
  const pipSize = PIP_SIZES[symbol] || 0.0001;

  const numEntry = Number(entry) || 0;
  const numStop = Number(stopLoss) || 0;
  const numTarget = Number(target) || 0;

  const riskAmount = (balance * riskPercent) / 100;
  const stopDistance = Math.abs(numEntry - numStop);
  const pipsAtRisk = stopDistance > 0 ? stopDistance / pipSize : 0;

  // lots calculation: riskAmount / (stopDistance * lotMultiplier)
  const calculatedLots =
    stopDistance > 0 && lotMultiplier > 0
      ? riskAmount / (stopDistance * lotMultiplier)
      : 0;

  const cleanLots = Math.max(0.01, Math.round(calculatedLots * 100) / 100);

  // Target reward calculation
  const targetDistance = numTarget > 0 ? Math.abs(numTarget - numEntry) : 0;
  const pipsTarget = targetDistance > 0 ? targetDistance / pipSize : 0;
  const rewardAmount = cleanLots * lotMultiplier * targetDistance;
  const plannedRR = stopDistance > 0 && targetDistance > 0 ? targetDistance / stopDistance : 0;

  // Margin required assuming 1:100 leverage
  const notionalValue = cleanLots * lotMultiplier * numEntry;
  const marginRequired = notionalValue / 100;

  const riskPresets = [0.5, 1.0, 1.5, 2.0, 3.0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Position Size & Risk Calculator</h3>
            <p className="text-xs text-slate-400">Institutional lot size sizing based on exact stop distance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column: Inputs */}
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account Balance ({settings.currency})
              </label>
              <input
                type="number"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Risk Target ({riskPercent}%)
              </label>
              <div className="flex items-center gap-1">
                {riskPresets.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRiskPercent(r)}
                    className={`flex-1 py-2 text-[11px] font-mono rounded-lg border transition-all ${
                      riskPercent === r
                        ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Instrument
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200 focus:border-sky-500 focus:outline-hidden transition-colors"
              >
                {symbols.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setDirection('Long')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    direction === 'Long'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Long
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('Short')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    direction === 'Short'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Short
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="1.0850"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="1.0825"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-rose-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Take Profit
              </label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="1.0910"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recommended Lot Size
              </span>
              <span className="text-2xl font-black font-mono text-sky-400">
                {cleanLots > 0 ? cleanLots.toFixed(2) : '—'} <span className="text-xs font-normal text-slate-500">lots</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-3 text-xs">
              <div>
                <span className="text-slate-500">Risk Capital:</span>
                <div className="font-mono font-bold text-rose-400 text-sm">
                  {fmtMoney(riskAmount)} ({riskPercent}%)
                </div>
              </div>

              <div>
                <span className="text-slate-500">Distance to Stop:</span>
                <div className="font-mono font-bold text-slate-200 text-sm">
                  {pipsAtRisk.toFixed(1)} pips
                </div>
              </div>

              <div>
                <span className="text-slate-500">Potential Profit:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm">
                  {rewardAmount > 0 ? fmtMoney(rewardAmount) : '—'}
                </div>
              </div>

              <div>
                <span className="text-slate-500">Planned R:R:</span>
                <div className="font-mono font-bold text-sky-400 text-sm">
                  {plannedRR > 0 ? `1 : ${plannedRR.toFixed(2)}` : '—'}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>Contract Size:</span>
                <span className="font-mono text-slate-300">
                  {fmtNum(lotMultiplier, 0)} units / lot
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Margin (1:100):</span>
                <span className="font-mono text-slate-300">
                  {fmtMoney(marginRequired)}
                </span>
              </div>
            </div>
          </div>

          {onApplyToTrade && (
            <button
              type="button"
              disabled={cleanLots <= 0 || !numEntry || !numStop}
              onClick={() =>
                onApplyToTrade({
                  symbol,
                  lots: cleanLots,
                  entry: numEntry,
                  stopLoss: numStop,
                })
              }
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Transfer Values to New Trade Log</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
