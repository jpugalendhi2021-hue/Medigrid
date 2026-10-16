import React, { useState } from 'react';

interface SparklineProps {
  data: { date: string; value: number; label?: string }[];
  color?: string;
  unit?: string;
  width?: number;
  height?: number;
  onPointClick?: (point: { date: string; value: number; label?: string }) => void;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0d9488', // teal-600
  unit = '',
  width = 120,
  height = 36,
  onPointClick,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="text-xs text-slate-400 italic">No data</div>;
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  const padding = 4;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * graphWidth;
    const y = height - padding - ((d.value - minVal) / range) * graphHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div className="relative inline-block group">
      <svg width={width} height={height} className="overflow-visible">
        {/* Sparkline curve */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Point markers */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === idx ? 4.5 : 2.5}
            fill={hoveredIndex === idx ? '#ffffff' : color}
            stroke={color}
            strokeWidth={hoveredIndex === idx ? 2 : 1}
            className="cursor-pointer transition-all duration-150"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => onPointClick && onPointClick(p)}
          />
        ))}
      </svg>

      {/* Inline hover tooltip */}
      {hoveredIndex !== null && points[hoveredIndex] && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
          {points[hoveredIndex].date}: <span className="font-semibold">{points[hoveredIndex].value} {unit}</span>
        </div>
      )}
    </div>
  );
};

interface FullChartProps {
  title: string;
  subtitle?: string;
  data: { date: string; value: number; secondValue?: number; note?: string; doctor?: string }[];
  primaryLabel: string;
  secondaryLabel?: string;
  unit: string;
  primaryColor?: string;
  secondaryColor?: string;
  targetRange?: { min: number; max: number; label: string };
}

export const FullInteractiveChart: React.FC<FullChartProps> = ({
  title,
  subtitle,
  data,
  primaryLabel,
  secondaryLabel,
  unit,
  primaryColor = '#0d9488',
  secondaryColor = '#6366f1',
  targetRange,
}) => {
  const [activePoint, setActivePoint] = useState<number | null>(data.length - 1);

  if (!data || data.length === 0) {
    return <div className="p-8 text-center text-slate-400">No clinical recordings found.</div>;
  }

  const allVals = data.flatMap((d) => [d.value, d.secondValue].filter((v): v is number => typeof v === 'number'));
  if (targetRange) {
    allVals.push(targetRange.min, targetRange.max);
  }
  const minVal = Math.min(...allVals) * 0.9;
  const maxVal = Math.max(...allVals) * 1.1;
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 240;
  const paddingLeft = 45;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const graphW = width - paddingLeft - paddingRight;
  const graphH = height - paddingTop - paddingBottom;

  const pointsPrimary = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * graphW;
    const y = height - paddingBottom - ((d.value - minVal) / range) * graphH;
    return { x, y, ...d };
  });

  const pointsSecondary = secondaryLabel
    ? data.map((d, i) => {
        const x = paddingLeft + (i / Math.max(data.length - 1, 1)) * graphW;
        const val = d.secondValue ?? d.value;
        const y = height - paddingBottom - ((val - minVal) / range) * graphH;
        return { x, y, val };
      })
    : [];

  const pathPrimary = pointsPrimary.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const pathSecondary = pointsSecondary.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:pr-10">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: primaryColor }} />
            <span className="text-slate-700">{primaryLabel}</span>
          </div>
          {secondaryLabel && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: secondaryColor }} />
              <span className="text-slate-700">{secondaryLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Target range indicator if any */}
      {targetRange && (
        <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-block mb-3 border border-emerald-200">
          Target Clinical Range: {targetRange.min} – {targetRange.max} {unit} ({targetRange.label})
        </div>
      )}

      {/* Chart SVG */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]">
          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, idx) => {
            const y = paddingTop + ratio * graphH;
            const val = Math.round(maxVal - ratio * range);
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                  {val}
                </text>
              </g>
            );
          })}

          {/* Primary Curve */}
          <path d={pathPrimary} fill="none" stroke={primaryColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Secondary Curve */}
          {secondaryLabel && (
            <path d={pathSecondary} fill="none" stroke={secondaryColor} strokeWidth="2.5" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Points Primary */}
          {pointsPrimary.map((p, idx) => {
            const isSelected = activePoint === idx;
            return (
              <g key={idx} className="cursor-pointer" onClick={() => setActivePoint(idx)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={isSelected ? '#ffffff' : primaryColor}
                  stroke={primaryColor}
                  strokeWidth={isSelected ? 3 : 1.5}
                />
                <text
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10px] ${isSelected ? 'fill-slate-900 font-semibold' : 'fill-slate-400'} font-sans`}
                >
                  {p.date.split('-').slice(1).join('/')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Active Point Annotation Callout (Turns chart into a story) */}
      {activePoint !== null && data[activePoint] && (
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">
                {data[activePoint].date}
              </span>
              <span className="text-xs bg-teal-100 text-teal-800 font-mono px-2 py-0.5 rounded">
                {data[activePoint].value} {secondaryLabel && data[activePoint].secondValue ? `/ ${data[activePoint].secondValue}` : ''} {unit}
              </span>
              {data[activePoint].doctor && (
                <span className="text-xs text-slate-500 font-medium">Recorded by {data[activePoint].doctor}</span>
              )}
            </div>
            {data[activePoint].note ? (
              <p className="text-xs text-slate-600 mt-1 italic">
                "{data[activePoint].note}"
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">Recorded during clinical evaluation visit.</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Clinical Read</span>
          </div>
        </div>
      )}
    </div>
  );
};
