import React from 'react';
import type { Board } from '../game/types';
import { COLUMNS, ROWS } from '../game/constants';
import { GridCell } from './GridCell';
import { COLORS, FONTS } from '../styles/theme';

interface GridProps {
  board: Board;
  showShips: boolean;
  onCellTap?: (row: number, col: number) => void;
  disabled?: boolean;
  gridRef?: React.Ref<HTMLDivElement>;
}

export const Grid: React.FC<GridProps> = ({
  board,
  showShips,
  onCellTap,
  disabled,
  gridRef,
}) => {
  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.gold,
    fontFamily: FONTS.label,
    fontSize: '24px',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
    userSelect: 'none',
  };

  return (
    <div
      ref={gridRef}
      style={{
        display: 'grid',
        gridTemplateColumns: `24px repeat(7, 1fr)`,
        gridTemplateRows: `24px repeat(7, 1fr)`,
        gap: '1px',
        backgroundColor: COLORS.darkNavy,
        border: `2px solid ${COLORS.gold}`,
        borderRadius: '4px',
        padding: '1px',
        width: '100%',
        aspectRatio: '1',
        maxWidth: '100%',
      }}
    >
      {/* Top-left corner (empty) */}
      <div />

      {/* Column headers (A-G) */}
      {COLUMNS.map(col => (
        <div key={`col-${col}`} style={labelStyle}>
          {col}
        </div>
      ))}

      {/* Rows */}
      {ROWS.map((rowLabel, rowIdx) => (
        <React.Fragment key={`row-${rowLabel}`}>
          {/* Row label */}
          <div style={labelStyle}>{rowLabel}</div>

          {/* Cells */}
          {board[rowIdx].map((cell, colIdx) => (
            <GridCell
              key={`${rowIdx}-${colIdx}`}
              cellState={cell.state}
              hasShip={cell.shipId !== null}
              showShip={showShips}
              onTap={onCellTap ? () => onCellTap(rowIdx, colIdx) : undefined}
              disabled={disabled}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
};
