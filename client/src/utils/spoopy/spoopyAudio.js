import introSound from '../../assets/spoopy/spoopyintro.mp3';
import taskCompleteSound from '../../assets/spoopy/spoopytaskcomplete.mp3';
import gameOverSound from '../../assets/spoopy/this_is_halloween.mp3';
import flashlightClickSound from '../../assets/spoopy/flashlightclick.mp3';
import skeleSound from '../../assets/spoopy/skelesound.mp3';

// Each entry is { src, loop? }. loop:true keeps the clip running until
// stopSpoopySound is called; omit for one-shot playback. The skele clip
// plays through once when the flashlight is turned on and stays stopped
// unless the user toggles the light off and on again.
const SOURCES = {
  intro:           { src: introSound },
  taskComplete:    { src: taskCompleteSound },
  gameOver:        { src: gameOverSound },
  flashlightClick: { src: flashlightClickSound },
  skele:           { src: skeleSound },
};

const audioByName = new Map();

function getAudio(name) {
  const def = SOURCES[name];
  if (typeof Audio === 'undefined' || !def) return null;
  if (!audioByName.has(name)) {
    const audio = new Audio(def.src);
    audio.preload = 'auto';
    audio.volume = 0.8;
    audio.loop = Boolean(def.loop);
    audioByName.set(name, audio);
  }
  return audioByName.get(name);
}

// Browsers block programmatic `.play()` until the user has interacted with
// the page. Mirrors the battleship warm-up: on the first pointer/key/touch
// event we silently prime each pooled Audio element so future `.play()`
// calls from subscription handlers (including in backgrounded tabs) are
// allowed through. Preloads bytes immediately but defers the unlock gesture
// until there's genuine user activity.
let spoopyWarmupArmed = false;
export function warmUpSpoopySounds() {
  Object.keys(SOURCES).forEach((name) => getAudio(name)?.load?.());
  if (spoopyWarmupArmed || typeof window === 'undefined') return;
  spoopyWarmupArmed = true;
  const kick = () => {
    for (const name of Object.keys(SOURCES)) {
      const audio = getAudio(name);
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

export function playSpoopySound(name) {
  const audio = getAudio(name);
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  const result = audio.play();
  result?.catch?.(() => {});
}

export function stopSpoopySound(name) {
  const audio = getAudio(name);
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

export function getCompletedSpoopyTileIds(board) {
  return new Set(
    Object.entries(board?.tiles ?? {})
      .filter(([, tile]) => tile?.status === 'complete')
      .map(([tileId]) => tileId)
  );
}

export function hasNewSpoopyCompletion(previousIds, board) {
  if (!(previousIds instanceof Set)) return false;
  return [...getCompletedSpoopyTileIds(board)].some((tileId) => !previousIds.has(tileId));
}
