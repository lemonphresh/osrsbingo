import { useCallback, useEffect, useState } from 'react';
import { SPOOPY_COLORS } from './spoopyTheme';

// Shared dark-mode state for the spoopy event surface. Persisted in
// localStorage; kept in sync across every mounted component in the same
// window via a custom event so toggling on the board updates open modals
// too. (The native `storage` event only fires across different tabs.)

const LS_KEY = 'spoopyBoardDarkMode';
const EVENT = 'spoopy:darkmode';

// Default is dark mode. A missing key means the user has never toggled, so
// we start them in nightfall (matches the event's aesthetic and avoids the
// jarring bright-paper first paint). Only an explicit 'false' opts out.
function readStored() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw === null) return true;
    return raw === 'true';
  } catch (_) {
    return true;
  }
}

function writeStored(v) {
  try {
    localStorage.setItem(LS_KEY, String(v));
  } catch (_) {}
  window.dispatchEvent(new CustomEvent(EVENT, { detail: v }));
}

// Reads dark mode + exposes a setter. Also returns pre-derived color tokens
// modals can apply to their backgrounds and text without re-doing the
// ternary each place. Keeps the modal treatments consistent.
export function useSpoopyTheme() {
  const [darkMode, setDarkModeState] = useState(readStored);

  useEffect(() => {
    const handler = (e) => setDarkModeState(!!e.detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setDarkMode = useCallback((next) => {
    setDarkModeState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      writeStored(value);
      return value;
    });
  }, []);

  return {
    darkMode,
    setDarkMode,
    // Base color of the paper / modal fill
    surfaceBg: darkMode ? SPOOPY_COLORS.nightMist : SPOOPY_COLORS.paper,
    // Ink color on top of the surface
    surfaceInk: darkMode ? SPOOPY_COLORS.paper : SPOOPY_COLORS.paperInk,
    // Edge / border color that reads well against the surface
    surfaceEdge: darkMode ? SPOOPY_COLORS.night : SPOOPY_COLORS.paperEdge,
    // Softer variant of the surface used for "recessed" panels within
    // modals (i.e. the task callout inside the trick-or-treat dialog).
    surfaceRecessed: darkMode ? SPOOPY_COLORS.nightDeep : SPOOPY_COLORS.paperShadow,
  };
}
