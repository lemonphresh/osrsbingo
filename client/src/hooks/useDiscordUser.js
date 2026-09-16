import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

// Cache to prevent duplicate requests
const localCache = new Map();
const API_BASE = process.env.REACT_APP_SERVER_URL || '';
const DISCORD_BATCH_SIZE = 20;

export const useDiscordUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchUser = useCallback(
    debounce(async (id) => {
      if (!id || !/^\d{17,19}$/.test(id)) {
        setUser(null);
        setError(null);
        return;
      }

      // Check local cache first
      if (localCache.has(id)) {
        setUser(localCache.get(id));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/discuser/${id}`);

        if (!response.ok) {
          throw new Error(response.status === 404 ? 'User not found' : 'Failed to fetch');
        }

        const data = await response.json();
        localCache.set(id, data);
        setUser(data);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, 500), // 500ms debounce
    []
  );

  useEffect(() => {
    fetchUser(userId);
  }, [userId, fetchUser]);

  return { user, loading, error };
};

// Batch fetch for multiple users
export const fetchDiscordUsers = async (userIds) => {
  const validIds = [...new Set((userIds ?? []).map(String).filter((id) => /^\d{17,19}$/.test(id)))];

  if (validIds.length === 0) return {};

  const results = {};
  const missingIds = [];
  validIds.forEach((id) => {
    if (localCache.has(id)) results[id] = localCache.get(id);
    else missingIds.push(id);
  });

  for (let start = 0; start < missingIds.length; start += DISCORD_BATCH_SIZE) {
    const batch = missingIds.slice(start, start + DISCORD_BATCH_SIZE);
    try {
      const response = await fetch(`${API_BASE}/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: batch }),
      });

      if (!response.ok) throw new Error(`Batch lookup failed (${response.status})`);

      const batchResults = await response.json();
      Object.entries(batchResults).forEach(([id, user]) => {
        if (!user?.error) {
          localCache.set(id, user);
          results[id] = user;
        }
      });
    } catch (error) {
      console.error('Failed to fetch Discord user batch:', error);
    }
  }

  return results;
};

export default useDiscordUser;
