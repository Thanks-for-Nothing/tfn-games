import React from 'react';
import type { ShipDefinition, Orientation } from '../game/types';
import { Ship } from './Ship';
import { COLORS, FONTS } from '../styles/theme';

interface HoldingAreaProps {
  unplacedShips: ShipDefinition[];
  cellSize: number;
  onShipPointerDown: (
    shipId: string,
    shipSize: number,
    orientation: Orientation,
    e: React.PointerEvent
  ) => void;
  draggedShipId: string | null;
}

export const HoldingArea: React.FC<HoldingAreaProps> = ({
  unplacedShips,
  cellSize,
  onShipPointerDown,
  draggedShipId,
}) => {
  if (unplacedShips.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        backgroundColor: 'rgba(26, 58, 74, 0.6)',
        border: `1px solid ${COLORS.gold}`,
        borderRadius: '8px',
        width: '100%',
      }}
    >
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: '13px',
          color: COLORS.lightGold,
          fontStyle: 'italic',
        }}
      >
        Drag ships to the grid
      </span>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '16px',
          width: '100%',
        }}
      >
        {unplacedShips.map(ship => (
          <Ship
            key={ship.id}
            shipId={ship.id}
            name={ship.name}
            size={ship.size}
            orientation="horizontal"
            cellSize={cellSize}
            onPointerDown={(e) => onShipPointerDown(ship.id, ship.size, 'horizontal', e)}
            isDragging={draggedShipId === ship.id}
          />
        ))}
      </div>
    </div>
  );
};
