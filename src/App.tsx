import { useEffect } from 'react';
import { GenreSelector } from './components/GenreSelector';
import { Transport } from './components/Transport';
import { ChordGrid } from './components/ChordGrid';
import { Timeline } from './components/Timeline';
import { DrumPanel } from './components/DrumPanel';
import { VolumePanel } from './components/VolumePanel';
import { SessionManager } from './components/SessionManager';
import { useStore } from './store/useStore';

export default function App() {
  const selectGenre = useStore((s) => s.selectGenre);
  const chords = useStore((s) => s.chords);

  // Boot with Pop on first load if no chords exist
  useEffect(() => {
    if (chords.length === 0) {
      selectGenre('pop');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">♩</span>
          <span className="logo-text">CHORDBUDDY</span>
        </div>
        <GenreSelector />
      </header>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="app-main">
        {/* Left: chord area */}
        <section className="main-left">
          <Transport />
          <ChordGrid />
          <Timeline />
          <SessionManager />
        </section>

        {/* Right: drum machine + volumes */}
        <aside className="main-right">
          <DrumPanel />
          <VolumePanel />
        </aside>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>CHORDBUDDY — intelligent chord progression engine</span>
        <span>Web Audio API · React · TypeScript</span>
      </footer>
    </div>
  );
}
