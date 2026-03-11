import React, { useRef, useCallback, useMemo } from 'react';
import type { GameState, GameAction } from '../game/types';
import { GRID_SIZE } from '../game/constants';
import { getCellsForShip } from '../game/boardUtils';
import { Grid } from './Grid';
import { HoldingArea } from './HoldingArea';
import { ShipSilhouette } from './ShipSilhouette';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { COLORS, FONTS } from '../styles/theme';

interface PlacementScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const PlacementScreen: React.FC<PlacementScreenProps> = ({ state, dispatch }) => {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const { dragState, handlePointerDown, handlePointerMove, handlePointerUp } =
    useDragAndDrop(gridRef, state.playerBoard, state.playerShips, dispatch);

  const allPlaced = state.unplacedShips.length === 0;

  // Calculate cell size based on viewport
  const cellSize = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
    const maxGridWidth = Math.min(vw - 48, 400);
    return Math.floor((maxGridWidth - 26) / GRID_SIZE); // 26px for labels + gaps
  }, []);

  const handleGridCellTap = useCallback(
    (row: number, col: number) => {
      // If tapping on a placed ship, rotate it
      const cell = state.playerBoard[row][col];
      if (cell.shipId && !dragState.isDragging) {
        dispatch({ type: 'ROTATE_SHIP', shipId: cell.shipId });
      }
    },
    [state.playerBoard, dispatch, dragState.isDragging]
  );

  const handleBattle = useCallback(() => {
    if (allPlaced) {
      dispatch({ type: 'START_BATTLE' });
    }
  }, [allPlaced, dispatch]);

  // Compute highlight cells for drag preview
  const highlightCells = useMemo(() => {
    if (!dragState.isDragging || !dragState.snappedCell) return [];
    const cells = getCellsForShip(
      dragState.snappedCell.row,
      dragState.snappedCell.col,
      dragState.draggedShipSize,
      dragState.draggedShipOrientation
    );
    return cells.filter(c => c.row >= 0 && c.row < GRID_SIZE && c.col >= 0 && c.col < GRID_SIZE);
  }, [dragState]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '16px',
        background: `linear-gradient(180deg, ${COLORS.darkNavy} 0%, ${COLORS.oceanDark} 100%)`,
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overscrollBehavior: 'none',
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Header */}
      <h2
        style={{
          fontFamily: FONTS.heading,
          fontSize: 'clamp(40px, 10vw, 56px)',
          color: COLORS.parchment,
          textShadow: '1px 1px 3px rgba(0,0,0,0.5)',
          marginBottom: '4px',
          textAlign: 'center',
        }}
      >
        Place Yer Fleet
      </h2>

      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: '24px',
          color: COLORS.lightGold,
          marginBottom: '12px',
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        Tap a placed ship to rotate
      </p>

      {/* Grid with placement highlights */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: `${cellSize * GRID_SIZE + 26}px`,
          marginBottom: '16px',
        }}
      >
        <Grid
          board={state.playerBoard}
          showShips={true}
          onCellTap={handleGridCellTap}
          gridRef={gridRef}
        />

        {/* Highlight overlay for drag preview */}
        {dragState.isDragging && dragState.snappedCell && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {highlightCells.map((cell, idx) => {
              const gridEl = gridRef.current;
              if (!gridEl) return null;

              const gridRect = gridEl.getBoundingClientRect();
              const labelSize = 24;
              const cw = (gridRect.width - labelSize - 2) / GRID_SIZE;
              const ch = (gridRect.height - labelSize - 2) / GRID_SIZE;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${labelSize + 1 + cell.col * cw}px`,
                    top: `${labelSize + 1 + cell.row * ch}px`,
                    width: `${cw}px`,
                    height: `${ch}px`,
                    backgroundColor: dragState.isValidDrop
                      ? 'rgba(42, 139, 94, 0.4)'
                      : 'rgba(204, 51, 51, 0.4)',
                    border: `2px solid ${dragState.isValidDrop ? COLORS.valid : COLORS.invalid}`,
                    borderRadius: '2px',
                    boxSizing: 'border-box',
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Ship silhouettes on placed ships */}
        {state.playerShips.map(ship => {
          const gridEl = gridRef.current;
          if (!gridEl) return null;

          const gridRect = gridEl.getBoundingClientRect();
          const labelSize = 24;
          const cw = (gridRect.width - labelSize - 2) / GRID_SIZE;
          const ch = (gridRect.height - labelSize - 2) / GRID_SIZE;

          return (
            <div
              key={ship.id}
              style={{
                position: 'absolute',
                left: `${labelSize + 1 + ship.startCol * cw}px`,
                top: `${labelSize + 1 + ship.startRow * ch}px`,
                width:
                  ship.orientation === 'horizontal'
                    ? `${cw * ship.size}px`
                    : `${cw}px`,
                height:
                  ship.orientation === 'horizontal'
                    ? `${ch}px`
                    : `${ch * ship.size}px`,
                pointerEvents: 'auto',
                zIndex: 5,
                cursor: 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPointerDown={(e) => {
                handlePointerDown(ship.id, ship.size, ship.orientation, e);
              }}
            >
              <ShipSilhouette
                shipId={ship.id}
                size={ship.size}
                orientation={ship.orientation}
                cellSize={Math.floor(cw)}
              />
            </div>
          );
        })}
      </div>

      {/* Holding area for unplaced ships */}
      <HoldingArea
        unplacedShips={state.unplacedShips}
        cellSize={Math.min(cellSize, 32)}
        onShipPointerDown={handlePointerDown}
        draggedShipId={dragState.draggedShipId}
      />

      {/* Battle button */}
      <button
        onClick={handleBattle}
        disabled={!allPlaced}
        style={{
          marginTop: '16px',
          backgroundColor: allPlaced ? COLORS.leather : COLORS.darkNavyLight,
          color: allPlaced ? COLORS.parchment : COLORS.miss,
          border: `2px solid ${allPlaced ? COLORS.gold : COLORS.miss}`,
          borderRadius: '8px',
          padding: '14px 40px',
          fontFamily: FONTS.heading,
          fontSize: '22px',
          cursor: allPlaced ? 'pointer' : 'not-allowed',
          textTransform: 'uppercase',
          letterSpacing: '3px',
          boxShadow: allPlaced
            ? `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(200, 168, 78, 0.3)`
            : 'none',
          opacity: allPlaced ? 1 : 0.5,
          transition: 'all 0.2s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        Battle!
      </button>

      {/* Ghost ship following pointer during drag */}
      {dragState.isDragging && dragState.pointerPosition && (
        <div
          style={{
            position: 'fixed',
            left: dragState.pointerPosition.x - (cellSize * dragState.draggedShipSize) / 2,
            top: dragState.pointerPosition.y - cellSize / 2,
            pointerEvents: 'none',
            opacity: 0.6,
            zIndex: 1000,
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
          }}
        >
          <ShipSilhouette
            shipId={dragState.draggedShipId!}
            size={dragState.draggedShipSize}
            orientation={dragState.draggedShipOrientation}
            cellSize={cellSize}
          />
        </div>
      )}
    </div>
  );
};
