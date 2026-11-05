/**
 * Quantum & Astrophysics Simulations:
 * 18. Keplerian N-Body Gravitational Orbital Simulator
 * 19. Photoelectric Effect
 * 20. Radioactive Decay Stochastic Simulator
 */

import { SimulationEngine } from '../types/physics';
import { physicsAudio } from '../utils/audio';

// ==========================================
// 18. Keplerian N-Body Gravitational Orbital Simulator
// ==========================================
export interface CelestialBody {
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
}

export interface KeplerState {
  bodies: CelestialBody[];
  time: number;
}

export const keplerEngine: SimulationEngine<KeplerState> = {
  init: (_params, width, height) => {
    const cx = width / 2;
    const cy = height / 2;

    const bodies: CelestialBody[] = [
      // Central Star
      {
        name: 'Sun',
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        mass: 12000,
        radius: 16,
        color: '#facc15',
        trail: [],
      },
      // Planet 1 (Inner, Fast)
      {
        name: 'Hermes',
        x: cx,
        y: cy - 90,
        vx: 11.5,
        vy: 0,
        mass: 1.0,
        radius: 5,
        color: '#38bdf8',
        trail: [],
      },
      // Planet 2 (Habitable)
      {
        name: 'Terra',
        x: cx,
        y: cy - 160,
        vx: 8.6,
        vy: 0,
        mass: 2.5,
        radius: 7,
        color: '#10b981',
        trail: [],
      },
      // Planet 3 (Outer Gas Giant)
      {
        name: 'Zeus',
        x: cx,
        y: cy - 240,
        vx: 7.0,
        vy: 0,
        mass: 8.0,
        radius: 10,
        color: '#f97316',
        trail: [],
      },
    ];

    return { bodies, time: 0 };
  },

  update: (state, dt, params) => {
    const G = params.gravitationalConst || 1.0;
    const bodies = state.bodies;

    // Sub-stepping for gravitational leapfrog / symplectic integration
    const subSteps = 6;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      // 1. Calculate pairwise N-body gravitational forces
      const ax = new Float64Array(bodies.length);
      const ay = new Float64Array(bodies.length);

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const dx = bodies[j].x - bodies[i].x;
          const dy = bodies[j].y - bodies[i].y;
          const distSq = dx * dx + dy * dy + 100; // softening factor
          const dist = Math.sqrt(distSq);
          const force = (G * bodies[i].mass * bodies[j].mass) / distSq;

          const fx = force * (dx / dist);
          const fy = force * (dy / dist);

          ax[i] += fx / bodies[i].mass;
          ay[i] += fy / bodies[i].mass;
          ax[j] -= fx / bodies[j].mass;
          ay[j] -= fy / bodies[j].mass;
        }
      }

      // 2. Update positions and velocities
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (i === 0) continue; // Keep central star anchored for stable view
        b.vx += ax[i] * subDt;
        b.vy += ay[i] * subDt;
        b.x += b.vx * subDt;
        b.y += b.vy * subDt;
      }
    }

    // Update trails
    bodies.forEach((b, i) => {
      if (i > 0) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 250) b.trail.shift();
      }
    });

    // Telemetry: Planet 2 (Terra) orbital radius, speed, angular momentum
    const p = bodies[2] || bodies[1];
    const sun = bodies[0];
    const r = Math.hypot(p.x - sun.x, p.y - sun.y);
    const speed = Math.hypot(p.vx, p.vy);
    const angularMomentum = p.mass * r * speed;

    return {
      state: { bodies, time: state.time + dt },
      telemetry: {
        orbitalRadius: r,
        orbitalSpeed: speed,
        angularMomentum,
        escapeVelocity: Math.sqrt((2 * G * sun.mass) / (r || 1)),
        periodEst: (2 * Math.PI * r) / (speed || 1),
      },
    };
  },

  render: (ctx, state) => {
    const bodies = state.bodies;

    // Draw orbital trails
    bodies.forEach((b, i) => {
      if (i === 0 || b.trail.length < 2) return;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      b.trail.forEach((pt, idx) => {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Celestial Bodies
    bodies.forEach((b, i) => {
      if (i === 0) {
        // Star with radial coronal glow
        const glow = ctx.createRadialGradient(b.x, b.y, b.radius * 0.5, b.x, b.y, b.radius * 3);
        glow.addColorStop(0, '#fef08a');
        glow.addColorStop(0.3, 'rgba(250, 204, 21, 0.7)');
        glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Planet
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Velocity vector arrow
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + b.vx * 4, b.y + b.vy * 4);
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px "JetBrains Mono"';
        ctx.fillText(b.name, b.x + b.radius + 4, b.y + 3);
      }
    });
  },
};

// ==========================================
// 19. Photoelectric Effect
// ==========================================
export interface PhotoElectron {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface PhotoelectricState {
  electrons: PhotoElectron[];
  time: number;
  currentEMAFlow: number;
}

export const photoelectricEngine: SimulationEngine<PhotoelectricState> = {
  init: () => ({
    electrons: [],
    time: 0,
    currentEMAFlow: 0,
  }),

  update: (state, dt, params) => {
    const lambdaNm = params.wavelength || 380; // nm (UV to visible)
    const workFunctionEV = params.workFunction || 2.14; // Cesium = 2.14 eV
    const stoppingVolt = params.stoppingVoltage || 0.0; // Volts opposing
    const intensity = params.intensity || 50; // photon flux percentage

    // Photon energy E = hc / lambda
    // hc = 1240 eV * nm
    const photonEnergyEV = 1240 / lambdaNm;
    const maxKineticEnergyEV = Math.max(0, photonEnergyEV - workFunctionEV);
    const canEject = photonEnergyEV >= workFunctionEV;

    let electrons = state.electrons;
    const cathodeX = 140;
    const anodeX = 520;
    const tubeCenterY = 220;

    // Eject new electrons based on light intensity
    if (canEject && Math.random() < (intensity / 100) * 0.6) {
      // Electron initial velocity proportional to sqrt(K_max)
      const v0 = Math.sqrt(maxKineticEnergyEV) * 110;
      const angle = (Math.random() - 0.5) * 0.6;
      electrons.push({
        x: cathodeX + 4,
        y: tubeCenterY + (Math.random() - 0.5) * 100,
        vx: Math.cos(angle) * v0,
        vy: Math.sin(angle) * v0,
        life: 0,
      });
    }

    // Electric field opposing acceleration: a = - (e * V / d) / m
    const d = (anodeX - cathodeX) * 0.01;
    const opposingAccel = (-stoppingVolt * 300) / (d || 1);

    let collectedCurrent = 0;

    electrons.forEach((e) => {
      e.vx += opposingAccel * dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.life += dt;

      // Anode collection
      if (e.x >= anodeX) {
        collectedCurrent += 1;
      }
    });

    // Keep active electrons
    electrons = electrons.filter((e) => e.x > cathodeX && e.x < anodeX && e.life < 4.0);

    const stoppingPotentialV0 = maxKineticEnergyEV; // e * V0 = Kmax
    const targetCurrent = canEject && stoppingVolt < stoppingPotentialV0 ? (intensity / 100) * (1 - stoppingVolt / (stoppingPotentialV0 || 1)) * 4.2 : 0;
    const currentEMAFlow = state.currentEMAFlow * 0.85 + targetCurrent * 0.15;

    return {
      state: {
        electrons,
        time: state.time + dt,
        currentEMAFlow,
      },
      telemetry: {
        photonEnergy: photonEnergyEV,
        workFunction: workFunctionEV,
        maxKineticEnergy: maxKineticEnergyEV,
        stoppingPotential: stoppingPotentialV0,
        photocurrent: currentEMAFlow,
        thresholdWavelength: 1240 / (workFunctionEV || 1),
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const cathodeX = 140;
    const anodeX = 520;
    const tubeCenterY = height * 0.45;
    const plateH = 150;

    // 1. Evacuated Glass Tube Chamber
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cathodeX - 30, tubeCenterY - plateH * 0.75, anodeX - cathodeX + 60, plateH * 1.5, 30);
    ctx.stroke();

    // 2. Metal Cathode Plate (Emitter)
    ctx.fillStyle = '#64748b';
    ctx.fillRect(cathodeX - 10, tubeCenterY - plateH / 2, 12, plateH);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(cathodeX - 10, tubeCenterY - plateH / 2, 12, plateH);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Cathode', cathodeX - 5, tubeCenterY - plateH / 2 - 12);

    // 3. Anode Plate (Collector)
    ctx.fillStyle = '#334155';
    ctx.fillRect(anodeX, tubeCenterY - plateH / 2, 12, plateH);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(anodeX, tubeCenterY - plateH / 2, 12, plateH);

    ctx.fillText('Anode', anodeX + 6, tubeCenterY - plateH / 2 - 12);

    // 4. Incident Monochromatic Light Beam
    const lambda = parameters.wavelength || 380;
    // Wavelength color mapping
    let lightColor = '#a855f7'; // UV/violet
    if (lambda > 620) lightColor = '#ef4444';
    else if (lambda > 580) lightColor = '#f59e0b';
    else if (lambda > 500) lightColor = '#10b981';
    else if (lambda > 450) lightColor = '#38bdf8';

    ctx.strokeStyle = lightColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = lightColor;
    ctx.shadowBlur = 10;
    for (let i = -3; i <= 3; i++) {
      const rayY = tubeCenterY + i * 18;
      ctx.beginPath();
      ctx.moveTo(30, rayY - 70);
      ctx.lineTo(cathodeX - 4, rayY);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 5. Ejected Photoelectrons (blue spheres flying towards anode)
    state.electrons.forEach((e) => {
      ctx.fillStyle = '#38bdf8';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 6. Picoammeter Readout on bottom circuit loop
    const meterX = (cathodeX + anodeX) / 2;
    const meterY = height - 60;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(meterX - 60, meterY - 24, 120, 48);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(meterX - 60, meterY - 24, 120, 48);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "JetBrains Mono"';
    ctx.fillText(`${state.currentEMAFlow.toFixed(2)} μA`, meterX, meterY + 5);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono"';
    ctx.fillText('Photocurrent (I)', meterX, meterY - 30);
  },
};

// ==========================================
// 20. Radioactive Decay Stochastic Simulator
// ==========================================
export interface Nucleus {
  x: number;
  y: number;
  decayed: boolean;
  decayTime: number | null;
}

export interface DecayState {
  nuclei: Nucleus[];
  remainingCount: number;
  time: number;
  history: { t: number; count: number; theoretical: number }[];
}

export const radioactiveDecayEngine: SimulationEngine<DecayState> = {
  init: () => {
    const totalNuclei = 500;
    const nuclei: Nucleus[] = [];
    const cols = 25;
    const rows = 20;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        nuclei.push({
          x: c,
          y: r,
          decayed: false,
          decayTime: null,
        });
      }
    }

    return {
      nuclei,
      remainingCount: totalNuclei,
      time: 0,
      history: [{ t: 0, count: totalNuclei, theoretical: totalNuclei }],
    };
  },

  update: (state, dt, params, helper) => {
    const halfLife = params.halfLife || 4.0; // seconds
    const lambda = Math.LN2 / halfLife; // decay constant
    const time = state.time + dt;

    // Stochastic Poisson decay check for each undecayed nucleus
    // P = 1 - exp(-lambda * dt)
    const decayProb = 1 - Math.exp(-lambda * dt);
    let newlyDecayed = 0;

    state.nuclei.forEach((n) => {
      if (!n.decayed && Math.random() < decayProb) {
        n.decayed = true;
        n.decayTime = time;
        newlyDecayed++;
      }
    });

    if (newlyDecayed > 0 && helper.audioEnabled) {
      physicsAudio.playGeigerClick();
    }

    const remaining = state.nuclei.filter((n) => !n.decayed).length;
    const theoreticalCount = 500 * Math.exp(-lambda * time);

    let history = state.history;
    if (history.length === 0 || time - history[history.length - 1].t >= 0.1) {
      history = [...history, { t: time, count: remaining, theoretical: theoreticalCount }];
    }

    return {
      state: {
        ...state,
        remainingCount: remaining,
        time,
        history,
      },
      telemetry: {
        remainingCount: remaining,
        decayedCount: 500 - remaining,
        halfLife,
        decayConstant: lambda,
        fractionRemaining: remaining / 500,
        theoreticalCount,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const gridOriginX = 50;
    const gridOriginY = 50;
    const cellSize = 13;
    const cols = 25;
    const rows = 20;

    // 1. Nuclei Lattice Grid
    state.nuclei.forEach((n) => {
      const px = gridOriginX + n.x * cellSize;
      const py = gridOriginY + n.y * cellSize;

      if (!n.decayed) {
        // Radioactive Parent Isotope (glowing cyan / amber)
        ctx.fillStyle = '#06b6d4';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        // Stable Daughter Isotope
        const isRecent = n.decayTime && state.time - n.decayTime < 0.2;
        if (isRecent) {
          // Decay flash burst
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });

    // Lattice frame
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(gridOriginX - 10, gridOriginY - 10, cols * cellSize + 8, rows * cellSize + 8);

    // 2. Real-Time Decay Curve Graph (on right side)
    const graphX = gridOriginX + cols * cellSize + 40;
    const graphY = 50;
    const graphW = width - graphX - 40;
    const graphH = rows * cellSize;

    ctx.fillStyle = '#050a14';
    ctx.fillRect(graphX, graphY, graphW, graphH);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(graphX, graphY, graphW, graphH);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText('Exponential Decay Curve: N(t) = N₀ e^(-λt)', graphX + 10, graphY + 18);

    // Plot theoretical line vs stochastic points
    if (state.history.length > 1) {
      const maxT = Math.max(12, state.time);

      // Theoretical curve (dashed green)
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let px = 0; px <= graphW - 20; px += 2) {
        const t = (px / (graphW - 20)) * maxT;
        const lambda = Math.LN2 / (simCtx.parameters.halfLife || 4.0);
        const thCount = 500 * Math.exp(-lambda * t);
        const py = graphY + graphH - 15 - (thCount / 500) * (graphH - 35);
        if (px === 0) ctx.moveTo(graphX + 10 + px, py);
        else ctx.lineTo(graphX + 10 + px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Experimental count line (solid cyan)
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      state.history.forEach((pt, idx) => {
        const px = graphX + 10 + (pt.t / maxT) * (graphW - 20);
        const py = graphY + graphH - 15 - (pt.count / 500) * (graphH - 35);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  },
};
