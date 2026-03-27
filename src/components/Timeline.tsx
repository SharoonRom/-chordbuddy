import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { Chord } from '../types';
import { useStore } from '../store/useStore';

export const Timeline: React.FC = () => {
  const sections        = useStore(s => s.sections);
  const arrangement     = useStore(s => s.arrangement);
  const playMode        = useStore(s => s.playMode);
  const activeSectionId = useStore(s => s.activeSectionId);
  const currentBeat     = useStore(s => s.currentBeat);
  const isPlaying       = useStore(s => s.isPlaying);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derive the chord list to display
  const chords = useMemo((): Chord[] => {
    if (playMode === 'section' && activeSectionId) {
      const sec = sections.find(s => s.id === activeSectionId);
      return sec ? sec.chords : [];
    }
    if (playMode === 'song' || arrangement.length > 0) {
      const flat: Chord[] = [];
      let pos = 0;
      arrangement.forEach(sid => {
        const sec = sections.find(s => s.id === sid);
        if (!sec) return;
        sec.chords.forEach(c => { flat.push({ ...c, position: pos }); pos += c.durationBeats; });
      });
      return flat;
    }
    // Fallback: first section with chords
    for (const sec of sections) {
      if (sec.chords.length > 0) return sec.chords;
    }
    return [];
  }, [sections, arrangement, playMode, activeSectionId]);

  const totalBeats = chords.reduce((s, c) => s + c.durationBeats, 0) || 16;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const beatWidth = W / totalBeats;
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#080808';
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2a2a2a';

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let b = 0; b <= totalBeats; b++) {
      const x = b * beatWidth;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    // Chord blocks
    if (chords.length > 0) {
      let pos = 0;
      chords.forEach(chord => {
        const x = pos * beatWidth;
        const w = chord.durationBeats * beatWidth;
        const beat = currentBeat % totalBeats;
        const isActive = isPlaying && beat >= pos && beat < pos + chord.durationBeats;

        ctx.fillStyle   = isActive ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x + 1, 4, w - 2, H - 8);
        ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth   = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 1, 4, w - 2, H - 8);

        ctx.fillStyle = isActive ? '#ffffff' : '#777777';
        ctx.font = `bold ${Math.min(13, w * 0.32)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        if (w > 22) ctx.fillText(chord.name, x + 7, H / 2);

        pos += chord.durationBeats;
      });
    }

    // Playhead
    if (isPlaying || currentBeat > 0) {
      const px = (currentBeat % totalBeats) * beatWidth;
      ctx.shadowBlur = 8; ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(px - 5, 0); ctx.lineTo(px + 5, 0); ctx.lineTo(px, 8); ctx.closePath(); ctx.fill();
    }

    // Beat numbers
    ctx.fillStyle = '#555'; ctx.font = '9px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let b = 0; b < totalBeats; b += 4) {
      ctx.fillText(String(b + 1), b * beatWidth + beatWidth * 2, 2);
    }
  }, [chords, currentBeat, isPlaying, totalBeats]);

  useEffect(() => { draw(); }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => { canvas.width = canvas.offsetWidth; draw(); });
    ro.observe(canvas);
    canvas.width = canvas.offsetWidth;
    draw();
    return () => ro.disconnect();
  }, [draw]);

  return (
    <div className="timeline">
      <div className="section-header">
        <span className="section-label">TIMELINE</span>
        {isPlaying && (
          <span className="playing-indicator">
            <span className="pulse-dot" /> {playMode === 'song' ? 'SONG' : 'SECTION'}
          </span>
        )}
      </div>
      <canvas ref={canvasRef} className="timeline-canvas" height={60} />
    </div>
  );
};
