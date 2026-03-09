import React, { useMemo } from 'react';
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { ArrowBackIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaShieldAlt, FaSwords, FaScroll, FaCrown } from 'react-icons/fa';
import { GET_CLAN_WARS_EVENT } from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import usePageTitle from '../hooks/usePageTitle';
import AdminEventPanel from '../organisms/ChampionForge/AdminEventPanel';

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

const DIFFICULTY_COLORS = { easy: 'green', medium: 'yellow', hard: 'red' };
const ROLE_COLORS = { PVMER: 'orange', SKILLER: 'teal', ANY: 'purple' };

function formatCountdown(target) {
  if (!target) return null;
  const diff = new Date(target) - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
  return `${h}h ${m}m remaining`;
}

// ---------------------------------------------------------------------------
// Phase banner — shown below the header for live phases
// ---------------------------------------------------------------------------
function PhaseBanner({ event, eventId }) {
  const navigate = useNavigate();
  const { status, gatheringEnd, outfittingEnd } = event;

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
              {formatCountdown(gatheringEnd)}
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
              {formatCountdown(outfittingEnd)}
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
      <Box bg="purple.900" border="1px solid" borderColor="purple.600" borderRadius="lg" p={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={0}>
            <HStack>
              <Text fontSize="xl">🏆</Text>
              <Text fontWeight="bold" color="purple.200">
                {winnerTeam ? `${winnerTeam.teamName} won!` : 'Event complete'}
              </Text>
            </HStack>
            <Text fontSize="sm" color="purple.400">The battle has concluded.</Text>
          </VStack>
        </HStack>
      </Box>
    );
  }

  return null;
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
      borderColor={isMember ? 'purple.600' : 'gray.700'}
      borderRadius="xl"
      overflow="hidden"
      transition="border-color 0.2s"
      _hover={{ borderColor: isMember ? 'purple.400' : 'gray.500' }}
    >
      {/* Card header */}
      <Box
        bg={isMember ? 'purple.900' : 'gray.750'}
        px={4}
        py={3}
        borderBottom="1px solid"
        borderColor={isMember ? 'purple.700' : 'gray.700'}
      >
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Icon as={FaShieldAlt} color={isMember ? 'purple.300' : 'gray.500'} />
            <Text fontWeight="bold" color="white" fontSize="md">{team.teamName}</Text>
            {isMember && (
              <Badge colorScheme="purple" fontSize="xs">Your Team</Badge>
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
// Task pool — read-only public view, grouped by role
// ---------------------------------------------------------------------------
function TaskPoolSummary({ tasks }) {
  if (!tasks?.length) return null;

  const pvmerTasks  = tasks.filter((t) => t.role === 'PVMER');
  const skillerTasks = tasks.filter((t) => t.role === 'SKILLER');

  const RoleGroup = ({ label, roleColor, items }) => (
    <Box>
      <HStack mb={2}>
        <Badge colorScheme={roleColor} fontSize="xs">{label}</Badge>
        <Text fontSize="xs" color="gray.500">({items.length} tasks)</Text>
      </HStack>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={2}>
        {['easy', 'medium', 'hard'].map((diff) => {
          const bucket = items.filter((t) => t.difficulty === diff);
          if (!bucket.length) return null;
          return (
            <Box key={diff}>
              <Text fontSize="xs" color="gray.500" mb={1} textTransform="capitalize"
                fontWeight="semibold" letterSpacing="wider">
                {diff} ({bucket.length})
              </Text>
              <VStack align="stretch" spacing={1}>
                {bucket.map((t) => (
                  <HStack key={t.taskId} spacing={2} py={1} px={2} bg="gray.700" borderRadius="sm">
                    <Badge colorScheme={DIFFICULTY_COLORS[diff]} fontSize="xs" flexShrink={0}>
                      {diff[0].toUpperCase()}
                    </Badge>
                    <Text fontSize="xs" color="gray.300" noOfLines={1}>{t.label}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );

  return (
    <VStack align="stretch" spacing={5}>
      {pvmerTasks.length > 0  && <RoleGroup label="PvMer"  roleColor="orange" items={pvmerTasks}  />}
      {skillerTasks.length > 0 && <RoleGroup label="Skiller" roleColor="teal"   items={skillerTasks} />}
    </VStack>
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

  // Get the logged-in user's Discord ID for team membership checks
  const currentUserDiscordId = user?.discordUserId ?? null;

  if (loading && !event) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Center h="60vh">
        <Text color="red.400">Event not found or failed to load.</Text>
      </Center>
    );
  }

  const meta = STATUS_META[event.status] ?? STATUS_META.DRAFT;

  return (
    <Box maxW="1200px" mx="auto" px={4} py={6}>
      <VStack align="stretch" spacing={6}>

        {/* ── Back nav ── */}
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

        {/* ── Event header ── */}
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

            {/* Config summary */}
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

        {/* ── Phase banner ── */}
        <PhaseBanner event={event} eventId={eventId} />

        {/* ── Teams grid ── */}
        <Box>
          <HStack mb={4} justify="space-between">
            <HStack spacing={2}>
              <Icon as={FaShieldAlt} color="purple.400" />
              <Text fontWeight="bold" color="white" fontSize="lg">
                Teams
              </Text>
              <Badge colorScheme="gray" fontSize="sm">{event.teams?.length ?? 0}</Badge>
            </HStack>
            {!currentUserDiscordId && event.status !== 'DRAFT' && (
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
                  isAdmin={isAdmin}
                  phase={event.status}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box bg="gray.800" borderRadius="lg" p={8} textAlign="center" border="1px solid" borderColor="gray.700">
              <Text color="gray.500">No teams yet.</Text>
              {isAdmin && (
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Use the admin panel below to add teams.
                </Text>
              )}
            </Box>
          )}
        </Box>

        {/* ── Task pool (collapsible, public read-only) ── */}
        {event.tasks?.length > 0 && (
          <Accordion allowToggle reduceMotion>
            <AccordionItem
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              borderRadius="xl"
              overflow="hidden"
            >
              <AccordionButton px={5} py={4} _hover={{ bg: 'gray.750' }}>
                <HStack flex="1" spacing={3}>
                  <Icon as={FaScroll} color="gray.400" />
                  <Text fontWeight="bold" color="white">
                    Task Pool
                  </Text>
                  <Badge colorScheme="gray" fontSize="xs">{event.tasks.length} tasks</Badge>
                  <HStack spacing={1}>
                    <Badge colorScheme="orange" fontSize="xs">
                      {event.tasks.filter((t) => t.role === 'PVMER').length} PvM
                    </Badge>
                    <Badge colorScheme="teal" fontSize="xs">
                      {event.tasks.filter((t) => t.role === 'SKILLER').length} Skill
                    </Badge>
                  </HStack>
                </HStack>
                <AccordionIcon color="gray.400" />
              </AccordionButton>
              <AccordionPanel px={5} pb={5}>
                <TaskPoolSummary tasks={event.tasks} />
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

        {/* ── Admin panel ── */}
        {isAdmin && (
          <AdminEventPanel event={event} isAdmin={isAdmin} refetch={refetch} />
        )}

      </VStack>
    </Box>
  );
}
