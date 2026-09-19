import React, { useState, useMemo } from 'react';
import { Trade, Settings } from '../types.ts';
import { netPnl, rMultiple } from '../lib/trade.ts';
import { fmtSigned, fmtMoney, pnlColor, pnlBg, fmtDate } from '../lib/format.ts';
import StarRating from './StarRating.tsx';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  Star,
  X,
  ExternalLink,
  Edit,
  Flame,
  Award,
  Plus,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

interface TradeCalendarProps {
  trades: Trade[];
  allTrades?: Trade[];
  settings: Settings;
  onSelectTrade: (t: Trade) => void;
  onEditTrade: (t: Trade) => void;
  onOpenAddTrade?: () => void;
}

// Helper to safely extract 'YYYY-MM-DD' from any datetime string
function getTradeDateKey(datetime: string): string {
  if (!datetime) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(datetime)) {
    return datetime.slice(0, 10);
  }
  const d = new Date(datetime);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return '';
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DOW_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TradeCalendar({
  trades,
  allTrades,
  settings,
  onSelectTrade,
  onEditTrade,
  onOpenAddTrade,
}: TradeCalendarProps) {
  // Determine initial year and month
  const initialDate = useMemo(() => {
    if (trades.length > 0) {
      // Find the latest trade date to open directly to the most active month
      const sorted = [...trades].sort(
        (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      );
      const latest = new Date(sorted[0].datetime);
      if (!isNaN(latest.getTime())) {
        return { year: latest.getFullYear(), month: latest.getMonth() };
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [trades]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.month);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  // Group trades by date key 'YYYY-MM-DD'
  const tradesByDate = useMemo(() => {
    const map = new Map<string, Trade[]>();
    trades.forEach((t) => {
      const key = getTradeDateKey(t.datetime);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(t);
    });
    return map;
  }, [trades]);

  // Navigate months
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDateKey(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDateKey(null);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateKey(null);
  };

  // Calendar calculations for current month
  const calendarWeeks = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const startDow = firstDay.getDay(); // 0 = Sun

    // Prev month days for leading cells
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    interface DayCell {
      dayNumber: number;
      dateKey: string;
      isCurrentMonth: boolean;
      trades: Trade[];
      pnl: number;
      winCount: number;
      lossCount: number;
      beCount: number;
      realizedR: number;
      isToday: boolean;
    }

    const todayStr = getTradeDateKey(new Date().toISOString());

    const weeks: { weekNum: number; days: DayCell[]; weekPnl: number; weekTradesCount: number; weekWinRate: number }[] = [];
    let currentWeekDays: DayCell[] = [];

    // Leading padding days
    for (let i = startDow - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateKey = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayTrades = tradesByDate.get(dateKey) || [];
      const dayPnl = dayTrades.reduce((sum, t) => sum + netPnl(t), 0);
      const winCount = dayTrades.filter((t) => netPnl(t) > 0).length;
      const lossCount = dayTrades.filter((t) => netPnl(t) < 0).length;
      const beCount = dayTrades.filter((t) => Math.abs(netPnl(t)) < 0.0001).length;
      const realizedR = dayTrades.reduce((sum, t) => sum + (rMultiple(t) || 0), 0);

      currentWeekDays.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        trades: dayTrades,
        pnl: dayPnl,
        winCount,
        lossCount,
        beCount,
        realizedR,
        isToday: dateKey === todayStr,
      });
    }

    // Days in current month
    for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayTrades = tradesByDate.get(dateKey) || [];
      const dayPnl = dayTrades.reduce((sum, t) => sum + netPnl(t), 0);
      const winCount = dayTrades.filter((t) => netPnl(t) > 0).length;
      const lossCount = dayTrades.filter((t) => netPnl(t) < 0).length;
      const beCount = dayTrades.filter((t) => Math.abs(netPnl(t)) < 0.0001).length;
      const realizedR = dayTrades.reduce((sum, t) => sum + (rMultiple(t) || 0), 0);

      currentWeekDays.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: true,
        trades: dayTrades,
        pnl: dayPnl,
        winCount,
        lossCount,
        beCount,
        realizedR,
        isToday: dateKey === todayStr,
      });

      if (currentWeekDays.length === 7) {
        const weekTrades = currentWeekDays.flatMap((d) => d.trades);
        const weekPnl = currentWeekDays.reduce((acc, d) => acc + d.pnl, 0);
        const weekWins = weekTrades.filter((t) => netPnl(t) > 0).length;
        const decided = weekTrades.filter((t) => Math.abs(netPnl(t)) >= 0.0001).length;
        const weekWinRate = decided > 0 ? (weekWins / decided) * 100 : 0;

        weeks.push({
          weekNum: weeks.length + 1,
          days: currentWeekDays,
          weekPnl,
          weekTradesCount: weekTrades.length,
          weekWinRate,
        });
        currentWeekDays = [];
      }
    }

    // Trailing padding days to finish the week
    if (currentWeekDays.length > 0) {
      let nextDayNum = 1;
      const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;

      while (currentWeekDays.length < 7) {
        const dateKey = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
        const dayTrades = tradesByDate.get(dateKey) || [];
        const dayPnl = dayTrades.reduce((sum, t) => sum + netPnl(t), 0);
        const winCount = dayTrades.filter((t) => netPnl(t) > 0).length;
        const lossCount = dayTrades.filter((t) => netPnl(t) < 0).length;
        const beCount = dayTrades.filter((t) => Math.abs(netPnl(t)) < 0.0001).length;
        const realizedR = dayTrades.reduce((sum, t) => sum + (rMultiple(t) || 0), 0);

        currentWeekDays.push({
          dayNumber: nextDayNum,
          dateKey,
          isCurrentMonth: false,
          trades: dayTrades,
          pnl: dayPnl,
          winCount,
          lossCount,
          beCount,
          realizedR,
          isToday: dateKey === todayStr,
        });
        nextDayNum++;
      }

      const weekTrades = currentWeekDays.flatMap((d) => d.trades);
      const weekPnl = currentWeekDays.reduce((acc, d) => acc + d.pnl, 0);
      const weekWins = weekTrades.filter((t) => netPnl(t) > 0).length;
      const decided = weekTrades.filter((t) => Math.abs(netPnl(t)) >= 0.0001).length;
      const weekWinRate = decided > 0 ? (weekWins / decided) * 100 : 0;

      weeks.push({
        weekNum: weeks.length + 1,
        days: currentWeekDays,
        weekPnl,
        weekTradesCount: weekTrades.length,
        weekWinRate,
      });
    }

    return weeks;
  }, [currentYear, currentMonth, tradesByDate]);

  // Aggregate monthly statistics for the current month
  const monthStats = useMemo(() => {
    const monthKeyPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthTrades = trades.filter((t) => getTradeDateKey(t.datetime).startsWith(monthKeyPrefix));

    const totalPnl = monthTrades.reduce((acc, t) => acc + netPnl(t), 0);
    const wins = monthTrades.filter((t) => netPnl(t) > 0);
    const losses = monthTrades.filter((t) => netPnl(t) < 0);
    const winTradesCount = wins.length;
    const lossTradesCount = losses.length;

    // Day-level stats
    const dayMap = new Map<string, number>();
    monthTrades.forEach((t) => {
      const key = getTradeDateKey(t.datetime);
      dayMap.set(key, (dayMap.get(key) || 0) + netPnl(t));
    });

    let winDays = 0;
    let lossDays = 0;
    let beDays = 0;
    let bestDayPnl = 0;
    let worstDayPnl = 0;

    dayMap.forEach((pnl) => {
      if (pnl > 0.01) {
        winDays++;
        if (pnl > bestDayPnl) bestDayPnl = pnl;
      } else if (pnl < -0.01) {
        lossDays++;
        if (pnl < worstDayPnl) worstDayPnl = pnl;
      } else {
        beDays++;
      }
    });

    const activeDays = winDays + lossDays + beDays;
    const dayWinRate = activeDays > 0 ? (winDays / activeDays) * 100 : 0;
    const tradeWinRate = monthTrades.length > 0 ? (winTradesCount / monthTrades.length) * 100 : 0;
    const totalR = monthTrades.reduce((acc, t) => acc + (rMultiple(t) || 0), 0);

    return {
      totalPnl,
      tradesCount: monthTrades.length,
      winTradesCount,
      lossTradesCount,
      tradeWinRate,
      activeDays,
      winDays,
      lossDays,
      beDays,
      dayWinRate,
      bestDayPnl,
      worstDayPnl,
      totalR,
    };
  }, [trades, currentYear, currentMonth]);

  // Selected date trades
  const selectedDayTrades = useMemo(() => {
    if (!selectedDateKey) return [];
    return tradesByDate.get(selectedDateKey) || [];
  }, [selectedDateKey, tradesByDate]);

  const selectedDaySummary = useMemo(() => {
    if (!selectedDayTrades.length) return null;
    const pnl = selectedDayTrades.reduce((acc, t) => acc + netPnl(t), 0);
    const wins = selectedDayTrades.filter((t) => netPnl(t) > 0).length;
    const losses = selectedDayTrades.filter((t) => netPnl(t) < 0).length;
    const totalR = selectedDayTrades.reduce((acc, t) => acc + (rMultiple(t) || 0), 0);
    return { pnl, wins, losses, totalR, count: selectedDayTrades.length };
  }, [selectedDayTrades]);

  // Distinct years available in dataset
  const availableYears = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    trades.forEach((t) => {
      const y = new Date(t.datetime).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  return (
    <div className="space-y-4">
      {/* Top Header & Month Navigator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                {monthStats.tradesCount > 0 && (
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      monthStats.totalPnl >= 0
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {fmtSigned(monthStats.totalPnl)}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual daily trading performance, win/loss day ratios, and execution heat
              </p>
            </div>
          </div>

          {/* Month & Year Selectors and Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={goToToday}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              Current Month
            </button>

            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Quick Month Selector */}
            <select
              value={currentMonth}
              onChange={(e) => {
                setCurrentMonth(Number(e.target.value));
                setSelectedDateKey(null);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-hidden cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name}
                </option>
              ))}
            </select>

            {/* Quick Year Selector */}
            <select
              value={currentYear}
              onChange={(e) => {
                setCurrentYear(Number(e.target.value));
                setSelectedDateKey(null);
              }}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-hidden cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Summary KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Month Net P&L</span>
            <div className={`text-base sm:text-lg font-black font-mono mt-0.5 ${pnlColor(monthStats.totalPnl)}`}>
              {fmtSigned(monthStats.totalPnl)}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {monthStats.totalR > 0 ? `+${monthStats.totalR.toFixed(1)}R` : `${monthStats.totalR.toFixed(1)}R`}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Day Win Rate</span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-200 mt-0.5">
              {monthStats.activeDays > 0 ? `${monthStats.dayWinRate.toFixed(1)}%` : '—'}
            </div>
            <span className="text-[10px] text-slate-400">
              {monthStats.winDays}W - {monthStats.lossDays}L days
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Month Trades</span>
            <div className="text-base sm:text-lg font-black font-mono text-slate-200 mt-0.5">
              {monthStats.tradesCount}
            </div>
            <span className="text-[10px] text-slate-400">
              {monthStats.winTradesCount} wins ({monthStats.tradeWinRate.toFixed(0)}%)
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Trading Days</span>
            <div className="text-base sm:text-lg font-black font-mono text-sky-400 mt-0.5">
              {monthStats.activeDays}
            </div>
            <span className="text-[10px] text-slate-400">Active market days</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Best Day P&L</span>
            <div className="text-base sm:text-lg font-black font-mono text-emerald-400 mt-0.5">
              {monthStats.bestDayPnl > 0 ? fmtSigned(monthStats.bestDayPnl) : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Peak green session</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Worst Day P&L</span>
            <div className="text-base sm:text-lg font-black font-mono text-rose-400 mt-0.5">
              {monthStats.worstDayPnl < 0 ? fmtSigned(monthStats.worstDayPnl) : '—'}
            </div>
            <span className="text-[10px] text-slate-400">Max day drawdown</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Day of Week Headers + Week Total Header */}
        <div className="grid grid-cols-7 lg:grid-cols-8 bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
          {DOW_HEADERS.map((dow, idx) => (
            <div
              key={dow}
              className={`py-3 px-2 border-r border-slate-800/60 last:border-r-0 ${
                idx === 0 || idx === 6 ? 'text-slate-500 bg-slate-950/40' : 'text-slate-300'
              }`}
            >
              {dow}
            </div>
          ))}
          <div className="hidden lg:flex items-center justify-center py-3 px-2 text-sky-400 font-extrabold bg-sky-950/20 border-l border-slate-800/80">
            Week Net
          </div>
        </div>

        {/* Weeks Rows */}
        <div className="divide-y divide-slate-800/70">
          {calendarWeeks.map((week) => (
            <div
              key={week.weekNum}
              className="grid grid-cols-7 lg:grid-cols-8 divide-x divide-slate-800/70 min-h-[95px] sm:min-h-[110px]"
            >
              {week.days.map((day) => {
                const hasTrades = day.trades.length > 0;
                const isSelected = selectedDateKey === day.dateKey;
                const isWinDay = hasTrades && day.pnl > 0.01;
                const isLossDay = hasTrades && day.pnl < -0.01;
                const isBeDay = hasTrades && Math.abs(day.pnl) <= 0.01;

                // Check if any trade has 5-star rating
                const hasFiveStar = day.trades.some((t) => t.rating === 5);

                return (
                  <div
                    key={day.dateKey}
                    onClick={() => {
                      if (hasTrades) {
                        setSelectedDateKey(isSelected ? null : day.dateKey);
                      }
                    }}
                    className={`p-1.5 sm:p-2.5 transition-all flex flex-col justify-between relative group select-none ${
                      !day.isCurrentMonth
                        ? 'bg-slate-950/40 opacity-35'
                        : isWinDay
                        ? 'bg-emerald-950/25 hover:bg-emerald-900/35 border-emerald-500/10'
                        : isLossDay
                        ? 'bg-rose-950/25 hover:bg-rose-900/35 border-rose-500/10'
                        : isBeDay
                        ? 'bg-slate-950/60 hover:bg-slate-800/50'
                        : 'bg-slate-900/40 hover:bg-slate-800/25'
                    } ${
                      hasTrades
                        ? 'cursor-pointer'
                        : 'cursor-default'
                    } ${
                      isSelected
                        ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 z-10 shadow-lg'
                        : ''
                    }`}
                  >
                    {/* Top Row: Date Number & Badges */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs sm:text-sm font-mono font-bold rounded-md px-1.5 py-0.5 inline-block ${
                          day.isToday
                            ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                            : day.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {day.dayNumber}
                      </span>

                      {/* 5-star marker if present */}
                      {hasFiveStar && (
                        <div
                          title="Contains A+ 5★ Setup"
                          className="text-amber-400 flex items-center"
                        >
                          <Star className="w-3 h-3 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
                        </div>
                      )}

                      {/* Trade count indicator */}
                      {hasTrades && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            isWinDay
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : isLossDay
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {day.trades.length}T
                        </span>
                      )}
                    </div>

                    {/* Middle: Daily P&L */}
                    <div className="my-1">
                      {hasTrades ? (
                        <div>
                          <div
                            className={`font-mono font-black text-xs sm:text-sm tracking-tight leading-tight truncate ${pnlColor(
                              day.pnl
                            )}`}
                          >
                            {fmtSigned(day.pnl, 0)}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5 text-[10px] font-mono text-slate-400">
                            <span>
                              {day.realizedR >= 0 ? `+${day.realizedR.toFixed(1)}R` : `${day.realizedR.toFixed(1)}R`}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-emerald-400">{day.winCount}W</span>
                            {day.lossCount > 0 && (
                              <span className="text-rose-400">/{day.lossCount}L</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-5"></div>
                      )}
                    </div>

                    {/* Bottom: Mini outcome dots for trades */}
                    {hasTrades && (
                      <div className="flex items-center gap-1 pt-1 border-t border-slate-800/40">
                        {day.trades.slice(0, 5).map((t, idx) => {
                          const p = netPnl(t);
                          return (
                            <span
                              key={idx}
                              className={`w-1.5 h-1.5 rounded-full ${
                                p > 0
                                  ? 'bg-emerald-400'
                                  : p < 0
                                  ? 'bg-rose-500'
                                  : 'bg-slate-500'
                              }`}
                              title={`${t.symbol}: ${fmtSigned(p)}`}
                            />
                          );
                        })}
                        {day.trades.length > 5 && (
                          <span className="text-[9px] text-slate-500 font-mono">
                            +{day.trades.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Weekly Summary Column (Desktop) */}
              <div className="hidden lg:flex flex-col justify-between p-2.5 bg-slate-950/60 text-right border-l border-slate-800/80">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Week {week.weekNum}
                </div>
                {week.weekTradesCount > 0 ? (
                  <div>
                    <div className={`font-mono font-black text-sm ${pnlColor(week.weekPnl)}`}>
                      {fmtSigned(week.weekPnl)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {week.weekTradesCount} {week.weekTradesCount === 1 ? 'trade' : 'trades'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {week.weekWinRate.toFixed(0)}% win rate
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 text-xs italic font-mono">—</div>
                )}
                <div className="h-2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Day Inspector Panel */}
      {selectedDateKey && selectedDaySummary && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Trades for {fmtDate(selectedDateKey)}</span>
                  <span
                    className={`text-xs font-mono font-black px-2 py-0.5 rounded-md border ${
                      selectedDaySummary.pnl >= 0
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    Day Net: {fmtSigned(selectedDaySummary.pnl)}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedDaySummary.count} {selectedDaySummary.count === 1 ? 'trade' : 'trades'} executed ·{' '}
                  <span className="text-emerald-400 font-semibold">{selectedDaySummary.wins} Wins</span> ·{' '}
                  <span className="text-rose-400 font-semibold">{selectedDaySummary.losses} Losses</span> ·{' '}
                  <span className="text-slate-300 font-mono font-bold">
                    {selectedDaySummary.totalR >= 0 ? `+${selectedDaySummary.totalR.toFixed(2)}R` : `${selectedDaySummary.totalR.toFixed(2)}R`}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenAddTrade && (
                <button
                  type="button"
                  onClick={onOpenAddTrade}
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Trade</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDateKey(null)}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Day Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Trades for Selected Day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedDayTrades.map((t) => {
              const pnl = netPnl(t);
              const r = rMultiple(t);
              const isLong = t.direction === 'Long';

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 shadow-md group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${
                          isLong
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {t.direction}
                      </span>
                      <span className="font-bold text-sm text-slate-200">{t.symbol}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {t.lots} lots
                      </span>
                    </div>

                    <div className={`font-mono font-black text-base ${pnlColor(pnl)}`}>
                      {fmtSigned(pnl)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/60">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Entry → Exit</span>
                      <span className="font-mono text-slate-300 text-xs">
                        {t.entry} → {t.exit ?? 'Open'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Realized R</span>
                      <span
                        className={`font-mono font-bold text-xs ${
                          r !== null ? pnlColor(r) : 'text-slate-400'
                        }`}
                      >
                        {r !== null ? `${r > 0 ? '+' : ''}${r.toFixed(2)}R` : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      {t.rating && t.rating > 0 ? (
                        <StarRating value={t.rating} readOnly size="xs" showLabel={false} />
                      ) : (
                        <span className="text-[10px] text-slate-600">Unrated</span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                        {t.strategy || 'Discretionary'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectTrade(t)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 hover:text-sky-300 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditTrade(t)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit Trade"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
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
