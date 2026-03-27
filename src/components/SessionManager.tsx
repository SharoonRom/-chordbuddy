import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export const SessionManager: React.FC = () => {
  const { sessions, saveSession, loadSession, deleteSession } = useStore((s) => ({
    sessions: s.sessions,
    saveSession: s.saveSession,
    loadSession: s.loadSession,
    deleteSession: s.deleteSession,
  }));

  const [saveName, setSaveName] = useState('');
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const name = saveName.trim() || `Session ${sessions.length + 1}`;
    saveSession(name);
    setSaveName('');
  };

  return (
    <div className="session-manager">
      <button className="session-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? '▲' : '▼'} SESSIONS ({sessions.length})
      </button>

      {open && (
        <div className="session-panel">
          {/* Save form */}
          <div className="session-save-row">
            <input
              className="session-name-input"
              placeholder="Session name…"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <button className="session-save-btn" onClick={handleSave}>SAVE</button>
          </div>

          {/* Session list */}
          {sessions.length === 0 ? (
            <div className="session-empty">No saved sessions</div>
          ) : (
            <div className="session-list">
              {sessions.map((s) => (
                <div key={s.id} className="session-item">
                  <div className="session-info">
                    <span className="session-item-name">{s.name}</span>
                    <span className="session-item-meta">
                      {s.genre.replace('-', ' ')} · {s.key} · {s.bpm} BPM
                    </span>
                  </div>
                  <div className="session-actions">
                    <button className="session-load-btn" onClick={() => loadSession(s.id)}>LOAD</button>
                    <button className="session-del-btn" onClick={() => deleteSession(s.id)}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
