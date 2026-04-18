import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon?: React.ReactNode;
  accent?: 'emerald' | 'cyan' | 'amber' | 'rose' | 'blue' | 'violet';
  className?: string;
  delay?: number;
}

const ACCENTS = {
  emerald: { glow: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.22)',  icon: 'text-emerald-400', iconBg: 'rgba(16,185,129,0.1)'  },
  cyan:    { glow: 'rgba(34,211,238,0.1)',   border: 'rgba(34,211,238,0.2)',   icon: 'text-cyan-400',    iconBg: 'rgba(34,211,238,0.1)'  },
  amber:   { glow: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)',   icon: 'text-amber-400',   iconBg: 'rgba(251,191,36,0.1)'  },
  rose:    { glow: 'rgba(244,63,94,0.1)',    border: 'rgba(244,63,94,0.2)',    icon: 'text-rose-400',    iconBg: 'rgba(244,63,94,0.1)'   },
  blue:    { glow: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.2)',   icon: 'text-indigo-400',  iconBg: 'rgba(99,102,241,0.1)'  },
  violet:  { glow: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.2)',   icon: 'text-violet-400',  iconBg: 'rgba(139,92,246,0.1)'  },
};

export default function MetricCard({
  label, value, subValue, trend, icon, accent = 'emerald', className, delay = 0,
}: MetricCardProps) {
  const a = ACCENTS[accent];
  const trendUp   = trend !== undefined && trend > 0;
  const trendDown = trend !== undefined && trend < 0;

  return (
    <div
      className={cn('relative rounded-2xl p-5 fade-in-up transition-all duration-200 hover:scale-[1.01]', className)}
      style={{
        background: '#111827',
        border: `1px solid ${a.border}`,
        boxShadow: `0 0 28px ${a.glow}`,
        animationDelay: `${delay}ms`,
      }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: '#9CA3AF' }}
        >
          {label}
        </span>
        {icon && (
          <div
            className={cn('w-8 h-8 rounded-xl flex items-center justify-center', a.icon)}
            style={{ background: a.iconBg }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <span className="text-3xl font-bold text-white tabular-nums">{value}</span>
        {subValue && (
          <span className="ml-2 text-xs" style={{ color: '#6B7280' }}>{subValue}</span>
        )}
      </div>

      {/* Trend */}
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trendUp
            ? <TrendingUp size={13} className="text-emerald-400" />
            : trendDown
            ? <TrendingDown size={13} className="text-red-400" />
            : <Minus size={13} className="text-zinc-500" />}
          <span className={cn(
            'text-xs font-semibold',
            trendUp ? 'text-emerald-400' : trendDown ? 'text-red-400' : 'text-zinc-500',
          )}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>vs last week</span>
        </div>
      )}
    </div>
  );
}
