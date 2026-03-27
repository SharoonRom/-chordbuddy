import React from 'react';
import { useStore } from '../store/useStore';

export const ThemeToggle: React.FC = () => {
  const theme    = useStore(s => s.theme);
  const setTheme = useStore(s => s.setTheme);

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
};
