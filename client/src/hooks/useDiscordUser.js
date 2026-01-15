import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

// Cache to prevent duplicate requests
const localCache = new Map();

export const useDiscordUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/user/${id}`);

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
  const validIds = userIds.filter((id) => /^\d{17,19}$/.test(id));

  if (validIds.length === 0) return {};

  try {
    const response = await fetch(`${process.env.REACT_APP_SERVER_URL}/users/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds: validIds }),
    });

    if (!response.ok) throw new Error('Failed to fetch users');

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Discord users:', error);
    return {};
  }
};

export default useDiscordUser;
