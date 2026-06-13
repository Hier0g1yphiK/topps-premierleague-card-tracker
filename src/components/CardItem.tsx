/**
 * CardItem component displays a single card with collection controls
 * Validates Requirements: 1.4, 2.2, 3.2, 4.2, 4.4
 */

import { Card, CollectionStatus } from '../models/types';

interface CardItemProps {
  card: Card;
  status: CollectionStatus;
  quantity: number;
  onMarkCollected: (cardId: string, variantId?: string) => void;
  onIncrement: (cardId: string, variantId?: string) => void;
  onDecrement: (cardId: string, variantId?: string) => void;
  getVariantStatus: (cardId: string, variantId: string) => CollectionStatus;
  getVariantQuantity: (cardId: string, variantId: string) => number;
}

export function CardItem({
  card,
  status,
  quantity,
  onMarkCollected,
  onIncrement,
  onDecrement,
  getVariantStatus,
  getVariantQuantity
}: CardItemProps) {
  return (
    <div className="card-item">
      <div className="card-header">
        <span className="card-number">#{card.cardNumber}</span>
        <span className={`status-indicator status-${status}`}>
          {status === CollectionStatus.UNCOLLECTED && '○'}
          {status === CollectionStatus.COLLECTED && '●'}
          {status === CollectionStatus.DUPLICATE && '●●'}
        </span>
      </div>
      
      <div className="card-body">
        <h3 className="player-name">{card.playerName}</h3>
        <p className="team">{card.team}</p>
        <p className="position">{card.position}</p>
      </div>

      <div className="card-controls">
        {status === CollectionStatus.UNCOLLECTED ? (
          <button 
            onClick={() => onMarkCollected(card.id)}
            className="btn-collect"
            aria-label={`Mark ${card.playerName} as collected`}
          >
            Collect
          </button>
        ) : (
          <div className="quantity-controls">
            <button 
              onClick={() => onDecrement(card.id)}
              className="btn-decrement"
              aria-label={`Decrease quantity of ${card.playerName}`}
            >
              −
            </button>
            <span className="quantity" aria-label="Quantity">{quantity}</span>
            <button 
              onClick={() => onIncrement(card.id)}
              className="btn-increment"
              aria-label={`Increase quantity of ${card.playerName}`}
            >
              +
            </button>
          </div>
        )}
      </div>

      {card.variants.length > 0 && (
        <div className="variants">
          <h4>Variants:</h4>
          {card.variants.map(variant => {
            const variantStatus = getVariantStatus(card.id, variant.id);
            const variantQuantity = getVariantQuantity(card.id, variant.id);
            
            return (
              <div key={variant.id} className="variant-item">
                <span className="variant-type">{variant.variantType}</span>
                <span className={`status-indicator status-${variantStatus}`}>
                  {variantStatus === CollectionStatus.UNCOLLECTED && '○'}
                  {variantStatus === CollectionStatus.COLLECTED && '●'}
                  {variantStatus === CollectionStatus.DUPLICATE && '●●'}
                </span>
                
                {variantStatus === CollectionStatus.UNCOLLECTED ? (
                  <button 
                    onClick={() => onMarkCollected(card.id, variant.id)}
                    className="btn-collect-variant"
                    aria-label={`Collect ${variant.variantType} variant`}
                  >
                    Collect
                  </button>
                ) : (
                  <div className="quantity-controls">
                    <button 
                      onClick={() => onDecrement(card.id, variant.id)}
                      className="btn-decrement"
                      aria-label={`Decrease ${variant.variantType} quantity`}
                    >
                      −
                    </button>
                    <span className="quantity">{variantQuantity}</span>
                    <button 
                      onClick={() => onIncrement(card.id, variant.id)}
                      className="btn-increment"
                      aria-label={`Increase ${variant.variantType} quantity`}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
