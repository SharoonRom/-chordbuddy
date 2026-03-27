import React, { useState } from 'react';
import type { Section } from '../types';
import { useStore } from '../store/useStore';
import { ChordPicker } from './ChordPicker';

interface Props {
  section: Section;
}

const DURATION_OPTIONS = [1, 2, 4, 8];

const TYPE_LABELS: Record<string, string> = {
  intro: 'INTRO', verse: 'VERSE', chorus: 'CHORUS', bridge: 'BRIDGE', outro: 'OUTRO',
};

export const SectionBlock: React.FC<Props> = ({ section }) => {
  const isPlaying         = useStore(s => s.isPlaying);
  const playMode          = useStore(s => s.playMode);
  const activeSectionId   = useStore(s => s.activeSectionId);
  const currentChordIndex = useStore(s => s.currentChordIndex);
  const chordPickerSectionId = useStore(s => s.chordPickerSectionId);

  const playSection              = useStore(s => s.playSection);
  const stop                     = useStore(s => s.stop);
  const removeSection            = useStore(s => s.removeSection);
  const duplicateSection         = useStore(s => s.duplicateSection);
  const setSectionLabel          = useStore(s => s.setSectionLabel);
  const removeChordFromSection   = useStore(s => s.removeChordFromSection);
  const moveChordInSection       = useStore(s => s.moveChordInSection);
  const updateChordDuration      = useStore(s => s.updateChordDurationInSection);
  const openChordPicker          = useStore(s => s.openChordPicker);

  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft]     = useState(section.label);

  const isSectionPlaying = isPlaying && playMode === 'section' && activeSectionId === section.id;

  const handlePlayToggle = () => {
    if (isSectionPlaying) stop();
    else playSection(section.id);
  };

  const commitLabel = () => {
    const trimmed = labelDraft.trim();
    if (trimmed) setSectionLabel(section.id, trimmed);
    else setLabelDraft(section.label);
    setEditingLabel(false);
  };

  const pickerOpen = chordPickerSectionId === section.id;

  return (
    <div className={`section-block section-type-${section.type}`}>
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="sb-header">
        <div className="sb-header-left">
          <span className="sb-type-tag">{TYPE_LABELS[section.type] ?? section.type.toUpperCase()}</span>
          {editingLabel ? (
            <input
              className="sb-label-input"
              value={labelDraft}
              autoFocus
              onChange={e => setLabelDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={e => { if (e.key === 'Enter') commitLabel(); if (e.key === 'Escape') { setLabelDraft(section.label); setEditingLabel(false); } }}
            />
          ) : (
            <span className="sb-label" onClick={() => { setLabelDraft(section.label); setEditingLabel(true); }}>
              {section.label}
            </span>
          )}
          <span className="sb-chord-count">{section.chords.length} chord{section.chords.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="sb-header-right">
          <button
            className={`sb-play-btn ${isSectionPlaying ? 'active' : ''}`}
            onClick={handlePlayToggle}
            title={isSectionPlaying ? 'Stop' : 'Play section'}
          >
            {isSectionPlaying ? '■' : '▶'}
          </button>
          <button className="sb-icon-btn" onClick={() => duplicateSection(section.id)} title="Duplicate section">⊕</button>
          <button className="sb-icon-btn sb-delete-btn" onClick={() => removeSection(section.id)} title="Delete section">✕</button>
        </div>
      </div>

      {/* ── Chord Cards ────────────────────────────────────────────── */}
      <div className="sb-chords">
        {section.chords.length === 0 && (
          <span className="sb-empty">No chords — add some below</span>
        )}
        {section.chords.map((chord, idx) => {
          const isActive = isSectionPlaying && currentChordIndex === idx;
          return (
            <div key={chord.id} className={`sb-chord-card ${isActive ? 'chord-active' : ''}`}>
              {isActive && <div className="chord-active-bar" />}
              <div className="sb-chord-inner">
                <span className="sb-chord-degree">{chord.degree ? ['I','II','III','IV','V','VI','VII'][chord.degree - 1] ?? '' : ''}</span>
                <span className="sb-chord-name">{chord.name}</span>
                <span className="sb-chord-type">{chord.type}</span>
              </div>
              <div className="sb-chord-controls">
                <button className="sb-move-btn" onClick={() => moveChordInSection(section.id, chord.id, 'left')} disabled={idx === 0} title="Move left">‹</button>
                <select
                  className="sb-dur-select"
                  value={chord.durationBeats}
                  onChange={e => updateChordDuration(section.id, chord.id, Number(e.target.value))}
                  title="Duration in beats"
                >
                  {DURATION_OPTIONS.map(d => (
                    <option key={d} value={d}>{d}b</option>
                  ))}
                </select>
                <button className="sb-move-btn" onClick={() => moveChordInSection(section.id, chord.id, 'right')} disabled={idx === section.chords.length - 1} title="Move right">›</button>
                <button className="sb-remove-btn" onClick={() => removeChordFromSection(section.id, chord.id)} title="Remove chord">✕</button>
              </div>
            </div>
          );
        })}

        <button className="sb-add-chord-btn" onClick={() => openChordPicker(section.id)} title="Add chord">
          + ADD CHORD
        </button>
      </div>

      {/* ── Chord Picker ───────────────────────────────────────────── */}
      {pickerOpen && <ChordPicker sectionId={section.id} />}
    </div>
  );
};
