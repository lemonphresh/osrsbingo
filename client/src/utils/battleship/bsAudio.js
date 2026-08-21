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

// Holds the game-over song instance so it can be stopped if needed
let songInstance = null;

export function playBSSound(name) {
  const src = SOUNDS[name];
  if (!src) return;
  const audio = new Audio(src);
  audio.play().catch(() => {});
  return audio;
}

export function playBSSong() {
  if (songInstance) return; // already playing
  songInstance = new Audio(bsSongSrc);
  songInstance.loop = false;
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
