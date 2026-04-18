interface ProgressBarProps {
  value: number;       // 0-100
  color?: string;
  height?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export default function ProgressBar({
  value, color = '#8B5CF6', height = 4, label, showValue = false, className = '',
}: ProgressBarProps) {
  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-zinc-500">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-zinc-300">{value}%</span>}
        </div>
      )}
      <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
