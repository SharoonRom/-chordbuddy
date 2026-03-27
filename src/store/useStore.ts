import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chord, DrumPattern, Genre, Session } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { generateProgression } from '../music/GenreEngine';
import { pickDrumPattern } from '../music/DrumPatterns';
import { v4 as uuid } from '../utils/uuid';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Session
  genre: Genre;
  key: string;
  bpm: number;

  // Playback
  isPlaying: boolean;
  currentBeat: number;
  currentChordIndex: number;

  // Content
  chords: Chord[];
  drumPattern: DrumPattern;

  // Volumes  (0–1)
  masterVolume: number;
  chordVolume: number;
  drumVolume: number;

  // Saved sessions
  sessions: Session[];

  // Display info
  progressionName: string;

  // ── Actions ────────────────────────────────────────────────────────────────
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
  setCurrentBeat: (beat: number) => void;
  setCurrentChordIndex: (index: number) => void;
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setDrumStep: (track: 'kick' | 'snare' | 'hihat', step: number, value: boolean) => void;
}

// ─── Default drum pattern ─────────────────────────────────────────────────────

const DEFAULT_DRUM: DrumPattern = pickDrumPattern('pop');

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => {
      const engine = AudioEngine.getInstance();

      // Wire up audio engine callbacks to store
      engine.setCallbacks({
        onBeat: (beat) => set({ currentBeat: beat }),
        onChordChange: (index) => set({ currentChordIndex: index }),
      });

      const applyVolumes = () => {
        const { masterVolume, chordVolume, drumVolume } = get();
        engine.setMasterVolume(masterVolume);
        engine.setChordVolume(chordVolume);
        engine.setDrumVolume(drumVolume);
      };

      return {
        // ── Default state ───────────────────────────────────────────────────
        genre: 'pop',
        key: 'C',
        bpm: 120,
        isPlaying: false,
        currentBeat: 0,
        currentChordIndex: -1,
        chords: [],
        drumPattern: DEFAULT_DRUM,
        masterVolume: 0.85,
        chordVolume: 0.75,
        drumVolume: 0.65,
        sessions: [],
        progressionName: '',

        // ── Genre + Generation ──────────────────────────────────────────────
        selectGenre: (genre) => {
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
          engine.stop();
        },

        regenerate: () => {
          const { genre, key } = get();
          const result = generateProgression(genre, key);
          const drum = pickDrumPattern(genre);
          const wasPlaying = get().isPlaying;
          set({
            chords: result.chords,
            drumPattern: drum,
            progressionName: result.templateName,
            isPlaying: false,
            currentBeat: 0,
            currentChordIndex: -1,
          });
          engine.stop();
          if (wasPlaying) {
            setTimeout(() => get().play(), 50);
          }
        },

        // ── Key & BPM ───────────────────────────────────────────────────────
        setKey: (key) => {
          const { genre } = get();
          const result = generateProgression(genre, key);
          set({
            key,
            chords: result.chords,
            progressionName: result.templateName,
          });
          engine.stop();
          set({ isPlaying: false, currentBeat: 0, currentChordIndex: -1 });
        },

        setBpm: (bpm) => {
          set({ bpm });
          engine.setBpm(bpm);
          // If playing, restart with new BPM
          const { isPlaying, chords, drumPattern } = get();
          if (isPlaying) {
            engine.play(chords, drumPattern, bpm);
          }
        },

        // ── Playback ────────────────────────────────────────────────────────
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

        // ── Volumes ─────────────────────────────────────────────────────────
        setMasterVolume: (v) => {
          set({ masterVolume: v });
          engine.setMasterVolume(v);
        },
        setChordVolume: (v) => {
          set({ chordVolume: v });
          engine.setChordVolume(v);
        },
        setDrumVolume: (v) => {
          set({ drumVolume: v });
          engine.setDrumVolume(v);
        },

        // ── Chord editing ────────────────────────────────────────────────────
        removeChord: (id) => {
          const chords = get().chords.filter((c) => c.id !== id);
          // Recalculate positions
          let pos = 0;
          const updated = chords.map((c) => {
            const nc = { ...c, position: pos };
            pos += c.durationBeats;
            return nc;
          });
          set({ chords: updated });
          if (get().isPlaying) {
            engine.stop();
            set({ isPlaying: false });
          }
        },

        updateChordDuration: (id, beats) => {
          let pos = 0;
          const updated = get().chords.map((c) => {
            const nc = { ...c, position: pos };
            if (c.id === id) nc.durationBeats = beats;
            pos += nc.durationBeats;
            return nc;
          });
          set({ chords: updated });
        },

        // ── Beat/chord tracking (called by audio engine) ─────────────────────
        setCurrentBeat: (beat) => set({ currentBeat: beat }),
        setCurrentChordIndex: (index) => set({ currentChordIndex: index }),

        // ── Drum editing ─────────────────────────────────────────────────────
        setDrumStep: (track, step, value) => {
          const dp = { ...get().drumPattern };
          const arr = [...dp[track]];
          arr[step] = value;
          dp[track] = arr;
          set({ drumPattern: dp });
          if (get().isPlaying) {
            const { chords, bpm } = get();
            engine.play(chords, dp, bpm);
          }
        },

        // ── Sessions ─────────────────────────────────────────────────────────
        saveSession: (name) => {
          const { genre, key, bpm, chords, drumPattern, sessions } = get();
          const session: Session = {
            id: uuid(),
            name,
            genre,
            key,
            bpm,
            chords,
            drumPattern,
            createdAt: Date.now(),
          };
          set({ sessions: [session, ...sessions].slice(0, 20) });
        },

        loadSession: (id) => {
          const session = get().sessions.find((s) => s.id === id);
          if (!session) return;
          engine.stop();
          set({
            genre: session.genre,
            key: session.key,
            bpm: session.bpm,
            chords: session.chords,
            drumPattern: session.drumPattern,
            isPlaying: false,
            currentBeat: 0,
            currentChordIndex: -1,
          });
        },

        deleteSession: (id) => {
          set({ sessions: get().sessions.filter((s) => s.id !== id) });
        },
      };
    },
    {
      name: 'chordbuddy-state',
      partialize: (s) => ({
        sessions: s.sessions,
        masterVolume: s.masterVolume,
        chordVolume: s.chordVolume,
        drumVolume: s.drumVolume,
      }),
    },
  ),
);
