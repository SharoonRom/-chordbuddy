import React, { useRef, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

export const Timeline: React.FC = () => {
  const chords = useStore((s) => s.chords);
  const currentBeat = useStore((s) => s.currentBeat);
  const isPlaying = useStore((s) => s.isPlaying);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalBeats = chords.reduce((s, c) => s + c.durationBeats, 0) || 16;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const beatWidth = W / totalBeats;

    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    // Grid lines (every beat)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let b = 0; b <= totalBeats; b++) {
      const x = b * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }

    // Chord blocks
    if (chords.length > 0) {
      let pos = 0;
      chords.forEach((chord) => {
        const x = pos * beatWidth;
        const w = chord.durationBeats * beatWidth;
        const isActive = isPlaying && (currentBeat % totalBeats) >= pos &&
          (currentBeat % totalBeats) < pos + chord.durationBeats;

        // Block fill
        ctx.fillStyle = isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)';
        ctx.fillRect(x + 1, 4, w - 2, H - 8);

        // Block border
        ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 1, 4, w - 2, H - 8);

        // Chord label
        ctx.fillStyle = isActive ? '#ffffff' : '#888888';
        ctx.font = `bold ${Math.min(14, w * 0.35)}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const label = chord.name;
        const textX = x + 8;
        if (w > 24) ctx.fillText(label, textX, H / 2);

        pos += chord.durationBeats;
      });
    }

    // Playhead
    if (isPlaying || currentBeat > 0) {
      const playBeat = currentBeat % totalBeats;
      const px = playBeat * beatWidth;

      // Glow effect
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Playhead triangle at top
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(px - 5, 0);
      ctx.lineTo(px + 5, 0);
      ctx.lineTo(px, 8);
      ctx.closePath();
      ctx.fill();
    }

    // Beat numbers at top
    ctx.fillStyle = '#444';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let b = 0; b < totalBeats; b += 4) {
      ctx.fillText(String(b + 1), b * beatWidth + beatWidth * 2, 2);
    }
  }, [chords, currentBeat, isPlaying, totalBeats]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Handle resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      draw();
    });
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
            <span className="pulse-dot" /> PLAYING
          </span>
        )}
      </div>
      <canvas ref={canvasRef} className="timeline-canvas" height={64} />
    </div>
  );
};
