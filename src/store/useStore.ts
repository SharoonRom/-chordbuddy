import { create } from 'zustand';
import type { Chord, DrumPattern, Genre, Instrument, PlayMode, ScaleType, Section, SectionType, Session, Theme } from '../types';
import { AudioEngine } from '../audio/AudioEngine';
import { generateProgression } from '../music/GenreEngine';
import { pickDrumPattern } from '../music/DrumPatterns';
import { v4 as uuid } from '../utils/uuid';

// ─── Persistence ──────────────────────────────────────────────────────────────

interface Stored { sessions: Session[]; masterVolume: number; chordVolume: number; drumVolume: number; instrument: Instrument; theme: Theme; }

function load(): Partial<Stored> {
  try { return JSON.parse(localStorage.getItem('chordbuddy-v2') ?? '{}'); } catch { return {}; }
}
function save(s: Partial<Stored>) {
  try { localStorage.setItem('chordbuddy-v2', JSON.stringify(s)); } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function reposition(chords: Chord[]): Chord[] {
  let pos = 0;
  return chords.map(c => { const nc = { ...c, position: pos }; pos += c.durationBeats; return nc; });
}

function freshChords(chords: Chord[]): Chord[] {
  return reposition(chords.map(c => ({ ...c, id: uuid() })));
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
}

const SECTION_LABELS: Record<SectionType, string> = {
  intro: 'Intro', verse: 'Verse', chorus: 'Chorus', bridge: 'Bridge', outro: 'Outro',
};

// ─── State Shape ──────────────────────────────────────────────────────────────

export interface AppState {
  // Music
  genre: Genre;
  key: string;
  scale: ScaleType;
  bpm: number;
  instrument: Instrument;

  // Structure
  sections: Section[];
  arrangement: string[];   // ordered section IDs for full-song play

  // Playback
  isPlaying: boolean;
  playMode: PlayMode;
  activeSectionId: string | null;
  currentBeat: number;
  currentChordIndex: number;
  drumPattern: DrumPattern;

  // Volumes
  masterVolume: number;
  chordVolume: number;
  drumVolume: number;

  // UI
  theme: Theme;
  sessions: Session[];
  chordPickerSectionId: string | null;
  addSectionOpen: boolean;

  // ── Actions ────────────────────────────────────────────────────────────────
  selectGenre: (genre: Genre) => void;

  // Sections
  addSection: (type: SectionType) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  setSectionLabel: (id: string, label: string) => void;

  // Chords
  addChordToSection: (sectionId: string, chord: Chord) => void;
  removeChordFromSection: (sectionId: string, chordId: string) => void;
  moveChordInSection: (sectionId: string, chordId: string, dir: 'left' | 'right') => void;
  updateChordDurationInSection: (sectionId: string, chordId: string, beats: number) => void;

  // Arrangement
  addToArrangement: (sectionId: string) => void;
  removeFromArrangement: (index: number) => void;
  moveInArrangement: (from: number, to: number) => void;

  // Playback
  playSection: (sectionId: string) => void;
  playSong: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setKey: (key: string) => void;

  // Instrument & theme
  setInstrument: (instrument: Instrument) => void;
  setTheme: (theme: Theme) => void;

  // Volume
  setMasterVolume: (v: number) => void;
  setChordVolume: (v: number) => void;
  setDrumVolume: (v: number) => void;

  // Drum editing
  setDrumStep: (track: 'kick' | 'snare' | 'hihat', step: number, value: boolean) => void;

  // Chord picker UI
  openChordPicker: (sectionId: string) => void;
  closeChordPicker: () => void;
  setAddSectionOpen: (open: boolean) => void;

  // Sessions
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const stored = load();

export const useStore = create<AppState>((set, get) => {
  const engine = AudioEngine.getInstance();

  engine.setCallbacks({
    onBeat: (beat) => set({ currentBeat: beat }),
    onChordChange: (index) => set({ currentChordIndex: index }),
  });

  // Apply persisted theme immediately
  if (stored.theme) applyTheme(stored.theme);

  const persist = () => {
    const s = get();
    save({ sessions: s.sessions, masterVolume: s.masterVolume, chordVolume: s.chordVolume, drumVolume: s.drumVolume, instrument: s.instrument, theme: s.theme });
  };

  const applyVolumes = () => {
    const { masterVolume, chordVolume, drumVolume, instrument } = get();
    engine.setMasterVolume(masterVolume);
    engine.setChordVolume(chordVolume);
    engine.setDrumVolume(drumVolume);
    engine.setInstrument(instrument);
  };

  // Build sections from a single generated progression
  const buildSections = (genre: Genre, key?: string) => {
    const r1 = generateProgression(genre, key);
    const r2 = generateProgression(genre, r1.key);

    const introChords = freshChords(r1.chords.slice(0, 2));
    const verseChords = freshChords(r1.chords);
    const chorusChords = freshChords(r2.chords);

    const intro:  Section = { id: uuid(), type: 'intro',  label: 'Intro',  chords: introChords };
    const verse:  Section = { id: uuid(), type: 'verse',  label: 'Verse',  chords: verseChords };
    const chorus: Section = { id: uuid(), type: 'chorus', label: 'Chorus', chords: chorusChords };

    return {
      sections: [intro, verse, chorus],
      arrangement: [intro.id, verse.id, chorus.id, verse.id, chorus.id],
      bpm: r1.bpm,
      key: r1.key,
      scale: r1.scale,
      drumPattern: pickDrumPattern(genre),
    };
  };

  return {
    // Default state
    genre: 'pop',
    key: 'C',
    scale: 'major',
    bpm: 120,
    instrument: stored.instrument ?? 'piano',
    sections: [],
    arrangement: [],
    isPlaying: false,
    playMode: 'idle',
    activeSectionId: null,
    currentBeat: 0,
    currentChordIndex: -1,
    drumPattern: pickDrumPattern('pop'),
    masterVolume: stored.masterVolume ?? 0.85,
    chordVolume:  stored.chordVolume  ?? 0.75,
    drumVolume:   stored.drumVolume   ?? 0.65,
    theme: stored.theme ?? 'dark',
    sessions: stored.sessions ?? [],
    chordPickerSectionId: null,
    addSectionOpen: false,

    // ── Genre ─────────────────────────────────────────────────────────────────
    selectGenre: (genre) => {
      engine.stop();
      const built = buildSections(genre);
      set({ genre, ...built, isPlaying: false, playMode: 'idle', activeSectionId: null, currentBeat: 0, currentChordIndex: -1 });
    },

    // ── Sections ──────────────────────────────────────────────────────────────
    addSection: (type) => {
      const section: Section = { id: uuid(), type, label: SECTION_LABELS[type], chords: [] };
      set(s => ({ sections: [...s.sections, section], addSectionOpen: false }));
    },

    removeSection: (id) => {
      engine.stop();
      set(s => ({
        sections: s.sections.filter(sec => sec.id !== id),
        arrangement: s.arrangement.filter(sid => sid !== id),
        isPlaying: false,
        activeSectionId: s.activeSectionId === id ? null : s.activeSectionId,
      }));
    },

    duplicateSection: (id) => {
      const src = get().sections.find(s => s.id === id);
      if (!src) return;
      const copy: Section = { ...src, id: uuid(), label: src.label + ' 2', chords: freshChords(src.chords) };
      set(s => ({ sections: [...s.sections, copy] }));
    },

    setSectionLabel: (id, label) => {
      set(s => ({ sections: s.sections.map(sec => sec.id === id ? { ...sec, label } : sec) }));
    },

    // ── Chords ────────────────────────────────────────────────────────────────
    addChordToSection: (sectionId, chord) => {
      set(s => ({
        sections: s.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          const updated = reposition([...sec.chords, { ...chord, id: uuid() }]);
          return { ...sec, chords: updated };
        }),
        chordPickerSectionId: null,
      }));
    },

    removeChordFromSection: (sectionId, chordId) => {
      set(s => ({
        sections: s.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          return { ...sec, chords: reposition(sec.chords.filter(c => c.id !== chordId)) };
        }),
      }));
    },

    moveChordInSection: (sectionId, chordId, dir) => {
      set(s => ({
        sections: s.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          const idx = sec.chords.findIndex(c => c.id === chordId);
          if (idx === -1) return sec;
          const newIdx = dir === 'left' ? idx - 1 : idx + 1;
          if (newIdx < 0 || newIdx >= sec.chords.length) return sec;
          const arr = [...sec.chords];
          [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
          return { ...sec, chords: reposition(arr) };
        }),
      }));
    },

    updateChordDurationInSection: (sectionId, chordId, beats) => {
      set(s => ({
        sections: s.sections.map(sec => {
          if (sec.id !== sectionId) return sec;
          return { ...sec, chords: reposition(sec.chords.map(c => c.id === chordId ? { ...c, durationBeats: beats } : c)) };
        }),
      }));
    },

    // ── Arrangement ───────────────────────────────────────────────────────────
    addToArrangement: (sectionId) => set(s => ({ arrangement: [...s.arrangement, sectionId] })),
    removeFromArrangement: (index) => set(s => ({ arrangement: s.arrangement.filter((_, i) => i !== index) })),
    moveInArrangement: (from, to) => {
      set(s => {
        const arr = [...s.arrangement];
        const [item] = arr.splice(from, 1);
        arr.splice(to, 0, item);
        return { arrangement: arr };
      });
    },

    // ── Playback ──────────────────────────────────────────────────────────────
    playSection: (sectionId) => {
      const { sections, drumPattern, bpm, isPlaying, activeSectionId, playMode } = get();
      // Toggle off if same section is playing
      if (isPlaying && playMode === 'section' && activeSectionId === sectionId) {
        engine.stop();
        set({ isPlaying: false, playMode: 'idle', activeSectionId: null, currentBeat: 0 });
        return;
      }
      const section = sections.find(s => s.id === sectionId);
      if (!section || section.chords.length === 0) return;
      applyVolumes();
      engine.play(section.chords, drumPattern, bpm);
      set({ isPlaying: true, playMode: 'section', activeSectionId: sectionId, currentBeat: 0 });
    },

    playSong: () => {
      const { sections, arrangement, drumPattern, bpm, isPlaying } = get();
      if (isPlaying) {
        engine.stop();
        set({ isPlaying: false, playMode: 'idle', activeSectionId: null, currentBeat: 0 });
        return;
      }
      // Flatten arrangement into chord array
      const flat: Chord[] = [];
      let pos = 0;
      arrangement.forEach(sid => {
        const sec = sections.find(s => s.id === sid);
        if (!sec) return;
        sec.chords.forEach(c => {
          flat.push({ ...c, id: uuid(), position: pos });
          pos += c.durationBeats;
        });
      });
      if (flat.length === 0) return;
      applyVolumes();
      engine.play(flat, drumPattern, bpm);
      set({ isPlaying: true, playMode: 'song', activeSectionId: null, currentBeat: 0 });
    },

    stop: () => {
      engine.stop();
      set({ isPlaying: false, playMode: 'idle', activeSectionId: null, currentBeat: 0, currentChordIndex: -1 });
    },

    setBpm: (bpm) => {
      set({ bpm });
      engine.setBpm(bpm);
      const { isPlaying, playMode, activeSectionId, sections, drumPattern } = get();
      if (isPlaying) {
        if (playMode === 'section' && activeSectionId) {
          const sec = sections.find(s => s.id === activeSectionId);
          if (sec) engine.play(sec.chords, drumPattern, bpm);
        } else if (playMode === 'song') {
          get().playSong();
        }
      }
    },

    setKey: (key) => {
      engine.stop();
      const { genre } = get();
      const built = buildSections(genre, key);
      set({ ...built, key, isPlaying: false, playMode: 'idle', activeSectionId: null, currentBeat: 0 });
    },

    // ── Instrument & Theme ────────────────────────────────────────────────────
    setInstrument: (instrument) => {
      set({ instrument });
      engine.setInstrument(instrument);
      persist();
    },

    setTheme: (theme) => {
      set({ theme });
      applyTheme(theme);
      persist();
    },

    // ── Volumes ───────────────────────────────────────────────────────────────
    setMasterVolume: (v) => { set({ masterVolume: v }); engine.setMasterVolume(v); persist(); },
    setChordVolume:  (v) => { set({ chordVolume: v });  engine.setChordVolume(v);  persist(); },
    setDrumVolume:   (v) => { set({ drumVolume: v });   engine.setDrumVolume(v);   persist(); },

    // ── Drums ─────────────────────────────────────────────────────────────────
    setDrumStep: (track, step, value) => {
      const dp = { ...get().drumPattern, [track]: [...get().drumPattern[track]] };
      dp[track][step] = value;
      set({ drumPattern: dp });
      const { isPlaying, playMode, activeSectionId, sections, bpm } = get();
      if (isPlaying) {
        if (playMode === 'section' && activeSectionId) {
          const sec = sections.find(s => s.id === activeSectionId);
          if (sec) engine.play(sec.chords, dp, bpm);
        }
      }
    },

    // ── Chord Picker ──────────────────────────────────────────────────────────
    openChordPicker: (sectionId) => set({ chordPickerSectionId: sectionId }),
    closeChordPicker: () => set({ chordPickerSectionId: null }),
    setAddSectionOpen: (open) => set({ addSectionOpen: open }),

    // ── Sessions ──────────────────────────────────────────────────────────────
    saveSession: (name) => {
      const { genre, key, scale, bpm, instrument, sections, arrangement, drumPattern, sessions } = get();
      const session: Session = { id: uuid(), name, genre, key, scale, bpm, instrument, sections, arrangement, drumPattern, createdAt: Date.now() };
      const next = [session, ...sessions].slice(0, 20);
      set({ sessions: next });
      persist();
    },

    loadSession: (id) => {
      const session = get().sessions.find(s => s.id === id);
      if (!session) return;
      engine.stop();
      applyTheme(get().theme);
      set({ genre: session.genre, key: session.key, scale: session.scale, bpm: session.bpm, instrument: session.instrument, sections: session.sections, arrangement: session.arrangement, drumPattern: session.drumPattern, isPlaying: false, playMode: 'idle', activeSectionId: null });
      engine.setInstrument(session.instrument);
    },

    deleteSession: (id) => {
      const next = get().sessions.filter(s => s.id !== id);
      set({ sessions: next });
      persist();
    },
  };
});
