import { useReducer, useEffect, useRef } from 'react';
import { gameReducer, createInitialState } from '../game/reducer';
import { AI_DELAY_MIN, AI_DELAY_MAX } from '../game/constants';

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const computerTurnPending = useRef(false);

  // After player fires, trigger computer response after a suspenseful delay
  useEffect(() => {
    if (
      state.phase === 'battle' &&
      !state.isPlayerTurn &&
      !computerTurnPending.current
    ) {
      computerTurnPending.current = true;
      dispatch({ type: 'SET_COMPUTER_THINKING', thinking: true });

      const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);
      const timer = setTimeout(() => {
        dispatch({ type: 'COMPUTER_FIRE' });
        computerTurnPending.current = false;
      }, delay);

      return () => {
        clearTimeout(timer);
        computerTurnPending.current = false;
      };
    }
  }, [state.isPlayerTurn, state.phase]);

  return { state, dispatch };
}
