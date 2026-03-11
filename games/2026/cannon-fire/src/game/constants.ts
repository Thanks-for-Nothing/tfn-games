import type { ShipDefinition } from './types';

export const GRID_SIZE = 7;

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const ROWS = ['1', '2', '3', '4', '5', '6', '7'];

export const SHIPS: ShipDefinition[] = [
  { id: 'galleon', name: 'Galleon', size: 4 },
  { id: 'brig', name: 'Brig', size: 3 },
  { id: 'dinghy', name: 'Dinghy', size: 2 },
];

export const AI_DELAY_MIN = 1000;
export const AI_DELAY_MAX = 2000;
