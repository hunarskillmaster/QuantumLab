/**
 * Laboratory Web Audio API Synthesizer
 * Provides sound synthesis for Doppler pitch shifts, Newton's cradle elastic impacts,
 * and Geiger counter stochastic detection.
 */

class PhysicsAudioSynth {
  private ctx: AudioContext | null = null;
  private dopplerOsc: OscillatorNode | null = null;
  private dopplerGain: GainNode | null = null;
  private isMuted: boolean = true;

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopDopplerTone();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playClick(pitch: number = 800, volume: number = 0.2) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public playGeigerClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.005; // 5ms burst
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2400;

      const gain = this.ctx.createGain();
      gain.gain.value = 0.35;

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch {
      // Ignore
    }
  }

  public updateDopplerTone(frequency: number, active: boolean) {
    if (this.isMuted || !active) {
      this.stopDopplerTone();
      return;
    }
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (!this.dopplerOsc) {
        this.dopplerOsc = this.ctx.createOscillator();
        this.dopplerGain = this.ctx.createGain();
        this.dopplerOsc.type = 'triangle';
        this.dopplerGain.gain.setValueAtTime(0.001, now);
        this.dopplerGain.gain.linearRampToValueAtTime(0.06, now + 0.05);
        this.dopplerOsc.connect(this.dopplerGain);
        this.dopplerGain.connect(this.ctx.destination);
        this.dopplerOsc.start();
      }

      const clampedFreq = Math.max(100, Math.min(2500, frequency));
      this.dopplerOsc.frequency.setTargetAtTime(clampedFreq, now, 0.03);
    } catch {
      // Ignore
    }
  }

  public stopDopplerTone() {
    if (this.dopplerOsc && this.dopplerGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.dopplerGain.gain.linearRampToValueAtTime(0.0001, now + 0.05);
        setTimeout(() => {
          try {
            this.dopplerOsc?.stop();
            this.dopplerOsc?.disconnect();
            this.dopplerGain?.disconnect();
          } catch {
            // Ignore
          }
          this.dopplerOsc = null;
          this.dopplerGain = null;
        }, 60);
      } catch {
        this.dopplerOsc = null;
        this.dopplerGain = null;
      }
    }
  }
}

export const physicsAudio = new PhysicsAudioSynth();
