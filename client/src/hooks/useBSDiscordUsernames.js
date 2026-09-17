import { useState, useEffect } from 'react';
import { fetchDiscordUsers } from './useDiscordUser';

// Resolves an array of discord user IDs → [{ discordUserId, discordUsername }]
// knownNames: optional { [discordUserId]: username } for IDs we already know
export default function useDiscordUsernames(ids, knownNames = {}, { guildId } = {}) {
  const [nameMap, setNameMap] = useState(knownNames);

  useEffect(() => {
    setNameMap((prev) => ({ ...knownNames, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(knownNames)]);

  useEffect(() => {
    const missing = (ids ?? []).filter((id) => id && !nameMap[id]);
    if (!missing.length) return undefined;

    let cancelled = false;
    const applyUsers = (users) => {
      if (cancelled) return;
      const resolvedNames = {};
      Object.entries(users).forEach(([id, user]) => {
        const name = user?.globalName ?? user?.global_name ?? user?.username ?? null;
        if (name) resolvedNames[id] = name;
      });
      if (Object.keys(resolvedNames).length) {
        setNameMap((prev) => ({ ...prev, ...resolvedNames }));
      }
    };

    fetchDiscordUsers(missing, { guildId, onBatch: applyUsers }).then(applyUsers);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId, JSON.stringify(ids)]);

  return (ids ?? []).map((id) => ({ discordUserId: id, discordUsername: nameMap[id] ?? id }));
}
