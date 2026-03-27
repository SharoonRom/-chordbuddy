// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Genre = 'slow-indie' | 'ambient' | 'rock' | 'pop' | 'sad' | 'happy';

export type ChordType =
  | 'major' | 'minor' | 'major7' | 'minor7'
  | 'dom7' | 'sus2' | 'sus4' | 'dim' | 'power' | 'add9';

export type ScaleType = 'major' | 'minor';

export interface Chord {
  id: string;
  name: string;         // display: "Am", "Cmaj7"
  root: string;         // "A", "C#"
  type: ChordType;
  notes: number[];      // MIDI note numbers
  durationBeats: number;
  position: number;     // absolute beat offset in timeline
  degree: number;       // 1–7 scale degree
}

export interface DrumPattern {
  name: string;
  kick:  boolean[];    // 16 steps
  snare: boolean[];
  hihat: boolean[];
}

export interface ProgressionTemplate {
  degrees: number[];   // 1-based scale degrees
  scale: ScaleType;
  name: string;
  beatsPerChord: number;
}

export interface GenreConfig {
  label: string;
  bpmRange: [number, number];
  progressions: ProgressionTemplate[];
  preferredKeys: string[];
  drumPatterns: DrumPattern[];
  chordStyle: 'simple' | 'extended' | 'ambient' | 'power';
  beatsPerChord: number;
}

export interface Session {
  id: string;
  name: string;
  genre: Genre;
  key: string;
  bpm: number;
  chords: Chord[];
  drumPattern: DrumPattern;
  createdAt: number;
}
