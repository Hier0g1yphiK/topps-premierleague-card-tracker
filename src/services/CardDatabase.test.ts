/**
 * Unit tests for CardDatabase
 * 
 * Validates Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CardDatabase } from './CardDatabase';

describe('CardDatabase', () => {
  let database: CardDatabase;

  beforeEach(() => {
    database = new CardDatabase();
  });

  describe('loadCards', () => {
    it('should load cards successfully', async () => {
      const cards = await database.loadCards();
      
      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should return cards with required properties', async () => {
      const cards = await database.loadCards();
      const card = cards[0];
      
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('cardNumber');
      expect(card).toHaveProperty('playerName');
      expect(card).toHaveProperty('team');
      expect(card).toHaveProperty('position');
      expect(card).toHaveProperty('variants');
      expect(Array.isArray(card.variants)).toBe(true);
    });

    it('should handle load errors gracefully', async () => {
      // Force an error by mocking getSampleCardData
      const errorDatabase = new CardDatabase();
      (errorDatabase as any).getSampleCardData = () => {
        throw new Error('Simulated load error');
      };

      await expect(errorDatabase.loadCards()).rejects.toThrow('Failed to load card database');
    });
  });

  describe('getCard', () => {
    it('should return null before database is loaded', () => {
      const card = database.getCard('001');
      expect(card).toBeNull();
    });

    it('should retrieve card by ID after loading', async () => {
      await database.loadCards();
      const card = database.getCard('001');
      
      expect(card).not.toBeNull();
      expect(card?.id).toBe('001');
    });

    it('should return null for non-existent card ID', async () => {
      await database.loadCards();
      const card = database.getCard('999');
      
      expect(card).toBeNull();
    });
  });

  describe('getAllCards', () => {
    it('should return empty array before database is loaded', () => {
      const cards = database.getAllCards();
      expect(cards).toEqual([]);
    });

    it('should return all cards after loading', async () => {
      await database.loadCards();
      const cards = database.getAllCards();
      
      expect(cards.length).toBeGreaterThan(0);
      expect(cards[0]).toHaveProperty('id');
    });

    it('should return a copy of the cards array', async () => {
      await database.loadCards();
      const cards1 = database.getAllCards();
      const cards2 = database.getAllCards();
      
      expect(cards1).not.toBe(cards2); // Different array instances
      expect(cards1).toEqual(cards2); // Same content
    });
  });

  describe('getVariants', () => {
    it('should return empty array for non-existent card', async () => {
      await database.loadCards();
      const variants = database.getVariants('999');
      
      expect(variants).toEqual([]);
    });

    it('should return variants for card with variants', async () => {
      await database.loadCards();
      const variants = database.getVariants('001');
      
      expect(variants.length).toBeGreaterThan(0);
      expect(variants[0]).toHaveProperty('id');
      expect(variants[0]).toHaveProperty('cardId');
      expect(variants[0]).toHaveProperty('variantType');
      expect(variants[0]).toHaveProperty('description');
    });

    it('should return empty array for card without variants', async () => {
      await database.loadCards();
      const variants = database.getVariants('002');
      
      expect(variants).toEqual([]);
    });

    it('should return a copy of the variants array', async () => {
      await database.loadCards();
      const variants1 = database.getVariants('001');
      const variants2 = database.getVariants('001');
      
      expect(variants1).not.toBe(variants2); // Different array instances
      expect(variants1).toEqual(variants2); // Same content
    });
  });
});
