import React from 'react';
import type { Instrument } from '../types';
import { useStore } from '../store/useStore';

const INSTRUMENTS: { id: Instrument; label: string; desc: string }[] = [
  { id: 'piano',  label: 'Piano',    desc: 'Bright, percussive tone' },
  { id: 'guitar', label: 'Guitar',   desc: 'Plucked acoustic strum'  },
  { id: 'pad',    label: 'Synth Pad', desc: 'Slow, lush atmosphere'  },
];

export const InstrumentSelector: React.FC = () => {
  const instrument    = useStore(s => s.instrument);
  const setInstrument = useStore(s => s.setInstrument);

  return (
    <div className="instrument-selector">
      <span className="section-label">INSTRUMENT</span>
      <div className="instrument-buttons">
        {INSTRUMENTS.map(inst => (
          <button
            key={inst.id}
            className={`instrument-btn ${instrument === inst.id ? 'active' : ''}`}
            onClick={() => setInstrument(inst.id)}
            title={inst.desc}
          >
            {inst.label}
          </button>
        ))}
      </div>
    </div>
  );
};
