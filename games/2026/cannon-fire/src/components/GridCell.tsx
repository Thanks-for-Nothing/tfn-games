import React from 'react';
import type { CellState } from '../game/types';
import { COLORS } from '../styles/theme';

interface GridCellProps {
  cellState: CellState;
  hasShip: boolean;
  showShip: boolean;
  onTap?: () => void;
  disabled?: boolean;
  isPending?: boolean;
}

export const GridCell: React.FC<GridCellProps> = ({
  cellState,
  hasShip,
  showShip,
  onTap,
  disabled,
  isPending,
}) => {
  const baseStyle: React.CSSProperties = {
    position: 'relative',
    aspectRatio: '1',
    backgroundColor: isPending ? 'rgba(200, 168, 78, 0.25)' : COLORS.ocean,
    border: isPending
      ? `2px solid ${COLORS.gold}`
      : `1px solid rgba(100, 180, 210, 0.4)`,
    cursor: disabled ? 'default' : 'pointer',
    overflow: 'hidden',
    transition: 'background-color 0.15s ease',
  };

  // Show ship segment on defense view
  const shipStyle: React.CSSProperties | null =
    showShip && hasShip && cellState !== 'sunk'
      ? {
          position: 'absolute',
          inset: '15%',
          backgroundColor: COLORS.leather,
          borderRadius: '3px',
          border: `1px solid ${COLORS.darkGold}`,
          opacity: 0.8,
        }
      : null;

  const renderMarker = () => {
    if (cellState === 'miss') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            backgroundColor: COLORS.miss,
            border: '2px solid rgba(255, 255, 255, 0.25)',
            opacity: 0.7,
            animation: 'cannonfire-ripple 0.4s ease-out forwards',
          }}
        />
      );
    }

    if (cellState === 'hit') {
      return (
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.hitGlow} 0%, ${COLORS.hit} 50%, transparent 70%)`,
            animation: 'cannonfire-flame 1.5s ease-in-out infinite',
          }}
        />
      );
    }

    if (cellState === 'sunk') {
      return (
        <>
          {showShip && hasShip && (
            <div
              style={{
                position: 'absolute',
                inset: '10%',
                backgroundColor: COLORS.sunk,
                borderRadius: '3px',
                border: `1px solid ${COLORS.hit}`,
                opacity: 0.9,
                animation: 'cannonfire-sunkReveal 0.5s ease-out forwards',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '15%',
              width: '70%',
              height: '70%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.white,
              fontSize: '2.4em',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              zIndex: 1,
            }}
          >
            X
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      style={baseStyle}
      onPointerUp={!disabled && onTap ? onTap : undefined}
    >
      {shipStyle && <div style={shipStyle} />}
      {renderMarker()}
      {isPending && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'cannonfire-pulse 1s ease-in-out infinite',
          }}
        >
          <div
            style={{
              width: '40%',
              height: '40%',
              borderRadius: '50%',
              backgroundColor: COLORS.gold,
              opacity: 0.7,
            }}
          />
        </div>
      )}
    </div>
  );
};
