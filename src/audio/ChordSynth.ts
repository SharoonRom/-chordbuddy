import { midiToFreq } from '../music/MusicTheory';

// ─── Chord Synthesizer ────────────────────────────────────────────────────────
// Piano-inspired additive synthesizer using Web Audio oscillators.
// Per note: sine (fundamental) + triangle (harmonics) + detune for richness.

export interface ChordScheduleEvent {
  notes: number[];         // MIDI note numbers
  startTime: number;       // audioContext.currentTime
  durationSec: number;
  velocity?: number;       // 0–1, default 0.8
  style?: 'piano' | 'pad' | 'power';
}

export class ChordSynth {
  private ctx: AudioContext;
  private output: GainNode;
  private filter: BiquadFilterNode;
  private reverb: ConvolverNode;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Master chain: synth → filter → reverb → master
    this.output = ctx.createGain();
    this.output.gain.value = 0.75;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 3500;
    this.filter.Q.value = 0.7;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.buildImpulseResponse(1.8, 2.5);

    // Dry + wet reverb mix
    const dryGain = ctx.createGain();
    const wetGain = ctx.createGain();
    dryGain.gain.value = 0.6;
    wetGain.gain.value = 0.4;

    this.output.connect(this.filter);
    this.filter.connect(dryGain);
    this.filter.connect(this.reverb);
    this.reverb.connect(wetGain);
    dryGain.connect(destination);
    wetGain.connect(destination);
  }

  setVolume(v: number) {
    this.output.gain.setTargetAtTime(v * 0.85, this.ctx.currentTime, 0.02);
  }

  scheduleChord(event: ChordScheduleEvent) {
    const { notes, startTime, durationSec, velocity = 0.8, style = 'piano' } = event;

    for (const midi of notes) {
      this.scheduleNote(midi, startTime, durationSec, velocity, style);
    }
  }

  private scheduleNote(
    midi: number,
    startTime: number,
    durationSec: number,
    velocity: number,
    style: string,
  ) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);

    if (style === 'power') {
      this.schedulePowerNote(midi, startTime, durationSec, velocity);
      return;
    }

    // ── Envelope params by style ─────────────────────────────────────────────
    const attack  = style === 'pad' ? 0.12 : 0.008;
    const decay   = style === 'pad' ? 0.4  : 0.18;
    const sustain = style === 'pad' ? 0.8  : 0.65;
    const release = style === 'pad' ? 1.2  : 0.55;

    const noteEnd = startTime + durationSec;
    const releaseStart = Math.max(startTime + attack + decay, noteEnd - release);

    // ── Oscillator 1: sine (fundamental) ────────────────────────────────────
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = freq;

    // ── Oscillator 2: triangle (rich harmonics) ──────────────────────────────
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq;
    osc2.detune.value = 5;   // +5 cents creates warm chorusing

    // ── Oscillator 3: sine sub-octave for warmth ─────────────────────────────
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = freq * 2;
    osc3.detune.value = -3;

    // ── Gain mix ─────────────────────────────────────────────────────────────
    const g1 = ctx.createGain(); g1.gain.value = 0.50;
    const g2 = ctx.createGain(); g2.gain.value = 0.30;
    const g3 = ctx.createGain(); g3.gain.value = 0.12;

    // ── ADSR envelope ────────────────────────────────────────────────────────
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(velocity, startTime + attack);
    env.gain.exponentialRampToValueAtTime(sustain * velocity, startTime + attack + decay);
    env.gain.setValueAtTime(sustain * velocity, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    // ── Filter modulation (piano-like brightness on attack) ──────────────────
    const noteFilter = ctx.createBiquadFilter();
    noteFilter.type = 'lowpass';
    noteFilter.frequency.setValueAtTime(4000, startTime);
    noteFilter.frequency.exponentialRampToValueAtTime(1200, startTime + 0.3);
    noteFilter.Q.value = 0.5;

    // ── Connect graph ────────────────────────────────────────────────────────
    osc1.connect(g1); osc2.connect(g2); osc3.connect(g3);
    g1.connect(env); g2.connect(env); g3.connect(env);
    env.connect(noteFilter);
    noteFilter.connect(this.output);

    const stopTime = releaseStart + release + 0.05;
    osc1.start(startTime); osc1.stop(stopTime);
    osc2.start(startTime); osc2.stop(stopTime);
    osc3.start(startTime); osc3.stop(stopTime);
  }

  private schedulePowerNote(midi: number, startTime: number, durationSec: number, velocity: number) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);
    const release = 0.3;
    const releaseStart = startTime + durationSec - release;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    const distortion = ctx.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(40);
    distortion.oversample = '2x';

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(velocity * 0.7, startTime + 0.01);
    env.gain.setValueAtTime(velocity * 0.7, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    osc.connect(distortion);
    distortion.connect(env);
    env.connect(this.output);

    osc.start(startTime);
    osc.stop(releaseStart + release + 0.05);
  }

  // ── Reverb impulse response (synthetic exponential noise decay) ────────────

  private buildImpulseResponse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx;
    const length = ctx.sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const n = 256;
    const curve = new Float32Array(n) as Float32Array<ArrayBuffer>;
    const deg = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }
}
