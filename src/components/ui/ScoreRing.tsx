'use client';

import { getScoreColor, getScoreGradient } from '@/lib/utils';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export default function ScoreRing({ score, size = 80, strokeWidth = 7, label, className }: ScoreRingProps) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? '#34D399' : score >= 70 ? '#FBBF24' : '#F87171';

  return (
    <div className={`flex flex-col items-center gap-1 ${className ?? ''}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke="rgba(255,255,255,0.05)"
            strokeWidth={strokeWidth} />
          {/* Score arc */}
          <circle cx={size/2} cy={size/2} r={r}
            fill="none" stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }}
          />
        </svg>
        {/* Center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}</span>
        </div>
      </div>
      {label && <span className="text-xs text-zinc-500 font-medium">{label}</span>}
    </div>
  );
}
