import React from 'react';
import { ParameterDef } from '../types/physics';
import { Sliders, RotateCcw } from 'lucide-react';

interface ParameterPanelProps {
  parameters: ParameterDef[];
  values: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  onResetDefaults: () => void;
}

export const ParameterPanel: React.FC<ParameterPanelProps> = ({
  parameters,
  values,
  onChange,
  onResetDefaults,
}) => {
  if (parameters.length === 0) return null;

  return (
    <div className="p-4 border-b border-slate-800 bg-slate-950/60">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 tracking-tight uppercase">
            Physics Parameters
          </span>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
          title="Reset to default experiment parameters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {parameters.map((param) => {
          const currentVal = values[param.id] !== undefined ? values[param.id] : param.defaultValue;

          return (
            <div key={param.id} className="space-y-1.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="flex items-baseline justify-between gap-2">
                <label className="text-xs text-slate-300 font-medium truncate" title={param.label}>
                  {param.label}
                </label>
                <span className="text-xs font-mono font-semibold text-cyan-300 tabular-nums shrink-0">
                  {currentVal.toFixed(param.step < 0.1 ? 2 : param.step < 1 ? 1 : 0)}{' '}
                  {param.unit && <span className="text-slate-500 font-normal">{param.unit}</span>}
                </span>
              </div>

              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={currentVal}
                onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
                className="w-full"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>{param.min} {param.unit}</span>
                <span>{param.max} {param.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
