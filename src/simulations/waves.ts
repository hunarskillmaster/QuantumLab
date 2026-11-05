/**
 * Waves & Optics Simulations:
 * 6. Double-Slit Interference Pattern
 * 7. Standing Waves & Harmonic Resonance
 * 8. Snell's Law & Prism Refraction
 * 9. Doppler Sound Effect
 * 10. Thin Film Interference
 */

import { SimulationEngine } from '../types/physics';
import { physicsAudio } from '../utils/audio';

// ==========================================
// 6. Double-Slit Interference Pattern
// ==========================================
export interface DoubleSlitState {
  time: number;
}

export const doubleSlitEngine: SimulationEngine<DoubleSlitState> = {
  init: () => ({ time: 0 }),

  update: (state, dt, params) => {
    const lambdaNm = params.wavelength || 500; // nm
    const dUm = params.slitDistance || 15; // micrometers
    const Dm = params.screenDist || 1.2; // meters
    const lambda = lambdaNm * 1e-9;
    const d = dUm * 1e-6;
    const fringeWidthMm = (lambda * Dm) / d * 1000;

    return {
      state: { time: state.time + dt },
      telemetry: {
        fringeWidth: fringeWidthMm,
        wavelength: lambdaNm,
        slitDistance: dUm,
        screenDist: Dm,
        firstMaxAngle: Math.asin(Math.min(1, lambda / d)) * (180 / Math.PI),
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const slitX = width * 0.28;
    const screenX = width * 0.78;
    const centerY = height / 2;

    const dPx = (parameters.slitDistance || 15) * 1.8;
    const slit1Y = centerY - dPx / 2;
    const slit2Y = centerY + dPx / 2;
    const lambdaPx = (parameters.wavelength || 500) / 35;

    // 1. Double slit barrier
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    // Top wall
    ctx.beginPath();
    ctx.moveTo(slitX, 0);
    ctx.lineTo(slitX, slit1Y - 6);
    ctx.stroke();
    // Center wall
    ctx.beginPath();
    ctx.moveTo(slitX, slit1Y + 6);
    ctx.lineTo(slitX, slit2Y - 6);
    ctx.stroke();
    // Bottom wall
    ctx.beginPath();
    ctx.moveTo(slitX, slit2Y + 6);
    ctx.lineTo(slitX, height);
    ctx.stroke();

    // 2. Coherent incoming planar wavefronts
    const waveSpeed = 60;
    const phase = (state.time * waveSpeed) % lambdaPx;
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 2;
    for (let x = phase; x < slitX; x += lambdaPx) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // 3. Propagating circular wavefronts from the two slits
    const maxRadius = screenX - slitX;
    const numRings = Math.floor(maxRadius / lambdaPx);
    for (let i = 0; i < numRings; i++) {
      const r = (i * lambdaPx + phase) % maxRadius;
      const alpha = Math.max(0, 0.5 - (r / maxRadius) * 0.45);
      ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
      ctx.lineWidth = 1.5;

      // Slit 1 wavefront
      ctx.beginPath();
      ctx.arc(slitX, slit1Y, r, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();

      // Slit 2 wavefront
      ctx.beginPath();
      ctx.arc(slitX, slit2Y, r, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
    }

    // 4. Detection Screen
    ctx.fillStyle = '#020617';
    ctx.fillRect(screenX, 20, 16, height - 40);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX, 20, 16, height - 40);

    // 5. Detection Intensity Graph (on right side)
    const graphW = width - screenX - 30;
    const graphOriginX = screenX + 24;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText('Intensity I(y)', graphOriginX + 5, 30);

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();

    const lambda = (parameters.wavelength || 500) * 1e-9;
    const d = (parameters.slitDistance || 15) * 1e-6;
    const D = parameters.screenDist || 1.2;

    for (let y = 30; y <= height - 30; y += 2) {
      const distFromCenterY = (y - centerY) * 0.001; // meters
      // Phase difference beta = pi * d * y / (lambda * D)
      const beta = (Math.PI * d * distFromCenterY) / (lambda * D);
      const intensity = Math.pow(Math.cos(beta), 2);

      // Slit diffraction envelope
      const alpha = (Math.PI * 2e-6 * distFromCenterY) / (lambda * D);
      const envelope = alpha === 0 ? 1 : Math.pow(Math.sin(alpha) / alpha, 2);
      const finalI = intensity * envelope;

      const px = graphOriginX + finalI * graphW * 0.85;
      if (y === 30) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);

      // Screen glow pattern
      const screenColorAlpha = Math.max(0, finalI);
      ctx.fillStyle = `rgba(6, 182, 212, ${screenColorAlpha * 0.9})`;
      ctx.fillRect(screenX + 2, y, 12, 2);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  },
};

// ==========================================
// 7. Standing Waves & Harmonic Resonance
// ==========================================
export interface StandingWaveState {
  time: number;
}

export const standingWaveEngine: SimulationEngine<StandingWaveState> = {
  init: () => ({ time: 0 }),

  update: (state, dt, params) => {
    const tension = params.tension || 100; // N
    const mu = params.density || 0.01; // kg/m
    const length = params.length || 1.0; // m
    const n = Math.round(params.harmonic || 2); // harmonic mode
    const v = Math.sqrt(tension / mu);
    const wavelength = (2 * length) / n;
    const freq = v / wavelength;

    return {
      state: { time: state.time + dt },
      telemetry: {
        waveSpeed: v,
        frequency: freq,
        wavelength,
        nodesCount: n + 1,
        antinodesCount: n,
        period: 1 / freq,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const tension = parameters.tension || 100;
    const mu = parameters.density || 0.01;
    const length = parameters.length || 1.0;
    const n = Math.round(parameters.harmonic || 2);

    const v = Math.sqrt(tension / mu);
    const wavelength = (2 * length) / n;
    const freq = v / wavelength;
    const omega = 2 * Math.PI * freq;

    const startX = 80;
    const endX = width - 80;
    const stringW = endX - startX;
    const centerY = height / 2;
    const ampPx = Math.min(65, height * 0.22);

    // Baseline axis
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, centerY);
    ctx.lineTo(endX, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Envelope outline (ghost lines showing maximum displacement)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= stringW; x += 3) {
      const xNorm = x / stringW;
      const envY = ampPx * Math.sin(n * Math.PI * xNorm);
      if (x === 0) ctx.moveTo(startX + x, centerY + envY);
      else ctx.lineTo(startX + x, centerY + envY);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let x = 0; x <= stringW; x += 3) {
      const xNorm = x / stringW;
      const envY = -ampPx * Math.sin(n * Math.PI * xNorm);
      if (x === 0) ctx.moveTo(startX + x, centerY + envY);
      else ctx.lineTo(startX + x, centerY + envY);
    }
    ctx.stroke();

    // Instantaneous standing wave: y(x, t) = 2A * sin(kx) * cos(omega * t)
    const timeFactor = Math.cos(omega * state.time * 0.35); // smooth time scaling
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    ctx.beginPath();

    for (let x = 0; x <= stringW; x += 2) {
      const xNorm = x / stringW;
      const yDisplacement = ampPx * Math.sin(n * Math.PI * xNorm) * timeFactor;
      const px = startX + x;
      const py = centerY + yDisplacement;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Nodes and Antinodes indicators
    for (let i = 0; i <= n; i++) {
      const nodeX = startX + (i / n) * stringW;
      // Fixed node point
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(nodeX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f87171';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`Node`, nodeX, centerY + 22);
    }

    for (let i = 0; i < n; i++) {
      const antinodeX = startX + ((i + 0.5) / n) * stringW;
      ctx.fillStyle = '#10b981';
      ctx.font = '9px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`Antinode`, antinodeX, centerY - ampPx - 10);
    }

    // Fixed clamps on both sides
    ctx.fillStyle = '#475569';
    ctx.fillRect(startX - 14, centerY - 40, 14, 80);
    ctx.fillRect(endX, centerY - 40, 14, 80);
  },
};

// ==========================================
// 8. Snell's Law & Prism Refraction
// ==========================================
export interface SnellPrismState {
  time: number;
}

export const snellPrismEngine: SimulationEngine<SnellPrismState> = {
  init: () => ({ time: 0 }),

  update: (state, dt, params) => {
    const n1 = params.n1 || 1.0; // Air
    const n2 = params.n2 || 1.5; // Glass / Crown
    const angleDeg = params.incidenceAngle || 45;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
    const sinTheta2 = (n1 / n2) * Math.sin(angleRad);
    const isTIR = sinTheta2 > 1.0;
    const theta2Deg = isTIR ? 90 : (Math.asin(sinTheta2) * 180) / Math.PI;
    const criticalAngleDeg = (Math.asin(Math.min(1, n2 / n1)) * 180) / Math.PI;

    return {
      state: { time: state.time + dt },
      telemetry: {
        theta1: angleDeg,
        theta2: theta2Deg,
        n1,
        n2,
        criticalAngle: criticalAngleDeg,
        isTIR: isTIR ? 1 : 0,
      },
    };
  },

  render: (ctx, _state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const isPrismMode = parameters.prismMode !== undefined ? parameters.prismMode === 1 : true;

    if (isPrismMode) {
      // Prism dispersion mode
      const prismSize = Math.min(width, height) * 0.45;
      const centerX = width * 0.5;
      const centerY = height * 0.55;

      // Triangular Prism geometry
      const pTop = { x: centerX, y: centerY - prismSize * 0.6 };
      const pLeft = { x: centerX - prismSize * 0.55, y: centerY + prismSize * 0.4 };
      const pRight = { x: centerX + prismSize * 0.55, y: centerY + prismSize * 0.4 };

      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Incident ray (white beam)
      const incY = centerY - 10;
      const hitLeftX = centerX - prismSize * 0.28;
      const hitLeftY = centerY - 10;

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(40, incY + 50);
      ctx.lineTo(hitLeftX, hitLeftY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cauchy spectral dispersion wavelengths
      const colors = [
        { name: 'Red', hex: '#ef4444', dev: 0.12 },
        { name: 'Orange', hex: '#f97316', dev: 0.16 },
        { name: 'Yellow', hex: '#eab308', dev: 0.2 },
        { name: 'Green', hex: '#10b981', dev: 0.24 },
        { name: 'Blue', hex: '#3b82f6', dev: 0.29 },
        { name: 'Violet', hex: '#a855f7', dev: 0.35 },
      ];

      // Inside prism rays and exiting dispersed rainbow
      colors.forEach((c) => {
        const exitX = centerX + prismSize * 0.25;
        const exitY = centerY + c.dev * 40;

        // Internal refracted ray
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hitLeftX, hitLeftY);
        ctx.lineTo(exitX, exitY);
        ctx.stroke();

        // Exiting dispersed spectral beam
        ctx.strokeStyle = c.hex;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = c.hex;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(exitX, exitY);
        ctx.lineTo(width - 50, exitY + (exitY - hitLeftY) * 1.8 + c.dev * 80);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText('Dispersive Triangular Prism (n(λ) = A + B/λ²)', centerX, centerY + prismSize * 0.55);
    } else {
      // Planar boundary interface mode
      const midY = height / 2;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, midY);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, midY, width, height - midY);

      // Interface line
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Normal dashed line
      const normX = width / 2;
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(normX, 40);
      ctx.lineTo(normX, height - 40);
      ctx.stroke();
      ctx.setLineDash([]);

      const n1 = parameters.n1 || 1.0;
      const n2 = parameters.n2 || 1.5;
      const angleRad = ((parameters.incidenceAngle || 45) * Math.PI) / 180;
      const rayLen = 160;

      // Incident ray in medium 1
      const incX = normX - rayLen * Math.sin(angleRad);
      const incY = midY - rayLen * Math.cos(angleRad);

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(incX, incY);
      ctx.lineTo(normX, midY);
      ctx.stroke();

      // Snell's calculation
      const sinTheta2 = (n1 / n2) * Math.sin(angleRad);
      if (sinTheta2 <= 1.0) {
        // Refraction into medium 2
        const theta2 = Math.asin(sinTheta2);
        const refX = normX + rayLen * Math.sin(theta2);
        const refY = midY + rayLen * Math.cos(theta2);

        ctx.strokeStyle = '#22d3ee';
        ctx.beginPath();
        ctx.moveTo(normX, midY);
        ctx.lineTo(refX, refY);
        ctx.stroke();
      } else {
        // Total internal reflection (TIR)
        const refX = normX + rayLen * Math.sin(angleRad);
        const refY = midY - rayLen * Math.cos(angleRad);

        ctx.strokeStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(normX, midY);
        ctx.lineTo(refX, refY);
        ctx.stroke();
      }
    }
  },
};

// ==========================================
// 9. Doppler Sound Effect
// ==========================================
export interface DopplerWave {
  centerX: number;
  centerY: number;
  radius: number;
  createdAt: number;
}

export interface DopplerState {
  sourceX: number;
  sourceY: number;
  observerX: number;
  observerY: number;
  waves: DopplerWave[];
  time: number;
  lastEmit: number;
}

export const dopplerEngine: SimulationEngine<DopplerState> = {
  init: (_params, width, height) => ({
    sourceX: 60,
    sourceY: height / 2,
    observerX: width * 0.75,
    observerY: height / 2,
    waves: [],
    time: 0,
    lastEmit: 0,
  }),

  update: (state, dt, params, helper) => {
    const c = 200; // sound speed (px/sec)
    const vs = (params.sourceSpeed || 0.6) * c; // source speed
    const baseFreq = params.frequency || 440; // Hz

    let { sourceX, observerX, waves, time, lastEmit } = state;
    time += dt;

    // Move source to the right, wrap around
    sourceX += vs * dt;
    if (sourceX > observerX + 250) {
      sourceX = 40;
    }

    // Emit new wave pulses at base frequency period
    const emitInterval = 0.08;
    if (time - lastEmit >= emitInterval) {
      waves.push({
        centerX: sourceX,
        centerY: state.sourceY,
        radius: 0,
        createdAt: time,
      });
      lastEmit = time;
    }

    // Expand waves
    waves.forEach((w) => {
      w.radius += c * dt;
    });
    // Remove waves that expanded past viewport
    waves = waves.filter((w) => w.radius < 900);

    // Calculate Doppler perceived frequency at observer:
    // f' = f0 * (c / (c - vs)) when source approaching observer
    const isApproaching = sourceX < observerX;
    const machNumber = vs / c;
    let perceivedFreq = baseFreq;

    if (isApproaching) {
      perceivedFreq = baseFreq / Math.max(0.05, 1 - machNumber);
    } else {
      perceivedFreq = baseFreq / (1 + machNumber);
    }

    // Real-time audio pitch update if audio enabled
    if (helper.audioEnabled) {
      physicsAudio.updateDopplerTone(perceivedFreq, true);
    } else {
      physicsAudio.stopDopplerTone();
    }

    return {
      state: {
        ...state,
        sourceX,
        waves,
        time,
        lastEmit,
      },
      telemetry: {
        perceivedFreq,
        baseFreq,
        machNumber,
        sourceVelocity: vs,
        soundSpeed: c,
        frequencyRatio: perceivedFreq / (baseFreq || 1),
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const c = 200;
    const vs = (simCtx.parameters.sourceSpeed || 0.6) * c;
    const isSupersonic = vs >= c;

    // Wave pulses
    state.waves.forEach((w) => {
      const alpha = Math.max(0, 0.6 - w.radius / 800);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w.centerX, w.centerY, w.radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Supersonic Mach Cone lines if vs >= c
    if (isSupersonic && vs > 0) {
      const machAngle = Math.asin(c / vs);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const coneLen = 600;
      ctx.beginPath();
      ctx.moveTo(state.sourceX, state.sourceY);
      ctx.lineTo(
        state.sourceX - coneLen * Math.cos(machAngle),
        state.sourceY - coneLen * Math.sin(machAngle)
      );
      ctx.moveTo(state.sourceX, state.sourceY);
      ctx.lineTo(
        state.sourceX - coneLen * Math.cos(machAngle),
        state.sourceY + coneLen * Math.sin(machAngle)
      );
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(
        `Mach Cone (θ = ${(machAngle * 180 / Math.PI).toFixed(1)}°)`,
        state.sourceX - 120,
        state.sourceY - 45
      );
    }

    // Moving sound source
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(state.sourceX, state.sourceY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Source', state.sourceX, state.sourceY - 16);

    // Stationary observer
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(state.observerX, state.observerY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#10b981';
    ctx.fillText('Observer', state.observerX, state.observerY - 16);
  },
};

// ==========================================
// 10. Thin Film Interference
// ==========================================
export interface ThinFilmState {
  time: number;
}

export const thinFilmEngine: SimulationEngine<ThinFilmState> = {
  init: () => ({ time: 0 }),

  update: (state, dt, params) => {
    const thicknessNm = params.thickness || 350; // nm
    const nFilm = params.nFilm || 1.33; // soap/water
    const angleDeg = params.angle || 30;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Optical path difference: Delta = 2 * n * d * cos(theta_r)
    const sinThetaR = (1.0 / nFilm) * Math.sin(angleRad);
    const cosThetaR = Math.sqrt(Math.max(0, 1 - sinThetaR * sinThetaR));
    const opdNm = 2 * nFilm * thicknessNm * cosThetaR;

    // Dominant constructive wavelength (with pi phase shift: 2 n d cos theta = (m + 0.5) lambda)
    const dominantWavelength = opdNm / 0.5;

    return {
      state: { time: state.time + dt },
      telemetry: {
        thickness: thicknessNm,
        nFilm,
        opd: opdNm,
        dominantWavelength: Math.min(750, Math.max(380, dominantWavelength)),
        reflectance: 0.85,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height, parameters } = simCtx;
    const thicknessNm = parameters.thickness || 350;
    const nFilm = parameters.nFilm || 1.33;
    const angleDeg = parameters.angle || 30;
    const angleRad = (angleDeg * Math.PI) / 180;

    const filmTopY = height * 0.42;
    const filmHeightPx = Math.min(100, (thicknessNm / 600) * 80 + 20);
    const filmBottomY = filmTopY + filmHeightPx;

    // Film medium rendering
    const grad = ctx.createLinearGradient(0, filmTopY, 0, filmBottomY);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    grad.addColorStop(0.5, 'rgba(168, 85, 247, 0.35)');
    grad.addColorStop(1, 'rgba(236, 72, 153, 0.25)');

    ctx.fillStyle = grad;
    ctx.fillRect(40, filmTopY, width - 80, filmHeightPx);

    // Film boundaries
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, filmTopY);
    ctx.lineTo(width - 40, filmTopY);
    ctx.stroke();

    ctx.strokeStyle = '#a855f7';
    ctx.beginPath();
    ctx.moveTo(40, filmBottomY);
    ctx.lineTo(width - 40, filmBottomY);
    ctx.stroke();

    // Ray tracing reflections
    const hitX = width * 0.35;
    const incLen = 120;

    // 1. Incident Ray
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hitX - incLen * Math.sin(angleRad), filmTopY - incLen * Math.cos(angleRad));
    ctx.lineTo(hitX, filmTopY);
    ctx.stroke();

    // 2. Ray 1: Reflected from top surface (with pi phase shift)
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(hitX, filmTopY);
    ctx.lineTo(hitX + incLen * Math.sin(angleRad), filmTopY - incLen * Math.cos(angleRad));
    ctx.stroke();

    // 3. Refracted Ray through film
    const sinR = (1.0 / nFilm) * Math.sin(angleRad);
    const cosR = Math.sqrt(Math.max(0, 1 - sinR * sinR));
    const bottomHitX = hitX + filmHeightPx * (sinR / cosR);

    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(hitX, filmTopY);
    ctx.lineTo(bottomHitX, filmBottomY);
    ctx.stroke();

    // 4. Ray 2: Reflected from bottom surface and exiting top
    const exitHitX = bottomHitX + filmHeightPx * (sinR / cosR);
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(bottomHitX, filmBottomY);
    ctx.lineTo(exitHitX, filmTopY);
    ctx.lineTo(exitHitX + incLen * Math.sin(angleRad), filmTopY - incLen * Math.cos(angleRad));
    ctx.stroke();

    // Color Swirl Preview Strip (Soap bubble iridescent effect)
    const previewY = height - 55;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, previewY, width - 80, 24);

    const numStrips = 50;
    const stripW = (width - 80) / numStrips;
    for (let i = 0; i < numStrips; i++) {
      const hue = ((i * 12 + thicknessNm * 0.8 + state.time * 20) % 360);
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fillRect(40 + i * stripW, previewY, stripW + 0.5, 24);
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'left';
    ctx.fillText('Iridescent Interference Color Strip', 42, previewY - 6);
  },
};
