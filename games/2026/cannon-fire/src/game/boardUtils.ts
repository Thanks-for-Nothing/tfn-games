import type { Board, BoardCell, PlacedShip, Orientation, ShipDefinition, ShotResult } from './types';
import { GRID_SIZE, SHIPS } from './constants';

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row: BoardCell[] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push({ state: 'empty', shipId: null });
    }
    board.push(row);
  }
  return board;
}

export function getCellsForShip(
  row: number,
  col: number,
  size: number,
  orientation: Orientation
): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < size; i++) {
    if (orientation === 'horizontal') {
      cells.push({ row, col: col + i });
    } else {
      cells.push({ row: row + i, col });
    }
  }
  return cells;
}

export function isValidPlacement(
  board: Board,
  shipId: string,
  size: number,
  row: number,
  col: number,
  orientation: Orientation
): boolean {
  const cells = getCellsForShip(row, col, size, orientation);

  for (const cell of cells) {
    // Out of bounds
    if (cell.row < 0 || cell.row >= GRID_SIZE || cell.col < 0 || cell.col >= GRID_SIZE) {
      return false;
    }
    // Occupied by another ship
    const boardCell = board[cell.row][cell.col];
    if (boardCell.shipId !== null && boardCell.shipId !== shipId) {
      return false;
    }
  }

  return true;
}

export function placeShipOnBoard(
  board: Board,
  ship: PlacedShip
): Board {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  const cells = getCellsForShip(ship.startRow, ship.startCol, ship.size, ship.orientation);

  for (const cell of cells) {
    newBoard[cell.row][cell.col] = { ...newBoard[cell.row][cell.col], shipId: ship.id };
  }

  return newBoard;
}

export function removeShipFromBoard(board: Board, shipId: string): Board {
  return board.map(row =>
    row.map(cell =>
      cell.shipId === shipId ? { ...cell, shipId: null } : { ...cell }
    )
  );
}

export function fireAtCell(
  board: Board,
  ships: PlacedShip[],
  row: number,
  col: number
): { board: Board; ships: PlacedShip[]; result: ShotResult } {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  let newShips = ships.map(s => ({ ...s }));
  const cell = newBoard[row][col];

  if (cell.shipId) {
    // Hit!
    const ship = newShips.find(s => s.id === cell.shipId)!;
    ship.hits += 1;

    if (ship.hits >= ship.size) {
      // Sunk!
      ship.sunk = true;
      // Mark all ship cells as sunk
      const shipCells = getCellsForShip(ship.startRow, ship.startCol, ship.size, ship.orientation);
      for (const sc of shipCells) {
        newBoard[sc.row][sc.col] = { ...newBoard[sc.row][sc.col], state: 'sunk' };
      }
      return {
        board: newBoard,
        ships: newShips,
        result: { row, col, result: 'sunk', shipId: ship.id, shipName: ship.name },
      };
    }

    newBoard[row][col] = { ...newBoard[row][col], state: 'hit' };
    return {
      board: newBoard,
      ships: newShips,
      result: { row, col, result: 'hit', shipId: ship.id, shipName: ship.name },
    };
  }

  // Miss
  newBoard[row][col] = { ...newBoard[row][col], state: 'miss' };
  return {
    board: newBoard,
    ships: newShips,
    result: { row, col, result: 'miss' },
  };
}

export function allShipsSunk(ships: PlacedShip[]): boolean {
  return ships.length > 0 && ships.every(s => s.sunk);
}

export function generateRandomPlacement(shipDefs: ShipDefinition[]): {
  board: Board;
  ships: PlacedShip[];
} {
  let board = createEmptyBoard();
  const ships: PlacedShip[] = [];

  for (const def of shipDefs) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 1000) {
      const orientation: Orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical';
      const maxRow = orientation === 'horizontal' ? GRID_SIZE : GRID_SIZE - def.size;
      const maxCol = orientation === 'horizontal' ? GRID_SIZE - def.size : GRID_SIZE;
      const row = Math.floor(Math.random() * maxRow);
      const col = Math.floor(Math.random() * maxCol);

      if (isValidPlacement(board, def.id, def.size, row, col, orientation)) {
        const ship: PlacedShip = {
          id: def.id,
          name: def.name,
          size: def.size,
          orientation,
          startRow: row,
          startCol: col,
          hits: 0,
          sunk: false,
        };
        board = placeShipOnBoard(board, ship);
        ships.push(ship);
        placed = true;
      }

      attempts++;
    }

    if (!placed) {
      // Extremely unlikely on a 7x7 grid with 3 small ships, but handle gracefully
      return generateRandomPlacement(shipDefs);
    }
  }

  return { board, ships };
}

export function canRotateShip(
  board: Board,
  ships: PlacedShip[],
  shipId: string
): boolean {
  const ship = ships.find(s => s.id === shipId);
  if (!ship) return false;

  const newOrientation: Orientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  const boardWithoutShip = removeShipFromBoard(board, shipId);

  return isValidPlacement(boardWithoutShip, shipId, ship.size, ship.startRow, ship.startCol, newOrientation);
}

export function rotateShipOnBoard(
  board: Board,
  ships: PlacedShip[],
  shipId: string
): { board: Board; ships: PlacedShip[] } | null {
  const ship = ships.find(s => s.id === shipId);
  if (!ship) return null;

  const newOrientation: Orientation = ship.orientation === 'horizontal' ? 'vertical' : 'horizontal';
  const boardWithoutShip = removeShipFromBoard(board, shipId);

  if (!isValidPlacement(boardWithoutShip, shipId, ship.size, ship.startRow, ship.startCol, newOrientation)) {
    return null;
  }

  const updatedShip: PlacedShip = { ...ship, orientation: newOrientation };
  const newBoard = placeShipOnBoard(boardWithoutShip, updatedShip);
  const newShips = ships.map(s => (s.id === shipId ? updatedShip : s));

  return { board: newBoard, ships: newShips };
}

// For the placement screen: get the default list of ships to place
export function getDefaultShipDefs(): ShipDefinition[] {
  return SHIPS.map(s => ({ ...s }));
}
