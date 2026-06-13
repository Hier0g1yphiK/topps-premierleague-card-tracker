/**
 * Dark Mode Toggle Component
 * Provides a switch to toggle between light and dark themes
 */

import { useState, useEffect } from 'react';
import './DarkModeToggle.css';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Check system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Apply theme to document
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    // Save preference
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
