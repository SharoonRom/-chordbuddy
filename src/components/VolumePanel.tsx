import React from 'react';
import { useStore } from '../store/useStore';

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

const VolumeSlider: React.FC<SliderProps> = ({ label, value, onChange }) => (
  <div className="volume-row">
    <span className="vol-label">{label}</span>
    <input
      type="range"
      className="vol-slider"
      min={0}
      max={1}
      step={0.01}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <span className="vol-value">{Math.round(value * 100)}</span>
  </div>
);

export const VolumePanel: React.FC = () => {
  const masterVolume    = useStore((s) => s.masterVolume);
  const chordVolume     = useStore((s) => s.chordVolume);
  const drumVolume      = useStore((s) => s.drumVolume);
  const setMasterVolume = useStore((s) => s.setMasterVolume);
  const setChordVolume  = useStore((s) => s.setChordVolume);
  const setDrumVolume   = useStore((s) => s.setDrumVolume);

  return (
    <div className="volume-panel">
      <span className="section-label">VOLUMES</span>
      <VolumeSlider label="MASTER" value={masterVolume} onChange={setMasterVolume} />
      <VolumeSlider label="CHORDS" value={chordVolume} onChange={setChordVolume} />
      <VolumeSlider label="DRUMS"  value={drumVolume}  onChange={setDrumVolume}  />
    </div>
  );
};
