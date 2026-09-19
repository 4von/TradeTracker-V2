import React from 'react';
import { MonteCarloResult } from '../../types.ts';
import { fmtMoney } from '../../lib/format.ts';

interface MonteCarloChartProps {
  result: MonteCarloResult;
  startingCapital: number;
  height?: number;
}

export default function MonteCarloChart({
  result,
  startingCapital,
  height = 240,
}: MonteCarloChartProps) {
  if (!result || !result.percentile50 || result.percentile50.length === 0) {
    return null;
  }

  const steps = result.percentile50.length;
  const allValues = [
    ...result.percentile5,
    ...result.percentile50,
    ...result.percentile95,
    startingCapital,
  ];
  const minY = Math.min(...allValues);
  const maxY = Math.max(...allValues);
  const rangeY = maxY - minY || 1;

  const padding = { top: 15, right: 24, bottom: 25, left: 56 };
  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const getX = (idx: number) => padding.left + (idx / (steps - 1)) * plotWidth;
  const getY = (val: number) =>
    padding.top + plotHeight - ((val - minY) / rangeY) * plotHeight;

  const line5 = result.percentile5.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const line50 = result.percentile50.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const line95 = result.percentile95.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  // Fan fill between 5th and 95th
  const fanReverse = result.percentile5
    .slice()
    .reverse()
    .map((v, i) => `${getX(steps - 1 - i)},${getY(v)}`)
    .join(' ');
  const fanPoints = `${line95} ${fanReverse}`;

  return (
    <div className="w-full select-none">
      {/* Simulation Probabilities Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Median Final
          </div>
          <div className="text-sm font-bold text-sky-400 font-mono mt-0.5">
            {fmtMoney(result.medianFinal, 0)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Prob. Doubling
          </div>
          <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
            {result.probDoubling}%
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Prob. 10% Drawdown
          </div>
          <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">
            {result.probDrawdown10}%
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            Prob. 20% Drawdown
          </div>
          <div className={`text-sm font-bold font-mono mt-0.5 ${result.probDrawdown20 > 25 ? 'text-rose-400' : 'text-slate-300'}`}>
            {result.probDrawdown20}%
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className="w-full h-auto overflow-visible">
        {/* Horizontal grid lines */}
        {[minY, minY + rangeY * 0.5, maxY].map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                stroke="#334155"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {fmtMoney(val, 0)}
              </text>
            </g>
          );
        })}

        {/* Initial Capital Line */}
        <line
          x1={padding.left}
          y1={getY(startingCapital)}
          x2={viewBoxWidth - padding.right}
          y2={getY(startingCapital)}
          stroke="#64748b"
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {/* Background Sample Individual Paths */}
        {result.allPaths.map((path, idx) => {
          const pathPoints = path.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
          return (
            <polyline
              key={idx}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="0.75"
              strokeOpacity="0.12"
              points={pathPoints}
            />
          );
        })}

        {/* 90% Confidence Fan */}
        <polygon fill="#0284c7" fillOpacity="0.12" points={fanPoints} />

        {/* 95th Percentile Line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          points={line95}
        />

        {/* 50th Median Line */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          points={line50}
        />

        {/* 5th Percentile Line */}
        <polyline
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          points={line5}
        />

        {/* X-axis labels */}
        <text
          x={padding.left}
          y={viewBoxHeight - 6}
          fill="#64748b"
          fontSize="10"
          textAnchor="start"
        >
          Trade #0
        </text>
        <text
          x={padding.left + plotWidth / 2}
          y={viewBoxHeight - 6}
          fill="#64748b"
          fontSize="10"
          textAnchor="middle"
        >
          +50 Trades
        </text>
        <text
          x={viewBoxWidth - padding.right}
          y={viewBoxHeight - 6}
          fill="#64748b"
          fontSize="10"
          textAnchor="end"
        >
          +100 Trades
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-emerald-500 rounded-full inline-block"></span>
          <span>95th Percentile (Optimistic)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block"></span>
          <span>Median (50th Percentile)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-rose-500 rounded-full inline-block"></span>
          <span>5th Percentile (Worst 5% Drawdown)</span>
        </div>
      </div>
    </div>
  );
}
