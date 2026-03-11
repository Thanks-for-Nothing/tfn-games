import React from 'react';
import type { Orientation } from '../game/types';
import { ShipSilhouette } from './ShipSilhouette';
import { COLORS, FONTS } from '../styles/theme';

interface ShipProps {
  shipId: string;
  name: string;
  size: number;
  orientation: Orientation;
  cellSize: number;
  onPointerDown: (e: React.PointerEvent) => void;
  onTap?: () => void;
  isDragging?: boolean;
}

export const Ship: React.FC<ShipProps> = ({
  shipId,
  name,
  size,
  orientation,
  cellSize,
  onPointerDown,
  isDragging,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        opacity: isDragging ? 0.3 : 1,
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      <ShipSilhouette
        shipId={shipId}
        size={size}
        orientation={orientation}
        cellSize={cellSize}
      />
      <span
        style={{
          fontFamily: FONTS.body,
          fontSize: '11px',
          color: COLORS.lightParchment,
          textAlign: 'center',
          opacity: 0.8,
        }}
      >
        {name}
      </span>
    </div>
  );
};
