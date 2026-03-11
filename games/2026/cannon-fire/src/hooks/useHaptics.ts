import { useCallback } from 'react';

export function useHaptics() {
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const vibrateHit = useCallback(() => {
    if (canVibrate) navigator.vibrate(150);
  }, [canVibrate]);

  const vibrateSunk = useCallback(() => {
    if (canVibrate) navigator.vibrate([200, 100, 200]);
  }, [canVibrate]);

  const vibrateMiss = useCallback(() => {
    if (canVibrate) navigator.vibrate(40);
  }, [canVibrate]);

  const vibrateDefeat = useCallback(() => {
    if (canVibrate) navigator.vibrate([300, 200, 300, 200, 500]);
  }, [canVibrate]);

  return { vibrateHit, vibrateSunk, vibrateMiss, vibrateDefeat };
}
