import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
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
import { GET_CLAN_WARS_EVENT } from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import usePageTitle from '../hooks/usePageTitle';
import AdminEventPanel from '../organisms/ChampionForge/AdminEventPanel';
import ClanWarsDraftPanel from '../organisms/ChampionForge/ClanWarsDraftPanel';
import GatheringPhase from '../organisms/ChampionForge/GatheringPhase';
import OutfittingScreen from '../organisms/ChampionForge/OutfittingScreen';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const STATUS_META = {
  DRAFT:      { label: 'Draft',      color: 'gray',   description: 'Event is being set up.' },
  GATHERING:  { label: 'Gathering',  color: 'green',  description: 'Players are completing tasks to fill their war chest.' },
  OUTFITTING: { label: 'Outfitting', color: 'blue',   description: 'Teams are drafting their loadouts.' },
  BATTLE:     { label: 'Battle',     color: 'red',    description: 'Champions are fighting!' },
  COMPLETED:  { label: 'Completed',  color: 'purple', description: 'The event has ended.' },
  ARCHIVED:   { label: 'Archived',   color: 'gray',   description: 'Archived.' },
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
  const gatheringCountdown  = useCountdown(gatheringEnd);
  const outfittingCountdown = useCountdown(outfittingEnd);

  if (status === 'DRAFT') return null;

  if (status === 'GATHERING') {
    return (
      <Box bg="green.900" border="1px solid" borderColor="green.700" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="green.200">⚒️ Gathering Phase</Text>
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
            <Text fontWeight="bold" color="blue.200">🛡️ Outfitting Phase</Text>
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
            <Text fontWeight="bold" color="red.200" fontSize="lg">⚔️ Battle in Progress!</Text>
            <Text fontSize="sm" color="red.300">Champions are locked in combat.</Text>
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

  if (status === 'COMPLETED' || status === 'ARCHIVED') {
    const winner = event.bracket?.rounds
      ?.slice(-1)[0]?.matches?.[0]?.winnerId;
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
            <Text fontSize="sm" color="teal.400">The battle has concluded.</Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Bracket summary — shown on completed / archived events
// ---------------------------------------------------------------------------
function BracketSummary({ bracket, teams, eventId }) {
  if (!bracket?.rounds?.length) return null;

  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.teamId, t]));

  const getRoundLabel = (i, total) => {
    if (total === 1 || i === total - 1) return 'Final';
    if (i === total - 2) return 'Semifinals';
    return `Round ${i + 1}`;
  };

  return (
    <Box>
      <HStack mb={4} spacing={2}>
        <Text fontSize="xl">🏆</Text>
        <Text fontWeight="bold" color="white" fontSize="lg">Battle Results</Text>
      </HStack>
      <VStack align="stretch" spacing={5}>
        {bracket.rounds.map((round, roundIdx) => (
          <Box key={roundIdx}>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={2}>
              {getRoundLabel(roundIdx, bracket.rounds.length)}
            </Text>
            <VStack align="stretch" spacing={2}>
              {round.matches.map((match, matchIdx) => {
                const team1 = teamMap[match.team1Id];
                const team2 = match.team2Id ? teamMap[match.team2Id] : null;
                const winner = match.winnerId ? teamMap[match.winnerId] : null;

                return (
                  <Box
                    key={matchIdx}
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
                            <Badge colorScheme="teal" fontSize="xs">Winner: {winner.teamName}</Badge>
                          )}
                          {!match.winnerId && <Badge colorScheme="gray" fontSize="xs">Pending</Badge>}
                          {match.battleId && (
                            <Button
                              as={RouterLink}
                              to={`/champion-forge/${eventId}/battle`}
                              size="xs"
                              colorScheme="gray"
                              variant="outline"
                            >
                              View Battle →
                            </Button>
                          )}
                        </HStack>
                      </HStack>
                    )}
                  </Box>
                );
              })}
            </VStack>
          </Box>
        ))}
      </VStack>
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
  const pvmers  = (team.members ?? []).filter((m) => m.role === 'PVMER').length;
  const skillers = (team.members ?? []).filter((m) => m.role === 'SKILLER').length;
  const anyRole  = (team.members ?? []).filter((m) => m.role === 'ANY' || !m.role).length;

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={isMember ? 'teal.600' : 'gray.700'}
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{ borderColor: isMember ? 'teal.400' : 'gray.500' }}
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
            <Text fontWeight="bold" color="white" fontSize="md">{team.teamName}</Text>
            {isMember && (
              <Badge colorScheme="teal" fontSize="xs">Your Team</Badge>
            )}
            {team.captainDiscordId && (
              <Tooltip label={`Captain: ${team.captainDiscordId}`} hasArrow>
                <Icon as={FaCrown} color="yellow.400" boxSize={3} />
              </Tooltip>
            )}
          </HStack>
          <Tooltip label={loadoutStatus.label} hasArrow>
            <Icon as={loadoutStatus.icon} color={loadoutStatus.color} boxSize={3} />
          </Tooltip>
        </HStack>
      </Box>

      {/* Card body */}
      <VStack align="stretch" spacing={3} p={4}>
        {/* Member avatars */}
        {team.members?.length > 0 ? (
          <HStack spacing={3}>
            <AvatarGroup size="xs" max={6}>
              {team.members.map((m, i) => (
                <Tooltip
                  key={m.discordId ?? i}
                  label={`${m.username ?? m.discordId} (${m.role ?? 'ANY'})`}
                  hasArrow
                >
                  <Avatar
                    name={m.username ?? m.discordId}
                    src={
                      m.avatar
                        ? `https://cdn.discordapp.com/avatars/${m.discordId}/${m.avatar}.png`
                        : undefined
                    }
                    bg="gray.600"
                  />
                </Tooltip>
              ))}
            </AvatarGroup>
            <VStack align="flex-start" spacing={0}>
              <Text fontSize="xs" color="gray.300" fontWeight="medium">
                {team.members.length} member{team.members.length !== 1 ? 's' : ''}
              </Text>
              <HStack spacing={1}>
                {pvmers > 0  && <Badge colorScheme="orange" fontSize="xs">{pvmers} PvM</Badge>}
                {skillers > 0 && <Badge colorScheme="teal"   fontSize="xs">{skillers} Skill</Badge>}
                {anyRole > 0  && <Badge colorScheme="purple" fontSize="xs">{anyRole} Any</Badge>}
              </HStack>
            </VStack>
          </HStack>
        ) : (
          <Text fontSize="xs" color="gray.600">No members yet</Text>
        )}

        {/* Stats row */}
        {(phase === 'GATHERING' || phase === 'OUTFITTING' || phase === 'BATTLE' || phase === 'COMPLETED') && (
          <HStack spacing={3}>
            {completedCount > 0 && (
              <HStack spacing={1}>
                <Icon as={FaScroll} color="green.400" boxSize={3} />
                <Text fontSize="xs" color="gray.400">{completedCount} tasks done</Text>
              </HStack>
            )}
            {itemCount > 0 && (
              <HStack spacing={1}>
                <Text fontSize="xs" color="gray.400">⚔ {itemCount} items</Text>
              </HStack>
            )}
          </HStack>
        )}

        {/* CTA */}
        <Button
          size="sm"
          colorScheme={canEnterBarracks ? 'purple' : 'gray'}
          variant={canEnterBarracks ? 'solid' : 'outline'}
          isDisabled={!canEnterBarracks && phase === 'DRAFT'}
          onClick={() => navigate(barracksPath)}
          leftIcon={<Icon as={FaShieldAlt} />}
        >
          {canEnterBarracks ? 'Enter Barracks' : 'View Barracks'}
        </Button>
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

  const event = data?.getClanWarsEvent;

  usePageTitle(event ? `${event.eventName} — Champion Forge` : 'Champion Forge');

  const isAdmin = !!(
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id)
  );

  const [viewAsParticipant, setViewAsParticipant] = useState(false);
  const effectiveIsAdmin = isAdmin && !viewAsParticipant;

  // Get the logged-in user's Discord ID for team membership checks
  const currentUserDiscordId = user?.discordUserId ?? null;

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
            <Heading size="lg" color="white">{event.eventName}</Heading>
            <Badge colorScheme={meta.color} fontSize="sm" px={2} py={1}>
              {meta.label}
            </Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">{meta.description}</Text>
          {event.clanId && (
            <Text fontSize="xs" color="gray.500" fontFamily="mono">
              Clan: {event.clanId}
            </Text>
          )}
        </VStack>

        {event.eventConfig && (
          <SimpleGrid columns={3} spacing={4} fontSize="sm">
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Gathering</Text>
              <Text color="white" fontWeight="semibold">{event.eventConfig.gatheringHours}h</Text>
            </Box>
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Outfitting</Text>
              <Text color="white" fontWeight="semibold">{event.eventConfig.outfittingHours}h</Text>
            </Box>
            <Box textAlign="center">
              <Text color="gray.500" fontSize="xs" textTransform="uppercase" letterSpacing="wider">Turn Timer</Text>
              <Text color="white" fontWeight="semibold">{event.eventConfig.turnTimerSeconds}s</Text>
            </Box>
          </SimpleGrid>
        )}
      </HStack>
    </Box>
  );

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
          <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={10} textAlign="center">
            <Text fontSize="2xl" mb={3}>⚙️</Text>
            <Text fontWeight="bold" color="gray.300" fontSize="lg" mb={1}>Event in Preparation</Text>
            <Text fontSize="sm" color="gray.500">
              The admins are setting up this event. Check back soon!
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
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
              <Badge colorScheme="gray" fontSize="sm">{event.teams?.length ?? 0}</Badge>
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
            <Box bg="gray.800" borderRadius="lg" p={8} textAlign="center" border="1px solid" borderColor="gray.700">
              <Text color="gray.500">No teams yet.</Text>
            </Box>
          )}
        </Box>

{/* ── Phase-specific content ── */}
        {event.status === 'GATHERING' && effectiveIsAdmin && (
          <GatheringPhase event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
        )}

        {event.status === 'OUTFITTING' && (
          <OutfittingScreen event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
        )}

{/* ── Battle results (concluded events) ── */}
        {(event.status === 'COMPLETED' || event.status === 'ARCHIVED') && event.bracket && (
          <BracketSummary bracket={event.bracket} teams={event.teams} eventId={eventId} />
        )}

{/* ── Admin panel (DRAFT + BATTLE phases only) ── */}
        {effectiveIsAdmin && (event.status === 'DRAFT' || event.status === 'BATTLE' || event.status === 'COMPLETED' || event.status === 'ARCHIVED') && (
          <AdminEventPanel event={event} isAdmin={effectiveIsAdmin} refetch={refetch} />
        )}

      </VStack>
    </Box>
  );
}
