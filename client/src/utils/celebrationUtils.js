const getViewportCenter = () => ({
  x: document.documentElement.clientWidth / 2,
  y: document.documentElement.clientHeight / 3,
});

// ============================================
// SOUND EFFECTS
// ============================================

let audioContextUnlocked = false;
let sharedAudioContext = null;

const getAudioContext = () => {
  if (!sharedAudioContext) {
    sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioContext;
};

// Call this on any user interaction to unlock audio
export const unlockAudio = () => {
  if (audioContextUnlocked) return;

  try {
    const ctx = getAudioContext();
    // Create and immediately play a silent buffer to unlock
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    audioContextUnlocked = true;
    console.log('Audio context unlocked');
  } catch (e) {
    console.log('Could not unlock audio:', e);
  }
};

export const playSuccessSound = () => {
  try {
    const audioContext = getAudioContext();
    const playTone = (frequency, duration, startTime, gain = 0.1) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Happy success jingle
    const now = audioContext.currentTime;
    playTone(523.25, 0.15, now, 0.08); // C5
    playTone(659.25, 0.15, now + 0.1, 0.08); // E5
    playTone(783.99, 0.2, now + 0.2, 0.1); // G5
  } catch (error) {
    console.log('Could not play success sound:', error);
  }
};

export const playApprovalSound = () => {
  try {
    const audioContext = getAudioContext();
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        console.log('AudioContext resumed:', audioContext.state);
      });
    }

    const playTone = (frequency, duration, startTime, gain = 0.12) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Triumphant approval sound
    const now = audioContext.currentTime;
    playTone(523.25, 0.2, now, 0.1); // C5
    playTone(659.25, 0.2, now + 0.15, 0.1); // E5
    playTone(783.99, 0.25, now + 0.3, 0.12); // G5
    playTone(1046.5, 0.4, now + 0.45, 0.15); // C6
  } catch (error) {
    console.log('Could not play approval sound:', error);
  }
};

export const playDenialSound = () => {
  try {
    const audioContext = getAudioContext();
    const playTone = (frequency, duration, startTime, gain = 0.08) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Sad descending tone
    const now = audioContext.currentTime;
    playTone(400, 0.2, now, 0.06);
    playTone(350, 0.3, now + 0.15, 0.06);
  } catch (error) {
    console.log('Could not play denial sound:', error);
  }
};

// ============================================
// CONFETTI EFFECTS
// ============================================

const ensureConfettiStyles = () => {
  if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotateZ(0deg) scale(1); opacity: 1; }
        25% { transform: translateY(25vh) rotateZ(180deg) scale(1.2); }
        50% { transform: translateY(50vh) rotateZ(360deg) scale(0.8); }
        75% { transform: translateY(75vh) rotateZ(540deg) scale(1.1); }
        100% { transform: translateY(120vh) rotateZ(720deg) scale(0.5); opacity: 0; }
      }
      @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(1.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Mini confetti burst - lighter than mega confetti
export const triggerMiniConfetti = (originX = null, originY = null) => {
  ensureConfettiStyles();

  const { x: centerX, y: centerY } = getViewportCenter();

  const colors = ['#FFD700', '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#FFEAA7'];
  const startX = originX ?? centerX;
  const startY = originY ?? centerY;

  // Create 30 confetti pieces
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 10;
    const angle = Math.random() * Math.PI * 2;
    const velocity = 50 + Math.random() * 100;
    const duration = 1 + Math.random() * 1.5;

    confetti.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      left: ${startX}px;
      top: ${startY}px;
      pointer-events: none;
      z-index: 10000;
      box-shadow: 0 0 ${size / 2}px ${color};
    `;

    document.body.appendChild(confetti);

    // Animate outward
    let progress = 0;
    const animate = () => {
      progress += 0.02;
      const x = startX + Math.cos(angle) * velocity * progress;
      const y = startY + Math.sin(angle) * velocity * progress + progress * progress * 150;
      const opacity = 1 - progress;
      const rotation = progress * 720;

      confetti.style.left = `${x}px`;
      confetti.style.top = `${y}px`;
      confetti.style.opacity = opacity;
      confetti.style.transform = `rotate(${rotation}deg)`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        confetti.remove();
      }
    };

    setTimeout(() => requestAnimationFrame(animate), i * 20);
  }
};

// Emoji burst effect
export const triggerEmojiBurst = (emoji = '🎉', count = 8, originX = null, originY = null) => {
  ensureConfettiStyles();

  const { x: centerX, y: centerY } = getViewportCenter();
  const startX = originX ?? centerX;
  const startY = originY ?? centerY;

  for (let i = 0; i < count; i++) {
    const emojiEl = document.createElement('div');
    const angle = (i / count) * Math.PI * 2;
    const velocity = 60 + Math.random() * 40;
    const size = 20 + Math.random() * 15;

    emojiEl.textContent = emoji;
    emojiEl.style.cssText = `
      position: fixed;
      font-size: ${size}px;
      left: ${startX}px;
      top: ${startY}px;
      pointer-events: none;
      z-index: 10001;
      animation: popIn 0.3s ease-out;
    `;

    document.body.appendChild(emojiEl);

    let progress = 0;
    const animate = () => {
      progress += 0.025;
      const x = startX + Math.cos(angle) * velocity * progress * 2;
      const y = startY + Math.sin(angle) * velocity * progress - progress * 50;
      const opacity = 1 - progress;
      const scale = 1 + progress * 0.5;

      emojiEl.style.left = `${x}px`;
      emojiEl.style.top = `${y}px`;
      emojiEl.style.opacity = opacity;
      emojiEl.style.transform = `scale(${scale})`;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        emojiEl.remove();
      }
    };

    setTimeout(() => requestAnimationFrame(animate), 100);
  }
};

// GP/reward float up effect
export const triggerRewardFloat = (text, originX = null, originY = null) => {
  ensureConfettiStyles();

  const { x: centerX, y: centerY } = getViewportCenter();
  const startX = originX ?? centerX;
  const startY = originY ?? centerY;

  const floater = document.createElement('div');
  floater.textContent = text;
  floater.style.cssText = `
    position: fixed;
    left: ${startX}px;
    top: ${startY}px;
    transform: translateX(-50%);
    font-size: 48px;
    font-weight: bold;
    color: #43AA8B;
    text-shadow: 
      0 0 20px rgba(67, 170, 139, 0.8),
      0 0 40px rgba(67, 170, 139, 0.6),
      2px 2px 0 rgba(255, 255, 255, 0.9),
      -2px -2px 0 rgba(255, 255, 255, 0.9),
      2px -2px 0 rgba(255, 255, 255, 0.9),
      -2px 2px 0 rgba(255, 255, 255, 0.9);
    pointer-events: none;
    z-index: 10002;
    animation: floatUp 1.5s ease-out forwards;
    white-space: nowrap;
    padding: 56px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 40%, transparent 70%);
    border-radius: 8px;
  `;

  document.body.appendChild(floater);
  setTimeout(() => floater.remove(), 4000);
};

// ============================================
// COMBINED CELEBRATION FUNCTIONS
// ============================================

export const celebrateSubmissionApproved = (nodeTitle, gpReward) => {
  playApprovalSound();
  triggerMiniConfetti();
  triggerEmojiBurst('✅', 6);

  if (gpReward) {
    setTimeout(() => {
      triggerRewardFloat(`Submission approved! +${formatGP(gpReward)} GP`);
    }, 300);
  }
};

export const celebrateNodeCompleted = (nodeTitle, gpReward, keysEarned) => {
  playApprovalSound();
  triggerMiniConfetti();
  triggerEmojiBurst('🎯', 8);

  setTimeout(() => {
    triggerEmojiBurst('⭐', 6);
  }, 200);

  if (gpReward) {
    setTimeout(() => {
      triggerRewardFloat(`Node completed! +${formatGP(gpReward)} GP`);
    }, 400);
  }

  if (keysEarned && keysEarned.length > 0) {
    setTimeout(() => {
      triggerEmojiBurst(
        '🔑',
        keysEarned.reduce((sum, k) => sum + k.quantity, 0)
      );
    }, 600);
  }
};

export const celebrateSubmissionDenied = () => {
  playDenialSound();
  // No confetti for denials, just the sound
};

// Helper
const formatGP = (gp) => {
  if (!gp) return '0';
  if (gp >= 1000000) return (gp / 1000000).toFixed(1) + 'M';
  if (gp >= 1000) return (gp / 1000).toFixed(0) + 'K';
  return gp.toString();
};
