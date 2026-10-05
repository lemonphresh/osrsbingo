import introSound from '../../assets/spoopy/spoopyintro.mp3';
import taskCompleteSound from '../../assets/spoopy/spoopytaskcomplete.mp3';
import gameOverSound from '../../assets/spoopy/this_is_halloween.mp3';
import flashlightClickSound from '../../assets/spoopy/flashlightclick.mp3';
import skeleSound from '../../assets/spoopy/skelesound.mp3';

// Each entry is { src, loop? }. loop:true keeps the clip running until
// stopSpoopySound is called (used for the dancing skeleton while the
// flashlight beam is on).
const SOURCES = {
  intro:           { src: introSound },
  taskComplete:    { src: taskCompleteSound },
  gameOver:        { src: gameOverSound },
  flashlightClick: { src: flashlightClickSound },
  skele:           { src: skeleSound, loop: true },
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

export function warmUpSpoopySounds() {
  Object.keys(SOURCES).forEach((name) => getAudio(name)?.load?.());
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
