/**
 * FilterPanel component for filtering cards
 * Validates Requirements: 2.4, 3.5, 7.4, 7.5
 */

import { CollectionStatus } from '../models/types';

interface FilterPanelProps {
  selectedStatuses: CollectionStatus[];
  onStatusChange: (statuses: CollectionStatus[]) => void;
  availableSubsets: string[];
  selectedSubsets: string[];
  onSubsetChange: (subsets: string[]) => void;
}

export function FilterPanel({ 
  selectedStatuses, 
  onStatusChange,
  availableSubsets,
  selectedSubsets,
  onSubsetChange
}: FilterPanelProps) {
  const handleStatusToggle = (status: CollectionStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSubsetToggle = (subset: string) => {
    if (selectedSubsets.includes(subset)) {
      onSubsetChange(selectedSubsets.filter(s => s !== subset));
    } else {
      onSubsetChange([...selectedSubsets, subset]);
    }
  };

  return (
    <div className="filter-panel">
      <h3>Filters</h3>
      
      <div className="filter-group">
        <label className="filter-label">Collection Status:</label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={selectedStatuses.includes(CollectionStatus.COLLECTED)}
            onChange={() => handleStatusToggle(CollectionStatus.COLLECTED)}
            aria-label="Show collected cards"
          />
          <span>Collected</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={selectedStatuses.includes(CollectionStatus.UNCOLLECTED)}
            onChange={() => handleStatusToggle(CollectionStatus.UNCOLLECTED)}
            aria-label="Show uncollected cards"
          />
          <span>Uncollected</span>
        </label>
        
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={selectedStatuses.includes(CollectionStatus.DUPLICATE)}
            onChange={() => handleStatusToggle(CollectionStatus.DUPLICATE)}
            aria-label="Show duplicate cards"
          />
          <span>Duplicates</span>
        </label>
      </div>

      <div className="filter-group">
        <label className="filter-label">Insert/Subset:</label>
        
        {availableSubsets.map(subset => (
          <label key={subset} className="checkbox-label">
            <input
              type="checkbox"
              checked={selectedSubsets.includes(subset)}
              onChange={() => handleSubsetToggle(subset)}
              aria-label={`Show ${subset} cards`}
            />
            <span>{subset}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
