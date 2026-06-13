/**
 * CardDatabase provides access to the complete card set data
 * 
 * Validates Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { Card, Variant } from '../models/types';

export class CardDatabase {
  private cards: Card[] = [];
  private cardsById: Map<string, Card> = new Map();
  private isLoaded: boolean = false;

  /**
   * Load cards from the database
   * @throws Error if database fails to load
   */
  async loadCards(): Promise<Card[]> {
    try {
      // Load card data from CSV file
      const response = await fetch('/topps2026full.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch card data');
      }
      
      const csvText = await response.text();
      
      // Parse CSV (skip header row)
      const lines = csvText.split('\n').slice(1);
      const rawData: [string, string, string, string, string][] = [];
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Simple CSV parsing (handles basic cases)
        const parts = line.split(',');
        if (parts.length >= 5) {
          const set = parts[0]?.trim() || '';
          const subset = parts[1]?.trim() || '';
          const cardNum = parts[2]?.trim() || '';
          const player = parts[3]?.trim() || '';
          const team = parts[4]?.trim() || '';
          
          rawData.push([set, subset, cardNum, player, team]);
        }
      }
      
      // Parse card data
      this.cards = this.parseCardData(rawData);
      
      // Build index for fast lookups
      this.cardsById.clear();
      for (const card of this.cards) {
        this.cardsById.set(card.id, card);
      }
      
      this.isLoaded = true;
      return this.cards;
    } catch (error) {
      this.isLoaded = false;
      throw new Error(`Failed to load card database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific card by ID
   * @param cardId The unique card identifier
   * @returns The card if found, null otherwise
   */
  getCard(cardId: string): Card | null {
    if (!this.isLoaded) {
      console.warn('CardDatabase: getCard called before database loaded');
      return null;
    }
    return this.cardsById.get(cardId) || null;
  }

  /**
   * Get all cards in the database
   * @returns Array of all cards
   */
  getAllCards(): Card[] {
    if (!this.isLoaded) {
      console.warn('CardDatabase: getAllCards called before database loaded');
      return [];
    }
    return [...this.cards];
  }

  /**
   * Get all variants for a specific card
   * @param cardId The unique card identifier
   * @returns Array of variants for the card, empty array if card not found
   */
  getVariants(cardId: string): Variant[] {
    const card = this.getCard(cardId);
    if (!card) {
      return [];
    }
    return [...card.variants];
  }

  /**
   * Parse card data from CSV format
   * Format: [set, subset, cardNum, player, team]
   * When subset is empty, use set value (merged case)
   */
  private parseCardData(rawData: [string, string, string, string, string][]): Card[] {
    return rawData.map(([set, subset, cardNum, player, team]) => {
      // If subset is empty, use set value (merged case)
      const finalSubset = subset || set;
      
      // Generate card ID
      const id = cardNum ? cardNum.padStart(3, '0') : `${set}-${player}`.replace(/\s+/g, '-');
      
      const variants: Variant[] = [];
      
      // Add parallel variants for base cards only
      if (finalSubset === 'Base') {
        variants.push(
          {
            id: `${id}-blue`,
            cardId: id,
            variantType: 'Blue Parallel',
            description: 'Blue Parallel Edition'
          },
          {
            id: `${id}-yellow`,
            cardId: id,
            variantType: 'Yellow Parallel',
            description: 'Yellow Parallel Edition'
          },
          {
            id: `${id}-green`,
            cardId: id,
            variantType: 'Green Parallel',
            description: 'Green Parallel Edition'
          }
        );
      }

      return {
        id,
        cardNumber: cardNum || '',
        playerName: player,
        team,
        position: finalSubset,
        variants
      };
    });
  }
}
