import type { ShipDefinition } from './types';

export const GRID_SIZE = 7;

export const COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
export const ROWS = ['1', '2', '3', '4', '5', '6', '7'];

export const SHIPS: ShipDefinition[] = [
  { id: 'galleon', name: 'Galleon', size: 4 },
  { id: 'brig', name: 'Brig', size: 3 },
  { id: 'dinghy', name: 'Dinghy', size: 2 },
];

export const AI_DELAY_MIN = 2500;
export const AI_DELAY_MAX = 3500;

export const THINKING_MESSAGES = [
  'The enemy scans the waters...',
  'The enemy takes aim...',
  'The enemy plots their shot...',
  'The enemy studies yer position...',
  'The enemy loads the cannon...',
  'The enemy reads the winds...',
  'The enemy marks their target...',
  'The enemy squints dramatically...',
  'The enemy consults a very old map...',
  'The enemy argues with the first mate...',
  'The enemy licks their finger and checks the wind...',
  'The enemy mutters something about yer mother...',
  'The enemy pretends they knew what they were doing...',
  'The enemy reconsiders their life choices...',
  'The enemy blames the compass...',
  'The enemy asks the parrot for advice...',
  'The enemy Googles "how to aim a cannon"...',
  'The enemy trips over a rope and recovers gracefully...',
  'The enemy stares at yer ships with deep personal regret...',
  'The enemy adjusts their hat for maximum intimidation...',
  'The enemy considers a career change...',
  'The enemy hums nervously to themselves...',
  'The enemy draws a target... on the wrong ship...',
  'The enemy shouts "I meant to do that!" at no one in particular...',
];
