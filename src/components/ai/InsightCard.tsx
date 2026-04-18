import { CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Pattern } from '@/lib/types';

interface InsightCardProps {
  type: 'strength' | 'weakness' | 'pattern' | 'recommendation';
  content: string | Pattern;
  index?: number;
}

export default function InsightCard({ type, content, index = 0 }: InsightCardProps) {
  if (typeof content === 'string') {
    const isStrength = type === 'strength';
    const isRec = type === 'recommendation';

    return (
      <div
        className="flex gap-3 p-3.5 rounded-xl fade-in-up"
        style={{
          background: isStrength ? 'rgba(52,211,153,0.05)' : isRec ? 'rgba(99,102,241,0.06)' : 'rgba(248,113,113,0.05)',
          border: isStrength ? '1px solid rgba(52,211,153,0.12)' : isRec ? '1px solid rgba(99,102,241,0.15)' : '1px solid rgba(248,113,113,0.12)',
          animationDelay: `${index * 60}ms`,
        }}>
        <div className="mt-0.5 shrink-0">
          {isStrength
            ? <CheckCircle2 size={14} className="text-emerald-400" />
            : isRec
            ? <TrendingUp size={14} className="text-indigo-400" />
            : <AlertTriangle size={14} className="text-rose-400" />}
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed">{content}</p>
      </div>
    );
  }

  // Pattern
  const pat = content as Pattern;
  const positive = pat.impact === 'positive';
  const negative = pat.impact === 'negative';

  return (
    <div
      className="p-4 rounded-xl fade-in-up"
      style={{
        background: positive ? 'rgba(52,211,153,0.04)' : negative ? 'rgba(248,113,113,0.04)' : 'rgba(255,255,255,0.03)',
        border: positive ? '1px solid rgba(52,211,153,0.12)' : negative ? '1px solid rgba(248,113,113,0.12)' : '1px solid rgba(255,255,255,0.06)',
        animationDelay: `${index * 60}ms`,
      }}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {positive
            ? <TrendingUp size={13} className="text-emerald-400" />
            : negative
            ? <TrendingDown size={13} className="text-rose-400" />
            : <Minus size={13} className="text-zinc-500" />}
          <span className="text-sm font-semibold text-white">{pat.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">{pat.frequency} ads</span>
          <div className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
            style={{
              background: `rgba(${positive ? '52,211,153' : negative ? '248,113,113' : '161,161,170'},0.1)`,
              color: positive ? '#34D399' : negative ? '#F87171' : '#A1A1AA',
            }}>
            {pat.confidence}% conf.
          </div>
        </div>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{pat.description}</p>
    </div>
  );
}
