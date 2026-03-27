// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Genre = 'slow-indie' | 'ambient' | 'rock' | 'pop' | 'sad' | 'happy';
export type SectionType = 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro';
export type Instrument = 'piano' | 'guitar' | 'pad';
export type Theme = 'dark' | 'light';
export type PlayMode = 'idle' | 'section' | 'song';

export type ChordType =
  | 'major' | 'minor' | 'major7' | 'minor7'
  | 'dom7' | 'sus2' | 'sus4' | 'dim' | 'power' | 'add9';

export type ScaleType = 'major' | 'minor';

export interface Chord {
  id: string;
  name: string;
  root: string;
  type: ChordType;
  notes: number[];
  durationBeats: number;
  position: number;
  degree: number;
}

export interface Section {
  id: string;
  type: SectionType;
  label: string;
  chords: Chord[];
}

export interface ProgressionTemplate {
  degrees: number[];
  scale: ScaleType;
  name: string;
  beatsPerChord: number;
}

export interface GenreConfig {
  label: string;
  bpmRange: [number, number];
  preferredKeys: string[];
  chordStyle: 'simple' | 'extended' | 'ambient' | 'power';
  beatsPerChord: number;
  drumPatterns: string[];
  progressions: ProgressionTemplate[];
}

export interface DrumPattern {
  name: string;
  kick:  boolean[];
  snare: boolean[];
  hihat: boolean[];
}

export interface Session {
  id: string;
  name: string;
  genre: Genre;
  key: string;
  scale: ScaleType;
  bpm: number;
  instrument: Instrument;
  sections: Section[];
  arrangement: string[];
  drumPattern: DrumPattern;
  createdAt: number;
}
