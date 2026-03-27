import React from 'react';
import type { Chord, ScaleType } from '../types';
import { useStore } from '../store/useStore';
import { chordFromDegree, getChordName } from '../music/MusicTheory';
import { v4 as uuid } from '../utils/uuid';

const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const DEGREE_LABELS_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];

interface PickerRow {
  label: string;
  chord: Chord;
}

function buildDiatonicRows(keyRoot: string, scale: ScaleType): PickerRow[] {
  const labels = scale === 'major' ? DEGREE_LABELS : DEGREE_LABELS_MINOR;
  const rows: PickerRow[] = [];

  for (let deg = 1; deg <= 7; deg++) {
    const { root, type, notes } = chordFromDegree(deg, keyRoot, scale, 'simple');
    rows.push({
      label: labels[deg - 1],
      chord: { id: uuid(), name: getChordName(root, type), root, type, notes, durationBeats: 4, position: 0, degree: deg },
    });
  }
  return rows;
}

function buildExtendedRows(keyRoot: string, scale: ScaleType): PickerRow[] {
  const labels = scale === 'major' ? DEGREE_LABELS : DEGREE_LABELS_MINOR;
  const rows: PickerRow[] = [];

  for (let deg = 1; deg <= 7; deg++) {
    const { root, type, notes } = chordFromDegree(deg, keyRoot, scale, 'extended');
    rows.push({
      label: labels[deg - 1] + (type.includes('7') || type === 'add9' ? '' : ''),
      chord: { id: uuid(), name: getChordName(root, type), root, type, notes, durationBeats: 4, position: 0, degree: deg },
    });
  }
  return rows;
}

interface Props {
  sectionId: string;
}

export const ChordPicker: React.FC<Props> = ({ sectionId }) => {
  const key            = useStore(s => s.key);
  const scale          = useStore(s => s.scale);
  const addChord       = useStore(s => s.addChordToSection);
  const close          = useStore(s => s.closeChordPicker);

  // Derive keyRoot from key (e.g., "Am" → "A")
  const keyRoot = key.endsWith('m') ? key.slice(0, -1) : key;

  const triads   = buildDiatonicRows(keyRoot, scale);
  const extended = buildExtendedRows(keyRoot, scale);

  const handleAdd = (chord: Chord) => {
    addChord(sectionId, chord);
  };

  return (
    <div className="chord-picker">
      <div className="chord-picker-header">
        <span className="chord-picker-title">ADD CHORD — {key} {scale.toUpperCase()}</span>
        <button className="chord-picker-close" onClick={close}>×</button>
      </div>

      <div className="chord-picker-section-label">TRIADS</div>
      <div className="chord-picker-row">
        {triads.map((r, i) => (
          <button key={i} className="chord-pick-btn" onClick={() => handleAdd(r.chord)}>
            <span className="cpb-degree">{r.label}</span>
            <span className="cpb-name">{r.chord.name}</span>
          </button>
        ))}
      </div>

      <div className="chord-picker-section-label">SEVENTHS</div>
      <div className="chord-picker-row">
        {extended.map((r, i) => (
          <button key={i} className="chord-pick-btn" onClick={() => handleAdd(r.chord)}>
            <span className="cpb-degree">{r.label}</span>
            <span className="cpb-name">{r.chord.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
