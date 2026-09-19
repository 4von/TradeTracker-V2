import React, { useState } from 'react';
import { Stats, Trade } from '../../types.ts';
import {
  Bot,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';

interface AiCoachPageProps {
  stats: Stats;
  trades: Trade[];
}

interface AuditResult {
  overallVerdict?: string;
  psychologicalProfile?: string;
  strengths?: string[];
  leaks?: string[];
  actionablePlan?: string[];
  sessionInsight?: string;
  disciplinedScore?: number;
}

export default function AiCoachPage({ stats, trades }: AiCoachPageProps) {
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Chat State
  const [chatInput, setChatInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: "Hello! I am your AI Trading Coach & Risk Officer. I monitor your win rates, expectancy, sessions, and psychological biases. Ask me any question about your trading performance or click 'Generate Comprehensive Audit' above!",
    },
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);

  // Run full journal audit
  const handleRunAudit = async () => {
    setLoadingAudit(true);
    setAuditError(null);
    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats,
          sampleTrades: trades.slice(0, 15),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Audit request failed');
      }
      setAuditResult(data);
    } catch (err: any) {
      setAuditError(err.message || 'Failed to connect to AI Coach');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Send chat message
  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || chatInput.trim();
    if (!text || chatLoading) return;

    const newHistory = [...chatHistory, { role: 'user' as const, text }];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          stats,
          history: chatHistory.slice(-6),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: data.reply || "I couldn't process that response." },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        { role: 'model', text: `⚠️ Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const samplePrompts = [
    'Where am I leaking the most profits?',
    'How is my emotional discipline impacting my win rate?',
    'What trading session has my highest statistical expectancy?',
    'How can I improve my average risk-to-reward ratio?',
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Quantitative Trading Coach
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
              Powered by Gemini 2.5
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional performance analysis, tilt detection, and automated trading plan auditing
          </p>
        </div>

        <button
          type="button"
          disabled={loadingAudit}
          onClick={handleRunAudit}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-violet-950 disabled:opacity-50 cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 ${loadingAudit ? 'animate-spin' : ''}`} />
          <span>{loadingAudit ? 'Auditing Trades...' : 'Generate Comprehensive Audit'}</span>
        </button>
      </div>

      {auditError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <div className="font-bold">AI Coach Offline:</div>
            <div>{auditError}</div>
          </div>
        </div>
      )}

      {/* Audit Report Card */}
      {auditResult && (
        <div className="bg-slate-900 border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-300">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Institutional Audit Report</h2>
                <p className="text-xs text-slate-400">Statistical breakdown based on {stats.n} trades</p>
              </div>
            </div>

            {auditResult.disciplinedScore !== undefined && (
              <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400">Plan Adherence:</span>
                <span
                  className={`font-mono text-lg font-black ${
                    auditResult.disciplinedScore >= 75
                      ? 'text-emerald-400'
                      : auditResult.disciplinedScore >= 50
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {auditResult.disciplinedScore} / 100
                </span>
              </div>
            )}
          </div>

          {/* Overall Verdict */}
          {auditResult.overallVerdict && (
            <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-500/20 text-xs text-violet-200 leading-relaxed font-medium">
              <span className="font-bold text-violet-300 uppercase tracking-wider block mb-1">
                Executive Verdict:
              </span>
              {auditResult.overallVerdict}
            </div>
          )}

          {/* Strengths & Leaks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Identified Edges & Strengths</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                {(auditResult.strengths || []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Leaks */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Leaks & Vulnerabilities</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                {(auditResult.leaks || []).map((l, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Plan */}
          {auditResult.actionablePlan && auditResult.actionablePlan.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Immediate 3-Point Action Plan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {auditResult.actionablePlan.map((step, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                  >
                    <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-1">
                      Rule #{i + 1}
                    </div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Psychology & Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {auditResult.psychologicalProfile && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400 font-bold block mb-1">
                  Psychology & Emotional Discipline:
                </span>
                {auditResult.psychologicalProfile}
              </div>
            )}
            {auditResult.sessionInsight && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                <span className="text-slate-400 font-bold block mb-1">
                  Session & Timing Dynamics:
                </span>
                {auditResult.sessionInsight}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Coach Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-[520px]">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Trade Coach Conversation</h2>
              <p className="text-xs text-slate-400">
                Ask specific questions about setups, risk rules, or psychology
              </p>
            </div>
          </div>
        </div>

        {/* Chat Message Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
          {chatHistory.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  m.role === 'user'
                    ? 'bg-sky-500 text-slate-950 font-bold'
                    : 'bg-violet-600/30 text-violet-300 border border-violet-500/30'
                }`}
              >
                {m.role === 'user' ? 'You' : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-xl p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-sky-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Bot className="w-4 h-4 text-violet-400 animate-spin" />
              <span>AI Coach is reviewing your journal data...</span>
            </div>
          )}
        </div>

        {/* Quick Question Chips */}
        <div className="pt-3 pb-2 shrink-0 flex flex-wrap gap-1.5 overflow-x-auto">
          {samplePrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2 border-t border-slate-800 shrink-0 flex items-center gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask your coach (e.g., 'What is causing my largest drawdowns?')..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-hidden transition-colors"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatLoading}
            className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
