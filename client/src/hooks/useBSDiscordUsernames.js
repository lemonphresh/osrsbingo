import { useState, useEffect } from 'react';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// Resolves an array of discord user IDs → [{ discordUserId, discordUsername }]
// knownNames: optional { [discordUserId]: username } for IDs we already know
export default function useDiscordUsernames(ids, knownNames = {}) {
  const [nameMap, setNameMap] = useState(knownNames);

  useEffect(() => {
    setNameMap((prev) => ({ ...knownNames, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(knownNames)]);

  useEffect(() => {
    const missing = (ids ?? []).filter((id) => id && !nameMap[id]);
    if (!missing.length) return;
    missing.forEach((id) => {
      fetch(`${API_BASE}/discuser/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const name = d?.global_name ?? d?.username ?? null;
          if (name) setNameMap((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ids)]);

  return (ids ?? []).map((id) => ({ discordUserId: id, discordUsername: nameMap[id] ?? id }));
}
