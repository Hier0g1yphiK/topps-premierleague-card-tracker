/**
 * Unit tests for CollectionManager
 * 
 * Validates Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 3.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { CollectionManager } from './CollectionManager';
import { StorageService } from './StorageService';
import { CardDatabase } from './CardDatabase';
import { CollectionStatus, FilterOptions } from '../models/types';

describe('CollectionManager', () => {
  let manager: CollectionManager;
  let storageService: StorageService;
  let cardDatabase: CardDatabase;

  beforeEach(() => {
    storageService = new StorageService();
    cardDatabase = new CardDatabase();
    manager = new CollectionManager(storageService, cardDatabase);
  });

  describe('markAsCollected', () => {
    it('should mark uncollected card with quantity 1', async () => {
      await manager.markAsCollected('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.COLLECTED);
      expect(manager.getQuantity('001')).toBe(1);
    });

    it('should increment quantity when marking already collected card', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.DUPLICATE);
      expect(manager.getQuantity('001')).toBe(2);
    });

    it('should handle variants independently', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001', 'gold');
      
      expect(manager.getQuantity('001')).toBe(1);
      expect(manager.getQuantity('001', 'gold')).toBe(1);
    });

    it('should persist collection data', async () => {
      const saveSpy = vi.spyOn(storageService, 'saveCollection');
      
      await manager.markAsCollected('001');
      
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('removeCard', () => {
    it('should remove collected card from collection', async () => {
      await manager.markAsCollected('001');
      await manager.removeCard('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.UNCOLLECTED);
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should handle removing uncollected card gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await manager.removeCard('001');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot remove uncollected card'));
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.UNCOLLECTED);
    });

    it('should remove card with duplicates entirely', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      
      await manager.removeCard('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.UNCOLLECTED);
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should handle variants independently when removing', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001', 'gold');
      
      await manager.removeCard('001', 'gold');
      
      expect(manager.getQuantity('001')).toBe(1);
      expect(manager.getQuantity('001', 'gold')).toBe(0);
    });
  });

  describe('incrementQuantity', () => {
    it('should increment quantity of collected card', async () => {
      await manager.markAsCollected('001');
      await manager.incrementQuantity('001');
      
      expect(manager.getQuantity('001')).toBe(2);
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.DUPLICATE);
    });

    it('should handle incrementing uncollected card gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await manager.incrementQuantity('001');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot increment uncollected card'));
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should increment variant quantity independently', async () => {
      await manager.markAsCollected('001', 'gold');
      await manager.incrementQuantity('001', 'gold');
      
      expect(manager.getQuantity('001', 'gold')).toBe(2);
      expect(manager.getQuantity('001')).toBe(0);
    });
  });

  describe('decrementQuantity', () => {
    it('should decrement quantity when greater than 1', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      
      await manager.decrementQuantity('001');
      
      expect(manager.getQuantity('001')).toBe(2);
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.DUPLICATE);
    });

    it('should remove card when quantity reaches 0', async () => {
      await manager.markAsCollected('001');
      
      await manager.decrementQuantity('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.UNCOLLECTED);
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should handle decrementing uncollected card gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      await manager.decrementQuantity('001');
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Cannot decrement uncollected card'));
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should decrement variant quantity independently', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001', 'gold');
      await manager.markAsCollected('001', 'gold');
      
      await manager.decrementQuantity('001', 'gold');
      
      expect(manager.getQuantity('001')).toBe(1);
      expect(manager.getQuantity('001', 'gold')).toBe(1);
    });
  });

  describe('getCollectionStatus', () => {
    it('should return UNCOLLECTED for uncollected card', () => {
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.UNCOLLECTED);
    });

    it('should return COLLECTED for card with quantity 1', async () => {
      await manager.markAsCollected('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.COLLECTED);
    });

    it('should return DUPLICATE for card with quantity > 1', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      
      expect(manager.getCollectionStatus('001')).toBe(CollectionStatus.DUPLICATE);
    });
  });

  describe('getQuantity', () => {
    it('should return 0 for uncollected card', () => {
      expect(manager.getQuantity('001')).toBe(0);
    });

    it('should return correct quantity for collected card', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      
      expect(manager.getQuantity('001')).toBe(3);
    });

    it('should return correct quantity for variant', async () => {
      await manager.markAsCollected('001', 'gold');
      await manager.markAsCollected('001', 'gold');
      
      expect(manager.getQuantity('001', 'gold')).toBe(2);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      // Load card database for statistics tests
      await cardDatabase.loadCards();
    });

    it('should return correct total cards count from database', () => {
      const stats = manager.getStatistics();
      
      // Database has 22 base cards + variants
      // Cards with variants: 001 (2), 004 (1), 006 (2), 007 (1), 010 (1) = 7 variants
      // Total: 22 base + 7 variants = 29 cards
      expect(stats.totalCards).toBe(29);
    });

    it('should return 0 collected unique for empty collection', () => {
      const stats = manager.getStatistics();
      
      expect(stats.collectedUnique).toBe(0);
      expect(stats.completionPercentage).toBe(0);
      expect(stats.totalDuplicates).toBe(0);
    });

    it('should count unique collected cards correctly', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('002');
      await manager.markAsCollected('003');
      
      const stats = manager.getStatistics();
      
      expect(stats.collectedUnique).toBe(3);
    });

    it('should calculate completion percentage correctly', async () => {
      // Collect 3 cards out of 29 total
      await manager.markAsCollected('001');
      await manager.markAsCollected('002');
      await manager.markAsCollected('003');
      
      const stats = manager.getStatistics();
      
      // 3 / 29 * 100 = 10.344827586206897
      expect(stats.completionPercentage).toBeCloseTo(10.34, 2);
    });

    it('should count duplicates correctly', async () => {
      await manager.markAsCollected('001');
      await manager.markAsCollected('001'); // +1 duplicate
      await manager.markAsCollected('001'); // +1 duplicate
      await manager.markAsCollected('002');
      await manager.markAsCollected('002'); // +1 duplicate
      
      const stats = manager.getStatistics();
      
      // Card 001: quantity 3, duplicates = 2
      // Card 002: quantity 2, duplicates = 1
      // Total duplicates = 3
      expect(stats.totalDuplicates).toBe(3);
    });

    it('should count variants independently in statistics', async () => {
      await manager.markAsCollected('001'); // base card
      await manager.markAsCollected('001', '001-gold'); // variant
      await manager.markAsCollected('001', '001-silver'); // variant
      
      const stats = manager.getStatistics();
      
      // Should count as 3 unique collected cards
      expect(stats.collectedUnique).toBe(3);
    });

    it('should handle mixed collection with duplicates and variants', async () => {
      // Collect base cards with duplicates
      await manager.markAsCollected('001');
      await manager.markAsCollected('001');
      await manager.markAsCollected('001'); // 3 copies
      
      // Collect variants
      await manager.markAsCollected('001', '001-gold');
      await manager.markAsCollected('001', '001-gold'); // 2 copies
      
      // Collect another card
      await manager.markAsCollected('002');
      
      const stats = manager.getStatistics();
      
      // Unique: 001 (base), 001-gold (variant), 002 = 3
      expect(stats.collectedUnique).toBe(3);
      
      // Duplicates: 001 has 2 duplicates, 001-gold has 1 duplicate = 3 total
      expect(stats.totalDuplicates).toBe(3);
    });

    it('should return 100% completion when all cards collected', async () => {
      // Collect all base cards
      const allCards = cardDatabase.getAllCards();
      for (const card of allCards) {
        await manager.markAsCollected(card.id);
        
        // Collect all variants
        for (const variant of card.variants) {
          await manager.markAsCollected(card.id, variant.id);
        }
      }
      
      const stats = manager.getStatistics();
      
      expect(stats.completionPercentage).toBe(100);
      expect(stats.collectedUnique).toBe(stats.totalCards);
    });
  });

  describe('initialize', () => {
    it('should load saved collection data', async () => {
      // Setup: save some data
      await manager.markAsCollected('001');
      await manager.markAsCollected('002');
      
      // Create new manager and initialize
      const newManager = new CollectionManager(storageService, cardDatabase);
      await newManager.initialize();
      
      expect(newManager.getQuantity('001')).toBe(1);
      expect(newManager.getQuantity('002')).toBe(1);
    });

    it('should handle no saved data gracefully', async () => {
      // Clear localStorage to simulate no saved data
      localStorage.clear();
      
      const freshStorage = new StorageService();
      const newManager = new CollectionManager(freshStorage, cardDatabase);
      await newManager.initialize();
      
      expect(newManager.getQuantity('001')).toBe(0);
    });
  });

  describe('persistence error handling', () => {
    it('should continue operation even if persistence fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(storageService, 'saveCollection').mockRejectedValue(new Error('Storage error'));
      
      await manager.markAsCollected('001');
      
      // Operation should complete despite storage error
      expect(manager.getQuantity('001')).toBe(1);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to persist collection:', expect.any(Error));
    });
  });

  describe('searchCards', () => {
    beforeEach(async () => {
      // Load card database for search tests
      await cardDatabase.loadCards();
    });

    it('should return all cards when query is empty', () => {
      const results = manager.searchCards('');
      const allCards = cardDatabase.getAllCards();
      
      expect(results.length).toBe(allCards.length);
    });

    it('should return all cards when query is whitespace', () => {
      const results = manager.searchCards('   ');
      const allCards = cardDatabase.getAllCards();
      
      expect(results.length).toBe(allCards.length);
    });

    it('should search by card number case-insensitively', () => {
      const results = manager.searchCards('001');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(card => card.cardNumber === '001')).toBe(true);
    });

    it('should search by player name case-insensitively', () => {
      const results = manager.searchCards('haaland');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(card => card.playerName.toLowerCase().includes('haaland'))).toBe(true);
    });

    it('should search by player name with mixed case', () => {
      const results = manager.searchCards('HaAlAnD');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(card => card.playerName.toLowerCase().includes('haaland'))).toBe(true);
    });

    it('should return partial matches for card number', () => {
      const results = manager.searchCards('00');
      
      // Should match cards 001-009
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(card => card.cardNumber.includes('00'))).toBe(true);
    });

    it('should return partial matches for player name', () => {
      const results = manager.searchCards('son');
      
      // Should match "Son Heung-min" and possibly others with "son" in name
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(card => card.playerName.toLowerCase().includes('son'))).toBe(true);
    });

    it('should return empty array when no matches found', () => {
      const results = manager.searchCards('xyz123nonexistent');
      
      expect(results).toEqual([]);
    });

    it('should match either card number or player name', () => {
      // Search for "001" which should match card number
      const results1 = manager.searchCards('001');
      expect(results1.length).toBeGreaterThan(0);
      
      // Search for player name
      const results2 = manager.searchCards('Salah');
      expect(results2.length).toBeGreaterThan(0);
    });

    it('should trim whitespace from query', () => {
      const results1 = manager.searchCards('  Haaland  ');
      const results2 = manager.searchCards('Haaland');
      
      expect(results1).toEqual(results2);
    });

    it('should complete search within performance target', () => {
      const startTime = performance.now();
      manager.searchCards('Manchester');
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      
      // Should complete within 300ms (Requirement 7.3)
      expect(duration).toBeLessThan(300);
    });
  });

  describe('Property-Based Tests', () => {
    /**
     * Property 1: Marking Uncollected Cards Initializes Quantity and Persists
     * **Validates: Requirements 1.1, 1.3**
     * 
     * For any uncollected card, when marked as collected, the card should have 
     * a quantity of exactly 1 and the collection data in storage should reflect this change.
     */
    it('Property 1: marking any uncollected card initializes quantity to 1 and persists', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            cardId: fc.string({ minLength: 1, maxLength: 10 }),
            variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined })
          }),
          async ({ cardId, variantId }) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Precondition: card must be uncollected
            const initialQuantity = freshManager.getQuantity(cardId, variantId);
            const initialStatus = freshManager.getCollectionStatus(cardId, variantId);
            
            // Skip if card is already collected (shouldn't happen with fresh manager, but be safe)
            fc.pre(initialQuantity === 0);
            fc.pre(initialStatus === CollectionStatus.UNCOLLECTED);

            // Action: mark the uncollected card as collected
            await freshManager.markAsCollected(cardId, variantId);

            // Assertion 1: quantity should be exactly 1
            const quantity = freshManager.getQuantity(cardId, variantId);
            expect(quantity).toBe(1);

            // Assertion 2: status should be COLLECTED (not DUPLICATE)
            const status = freshManager.getCollectionStatus(cardId, variantId);
            expect(status).toBe(CollectionStatus.COLLECTED);

            // Assertion 3: data should be persisted - verify by loading in a new manager
            const verifyManager = new CollectionManager(freshStorage, freshDatabase);
            await verifyManager.initialize();
            
            const persistedQuantity = verifyManager.getQuantity(cardId, variantId);
            expect(persistedQuantity).toBe(1);
            
            const persistedStatus = verifyManager.getCollectionStatus(cardId, variantId);
            expect(persistedStatus).toBe(CollectionStatus.COLLECTED);

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: Increment Increases Quantity by One
     * **Validates: Requirements 3.1**
     * 
     * For any already-collected card, incrementing its quantity should increase 
     * the quantity by exactly 1.
     */
    it('Property 4: incrementing any collected card increases quantity by exactly 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            cardId: fc.string({ minLength: 1, maxLength: 10 }),
            variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
            initialQuantity: fc.integer({ min: 1, max: 100 })
          }),
          async ({ cardId, variantId, initialQuantity }) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect the card multiple times to reach initialQuantity
            for (let i = 0; i < initialQuantity; i++) {
              await freshManager.markAsCollected(cardId, variantId);
            }

            // Precondition: verify card is collected with expected quantity
            const quantityBeforeIncrement = freshManager.getQuantity(cardId, variantId);
            expect(quantityBeforeIncrement).toBe(initialQuantity);

            // Action: increment the quantity
            await freshManager.incrementQuantity(cardId, variantId);

            // Assertion 1: quantity should increase by exactly 1
            const quantityAfterIncrement = freshManager.getQuantity(cardId, variantId);
            expect(quantityAfterIncrement).toBe(initialQuantity + 1);

            // Assertion 2: if initial quantity was 1, status should now be DUPLICATE
            if (initialQuantity === 1) {
              const status = freshManager.getCollectionStatus(cardId, variantId);
              expect(status).toBe(CollectionStatus.DUPLICATE);
            }

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5: Decrement Decreases Quantity by One
     * **Validates: Requirements 3.3**
     * 
     * For any collected card with quantity greater than 1, decrementing should 
     * decrease the quantity by exactly 1.
     */
    it('Property 5: decrementing any collected card with quantity > 1 decreases quantity by exactly 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            cardId: fc.string({ minLength: 1, maxLength: 10 }),
            variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
            initialQuantity: fc.integer({ min: 2, max: 100 })
          }),
          async ({ cardId, variantId, initialQuantity }) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect the card multiple times to reach initialQuantity
            for (let i = 0; i < initialQuantity; i++) {
              await freshManager.markAsCollected(cardId, variantId);
            }

            // Precondition: verify card is collected with expected quantity > 1
            const quantityBeforeDecrement = freshManager.getQuantity(cardId, variantId);
            expect(quantityBeforeDecrement).toBe(initialQuantity);
            fc.pre(quantityBeforeDecrement > 1);

            // Action: decrement the quantity
            await freshManager.decrementQuantity(cardId, variantId);

            // Assertion 1: quantity should decrease by exactly 1
            const quantityAfterDecrement = freshManager.getQuantity(cardId, variantId);
            expect(quantityAfterDecrement).toBe(initialQuantity - 1);

            // Assertion 2: card should still be collected (not removed)
            const status = freshManager.getCollectionStatus(cardId, variantId);
            expect(status).not.toBe(CollectionStatus.UNCOLLECTED);

            // Assertion 3: if quantity is now 1, status should be COLLECTED (not DUPLICATE)
            if (quantityAfterDecrement === 1) {
              expect(status).toBe(CollectionStatus.COLLECTED);
            } else {
              expect(status).toBe(CollectionStatus.DUPLICATE);
            }

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8: Unique Cards Count Accuracy
     * **Validates: Requirements 6.1**
     * 
     * For any collection state, the statistics should report a unique cards count 
     * equal to the number of distinct cards (including variants) with quantity greater than 0.
     */
    it('Property 8: unique cards count equals number of distinct collected cards', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              cardId: fc.string({ minLength: 1, maxLength: 10 }),
              variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (collectedCards) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect cards according to the generated data
            for (const { cardId, variantId, quantity } of collectedCards) {
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Calculate expected unique count (distinct card-variant combinations)
            const uniqueKeys = new Set<string>();
            for (const { cardId, variantId } of collectedCards) {
              const key = variantId ? `${cardId}-${variantId}` : cardId;
              uniqueKeys.add(key);
            }
            const expectedUniqueCount = uniqueKeys.size;

            // Action: get statistics
            const stats = freshManager.getStatistics();

            // Assertion: collectedUnique should match the number of distinct cards
            expect(stats.collectedUnique).toBe(expectedUniqueCount);

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 9: Total Cards Count Matches Database
     * **Validates: Requirements 6.2**
     * 
     * For any card database, the statistics should report a total cards count 
     * equal to the number of cards in the database (base cards + all variants).
     */
    it('Property 9: total cards count matches database size', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              cardId: fc.string({ minLength: 1, maxLength: 10 }),
              variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (collectedCards) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Calculate expected total from database
            const allCards = freshDatabase.getAllCards();
            let expectedTotal = allCards.length; // base cards
            for (const card of allCards) {
              expectedTotal += card.variants.length; // add variants
            }

            // Setup: collect some cards (shouldn't affect total count)
            for (const { cardId, variantId, quantity } of collectedCards) {
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Action: get statistics
            const stats = freshManager.getStatistics();

            // Assertion: totalCards should always match database size regardless of collection state
            expect(stats.totalCards).toBe(expectedTotal);

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 10: Completion Percentage Calculation
     * **Validates: Requirements 6.3**
     * 
     * For any collection state, the completion percentage should equal 
     * (unique cards collected / total cards in database) × 100.
     */
    it('Property 10: completion percentage equals (collected / total) * 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              cardId: fc.string({ minLength: 1, maxLength: 10 }),
              variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (collectedCards) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect cards according to the generated data
            for (const { cardId, variantId, quantity } of collectedCards) {
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Action: get statistics
            const stats = freshManager.getStatistics();

            // Calculate expected completion percentage
            const expectedPercentage = stats.totalCards > 0
              ? (stats.collectedUnique / stats.totalCards) * 100
              : 0;

            // Assertion: completion percentage should match the formula
            expect(stats.completionPercentage).toBeCloseTo(expectedPercentage, 10);

            // Additional assertions for boundary conditions
            expect(stats.completionPercentage).toBeGreaterThanOrEqual(0);
            expect(stats.completionPercentage).toBeLessThanOrEqual(100);

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 11: Duplicate Count Accuracy
     * **Validates: Requirements 6.4**
     * 
     * For any collection state, the total duplicates count should equal 
     * the sum of (quantity - 1) for all collected cards with quantity greater than 1.
     */
    it('Property 11: duplicate count equals sum of (quantity - 1) for cards with quantity > 1', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              cardId: fc.string({ minLength: 1, maxLength: 10 }),
              variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
              quantity: fc.integer({ min: 1, max: 10 })
            }),
            { minLength: 0, maxLength: 20 }
          ),
          async (collectedCards) => {
            // Setup: fresh manager with fresh storage
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect cards according to the generated data
            const quantityByKey = new Map<string, number>();
            for (const { cardId, variantId, quantity } of collectedCards) {
              const key = variantId ? `${cardId}-${variantId}` : cardId;
              const currentQuantity = quantityByKey.get(key) || 0;
              quantityByKey.set(key, currentQuantity + quantity);
            }

            // Collect cards
            for (const [key, quantity] of quantityByKey.entries()) {
              const [cardId, variantId] = key.includes('-') ? key.split('-') : [key, undefined];
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Calculate expected duplicates count
            let expectedDuplicates = 0;
            for (const quantity of quantityByKey.values()) {
              if (quantity > 1) {
                expectedDuplicates += (quantity - 1);
              }
            }

            // Action: get statistics
            const stats = freshManager.getStatistics();

            // Assertion: totalDuplicates should match expected count
            expect(stats.totalDuplicates).toBe(expectedDuplicates);

            // Additional assertion: duplicates should never be negative
            expect(stats.totalDuplicates).toBeGreaterThanOrEqual(0);

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 12: Search Returns Only Matching Cards
     * **Validates: Requirements 7.1, 7.2**
     * 
     * For any search query, all returned cards should contain the search term 
     * in either their card number or player name (case-insensitive).
     */
    it('Property 12: search returns only cards matching query in card number or player name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 0, maxLength: 20 }),
          async (query) => {
            // Setup: fresh manager with loaded database
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Action: search for cards
            const results = freshManager.searchCards(query);

            // If query is empty or whitespace, should return all cards
            if (!query || query.trim() === '') {
              const allCards = freshDatabase.getAllCards();
              expect(results.length).toBe(allCards.length);
            } else {
              // Normalize query for comparison
              const normalizedQuery = query.toLowerCase().trim();

              // Assertion: all returned cards should match the query
              for (const card of results) {
                const cardNumberMatch = card.cardNumber.toLowerCase().includes(normalizedQuery);
                const playerNameMatch = card.playerName.toLowerCase().includes(normalizedQuery);
                
                // At least one field should match
                expect(cardNumberMatch || playerNameMatch).toBe(true);
              }

              // Assertion: no matching cards should be excluded
              const allCards = freshDatabase.getAllCards();
              for (const card of allCards) {
                const cardNumberMatch = card.cardNumber.toLowerCase().includes(normalizedQuery);
                const playerNameMatch = card.playerName.toLowerCase().includes(normalizedQuery);
                
                if (cardNumberMatch || playerNameMatch) {
                  // This card should be in results
                  expect(results).toContainEqual(card);
                }
              }
            }

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Filter Returns Only Matching Cards
     * **Validates: Requirements 2.4, 3.5, 7.4**
     * 
     * For any filter criteria (collection status, duplicates, uncollected), 
     * all returned cards should satisfy the filter condition and no cards 
     * that satisfy the condition should be excluded.
     */
    it('Property 3: filter returns only cards matching filter criteria', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate collection state
            collectedCards: fc.array(
              fc.record({
                cardId: fc.constantFrom('001', '002', '003', '004', '005', '006', '007', '008'),
                variantId: fc.option(fc.constantFrom('001-gold', '001-silver', '004-gold', '006-silver'), { nil: undefined }),
                quantity: fc.integer({ min: 1, max: 5 })
              }),
              { minLength: 0, maxLength: 10 }
            ),
            // Generate filter options
            filterStatus: fc.option(
              fc.array(
                fc.constantFrom(CollectionStatus.COLLECTED, CollectionStatus.UNCOLLECTED, CollectionStatus.DUPLICATE),
                { minLength: 1, maxLength: 3 }
              ),
              { nil: undefined }
            ),
            filterHasDuplicates: fc.option(fc.boolean(), { nil: undefined }),
            filterHasVariants: fc.option(fc.boolean(), { nil: undefined })
          }),
          async ({ collectedCards, filterStatus, filterHasDuplicates, filterHasVariants }) => {
            // Setup: fresh manager with loaded database
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect cards according to generated data
            for (const { cardId, variantId, quantity } of collectedCards) {
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Build filter options
            const filters: FilterOptions = {
              status: filterStatus,
              hasDuplicates: filterHasDuplicates,
              hasVariants: filterHasVariants
            };

            // Action: filter cards
            const results = freshManager.filterCards(filters);

            // Get all cards for validation
            const allCards = freshDatabase.getAllCards();

            // Assertion 1: all returned cards should satisfy ALL filter conditions
            for (const card of results) {
              // Check status filter
              if (filters.status && filters.status.length > 0) {
                const baseStatus = freshManager.getCollectionStatus(card.id);
                let matchesStatus = filters.status.includes(baseStatus);
                
                // Check variants
                for (const variant of card.variants) {
                  const variantStatus = freshManager.getCollectionStatus(card.id, variant.id);
                  if (filters.status.includes(variantStatus)) {
                    matchesStatus = true;
                    break;
                  }
                }
                
                expect(matchesStatus).toBe(true);
              }

              // Check duplicates filter
              if (filters.hasDuplicates !== undefined) {
                const baseQuantity = freshManager.getQuantity(card.id);
                let hasDuplicates = baseQuantity > 1;
                
                for (const variant of card.variants) {
                  const variantQuantity = freshManager.getQuantity(card.id, variant.id);
                  if (variantQuantity > 1) {
                    hasDuplicates = true;
                    break;
                  }
                }
                
                expect(hasDuplicates).toBe(filters.hasDuplicates);
              }

              // Check variants filter
              if (filters.hasVariants !== undefined) {
                const hasVariants = card.variants.length > 0;
                expect(hasVariants).toBe(filters.hasVariants);
              }
            }

            // Assertion 2: no cards that satisfy the condition should be excluded
            for (const card of allCards) {
              let shouldBeIncluded = true;

              // Check status filter
              if (filters.status && filters.status.length > 0) {
                const baseStatus = freshManager.getCollectionStatus(card.id);
                let matchesStatus = filters.status.includes(baseStatus);
                
                for (const variant of card.variants) {
                  const variantStatus = freshManager.getCollectionStatus(card.id, variant.id);
                  if (filters.status.includes(variantStatus)) {
                    matchesStatus = true;
                    break;
                  }
                }
                
                if (!matchesStatus) {
                  shouldBeIncluded = false;
                }
              }

              // Check duplicates filter
              if (shouldBeIncluded && filters.hasDuplicates !== undefined) {
                const baseQuantity = freshManager.getQuantity(card.id);
                let hasDuplicates = baseQuantity > 1;
                
                for (const variant of card.variants) {
                  const variantQuantity = freshManager.getQuantity(card.id, variant.id);
                  if (variantQuantity > 1) {
                    hasDuplicates = true;
                    break;
                  }
                }
                
                if (hasDuplicates !== filters.hasDuplicates) {
                  shouldBeIncluded = false;
                }
              }

              // Check variants filter
              if (shouldBeIncluded && filters.hasVariants !== undefined) {
                const hasVariants = card.variants.length > 0;
                if (hasVariants !== filters.hasVariants) {
                  shouldBeIncluded = false;
                }
              }

              // If card should be included, verify it's in results
              if (shouldBeIncluded) {
                expect(results).toContainEqual(card);
              }
            }

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 13: Multiple Filters Conjunction
     * **Validates: Requirements 7.5**
     * 
     * For any combination of multiple filters applied simultaneously, 
     * all returned cards should satisfy every filter condition.
     */
    it('Property 13: multiple filters applied simultaneously return cards satisfying all conditions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Generate collection state
            collectedCards: fc.array(
              fc.record({
                cardId: fc.constantFrom('001', '002', '003', '004', '005', '006', '007', '008'),
                variantId: fc.option(fc.constantFrom('001-gold', '001-silver', '004-gold', '006-silver'), { nil: undefined }),
                quantity: fc.integer({ min: 1, max: 5 })
              }),
              { minLength: 0, maxLength: 15 }
            ),
            // Generate multiple filter combinations
            useStatusFilter: fc.boolean(),
            statusFilters: fc.array(
              fc.constantFrom(CollectionStatus.COLLECTED, CollectionStatus.UNCOLLECTED, CollectionStatus.DUPLICATE),
              { minLength: 1, maxLength: 3 }
            ),
            useDuplicatesFilter: fc.boolean(),
            duplicatesFilter: fc.boolean(),
            useVariantsFilter: fc.boolean(),
            variantsFilter: fc.boolean()
          }),
          async ({ 
            collectedCards, 
            useStatusFilter, 
            statusFilters, 
            useDuplicatesFilter, 
            duplicatesFilter,
            useVariantsFilter,
            variantsFilter
          }) => {
            // Setup: fresh manager with loaded database
            const freshStorage = new StorageService();
            const freshDatabase = new CardDatabase();
            await freshDatabase.loadCards();
            const freshManager = new CollectionManager(freshStorage, freshDatabase);
            await freshManager.initialize();

            // Setup: collect cards according to generated data
            for (const { cardId, variantId, quantity } of collectedCards) {
              for (let i = 0; i < quantity; i++) {
                await freshManager.markAsCollected(cardId, variantId);
              }
            }

            // Build filter options with multiple filters
            const filters: FilterOptions = {
              status: useStatusFilter ? statusFilters : undefined,
              hasDuplicates: useDuplicatesFilter ? duplicatesFilter : undefined,
              hasVariants: useVariantsFilter ? variantsFilter : undefined
            };

            // Skip if no filters are applied
            const hasAnyFilter = useStatusFilter || useDuplicatesFilter || useVariantsFilter;
            fc.pre(hasAnyFilter);

            // Action: filter cards with multiple filters
            const results = freshManager.filterCards(filters);

            // Get all cards for validation
            const allCards = freshDatabase.getAllCards();

            // Assertion: all returned cards must satisfy EVERY filter condition
            for (const card of results) {
              // Verify status filter (if applied)
              if (useStatusFilter) {
                const baseStatus = freshManager.getCollectionStatus(card.id);
                let matchesStatus = statusFilters.includes(baseStatus);
                
                for (const variant of card.variants) {
                  const variantStatus = freshManager.getCollectionStatus(card.id, variant.id);
                  if (statusFilters.includes(variantStatus)) {
                    matchesStatus = true;
                    break;
                  }
                }
                
                expect(matchesStatus).toBe(true);
              }

              // Verify duplicates filter (if applied)
              if (useDuplicatesFilter) {
                const baseQuantity = freshManager.getQuantity(card.id);
                let hasDuplicates = baseQuantity > 1;
                
                for (const variant of card.variants) {
                  const variantQuantity = freshManager.getQuantity(card.id, variant.id);
                  if (variantQuantity > 1) {
                    hasDuplicates = true;
                    break;
                  }
                }
                
                expect(hasDuplicates).toBe(duplicatesFilter);
              }

              // Verify variants filter (if applied)
              if (useVariantsFilter) {
                const hasVariants = card.variants.length > 0;
                expect(hasVariants).toBe(variantsFilter);
              }
            }

            // Assertion: verify conjunction - cards satisfying all conditions are included
            for (const card of allCards) {
              let satisfiesAllConditions = true;

              // Check status filter
              if (useStatusFilter) {
                const baseStatus = freshManager.getCollectionStatus(card.id);
                let matchesStatus = statusFilters.includes(baseStatus);
                
                for (const variant of card.variants) {
                  const variantStatus = freshManager.getCollectionStatus(card.id, variant.id);
                  if (statusFilters.includes(variantStatus)) {
                    matchesStatus = true;
                    break;
                  }
                }
                
                if (!matchesStatus) {
                  satisfiesAllConditions = false;
                }
              }

              // Check duplicates filter
              if (satisfiesAllConditions && useDuplicatesFilter) {
                const baseQuantity = freshManager.getQuantity(card.id);
                let hasDuplicates = baseQuantity > 1;
                
                for (const variant of card.variants) {
                  const variantQuantity = freshManager.getQuantity(card.id, variant.id);
                  if (variantQuantity > 1) {
                    hasDuplicates = true;
                    break;
                  }
                }
                
                if (hasDuplicates !== duplicatesFilter) {
                  satisfiesAllConditions = false;
                }
              }

              // Check variants filter
              if (satisfiesAllConditions && useVariantsFilter) {
                const hasVariants = card.variants.length > 0;
                if (hasVariants !== variantsFilter) {
                  satisfiesAllConditions = false;
                }
              }

              // If card satisfies all conditions, it must be in results
              if (satisfiesAllConditions) {
                expect(results).toContainEqual(card);
              } else {
                // If card doesn't satisfy all conditions, it must NOT be in results
                expect(results).not.toContainEqual(card);
              }
            }

            // Cleanup: clear storage for next iteration
            localStorage.clear();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
