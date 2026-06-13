/**
 * Unit tests for StorageService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService, QuotaExceededError } from './StorageService';
import { CollectionData, CollectedCard } from '../models/types';

describe('StorageService', () => {
  let storageService: StorageService;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    storageService = new StorageService();
    mockLocalStorage = {};

    // Mock localStorage
    globalThis.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      length: 0,
      key: vi.fn(() => null)
    } as Storage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when localStorage is available', () => {
      expect(storageService.isAvailable()).toBe(true);
    });

    it('should return false when localStorage throws error', () => {
      const originalSetItem = globalThis.localStorage.setItem;
      globalThis.localStorage.setItem = vi.fn(() => {
        throw new Error('Storage disabled');
      });

      expect(storageService.isAvailable()).toBe(false);
      
      globalThis.localStorage.setItem = originalSetItem;
    });
  });

  describe('saveCollection', () => {
    it('should save collection data to localStorage', async () => {
      const collectedCards = new Map<string, CollectedCard>();
      collectedCards.set('card-001', {
        cardId: 'card-001',
        quantity: 2,
        dateCollected: Date.now()
      });

      const collection: CollectionData = {
        collectedCards,
        lastUpdated: Date.now()
      };

      await storageService.saveCollection(collection);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'topps-collection-data',
        expect.any(String)
      );

      const saved = JSON.parse(mockLocalStorage['topps-collection-data']!);
      expect(saved.collectedCards).toHaveLength(1);
      expect(saved.lastUpdated).toBe(collection.lastUpdated);
    });

    it('should save collection with variants', async () => {
      const collectedCards = new Map<string, CollectedCard>();
      collectedCards.set('card-001-gold', {
        cardId: 'card-001',
        variantId: 'gold',
        quantity: 1,
        dateCollected: Date.now()
      });

      const collection: CollectionData = {
        collectedCards,
        lastUpdated: Date.now()
      };

      await storageService.saveCollection(collection);

      const saved = JSON.parse(mockLocalStorage['topps-collection-data']!);
      expect(saved.collectedCards[0][1].variantId).toBe('gold');
    });

    it('should throw error when storage is unavailable', async () => {
      vi.spyOn(storageService, 'isAvailable').mockReturnValue(false);

      const collection: CollectionData = {
        collectedCards: new Map(),
        lastUpdated: Date.now()
      };

      await expect(storageService.saveCollection(collection)).rejects.toThrow(
        'Storage is not available'
      );
    });

    it('should throw QuotaExceededError when quota is exceeded', async () => {
      const collection: CollectionData = {
        collectedCards: new Map(),
        lastUpdated: Date.now()
      };

      // Mock setItem to throw QuotaExceededError after isAvailable check passes
      let callCount = 0;
      const originalSetItem = globalThis.localStorage.setItem;
      globalThis.localStorage.setItem = vi.fn((key: string, value: string) => {
        callCount++;
        if (callCount > 1) { // First call is from isAvailable check
          const error = new Error('Quota exceeded');
          error.name = 'QuotaExceededError';
          throw error;
        }
        mockLocalStorage[key] = value;
      });

      await expect(storageService.saveCollection(collection)).rejects.toThrow(
        QuotaExceededError
      );
      
      globalThis.localStorage.setItem = originalSetItem;
    });
  });

  describe('loadCollection', () => {
    it('should return null when no data exists', async () => {
      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should load collection data from localStorage', async () => {
      const collectedCards = new Map<string, CollectedCard>();
      collectedCards.set('card-001', {
        cardId: 'card-001',
        quantity: 2,
        dateCollected: 1234567890
      });

      const collection: CollectionData = {
        collectedCards,
        lastUpdated: 9876543210
      };

      await storageService.saveCollection(collection);
      const loaded = await storageService.loadCollection();

      expect(loaded).not.toBeNull();
      expect(loaded!.lastUpdated).toBe(9876543210);
      expect(loaded!.collectedCards.size).toBe(1);
      expect(loaded!.collectedCards.get('card-001')).toEqual({
        cardId: 'card-001',
        quantity: 2,
        dateCollected: 1234567890
      });
    });

    it('should load collection with variants', async () => {
      const collectedCards = new Map<string, CollectedCard>();
      collectedCards.set('card-001-gold', {
        cardId: 'card-001',
        variantId: 'gold',
        quantity: 1,
        dateCollected: 1234567890
      });

      const collection: CollectionData = {
        collectedCards,
        lastUpdated: Date.now()
      };

      await storageService.saveCollection(collection);
      const loaded = await storageService.loadCollection();

      expect(loaded!.collectedCards.get('card-001-gold')?.variantId).toBe('gold');
    });

    it('should return null when storage is unavailable', async () => {
      vi.spyOn(storageService, 'isAvailable').mockReturnValue(false);

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when data is corrupted (invalid JSON)', async () => {
      mockLocalStorage['topps-collection-data'] = 'invalid json{';

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when data structure is invalid (missing collectedCards)', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when data structure is invalid (missing lastUpdated)', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: []
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when collectedCards is not an array', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: {},
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when card entry has invalid cardId', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: [
          ['card-001', { cardId: 123, quantity: 1, dateCollected: Date.now() }]
        ],
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when card entry has negative quantity', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: [
          ['card-001', { cardId: 'card-001', quantity: -1, dateCollected: Date.now() }]
        ],
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when card entry has invalid dateCollected', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: [
          ['card-001', { cardId: 'card-001', quantity: 1, dateCollected: 'invalid' }]
        ],
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });

    it('should return null when variantId is invalid type', async () => {
      mockLocalStorage['topps-collection-data'] = JSON.stringify({
        collectedCards: [
          ['card-001', { cardId: 'card-001', variantId: 123, quantity: 1, dateCollected: Date.now() }]
        ],
        lastUpdated: Date.now()
      });

      const result = await storageService.loadCollection();
      expect(result).toBeNull();
    });
  });

  describe('round trip persistence', () => {
    it('should preserve data through save and load cycle', async () => {
      const collectedCards = new Map<string, CollectedCard>();
      collectedCards.set('card-001', {
        cardId: 'card-001',
        quantity: 3,
        dateCollected: 1234567890
      });
      collectedCards.set('card-002-silver', {
        cardId: 'card-002',
        variantId: 'silver',
        quantity: 1,
        dateCollected: 9876543210
      });

      const original: CollectionData = {
        collectedCards,
        lastUpdated: 5555555555
      };

      await storageService.saveCollection(original);
      const loaded = await storageService.loadCollection();

      expect(loaded).not.toBeNull();
      expect(loaded!.lastUpdated).toBe(original.lastUpdated);
      expect(loaded!.collectedCards.size).toBe(2);
      expect(loaded!.collectedCards.get('card-001')).toEqual(
        original.collectedCards.get('card-001')
      );
      expect(loaded!.collectedCards.get('card-002-silver')).toEqual(
        original.collectedCards.get('card-002-silver')
      );
    });
  });
});
