import React, { useState, useEffect } from 'react';
import { Trade, Settings } from '../../types.ts';
import { DEFAULT_LOT_SIZES, ASSET_CLASS, STRATEGIES, TIMEFRAMES, EMOTIONS } from '../../lib/constants.ts';
import { detectSession, netPnl, rMultiple, pipDifference } from '../../lib/trade.ts';
import { uid, playTone, fmtMoney, fmtSigned, pnlColor } from '../../lib/format.ts';
import StarRating from '../StarRating.tsx';
import {
  Save,
  X,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calculator,
  Star,
} from 'lucide-react';

interface AddTradeProps {
  initialTrade?: Trade | null;
  settings: Settings;
  onSave: (trade: Trade) => void;
  onCancel: () => void;
}

export default function AddTrade({
  initialTrade,
  settings,
  onSave,
  onCancel,
}: AddTradeProps) {
  const [symbol, setSymbol] = useState<string>(initialTrade?.symbol || 'EURUSD');
  const [assetClass, setAssetClass] = useState<'forex' | 'metal' | 'index' | 'crypto'>(
    initialTrade?.assetClass || 'forex'
  );
  const [direction, setDirection] = useState<'Long' | 'Short'>(
    initialTrade?.direction || 'Long'
  );
  const [entry, setEntry] = useState<string>(
    initialTrade?.entry !== undefined ? String(initialTrade.entry) : ''
  );
  const [exit, setExit] = useState<string>(
    initialTrade?.exit !== undefined ? String(initialTrade.exit) : ''
  );
  const [stopLoss, setStopLoss] = useState<string>(
    initialTrade?.stopLoss !== undefined ? String(initialTrade.stopLoss) : ''
  );
  const [target, setTarget] = useState<string>(
    initialTrade?.target !== undefined ? String(initialTrade.target) : ''
  );
  const [lots, setLots] = useState<string>(
    initialTrade?.lots !== undefined ? String(initialTrade.lots) : '1.0'
  );
  const [commission, setCommission] = useState<string>(
    initialTrade?.commission !== undefined ? String(initialTrade.commission) : '4.50'
  );
  const [swap, setSwap] = useState<string>(
    initialTrade?.swap !== undefined ? String(initialTrade.swap) : '0.00'
  );

  const defaultDate = new Date().toISOString().slice(0, 16);
  const [datetime, setDatetime] = useState<string>(
    initialTrade?.datetime || defaultDate
  );

  const [session, setSession] = useState<string>(
    initialTrade?.session || detectSession(defaultDate)
  );
  const [strategy, setStrategy] = useState<string>(
    initialTrade?.strategy || STRATEGIES[0]
  );
  const [timeframe, setTimeframe] = useState<string>(
    initialTrade?.timeframe || '15m'
  );
  const [emotion, setEmotion] = useState<string>(
    initialTrade?.emotion || 'Disciplined'
  );
  const [confidence, setConfidence] = useState<number>(
    initialTrade?.confidence || 4
  );
  const [rating, setRating] = useState<number>(
    initialTrade?.rating || 0
  );
  const [tagsInput, setTagsInput] = useState<string>(
    (initialTrade?.tags || []).join(', ')
  );
  const [notes, setNotes] = useState<string>(initialTrade?.notes || '');
  const [screenshotUrl, setScreenshotUrl] = useState<string>(
    initialTrade?.screenshotUrl || ''
  );

  // Checklist
  const [biasConfirmed, setBiasConfirmed] = useState<boolean>(
    initialTrade?.checklist?.biasConfirmed ?? true
  );
  const [keyLevelSwept, setKeyLevelSwept] = useState<boolean>(
    initialTrade?.checklist?.keyLevelSwept ?? true
  );
  const [riskWithinLimit, setRiskWithinLimit] = useState<boolean>(
    initialTrade?.checklist?.riskWithinLimit ?? true
  );
  const [validRiskReward, setValidRiskReward] = useState<boolean>(
    initialTrade?.checklist?.validRiskReward ?? true
  );

  // Update session automatically when datetime changes
  useEffect(() => {
    if (!initialTrade && datetime) {
      setSession(detectSession(datetime));
    }
  }, [datetime, initialTrade]);

  // Determine lot multiplier
  const lotMultiplier =
    initialTrade?.lotMultiplier ||
    settings.lotSizes[symbol] ||
    DEFAULT_LOT_SIZES[symbol] ||
    100000;

  // Build temporary trade for live preview math
  const previewTrade: Trade = {
    id: initialTrade?.id || 'temp',
    datetime,
    symbol: symbol.toUpperCase().trim(),
    assetClass,
    direction,
    entry: Number(entry) || 0,
    exit: exit !== '' ? Number(exit) : undefined,
    lots: Number(lots) || 0,
    lotMultiplier,
    stopLoss: stopLoss !== '' ? Number(stopLoss) : undefined,
    target: target !== '' ? Number(target) : undefined,
    commission: Number(commission) || 0,
    swap: Number(swap) || 0,
    session,
    strategy,
    timeframe,
    emotion,
    confidence,
    rating: rating > 0 ? rating : undefined,
    tags: tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    notes,
    screenshotUrl,
    checklist: {
      biasConfirmed,
      keyLevelSwept,
      riskWithinLimit,
      validRiskReward,
    },
  };

  const pnl = netPnl(previewTrade);
  const r = rMultiple(previewTrade);
  const pips = pipDifference(previewTrade);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!symbol || !entry || !lots) {
      alert('Please fill in at least Symbol, Entry Price, and Lots.');
      return;
    }

    const finalTrade: Trade = {
      ...previewTrade,
      id: initialTrade?.id || uid(),
    };

    if (settings.soundEnabled) {
      if (pnl > 0) playTone(784, 0.2, 'triangle');
      else if (pnl < 0) playTone(220, 0.3, 'sawtooth');
      else playTone(440, 0.1, 'sine');
    }

    onSave(finalTrade);
  };

  const quickSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'NAS100', 'US30', 'BTCUSD'];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-black text-white">
            {initialTrade ? 'Edit Trade Entry' : 'Log New Executed Trade'}
          </h2>
          <p className="text-xs text-slate-400">
            Log price action, risk limits, emotions, and setup criteria
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Live Calculation Preview Banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Net P&L Result</span>
            <div className={`text-lg font-black font-mono ${pnlColor(pnl)}`}>
              {fmtSigned(pnl)}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Realized R</span>
            <div className={`text-lg font-black font-mono ${r !== null ? pnlColor(r) : 'text-slate-400'}`}>
              {r !== null ? `${r > 0 ? '+' : ''}${r.toFixed(2)}R` : '— (Set SL)'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Pip Displacement</span>
            <div className={`text-lg font-bold font-mono ${pnlColor(pips)}`}>
              {pips > 0 ? '+' : ''}{pips.toFixed(1)} pips
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Risk Budget</span>
            <div className="text-lg font-bold font-mono text-slate-300">
              {previewTrade.stopLoss
                ? fmtMoney(Math.abs(previewTrade.entry - previewTrade.stopLoss) * previewTrade.lots * lotMultiplier)
                : '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Quality Rating</span>
            <div className="mt-1">
              {rating > 0 ? (
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    {rating}/5
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-mono italic">Unrated</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Instrument & Position Basics */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            1. Instrument & Direction
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="EURUSD, XAUUSD..."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 uppercase focus:border-sky-500 focus:outline-hidden"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {quickSymbols.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSymbol(s);
                      if (s === 'XAUUSD') setAssetClass('metal');
                      else if (s === 'NAS100' || s === 'US30') setAssetClass('index');
                      else if (s.includes('BTC')) setAssetClass('crypto');
                      else setAssetClass('forex');
                    }}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      symbol === s
                        ? 'bg-sky-500 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Asset Class
              </label>
              <select
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="forex">Forex (Currencies)</option>
                <option value="metal">Metals (Gold, Silver)</option>
                <option value="index">Indices (NAS100, US30)</option>
                <option value="crypto">Cryptocurrency</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('Long')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1 ${
                    direction === 'Long'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Long</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('Short')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-colors flex items-center justify-center gap-1 ${
                    direction === 'Short'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Short</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Price Execution Coordinates */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Price Execution & Lots
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Entry Price *
              </label>
              <input
                type="number"
                step="any"
                required
                value={entry}
                onChange={(e) => setEntry(e.target.value)}
                placeholder="1.08500"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={exit}
                onChange={(e) => setExit(e.target.value)}
                placeholder="1.08950"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Stop Loss
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="1.08300"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-rose-400 focus:border-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Take Profit
              </label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="1.09200"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Position Lots *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Commission ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Swap ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={swap}
                onChange={(e) => setSwap(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Time, Strategy, and Context */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            3. Setup & Session Context
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
              >
                <option value="London">London (Open)</option>
                <option value="New York">New York</option>
                <option value="Asian">Asian (Tokyo)</option>
                <option value="Sydney">Sydney / Pacific</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Setup Strategy
              </label>
              <input
                type="text"
                list="strategy-options"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Order Block, Liquidity Sweep..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-sky-500 focus:outline-hidden"
              />
              <datalist id="strategy-options">
                {STRATEGIES.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Emotional Mindset
              </label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
              >
                {EMOTIONS.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: 5-Star Trade Quality Rating */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                4. Trade Setup & Execution Quality (5 Stars)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Click stars to grade edge adherence & execution
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Setup Quality & Discipline Grade
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-lg leading-relaxed">
                Rate this trade from 1 star (impulsive/chased/broken rules) to 5 stars (A+ textbook institutional execution with zero tilt).
              </p>
            </div>

            <div className="shrink-0 bg-slate-950 p-2.5 rounded-xl border border-slate-800 shadow-inner">
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
                showLabel={true}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Execution Checklist */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            5. Institutional Execution Checklist
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={biasConfirmed}
                onChange={(e) => setBiasConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Higher-TF Trend & Market Structure Confirmed</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={keyLevelSwept}
                onChange={(e) => setKeyLevelSwept(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Liquidity Level / Equal Highs-Lows Swept</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={riskWithinLimit}
                onChange={(e) => setRiskWithinLimit(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Risk Capital strictly ≤ {settings.defaultRisk}% of account</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-slate-300 select-none">
              <input
                type="checkbox"
                checked={validRiskReward}
                onChange={(e) => setValidRiskReward(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-900 border-slate-700"
              />
              <span>Risk:Reward Ratio ≥ 1:1.5</span>
            </label>
          </div>
        </div>

        {/* Section 6: Notes & Tags */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            6. Post-Mortem & Tags
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="A+ Setup, Followed Plan, Clean R:R, Early Exit"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Trading Notes & Psychology Post-Mortem
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What prompted this execution? Did price deliver cleanly or chop? How was your patience and discipline?"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Chart Screenshot URL (Optional)
            </label>
            <input
              type="url"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="https://www.tradingview.com/x/..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:border-sky-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-sky-950 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{initialTrade ? 'Save Trade Changes' : 'Confirm & Log Trade'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
