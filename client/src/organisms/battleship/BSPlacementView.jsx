import React, { useState, useMemo, useEffect } from 'react';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { Box, VStack, HStack, Text, Badge, Button } from '@chakra-ui/react';
import {
  PLACE_BS_SHIP,
  START_BS_GAME,
  JOIN_BS_VIEW,
  LEAVE_BS_VIEW,
  GET_BS_VIEWER_COUNT,
  BS_VIEWERS_UPDATED,
  BS_BOARD_UPDATED,
} from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { BSPlacementCountdown } from './BSFlipClock';

import {
  SHIP_CONFIGS,
  SHIP_COLORS,
  COL_LABELS,
  getShipCells,
  isValidPlacement,
  timeAgo,
} from '../../utils/battleship/bsClientHelpers';

export function BSPlacementView({ event, currentUser, topBar, refetch }) {
  const { showToast } = useToastContext();
  const teams = event.teams ?? [];

  const isAdmin =
    (event.adminIds ?? []).includes(String(currentUser?.id)) ||
    event.creatorId === String(currentUser?.id);

  const myTeam = teams.find((t) => (t.members ?? []).includes(currentUser?.discordUserId)) ?? null;
  const myBoard = myTeam?.board ?? null;
  const existingPlacements = myBoard?.shipPlacements ?? [];

  const [selectedShip, setSelectedShip] = useState('CARRIER');
  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredHistoryShip, setHoveredHistoryShip] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const [placeBSShip, { loading: placing }] = useMutation(PLACE_BS_SHIP, {
    onCompleted: () => refetch(),
    onError: (err) => showToast(err.message ?? 'Failed to place ship.', 'error'),
  });

  const [startBSGame, { loading: startingGame }] = useMutation(START_BS_GAME, {
    onCompleted: () => {
      showToast('Battle phase started.', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to start battle phase.', 'error'),
  });

  const [joinBSView] = useMutation(JOIN_BS_VIEW);
  const [leaveBSView] = useMutation(LEAVE_BS_VIEW);

  // Initial viewer count fetch
  useQuery(GET_BS_VIEWER_COUNT, {
    variables: { eventId: event.eventId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getBSViewerCount != null) setViewerCount(data.getBSViewerCount);
    },
  });

  // Live viewer count subscription
  useSubscription(BS_VIEWERS_UPDATED, {
    variables: { eventId: event.eventId },
    onData: ({ data }) => {
      if (data?.data?.bsViewersUpdated != null) setViewerCount(data.data.bsViewersUpdated);
    },
  });

  // Live board update subscription — refetch when any team places ships
  useSubscription(BS_BOARD_UPDATED, {
    variables: { eventId: event.eventId },
    onData: () => refetch(),
  });

  // Presence tracking:
  //   - Heartbeat every 30s while the tab is visible.
  //   - Pause heartbeats + fire leave when the tab is hidden (background/minimized).
  //   - Rejoin when the tab becomes visible again.
  //   - On tab close, Apollo's in-flight request usually completes; if it doesn't,
  //     the server-side TTL (45s) sweeps the entry.
  useEffect(() => {
    let intervalId = null;

    const startHeartbeat = () => {
      joinBSView({ variables: { eventId: event.eventId } });
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(
        () => joinBSView({ variables: { eventId: event.eventId } }),
        30_000
      );
    };

    const stopHeartbeat = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      leaveBSView({ variables: { eventId: event.eventId } });
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
      leaveBSView({ variables: { eventId: event.eventId } });
    };
  }, [event.eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const placedCellMap = useMemo(() => {
    const m = new Map();
    for (const p of existingPlacements) {
      for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
        m.set(`${c.row}-${c.col}`, p.shipType);
      }
    }
    return m;
  }, [existingPlacements]);

  const placedShipTypes = useMemo(
    () => new Set(existingPlacements.map((p) => p.shipType)),
    [existingPlacements]
  );

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
      existingPlacements,
      selectedShip
    );
  }, [hoveredCell, selectedShip, orientation, existingPlacements]);

  useEffect(() => {
    if (!placedShipTypes.has(selectedShip)) return;
    const next = SHIP_CONFIGS.find((s) => !placedShipTypes.has(s.shipType));
    if (next) setSelectedShip(next.shipType);
  }, [placedShipTypes.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = (row, col) => {
    if (!myBoard || placing) return;
    if (!isValidPlacement(selectedShip, orientation, row, col, existingPlacements, selectedShip))
      return;
    placeBSShip({
      variables: {
        boardId: myBoard.boardId,
        input: { shipType: selectedShip, orientation, startRow: row, startCol: col },
      },
    });
  };

  const dotColor = myTeam?.color === 'RED' ? '#f87171' : '#60a5fa';

  const viewerBadge =
    viewerCount > 0 ? (
      <HStack spacing={1} align="center">
        <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
        <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" letterSpacing="wide">
          {viewerCount} team member{viewerCount !== 1 ? 's' : ''} viewing
        </Text>
      </HStack>
    ) : null;

  // ── Admin view: no team to place for ───────────────────────────────────
  if (!myTeam) {
    return (
      <Box flex="1" minH="100vh" bg="#060f0a">
        {topBar}
        <Box maxW="700px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
          <VStack align="stretch" spacing={5}>
            <HStack justify="space-between" align="center">
              <Text
                fontFamily="mono"
                fontSize="10px"
                color="#6b9e78"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Placement Phase / Admin View
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
              const board = team.board;
              const placed = (board?.shipPlacements ?? []).length;
              const tc = team.color === 'RED' ? '#f87171' : '#60a5fa';
              return (
                <Box
                  key={team.teamId}
                  bg="#091a10"
                  border="1px solid"
                  borderColor="#1a4028"
                  borderRadius="md"
                  p={4}
                >
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={tc} />
                      <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#d4f0da">
                        {team.teamName}
                      </Text>
                    </HStack>
                    <Badge
                      colorScheme="yellow"
                      fontSize="9px"
                      letterSpacing="wider"
                      textTransform="uppercase"
                    >
                      {placed}/5 ships placed
                    </Badge>
                  </HStack>
                </Box>
              );
            })}

            <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
              <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide" mb={3}>
                Any teams with missing ships will have their fleet randomly positioned when battle
                begins.
              </Text>
              <Button
                size="sm"
                colorScheme="green"
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
                isLoading={startingGame}
                loadingText="Launching..."
                onClick={() => startBSGame({ variables: { eventId: event.eventId } })}
                bg="#22c55e"
                color="#060f0a"
                _hover={{ bg: '#4ade80' }}
              >
                Start Battle Phase
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  // ── Team member view: place ships ───────────────────────────────────────
  return (
    <Box flex="1" minH="100vh" bg="#060f0a">
      {topBar}
      <Box maxW="1100px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
        <HStack spacing={3} mb={2} align="center" justify="space-between">
          <HStack spacing={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={dotColor} />
            <Text
              fontFamily="mono"
              fontSize="xs"
              fontWeight="bold"
              color="#d4f0da"
              letterSpacing="wide"
            >
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

        <Box display="flex" gap={8} alignItems="flex-start" flexWrap="wrap">
          {/* Grid */}
          <Box flexShrink={0}>
            <VStack spacing={0} align="flex-start">
              <HStack spacing={0} pl="22px">
                {COL_LABELS.map((lbl) => (
                  <Box
                    key={lbl}
                    w="52px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                      {lbl}
                    </Text>
                  </Box>
                ))}
              </HStack>
              {Array.from({ length: 10 }, (_, row) => (
                <HStack key={row} spacing={0}>
                  <Box w="22px" h="52px" display="flex" alignItems="center" justifyContent="center">
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                      {row + 1}
                    </Text>
                  </Box>
                  {Array.from({ length: 10 }, (_, col) => {
                    const key = `${row}-${col}`;
                    const shipType = placedCellMap.get(key);
                    const inPreview = previewCells.has(key);
                    const isHistoryHighlight =
                      hoveredHistoryShip && shipType === hoveredHistoryShip;
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
                            ? previewValid
                              ? previewColor
                              : '#ef4444'
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
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="sm"
                            bg={shipColor}
                            opacity={isHistoryHighlight ? 1 : 0.75}
                          />
                        )}
                      </Box>
                    );
                  })}
                </HStack>
              ))}
            </VStack>
            <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" mt={2} letterSpacing="wide">
              Click to place · hover to preview
            </Text>
          </Box>

          {/* Right panel: ship list + history + controls */}
          <Box flex="1" minW="240px">
            <VStack align="stretch" spacing={5}>
              {/* Explanatory copy */}
              <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#6b9e78"
                  letterSpacing="wide"
                  lineHeight="tall"
                >
                  Position your fleet however you like during this phase. Whatever layout you have
                  when the placement window closes is what gets locked in — that's the board your
                  opponents will be firing at when the battle begins.
                </Text>
              </Box>

              {/* Orientation toggle */}
              <Box>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#3d6b4a"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  mb={2}
                >
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

              {/* Ship list */}
              <Box>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#3d6b4a"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  mb={2}
                >
                  Ships
                </Text>
                <VStack align="stretch" spacing={1}>
                  {SHIP_CONFIGS.map(({ shipType, label, cells }) => {
                    const isPlaced = placedShipTypes.has(shipType);
                    const isSelected = selectedShip === shipType;
                    const color = SHIP_COLORS[shipType];
                    const placement = existingPlacements.find((p) => p.shipType === shipType);
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
                          {isPlaced ? (
                            <Badge colorScheme="green" fontSize="9px" letterSpacing="wider">
                              placed
                            </Badge>
                          ) : null}
                        </HStack>
                        {isPlaced && placement?.updatedAt && (
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color="#3d6b4a"
                            mt={1}
                            letterSpacing="wide"
                          >
                            placed {timeAgo(placement.updatedAt)}
                          </Text>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>

              {isAdmin && (
                <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
                  <Text
                    fontFamily="mono"
                    fontSize="9px"
                    color="#3d6b4a"
                    letterSpacing="wide"
                    mb={2}
                    textTransform="uppercase"
                  >
                    Admin
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="10px"
                    color="#6b9e78"
                    letterSpacing="wide"
                    mb={3}
                  >
                    Any teams with missing ships will be randomly positioned.
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="green"
                    fontFamily="mono"
                    fontSize="10px"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    isLoading={startingGame}
                    loadingText="Launching..."
                    onClick={() => startBSGame({ variables: { eventId: event.eventId } })}
                    bg="#22c55e"
                    color="#060f0a"
                    _hover={{ bg: '#4ade80' }}
                    w="full"
                  >
                    Start Battle Phase
                  </Button>
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
