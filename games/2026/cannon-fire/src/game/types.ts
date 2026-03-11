export type GamePhase = 'title' | 'placement' | 'battle' | 'victory' | 'defeat';
export type CellState = 'empty' | 'miss' | 'hit' | 'sunk';
export type Orientation = 'horizontal' | 'vertical';
export type ActiveGrid = 'attack' | 'defense';

export interface ShipDefinition {
  id: string;
  name: string;
  size: number;
}

export interface PlacedShip {
  id: string;
  name: string;
  size: number;
  orientation: Orientation;
  startRow: number;
  startCol: number;
  hits: number;
  sunk: boolean;
}

export interface BoardCell {
  state: CellState;
  shipId: string | null;
}

export type Board = BoardCell[][];

export interface ShotResult {
  row: number;
  col: number;
  result: 'hit' | 'miss' | 'sunk';
  shipId?: string;
  shipName?: string;
}

export interface AIState {
  mode: 'hunt' | 'target';
  targetQueue: Array<{ row: number; col: number; priority: number }>;
  hitCells: Array<{ row: number; col: number; shipId: string | null }>;
  firedCells: Set<string>;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PLACE_SHIP'; shipId: string; row: number; col: number; orientation: Orientation }
  | { type: 'REMOVE_SHIP'; shipId: string }
  | { type: 'ROTATE_SHIP'; shipId: string }
  | { type: 'START_BATTLE' }
  | { type: 'PLAYER_FIRE'; row: number; col: number }
  | { type: 'COMPUTER_FIRE' }
  | { type: 'SWAP_GRIDS' }
  | { type: 'SET_COMPUTER_THINKING'; thinking: boolean }
  | { type: 'SET_MESSAGE'; message: string };

export interface GameState {
  phase: GamePhase;
  playerBoard: Board;
  computerBoard: Board;
  playerShips: PlacedShip[];
  computerShips: PlacedShip[];
  unplacedShips: ShipDefinition[];
  isPlayerTurn: boolean;
  activeGrid: ActiveGrid;
  lastShotResult: ShotResult | null;
  computerLastShot: ShotResult | null;
  aiState: AIState;
  isComputerThinking: boolean;
  message: string;
}
