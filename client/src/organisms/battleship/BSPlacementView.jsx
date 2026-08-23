import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import {
  Badge,
  Box,
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import {
  JOIN_BS_VIEW,
  LEAVE_BS_VIEW,
  GET_BS_VIEWER_COUNT,
  BS_VIEWERS_UPDATED,
  GET_BS_PLACEMENT_SUGGESTIONS,
  SHARE_BS_PLACEMENT_SUGGESTION,
  VOTE_BS_PLACEMENT_SUGGESTION,
  DELETE_BS_PLACEMENT_SUGGESTION,
  BS_PLACEMENT_SUGGESTIONS_UPDATED,
} from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { BSPlacementCountdown } from './BSFlipClock';

import {
  SHIP_CONFIGS,
  SHIP_COLORS,
  COL_LABELS,
  getShipCells,
  isValidPlacement,
} from '../../utils/battleship/bsClientHelpers';

// ── Workshop state (localStorage) ──────────────────────────────────────────
// Each user has one workshop layout per event. Persisted so a refresh doesn't
// lose in-progress work. Nothing here talks to the server until they Share.
function workshopKey(eventId, discordUserId) {
  return `bsWorkshop:${eventId}:${discordUserId || 'anon'}`;
}

function loadWorkshop(eventId, discordUserId) {
  try {
    const raw = localStorage.getItem(workshopKey(eventId, discordUserId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (_) {
    return [];
  }
}

function saveWorkshop(eventId, discordUserId, ships) {
  try {
    localStorage.setItem(workshopKey(eventId, discordUserId), JSON.stringify(ships));
  } catch (_) {
    // ignore quota errors
  }
}

// ── Tiny board preview for the suggestions gallery ─────────────────────────
export function BSPlacementMiniBoard({ ships, colorblindMode = false }) {
  const cellMap = new Map();
  for (const p of ships ?? []) {
    for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
      cellMap.set(`${c.row}-${c.col}`, p.shipType);
    }
  }
  return (
    <Box display="inline-block" p={1} bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="sm">
      <VStack spacing={0} align="stretch">
        {Array.from({ length: 10 }, (_, row) => (
          <HStack key={row} spacing={0}>
            {Array.from({ length: 10 }, (_, col) => {
              const key = `${row}-${col}`;
              const shipType = cellMap.get(key);
              const color = shipType ? SHIP_COLORS[shipType] : null;
              return (
                <Box
                  key={col}
                  w="14px"
                  h="14px"
                  border="1px solid"
                  borderColor={shipType ? `${color}66` : '#0f2419'}
                  bg={shipType ? `${color}55` : '#060f0a'}
                />
              );
            })}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export function BSPlacementView({ event, currentUser, topBar, refetch }) {
  const { showToast } = useToastContext();
  const teams = event.teams ?? [];

  const isAdmin =
    (event.adminIds ?? []).includes(String(currentUser?.id)) ||
    event.creatorId === String(currentUser?.id);

  const myTeam =
    teams.find((t) => (t.members ?? []).includes(currentUser?.discordUserId)) ?? null;

  // ── Workshop state (localStorage) ────────────────────────────────────────
  const eventId = event.eventId;
  const myDiscordId = currentUser?.discordUserId ?? '';
  const [workshop, setWorkshop] = useState(() => loadWorkshop(eventId, myDiscordId));
  useEffect(() => {
    setWorkshop(loadWorkshop(eventId, myDiscordId));
  }, [eventId, myDiscordId]);
  const updateWorkshop = useCallback(
    (nextShips) => {
      setWorkshop(nextShips);
      saveWorkshop(eventId, myDiscordId, nextShips);
    },
    [eventId, myDiscordId],
  );

  const [selectedShip, setSelectedShip] = useState('CARRIER');
  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredHistoryShip, setHoveredHistoryShip] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [reshareWarning, setReshareWarning] = useState(false);
  const [confirmClearWorkshop, setConfirmClearWorkshop] = useState(false);

  // ── Presence tracking (unchanged from prior implementation) ──────────────
  const [joinBSView] = useMutation(JOIN_BS_VIEW);
  const [leaveBSView] = useMutation(LEAVE_BS_VIEW);

  useQuery(GET_BS_VIEWER_COUNT, {
    variables: { eventId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getBSViewerCount != null) setViewerCount(data.getBSViewerCount);
    },
  });
  useSubscription(BS_VIEWERS_UPDATED, {
    variables: { eventId },
    onData: ({ data }) => {
      if (data?.data?.bsViewersUpdated != null) setViewerCount(data.data.bsViewersUpdated);
    },
  });

  useEffect(() => {
    let intervalId = null;
    const startHeartbeat = () => {
      joinBSView({ variables: { eventId } });
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => joinBSView({ variables: { eventId } }), 30_000);
    };
    const stopHeartbeat = () => {
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
      leaveBSView({ variables: { eventId } });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') startHeartbeat();
      else stopHeartbeat();
    };
    if (document.visibilityState === 'visible') startHeartbeat();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId) clearInterval(intervalId);
      leaveBSView({ variables: { eventId } });
    };
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Suggestions (server) ─────────────────────────────────────────────────
  const teamId = myTeam?.teamId ?? null;
  const {
    data: suggestionsData,
    refetch: refetchSuggestions,
  } = useQuery(GET_BS_PLACEMENT_SUGGESTIONS, {
    variables: { teamId },
    skip: !teamId,
    fetchPolicy: 'cache-and-network',
  });
  useSubscription(BS_PLACEMENT_SUGGESTIONS_UPDATED, {
    variables: { teamId },
    skip: !teamId,
    onData: () => refetchSuggestions(),
  });
  const suggestions = useMemo(
    () => suggestionsData?.getBSPlacementSuggestions ?? [],
    [suggestionsData],
  );

  const [shareSuggestion, { loading: sharing }] = useMutation(SHARE_BS_PLACEMENT_SUGGESTION, {
    onError: (err) => showToast(err.message ?? 'Failed to share suggestion.', 'error'),
  });
  const [voteSuggestion] = useMutation(VOTE_BS_PLACEMENT_SUGGESTION, {
    onError: (err) => showToast(err.message ?? 'Failed to vote.', 'error'),
  });
  const [deleteSuggestion] = useMutation(DELETE_BS_PLACEMENT_SUGGESTION, {
    onError: (err) => showToast(err.message ?? 'Failed to delete suggestion.', 'error'),
  });

  const mySharedSuggestion = useMemo(
    () => suggestions.find((s) => s.proposerDiscordId === myDiscordId) ?? null,
    [suggestions, myDiscordId],
  );

  const teamMemberCount = (myTeam?.members ?? []).length;
  const isSoloTeam = teamMemberCount <= 1;

  // ── Placement helpers (workshop-scoped) ──────────────────────────────────
  const placedCellMap = useMemo(() => {
    const m = new Map();
    for (const p of workshop) {
      for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
        m.set(`${c.row}-${c.col}`, p.shipType);
      }
    }
    return m;
  }, [workshop]);

  const placedShipTypes = useMemo(() => new Set(workshop.map((p) => p.shipType)), [workshop]);

  const previewCells = useMemo(() => {
    if (!hoveredCell) return new Set();
    const cells = getShipCells(selectedShip, orientation, hoveredCell.row, hoveredCell.col);
    return new Set(cells.map((c) => `${c.row}-${c.col}`));
  }, [hoveredCell, selectedShip, orientation]);

  const previewValid = useMemo(() => {
    if (!hoveredCell) return false;
    return isValidPlacement(
      selectedShip,
      orientation,
      hoveredCell.row,
      hoveredCell.col,
      workshop,
      selectedShip,
    );
  }, [hoveredCell, selectedShip, orientation, workshop]);

  useEffect(() => {
    if (!placedShipTypes.has(selectedShip)) return;
    const next = SHIP_CONFIGS.find((s) => !placedShipTypes.has(s.shipType));
    if (next) setSelectedShip(next.shipType);
  }, [placedShipTypes.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = (row, col) => {
    if (!isValidPlacement(selectedShip, orientation, row, col, workshop, selectedShip)) return;
    // Replace any existing placement of the same ship type in the workshop.
    const next = workshop
      .filter((p) => p.shipType !== selectedShip)
      .concat([{ shipType: selectedShip, orientation, startRow: row, startCol: col }]);
    updateWorkshop(next);
  };

  const workshopComplete = workshop.length === SHIP_CONFIGS.length;

  const handleShare = () => {
    if (!teamId) return;
    if (!workshopComplete) {
      showToast('Place all 5 ships in your workshop before sharing.', 'warning');
      return;
    }
    if (mySharedSuggestion) {
      setReshareWarning(true);
      return;
    }
    doShare();
  };

  const doShare = () => {
    shareSuggestion({
      variables: {
        teamId,
        ships: workshop.map(({ shipType, orientation: o, startRow, startCol }) => ({
          shipType, orientation: o, startRow, startCol,
        })),
      },
      onCompleted: (data) => {
        const returned = data?.shareBSPlacementSuggestion;
        // If the server matched our layout to a teammate's, it returns their
        // suggestion (with us added as a voter) instead of creating a duplicate.
        const wasMatched =
          returned && myDiscordId && returned.proposerDiscordId !== myDiscordId;
        if (wasMatched) {
          showToast(
            'Your layout matches a teammate\'s exactly — voted for theirs instead.',
            'info',
          );
        } else {
          showToast(
            isSoloTeam
              ? 'Layout locked in — no teammates to vote.'
              : 'Suggestion shared — teammates can now vote.',
            'success',
          );
        }
        refetchSuggestions();
      },
    });
    setReshareWarning(false);
  };

  const handleVote = (suggestionId) => {
    // Figure out where the caller's vote is right now (if anywhere) so we can
    // tell them it moved — one-vote-per-team is enforced server-side.
    const previouslyVotedFor = suggestions.find((s) => (s.votes ?? []).includes(myDiscordId));
    const votingForOwn =
      suggestions.find((s) => s.suggestionId === suggestionId)?.proposerDiscordId === myDiscordId;
    voteSuggestion({
      variables: { suggestionId },
      onCompleted: (data) => {
        const returned = data?.voteBSPlacementSuggestion;
        const iNowVote = (returned?.votes ?? []).includes(myDiscordId);
        if (iNowVote) {
          if (previouslyVotedFor && previouslyVotedFor.suggestionId !== suggestionId) {
            showToast(
              votingForOwn
                ? 'Vote moved to your own suggestion.'
                : 'Vote moved to this suggestion.',
              'info',
            );
          } else {
            showToast('Vote added.', 'success');
          }
        } else {
          showToast('Vote removed.', 'info');
        }
        refetchSuggestions();
      },
    });
  };

  const handleDeleteMine = () => {
    if (!mySharedSuggestion) return;
    deleteSuggestion({
      variables: { suggestionId: mySharedSuggestion.suggestionId },
      onCompleted: () => refetchSuggestions(),
    });
  };

  const handleClearWorkshop = () => {
    updateWorkshop([]);
    setConfirmClearWorkshop(false);
  };

  const dotColor = myTeam?.color === 'RED' ? '#f87171' : '#60a5fa';

  const viewerBadge = viewerCount > 0 ? (
    <HStack spacing={1} align="center">
      <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
      <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" letterSpacing="wide">
        {viewerCount} team member{viewerCount !== 1 ? 's' : ''} viewing
      </Text>
    </HStack>
  ) : null;

  // ── Admin / spectator view (no team) ─────────────────────────────────────
  if (!myTeam) {
    return (
      <Box flex="1" minH="100vh" bg="#060f0a">
        {topBar}
        <Box maxW="700px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
          <VStack align="stretch" spacing={5}>
            <HStack justify="space-between" align="center">
              <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="widest" textTransform="uppercase">
                Placement Phase / {isAdmin ? 'Admin View' : 'Spectator View'}
              </Text>
              {viewerBadge}
            </HStack>
            <Box display="flex" flexDirection="column" alignItems="center" py={2} gap={2}>
              <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase">
                countdown til launch:
              </Text>
              <BSPlacementCountdown event={event} />
            </Box>
            {teams.map((team) => {
              const tc = team.color === 'RED' ? '#f87171' : '#60a5fa';
              return (
                <Box key={team.teamId} bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={tc} />
                      <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#d4f0da">
                        {team.teamName}
                      </Text>
                    </HStack>
                    <Badge colorScheme="cyan" fontSize="9px" letterSpacing="wider" textTransform="uppercase">
                      workshopping
                    </Badge>
                  </HStack>
                </Box>
              );
            })}
            <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
              <Text fontFamily="mono" fontSize="10px" color="#6b9e78" lineHeight="tall">
                Each team member workshops a layout privately then shares it to their team. Teammates
                vote on the shared suggestions, and the highest-voted layout wins at phase end.
                Ties break at random. Teams with zero suggestions get a random auto-placement.
              </Text>
              {isAdmin && (
                <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wide" mt={2}>
                  Admins can manually advance from the event's Admin page.
                </Text>
              )}
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  // ── Team member view ─────────────────────────────────────────────────────
  return (
    <Box flex="1" minH="100vh" bg="#060f0a">
      {topBar}
      <Box maxW="1400px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
        <HStack spacing={3} mb={2} align="center" justify="space-between">
          <HStack spacing={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={dotColor} />
            <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color="#d4f0da" letterSpacing="wide">
              {myTeam.teamName}
            </Text>
          </HStack>
          {viewerBadge}
        </HStack>
        <Box display="flex" flexDirection="column" alignItems="center" py={4} mb={6} gap={2}>
          <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase">
            countdown til launch:
          </Text>
          <BSPlacementCountdown event={event} />
        </Box>

        {/* Intro copy */}
        <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3} mb={5}>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide" lineHeight="tall">
            Workshop your fleet on the board below — it's saved locally and only you can see it.
            When you're happy, hit <strong>Share Suggestion</strong> so your teammates can vote on it.
            The highest-voted suggestion at phase end becomes your team's fleet.
            {isSoloTeam
              ? ' You\'re the only member of this team, so your shared suggestion wins by default.'
              : ' Ties break at random.'}
          </Text>
        </Box>

        <Box display="flex" gap={8} alignItems="flex-start" flexWrap="wrap">
          {/* Grid workshop */}
          <Box flexShrink={0}>
            <VStack spacing={0} align="flex-start">
              <HStack spacing={0} pl="22px">
                {COL_LABELS.map((lbl) => (
                  <Box key={lbl} w="52px" h="18px" display="flex" alignItems="center" justifyContent="center">
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">{lbl}</Text>
                  </Box>
                ))}
              </HStack>
              {Array.from({ length: 10 }, (_, row) => (
                <HStack key={row} spacing={0}>
                  <Box w="22px" h="52px" display="flex" alignItems="center" justifyContent="center">
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">{row + 1}</Text>
                  </Box>
                  {Array.from({ length: 10 }, (_, col) => {
                    const key = `${row}-${col}`;
                    const shipType = placedCellMap.get(key);
                    const inPreview = previewCells.has(key);
                    const isHistoryHighlight = hoveredHistoryShip && shipType === hoveredHistoryShip;
                    const shipColor = shipType ? SHIP_COLORS[shipType] : null;
                    const previewColor = previewValid ? SHIP_COLORS[selectedShip] : '#ef4444';
                    return (
                      <Box
                        key={col}
                        w="52px"
                        h="52px"
                        border="1px solid"
                        borderColor={
                          isHistoryHighlight
                            ? shipColor
                            : inPreview
                            ? previewValid ? previewColor : '#ef4444'
                            : shipType
                            ? `${shipColor}99`
                            : '#1a4028'
                        }
                        bg={
                          isHistoryHighlight
                            ? `${shipColor}55`
                            : inPreview
                            ? `${previewValid ? previewColor : '#ef4444'}22`
                            : shipType
                            ? `${shipColor}22`
                            : '#060f0a'
                        }
                        cursor="crosshair"
                        onClick={() => handleCellClick(row, col)}
                        onMouseEnter={() => !hoveredHistoryShip && setHoveredCell({ row, col })}
                        onMouseLeave={() => setHoveredCell(null)}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="all 0.08s"
                        boxShadow={isHistoryHighlight ? `0 0 6px ${shipColor}66` : undefined}
                      >
                        {shipType && (
                          <Box w="8px" h="8px" borderRadius="sm" bg={shipColor} opacity={isHistoryHighlight ? 1 : 0.75} />
                        )}
                      </Box>
                    );
                  })}
                </HStack>
              ))}
            </VStack>
            <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" mt={2} letterSpacing="wide">
              Click to place · hover to preview · private to you until you share
            </Text>
          </Box>

          {/* Middle panel: ship list + orientation + share */}
          <Box flex="1" minW="220px" maxW="280px">
            <VStack align="stretch" spacing={5}>
              <Box>
                <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase" mb={2}>
                  Orientation
                </Text>
                <HStack spacing={2}>
                  {['HORIZONTAL', 'VERTICAL'].map((o) => (
                    <Button
                      key={o}
                      size="xs"
                      variant={orientation === o ? 'solid' : 'outline'}
                      colorScheme="green"
                      borderColor="#1a4028"
                      color={orientation === o ? '#060f0a' : '#4ade80'}
                      fontFamily="mono"
                      fontSize="10px"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      onClick={() => setOrientation(o)}
                      _hover={{ borderColor: '#4ade80' }}
                    >
                      {o === 'HORIZONTAL' ? '— H' : '| V'}
                    </Button>
                  ))}
                </HStack>
              </Box>

              <Box>
                <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase" mb={2}>
                  Ships
                </Text>
                <VStack align="stretch" spacing={1}>
                  {SHIP_CONFIGS.map(({ shipType, label, cells }) => {
                    const isPlaced = placedShipTypes.has(shipType);
                    const isSelected = selectedShip === shipType;
                    const color = SHIP_COLORS[shipType];
                    return (
                      <Box
                        key={shipType}
                        px={3}
                        py={2}
                        border="1px solid"
                        borderColor={isSelected ? color : '#1a4028'}
                        borderRadius="sm"
                        bg={isSelected ? `${color}18` : '#060f0a'}
                        cursor="pointer"
                        onClick={() => setSelectedShip(shipType)}
                        onMouseEnter={() => isPlaced && setHoveredHistoryShip(shipType)}
                        onMouseLeave={() => setHoveredHistoryShip(null)}
                        _hover={{ borderColor: color }}
                        transition="all 0.1s"
                      >
                        <HStack justify="space-between">
                          <HStack spacing={2}>
                            <Box w="8px" h="8px" borderRadius="sm" bg={color} />
                            <Text
                              fontFamily="mono"
                              fontSize="xs"
                              color={isSelected ? '#d4f0da' : '#6b9e78'}
                              fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                              {label}
                            </Text>
                            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a">
                              {Array(cells).fill('▪').join('')}
                            </Text>
                          </HStack>
                          {isPlaced && (
                            <Badge colorScheme="green" fontSize="9px" letterSpacing="wider">placed</Badge>
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>

              {/* Share + clear controls */}
              <VStack align="stretch" spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  bg="#22c55e"
                  color="#060f0a"
                  fontFamily="mono"
                  fontSize="xs"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  isLoading={sharing}
                  isDisabled={!workshopComplete}
                  _hover={{ bg: '#4ade80' }}
                  _disabled={{ opacity: 0.4, cursor: 'not-allowed' }}
                  onClick={handleShare}
                >
                  {mySharedSuggestion ? 'Re-Share Suggestion' : 'Share Suggestion →'}
                </Button>
                {!workshopComplete && (
                  <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" textAlign="center">
                    Place all 5 ships to enable sharing.
                  </Text>
                )}
                {workshop.length > 0 && !confirmClearWorkshop && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="#6b9e78"
                    fontFamily="mono"
                    fontSize="10px"
                    _hover={{ color: '#f87171', bg: 'transparent' }}
                    onClick={() => setConfirmClearWorkshop(true)}
                  >
                    Clear Workshop
                  </Button>
                )}
                {confirmClearWorkshop && (
                  <HStack spacing={2} justify="center">
                    <Button size="xs" colorScheme="red" fontFamily="mono" fontSize="10px" onClick={handleClearWorkshop}>
                      Confirm Clear
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="#6b9e78"
                      fontFamily="mono"
                      fontSize="10px"
                      _hover={{ color: '#d4f0da', bg: 'transparent' }}
                      onClick={() => setConfirmClearWorkshop(false)}
                    >
                      Cancel
                    </Button>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Box>

          {/* Right panel: suggestions gallery */}
          <Box flex="1" minW="280px">
            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase" mb={3}>
              Team Suggestions ({suggestions.length})
            </Text>
            {suggestions.length === 0 ? (
              <Box bg="#091a10" border="1px dashed" borderColor="#1a4028" borderRadius="md" p={4}>
                <Text fontFamily="mono" fontSize="10px" color="#6b9e78" lineHeight="tall">
                  No suggestions yet. Be the first to share yours!
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={3}>
                {suggestions.map((s) => {
                  const iVoted = (s.votes ?? []).includes(myDiscordId);
                  const isMine = s.proposerDiscordId === myDiscordId;
                  return (
                    <Box
                      key={s.suggestionId}
                      bg="#091a10"
                      border="1px solid"
                      borderColor={iVoted ? '#22c55e' : isMine ? '#4ade8055' : '#1a4028'}
                      borderRadius="md"
                      p={3}
                      boxShadow={iVoted ? '0 0 0 1px #22c55e33' : undefined}
                    >
                      <HStack align="flex-start" spacing={3} flexWrap="wrap">
                        <BSPlacementMiniBoard ships={s.ships ?? []} />
                        <VStack align="stretch" spacing={2} flex="1" minW="140px">
                          <HStack justify="space-between" spacing={2} flexWrap="wrap">
                            <Text fontFamily="mono" fontSize="xs" color="#d4f0da" fontWeight="bold" noOfLines={1}>
                              {isMine ? 'Your suggestion' : `by ${s.proposerDiscordId.slice(0, 8)}…`}
                            </Text>
                            <HStack spacing={1} flexWrap="wrap" justify="flex-end">
                              {iVoted && (
                                <Badge
                                  colorScheme="green"
                                  fontSize="9px"
                                  letterSpacing="widest"
                                  textTransform="uppercase"
                                >
                                  ✓ Your vote
                                </Badge>
                              )}
                              <Badge colorScheme="cyan" fontSize="9px" letterSpacing="wider">
                                {s.voteCount ?? 0} vote{(s.voteCount ?? 0) !== 1 ? 's' : ''}
                              </Badge>
                            </HStack>
                          </HStack>
                          <HStack spacing={2} flexWrap="wrap">
                            <Button
                              size="xs"
                              variant={iVoted ? 'solid' : 'outline'}
                              colorScheme={iVoted ? 'green' : 'gray'}
                              borderColor="#1a4028"
                              color={iVoted ? '#060f0a' : '#4ade80'}
                              fontFamily="mono"
                              fontSize="10px"
                              letterSpacing="wider"
                              textTransform="uppercase"
                              _hover={{ borderColor: '#4ade80' }}
                              onClick={() => handleVote(s.suggestionId)}
                            >
                              {iVoted ? 'Remove Vote' : 'Vote'}
                            </Button>
                            {isMine && (
                              <Button
                                size="xs"
                                variant="ghost"
                                color="#f87171"
                                fontFamily="mono"
                                fontSize="10px"
                                letterSpacing="wider"
                                _hover={{ color: '#ef4444', bg: 'transparent' }}
                                onClick={handleDeleteMine}
                              >
                                Delete
                              </Button>
                            )}
                          </HStack>
                        </VStack>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        </Box>
      </Box>

      {/* Re-share warning modal */}
      <Modal isOpen={reshareWarning} onClose={() => setReshareWarning(false)} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg="#091a10" border="1px solid" borderColor="#1a4028">
          <ModalHeader fontFamily="mono" fontSize="sm" color="#facc15" letterSpacing="widest" textTransform="uppercase">
            Replace your suggestion?
          </ModalHeader>
          <ModalBody>
            <Text fontFamily="mono" fontSize="xs" color="#d4f0da" lineHeight="tall">
              Sharing again will replace your previous suggestion and wipe its votes. Teammates will
              need to vote for your new layout from scratch.
            </Text>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              size="sm"
              variant="ghost"
              color="#6b9e78"
              fontFamily="mono"
              fontSize="xs"
              onClick={() => setReshareWarning(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              colorScheme="yellow"
              bg="#facc15"
              color="#060f0a"
              fontFamily="mono"
              fontSize="xs"
              isLoading={sharing}
              onClick={doShare}
            >
              Replace & Share
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* refetch reference so ESLint doesn't complain about unused prop */}
      {void refetch}
    </Box>
  );
}
