import React, { useState } from 'react';
import { EquityPoint } from '../../types.ts';
import { fmtMoney, fmtDate } from '../../lib/format.ts';

interface DrawdownChartProps {
  data: EquityPoint[];
  height?: number;
}

export default function DrawdownChart({ data, height = 180 }: DrawdownChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const dds = data.map((d) => d.drawdownPct);
  const maxDD = Math.max(...dds, 5); // At least 5% range

  const padding = { top: 15, right: 24, bottom: 25, left: 48 };
  const viewBoxWidth = 800;
  const viewBoxHeight = height;
  const plotWidth = viewBoxWidth - padding.left - padding.right;
  const plotHeight = viewBoxHeight - padding.top - padding.bottom;

  const getX = (idx: number) => {
    if (data.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (idx / (data.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padding.top + (val / maxDD) * plotHeight;
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.drawdownPct)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top} ${points} ${getX(data.length - 1)},${padding.top}`;

  const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="relative w-full select-none">
      <div className="flex items-center justify-between text-xs mb-1.5 px-1">
        <span className="text-slate-400">Underwater Drawdown Depth</span>
        <div className="flex items-center gap-3">
          <span className="text-slate-400">Max DD:</span>
          <span className="font-mono text-rose-400 font-semibold">
            -{maxDD.toFixed(1)}%
          </span>
          {activePoint && (
            <span className="text-slate-300 font-mono text-[11px]">
              Current: -{activePoint.drawdownPct.toFixed(1)}% ({fmtMoney(activePoint.drawdown)})
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible cursor-crosshair"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clientX = e.clientX - rect.left;
          const ratio = Math.max(
            0,
            Math.min(
              1,
              (clientX - (padding.left / viewBoxWidth) * rect.width) /
                ((plotWidth / viewBoxWidth) * rect.width)
            )
          );
          const idx = Math.round(ratio * (data.length - 1));
          if (idx >= 0 && idx < data.length) setHoverIndex(idx);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="ddAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Horizontal grid ticks */}
        {[0, maxDD * 0.5, maxDD].map((val, i) => {
          const y = getY(val);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={viewBoxWidth - padding.right}
                y2={y}
                stroke="#334155"
                strokeOpacity={0.3}
                strokeDasharray="2 2"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
                fontFamily="monospace"
              >
                -{val.toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <polygon fill="url(#ddAreaGrad)" points={areaPoints} />

        {/* Drawdown line */}
        <polyline
          fill="none"
          stroke="#f43f5e"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Scrubber */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={viewBoxHeight - padding.bottom}
              stroke="#f43f5e"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity={0.7}
            />
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activePoint.drawdownPct)}
              r="4"
              fill="#f43f5e"
              stroke="#0f172a"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
