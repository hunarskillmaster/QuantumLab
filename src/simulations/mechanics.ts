/**
 * Mechanics & Dynamics Simulations:
 * 1. Projectile Motion with Air Resistance
 * 2. Double Pendulum (Chaos Simulation)
 * 3. Newton's Cradle
 * 4. Friction on an Inclined Plane
 * 5. Uniform Circular Motion & Centripetal Force
 */

import { SimulationEngine, SimulationContext } from '../types/physics';

// ==========================================
// 1. Projectile Motion with Air Resistance
// ==========================================
export interface ProjectileState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  time: number;
  trajectory: { x: number; y: number }[];
  idealTrajectory: { x: number; y: number }[];
  maxHeight: number;
  range: number;
  isLanded: boolean;
  totalFlightTime: number;
}

export const projectileEngine: SimulationEngine<ProjectileState> = {
  init: (params) => {
    const angleRad = (params.angle * Math.PI) / 180;
    const v0 = params.velocity;
    const vx0 = v0 * Math.cos(angleRad);
    const vy0 = v0 * Math.sin(angleRad);

    // Calculate ideal trajectory (vacuum) for comparison
    const g = params.gravity || 9.81;
    const idealTrajectory: { x: number; y: number }[] = [];
    const tFlight = (2 * vy0) / g;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const t = (tFlight * i) / steps;
      idealTrajectory.push({
        x: vx0 * t,
        y: Math.max(0, vy0 * t - 0.5 * g * t * t),
      });
    }

    return {
      x: 0,
      y: 0,
      vx: vx0,
      vy: vy0,
      time: 0,
      trajectory: [{ x: 0, y: 0 }],
      idealTrajectory,
      maxHeight: 0,
      range: 0,
      isLanded: false,
      totalFlightTime: 0,
    };
  },

  update: (state, dt, params, helper) => {
    if (state.isLanded) {
      return {
        state,
        telemetry: {
          x: state.range,
          y: 0,
          vx: 0,
          vy: 0,
          speed: 0,
          maxHeight: state.maxHeight,
          ke: 0,
          pe: 0,
        },
      };
    }

    const g = params.gravity || 9.81;
    const m = params.mass || 1.0;
    const cd = params.dragCoeff || 0.15;
    const rho = 1.225; // kg/m^3 air density
    const area = 0.05; // cross-sectional area
    const k = 0.5 * cd * rho * area;

    // Sub-stepping for accurate ballistic integration
    const subSteps = 4;
    const subDt = dt / subSteps;
    let x = state.x;
    let y = state.y;
    let vx = state.vx;
    let vy = state.vy;
    let t = state.time;
    let landed = false;

    for (let s = 0; s < subSteps; s++) {
      const v = Math.sqrt(vx * vx + vy * vy);
      const dragForce = k * v * v;
      const ax = -(dragForce * (vx / (v || 1))) / m;
      const ay = -g - (dragForce * (vy / (v || 1))) / m;

      vx += ax * subDt;
      vy += ay * subDt;
      x += vx * subDt;
      y += vy * subDt;
      t += subDt;

      if (y <= 0 && t > 0.05) {
        y = 0;
        landed = true;
        if (helper.audioEnabled && helper.playSound) {
          helper.playSound('click', 400);
        }
        break;
      }
    }

    const newTraj = [...state.trajectory];
    if (newTraj.length < 1500) {
      newTraj.push({ x, y });
    }

    const maxHeight = Math.max(state.maxHeight, y);
    const speed = Math.sqrt(vx * vx + vy * vy);
    const ke = 0.5 * m * speed * speed;
    const pe = m * g * y;

    const newState: ProjectileState = {
      ...state,
      x,
      y,
      vx: landed ? 0 : vx,
      vy: landed ? 0 : vy,
      time: t,
      trajectory: newTraj,
      maxHeight,
      range: landed ? x : state.range,
      isLanded: landed,
      totalFlightTime: landed ? t : 0,
    };

    return {
      state: newState,
      telemetry: {
        x,
        y,
        vx,
        vy,
        speed,
        maxHeight,
        ke,
        pe,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const groundY = height - 60;
    const originX = 60;

    // Dynamic scale based on parameters
    const maxEstRange = 150;
    const scale = Math.min((width - 120) / maxEstRange, (groundY - 60) / 70);

    // Coordinate grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= maxEstRange; x += 25) {
      const px = originX + x * scale;
      ctx.beginPath();
      ctx.moveTo(px, 30);
      ctx.lineTo(px, groundY);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(`${x}m`, px - 10, groundY + 16);
    }

    for (let y = 0; y <= 60; y += 15) {
      const py = groundY - y * scale;
      ctx.beginPath();
      ctx.moveTo(originX, py);
      ctx.lineTo(width - 40, py);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(`${y}m`, originX - 35, py + 3);
    }

    // Ground
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundY, width, height - groundY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();

    // Ideal (vacuum) trajectory (dashed line)
    if (state.idealTrajectory.length > 1) {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      state.idealTrajectory.forEach((p, idx) => {
        const px = originX + p.x * scale;
        const py = groundY - p.y * scale;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Actual trajectory with air resistance
    if (state.trajectory.length > 1) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      state.trajectory.forEach((p, idx) => {
        const px = originX + p.x * scale;
        const py = groundY - p.y * scale;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Current projectile position
    const curX = originX + state.x * scale;
    const curY = groundY - state.y * scale;

    // Cannon at origin
    const angleRad = (simCtx.parameters.angle * Math.PI) / 180;
    const barrelLen = 30;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(originX, groundY);
    ctx.lineTo(originX + Math.cos(angleRad) * barrelLen, groundY - Math.sin(angleRad) * barrelLen);
    ctx.stroke();

    // Projectile ball
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Velocity vector arrow
    if (!state.isLanded) {
      const vScale = 0.8;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(curX, curY);
      ctx.lineTo(curX + state.vx * vScale, curY - state.vy * vScale);
      ctx.stroke();
    }

    // Peak height marker
    if (state.maxHeight > 0) {
      const peakY = groundY - state.maxHeight * scale;
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(originX, peakY);
      ctx.lineTo(curX, peakY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText(`Max H: ${state.maxHeight.toFixed(1)}m`, originX + 5, peakY - 4);
    }
  },
};

// ==========================================
// 2. Double Pendulum (Chaos Simulation)
// ==========================================
export interface DoublePendulumState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
  trace: { x: number; y: number }[];
  phaseSpace: { theta: number; omega: number }[];
}

export const doublePendulumEngine: SimulationEngine<DoublePendulumState> = {
  init: (params) => {
    const t1 = (params.theta1 * Math.PI) / 180;
    const t2 = (params.theta2 * Math.PI) / 180;
    return {
      theta1: t1,
      theta2: t2,
      omega1: 0,
      omega2: 0,
      trace: [],
      phaseSpace: [],
    };
  },

  update: (state, dt, params) => {
    const g = params.gravity || 9.81;
    const m1 = params.m1 || 1.0;
    const m2 = params.m2 || 1.0;
    const l1 = params.l1 || 1.0;
    const l2 = params.l2 || 1.0;
    const damping = 0.9999; // almost frictionless for chaotic beauty

    // RK4 integration for double pendulum equations of motion
    const derivatives = (th1: number, th2: number, w1: number, w2: number) => {
      const delta = th1 - th2;
      const den1 = l1 * (2 * m1 + m2 - m2 * Math.cos(2 * th1 - 2 * th2));
      const num1 =
        -g * (2 * m1 + m2) * Math.sin(th1) -
        m2 * g * Math.sin(th1 - 2 * th2) -
        2 * Math.sin(delta) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(delta));
      const alpha1 = num1 / den1;

      const den2 = l2 * (2 * m1 + m2 - m2 * Math.cos(2 * th1 - 2 * th2));
      const num2 =
        2 *
        Math.sin(delta) *
        (w1 * w1 * l1 * (m1 + m2) +
          g * (m1 + m2) * Math.cos(th1) +
          w2 * w2 * l2 * m2 * Math.cos(delta));
      const alpha2 = num2 / den2;

      return { dth1: w1, dth2: w2, dw1: alpha1, dw2: alpha2 };
    };

    // Sub-step RK4
    const steps = 10;
    const h = dt / steps;
    let { theta1, theta2, omega1, omega2 } = state;

    for (let i = 0; i < steps; i++) {
      const k1 = derivatives(theta1, theta2, omega1, omega2);
      const k2 = derivatives(
        theta1 + 0.5 * h * k1.dth1,
        theta2 + 0.5 * h * k1.dth2,
        omega1 + 0.5 * h * k1.dw1,
        omega2 + 0.5 * h * k1.dw2
      );
      const k3 = derivatives(
        theta1 + 0.5 * h * k2.dth1,
        theta2 + 0.5 * h * k2.dth2,
        omega1 + 0.5 * h * k2.dw1,
        omega2 + 0.5 * h * k2.dw2
      );
      const k4 = derivatives(
        theta1 + h * k3.dth1,
        theta2 + h * k3.dth2,
        omega1 + h * k3.dw1,
        omega2 + h * k3.dw2
      );

      theta1 += (h / 6) * (k1.dth1 + 2 * k2.dth1 + 2 * k3.dth1 + k4.dth1);
      theta2 += (h / 6) * (k1.dth2 + 2 * k2.dth2 + 2 * k3.dth2 + k4.dth2);
      omega1 = (omega1 + (h / 6) * (k1.dw1 + 2 * k2.dw1 + 2 * k3.dw1 + k4.dw1)) * damping;
      omega2 = (omega2 + (h / 6) * (k1.dw2 + 2 * k2.dw2 + 2 * k3.dw2 + k4.dw2)) * damping;
    }

    // Keep angle representation normalized
    theta1 = ((theta1 + Math.PI) % (2 * Math.PI)) - Math.PI;
    theta2 = ((theta2 + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Calculate position of bob 2
    const x1 = l1 * Math.sin(theta1);
    const y1 = l1 * Math.cos(theta1);
    const x2 = x1 + l2 * Math.sin(theta2);
    const y2 = y1 + l2 * Math.cos(theta2);

    const newTrace = [...state.trace];
    if (newTrace.length > 500) newTrace.shift();
    newTrace.push({ x: x2, y: y2 });

    const newPhase = [...state.phaseSpace];
    if (newPhase.length > 400) newPhase.shift();
    newPhase.push({ theta: theta1, omega: omega1 });

    // Total energy: T + V
    const v1sq = l1 * l1 * omega1 * omega1;
    const v2sq =
      v1sq +
      l2 * l2 * omega2 * omega2 +
      2 * l1 * l2 * omega1 * omega2 * Math.cos(theta1 - theta2);
    const ke = 0.5 * m1 * v1sq + 0.5 * m2 * v2sq;
    const pe = -(m1 + m2) * g * l1 * Math.cos(theta1) - m2 * g * l2 * Math.cos(theta2);
    const totalE = ke + pe;

    return {
      state: {
        theta1,
        theta2,
        omega1,
        omega2,
        trace: newTrace,
        phaseSpace: newPhase,
      },
      telemetry: {
        theta1: (theta1 * 180) / Math.PI,
        omega1,
        theta2: (theta2 * 180) / Math.PI,
        omega2,
        ke,
        pe,
        totalE,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const pivotX = width * 0.42;
    const pivotY = height * 0.35;
    const scale = Math.min(width, height) * 0.22;

    const l1 = simCtx.parameters.l1 || 1.0;
    const l2 = simCtx.parameters.l2 || 1.0;

    const x1 = pivotX + l1 * scale * Math.sin(state.theta1);
    const y1 = pivotY + l1 * scale * Math.cos(state.theta1);
    const x2 = x1 + l2 * scale * Math.sin(state.theta2);
    const y2 = y1 + l2 * scale * Math.cos(state.theta2);

    // Glowing chaotic trace path
    if (state.trace.length > 1) {
      for (let i = 1; i < state.trace.length; i++) {
        const p0 = state.trace[i - 1];
        const p1 = state.trace[i];
        const alpha = i / state.trace.length;
        ctx.strokeStyle = `rgba(236, 72, 153, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pivotX + p0.x * scale, pivotY + p0.y * scale);
        ctx.lineTo(pivotX + p1.x * scale, pivotY + p1.y * scale);
        ctx.stroke();
      }
    }

    // Pivot mount
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Rod 1
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    // Bob 1
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x1, y1, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Rod 2
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Bob 2 (Chaotic Tip)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(x2, y2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inset: Phase Space Portrait (theta1 vs omega1)
    const insetX = width - 160;
    const insetY = 20;
    const insetW = 140;
    const insetH = 140;

    ctx.fillStyle = 'rgba(5, 10, 20, 0.85)';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.fillRect(insetX, insetY, insetW, insetH);
    ctx.strokeRect(insetX, insetY, insetW, insetH);

    // Axes
    ctx.strokeStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(insetX + insetW / 2, insetY);
    ctx.lineTo(insetX + insetW / 2, insetY + insetH);
    ctx.moveTo(insetX, insetY + insetH / 2);
    ctx.lineTo(insetX + insetW, insetY + insetH / 2);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px "JetBrains Mono"';
    ctx.fillText('Phase Space (θ₁ vs ω₁)', insetX + 8, insetY + 12);

    if (state.phaseSpace.length > 1) {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      state.phaseSpace.forEach((pt, idx) => {
        const px = insetX + insetW / 2 + (pt.theta / Math.PI) * (insetW * 0.45);
        const py = insetY + insetH / 2 - (pt.omega / 15) * (insetH * 0.45);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  },
};

// ==========================================
// 3. Newton's Cradle
// ==========================================
export interface CradleBall {
  x: number;
  vx: number;
  angle: number;
  omega: number;
  mass: number;
  isDragged?: boolean;
}

export interface CradleState {
  balls: CradleBall[];
  pulledIndex: number | null;
}

export const newtonsCradleEngine: SimulationEngine<CradleState> = {
  init: (params) => {
    const count = Math.round(params.ballCount || 5);
    const balls: CradleBall[] = [];
    for (let i = 0; i < count; i++) {
      balls.push({
        x: 0,
        vx: 0,
        angle: i === 0 ? -0.5 : 0, // pull first ball back slightly initially
        omega: 0,
        mass: 1.0,
      });
    }
    return { balls, pulledIndex: null };
  },

  update: (state, dt, params, helper) => {
    const count = Math.round(params.ballCount || 5);
    let balls = state.balls;

    // Adjust ball count if parameter changed
    if (balls.length !== count) {
      balls = [];
      for (let i = 0; i < count; i++) {
        balls.push({
          x: 0,
          vx: 0,
          angle: 0,
          omega: 0,
          mass: 1.0,
        });
      }
    }

    const g = 9.81;
    const l = 0.8; // chord length in meters
    const radius = 0.05; // ball radius in meters
    const spacing = radius * 2;
    const restitution = params.elasticity !== undefined ? params.elasticity : 0.99;
    const damping = 0.9995;

    // Sub-stepping for collision physics
    const subSteps = 10;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      // 1. Update pendulum motion for each un-dragged ball
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];
        if (b.isDragged) continue;

        // Pendulum equation: alpha = -(g/l) * sin(theta)
        const alpha = -(g / l) * Math.sin(b.angle);
        b.omega = (b.omega + alpha * subDt) * damping;
        b.angle += b.omega * subDt;
        b.vx = b.omega * l;
      }

      // 2. Detect collisions between adjacent balls along horizontal arc
      for (let i = 0; i < balls.length - 1; i++) {
        const b1 = balls[i];
        const b2 = balls[i + 1];

        // Horizontal displacement in meters:
        // Position of ball i is (i * spacing) + l * sin(angle_i)
        const pos1 = i * spacing + l * Math.sin(b1.angle);
        const pos2 = (i + 1) * spacing + l * Math.sin(b2.angle);

        if (pos1 + radius * 2 > pos2) {
          // Collision occurred!
          const v1 = b1.omega * l;
          const v2 = b2.omega * l;

          if (v1 > v2) {
            // 1D elastic momentum transfer:
            const m1 = b1.mass;
            const m2 = b2.mass;
            const newV1 = ((m1 - restitution * m2) * v1 + (1 + restitution) * m2 * v2) / (m1 + m2);
            const newV2 = ((1 + restitution) * m1 * v1 + (m2 - restitution * m1) * v2) / (m1 + m2);

            b1.omega = newV1 / l;
            b2.omega = newV2 / l;

            // Separate slightly to prevent overlap stickiness
            const overlap = (pos1 + radius * 2 - pos2) / l;
            b1.angle -= overlap * 0.5;
            b2.angle += overlap * 0.5;

            if (helper.audioEnabled && helper.playSound && Math.abs(v1 - v2) > 0.05) {
              const impactPitch = 900 + Math.min(600, Math.abs(v1 - v2) * 200);
              helper.playSound('click', impactPitch);
            }
          }
        }
      }
    }

    // Telemetry: Total Kinetic + Potential Energy, Momentum
    let totalKE = 0;
    let totalPE = 0;
    let totalP = 0;
    balls.forEach((b) => {
      const v = b.omega * l;
      const h = l * (1 - Math.cos(b.angle));
      totalKE += 0.5 * b.mass * v * v;
      totalPE += b.mass * g * h;
      totalP += b.mass * v;
    });

    return {
      state: { ...state, balls },
      telemetry: {
        totalKE,
        totalPE,
        totalEnergy: totalKE + totalPE,
        totalP,
        firstAngle: (balls[0]?.angle * 180) / Math.PI || 0,
        lastAngle: (balls[balls.length - 1]?.angle * 180) / Math.PI || 0,
      },
    };
  },

  onPointerDown: (x, y, state, width, height) => {
    const lPx = height * 0.45;
    const rPx = 22;
    const startX = width / 2 - ((state.balls.length - 1) * rPx * 2) / 2;
    const topY = height * 0.25;

    for (let i = 0; i < state.balls.length; i++) {
      const b = state.balls[i];
      const pivotX = startX + i * rPx * 2;
      const ballX = pivotX + lPx * Math.sin(b.angle);
      const ballY = topY + lPx * Math.cos(b.angle);
      const dist = Math.hypot(x - ballX, y - ballY);
      if (dist < rPx * 1.5) {
        b.isDragged = true;
        b.omega = 0;
        state.pulledIndex = i;
        break;
      }
    }
  },

  onPointerMove: (x, y, state, width, height) => {
    if (state.pulledIndex === null) return;
    const b = state.balls[state.pulledIndex];
    if (!b || !b.isDragged) return;

    const rPx = 22;
    const startX = width / 2 - ((state.balls.length - 1) * rPx * 2) / 2;
    const pivotX = startX + state.pulledIndex * rPx * 2;
    const topY = height * 0.25;

    const dx = x - pivotX;
    const dy = Math.max(10, y - topY);
    b.angle = Math.max(-1.1, Math.min(1.1, Math.atan2(dx, dy)));
    b.omega = 0;
  },

  onPointerUp: (_x, _y, state) => {
    state.balls.forEach((b) => {
      b.isDragged = false;
    });
    state.pulledIndex = null;
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const topY = height * 0.25;
    const chordLen = height * 0.45;
    const ballRadius = 22;
    const count = state.balls.length;
    const startX = width / 2 - ((count - 1) * ballRadius * 2) / 2;

    // Overhead top suspension bar
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX - 40, topY);
    ctx.lineTo(startX + (count - 1) * ballRadius * 2 + 40, topY);
    ctx.stroke();

    state.balls.forEach((b, i) => {
      const pivotX = startX + i * ballRadius * 2;
      const ballX = pivotX + chordLen * Math.sin(b.angle);
      const ballY = topY + chordLen * Math.cos(b.angle);

      // Strings (dual V suspension)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pivotX - 6, topY);
      ctx.lineTo(ballX, ballY);
      ctx.moveTo(pivotX + 6, topY);
      ctx.lineTo(ballX, ballY);
      ctx.stroke();

      // Steel sphere with radial metallic specular highlight
      const grad = ctx.createRadialGradient(
        ballX - ballRadius * 0.35,
        ballY - ballRadius * 0.35,
        2,
        ballX,
        ballY,
        ballRadius
      );
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#cbd5e1');
      grad.addColorStop(0.7, '#64748b');
      grad.addColorStop(1, '#1e293b');

      ctx.fillStyle = grad;
      ctx.shadowColor = b.isDragged ? '#38bdf8' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = b.isDragged ? 12 : 6;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball index number
      ctx.fillStyle = '#0f172a';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(`${i + 1}`, ballX, ballY + 4);
    });

    // Helper hint
    ctx.fillStyle = '#64748b';
    ctx.font = '12px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText('Drag any steel sphere to displace & release', width / 2, height - 30);
  },
};

// ==========================================
// 4. Friction on an Inclined Plane
// ==========================================
export interface InclinedPlaneState {
  s: number; // distance along ramp
  v: number;
  a: number;
  isSliding: boolean;
  time: number;
}

export const inclinedPlaneEngine: SimulationEngine<InclinedPlaneState> = {
  init: () => ({
    s: 0,
    v: 0,
    a: 0,
    isSliding: false,
    time: 0,
  }),

  update: (state, dt, params) => {
    const angleRad = (params.angle * Math.PI) / 180;
    const g = params.gravity || 9.81;
    const m = params.mass || 2.0;
    const muS = params.muStatic !== undefined ? params.muStatic : 0.4;
    const muK = params.muKinetic !== undefined ? params.muKinetic : 0.25;
    const rampLength = 10; // 10 meters

    const fParallel = m * g * Math.sin(angleRad);
    const normalForce = m * g * Math.cos(angleRad);
    const maxStaticFriction = muS * normalForce;

    let a = 0;
    let v = state.v;
    let s = state.s;
    let sliding = state.isSliding;

    if (!sliding) {
      if (fParallel > maxStaticFriction) {
        sliding = true;
      }
    }

    if (sliding) {
      const frictionKinetic = muK * normalForce;
      const netForce = fParallel - frictionKinetic;
      a = Math.max(0, netForce / m);
      v += a * dt;
      s += v * dt;

      if (s >= rampLength) {
        s = rampLength;
        v = 0;
        a = 0;
      }
    }

    return {
      state: {
        s,
        v,
        a,
        isSliding: sliding,
        time: state.time + dt,
      },
      telemetry: {
        distance: s,
        velocity: v,
        acceleration: a,
        normalForce,
        fParallel,
        frictionForce: sliding ? muK * normalForce : fParallel,
        workDone: (muK * normalForce) * s,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const angleRad = (simCtx.parameters.angle * Math.PI) / 180;
    const rampLengthPx = Math.min(width * 0.65, height * 0.7);

    const originX = width * 0.2;
    const originY = height * 0.8;

    const topX = originX + rampLengthPx * Math.cos(angleRad);
    const topY = originY - rampLengthPx * Math.sin(angleRad);

    // Ramp wedge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(topX, topY);
    ctx.lineTo(topX, originY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Angle indicator arc
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(originX, originY, 40, -angleRad, 0);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px "JetBrains Mono"';
    ctx.fillText(`${simCtx.parameters.angle.toFixed(1)}°`, originX + 50, originY - 10);

    // Block position along ramp (sliding from top to bottom)
    const normDist = state.s / 10; // ramp is 10m
    const blockCenterDist = rampLengthPx * (1 - normDist);
    const bx = originX + blockCenterDist * Math.cos(angleRad);
    const by = originY - blockCenterDist * Math.sin(angleRad);

    const bSize = 34;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(-angleRad);

    // Block
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillRect(-bSize / 2, -bSize, bSize, bSize);
    ctx.strokeRect(-bSize / 2, -bSize, bSize, bSize);

    // Normal force vector (upward perpendicular)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -bSize / 2);
    ctx.lineTo(0, -bSize / 2 - 45);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText('N', 4, -bSize / 2 - 45);

    // Friction force vector (pointing up the ramp)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(35, 0);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.fillText('f_r', 40, -2);

    ctx.restore();

    // Gravity vector (straight down from block center)
    ctx.save();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(bx, by - bSize / 2);
    ctx.lineTo(bx, by - bSize / 2 + 50);
    ctx.stroke();
    ctx.fillStyle = '#eab308';
    ctx.font = '10px "JetBrains Mono"';
    ctx.fillText('F_g = mg', bx + 6, by - bSize / 2 + 50);
    ctx.restore();
  },
};

// ==========================================
// 5. Uniform Circular Motion & Centripetal Force
// ==========================================
export interface CircularMotionState {
  angle: number;
  omega: number;
  radius: number;
  isCut: boolean;
  cutPos: { x: number; y: number } | null;
  cutVel: { vx: number; vy: number } | null;
  trail: { x: number; y: number }[];
}

export const circularMotionEngine: SimulationEngine<CircularMotionState> = {
  init: (params) => ({
    angle: 0,
    omega: params.speed / params.radius,
    radius: params.radius,
    isCut: false,
    cutPos: null,
    cutVel: null,
    trail: [],
  }),

  update: (state, dt, params) => {
    const r = params.radius || 2.0;
    const v = params.speed || 5.0;
    const m = params.mass || 1.0;
    const omega = v / r;

    let { angle, isCut, cutPos, cutVel, trail } = state;

    if (params.cutString && !isCut) {
      isCut = true;
      const cx = r * Math.cos(angle);
      const cy = r * Math.sin(angle);
      cutPos = { x: cx, y: cy };
      cutVel = { vx: -v * Math.sin(angle), vy: v * Math.cos(angle) };
    } else if (!params.cutString && isCut) {
      isCut = false;
      cutPos = null;
      cutVel = null;
    }

    if (!isCut) {
      angle += omega * dt;
      const cx = r * Math.cos(angle);
      const cy = r * Math.sin(angle);
      trail.push({ x: cx, y: cy });
      if (trail.length > 80) trail.shift();
    } else if (cutPos && cutVel) {
      cutPos.x += cutVel.vx * dt;
      cutPos.y += cutVel.vy * dt;
      trail.push({ x: cutPos.x, y: cutPos.y });
      if (trail.length > 80) trail.shift();
    }

    const ac = (v * v) / r;
    const tension = isCut ? 0 : m * ac;
    const period = (2 * Math.PI) / (omega || 1);

    return {
      state: {
        angle,
        omega,
        radius: r,
        isCut,
        cutPos,
        cutVel,
        trail,
      },
      telemetry: {
        v,
        omega,
        ac,
        tension,
        period,
        radius: r,
      },
    };
  },

  render: (ctx, state, simCtx) => {
    const { width, height } = simCtx;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = 50; // px per meter

    const rPx = state.radius * scale;

    // Circular orbit guide
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Trail
    if (state.trail.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      state.trail.forEach((p, idx) => {
        const px = centerX + p.x * scale;
        const py = centerY + p.y * scale;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    let massX = centerX + rPx * Math.cos(state.angle);
    let massY = centerY + rPx * Math.sin(state.angle);

    if (state.isCut && state.cutPos) {
      massX = centerX + state.cutPos.x * scale;
      massY = centerY + state.cutPos.y * scale;
    }

    // Tether string
    if (!state.isCut) {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(massX, massY);
      ctx.stroke();
    }

    // Center pivot
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Mass bob
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(massX, massY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Vectors
    if (!state.isCut) {
      const v = simCtx.parameters.speed || 5.0;
      // Velocity vector (tangential)
      const vx = -v * 5 * Math.sin(state.angle);
      const vy = v * 5 * Math.cos(state.angle);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(massX, massY);
      ctx.lineTo(massX + vx, massY + vy);
      ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '10px "JetBrains Mono"';
      ctx.fillText('v (tangential)', massX + vx + 4, massY + vy);

      // Centripetal acceleration / tension (radial inward)
      const ax = -25 * Math.cos(state.angle);
      const ay = -25 * Math.sin(state.angle);
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(massX, massY);
      ctx.lineTo(massX + ax, massY + ay);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.fillText('a_c (radial)', massX + ax - 10, massY + ay - 6);
    }
  },
};
