// ─── Drum Synthesizer (pure Web Audio API) ────────────────────────────────────
// All drum sounds are synthesized; no samples required.

export class DrumSynth {
  private ctx: AudioContext;
  private output: GainNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.output = ctx.createGain();
    this.output.gain.value = 0.85;
    this.output.connect(destination);
  }

  setVolume(v: number) {
    this.output.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
  }

  // ── Kick ──────────────────────────────────────────────────────────────────

  scheduleKick(time: number) {
    const ctx = this.ctx;

    // Pitched body: sine sweep 160→45 Hz
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.45);
    oscGain.gain.setValueAtTime(1.0, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    osc.connect(oscGain);
    oscGain.connect(this.output);
    osc.start(time);
    osc.stop(time + 0.55);

    // Click transient: noise burst
    const bufSize = ctx.sampleRate * 0.05;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buf;
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.value = 300;
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.output);
    noise.start(time);
    noise.stop(time + 0.06);
  }

  // ── Snare ─────────────────────────────────────────────────────────────────

  scheduleSnare(time: number) {
    const ctx = this.ctx;

    // Tonal body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.1);
    oscGain.gain.setValueAtTime(0.6, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.output);
    osc.start(time);
    osc.stop(time + 0.2);

    // Snare rattle: filtered noise
    const bufSize = ctx.sampleRate * 0.2;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buf;
    hp.type = 'highpass';
    hp.frequency.value = 1200;
    noiseGain.gain.setValueAtTime(0.8, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.connect(hp);
    hp.connect(noiseGain);
    noiseGain.connect(this.output);
    noise.start(time);
    noise.stop(time + 0.22);
  }

  // ── Closed Hi-Hat ─────────────────────────────────────────────────────────

  scheduleHihat(time: number, open = false) {
    const ctx = this.ctx;
    const decay = open ? 0.3 : 0.06;

    const bufSize = ctx.sampleRate * (decay + 0.02);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    const hp = ctx.createBiquadFilter();
    const bp = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();

    noise.buffer = buf;
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    bp.type = 'bandpass';
    bp.frequency.value = 10000;
    bp.Q.value = 0.5;

    noiseGain.gain.setValueAtTime(0.55, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decay);

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(this.output);

    noise.start(time);
    noise.stop(time + decay + 0.02);
  }
}
