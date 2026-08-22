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

const VOLUME_KEY = 'bsVolume';
const DEFAULT_VOLUME = 0.7;

// Cache of every audio instance created so a live volume change updates them
// mid-playback (mostly relevant for the game-over song).
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
  for (const audio of liveInstances) {
    try { audio.volume = next; } catch (_) {}
  }
  for (const listener of volumeListeners) {
    try { listener(next); } catch (_) {}
  }
}

export function subscribeBSVolume(listener) {
  volumeListeners.add(listener);
  return () => volumeListeners.delete(listener);
}

function track(audio) {
  liveInstances.add(audio);
  const cleanup = () => liveInstances.delete(audio);
  audio.addEventListener('ended', cleanup);
  audio.addEventListener('pause', cleanup);
  audio.addEventListener('error', cleanup);
  return audio;
}

// Holds the game-over song instance so it can be stopped if needed
let songInstance = null;

export function playBSSound(name) {
  const src = SOUNDS[name];
  if (!src) return;
  const audio = new Audio(src);
  audio.volume = currentVolume;
  track(audio);
  audio.play().catch(() => {});
  return audio;
}

export function playBSSong() {
  if (songInstance) return; // already playing
  songInstance = new Audio(bsSongSrc);
  songInstance.loop = false;
  songInstance.volume = currentVolume;
  track(songInstance);
  songInstance.play().catch(() => {});
  songInstance.addEventListener('ended', () => { songInstance = null; });
}

export function stopBSSong() {
  if (!songInstance) return;
  songInstance.pause();
  songInstance.currentTime = 0;
  songInstance = null;
}

export function setSongMuted(muted) {
  if (songInstance) songInstance.muted = muted;
}

export function isSongMuted() {
  return songInstance ? songInstance.muted : false;
}
