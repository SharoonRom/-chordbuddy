import { create } from 'zustand';
import type { Chord, DrumPattern, Genre, Session } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { generateProgression } from '../music/GenreEngine';
import { pickDrumPattern } from '../music/DrumPatterns';
import { v4 as uuid } from '../utils/uuid';

// ─── Simple localStorage persistence (no middleware) ─────────────────────────

const STORAGE_KEY = 'chordbuddy-v1';

interface Persisted {
  sessions: Session[];
  masterVolume: number;
  chordVolume: number;
  drumVolume: number;
}

function loadPersisted(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
  } catch {
    return {};
  }
}

function savePersisted(data: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  genre: Genre;
  key: string;
  bpm: number;
  isPlaying: boolean;
  currentBeat: number;
  currentChordIndex: number;
  chords: Chord[];
  drumPattern: DrumPattern;
  masterVolume: number;
  chordVolume: number;
  drumVolume: number;
  sessions: Session[];
  progressionName: string;

  selectGenre: (genre: Genre) => void;
  regenerate: () => void;
  setKey: (key: string) => void;
  setBpm: (bpm: number) => void;
  play: () => void;
  stop: () => void;
  setMasterVolume: (v: number) => void;
  setChordVolume: (v: number) => void;
  setDrumVolume: (v: number) => void;
  removeChord: (id: string) => void;
  updateChordDuration: (id: string, beats: number) => void;
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setDrumStep: (track: 'kick' | 'snare' | 'hihat', step: number, value: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const stored = loadPersisted();
const DEFAULT_DRUM: DrumPattern = pickDrumPattern('pop');

export const useStore = create<AppState>((set, get) => {
  const engine = AudioEngine.getInstance();

  // Wire audio engine callbacks — called via RAF, safe to call set() here
  engine.setCallbacks({
    onBeat: (beat) => set({ currentBeat: beat }),
    onChordChange: (index) => set({ currentChordIndex: index }),
  });

  const persist = () => {
    const s = get();
    savePersisted({
      sessions: s.sessions,
      masterVolume: s.masterVolume,
      chordVolume: s.chordVolume,
      drumVolume: s.drumVolume,
    });
  };

  const applyVolumes = () => {
    const { masterVolume, chordVolume, drumVolume } = get();
    engine.setMasterVolume(masterVolume);
    engine.setChordVolume(chordVolume);
    engine.setDrumVolume(drumVolume);
  };

  return {
    // ── Default state ─────────────────────────────────────────────────────────
    genre: 'pop',
    key: 'C',
    bpm: 120,
    isPlaying: false,
    currentBeat: 0,
    currentChordIndex: -1,
    chords: [],
    drumPattern: DEFAULT_DRUM,
    masterVolume: stored.masterVolume ?? 0.85,
    chordVolume:  stored.chordVolume  ?? 0.75,
    drumVolume:   stored.drumVolume   ?? 0.65,
    sessions:     stored.sessions     ?? [],
    progressionName: '',

    // ── Genre + Generation ────────────────────────────────────────────────────
    selectGenre: (genre) => {
      engine.stop();
      const result = generateProgression(genre);
      const drum = pickDrumPattern(genre);
      set({
        genre,
        chords: result.chords,
        bpm: result.bpm,
        key: result.key,
        drumPattern: drum,
        progressionName: result.templateName,
        isPlaying: false,
        currentBeat: 0,
        currentChordIndex: -1,
      });
    },

    regenerate: () => {
      const { genre, key, isPlaying } = get();
      engine.stop();
      const result = generateProgression(genre, key);
      const drum = pickDrumPattern(genre);
      set({
        chords: result.chords,
        drumPattern: drum,
        progressionName: result.templateName,
        isPlaying: false,
        currentBeat: 0,
        currentChordIndex: -1,
      });
      if (isPlaying) setTimeout(() => get().play(), 50);
    },

    // ── Key & BPM ─────────────────────────────────────────────────────────────
    setKey: (key) => {
      engine.stop();
      const { genre } = get();
      const result = generateProgression(genre, key);
      set({
        key,
        chords: result.chords,
        progressionName: result.templateName,
        isPlaying: false,
        currentBeat: 0,
        currentChordIndex: -1,
      });
    },

    setBpm: (bpm) => {
      set({ bpm });
      engine.setBpm(bpm);
      const { isPlaying, chords, drumPattern } = get();
      if (isPlaying) engine.play(chords, drumPattern, bpm);
    },

    // ── Playback ──────────────────────────────────────────────────────────────
    play: () => {
      const { chords, drumPattern, bpm } = get();
      if (chords.length === 0) return;
      applyVolumes();
      engine.play(chords, drumPattern, bpm);
      set({ isPlaying: true });
    },

    stop: () => {
      engine.stop();
      set({ isPlaying: false, currentBeat: 0, currentChordIndex: -1 });
    },

    // ── Volumes ───────────────────────────────────────────────────────────────
    setMasterVolume: (v) => { set({ masterVolume: v }); engine.setMasterVolume(v); persist(); },
    setChordVolume:  (v) => { set({ chordVolume: v });  engine.setChordVolume(v);  persist(); },
    setDrumVolume:   (v) => { set({ drumVolume: v });   engine.setDrumVolume(v);   persist(); },

    // ── Chord editing ─────────────────────────────────────────────────────────
    removeChord: (id) => {
      engine.stop();
      let pos = 0;
      const updated = get().chords
        .filter((c) => c.id !== id)
        .map((c) => { const nc = { ...c, position: pos }; pos += c.durationBeats; return nc; });
      set({ chords: updated, isPlaying: false });
    },

    updateChordDuration: (id, beats) => {
      let pos = 0;
      const updated = get().chords.map((c) => {
        const dur = c.id === id ? beats : c.durationBeats;
        const nc = { ...c, durationBeats: dur, position: pos };
        pos += dur;
        return nc;
      });
      set({ chords: updated });
    },

    // ── Drum editing ──────────────────────────────────────────────────────────
    setDrumStep: (track, step, value) => {
      const dp = { ...get().drumPattern, [track]: [...get().drumPattern[track]] };
      dp[track][step] = value;
      set({ drumPattern: dp });
      const { isPlaying, chords, bpm } = get();
      if (isPlaying) engine.play(chords, dp, bpm);
    },

    // ── Sessions ──────────────────────────────────────────────────────────────
    saveSession: (name) => {
      const { genre, key, bpm, chords, drumPattern, sessions } = get();
      const session: Session = {
        id: uuid(), name, genre, key, bpm, chords, drumPattern, createdAt: Date.now(),
      };
      const next = [session, ...sessions].slice(0, 20);
      set({ sessions: next });
      persist();
    },

    loadSession: (id) => {
      const session = get().sessions.find((s) => s.id === id);
      if (!session) return;
      engine.stop();
      set({
        genre: session.genre, key: session.key, bpm: session.bpm,
        chords: session.chords, drumPattern: session.drumPattern,
        isPlaying: false, currentBeat: 0, currentChordIndex: -1,
      });
    },

    deleteSession: (id) => {
      const next = get().sessions.filter((s) => s.id !== id);
      set({ sessions: next });
      persist();
    },
  };
});
