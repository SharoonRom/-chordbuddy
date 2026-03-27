import { useEffect } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { Transport } from './components/Transport';
import { SectionBlock } from './components/SectionBlock';
import { SongArranger } from './components/SongArranger';
import { Timeline } from './components/Timeline';
import { DrumPanel } from './components/DrumPanel';
import { VolumePanel } from './components/VolumePanel';
import { SessionManager } from './components/SessionManager';
import { InstrumentSelector } from './components/InstrumentSelector';
import { ThemeToggle } from './components/ThemeToggle';
import { useStore } from './store/useStore';

const ADD_SECTION_TYPES = [
  { type: 'intro',  label: 'Intro'  },
  { type: 'verse',  label: 'Verse'  },
  { type: 'chorus', label: 'Chorus' },
  { type: 'bridge', label: 'Bridge' },
  { type: 'outro',  label: 'Outro'  },
] as const;

export default function App() {
  const selectGenre      = useStore(s => s.selectGenre);
  const sections         = useStore(s => s.sections);
  const addSection       = useStore(s => s.addSection);
  const addSectionOpen   = useStore(s => s.addSectionOpen);
  const setAddSectionOpen = useStore(s => s.setAddSectionOpen);

  useEffect(() => {
    if (sections.length === 0) {
      selectGenre('pop');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">♩</span>
          <span className="logo-text">CHORDBUDDY</span>
        </div>
        <GenreSelector />
        <div className="header-right">
          <InstrumentSelector />
          <ThemeToggle />
        </div>
      </header>

      {/* ── Transport Bar ────────────────────────────────────────────── */}
      <Transport />

      {/* ── Main Layout ──────────────────────────────────────────────── */}
      <div className="app-main">
        {/* Left: sections */}
        <main className="main-left">
          <div className="sections-area">
            {sections.map(sec => (
              <SectionBlock key={sec.id} section={sec} />
            ))}

            {/* Add Section UI */}
            <div className="add-section-row">
              {addSectionOpen ? (
                <div className="add-section-menu">
                  {ADD_SECTION_TYPES.map(({ type, label }) => (
                    <button
                      key={type}
                      className={`add-sec-btn add-sec-${type}`}
                      onClick={() => addSection(type)}
                    >
                      {label}
                    </button>
                  ))}
                  <button className="add-sec-cancel" onClick={() => setAddSectionOpen(false)}>Cancel</button>
                </div>
              ) : (
                <button className="add-section-trigger" onClick={() => setAddSectionOpen(true)}>
                  + ADD SECTION
                </button>
              )}
            </div>
          </div>

          {/* Song Arranger */}
          <SongArranger />

          {/* Timeline */}
          <Timeline />
        </main>

        {/* Right: drums + volumes + sessions */}
        <aside className="main-right">
          <DrumPanel />
          <VolumePanel />
          <SessionManager />
        </aside>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>CHORDBUDDY — intelligent chord progression engine</span>
        <span>Web Audio API · React · TypeScript</span>
      </footer>
    </div>
  );
}
