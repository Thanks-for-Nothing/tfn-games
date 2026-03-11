import React, { useCallback, useState, useEffect } from 'react';
import type { GameState, GameAction } from '../game/types';
import { Grid } from './Grid';
import { MiniGrid } from './MiniGrid';
import { COLORS, FONTS } from '../styles/theme';

interface BattleScreenProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({ state, dispatch }) => {
  const isAttackView = state.activeGrid === 'attack';
  const [pendingShot, setPendingShot] = useState<{ row: number; col: number } | null>(null);

  // Clear pending shot when it's no longer the player's turn
  useEffect(() => {
    if (!state.isPlayerTurn || state.isComputerThinking) {
      setPendingShot(null);
    }
  }, [state.isPlayerTurn, state.isComputerThinking]);

  const handleAttackCellTap = useCallback(
    (row: number, col: number) => {
      if (!state.isPlayerTurn || state.isComputerThinking) return;
      if (state.computerBoard[row][col].state !== 'empty') return;
      // Toggle selection: tap same cell again to deselect
      setPendingShot(prev =>
        prev?.row === row && prev?.col === col ? null : { row, col }
      );
    },
    [state.isPlayerTurn, state.isComputerThinking, state.computerBoard]
  );

  const handleFire = useCallback(() => {
    if (!pendingShot || !state.isPlayerTurn || state.isComputerThinking) return;
    dispatch({ type: 'PLAYER_FIRE', row: pendingShot.row, col: pendingShot.col });
  }, [pendingShot, state.isPlayerTurn, state.isComputerThinking, dispatch]);

  const handleSwapGrids = useCallback(() => {
    dispatch({ type: 'SWAP_GRIDS' });
  }, [dispatch]);

  // Determine which board/settings go to the large grid vs small grid
  const largeBoard = isAttackView ? state.computerBoard : state.playerBoard;
  const largeShowShips = !isAttackView; // Show ships on defense view, hide on attack
  const largeOnCellTap = isAttackView ? handleAttackCellTap : undefined;
  const largeDisabled = !isAttackView || !state.isPlayerTurn || state.isComputerThinking;

  const smallBoard = isAttackView ? state.playerBoard : state.computerBoard;
  const smallShowShips = isAttackView; // Small shows player ships when attack is large
  const smallLabel = isAttackView ? 'Your Fleet' : 'Enemy Waters';

  // Ship status bar
  const playerShipStatus = state.playerShips.map(s => ({
    name: s.name,
    sunk: s.sunk,
    size: s.size,
    hits: s.hits,
  }));
  const computerShipStatus = state.computerShips.map(s => ({
    name: s.name,
    sunk: s.sunk,
    size: s.size,
  }));

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        padding: '8px 16px',
        background: `linear-gradient(180deg, ${COLORS.darkNavy} 0%, ${COLORS.oceanDark} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Status message */}
      <div
        style={{
          fontFamily: FONTS.body,
          fontSize: 'clamp(28px, 7vw, 36px)',
          color: state.isComputerThinking ? COLORS.lightGold : COLORS.parchment,
          textAlign: 'center',
          padding: '6px 16px',
          minHeight: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontStyle: state.isComputerThinking ? 'italic' : 'normal',
          animation: state.isComputerThinking ? 'cannonfire-pulse 1.5s ease-in-out infinite' : undefined,
        }}
      >
        {state.message}
      </div>

      {/* Large grid */}
      <div
        style={{
          width: '100%',
          flex: '0 0 auto',
          animation: 'cannonfire-gridSwap 0.3s ease-out',
          position: 'relative',
        }}
      >
        {/* Grid label row: title left, ship status right */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.heading,
              fontSize: '28px',
              color: COLORS.gold,
              letterSpacing: '1px',
            }}
          >
            {isAttackView ? 'Enemy Waters' : 'Your Fleet'}
          </div>

          {/* Enemy ship status (what you're hunting) */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {computerShipStatus.map(ship => (
              <div
                key={ship.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  opacity: ship.sunk ? 0.4 : 1,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: '22px',
                    color: ship.sunk ? COLORS.hit : COLORS.lightParchment,
                    textDecoration: ship.sunk ? 'line-through' : 'none',
                  }}
                >
                  {ship.name}
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: ship.size }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: ship.sunk ? COLORS.sunk : COLORS.gold,
                        opacity: ship.sunk ? 0.5 : 0.7,
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Grid
          board={largeBoard}
          showShips={largeShowShips}
          onCellTap={largeOnCellTap}
          disabled={largeDisabled}
          pendingCell={isAttackView && pendingShot ? pendingShot : undefined}
        />

        {/* Show sunk ship silhouettes on attack grid */}
        {isAttackView &&
          state.computerShips
            .filter(s => s.sunk)
            .map(ship => (
              <div
                key={`sunk-${ship.id}`}
                style={{
                  position: 'absolute',
                  pointerEvents: 'none',
                  opacity: 0.6,
                  zIndex: 5,
                }}
              />
            ))}
      </div>

      {/* Fire button */}
      {isAttackView && (
        <button
          onClick={handleFire}
          disabled={!pendingShot || !state.isPlayerTurn || state.isComputerThinking}
          style={{
            marginTop: '8px',
            backgroundColor: pendingShot && state.isPlayerTurn && !state.isComputerThinking
              ? COLORS.hit
              : COLORS.darkNavyLight,
            color: COLORS.parchment,
            border: `2px solid ${pendingShot && state.isPlayerTurn && !state.isComputerThinking ? COLORS.hitGlow : COLORS.miss}`,
            borderRadius: '8px',
            padding: '6px 48px',
            fontFamily: FONTS.heading,
            fontSize: '26px',
            cursor: pendingShot && state.isPlayerTurn && !state.isComputerThinking ? 'pointer' : 'not-allowed',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            opacity: pendingShot && state.isPlayerTurn && !state.isComputerThinking ? 1 : 0.4,
            transition: 'all 0.15s ease',
            WebkitTapHighlightColor: 'transparent',
            width: '100%',
          }}
        >
          🔥 Fire!
        </button>
      )}

      {/* Bottom area: mini grid + player ship status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
          marginTop: '8px',
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {/* Mini grid */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          <MiniGrid
            board={smallBoard}
            showShips={smallShowShips}
            onTap={handleSwapGrids}
            label={smallLabel}
          />
        </div>

        {/* Your fleet status */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              color: COLORS.lightGold,
              fontFamily: "'Georgia', serif",
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Your Ships
          </span>
          {playerShipStatus.map(ship => (
            <div
              key={ship.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                opacity: ship.sunk ? 0.4 : 1,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.body,
                  fontSize: '22px',
                  color: ship.sunk ? COLORS.hit : COLORS.lightParchment,
                  textDecoration: ship.sunk ? 'line-through' : 'none',
                  minWidth: '50px',
                }}
              >
                {ship.name}
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: ship.size }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '2px',
                      backgroundColor:
                        i < ship.hits
                          ? COLORS.hit
                          : ship.sunk
                          ? COLORS.sunk
                          : COLORS.deepTeal,
                      border: `1px solid ${COLORS.gold}`,
                      opacity: ship.sunk ? 0.5 : 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
