import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { Box, Button, Center, Spinner, Text, VStack, HStack, Heading } from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { useCompletionSound } from '../hooks/useCompletionSound';
import { useRainbowCelebration } from '../hooks/useRainbowCelebration';
import {
  GET_ACTIVE_RAINBOW_EVENT,
  GET_RAINBOW_EVENT_BOARDS,
  RAINBOW_EVENT_BOARD_UPDATED,
} from '../graphql/rainbowBingoOperations';
import {
  BOARD_LAYOUT,
  EDGES,
  CELL_PX,
  TILE_SIZE,
  BOARD_W,
  BOARD_H,
  tileStyle,
  tileCenterPx,
  COLOR_BG,
  COLOR_TEXT,
  TEAM_PALETTE,
} from '../utils/rainbowBoard';

const STATUS_RANK = { LOCKED: 0, UNLOCKED: 1, SUBMITTED: 2, COMPLETE: 3 };

function SpectatorEdges({ mergedBoardMap, showLocked }) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: BOARD_W,
        height: BOARD_H,
        pointerEvents: 'none',
      }}
    >
      {EDGES.map(([from, to]) => {
        const fromPos = BOARD_LAYOUT[from];
        const toPos = BOARD_LAYOUT[to];
        if (!fromPos || !toPos) return null;
        const fromStatus = from === 'START' ? 'COMPLETE' : mergedBoardMap[from];
        const toStatus = mergedBoardMap[to];
        if (!showLocked && (!toStatus || toStatus === 'LOCKED')) return null;
        const active = fromStatus === 'COMPLETE' && toStatus && toStatus !== 'LOCKED';
        const a = tileCenterPx(fromPos);
        const b = tileCenterPx(toPos);
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={active ? '#ffffff55' : '#ffffff18'}
            strokeWidth={active ? 2 : 1}
            strokeDasharray={active ? undefined : '4 4'}
          />
        );
      })}
    </svg>
  );
}

function SpectatorTile({ tileCode, tileDef, teamStatuses, isNewlyCompleted }) {
  if (tileCode === 'START') {
    const { col, row } = BOARD_LAYOUT.START;
    return (
      <Box
        style={{ ...tileStyle(col, row), borderRadius: '50%' }}
        bg="#1a1a1a"
        border="2px solid #555"
        display="flex"
        alignItems="center"
        justifyContent="center"
        userSelect="none"
      >
        <Text fontSize="9px" color="#aaa" fontWeight="bold">
          START
        </Text>
      </Box>
    );
  }

  const pos = BOARD_LAYOUT[tileCode];
  if (!pos) return null;

  const color = tileDef?.color ?? 'capstone';
  const palette = COLOR_BG[color] ?? COLOR_BG.capstone;
  const textCol = COLOR_TEXT[color] ?? '#fff';

  const statuses = teamStatuses.map((ts) => ts.status);
  const hasComplete = statuses.includes('COMPLETE');
  const hasSubmitted = statuses.includes('SUBMITTED');
  const hasUnlocked = statuses.includes('UNLOCKED');
  const allLocked = statuses.length === 0 || statuses.every((s) => s === 'LOCKED');

  const bgColor = hasComplete
    ? palette.complete
    : hasSubmitted
    ? palette.submitted
    : hasUnlocked
    ? palette.unlocked
    : palette.locked;

  const activeDots = teamStatuses.filter(
    (ts) => ts.status === 'COMPLETE' || ts.status === 'SUBMITTED'
  );

  return (
    <Box
      style={{
        ...tileStyle(pos.col, pos.row),
        borderRadius: '50%',
        ...(isNewlyCompleted && { animation: 'tileComplete 2.5s ease-out', zIndex: 10 }),
      }}
      bg={bgColor}
      border={allLocked ? '2px solid #33333388' : '2px solid #ffffff22'}
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDir="column"
      overflow="hidden"
      userSelect="none"
      opacity={allLocked ? 0.35 : 1}
    >
      <Text fontSize="9px" color={allLocked ? '#777' : textCol} fontWeight="bold" lineHeight="1">
        {tileCode}
      </Text>
      {activeDots.length > 0 && (
        <Box
          position="absolute"
          bottom="3px"
          display="flex"
          flexWrap="wrap"
          justifyContent="center"
          gap="2px"
          px="2px"
        >
          {activeDots.map(({ teamIndex, status }) => (
            <Box
              key={teamIndex}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: TEAM_PALETTE[teamIndex % TEAM_PALETTE.length],
                border:
                  status === 'COMPLETE' ? '1.5px solid #ffd700' : '1px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

export default function RainbowBingoBoardPage() {
  const { user } = useAuth();
  const isSiteAdmin = !!user?.admin;
  const [showLocked, setShowLocked] = useState(false);

  const { data: eventData, loading: eventLoading } = useQuery(GET_ACTIVE_RAINBOW_EVENT, {
    fetchPolicy: 'cache-and-network',
  });

  const event = eventData?.getActiveRainbowEvent;

  const { data: boardsData, refetch: refetchBoards } = useQuery(GET_RAINBOW_EVENT_BOARDS, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId,
    fetchPolicy: 'cache-and-network',
  });

  const prevMergedRef = useRef({});
  const [recentlyCompleted, setRecentlyCompleted] = useState(new Set());
  const { playTileComplete, playCapstoneComplete, playBoardComplete } = useCompletionSound();
  const { trigger: triggerCelebration, overlay: celebrationOverlay } = useRainbowCelebration();

  useSubscription(RAINBOW_EVENT_BOARD_UPDATED, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId,
    onData: () => refetchBoards(),
  });

  const triggerTest = (type) => {
    const CAPSTONES = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
    const codes = type === 'board' ? CAPSTONES : type === 'capstone' ? ['C1'] : ['R1'];
    setRecentlyCompleted((s) => { const n = new Set(s); codes.forEach((c) => n.add(c)); return n; });
    setTimeout(() => {
      setRecentlyCompleted((s) => { const n = new Set(s); codes.forEach((c) => n.delete(c)); return n; });
    }, 2500);
    if (type === 'board') { playBoardComplete(); triggerCelebration('board'); }
    else if (type === 'capstone') { playCapstoneComplete(); triggerCelebration('capstone'); }
    else { playTileComplete(); triggerCelebration('tile'); }
  };

  const teams = useMemo(() => boardsData?.getRainbowTeams ?? [], [boardsData]);

  const { tileTeamStatuses, mergedBoardMap } = useMemo(() => {
    const tileTeamStatuses = {};
    teams.forEach((team, teamIndex) => {
      (team.tiles ?? []).forEach(({ tileCode, status }) => {
        if (!tileTeamStatuses[tileCode]) tileTeamStatuses[tileCode] = [];
        tileTeamStatuses[tileCode].push({ teamIndex, status });
      });
    });
    const mergedBoardMap = {};
    Object.entries(tileTeamStatuses).forEach(([code, statuses]) => {
      mergedBoardMap[code] = statuses.reduce(
        (best, { status }) => (STATUS_RANK[status] > STATUS_RANK[best] ? status : best),
        'LOCKED'
      );
    });
    return { tileTeamStatuses, mergedBoardMap };
  }, [teams]);

  useEffect(() => {
    const prev = prevMergedRef.current;
    const newlyDone = Object.keys(mergedBoardMap).filter(
      (code) => mergedBoardMap[code] === 'COMPLETE' && prev[code] !== 'COMPLETE'
    );
    prevMergedRef.current = { ...mergedBoardMap };
    if (newlyDone.length === 0) return;
    setRecentlyCompleted((s) => { const n = new Set(s); newlyDone.forEach((c) => n.add(c)); return n; });
    const isCapstone = newlyDone.some((c) => c.startsWith('C'));
    if (isCapstone) { playCapstoneComplete(); triggerCelebration('capstone'); }
    else { playTileComplete(); triggerCelebration('tile'); }
    const timer = setTimeout(() => {
      setRecentlyCompleted((s) => { const n = new Set(s); newlyDone.forEach((c) => n.delete(c)); return n; });
    }, 2500);
    return () => clearTimeout(timer);
  }, [mergedBoardMap, playTileComplete, playCapstoneComplete, triggerCelebration]);

  if (eventLoading && !event) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }

  return (
    <>
    <Box minH="100vh" color="white" pt="56px" pb={6} px={{ base: 3, md: 6 }}>
      <style>{`@keyframes tileComplete { 0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.9); } 50% { box-shadow: 0 0 0 16px rgba(255,215,0,0.35); } 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); } }`}</style>
      <VStack align="stretch" gap={3} maxW="1200px" mx="auto">
        <VStack align="center" gap={1}>
          <Heading
            size="lg"
            bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
            bgClip="text"
          >
            Rainbow Bingo
          </Heading>
          {event && (
            <Text color="gray.400" fontSize="sm">
              {event.eventName}
            </Text>
          )}
        </VStack>

        {!event && !eventLoading && (
          <Center py={10}>
            <Text color="gray.500">No active Rainbow Bingo event.</Text>
          </Center>
        )}

        {event && (
          <>
            <HStack justify="center" gap={5} wrap="wrap">
              {teams.map((team, i) => (
                <HStack key={team.teamId} gap={2}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: TEAM_PALETTE[i % TEAM_PALETTE.length],
                    }}
                  />
                  <Text fontSize="sm" color="gray.300">
                    {team.teamName}
                  </Text>
                </HStack>
              ))}
              {isSiteAdmin && (
                <Button
                  size="xs"
                  variant={showLocked ? 'solid' : 'outline'}
                  colorScheme="purple"
                  onClick={() => setShowLocked((v) => !v)}
                >
                  {showLocked ? 'Admin: Hide locked' : 'Admin: Show locked'}
                </Button>
              )}
            </HStack>

            <Box overflowX="auto">
              <Box display="flex" justifyContent="center">
                <Box position="relative" style={{ width: BOARD_W, height: BOARD_H }} flexShrink={0}>
                  <SpectatorEdges mergedBoardMap={mergedBoardMap} showLocked={showLocked} />
                  <SpectatorTile tileCode="START" tileDef={null} teamStatuses={[]} />
                  {Object.keys(BOARD_LAYOUT)
                    .filter((k) => k !== 'START')
                    .map((code) => {
                      const status = mergedBoardMap[code];
                      if (!showLocked && (!status || status === 'LOCKED')) return null;
                      const tileDef =
                        teams[0]?.tiles?.find((t) => t.tileCode === code)?.tileDef ?? null;
                      return (
                        <SpectatorTile
                          key={code}
                          tileCode={code}
                          tileDef={tileDef}
                          teamStatuses={tileTeamStatuses[code] ?? []}
                          isNewlyCompleted={recentlyCompleted.has(code)}
                        />
                      );
                    })}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </VStack>

      {isSiteAdmin && (
        <Box
          position="fixed"
          bottom={4}
          right={4}
          bg="gray.900"
          border="1px solid"
          borderColor="gray.600"
          borderRadius="lg"
          p={3}
          zIndex={100}
          minW="160px"
        >
          <Text fontSize="10px" color="gray.500" fontWeight="bold" textTransform="uppercase" letterSpacing="wider" mb={2}>
            Dev tools
          </Text>
          <VStack gap={2} align="stretch">
            <Button size="xs" colorScheme="blue" variant="outline" onClick={() => triggerTest('tile')}>
              Test tile complete
            </Button>
            <Button size="xs" colorScheme="yellow" variant="outline" onClick={() => triggerTest('capstone')}>
              Test capstone
            </Button>
            <Button size="xs" colorScheme="purple" variant="outline" onClick={() => triggerTest('board')}>
              Test board complete
            </Button>
          </VStack>
        </Box>
      )}
    </Box>
    {celebrationOverlay}
    </>
  );
}
