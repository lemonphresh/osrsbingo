import React, { useMemo } from 'react';
import { Box, HStack, Text, VStack, Badge, Wrap, WrapItem } from '@chakra-ui/react';

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const coord = (row, col) =>
  row == null || col == null ? '—' : `${COL_LABELS[col] ?? col}${row + 1}`;

const STATUS_META = {
  APPROVED: { label: 'Approved', color: '#4ade80', bg: '#0d1f13', border: '#1a4028' },
  REJECTED: { label: 'Vetoed', color: '#f87171', bg: '#1c0a0a', border: '#7f1d1d' },
  EXPIRED: { label: 'Expired', color: '#fcd34d', bg: '#1a0e00', border: '#713f12' },
  CLEARED: { label: 'Cleared', color: '#94a3b8', bg: '#0d1621', border: '#1e293b' },
};

const KIND_META = {
  SHOT: { label: 'Shot', color: '#38bdf8' },
  SKIP: { label: 'Skip', color: '#facc15' },
};

/**
 * Team-scoped audit trail of every shot/skip proposal that reached a terminal
 * state. Renders in the same green "terminal HUD" style as the shot log so the
 * two sit visually alongside each other.
 *
 * @param entries — from GET_BS_PROPOSAL_LOG
 * @param teams — [{teamId, teamName, members: [discordId]}] for name lookups
 * @param teamFilter — optional teamId; when set, only show entries firing for
 *   that team (the team-page audience). Admin page passes null to see both.
 * @param nameForDiscordId — optional (discordId) => displayName resolver
 */
export default function BSProposalLogPanel({ entries = [], teams = [], teamFilter = null, nameForDiscordId }) {
  const teamNameById = useMemo(() => {
    const m = new Map();
    for (const t of teams) m.set(t.teamId, t.teamName);
    return m;
  }, [teams]);

  const filtered = useMemo(() => {
    const scoped = teamFilter ? entries.filter((e) => e.firingTeamId === teamFilter) : entries;
    return [...scoped].sort((a, b) => new Date(b.resolvedAt) - new Date(a.resolvedAt));
  }, [entries, teamFilter]);

  const resolveName = (id) => (nameForDiscordId ? nameForDiscordId(id) ?? id : id);

  return (
    <Box
      bg="#091a10"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      overflow="hidden"
    >
      <Box bg="#060f0a" borderBottom="1px solid" borderColor="#1a4028" px={4} py={2}>
        <Text
          fontFamily="mono"
          fontSize="xs"
          color="#6b9e78"
          letterSpacing="widest"
          textTransform="uppercase"
        >
          Shot Proposals &amp; Skips
        </Text>
      </Box>
      <Box p={4}>
        {filtered.length === 0 ? (
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78" letterSpacing="wide">
            No proposals recorded yet. Vote history will appear here.
          </Text>
        ) : (
          <VStack align="stretch" spacing={2} maxH="360px" overflowY="auto">
            {filtered.map((entry) => (
              <LogRow
                key={entry.logId}
                entry={entry}
                teamName={teamNameById.get(entry.firingTeamId) ?? entry.firingTeamId}
                targetTeamName={
                  entry.targetTeamId
                    ? teamNameById.get(entry.targetTeamId) ?? entry.targetTeamId
                    : null
                }
                resolveName={resolveName}
              />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

function LogRow({ entry, teamName, targetTeamName, resolveName }) {
  const status = STATUS_META[entry.finalStatus] ?? STATUS_META.CLEARED;
  const kind = KIND_META[entry.kind] ?? KIND_META.SHOT;
  const when = new Date(entry.resolvedAt);
  const timeLabel = when.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const approvals = entry.approvals ?? [];
  const rejections = entry.rejections ?? [];
  const target =
    entry.kind === 'SKIP'
      ? entry.tileLabel ?? coord(entry.row, entry.col)
      : coord(entry.row, entry.col);

  return (
    <Box
      bg={status.bg}
      border="1px solid"
      borderColor={status.border}
      borderRadius="sm"
      px={3}
      py={2}
    >
      <HStack spacing={2} align="flex-start" mb={1.5} wrap="wrap">
        <Badge
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          bg="transparent"
          color={kind.color}
          border="1px solid"
          borderColor={kind.color}
        >
          {kind.label}
        </Badge>
        <Badge
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          bg="transparent"
          color={status.color}
          border="1px solid"
          borderColor={status.color}
        >
          {status.label}
        </Badge>
        <Text fontFamily="mono" fontSize="xs" color="#d4f0da" fontWeight="bold">
          {target}
        </Text>
        <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
          — proposed by <Text as="span" color="#d4f0da">{resolveName(entry.proposedBy)}</Text>
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="#6b9e78" ml="auto">
          {timeLabel}
        </Text>
      </HStack>
      <HStack spacing={4} fontFamily="mono" fontSize="10px" color="#6b9e78" mb={1} wrap="wrap">
        <Text>
          <Text as="span" color="#d4f0da">{teamName}</Text>
          {targetTeamName && (
            <>
              {' → '}
              <Text as="span" color="#d4f0da">{targetTeamName}</Text>
            </>
          )}
        </Text>
        <Text>Threshold {approvals.length}/{entry.threshold}</Text>
      </HStack>
      {(approvals.length > 0 || rejections.length > 0) && (
        <VStack align="stretch" spacing={1}>
          {approvals.length > 0 && (
            <Wrap spacing={1}>
              <WrapItem>
                <Text fontFamily="mono" fontSize="10px" color="#4ade80" letterSpacing="wide">
                  APPROVED:
                </Text>
              </WrapItem>
              {approvals.map((id) => (
                <WrapItem key={`ok-${id}`}>
                  <Badge
                    fontFamily="mono"
                    fontSize="10px"
                    bg="transparent"
                    color="#4ade80"
                    border="1px solid"
                    borderColor="#1a4028"
                  >
                    {resolveName(id)}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          )}
          {rejections.length > 0 && (
            <Wrap spacing={1}>
              <WrapItem>
                <Text fontFamily="mono" fontSize="10px" color="#f87171" letterSpacing="wide">
                  VETOED:
                </Text>
              </WrapItem>
              {rejections.map((id) => (
                <WrapItem key={`no-${id}`}>
                  <Badge
                    fontFamily="mono"
                    fontSize="10px"
                    bg="transparent"
                    color="#f87171"
                    border="1px solid"
                    borderColor="#7f1d1d"
                  >
                    {resolveName(id)}
                  </Badge>
                </WrapItem>
              ))}
            </Wrap>
          )}
        </VStack>
      )}
    </Box>
  );
}
