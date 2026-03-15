import confetti from 'canvas-confetti';

function playFanfare() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const notes = [
      { freq: 523.25, start: 0.0, dur: 0.15 },   // C5
      { freq: 659.25, start: 0.12, dur: 0.15 },   // E5
      { freq: 783.99, start: 0.24, dur: 0.15 },   // G5
      { freq: 1046.5, start: 0.36, dur: 0.4 },    // C6
      { freq: 783.99, start: 0.5, dur: 0.12 },    // G5
      { freq: 1046.5, start: 0.62, dur: 0.6 },    // C6 hold
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    });
  } catch (_) {
    // AudioContext not available — skip sound silently
  }
}

export function triggerEventCompletionCelebration() {
  playFanfare();

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF69B4', '#FFA500', '#00FF7F'];
  const end = Date.now() + 4000;

  // Cannon blasts from both sides
  const frame = () => {
    confetti({
      particleCount: 12,
      angle: 60,
      spread: 70,
      origin: { x: 0, y: 0.6 },
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 12,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 0.6 },
      colors,
      zIndex: 9999,
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };

  // Opening burst from center
  confetti({
    particleCount: 200,
    spread: 160,
    origin: { x: 0.5, y: 0.4 },
    colors,
    zIndex: 9999,
    scalar: 1.2,
  });

  // Stars
  confetti({
    particleCount: 60,
    spread: 100,
    origin: { x: 0.5, y: 0.4 },
    colors,
    shapes: ['star'],
    scalar: 1.5,
    zIndex: 9999,
  });

  requestAnimationFrame(frame);
}
