/**
 * CollectionManager handles all collection operations and integrates
 * with the data access layer for persistence.
 * 
 * Validates Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 3.4, 6.1, 6.2, 6.3, 6.4
 */

import { CollectionData, CollectedCard, CollectionStatus, CollectionStatistics, Card, FilterOptions } from '../models/types';
import { StorageService } from './StorageService';
import { CardDatabase } from './CardDatabase';

export class CollectionManager {
  private collection: CollectionData;
  private storageService: StorageService;
  private cardDatabase: CardDatabase;

  constructor(storageService: StorageService, cardDatabase: CardDatabase) {
    this.storageService = storageService;
    this.cardDatabase = cardDatabase;
    this.collection = {
      collectedCards: new Map<string, CollectedCard>(),
      lastUpdated: Date.now()
    };
  }

  /**
   * Initialize the collection manager by loading saved data
   */
  async initialize(): Promise<void> {
    const savedCollection = await this.storageService.loadCollection();
    if (savedCollection) {
      this.collection = savedCollection;
    }
  }

  /**
   * Mark a card as collected. If already collected, increments quantity.
   * Validates Requirements: 1.1, 1.2, 1.3, 3.1
   */
  async markAsCollected(cardId: string, variantId?: string): Promise<void> {
    const key = this.getCollectionKey(cardId, variantId);
    const existing = this.collection.collectedCards.get(key);

    if (existing) {
      // Card already collected, increment quantity
      existing.quantity += 1;
    } else {
      // New card, initialize with quantity 1
      const collectedCard: CollectedCard = {
        cardId,
        variantId,
        quantity: 1,
        dateCollected: Date.now()
      };
      this.collection.collectedCards.set(key, collectedCard);
    }

    this.collection.lastUpdated = Date.now();
    await this.persistCollection();
  }

  /**
   * Remove a card from the collection entirely
   * Validates Requirements: 3.3, 3.4
   */
  async removeCard(cardId: string, variantId?: string): Promise<void> {
    const key = this.getCollectionKey(cardId, variantId);
    const existing = this.collection.collectedCards.get(key);

    if (!existing) {
      // Card not collected, nothing to remove
      console.warn(`Cannot remove uncollected card: ${cardId}${variantId ? `-${variantId}` : ''}`);
      return;
    }

    this.collection.collectedCards.delete(key);
    this.collection.lastUpdated = Date.now();
    await this.persistCollection();
  }

  /**
   * Increment the quantity of a collected card
   * Validates Requirement: 3.1
   */
  async incrementQuantity(cardId: string, variantId?: string): Promise<void> {
    const key = this.getCollectionKey(cardId, variantId);
    const existing = this.collection.collectedCards.get(key);

    if (!existing) {
      // Card not collected, cannot increment
      console.warn(`Cannot increment uncollected card: ${cardId}${variantId ? `-${variantId}` : ''}`);
      return;
    }

    existing.quantity += 1;
    this.collection.lastUpdated = Date.now();
    await this.persistCollection();
  }

  /**
   * Decrement the quantity of a collected card with validation
   * Validates Requirements: 3.3, 3.4
   */
  async decrementQuantity(cardId: string, variantId?: string): Promise<void> {
    const key = this.getCollectionKey(cardId, variantId);
    const existing = this.collection.collectedCards.get(key);

    if (!existing) {
      // Card not collected, cannot decrement
      console.warn(`Cannot decrement uncollected card: ${cardId}${variantId ? `-${variantId}` : ''}`);
      return;
    }

    if (existing.quantity <= 1) {
      // Quantity would reach 0, remove card from collection
      this.collection.collectedCards.delete(key);
    } else {
      // Decrement quantity
      existing.quantity -= 1;
    }

    this.collection.lastUpdated = Date.now();
    await this.persistCollection();
  }

  /**
   * Get the collection status for a card
   */
  getCollectionStatus(cardId: string, variantId?: string): CollectionStatus {
    const key = this.getCollectionKey(cardId, variantId);
    const collected = this.collection.collectedCards.get(key);

    if (!collected) {
      return CollectionStatus.UNCOLLECTED;
    }

    return collected.quantity > 1 
      ? CollectionStatus.DUPLICATE 
      : CollectionStatus.COLLECTED;
  }

  /**
   * Get the quantity of a collected card
   */
  getQuantity(cardId: string, variantId?: string): number {
    const key = this.getCollectionKey(cardId, variantId);
    const collected = this.collection.collectedCards.get(key);
    return collected ? collected.quantity : 0;
  }

  /**
   * Search cards by card number or player name (case-insensitive)
   * Validates Requirements: 7.1, 7.2, 7.3
   */
  searchCards(query: string): Card[] {
    if (!query || query.trim() === '') {
      return this.cardDatabase.getAllCards();
    }

    const normalizedQuery = query.toLowerCase().trim();
    const allCards = this.cardDatabase.getAllCards();

    return allCards.filter(card => {
      const cardNumberMatch = card.cardNumber.toLowerCase().includes(normalizedQuery);
      const playerNameMatch = card.playerName.toLowerCase().includes(normalizedQuery);
      return cardNumberMatch || playerNameMatch;
    });
  }

  /**
   * Filter cards by collection status, duplicates, and variants
   * Validates Requirements: 2.4, 3.5, 7.4, 7.5
   */
  filterCards(filters: FilterOptions): Card[] {
    const allCards = this.cardDatabase.getAllCards();

    return allCards.filter(card => {
      // Filter by collection status
      if (filters.status && filters.status.length > 0) {
        const baseStatus = this.getCollectionStatus(card.id);
        const hasVariants = card.variants.length > 0;
        
        // Check if base card or any variant matches the status filter
        let matchesStatus = filters.status.includes(baseStatus);
        
        // Also check variants if card has them
        if (hasVariants) {
          for (const variant of card.variants) {
            const variantStatus = this.getCollectionStatus(card.id, variant.id);
            if (filters.status.includes(variantStatus)) {
              matchesStatus = true;
              break;
            }
          }
        }
        
        if (!matchesStatus) {
          return false;
        }
      }

      // Filter by duplicates (cards with quantity > 1)
      if (filters.hasDuplicates !== undefined) {
        const baseQuantity = this.getQuantity(card.id);
        let hasDuplicates = baseQuantity > 1;
        
        // Check variants for duplicates
        for (const variant of card.variants) {
          const variantQuantity = this.getQuantity(card.id, variant.id);
          if (variantQuantity > 1) {
            hasDuplicates = true;
            break;
          }
        }
        
        if (filters.hasDuplicates !== hasDuplicates) {
          return false;
        }
      }

      // Filter by cards with variants
      if (filters.hasVariants !== undefined) {
        const hasVariants = card.variants.length > 0;
        if (filters.hasVariants !== hasVariants) {
          return false;
        }
      }

      // Filter by subsets (stored in position field)
      if (filters.subsets && filters.subsets.length > 0) {
        if (!filters.subsets.includes(card.position)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get all unique subsets from the card database
   */
  getUniqueSubsets(): string[] {
    const allCards = this.cardDatabase.getAllCards();
    const subsets = new Set<string>();
    
    for (const card of allCards) {
      if (card.position) {
        subsets.add(card.position);
      }
    }
    
    return Array.from(subsets).sort();
  }

  /**
   * Get collection statistics
   * Validates Requirements: 6.1, 6.2, 6.3, 6.4
   */
  getStatistics(): CollectionStatistics {
    // Get total cards from database (base cards + variants)
    const allCards = this.cardDatabase.getAllCards();
    let totalCards = allCards.length;
    
    // Add variants to total count
    for (const card of allCards) {
      totalCards += card.variants.length;
    }

    // Count unique collected cards (cards with quantity > 0)
    let collectedUnique = 0;
    let totalDuplicates = 0;

    for (const collectedCard of this.collection.collectedCards.values()) {
      if (collectedCard.quantity > 0) {
        collectedUnique++;
        
        // Count duplicates (quantity - 1 for cards with quantity > 1)
        if (collectedCard.quantity > 1) {
          totalDuplicates += (collectedCard.quantity - 1);
        }
      }
    }

    // Calculate completion percentage
    const completionPercentage = totalCards > 0 
      ? (collectedUnique / totalCards) * 100 
      : 0;

    return {
      totalCards,
      collectedUnique,
      completionPercentage,
      totalDuplicates
    };
  }

  /**
   * Get the collection data
   */
  getCollection(): CollectionData {
    return this.collection;
  }

  /**
   * Generate a unique key for a card/variant combination
   */
  private getCollectionKey(cardId: string, variantId?: string): string {
    return variantId ? `${cardId}-${variantId}` : cardId;
  }

  /**
   * Persist collection data to storage
   */
  private async persistCollection(): Promise<void> {
    try {
      await this.storageService.saveCollection(this.collection);
    } catch (error) {
      console.error('Failed to persist collection:', error);
      // Don't throw - allow operation to complete even if persistence fails
    }
  }
}
