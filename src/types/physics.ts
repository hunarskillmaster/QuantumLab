/**
 * QuantumLab - Physics & Engineering Sandbox Types
 */

export type PhysicsCategory =
  | 'mechanics'
  | 'waves'
  | 'electromagnetism'
  | 'thermodynamics'
  | 'quantum';

export interface CategoryInfo {
  id: PhysicsCategory;
  name: string;
  tagline: string;
  iconName: string;
}

export interface ParameterDef {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description?: string;
}

export interface PresetDef {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, number>;
}

export interface LatexFormula {
  label: string;
  latex: string;
  description: string;
}

export interface TelemetryKey {
  key: string;
  label: string;
  unit: string;
  color: string;
  format?: (value: number) => string;
}

export interface TelemetryDataPoint {
  time: number;
  [key: string]: number;
}

export interface ExperimentDef {
  id: string;
  category: PhysicsCategory;
  name: string;
  subtitle: string;
  description: string;
  parameters: ParameterDef[];
  presets: PresetDef[];
  formulas: LatexFormula[];
  telemetryKeys: TelemetryKey[];
  instructions?: string;
}

export interface SimulationContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  dpr: number;
  time: number;
  dt: number;
  parameters: Record<string, number>;
  interactiveState: {
    mouseX: number;
    mouseY: number;
    isMouseDown: boolean;
    dragTarget: string | null;
  };
  audioEnabled: boolean;
}

export interface SimulationEngine<TState = unknown> {
  init: (parameters: Record<string, number>, width: number, height: number) => TState;
  update: (
    state: TState,
    dt: number,
    parameters: Record<string, number>,
    ctxHelper: { width: number; height: number; audioEnabled: boolean; playSound?: (type: string, param?: number) => void }
  ) => { state: TState; telemetry: Record<string, number> };
  render: (
    ctx: CanvasRenderingContext2D,
    state: TState,
    simCtx: SimulationContext
  ) => void;
  onPointerDown?: (x: number, y: number, state: TState, width: number, height: number) => void;
  onPointerMove?: (x: number, y: number, state: TState, width: number, height: number) => void;
  onPointerUp?: (x: number, y: number, state: TState) => void;
}
