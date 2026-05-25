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
  BOARD_W,
  BOARD_H,
  tileStyle,
  tileCenterPx,
  COLOR_BG,
  COLOR_TEXT,
  TEAM_PALETTE,
} from '../utils/rainbowBoard';
import { TILE_FUN_FACTS } from '../utils/rainbowFunFacts';

const STATUS_RANK = { LOCKED: 0, UNLOCKED: 1, SUBMITTED: 2, COMPLETE: 3 };

const COLOR_ORDER = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet'];
const COLOR_META = {
  red: { label: 'Red', fill: '#e74c3c', track: '#3d1010', prefix: 'R', capstone: 'C1' },
  orange: { label: 'Orange', fill: '#e67e22', track: '#3d2510', prefix: 'O', capstone: 'C2' },
  yellow: { label: 'Yellow', fill: '#f1c40f', track: '#3d380a', prefix: 'Y', capstone: 'C3' },
  green: { label: 'Green', fill: '#2ecc71', track: '#0a2d1a', prefix: 'G', capstone: 'C4' },
  blue: { label: 'Blue', fill: '#3498db', track: '#0a1e30', prefix: 'B', capstone: 'C5' },
  indigo: { label: 'Indigo', fill: '#7766dd', track: '#1e1a40', prefix: 'I', capstone: 'C6' },
  violet: { label: 'Violet', fill: '#cc44cc', track: '#300a30', prefix: 'V', capstone: 'C7' },
};

function TeamRainbowCard({ team, teamIndex }) {
  const tileByCode = useMemo(
    () => Object.fromEntries((team.tiles ?? []).map((t) => [t.tileCode, t])),
    [team.tiles]
  );
  const totalComplete = (team.tiles ?? []).filter((t) => t.status === 'COMPLETE').length;
  const points = (team.tiles ?? []).reduce((sum, t) => {
    if (t.status !== 'COMPLETE') return sum;
    return sum + (t.tileCode.startsWith('C') ? 3 : 1);
  }, 0);

  return (
    <Box border="1px solid rgba(255,255,255,0.08)" borderRadius="xl" overflow="hidden">
      <HStack justify="space-between" px={4} py={3} bg="rgba(255,255,255,0.04)">
        <HStack gap={2}>
          <Box
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: TEAM_PALETTE[teamIndex % TEAM_PALETTE.length],
            }}
          />
          <Text fontWeight="bold" fontSize="sm" color="white">
            {team.teamName}
          </Text>
        </HStack>
        <HStack gap={3}>
          <Text fontSize="xs" color="yellow.400" fontWeight="semibold">
            {points} pts
          </Text>
          <Text fontSize="xs" color="gray.500">
            {Math.round((totalComplete / 56) * 100)}%
          </Text>
        </HStack>
      </HStack>
      {COLOR_ORDER.map((color) => {
        const meta = COLOR_META[color];
        const completed = [1, 2, 3, 4, 5, 6, 7].filter(
          (n) => tileByCode[`${meta.prefix}${n}`]?.status === 'COMPLETE'
        ).length;
        const capDone = tileByCode[meta.capstone]?.status === 'COMPLETE';
        const pct = (completed / 7) * 100;

        return (
          <Box key={color} position="relative" h="22px" bg={meta.track}>
            <Box
              position="absolute"
              top={0}
              left={0}
              h="100%"
              w={`${pct}%`}
              bg={meta.fill}
              transition="width 0.8s ease"
              style={{ boxShadow: pct > 0 ? `2px 0 10px ${meta.fill}55` : 'none' }}
            />
            <HStack
              position="absolute"
              top="50%"
              left="8px"
              transform="translateY(-50%)"
              gap={1}
              pointerEvents="none"
            >
              <Text
                fontSize="9px"
                fontWeight="bold"
                color="white"
                textTransform="uppercase"
                letterSpacing="wider"
                lineHeight="1"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
              >
                {meta.label}
              </Text>
              {capDone && (
                <Text
                  fontSize="10px"
                  lineHeight="1"
                  color="#ffd700"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  ★
                </Text>
              )}
            </HStack>
          </Box>
        );
      })}
    </Box>
  );
}

const ALL_FACTS = Object.values(TILE_FUN_FACTS);

function RotatingFunFact() {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * ALL_FACTS.length));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ALL_FACTS.length);
        setVisible(true);
      }, 500);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const fact = ALL_FACTS[index];

  return (
    <Box
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="xl"
      px={6}
      py={5}
      maxW="720px"
      mx="auto"
      textAlign="center"
      minH="220px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
    >
      <Text
        fontSize="xs"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wider"
        bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
        bgClip="text"
        mb={3}
      >
        Did you know?
      </Text>
      <Box transition="opacity 0.5s ease" opacity={visible ? 1 : 0}>
        <Text fontSize="sm" color="gray.200" lineHeight="1.8" mb={3}>
          {fact.fact}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Source:{' '}
          <Text
            as="a"
            href={fact.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="blue.400"
            _hover={{ textDecoration: 'underline' }}
          >
            {fact.source}
          </Text>
        </Text>
      </Box>
    </Box>
  );
}

function TrevorProjectBanner() {
  return (
    <Box
      maxW="720px"
      mx="auto"
      bg="rgba(0, 180, 140, 0.07)"
      border="1px solid"
      borderColor="teal.800"
      borderRadius="xl"
      px={6}
      py={4}
      textAlign="center"
    >
      <Text
        fontSize="xs"
        color="teal.400"
        fontWeight="bold"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
      >
        Supporting a good cause
      </Text>
      <Text fontSize="sm" color="gray.300" lineHeight="1.7">
        Support to this site during this event goes to{' '}
        <Text
          as="a"
          href="https://www.thetrevorproject.org"
          target="_blank"
          rel="noopener noreferrer"
          color="teal.300"
          fontWeight="semibold"
          _hover={{ textDecoration: 'underline' }}
        >
          The Trevor Project
        </Text>
        , the world's largest suicide prevention organization for LGBTQIA+ youth.
      </Text>
      <Text mt={2} fontSize="xs" color="gray.500">
        Want to donate directly?{' '}
        <Text
          as="a"
          href="https://www.thetrevorproject.org/donate/"
          target="_blank"
          rel="noopener noreferrer"
          color="teal.400"
          _hover={{ textDecoration: 'underline' }}
        >
          thetrevorproject.org/donate
        </Text>
      </Text>
    </Box>
  );
}

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
            stroke="#ffffff"
            strokeOpacity={active ? 0.45 : 0.12}
            strokeWidth={active ? 2 : 1}
            strokeDasharray={active ? undefined : '4 4'}
          >
            {active && (
              <animate
                attributeName="stroke-opacity"
                values="0.2;0.65;0.2"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </line>
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

  const isCapstone = tileCode.startsWith('C');
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
        ...(isCapstone && { transform: 'scale(1.18)', zIndex: 2 }),
        ...(isCapstone && hasComplete && { boxShadow: '0 0 14px 4px #ffd70055' }),
        ...(isNewlyCompleted && { animation: 'tileComplete 2.5s ease-out', zIndex: 10 }),
      }}
      bg={bgColor}
      border={
        isCapstone
          ? `2.5px solid ${hasComplete ? '#ffd700' : '#ffd70055'}`
          : allLocked
          ? '2px solid #33333388'
          : '2px solid #ffffff22'
      }
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
  const showLocked = false;

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
    setRecentlyCompleted((s) => {
      const n = new Set(s);
      codes.forEach((c) => n.add(c));
      return n;
    });
    setTimeout(() => {
      setRecentlyCompleted((s) => {
        const n = new Set(s);
        codes.forEach((c) => n.delete(c));
        return n;
      });
    }, 2500);
    if (type === 'board') {
      playBoardComplete();
      triggerCelebration('board');
    } else if (type === 'capstone') {
      playCapstoneComplete();
      triggerCelebration('capstone');
    } else {
      playTileComplete();
      triggerCelebration('tile');
    }
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
    const isInitialLoad = Object.keys(prev).length === 0 && Object.keys(mergedBoardMap).length > 0;
    prevMergedRef.current = { ...mergedBoardMap };
    if (isInitialLoad) return;
    const newlyDone = Object.keys(mergedBoardMap).filter(
      (code) => mergedBoardMap[code] === 'COMPLETE' && prev[code] !== 'COMPLETE'
    );
    if (newlyDone.length === 0) return;
    setRecentlyCompleted((s) => {
      const n = new Set(s);
      newlyDone.forEach((c) => n.add(c));
      return n;
    });
    const isCapstone = newlyDone.some((c) => c.startsWith('C'));
    if (isCapstone) {
      playCapstoneComplete();
      triggerCelebration('capstone');
    } else {
      playTileComplete();
      triggerCelebration('tile');
    }
    const timer = setTimeout(() => {
      setRecentlyCompleted((s) => {
        const n = new Set(s);
        newlyDone.forEach((c) => n.delete(c));
        return n;
      });
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
      <Box minH="100vh" color="white" py="72px" px={{ base: 3, md: 6 }}>
        <style>{`@keyframes tileComplete { 0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.9); } 50% { box-shadow: 0 0 0 16px rgba(255,215,0,0.35); } 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); } }`}</style>
        <VStack align="stretch" gap={5} maxW="1200px" mx="auto">
          <VStack align="center" gap={1}>
            <Heading
              size="lg"
              bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
              bgClip="text"
            >
              Rainbow Bingo
            </Heading>
          </VStack>

          {!event && !eventLoading && (
            <Center py={10}>
              <Text color="gray.500">No active Rainbow Bingo event.</Text>
            </Center>
          )}

          {event && (
            <>
              {event.status === 'COMPLETE' ? (
                <Box
                  bg="rgba(255,215,0,0.05)"
                  border="1px solid"
                  borderColor="yellow.700"
                  borderRadius="xl"
                  px={6}
                  py={5}
                  maxW="680px"
                  mx="auto"
                  textAlign="center"
                >
                  <Text fontSize="xl" mb={2}>
                    🏳️‍🌈
                  </Text>
                  <Text fontWeight="bold" color="yellow.300" fontSize="lg" mb={2}>
                    This event has ended!
                  </Text>
                  <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                    Thanks to everyone who participated — players, refs, and spectators alike. You
                    all made it something special. Here are the final standings.
                  </Text>
                </Box>
              ) : (
                <Text color="gray.300" textAlign="center" fontSize="sm" maxW="600px" mx="auto">
                  Welcome to Eternal Gems' Rainbow Bingo! We have{' '}
                  <Text as="span" color="white" fontWeight="semibold">
                    {teams.length} {teams.length === 1 ? 'team' : 'teams'}
                  </Text>{' '}
                  competing to fill out their rainbows. Whichever team completes the board first OR
                  whichever team(s) has the most points by the end of the event will win!
                </Text>
              )}

              {/* Team progress — primary visual */}
              {teams.length > 0 && (
                <Box>
                  <Text
                    fontSize="xs"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={3}
                  >
                    Team Progress
                  </Text>
                  <Box
                    display="grid"
                    gridTemplateColumns={{
                      base: '1fr',
                      sm: 'repeat(2, 1fr)',
                      lg: 'repeat(3, 1fr)',
                    }}
                    gap={4}
                  >
                    {teams.map((team, i) => (
                      <TeamRainbowCard key={team.teamId} team={team} teamIndex={i} />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Board map — secondary visual */}
              <Box>
                <Text
                  fontSize="xs"
                  color="gray.600"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={3}
                >
                  Board Map
                </Text>
                <Box overflowX="auto">
                  <Box display="flex" justifyContent="center">
                    <Box
                      bg="rgba(255,255,255,0.03)"
                      borderRadius="xl"
                      p="12px"
                      display="inline-block"
                      flexShrink={0}
                    >
                      <Box
                        position="relative"
                        style={{ width: BOARD_W, height: BOARD_H, zoom: 0.75 }}
                      >
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
                </Box>
              </Box>

              <RotatingFunFact />
              <TrevorProjectBanner />
            </>
          )}
        </VStack>

        {isSiteAdmin && process.env.REACT_APP_SHOW_DEV_TOOLS === 'true' && (
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
            <Text
              fontSize="10px"
              color="gray.500"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Dev tools
            </Text>
            <VStack gap={2} align="stretch">
              <Button
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => triggerTest('tile')}
              >
                Test tile complete
              </Button>
              <Button
                size="xs"
                colorScheme="yellow"
                variant="outline"
                onClick={() => triggerTest('capstone')}
              >
                Test capstone
              </Button>
              <Button
                size="xs"
                colorScheme="purple"
                variant="outline"
                onClick={() => triggerTest('board')}
              >
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
