import type { Chord, Genre, GenreConfig, ProgressionTemplate, ScaleType } from '../types';
import { chordFromDegree, getChordName } from './MusicTheory';
import { pickDrumPattern } from './DrumPatterns';

// ─── Genre Configurations ─────────────────────────────────────────────────────

const GENRE_CONFIGS: Record<Genre, GenreConfig> = {
  pop: {
    label: 'Pop',
    bpmRange: [100, 130],
    preferredKeys: ['C', 'G', 'D', 'F', 'A'],
    chordStyle: 'simple',
    beatsPerChord: 4,
    drumPatterns: [],
    progressions: [
      { degrees: [1, 5, 6, 4], scale: 'major', name: 'I–V–vi–IV', beatsPerChord: 4 },
      { degrees: [1, 4, 5, 1], scale: 'major', name: 'I–IV–V–I', beatsPerChord: 4 },
      { degrees: [1, 6, 4, 5], scale: 'major', name: 'I–vi–IV–V', beatsPerChord: 4 },
      { degrees: [4, 1, 5, 6], scale: 'major', name: 'IV–I–V–vi', beatsPerChord: 4 },
      { degrees: [1, 5, 4, 4], scale: 'major', name: 'I–V–IV–IV', beatsPerChord: 4 },
    ],
  },

  'slow-indie': {
    label: 'Slow Indie',
    bpmRange: [70, 100],
    preferredKeys: ['C', 'G', 'A', 'E', 'D'],
    chordStyle: 'simple',
    beatsPerChord: 4,
    drumPatterns: [],
    progressions: [
      { degrees: [6, 4, 1, 5], scale: 'major', name: 'vi–IV–I–V', beatsPerChord: 4 },
      { degrees: [1, 5, 6, 3, 4], scale: 'major', name: 'I–V–vi–iii–IV', beatsPerChord: 4 },
      { degrees: [1, 4, 6, 5], scale: 'major', name: 'I–IV–vi–V', beatsPerChord: 4 },
      { degrees: [6, 7, 1, 5], scale: 'major', name: 'vi–VII–I–V', beatsPerChord: 4 },
      { degrees: [1, 3, 4, 5], scale: 'major', name: 'I–iii–IV–V', beatsPerChord: 4 },
    ],
  },

  ambient: {
    label: 'Ambient',
    bpmRange: [60, 80],
    preferredKeys: ['C', 'D', 'E', 'G', 'A'],
    chordStyle: 'ambient',
    beatsPerChord: 8,
    drumPatterns: [],
    progressions: [
      { degrees: [1, 4],    scale: 'major', name: 'I–IV',    beatsPerChord: 8 },
      { degrees: [1, 6],    scale: 'major', name: 'I–vi',    beatsPerChord: 8 },
      { degrees: [1, 5, 4], scale: 'major', name: 'I–V–IV',  beatsPerChord: 8 },
      { degrees: [1, 2, 4], scale: 'major', name: 'I–ii–IV', beatsPerChord: 8 },
      { degrees: [1, 4, 5, 4], scale: 'major', name: 'I–IV–V–IV', beatsPerChord: 8 },
    ],
  },

  rock: {
    label: 'Rock',
    bpmRange: [110, 145],
    preferredKeys: ['A', 'E', 'D', 'G', 'B'],
    chordStyle: 'power',
    beatsPerChord: 4,
    drumPatterns: [],
    progressions: [
      { degrees: [1, 4, 5],    scale: 'major', name: 'I–IV–V',      beatsPerChord: 4 },
      { degrees: [1, 4, 1, 5], scale: 'major', name: 'I–IV–I–V',    beatsPerChord: 4 },
      { degrees: [1, 7, 4, 1], scale: 'major', name: 'I–bVII–IV–I', beatsPerChord: 4 },
      { degrees: [1, 6, 4, 5], scale: 'major', name: 'I–vi–IV–V',   beatsPerChord: 4 },
      { degrees: [1, 3, 4, 5], scale: 'major', name: 'I–III–IV–V',  beatsPerChord: 4 },
    ],
  },

  sad: {
    label: 'Sad',
    bpmRange: [60, 90],
    preferredKeys: ['Am', 'Em', 'Dm', 'Bm'],
    chordStyle: 'extended',
    beatsPerChord: 4,
    drumPatterns: [],
    progressions: [
      { degrees: [1, 6, 3, 7], scale: 'minor', name: 'i–VI–III–VII',  beatsPerChord: 4 },
      { degrees: [1, 4, 5, 1], scale: 'minor', name: 'i–iv–v–i',       beatsPerChord: 4 },
      { degrees: [1, 7, 6, 7], scale: 'minor', name: 'i–VII–VI–VII',   beatsPerChord: 4 },
      { degrees: [6, 4, 1, 5], scale: 'minor', name: 'vi–IV–I–V',      beatsPerChord: 4 },
      { degrees: [1, 6, 4, 7], scale: 'minor', name: 'i–VI–IV–VII',    beatsPerChord: 4 },
    ],
  },

  happy: {
    label: 'Happy',
    bpmRange: [110, 140],
    preferredKeys: ['C', 'G', 'D', 'A', 'F'],
    chordStyle: 'simple',
    beatsPerChord: 2,
    drumPatterns: [],
    progressions: [
      { degrees: [1, 4, 5, 4],    scale: 'major', name: 'I–IV–V–IV',    beatsPerChord: 2 },
      { degrees: [1, 2, 4, 1],    scale: 'major', name: 'I–II–IV–I',    beatsPerChord: 2 },
      { degrees: [1, 5, 4, 5],    scale: 'major', name: 'I–V–IV–V',     beatsPerChord: 2 },
      { degrees: [1, 3, 4, 5],    scale: 'major', name: 'I–iii–IV–V',   beatsPerChord: 2 },
      { degrees: [1, 4, 6, 5],    scale: 'major', name: 'I–IV–vi–V',    beatsPerChord: 2 },
    ],
  },
};

// ─── Minor key root resolver ───────────────────────────────────────────────────

function resolveKey(rawKey: string): { root: string } {
  if (rawKey.endsWith('m')) {
    return { root: rawKey.slice(0, -1) };
  }
  return { root: rawKey };
}

// ─── Random helpers ────────────────────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randBetween(lo: number, hi: number): number {
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

// ─── Main generation function ─────────────────────────────────────────────────

export interface GeneratedProgression {
  chords: Chord[];
  bpm: number;
  key: string;
  scale: ScaleType;
  drumPatternName: string;
  templateName: string;
}

export function generateProgression(genre: Genre, forcedKey?: string): GeneratedProgression {
  const config = GENRE_CONFIGS[genre];

  // Pick key
  const rawKey: string = forcedKey ?? rand(config.preferredKeys);
  const { root: keyRoot } = resolveKey(rawKey);

  // Pick progression template
  const template: ProgressionTemplate = rand(config.progressions);

  // Scale comes from the template
  const templateScale: ScaleType = template.scale;

  // Build chords
  let position = 0;
  const chords: Chord[] = template.degrees.map((degree: number, i: number) => {
    const { root, type, notes } = chordFromDegree(
      degree,
      keyRoot,
      templateScale,
      config.chordStyle,
    );
    const chord: Chord = {
      id: `chord-${Date.now()}-${i}`,
      name: getChordName(root, type),
      root,
      type,
      notes,
      durationBeats: template.beatsPerChord,
      position,
      degree,
    };
    position += template.beatsPerChord;
    return chord;
  });

  // Pick BPM in range
  const bpm = randBetween(config.bpmRange[0], config.bpmRange[1]);

  // Pick drum pattern
  const drumPattern = pickDrumPattern(genre);

  return {
    chords,
    bpm,
    key: rawKey,
    scale: templateScale,
    drumPatternName: drumPattern.name,
    templateName: template.name,
  };
}

export function getGenreConfig(genre: Genre): GenreConfig {
  return GENRE_CONFIGS[genre];
}

export function getGenreLabel(genre: Genre): string {
  return GENRE_CONFIGS[genre].label;
}

export function allGenres(): Genre[] {
  return Object.keys(GENRE_CONFIGS) as Genre[];
}

export const GENRE_ORDER: Genre[] = ['pop', 'happy', 'slow-indie', 'rock', 'sad', 'ambient'];
