import { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

let _cache = null;
let _promise = null;

function fetchRegistry() {
  if (_cache) return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = fetch(`${API_BASE}/api/content-registry`)
    .then((res) => {
      if (!res.ok) throw new Error(`content-registry fetch failed: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      _cache = data;
      _promise = null;
      return data;
    })
    .catch((err) => {
      _promise = null;
      throw err;
    });
  return _promise;
}

export default function useContentRegistry() {
  const [data, setData] = useState(_cache);
  const [loading, setLoading] = useState(!_cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (_cache) return;
    fetchRegistry()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return {
    soloBosses: data?.soloBosses ?? null,
    raids:      data?.raids      ?? null,
    skills:     data?.skills     ?? null,
    minigames:  data?.minigames  ?? null,
    clueTiers:  data?.clueTiers  ?? null,
    // Group dashboard metric selectors — full WOM metric space
    bossMetricOptions:     data?.groupDashboard?.bossOptions     ?? null,
    skillMetricOptions:    data?.groupDashboard?.skillOptions    ?? null,
    clueMetricOptions:     data?.groupDashboard?.clueOptions     ?? null,
    activityMetricOptions: data?.groupDashboard?.activityOptions ?? null,
    loading,
    error,
  };
}
