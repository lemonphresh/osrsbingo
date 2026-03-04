/**
 * Persist/retrieve a captain's token for a given draft room.
 * This lets anonymous users (incognito, no account) act as captains.
 */

const key = (roomId) => `draft_captain_${roomId}`;

export function saveCaptainSession(roomId, teamIndex, captainToken) {
  try {
    localStorage.setItem(key(roomId), JSON.stringify({ teamIndex, captainToken }));
  } catch (_) {}
}

export function loadCaptainSession(roomId) {
  try {
    const raw = localStorage.getItem(key(roomId));
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function clearCaptainSession(roomId) {
  try {
    localStorage.removeItem(key(roomId));
  } catch (_) {}
}
