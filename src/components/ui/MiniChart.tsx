'use client';

interface MiniChartProps {
  data: number[];
  color?: string;
  height?: number;
  type?: 'line' | 'bar';
}

export default function MiniChart({ data, color = '#8B5CF6', height = 40, type = 'line' }: MiniChartProps) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = height;
  const pad = 2;

  if (type === 'bar') {
    const barW = (w - pad * (data.length - 1)) / data.length;
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        {data.map((v, i) => {
          const barH = ((v - min) / range) * (h - 4) + 4;
          const x = i * (barW + pad);
          const isLast = i === data.length - 1;
          return (
            <rect key={i} x={x} y={h - barH} width={barW} height={barH}
              rx={2}
              fill={isLast ? color : `${color}55`} />
          );
        })}
      </svg>
    );
  }

  // Line chart
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = [
    `0,${h}`,
    ...data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    }),
    `${w},${h}`,
  ].join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const lastX = w;
        const lastY = h - ((data[data.length-1] - min) / range) * (h - 4) - 2;
        return <circle cx={lastX} cy={lastY} r="2.5" fill={color} />;
      })()}
    </svg>
  );
}
