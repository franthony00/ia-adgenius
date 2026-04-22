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

  // Padding to prevent lines/dots from being clipped at the edges
  const padX = 5;
  const padY = 5;
  const innerW = w - padX * 2;
  const innerH = h - padY * 2;

  if (type === 'bar') {
    const gap = 2;
    const barW = (innerW - gap * (data.length - 1)) / data.length;
    return (
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'hidden' }}>
        {data.map((v, i) => {
          const barH = ((v - min) / range) * innerH + padY;
          const x = padX + i * (barW + gap);
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

  // Line chart — map data into the padded coordinate space
  const mapX = (i: number) => padX + (i / (data.length - 1)) * innerW;
  const mapY = (v: number) => padY + innerH - ((v - min) / range) * innerH;

  const points = data.map((v, i) => `${mapX(i)},${mapY(v)}`).join(' ');

  const areaPoints = [
    `${mapX(0)},${h - padY}`,
    ...data.map((v, i) => `${mapX(i)},${mapY(v)}`),
    `${mapX(data.length - 1)},${h - padY}`,
  ].join(' ');

  const lastX = mapX(data.length - 1);
  const lastY = mapY(data[data.length - 1]);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'hidden' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.length > 0 && (
        <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
      )}
    </svg>
  );
}
