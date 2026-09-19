import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Bot,
  History,
  PlusCircle,
  Calculator,
  Settings as SettingsIcon,
  TrendingUp,
  X,
  Sparkles,
  Target,
} from 'lucide-react';
import { Stats, Trade, Settings } from '../types.ts';
import GoalsSidebarSection from './GoalsSidebarSection.tsx';

interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  stats: Stats;
  trades?: Trade[];
  settings?: Settings;
  onUpdateSettings?: (newPartial: Partial<Settings>) => void;
}

export default function Sidebar({
  page,
  setPage,
  open,
  setOpen,
  stats,
  trades = [],
  settings,
  onUpdateSettings,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Monthly Goals', icon: Target },
    { id: 'analytics', label: 'Deep Analytics & Sim', icon: LineChart },
    { id: 'ai-coach', label: 'AI Trade Coach', icon: Bot, badge: 'Gemini' },
    { id: 'history', label: 'Trade Journal', icon: History, count: stats.n },
    { id: 'add-trade', label: 'Log New Trade', icon: PlusCircle },
    { id: 'calculator', label: 'Position Calculator', icon: Calculator },
    { id: 'settings', label: 'Settings & Risk Rules', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/90 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-sky-950">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">TradeTracker</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/15 text-sky-300 border border-sky-500/30 tracking-wider whitespace-nowrap">
                  by VON
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Trading Journal & Risk Engine</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for Navigation & Goals Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col justify-between">
          <div>
            {/* Quick Trade Count / Win Rate Mini Banner */}
            <div className="mx-3 my-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Total Journaled:</span>
                <span className="font-mono font-bold text-slate-200">{stats.n} trades</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Win Rate:</span>
                <span className={`font-mono font-bold ${stats.winRate >= 50 ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {stats.winRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Monthly Goals Section in Sidebar */}
            {settings && onUpdateSettings && (
              <GoalsSidebarSection
                trades={trades}
                settings={settings}
                onUpdateSettings={onUpdateSettings}
                onNavigateToGoals={() => {
                  setPage('goals');
                  setOpen(false);
                }}
              />
            )}

            {/* Navigation list */}
            <nav className="px-3 py-1 space-y-1">
              <div className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Navigation
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setPage(item.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-950/40'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-sky-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        {item.badge}
                      </span>
                    )}

                    {item.count !== undefined && item.count > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-800/80 text-[11px] text-slate-500 shrink-0 bg-slate-950">
          <div className="flex items-center justify-between">
            <span>Expectancy:</span>
            <span className="font-mono font-semibold text-slate-300">
              {stats.expectancy > 0 ? '+' : ''}${stats.expectancy.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span>Profit Factor:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
