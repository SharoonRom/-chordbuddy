import type { Chord, DrumPattern } from '../types';
import { ChordSynth } from './ChordSynth';
import { DrumSynth } from './DrumSynth';

// ─── Callbacks ────────────────────────────────────────────────────────────────

export interface AudioEngineCallbacks {
  onBeat: (beat: number) => void;          // called every 16th note (for animation)
  onChordChange: (index: number) => void;  // called when active chord changes
}

// ─── Transport Engine + Lookahead Scheduler ───────────────────────────────────

const LOOKAHEAD_MS = 25;          // scheduler interval
const SCHEDULE_AHEAD_SEC = 0.12;  // how far ahead to schedule notes

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  private ctx!: AudioContext;
  private masterGain!: GainNode;
  private chordGain!: GainNode;
  private drumGain!: GainNode;

  private chordSynth!: ChordSynth;
  private drumSynth!: DrumSynth;

  // Transport state
  private _isPlaying = false;
  private bpm = 120;
  private chords: Chord[] = [];
  private drumPattern: DrumPattern | null = null;

  // Scheduler internals
  private schedulerInterval: ReturnType<typeof setInterval> | null = null;
  private nextChordIdx = 0;
  private nextChordTime = 0;
  private nextDrumStep = 0;
  private nextDrumTime = 0;

  // For beat tracking (RAF-based)
  private transportStart = 0;
  private rafHandle = 0;

  private callbacks: AudioEngineCallbacks = {
    onBeat: () => {},
    onChordChange: () => {},
  };

  static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  private constructor() {}

  // ── Initialization ──────────────────────────────────────────────────────────

  async init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.85;
    this.masterGain.connect(this.ctx.destination);

    this.chordGain = this.ctx.createGain();
    this.chordGain.gain.value = 1.0;
    this.chordGain.connect(this.masterGain);

    this.drumGain = this.ctx.createGain();
    this.drumGain.gain.value = 1.0;
    this.drumGain.connect(this.masterGain);

    this.chordSynth = new ChordSynth(this.ctx, this.chordGain);
    this.drumSynth = new DrumSynth(this.ctx, this.drumGain);
  }

  async resume() {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setCallbacks(cb: Partial<AudioEngineCallbacks>) {
    this.callbacks = { ...this.callbacks, ...cb };
  }

  // ── Transport ───────────────────────────────────────────────────────────────

  async play(chords: Chord[], drumPattern: DrumPattern, bpm: number) {
    await this.init();
    await this.resume();

    this.stop();

    this.bpm = bpm;
    this.chords = chords;
    this.drumPattern = drumPattern;
    this._isPlaying = true;

    const now = this.ctx.currentTime;
    this.transportStart = now;

    this.nextChordIdx = 0;
    this.nextChordTime = now;
    this.nextDrumStep = 0;
    this.nextDrumTime = now;

    // Kick off scheduler and RAF
    this.schedulerInterval = setInterval(() => this.runScheduler(), LOOKAHEAD_MS);
    this.runScheduler(); // run immediately
    this.startRAF();
  }

  stop() {
    this._isPlaying = false;

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }
    cancelAnimationFrame(this.rafHandle);
    this.callbacks.onBeat(0);
    this.callbacks.onChordChange(-1);
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  setMasterVolume(v: number) {
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  setChordVolume(v: number) {
    if (this.chordSynth) this.chordSynth.setVolume(v);
  }

  setDrumVolume(v: number) {
    if (this.drumSynth) this.drumSynth.setVolume(v);
  }

  get isPlaying() {
    return this._isPlaying;
  }

  // ── Lookahead Scheduler ─────────────────────────────────────────────────────

  private runScheduler() {
    if (!this._isPlaying || !this.ctx) return;

    const horizon = this.ctx.currentTime + SCHEDULE_AHEAD_SEC;

    // ── Schedule drums ───────────────────────────────────────────────────────
    if (this.drumPattern) {
      const secPer16th = (60 / this.bpm) / 4;
      while (this.nextDrumTime < horizon) {
        const step = this.nextDrumStep % this.drumPattern.kick.length;
        const t = this.nextDrumTime;
        if (this.drumPattern.kick[step])  this.drumSynth.scheduleKick(t);
        if (this.drumPattern.snare[step]) this.drumSynth.scheduleSnare(t);
        if (this.drumPattern.hihat[step]) this.drumSynth.scheduleHihat(t);
        this.nextDrumStep++;
        this.nextDrumTime += secPer16th;
      }
    }

    // ── Schedule chords ──────────────────────────────────────────────────────
    if (this.chords.length === 0) return;
    const secPerBeat = 60 / this.bpm;

    while (this.nextChordTime < horizon) {
      const idx = this.nextChordIdx % this.chords.length;
      const chord = this.chords[idx];
      const durationSec = chord.durationBeats * secPerBeat;

      this.chordSynth.scheduleChord({
        notes: chord.notes,
        startTime: this.nextChordTime,
        durationSec,
        velocity: 0.78,
        style: chord.type === 'power' ? 'power' : chord.type.includes('7') || chord.type === 'add9' ? 'pad' : 'piano',
      });

      this.nextChordIdx++;
      this.nextChordTime += durationSec;
    }
  }

  // ── RAF-based beat & chord tracking ─────────────────────────────────────────

  private startRAF() {
    const tick = () => {
      if (!this._isPlaying || !this.ctx) return;

      const elapsed = this.ctx.currentTime - this.transportStart;
      const totalBeats = this.chords.reduce((s, c) => s + c.durationBeats, 0);
      const loopBeats = totalBeats > 0 ? totalBeats : 16;
      const currentBeat = elapsed > 0 ? (elapsed / (60 / this.bpm)) % loopBeats : 0;

      this.callbacks.onBeat(currentBeat);

      // Which chord is active?
      if (this.chords.length > 0) {
        let acc = 0;
        const loopBeat = currentBeat % loopBeats;
        for (let i = 0; i < this.chords.length; i++) {
          acc += this.chords[i].durationBeats;
          if (loopBeat < acc) {
            this.callbacks.onChordChange(i);
            break;
          }
        }
      }

      this.rafHandle = requestAnimationFrame(tick);
    };
    this.rafHandle = requestAnimationFrame(tick);
  }
}
