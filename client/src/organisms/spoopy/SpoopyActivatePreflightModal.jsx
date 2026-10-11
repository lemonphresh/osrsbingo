import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  Tooltip,
} from '@chakra-ui/react';
import { SPOOPY_COLORS, SPOOPY_FONTS } from './spoopyTheme';
import { formatCandy } from './spoopyCurrency';
import { GET_USER_BY_DISCORD_ID } from '../../graphql/queries';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// Resolves one discord user id into the best-available display name. Order
// matches SpoopyMemberTag: linked site user → /discuser Discord API proxy →
// raw id as the last-ditch fallback. Shows "…" during the initial lookup
// so the row doesn't flash the raw id before resolving. Tooltip surfaces
// the raw id for admins who need to cross-reference.
function PreflightMemberRow({ discordId }) {
  const [resolvedName, setResolvedName] = useState(null);
  const { loading } = useQuery(GET_USER_BY_DISCORD_ID, {
    variables: { discordUserId: discordId },
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      const linked = data?.getUserByDiscordId;
      if (linked?.displayName || linked?.username || linked?.rsn) {
        setResolvedName(linked.displayName ?? linked.username ?? linked.rsn);
        return;
      }
      fetch(`${API_BASE}/discuser/${discordId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.global_name || d?.username) {
            setResolvedName(d.global_name ?? d.username);
          }
        })
        .catch(() => {});
    },
  });
  const label = resolvedName ?? (loading ? '…' : discordId);
  return (
    <HStack spacing={2} fontSize="xs">
      <Text opacity={0.5}>·</Text>
      <Tooltip label={discordId} placement="right" hasArrow>
        <Text noOfLines={1}>{label}</Text>
      </Tooltip>
    </HStack>
  );
}

// Pre-flight overview shown before flipping an event from SETUP to ACTIVE.
// Surfaces every piece of state a site admin would want to triple-check:
// board shape, team roster readiness (discord channel / role / members /
// mossy assignment), curfew windows, prize pool, WOM wiring, and any
// per-tile pending drop overrides.
//
// Split into:
//   - blockers (red; disable the "go live" button) — things that would
//     brick the event if we flipped now
//   - warnings (yellow; informational) — things that work but might be
//     intentional omissions
//   - a concise overview of event + teams + board for visual confirmation
//
// Called from SpoopyAdminPage in place of the previous window.confirm().

function formatDateTime(value) {
  if (!value) return null;
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleString();
  } catch {
    return null;
  }
}

function buildPreflight(event) {
  const teams = event.teams ?? [];
  const board = event.board ?? {};
  const dims = board.dimensions ?? { rows: 0, cols: 0 };
  const tiles = Array.isArray(board.tiles) ? board.tiles : [];
  const startingTileIds = event.startingTileIds ?? [];
  const candybagTileId = board.candybagTileId ?? null;

  const tileCounts = tiles.reduce((acc, t) => {
    acc[t.tile_type] = (acc[t.tile_type] || 0) + 1;
    return acc;
  }, {});

  // Count tiles with override declared but drop list still pending (empty
  // array). These import fine but render "accepted drops pending" to
  // players — fine during setup, worth flagging before going live.
  const content = event.contentById ?? {};
  let pendingDropsCount = 0;
  for (const c of Object.values(content)) {
    if (c?.task?.kind === 'uniques' && Array.isArray(c.task.acceptable_drops) && c.task.acceptable_drops.length === 0) {
      pendingDropsCount++;
      continue;
    }
    for (const letter of ['a', 'b']) {
      const opt = c?.dialog?.options?.[letter];
      if (opt?.task?.kind === 'uniques' && Array.isArray(opt.task.acceptable_drops) && opt.task.acceptable_drops.length === 0) {
        pendingDropsCount++;
      }
    }
  }

  const blockers = [];
  if (teams.length === 0) blockers.push('no teams added yet');
  if (dims.rows === 0 || dims.cols === 0) blockers.push('board not imported');
  if (tiles.length === 0) blockers.push('imported board has no tiles');
  if (startingTileIds.length === 0) blockers.push('no starting tile placed on the board');
  if (!candybagTileId) blockers.push('no candybag (spooky house) tile on the board');

  const warnings = [];
  const teamsNoMembers = teams.filter((t) => (t.members?.length ?? 0) === 0);
  if (teamsNoMembers.length > 0) {
    warnings.push(
      `${teamsNoMembers.length} team${teamsNoMembers.length === 1 ? '' : 's'} have no members (${teamsNoMembers
        .map((t) => t.teamName)
        .join(', ')})`,
    );
  }
  const teamsNoChannel = teams.filter((t) => !t.discordChannelId);
  if (teamsNoChannel.length > 0) {
    warnings.push(
      `${teamsNoChannel.length} team${teamsNoChannel.length === 1 ? '' : 's'} have no discord channel — bot submissions won't work`,
    );
  }
  const teamsNoRole = teams.filter((t) => !t.discordRoleId);
  if (teamsNoRole.length > 0) {
    warnings.push(
      `${teamsNoRole.length} team${teamsNoRole.length === 1 ? '' : 's'} have no discord role — won't get pings on event start / one-hour / scary house / game over`,
    );
  }
  if (!event.eventPassword) warnings.push('no event password set — players can join freely');
  if (!event.curfewStart) warnings.push('no curfew start time — status will snap to active now');
  if (!event.curfewEnd) warnings.push('no curfew end time — event will never auto-complete');
  if (!event.womCompetitionId) warnings.push("no wom competition linked — skilling/kc progress won't auto-fill");
  if (pendingDropsCount > 0) {
    warnings.push(`${pendingDropsCount} uniques task${pendingDropsCount === 1 ? '' : 's'} still show "drops pending" to players`);
  }

  return {
    blockers,
    warnings,
    teams,
    board: { dims, tiles, startingTileIds, candybagTileId, tileCounts },
    pendingDropsCount,
  };
}

function SectionLabel({ children }) {
  return (
    <Text
      fontSize="xs"
      opacity={0.6}
      textTransform="uppercase"
      letterSpacing="wider"
      fontFamily="mono"
    >
      {children}
    </Text>
  );
}

function Row({ label, children }) {
  return (
    <HStack justify="space-between" align="start" spacing={4}>
      <Text fontSize="sm" opacity={0.75}>
        {label}
      </Text>
      <Box fontSize="sm" textAlign="right">
        {children}
      </Box>
    </HStack>
  );
}

function TeamItem({ team }) {
  const members = team.members ?? [];
  const hasChannel = Boolean(team.discordChannelId);
  const hasRole = Boolean(team.discordRoleId);
  return (
    <AccordionItem
      border="none"
      bg={SPOOPY_COLORS.nightDeep}
      borderRadius="md"
      borderLeft="4px solid"
      borderLeftColor={team.color || SPOOPY_COLORS.pumpkin}
      overflow="hidden"
    >
      <AccordionButton
        px={3}
        py={2}
        _hover={{ bg: SPOOPY_COLORS.nightMist }}
        _expanded={{ bg: SPOOPY_COLORS.nightMist }}
      >
        <HStack flex="1" justify="space-between" align="center" spacing={3}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="bold" color={SPOOPY_COLORS.paper}>
              {team.teamName}
            </Text>
            <Text fontSize="xs" opacity={0.6} color={SPOOPY_COLORS.paper}>
              mossy clue #{team.mossyWildyLocation ?? '?'} · {members.length} member{members.length === 1 ? '' : 's'}
            </Text>
          </VStack>
          <HStack spacing={1} flexWrap="wrap" justify="end">
            <Badge
              variant="subtle"
              colorScheme={hasChannel ? 'green' : 'red'}
              fontSize="10px"
              fontFamily="mono"
            >
              {hasChannel ? 'channel' : 'no channel'}
            </Badge>
            <Badge
              variant="subtle"
              colorScheme={hasRole ? 'green' : 'yellow'}
              fontSize="10px"
              fontFamily="mono"
            >
              {hasRole ? 'role' : 'no role'}
            </Badge>
            <Badge
              variant="subtle"
              colorScheme={members.length > 0 ? 'green' : 'red'}
              fontSize="10px"
              fontFamily="mono"
            >
              {members.length > 0 ? `${members.length} px` : 'empty'}
            </Badge>
          </HStack>
        </HStack>
        <AccordionIcon color={SPOOPY_COLORS.paper} ml={2} />
      </AccordionButton>
      <AccordionPanel px={3} py={3} bg={SPOOPY_COLORS.night}>
        <VStack align="stretch" spacing={2}>
          <HStack justify="space-between" fontSize="xs" opacity={0.75}>
            <Text fontFamily="mono">channel id</Text>
            <Text fontFamily="mono">{team.discordChannelId || '— none —'}</Text>
          </HStack>
          <HStack justify="space-between" fontSize="xs" opacity={0.75}>
            <Text fontFamily="mono">role id</Text>
            <Text fontFamily="mono">{team.discordRoleId || '— none —'}</Text>
          </HStack>
          <Divider borderColor={SPOOPY_COLORS.nightMist} />
          <Text
            fontSize="10px"
            opacity={0.6}
            textTransform="uppercase"
            letterSpacing="wider"
            fontFamily="mono"
          >
            members ({members.length})
          </Text>
          {members.length === 0 ? (
            <Text fontSize="sm" opacity={0.5} fontStyle="italic">
              no members on this team
            </Text>
          ) : (
            <VStack align="stretch" spacing={1}>
              {members.map((discordId) => (
                <PreflightMemberRow key={discordId} discordId={discordId} />
              ))}
            </VStack>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}

export default function SpoopyActivatePreflightModal({
  isOpen,
  onClose,
  event,
  onConfirm,
  isConfirming,
}) {
  const summary = useMemo(() => (event ? buildPreflight(event) : null), [event]);
  if (!event || !summary) return null;

  const canGoLive = summary.blockers.length === 0 && !isConfirming;
  const curfewStart = formatDateTime(event.curfewStart);
  const curfewEnd = formatDateTime(event.curfewEnd);
  const tileCountEntries = Object.entries(summary.board.tileCounts).sort((a, b) => b[1] - a[1]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside" isCentered>
      <ModalOverlay bg="rgba(10, 6, 16, 0.75)" />
      <ModalContent
        bg={SPOOPY_COLORS.night}
        color={SPOOPY_COLORS.paper}
        border="2px solid"
        borderColor={SPOOPY_COLORS.pumpkin}
      >
        <ModalHeader fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
          🎃 pre-flight: "{event.eventName}"
        </ModalHeader>
        <ModalCloseButton color={SPOOPY_COLORS.paper} />
        <ModalBody pb={2}>
          <VStack align="stretch" spacing={4}>
            {summary.blockers.length > 0 && (
              <Alert status="error" borderRadius="md" bg={SPOOPY_COLORS.emberDeep} color={SPOOPY_COLORS.paper}>
                <AlertIcon color={SPOOPY_COLORS.paper} />
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text fontWeight="bold">can't go live yet:</Text>
                  {summary.blockers.map((b) => (
                    <Text key={b}>· {b}</Text>
                  ))}
                </VStack>
              </Alert>
            )}

            {summary.warnings.length > 0 && (
              <Alert status="warning" borderRadius="md" bg={SPOOPY_COLORS.pumpkinDeep} color={SPOOPY_COLORS.paper}>
                <AlertIcon color={SPOOPY_COLORS.paper} />
                <VStack align="start" spacing={1} fontSize="sm">
                  <Text fontWeight="bold">heads up:</Text>
                  {summary.warnings.map((w) => (
                    <Text key={w}>· {w}</Text>
                  ))}
                </VStack>
              </Alert>
            )}

            <VStack align="stretch" spacing={2}>
              <SectionLabel>event</SectionLabel>
              <Row label="prize pool">{formatCandy((event.prizePool ?? 0))}</Row>
              <Row label="password">{event.eventPassword ? <Text as="span" fontFamily="mono">{event.eventPassword}</Text> : <Text as="span" opacity={0.5}>— none —</Text>}</Row>
              <Row label="curfew start">{curfewStart ?? <Text as="span" opacity={0.5}>will snap to now</Text>}</Row>
              <Row label="curfew end">{curfewEnd ?? <Text as="span" opacity={0.5}>— unset —</Text>}</Row>
              <Row label="wom competition">
                {event.womCompetitionId ? (
                  <Text as="span" fontFamily="mono">{event.womCompetitionId}</Text>
                ) : (
                  <Text as="span" opacity={0.5}>— unset —</Text>
                )}
              </Row>
              <Row label="wom pre-anchor buffer">
                {event.womPreAnchorBufferHours != null
                  ? `${event.womPreAnchorBufferHours}h`
                  : '12h (default)'}
              </Row>
              <Row label="site admins">{(event.adminIds ?? []).length}</Row>
            </VStack>

            <Divider borderColor={SPOOPY_COLORS.nightMist} />

            <VStack align="stretch" spacing={2}>
              <SectionLabel>board</SectionLabel>
              <Row label="dimensions">
                {summary.board.dims.cols} × {summary.board.dims.rows} ({summary.board.tiles.length} tiles)
              </Row>
              <Row label="starting tile(s)">{summary.board.startingTileIds.join(', ') || '— none —'}</Row>
              <Row label="candybag (spooky house)">{summary.board.candybagTileId ?? '— missing —'}</Row>
              {tileCountEntries.length > 0 && (
                <Row label="tile types">
                  <HStack spacing={1} flexWrap="wrap" justify="end">
                    {tileCountEntries.map(([type, count]) => (
                      <Badge
                        key={type}
                        variant="subtle"
                        colorScheme="purple"
                        fontSize="10px"
                        fontFamily="mono"
                      >
                        {type} · {count}
                      </Badge>
                    ))}
                  </HStack>
                </Row>
              )}
            </VStack>

            <Divider borderColor={SPOOPY_COLORS.nightMist} />

            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <SectionLabel>teams ({summary.teams.length})</SectionLabel>
              </HStack>
              {summary.teams.length === 0 ? (
                <Text fontSize="sm" opacity={0.5}>
                  no teams yet
                </Text>
              ) : (
                <Accordion allowMultiple reduceMotion>
                  <VStack align="stretch" spacing={2}>
                    {summary.teams.map((team) => (
                      <TeamItem key={team.teamId} team={team} />
                    ))}
                  </VStack>
                </Accordion>
              )}
            </VStack>

            <Divider borderColor={SPOOPY_COLORS.nightMist} />

            <Alert status="info" borderRadius="md" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
              <AlertIcon color={SPOOPY_COLORS.pumpkin} />
              <Text fontSize="sm">
                flipping to active locks in each team's prize-pool share, seeds their board, and (if curfew start was unset) snaps it to now. this cannot be cleanly undone.
              </Text>
            </Alert>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <HStack spacing={2} w="100%" justify="end">
            <Button variant="ghost" color={SPOOPY_COLORS.paper} onClick={onClose} isDisabled={isConfirming}>
              cancel
            </Button>
            <Button
              bg={SPOOPY_COLORS.pumpkin}
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
              onClick={onConfirm}
              isDisabled={!canGoLive}
              isLoading={isConfirming}
              loadingText="going live…"
            >
              🎃 go live
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
