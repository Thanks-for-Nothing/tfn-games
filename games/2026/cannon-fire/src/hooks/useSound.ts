import { useRef, useCallback } from 'react';

export function useSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const ensureContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playCannonFire = useCallback(() => {
    try {
      const ctx = ensureContext();
      const bufferSize = Math.floor(ctx.sampleRate * 0.3);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
    } catch {
      // Audio not available
    }
  }, [ensureContext]);

  const playSplash = useCallback(() => {
    try {
      const ctx = ensureContext();
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.1));
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
    } catch {
      // Audio not available
    }
  }, [ensureContext]);

  const playExplosion = useCallback(() => {
    try {
      const ctx = ensureContext();
      // Low boom
      const boomSize = Math.floor(ctx.sampleRate * 0.5);
      const boomBuffer = ctx.createBuffer(1, boomSize, ctx.sampleRate);
      const boomData = boomBuffer.getChannelData(0);
      for (let i = 0; i < boomSize; i++) {
        boomData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }
      const boomSource = ctx.createBufferSource();
      boomSource.buffer = boomBuffer;
      const boomFilter = ctx.createBiquadFilter();
      boomFilter.type = 'lowpass';
      boomFilter.frequency.value = 300;
      const boomGain = ctx.createGain();
      boomGain.gain.setValueAtTime(0.6, ctx.currentTime);
      boomGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      boomSource.connect(boomFilter).connect(boomGain).connect(ctx.destination);
      boomSource.start();

      // Crackle overlay
      const crackleSize = Math.floor(ctx.sampleRate * 0.3);
      const crackleBuffer = ctx.createBuffer(1, crackleSize, ctx.sampleRate);
      const crackleData = crackleBuffer.getChannelData(0);
      for (let i = 0; i < crackleSize; i++) {
        crackleData[i] =
          (Math.random() * 2 - 1) *
          Math.exp(-i / (ctx.sampleRate * 0.03)) *
          (Math.random() > 0.7 ? 1 : 0.2);
      }
      const crackleSource = ctx.createBufferSource();
      crackleSource.buffer = crackleBuffer;
      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 800;
      const crackleGain = ctx.createGain();
      crackleGain.gain.setValueAtTime(0.3, ctx.currentTime);
      crackleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      crackleSource.connect(crackleFilter).connect(crackleGain).connect(ctx.destination);
      crackleSource.start();
    } catch {
      // Audio not available
    }
  }, [ensureContext]);

  const playVictoryFanfare = useCallback(() => {
    try {
      const ctx = ensureContext();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.2);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.2 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.2);
        osc.stop(ctx.currentTime + i * 0.2 + 0.5);
      });
    } catch {
      // Audio not available
    }
  }, [ensureContext]);

  const playDefeatSound = useCallback(() => {
    try {
      const ctx = ensureContext();
      const notes = [392, 349, 311, 262]; // G4, F4, Eb4, C4 (descending minor)
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.3 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.3 + 0.5);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 600;
        osc.connect(filter).connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.3);
        osc.stop(ctx.currentTime + i * 0.3 + 0.6);
      });
    } catch {
      // Audio not available
    }
  }, [ensureContext]);

  return { playCannonFire, playSplash, playExplosion, playVictoryFanfare, playDefeatSound };
}
