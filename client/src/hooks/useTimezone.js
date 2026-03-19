'use strict';
import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'cf_tz_utc';
const EV = 'cf_tz_change';

export function useTimezone() {
  const [utc, setUtc] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    const sync = () => {
      try { setUtc(localStorage.getItem(LS_KEY) === 'true'); } catch {}
    };
    window.addEventListener(EV, sync);
    return () => window.removeEventListener(EV, sync);
  }, []);

  const toggle = useCallback(() => {
    try {
      const next = localStorage.getItem(LS_KEY) !== 'true';
      localStorage.setItem(LS_KEY, String(next));
      window.dispatchEvent(new Event(EV));
    } catch {}
  }, []);

  return { utc, toggle };
}

export function fmtTs(date, utc) {
  if (!date) return '';
  const d = new Date(date);
  return utc
    ? d.toLocaleString(undefined, { timeZone: 'UTC' }) + ' UTC'
    : d.toLocaleString();
}

export function fmtDate(date, utc) {
  if (!date) return '';
  const d = new Date(date);
  return utc
    ? d.toLocaleDateString(undefined, { timeZone: 'UTC' }) + ' UTC'
    : d.toLocaleDateString();
}
