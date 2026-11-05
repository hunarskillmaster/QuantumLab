import React from 'react';
import { Play, Pause, StepForward, RotateCcw, Maximize2 } from 'lucide-react';
import { PresetDef } from '../types/physics';

interface ViewportControlsProps {
  isPaused: boolean;
  onTogglePlay: () => void;
  onStepFrame: () => void;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  onReset: () => void;
  presets: PresetDef[];
  activePresetId?: string;
  onSelectPreset: (preset: PresetDef) => void;
  onToggleFullscreen: () => void;
}

export const ViewportControls: React.FC<ViewportControlsProps> = ({
  isPaused,
  onTogglePlay,
  onStepFrame,
  timeScale,
  onChangeTimeScale,
  onReset,
  presets,
  onSelectPreset,
  onToggleFullscreen,
}) => {
  const speeds = [0.25, 0.5, 1.0, 1.5, 2.0];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-800 bg-slate-900/70">
      {/* Playback Controls */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onTogglePlay}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
            isPaused
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
          }`}
          title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          <span>{isPaused ? 'Resume' : 'Pause'}</span>
        </button>

        <button
          onClick={onStepFrame}
          disabled={!isPaused}
          className="p-1.5 rounded-md text-slate-400 border border-slate-800 bg-slate-900 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Step Single Frame Forward (when paused)"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onReset}
          className="p-1.5 rounded-md text-slate-400 border border-slate-800 bg-slate-900 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Simulation State"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Time Scale Segmented Buttons */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-500 px-1.5">SPEED:</span>
        {speeds.map((s) => (
          <button
            key={s}
            onClick={() => onChangeTimeScale(s)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer ${
              timeScale === s
                ? 'bg-cyan-950 text-cyan-300 font-semibold border border-cyan-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* Preset Selector Dropdown */}
      <div className="flex items-center gap-2">
        {presets.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">Preset:</span>
            <select
              onChange={(e) => {
                const found = presets.find((p) => p.id === e.target.value);
                if (found) onSelectPreset(found);
              }}
              defaultValue=""
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md px-2.5 py-1.5 font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="" disabled>Select configuration...</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onToggleFullscreen}
          className="p-1.5 rounded-md text-slate-400 border border-slate-800 bg-slate-900 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Canvas Fullscreen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
