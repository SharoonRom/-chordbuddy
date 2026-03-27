import React from 'react';
import { useStore } from '../store/useStore';

const TRACK_LABELS = {
  kick:  'KICK',
  snare: 'SNARE',
  hihat: 'HIHAT',
} as const;

type Track = keyof typeof TRACK_LABELS;
const TRACKS: Track[] = ['kick', 'snare', 'hihat'];

// Beat group separators at indices 4, 8, 12
const BEAT_GROUPS = [0, 4, 8, 12];

export const DrumPanel: React.FC = () => {
  const drumPattern = useStore((s) => s.drumPattern);
  const setDrumStep = useStore((s) => s.setDrumStep);
  const currentBeat = useStore((s) => s.currentBeat);
  const isPlaying = useStore((s) => s.isPlaying);

  // Current 16th step for highlighting
  const currentStep = isPlaying ? Math.floor((currentBeat % (drumPattern.kick.length / 4)) * 4) % drumPattern.kick.length : -1;

  return (
    <div className="drum-panel">
      <div className="section-header">
        <span className="section-label">DRUM MACHINE</span>
        <span className="drum-pattern-name">{drumPattern.name}</span>
      </div>

      <div className="drum-grid">
        {TRACKS.map((track) => (
          <div key={track} className="drum-row">
            <div className="drum-track-label">{TRACK_LABELS[track]}</div>
            <div className="drum-steps">
              {drumPattern[track].map((on, step) => {
                const isGroup = BEAT_GROUPS.includes(step);
                const isActive = isPlaying && step === currentStep;
                return (
                  <button
                    key={step}
                    className={[
                      'drum-step',
                      on ? 'drum-step-on' : 'drum-step-off',
                      isActive ? 'drum-step-playing' : '',
                      isGroup ? 'drum-step-beat' : '',
                    ].join(' ')}
                    onClick={() => setDrumStep(track, step, !on)}
                    title={`${TRACK_LABELS[track]} step ${step + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
