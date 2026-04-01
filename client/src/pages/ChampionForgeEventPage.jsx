import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  Button,
  SimpleGrid,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { ArrowBackIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaShieldAlt, FaScroll, FaCrown } from 'react-icons/fa';
import BattleReplayModal from '../organisms/ChampionForge/BattleReplayModal';
import { GET_CLAN_WARS_EVENT, CLAN_WARS_EVENT_UPDATED } from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { isChampionForgeEnabled } from '../config/featureFlags';
import usePageTitle from '../hooks/usePageTitle';
import AdminEventPanel from '../organisms/ChampionForge/AdminEventPanel';
import ClanWarsDraftPanel from '../organisms/ChampionForge/ClanWarsDraftPanel';
import GatheringPhase from '../organisms/ChampionForge/GatheringPhase';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'gray', description: 'Event is being set up.' },
  GATHERING: {
    label: 'Gathering',
    color: 'green',
    description: 'Players are completing tasks to fill their war chest.',
  },
  OUTFITTING: {
    label: 'Outfitting',
    color: 'blue',
    description: 'Teams are drafting their loadouts.',
  },
  BATTLE: { label: 'Battle', color: 'red', description: 'Champions are fighting!' },
  COMPLETED: { label: 'Completed', color: 'purple', description: 'The event has ended.' },
};

const ROLE_COLORS = { PVMER: 'orange', SKILLER: 'teal', ANY: 'purple' };

function calcCountdown(target) {
  if (!target) return null;
  const diff = new Date(target) - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
  if (h > 0) return `${h}h ${m}m ${s}s remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

function useCountdown(target) {
  const [label, setLabel] = useState(() => calcCountdown(target));
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setLabel(calcCountdown(target)), 1_000);
    return () => clearInterval(id);
  }, [target]);
  return label;
}

// ---------------------------------------------------------------------------
// Phase banner — shown below the header for live phases
// ---------------------------------------------------------------------------
function PhaseBanner({ event, eventId }) {
  const navigate = useNavigate();
  const { status, gatheringEnd, outfittingEnd } = event;
  const gatheringCountdown = useCountdown(gatheringEnd);
  const outfittingCountdown = useCountdown(outfittingEnd);

  if (status === 'DRAFT') return null;

  if (status === 'GATHERING') {
    return (
      <Box bg="green.900" border="1px solid" borderColor="green.700" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="green.200">
              ⚒️ Gathering Phase
            </Text>
            <Text fontSize="sm" color="green.400">
              Players are completing tasks to earn war chest items.
            </Text>
          </VStack>
          {gatheringEnd && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {gatheringCountdown}
            </Badge>
          )}
        </HStack>
      </Box>
    );
  }

  if (status === 'OUTFITTING') {
    return (
      <Box bg="blue.900" border="1px solid" borderColor="blue.700" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="blue.200">
              🛡️ Outfitting Phase
            </Text>
            <Text fontSize="sm" color="blue.400">
              Captains are locking in their team loadouts.
            </Text>
          </VStack>
          {outfittingEnd && (
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {outfittingCountdown}
            </Badge>
          )}
        </HStack>
      </Box>
    );
  }

  if (status === 'BATTLE') {
    return (
      <Box
        bg="red.900"
        border="2px solid"
        borderColor="red.500"
        borderRadius="lg"
        p={4}
        boxShadow="0 0 20px rgba(229,62,62,0.3)"
      >
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="red.200" fontSize="lg">
              ⚔️ Battle in Progress!
            </Text>
            <Text fontSize="sm" color="red.300">
              Champions are locked in combat.
            </Text>
          </VStack>
          <Button
            colorScheme="red"
            size="sm"
            onClick={() => navigate(`/champion-forge/${eventId}/battle`)}
          >
            Watch the Battle →
          </Button>
        </HStack>
      </Box>
    );
  }

  if (status === 'COMPLETED') {
    const winner =
      event.bracket?.grandFinal?.winnerId ??
      event.bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;
    const winnerTeam = winner ? event.teams?.find((t) => t.teamId === winner) : null;

    return (
      <Box bg="teal.900" border="1px solid" borderColor="teal.600" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <HStack>
              <Text fontSize="xl">🏆</Text>
              <Text fontWeight="bold" color="teal.200">
                {winnerTeam ? `${winnerTeam.teamName} won!` : 'Event complete'}
              </Text>
            </HStack>
            <Text fontSize="sm" color="teal.400">
              The battle has concluded.
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Completed event sub-components
// ---------------------------------------------------------------------------
function WinnerBanner({ event }) {
  const winnerId =
    event.bracket?.grandFinal?.winnerId ??
    event.bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;
  const winnerTeam = winnerId ? (event.teams ?? []).find((t) => t.teamId === winnerId) : null;

  return (
    <Box
      bgGradient="linear(to-r, yellow.900, purple.900)"
      border="2px solid"
      borderColor="yellow.600"
      borderRadius="xl"
      p={6}
      textAlign="center"
      boxShadow="0 0 30px rgba(214,158,46,0.25)"
    >
      <Text fontSize="4xl" mb={2}>🏆</Text>
      {winnerTeam ? (
        <>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.300" mb={1}>
            {winnerTeam.teamName}
          </Text>
          <Text fontSize="sm" color="yellow.600" mb={3}>
            Champion of {event.eventName}
          </Text>
          {winnerTeam.members?.length > 0 && (
            <HStack justify="center" spacing={2}>
              <AvatarGroup size="sm" max={6}>
                {winnerTeam.members.map((m, i) => (
                  <Tooltip
                    key={m.discordId ?? i}
                    label={`${m.username ?? m.discordId}${m.discordId === winnerTeam.captainDiscordId ? ' 👑' : ''}`}
                    hasArrow
                  >
                    <Avatar
                      name={m.username ?? m.discordId}
                      src={
                        m.avatar
                          ? `https://cdn.discordapp.com/avatars/${m.discordId}/${m.avatar}.png`
                          : undefined
                      }
                      bg="yellow.700"
                    />
                  </Tooltip>
                ))}
              </AvatarGroup>
            </HStack>
          )}
        </>
      ) : (
        <Text fontSize="xl" color="yellow.400">Event Complete</Text>
      )}
    </Box>
  );
}

function CompletedBracket({ bracket, teams, onRewatch }) {
  if (!bracket?.rounds?.length) return null;

  const isDE = bracket.type === 'DOUBLE_ELIMINATION';
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.teamId, t]));

  const MatchRow = ({ match }) => {
    const team1 = teamMap[match.team1Id];
    const team2 = match.team2Id ? teamMap[match.team2Id] : null;
    const winner = match.winnerId ? teamMap[match.winnerId] : null;

    return (
      <Box
        bg="gray.800"
        border="1px solid"
        borderColor={match.winnerId ? 'teal.700' : 'gray.700'}
        borderRadius="lg"
        p={3}
      >
        {match.isBye ? (
          <HStack spacing={3}>
            <Text color="teal.200" fontWeight="bold">{team1?.teamName ?? match.team1Id}</Text>
            <Badge colorScheme="gray" fontSize="xs">Bye</Badge>
          </HStack>
        ) : (
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <HStack spacing={3}>
              <Text
                color={match.winnerId === match.team1Id ? 'teal.200' : 'gray.400'}
                fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}
              >
                {team1?.teamName ?? match.team1Id}
              </Text>
              <Text color="gray.600" fontSize="xs">vs</Text>
              <Text
                color={match.winnerId === match.team2Id ? 'teal.200' : 'gray.400'}
                fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
              >
                {team2?.teamName ?? match.team2Id}
              </Text>
            </HStack>
            <HStack spacing={2}>
              {winner && (
                <Badge colorScheme="teal" fontSize="xs">
                  Winner: {winner.teamName}
                </Badge>
              )}
              {!match.winnerId && (
                <Badge colorScheme="gray" fontSize="xs">Pending</Badge>
              )}
              {match.battleId && (
                <Button
                  size="xs"
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => onRewatch(match.battleId)}
                >
                  ⏮ Rewatch
                </Button>
              )}
            </HStack>
          </HStack>
        )}
      </Box>
    );
  };

  const RoundSection = ({ label, matches, accent }) => (
    <Box>
      <Text
        fontSize="xs"
        color={accent ?? 'gray.500'}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
      >
        {label}
      </Text>
      <VStack align="stretch" spacing={2}>
        {matches.map((match, i) => (
          <MatchRow key={i} match={match} />
        ))}
      </VStack>
    </Box>
  );

  const getSELabel = (i, total) => {
    if (total === 1 || i === total - 1) return 'Final';
    if (i === total - 2) return 'Semifinals';
    return `Round ${i + 1}`;
  };

  return (
    <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
      <HStack mb={4} spacing={2}>
        <Text fontSize="lg">⚔️</Text>
        <Text fontWeight="bold" color="white" fontSize="lg">Battle Results</Text>
      </HStack>

      {isDE ? (
        <VStack align="stretch" spacing={6}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="teal.300" mb={3}>Winners Bracket</Text>
            <VStack align="stretch" spacing={5}>
              {bracket.rounds.map((round, i) => (
                <RoundSection key={i} label={round.label ?? `Round ${i + 1}`} matches={round.matches} />
              ))}
            </VStack>
          </Box>
          {bracket.losersBracket?.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="orange.300" mb={3}>Losers Bracket</Text>
              <VStack align="stretch" spacing={5}>
                {bracket.losersBracket.map((round, i) => (
                  <RoundSection key={i} label={round.label ?? `LB Round ${i + 1}`} matches={round.matches} accent="orange.700" />
                ))}
              </VStack>
            </Box>
          )}
          {bracket.grandFinal && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="yellow.300" mb={3}>Grand Final</Text>
              <Box
                bg="gray.750"
                border="2px solid"
                borderColor="yellow.600"
                borderRadius="lg"
                p={3}
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={3}>
                    <Text
                      color={bracket.grandFinal.winnerId === bracket.grandFinal.team1Id ? 'yellow.300' : 'gray.400'}
                      fontWeight={bracket.grandFinal.winnerId === bracket.grandFinal.team1Id ? 'bold' : 'normal'}
                    >
                      {teamMap[bracket.grandFinal.team1Id]?.teamName ?? bracket.grandFinal.team1Id}
                    </Text>
                    <Text color="gray.600" fontSize="xs">vs</Text>
                    <Text
                      color={bracket.grandFinal.winnerId === bracket.grandFinal.team2Id ? 'yellow.300' : 'gray.400'}
                      fontWeight={bracket.grandFinal.winnerId === bracket.grandFinal.team2Id ? 'bold' : 'normal'}
                    >
                      {teamMap[bracket.grandFinal.team2Id]?.teamName ?? bracket.grandFinal.team2Id}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    {bracket.grandFinal.winnerId && (
                      <Badge colorScheme="yellow" fontSize="xs">
                        🏆 {teamMap[bracket.grandFinal.winnerId]?.teamName}
                      </Badge>
                    )}
                    {bracket.grandFinal.battleId && (
                      <Button
                        size="xs"
                        colorScheme="purple"
                        variant="ghost"
                        onClick={() => onRewatch(bracket.grandFinal.battleId)}
                      >
                        ⏮ Rewatch
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Box>
            </Box>
          )}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={5}>
          {bracket.rounds.map((round, i) => (
            <RoundSection key={i} label={getSELabel(i, bracket.rounds.length)} matches={round.matches} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

function CompletedTeamsGrid({ teams, bracket }) {
  const winnerId =
    bracket?.grandFinal?.winnerId ??
    bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;

  // Runner-up: loser of the grand final (DE) or the non-winner finalist (SE)
  const runnerUpId = bracket?.grandFinal
    ? (bracket.grandFinal.team1Id === winnerId
        ? bracket.grandFinal.team2Id
        : bracket.grandFinal.team1Id)
    : bracket?.rounds?.slice(-1)[0]?.matches?.[0]
      ? (bracket.rounds.slice(-1)[0].matches[0].team1Id === winnerId
          ? bracket.rounds.slice(-1)[0].matches[0].team2Id
          : bracket.rounds.slice(-1)[0].matches[0].team1Id)
      : null;

  if (!teams?.length) return null;

  return (
    <Box>
      <Text
        fontWeight="semibold"
        fontSize="sm"
        color="gray.400"
        mb={3}
        textTransform="uppercase"
        letterSpacing="wide"
      >
        All Teams
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
        {teams.map((team) => {
          const isWinner = team.teamId === winnerId;
          const isRunnerUp = team.teamId === runnerUpId;
          return (
            <Box
              key={team.teamId}
              bg="gray.800"
              border="1px solid"
              borderColor={isWinner ? 'yellow.500' : isRunnerUp ? 'gray.500' : 'gray.700'}
              borderRadius="lg"
              p={4}
            >
              <HStack mb={2} justify="space-between">
                <Text fontWeight="bold" color="white" fontSize="sm" noOfLines={1}>
                  {isWinner && '🏆 '}{team.teamName}
                </Text>
                {isWinner && <Badge colorScheme="yellow" fontSize="xs">Champion</Badge>}
                {isRunnerUp && <Badge colorScheme="gray" fontSize="xs">Runner-up</Badge>}
              </HStack>
              <VStack align="flex-start" spacing={1}>
                <Text fontSize="xs" color="gray.500">
                  {team.members?.length ?? 0} members
                </Text>
                {(team.completedTaskIds?.length ?? 0) > 0 && (
                  <Text fontSize="xs" color="green.400">
                    ✓ {team.completedTaskIds.length} tasks completed
                  </Text>
                )}
                {(team.items?.length ?? 0) > 0 && (
                  <Text fontSize="xs" color="gray.400">
                    ⚔ {team.items.length} items
                  </Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Team card — public view with barracks link
// ---------------------------------------------------------------------------
function TeamCard({ team, eventId, currentUserDiscordId, isAdmin, phase }) {
  const navigate = useNavigate();

  const isMember = useMemo(() => {
    if (!currentUserDiscordId) return false;
    return (team.members ?? []).some((m) =>
      typeof m === 'string'
        ? m === currentUserDiscordId
        : (m?.discordId ?? m?.discordUserId) === currentUserDiscordId
    );
  }, [team.members, currentUserDiscordId]);

  const canEnterBarracks = isAdmin || isMember;

  const barracksPath = `/champion-forge/${eventId}/barracks/${team.teamId}`;

  const loadoutStatus = team.loadoutLocked
    ? { icon: LockIcon, color: 'green.400', label: 'Loadout locked' }
    : { icon: UnlockIcon, color: 'gray.500', label: 'Loadout not locked' };

  const completedCount = team.completedTaskIds?.length ?? 0;
  const itemCount = team.items?.length ?? 0;

  // Role breakdown
  const pvmers = (team.members ?? []).filter((m) => m.role === 'PVMER').length;
  const skillers = (team.members ?? []).filter((m) => m.role === 'SKILLER').length;
  const anyRole = (team.members ?? []).filter((m) => m.role === 'ANY' || !m.role).length;

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={isMember ? 'teal.600' : 'gray.700'}
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{ borderColor: isMember ? 'teal.400' : 'gray.500' }}
      display="flex"
      flexDirection="column"
    >
      {/* Card header */}
      <Box
        bg={isMember ? 'teal.900' : 'gray.750'}
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor={isMember ? 'teal.700' : 'gray.700'}
      >
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaShieldAlt} color={isMember ? 'teal.300' : 'gray.500'} />
            <Text fontWeight="bold" color="white" fontSize="md">
              {team.teamName}
            </Text>
            {isMember && (
              <Badge colorScheme="teal" fontSize="xs">
                Your Team
              </Badge>
            )}
          </HStack>
          <Tooltip label={loadoutStatus.label} hasArrow>
            <Icon as={loadoutStatus.icon} color={loadoutStatus.color} boxSize={3} />
          </Tooltip>
        </HStack>
      </Box>

      {/* Card body */}
      <VStack align="stretch" spacing={3} p={4} flex={1}>
        {/* Member avatars */}
        {team.members?.length > 0 ? (
          <HStack spacing={3}>
            <AvatarGroup size="xs" max={6}>
              {team.members.map((m, i) => {
                const isCaptain = m.discordId === team.captainDiscordId;
                const avatar = (
                  <Avatar
                    name={m.username ?? m.discordId}
                    src={
                      m.avatar
                        ? `https://cdn.discordapp.com/avatars/${m.discordId}/${m.avatar}.png`
                        : undefined
                    }
                    bg="gray.600"
                  />
                );
                return (
                  <Tooltip
                    key={m.discordId ?? i}
                    label={`${m.username ?? m.discordId}${isCaptain ? ' 👑 Captain' : ''} (${
                      m.role ?? 'ANY'
                    })`}
                    hasArrow
                  >
                    {isCaptain ? (
                      <Box position="relative" display="inline-flex">
                        {avatar}
                        <Icon
                          as={FaCrown}
                          position="absolute"
                          top="-7px"
                          left="50%"
                          transform="translateX(-50%)"
                          color="yellow.400"
                          boxSize="10px"
                          filter="drop-shadow(0 1px 1px rgba(0,0,0,0.8))"
                        />
                      </Box>
                    ) : (
                      avatar
                    )}
                  </Tooltip>
                );
              })}
            </AvatarGroup>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" color="gray.300" fontWeight="medium">
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
              </Text>
              <HStack spacing={1}>
                {pvmers > 0 && (
                  <Badge colorScheme="orange" fontSize="xs">
                    {pvmers} PvM
                  </Badge>
                )}
                {skillers > 0 && (
                  <Badge colorScheme="teal" fontSize="xs">
                    {skillers} Skill
                  </Badge>
                )}
                {anyRole > 0 && (
                  <Badge colorScheme="purple" fontSize="xs">
                    {anyRole} Any
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        ) : (
          <Text fontSize="xs" color="gray.600">
            No members yet
          </Text>
        )}

        {/* Stats row */}
        {(phase === 'GATHERING' ||
          phase === 'OUTFITTING' ||
          phase === 'BATTLE' ||
          phase === 'COMPLETED') && (
          <HStack spacing={3}>
            {completedCount > 0 && (
              <HStack spacing={1}>
                <Icon as={FaScroll} color="green.400" boxSize={3} />
                <Text fontSize="xs" color="gray.400">
                  {completedCount} tasks done
                </Text>
              </HStack>
            )}
            {itemCount > 0 && (
              <HStack spacing={1}>
                <Text fontSize="xs" color="gray.400">
                  ⚔ {itemCount} items
                </Text>
              </HStack>
            )}
          </HStack>
        )}

        {/* CTA */}
        {canEnterBarracks && (
          <Button mt="auto"
            size="sm"
            colorScheme="purple"
            onClick={() => navigate(barracksPath)}
            leftIcon={<Icon as={FaShieldAlt} />}
          >
            Enter Barracks
          </Button>
        )}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ChampionForgeEventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(CLAN_WARS_EVENT_UPDATED, {
    variables: { eventId },
    onData: () => refetch(),
  });

  const event = data?.getClanWarsEvent;

  usePageTitle(event ? `${event.eventName} — Champion Forge` : 'Champion Forge');

  const isAdmin = !!(
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id)
  );

  const [viewAsParticipant, setViewAsParticipant] = useState(false);
  const effectiveIsAdmin = isAdmin && !viewAsParticipant;
  const [replayBattleId, setReplayBattleId] = useState(null);

  // Get the logged-in user's Discord ID for team membership checks
  const currentUserDiscordId = user?.discordUserId ?? null;

  if (!isChampionForgeEnabled(user)) return <Navigate to="/champion-forge" replace />;

  if (loading && !event) {
    return (
      <Center flex="1">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Center flex="1">
        <Text color="red.400">Event not found or failed to load.</Text>
      </Center>
    );
  }

  const meta = STATUS_META[event.status] ?? STATUS_META.DRAFT;

  const backNav = (
    <Button
      as={RouterLink}
      to="/champion-forge"
      size="sm"
      variant="ghost"
      color="gray.400"
      leftIcon={<ArrowBackIcon />}
      alignSelf="flex-start"
      _hover={{ color: 'white' }}
    >
      All Events
    </Button>
  );

  const eventHeader = (
    <Box bg="gray.800" borderRadius="xl" p={6} border="1px solid" borderColor="gray.700">
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <VStack align="flex-start" spacing={2}>
          <HStack spacing={3} flexWrap="wrap">
            <Heading size="lg" color="white">
              {event.eventName}
            </Heading>
            <Badge colorScheme={meta.color} fontSize="sm" px={2} py={1}>
              {meta.label}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {meta.description}
          </Text>
          {event.clanId && (
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              Clan: {event.clanId}
            </Text>
          )}
        </VStack>

        {event.eventConfig && (
          <SimpleGrid columns={3} spacing={4} fontSize="sm">
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                Gathering
              </Text>
              <Text color="white" fontWeight="semibold">
                {event.eventConfig.gatheringHours}h
              </Text>
            </Box>
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                Outfitting
              </Text>
              <Text color="white" fontWeight="semibold">
                {event.eventConfig.outfittingHours}h
              </Text>
            </Box>
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                Turn Timer
              </Text>
              <Text color="white" fontWeight="semibold">
                {event.eventConfig.turnTimerSeconds}s
              </Text>
            </Box>
          </SimpleGrid>
        )}
      </HStack>
    </Box>
  );

  // ── Completed event layout ──
  if (event.status === 'COMPLETED') {
    return (
      <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
        <VStack align="stretch" spacing={6}>
          {backNav}
          <WinnerBanner event={event} />
          {event.bracket && (
            <CompletedBracket
              bracket={event.bracket}
              teams={event.teams}
              onRewatch={(id) => setReplayBattleId(id)}
            />
          )}
          <CompletedTeamsGrid teams={event.teams} bracket={event.bracket} />
          {effectiveIsAdmin && (
            <AdminEventPanel event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
          )}
        </VStack>
        <BattleReplayModal
          isOpen={!!replayBattleId}
          onClose={() => setReplayBattleId(null)}
          battleId={replayBattleId}
        />
      </Box>
    );
  }

  // ── Draft phase layout ──
  if (event.status === 'DRAFT') {
    if (isAdmin) {
      return (
        <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
          <VStack align="stretch" spacing={6}>
            {backNav}
            {eventHeader}
            <ClanWarsDraftPanel event={event} refetch={refetch} />
          </VStack>
        </Box>
      );
    }

    return (
      <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
        <VStack align="stretch" spacing={6}>
          {backNav}
          {eventHeader}
          <Box
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="xl"
            p={10}
            textAlign="center"
          >
            <Text fontSize="2xl" mb={3}>
              ⚙️
            </Text>
            <Text fontWeight="bold" color="gray.300" fontSize="lg" mb={1}>
              Event in Preparation
            </Text>
            <Text fontSize="sm" color="gray.500">
              The admins are setting up this event. Check back soon!
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={16} flex="1" overflow="hidden" w="100%">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center">
          {backNav}
          {isAdmin && (
            <Button
              size="xs"
              variant="outline"
              colorScheme={viewAsParticipant ? 'teal' : 'gray'}
              borderColor={viewAsParticipant ? 'teal.500' : 'gray.600'}
              color={viewAsParticipant ? 'teal.300' : 'gray.400'}
              onClick={() => setViewAsParticipant((v) => !v)}
            >
              {viewAsParticipant ? '👁 Participant view' : '⚙ Admin view'}
            </Button>
          )}
        </HStack>
        {eventHeader}

        {/* ── Phase banner ── */}
        <PhaseBanner event={event} eventId={eventId} />

        {/* ── Teams grid ── */}
        <Box>
          <HStack mb={4} justify="space-between">
            <HStack spacing={2}>
              <Icon as={FaShieldAlt} color="teal.400" />
              <Text fontWeight="bold" color="white" fontSize="lg">
                Teams
              </Text>
              <Badge colorScheme="gray" fontSize="sm">
                {event.teams?.length ?? 0}
              </Badge>
            </HStack>
            {!currentUserDiscordId && (
              <Text fontSize="xs" color="gray.500">
                Link your Discord account to enter your team's barracks.
              </Text>
            )}
          </HStack>

          {event.teams?.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {event.teams.map((team) => (
                <TeamCard
                  key={team.teamId}
                  team={team}
                  eventId={eventId}
                  currentUserDiscordId={currentUserDiscordId}
                  isAdmin={effectiveIsAdmin}
                  phase={event.status}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box
              bg="gray.800"
              borderRadius="lg"
              p={8}
              textAlign="center"
              border="1px solid"
              borderColor="gray.700"
            >
              <Text color="gray.500">No teams yet.</Text>
            </Box>
          )}
        </Box>

        {/* ── Phase-specific content ── */}
        {event.status === 'GATHERING' && effectiveIsAdmin && (
          <GatheringPhase event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
        )}

        {event.status === 'OUTFITTING' && (
          <Box
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="xl"
            p={10}
            textAlign="center"
          >
            <Text fontSize="2xl" mb={3}>
              ⚔️
            </Text>
            <Text fontWeight="bold" color="gray.300" fontSize="lg" mb={1}>
              Outfitting Phase
            </Text>
            <Text fontSize="sm" color="gray.500">
              Captains are selecting their champions' loadouts. Visit your team's barracks to kit
              out your champion.
            </Text>
          </Box>
        )}

        {/* ── Admin panel (DRAFT + OUTFITTING + BATTLE phases) ── */}
        {effectiveIsAdmin && (event.status === 'DRAFT' || event.status === 'OUTFITTING' || event.status === 'BATTLE') && (
          <AdminEventPanel event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
        )}
      </VStack>
    </Box>
  );
}
