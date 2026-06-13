import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  Card,
  Variant,
  CollectionData,
  CollectedCard,
  CollectionStatus,
  CollectionStatistics,
  FilterOptions
} from './types';

describe('Core TypeScript Interfaces', () => {
  it('should create a valid Card object', () => {
    const card: Card = {
      id: '001',
      cardNumber: '001',
      playerName: 'Test Player',
      team: 'Test Team',
      position: 'Forward',
      variants: []
    };

    expect(card.id).toBe('001');
    expect(card.playerName).toBe('Test Player');
    expect(card.variants).toEqual([]);
  });

  it('should create a valid Variant object', () => {
    const variant: Variant = {
      id: 'var-001',
      cardId: '001',
      variantType: 'Gold',
      description: 'Gold parallel card'
    };

    expect(variant.id).toBe('var-001');
    expect(variant.variantType).toBe('Gold');
  });

  it('should create a valid CollectedCard object', () => {
    const collectedCard: CollectedCard = {
      cardId: '001',
      quantity: 2,
      dateCollected: Date.now()
    };

    expect(collectedCard.cardId).toBe('001');
    expect(collectedCard.quantity).toBe(2);
    expect(collectedCard.variantId).toBeUndefined();
  });

  it('should create a valid CollectedCard with variant', () => {
    const collectedCard: CollectedCard = {
      cardId: '001',
      variantId: 'var-001',
      quantity: 1,
      dateCollected: Date.now()
    };

    expect(collectedCard.variantId).toBe('var-001');
  });

  it('should create a valid CollectionData object', () => {
    const collectionData: CollectionData = {
      collectedCards: new Map(),
      lastUpdated: Date.now()
    };

    expect(collectionData.collectedCards.size).toBe(0);
    expect(collectionData.lastUpdated).toBeGreaterThan(0);
  });

  it('should use CollectionStatus enum values', () => {
    expect(CollectionStatus.UNCOLLECTED).toBe('uncollected');
    expect(CollectionStatus.COLLECTED).toBe('collected');
    expect(CollectionStatus.DUPLICATE).toBe('duplicate');
  });

  it('should create a valid CollectionStatistics object', () => {
    const stats: CollectionStatistics = {
      totalCards: 100,
      collectedUnique: 50,
      completionPercentage: 50,
      totalDuplicates: 10
    };

    expect(stats.totalCards).toBe(100);
    expect(stats.completionPercentage).toBe(50);
  });

  it('should create a valid FilterOptions object with all fields', () => {
    const filters: FilterOptions = {
      status: [CollectionStatus.COLLECTED, CollectionStatus.DUPLICATE],
      hasVariants: true,
      hasDuplicates: true
    };

    expect(filters.status).toHaveLength(2);
    expect(filters.hasVariants).toBe(true);
  });

  it('should create a valid FilterOptions object with optional fields', () => {
    const filters: FilterOptions = {
      status: [CollectionStatus.UNCOLLECTED]
    };

    expect(filters.status).toHaveLength(1);
    expect(filters.hasVariants).toBeUndefined();
    expect(filters.hasDuplicates).toBeUndefined();
  });

  it('should create an empty FilterOptions object', () => {
    const filters: FilterOptions = {};

    expect(filters.status).toBeUndefined();
    expect(filters.hasVariants).toBeUndefined();
    expect(filters.hasDuplicates).toBeUndefined();
  });
});

describe('Property-Based Tests', () => {
  // Feature: topps-card-collection-tracker, Property 7: Persistence Round Trip
  // **Validates: Requirements 5.2**
  it('should preserve CollectionData through serialization and deserialization', () => {
    // Generator for CollectedCard
    const collectedCardArb = fc.record({
      cardId: fc.string({ minLength: 1, maxLength: 10 }),
      variantId: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
      quantity: fc.integer({ min: 1, max: 100 }),
      dateCollected: fc.integer({ min: 0, max: Date.now() })
    });

    // Generator for CollectionData
    const collectionDataArb = fc.record({
      collectedCards: fc.array(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 20 }), // key
          collectedCardArb // value
        ),
        { minLength: 0, maxLength: 50 }
      ).map(entries => new Map(entries)),
      lastUpdated: fc.integer({ min: 0, max: Date.now() })
    });

    fc.assert(
      fc.property(collectionDataArb, (originalData) => {
        // Serialize: Convert Map to array for JSON serialization
        const serialized = JSON.stringify({
          collectedCards: Array.from(originalData.collectedCards.entries()),
          lastUpdated: originalData.lastUpdated
        });

        // Deserialize: Convert array back to Map
        const parsed = JSON.parse(serialized);
        const deserializedData: CollectionData = {
          collectedCards: new Map(parsed.collectedCards),
          lastUpdated: parsed.lastUpdated
        };

        // Verify: Check that all data is preserved
        expect(deserializedData.lastUpdated).toBe(originalData.lastUpdated);
        expect(deserializedData.collectedCards.size).toBe(originalData.collectedCards.size);

        // Verify each entry in the Map
        for (const [key, originalCard] of originalData.collectedCards.entries()) {
          const deserializedCard = deserializedData.collectedCards.get(key);
          expect(deserializedCard).toBeDefined();
          expect(deserializedCard?.cardId).toBe(originalCard.cardId);
          expect(deserializedCard?.variantId).toBe(originalCard.variantId);
          expect(deserializedCard?.quantity).toBe(originalCard.quantity);
          expect(deserializedCard?.dateCollected).toBe(originalCard.dateCollected);
        }
      }),
      { numRuns: 100 }
    );
  });
});
