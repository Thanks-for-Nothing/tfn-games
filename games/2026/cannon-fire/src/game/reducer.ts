import type { GameState, GameAction } from './types';
import { SHIPS } from './constants';
import {
  createEmptyBoard,
  placeShipOnBoard,
  removeShipFromBoard,
  fireAtCell,
  allShipsSunk,
  generateRandomPlacement,
  isValidPlacement,
} from './boardUtils';
import { createInitialAIState, getNextShot, updateAIState } from './ai';

export function createInitialState(): GameState {
  return {
    phase: 'title',
    playerBoard: createEmptyBoard(),
    computerBoard: createEmptyBoard(),
    playerShips: [],
    computerShips: [],
    unplacedShips: SHIPS.map(s => ({ ...s })),
    isPlayerTurn: true,
    activeGrid: 'attack',
    lastShotResult: null,
    computerLastShot: null,
    aiState: createInitialAIState(),
    isComputerThinking: false,
    message: '',
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...createInitialState(),
        phase: 'placement',
        message: 'Place yer fleet, Captain!',
      };
    }

    case 'PLACE_SHIP': {
      const shipDef = [...state.unplacedShips, ...state.playerShips.map(s => ({
        id: s.id, name: s.name, size: s.size,
      }))].find(s => s.id === action.shipId);

      if (!shipDef) return state;

      // If ship was already placed, remove it first
      const existingShip = state.playerShips.find(s => s.id === action.shipId);
      let board = state.playerBoard;
      let ships = [...state.playerShips];
      let unplaced = [...state.unplacedShips];

      if (existingShip) {
        board = removeShipFromBoard(board, action.shipId);
        ships = ships.filter(s => s.id !== action.shipId);
      } else {
        unplaced = unplaced.filter(s => s.id !== action.shipId);
      }

      // Validate placement
      if (!isValidPlacement(board, action.shipId, shipDef.size, action.row, action.col, action.orientation)) {
        return state;
      }

      const newShip = {
        id: shipDef.id,
        name: shipDef.name,
        size: shipDef.size,
        orientation: action.orientation,
        startRow: action.row,
        startCol: action.col,
        hits: 0,
        sunk: false,
      };

      const newBoard = placeShipOnBoard(board, newShip);

      return {
        ...state,
        playerBoard: newBoard,
        playerShips: [...ships, newShip],
        unplacedShips: unplaced,
      };
    }

    case 'REMOVE_SHIP': {
      const ship = state.playerShips.find(s => s.id === action.shipId);
      if (!ship) return state;

      return {
        ...state,
        playerBoard: removeShipFromBoard(state.playerBoard, action.shipId),
        playerShips: state.playerShips.filter(s => s.id !== action.shipId),
        unplacedShips: [...state.unplacedShips, { id: ship.id, name: ship.name, size: ship.size }],
      };
    }

    case 'ROTATE_SHIP': {
      const ship = state.playerShips.find(s => s.id === action.shipId);
      if (!ship) return state;

      const newOrientation = ship.orientation === 'horizontal' ? 'vertical' as const : 'horizontal' as const;
      const boardWithout = removeShipFromBoard(state.playerBoard, action.shipId);

      if (!isValidPlacement(boardWithout, action.shipId, ship.size, ship.startRow, ship.startCol, newOrientation)) {
        return state; // Can't rotate — would go out of bounds or overlap
      }

      const rotatedShip = { ...ship, orientation: newOrientation };
      const newBoard = placeShipOnBoard(boardWithout, rotatedShip);

      return {
        ...state,
        playerBoard: newBoard,
        playerShips: state.playerShips.map(s => s.id === action.shipId ? rotatedShip : s),
      };
    }

    case 'START_BATTLE': {
      if (state.unplacedShips.length > 0) return state; // Not all ships placed

      // Generate random computer ship placement
      const { board: compBoard, ships: compShips } = generateRandomPlacement(SHIPS);

      return {
        ...state,
        phase: 'battle',
        computerBoard: compBoard,
        computerShips: compShips,
        isPlayerTurn: true,
        activeGrid: 'attack',
        message: 'Fire yer cannons!',
        aiState: createInitialAIState(),
      };
    }

    case 'PLAYER_FIRE': {
      if (!state.isPlayerTurn || state.isComputerThinking) return state;
      if (state.phase !== 'battle') return state;

      const cell = state.computerBoard[action.row][action.col];
      if (cell.state !== 'empty') return state; // Already fired here

      const { board, ships, result } = fireAtCell(
        state.computerBoard,
        state.computerShips,
        action.row,
        action.col
      );

      // Check if player won
      if (allShipsSunk(ships)) {
        return {
          ...state,
          computerBoard: board,
          computerShips: ships,
          lastShotResult: result,
          phase: 'victory',
          message: 'Victory! All enemy ships destroyed!',
        };
      }

      let message = '';
      if (result.result === 'hit') message = 'Direct hit!';
      else if (result.result === 'sunk') message = `Ye sank the ${result.shipName}!`;
      else message = 'Splash... miss!';

      return {
        ...state,
        computerBoard: board,
        computerShips: ships,
        lastShotResult: result,
        isPlayerTurn: false,
        message,
      };
    }

    case 'COMPUTER_FIRE': {
      if (state.isPlayerTurn) return state;
      if (state.phase !== 'battle') return state;

      const target = getNextShot(state.aiState, state.playerBoard);
      const { board, ships, result } = fireAtCell(
        state.playerBoard,
        state.playerShips,
        target.row,
        target.col
      );

      const newAIState = updateAIState(state.aiState, target.row, target.col, result.result, result.shipId);

      // Check if computer won
      if (allShipsSunk(ships)) {
        return {
          ...state,
          playerBoard: board,
          playerShips: ships,
          computerLastShot: result,
          aiState: newAIState,
          phase: 'defeat',
          isComputerThinking: false,
          message: 'Yer fleet has been destroyed!',
        };
      }

      let message = '';
      if (result.result === 'hit') message = 'The enemy hit yer ship!';
      else if (result.result === 'sunk') message = `They sank yer ${result.shipName}!`;
      else message = 'The enemy missed!';

      return {
        ...state,
        playerBoard: board,
        playerShips: ships,
        computerLastShot: result,
        aiState: newAIState,
        isPlayerTurn: true,
        isComputerThinking: false,
        message,
      };
    }

    case 'SWAP_GRIDS': {
      return {
        ...state,
        activeGrid: state.activeGrid === 'attack' ? 'defense' : 'attack',
      };
    }

    case 'SET_COMPUTER_THINKING': {
      return {
        ...state,
        isComputerThinking: action.thinking,
        message: action.thinking ? 'The enemy takes aim...' : state.message,
      };
    }

    case 'SET_MESSAGE': {
      return { ...state, message: action.message };
    }

    default:
      return state;
  }
}
