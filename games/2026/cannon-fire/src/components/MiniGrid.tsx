import React from 'react';
import type { Board } from '../game/types';
import { GRID_SIZE } from '../game/constants';
import { COLORS } from '../styles/theme';

interface MiniGridProps {
  board: Board;
  showShips: boolean;
  onTap: () => void;
  label: string;
}

export const MiniGrid: React.FC<MiniGridProps> = ({ board, showShips, onTap, label }) => {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        cursor: 'pointer',
        padding: '8px',
        backgroundColor: 'rgba(26, 58, 74, 0.5)',
        border: `1px solid ${COLORS.gold}`,
        borderRadius: '6px',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          fontSize: '10px',
          color: COLORS.lightGold,
          fontFamily: "'Georgia', serif",
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        {label}
      </span>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          gap: '1px',
          width: '100px',
          height: '100px',
          backgroundColor: COLORS.darkNavy,
          border: `1px solid ${COLORS.gold}`,
          borderRadius: '2px',
        }}
      >
        {board.map((row, ri) =>
          row.map((cell, ci) => {
            let bg: string = COLORS.ocean;
            if (cell.state === 'hit') bg = COLORS.hit;
            else if (cell.state === 'sunk') bg = COLORS.sunk;
            else if (cell.state === 'miss') bg = COLORS.miss;
            else if (showShips && cell.shipId) bg = COLORS.leather;

            return (
              <div
                key={`${ri}-${ci}`}
                style={{
                  backgroundColor: bg,
                  borderRadius: '1px',
                }}
              />
            );
          })
        )}
      </div>

      <span
        style={{
          fontSize: '9px',
          color: COLORS.lightParchment,
          opacity: 0.6,
          fontStyle: 'italic',
        }}
      >
        Tap to enlarge
      </span>
    </div>
  );
};
