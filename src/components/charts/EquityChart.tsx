import React, { useState, useRef } from 'react';
import { EquityPoint } from '../../types.ts';
import { fmtSigned, fmtMoney, fmtDate, pnlColor } from '../../lib/format.ts';

interface EquityChartProps {
  data: EquityPoint[];
  height?: number;
  showDrawdown?: boolean;
}

export default function EquityChart({ data, height = 300, showDrawdown = true }: EquityChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm"
        style={{ height }}
      >
        No trade data to render equity curve
      </div>
    );
  }

  // Calculate scales
  const values = data.map((d) => d.y);
  const peaks = data.map((d) => d.peak);
  const allY = [...values, ...peaks, 0];
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  const rangeY = maxY - minY || 1;

  const padding = { top: 20, right: 24, bottom: 30, left: 56 };
  const viewBoxWidth = 800;
  const viewBoxHeight = height;

  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (idx / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padding.top + plotHeight - ((val - minY) / rangeY) * plotHeight;
  };

  // Zero line
  const zeroY = getY(0);

  // Generate SVG Path for equity line
  const points = data.map((d, i) => `${getX(i)},${getY(d.y)}`).join(' ');
  const areaPoints = `${getX(0)},${getY(Math.min(0, minY))} ${points} ${getX(data.length - 1)},${getY(Math.min(0, minY))}`;

  // Peak line
  const peakPoints = data.map((d, i) => `${getX(i)},${getY(d.peak)}`).join(' ');

  // Hovered item
  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - (padding.left / viewBoxWidth) * rect.width) / ((plotWidth / viewBoxWidth) * rect.width)));
    const idx = Math.round(ratio * (data.length - 1));
    if (idx >= 0 && idx < data.length) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Y-axis ticks
  const yTicks = [minY, minY + rangeY * 0.25, minY + rangeY * 0.5, minY + rangeY * 0.75, maxY];

  return (
    <div className="relative w-full select-none" ref={containerRef}>
      {/* Dynamic Scrubber Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2 px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Trade #{activePoint.tradeIndex}:</span>
          <span className="font-semibold text-slate-200">{fmtDate(activePoint.x)}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 mr-1.5">Trade P&L:</span>
            <span className={`font-mono font-medium ${pnlColor(activePoint.pnl)}`}>
              {fmtSigned(activePoint.pnl)}
            </span>
            {activePoint.r !== null && (
              <span className="text-slate-400 ml-1 text-[11px]">
                ({activePoint.r > 0 ? '+' : ''}{activePoint.r.toFixed(2)}R)
              </span>
            )}
          </div>
          <div>
            <span className="text-slate-400 mr-1.5">Net Equity:</span>
            <span className={`font-mono font-bold ${pnlColor(activePoint.y)}`}>
              {fmtSigned(activePoint.y)}
            </span>
          </div>
          {activePoint.drawdown > 0 && (
            <div className="hidden sm:block">
              <span className="text-slate-400 mr-1.5">Drawdown:</span>
              <span className="font-mono text-rose-400">
                -{fmtMoney(activePoint.drawdown)} ({activePoint.drawdownPct.toFixed(1)}%)
              </span>
            </div>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#0ea5e9" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = getY(tick);
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
                {fmtSigned(tick, 0)}
              </text>
            </g>
          );
        })}

        {/* Zero baseline */}
        {minY < 0 && maxY > 0 && (
          <line
            x1={padding.left}
            y1={zeroY}
            x2={viewBoxWidth - padding.right}
            y2={zeroY}
            stroke="#94a3b8"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        )}

        {/* High Water Mark (Ceiling) Line */}
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeOpacity="0.6"
          points={peakPoints}
        />

        {/* Shaded Equity Area */}
        <polygon
          fill="url(#equityGradient)"
          points={`${getX(0)},${getY(minY)} ${points} ${getX(data.length - 1)},${getY(minY)}`}
        />

        {/* Equity Curve Line */}
        <polyline
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Interactive scrubber cursor line */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={viewBoxHeight - padding.bottom}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.8"
            />
            {/* Active Equity Node */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activePoint.y)}
              r="5"
              fill="#38bdf8"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Active Peak Node */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activePoint.peak)}
              r="3.5"
              fill="#f59e0b"
            />
          </g>
        )}

        {/* X-axis date labels */}
        {data.length > 0 && (
          <>
            <text
              x={padding.left}
              y={viewBoxHeight - 8}
              fill="#64748b"
              fontSize="10"
              textAnchor="start"
            >
              {fmtDate(data[0].x)}
            </text>
            {data.length > 2 && (
              <text
                x={padding.left + plotWidth / 2}
                y={viewBoxHeight - 8}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
              >
                {fmtDate(data[Math.floor(data.length / 2)].x)}
              </text>
            )}
            <text
              x={viewBoxWidth - padding.right}
              y={viewBoxHeight - 8}
              fill="#64748b"
              fontSize="10"
              textAnchor="end"
            >
              {fmtDate(data[data.length - 1].x)}
            </text>
          </>
        )}
      </svg>

      {/* Chart Legend */}
      <div className="flex items-center justify-end gap-5 mt-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#38bdf8] rounded-full inline-block"></span>
          <span>Net Cumulative P&L</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block"></span>
          <span>High Water Mark (Peak)</span>
        </div>
      </div>
    </div>
  );
}
