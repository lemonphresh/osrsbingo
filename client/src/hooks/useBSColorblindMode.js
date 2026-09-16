import { useCallback, useEffect, useRef, useState } from 'react';

export const BS_COLORBLIND_STORAGE_KEY = 'bsColorblindMode';
const BS_COLORBLIND_CHANGE_EVENT = 'bs-colorblind-mode-change';

export function readBSColorblindMode() {
  try {
    return localStorage.getItem(BS_COLORBLIND_STORAGE_KEY) === 'true';
  } catch (_) {
    return false;
  }
}

export default function useBSColorblindMode() {
  const [colorblindMode, setColorblindModeState] = useState(readBSColorblindMode);
  const currentValueRef = useRef(colorblindMode);

  useEffect(() => {
    const sync = () => {
      const next = readBSColorblindMode();
      currentValueRef.current = next;
      setColorblindModeState(next);
    };
    window.addEventListener('storage', sync);
    window.addEventListener(BS_COLORBLIND_CHANGE_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(BS_COLORBLIND_CHANGE_EVENT, sync);
    };
  }, []);

  const setColorblindMode = useCallback((nextValue) => {
    const next = Boolean(
      typeof nextValue === 'function' ? nextValue(currentValueRef.current) : nextValue
    );
    currentValueRef.current = next;
    setColorblindModeState(next);
    try {
      localStorage.setItem(BS_COLORBLIND_STORAGE_KEY, String(next));
      window.dispatchEvent(new Event(BS_COLORBLIND_CHANGE_EVENT));
    } catch (_) {
      // The visual preference still works for this mount when storage is unavailable.
    }
  }, []);

  const toggleColorblindMode = useCallback(() => {
    setColorblindMode((current) => !current);
  }, [setColorblindMode]);

  return { colorblindMode, setColorblindMode, toggleColorblindMode };
}
