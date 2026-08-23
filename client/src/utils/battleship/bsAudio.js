import directhitSrc  from '../../assets/bs/directhit.wav';
import splashSrc     from '../../assets/bs/splash.wav';
import gogogoSrc     from '../../assets/bs/gogogo.wav';
import radarSrc      from '../../assets/bs/radar.wav';
import imhitimhitSrc from '../../assets/bs/imhitimhit.wav';
import bsSongSrc     from '../../assets/bs/bs-song.mp3';

const SOUNDS = {
  directhit:  directhitSrc,
  splash:     splashSrc,
  gogogo:     gogogoSrc,
  radar:      radarSrc,
  imhitimhit: imhitimhitSrc,
  bssong:     bsSongSrc,
};

// Per-sound gain multipliers to normalize loudness across the source files.
// Multiplied into the slider volume so every sound sits at a similar perceived
// level at any given slider position. Tuned by ear at volume=1.0.
const SOUND_GAINS = {
  directhit:  0.35,
  imhitimhit: 0.15,
  splash:     0.15,
  gogogo:     0.15,
  radar:      0.5,
  bssong:     0.35,
};

const VOLUME_KEY = 'bsVolume';
const DEFAULT_VOLUME = 0.7;

// Cache of every audio instance created so a live volume change updates them
// mid-playback. Stored as { audio, gain } so we can re-apply the per-sound
// gain multiplier when the slider moves.
const liveInstances = new Set();
const volumeListeners = new Set();

function readStoredVolume() {
  if (typeof localStorage === 'undefined') return DEFAULT_VOLUME;
  const raw = localStorage.getItem(VOLUME_KEY);
  if (raw == null) return DEFAULT_VOLUME;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return DEFAULT_VOLUME;
  return Math.max(0, Math.min(1, parsed));
}

let currentVolume = readStoredVolume();

export function getBSVolume() {
  return currentVolume;
}

export function setBSVolume(v) {
  const next = Math.max(0, Math.min(1, Number(v) || 0));
  currentVolume = next;
  try {
    localStorage.setItem(VOLUME_KEY, String(next));
  } catch (_) {
    // ignore quota errors
  }
  for (const entry of liveInstances) {
    try { entry.audio.volume = Math.max(0, Math.min(1, next * entry.gain)); } catch (_) {}
  }
  for (const listener of volumeListeners) {
    try { listener(next); } catch (_) {}
  }
}

export function subscribeBSVolume(listener) {
  volumeListeners.add(listener);
  return () => volumeListeners.delete(listener);
}

// Every audio ever created ends up in this map so a live volume change
// re-applies to it. Pooled clips stay for the lifetime of the tab; the
// one-off game-over song is removed on ended/error.
const trackedByAudio = new WeakMap();
function track(audio, gain = 1, { persistent = false } = {}) {
  const existing = trackedByAudio.get(audio);
  if (existing) {
    existing.gain = gain;
    return audio;
  }
  const entry = { audio, gain };
  trackedByAudio.set(audio, entry);
  liveInstances.add(entry);
  if (!persistent) {
    const cleanup = () => {
      liveInstances.delete(entry);
      trackedByAudio.delete(audio);
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
  }
  return audio;
}

// Holds the game-over song instance so it can be stopped/paused/resumed.
let songInstance = null;
const songListeners = new Set();

export function getBSSongState() {
  if (!songInstance) return 'stopped';
  return songInstance.paused ? 'paused' : 'playing';
}

export function subscribeBSSongState(cb) {
  songListeners.add(cb);
  return () => songListeners.delete(cb);
}

function notifySongState() {
  const state = getBSSongState();
  for (const cb of songListeners) {
    try { cb(state); } catch (_) {}
  }
}

export function pauseBSSong() {
  if (songInstance && !songInstance.paused) songInstance.pause();
}

export function toggleBSSong() {
  if (getBSSongState() === 'playing') pauseBSSong();
  else playBSSong();
}

// One-shot autoplay warm-up. Browsers block programmatic .play() until the
// user has interacted with the page; without this, sounds triggered by a
// subscription while the tab is backgrounded silently fail. Attaches a
// one-shot pointer/keyboard listener that plays a muted primer on each
// pooled Audio element, then removes itself.
let warmedUp = false;
const audioPool = new Map(); // name -> Audio (persistent, reused)

function getPooledAudio(name) {
  const src = SOUNDS[name];
  if (!src) return null;
  let audio = audioPool.get(name);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    audioPool.set(name, audio);
  }
  return audio;
}

export function warmUpBSAudio() {
  if (warmedUp) return;
  const kick = () => {
    if (warmedUp) return;
    warmedUp = true;
    for (const name of Object.keys(SOUNDS)) {
      const audio = getPooledAudio(name);
      if (!audio) continue;
      const restoreVolume = audio.volume;
      audio.muted = true;
      audio.volume = 0;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
          audio.volume = restoreVolume;
        }).catch(() => {
          audio.muted = false;
          audio.volume = restoreVolume;
        });
      }
    }
    window.removeEventListener('pointerdown', kick);
    window.removeEventListener('keydown', kick);
    window.removeEventListener('touchstart', kick);
  };
  window.addEventListener('pointerdown', kick, { once: true });
  window.addEventListener('keydown', kick, { once: true });
  window.addEventListener('touchstart', kick, { once: true, passive: true });
}

export function playBSSound(name) {
  const audio = getPooledAudio(name);
  if (!audio) return;
  const gain = SOUND_GAINS[name] ?? 1;
  audio.volume = Math.max(0, Math.min(1, currentVolume * gain));
  // Reusing a pooled Audio means we need to rewind before replaying —
  // otherwise consecutive fires (rapid-fire radar pings) don't start over.
  try { audio.currentTime = 0; } catch (_) {}
  // Pooled audio stays tracked for the lifetime of the tab so a mid-play
  // volume drag still applies. Idempotent — no duplicate listeners.
  track(audio, gain, { persistent: true });
  audio.play().catch(() => {});
  return audio;
}

export function playBSSong() {
  // Already playing? no-op. Paused? resume. Otherwise start fresh.
  if (songInstance) {
    if (songInstance.paused) {
      songInstance.play().catch(() => {});
      notifySongState();
    }
    return;
  }
  const gain = SOUND_GAINS.bssong ?? 1;
  songInstance = new Audio(bsSongSrc);
  songInstance.loop = false;
  songInstance.volume = Math.max(0, Math.min(1, currentVolume * gain));
  track(songInstance, gain);
  songInstance.addEventListener('ended', () => {
    songInstance = null;
    notifySongState();
  });
  songInstance.addEventListener('play', notifySongState);
  songInstance.addEventListener('pause', notifySongState);
  songInstance.play().catch(() => {});
}

export function stopBSSong() {
  if (!songInstance) return;
  songInstance.pause();
  songInstance.currentTime = 0;
  songInstance = null;
  notifySongState();
}

export function setSongMuted(muted) {
  if (songInstance) songInstance.muted = muted;
}

export function isSongMuted() {
  return songInstance ? songInstance.muted : false;
}
