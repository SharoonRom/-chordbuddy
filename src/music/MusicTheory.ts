import type { ChordType, ScaleType } from '../types';

// ─── Note System ─────────────────────────────────────────────────────────────

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const ENHARMONIC: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
};

// ─── Scale Semitones ─────────────────────────────────────────────────────────

export const MAJOR_SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11];
export const MINOR_SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];

// Default chord type for each scale degree (1-indexed)
export const MAJOR_DEGREE_TYPES: ChordType[] = [
  'major', 'minor', 'minor', 'major', 'major', 'minor', 'dim',
];
export const MINOR_DEGREE_TYPES: ChordType[] = [
  'minor', 'dim', 'major', 'minor', 'minor', 'major', 'major',
];

// ─── Chord Intervals ─────────────────────────────────────────────────────────

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  major:  [0, 4, 7],
  minor:  [0, 3, 7],
  major7: [0, 4, 7, 11],
  minor7: [0, 3, 7, 10],
  dom7:   [0, 4, 7, 10],
  sus2:   [0, 2, 7],
  sus4:   [0, 5, 7],
  dim:    [0, 3, 6],
  power:  [0, 7, 12],
  add9:   [0, 4, 7, 14],
};

export const CHORD_SUFFIX: Record<ChordType, string> = {
  major:  '',
  minor:  'm',
  major7: 'maj7',
  minor7: 'm7',
  dom7:   '7',
  sus2:   'sus2',
  sus4:   'sus4',
  dim:    'dim',
  power:  '5',
  add9:   'add9',
};

// ─── Core Functions ───────────────────────────────────────────────────────────

export function noteNameToIndex(note: string): number {
  const idx = NOTE_NAMES.indexOf(note);
  if (idx !== -1) return idx;
  // Try enharmonic lookup
  const enharmonic = Object.entries(ENHARMONIC).find(([, v]) => v === note);
  if (enharmonic) return NOTE_NAMES.indexOf(enharmonic[0]);
  return 0;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function noteToMidi(noteIndex: number, octave: number): number {
  return (octave + 1) * 12 + noteIndex;
}

export function buildChordMidi(rootNote: string, octave: number, type: ChordType): number[] {
  const rootIndex = noteNameToIndex(rootNote);
  const rootMidi = noteToMidi(rootIndex, octave);
  return CHORD_INTERVALS[type].map(interval => rootMidi + interval);
}

export function getChordName(root: string, type: ChordType): string {
  return root + CHORD_SUFFIX[type];
}

/** Build a chord from a scale degree (1-7) in the given key */
export function chordFromDegree(
  degree: number,          // 1-based
  keyRoot: string,
  scale: ScaleType,
  chordStyle: 'simple' | 'extended' | 'ambient' | 'power',
  octave = 3,
): { root: string; type: ChordType; notes: number[] } {
  const steps = scale === 'major' ? MAJOR_SCALE_STEPS : MINOR_SCALE_STEPS;
  const defaultTypes = scale === 'major' ? MAJOR_DEGREE_TYPES : MINOR_DEGREE_TYPES;

  const keyIndex = noteNameToIndex(keyRoot);
  const degreeIndex = (degree - 1) % 7;
  const semitone = steps[degreeIndex];
  const rootIndex = (keyIndex + semitone) % 12;
  const rootNote = NOTE_NAMES[rootIndex];

  let type: ChordType = defaultTypes[degreeIndex];

  // Upgrade chord types based on style
  if (chordStyle === 'extended') {
    if (type === 'major') type = degree === 5 ? 'dom7' : 'major7';
    if (type === 'minor') type = 'minor7';
  } else if (chordStyle === 'ambient') {
    // Use open/suspended chords for ambient feel
    if (type === 'major') type = Math.random() > 0.5 ? 'sus2' : 'add9';
    if (type === 'minor') type = 'minor7';
  } else if (chordStyle === 'power') {
    type = 'power';
  }

  const notes = buildChordMidi(rootNote, octave, type);
  return { root: rootNote, type, notes };
}

/** Returns all 12 key options */
export function allKeys(): string[] {
  return NOTE_NAMES;
}
