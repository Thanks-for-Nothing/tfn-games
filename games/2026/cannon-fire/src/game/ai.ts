import type { AIState, Board } from './types';
import { GRID_SIZE } from './constants';

export function createInitialAIState(): AIState {
  return {
    mode: 'hunt',
    targetQueue: [],
    hitCells: [],
    firedCells: new Set(),
  };
}

export function cloneAIState(state: AIState): AIState {
  return {
    mode: state.mode,
    targetQueue: state.targetQueue.map(t => ({ ...t })),
    hitCells: state.hitCells.map(h => ({ ...h })),
    firedCells: new Set(state.firedCells),
  };
}

export function getNextShot(
  aiState: AIState,
  _playerBoard: Board
): { row: number; col: number } {
  // TARGET MODE: use queued targets sorted by priority
  if (aiState.mode === 'target' && aiState.targetQueue.length > 0) {
    const sorted = [...aiState.targetQueue].sort((a, b) => b.priority - a.priority);

    for (const target of sorted) {
      const key = `${target.row},${target.col}`;
      if (!aiState.firedCells.has(key)) {
        return { row: target.row, col: target.col };
      }
    }
    // All targets exhausted, fall through to hunt mode
  }

  // HUNT MODE: checkerboard parity for efficiency
  // Firing at cells where (row + col) % 2 === 0 guarantees hitting
  // every ship of size >= 2 with roughly half the total shots
  const candidates: Array<{ row: number; col: number }> = [];
  const fallback: Array<{ row: number; col: number }> = [];

  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const key = `${r},${c}`;
      if (!aiState.firedCells.has(key)) {
        if ((r + c) % 2 === 0) {
          candidates.push({ row: r, col: c });
        } else {
          fallback.push({ row: r, col: c });
        }
      }
    }
  }

  const pool = candidates.length > 0 ? candidates : fallback;

  if (pool.length === 0) {
    // Should never happen in normal gameplay, but handle gracefully
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!aiState.firedCells.has(`${r},${c}`)) {
          return { row: r, col: c };
        }
      }
    }
    return { row: 0, col: 0 };
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

const ADJACENT_OFFSETS: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function updateAIState(
  aiState: AIState,
  row: number,
  col: number,
  result: 'hit' | 'miss' | 'sunk',
  shipId?: string
): AIState {
  const newState = cloneAIState(aiState);
  newState.firedCells.add(`${row},${col}`);

  if (result === 'miss') {
    // Remove this cell from target queue if present
    newState.targetQueue = newState.targetQueue.filter(
      t => !(t.row === row && t.col === col)
    );
    if (newState.targetQueue.length === 0 && newState.hitCells.length === 0) {
      newState.mode = 'hunt';
    }
    return newState;
  }

  if (result === 'hit') {
    newState.mode = 'target';
    newState.hitCells.push({ row, col, shipId: shipId || null });

    // Add adjacent cells to target queue
    for (const [dr, dc] of ADJACENT_OFFSETS) {
      const nr = row + dr;
      const nc = col + dc;

      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      if (newState.firedCells.has(`${nr},${nc}`)) continue;

      let priority = 1;

      // If we have 2+ hits on the same ship, prioritize along the detected axis
      const shipHits = newState.hitCells.filter(h => h.shipId === shipId);
      if (shipHits.length >= 2) {
        const allSameRow = shipHits.every(h => h.row === shipHits[0].row);
        const allSameCol = shipHits.every(h => h.col === shipHits[0].col);

        if (allSameRow && dr === 0) priority = 3;       // Same row → horizontal ship, prioritize horizontal neighbors
        else if (allSameCol && dc === 0) priority = 3;  // Same col → vertical ship, prioritize vertical neighbors
        else if (allSameRow && dc === 0) priority = 0;   // Wrong axis
        else if (allSameCol && dr === 0) priority = 0;   // Wrong axis
      }

      if (priority <= 0) continue;

      const existingIdx = newState.targetQueue.findIndex(t => t.row === nr && t.col === nc);
      if (existingIdx === -1) {
        newState.targetQueue.push({ row: nr, col: nc, priority });
      } else if (priority > newState.targetQueue[existingIdx].priority) {
        newState.targetQueue[existingIdx].priority = priority;
      }
    }

    return newState;
  }

  if (result === 'sunk') {
    // Remove all hit cells for this sunk ship
    newState.hitCells = newState.hitCells.filter(h => h.shipId !== shipId);

    if (newState.hitCells.length === 0) {
      // No other damaged ships — go back to hunt mode
      newState.targetQueue = [];
      newState.mode = 'hunt';
    } else {
      // Still have unsunk hits — rebuild target queue from remaining hits
      newState.targetQueue = rebuildTargetQueue(newState.hitCells, newState.firedCells);
      newState.mode = 'target';
    }

    return newState;
  }

  return newState;
}

function rebuildTargetQueue(
  hitCells: Array<{ row: number; col: number; shipId: string | null }>,
  firedCells: Set<string>
): Array<{ row: number; col: number; priority: number }> {
  const targets: Array<{ row: number; col: number; priority: number }> = [];
  const seen = new Set<string>();

  for (const hit of hitCells) {
    for (const [dr, dc] of ADJACENT_OFFSETS) {
      const nr = hit.row + dr;
      const nc = hit.col + dc;
      const key = `${nr},${nc}`;

      if (nr < 0 || nr >= GRID_SIZE || nc < 0 || nc >= GRID_SIZE) continue;
      if (firedCells.has(key) || seen.has(key)) continue;

      targets.push({ row: nr, col: nc, priority: 1 });
      seen.add(key);
    }
  }

  return targets;
}
