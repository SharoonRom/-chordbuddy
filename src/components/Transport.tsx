import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { allKeys } from '../music/MusicTheory';

export const Transport: React.FC = () => {
  const isPlaying      = useStore((s) => s.isPlaying);
  const bpm            = useStore((s) => s.bpm);
  const key            = useStore((s) => s.key);
  const genre          = useStore((s) => s.genre);
  const progressionName = useStore((s) => s.progressionName);
  const play           = useStore((s) => s.play);
  const stop           = useStore((s) => s.stop);
  const setBpm         = useStore((s) => s.setBpm);
  const setKey         = useStore((s) => s.setKey);
  const regenerate     = useStore((s) => s.regenerate);

  const [bpmInput, setBpmInput] = useState<string | null>(null);

  const handlePlay = () => {
    if (isPlaying) stop();
    else play();
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBpmInput(e.target.value);
  };

  const handleBpmCommit = () => {
    if (bpmInput !== null) {
      const v = parseInt(bpmInput, 10);
      if (!isNaN(v) && v >= 40 && v <= 220) setBpm(v);
      setBpmInput(null);
    }
  };

  const keys = allKeys();

  return (
    <div className="transport">
      {/* Play/Stop */}
      <div className="transport-left">
        <button
          className={`play-btn ${isPlaying ? 'active' : ''}`}
          onClick={handlePlay}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? (
            <span className="icon-stop">■</span>
          ) : (
            <span className="icon-play">▶</span>
          )}
        </button>

        <div className="transport-meta">
          <span className="progression-name">{progressionName}</span>
          <div className="transport-badges">
            <span className="badge">{genre.replace('-', ' ').toUpperCase()}</span>
            <span className="badge">{key}</span>
          </div>
        </div>
      </div>

      {/* BPM + Key */}
      <div className="transport-center">
        <div className="control-group">
          <label className="ctrl-label">BPM</label>
          <input
            className="bpm-input"
            type="number"
            min={40}
            max={220}
            value={bpmInput !== null ? bpmInput : bpm}
            onChange={handleBpmChange}
            onBlur={handleBpmCommit}
            onKeyDown={(e) => e.key === 'Enter' && handleBpmCommit()}
          />
          <div className="bpm-nudge">
            <button onClick={() => setBpm(Math.max(40, bpm - 1))}>−</button>
            <button onClick={() => setBpm(Math.min(220, bpm + 1))}>+</button>
          </div>
        </div>

        <div className="control-group">
          <label className="ctrl-label">KEY</label>
          <select
            className="key-select"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          >
            {keys.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Regenerate */}
      <div className="transport-right">
        <button className="regen-btn" onClick={regenerate} title="New progression (same genre)">
          ↻ NEW
        </button>
      </div>
    </div>
  );
};
