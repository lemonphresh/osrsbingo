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
} from '@chakra-ui/react';
import {
  ChampionForgeLanding,
  ChampionForgeInfoModal,
} from '../organisms/ChampionForge/ChampionForgeInfoModal';
import {
  GET_ALL_CLAN_WARS_EVENTS,
  CREATE_CLAN_WARS_EVENT,
  DELETE_CLAN_WARS_EVENT,
  DEV_SEED_CF_EVENT,
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
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderLeftWidth="3px"
      borderLeftColor={`${STATUS_COLORS[event.status]}.500`}
      borderRadius="lg"
      p={5}
      cursor="pointer"
      _hover={{ borderColor: 'gray.500', transform: 'translateY(-2px)' }}
      transition="all 0.15s"
      onClick={() => navigate(`/champion-forge/${event.eventId}`)}
    >
      <HStack justify="space-between" mb={1} align="flex-start">
        <Text fontWeight="bold" fontSize="md" noOfLines={1} color="white" flex={1} mr={2}>
          {event.eventName}
        </Text>
        <Badge colorScheme={STATUS_COLORS[event.status]} fontSize="xs" flexShrink={0}>
          {STATUS_LABELS[event.status]}
        </Badge>
      </HStack>

      {event.clanId && (
        <Text fontSize="xs" color="gray.500" mb={2} fontFamily="mono">
          {event.clanId}
        </Text>
      )}

      <HStack fontSize="xs" color="gray.600" spacing={3}>
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
  const [isSeedConfirmOpen, setIsSeedConfirmOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [pastPage, setPastPage] = useState(0);

  const { data, loading, error } = useQuery(GET_ALL_CLAN_WARS_EVENTS);
  const [createEvent] = useMutation(CREATE_CLAN_WARS_EVENT, {
    refetchQueries: ['GetAllClanWarsEvents'],
  });
  const [seedDevEvent, { loading: seeding }] = useMutation(DEV_SEED_CF_EVENT, {
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
      ['GATHERING', 'OUTFITTING', 'BATTLE'].includes(e.status) && !isMyEvent(e) && !isAdminOrRef(e)
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
        {process.env.REACT_APP_ENV !== 'production' && (
          <Button
            size="sm"
            variant="outline"
            colorScheme="orange"
            flexShrink={0}
            onClick={() => setIsSeedConfirmOpen(true)}
          >
            🧪 DEV/STAGE ONLY: Seed Test Events
          </Button>
        )}
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
        <Button
          size="sm"
          variant="outline"
          colorScheme="teal"
          flexShrink={0}
          onClick={() => setIsAboutOpen(true)}
        >
          ℹ️ How it Works
        </Button>
        <Link to="/champion-forge/guide">
          <Button size="sm" variant="ghost" colorScheme="teal" flexShrink={0}>
            📖 Event Guide
          </Button>
        </Link>
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
                  <EventCard key={event.eventId} event={event} isAdmin={user?.admin} />
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

      <ConfirmModal
        isOpen={isSeedConfirmOpen}
        onClose={() => setIsSeedConfirmOpen(false)}
        onConfirm={async () => {
          setIsSeedConfirmOpen(false);
          try {
            await seedDevEvent();
            showToast("Test events seeded — you're an admin on all of them!", 'success');
          } catch (e) {
            showToast(e.message ?? 'Seed failed', 'error');
          }
        }}
        title="🧪 Seed Test Events"
        body={`This will create all Champion Forge scenario events and add you as an admin on each one.${
          user?.discordUserId
            ? " Since you have Discord linked, you'll also be added as a team member on the gathering events."
            : " You won't be added to any teams because you don't have a Discord account linked — connect Discord in your profile first if you need barracks access."
        }`}
        confirmLabel="Seed Events"
        colorScheme="orange"
        isLoading={seeding}
      />

      <ChampionForgeInfoModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
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
