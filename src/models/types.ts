/**
 * Core type definitions for the Topps Card Collection Tracker
 * 
 * Validates Requirements: 1.1, 3.1, 4.1, 6.1-6.4
 */

/**
 * Represents a single card in the Topps Premier League 2026 set
 */
export interface Card {
  id: string;              // Unique card identifier (e.g., "001", "002")
  cardNumber: string;      // Display card number
  playerName: string;      // Player name on the card
  team: string;            // Team name
  position: string;        // Player position
  variants: Variant[];     // Available variants for this card
}

/**
 * Represents a variation of a base card
 */
export interface Variant {
  id: string;              // Unique variant identifier
  cardId: string;          // Parent card ID
  variantType: string;     // Type of variant (e.g., "Parallel", "Gold", "Silver")
  description: string;     // Human-readable description
}

/**
 * Represents the user's collection state
 */
export interface CollectionData {
  collectedCards: Map<string, CollectedCard>;  // Key: cardId or cardId-variantId
  lastUpdated: number;                          // Timestamp of last update
}

/**
 * Represents a collected card in the user's collection
 */
export interface CollectedCard {
  cardId: string;
  variantId?: string;
  quantity: number;
  dateCollected: number;  // Timestamp when first collected
}

/**
 * Enumeration of collection states
 */
export enum CollectionStatus {
  UNCOLLECTED = "uncollected",
  COLLECTED = "collected",
  DUPLICATE = "duplicate"
}

/**
 * Statistics about the collection
 */
export interface CollectionStatistics {
  totalCards: number;           // Total cards in the set
  collectedUnique: number;      // Unique cards collected
  completionPercentage: number; // Percentage of set completed
  totalDuplicates: number;      // Total duplicate cards (sum of quantities > 1)
}

/**
 * Options for filtering cards
 */
export interface FilterOptions {
  status?: CollectionStatus[];  // Filter by collection status
  hasVariants?: boolean;        // Filter cards with variants
  hasDuplicates?: boolean;      // Filter cards with quantity > 1
  subsets?: string[];           // Filter by card subset/insert type
}
