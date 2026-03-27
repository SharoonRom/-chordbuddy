import type { Instrument } from '../types';
import { midiToFreq } from '../music/MusicTheory';

// ─── Chord Synthesizer ─────────────────────────────────────────────────────────
// Three distinct instruments via additive synthesis (no samples).

export interface ChordScheduleEvent {
  notes: number[];
  startTime: number;
  durationSec: number;
  velocity?: number;
}

export class ChordSynth {
  private ctx: AudioContext;
  private output: GainNode;
  private reverb: ConvolverNode;
  private instrument: Instrument = 'piano';

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    this.output = ctx.createGain();
    this.output.gain.value = 0.8;

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.buildImpulse(1.6, 2.2);

    const dry = ctx.createGain(); dry.gain.value = 0.55;
    const wet = ctx.createGain(); wet.gain.value = 0.45;

    this.output.connect(dry);
    this.output.connect(this.reverb);
    this.reverb.connect(wet);
    dry.connect(destination);
    wet.connect(destination);
  }

  setVolume(v: number) {
    this.output.gain.setTargetAtTime(v * 0.85, this.ctx.currentTime, 0.02);
  }

  setInstrument(instrument: Instrument) {
    this.instrument = instrument;
  }

  scheduleChord(event: ChordScheduleEvent) {
    const { notes, startTime, durationSec, velocity = 0.78 } = event;
    switch (this.instrument) {
      case 'guitar':
        this.strumGuitar(notes, startTime, durationSec, velocity);
        break;
      case 'pad':
        notes.forEach(m => this.schedulePad(m, startTime, durationSec, velocity));
        break;
      default:
        notes.forEach(m => this.schedulePiano(m, startTime, durationSec, velocity));
    }
  }

  // ── Piano (additive: sine + triangle + octave, filter sweep) ────────────────

  private schedulePiano(midi: number, t: number, dur: number, vel: number) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);

    const osc1 = ctx.createOscillator(); osc1.type = 'sine';     osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = freq;     osc2.detune.value = 5;
    const osc3 = ctx.createOscillator(); osc3.type = 'sine';     osc3.frequency.value = freq * 2; osc3.detune.value = -3;

    const g1 = ctx.createGain(); g1.gain.value = 0.50 * vel;
    const g2 = ctx.createGain(); g2.gain.value = 0.28 * vel;
    const g3 = ctx.createGain(); g3.gain.value = 0.12 * vel;

    const attack = 0.008, decay = 0.2, sustain = 0.65, release = 0.55;
    const relStart = Math.max(t + attack + decay, t + dur - release);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(1, t + attack);
    env.gain.exponentialRampToValueAtTime(sustain, t + attack + decay);
    env.gain.setValueAtTime(sustain, relStart);
    env.gain.exponentialRampToValueAtTime(0.0001, relStart + release);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(3500, t);
    filt.frequency.exponentialRampToValueAtTime(900, t + 0.25);
    filt.Q.value = 0.6;

    [osc1, osc2, osc3].forEach((o, i) => o.connect([g1, g2, g3][i]));
    [g1, g2, g3].forEach(g => g.connect(env));
    env.connect(filt); filt.connect(this.output);

    const stop = relStart + release + 0.05;
    [osc1, osc2, osc3].forEach(o => { o.start(t); o.stop(stop); });
  }

  // ── Guitar (plucked strum: sharp attack, exponential decay) ─────────────────

  private strumGuitar(notes: number[], t: number, dur: number, vel: number) {
    // Sort low→high for strum direction
    const sorted = [...notes].sort((a, b) => a - b);
    sorted.forEach((midi, i) => {
      this.pluckString(midi, t + i * 0.018, dur, vel);
    });
  }

  private pluckString(midi: number, t: number, dur: number, vel: number) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);
    // Guitar naturally decays — cap at 2s
    const decay = Math.min(dur, 2.0);

    // Three harmonics (characteristic of plucked string)
    const osc1 = ctx.createOscillator(); osc1.type = 'triangle'; osc1.frequency.value = freq;
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = freq * 2;
    const osc3 = ctx.createOscillator(); osc3.type = 'sawtooth'; osc3.frequency.value = freq * 3; osc3.detune.value = 4;

    const g1 = ctx.createGain(); g1.gain.value = 0.48 * vel;
    const g2 = ctx.createGain(); g2.gain.value = 0.18 * vel;
    const g3 = ctx.createGain(); g3.gain.value = 0.08 * vel;

    // Attack noise click (pick transient)
    const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate);
    const cd = clickBuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (cd.length * 0.12));
    const click = ctx.createBufferSource(); click.buffer = clickBuf;
    const gc = ctx.createGain(); gc.gain.value = 0.22 * vel;

    // Pluck envelope: instant attack, natural exponential decay
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, t);
    env.gain.linearRampToValueAtTime(1.0, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.001, t + decay);

    // Bright initial filter, rolls off quickly (guitar pick tone)
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(Math.min(freq * 14, 9000), t);
    filt.frequency.exponentialRampToValueAtTime(freq * 2.5, t + 0.12);
    filt.Q.value = 1.8;

    [osc1, osc2, osc3].forEach((o, i) => o.connect([g1, g2, g3][i]));
    [g1, g2, g3, gc].forEach(g => g.connect(env));
    click.connect(gc);
    env.connect(filt); filt.connect(this.output);

    const stop = t + decay + 0.04;
    [osc1, osc2, osc3].forEach(o => { o.start(t); o.stop(stop); });
    click.start(t); click.stop(t + 0.022);
  }

  // ── Pad (slow attack, lush detuned, long release) ────────────────────────────

  private schedulePad(midi: number, t: number, dur: number, vel: number) {
    const ctx = this.ctx;
    const freq = midiToFreq(midi);

    const attack = 0.35, release = 1.4, sustain = 0.78;
    const relStart = Math.max(t + attack, t + dur - release);

    // 4 detuned oscillators for lush texture
    const detunes = [-12, -4, 4, 12];
    const oscs = detunes.map(det => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = det;
      return o;
    });
    // 5th osc: octave up triangle for sparkle
    const osc5 = ctx.createOscillator(); osc5.type = 'triangle'; osc5.frequency.value = freq * 2;

    const gains = oscs.map(() => { const g = ctx.createGain(); g.gain.value = 0.22 * vel; return g; });
    const g5 = ctx.createGain(); g5.gain.value = 0.10 * vel;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.linearRampToValueAtTime(1, t + attack);
    env.gain.setValueAtTime(sustain, relStart);
    env.gain.exponentialRampToValueAtTime(0.0001, relStart + release);

    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(400, t);
    filt.frequency.linearRampToValueAtTime(2000, t + attack * 1.5);
    filt.Q.value = 0.8;

    oscs.forEach((o, i) => { o.connect(gains[i]); gains[i].connect(env); });
    osc5.connect(g5); g5.connect(env);
    env.connect(filt); filt.connect(this.output);

    const stop = relStart + release + 0.05;
    oscs.forEach(o => { o.start(t); o.stop(stop); });
    osc5.start(t); osc5.stop(stop);
  }

  // ── Reverb impulse (synthetic exponential noise) ────────────────────────────

  private buildImpulse(dur: number, decay: number): AudioBuffer {
    const len = this.ctx.sampleRate * dur;
    const buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
}
