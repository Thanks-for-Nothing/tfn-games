import { useState, useCallback, useRef } from 'react';
import type { Orientation, Board, PlacedShip, GameAction } from '../game/types';
import { isValidPlacement } from '../game/boardUtils';
import { GRID_SIZE } from '../game/constants';

// Pointer must move at least this many pixels before a tap becomes a drag
const DRAG_THRESHOLD = 8;

interface DragState {
  isDragging: boolean;       // actively dragging (past threshold)
  isPending: boolean;        // pointer is down but not yet past threshold
  draggedShipId: string | null;
  draggedShipSize: number;
  draggedShipOrientation: Orientation;
  pointerPosition: { x: number; y: number } | null;
  pointerDownPos: { x: number; y: number } | null;
  shipWasPlaced: boolean;    // was the ship on the board when pointer went down?
  snappedCell: { row: number; col: number } | null;
  isValidDrop: boolean;
}

const initialDragState: DragState = {
  isDragging: false,
  isPending: false,
  draggedShipId: null,
  draggedShipSize: 0,
  draggedShipOrientation: 'horizontal',
  pointerPosition: null,
  pointerDownPos: null,
  shipWasPlaced: false,
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

      const shipWasPlaced = playerShips.some(s => s.id === shipId);

      // Don't remove the ship yet — wait to see if this becomes a real drag
      const newState: DragState = {
        isDragging: false,
        isPending: true,
        draggedShipId: shipId,
        draggedShipSize: shipSize,
        draggedShipOrientation: orientation,
        pointerPosition: { x: e.clientX, y: e.clientY },
        pointerDownPos: { x: e.clientX, y: e.clientY },
        shipWasPlaced,
        snappedCell: null,
        isValidDrop: false,
      };

      dragRef.current = newState;
      setDragState(newState);
    },
    [playerShips]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent | PointerEvent) => {
      const current = dragRef.current;
      if (!current.isPending && !current.isDragging) return;
      e.preventDefault();

      const pos = { x: e.clientX, y: e.clientY };

      // If still pending, check if we've moved far enough to start a real drag
      if (current.isPending && !current.isDragging) {
        const dx = pos.x - current.pointerDownPos!.x;
        const dy = pos.y - current.pointerDownPos!.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DRAG_THRESHOLD) {
          // Not a drag yet — just update position silently
          const ns = { ...current, pointerPosition: pos };
          dragRef.current = ns;
          setDragState(ns);
          return;
        }

        // Crossed threshold — officially start dragging
        if (current.shipWasPlaced) {
          dispatch({ type: 'REMOVE_SHIP', shipId: current.draggedShipId! });
        }

        const ns = { ...current, isDragging: true, isPending: false, pointerPosition: pos };
        dragRef.current = ns;
        setDragState(ns);
        return;
      }

      // Already dragging — compute snap cell
      const gridEl = gridRef.current;
      if (!gridEl) {
        const ns = { ...current, pointerPosition: pos, snappedCell: null, isValidDrop: false };
        dragRef.current = ns;
        setDragState(ns);
        return;
      }

      const gridRect = gridEl.getBoundingClientRect();
      const labelSize = 24;
      const cellWidth = (gridRect.width - labelSize - 2) / GRID_SIZE;
      const cellHeight = (gridRect.height - labelSize - 2) / GRID_SIZE;

      const relX = pos.x - gridRect.left - labelSize;
      const relY = pos.y - gridRect.top - labelSize;

      // Offset by half ship size so the center of the ship tracks the cursor
      const half = Math.floor(current.draggedShipSize / 2);
      let col = Math.floor(relX / cellWidth) - (current.draggedShipOrientation === 'horizontal' ? half : 0);
      let row = Math.floor(relY / cellHeight) - (current.draggedShipOrientation === 'vertical' ? half : 0);

      // Clamp to valid grid bounds
      col = Math.max(0, Math.min(GRID_SIZE - (current.draggedShipOrientation === 'horizontal' ? current.draggedShipSize : 1), col));
      row = Math.max(0, Math.min(GRID_SIZE - (current.draggedShipOrientation === 'vertical' ? current.draggedShipSize : 1), row));

      let snappedCell: { row: number; col: number } | null = null;
      let isValid = false;

      if (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
        snappedCell = { row, col };
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
    [gridRef, playerBoard, dispatch]
  );

  const handlePointerUp = useCallback(
    (_e: React.PointerEvent | PointerEvent) => {
      const current = dragRef.current;
      if (!current.isPending && !current.isDragging) return;

      if (current.isPending) {
        // Pointer up without crossing drag threshold — it's a tap
        if (current.shipWasPlaced && current.draggedShipId) {
          // Rotate the ship in place
          dispatch({ type: 'ROTATE_SHIP', shipId: current.draggedShipId });
        }
      } else if (current.isDragging) {
        // It was a real drag — place the ship if the drop is valid
        if (current.snappedCell && current.isValidDrop) {
          dispatch({
            type: 'PLACE_SHIP',
            shipId: current.draggedShipId!,
            row: current.snappedCell.row,
            col: current.snappedCell.col,
            orientation: current.draggedShipOrientation,
          });
        }
        // If drop was invalid, ship stays removed (back in holding area)
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
