import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingDown, Scale } from 'lucide-react';

interface WeightChartProps {
  weights?: number[];
  labels?: string[];
}

export const WeightChart: React.FC<WeightChartProps> = ({
  weights = [75.8, 75.4, 75.6, 75.1, 75.3, 74.9, 75.4],
  labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // SVG dimensions
  const width = 500;
  const height = 180;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 30;

  // Find min/max for dynamic scaling
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const range = maxW - minW;

  // Calculate coordinates
  const points = weights.map((w, idx) => {
    const x = paddingLeft + (idx * (width - paddingLeft - paddingRight)) / (weights.length - 1);
    const y = height - paddingBottom - ((w - minW) * (height - paddingTop - paddingBottom)) / range;
    return { x, y, weight: w, label: labels[idx] };
  });

  // Build SVG Path string using Bezier Curves
  let pathD = '';
  let areaD = '';

  if (points.length > 0) {
    // Start line path
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Close area path
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
  }

  // Calculate overall weight difference
  const startWeight = weights[0];
  const endWeight = weights[weights.length - 1];
  const diff = parseFloat((endWeight - startWeight).toFixed(1));
  const isLoss = diff <= 0;

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01] hover:border-accent/35 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] transition-all duration-300 space-y-4 text-left select-none">
      
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="h-4.5 w-4.5 text-accent" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Body Weight Progress</span>
        </div>
        
        {/* Trend Indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-wider ${
          isLoss 
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15' 
            : 'text-rose-400 bg-rose-500/10 border-rose-500/15'
        }`}>
          <TrendingDown className="h-3.5 w-3.5" />
          <span>{isLoss ? `${Math.abs(diff)} kg down` : `+${diff} kg up`}</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative bg-surface-hover/5 rounded-2xl p-2 border border-border/5">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-accent overflow-visible">
          
          {/* Gradients definitions */}
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="rgba(255,255,255,0.03)" />
          <line x1={paddingLeft} y1={(height - paddingBottom - paddingTop) / 2 + paddingTop} x2={width - paddingRight} y2={(height - paddingBottom - paddingTop) / 2 + paddingTop} stroke="rgba(255,255,255,0.03)" />
          <line x1={paddingLeft} y1={height - paddingBottom} x2={width - paddingRight} y2={height - paddingBottom} stroke="rgba(255,255,255,0.03)" />

          {/* Fill Area */}
          {areaD && (
            <path d={areaD} fill="url(#weightAreaGrad)" />
          )}

          {/* Line Path */}
          {pathD && (
            <motion.path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          )}

          {/* Interactive points */}
          {points.map((p, idx) => (
            <g key={idx} className="cursor-pointer">
              {/* Invisible interactive hover zone */}
              <circle
                cx={p.x}
                cy={p.y}
                r="18"
                fill="transparent"
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
              />

              {/* Outer stroke ring */}
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                className={`transition-all duration-300 ${
                  activeIdx === idx ? 'fill-white stroke-accent' : 'fill-[#0c0f17] stroke-accent'
                }`}
                strokeWidth="2.5"
              />
            </g>
          ))}

          {/* X Axis Labels */}
          {points.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - 10}
              className="text-[9px] font-black text-text-secondary/40 fill-current"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}

          {/* Y Axis min/max Labels */}
          <text x={10} y={paddingTop + 4} className="text-[9px] font-black text-text-secondary/30 fill-current">{maxW.toFixed(1)}</text>
          <text x={10} y={height - paddingBottom + 4} className="text-[9px] font-black text-text-secondary/30 fill-current">{minW.toFixed(1)}</text>

        </svg>

        {/* Hover weight tooltip overlay */}
        {activeIdx !== null && (
          <div 
            className="absolute bg-surface border border-border/20 px-3 py-1.5 rounded-xl shadow-xl pointer-events-none flex flex-col items-center gap-0.5 animate-scale-in text-[10px] font-bold text-white"
            style={{
              left: `${(points[activeIdx].x / width) * 100}%`,
              top: `${(points[activeIdx].y / height) * 100 - 32}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="text-[8px] uppercase tracking-wider text-text-secondary/50 font-black">
              {points[activeIdx].label}
            </span>
            <span>
              {points[activeIdx].weight} kg
            </span>
          </div>
        )}
      </div>

    </div>
  );
};
