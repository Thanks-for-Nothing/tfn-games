import React, { useCallback } from 'react';
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

  const handleAttackCellTap = useCallback(
    (row: number, col: number) => {
      if (!state.isPlayerTurn || state.isComputerThinking) return;
      dispatch({ type: 'PLAYER_FIRE', row, col });
    },
    [state.isPlayerTurn, state.isComputerThinking, dispatch]
  );

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

      {/* Enemy ship status (what you're hunting) */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '6px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
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

      {/* Large grid */}
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          flex: '0 0 auto',
          animation: 'cannonfire-gridSwap 0.3s ease-out',
          position: 'relative',
        }}
      >
        {/* Grid label */}
        <div
          style={{
            textAlign: 'center',
            fontFamily: FONTS.heading,
            fontSize: '28px',
            color: COLORS.gold,
            marginBottom: '4px',
            letterSpacing: '1px',
          }}
        >
          {isAttackView ? 'Enemy Waters' : 'Your Fleet'}
        </div>

        <Grid
          board={largeBoard}
          showShips={largeShowShips}
          onCellTap={largeOnCellTap}
          disabled={largeDisabled}
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

      {/* Bottom area: mini grid + player ship status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '16px',
          marginTop: '8px',
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
        }}
      >
        {/* Mini grid */}
        <MiniGrid
          board={smallBoard}
          showShips={smallShowShips}
          onTap={handleSwapGrids}
          label={smallLabel}
        />

        {/* Your fleet status */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            padding: '8px',
            backgroundColor: 'rgba(26, 58, 74, 0.5)',
            border: `1px solid ${COLORS.gold}`,
            borderRadius: '6px',
          }}
        >
          <span
            style={{
              fontSize: '20px',
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
