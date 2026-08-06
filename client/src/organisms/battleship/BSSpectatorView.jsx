import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSubscription, useQuery } from '@apollo/client';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Badge,
  Button,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { BoardPanel } from './BSSharedComponents';
import { BS_SHOT_FIRED, BS_TILE_UPDATED, BS_GAME_OVER, GET_BS_SHOT_LOG } from '../../graphql/bsOperations';

const COL_LABELS = ['A','B','C','D','E','F','G','H','I','J'];
const coord = (row, col) => `${COL_LABELS[col] ?? col}${row + 1}`;

const TEAM_COLORS = {
  RED:    { primary: '#ef4444', dim: '#7f1d1d', bg: 'rgba(239,68,68,0.08)',    glow: 'rgba(239,68,68,0.3)'    },
  BLUE:   { primary: '#3b82f6', dim: '#1e3a8a', bg: 'rgba(59,130,246,0.08)',   glow: 'rgba(59,130,246,0.3)'   },
  GREEN:  { primary: '#22c55e', dim: '#14532d', bg: 'rgba(34,197,94,0.08)',    glow: 'rgba(34,197,94,0.3)'    },
  PURPLE: { primary: '#a855f7', dim: '#581c87', bg: 'rgba(168,85,247,0.08)',   glow: 'rgba(168,85,247,0.3)'   },
  ORANGE: { primary: '#f97316', dim: '#7c2d12', bg: 'rgba(249,115,22,0.08)',   glow: 'rgba(249,115,22,0.3)'   },
  YELLOW: { primary: '#eab308', dim: '#713f12', bg: 'rgba(234,179,8,0.08)',    glow: 'rgba(234,179,8,0.3)'    },
};
const fallbackColors = [
  { primary: '#ef4444', dim: '#7f1d1d', bg: 'rgba(239,68,68,0.08)',  glow: 'rgba(239,68,68,0.3)'  },
  { primary: '#3b82f6', dim: '#1e3a8a', bg: 'rgba(59,130,246,0.08)', glow: 'rgba(59,130,246,0.3)' },
];
const teamColor = (team, idx) =>
  (team?.color && TEAM_COLORS[team.color.toUpperCase()]) ?? fallbackColors[idx] ?? fallbackColors[0];

function ShotFlash({ flash, onDone }) {
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [flash, onDone]);

  if (!flash) return null;
  const isHit = flash.result === 'HIT';

  return (
    <Box
      position="fixed"
      top={0} left={0} right={0} bottom={0}
      zIndex={9999}
      pointerEvents="none"
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        animation: 'spectFlash 3.5s ease forwards',
        '@keyframes spectFlash': {
          '0%':   { opacity: 0, transform: 'scale(0.6)' },
          '12%':  { opacity: 1, transform: 'scale(1.08)' },
          '22%':  { opacity: 1, transform: 'scale(1)' },
          '65%':  { opacity: 1 },
          '100%': { opacity: 0 },
        },
      }}
    >
      <Box
        bg={isHit ? 'rgba(127,15,15,0.95)' : 'rgba(10,30,80,0.95)'}
        border="2px solid"
        borderColor={isHit ? '#f87171' : '#60a5fa'}
        borderRadius="2xl"
        px={[8, 16]}
        py={[5, 8]}
        textAlign="center"
        boxShadow={
          isHit
            ? '0 0 80px #ef4444, 0 0 160px rgba(239,68,68,0.4), inset 0 0 40px rgba(239,68,68,0.1)'
            : '0 0 80px #3b82f6, 0 0 160px rgba(59,130,246,0.4), inset 0 0 40px rgba(59,130,246,0.1)'
        }
      >
        <Text fontSize={['3xl', '5xl']} mb={1} sx={{ animation: isHit ? 'hitShake 0.4s ease' : undefined, '@keyframes hitShake': { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-8deg) scale(1.2)' }, '75%': { transform: 'rotate(8deg) scale(1.2)' } } }}>
          {isHit ? '💥' : '🌊'}
        </Text>
        <Text fontFamily="mono" fontSize={['xl', '3xl']} fontWeight="black" color="white" letterSpacing="widest" textTransform="uppercase">
          {isHit ? 'Direct Hit!' : 'Ocean'}
        </Text>
        <Text fontFamily="mono" fontSize={['md', 'xl']} fontWeight="bold" color={isHit ? '#fca5a5' : '#93c5fd'} letterSpacing="wider" mt={2}>
          {flash.firingTeamName}
        </Text>
        <Text fontFamily="mono" fontSize={['lg', '2xl']} fontWeight="black" color="white" letterSpacing="widest" mt={1}>
          {coord(flash.row, flash.col)}
        </Text>
      </Box>
    </Box>
  );
}

export function BSSpectatorView({ event, refetch }) {
  const teams = event.teams ?? [];
  const teamA = teams[0] ?? null;
  const teamB = teams[1] ?? null;
  const boardA = teamA?.board ?? null;
  const boardB = teamB?.board ?? null;
  const tilesA = boardA?.tiles ?? [];
  const tilesB = boardB?.tiles ?? [];
  const colA = teamColor(teamA, 0);
  const colB = teamColor(teamB, 1);

  const teamMap = useMemo(() => new Map(teams.map((t) => [t.teamId, t])), [teams]);

  const { data: shotLogData } = useQuery(GET_BS_SHOT_LOG, {
    variables: { eventId: event.eventId },
    fetchPolicy: 'cache-and-network',
  });

  const [flash, setFlash] = useState(null);
  const [liveShots, setLiveShots] = useState([]);
  const flashTimeoutRef = useRef(null);

  const historicalShots = useMemo(() => {
    const log = shotLogData?.getBSShotLog ?? [];
    return [...log]
      .sort((a, b) => new Date(b.shotAt) - new Date(a.shotAt))
      .slice(0, 20)
      .map((s) => {
        const team = teamMap.get(s.firingTeamId);
        return {
          result: s.result,
          row: s.row,
          col: s.col,
          firingTeamName: team?.teamName ?? 'Unknown',
          teamColor: teamColor(team, teams.indexOf(team)),
          shotAt: s.shotAt,
        };
      });
  }, [shotLogData, teamMap, teams]);

  // Merge live shots on top of historical; deduplicate by coord+team+time
  const recentShots = useMemo(() => {
    const merged = [...liveShots];
    for (const h of historicalShots) {
      const isDupe = liveShots.some(
        (l) => l.row === h.row && l.col === h.col && l.firingTeamName === h.firingTeamName && l.shotAt === h.shotAt
      );
      if (!isDupe) merged.push(h);
    }
    return merged.slice(0, 20);
  }, [liveShots, historicalShots]);

  useSubscription(BS_SHOT_FIRED, {
    variables: { eventId: event.eventId },
    skip: event.status !== 'ACTIVE',
    onData: ({ data }) => {
      const shot = data?.data?.bsShotFired;
      if (!shot) return;
      const firingTeam = teams.find((t) => t.teamId === shot.firingTeamId);
      const entry = {
        result: shot.result,
        row: shot.row,
        col: shot.col,
        firingTeamName: firingTeam?.teamName ?? 'Unknown',
        teamColor: teamColor(firingTeam, teams.indexOf(firingTeam)),
        shotAt: shot.shotAt,
      };
      setFlash(entry);
      setLiveShots((prev) => [entry, ...prev.slice(0, 19)]);
      refetch();
    },
  });

  useSubscription(BS_TILE_UPDATED, {
    variables: { boardId: boardA?.boardId },
    skip: !boardA?.boardId || event.status !== 'ACTIVE',
    onData: () => refetch(),
  });
  useSubscription(BS_TILE_UPDATED, {
    variables: { boardId: boardB?.boardId },
    skip: !boardB?.boardId || event.status !== 'ACTIVE',
    onData: () => refetch(),
  });
  useSubscription(BS_GAME_OVER, {
    variables: { eventId: event.eventId },
    skip: !event.eventId || event.status === 'COMPLETED',
    onData: () => refetch(),
  });

  const clearFlash = () => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlash(null);
  };

  const hitsAgainst = (tiles) => tiles.filter((t) => t.isShot && t.shipType).length;
  const shipTilesLeft = (tiles) => tiles.filter((t) => t.shipType && !(t.taskCompleted || t.skipped)).length;
  const totalShipTiles = (tiles) => tiles.filter((t) => t.shipType).length;
  const healthPct = (tiles) => {
    const total = totalShipTiles(tiles);
    if (total === 0) return 100;
    return Math.round((shipTilesLeft(tiles) / total) * 100);
  };

  return (
    <Box
      flex="1"
      minH="100vh"
      bg="#020a04"
      sx={{
        backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.03) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(34,197,94,0.03) 0%, transparent 60%)',
      }}
    >
      <ShotFlash flash={flash} onDone={clearFlash} />

      {/* Spectator topbar */}
      <Box
        bg="rgba(2,10,4,0.9)"
        borderBottom="1px solid"
        borderColor="#1a4028"
        px={[4, 6, 8]}
        py={3}
        position="sticky"
        top={0}
        zIndex={2}
        backdropFilter="blur(8px)"
      >
        <HStack justify="space-between" maxW="1400px" mx="auto" flexWrap="wrap" gap={2}>
          <HStack spacing={3}>
            <RouterLink to="/battleship">
              <Button size="xs" variant="ghost" color="#6b9e78" leftIcon={<ArrowBackIcon />} fontFamily="mono" fontSize="xs" _hover={{ color: '#d4f0da', bg: 'transparent' }}>
                Campaigns
              </Button>
            </RouterLink>
            <Box w="1px" h="16px" bg="#1a4028" />
            <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#d4f0da" letterSpacing="wide">
              {event.eventName}
            </Text>
            <Badge colorScheme="green" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
              LIVE
            </Badge>
          </HStack>
          <HStack spacing={2}>
            <Box
              w="6px" h="6px" borderRadius="full" bg="#22c55e"
              sx={{ animation: 'specPulse 1.5s ease-in-out infinite', '@keyframes specPulse': { '0%,100%': { opacity: 1, boxShadow: '0 0 4px #22c55e' }, '50%': { opacity: 0.4, boxShadow: 'none' } } }}
            />
            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" textTransform="uppercase">
              Spectating
            </Text>
          </HStack>
        </HStack>
      </Box>

      <Box maxW="1400px" mx="auto" px={[4, 6, 8]} py={[5, 7]}>
        <VStack align="stretch" spacing={6}>

          {/* Scoreboard header */}
          <SimpleGrid columns={3} alignItems="center" gap={3}>
            {/* Team A */}
            <Box
              bg={colA.bg}
              border="1px solid"
              borderColor={colA.dim}
              borderRadius="lg"
              px={[3, 6]}
              py={[3, 4]}
              textAlign="left"
            >
              <Text fontFamily="mono" fontSize="10px" color={colA.primary} letterSpacing="widest" textTransform="uppercase" mb={1}>
                {teamA?.teamName ?? 'Team A'}
              </Text>
              <Text fontFamily="mono" fontSize={['2xl', '3xl']} fontWeight="black" color="white" lineHeight="1">
                {healthPct(tilesA)}%
              </Text>
              <Text fontFamily="mono" fontSize="10px" color={colA.primary} opacity={0.7} mt={1}>
                hull integrity
              </Text>
              {/* Health bar */}
              <Box mt={2} h="4px" bg={colA.dim} borderRadius="full" overflow="hidden">
                <Box
                  h="full"
                  w={`${healthPct(tilesA)}%`}
                  bg={colA.primary}
                  borderRadius="full"
                  sx={{ transition: 'width 0.6s ease', boxShadow: `0 0 6px ${colA.primary}` }}
                />
              </Box>
            </Box>

            {/* VS */}
            <VStack spacing={1} align="center">
              <Text fontFamily="mono" fontSize={['xl', '2xl']} fontWeight="black" color="#1a4028" letterSpacing="widest">
                VS
              </Text>
              <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase">
                {recentShots.length} shots fired
              </Text>
            </VStack>

            {/* Team B */}
            <Box
              bg={colB.bg}
              border="1px solid"
              borderColor={colB.dim}
              borderRadius="lg"
              px={[3, 6]}
              py={[3, 4]}
              textAlign="right"
            >
              <Text fontFamily="mono" fontSize="10px" color={colB.primary} letterSpacing="widest" textTransform="uppercase" mb={1}>
                {teamB?.teamName ?? 'Team B'}
              </Text>
              <Text fontFamily="mono" fontSize={['2xl', '3xl']} fontWeight="black" color="white" lineHeight="1">
                {healthPct(tilesB)}%
              </Text>
              <Text fontFamily="mono" fontSize="10px" color={colB.primary} opacity={0.7} mt={1}>
                hull integrity
              </Text>
              <Box mt={2} h="4px" bg={colB.dim} borderRadius="full" overflow="hidden">
                <Box
                  h="full"
                  w={`${healthPct(tilesB)}%`}
                  bg={colB.primary}
                  borderRadius="full"
                  sx={{ transition: 'width 0.6s ease', boxShadow: `0 0 6px ${colB.primary}` }}
                  ml="auto"
                />
              </Box>
            </Box>
          </SimpleGrid>

          {/* Boards */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            <Box
              border="1px solid"
              borderColor={colA.dim}
              borderRadius="lg"
              overflow="hidden"
              boxShadow={`0 0 24px ${colA.glow}, inset 0 0 40px rgba(0,0,0,0.4)`}
            >
              <Box px={3} py={2} bg={colA.bg} borderBottom="1px solid" borderColor={colA.dim}>
                <Text fontFamily="mono" fontSize="10px" fontWeight="bold" color={colA.primary} letterSpacing="widest" textTransform="uppercase">
                  {teamA?.teamName ?? 'Team A'}'s Waters
                </Text>
              </Box>
              <Box p={3} bg="#020a04">
                <BoardPanel
                  title=""
                  tiles={tilesA}
                  showShips={false}
                  canFire={false}
                />
              </Box>
            </Box>

            <Box
              border="1px solid"
              borderColor={colB.dim}
              borderRadius="lg"
              overflow="hidden"
              boxShadow={`0 0 24px ${colB.glow}, inset 0 0 40px rgba(0,0,0,0.4)`}
            >
              <Box px={3} py={2} bg={colB.bg} borderBottom="1px solid" borderColor={colB.dim}>
                <Text fontFamily="mono" fontSize="10px" fontWeight="bold" color={colB.primary} letterSpacing="widest" textTransform="uppercase">
                  {teamB?.teamName ?? 'Team B'}'s Waters
                </Text>
              </Box>
              <Box p={3} bg="#020a04">
                <BoardPanel
                  title=""
                  tiles={tilesB}
                  showShips={false}
                  canFire={false}
                />
              </Box>
            </Box>
          </SimpleGrid>

          {/* Combat log */}
          {recentShots.length > 0 && (
            <Box>
              <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="widest" textTransform="uppercase" mb={2}>
                Combat Log
              </Text>
              <VStack align="stretch" spacing={1} maxH="260px" overflowY="auto"
                sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#1a4028', borderRadius: '2px' }, scrollbarWidth: 'thin', scrollbarColor: '#1a4028 transparent' }}
              >
                {recentShots.map((s, i) => {
                  const tc = s.teamColor;
                  const isHit = s.result === 'HIT';
                  return (
                    <HStack
                      key={i}
                      px={3}
                      py={2}
                      bg={i === 0 ? (isHit ? 'rgba(239,68,68,0.08)' : 'rgba(59,130,246,0.08)') : '#060f0a'}
                      border="1px solid"
                      borderColor={i === 0 ? (isHit ? '#7f1d1d' : '#1e3a8a') : '#0d2018'}
                      borderRadius="sm"
                      spacing={3}
                      opacity={1 - i * 0.04}
                    >
                      <Text fontSize="md" w="20px" textAlign="center" flexShrink={0}>
                        {isHit ? '💥' : '🌊'}
                      </Text>
                      <Text fontFamily="mono" fontSize="xs" fontWeight="black" color="white" w="28px" flexShrink={0} letterSpacing="wider">
                        {coord(s.row, s.col)}
                      </Text>
                      <Badge
                        fontSize="9px"
                        textTransform="uppercase"
                        letterSpacing="wider"
                        colorScheme={isHit ? 'red' : 'blue'}
                        flexShrink={0}
                      >
                        {isHit ? 'Hit' : 'Miss'}
                      </Badge>
                      <Text fontFamily="mono" fontSize="xs" color={tc?.primary ?? '#6b9e78'} fontWeight="semibold">
                        {s.firingTeamName}
                      </Text>
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          )}

          {recentShots.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text fontFamily="mono" fontSize="xs" color="#1a4028" letterSpacing="widest" textTransform="uppercase">
                Waiting for first shot...
              </Text>
            </Box>
          )}

        </VStack>
      </Box>
    </Box>
  );
}
