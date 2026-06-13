/**
 * CardGrid component displays cards in a responsive grid layout
 * Validates Requirements: 2.1, 2.3
 */

import { Card, CollectionStatus } from '../models/types';
import { CardItem } from './CardItem';

interface CardGridProps {
  cards: Card[];
  isLoading: boolean;
  getStatus: (cardId: string) => CollectionStatus;
  getQuantity: (cardId: string) => number;
  onMarkCollected: (cardId: string, variantId?: string) => void;
  onIncrement: (cardId: string, variantId?: string) => void;
  onDecrement: (cardId: string, variantId?: string) => void;
  getVariantStatus: (cardId: string, variantId: string) => CollectionStatus;
  getVariantQuantity: (cardId: string, variantId: string) => number;
}

export function CardGrid({
  cards,
  isLoading,
  getStatus,
  getQuantity,
  onMarkCollected,
  onIncrement,
  onDecrement,
  getVariantStatus,
  getVariantQuantity
}: CardGridProps) {
  if (isLoading) {
    return <div className="loading">Loading cards...</div>;
  }

  if (cards.length === 0) {
    return <div className="empty-state">No cards found</div>;
  }

  return (
    <div className="card-grid">
      {cards.map(card => (
        <CardItem
          key={card.id}
          card={card}
          status={getStatus(card.id)}
          quantity={getQuantity(card.id)}
          onMarkCollected={onMarkCollected}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          getVariantStatus={getVariantStatus}
          getVariantQuantity={getVariantQuantity}
        />
      ))}
    </div>
  );
}
