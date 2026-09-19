import React from 'react';

interface RDistributionProps {
  rMultiples: number[];
  height?: number;
}

export default function RDistributionChart({ rMultiples, height = 180 }: RDistributionProps) {
  if (!rMultiples || rMultiples.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-500 text-xs h-[180px]">
        No R-multiple data available. Set Stop Loss on trades to track R.
      </div>
    );
  }

  const buckets = [
    { label: '< -2R', min: -Infinity, max: -2, isWin: false },
    { label: '-2R to -1R', min: -2, max: -0.999, isWin: false },
    { label: '-1R to 0R', min: -0.999, max: 0, isWin: false },
    { label: '0 to 1R', min: 0.001, max: 1, isWin: true },
    { label: '1R to 2R', min: 1, max: 2, isWin: true },
    { label: '2R to 3R', min: 2, max: 3, isWin: true },
    { label: '3R to 5R', min: 3, max: 5, isWin: true },
    { label: '> 5R', min: 5, max: Infinity, isWin: true },
  ];

  const counts = buckets.map((b) => {
    const matching = rMultiples.filter((r) => r >= b.min && r < b.max);
    return {
      ...b,
      count: matching.length,
      pct: (matching.length / rMultiples.length) * 100,
    };
  });

  const maxCount = Math.max(...counts.map((c) => c.count), 1);

  return (
    <div className="w-full flex flex-col justify-end" style={{ height }}>
      <div className="flex items-end justify-between gap-1.5 h-full pt-4 pb-2">
        {counts.map((b, i) => {
          const barHeight = Math.max(6, (b.count / maxCount) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 border border-slate-700 text-slate-200 text-[10px] px-1.5 py-0.5 rounded shadow whitespace-nowrap z-20 pointer-events-none">
                {b.count} trades ({b.pct.toFixed(1)}%)
              </div>

              <span className="text-[10px] text-slate-400 font-mono mb-1 group-hover:text-slate-200">
                {b.count > 0 ? b.count : ''}
              </span>

              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  b.isWin
                    ? 'bg-emerald-500/70 hover:bg-emerald-400'
                    : 'bg-rose-500/70 hover:bg-rose-400'
                }`}
                style={{ height: `${barHeight}%` }}
              />

              <span className="text-[9px] text-slate-400 mt-1.5 truncate max-w-full font-mono text-center">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
