import React from 'react';
import { ExperimentDef, TelemetryDataPoint } from '../types/physics';
import { OscilloscopeGraph } from './OscilloscopeGraph';
import { MathFormula } from './MathFormula';
import { Activity, BookOpen, Download } from 'lucide-react';

interface TelemetryFormulaPanelProps {
  experiment: ExperimentDef;
  telemetryHistory: TelemetryDataPoint[];
  currentTelemetry: Record<string, number>;
  onExportCSV: () => void;
}

export const TelemetryFormulaPanel: React.FC<TelemetryFormulaPanelProps> = ({
  experiment,
  telemetryHistory,
  currentTelemetry,
  onExportCSV,
}) => {
  return (
    <div className="p-4 space-y-5 bg-slate-950/80">
      {/* 1. Live Telemetry Metric Cards */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200 tracking-tight uppercase">
              Live Numerical Telemetry
            </span>
          </div>
          <button
            onClick={onExportCSV}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Download CSV Data</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {experiment.telemetryKeys.map((k) => {
            const rawVal = currentTelemetry[k.key];
            const displayVal =
              typeof rawVal === 'number'
                ? k.format
                  ? k.format(rawVal)
                  : rawVal.toFixed(2)
                : '--';

            return (
              <div
                key={k.key}
                className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: k.color }}
                  />
                  <span className="text-[11px] text-slate-400 font-medium truncate">
                    {k.label}
                  </span>
                </div>
                <div className="text-sm font-mono font-bold text-slate-100 tabular-nums">
                  {displayVal}{' '}
                  {k.unit && (
                    <span className="text-[10px] font-normal text-slate-400">{k.unit}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Real-Time Oscilloscope Graph */}
      <OscilloscopeGraph
        data={telemetryHistory}
        keys={experiment.telemetryKeys}
        height={130}
      />

      {/* 3. Analytical LaTeX Physics Formulas */}
      <div className="space-y-2.5 pt-1 border-t border-slate-800/70">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-tight uppercase">
            Governing Analytical Physics Equations
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {experiment.formulas.map((f, i) => (
            <div
              key={i}
              className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 space-y-1.5"
            >
              <div className="text-[11px] font-semibold text-slate-300 font-mono">
                {f.label}
              </div>
              <div className="bg-slate-950/70 p-2 rounded border border-slate-900 text-cyan-200">
                <MathFormula latex={f.latex} />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Experiment Context Summary */}
      <div className="bg-slate-900/20 p-3 rounded-lg border border-slate-800/50 text-xs text-slate-400 space-y-1">
        <span className="font-semibold text-slate-300">Theoretical Abstract: </span>
        <span>{experiment.description}</span>
      </div>
    </div>
  );
};
