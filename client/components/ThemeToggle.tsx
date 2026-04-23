import React from 'react';
import { useTheme } from '../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      className={`theme-toggle inline-flex items-center gap-[10px] rounded-[999px] px-[10px] py-[8px] font-diatype text-[11px] uppercase tracking-m3p transition ${className}`}
    >
      <span className="theme-toggle-track inline-flex h-[28px] w-[52px] items-center rounded-full p-[3px] transition">
        <span
          className={`theme-toggle-thumb inline-flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] transition ${
            isLight ? 'translate-x-[24px]' : 'translate-x-0'
          }`}
        >
          {isLight ? 'L' : 'D'}
        </span>
      </span>
      <span>{isLight ? 'Light' : 'Dark'}</span>
    </button>
  );
};

export default ThemeToggle;
