/**
 * SearchBar component for searching cards
 * Validates Requirements: 7.1, 7.2, 7.3
 */

import { useState, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Debounce search to avoid excessive filtering
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by card number or player name..."
        className="search-input"
        aria-label="Search cards"
      />
      {query && (
        <button 
          onClick={handleClear}
          className="btn-clear"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
