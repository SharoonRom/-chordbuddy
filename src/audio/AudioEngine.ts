import type { Chord, DrumPattern, Instrument } from '../types';
import { ChordSynth } from './ChordSynth';
import { DrumSynth } from './DrumSynth';

// ─── Callbacks ────────────────────────────────────────────────────────────────

export interface AudioEngineCallbacks {
  onBeat: (beat: number) => void;
  onChordChange: (index: number) => void;
}

// ─── Transport Engine + Lookahead Scheduler ───────────────────────────────────

const LOOKAHEAD_MS      = 25;
const SCHEDULE_AHEAD    = 0.12;

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx!: AudioContext;
  private masterGain!: GainNode;
  private chordGain!: GainNode;
  private drumGain!: GainNode;
  private chordSynth!: ChordSynth;
  private drumSynth!: DrumSynth;

  private _isPlaying    = false;
  private bpm           = 120;
  private chords: Chord[]         = [];
  private drumPattern: DrumPattern | null = null;

  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private nextChordIdx  = 0;
  private nextChordTime = 0;
  private nextDrumStep  = 0;
  private nextDrumTime  = 0;
  private transportStart = 0;
  private rafHandle     = 0;

  private callbacks: AudioEngineCallbacks = { onBeat: () => {}, onChordChange: () => {} };

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) AudioEngine.instance = new AudioEngine();
    return AudioEngine.instance;
  }

  private constructor() {}

  // ── Init ────────────────────────────────────────────────────────────────────

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain(); this.masterGain.gain.value = 0.85;
    this.masterGain.connect(this.ctx.destination);

    this.chordGain = this.ctx.createGain(); this.chordGain.gain.value = 1.0;
    this.chordGain.connect(this.masterGain);

    this.drumGain = this.ctx.createGain(); this.drumGain.gain.value = 1.0;
    this.drumGain.connect(this.masterGain);

    this.chordSynth = new ChordSynth(this.ctx, this.chordGain);
    this.drumSynth  = new DrumSynth(this.ctx, this.drumGain);
  }

  async resume() {
    if (this.ctx?.state === 'suspended') await this.ctx.resume();
  }

  setCallbacks(cb: Partial<AudioEngineCallbacks>) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  // ── Transport ───────────────────────────────────────────────────────────────

  async play(chords: Chord[], drumPattern: DrumPattern, bpm: number) {
    await this.init();
    await this.resume();
    this.stop();

    this.bpm          = bpm;
    this.chords       = chords;
    this.drumPattern  = drumPattern;
    this._isPlaying   = true;

    const now = this.ctx.currentTime;
    this.transportStart = now;
    this.nextChordIdx  = 0;
    this.nextChordTime = now;
    this.nextDrumStep  = 0;
    this.nextDrumTime  = now;

    this.schedulerInterval = setInterval(() => this.tick(), LOOKAHEAD_MS);
    this.tick();
    this.startRAF();
  }

  stop() {
    this._isPlaying = false;
    if (this.schedulerInterval) { clearInterval(this.schedulerInterval); this.schedulerInterval = null; }
    cancelAnimationFrame(this.rafHandle);
    this.callbacks.onBeat(0);
    this.callbacks.onChordChange(-1);
  }

  setBpm(bpm: number) { this.bpm = bpm; }

  setMasterVolume(v: number) { if (this.masterGain) this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); }
  setChordVolume(v: number)  { if (this.chordSynth) this.chordSynth.setVolume(v); }
  setDrumVolume(v: number)   { if (this.drumSynth)  this.drumSynth.setVolume(v); }
  setInstrument(inst: Instrument) { if (this.chordSynth) this.chordSynth.setInstrument(inst); }

  get isPlaying() { return this._isPlaying; }

  // ── Lookahead Scheduler ─────────────────────────────────────────────────────

  private tick() {
    if (!this._isPlaying || !this.ctx) return;
    const horizon = this.ctx.currentTime + SCHEDULE_AHEAD;

    // Drums
    if (this.drumPattern) {
      const s16 = (60 / this.bpm) / 4;
      while (this.nextDrumTime < horizon) {
        const step = this.nextDrumStep % this.drumPattern.kick.length;
        const t = this.nextDrumTime;
        if (this.drumPattern.kick[step])  this.drumSynth.scheduleKick(t);
        if (this.drumPattern.snare[step]) this.drumSynth.scheduleSnare(t);
        if (this.drumPattern.hihat[step]) this.drumSynth.scheduleHihat(t);
        this.nextDrumStep++;
        this.nextDrumTime += s16;
      }
    }

    // Chords
    if (this.chords.length === 0) return;
    const spb = 60 / this.bpm;
    while (this.nextChordTime < horizon) {
      const idx = this.nextChordIdx % this.chords.length;
      const chord = this.chords[idx];
      const durSec = chord.durationBeats * spb;
      this.chordSynth.scheduleChord({ notes: chord.notes, startTime: this.nextChordTime, durationSec: durSec });
      this.nextChordIdx++;
      this.nextChordTime += durSec;
    }
  }

  // ── RAF beat tracker ────────────────────────────────────────────────────────

  private startRAF() {
    const tick = () => {
      if (!this._isPlaying || !this.ctx) return;
      const elapsed   = this.ctx.currentTime - this.transportStart;
      const spb       = 60 / this.bpm;
      const totalBeats = this.chords.reduce((s, c) => s + c.durationBeats, 0) || 16;
      const beat      = elapsed > 0 ? (elapsed / spb) % totalBeats : 0;

      this.callbacks.onBeat(beat);

      if (this.chords.length > 0) {
        let acc = 0;
        const lb = beat % totalBeats;
        for (let i = 0; i < this.chords.length; i++) {
          acc += this.chords[i].durationBeats;
          if (lb < acc) { this.callbacks.onChordChange(i); break; }
        }
      }
      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }
}
