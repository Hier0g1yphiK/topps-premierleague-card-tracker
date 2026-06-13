/**
 * StatisticsPanel component displays collection statistics
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { CollectionStatistics } from '../models/types';

interface StatisticsPanelProps {
  statistics: CollectionStatistics;
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  return (
    <div className="statistics-panel">
      <h2>Collection Statistics</h2>
      
      <div className="stat-grid">
        <div className="stat-item">
          <span className="stat-label">Unique Cards Collected</span>
          <span className="stat-value">{statistics.collectedUnique}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Cards in Set</span>
          <span className="stat-value">{statistics.totalCards}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Completion</span>
          <span className="stat-value">{statistics.completionPercentage.toFixed(1)}%</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Duplicates</span>
          <span className="stat-value">{statistics.totalDuplicates}</span>
        </div>
      </div>
    </div>
  );
}
