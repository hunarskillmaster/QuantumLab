import React, { useRef, useEffect } from 'react';
import { TelemetryDataPoint, TelemetryKey } from '../types/physics';

interface OscilloscopeGraphProps {
  data: TelemetryDataPoint[];
  keys: TelemetryKey[];
  height?: number;
}

export const OscilloscopeGraph: React.FC<OscilloscopeGraphProps> = ({
  data,
  keys,
  height = 140,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 300;
    const canvasHeight = height;

    if (canvas.width !== width * dpr || canvas.height !== canvasHeight * dpr) {
      canvas.width = width * dpr;
      canvas.height = canvasHeight * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background: deep dark laboratory grid
    ctx.fillStyle = '#050a14';
    ctx.fillRect(0, 0, width, canvasHeight);

    // Grid lines
    ctx.strokeStyle = '#111e38';
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 4;
    for (let i = 1; i < cols; i++) {
      const x = (width / cols) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = (canvasHeight / rows) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (data.length < 2) {
      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting real-time telemetry...', width / 2, canvasHeight / 2);
      ctx.restore();
      return;
    }

    // Determine min/max across all active keys
    const activeKeys = keys.slice(0, 3);
    const padding = { top: 14, bottom: 18, left: 8, right: 8 };
    const plotW = width - padding.left - padding.right;
    const plotH = canvasHeight - padding.top - padding.bottom;

    activeKeys.forEach((k) => {
      let minVal = Infinity;
      let maxVal = -Infinity;
      data.forEach((d) => {
        const v = d[k.key];
        if (typeof v === 'number' && !isNaN(v)) {
          if (v < minVal) minVal = v;
          if (v > maxVal) maxVal = v;
        }
      });

      if (minVal === Infinity || maxVal === -Infinity) return;
      if (Math.abs(maxVal - minVal) < 1e-4) {
        maxVal += 1;
        minVal -= 1;
      } else {
        const margin = (maxVal - minVal) * 0.12;
        maxVal += margin;
        minVal -= margin;
      }

      // Draw line
      ctx.strokeStyle = k.color;
      ctx.lineWidth = 1.75;
      ctx.shadowColor = k.color;
      ctx.shadowBlur = 4;
      ctx.beginPath();

      const n = data.length;
      for (let i = 0; i < n; i++) {
        const val = data[i][k.key];
        const x = padding.left + (i / (n - 1)) * plotW;
        const normY = (val - minVal) / (maxVal - minVal);
        const y = padding.top + plotH * (1 - normY);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw current value dot at the latest point
      const lastVal = data[data.length - 1][k.key];
      const normYLast = (lastVal - minVal) / (maxVal - minVal);
      const dotX = padding.left + plotW;
      const dotY = padding.top + plotH * (1 - normYLast);

      ctx.fillStyle = k.color;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Time baseline axis annotation
    ctx.fillStyle = '#64748b';
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HISTORICAL', padding.left + 2, canvasHeight - 5);
    ctx.textAlign = 'right';
    ctx.fillText('LIVE (NOW)', width - padding.right - 2, canvasHeight - 5);

    ctx.restore();
  }, [data, keys, height]);

  return (
    <div className="w-full relative rounded-lg border border-slate-800 bg-slate-950/80 p-2 overflow-hidden shadow-inner">
      <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
        <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
          Real-Time Oscilloscope
        </span>
        <div className="flex items-center gap-3">
          {keys.slice(0, 3).map((k) => {
            const currentVal = data.length > 0 ? data[data.length - 1][k.key] : undefined;
            const displayVal =
              typeof currentVal === 'number'
                ? k.format
                  ? k.format(currentVal)
                  : currentVal.toFixed(2)
                : '--';
            return (
              <div key={k.key} className="flex items-center gap-1.5 text-[10px] font-mono">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: k.color, boxShadow: `0 0 6px ${k.color}` }}
                />
                <span className="text-slate-400">{k.label}:</span>
                <span className="text-slate-200 font-semibold tabular-nums">
                  {displayVal} {k.unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: `${height}px` }}
        className="block rounded"
      />
    </div>
  );
};
