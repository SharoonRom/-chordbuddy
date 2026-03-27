import React from 'react';
import type { Genre } from '../types';
import { GENRE_ORDER, getGenreLabel } from '../music/GenreEngine';
import { useStore } from '../store/useStore';

const GENRE_ICONS: Record<Genre, string> = {
  pop: '✦',
  'slow-indie': '◈',
  ambient: '○',
  rock: '◆',
  sad: '◇',
  happy: '◉',
};

export const GenreSelector: React.FC = () => {
  const genre = useStore((s) => s.genre);
  const selectGenre = useStore((s) => s.selectGenre);

  return (
    <div className="genre-selector">
      <span className="section-label">GENRE</span>
      <div className="genre-buttons">
        {GENRE_ORDER.map((g) => (
          <button
            key={g}
            className={`genre-btn ${genre === g ? 'active' : ''}`}
            onClick={() => selectGenre(g)}
          >
            <span className="genre-icon">{GENRE_ICONS[g]}</span>
            <span className="genre-name">{getGenreLabel(g)}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
