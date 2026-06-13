# Design Document: Topps Card Collection Tracker

## Overview

The Topps Card Collection Tracker is a web-based application that enables collectors to manage their Topps Premier League 2026 card collection. The system provides functionality to track owned cards, identify missing cards, manage duplicates, and handle card variations.

### Key Design Goals

- **Simplicity**: Minimal, focused interface for quick card tracking
- **Performance**: Fast updates and responsive UI (sub-500ms for most operations)
- **Data Integrity**: Reliable persistence with no data loss
- **Extensibility**: Support for card variations and future card sets

### Technology Stack

- **Frontend**: React with TypeScript for type safety
- **State Management**: React hooks (useState, useEffect) for local state
- **Storage**: Browser localStorage for persistence
- **Styling**: CSS modules for component-scoped styling

## Architecture

The application follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components + UI Logic)          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Business Logic Layer            │
│  (Collection Manager + Operations)      │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (Storage Service + Card Database)      │
└─────────────────────────────────────────┘
```

### Layer Responsibilities

**Presentation Layer**:
- Renders UI components
- Handles user interactions
- Displays collection state
- Manages search/filter UI state

**Business Logic Layer**:
- Manages collection operations (add, remove, update)
- Calculates statistics
- Applies search and filter logic
- Validates operations

**Data Access Layer**:
- Persists collection data to localStorage
- Loads collection data on startup
- Provides card database access
- Handles storage errors

## Components and Interfaces

### Core Components

#### 1. CollectionManager

The central business logic component that manages all collection operations.

```typescript
interface CollectionManager {
  // Collection operations
  markAsCollected(cardId: string, variantId?: string): void;
  removeCard(cardId: string, variantId?: string): void;
  incrementQuantity(cardId: string, variantId?: string): void;
  decrementQuantity(cardId: string, variantId?: string): void;
  
  // Query operations
  getCollectionStatus(cardId: string, variantId?: string): CollectionStatus;
  getQuantity(cardId: string, variantId?: string): number;
  getStatistics(): CollectionStatistics;
  
  // Filter and search
  searchCards(query: string): Card[];
  filterCards(filters: FilterOptions): Card[];
}
```

#### 2. StorageService

Handles persistence operations with localStorage.

```typescript
interface StorageService {
  saveCollection(collection: CollectionData): Promise<void>;
  loadCollection(): Promise<CollectionData | null>;
  isAvailable(): boolean;
}
```

#### 3. CardDatabase

Provides access to the complete card set data.

```typescript
interface CardDatabase {
  loadCards(): Promise<Card[]>;
  getCard(cardId: string): Card | null;
  getAllCards(): Card[];
  getVariants(cardId: string): Variant[];
}
```

#### 4. UI Components

**CardGrid**: Displays cards in a grid layout with collection status
**CardItem**: Individual card display with collection controls
**SearchBar**: Search input with real-time filtering
**FilterPanel**: Collection status filters
**StatisticsPanel**: Displays collection statistics

## Data Models

### Card

Represents a single card in the Topps Premier League 2026 set.

```typescript
interface Card {
  id: string;              // Unique card identifier (e.g., "001", "002")
  cardNumber: string;      // Display card number
  playerName: string;      // Player name on the card
  team: string;            // Team name
  position: string;        // Player position
  variants: Variant[];     // Available variants for this card
}
```

### Variant

Represents a variation of a base card.

```typescript
interface Variant {
  id: string;              // Unique variant identifier
  cardId: string;          // Parent card ID
  variantType: string;     // Type of variant (e.g., "Parallel", "Gold", "Silver")
  description: string;     // Human-readable description
}
```

### CollectionData

Represents the user's collection state.

```typescript
interface CollectionData {
  collectedCards: Map<string, CollectedCard>;  // Key: cardId or cardId-variantId
  lastUpdated: number;                          // Timestamp of last update
}

interface CollectedCard {
  cardId: string;
  variantId?: string;
  quantity: number;
  dateCollected: number;  // Timestamp when first collected
}
```

### CollectionStatus

Enumeration of collection states.

```typescript
enum CollectionStatus {
  UNCOLLECTED = "uncollected",
  COLLECTED = "collected",
  DUPLICATE = "duplicate"
}
```

### CollectionStatistics

Statistics about the collection.

```typescript
interface CollectionStatistics {
  totalCards: number;           // Total cards in the set
  collectedUnique: number;      // Unique cards collected
  completionPercentage: number; // Percentage of set completed
  totalDuplicates: number;      // Total duplicate cards (sum of quantities > 1)
}
```

### FilterOptions

Options for filtering cards.

```typescript
interface FilterOptions {
  status?: CollectionStatus[];  // Filter by collection status
  hasVariants?: boolean;        // Filter cards with variants
  hasDuplicates?: boolean;      // Filter cards with quantity > 1
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Marking Uncollected Cards Initializes Quantity and Persists

*For any* uncollected card, when marked as collected, the card should have a quantity of exactly 1 and the collection data in storage should reflect this change.

**Validates: Requirements 1.1, 1.3**

### Property 2: Display Completeness

*For any* card database, the collection manager should display all cards from the database with all their available variants.

**Validates: Requirements 2.1, 4.2**

### Property 3: Filter Returns Only Matching Cards

*For any* filter criteria (collection status, duplicates, uncollected), all returned cards should satisfy the filter condition and no cards that satisfy the condition should be excluded.

**Validates: Requirements 2.4, 3.5, 7.4**

### Property 4: Increment Increases Quantity by One

*For any* already-collected card, marking it as collected again should increase its quantity by exactly 1.

**Validates: Requirements 3.1**

### Property 5: Decrement Decreases Quantity by One

*For any* collected card with quantity greater than 1, removing one copy should decrease its quantity by exactly 1.

**Validates: Requirements 3.3**

### Property 6: Variant Independence

*For any* card with multiple variants, collecting or modifying the quantity of one variant should not affect the collection status or quantity of any other variant of the same card.

**Validates: Requirements 4.1, 4.3, 4.5**

### Property 7: Persistence Round Trip

*For any* collection data, saving to storage and then loading should produce collection data equivalent to the original.

**Validates: Requirements 5.2**

### Property 8: Unique Cards Count Accuracy

*For any* collection state, the statistics should report a unique cards count equal to the number of distinct cards (including variants) with quantity greater than 0.

**Validates: Requirements 6.1**

### Property 9: Total Cards Count Matches Database

*For any* card database, the statistics should report a total cards count equal to the number of cards in the database.

**Validates: Requirements 6.2**

### Property 10: Completion Percentage Calculation

*For any* collection state, the completion percentage should equal (unique cards collected / total cards in database) × 100.

**Validates: Requirements 6.3**

### Property 11: Duplicate Count Accuracy

*For any* collection state, the total duplicates count should equal the sum of (quantity - 1) for all collected cards with quantity greater than 1.

**Validates: Requirements 6.4**

### Property 12: Search Returns Only Matching Cards

*For any* search query, all returned cards should contain the search term in either their card number or player name (case-insensitive).

**Validates: Requirements 7.1, 7.2**

### Property 13: Multiple Filters Conjunction

*For any* combination of multiple filters applied simultaneously, all returned cards should satisfy every filter condition.

**Validates: Requirements 7.5**

## Error Handling

### Storage Errors

**Scenario**: localStorage is unavailable or quota exceeded

**Handling**:
- Detect storage availability on initialization
- Display clear error message to user
- Allow read-only mode (view collection without persistence)
- Provide option to export collection data as JSON

**Implementation**:
```typescript
try {
  await storageService.saveCollection(collectionData);
} catch (error) {
  if (error instanceof QuotaExceededError) {
    showError("Storage quota exceeded. Please clear browser data.");
  } else {
    showError("Unable to save collection. Changes may be lost.");
  }
}
```

### Database Loading Errors

**Scenario**: Card database fails to load

**Handling**:
- Display error message with retry option
- Log error details for debugging
- Prevent collection operations until database loads
- Provide fallback to cached database if available

**Implementation**:
```typescript
try {
  const cards = await cardDatabase.loadCards();
} catch (error) {
  showError("Failed to load card database. Please check your connection and retry.");
  logError(error);
  showRetryButton();
}
```

### Invalid Operations

**Scenario**: User attempts invalid operation (e.g., decrement quantity of uncollected card)

**Handling**:
- Validate operations before execution
- Silently ignore invalid operations (fail-safe)
- Log warnings for debugging
- Maintain consistent state

**Implementation**:
```typescript
function decrementQuantity(cardId: string, variantId?: string): void {
  const current = getQuantity(cardId, variantId);
  if (current === 0) {
    console.warn(`Cannot decrement uncollected card: ${cardId}`);
    return; // Fail-safe: do nothing
  }
  // Proceed with decrement
}
```

### Data Corruption

**Scenario**: Loaded collection data is malformed or corrupted

**Handling**:
- Validate data structure on load
- Attempt to recover valid portions
- Reset to empty collection if unrecoverable
- Notify user of data loss

**Implementation**:
```typescript
function loadCollection(): CollectionData {
  const raw = localStorage.getItem('collection');
  try {
    const data = JSON.parse(raw);
    if (!isValidCollectionData(data)) {
      throw new Error('Invalid collection data structure');
    }
    return data;
  } catch (error) {
    console.error('Collection data corrupted, resetting to empty');
    showWarning('Collection data was corrupted and has been reset');
    return createEmptyCollection();
  }
}
```

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

These approaches are complementary. Unit tests catch concrete bugs and validate specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property using a comment tag
- Tag format: `// Feature: topps-card-collection-tracker, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: topps-card-collection-tracker, Property 4: Increment Increases Quantity by One
test('marking collected card again increments quantity by 1', () => {
  fc.assert(
    fc.property(
      fc.record({
        cardId: fc.string(),
        initialQuantity: fc.integer({ min: 1, max: 100 })
      }),
      ({ cardId, initialQuantity }) => {
        const manager = new CollectionManager();
        // Setup: card already collected with initialQuantity
        manager.setQuantity(cardId, initialQuantity);
        
        // Action: mark as collected again
        manager.markAsCollected(cardId);
        
        // Assertion: quantity increased by exactly 1
        expect(manager.getQuantity(cardId)).toBe(initialQuantity + 1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas**:
- Edge cases (e.g., quantity reaching 0, empty search queries)
- Error conditions (storage unavailable, database load failure)
- Specific examples demonstrating correct behavior
- Integration between components

**Example Unit Test**:
```typescript
test('quantity reaching 0 marks card as uncollected', () => {
  const manager = new CollectionManager();
  manager.markAsCollected('card-001');
  expect(manager.getCollectionStatus('card-001')).toBe(CollectionStatus.COLLECTED);
  
  manager.decrementQuantity('card-001');
  expect(manager.getCollectionStatus('card-001')).toBe(CollectionStatus.UNCOLLECTED);
  expect(manager.getQuantity('card-001')).toBe(0);
});

test('storage unavailable shows error message', () => {
  const storageService = new StorageService();
  jest.spyOn(storageService, 'isAvailable').mockReturnValue(false);
  
  const manager = new CollectionManager(storageService);
  const errorSpy = jest.spyOn(console, 'error');
  
  manager.markAsCollected('card-001');
  
  expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('storage unavailable'));
});
```

### Test Coverage Goals

- **Unit test coverage**: Minimum 80% code coverage
- **Property test coverage**: All 13 correctness properties implemented
- **Integration tests**: Key user workflows (mark collected, search, filter)
- **Error handling**: All error scenarios tested

### Testing Tools

- **Test Runner**: Jest or Vitest
- **Property Testing**: fast-check
- **React Testing**: React Testing Library
- **Mocking**: Jest mocks for storage and database

