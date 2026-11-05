/**
 * Electromagnetism Simulations:
 * 11. DC Circuit Builder & Ohm's Law Solver
 * 12. Electric Field & Point Charge Potentials
 * 13. Lorentz Force (Charged Particle in Magnetic Field)
 * 14. Faraday's Law of Electromagnetic Induction
 */

import { SimulationEngine } from '../types/physics';

// ==========================================
// 11. DC Circuit Builder & Ohm's Law Solver
// ==========================================
export interface DCCircuitState {
  electronOffset: number;
  switchClosed: boolean;
}

export const dcCircuitEngine: SimulationEngine<DCCircuitState> = {
  init: (params) => ({
    electronOffset: 0,
    switchClosed: params.switchState !== undefined ? params.switchState === 1 : true,
  }),

  update: (state, dt, params) => {
    const vBattery = params.voltage || 12; // Volts
    const r1 = params.r1 || 10; // Ohms
    const r2 = params.r2 || 20; // Ohms
    const isParallel = params.circuitConfig !== undefined ? params.circuitConfig === 1 : false;
    const switchClosed = params.switchClosed !== undefined ? params.switchClosed === 1 : state.switchClosed;

    let req = r1 + r2;
    let iTotal = 0;
    let i1 = 0;
    let i2 = 0;

    if (switchClosed) {
      if (isParallel) {
        req = (r1 * r2) / (r1 + r2);
        i1 = vBattery / r1;
        i2 = vBattery / r2;
        iTotal = i1 + i2;
      } else {
        req = r1 + r2;
        iTotal = vBattery / req;
        i1 = iTotal;
        i2 = iTotal;
      }
    }

    const driftSpeed = switchClosed ? iTotal * 45 : 0;
    const electronOffset = (state.electronOffset + driftSpeed * dt) % 1000;
    const powerTotal = switchClosed ? vBattery * iTotal : 0;

    return {
      state: {
        electronOffset,
        switchClosed,
      },
      telemetry: {
        vBattery,
        iTotal,
        req,
        powerTotal,
        i1,
        i2,
        vR1: i1 * r1,
        vR2: i2 * r2,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const isParallel = parameters.circuitConfig !== undefined ? parameters.circuitConfig === 1 : false;
    const switchClosed = state.switchClosed;

    const leftX = width * 0.22;
    const rightX = width * 0.78;
    const topY = height * 0.28;
    const bottomY = height * 0.72;

    // Circuit wires
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;

    // Outer rectangle
    ctx.beginPath();
    // Top wire
    ctx.moveTo(leftX, topY);
    ctx.lineTo(rightX, topY);
    // Right wire
    ctx.lineTo(rightX, bottomY);
    // Bottom wire
    ctx.lineTo(leftX, bottomY);
    // Left wire (with battery)
    ctx.lineTo(leftX, topY);
    ctx.stroke();

    if (isParallel) {
      // Middle parallel branch
      const midY = (topY + bottomY) / 2;
      ctx.beginPath();
      ctx.moveTo(leftX, midY);
      ctx.lineTo(rightX, midY);
      ctx.stroke();
    }

    // 1. Battery on left wire
    const batteryCenterY = (topY + bottomY) / 2;
    ctx.fillStyle = '#030712';
    ctx.fillRect(leftX - 10, batteryCenterY - 30, 20, 60);

    // Long line (+) and short thick line (-)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(leftX - 18, batteryCenterY - 14);
    ctx.lineTo(leftX + 18, batteryCenterY - 14);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(leftX - 10, batteryCenterY + 14);
    ctx.lineTo(leftX + 10, batteryCenterY + 14);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillText(`+ ${parameters.voltage || 12}V`, leftX - 65, batteryCenterY - 10);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText(`- GND`, leftX - 55, batteryCenterY + 18);

    // 2. Resistor 1 on top wire
    const r1X = (leftX + rightX) / 2 - (isParallel ? 0 : 70);
    drawResistor(ctx, r1X, topY, `R1: ${parameters.r1 || 10}Ω`);

    // 3. Resistor 2
    if (isParallel) {
      const midY = (topY + bottomY) / 2;
      drawResistor(ctx, (leftX + rightX) / 2, midY, `R2: ${parameters.r2 || 20}Ω`);
    } else {
      const r2X = (leftX + rightX) / 2 + 70;
      drawResistor(ctx, r2X, topY, `R2: ${parameters.r2 || 20}Ω`);
    }

    // 4. Switch on bottom wire
    const switchX = (leftX + rightX) / 2;
    ctx.fillStyle = '#030712';
    ctx.fillRect(switchX - 25, bottomY - 12, 50, 24);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(switchX - 15, bottomY, 3, 0, Math.PI * 2);
    ctx.arc(switchX + 15, bottomY, 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(switchX - 15, bottomY);
    if (switchClosed) {
      ctx.lineTo(switchX + 15, bottomY);
    } else {
      ctx.lineTo(switchX + 10, bottomY - 20); // open switch
    }
    ctx.stroke();

    ctx.fillStyle = switchClosed ? '#10b981' : '#f59e0b';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(switchClosed ? 'SWITCH CLOSED' : 'SWITCH OPEN', switchX, bottomY + 24);

    // 5. Electron Drift Animation (blue glowing dots moving along wire)
    if (switchClosed) {
      const perimeter = 2 * (rightX - leftX) + 2 * (bottomY - topY);
      const dotCount = 28;
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#60a5fa';
      ctx.shadowBlur = 6;

      for (let i = 0; i < dotCount; i++) {
        const d = (state.electronOffset + (i / dotCount) * perimeter) % perimeter;
        const pos = getWirePoint(d, leftX, rightX, topY, bottomY);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }
  },
};

function drawResistor(ctx: CanvasRenderingContext2D, x: number, y: number, label: string) {
  const w = 44;
  const h = 18;
  ctx.fillStyle = '#030712';
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 2.5;

  // Zig-zag resistor schematic
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w / 2 + 6, y - 7);
  ctx.lineTo(x - w / 2 + 15, y + 7);
  ctx.lineTo(x - w / 2 + 24, y - 7);
  ctx.lineTo(x - w / 2 + 33, y + 7);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = '10px "JetBrains Mono"';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 14);
}

function getWirePoint(d: number, left: number, right: number, top: number, bottom: number) {
  const w = right - left;
  const h = bottom - top;
  // Clockwise traversal
  if (d < w) {
    return { x: left + d, y: top };
  } else if (d < w + h) {
    return { x: right, y: top + (d - w) };
  } else if (d < 2 * w + h) {
    return { x: right - (d - (w + h)), y: bottom };
  } else {
    return { x: left, y: bottom - (d - (2 * w + h)) };
  }
}

// ==========================================
// 12. Electric Field & Point Charge Potentials
// ==========================================
export interface Charge {
  x: number;
  y: number;
  q: number; // positive or negative microcoulombs
}

export interface ElectricFieldState {
  charges: Charge[];
  activeChargeIndex: number | null;
}

export const electricFieldEngine: SimulationEngine<ElectricFieldState> = {
  init: (_params, width, height) => ({
    charges: [
      { x: width * 0.35, y: height * 0.5, q: 2.0 },
      { x: width * 0.65, y: height * 0.5, q: -2.0 },
    ],
    activeChargeIndex: null,
  }),

  update: (state) => {
    // Dipole moment calculation: p = q * d
    let dipoleMoment = 0;
    if (state.charges.length === 2) {
      const c1 = state.charges[0];
      const c2 = state.charges[1];
      const dist = Math.hypot(c1.x - c2.x, c1.y - c2.y) * 0.01; // meters
      dipoleMoment = Math.abs(c1.q) * dist;
    }

    return {
      state,
      telemetry: {
        chargesCount: state.charges.length,
        dipoleMoment,
        q1: state.charges[0]?.q || 0,
        q2: state.charges[1]?.q || 0,
      },
    };
  },

  onPointerDown: (x, y, state) => {
    for (let i = 0; i < state.charges.length; i++) {
      const c = state.charges[i];
      if (Math.hypot(x - c.x, y - c.y) < 22) {
        state.activeChargeIndex = i;
        return;
      }
    }
  },

  onPointerMove: (x, y, state) => {
    if (state.activeChargeIndex !== null) {
      const c = state.charges[state.activeChargeIndex];
      if (c) {
        c.x = x;
        c.y = y;
      }
    }
  },

  onPointerUp: (_x, _y, state) => {
    state.activeChargeIndex = null;
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const k = 8.99e4; // visual scaling constant

    // 1. Electric Field Vector Grid
    const step = 42;
    for (let gx = step / 2; gx < width; gx += step) {
      for (let gy = step / 2; gy < height; gy += step) {
        let ex = 0;
        let ey = 0;

        state.charges.forEach((c) => {
          const dx = gx - c.x;
          const dy = gy - c.y;
          const rSq = dx * dx + dy * dy;
          const r = Math.sqrt(rSq);
          if (r > 15) {
            const f = (k * c.q) / (rSq * 0.05 + 10);
            ex += f * (dx / r);
            ey += f * (dy / r);
          }
        });

        const eMag = Math.hypot(ex, ey);
        if (eMag > 0.05) {
          const arrowLen = Math.min(step * 0.45, Math.max(8, Math.log10(eMag + 1) * 7));
          const nx = (ex / eMag) * arrowLen;
          const ny = (ey / eMag) * arrowLen;

          const alpha = Math.min(0.7, eMag * 0.05 + 0.15);
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(gx - nx * 0.5, gy - ny * 0.5);
          ctx.lineTo(gx + nx * 0.5, gy + ny * 0.5);
          ctx.stroke();

          // Arrow tip
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.beginPath();
          ctx.arc(gx + nx * 0.5, gy + ny * 0.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Draw Charges
    state.charges.forEach((c) => {
      const isPos = c.q > 0;
      const r = 18;
      const color = isPos ? '#ef4444' : '#3b82f6';

      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Charge sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isPos ? '+' : '−', c.x, c.y);

      // Charge value label
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(`${c.q > 0 ? '+' : ''}${c.q.toFixed(1)} μC`, c.x, c.y + 26);
    });

    ctx.fillStyle = '#64748b';
    ctx.font = '11px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Drag either charge to watch field vectors reorganize live', width / 2, height - 20);
  },
};

// ==========================================
// 13. Lorentz Force (Charged Particle in Magnetic Field)
// ==========================================
export interface LorentzState {
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    trail: { x: number; y: number }[];
  }[];
  time: number;
}

export const lorentzEngine: SimulationEngine<LorentzState> = {
  init: (_params, width, height) => ({
    particles: [
      {
        x: 60,
        y: height / 2,
        vx: 180,
        vy: 0,
        trail: [],
      },
    ],
    time: 0,
  }),

  update: (state, dt, params) => {
    const B = params.bField !== undefined ? params.bField : 1.2; // Tesla
    const q = params.particleCharge !== undefined ? params.particleCharge : -1; // -1 for electron
    const m = params.particleMass || 1.0;
    const v0 = params.velocity || 180;

    let particles = state.particles;
    const p = particles[0];

    // Lorentz force F = q * (v x B). In 2D plane with B pointing out of screen (z):
    // Fx = q * vy * B
    // Fy = -q * vx * B
    const subSteps = 8;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      const ax = (q * p.vy * B) / m;
      const ay = (-q * p.vx * B) / m;

      p.vx += ax * subDt;
      p.vy += ay * subDt;
      p.x += p.vx * subDt;
      p.y += p.vy * subDt;
    }

    p.trail.push({ x: p.x, y: p.y });
    if (p.trail.length > 350) p.trail.shift();

    // Reset if particle exits screen bounds
    if (p.x < 0 || p.x > 1200 || p.y < 0 || p.y > 800) {
      p.x = 80;
      p.y = 250;
      p.vx = v0;
      p.vy = 0;
      p.trail = [];
    }

    const currentSpeed = Math.hypot(p.vx, p.vy);
    const gyroRadius = (m * currentSpeed) / (Math.abs(q * B) || 1);
    const cyclotronFreq = (Math.abs(q * B) / (2 * Math.PI * m));

    return {
      state: { particles, time: state.time + dt },
      telemetry: {
        bField: B,
        gyroRadius,
        cyclotronFreq,
        velocity: currentSpeed,
        lorentzForce: Math.abs(q * currentSpeed * B),
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const B = parameters.bField !== undefined ? parameters.bField : 1.2;
    const isOutOfPage = B >= 0;

    // Draw Magnetic Field Grid Indicators (dots for out of page, crosses for into page)
    ctx.strokeStyle = '#334155';
    ctx.fillStyle = '#475569';
    const gridStep = 48;
    for (let x = gridStep; x < width - 40; x += gridStep) {
      for (let y = gridStep; y < height - 40; y += gridStep) {
        if (isOutOfPage) {
          // Dot (vector out of page)
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Cross X (vector into page)
          ctx.beginPath();
          ctx.moveTo(x - 3, y - 3);
          ctx.lineTo(x + 3, y + 3);
          ctx.moveTo(x + 3, y - 3);
          ctx.lineTo(x - 3, y + 3);
          ctx.stroke();
        }
      }
    }

    // Particle Trail
    const p = state.particles[0];
    if (p && p.trail.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      p.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Particle
    if (p) {
      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Velocity arrow
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.25, p.y + p.vy * 0.25);
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText(
      `Magnetic Field B = ${B.toFixed(2)} T (${isOutOfPage ? '⊙ Out of page' : '⊗ Into page'})`,
      30,
      30
    );
  },
};

// ==========================================
// 14. Faraday's Law of Electromagnetic Induction
// ==========================================
export interface FaradayState {
  magnetX: number;
  magnetY: number;
  magnetVx: number;
  inducedEMF: number;
  flux: number;
  time: number;
  isDraggingMagnet: boolean;
}

export const faradayEngine: SimulationEngine<FaradayState> = {
  init: (_params, width, height) => ({
    magnetX: width * 0.25,
    magnetY: height * 0.5,
    magnetVx: 0,
    inducedEMF: 0,
    flux: 0,
    time: 0,
    isDraggingMagnet: false,
  }),

  update: (state, dt, params) => {
    const numTurns = params.numTurns || 50;
    const autoOscillate = params.autoOscillate !== undefined ? params.autoOscillate === 1 : true;
    let { magnetX, magnetY, magnetVx, time, isDraggingMagnet } = state;
    time += dt;

    if (autoOscillate && !isDraggingMagnet) {
      const centerX = 360;
      const amp = 160;
      const freq = 1.2;
      const prevX = magnetX;
      magnetX = centerX + amp * Math.sin(2 * Math.PI * freq * time);
      magnetVx = (magnetX - prevX) / dt;
    }

    // Coil location at center
    const coilX = 360;
    const distToCoil = magnetX - coilX;

    // Magnetic dipole field flux through coil: Phi = B0 / (1 + (dist / R)^2)^(3/2)
    const rCoil = 60;
    const flux = 1000 / Math.pow(1 + Math.pow(distToCoil / rCoil, 2), 1.5);

    // Faraday's Law: EMF = -N * (dPhi/dt)
    // dPhi/dt = (dPhi/dx) * (dx/dt)
    const dPhiDx = (-3 * 1000 * distToCoil) / (rCoil * rCoil * Math.pow(1 + Math.pow(distToCoil / rCoil, 2), 2.5));
    const inducedEMF = -numTurns * dPhiDx * (magnetVx * 0.001);

    return {
      state: {
        ...state,
        magnetX,
        magnetY,
        magnetVx,
        inducedEMF,
        flux,
        time,
      },
      telemetry: {
        inducedEMF,
        magneticFlux: flux,
        magnetVelocity: magnetVx,
        coilTurns: numTurns,
        bulbBrightness: Math.min(100, Math.pow(inducedEMF * 8, 2)),
      },
    };
  },

  onPointerDown: (x, y, state) => {
    const magW = 120;
    const magH = 40;
    if (
      x >= state.magnetX - magW / 2 &&
      x <= state.magnetX + magW / 2 &&
      y >= state.magnetY - magH / 2 &&
      y <= state.magnetY + magH / 2
    ) {
      state.isDraggingMagnet = true;
    }
  },

  onPointerMove: (x, _y, state) => {
    if (state.isDraggingMagnet) {
      const prevX = state.magnetX;
      state.magnetX = x;
      state.magnetVx = (x - prevX) * 30;
    }
  },

  onPointerUp: (_x, _y, state) => {
    state.isDraggingMagnet = false;
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const coilX = 360;
    const coilY = height * 0.5;
    const coilRadius = 55;
    const numLoops = 8;

    // 1. Solenoid Wire Loops
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    for (let i = 0; i < numLoops; i++) {
      const loopX = coilX - 50 + i * 14;
      ctx.beginPath();
      ctx.ellipse(loopX, coilY, 10, coilRadius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 2. Bar Magnet (North = Red, South = Blue)
    const magW = 120;
    const magH = 38;
    const magLeft = state.magnetX - magW / 2;
    const magTop = state.magnetY - magH / 2;

    // North half
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(magLeft, magTop, magW / 2, magH);
    // South half
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(magLeft + magW / 2, magTop, magW / 2, magH);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(magLeft, magTop, magW, magH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', magLeft + magW * 0.25, state.magnetY);
    ctx.fillText('S', magLeft + magW * 0.75, state.magnetY);

    // 3. Galvanometer / Light Bulb Indicator (on top right)
    const bulbX = width * 0.78;
    const bulbY = height * 0.45;
    const glowIntensity = Math.min(1, Math.abs(state.inducedEMF) * 0.15);

    // Light bulb glow
    if (glowIntensity > 0.05) {
      ctx.fillStyle = `rgba(251, 191, 36, ${glowIntensity * 0.8})`;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 24 * glowIntensity;
      ctx.beginPath();
      ctx.arc(bulbX, bulbY, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Bulb glass
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Galvanometer needle readout
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(bulbX - 45, bulbY + 45, 90, 45);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(bulbX - 45, bulbY + 45, 90, 45);

    // Needle pivot & deflection
    const needleAngle = Math.max(-1.2, Math.min(1.2, state.inducedEMF * 0.25));
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bulbX, bulbY + 80);
    ctx.lineTo(bulbX + 32 * Math.sin(needleAngle), bulbY + 80 - 32 * Math.cos(needleAngle));
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Galvanometer (EMF)', bulbX, bulbY + 38);
  },
};
