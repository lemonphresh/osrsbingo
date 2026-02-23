import { useState, useEffect, useRef } from 'react';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useAppVersion = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialVersion = useRef(null);
  const pendingReload = useRef(false);

  useEffect(() => {
    const reload = () => window.location.reload();

    const handleUpdate = () => {
      if (document.visibilityState === 'hidden') {
        reload();
      } else {
        pendingReload.current = true;
        setUpdateAvailable(true);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pendingReload.current) {
        reload();
      }
    };

    const check = async () => {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`);
        if (!res.ok) return;
        const { buildTime } = await res.json();
        if (initialVersion.current === null) {
          initialVersion.current = buildTime;
        } else if (buildTime !== initialVersion.current) {
          handleUpdate();
        }
      } catch {
        // silently ignore — version.json may not exist in dev
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    check();
    const id = setInterval(check, POLL_INTERVAL);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  return updateAvailable;
};
