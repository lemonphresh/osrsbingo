/**
 * soundEngine.js — Web Audio API sound effects for Champion Forge
 *
 * UI sounds  (fixed ~0.4 gain): submission notifications, task complete
 * Battle sounds (user-controlled): all combat SFX, persisted in localStorage
 */

const STORAGE_KEY = 'cf_battle_volume';
const DEFAULT_BATTLE_VOLUME = 0.65;

let _ctx = null;
let _battleGain = null;
let _battleVol = parseFloat(
  localStorage.getItem(STORAGE_KEY) ?? String(DEFAULT_BATTLE_VOLUME)
);

function getAC() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)();
    _battleGain = _ctx.createGain();
    _battleGain.gain.value = _battleVol;
    _battleGain.connect(_ctx.destination);
  }
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

/**
 * Call on page mount to initialize the AudioContext while the user is still
 * on the page. This ensures sounds fire correctly even if the tab is later
 * moved to the background (Chrome suspends new contexts created in hidden tabs).
 */
export function warmUpAudio() {
  try { getAC(); } catch (_) {}
}

function battleDest() {
  getAC();
  return _battleGain;
}

function uiDest(ac) {
  const g = ac.createGain();
  g.gain.value = 0.42;
  g.connect(ac.destination);
  return g;
}

// ---------------------------------------------------------------------------
// Volume control (battle only)
// ---------------------------------------------------------------------------

export function getBattleVolume() {
  return _battleVol;
}

export function setBattleVolume(v) {
  _battleVol = Math.max(0, Math.min(1, v));
  localStorage.setItem(STORAGE_KEY, String(_battleVol));
  if (_battleGain) _battleGain.gain.value = _battleVol;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function oscNode(ac, dest, { freq, type = 'sine', peak = 0.3, attack = 0.01, duration = 0.3, delay = 0, freqEnd }) {
  const t = ac.currentTime + delay;
  const node = ac.createOscillator();
  const gain = ac.createGain();
  node.connect(gain);
  gain.connect(dest);
  node.type = type;
  node.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) {
    node.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 10), t + duration);
  }
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  node.start(t);
  node.stop(t + duration + 0.05);
}

function noiseNode(ac, dest, {
  filterFreq = 1000,
  filterType = 'lowpass',
  Q = 1,
  peak = 0.3,
  attack = 0.005,
  duration = 0.25,
  delay = 0,
}) {
  const t = ac.currentTime + delay;
  const bufLen = Math.ceil(ac.sampleRate * (duration + 0.1));
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  filter.Q.value = Q;
  const gain = ac.createGain();
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  gain.gain.setValueAtTime(0.001, t);
  gain.gain.linearRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.start(t);
  src.stop(t + duration + 0.1);
}

// ---------------------------------------------------------------------------
// UI sounds — fixed volume, no battle slider
// ---------------------------------------------------------------------------

export function playSubmissionIncoming() {
  try {
    const ac = getAC();
    const dest = uiDest(ac);
    oscNode(ac, dest, { freq: 440, peak: 0.35, attack: 0.005, duration: 0.15 });
    oscNode(ac, dest, { freq: 587, peak: 0.35, attack: 0.005, duration: 0.22, delay: 0.12 });
  } catch (_) {}
}

export function playSubmissionApproved() {
  try {
    const ac = getAC();
    const dest = uiDest(ac);
    [523, 659, 784, 1047].forEach((freq, i) => {
      oscNode(ac, dest, { freq, type: 'triangle', peak: 0.28, attack: 0.008, duration: 0.22, delay: i * 0.07 });
    });
  } catch (_) {}
}

export function playSubmissionDenied() {
  try {
    const ac = getAC();
    const dest = uiDest(ac);
    [392, 311, 261].forEach((freq, i) => {
      oscNode(ac, dest, { freq, type: 'sawtooth', peak: 0.16, attack: 0.01, duration: 0.22, delay: i * 0.1 });
    });
  } catch (_) {}
}

export function playTaskComplete() {
  try {
    const ac = getAC();
    const dest = uiDest(ac);
    [523, 659, 784].forEach((freq, i) => {
      oscNode(ac, dest, { freq, peak: 0.28, attack: 0.01, duration: 0.18, delay: i * 0.09 });
    });
    oscNode(ac, dest, { freq: 1047, peak: 0.38, attack: 0.01, duration: 0.5, delay: 0.3 });
  } catch (_) {}
}

// ---------------------------------------------------------------------------
// Battle sounds — routed through battleGain (user volume slider)
// ---------------------------------------------------------------------------

export function playBattleSound(effectKey) {
  try {
    const ac = getAC();
    const dest = battleDest();

    switch (effectKey) {
      case 'slash': {
        // Filtered noise whoosh + pitch sweep down
        noiseNode(ac, dest, { filterFreq: 1800, peak: 0.45, duration: 0.28 });
        oscNode(ac, dest, { freq: 400, type: 'sawtooth', peak: 0.14, attack: 0.003, duration: 0.22, freqEnd: 55 });
        break;
      }
      case 'critSlash': {
        // Heavy slash + metallic crack
        noiseNode(ac, dest, { filterFreq: 2600, peak: 0.68, duration: 0.38 });
        oscNode(ac, dest, { freq: 500, type: 'sawtooth', peak: 0.2, attack: 0.002, duration: 0.28, freqEnd: 55 });
        oscNode(ac, dest, { freq: 1200, peak: 0.22, attack: 0.001, duration: 0.18 });
        break;
      }
      case 'doubleSlash': {
        // Two whooshes staggered
        [0, 0.18].forEach((delay) => {
          noiseNode(ac, dest, { filterFreq: 1600, peak: 0.4, duration: 0.22, delay });
          oscNode(ac, dest, { freq: 380, type: 'sawtooth', peak: 0.12, attack: 0.003, duration: 0.18, freqEnd: 55, delay });
        });
        break;
      }
      case 'shield': {
        // Metallic ring — high sine with harmonic
        oscNode(ac, dest, { freq: 1318, peak: 0.32, attack: 0.001, duration: 0.55 });
        oscNode(ac, dest, { freq: 2637, peak: 0.1, attack: 0.001, duration: 0.38 });
        break;
      }
      case 'fortressRipple': {
        // Deep bass boom + high ring
        oscNode(ac, dest, { freq: 65, type: 'triangle', peak: 0.58, attack: 0.003, duration: 0.42 });
        oscNode(ac, dest, { freq: 1175, peak: 0.18, attack: 0.002, duration: 0.58 });
        break;
      }
      case 'lightning': {
        // Electric sweep + high crackle noise
        oscNode(ac, dest, { freq: 80, type: 'sawtooth', peak: 0.28, attack: 0.002, duration: 0.32, freqEnd: 3200 });
        noiseNode(ac, dest, { filterFreq: 4000, filterType: 'highpass', Q: 2, peak: 0.32, duration: 0.38 });
        break;
      }
      case 'bleed': {
        // Three wet drip sounds — low noise + low tone
        [0, 0.13, 0.26].forEach((delay) => {
          noiseNode(ac, dest, { filterFreq: 200, peak: 0.28, attack: 0.005, duration: 0.18, delay });
          oscNode(ac, dest, { freq: 210, peak: 0.14, attack: 0.003, duration: 0.14, delay });
        });
        break;
      }
      case 'drain': {
        // Orb travel — sine sweep up then back down
        oscNode(ac, dest, { freq: 300, peak: 0.24, attack: 0.05, duration: 0.38, freqEnd: 720 });
        oscNode(ac, dest, { freq: 720, peak: 0.24, attack: 0.003, duration: 0.38, freqEnd: 240, delay: 0.38 });
        break;
      }
      case 'heal': {
        // Soft bell chord C5 + G5
        oscNode(ac, dest, { freq: 523, peak: 0.18, attack: 0.01, duration: 0.65 });
        oscNode(ac, dest, { freq: 784, peak: 0.14, attack: 0.01, duration: 0.55 });
        break;
      }
      case 'explosion': {
        // Bass boom (freq sweep down) + high crackle
        oscNode(ac, dest, { freq: 80, type: 'triangle', peak: 0.62, attack: 0.002, duration: 0.38, freqEnd: 28 });
        noiseNode(ac, dest, { filterFreq: 2800, filterType: 'highpass', peak: 0.42, duration: 0.32 });
        break;
      }
      case 'debuff': {
        // Descending warbling sawtooth
        oscNode(ac, dest, { freq: 520, type: 'sawtooth', peak: 0.2, attack: 0.01, duration: 0.42, freqEnd: 140 });
        break;
      }
      case 'buff': {
        // Ascending sparkle C5-E5-G5
        [523, 659, 784].forEach((freq, i) => {
          oscNode(ac, dest, { freq, peak: 0.14, attack: 0.008, duration: 0.2, delay: i * 0.065 });
        });
        break;
      }
      default:
        break;
    }
  } catch (_) { /* silently ignore */ }
}
