import React from 'react';
import type { Chord } from '../types';
import { useStore } from '../store/useStore';

const CHORD_COLORS: Record<string, string> = {
  major:  '#ffffff',
  minor:  '#aaaaaa',
  major7: '#dddddd',
  minor7: '#999999',
  dom7:   '#cccccc',
  sus2:   '#bbbbbb',
  sus4:   '#b0b0b0',
  dim:    '#777777',
  power:  '#ffffff',
  add9:   '#dddddd',
};

const DEGREE_LABELS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

interface ChordCardProps {
  chord: Chord;
  isActive: boolean;
  index?: number;
}

const ChordCard: React.FC<ChordCardProps> = ({ chord, isActive }) => {
  const removeChord = useStore((s) => s.removeChord);
  const updateChordDuration = useStore((s) => s.updateChordDuration);

  const color = CHORD_COLORS[chord.type] ?? '#ffffff';
  const degreeLabel = DEGREE_LABELS[(chord.degree - 1) % 7];

  return (
    <div className={`chord-card ${isActive ? 'chord-active' : ''}`} style={{ '--chord-color': color } as React.CSSProperties}>
      <div className="chord-card-inner">
        <div className="chord-degree">{degreeLabel}</div>
        <div className="chord-name">{chord.name}</div>
        <div className="chord-type">{chord.type}</div>

        <div className="chord-controls">
          <label className="chord-dur-label">BARS</label>
          <select
            className="chord-dur-select"
            value={chord.durationBeats}
            onChange={(e) => updateChordDuration(chord.id, Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          >
            {[1, 2, 4, 8].map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        <button
          className="chord-remove"
          onClick={() => removeChord(chord.id)}
          title="Remove chord"
        >
          ×
        </button>
      </div>

      {isActive && <div className="chord-active-bar" />}
    </div>
  );
};

export const ChordGrid: React.FC = () => {
  const chords = useStore((s) => s.chords);
  const currentChordIndex = useStore((s) => s.currentChordIndex);

  if (chords.length === 0) {
    return (
      <div className="chord-grid-empty">
        <span>Select a genre above to generate a progression</span>
      </div>
    );
  }

  return (
    <div className="chord-grid">
      <div className="section-header">
        <span className="section-label">CHORD PROGRESSION</span>
        <span className="chord-count">{chords.length} chords</span>
      </div>
      <div className="chord-cards">
        {chords.map((chord, i) => (
          <ChordCard
            key={chord.id}
            chord={chord}
            isActive={i === currentChordIndex}
            index={i} // eslint-disable-line
          />
        ))}
      </div>
    </div>
  );
};
