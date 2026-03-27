import type { DrumPattern, Genre } from '../types';

// 16-step grid: beat positions
// [1e+a 2e+a 3e+a 4e+a]
//  0123 4567 89AB CDEF

const t = true;
const f = false;

export const DRUM_PATTERNS: Record<Genre, DrumPattern[]> = {
  pop: [
    {
      name: 'Pop Standard',
      kick:  [t,f,f,f, t,f,f,f, t,f,f,f, t,f,f,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,f,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,f],
    },
    {
      name: 'Pop Offbeat',
      kick:  [t,f,f,f, f,f,t,f, t,f,f,f, f,f,f,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,t,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,f],
    },
    {
      name: 'Pop Four-On-Floor',
      kick:  [t,f,f,f, t,f,f,f, t,f,f,f, t,f,f,f],
      snare: [f,f,f,f, t,f,f,t, f,f,f,f, t,f,f,f],
      hihat: [t,t,t,t, t,t,t,t, t,t,t,t, t,t,t,t],
    },
  ],

  'slow-indie': [
    {
      name: 'Indie Sparse',
      kick:  [t,f,f,f, f,f,f,t, f,f,f,f, f,f,f,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,f,f],
      hihat: [t,f,f,t, f,f,t,f, t,f,f,t, f,f,t,f],
    },
    {
      name: 'Indie Groove',
      kick:  [t,f,f,f, f,f,t,f, f,f,t,f, f,f,f,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,f,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,f],
    },
  ],

  ambient: [
    {
      name: 'Ambient Minimal',
      kick:  [t,f,f,f, f,f,f,f, f,f,f,f, f,f,f,f],
      snare: [f,f,f,f, f,f,f,f, t,f,f,f, f,f,f,f],
      hihat: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,f,f],
    },
    {
      name: 'Ambient Ghost',
      kick:  [f,f,f,f, f,f,f,f, f,f,f,f, f,f,f,f],
      snare: [f,f,f,f, f,f,f,f, f,f,f,f, f,f,f,f],
      hihat: [t,f,f,f, f,f,f,f, t,f,f,f, f,f,f,f],
    },
  ],

  rock: [
    {
      name: 'Rock Classic',
      kick:  [t,f,f,f, f,f,f,f, t,f,f,f, f,f,t,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,f, t,f,f,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,f],
    },
    {
      name: 'Rock Hard',
      kick:  [t,f,f,f, t,f,f,f, f,f,t,f, t,f,f,f],
      snare: [f,f,f,f, t,f,t,f, f,f,f,f, t,f,f,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,t],
    },
    {
      name: 'Rock Shuffle',
      kick:  [t,f,f,f, f,f,t,f, t,f,f,f, f,f,f,f],
      snare: [f,f,f,f, t,f,f,f, f,f,f,t, t,f,f,f],
      hihat: [t,f,t,t, t,f,t,t, t,f,t,t, t,f,t,t],
    },
  ],

  sad: [
    {
      name: 'Half-Time Sorrow',
      kick:  [t,f,f,f, f,f,t,f, f,f,f,f, f,f,f,f],
      snare: [f,f,f,f, f,f,f,f, t,f,f,f, f,f,f,f],
      hihat: [t,f,t,f, t,f,t,f, t,f,t,f, t,f,t,f],
    },
    {
      name: 'Slow Ballad',
      kick:  [t,f,f,f, f,f,f,f, f,f,t,f, f,f,f,f],
      snare: [f,f,f,f, f,f,f,f, t,f,f,f, f,f,f,f],
      hihat: [t,f,f,t, f,f,f,t, f,f,t,f, f,f,f,t],
    },
  ],

  happy: [
    {
      name: 'Happy Bounce',
      kick:  [t,f,f,f, t,f,t,f, t,f,f,f, t,f,t,f],
      snare: [f,f,f,f, t,f,f,t, f,f,f,f, t,f,t,f],
      hihat: [t,t,t,t, t,t,t,t, t,t,t,t, t,t,t,t],
    },
    {
      name: 'Happy Dance',
      kick:  [t,f,f,f, t,f,f,f, t,f,f,f, t,f,f,f],
      snare: [f,f,t,f, t,f,f,f, f,f,t,f, t,f,t,f],
      hihat: [t,f,t,t, t,f,t,t, t,f,t,t, t,f,t,t],
    },
  ],
};

export function pickDrumPattern(genre: Genre): DrumPattern {
  const patterns = DRUM_PATTERNS[genre];
  return patterns[Math.floor(Math.random() * patterns.length)];
}
