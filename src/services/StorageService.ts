/**
 * StorageService handles all localStorage persistence operations
 * with proper error handling and data validation.
 * 
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { CollectionData, CollectedCard } from '../models/types';

const STORAGE_KEY = 'topps-collection-data';

export class StorageService {
  /**
   * Check if localStorage is available
   * Validates Requirement: 5.3
   */
  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save collection data to localStorage
   * Validates Requirements: 5.1, 5.4
   */
  async saveCollection(collection: CollectionData): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Storage is not available');
    }

    try {
      // Convert Map to array for JSON serialization
      const serializable = {
        collectedCards: Array.from(collection.collectedCards.entries()),
        lastUpdated: collection.lastUpdated
      };

      const json = JSON.stringify(serializable);
      localStorage.setItem(STORAGE_KEY, json);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new QuotaExceededError('Storage quota exceeded. Please clear browser data.');
      }
      throw new Error('Failed to save collection data');
    }
  }

  /**
   * Load collection data from localStorage with error handling and validation
   * Validates Requirements: 5.2, 5.4
   */
  async loadCollection(): Promise<CollectionData | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const json = localStorage.getItem(STORAGE_KEY);
      
      if (!json) {
        return null;
      }

      const parsed = JSON.parse(json);
      
      // Validate data structure
      if (!this.isValidCollectionData(parsed)) {
        console.error('Collection data corrupted, resetting to empty');
        return null;
      }

      // Convert array back to Map
      const collectedCards = new Map<string, CollectedCard>(
        parsed.collectedCards
      );

      return {
        collectedCards,
        lastUpdated: parsed.lastUpdated
      };
    } catch (error) {
      console.error('Failed to load collection data:', error);
      return null;
    }
  }

  /**
   * Validate collection data structure to detect corruption
   * Validates Requirement: 5.4
   */
  private isValidCollectionData(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }

    if (!Array.isArray(data.collectedCards)) {
      return false;
    }

    if (typeof data.lastUpdated !== 'number') {
      return false;
    }

    // Validate each collected card entry
    for (const [key, card] of data.collectedCards) {
      if (typeof key !== 'string') {
        return false;
      }

      if (!card || typeof card !== 'object') {
        return false;
      }

      if (typeof card.cardId !== 'string') {
        return false;
      }

      if (typeof card.quantity !== 'number' || card.quantity < 0) {
        return false;
      }

      if (typeof card.dateCollected !== 'number') {
        return false;
      }

      if (card.variantId !== undefined && typeof card.variantId !== 'string') {
        return false;
      }
    }

    return true;
  }
}

/**
 * Custom error for quota exceeded scenarios
 */
export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}
