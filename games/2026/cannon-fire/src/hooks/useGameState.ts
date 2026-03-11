import { useReducer, useEffect, useRef } from 'react';
import { gameReducer, createInitialState } from '../game/reducer';
import { AI_DELAY_MIN, AI_DELAY_MAX, THINKING_MESSAGES } from '../game/constants';

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

      // Show hit/miss result for 1s, then cycle thinking messages
      const HIT_DISPLAY_MS = 2000;
      const MESSAGE_CYCLE_MS = 2200;
      let messageInterval: ReturnType<typeof setInterval> | null = null;

      const thinkingTimer = setTimeout(() => {
        const startIdx = Math.floor(Math.random() * THINKING_MESSAGES.length);
        dispatch({ type: 'SET_MESSAGE', message: THINKING_MESSAGES[startIdx] });
        messageInterval = setInterval(() => {
          const msg = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
          dispatch({ type: 'SET_MESSAGE', message: msg });
        }, MESSAGE_CYCLE_MS);
      }, HIT_DISPLAY_MS);

      const delay = HIT_DISPLAY_MS + AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);
      const fireTimer = setTimeout(() => {
        if (messageInterval) clearInterval(messageInterval);
        dispatch({ type: 'COMPUTER_FIRE' });
        computerTurnPending.current = false;
      }, delay);

      return () => {
        clearTimeout(thinkingTimer);
        clearTimeout(fireTimer);
        if (messageInterval) clearInterval(messageInterval);
        computerTurnPending.current = false;
      };
    }
  }, [state.isPlayerTurn, state.phase]);

  return { state, dispatch };
}
