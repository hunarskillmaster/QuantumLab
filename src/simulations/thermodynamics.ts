/**
 * Thermodynamics & Fluids Simulations:
 * 15. Ideal Gas Molecular Dynamics (Maxwell-Boltzmann)
 * 16. Venturi Effect & Bernoulli Tube
 * 17. 2D Heat Diffusion Grid
 */

import { SimulationEngine } from '../types/physics';

// ==========================================
// 15. Ideal Gas Molecular Dynamics (Maxwell-Boltzmann)
// ==========================================
export interface GasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface IdealGasState {
  particles: GasParticle[];
  pressureHistory: number[];
  pistonX: number;
  wallImpulseAccumulator: number;
  timeSinceSample: number;
}

export const idealGasEngine: SimulationEngine<IdealGasState> = {
  init: (params, _width, height) => {
    const n = Math.round(params.particleCount || 150);
    const temp = params.temperature || 300; // Kelvin
    const boxW = 400;
    const boxH = height - 120;
    const particles: GasParticle[] = [];

    const baseSpeed = Math.sqrt(temp) * 6;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      particles.push({
        x: 60 + Math.random() * (boxW - 40),
        y: 60 + Math.random() * (boxH - 40),
        vx: Math.cos(angle) * baseSpeed * (0.6 + Math.random() * 0.8),
        vy: Math.sin(angle) * baseSpeed * (0.6 + Math.random() * 0.8),
      });
    }

    return {
      particles,
      pressureHistory: [],
      pistonX: 460,
      wallImpulseAccumulator: 0,
      timeSinceSample: 0,
    };
  },

  update: (state, dt, params) => {
    const targetTemp = params.temperature || 300;
    const pistonPercent = (params.pistonVolume || 100) / 100;
    const boxLeft = 60;
    const boxTop = 60;
    const boxH = 340;
    const boxMaxW = 420;
    const currentBoxW = Math.max(160, boxMaxW * pistonPercent);
    const boxRight = boxLeft + currentBoxW;
    const boxBottom = boxTop + boxH;

    let particles = state.particles;
    const targetCount = Math.round(params.particleCount || 150);

    // Resize particles array if count changed
    if (particles.length !== targetCount) {
      const diff = targetCount - particles.length;
      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          const angle = Math.random() * Math.PI * 2;
          const s = Math.sqrt(targetTemp) * 6;
          particles.push({
            x: boxLeft + Math.random() * (currentBoxW - 20),
            y: boxTop + Math.random() * (boxH - 20),
            vx: Math.cos(angle) * s,
            vy: Math.sin(angle) * s,
          });
        }
      } else {
        particles = particles.slice(0, targetCount);
      }
    }

    // Thermostat scaling: gradually nudge particle rms speed towards target temperature
    let totalKineticEnergy = 0;
    particles.forEach((p) => {
      totalKineticEnergy += 0.5 * (p.vx * p.vx + p.vy * p.vy);
    });
    const measuredTemp = totalKineticEnergy / (particles.length || 1) / 36;
    const tempCorrection = Math.sqrt(targetTemp / (measuredTemp || 1));
    const factor = 1 + (tempCorrection - 1) * 0.05;

    let wallImpulse = state.wallImpulseAccumulator;

    // Sub-stepping for particles
    const subSteps = 4;
    const subDt = dt / subSteps;
    const particleRadius = 4;

    for (let s = 0; s < subSteps; s++) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= factor;
        p.vy *= factor;

        p.x += p.vx * subDt;
        p.y += p.vy * subDt;

        // Left wall
        if (p.x - particleRadius < boxLeft) {
          p.x = boxLeft + particleRadius;
          p.vx = -p.vx;
          wallImpulse += 2 * Math.abs(p.vx);
        }
        // Right piston wall
        if (p.x + particleRadius > boxRight) {
          p.x = boxRight - particleRadius;
          p.vx = -p.vx;
          wallImpulse += 2 * Math.abs(p.vx);
        }
        // Top wall
        if (p.y - particleRadius < boxTop) {
          p.y = boxTop + particleRadius;
          p.vy = -p.vy;
          wallImpulse += 2 * Math.abs(p.vy);
        }
        // Bottom wall
        if (p.y + particleRadius > boxBottom) {
          p.y = boxBottom - particleRadius;
          p.vy = -p.vy;
          wallImpulse += 2 * Math.abs(p.vy);
        }
      }
    }

    const timeSinceSample = state.timeSinceSample + dt;
    let pressureHistory = state.pressureHistory;
    let currentPressure = 0;

    if (timeSinceSample >= 0.1) {
      const area = 2 * (currentBoxW + boxH);
      currentPressure = (wallImpulse / (timeSinceSample * area)) * 20;
      wallImpulse = 0;
      pressureHistory = [...pressureHistory, currentPressure].slice(-50);
    } else {
      currentPressure = pressureHistory[pressureHistory.length - 1] || 0;
    }

    return {
      state: {
        particles,
        pressureHistory,
        pistonX: boxRight,
        wallImpulseAccumulator: wallImpulse,
        timeSinceSample: timeSinceSample >= 0.1 ? 0 : timeSinceSample,
      },
      telemetry: {
        temperature: targetTemp,
        pressure: currentPressure,
        volume: currentBoxW * boxH * 0.01,
        particlesCount: particles.length,
        rmsSpeed: Math.sqrt((2 * totalKineticEnergy) / (particles.length || 1)),
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const boxLeft = 60;
    const boxTop = 60;
    const boxH = 340;
    const boxRight = state.pistonX;

    // Chamber container
    ctx.fillStyle = '#050a14';
    ctx.fillRect(boxLeft, boxTop, boxRight - boxLeft, boxH);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Top
    ctx.moveTo(boxLeft, boxTop);
    ctx.lineTo(boxRight, boxTop);
    // Bottom
    ctx.moveTo(boxLeft, boxTop + boxH);
    ctx.lineTo(boxRight, boxTop + boxH);
    // Left
    ctx.moveTo(boxLeft, boxTop);
    ctx.lineTo(boxLeft, boxTop + boxH);
    ctx.stroke();

    // Movable Piston Head (on right wall)
    ctx.fillStyle = '#475569';
    ctx.fillRect(boxRight - 8, boxTop, 16, boxH);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(boxRight - 8, boxTop, 16, boxH);

    // Piston rod extending to right
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(boxRight + 8, boxTop + boxH / 2);
    ctx.lineTo(boxRight + 80, boxTop + boxH / 2);
    ctx.stroke();

    // Gas particles (colored by individual speed)
    const targetTemp = parameters.temperature || 300;
    const avgSpeed = Math.sqrt(targetTemp) * 6;

    state.particles.forEach((p) => {
      const speed = Math.hypot(p.vx, p.vy);
      const ratio = speed / (avgSpeed || 1);
      // Fast = red/orange, Normal = cyan, Slow = deep blue
      const r = Math.min(255, Math.floor(ratio * 200));
      const g = Math.min(255, Math.floor(220 - Math.abs(ratio - 1) * 120));
      const b = Math.min(255, Math.floor((2 - ratio) * 200));

      ctx.fillStyle = `rgb(${r},${Math.max(40, g)},${Math.max(60, b)})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Inset: Maxwell-Boltzmann Speed Distribution Histogram
    const histX = Math.max(boxRight + 60, width - 240);
    const histY = 60;
    const histW = 200;
    const histH = 160;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.fillRect(histX, histY, histW, histH);
    ctx.strokeRect(histX, histY, histW, histH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText('Speed Distribution f(v)', histX + 10, histY + 16);

    // Calculate histogram buckets
    const numBins = 16;
    const maxSpeedBin = avgSpeed * 2.5;
    const bins = new Array(numBins).fill(0);

    state.particles.forEach((p) => {
      const s = Math.hypot(p.vx, p.vy);
      const binIdx = Math.min(numBins - 1, Math.floor((s / maxSpeedBin) * numBins));
      bins[binIdx]++;
    });

    const maxCount = Math.max(1, ...bins);
    const binW = (histW - 20) / numBins;

    for (let i = 0; i < numBins; i++) {
      const bh = (bins[i] / maxCount) * (histH - 45);
      const bx = histX + 10 + i * binW;
      const by = histY + histH - 12 - bh;

      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(bx, by, binW - 1, bh);
    }

    // Theoretical Maxwell-Boltzmann curve overlay
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= histW - 20; x += 3) {
      const v = (x / (histW - 20)) * maxSpeedBin;
      const sigma = avgSpeed * 0.55;
      const fv = (v / (sigma * sigma)) * Math.exp(-(v * v) / (2 * sigma * sigma));
      const py = histY + histH - 12 - (fv * sigma * 1.5) * (histH - 45);
      if (x === 0) ctx.moveTo(histX + 10 + x, py);
      else ctx.lineTo(histX + 10 + x, py);
    }
    ctx.stroke();
  },
};

// ==========================================
// 16. Venturi Effect & Bernoulli Tube
// ==========================================
export interface VenturiParticle {
  x: number;
  yNorm: number; // 0 to 1 across pipe cross section
}

export interface VenturiState {
  particles: VenturiParticle[];
}

export const venturiEngine: SimulationEngine<VenturiState> = {
  init: () => {
    const particles: VenturiParticle[] = [];
    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * 800,
        yNorm: 0.15 + Math.random() * 0.7,
      });
    }
    return { particles };
  },

  update: (state, dt, params) => {
    const flowRate = params.flowRate || 4.0;
    const throatRatio = params.throatRatio || 0.45; // constricted area fraction
    const pipeW = 800;

    const throatStart = 300;
    const throatEnd = 500;

    state.particles.forEach((p) => {
      // Local pipe area
      let areaFactor = 1.0;
      if (p.x >= throatStart && p.x <= throatEnd) {
        areaFactor = throatRatio;
      } else if (p.x > 200 && p.x < throatStart) {
        // Taper down
        const t = (p.x - 200) / (throatStart - 200);
        areaFactor = 1.0 - t * (1.0 - throatRatio);
      } else if (p.x > throatEnd && p.x < 600) {
        // Taper up
        const t = (p.x - throatEnd) / (600 - throatEnd);
        areaFactor = throatRatio + t * (1.0 - throatRatio);
      }

      // Continuity: v = Q / A
      const localV = (flowRate * 45) / areaFactor;
      p.x += localV * dt;

      if (p.x > pipeW) {
        p.x = 0;
        p.yNorm = 0.15 + Math.random() * 0.7;
      }
    });

    // Bernoulli static pressures: P + 0.5 * rho * v^2 = constant
    const vWide = flowRate;
    const vNarrow = flowRate / throatRatio;
    const rho = 1000; // water kg/m^3
    const deltaP = 0.5 * rho * (vNarrow * vNarrow - vWide * vWide);

    return {
      state,
      telemetry: {
        vInlet: vWide,
        vThroat: vNarrow,
        deltaPressure: deltaP,
        throatRatio,
        flowRate,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const throatRatio = parameters.throatRatio || 0.45;
    const centerY = height * 0.6;
    const wideRadius = 60;
    const narrowRadius = wideRadius * throatRatio;

    // Pipe outline
    ctx.fillStyle = '#050a14';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    // Top pipe boundary
    ctx.beginPath();
    ctx.moveTo(40, centerY - wideRadius);
    ctx.lineTo(240, centerY - wideRadius);
    ctx.bezierCurveTo(300, centerY - wideRadius, 320, centerY - narrowRadius, 380, centerY - narrowRadius);
    ctx.lineTo(520, centerY - narrowRadius);
    ctx.bezierCurveTo(580, centerY - narrowRadius, 600, centerY - wideRadius, 660, centerY - wideRadius);
    ctx.lineTo(width - 40, centerY - wideRadius);
    ctx.stroke();

    // Bottom pipe boundary
    ctx.beginPath();
    ctx.moveTo(40, centerY + wideRadius);
    ctx.lineTo(240, centerY + wideRadius);
    ctx.bezierCurveTo(300, centerY + wideRadius, 320, centerY + narrowRadius, 380, centerY + narrowRadius);
    ctx.lineTo(520, centerY + narrowRadius);
    ctx.bezierCurveTo(580, centerY + narrowRadius, 600, centerY + wideRadius, 660, centerY + wideRadius);
    ctx.lineTo(width - 40, centerY + wideRadius);
    ctx.stroke();

    // 3 Vertical Manometer Tubes measuring static pressure
    const tubePositions = [
      { x: 180, isThroat: false },
      { x: 450, isThroat: true },
      { x: 720, isThroat: false },
    ];

    tubePositions.forEach((tube) => {
      const topY = centerY - (tube.isThroat ? narrowRadius : wideRadius);
      const tubeH = 140;

      // Glass tube
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tube.x - 12, topY);
      ctx.lineTo(tube.x - 12, topY - tubeH);
      ctx.moveTo(tube.x + 12, topY);
      ctx.lineTo(tube.x + 12, topY - tubeH);
      ctx.stroke();

      // Liquid level: higher pressure at wide pipe -> higher water column
      // lower static pressure at throat constriction -> lower water column
      const waterHeight = tube.isThroat ? tubeH * 0.35 : tubeH * 0.85;

      ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.fillRect(tube.x - 10, topY - waterHeight, 20, waterHeight);

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(tube.x, topY - waterHeight, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Column height readout
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(tube.isThroat ? 'Low P (Throat)' : 'High P (Inlet)', tube.x, topY - tubeH - 8);
    });

    // Streamline tracer particles inside pipe
    state.particles.forEach((p) => {
      // Local half-height
      let localR = wideRadius;
      if (p.x >= 380 && p.x <= 520) {
        localR = narrowRadius;
      } else if (p.x > 240 && p.x < 380) {
        const t = (p.x - 240) / 140;
        localR = wideRadius - t * (wideRadius - narrowRadius);
      } else if (p.x > 520 && p.x < 660) {
        const t = (p.x - 520) / 140;
        localR = narrowRadius + t * (wideRadius - narrowRadius);
      }

      const py = centerY - localR + p.yNorm * (2 * localR);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(p.x, py, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  },
};

// ==========================================
// 17. 2D Heat Diffusion Grid
// ==========================================
export interface HeatGridState {
  grid: Float32Array;
  cols: number;
  rows: number;
  isPainting: boolean;
  paintVal: number;
}

export const heatDiffusionEngine: SimulationEngine<HeatGridState> = {
  init: () => {
    const cols = 50;
    const rows = 36;
    const grid = new Float32Array(cols * rows);

    // Initial ambient temperature 20°C
    grid.fill(20);

    // Hot central source initially
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        if (dx * dx + dy * dy <= 16) {
          grid[(midY + dy) * cols + (midX + dx)] = 100;
        }
      }
    }

    return { grid, cols, rows, isPainting: false, paintVal: 100 };
  },

  update: (state, dt, params) => {
    const alpha = params.diffusivity || 0.25; // thermal diffusivity
    const { cols, rows, grid } = state;
    const nextGrid = new Float32Array(grid.length);

    // Finite-Difference 2D Laplacian operator: d^2T/dx^2 + d^2T/dy^2
    const subSteps = 3;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      for (let y = 1; y < rows - 1; y++) {
        for (let x = 1; x < cols - 1; x++) {
          const idx = y * cols + x;
          const laplacian =
            grid[idx - 1] +
            grid[idx + 1] +
            grid[idx - cols] +
            grid[idx + cols] -
            4 * grid[idx];
          nextGrid[idx] = grid[idx] + alpha * laplacian * subDt * 60;
        }
      }

      // Boundary condition: ambient cooling
      for (let x = 0; x < cols; x++) {
        nextGrid[x] = 20;
        nextGrid[(rows - 1) * cols + x] = 20;
      }
      for (let y = 0; y < rows; y++) {
        nextGrid[y * cols] = 20;
        nextGrid[y * cols + (cols - 1)] = 20;
      }

      grid.set(nextGrid);
    }

    // Telemetry: min/max/average temperature
    let maxTemp = -Infinity;
    let minTemp = Infinity;
    let sumTemp = 0;
    for (let i = 0; i < grid.length; i++) {
      const v = grid[i];
      if (v > maxTemp) maxTemp = v;
      if (v < minTemp) minTemp = v;
      sumTemp += v;
    }

    return {
      state,
      telemetry: {
        maxTemp,
        minTemp,
        avgTemp: sumTemp / grid.length,
        diffusivity: alpha,
        totalEnergy: sumTemp * 4.184,
      },
    };
  },

  onPointerDown: (x, y, state, width, height) => {
    state.isPainting = true;
    applyHeatBrush(x, y, state, width, height, 100);
  },

  onPointerMove: (x, y, state, width, height) => {
    if (state.isPainting) {
      applyHeatBrush(x, y, state, width, height, 100);
    }
  },

  onPointerUp: (_x, _y, state) => {
    state.isPainting = false;
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const { cols, rows, grid } = state;

    const cellW = (width - 120) / cols;
    const cellH = (height - 80) / rows;
    const originX = 60;
    const originY = 40;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const temp = grid[y * cols + x];
        // Thermal heat color map (20°C dark blue -> 60°C magenta -> 100°C bright yellow/white)
        const norm = Math.max(0, Math.min(1, (temp - 20) / 80));
        let r = 0;
        let g = 0;
        let b = 0;

        if (norm < 0.25) {
          const t = norm / 0.25;
          r = Math.floor(15 + t * 40);
          g = Math.floor(23 + t * 60);
          b = Math.floor(60 + t * 160);
        } else if (norm < 0.6) {
          const t = (norm - 0.25) / 0.35;
          r = Math.floor(55 + t * 180);
          g = Math.floor(83 - t * 40);
          b = Math.floor(220 - t * 140);
        } else {
          const t = (norm - 0.6) / 0.4;
          r = 235 + Math.floor(t * 20);
          g = Math.floor(43 + t * 200);
          b = Math.floor(80 + t * 170);
        }

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(originX + x * cellW, originY + y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(originX, originY, cols * cellW, rows * cellH);

    // Temperature scale legend bar
    const legX = width - 45;
    const legY = originY;
    const legH = rows * cellH;

    const grad = ctx.createLinearGradient(0, legY + legH, 0, legY);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.3, '#3b82f6');
    grad.addColorStop(0.65, '#f43f5e');
    grad.addColorStop(1, '#fde047');

    ctx.fillStyle = grad;
    ctx.fillRect(legX, legY, 14, legH);
    ctx.strokeRect(legX, legY, 14, legH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono"';
    ctx.fillText('100°C', legX - 35, legY + 10);
    ctx.fillText('20°C', legX - 30, legY + legH);

    ctx.fillText('Click / Drag to inject heat into the conductor plate', originX, originY + legH + 20);
  },
};

function applyHeatBrush(
  px: number,
  py: number,
  state: HeatGridState,
  width: number,
  height: number,
  tempVal: number
) {
  const { cols, rows, grid } = state;
  const cellW = (width - 120) / cols;
  const cellH = (height - 80) / rows;
  const originX = 60;
  const originY = 40;

  const gridX = Math.floor((px - originX) / cellW);
  const gridY = Math.floor((py - originY) / cellH);

  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const gx = gridX + dx;
      const gy = gridY + dy;
      if (gx >= 1 && gx < cols - 1 && gy >= 1 && gy < rows - 1) {
        grid[gy * cols + gx] = tempVal;
      }
    }
  }
}
