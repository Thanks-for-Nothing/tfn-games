import React, { useEffect, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useSound } from '../hooks/useSound';
import { useHaptics } from '../hooks/useHaptics';
import { TitleScreen } from './TitleScreen';
import { PlacementScreen } from './PlacementScreen';
import { BattleScreen } from './BattleScreen';
import { VictoryScreen } from './VictoryScreen';
import { DefeatScreen } from './DefeatScreen';
import { ANIMATION_CSS } from '../styles/animations';

export const CannonFire: React.FC = () => {
  const { state, dispatch } = useGameState();
  const { playCannonFire, playSplash, playExplosion, playVictoryFanfare, playDefeatSound } = useSound();
  const { vibrateHit, vibrateMiss, vibrateSunk, vibrateDefeat } = useHaptics();

  const prevPhaseRef = useRef(state.phase);
  const prevLastShotRef = useRef(state.lastShotResult);
  const prevComputerShotRef = useRef(state.computerLastShot);

  // Sound + haptic effects for player shots
  useEffect(() => {
    if (state.lastShotResult && state.lastShotResult !== prevLastShotRef.current) {
      playCannonFire();
      setTimeout(() => {
        if (state.lastShotResult?.result === 'hit') {
          playExplosion();
          vibrateHit();
        } else if (state.lastShotResult?.result === 'sunk') {
          playExplosion();
          vibrateSunk();
        } else if (state.lastShotResult?.result === 'miss') {
          playSplash();
          vibrateMiss();
        }
      }, 250);
    }
    prevLastShotRef.current = state.lastShotResult;
  }, [state.lastShotResult, playCannonFire, playSplash, playExplosion, vibrateHit, vibrateMiss, vibrateSunk]);

  // Sound + haptic effects for computer shots
  useEffect(() => {
    if (state.computerLastShot && state.computerLastShot !== prevComputerShotRef.current) {
      setTimeout(() => {
        if (state.computerLastShot?.result === 'hit') {
          playExplosion();
          vibrateHit();
        } else if (state.computerLastShot?.result === 'sunk') {
          playExplosion();
          vibrateSunk();
        } else if (state.computerLastShot?.result === 'miss') {
          playSplash();
        }
      }, 100);
    }
    prevComputerShotRef.current = state.computerLastShot;
  }, [state.computerLastShot, playSplash, playExplosion, vibrateHit, vibrateSunk]);

  // Victory / defeat sounds
  useEffect(() => {
    if (state.phase !== prevPhaseRef.current) {
      if (state.phase === 'victory') {
        setTimeout(() => playVictoryFanfare(), 300);
      } else if (state.phase === 'defeat') {
        setTimeout(() => {
          playDefeatSound();
          vibrateDefeat();
        }, 300);
      }
      prevPhaseRef.current = state.phase;
    }
  }, [state.phase, playVictoryFanfare, playDefeatSound, vibrateDefeat]);

  const renderScreen = () => {
    switch (state.phase) {
      case 'title':
        return <TitleScreen onStart={() => dispatch({ type: 'START_GAME' })} />;
      case 'placement':
        return <PlacementScreen state={state} dispatch={dispatch} />;
      case 'battle':
        return <BattleScreen state={state} dispatch={dispatch} />;
      case 'victory':
        return <VictoryScreen />;
      case 'defeat':
        return <DefeatScreen />;
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        fontFamily: "'Georgia', serif",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />
      {renderScreen()}
    </div>
  );
};
