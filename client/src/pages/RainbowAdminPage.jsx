import React, { useState } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
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
  Input,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  IconButton,
  Avatar,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import { SEARCH_USERS } from '../graphql/queries';
import {
  GET_ACTIVE_RAINBOW_EVENT,
  CREATE_RAINBOW_EVENT,
  CREATE_RAINBOW_TEAM,
  ADD_RAINBOW_ADMIN,
  REMOVE_RAINBOW_ADMIN,
  TEST_RAINBOW_CHANNEL,
  UPDATE_RAINBOW_EVENT_STATUS,
  DELETE_RAINBOW_EVENT,
  DELETE_RAINBOW_TEAM,
  GENERATE_RAINBOW_TEAM_TOKEN,
} from '../graphql/rainbowBingoOperations';

// ── Create Event ────────────────────────────────────────────────────────────

function CreateEventForm({ onCreate }) {
  const { showToast } = useToastContext();
  const [form, setForm] = useState({ eventName: '' });
  const [createEvent, { loading }] = useMutation(CREATE_RAINBOW_EVENT, {
    onCompleted: () => showToast('Event created!', 'success'),
    onError: (e) => showToast(e.message, 'error'),
    refetchQueries: [{ query: GET_ACTIVE_RAINBOW_EVENT }],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.eventName.trim()) return;
    createEvent({
      variables: {
        input: {
          eventName: form.eventName.trim(),
        },
      },
    });
  };

  return (
    <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="md" p={5}>
      <Heading size="sm" color="gray.200" mb={4}>
        Create Rainbow Bingo Event
      </Heading>
      <VStack align="stretch" gap={3}>
        <Box>
          <Text fontSize="sm" color="gray.400" mb={1}>
            Event Name
          </Text>
          <Input
            value={form.eventName}
            onChange={set('eventName')}
            placeholder="EG Rainbow Bingo 2026"
            bg="gray.700"
            borderColor="gray.600"
            color="white"
          />
        </Box>
        <Button
          colorScheme="purple"
          isLoading={loading}
          isDisabled={!form.eventName.trim()}
          onClick={handleSubmit}
        >
          Create Event
        </Button>
      </VStack>
    </Box>
  );
}

// ── Event Info ───────────────────────────────────────────────────────────────

function EventInfoPanel({ event, refetch }) {
  const { showToast } = useToastContext();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [updateStatus, { loading: statusLoading }] = useMutation(UPDATE_RAINBOW_EVENT_STATUS, {
    onCompleted: () => {
      showToast('Status updated', 'success');
      refetch();
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const [deleteEvent, { loading: deleteLoading }] = useMutation(DELETE_RAINBOW_EVENT, {
    onCompleted: () => {
      showToast('Event deleted', 'success');
      refetch();
    },
    onError: (e) => {
      showToast(e.message, 'error');
      setConfirmDelete(false);
    },
  });

  const STATUS_ACTIONS = {
    SETUP: [{ label: 'Start Event', next: 'ACTIVE', scheme: 'green' }],
    ACTIVE: [{ label: 'End Event', next: 'COMPLETE', scheme: 'red' }],
    COMPLETE: [],
  };

  const actions = STATUS_ACTIONS[event.status] ?? [];

  return (
    <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="md" p={4}>
      <HStack justify="space-between" wrap="wrap" gap={3}>
        <VStack align="flex-start" gap={1}>
          <HStack gap={2}>
            <Text color="white" fontWeight="semibold">
              {event.eventName}
            </Text>
            <Badge
              colorScheme={
                event.status === 'ACTIVE' ? 'green' : event.status === 'SETUP' ? 'blue' : 'gray'
              }
            >
              {event.status}
            </Badge>
          </HStack>
          <Text color="gray.500" fontSize="xs">
            eventId: {event.eventId}
          </Text>
        </VStack>
        <HStack gap={2} wrap="wrap">
          {actions.map(({ label, next, scheme }) => (
            <Button
              key={next}
              size="sm"
              colorScheme={scheme}
              variant="outline"
              isLoading={statusLoading}
              onClick={() => updateStatus({ variables: { eventId: event.eventId, status: next } })}
            >
              {label}
            </Button>
          ))}
          {event.status === 'COMPLETE' &&
            (confirmDelete ? (
              <HStack gap={2}>
                <Text fontSize="xs" color="red.300">
                  Delete everything?
                </Text>
                <Button
                  size="sm"
                  colorScheme="red"
                  isLoading={deleteLoading}
                  onClick={() => deleteEvent({ variables: { eventId: event.eventId } })}
                >
                  Yes, delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </HStack>
            ) : (
              <Button
                size="sm"
                colorScheme="red"
                variant="ghost"
                leftIcon={<DeleteIcon />}
                onClick={() => setConfirmDelete(true)}
              >
                Delete Event
              </Button>
            ))}
        </HStack>
      </HStack>
    </Box>
  );
}

// ── Admin / Ref Manager ──────────────────────────────────────────────────────

function AdminManager({ event, refetch }) {
  const { showToast } = useToastContext();
  const [search, setSearch] = useState('');

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search },
    skip: search.length < 3,
  });

  const [addAdmin] = useMutation(ADD_RAINBOW_ADMIN, {
    onCompleted: () => {
      showToast('Admin/ref added', 'success');
      setSearch('');
      refetch();
    },
    onError: (e) => showToast(e.message, 'error'),
  });
  const [removeAdmin] = useMutation(REMOVE_RAINBOW_ADMIN, {
    onCompleted: () => {
      showToast('Admin/ref removed', 'success');
      refetch();
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const existingIds = new Set((event.adminIds ?? []).map(String));
  const searchResults = (searchData?.searchUsers ?? []).filter(
    (u) => !existingIds.has(String(u.id))
  );

  return (
    <VStack align="stretch" gap={4}>
      <Text fontSize="xs" color="gray.500">
        Admins and refs share the same role here — they can approve submissions, complete tiles, and
        manage teams.
      </Text>
      <Input
        size="sm"
        placeholder="Search users to add…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        _placeholder={{ color: 'gray.500' }}
      />
      {searchResults.map((u) => (
        <HStack key={u.id} justify="space-between" p={2} bg="gray.700" borderRadius="md">
          <Text fontSize="sm" color="white">
            {u.displayName ?? u.username}
          </Text>
          <IconButton
            icon={<AddIcon />}
            size="xs"
            colorScheme="green"
            aria-label="Add"
            onClick={() => addAdmin({ variables: { eventId: event.eventId, userId: u.id } })}
          />
        </HStack>
      ))}
      <Divider borderColor="gray.700" />
      {(event.admins ?? []).length === 0 && (
        <Text fontSize="xs" color="gray.600">
          No admins yet.
        </Text>
      )}
      {(event.admins ?? []).map((admin) => (
        <HStack key={admin.id} justify="space-between" p={2} bg="gray.750" borderRadius="md">
          <HStack gap={2}>
            <Avatar size="xs" name={admin.displayName ?? admin.username} />
            <Text fontSize="sm" color="white">
              {admin.displayName ?? admin.username}
            </Text>
          </HStack>
          <IconButton
            icon={<DeleteIcon />}
            size="xs"
            colorScheme="red"
            variant="ghost"
            aria-label="Remove"
            onClick={() => removeAdmin({ variables: { eventId: event.eventId, userId: admin.id } })}
          />
        </HStack>
      ))}
    </VStack>
  );
}

// ── Team Manager ─────────────────────────────────────────────────────────────

function AddTeamForm({ eventId, onAdded }) {
  const { showToast } = useToastContext();
  const [form, setForm] = useState({
    teamName: '',
    discordChannelId: '',
    captainDiscordId: '',
    notes: '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const [createTeam, { loading }] = useMutation(CREATE_RAINBOW_TEAM, {
    onCompleted: () => {
      showToast('Team added!', 'success');
      setForm({ teamName: '', discordChannelId: '', captainDiscordId: '', notes: '' });
      onAdded?.();
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const handleSubmit = () => {
    if (!form.teamName.trim() || !form.discordChannelId.trim()) return;
    createTeam({
      variables: {
        eventId,
        input: {
          teamName: form.teamName.trim(),
          discordChannelId: form.discordChannelId.trim(),
          captainDiscordId: form.captainDiscordId.trim() || null,
          notes: form.notes.trim() || null,
        },
      },
    });
  };

  return (
    <Box bg="gray.750" border="1px dashed" borderColor="gray.600" borderRadius="md" p={4}>
      <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
        Add Team
      </Text>
      <VStack align="stretch" gap={2}>
        <HStack gap={2}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Team Name
            </Text>
            <Input
              size="sm"
              value={form.teamName}
              onChange={set('teamName')}
              placeholder="Team Mystic"
              bg="gray.700"
              borderColor="gray.600"
              color="white"
            />
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Discord Channel ID
            </Text>
            <Input
              size="sm"
              value={form.discordChannelId}
              onChange={set('discordChannelId')}
              placeholder="123456789012345678"
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              fontFamily="mono"
            />
          </Box>
        </HStack>
        <HStack gap={2}>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Captain Discord ID{' '}
              <Text as="span" color="gray.600">
                (optional)
              </Text>
            </Text>
            <Input
              size="sm"
              value={form.captainDiscordId}
              onChange={set('captainDiscordId')}
              placeholder="Discord user ID"
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              fontFamily="mono"
            />
          </Box>
          <Box flex={1}>
            <Text fontSize="xs" color="gray.500" mb={1}>
              Notes{' '}
              <Text as="span" color="gray.600">
                (optional)
              </Text>
            </Text>
            <Input
              size="sm"
              value={form.notes}
              onChange={set('notes')}
              placeholder="Any notes"
              bg="gray.700"
              borderColor="gray.600"
              color="white"
            />
          </Box>
        </HStack>
        <Button
          size="sm"
          colorScheme="purple"
          isLoading={loading}
          isDisabled={!form.teamName.trim() || !form.discordChannelId.trim()}
          onClick={handleSubmit}
        >
          Add Team
        </Button>
      </VStack>
    </Box>
  );
}

function TeamRow({ team, onTest, testingId, onDelete, onGenerateToken }) {
  const isTesting = testingId === team.teamId;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const boardUrl = team.teamToken ? `/eg-rainbow/team/${team.teamToken}` : null;

  return (
    <Box p={3} bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.700">
      <HStack justify="space-between" gap={3} wrap="wrap">
        <VStack align="flex-start" gap={0}>
          <Text color="white" fontWeight="semibold" fontSize="sm">
            {team.teamName}
          </Text>
          <Text color="gray.500" fontSize="xs" fontFamily="mono">
            {team.discordChannelId}
          </Text>
          {boardUrl ? (
            <Text
              as={RouterLink}
              to={boardUrl}
              color="purple.400"
              fontSize="xs"
              fontFamily="mono"
              _hover={{ textDecoration: 'underline' }}
            >
              {boardUrl}
            </Text>
          ) : (
            <Text color="yellow.600" fontSize="xs">
              No token — generate one below
            </Text>
          )}
          {team.notes && (
            <Text color="gray.600" fontSize="xs">
              {team.notes}
            </Text>
          )}
        </VStack>
        <HStack gap={2} wrap="wrap">
          {!team.teamToken && (
            <Button
              size="xs"
              colorScheme="yellow"
              variant="outline"
              onClick={() => onGenerateToken(team.teamId)}
            >
              Generate Token
            </Button>
          )}
          <Button
            size="xs"
            colorScheme="green"
            variant="outline"
            isLoading={isTesting}
            onClick={() => onTest(team.teamId)}
          >
            Test Channel
          </Button>
          {confirmDelete ? (
            <HStack gap={1}>
              <Text fontSize="xs" color="red.300">
                Delete?
              </Text>
              <Button size="xs" colorScheme="red" onClick={() => onDelete(team.teamId)}>
                Yes
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </Button>
            </HStack>
          ) : (
            <IconButton
              icon={<DeleteIcon />}
              size="xs"
              colorScheme="red"
              variant="ghost"
              aria-label="Delete team"
              onClick={() => setConfirmDelete(true)}
            />
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

function TeamManager({ event, refetch }) {
  const { showToast } = useToastContext();
  const [testingId, setTestingId] = useState(null);

  const [testChannel] = useMutation(TEST_RAINBOW_CHANNEL, {
    onCompleted: (data) => {
      setTestingId(null);
      if (data.testRainbowChannel) showToast('Test message sent!', 'success');
      else showToast('Failed to send — check channel ID and bot permissions', 'error');
    },
    onError: (e) => {
      setTestingId(null);
      showToast(e.message, 'error');
    },
  });

  const [deleteTeam] = useMutation(DELETE_RAINBOW_TEAM, {
    onCompleted: () => {
      showToast('Team deleted', 'success');
      refetch();
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const [generateToken] = useMutation(GENERATE_RAINBOW_TEAM_TOKEN, {
    onCompleted: () => {
      showToast('Token generated', 'success');
      refetch();
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const [testingAll, setTestingAll] = useState(false);
  const handleTestAll = async () => {
    setTestingAll(true);
    for (const team of event.teams) {
      await testChannel({ variables: { teamId: team.teamId } }).catch(() => {});
    }
    setTestingAll(false);
    showToast('All channel tests sent', 'info');
  };

  return (
    <VStack align="stretch" gap={3}>
      <AddTeamForm eventId={event.eventId} onAdded={refetch} />
      {event.teams.length > 0 && (
        <>
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" color="gray.400">
              {event.teams.length} team{event.teams.length !== 1 ? 's' : ''}
            </Text>
            <Button
              size="xs"
              colorScheme="green"
              variant="ghost"
              isLoading={testingAll}
              onClick={handleTestAll}
            >
              Test All Channels
            </Button>
          </HStack>
          <VStack align="stretch" gap={2}>
            {event.teams.map((t) => (
              <TeamRow
                key={t.teamId}
                team={t}
                onTest={(teamId) => {
                  setTestingId(teamId);
                  testChannel({ variables: { teamId } });
                }}
                testingId={testingId}
                onDelete={(teamId) => deleteTeam({ variables: { teamId } })}
                onGenerateToken={(teamId) => generateToken({ variables: { teamId } })}
              />
            ))}
          </VStack>
        </>
      )}
    </VStack>
  );
}

// ── Submission Card ───────────────────────────────────────────────────────────

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RainbowAdminPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();

  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_ACTIVE_RAINBOW_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const event = eventData?.getActiveRainbowEvent;
  const isAdmin = !!(user?.admin || (event?.adminIds && event.adminIds.includes(String(user?.id))));
  const canAccess = isAuthenticated && (user?.admin || isAdmin);

  if (isCheckingAuth || eventLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccess) {
    return (
      <Center h="60vh">
        <VStack>
          <Text fontSize="2xl">🔒</Text>
          <Text color="gray.400">Admin access only.</Text>
        </VStack>
      </Center>
    );
  }

  const teams = event?.teams ?? [];

  return (
    <Box minH="100vh" bg="gray.900" color="white" pt="56px" pb={6} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={6} maxW="900px" mx="auto">
        {/* Header */}
        <HStack justify="space-between" align="center" wrap="wrap" gap={3}>
          <VStack align="flex-start" gap={0}>
            <Heading
              size="lg"
              bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
              bgClip="text"
            >
              Rainbow Admin
            </Heading>
            {event && (
              <Text color="gray.400" fontSize="sm">
                {event.eventName}
              </Text>
            )}
          </VStack>
          <HStack gap={3}>
            <Button as={RouterLink} to="/eg-rainbow" size="sm" colorScheme="purple" variant="ghost">
              Main Bingo Page
            </Button>
            <Button
              as={RouterLink}
              to="/eg-rainbow/refs"
              size="sm"
              colorScheme="purple"
              variant="outline"
            >
              Refs View
            </Button>
          </HStack>
        </HStack>

        {/* No event — create one */}
        {!event && <CreateEventForm />}

        {/* Event exists — management sections */}
        {event && (
          <>
            <Accordion allowMultiple defaultIndex={[0]} borderColor="gray.700">
              {/* Event settings */}
              <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="md" mb={3}>
                <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                  <Box flex={1} textAlign="left">
                    <Text fontWeight="semibold" color="gray.200">
                      Event Settings
                    </Text>
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
                <AccordionPanel px={4} pb={4}>
                  <EventInfoPanel event={event} refetch={refetchEvent} />
                </AccordionPanel>
              </AccordionItem>

              {/* Teams */}
              <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="md" mb={3}>
                <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                  <Box flex={1} textAlign="left">
                    <HStack gap={2}>
                      <Text fontWeight="semibold" color="gray.200">
                        Teams
                      </Text>
                      {teams.length > 0 && (
                        <Badge colorScheme="purple" borderRadius="full">
                          {teams.length}
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
                <AccordionPanel px={4} pb={4}>
                  <TeamManager event={event} refetch={refetchEvent} />
                </AccordionPanel>
              </AccordionItem>

              {/* Admins & Refs */}
              <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="md" mb={3}>
                <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                  <Box flex={1} textAlign="left">
                    <HStack gap={2}>
                      <Text fontWeight="semibold" color="gray.200">
                        Admins & Refs
                      </Text>
                      {(event.admins ?? []).length > 0 && (
                        <Badge colorScheme="purple" borderRadius="full">
                          {event.admins.length}
                        </Badge>
                      )}
                    </HStack>
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
                <AccordionPanel px={4} pb={4}>
                  <AdminManager event={event} refetch={refetchEvent} />
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </>
        )}
      </VStack>
    </Box>
  );
}
