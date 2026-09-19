import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value?: number;
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  maxStars?: number;
}

const RATING_DESCRIPTIONS: Record<number, { label: string; desc: string; color: string; badgeBg: string }> = {
  1: {
    label: '1 Star - Poor',
    desc: 'Impulse entry, chased market or broke risk rules',
    color: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
  2: {
    label: '2 Stars - Flawed',
    desc: 'Deviated from trading plan or forced setup',
    color: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  3: {
    label: '3 Stars - Standard',
    desc: 'Valid setup meeting baseline criteria',
    color: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  },
  4: {
    label: '4 Stars - High Quality',
    desc: 'Strict rule adherence with multi-timeframe confluence',
    color: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  5: {
    label: '5 Stars - Textbook A+',
    desc: 'Flawless institutional execution and edge delivery',
    color: 'text-amber-300',
    badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40 shadow-sm shadow-amber-500/20',
  },
};

export default function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = true,
  maxStars = 5,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const activeValue = hoverValue !== null ? hoverValue : value;
  const currentMeta = RATING_DESCRIPTIONS[activeValue] || null;

  const starSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (starNum: number) => {
    if (readOnly || !onChange) return;
    // If clicking the same rating, allow toggling off to 0
    if (value === starNum) {
      onChange(0);
    } else {
      onChange(starNum);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 select-none">
        {Array.from({ length: maxStars }, (_, i) => {
          const starNum = i + 1;
          const isFilled = starNum <= activeValue;
          const isHovered = hoverValue !== null && starNum <= hoverValue;

          return (
            <button
              key={starNum}
              type="button"
              disabled={readOnly}
              onClick={() => handleStarClick(starNum)}
              onMouseEnter={() => !readOnly && setHoverValue(starNum)}
              onMouseLeave={() => !readOnly && setHoverValue(null)}
              aria-label={`Rate ${starNum} star${starNum > 1 ? 's' : ''}`}
              className={`transition-transform p-0.5 rounded-sm focus:outline-hidden ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-120 active:scale-95 focus-visible:ring-1 focus-visible:ring-amber-400'
              }`}
            >
              <Star
                className={`${starSizes[size]} transition-colors duration-150 ${
                  isFilled
                    ? activeValue === 5
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                      : isFilled && activeValue >= 4
                      ? 'fill-emerald-400 text-emerald-400'
                      : 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-slate-700 hover:text-slate-500'
                }`}
              />
            </button>
          );
        })}

        {/* Numeric rating pill */}
        {value > 0 && (
          <span className="ml-1.5 font-mono text-xs font-bold text-slate-300">
            {value}/{maxStars}
          </span>
        )}

        {!readOnly && value > 0 && onChange && (
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-[10px] text-slate-500 hover:text-slate-300 underline ml-1 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {showLabel && currentMeta && (
        <div className="flex items-center gap-2 mt-0.5 animate-fadeIn">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${currentMeta.badgeBg}`}
          >
            {currentMeta.label}
          </span>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {currentMeta.desc}
          </span>
        </div>
      )}
    </div>
  );
}
