import React from 'react';
import { Settings, Stats } from '../types.ts';
import { fmtMoney, fmtSigned, pnlColor } from '../lib/format.ts';
import { netPnl } from '../lib/trade.ts';
import { Menu, Volume2, VolumeX, Globe2, PlusCircle, Sparkles } from 'lucide-react';

interface TopBarProps {
  stats: Stats;
  settings: Settings;
  onUpdateSettings: (newSettings: Partial<Settings>) => void;
  onOpenAddTrade: () => void;
  onToggleSidebar: () => void;
  onOpenAiCoach: () => void;
}

export default function TopBar({
  stats,
  settings,
  onUpdateSettings,
  onOpenAddTrade,
  onToggleSidebar,
  onOpenAiCoach,
}: TopBarProps) {
  // Determine active world forex market sessions based on UTC hour
  const now = new Date();
  const utcHour = now.getUTCHours();

  let activeSessionName = 'Asian (Tokyo)';
  let sessionBadgeColor = 'bg-sky-500/15 text-sky-400 border-sky-500/30';

  if (utcHour >= 7 && utcHour < 12) {
    activeSessionName = 'London Session (High Vol)';
    sessionBadgeColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (utcHour >= 12 && utcHour < 16) {
    activeSessionName = 'London / NY Overlap (Peak Vol)';
    sessionBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  } else if (utcHour >= 16 && utcHour < 21) {
    activeSessionName = 'New York Session';
    sessionBadgeColor = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  } else if (utcHour >= 21 || utcHour < 2) {
    activeSessionName = 'Sydney / Pacific';
    sessionBadgeColor = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  }

  // Calculate today's P&L
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTrades = stats.sorted.filter((t) => t.datetime.startsWith(todayStr));
  const todayPnl = todayTrades.reduce((acc, t) => acc + netPnl(t), 0);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Mobile trigger & Active Market Session */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-xs select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Globe2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300">{activeSessionName}</span>
        </div>
      </div>

      {/* Right: Balance, Day P&L, Quick Add, AI Coach */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Day P&L */}
        <div className="hidden md:flex flex-col items-end text-right">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
            Today's Net
          </span>
          <span className={`text-xs font-mono font-bold ${pnlColor(todayPnl)}`}>
            {fmtSigned(todayPnl)}
          </span>
        </div>

        {/* Account Balance */}
        <div className="flex flex-col items-end text-right bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            Account Equity
          </span>
          <span className="text-sm font-mono font-bold text-slate-100">
            {fmtMoney((settings.accountBalance || 10000) + stats.total)}
          </span>
        </div>

        {/* Sound toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
          title={settings.soundEnabled ? 'Mute Trading Audio' : 'Unmute Trading Audio'}
          className={`p-2 rounded-xl border transition-colors ${
            settings.soundEnabled
              ? 'bg-slate-900 border-slate-700 text-sky-400'
              : 'bg-slate-900/60 border-slate-800 text-slate-500'
          }`}
        >
          {settings.soundEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* AI Trade Coach button */}
        <button
          type="button"
          onClick={onOpenAiCoach}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 font-semibold text-xs transition-all shadow-sm shadow-violet-950"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
          <span>AI Coach</span>
        </button>

        {/* Add Trade Button */}
        <button
          type="button"
          onClick={onOpenAddTrade}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-all shadow-sm shadow-sky-950 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Log Trade</span>
        </button>
      </div>
    </header>
  );
}
