import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { allKeys } from '../music/MusicTheory';

export const Transport: React.FC = () => {
  const isPlaying  = useStore(s => s.isPlaying);
  const playMode   = useStore(s => s.playMode);
  const bpm        = useStore(s => s.bpm);
  const key        = useStore(s => s.key);
  const scale      = useStore(s => s.scale);
  const playSong   = useStore(s => s.playSong);
  const stop       = useStore(s => s.stop);
  const setBpm     = useStore(s => s.setBpm);
  const setKey     = useStore(s => s.setKey);

  const [bpmInput, setBpmInput] = useState<string | null>(null);

  const handlePlaySong = () => {
    if (isPlaying) stop();
    else playSong();
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
      <div className="transport-left">
        {/* Song play/stop */}
        <button
          className={`play-btn ${isPlaying && playMode === 'song' ? 'active' : ''}`}
          onClick={handlePlaySong}
          title={isPlaying && playMode === 'song' ? 'Stop song' : 'Play full song'}
        >
          {isPlaying && playMode === 'song' ? <span className="icon-stop">■</span> : <span className="icon-play">▶</span>}
        </button>
        <div className="transport-meta">
          <span className="progression-name">
            {isPlaying
              ? playMode === 'song' ? 'PLAYING SONG' : 'PLAYING SECTION'
              : 'READY'}
          </span>
          <div className="transport-badges">
            <span className="badge">{key}</span>
            <span className="badge">{scale.toUpperCase()}</span>
            <span className="badge">{bpm} BPM</span>
          </div>
        </div>
      </div>

      <div className="transport-center">
        <div className="control-group">
          <label className="ctrl-label">BPM</label>
          <input
            className="bpm-input"
            type="number"
            min={40}
            max={220}
            value={bpmInput !== null ? bpmInput : bpm}
            onChange={e => setBpmInput(e.target.value)}
            onBlur={handleBpmCommit}
            onKeyDown={e => e.key === 'Enter' && handleBpmCommit()}
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
            onChange={e => setKey(e.target.value)}
          >
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};
