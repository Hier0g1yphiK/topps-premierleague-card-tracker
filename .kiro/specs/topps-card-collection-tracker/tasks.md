# Implementation Plan: Topps Card Collection Tracker

## Overview

This implementation plan breaks down the Topps Card Collection Tracker into discrete coding tasks following a bottom-up approach: data layer → business logic → UI components → integration. The application uses React + TypeScript with localStorage persistence and fast-check for property-based testing.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Initialize React + TypeScript project with Vite
  - Install dependencies: fast-check, vitest, @testing-library/react
  - Create directory structure: src/components, src/services, src/models, src/utils
  - Configure TypeScript with strict mode
  - Set up Vitest configuration for testing
  - _Requirements: All (foundation for implementation)_

- [ ] 2. Implement data models and type definitions
  - [x] 2.1 Create core TypeScript interfaces
    - Define Card, Variant, CollectionData, CollectedCard interfaces
    - Define CollectionStatus enum
    - Define CollectionStatistics and FilterOptions interfaces
    - Create types.ts file in src/models
    - _Requirements: 1.1, 3.1, 4.1, 6.1-6.4_
  
  - [x] 2.2 Write property test for data model integrity
    - **Property 7: Persistence Round Trip**
    - **Validates: Requirements 5.2**
    - Test that CollectionData can be serialized and deserialized without data loss

- [ ] 3. Implement StorageService (Data Access Layer)
  - [x] 3.1 Create StorageService class
    - Implement saveCollection() method with localStorage
    - Implement loadCollection() method with error handling
    - Implement isAvailable() method to check localStorage availability
    - Handle QuotaExceededError and storage unavailable scenarios
    - Add data validation on load to detect corruption
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 3.2 Write unit tests for StorageService
    - Test save and load operations
    - Test storage unavailable scenario
    - Test quota exceeded error handling
    - Test data corruption recovery
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 4. Implement CardDatabase (Data Access Layer)
  - [x] 4.1 Create CardDatabase class
    - Implement loadCards() method with sample card data
    - Implement getCard() method to retrieve card by ID
    - Implement getAllCards() method
    - Implement getVariants() method to get variants for a card
    - Add error handling for database load failures
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 4.2 Create sample card dataset
    - Define at least 20 sample cards with player names, teams, positions
    - Include at least 5 cards with variants (Parallel, Gold, Silver)
    - Store as JSON or TypeScript constant
    - _Requirements: 8.2, 8.3_
  
  - [x] 4.3 Write unit tests for CardDatabase
    - Test loadCards() success and failure scenarios
    - Test getCard() with valid and invalid IDs
    - Test getVariants() returns correct variants
    - _Requirements: 8.1, 8.4_

- [x] 5. Checkpoint - Ensure data layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement CollectionManager (Business Logic Layer)
  - [x] 6.1 Create CollectionManager class with core operations
    - Implement markAsCollected() method
    - Implement removeCard() method
    - Implement incrementQuantity() method
    - Implement decrementQuantity() method with validation
    - Integrate with StorageService for persistence
    - Add operation validation to prevent invalid state changes
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.3, 3.4_
  
  - [x] 6.2 Write property test for marking uncollected cards
    - **Property 1: Marking Uncollected Cards Initializes Quantity and Persists**
    - **Validates: Requirements 1.1, 1.3**
  
  - [x] 6.3 Write property test for increment operation
    - **Property 4: Increment Increases Quantity by One**
    - **Validates: Requirements 3.1**
  
  - [x] 6.4 Write property test for decrement operation
    - **Property 5: Decrement Decreases Quantity by One**
    - **Validates: Requirements 3.3**
  
  - [x] 6.5 Implement query operations
    - Implement getCollectionStatus() method
    - Implement getQuantity() method
    - Implement getStatistics() method with calculations
    - _Requirements: 2.1, 2.2, 6.1, 6.2, 6.3, 6.4_
  
  - [x] 6.6 Write property test for unique cards count
    - **Property 8: Unique Cards Count Accuracy**
    - **Validates: Requirements 6.1**
  
  - [x] 6.7 Write property test for total cards count
    - **Property 9: Total Cards Count Matches Database**
    - **Validates: Requirements 6.2**
  
  - [x] 6.8 Write property test for completion percentage
    - **Property 10: Completion Percentage Calculation**
    - **Validates: Requirements 6.3**
  
  - [x] 6.9 Write property test for duplicate count
    - **Property 11: Duplicate Count Accuracy**
    - **Validates: Requirements 6.4**

- [ ] 7. Implement search and filter functionality
  - [x] 7.1 Add searchCards() method to CollectionManager
    - Implement case-insensitive search by card number
    - Implement case-insensitive search by player name
    - Return results within 300ms performance target
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 7.2 Write property test for search matching
    - **Property 12: Search Returns Only Matching Cards**
    - **Validates: Requirements 7.1, 7.2**
  
  - [x] 7.3 Add filterCards() method to CollectionManager
    - Implement filter by collection status (collected, uncollected, duplicates)
    - Implement filter for cards with variants
    - Support multiple simultaneous filters
    - _Requirements: 2.4, 3.5, 7.4, 7.5_
  
  - [x] 7.4 Write property test for filter correctness
    - **Property 3: Filter Returns Only Matching Cards**
    - **Validates: Requirements 2.4, 3.5, 7.4**
  
  - [x] 7.5 Write property test for multiple filters
    - **Property 13: Multiple Filters Conjunction**
    - **Validates: Requirements 7.5**

- [ ] 8. Implement variant handling
  - [x] 8.1 Add variant-specific operations to CollectionManager
    - Update markAsCollected() to accept optional variantId
    - Update incrementQuantity() and decrementQuantity() for variants
    - Update getCollectionStatus() and getQuantity() for variants
    - Ensure variants are tracked independently
    - _Requirements: 4.1, 4.3, 4.5_
  
  - [x] 8.2 Write property test for variant independence
    - **Property 6: Variant Independence**
    - **Validates: Requirements 4.1, 4.3, 4.5**
  
  - [x] 8.3 Write unit tests for variant operations
    - Test collecting different variants of same card
    - Test quantity tracking per variant
    - Test edge cases with variants
    - _Requirements: 4.1, 4.3, 4.5_

- [x] 9. Checkpoint - Ensure business logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement UI components (Presentation Layer)
  - [x] 10.1 Create CardItem component
    - Display card number, player name, team, position
    - Show collection status with visual indicator
    - Show quantity for collected cards
    - Add buttons for mark collected, increment, decrement
    - Display available variants with individual controls
    - _Requirements: 1.4, 2.2, 3.2, 4.2, 4.4_
  
  - [x] 10.2 Create CardGrid component
    - Display cards in responsive grid layout
    - Integrate CardItem components
    - Handle loading state
    - Handle empty state
    - _Requirements: 2.1, 2.3_
  
  - [x] 10.3 Create StatisticsPanel component
    - Display total cards count
    - Display unique cards collected count
    - Display completion percentage
    - Display total duplicates count
    - Update statistics when collection changes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 10.4 Create SearchBar component
    - Input field for search query
    - Real-time search with debouncing
    - Clear search button
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 10.5 Create FilterPanel component
    - Checkboxes for collection status filters
    - Checkbox for duplicates filter
    - Checkbox for uncollected filter
    - Support multiple simultaneous filters
    - _Requirements: 2.4, 3.5, 7.4, 7.5_

- [ ] 11. Create main App component and integrate layers
  - [x] 11.1 Implement App component with state management
    - Initialize CollectionManager, StorageService, CardDatabase
    - Load card database on mount with loading indicator
    - Load saved collection data on mount
    - Manage application state with React hooks
    - Handle database load errors with retry option
    - Handle storage errors with user notifications
    - _Requirements: 5.2, 5.3, 8.1, 8.4, 8.5_
  
  - [x] 11.2 Wire up component interactions
    - Connect CardItem actions to CollectionManager methods
    - Connect SearchBar to searchCards() method
    - Connect FilterPanel to filterCards() method
    - Ensure UI updates within 500ms of state changes
    - _Requirements: 1.2, 2.3, 6.5_
  
  - [x] 11.3 Write property test for display completeness
    - **Property 2: Display Completeness**
    - **Validates: Requirements 2.1, 4.2**
  
  - [x] 11.4 Write integration tests for key workflows
    - Test marking card as collected updates UI
    - Test search filters displayed cards
    - Test statistics update when collection changes
    - Test variant collection workflow
    - _Requirements: 1.1, 1.2, 2.3, 6.5, 7.3_

- [ ] 12. Add styling and polish
  - [x] 12.1 Create CSS modules for components
    - Style CardItem with collection status indicators
    - Style CardGrid with responsive layout
    - Style StatisticsPanel with clear visual hierarchy
    - Style SearchBar and FilterPanel
    - Add loading and error state styling
    - _Requirements: 1.4, 2.2_
  
  - [x] 12.2 Add accessibility features
    - Add ARIA labels to interactive elements
    - Ensure keyboard navigation works
    - Add focus indicators
    - Test with screen reader
    - _Requirements: All (accessibility compliance)_

- [x] 13. Final checkpoint and validation
  - Run all tests (unit and property tests)
  - Verify all 13 correctness properties pass
  - Test application manually for user workflows
  - Verify performance targets (500ms updates, 300ms search)
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows a bottom-up approach: data layer → business logic → UI
- All 13 correctness properties from the design document are covered by property tests
