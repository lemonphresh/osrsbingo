import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  GET_ALL_CLAN_WARS_EVENTS,
  GET_MY_CLAN_WARS_EVENTS,
  CREATE_CLAN_WARS_EVENT,
  DELETE_CLAN_WARS_EVENT,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import CreateClanWarsEventModal from '../organisms/ChampionForge/CreateClanWarsEventModal';
import ConfirmModal from '../organisms/ChampionForge/ConfirmModal';
import { isChampionForgeEnabled } from '../config/featureFlags';

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

export default function ChampionForgeDashboard() {
  usePageTitle('Champion Forge');
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_ALL_CLAN_WARS_EVENTS);
  const { data: myData } = useQuery(GET_MY_CLAN_WARS_EVENTS);
  const [createEvent] = useMutation(CREATE_CLAN_WARS_EVENT, {
    refetchQueries: ['GetAllClanWarsEvents'],
  });

  const events = data?.getAllClanWarsEvents ?? [];
  const activeEvents = events.filter((e) => e.status !== 'COMPLETED');
  const myPastEvents = (myData?.getMyClanWarsEvents ?? []).filter((e) =>
    e.status === 'COMPLETED'
  );

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

  useEffect(() => {
    if (!isChampionForgeEnabled(user)) navigate('/');
  }, [user, navigate]);

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
    <Box maxW="1200px" mx="auto" px={4} py={8} flex="1">
      <HStack justify="space-between" mb={2}>
        <VStack align="flex-start" spacing={0}>
          <Text fontSize="2xl" fontWeight="bold" color="teal.300">
            Champion Forge
          </Text>
          <Text fontSize="sm" color="gray.400">
            Build your war chest, equip your champion, and battle for glory.
          </Text>
        </VStack>
        {user?.admin && (
          <Button colorScheme="purple" size="sm" onClick={() => setIsCreateOpen(true)}>
            + New Event
          </Button>
        )}
      </HStack>

      <Divider my={5} borderColor="gray.600" />

      {activeEvents.length === 0 && myPastEvents.length === 0 ? (
        <Center h="40vh" flexDir="column" gap={3}>
          <Text fontSize="4xl">⚔️</Text>
          <Text color="gray.400" textAlign="center">
            No Champion Forge events yet.
            {user?.admin && ' Create one to get started!'}
          </Text>
        </Center>
      ) : (
        <VStack align="stretch" spacing={8}>
          {activeEvents.length > 0 && (
            <Box>
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color="gray.400"
                mb={3}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                Active Events
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {activeEvents.map((event) => (
                  <EventCard key={event.eventId} event={event} isAdmin={user?.admin} />
                ))}
              </SimpleGrid>
            </Box>
          )}

          {myPastEvents.length > 0 && (
            <Box>
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color="gray.400"
                mb={3}
                textTransform="uppercase"
                letterSpacing="wide"
              >
                My Past Events
              </Text>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {myPastEvents.map((event) => (
                  <EventCard key={event.eventId} event={event} isAdmin={user?.admin} />
                ))}
              </SimpleGrid>
            </Box>
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
