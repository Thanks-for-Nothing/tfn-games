import { useState, useCallback, useRef } from 'react';
import type { Orientation, Board, PlacedShip, GameAction } from '../game/types';
import { isValidPlacement } from '../game/boardUtils';
import { GRID_SIZE } from '../game/constants';

interface DragState {
  isDragging: boolean;
  draggedShipId: string | null;
  draggedShipSize: number;
  draggedShipOrientation: Orientation;
  pointerPosition: { x: number; y: number } | null;
  snappedCell: { row: number; col: number } | null;
  isValidDrop: boolean;
}

const initialDragState: DragState = {
  isDragging: false,
  draggedShipId: null,
  draggedShipSize: 0,
  draggedShipOrientation: 'horizontal',
  pointerPosition: null,
  snappedCell: null,
  isValidDrop: false,
};

export function useDragAndDrop(
  gridRef: React.RefObject<HTMLDivElement | null>,
  playerBoard: Board,
  playerShips: PlacedShip[],
  dispatch: React.Dispatch<GameAction>
) {
  const [dragState, setDragState] = useState<DragState>(initialDragState);
  const dragRef = useRef<DragState>(initialDragState);

  const handlePointerDown = useCallback(
    (
      shipId: string,
      shipSize: number,
      orientation: Orientation,
      e: React.PointerEvent
    ) => {
      e.preventDefault();
      e.stopPropagation();

      // If ship is already placed, remove it from the board before dragging
      const existingShip = playerShips.find(s => s.id === shipId);
      if (existingShip) {
        dispatch({ type: 'REMOVE_SHIP', shipId });
      }

      const newState: DragState = {
        isDragging: true,
        draggedShipId: shipId,
        draggedShipSize: shipSize,
        draggedShipOrientation: orientation,
        pointerPosition: { x: e.clientX, y: e.clientY },
        snappedCell: null,
        isValidDrop: false,
      };

      dragRef.current = newState;
      setDragState(newState);
    },
    [playerShips, dispatch]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const current = dragRef.current;
      if (!current.isDragging) return;
      e.preventDefault();

      const pos = { x: e.clientX, y: e.clientY };

      const gridEl = gridRef.current;
      if (!gridEl) {
        const ns = { ...current, pointerPosition: pos, snappedCell: null, isValidDrop: false };
        dragRef.current = ns;
        setDragState(ns);
        return;
      }

      const gridRect = gridEl.getBoundingClientRect();
      const labelSize = 24; // matches Grid component label column/row
      const cellWidth = (gridRect.width - labelSize - 2) / GRID_SIZE; // account for border/padding
      const cellHeight = (gridRect.height - labelSize - 2) / GRID_SIZE;

      const relX = pos.x - gridRect.left - labelSize;
      const relY = pos.y - gridRect.top - labelSize;

      const col = Math.floor(relX / cellWidth);
      const row = Math.floor(relY / cellHeight);

      let snappedCell: { row: number; col: number } | null = null;
      let isValid = false;

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        snappedCell = { row, col };

        // For validation, we need to check against the board without this ship
        // (since we already removed it from the board in handlePointerDown)
        isValid = isValidPlacement(
          playerBoard,
          current.draggedShipId!,
          current.draggedShipSize,
          row,
          col,
          current.draggedShipOrientation
        );
      }

      const ns = { ...current, pointerPosition: pos, snappedCell, isValidDrop: isValid };
      dragRef.current = ns;
      setDragState(ns);
    },
    [gridRef, playerBoard]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent | PointerEvent) => {
      const current = dragRef.current;
      if (!current.isDragging) return;

      if (current.snappedCell && current.isValidDrop) {
        dispatch({
          type: 'PLACE_SHIP',
          shipId: current.draggedShipId!,
          row: current.snappedCell.row,
          col: current.snappedCell.col,
          orientation: current.draggedShipOrientation,
        });
      }

      dragRef.current = initialDragState;
      setDragState(initialDragState);
    },
    [dispatch]
  );

  const cancelDrag = useCallback(() => {
    dragRef.current = initialDragState;
    setDragState(initialDragState);
  }, []);

  return {
    dragState,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    cancelDrag,
  };
}
