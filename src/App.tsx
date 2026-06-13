/**
 * Main App component integrating all layers
 * Validates Requirements: 1.2, 2.3, 5.2, 5.3, 6.5, 8.1, 8.4, 8.5
 */

import { useState, useEffect, useCallback } from 'react';
import { CollectionManager } from './services/CollectionManager';
import { StorageService } from './services/StorageService';
import { CardDatabase } from './services/CardDatabase';
import { Card, CollectionStatus, FilterOptions } from './models/types';
import { StatisticsPanel } from './components/StatisticsPanel';
import { SearchBar } from './components/SearchBar';
import { FilterPanel } from './components/FilterPanel';
import { CardGrid } from './components/CardGrid';
import { DarkModeToggle } from './components/DarkModeToggle';

function App() {
  const [manager, setManager] = useState<CollectionManager | null>(null);
  const [database, setDatabase] = useState<CardDatabase | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<CollectionStatus[]>([]);
  const [selectedSubsets, setSelectedSubsets] = useState<string[]>([]);
  const [availableSubsets, setAvailableSubsets] = useState<string[]>([]);
  const [, setUpdateTrigger] = useState(0);

  // Initialize app
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize services
        const storageService = new StorageService();
        const cardDatabase = new CardDatabase();
        const collectionManager = new CollectionManager(storageService, cardDatabase);

        // Check storage availability
        if (!storageService.isAvailable()) {
          setError('Storage is not available. Your collection will not be saved.');
        }

        // Load card database
        try {
          await cardDatabase.loadCards();
        } catch (err) {
          setError('Failed to load card database. Please refresh the page.');
          console.error(err);
          return;
        }

        // Load saved collection
        await collectionManager.initialize();

        // Set state
        setDatabase(cardDatabase);
        setManager(collectionManager);
        setCards(cardDatabase.getAllCards());
        setFilteredCards(cardDatabase.getAllCards());
        setAvailableSubsets(collectionManager.getUniqueSubsets());
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize application. Please refresh the page.');
        console.error(err);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Apply search and filters
  useEffect(() => {
    if (!manager || !database) return;

    let result = cards;

    // Apply search first
    if (searchQuery.trim()) {
      result = manager.searchCards(searchQuery);
    }

    // Apply filters on top of search results
    if (selectedStatuses.length > 0 || selectedSubsets.length > 0) {
      const filters: FilterOptions = {
        status: selectedStatuses.length > 0 ? selectedStatuses : undefined,
        subsets: selectedSubsets.length > 0 ? selectedSubsets : undefined
      };
      // Filter the current result set (which may already be filtered by search)
      result = result.filter(card => {
        // Filter by collection status - check ONLY the base card status
        if (filters.status && filters.status.length > 0) {
          const baseStatus = manager.getCollectionStatus(card.id);
          
          if (!filters.status.includes(baseStatus)) {
            return false;
          }
        }

        // Filter by subsets
        if (filters.subsets && filters.subsets.length > 0) {
          if (!filters.subsets.includes(card.position)) {
            return false;
          }
        }

        return true;
      });
    }

    setFilteredCards(result);
  }, [searchQuery, selectedStatuses, selectedSubsets, cards, manager, database]);

  // Force re-render when collection changes
  const triggerUpdate = useCallback(() => {
    setUpdateTrigger(prev => prev + 1);
  }, []);

  // Collection operations
  const handleMarkCollected = useCallback(async (cardId: string, variantId?: string) => {
    if (!manager) return;
    await manager.markAsCollected(cardId, variantId);
    triggerUpdate();
  }, [manager, triggerUpdate]);

  const handleIncrement = useCallback(async (cardId: string, variantId?: string) => {
    if (!manager) return;
    await manager.incrementQuantity(cardId, variantId);
    triggerUpdate();
  }, [manager, triggerUpdate]);

  const handleDecrement = useCallback(async (cardId: string, variantId?: string) => {
    if (!manager) return;
    await manager.decrementQuantity(cardId, variantId);
    triggerUpdate();
  }, [manager, triggerUpdate]);

  const getStatus = useCallback((cardId: string) => {
    if (!manager) return CollectionStatus.UNCOLLECTED;
    return manager.getCollectionStatus(cardId);
  }, [manager]);

  const getQuantity = useCallback((cardId: string) => {
    if (!manager) return 0;
    return manager.getQuantity(cardId);
  }, [manager]);

  const getVariantStatus = useCallback((cardId: string, variantId: string) => {
    if (!manager) return CollectionStatus.UNCOLLECTED;
    return manager.getCollectionStatus(cardId, variantId);
  }, [manager]);

  const getVariantQuantity = useCallback((cardId: string, variantId: string) => {
    if (!manager) return 0;
    return manager.getQuantity(cardId, variantId);
  }, [manager]);

  const statistics = manager ? manager.getStatistics() : {
    totalCards: 0,
    collectedUnique: 0,
    completionPercentage: 0,
    totalDuplicates: 0
  };

  if (error && isLoading) {
    return (
      <div className="app error-state">
        <h1>Error</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Topps Premier League 2026 Card Collection Tracker</h1>
          <DarkModeToggle />
        </div>
        {error && <div className="error-banner">{error}</div>}
      </header>

      <main className="app-main">
        <aside className="sidebar">
          <StatisticsPanel statistics={statistics} />
          <FilterPanel 
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            availableSubsets={availableSubsets}
            selectedSubsets={selectedSubsets}
            onSubsetChange={setSelectedSubsets}
          />
        </aside>

        <section className="content">
          <SearchBar onSearch={setSearchQuery} />
          <CardGrid
            cards={filteredCards}
            isLoading={isLoading}
            getStatus={getStatus}
            getQuantity={getQuantity}
            onMarkCollected={handleMarkCollected}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            getVariantStatus={getVariantStatus}
            getVariantQuantity={getVariantQuantity}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
