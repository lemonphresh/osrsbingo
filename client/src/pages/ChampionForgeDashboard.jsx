import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Center,
  SimpleGrid,
  Badge,
  Divider,
  Flex,
} from '@chakra-ui/react';
import {
  GET_ALL_CLAN_WARS_EVENTS,
  CREATE_CLAN_WARS_EVENT,
  DELETE_CLAN_WARS_EVENT,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import CreateClanWarsEventModal from '../organisms/ChampionForge/CreateClanWarsEventModal';
import ConfirmModal from '../organisms/ChampionForge/ConfirmModal';
import { isChampionForgeEnabled } from '../config/featureFlags';
import theme from '../theme';
import GemTitle from '../atoms/GemTitle';

const STATUS_COLORS = {
  DRAFT: 'gray',
  GATHERING: 'green',
  OUTFITTING: 'blue',
  BATTLE: 'red',
  COMPLETED: 'purple',
};

const STATUS_LABELS = {
  DRAFT: 'Draft',
  GATHERING: 'Gathering',
  OUTFITTING: 'Outfitting',
  BATTLE: 'Battle',
  COMPLETED: 'Completed',
};

const PHASES = [
  {
    number: '01',
    name: 'Draft',
    color: theme.colors.purple[400],
    borderColor: theme.colors.purple[600],
    icon: '📋',
    desc: (
      <>
        Admins set up teams, configure event rules, and import rosters.{' '}
        <Link
          to="/blind-draft"
          style={{ color: theme.colors.pink[300], textDecoration: 'underline' }}
        >
          Blind draft
        </Link>{' '}
        support means captains pick players by stats alone, names hidden until selections are
        locked.
      </>
    ),
  },
  {
    number: '02',
    name: 'Gathering',
    color: theme.colors.green[400],
    borderColor: theme.colors.green[600],
    icon: '⛏️',
    desc: 'Teams race to complete OSRS tasks: boss kills, collection log drops, skilling milestones. Each completion earns armor, weapons, consumables and more for your war chest. Discord submissions with screenshot proof keep it honest.',
  },
  {
    number: '03',
    name: 'Outfitting',
    color: theme.colors.blue[400],
    borderColor: theme.colors.blue[600],
    icon: '🛡️',
    desc: 'Spend your war chest to build your champion. Allocate stats across Attack, Defense, HP, and Speed. Equip gear unlocked from gathering: weapons, armor, trinkets, and special abilities that define your fight style.',
  },
  {
    number: '04',
    name: 'Battle',
    color: theme.colors.red[400],
    borderColor: theme.colors.red[600],
    icon: '⚔️',
    desc: 'Champions face off in a single or double elimination bracket. Turn-based combat plays out in real time with specials, consumables, bleed, lifesteal, and chain lightning. Watch replays of every fight after the dust settles.',
  },
];

const FEATURES = [
  {
    icon: '📡',
    label: 'Live Submissions',
    desc: 'Discord webhook integration for real-time screenshot submissions. Admins approve or deny via the panel; players get instant feedback with sound cues.',
    color: theme.colors.teal[400],
  },
  {
    icon: '⚡',
    label: 'Deep Combat',
    desc: 'Specials like Fortress, Chain Lightning, Barrage, Cleave, Ambush, and Lifesteal. Items that heal, debuff, or deal magic damage. Crits, bleed ticks, and full stat interaction.',
    color: theme.colors.yellow[400],
  },
  {
    icon: '🏆',
    label: 'Bracket Tournaments',
    desc: 'Single or double elimination. Matchups auto-seed by team performance. Replay every battle blow-by-blow after the fact.',
    color: theme.colors.orange[400],
  },
  {
    icon: '📊',
    label: 'Stat Building',
    desc: 'Each champion has ATK, DEF, HP, and SPD. Gear and specials modify these live. Outfitting phase is a mini-RPG before the main event.',
    color: theme.colors.purple[400],
  },
  {
    icon: '🎒',
    label: 'War Chest',
    desc: 'Completing gathering tasks earns crafting materials that go into your team war chest. What you earn determines what you can build in outfitting.',
    color: theme.colors.green[400],
  },
];

function ChampionForgeLanding() {
  usePageTitle('Champion Forge');

  return (
    <Flex flex="1" flexDirection="column" height="100%">
      {/* Hero */}
      <Box
        position="relative"
        overflow="hidden"
        minHeight={['280px', '360px', '420px']}
        background={`linear-gradient(135deg, ${theme.colors.gray[900]} 0%, #1a1008 40%, #2a1800 70%, ${theme.colors.gray[900]} 100%)`}
      >
        {/* Decorative glow */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          width="600px"
          height="600px"
          borderRadius="50%"
          background="radial-gradient(circle, rgba(214,158,46,0.12) 0%, transparent 70%)"
          pointerEvents="none"
        />
        <Flex
          position="relative"
          zIndex={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={['280px', '360px', '420px']}
          paddingX={['16px', '24px', '64px']}
          textAlign="center"
        >
          <Text fontSize={['3xl', '4xl', '5xl']} mb={2}>
            ⚔️
          </Text>
          <GemTitle gemColor="yellow">Champion Forge</GemTitle>
          <Text
            fontSize={['md', 'lg']}
            color="gray.300"
            maxWidth="560px"
            marginBottom="32px"
            marginTop="8px"
          >
            The full clan tournament experience for OSRS. Four phases. Real combat. One champion.
          </Text>
          <Badge
            fontSize="sm"
            px={4}
            py={2}
            borderRadius="full"
            bg={theme.colors.yellow[800]}
            color={theme.colors.yellow[200]}
            letterSpacing="wider"
          >
            COMING SOON
          </Badge>
        </Flex>
      </Box>

      {/* Content */}
      <Flex
        flexDirection="column"
        paddingX={['16px', '24px', '64px']}
        paddingBottom={['32px', '64px']}
        paddingTop="48px"
      >
        {/* What is it */}
        <Box
          marginBottom="48px"
          padding={['20px', '28px']}
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          borderWidth="1px"
          borderColor={theme.colors.yellow[700]}
          borderLeftWidth="4px"
          borderLeftColor={theme.colors.yellow[400]}
        >
          <Text
            fontSize="lg"
            fontWeight="semibold"
            color={theme.colors.yellow[300]}
            marginBottom="12px"
          >
            What is Champion Forge?
          </Text>
          <Text fontSize="sm" color="gray.300" lineHeight="1.8">
            Champion Forge turns your OSRS clan into a full RPG tournament. Teams compete across
            four phases: team and event setup, completing in-game tasks to generously supply a war
            chest, outfitting a champion with gear and specials earned through tasks completed, and
            finally battling head-to-head in a live turn-based bracket. Everything ties back to what
            your team actually accomplished in Old School RuneScape.
          </Text>
        </Box>

        {/* Phases */}
        <Text
          fontSize="lg"
          fontWeight="semibold"
          textAlign="center"
          marginBottom="24px"
          color={theme.colors.yellow[300]}
        >
          The Four Phases
        </Text>
        <SimpleGrid columns={[1, 2, 2, 4]} spacing={4} marginBottom="48px">
          {PHASES.map((phase) => (
            <Box
              key={phase.number}
              padding={['18px', '24px']}
              backgroundColor={theme.colors.teal[900]}
              borderRadius="10px"
              borderWidth="2px"
              borderColor={phase.borderColor}
              display="flex"
              flexDirection="column"
            >
              <HStack marginBottom="8px">
                <Text fontSize="xl">{phase.icon}</Text>
                <Text fontSize="xs" color="gray.500" letterSpacing="widest" fontWeight="semibold">
                  PHASE {phase.number}
                </Text>
              </HStack>
              <Text fontSize="md" fontWeight="bold" color={phase.color} marginBottom="10px">
                {phase.name}
              </Text>
              <Text fontSize="sm" color="gray.400" lineHeight="1.7">
                {phase.desc}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Features */}
        <Text
          fontSize="lg"
          fontWeight="semibold"
          textAlign="center"
          marginBottom="24px"
          color={theme.colors.yellow[300]}
        >
          Built-In Features
        </Text>
        <SimpleGrid columns={[1, 2, 3]} spacing={4} marginBottom="48px">
          {FEATURES.map((f) => (
            <Flex
              key={f.label}
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderLeftWidth="3px"
              borderLeftColor={f.color}
              flexDirection="column"
            >
              <HStack marginBottom="8px">
                <Text fontSize="lg">{f.icon}</Text>
                <Text fontWeight="semibold" fontSize="sm" color={f.color}>
                  {f.label}
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                {f.desc}
              </Text>
            </Flex>
          ))}
        </SimpleGrid>

        {/* How a tournament runs */}
        <Box
          marginBottom="48px"
          padding={['20px', '28px']}
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          borderWidth="1px"
          borderColor={theme.colors.teal[600]}
        >
          <Text
            fontSize="md"
            fontWeight="semibold"
            color={theme.colors.pink[300]}
            marginBottom="16px"
          >
            How a Tournament Runs
          </Text>
          <VStack align="stretch" spacing={3}>
            {[
              [
                '1.',
                'An admin creates the event, sets the gathering duration, task list, and team setup.',
              ],
              [
                '2.',
                'The gathering phase begins. Players post screenshot proof of completed tasks in a Discord channel. Admins review submissions in real time.',
              ],
              [
                '3.',
                "Completed tasks award armor, weapons, consumables and more to the team's war chest.",
              ],
              [
                '4.',
                'Outfitting opens. Captains and team members collaborate to spend their war chest to build and equip a team champion for the epic battle.',
              ],
              [
                '5.',
                'Battle phase launches the bracket. Champions fight turn-based battles that play out live. Spectators can watch. Replays are saved.',
              ],
              ['6.', 'The bracket closes and a winner is crowned.'],
            ].map(([num, text]) => (
              <HStack key={num} align="flex-start" spacing={3}>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={theme.colors.yellow[400]}
                  flexShrink={0}
                  minW="24px"
                >
                  {num}
                </Text>
                <Text fontSize="sm" color="gray.300" lineHeight="1.7">
                  {text}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* CTA */}
        <Box
          textAlign="center"
          padding={['24px', '36px']}
          backgroundColor={theme.colors.gray[800]}
          borderRadius="12px"
          borderWidth="1px"
          borderColor={theme.colors.yellow[700]}
        >
          <Text
            fontSize="xl"
            fontWeight="semibold"
            color={theme.colors.yellow[300]}
            marginBottom="8px"
          >
            Champion Forge is coming soon.
          </Text>
          <Text fontSize="sm" color="gray.400" marginBottom="24px">
            We're putting the final touches on combat balance, bracket generation, and Discord
            integration. Sign up now so you're ready to run a tournament the moment it launches.
          </Text>
          <HStack justifyContent="center" spacing={4} flexWrap="wrap">
            <a href="/signup">
              <Button
                backgroundColor={theme.colors.yellow[600]}
                color={theme.colors.gray[900]}
                height="48px"
                paddingX="32px"
                fontWeight="semibold"
                _hover={{ backgroundColor: theme.colors.yellow[500] }}
              >
                Create an Account
              </Button>
            </a>
            <a href="/boards">
              <Button
                variant="outline"
                borderColor={theme.colors.teal[500]}
                color={theme.colors.teal[300]}
                height="48px"
                paddingX="28px"
                _hover={{ backgroundColor: theme.colors.teal[900] }}
              >
                Explore Bingo Boards
              </Button>
            </a>
          </HStack>
        </Box>
      </Flex>
    </Flex>
  );
}

function EventCard({ event, isAdmin }) {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const [deleteEvent] = useMutation(DELETE_CLAN_WARS_EVENT, {
    refetchQueries: ['GetAllClanWarsEvents'],
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteEvent({ variables: { eventId: event.eventId } });
      showToast('Event deleted', 'success');
    } catch (err) {
      showToast('Failed to delete event', 'error');
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <Box
      bg="gray.700"
      border="1px solid"
      borderColor="gray.600"
      borderRadius="lg"
      p={5}
      cursor="pointer"
      _hover={{ borderColor: 'teal.400', transform: 'translateY(-2px)', transition: 'all 0.15s' }}
      transition="all 0.15s"
      onClick={() => navigate(`/champion-forge/${event.eventId}`)}
    >
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold" fontSize="md" noOfLines={1} color="white">
          {event.eventName}
        </Text>
        <Badge colorScheme={STATUS_COLORS[event.status]} fontSize="xs">
          {STATUS_LABELS[event.status]}
        </Badge>
      </HStack>

      {event.clanId && (
        <Text fontSize="xs" color="gray.400" mb={2}>
          Clan: {event.clanId}
        </Text>
      )}

      <HStack fontSize="xs" color="gray.500" spacing={3}>
        <Text>{event.teams?.length ?? 0} teams</Text>
        {event.gatheringStart && (
          <Text>Started {new Date(event.gatheringStart).toLocaleDateString()}</Text>
        )}
      </HStack>

      {isAdmin && event.status === 'DRAFT' && (
        <HStack mt={3} justify="flex-end">
          <Button
            size="xs"
            colorScheme="red"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            Delete
          </Button>
        </HStack>
      )}

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${event.eventName}"?`}
        body="This cannot be undone."
        confirmLabel="Delete"
        colorScheme="red"
      />
    </Box>
  );
}

const PAST_PAGE_SIZE = 6;

const SectionLabel = ({ children }) => (
  <Text
    fontWeight="semibold"
    fontSize="xs"
    color="gray.500"
    mb={3}
    textTransform="uppercase"
    letterSpacing="wider"
  >
    {children}
  </Text>
);

function ChampionForgeDashboardContent() {
  usePageTitle('Champion Forge');
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pastPage, setPastPage] = useState(0);

  const { data, loading, error } = useQuery(GET_ALL_CLAN_WARS_EVENTS);
  const [createEvent] = useMutation(CREATE_CLAN_WARS_EVENT, {
    refetchQueries: ['GetAllClanWarsEvents'],
  });

  const allEvents = data?.getAllClanWarsEvents ?? [];
  const uid = user?.id;

  const isMyEvent = (e) => e.creatorId === uid;
  const isAdminOrRef = (e) =>
    !isMyEvent(e) && (e.adminIds?.includes(uid) || e.refIds?.includes(uid));

  const myEvents = allEvents.filter((e) => e.status !== 'COMPLETED' && isMyEvent(e));
  const adminRefEvents = allEvents.filter((e) => e.status !== 'COMPLETED' && isAdminOrRef(e));
  const otherActiveEvents = allEvents.filter(
    (e) =>
      ['GATHERING', 'OUTFITTING', 'BATTLE'].includes(e.status) &&
      !isMyEvent(e) &&
      !isAdminOrRef(e)
  );
  const pastEvents = allEvents.filter((e) => e.status === 'COMPLETED');
  const pastSlice = pastEvents.slice(pastPage * PAST_PAGE_SIZE, (pastPage + 1) * PAST_PAGE_SIZE);
  const totalPastPages = Math.ceil(pastEvents.length / PAST_PAGE_SIZE);

  const hasAnything =
    myEvents.length > 0 ||
    adminRefEvents.length > 0 ||
    otherActiveEvents.length > 0 ||
    pastEvents.length > 0;

  const handleCreate = async (input) => {
    try {
      const { data } = await createEvent({ variables: { input } });
      showToast('Event created!', 'success');
      setIsCreateOpen(false);
      return data.createClanWarsEvent;
    } catch (err) {
      showToast('Failed to create event', 'error');
    }
  };

  if (loading) {
    return (
      <Center flex="1">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex="1">
        <Text color="red.400">Failed to load events. Please refresh.</Text>
      </Center>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={[4, 6, 8]} py={[16, 20, 24]} flex="1">
      <HStack justify="space-between" align="flex-end" mb={6}>
        <VStack align="flex-start" spacing={1}>
          <GemTitle gemColor="yellow">Champion Forge</GemTitle>
          <Text fontSize="sm" color="gray.400">
            Build your war chest, equip your champion, and battle for glory.
          </Text>
        </VStack>
        <Button
          backgroundColor={theme.colors.yellow[600]}
          color={theme.colors.gray[900]}
          fontWeight="semibold"
          size="sm"
          _hover={{ backgroundColor: theme.colors.yellow[500] }}
          onClick={() => setIsCreateOpen(true)}
          flexShrink={0}
        >
          + New Event
        </Button>
      </HStack>

      <Divider mb={8} borderColor="gray.700" />

      {!hasAnything ? (
        <Center py={16}>
          <Box
            textAlign="center"
            maxW="480px"
            padding={['32px', '48px']}
            backgroundColor={theme.colors.teal[900]}
            borderRadius="16px"
            borderWidth="1px"
            borderColor={theme.colors.teal[700]}
          >
            <Text fontSize="5xl" mb={4}>
              ⚔️
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
              No events yet
            </Text>
            <Text fontSize="sm" color="gray.400" mb={8} lineHeight="1.7">
              Start your first Champion Forge tournament and get your clan competing. Four phases,
              real loot, live battles.
            </Text>
            <Button
              backgroundColor={theme.colors.yellow[600]}
              color={theme.colors.gray[900]}
              fontWeight="semibold"
              size="md"
              height="44px"
              paddingX="32px"
              _hover={{ backgroundColor: theme.colors.yellow[500] }}
              onClick={() => setIsCreateOpen(true)}
            >
              Create Your First Event
            </Button>
          </Box>
        </Center>
      ) : (
        <VStack align="stretch" spacing={8}>
          {myEvents.length > 0 && (
            <Box>
              <SectionLabel>My Events</SectionLabel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {myEvents.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    isAdmin={user?.admin || event.creatorId === uid}
                  />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {adminRefEvents.length > 0 && (
            <Box>
              <SectionLabel>Events I'm Admining / Reffing</SectionLabel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {adminRefEvents.map((event) => (
                  <EventCard
                    key={event.eventId}
                    event={event}
                    isAdmin={user?.admin}
                  />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {(myEvents.length > 0 || adminRefEvents.length > 0) && otherActiveEvents.length > 0 && (
            <Divider borderColor="gray.700" />
          )}

          {otherActiveEvents.length > 0 && (
            <Box>
              <SectionLabel>Active Events</SectionLabel>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {otherActiveEvents.map((event) => (
                  <EventCard key={event.eventId} event={event} isAdmin={user?.admin} />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {pastEvents.length > 0 && (
            <>
              <Divider borderColor="gray.700" />
              <Box>
                <SectionLabel>Past Events</SectionLabel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {pastSlice.map((event) => (
                    <EventCard key={event.eventId} event={event} isAdmin={user?.admin} />
                  ))}
                </SimpleGrid>
                {totalPastPages > 1 && (
                  <HStack justify="center" mt={5} spacing={3}>
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={pastPage === 0}
                      onClick={() => setPastPage((p) => p - 1)}
                    >
                      ← Prev
                    </Button>
                    <Text fontSize="sm" color="gray.400">
                      {pastPage + 1} / {totalPastPages}
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      isDisabled={pastPage >= totalPastPages - 1}
                      onClick={() => setPastPage((p) => p + 1)}
                    >
                      Next →
                    </Button>
                  </HStack>
                )}
              </Box>
            </>
          )}
        </VStack>
      )}

      <CreateClanWarsEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
    </Box>
  );
}

export default function ChampionForgeDashboard() {
  const { user } = useAuth();

  if (!isChampionForgeEnabled(user) || !user) {
    return <ChampionForgeLanding />;
  }

  return <ChampionForgeDashboardContent />;
}
