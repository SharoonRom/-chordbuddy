import React from 'react';
import { useStore } from '../store/useStore';

export const SongArranger: React.FC = () => {
  const sections            = useStore(s => s.sections);
  const arrangement         = useStore(s => s.arrangement);
  const addToArrangement    = useStore(s => s.addToArrangement);
  const removeFromArrangement = useStore(s => s.removeFromArrangement);
  const moveInArrangement   = useStore(s => s.moveInArrangement);

  const TYPE_COLOR: Record<string, string> = {
    intro: 'var(--section-intro)', verse: 'var(--section-verse)',
    chorus: 'var(--section-chorus)', bridge: 'var(--section-bridge)', outro: 'var(--section-outro)',
  };

  return (
    <div className="song-arranger">
      <div className="sa-header">
        <span className="section-label">SONG ARRANGEMENT</span>
        <span className="sa-meta">{arrangement.length} section{arrangement.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Arrangement pills */}
      <div className="sa-pills">
        {arrangement.length === 0 && (
          <span className="sa-empty">Add sections below to build your song</span>
        )}
        {arrangement.map((sid, idx) => {
          const sec = sections.find(s => s.id === sid);
          if (!sec) return null;
          return (
            <div key={`${sid}-${idx}`} className="sa-pill" style={{ '--pill-color': TYPE_COLOR[sec.type] ?? 'var(--border2)' } as React.CSSProperties}>
              <button
                className="sa-pill-move"
                onClick={() => moveInArrangement(idx, idx - 1)}
                disabled={idx === 0}
                title="Move left"
              >‹</button>
              <span className="sa-pill-label">{sec.label}</span>
              <button
                className="sa-pill-move"
                onClick={() => moveInArrangement(idx, idx + 1)}
                disabled={idx === arrangement.length - 1}
                title="Move right"
              >›</button>
              <button
                className="sa-pill-remove"
                onClick={() => removeFromArrangement(idx)}
                title="Remove from arrangement"
              >✕</button>
            </div>
          );
        })}
      </div>

      {/* Add section buttons */}
      {sections.length > 0 && (
        <div className="sa-add-row">
          <span className="sa-add-label">ADD:</span>
          {sections.map(sec => (
            <button
              key={sec.id}
              className={`sa-add-btn sa-add-${sec.type}`}
              onClick={() => addToArrangement(sec.id)}
              title={`Add ${sec.label} to arrangement`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
