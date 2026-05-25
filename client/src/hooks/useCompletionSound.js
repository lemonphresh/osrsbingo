import { useCallback } from 'react';

function getAudioContext() {
  return new (window.AudioContext || window.webkitAudioContext)();
}

function playNote(ctx, freq, startTime, duration, gain = 0.28, type = 'sine') {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function useCompletionSound() {
  const playTileComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      // Quick ascending C-E-G
      playNote(ctx, 523.25, t,        0.18);
      playNote(ctx, 659.25, t + 0.11, 0.18);
      playNote(ctx, 783.99, t + 0.22, 0.32);
      setTimeout(() => ctx.close(), 1000);
    } catch (_) {}
  }, []);

  const playCapstoneComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      // C-E-G-C (octave jump)
      playNote(ctx, 523.25, t,        0.14);
      playNote(ctx, 659.25, t + 0.10, 0.14);
      playNote(ctx, 783.99, t + 0.20, 0.14);
      playNote(ctx, 1046.5, t + 0.30, 0.55, 0.35);
      // harmony
      playNote(ctx, 783.99, t + 0.30, 0.55, 0.15);
      setTimeout(() => ctx.close(), 1500);
    } catch (_) {}
  }, []);

  const playBoardComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      // Full fanfare — C major ascending then a triumphant resolution
      playNote(ctx, 523.25, t,        0.12);
      playNote(ctx, 587.33, t + 0.10, 0.12);
      playNote(ctx, 659.25, t + 0.20, 0.12);
      playNote(ctx, 783.99, t + 0.30, 0.12);
      playNote(ctx, 1046.5, t + 0.42, 0.28, 0.32);
      playNote(ctx, 783.99, t + 0.70, 0.12);
      playNote(ctx, 1046.5, t + 0.82, 0.70, 0.38);
      // chord underneath the final note
      playNote(ctx, 659.25, t + 0.82, 0.70, 0.14);
      playNote(ctx, 523.25, t + 0.82, 0.70, 0.14);
      setTimeout(() => ctx.close(), 2500);
    } catch (_) {}
  }, []);

  const playSubmissionReceived = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      // Three-note ascending alert: E5 → G5 → C6
      playNote(ctx, 659.25, t,        0.12, 0.35);
      playNote(ctx, 783.99, t + 0.10, 0.12, 0.35);
      playNote(ctx, 1046.5, t + 0.20, 0.40, 0.40);
      setTimeout(() => ctx.close(), 1200);
    } catch (_) {}
  }, []);

  return { playTileComplete, playCapstoneComplete, playBoardComplete, playSubmissionReceived };
}
