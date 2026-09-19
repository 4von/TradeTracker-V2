import React, { useState } from 'react';
import { Trade } from '../types.ts';
import { netPnl, rMultiple, pipDifference } from '../lib/trade.ts';
import {
  fmtMoney,
  fmtSigned,
  fmtDate,
  pnlColor,
  pnlBg,
} from '../lib/format.ts';
import StarRating from './StarRating.tsx';
import {
  X,
  Bot,
  Sparkles,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Layers,
  HeartPulse,
  Tag,
} from 'lucide-react';

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
  onEdit: (t: Trade) => void;
  onDelete: (id: string) => void;
}

interface SingleAuditResult {
  grade?: string;
  score?: number;
  strengths?: string[];
  mistakes?: string[];
  tip?: string;
}

export default function TradeDetailModal({
  trade,
  onClose,
  onEdit,
  onDelete,
}: TradeDetailModalProps) {
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [audit, setAudit] = useState<SingleAuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  const pnl = netPnl(trade);
  const r = rMultiple(trade);
  const pips = pipDifference(trade);

  const handleAuditTrade = async () => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/ai/audit-trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trade }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Audit failed');
      setAudit(data);
    } catch (err: any) {
      setAuditError(err.message || 'Could not audit trade');
    } finally {
      setLoadingAudit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-xl font-black text-white">{trade.symbol}</span>
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                trade.direction === 'Long'
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
              }`}
            >
              {trade.direction}
            </span>
            <span className="text-xs text-slate-400">{trade.session} Session</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Highlight P&L Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Net P&L</span>
            <div className={`text-xl font-mono font-black ${pnlColor(pnl)}`}>
              {fmtSigned(pnl)}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">R-Multiple</span>
            <div className={`text-xl font-mono font-black ${r !== null ? pnlColor(r) : 'text-slate-400'}`}>
              {r !== null ? `${r > 0 ? '+' : ''}${r.toFixed(2)}R` : '—'}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Pips Move</span>
            <div className={`text-xl font-mono font-bold ${pnlColor(pips)}`}>
              {pips > 0 ? '+' : ''}
              {pips.toFixed(1)}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Volume</span>
            <div className="text-xl font-mono font-bold text-slate-200">
              {trade.lots} <span className="text-xs text-slate-500">lots</span>
            </div>
          </div>
        </div>

        {/* Execution Coordinates */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Entry Price</span>
            <span className="font-mono text-slate-200 font-bold">{trade.entry}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Exit Price</span>
            <span className="font-mono text-slate-200 font-bold">{trade.exit ?? 'Open'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Stop Loss</span>
            <span className="font-mono text-rose-400 font-bold">{trade.stopLoss ?? 'None'}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <span className="text-slate-500 block text-[10px]">Take Profit</span>
            <span className="font-mono text-emerald-400 font-bold">{trade.target ?? 'None'}</span>
          </div>
        </div>

        {/* Qualitative Metadata: Strategy, Emotion, Date, Commission */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
          <div>
            <span className="text-slate-500">Date & Time:</span>
            <div className="font-semibold text-slate-300">{fmtDate(trade.datetime)}</div>
          </div>
          <div>
            <span className="text-slate-500">Setup Strategy:</span>
            <div className="font-semibold text-slate-300">{trade.strategy || 'Discretionary'}</div>
          </div>
          <div>
            <span className="text-slate-500">Mindset / Emotion:</span>
            <div className="font-semibold text-slate-300">{trade.emotion || 'Disciplined'}</div>
          </div>
          <div>
            <span className="text-slate-500">Timeframe:</span>
            <div className="font-semibold text-slate-300">{trade.timeframe || '15m'}</div>
          </div>
          <div>
            <span className="text-slate-500">Commission & Swap:</span>
            <div className="font-mono text-slate-300">
              ${((trade.commission || 0) + (trade.swap || 0)).toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-slate-500">Trade Quality (5★):</span>
            <div className="mt-1">
              {trade.rating && trade.rating > 0 ? (
                <StarRating value={trade.rating} readOnly size="sm" showLabel={false} />
              ) : (
                <span className="text-slate-500 text-xs italic">Unrated</span>
              )}
            </div>
          </div>
        </div>

        {/* Quality Rating Banner if rated */}
        {trade.rating && trade.rating > 0 && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Setup Discipline:</span>
              <StarRating value={trade.rating} readOnly size="md" showLabel={true} />
            </div>
          </div>
        )}

        {/* Tags */}
        {trade.tags && trade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {trade.tags.map((t, idx) => (
              <span
                key={idx}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Checklist */}
        {trade.checklist && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Pre-Trade Execution Checklist
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                {trade.checklist.biasConfirmed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Higher-TF Bias Confirmed</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {trade.checklist.keyLevelSwept ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Key Liquidity Level Swept</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {trade.checklist.riskWithinLimit ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>Risk Within Maximum Plan Limit</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {trade.checklist.validRiskReward ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>R:R Greater than 1:1.5</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {trade.notes && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <span className="text-slate-500 font-bold block mb-1">Trader Notes & Post-Mortem:</span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
          </div>
        )}

        {/* Screenshot if available */}
        {trade.screenshotUrl && (
          <div className="rounded-xl overflow-hidden border border-slate-800">
            <img
              src={trade.screenshotUrl}
              alt="Trade Execution Setup"
              className="w-full max-h-64 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* AI Audit Box */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          {!audit ? (
            <button
              type="button"
              disabled={loadingAudit}
              onClick={handleAuditTrade}
              className="w-full py-2.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-violet-400 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>{loadingAudit ? 'Auditing Execution...' : 'AI Audit Single Trade'}</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/30 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-violet-200">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <span>AI Trade Evaluation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-200 font-black font-mono text-sm">
                    Grade: {audit.grade || 'A'}
                  </span>
                  {audit.score !== undefined && (
                    <span className="text-slate-400 font-mono">
                      Score: {audit.score}/100
                    </span>
                  )}
                </div>
              </div>

              {audit.tip && (
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                  <span className="font-bold text-sky-400 block mb-0.5">Tactical Takeaway:</span>
                  {audit.tip}
                </div>
              )}
            </div>
          )}

          {auditError && (
            <div className="text-rose-400 text-xs">⚠️ {auditError}</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to delete this trade?')) {
                onDelete(trade.id);
                onClose();
              }
            }}
            className="px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Trade</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onEdit(trade);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
