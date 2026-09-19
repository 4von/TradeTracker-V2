import React, { useState, useEffect, useMemo } from 'react';
import { Trade, Settings, Stats } from './types.ts';
import { DEFAULT_SETTINGS } from './lib/constants.ts';
import { computeStats } from './lib/trade.ts';
import { generateDemo } from './lib/demo.ts';
import TopBar from './components/TopBar.tsx';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/pages/Dashboard.tsx';
import Analytics from './components/pages/Analytics.tsx';
import AiCoachPage from './components/pages/AiCoachPage.tsx';
import History from './components/pages/History.tsx';
import AddTrade from './components/pages/AddTrade.tsx';
import PositionCalculator from './components/PositionCalculator.tsx';
import SettingsPage from './components/pages/SettingsPage.tsx';
import Goals from './components/pages/Goals.tsx';
import TradeDetailModal from './components/TradeDetailModal.tsx';

const TRADES_STORAGE_KEY = 'tradetracker_trades_v2';
const SETTINGS_STORAGE_KEY = 'tradetracker_settings_v2';

export default function App() {
  // Load initial settings
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Load initial trades or populate with rich demo
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const stored = localStorage.getItem(TRADES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load trades from storage', e);
    }
    // Seed with realistic demo trade dataset on first boot
    return generateDemo();
  });

  // Active page state
  const [page, setPage] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Selected trade for detail modal
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  // Editing trade or pre-filled trade state
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  // Persist trades
  useEffect(() => {
    try {
      localStorage.setItem(TRADES_STORAGE_KEY, JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save trades', e);
    }
  }, [trades]);

  // Recompute statistics whenever trades or balance settings change
  const stats: Stats = useMemo(() => {
    return computeStats(trades, settings.accountBalance || 10000);
  }, [trades, settings.accountBalance]);

  // Trade handlers
  const handleSaveTrade = (savedTrade: Trade) => {
    setTrades((prev) => {
      const exists = prev.some((t) => t.id === savedTrade.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTrade.id ? savedTrade : t));
      } else {
        return [savedTrade, ...prev];
      }
    });
    setEditingTrade(null);
    setPage('history');
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
    if (selectedTrade?.id === id) {
      setSelectedTrade(null);
    }
  };

  const handleUpdateSettings = (newPartial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const handleResetTrades = () => {
    setTrades([]);
    setSelectedTrade(null);
    setEditingTrade(null);
  };

  const handleLoadDemoTrades = () => {
    const demo = generateDemo();
    setTrades(demo);
    alert(`Loaded ${demo.length} institutional demo trades!`);
    setPage('dashboard');
  };

  const handleImportTrades = (imported: Trade[]) => {
    setTrades((prev) => [...imported, ...prev]);
  };

  // When Position Calculator applies values to trade form
  const handleApplyCalculatorToTrade = (details: {
    symbol: string;
    lots: number;
    entry: number;
    stopLoss: number;
  }) => {
    const newDraft: Trade = {
      id: 'calc-temp-' + Date.now(),
      datetime: new Date().toISOString().slice(0, 16),
      symbol: details.symbol,
      assetClass: details.symbol === 'XAUUSD' ? 'metal' : details.symbol.includes('BTC') ? 'crypto' : 'forex',
      direction: 'Long',
      entry: details.entry,
      stopLoss: details.stopLoss,
      lots: details.lots,
      lotMultiplier: settings.lotSizes[details.symbol] || 100000,
      commission: 4.5,
      swap: 0,
      session: 'London',
      strategy: 'Breakout',
      timeframe: '15m',
      emotion: 'Disciplined',
      confidence: 4,
      tags: ['Calculated Risk'],
      notes: 'Position size calculated with exact stop loss distance.',
      checklist: {
        biasConfirmed: true,
        keyLevelSwept: true,
        riskWithinLimit: true,
        validRiskReward: true,
      },
    };
    setEditingTrade(newDraft);
    setPage('add-trade');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <TopBar
        stats={stats}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenAddTrade={() => {
          setEditingTrade(null);
          setPage('add-trade');
        }}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
        onOpenAiCoach={() => setPage('ai-coach')}
      />

      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <Sidebar
          page={page}
          setPage={setPage}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          stats={stats}
          trades={trades}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full transition-all">
          {page === 'dashboard' && (
            <Dashboard
              stats={stats}
              settings={settings}
              trades={trades}
              setPage={setPage}
              onSelectTrade={(t) => setSelectedTrade(t)}
              onOpenAddTrade={() => {
                setEditingTrade(null);
                setPage('add-trade');
              }}
              onOpenAiCoach={() => setPage('ai-coach')}
            />
          )}

          {page === 'goals' && (
            <Goals
              trades={trades}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onSelectTrade={(t) => setSelectedTrade(t)}
              onOpenAddTrade={() => {
                setEditingTrade(null);
                setPage('add-trade');
              }}
            />
          )}

          {page === 'analytics' && (
            <Analytics stats={stats} settings={settings} trades={trades} />
          )}

          {page === 'ai-coach' && (
            <AiCoachPage stats={stats} trades={trades} />
          )}

          {page === 'history' && (
            <History
              trades={trades}
              settings={settings}
              onSelectTrade={(t) => setSelectedTrade(t)}
              onEditTrade={(t) => {
                setEditingTrade(t);
                setPage('add-trade');
              }}
              onDeleteTrade={handleDeleteTrade}
              onOpenAddTrade={() => {
                setEditingTrade(null);
                setPage('add-trade');
              }}
              onImportTrades={handleImportTrades}
            />
          )}

          {page === 'add-trade' && (
            <AddTrade
              initialTrade={editingTrade}
              settings={settings}
              onSave={handleSaveTrade}
              onCancel={() => {
                setEditingTrade(null);
                setPage('history');
              }}
            />
          )}

          {page === 'calculator' && (
            <div className="space-y-6 max-w-3xl mx-auto pb-12">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Position Size & Risk Calculator
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculate precise lot sizes by contract specification, stop distance, and risk capital
                </p>
              </div>
              <PositionCalculator
                settings={settings}
                onApplyToTrade={handleApplyCalculatorToTrade}
              />
            </div>
          )}

          {page === 'settings' && (
            <SettingsPage
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onResetTrades={handleResetTrades}
              onLoadDemoTrades={handleLoadDemoTrades}
              trades={trades}
            />
          )}
        </main>
      </div>

      {/* Trade Detail / Inspection Modal */}
      {selectedTrade && (
        <TradeDetailModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onEdit={(t) => {
            setEditingTrade(t);
            setSelectedTrade(null);
            setPage('add-trade');
          }}
          onDelete={(id) => {
            handleDeleteTrade(id);
            setSelectedTrade(null);
          }}
        />
      )}
    </div>
  );
}
