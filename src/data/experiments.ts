/**
 * QuantumLab - Complete Master Catalog of the 20 Physics Experiments
 */

import { CategoryInfo, ExperimentDef, SimulationEngine } from '../types/physics';
import {
  projectileEngine,
  doublePendulumEngine,
  newtonsCradleEngine,
  inclinedPlaneEngine,
  circularMotionEngine,
} from '../simulations/mechanics';
import {
  doubleSlitEngine,
  standingWaveEngine,
  snellPrismEngine,
  dopplerEngine,
  thinFilmEngine,
} from '../simulations/waves';
import {
  dcCircuitEngine,
  electricFieldEngine,
  lorentzEngine,
  faradayEngine,
} from '../simulations/electromagnetism';
import {
  idealGasEngine,
  venturiEngine,
  heatDiffusionEngine,
} from '../simulations/thermodynamics';
import {
  keplerEngine,
  photoelectricEngine,
  radioactiveDecayEngine,
} from '../simulations/quantum';

export const PHYSICS_CATEGORIES: CategoryInfo[] = [
  {
    id: 'mechanics',
    name: 'Mechanics & Dynamics',
    tagline: 'Kinematics, forces, chaotic pendula & conservation laws',
    iconName: 'Compass',
  },
  {
    id: 'waves',
    name: 'Waves & Optics',
    tagline: 'Interference, refraction, resonance & acoustics',
    iconName: 'Activity',
  },
  {
    id: 'electromagnetism',
    name: 'Electromagnetism',
    tagline: 'Fields, circuits, Lorentz force & magnetic induction',
    iconName: 'Zap',
  },
  {
    id: 'thermodynamics',
    name: 'Thermodynamics & Fluids',
    tagline: 'Kinetic gas theory, fluid dynamics & heat diffusion',
    iconName: 'Flame',
  },
  {
    id: 'quantum',
    name: 'Quantum & Astrophysics',
    tagline: 'Celestial orbital mechanics, photons & nuclear decay',
    iconName: 'Atom',
  },
];

export const EXPERIMENTS: ExperimentDef[] = [
  // ==========================================
  // Category 1: Mechanics & Dynamics
  // ==========================================
  {
    id: 'projectile',
    category: 'mechanics',
    name: 'Projectile Motion with Air Resistance',
    subtitle: 'Quadratic aerodynamic drag & ballistic trajectory kinematics',
    description:
      'Models trajectory dynamics under quadratic drag F_d = 1/2 * C_d * rho * A * v^2 alongside gravitational acceleration, comparing vacuum parabolas against viscous air resistance.',
    parameters: [
      { id: 'angle', label: 'Launch Angle', unit: '°', min: 10, max: 85, step: 1, defaultValue: 45 },
      { id: 'velocity', label: 'Initial Speed (v₀)', unit: 'm/s', min: 10, max: 60, step: 1, defaultValue: 32 },
      { id: 'mass', label: 'Projectile Mass', unit: 'kg', min: 0.1, max: 10, step: 0.1, defaultValue: 1.0 },
      { id: 'dragCoeff', label: 'Drag Coeff (C_d)', min: 0.0, max: 1.0, step: 0.02, defaultValue: 0.18 },
      { id: 'gravity', label: 'Gravity (g)', unit: 'm/s²', min: 1.62, max: 24.79, step: 0.1, defaultValue: 9.81 },
    ],
    presets: [
      { id: 'standard', name: 'Earth Sea-Level', description: 'Standard atmospheric air resistance', parameters: { angle: 45, velocity: 32, mass: 1.0, dragCoeff: 0.18, gravity: 9.81 } },
      { id: 'moon', name: 'Lunar Vacuum', description: 'Moon gravity with zero atmospheric drag', parameters: { angle: 45, velocity: 30, mass: 1.0, dragCoeff: 0.0, gravity: 1.62 } },
      { id: 'heavy_drag', name: 'High Viscosity', description: 'Dense aerodynamic drag', parameters: { angle: 55, velocity: 45, mass: 0.5, dragCoeff: 0.65, gravity: 9.81 } },
      { id: 'jupiter', name: 'Jupiter Supergravity', description: 'High gravity 24.8 m/s²', parameters: { angle: 40, velocity: 50, mass: 2.0, dragCoeff: 0.2, gravity: 24.79 } },
    ],
    formulas: [
      { label: 'Aerodynamic Drag Force', latex: '\\vec{F}_d = -\\frac{1}{2} C_d \\rho A |\\vec{v}| \\vec{v}', description: 'Quadratic drag opposing instantaneous velocity vector.' },
      { label: 'Equations of Motion', latex: 'm \\frac{d\\vec{v}}{dt} = m\\vec{g} + \\vec{F}_d', description: 'Newtonian 2nd law governing ballistic kinematics.' },
      { label: 'Kinetic & Potential Energy', latex: 'E_{\\text{total}} = \\frac{1}{2}mv^2 + mgy', description: 'Mechanical energy dissipated over time by fluid drag.' },
    ],
    telemetryKeys: [
      { key: 'speed', label: 'Speed', unit: 'm/s', color: '#38bdf8' },
      { key: 'y', label: 'Altitude', unit: 'm', color: '#10b981' },
      { key: 'ke', label: 'Kinetic Energy', unit: 'J', color: '#fbbf24' },
      { key: 'maxHeight', label: 'Peak Height', unit: 'm', color: '#f43f5e' },
    ],
  },
  {
    id: 'double_pendulum',
    category: 'mechanics',
    name: 'Double Pendulum (Chaos Simulation)',
    subtitle: 'Coupled non-linear Lagrangian dynamical system',
    description:
      'Exhibits deterministic chaos and sensitive dependence on initial conditions (Lyapunov exponent). Solved numerically via 4th-order Runge-Kutta integration with real-time phase space portrait.',
    parameters: [
      { id: 'theta1', label: 'Initial Angle 1', unit: '°', min: -175, max: 175, step: 1, defaultValue: 90 },
      { id: 'theta2', label: 'Initial Angle 2', unit: '°', min: -175, max: 175, step: 1, defaultValue: 90 },
      { id: 'l1', label: 'Rod Length 1', unit: 'm', min: 0.4, max: 1.5, step: 0.05, defaultValue: 1.0 },
      { id: 'l2', label: 'Rod Length 2', unit: 'm', min: 0.4, max: 1.5, step: 0.05, defaultValue: 1.0 },
      { id: 'gravity', label: 'Gravity', unit: 'm/s²', min: 1.0, max: 20.0, step: 0.5, defaultValue: 9.81 },
    ],
    presets: [
      { id: 'classic_chaos', name: 'High-Chaos 90°/90°', description: 'Classic violent chaotic flips', parameters: { theta1: 90, theta2: 90, l1: 1.0, l2: 1.0, gravity: 9.81 } },
      { id: 'inverted', name: 'Near Inverted Peak', description: 'Starts near unstable equilibrium', parameters: { theta1: 170, theta2: 168, l1: 1.0, l2: 1.0, gravity: 9.81 } },
      { id: 'short_tip', name: 'Asymmetric Rods', description: 'Long upper arm with short rapid tip', parameters: { theta1: 80, theta2: 120, l1: 1.3, l2: 0.5, gravity: 9.81 } },
      { id: 'small_angle', name: 'Quasi-Periodic Mode', description: 'Small angles behaving quasi-harmonically', parameters: { theta1: 15, theta2: 15, l1: 1.0, l2: 1.0, gravity: 9.81 } },
    ],
    formulas: [
      { label: 'Lagrangian Formulation', latex: 'L = T - V = \\frac{1}{2}(m_1+m_2)l_1^2 \\dot{\\theta}_1^2 + \\frac{1}{2}m_2 l_2^2 \\dot{\\theta}_2^2 + m_2 l_1 l_2 \\dot{\\theta}_1 \\dot{\\theta}_2 \\cos(\\theta_1 - \\theta_2) - V(\\theta)', description: 'Total kinetic minus potential energy.' },
      { label: 'Euler-Lagrange Equation', latex: '\\frac{d}{dt}\\left(\\frac{\\partial L}{\\partial \\dot{\\theta}_i}\\right) - \\frac{\\partial L}{\\partial \\theta_i} = 0', description: 'Generates coupled non-linear 2nd-order ODEs.' },
    ],
    telemetryKeys: [
      { key: 'omega1', label: 'Angular Velocity ω₁', unit: 'rad/s', color: '#06b6d4' },
      { key: 'omega2', label: 'Angular Velocity ω₂', unit: 'rad/s', color: '#f43f5e' },
      { key: 'totalE', label: 'Total Energy', unit: 'J', color: '#10b981' },
    ],
  },
  {
    id: 'newtons_cradle',
    category: 'mechanics',
    name: "Newton's Cradle",
    subtitle: 'Conservation of momentum & elastic collision transfer',
    description:
      'Simulates momentum and kinetic energy propagation through a chain of suspended steel spheres. Drag and pull back any sphere to observe 1D impulse transfer.',
    parameters: [
      { id: 'ballCount', label: 'Number of Spheres', min: 2, max: 5, step: 1, defaultValue: 5 },
      { id: 'elasticity', label: 'Restitution (e)', min: 0.85, max: 1.0, step: 0.01, defaultValue: 0.99 },
    ],
    presets: [
      { id: 'standard_5', name: '5 Steel Balls', description: 'Standard high-grade desk toy', parameters: { ballCount: 5, elasticity: 0.99 } },
      { id: 'trio', name: '3 Balls Minimalist', description: 'Clean single/double ball transmission', parameters: { ballCount: 3, elasticity: 0.99 } },
      { id: 'inelastic', name: 'Inelastic Damping', description: 'Energy loss during contact deformation', parameters: { ballCount: 5, elasticity: 0.88 } },
    ],
    formulas: [
      { label: 'Conservation of Momentum', latex: '\\sum p_{\\text{initial}} = \\sum p_{\\text{final}} \\implies m_1 v_1 + m_2 v_2 = m_1 v_1\' + m_2 v_2\'', description: 'Total linear momentum remains invariant in closed collisions.' },
      { label: 'Coefficient of Restitution', latex: 'e = \\frac{v_2\' - v_1\'}{v_1 - v_2}', description: 'Ratio of relative separation velocity to approach velocity.' },
    ],
    telemetryKeys: [
      { key: 'totalEnergy', label: 'Total Energy', unit: 'J', color: '#38bdf8' },
      { key: 'firstAngle', label: 'Sphere 1 Angle', unit: '°', color: '#fbbf24' },
      { key: 'lastAngle', label: 'Sphere 5 Angle', unit: '°', color: '#ef4444' },
    ],
  },
  {
    id: 'inclined_plane',
    category: 'mechanics',
    name: 'Friction on an Inclined Plane',
    subtitle: 'Static vs. kinetic friction & gravitational force resolution',
    description:
      'Resolves gravitational force into normal and parallel ramp components, examining the critical static friction angle theta = arctan(mu_s) and subsequent kinetic acceleration.',
    parameters: [
      { id: 'angle', label: 'Ramp Incline Angle (θ)', unit: '°', min: 5, max: 75, step: 1, defaultValue: 30 },
      { id: 'mass', label: 'Block Mass (m)', unit: 'kg', min: 0.5, max: 10, step: 0.5, defaultValue: 2.0 },
      { id: 'muStatic', label: 'Static Friction (μ_s)', min: 0.05, max: 0.9, step: 0.02, defaultValue: 0.45 },
      { id: 'muKinetic', label: 'Kinetic Friction (μ_k)', min: 0.02, max: 0.8, step: 0.02, defaultValue: 0.28 },
    ],
    presets: [
      { id: 'equilibrium', name: 'Static Equilibrium', description: 'Angle slightly below slip threshold', parameters: { angle: 22, mass: 2.0, muStatic: 0.45, muKinetic: 0.28 } },
      { id: 'slide', name: 'Steep Slide', description: 'Rapid acceleration down steep grade', parameters: { angle: 45, mass: 2.0, muStatic: 0.45, muKinetic: 0.28 } },
      { id: 'ice', name: 'Near-Frictionless Ice', description: 'Extremely slick surface', parameters: { angle: 20, mass: 1.5, muStatic: 0.05, muKinetic: 0.03 } },
      { id: 'rubber', name: 'High-Tack Rubber', description: 'Requires steep tilt > 40° to break friction', parameters: { angle: 35, mass: 3.0, muStatic: 0.85, muKinetic: 0.65 } },
    ],
    formulas: [
      { label: 'Normal & Parallel Forces', latex: 'N = mg \\cos\\theta, \\quad F_{\\parallel} = mg \\sin\\theta', description: 'Decomposition of gravity into ramp coordinates.' },
      { label: 'Slip Invariant & Acceleration', latex: 'a = g(\\sin\\theta - \\mu_k \\cos\\theta) \\quad (\\text{when } \\tan\\theta > \\mu_s)', description: 'Equation of motion once static friction is overcome.' },
    ],
    telemetryKeys: [
      { key: 'acceleration', label: 'Acceleration', unit: 'm/s²', color: '#06b6d4' },
      { key: 'velocity', label: 'Velocity', unit: 'm/s', color: '#10b981' },
      { key: 'frictionForce', label: 'Friction Force', unit: 'N', color: '#f43f5e' },
      { key: 'normalForce', label: 'Normal Force', unit: 'N', color: '#eab308' },
    ],
  },
  {
    id: 'circular_motion',
    category: 'mechanics',
    name: 'Uniform Circular Motion & Centripetal Force',
    subtitle: 'Radial acceleration, tangential velocity & tether tension',
    description:
      'Investigates the inward radial force required to maintain circular kinematics. Includes an interactive "cut tether" affordance demonstrating Newton’s 1st law inertial straight-line release.',
    parameters: [
      { id: 'speed', label: 'Tangential Speed (v)', unit: 'm/s', min: 1.0, max: 15.0, step: 0.5, defaultValue: 5.0 },
      { id: 'radius', label: 'Tether Radius (r)', unit: 'm', min: 1.0, max: 4.0, step: 0.2, defaultValue: 2.0 },
      { id: 'mass', label: 'Orbital Mass (m)', unit: 'kg', min: 0.2, max: 5.0, step: 0.2, defaultValue: 1.0 },
      { id: 'cutString', label: 'Sever Tether String', min: 0, max: 1, step: 1, defaultValue: 0 },
    ],
    presets: [
      { id: 'standard_circle', name: 'Standard Tether', description: 'Balanced 2m radius at 5 m/s', parameters: { speed: 5.0, radius: 2.0, mass: 1.0, cutString: 0 } },
      { id: 'high_tension', name: 'High-G Centrifuge', description: 'High speed short radius generating strong radial tension', parameters: { speed: 12.0, radius: 1.4, mass: 2.0, cutString: 0 } },
      { id: 'cut_instant', name: 'Severed Inertia', description: 'Tether released demonstrating tangential straight path', parameters: { speed: 7.0, radius: 2.5, mass: 1.0, cutString: 1 } },
    ],
    formulas: [
      { label: 'Centripetal Acceleration', latex: 'a_c = \\frac{v^2}{r} = \\omega^2 r', description: 'Radial acceleration vector directed toward the center of curvature.' },
      { label: 'Tension / Centripetal Force', latex: 'T = m a_c = \\frac{m v^2}{r}', description: 'Net force required to sustain uniform circular trajectory.' },
    ],
    telemetryKeys: [
      { key: 'ac', label: 'Centripetal Accel (a_c)', unit: 'm/s²', color: '#38bdf8' },
      { key: 'tension', label: 'Tether Tension (T)', unit: 'N', color: '#f43f5e' },
      { key: 'omega', label: 'Angular Speed (ω)', unit: 'rad/s', color: '#fbbf24' },
      { key: 'period', label: 'Orbital Period (T)', unit: 's', color: '#10b981' },
    ],
  },

  // ==========================================
  // Category 2: Waves & Optics
  // ==========================================
  {
    id: 'double_slit',
    category: 'waves',
    name: 'Double-Slit Interference Pattern',
    subtitle: 'Young’s wave superposition & diffraction fringe intensity',
    description:
      'Coherent planar wavefronts propagate through twin apertures, creating spatial constructive and destructive interference wavefronts and fringe patterns on a detection screen.',
    parameters: [
      { id: 'wavelength', label: 'Wavelength (λ)', unit: 'nm', min: 380, max: 750, step: 10, defaultValue: 520 },
      { id: 'slitDistance', label: 'Slit Separation (d)', unit: 'μm', min: 5, max: 35, step: 1, defaultValue: 16 },
      { id: 'screenDist', label: 'Distance to Screen (D)', unit: 'm', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.2 },
    ],
    presets: [
      { id: 'green_laser', name: '532nm Green Laser', description: 'Standard high-visibility laser pointer', parameters: { wavelength: 532, slitDistance: 16, screenDist: 1.2 } },
      { id: 'red_laser', name: '650nm Red He-Ne', description: 'Longer wavelength yielding wider fringe spacing', parameters: { wavelength: 650, slitDistance: 14, screenDist: 1.5 } },
      { id: 'violet_tight', name: '405nm Violet Laser', description: 'Short wavelength with close fringe spacing', parameters: { wavelength: 405, slitDistance: 25, screenDist: 1.0 } },
    ],
    formulas: [
      { label: 'Fringe Width / Spacing', latex: '\\Delta y = \\frac{\\lambda D}{d}', description: 'Distance between adjacent constructive interference maxima.' },
      { label: 'Intensity Profile', latex: 'I(\\theta) = I_0 \\cos^2\\left(\\frac{\\pi d \\sin\\theta}{\\lambda}\\right) \\operatorname{sinc}^2\\left(\\frac{\\pi a \\sin\\theta}{\\lambda}\\right)', description: 'Superposition of double-slit interference with single-slit diffraction envelope.' },
    ],
    telemetryKeys: [
      { key: 'fringeWidth', label: 'Fringe Width (Δy)', unit: 'mm', color: '#06b6d4' },
      { key: 'firstMaxAngle', label: '1st Max Angle', unit: '°', color: '#10b981' },
      { key: 'wavelength', label: 'Wavelength', unit: 'nm', color: '#a855f7' },
    ],
  },
  {
    id: 'standing_waves',
    category: 'waves',
    name: 'Standing Waves & Harmonic Resonance',
    subtitle: 'Fixed-boundary resonant modes, nodes & antinodes',
    description:
      'Models normal modes on a stretched cord fixed at both boundaries under tension T. Dynamically highlights nodes (zero displacement) and antinodes (maximum amplitude).',
    parameters: [
      { id: 'harmonic', label: 'Harmonic Number (n)', min: 1, max: 5, step: 1, defaultValue: 3 },
      { id: 'tension', label: 'String Tension (T)', unit: 'N', min: 20, max: 300, step: 5, defaultValue: 120 },
      { id: 'density', label: 'Linear Density (μ)', unit: 'g/m', min: 2, max: 30, step: 1, defaultValue: 8 },
      { id: 'length', label: 'String Length (L)', unit: 'm', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
    ],
    presets: [
      { id: 'fundamental', name: 'Fundamental (n=1)', description: 'Base resonant mode with single antinode', parameters: { harmonic: 1, tension: 120, density: 8, length: 1.0 } },
      { id: 'harmonic_3', name: '3rd Harmonic (n=3)', description: '3 antinodes and 4 nodal points', parameters: { harmonic: 3, tension: 120, density: 8, length: 1.0 } },
      { id: 'high_order', name: '5th Harmonic (n=5)', description: 'High-frequency musical overtone', parameters: { harmonic: 5, tension: 150, density: 6, length: 1.2 } },
    ],
    formulas: [
      { label: 'Wave Propagation Speed', latex: 'v = \\sqrt{\\frac{T}{\\mu}}', description: 'Transverse wave speed as a function of cord tension and linear mass density.' },
      { label: 'Harmonic Resonant Frequency', latex: 'f_n = n \\frac{v}{2L} = \\frac{n}{2L}\\sqrt{\\frac{T}{\\mu}}', description: 'Frequencies satisfying constructive boundary condition resonance.' },
    ],
    telemetryKeys: [
      { key: 'frequency', label: 'Frequency (f)', unit: 'Hz', color: '#38bdf8' },
      { key: 'waveSpeed', label: 'Wave Speed (v)', unit: 'm/s', color: '#fbbf24' },
      { key: 'nodesCount', label: 'Node Count', unit: '', color: '#ef4444' },
      { key: 'wavelength', label: 'Wavelength (λ)', unit: 'm', color: '#10b981' },
    ],
  },
  {
    id: 'snell_prism',
    category: 'waves',
    name: 'Snell’s Law & Prism Refraction',
    subtitle: 'Chromatic dispersion, Cauchy equation & total internal reflection',
    description:
      'Simulates light refraction across refractive index boundaries. In prism mode, demonstrates Cauchy wavelength dispersion splitting white light into a rainbow spectrum.',
    parameters: [
      { id: 'incidenceAngle', label: 'Incidence Angle (θ₁)', unit: '°', min: 0, max: 80, step: 1, defaultValue: 48 },
      { id: 'n1', label: 'Incident Index (n₁)', min: 1.0, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'n2', label: 'Refracting Index (n₂)', min: 1.0, max: 2.42, step: 0.02, defaultValue: 1.52 },
      { id: 'prismMode', label: 'Prism Dispersion Mode', min: 0, max: 1, step: 1, defaultValue: 1 },
    ],
    presets: [
      { id: 'crown_glass', name: 'Crown Glass Prism', description: 'Standard dispersive glass prism rainbow', parameters: { incidenceAngle: 48, n1: 1.0, n2: 1.52, prismMode: 1 } },
      { id: 'flint_dense', name: 'Flint Glass (High Dispersion)', description: 'Stronger spectral beam spreading', parameters: { incidenceAngle: 50, n1: 1.0, n2: 1.66, prismMode: 1 } },
      { id: 'tir_boundary', name: 'TIR Planar Interface', description: 'Total internal reflection at glass-to-air boundary', parameters: { incidenceAngle: 45, n1: 1.52, n2: 1.0, prismMode: 0 } },
    ],
    formulas: [
      { label: 'Snell-Descartes Law', latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2', description: 'Invariant phase velocity match across optical boundaries.' },
      { label: 'Critical Angle for TIR', latex: '\\theta_c = \\arcsin\\left(\\frac{n_2}{n_1}\\right) \\quad (\\text{for } n_1 > n_2)', description: 'Angle beyond which all incident power is totally reflected.' },
      { label: 'Cauchy Dispersion Formula', latex: 'n(\\lambda) = A + \\frac{B}{\\lambda^2}', description: 'Empirical index dependency causing chromatic separation.' },
    ],
    telemetryKeys: [
      { key: 'theta2', label: 'Refraction Angle (θ₂)', unit: '°', color: '#06b6d4' },
      { key: 'criticalAngle', label: 'Critical Angle (θ_c)', unit: '°', color: '#f43f5e' },
      { key: 'isTIR', label: 'Total Reflected?', unit: '', color: '#fbbf24' },
    ],
  },
  {
    id: 'doppler_effect',
    category: 'waves',
    name: 'Doppler Sound Effect',
    subtitle: 'Acoustic frequency shifting & supersonic Mach shock cones',
    description:
      'Emits periodic wavefronts from a moving source toward a stationary observer. Features live audio pitch synthesis through the Web Audio API and Mach shock wave cone visualization.',
    parameters: [
      { id: 'sourceSpeed', label: 'Source Speed (v/c)', min: 0.0, max: 1.6, step: 0.05, defaultValue: 0.55 },
      { id: 'frequency', label: 'Source Pitch (f₀)', unit: 'Hz', min: 200, max: 800, step: 20, defaultValue: 440 },
    ],
    presets: [
      { id: 'subsonic', name: 'Subsonic Approach (0.55c)', description: 'Classic pitch drop as vehicle passes observer', parameters: { sourceSpeed: 0.55, frequency: 440 } },
      { id: 'sonic_barrier', name: 'Sound Barrier (1.0c)', description: 'Wavefront coalescence at Mach 1', parameters: { sourceSpeed: 1.0, frequency: 440 } },
      { id: 'supersonic', name: 'Supersonic Mach Cone (1.4c)', description: 'Shockwave boundary cone trailing high-speed source', parameters: { sourceSpeed: 1.4, frequency: 440 } },
    ],
    formulas: [
      { label: 'Approaching Observer Doppler Shift', latex: 'f\' = f_0 \\left(\\frac{c}{c - v_s}\\right)', description: 'Higher perceived frequency during source approach.' },
      { label: 'Receding Observer Doppler Shift', latex: 'f\'\' = f_0 \\left(\\frac{c}{c + v_s}\\right)', description: 'Lower perceived frequency once source moves away.' },
      { label: 'Mach Shock Angle', latex: '\\sin\\mu = \\frac{c}{v_s} = \\frac{1}{M} \\quad (\\text{for } v_s \\ge c)', description: 'Angle of conical shockwave envelope.' },
    ],
    telemetryKeys: [
      { key: 'perceivedFreq', label: 'Perceived Pitch', unit: 'Hz', color: '#38bdf8' },
      { key: 'machNumber', label: 'Mach Number (M)', unit: '', color: '#ef4444' },
      { key: 'frequencyRatio', label: 'Shift Ratio (f\'/f₀)', unit: '', color: '#10b981' },
    ],
  },
  {
    id: 'thin_film',
    category: 'waves',
    name: 'Thin Film Interference',
    subtitle: 'Optical path difference, phase inversion & iridescent soap films',
    description:
      'Calculates phase differences between upper and lower boundary reflections on nanometer-thin films (soap bubbles, oil slicks), synthesizing iridescent interference spectra.',
    parameters: [
      { id: 'thickness', label: 'Film Thickness', unit: 'nm', min: 80, max: 700, step: 10, defaultValue: 340 },
      { id: 'nFilm', label: 'Film Refractive Index', min: 1.1, max: 1.8, step: 0.02, defaultValue: 1.33 },
      { id: 'angle', label: 'Incidence Angle', unit: '°', min: 0, max: 60, step: 2, defaultValue: 30 },
    ],
    presets: [
      { id: 'soap_bubble', name: 'Soap Bubble (n=1.33)', description: 'Water/soap thin membrane in air', parameters: { thickness: 340, nFilm: 1.33, angle: 30 } },
      { id: 'oil_slick', name: 'Oil Slick on Water (n=1.45)', description: 'Hydrocarbon layer causing vivid swirl reflections', parameters: { thickness: 260, nFilm: 1.45, angle: 25 } },
      { id: 'anti_reflective', name: 'Anti-Reflective Coating', description: 'Quarter-wave destructive cancellation in optics', parameters: { thickness: 138, nFilm: 1.38, angle: 0 } },
    ],
    formulas: [
      { label: 'Optical Path Difference (OPD)', latex: '\\Delta = 2 n_{\\text{film}} d \\cos\\theta_r', description: 'Geometric optical path traversed through film.' },
      { label: 'Constructive Interference Condition', latex: '2 n d \\cos\\theta_r = \\left(m + \\frac{1}{2}\\right)\\lambda', description: 'Includes pi phase inversion at higher-index top boundary.' },
    ],
    telemetryKeys: [
      { key: 'opd', label: 'Optical Path Diff', unit: 'nm', color: '#06b6d4' },
      { key: 'dominantWavelength', label: 'Dominant Color λ', unit: 'nm', color: '#a855f7' },
      { key: 'thickness', label: 'Thickness', unit: 'nm', color: '#fbbf24' },
    ],
  },

  // ==========================================
  // Category 3: Electromagnetism
  // ==========================================
  {
    id: 'dc_circuit',
    category: 'electromagnetism',
    name: 'DC Circuit Builder & Ohm’s Law Solver',
    subtitle: 'Kirchhoff’s laws, series/parallel networks & drift current',
    description:
      'Solves mesh branch currents and node voltages across resistor networks. Features animated electron drift dots whose velocity is proportional to current density.',
    parameters: [
      { id: 'voltage', label: 'EMF Voltage (V)', unit: 'V', min: 1, max: 24, step: 1, defaultValue: 12 },
      { id: 'r1', label: 'Resistor R₁', unit: 'Ω', min: 2, max: 50, step: 1, defaultValue: 10 },
      { id: 'r2', label: 'Resistor R₂', unit: 'Ω', min: 2, max: 50, step: 1, defaultValue: 20 },
      { id: 'circuitConfig', label: 'Network (0:Series, 1:Parallel)', min: 0, max: 1, step: 1, defaultValue: 0 },
      { id: 'switchClosed', label: 'Switch Circuit State', min: 0, max: 1, step: 1, defaultValue: 1 },
    ],
    presets: [
      { id: 'series_12v', name: '12V Series Circuit', description: 'Single current loop with voltage divider', parameters: { voltage: 12, r1: 10, r2: 20, circuitConfig: 0, switchClosed: 1 } },
      { id: 'parallel_12v', name: '12V Parallel Circuit', description: 'Dual branch current sharing full potential', parameters: { voltage: 12, r1: 10, r2: 20, circuitConfig: 1, switchClosed: 1 } },
      { id: 'high_res', name: 'High Resistance Series', description: 'Low current draw and low power dissipation', parameters: { voltage: 24, r1: 40, r2: 50, circuitConfig: 0, switchClosed: 1 } },
    ],
    formulas: [
      { label: 'Ohm’s Law', latex: 'V = I R \\implies I = \\frac{V}{R}', description: 'Fundamental linear relationship between potential, current, and resistance.' },
      { label: 'Equivalent Resistance', latex: 'R_{\\text{series}} = R_1 + R_2, \\quad \\frac{1}{R_{\\text{parallel}}} = \\frac{1}{R_1} + \\frac{1}{R_2}', description: 'Network reduction formulas derived from Kirchhoff’s loop and junction laws.' },
      { label: 'Joule Dissipated Power', latex: 'P = V I = I^2 R = \\frac{V^2}{R}', description: 'Rate of electrical energy converted into thermal dissipation.' },
    ],
    telemetryKeys: [
      { key: 'iTotal', label: 'Total Current (I)', unit: 'A', color: '#38bdf8' },
      { key: 'req', label: 'Equivalent R', unit: 'Ω', color: '#fbbf24' },
      { key: 'powerTotal', label: 'Total Power (P)', unit: 'W', color: '#ef4444' },
      { key: 'vR1', label: 'Voltage R₁', unit: 'V', color: '#10b981' },
    ],
  },
  {
    id: 'electric_field',
    category: 'electromagnetism',
    name: 'Electric Field & Point Charge Potentials',
    subtitle: 'Coulomb vector field superposition & dipole potentials',
    description:
      'Plots electric field vector grid and potential distributions created by positive and negative point charges. Charges can be dragged dynamically across the canvas.',
    parameters: [
      { id: 'fieldDensity', label: 'Vector Grid Spacing', min: 25, max: 60, step: 5, defaultValue: 40 },
    ],
    presets: [
      { id: 'dipole', name: 'Electric Dipole (+ / -)', description: 'Opposite charges forming field loop lines', parameters: { fieldDensity: 40 } },
      { id: 'fine_grid', name: 'High Resolution Grid', description: 'Dense vector arrow sampling', parameters: { fieldDensity: 30 } },
    ],
    formulas: [
      { label: 'Coulomb Field Superposition', latex: '\\vec{E}(\\vec{r}) = \\frac{1}{4\\pi\\varepsilon_0}\\sum_{i} \\frac{q_i}{|\\vec{r} - \\vec{r}_i|^2} \\hat{r}_i', description: 'Linear vector sum of fields produced by individual point charges.' },
      { label: 'Electric Scalar Potential', latex: 'V(\\vec{r}) = \\frac{1}{4\\pi\\varepsilon_0}\\sum_{i} \\frac{q_i}{|\\vec{r} - \\vec{r}_i|}', description: 'Scalar potential distribution where E = -grad(V).' },
    ],
    telemetryKeys: [
      { key: 'dipoleMoment', label: 'Dipole Moment (p)', unit: 'μC·m', color: '#06b6d4' },
      { key: 'q1', label: 'Charge 1', unit: 'μC', color: '#ef4444' },
      { key: 'q2', label: 'Charge 2', unit: 'μC', color: '#3b82f6' },
    ],
  },
  {
    id: 'lorentz_force',
    category: 'electromagnetism',
    name: 'Lorentz Force (Charged Particle in Magnetic Field)',
    subtitle: 'Cyclotron radius, helical trajectories & magnetic deflection',
    description:
      'Simulates the deflection of electrons or positive ions in a uniform magnetic field B (pointing into or out of the page), establishing steady circular cyclotron gyration.',
    parameters: [
      { id: 'bField', label: 'Magnetic Field B', unit: 'T', min: -2.5, max: 2.5, step: 0.1, defaultValue: 1.2 },
      { id: 'velocity', label: 'Entry Velocity (v)', unit: 'm/s', min: 80, max: 300, step: 10, defaultValue: 180 },
      { id: 'particleCharge', label: 'Charge Sign', min: -1, max: 1, step: 2, defaultValue: -1 },
      { id: 'particleMass', label: 'Relative Mass (m)', min: 0.5, max: 4.0, step: 0.5, defaultValue: 1.0 },
    ],
    presets: [
      { id: 'electron_deflect', name: 'Electron Deflection (-1e)', description: 'Standard negative charge circular deflection', parameters: { bField: 1.2, velocity: 180, particleCharge: -1, particleMass: 1.0 } },
      { id: 'proton_beam', name: 'Proton Beam (+1e)', description: 'Positive charge deflecting in opposite curvature', parameters: { bField: 1.2, velocity: 180, particleCharge: 1, particleMass: 2.5 } },
      { id: 'high_field', name: 'High-Field Tight Orbit', description: 'Strong magnetic field producing tight cyclotron loop', parameters: { bField: 2.4, velocity: 140, particleCharge: -1, particleMass: 1.0 } },
    ],
    formulas: [
      { label: 'Lorentz Magnetic Force', latex: '\\vec{F} = q(\\vec{v} \\times \\vec{B})', description: 'Force acts perpendicular to both velocity and magnetic field vectors.' },
      { label: 'Cyclotron Gyroradius', latex: 'r = \\frac{m v}{|q| B}', description: 'Radius of circular trajectory established by magnetic centripetal acceleration.' },
      { label: 'Cyclotron Frequency', latex: 'f_c = \\frac{|q| B}{2\\pi m}', description: 'Orbital frequency independent of particle speed (relativistic limit excluded).' },
    ],
    telemetryKeys: [
      { key: 'gyroRadius', label: 'Gyroradius (r)', unit: 'px', color: '#38bdf8' },
      { key: 'cyclotronFreq', label: 'Frequency (f_c)', unit: 'Hz', color: '#10b981' },
      { key: 'lorentzForce', label: 'Lorentz Force', unit: 'N', color: '#f43f5e' },
      { key: 'bField', label: 'Field (B)', unit: 'T', color: '#fbbf24' },
    ],
  },
  {
    id: 'faradays_law',
    category: 'electromagnetism',
    name: 'Faraday’s Law of Electromagnetic Induction',
    subtitle: 'Magnetic flux variation, Lenz’s law & induced EMF',
    description:
      'Translates a permanent bar magnet through a wire solenoid, inducing electromotive force (EMF) spikes detected on a galvanometer and powering an indicator lamp.',
    parameters: [
      { id: 'numTurns', label: 'Coil Turns (N)', min: 10, max: 150, step: 10, defaultValue: 50 },
      { id: 'autoOscillate', label: 'Auto Oscillation Drive', min: 0, max: 1, step: 1, defaultValue: 1 },
    ],
    presets: [
      { id: 'auto_sine', name: 'Harmonic Oscillation', description: 'Periodic sinusoidal magnet translation', parameters: { numTurns: 50, autoOscillate: 1 } },
      { id: 'dense_coil', name: '120-Turn Heavy Induction', description: 'Larger turn count amplifying EMF peaks', parameters: { numTurns: 120, autoOscillate: 1 } },
      { id: 'manual_drag', name: 'Manual Interactive Magnet', description: 'Drag the bar magnet directly with pointer', parameters: { numTurns: 60, autoOscillate: 0 } },
    ],
    formulas: [
      { label: 'Magnetic Flux', latex: '\\Phi_B = \\iint \\vec{B} \\cdot d\\vec{A}', description: 'Surface integral of magnetic field passing through solenoid area.' },
      { label: 'Faraday-Lenz Law', latex: '\\mathcal{E} = -N \\frac{d\\Phi_B}{dt}', description: 'Negative sign embodies Lenz’s law opposing flux changes.' },
    ],
    telemetryKeys: [
      { key: 'inducedEMF', label: 'Induced EMF', unit: 'V', color: '#ef4444' },
      { key: 'magneticFlux', label: 'Magnetic Flux (Φ)', unit: 'Wb', color: '#38bdf8' },
      { key: 'magnetVelocity', label: 'Magnet Velocity', unit: 'px/s', color: '#fbbf24' },
      { key: 'bulbBrightness', label: 'Bulb Output', unit: '%', color: '#10b981' },
    ],
  },

  // ==========================================
  // Category 4: Thermodynamics & Fluids
  // ==========================================
  {
    id: 'ideal_gas',
    category: 'thermodynamics',
    name: 'Ideal Gas Molecular Dynamics (Maxwell-Boltzmann)',
    subtitle: 'Microscopic hard-sphere kinetics, pressure & velocity distribution',
    description:
      'Simulates hundreds of elastic particle collisions within a chamber with an adjustable piston. Measures real-time impulse wall pressure and plots the Maxwell-Boltzmann distribution.',
    parameters: [
      { id: 'temperature', label: 'Thermal Bath (T)', unit: 'K', min: 100, max: 600, step: 25, defaultValue: 300 },
      { id: 'pistonVolume', label: 'Chamber Volume', unit: '%', min: 40, max: 100, step: 5, defaultValue: 85 },
      { id: 'particleCount', label: 'Particle Count (N)', min: 50, max: 250, step: 25, defaultValue: 150 },
    ],
    presets: [
      { id: 'room_temp', name: 'Standard Ambient (300 K)', description: 'Equilibrium kinetic velocities at room temperature', parameters: { temperature: 300, pistonVolume: 85, particleCount: 150 } },
      { id: 'cryogenic', name: 'Cryogenic Cold (125 K)', description: 'Sluggish particles with compressed velocity spread', parameters: { temperature: 125, pistonVolume: 85, particleCount: 150 } },
      { id: 'compressed_hot', name: 'High-Pressure Compression', description: 'High temperature and compressed volume raising wall collisions', parameters: { temperature: 550, pistonVolume: 50, particleCount: 200 } },
    ],
    formulas: [
      { label: 'Ideal Gas Equation of State', latex: 'P V = N k_B T = n R T', description: 'Macroscopic relationship between pressure, volume, and temperature.' },
      { label: 'Maxwell-Boltzmann Distribution', latex: 'f(v) = 4\\pi \\left(\\frac{m}{2\\pi k_B T}\\right)^{3/2} v^2 \\exp\\left(-\\frac{m v^2}{2 k_B T}\\right)', description: 'Probability density function of molecular speeds in thermal equilibrium.' },
      { label: 'Root-Mean-Square Speed', latex: 'v_{\\text{rms}} = \\sqrt{\\frac{3 k_B T}{m}}', description: 'Speed corresponding to average molecular kinetic energy.' },
    ],
    telemetryKeys: [
      { key: 'pressure', label: 'Wall Pressure (P)', unit: 'kPa', color: '#f43f5e' },
      { key: 'temperature', label: 'Temperature (T)', unit: 'K', color: '#fbbf24' },
      { key: 'rmsSpeed', label: 'v_rms Speed', unit: 'px/s', color: '#38bdf8' },
      { key: 'volume', label: 'Volume (V)', unit: 'a.u.', color: '#10b981' },
    ],
  },
  {
    id: 'venturi_bernoulli',
    category: 'thermodynamics',
    name: 'Venturi Effect & Bernoulli Tube',
    subtitle: 'Mass continuity, velocity throat constriction & static pressure drops',
    description:
      'Fluid traverses a tapering tube constriction. Manometer tubes illustrate that higher velocity in the narrow throat causes a pronounced drop in static fluid pressure.',
    parameters: [
      { id: 'flowRate', label: 'Inlet Flow Velocity', unit: 'm/s', min: 1.0, max: 8.0, step: 0.5, defaultValue: 3.5 },
      { id: 'throatRatio', label: 'Constriction Ratio (A₂/A₁)', min: 0.25, max: 0.75, step: 0.05, defaultValue: 0.45 },
    ],
    presets: [
      { id: 'standard_flow', name: 'Moderate Constriction', description: 'Clear static pressure differential in throat manometer', parameters: { flowRate: 3.5, throatRatio: 0.45 } },
      { id: 'narrow_throat', name: 'Narrow Throat Venturi', description: 'Severe throat acceleration and maximum pressure dip', parameters: { flowRate: 4.5, throatRatio: 0.3 } },
      { id: 'gentle_flow', name: 'Laminar Low Velocity', description: 'Mild velocity increase across constriction', parameters: { flowRate: 2.0, throatRatio: 0.6 } },
    ],
    formulas: [
      { label: 'Continuity Equation', latex: 'A_1 v_1 = A_2 v_2 = Q \\implies v_2 = v_1 \\frac{A_1}{A_2}', description: 'Conservation of mass for incompressible fluid flow.' },
      { label: 'Bernoulli’s Principle', latex: 'P_1 + \\frac{1}{2}\\rho v_1^2 + \\rho g h_1 = P_2 + \\frac{1}{2}\\rho v_2^2 + \\rho g h_2', description: 'Conservation of mechanical energy density along streamlines.' },
    ],
    telemetryKeys: [
      { key: 'vThroat', label: 'Throat Speed (v₂)', unit: 'm/s', color: '#06b6d4' },
      { key: 'vInlet', label: 'Inlet Speed (v₁)', unit: 'm/s', color: '#10b981' },
      { key: 'deltaPressure', label: 'Pressure Drop (ΔP)', unit: 'Pa', color: '#f43f5e' },
    ],
  },
  {
    id: 'heat_diffusion',
    category: 'thermodynamics',
    name: '2D Heat Diffusion Grid',
    subtitle: 'Fourier conduction PDE & finite-difference thermal mapping',
    description:
      'Solves the 2D parabolic heat conduction partial differential equation over a 2D conductor plate. Users can click and drag to paint dynamic heat sources directly onto the mesh.',
    parameters: [
      { id: 'diffusivity', label: 'Thermal Diffusivity (α)', min: 0.05, max: 0.6, step: 0.05, defaultValue: 0.25 },
    ],
    presets: [
      { id: 'copper_diffuse', name: 'High Diffusivity (Copper-like)', description: 'Rapid thermal equilibration across plate', parameters: { diffusivity: 0.45 } },
      { id: 'steel_diffuse', name: 'Moderate Diffusivity (Steel-like)', description: 'Balanced localized conduction rings', parameters: { diffusivity: 0.25 } },
      { id: 'ceramic_insulate', name: 'Low Diffusivity (Ceramic/Glass)', description: 'Slow heat spread retaining sharp thermal gradients', parameters: { diffusivity: 0.08 } },
    ],
    formulas: [
      { label: 'Heat Conduction Equation', latex: '\\frac{\\partial T}{\\partial t} = \\alpha \\nabla^2 T = \\alpha \\left(\\frac{\\partial^2 T}{\\partial x^2} + \\frac{\\partial^2 T}{\\partial y^2}\\right)', description: 'Second-order parabolic PDE governing thermal transport.' },
      { label: 'Fourier’s Law of Conduction', latex: '\\vec{q} = -k \\nabla T', description: 'Heat flux vector is antiparallel to temperature gradient.' },
    ],
    telemetryKeys: [
      { key: 'maxTemp', label: 'Max Temperature', unit: '°C', color: '#ef4444' },
      { key: 'avgTemp', label: 'Average Temp', unit: '°C', color: '#fbbf24' },
      { key: 'minTemp', label: 'Min Temperature', unit: '°C', color: '#38bdf8' },
    ],
  },

  // ==========================================
  // Category 5: Quantum & Astrophysics
  // ==========================================
  {
    id: 'kepler_orbit',
    category: 'quantum',
    name: 'Keplerian N-Body Gravitational Orbital Simulator',
    subtitle: 'Universal gravitation, planetary ellipses & angular momentum',
    description:
      'Integrates multi-body orbital mechanics under Newton’s law of universal gravitation, demonstrating stable elliptical orbits, orbital velocity vectors, and conservation of angular momentum.',
    parameters: [
      { id: 'gravitationalConst', label: 'Gravitational Constant (G)', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
    ],
    presets: [
      { id: 'solar_triad', name: 'Three-Planet System', description: 'Stable inner, habitable, and gas giant orbits', parameters: { gravitationalConst: 1.0 } },
      { id: 'strong_gravity', name: 'Elevated Gravity (G=1.6)', description: 'Tighter orbital periods and higher velocities', parameters: { gravitationalConst: 1.6 } },
      { id: 'weak_gravity', name: 'Weak Gravity (G=0.7)', description: 'Looser orbits with extended aphelion sweeps', parameters: { gravitationalConst: 0.7 } },
    ],
    formulas: [
      { label: 'Newton’s Law of Gravitation', latex: '\\vec{F}_{12} = -G \\frac{m_1 m_2}{r^2} \\hat{r}_{12}', description: 'Inverse-square central force mediating celestial orbits.' },
      { label: 'Kepler’s Third Law', latex: 'T^2 = \\frac{4\\pi^2}{G M} a^3', description: 'Square of orbital period proportional to cube of semi-major axis.' },
      { label: 'Conservation of Angular Momentum', latex: '\\vec{L} = \\vec{r} \\times m\\vec{v} = \\text{constant}', description: 'Guarantees Kepler’s second law of equal areas swept in equal time.' },
    ],
    telemetryKeys: [
      { key: 'orbitalSpeed', label: 'Planet 2 Speed', unit: 'a.u./s', color: '#38bdf8' },
      { key: 'orbitalRadius', label: 'Distance from Star', unit: 'px', color: '#10b981' },
      { key: 'angularMomentum', label: 'Angular Momentum (L)', unit: '', color: '#fbbf24' },
      { key: 'periodEst', label: 'Period Est.', unit: 's', color: '#f43f5e' },
    ],
  },
  {
    id: 'photoelectric_effect',
    category: 'quantum',
    name: 'Photoelectric Effect',
    subtitle: 'Planck relation, cathode work function & stopping potential',
    description:
      'Monochromatic light irradiates a cathode plate inside an evacuated tube, ejecting photoelectrons once photon energy exceeds the metal’s work function (h*nu > Phi).',
    parameters: [
      { id: 'wavelength', label: 'Light Wavelength (λ)', unit: 'nm', min: 200, max: 700, step: 10, defaultValue: 340 },
      { id: 'workFunction', label: 'Cathode Metal (Work Function Φ)', unit: 'eV', min: 1.8, max: 5.5, step: 0.1, defaultValue: 2.14 },
      { id: 'stoppingVoltage', label: 'Opposing Voltage (V_stop)', unit: 'V', min: 0.0, max: 4.0, step: 0.1, defaultValue: 0.5 },
      { id: 'intensity', label: 'Light Intensity', unit: '%', min: 10, max: 100, step: 5, defaultValue: 60 },
    ],
    presets: [
      { id: 'cesium_uv', name: 'Cesium Cathode (Φ = 2.14 eV)', description: 'Low work function metal readily ejecting electrons with visible light', parameters: { wavelength: 340, workFunction: 2.14, stoppingVoltage: 0.5, intensity: 60 } },
      { id: 'potassium_green', name: 'Potassium (Φ = 2.30 eV)', description: 'Threshold at edge of blue/green spectrum', parameters: { wavelength: 420, workFunction: 2.30, stoppingVoltage: 0.2, intensity: 75 } },
      { id: 'copper_deep_uv', name: 'Copper Cathode (Φ = 4.70 eV)', description: 'Requires high-energy UV photons (< 264nm) to emit', parameters: { wavelength: 230, workFunction: 4.70, stoppingVoltage: 0.0, intensity: 80 } },
      { id: 'cutoff_threshold', name: 'Sub-Threshold Wavelength', description: 'Long wavelength with zero electron emission despite 100% intensity', parameters: { wavelength: 650, workFunction: 2.30, stoppingVoltage: 0.0, intensity: 100 } },
    ],
    formulas: [
      { label: 'Einstein’s Photoelectric Equation', latex: 'K_{\\max} = h\\nu - \\Phi = \\frac{hc}{\\lambda} - \\Phi', description: 'Maximum kinetic energy of ejected photoelectron.' },
      { label: 'Stopping Potential Relation', latex: 'e V_0 = K_{\\max} \\implies V_0 = \\frac{h}{e}\\nu - \\frac{\\Phi}{e}', description: 'Opposing electric potential required to halt photocurrent.' },
    ],
    telemetryKeys: [
      { key: 'photonEnergy', label: 'Photon Energy (E)', unit: 'eV', color: '#a855f7' },
      { key: 'maxKineticEnergy', label: 'Max K_e', unit: 'eV', color: '#38bdf8' },
      { key: 'stoppingPotential', label: 'Cutoff Potential (V₀)', unit: 'V', color: '#ef4444' },
      { key: 'photocurrent', label: 'Photocurrent (I)', unit: 'μA', color: '#10b981' },
    ],
  },
  {
    id: 'radioactive_decay',
    category: 'quantum',
    name: 'Radioactive Decay Stochastic Simulator',
    subtitle: 'Monte Carlo Poisson transmutations & exponential half-life',
    description:
      'Tracks 500 individual unstable atomic nuclei in a lattice. Nuclei undergo stochastic Poisson transmutation into stable daughters, generating a live exponential decay curve and Geiger clicks.',
    parameters: [
      { id: 'halfLife', label: 'Half-Life (t₁/₂)', unit: 's', min: 1.5, max: 10.0, step: 0.5, defaultValue: 4.0 },
    ],
    presets: [
      { id: 'fast_decay', name: 'Rapid Decay (t₁/₂ = 2.5s)', description: 'Fast transmutation rate with rapid Geiger clicks', parameters: { halfLife: 2.5 } },
      { id: 'standard_decay', name: 'Standard Half-Life (4.0s)', description: 'Even decay progression over ~20 seconds', parameters: { halfLife: 4.0 } },
      { id: 'slow_decay', name: 'Long-Lived Isotope (8.0s)', description: 'Slow Poisson decay rate', parameters: { halfLife: 8.0 } },
    ],
    formulas: [
      { label: 'Radioactive Decay Law', latex: 'N(t) = N_0 e^{-\\lambda t} = N_0 \\left(\\frac{1}{2}\\right)^{t / t_{1/2}}', description: 'Deterministic expected count of surviving parent nuclei.' },
      { label: 'Decay Constant & Activity', latex: '\\lambda = \\frac{\\ln 2}{t_{1/2}}, \\quad A(t) = -\\frac{dN}{dt} = \\lambda N(t)', description: 'Instantaneous activity and transmutation probability per unit time.' },
    ],
    telemetryKeys: [
      { key: 'remainingCount', label: 'Surviving Nuclei', unit: '', color: '#06b6d4' },
      { key: 'decayedCount', label: 'Transmuted Daughters', unit: '', color: '#f43f5e' },
      { key: 'fractionRemaining', label: 'Fraction (N/N₀)', unit: '', color: '#10b981' },
      { key: 'theoreticalCount', label: 'Theoretical N(t)', unit: '', color: '#fbbf24' },
    ],
  },
];

export const SIMULATION_ENGINES: Record<string, SimulationEngine<unknown>> = {
  projectile: projectileEngine as unknown as SimulationEngine<unknown>,
  double_pendulum: doublePendulumEngine as unknown as SimulationEngine<unknown>,
  newtons_cradle: newtonsCradleEngine as unknown as SimulationEngine<unknown>,
  inclined_plane: inclinedPlaneEngine as unknown as SimulationEngine<unknown>,
  circular_motion: circularMotionEngine as unknown as SimulationEngine<unknown>,

  double_slit: doubleSlitEngine as unknown as SimulationEngine<unknown>,
  standing_waves: standingWaveEngine as unknown as SimulationEngine<unknown>,
  snell_prism: snellPrismEngine as unknown as SimulationEngine<unknown>,
  doppler_effect: dopplerEngine as unknown as SimulationEngine<unknown>,
  thin_film: thinFilmEngine as unknown as SimulationEngine<unknown>,

  dc_circuit: dcCircuitEngine as unknown as SimulationEngine<unknown>,
  electric_field: electricFieldEngine as unknown as SimulationEngine<unknown>,
  lorentz_force: lorentzEngine as unknown as SimulationEngine<unknown>,
  faradays_law: faradayEngine as unknown as SimulationEngine<unknown>,

  ideal_gas: idealGasEngine as unknown as SimulationEngine<unknown>,
  venturi_bernoulli: venturiEngine as unknown as SimulationEngine<unknown>,
  heat_diffusion: heatDiffusionEngine as unknown as SimulationEngine<unknown>,

  kepler_orbit: keplerEngine as unknown as SimulationEngine<unknown>,
  photoelectric_effect: photoelectricEngine as unknown as SimulationEngine<unknown>,
  radioactive_decay: radioactiveDecayEngine as unknown as SimulationEngine<unknown>,
};
