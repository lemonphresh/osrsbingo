import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { HStack, Text, IconButton, Tooltip } from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { GET_USER_BY_DISCORD_ID } from '../../graphql/queries';
import { SPOOPY_COLORS } from './spoopyTheme';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// Resolves a discord user id to a display name via the site's user table first,
// then falls back to a live Discord API lookup through the server's /discuser
// proxy. Matches the pattern used by battleship's TeamsTab MemberTag.
export default function SpoopyMemberTag({ discordId, onRemove, isUpdating }) {
  const [resolvedName, setResolvedName] = useState(null);

  const { loading } = useQuery(GET_USER_BY_DISCORD_ID, {
    variables: { discordUserId: discordId },
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      const linked = data?.getUserByDiscordId;
      if (linked?.displayName || linked?.username || linked?.rsn) {
        setResolvedName(linked.displayName ?? linked.username ?? linked.rsn);
      } else {
        // Fall back to the server's Discord proxy so we can still show a
        // sensible label for members who haven't linked their site profile.
        fetch(`${API_BASE}/discuser/${discordId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.global_name || d?.username) {
              setResolvedName(d.global_name ?? d.username);
            }
          })
          .catch(() => {});
      }
    },
  });

  const label = resolvedName ?? (loading ? '…' : discordId);

  return (
    <HStack
      justify="space-between"
      align="center"
      px={2}
      py={1}
      bg={SPOOPY_COLORS.night}
      borderRadius="sm"
    >
      <Tooltip label={discordId} placement="right" hasArrow>
        <Text fontSize="xs" color={SPOOPY_COLORS.paper} noOfLines={1}>
          {label}
        </Text>
      </Tooltip>
      {onRemove && (
        <IconButton
          icon={<DeleteIcon />}
          size="xs"
          variant="ghost"
          color={SPOOPY_COLORS.paper}
          aria-label={`remove ${label}`}
          isDisabled={isUpdating}
          onClick={() => onRemove(discordId)}
        />
      )}
    </HStack>
  );
}
