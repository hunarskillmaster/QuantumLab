import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ViewportControls } from './components/ViewportControls';
import { ParameterPanel } from './components/ParameterPanel';
import { TelemetryFormulaPanel } from './components/TelemetryFormulaPanel';
import { EXPERIMENTS, SIMULATION_ENGINES } from './data/experiments';
import { ExperimentDef, PhysicsCategory, PresetDef, TelemetryDataPoint } from './types/physics';
import { physicsAudio } from './utils/audio';
import { exportTelemetryToCSV } from './utils/csv';

export default function App() {
  const [activeCategory, setActiveCategory] = useState<PhysicsCategory>('mechanics');
  const [activeExperimentId, setActiveExperimentId] = useState<string>('projectile');
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryDataPoint[]>([]);
  const [currentTelemetry, setCurrentTelemetry] = useState<Record<string, number>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const simStateRef = useRef<unknown>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const simTimeRef = useRef<number>(0);
  const telemetryHistoryRef = useRef<TelemetryDataPoint[]>([]);
  const interactiveStateRef = useRef({
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    dragTarget: null as string | null,
  });

  // Current active experiment definition
  const currentExperiment: ExperimentDef =
    EXPERIMENTS.find((e) => e.id === activeExperimentId) || EXPERIMENTS[0];

  // Initialize parameters when active experiment changes
  const initExperimentParams = useCallback((exp: ExperimentDef) => {
    const initialParams: Record<string, number> = {};
    exp.parameters.forEach((p) => {
      initialParams[p.id] = p.defaultValue;
    });
    setParameters(initialParams);
    return initialParams;
  }, []);

  // Reset or switch experiment
  const setupSimulation = useCallback(
    (expId: string, customParams?: Record<string, number>) => {
      const exp = EXPERIMENTS.find((e) => e.id === expId) || EXPERIMENTS[0];
      const paramsToUse = customParams || initExperimentParams(exp);
      const canvas = canvasRef.current;
      const width = canvas?.clientWidth || 800;
      const height = canvas?.clientHeight || 450;

      const engine = SIMULATION_ENGINES[exp.id];
      if (engine) {
        simStateRef.current = engine.init(paramsToUse, width, height);
      }
      simTimeRef.current = 0;
      telemetryHistoryRef.current = [];
      setTelemetryHistory([]);
      setCurrentTelemetry({});
      physicsAudio.stopDopplerTone();
    },
    [initExperimentParams]
  );

  // Switch experiment handler
  const handleSelectExperiment = (id: string) => {
    setActiveExperimentId(id);
    const exp = EXPERIMENTS.find((e) => e.id === id);
    if (exp) {
      setActiveCategory(exp.category);
      setupSimulation(id);
    }
  };

  // Preset selection handler
  const handleSelectPreset = (preset: PresetDef) => {
    setParameters(preset.parameters);
    setupSimulation(activeExperimentId, preset.parameters);
  };

  // Reset defaults handler
  const handleResetDefaults = () => {
    const defaultParams = initExperimentParams(currentExperiment);
    setupSimulation(activeExperimentId, defaultParams);
  };

  // Single Frame Step handler
  const handleStepFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = SIMULATION_ENGINES[currentExperiment.id];
    if (!engine || !simStateRef.current) return;

    const dt = 1 / 60;
    simTimeRef.current += dt;

    const { state: nextState, telemetry } = engine.update(
      simStateRef.current,
      dt,
      parameters,
      {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        audioEnabled,
        playSound: (type, param) => {
          if (type === 'click') physicsAudio.playClick(param);
        },
      }
    );
    simStateRef.current = nextState;
    setCurrentTelemetry(telemetry);

    // Render single frame
    renderSimulation(ctx, canvas.clientWidth, canvas.clientHeight, dt);
  };

  // Render routine
  const renderSimulation = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) => {
      const engine = SIMULATION_ENGINES[currentExperiment.id];
      if (!engine || !simStateRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.scale(dpr, dpr);

      // Deep dark laboratory canvas background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);

      // Subtle laboratory background coordinate grid
      ctx.strokeStyle = '#091328';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Simulation engine custom render
      engine.render(ctx, simStateRef.current, {
        ctx,
        width,
        height,
        dpr,
        time: simTimeRef.current,
        dt,
        parameters,
        interactiveState: interactiveStateRef.current,
        audioEnabled,
      });

      ctx.restore();
    },
    [currentExperiment.id, parameters, audioEnabled]
  );

  // Main 60fps Animation Loop with robust cleanup
  useEffect(() => {
    // Setup on mount or experiment change
    setupSimulation(activeExperimentId, parameters);

    let isSubscribed = true;
    lastTimeRef.current = performance.now();

    const loop = (currentTime: number) => {
      if (!isSubscribed) return;

      const deltaMs = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Cap delta time to prevent explosion during tab switch
      const rawDt = Math.min(0.1, deltaMs / 1000);
      const effectiveDt = isPaused ? 0 : rawDt * timeScale;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || 800;
        const height = rect.height || 450;
        const dpr = window.devicePixelRatio || 1;

        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
        }

        if (ctx && simStateRef.current) {
          const engine = SIMULATION_ENGINES[currentExperiment.id];
          if (engine) {
            if (!isPaused && effectiveDt > 0) {
              simTimeRef.current += effectiveDt;
              const { state: nextState, telemetry } = engine.update(
                simStateRef.current,
                effectiveDt,
                parameters,
                {
                  width,
                  height,
                  audioEnabled,
                  playSound: (type, param) => {
                    if (type === 'click') physicsAudio.playClick(param);
                  },
                }
              );
              simStateRef.current = nextState;
              setCurrentTelemetry(telemetry);

              // Update telemetry history buffer (at ~10Hz rate)
              const curT = simTimeRef.current;
              const hist = telemetryHistoryRef.current;
              if (hist.length === 0 || curT - hist[hist.length - 1].time >= 0.08) {
                const newPoint: TelemetryDataPoint = { time: curT, ...telemetry };
                hist.push(newPoint);
                if (hist.length > 250) hist.shift();
                setTelemetryHistory([...hist]);
              }
            }

            renderSimulation(ctx, width, height, effectiveDt);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      isSubscribed = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      physicsAudio.stopDopplerTone();
    };
  }, [activeExperimentId, isPaused, timeScale, parameters, audioEnabled, renderSimulation, setupSimulation]);

  // Pointer event handlers for interactive canvas manipulation
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    interactiveStateRef.current.isMouseDown = true;
    interactiveStateRef.current.mouseX = x;
    interactiveStateRef.current.mouseY = y;

    const canvas = canvasRef.current;
    if (!canvas || !simStateRef.current) return;
    const engine = SIMULATION_ENGINES[currentExperiment.id];
    if (engine?.onPointerDown) {
      engine.onPointerDown(x, y, simStateRef.current, canvas.clientWidth, canvas.clientHeight);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    interactiveStateRef.current.mouseX = x;
    interactiveStateRef.current.mouseY = y;

    const canvas = canvasRef.current;
    if (!canvas || !simStateRef.current) return;
    const engine = SIMULATION_ENGINES[currentExperiment.id];
    if (engine?.onPointerMove) {
      engine.onPointerMove(x, y, simStateRef.current, canvas.clientWidth, canvas.clientHeight);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    interactiveStateRef.current.isMouseDown = false;
    interactiveStateRef.current.dragTarget = null;

    if (!simStateRef.current) return;
    const engine = SIMULATION_ENGINES[currentExperiment.id];
    if (engine?.onPointerUp) {
      engine.onPointerUp(x, y, simStateRef.current);
    }
  };

  // Fullscreen toggle
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    physicsAudio.setMuted(!nextVal);
    if (nextVal) {
      physicsAudio.init();
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    exportTelemetryToCSV(
      currentExperiment.name,
      currentExperiment.telemetryKeys,
      telemetryHistoryRef.current
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* 1. Universal Top Navigation Bar */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setActiveCategory(cat);
          const firstInCat = EXPERIMENTS.find((e) => e.category === cat);
          if (firstInCat) handleSelectExperiment(firstInCat.id);
        }}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onExportCSV={handleExportCSV}
        experimentName={currentExperiment.name}
      />

      {/* Main Sandbox Stage Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2. Categorized Sidebar with 20 Experiments */}
        <Sidebar
          experiments={EXPERIMENTS}
          activeExperimentId={activeExperimentId}
          onSelectExperiment={handleSelectExperiment}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        {/* 3. Central Interactive Viewport & Analysis Stage */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Active Experiment Banner */}
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                <span>Lab {EXPERIMENTS.findIndex((e) => e.id === currentExperiment.id) + 1} of 20</span>
                <span>·</span>
                <span className="text-slate-400 capitalize">{currentExperiment.category}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
                {currentExperiment.name}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentExperiment.subtitle}
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
              PHYSICS ENGINE: RK4 / SYMPLECTIC (60 FPS)
            </div>
          </div>

          {/* Canvas Interactive Viewport Container */}
          <div ref={containerRef} className="relative bg-slate-950 flex flex-col">
            {/* Viewport Playback & Speed Controls */}
            <ViewportControls
              isPaused={isPaused}
              onTogglePlay={() => setIsPaused((prev) => !prev)}
              onStepFrame={handleStepFrame}
              timeScale={timeScale}
              onChangeTimeScale={setTimeScale}
              onReset={() => setupSimulation(activeExperimentId, parameters)}
              presets={currentExperiment.presets}
              onSelectPreset={handleSelectPreset}
              onToggleFullscreen={handleToggleFullscreen}
            />

            {/* High Performance 60FPS Interactive Canvas */}
            <div className="w-full relative h-[420px] bg-slate-950 select-none">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full block cursor-crosshair touch-none"
              />
            </div>
          </div>

          {/* Dynamic Parameter Sliders Panel */}
          <ParameterPanel
            parameters={currentExperiment.parameters}
            values={parameters}
            onChange={(paramId, value) => {
              setParameters((prev) => ({ ...prev, [paramId]: value }));
            }}
            onResetDefaults={handleResetDefaults}
          />

          {/* Telemetry & Analytical Formula Deck */}
          <TelemetryFormulaPanel
            experiment={currentExperiment}
            telemetryHistory={telemetryHistory}
            currentTelemetry={currentTelemetry}
            onExportCSV={handleExportCSV}
          />
        </main>
      </div>
    </div>
  );
}
