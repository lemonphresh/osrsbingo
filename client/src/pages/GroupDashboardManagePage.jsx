import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Button,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner,
  Center,
  Collapse,
  Badge,
  IconButton,
  useToast,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Select,
} from '@chakra-ui/react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useState } from 'react';
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  RepeatIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ViewIcon,
} from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import {
  GET_GROUP_DASHBOARD,
  GET_GROUP_DASHBOARD_PROGRESS,
  CREATE_GROUP_GOAL_EVENT,
  UPDATE_GROUP_GOAL_EVENT,
  DELETE_GROUP_GOAL_EVENT,
  ADD_GROUP_DASHBOARD_ADMIN,
  REMOVE_GROUP_DASHBOARD_ADMIN,
  TRANSFER_GROUP_DASHBOARD,
  SEARCH_USERS,
} from '../graphql/groupDashboardOperations';
import GroupGoalEventEditor from '../organisms/GroupDashboard/GroupGoalEventEditor';
import GroupDiscordSetup from '../organisms/GroupDashboard/GroupDiscordSetup';
import GroupThemeEditor from '../organisms/GroupDashboard/GroupThemeEditor';
import usePageTitle from '../hooks/usePageTitle';

// Events become archived 2 days after their end date
const ARCHIVE_GRACE_DAYS = 2;

const GOAL_TYPE_LABELS = {
  boss_kc: 'Aggregate Boss KC',
  clue_kc: 'Aggregate Clue Scrolls',
  skill_xp: 'Aggregate Skill XP',
  ehb: 'Aggregate EHB',
  ehp: 'Aggregate EHP',
  individual_boss_kc: 'Individual Boss KC',
  individual_clue_kc: 'Individual Clue Scrolls',
  individual_skill_xp: 'Individual Skill XP',
  individual_ehb: 'Individual EHB',
  individual_ehp: 'Individual EHP',
};

function isArchivedEvent(event) {
  const grace = new Date(event.endDate);
  grace.setDate(grace.getDate() + ARCHIVE_GRACE_DAYS);
  return new Date() > grace;
}

function fmt(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v?.toLocaleString() ?? '0';
}

// ── Rerun form ───────────────────────────────────────────────────────────────

function RerunForm({ event, onSave, onCancel, loading }) {
  const [eventName, setEventName] = useState(event.eventName);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  function handleSave() {
    if (!eventName.trim() || !startDate || !endDate) return;
    onSave({
      eventName: eventName.trim(),
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      goals: (event.goals ?? []).map((g, i) => ({ ...g, order: i })),
    });
  }

  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="xs" color="gray.400">
          Event Name
        </FormLabel>
        <Input
          size="sm"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          bg="gray.700"
          borderColor="gray.600"
        />
      </FormControl>
      <HStack spacing={3}>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.400">
            New Start Date
          </FormLabel>
          <Input
            size="sm"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
          />
        </FormControl>
        <FormControl>
          <FormLabel fontSize="xs" color="gray.400">
            New End Date
          </FormLabel>
          <Input
            size="sm"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            bg="gray.700"
            borderColor="gray.600"
          />
        </FormControl>
      </HStack>
      <HStack justify="flex-end" spacing={2}>
        <Button size="xs" variant="ghost" onClick={onCancel} isDisabled={loading}>
          Cancel
        </Button>
        <Button
          size="xs"
          colorScheme="purple"
          onClick={handleSave}
          isLoading={loading}
          isDisabled={!eventName.trim() || !startDate || !endDate}
        >
          Create Event
        </Button>
      </HStack>
    </VStack>
  );
}

// ── Archived leaderboard modal ───────────────────────────────────────────────

const RANK_COLORS_MODAL = ['#f5c518', '#c0c0c0', '#cd7f32'];

function ArchivedEventModal({ event, isOpen, onClose }) {
  const { data, loading } = useQuery(GET_GROUP_DASHBOARD_PROGRESS, {
    variables: { eventId: event?.id },
    skip: !isOpen || !event?.id,
  });

  const progress = data?.getGroupDashboardProgress ?? [];
  const goals = (event?.goals ?? []).filter((g) => g.enabled !== false);
  const startStr = event
    ? new Date(event.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const endStr = event
    ? new Date(event.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg="gray.800" border="1px solid" borderColor="gray.700">
        <ModalHeader pb={2}>
          <Text fontSize="lg" fontWeight="bold" color="white">
            {event?.eventName}
          </Text>
          <Text fontSize="xs" color="gray.500" fontWeight="normal" mt={0.5}>
            {startStr} to {endStr} · Final results
          </Text>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody pb={6}>
          {loading && (
            <Center py={10}>
              <Spinner color="purple.400" />
            </Center>
          )}

          {!loading && progress.length === 0 && (
            <Text color="gray.500" fontSize="sm">
              No progress data available for this event.
            </Text>
          )}

          {!loading && progress.length > 0 && (
            <VStack spacing={4} align="stretch">
              {goals.map((goalConfig) => {
                const prog = progress.find((p) => p.goalId === goalConfig.goalId);
                if (!prog) return null;
                const pct = Math.min(100, prog.percent ?? 0);
                const isDone = pct >= 100;
                const barColor = isDone
                  ? '#43aa8b'
                  : pct >= 75
                  ? '#f4a732'
                  : pct >= 50
                  ? '#f4d35e'
                  : '#7D5FFF';

                return (
                  <Box
                    key={goalConfig.goalId}
                    bg="gray.700"
                    borderRadius="md"
                    overflow="hidden"
                    border="1px solid"
                    borderColor={barColor + '66'}
                  >
                    {/* Goal header */}
                    <HStack px={4} pt={3} pb={2} justify="space-between">
                      <HStack spacing={2}>
                        <Text fontSize="lg" lineHeight="1">
                          {goalConfig.emoji ?? '🎯'}
                        </Text>
                        <Text fontWeight="semibold" color="white" fontSize="sm">
                          {prog.displayName}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color={isDone ? 'green.300' : 'gray.200'}
                      >
                        {isDone ? '✓ Complete' : `${Math.round(pct)}%`}
                      </Text>
                    </HStack>

                    {/* Progress bar */}
                    <Box px={4} pb={3}>
                      <Box
                        bg="#111"
                        borderRadius={4}
                        h="8px"
                        overflow="hidden"
                        border="1px solid #333"
                        mb={1.5}
                      >
                        <Box
                          h="full"
                          w={`${pct}%`}
                          bg={barColor}
                          borderRadius={4}
                          boxShadow={`0 0 6px ${barColor}88`}
                        />
                      </Box>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">
                          {fmt(prog.current)} gained
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          target: {fmt(prog.target)}
                        </Text>
                      </HStack>
                    </Box>

                    {/* Top contributors */}
                    {prog.topContributors.length > 0 && (
                      <Box borderTop="1px solid" borderColor="gray.600">
                        <HStack
                          px={4}
                          py={1.5}
                          borderBottom="1px solid"
                          borderColor="gray.600"
                          spacing={0}
                        >
                          <Box w="28px" flexShrink={0} />
                          <Text
                            flex={1}
                            fontSize="10px"
                            color="gray.500"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Player
                          </Text>
                          <Text
                            w="60px"
                            textAlign="right"
                            fontSize="10px"
                            color="gray.500"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Gained
                          </Text>
                          <Text
                            w="40px"
                            textAlign="right"
                            fontSize="10px"
                            color="gray.500"
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
                            Share
                          </Text>
                        </HStack>
                        {prog.topContributors.slice(0, 5).map((c, i) => (
                          <HStack
                            key={c.rsn}
                            px={4}
                            py={2}
                            spacing={0}
                            borderTop={i > 0 ? '1px solid' : undefined}
                            borderColor="gray.700"
                            _hover={{ bg: 'gray.600' }}
                            transition="background 0.1s"
                          >
                            <Text
                              w="28px"
                              fontSize="xs"
                              fontWeight="bold"
                              color={i < 3 ? RANK_COLORS_MODAL[i] : 'gray.500'}
                              flexShrink={0}
                            >
                              #{i + 1}
                            </Text>
                            <Text
                              fontSize="sm"
                              color={i === 0 ? 'yellow.300' : 'gray.300'}
                              flex={1}
                              noOfLines={1}
                            >
                              {c.rsn}
                            </Text>
                            <Text
                              w="60px"
                              textAlign="right"
                              fontSize="sm"
                              color="gray.300"
                              fontFamily="mono"
                            >
                              {fmt(c.value)}
                            </Text>
                            <Text w="40px" textAlign="right" fontSize="xs" color="gray.500">
                              {c.percent.toFixed(1)}%
                            </Text>
                          </HStack>
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ── Editors panel ────────────────────────────────────────────────────────────

function EditorsPanel({ dashboard, onRefetch }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [searchUsers, { loading: searching }] = useLazyQuery(SEARCH_USERS, {
    onCompleted: (d) => setSearchResults(d?.searchUsers ?? []),
  });

  const [addAdmin, { loading: adding }] = useMutation(ADD_GROUP_DASHBOARD_ADMIN, {
    onCompleted: () => {
      onRefetch();
      toast({ title: 'Editor added', status: 'success', duration: 2000, isClosable: true });
    },
  });

  const [removeAdmin, { loading: removing }] = useMutation(REMOVE_GROUP_DASHBOARD_ADMIN, {
    onCompleted: () => {
      onRefetch();
      toast({ title: 'Editor removed', status: 'success', duration: 2000, isClosable: true });
    },
  });

  const creator = dashboard.creator;
  const admins = dashboard.admins ?? [];
  const adminIdSet = new Set(admins.map((a) => String(a.id)));

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearchResults([]);
    searchUsers({ variables: { search: searchQuery.trim() } });
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Current editors */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
          Current Editors
        </Text>
        <VStack spacing={2} align="stretch">
          {creator && (
            <HStack
              px={3}
              py={2}
              bg="gray.700"
              borderRadius="md"
              justify="space-between"
              border="1px solid"
              borderColor="gray.600"
            >
              <HStack spacing={2}>
                <Text fontSize="sm" color="yellow.300" fontWeight="semibold">
                  {creator.displayName || creator.username} - RSN: {creator.rsn}
                </Text>
                <Badge colorScheme="yellow" fontSize="xs">
                  owner
                </Badge>
              </HStack>
            </HStack>
          )}
          {admins.map((admin) => (
            <HStack
              key={admin.id}
              px={3}
              py={2}
              bg="gray.700"
              borderRadius="md"
              justify="space-between"
              border="1px solid"
              borderColor="gray.600"
            >
              <HStack spacing={1}>
                <Text fontSize="sm" color="gray.200">
                  {admin.displayName || admin.username}
                </Text>
                <Text fontSize="sm" color="gray.400">
                  - RSN: {admin.rsn}
                </Text>
              </HStack>
              <Button
                size="xs"
                colorScheme="red"
                variant="ghost"
                isLoading={removing}
                onClick={() => removeAdmin({ variables: { id: dashboard.id, userId: admin.id } })}
              >
                Remove
              </Button>
            </HStack>
          ))}
          {admins.length === 0 && (
            <Text fontSize="sm" color="gray.500">
              No other editors yet.
            </Text>
          )}
        </VStack>
      </Box>

      {/* Add editor */}
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={3}>
          Add Editor
        </Text>
        <HStack spacing={2}>
          <Input
            size="sm"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            bg="gray.700"
            borderColor="gray.600"
          />
          <Button
            size="sm"
            colorScheme="purple"
            isLoading={searching}
            isDisabled={!searchQuery.trim()}
            onClick={handleSearch}
            flexShrink={0}
          >
            Search
          </Button>
        </HStack>

        {searchResults.length > 0 && (
          <VStack spacing={1} align="stretch" mt={3}>
            {searchResults
              .filter((u) => String(u.id) !== String(dashboard.creatorId))
              .map((u) => {
                const alreadyEditor = adminIdSet.has(String(u.id));
                return (
                  <HStack
                    key={u.id}
                    px={3}
                    py={2}
                    bg="gray.700"
                    borderRadius="md"
                    justify="space-between"
                    border="1px solid"
                    borderColor="gray.600"
                  >
                    <HStack spacing={1}>
                      <Text fontSize="sm" color="gray.200">
                        {u.displayName || u.username}
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        - RSN: {u.rsn}
                      </Text>
                    </HStack>
                    <Button
                      size="xs"
                      colorScheme={alreadyEditor ? 'gray' : 'green'}
                      variant={alreadyEditor ? 'ghost' : 'solid'}
                      isDisabled={alreadyEditor}
                      isLoading={adding}
                      onClick={() => {
                        addAdmin({ variables: { id: dashboard.id, userId: u.id } });
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                    >
                      {alreadyEditor ? 'Already editor' : 'Add'}
                    </Button>
                  </HStack>
                );
              })}
          </VStack>
        )}

        {searchResults.length === 0 && searchQuery && !searching && (
          <Text fontSize="xs" color="gray.500" mt={2}>
            No results yet — hit Search or press Enter.
          </Text>
        )}
      </Box>
    </VStack>
  );
}

// ── Event row ────────────────────────────────────────────────────────────────

function EventRow({
  event,
  onEdit,
  onDelete,
  deleting,
  onRerun,
  rerunLoading,
  onViewLeaderboard,
  archived,
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const now = new Date();
  const isActive = now >= new Date(event.startDate) && now <= new Date(event.endDate);
  const isPast = now > new Date(event.endDate);
  const isUpcoming = now < new Date(event.startDate);

  const borderColor = archived
    ? '#2D3748'
    : isActive
    ? '#43AA8B'
    : isUpcoming
    ? '#7D5FFF'
    : '#4A5568';
  const enabledGoals = (event.goals ?? []).filter((g) => g.enabled !== false);

  const startStr = new Date(event.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const endStr = new Date(event.endDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  async function handleRerun(input) {
    await onRerun(input);
    setRerunning(false);
  }

  return (
    <Box
      bg="gray.800"
      border="2px solid"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      opacity={archived ? 0.8 : 1}
    >
      {/* Card header */}
      <HStack px={5} pt={4} pb={3} justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={1} minW={0} flex={1}>
          <HStack spacing={2} flexWrap="wrap">
            <Text fontWeight="bold" color={archived ? 'gray.400' : 'white'} fontSize="md">
              {event.eventName}
            </Text>
            {isActive && !archived && (
              <Badge colorScheme="green" fontSize="xs">
                Active
              </Badge>
            )}
            {isUpcoming && !archived && (
              <Badge colorScheme="purple" fontSize="xs">
                Upcoming
              </Badge>
            )}
            {(isPast || archived) && (
              <Badge colorScheme="gray" fontSize="xs">
                Ended
              </Badge>
            )}
          </HStack>
          <Text fontSize="xs" color="gray.500">
            {startStr} to {endStr}
          </Text>
        </VStack>

        <HStack spacing={1} flexShrink={0}>
          {archived ? (
            <>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                leftIcon={<ViewIcon />}
                color="gray.400"
                _hover={{ color: 'white' }}
                onClick={onViewLeaderboard}
              >
                Results
              </Button>
              <Button
                size="xs"
                colorScheme="purple"
                variant="outline"
                leftIcon={<RepeatIcon />}
                onClick={() => {
                  setRerunning((v) => !v);
                  setConfirmDelete(false);
                }}
              >
                Rerun
              </Button>
              {confirmDelete ? (
                <HStack spacing={1} ml={1}>
                  <Button
                    size="xs"
                    colorScheme="red"
                    isLoading={deleting}
                    onClick={() => onDelete(event.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </HStack>
              ) : (
                <IconButton
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  icon={<DeleteIcon />}
                  aria-label="Delete event"
                  onClick={() => {
                    setConfirmDelete(true);
                    setRerunning(false);
                  }}
                />
              )}
            </>
          ) : (
            <>
              <IconButton
                size="sm"
                variant="ghost"
                colorScheme="purple"
                icon={<EditIcon />}
                aria-label="Edit event"
                onClick={() => {
                  setEditing((v) => !v);
                  setConfirmDelete(false);
                }}
              />
              {confirmDelete ? (
                <HStack spacing={1}>
                  <Button
                    size="xs"
                    colorScheme="red"
                    isLoading={deleting}
                    onClick={() => onDelete(event.id)}
                  >
                    Confirm
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </Button>
                </HStack>
              ) : (
                <IconButton
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  icon={<DeleteIcon />}
                  aria-label="Delete event"
                  onClick={() => {
                    setConfirmDelete(true);
                    setEditing(false);
                  }}
                />
              )}
            </>
          )}
        </HStack>
      </HStack>

      {/* Goals preview */}
      {enabledGoals.length > 0 && !editing && !rerunning && (
        <Box px={5} pb={4} borderTop="1px solid" borderColor="gray.700" pt={3}>
          <Text
            fontSize="xs"
            color="gray.500"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={2}
          >
            Goals
          </Text>
          <VStack align="stretch" spacing={1}>
            {enabledGoals.map((g) => (
              <HStack key={g.goalId} spacing={2}>
                <Text fontSize="sm" flexShrink={0}>
                  {g.emoji ?? '🎯'}
                </Text>
                <Text
                  fontSize="sm"
                  color={archived ? 'gray.500' : 'gray.300'}
                  flex={1}
                  noOfLines={1}
                >
                  {g.displayName || g.metric || 'Goal'}
                </Text>
                {g.type && (
                  <Text fontSize="10px" color="gray.500" flexShrink={0} border="1px solid" borderColor="gray.600" px={1.5} borderRadius="sm" lineHeight="1.7" whiteSpace="nowrap">
                    {GOAL_TYPE_LABELS[g.type] ?? g.type}
                  </Text>
                )}
                <Text fontSize="xs" color="gray.500" flexShrink={0} fontFamily="mono">
                  target: {fmt(g.target)}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {enabledGoals.length === 0 && !editing && !rerunning && (
        <Box px={5} pb={3} borderTop="1px solid" borderColor="gray.700" pt={3}>
          <Text fontSize="xs" color="gray.500">
            {archived ? 'No goals configured.' : 'No goals yet — click Edit to add some.'}
          </Text>
        </Box>
      )}

      {/* Inline editor (active events only) */}
      <Collapse in={editing} animateOpacity>
        <Box px={5} pb={5} borderTop="1px solid" borderColor="gray.600" pt={4}>
          <Text fontWeight="semibold" color="gray.200" mb={4} fontSize="sm">
            Edit Event
          </Text>
          <GroupGoalEventEditor
            initialValues={event}
            onSave={(input) => {
              onEdit(event.id, input);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </Box>
      </Collapse>

      {/* Rerun form (archived events only) */}
      <Collapse in={rerunning} animateOpacity>
        <Box px={5} pb={5} borderTop="1px solid" borderColor="gray.600" pt={4}>
          <Text fontWeight="semibold" color="gray.200" mb={1} fontSize="sm">
            Rerun — pick a new date range
          </Text>
          <Text fontSize="xs" color="gray.500" mb={4}>
            A new event will be created with the same title and goals.
          </Text>
          <RerunForm
            event={event}
            onSave={handleRerun}
            onCancel={() => setRerunning(false)}
            loading={rerunLoading}
          />
        </Box>
      </Collapse>
    </Box>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function GroupDashboardManagePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const { data, loading, error, refetch } = useQuery(GET_GROUP_DASHBOARD, {
    variables: { slug },
  });

  const dashboard = data?.getGroupDashboard;
  usePageTitle(dashboard ? `Manage – ${dashboard.groupName}` : 'Manage Dashboard');

  const [showCreate, setShowCreate] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [leaderboardEventId, setLeaderboardEventId] = useState(null);
  const [eventSortKey, setEventSortKey] = useState('startDate');
  const [eventSortDir, setEventSortDir] = useState('desc');
  const [showTransfer, setShowTransfer] = useState(false);
  const [confirmTransferTo, setConfirmTransferTo] = useState(null); // { id, displayName }

  const [createEvent, { loading: creating }] = useMutation(CREATE_GROUP_GOAL_EVENT, {
    onCompleted: () => {
      refetch();
      setShowCreate(false);
      toast({ title: 'Event created', status: 'success', duration: 2000, isClosable: true });
    },
  });

  const [updateEvent] = useMutation(UPDATE_GROUP_GOAL_EVENT, {
    onCompleted: () => {
      refetch();
      toast({ title: 'Event updated', status: 'success', duration: 2000, isClosable: true });
    },
  });

  const [deleteEvent, { loading: deleting }] = useMutation(DELETE_GROUP_GOAL_EVENT, {
    onCompleted: () => {
      refetch();
      toast({ title: 'Event deleted', status: 'success', duration: 2000, isClosable: true });
    },
  });

  const [transferDashboard, { loading: transferring }] = useMutation(TRANSFER_GROUP_DASHBOARD, {
    onCompleted: () => {
      refetch();
      setShowTransfer(false);
      toast({ title: 'Ownership transferred', status: 'success', duration: 3000, isClosable: true });
    },
    onError: (err) => {
      toast({ title: err.message, status: 'error', duration: 4000, isClosable: true });
    },
  });

  if (loading)
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );

  if (error || !dashboard) {
    return (
      <Center h="60vh">
        <Text color="gray.400">Dashboard not found.</Text>
      </Center>
    );
  }

  const isAdmin =
    user &&
    (String(dashboard.creatorId) === String(user.id) ||
      (dashboard.adminIds ?? []).map(String).includes(String(user.id)));

  if (!user || !isAdmin) {
    return (
      <Center h="60vh">
        <Text color="gray.400">Not authorized.</Text>
      </Center>
    );
  }

  const sortedEvents = [...(dashboard.events ?? [])].sort((a, b) => {
    const aVal = new Date(a[eventSortKey]);
    const bVal = new Date(b[eventSortKey]);
    return eventSortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const activeEvents = sortedEvents.filter((e) => !isArchivedEvent(e));
  const archivedEvents = sortedEvents.filter((e) => isArchivedEvent(e));
  const leaderboardEvent = archivedEvents.find((e) => e.id === leaderboardEventId) ?? null;

  const theme = dashboard.theme ?? {};
  const accentColor = theme.accentColor ?? '#43AA8B';

  const handleRerun = async (input) => {
    await createEvent({ variables: { dashboardId: dashboard.id, input } });
  };

  return (
    <>
      <ArchivedEventModal
        event={leaderboardEvent}
        isOpen={!!leaderboardEvent}
        onClose={() => setLeaderboardEventId(null)}
      />

      <Flex
        flex="1"
        flexDirection="column"
        width="100%"
        paddingX={['16px', '24px', '64px']}
        paddingBottom={['72px', '112px']}
        paddingTop={['56px', '72px']}
      >
        <Box maxW="800px" w="100%" mx="auto">
          <VStack spacing={6} align="stretch">
            {/* Page header */}
            <Box>
              <Button
                as={RouterLink}
                to="/group"
                size="xs"
                variant="ghost"
                colorScheme="gray"
                leftIcon={<ChevronLeftIcon />}
                mb={3}
                color="gray.400"
              >
                My Dashboards
              </Button>

              <HStack justify="space-between" align="center">
                <VStack align="flex-start" spacing={0.5}>
                  <Heading size="lg" color="white">
                    {dashboard.groupName}
                  </Heading>
                  <HStack spacing={2}>
                    <Box w="3px" h="14px" bg={accentColor} borderRadius="full" />
                    <Text fontSize="sm" color="gray.400">
                      Dashboard Management
                    </Text>
                  </HStack>
                </VStack>
                <Button
                  as={RouterLink}
                  to={`/group/${slug}`}
                  size="sm"
                  variant="outline"
                  colorScheme="purple"
                  rightIcon={<ExternalLinkIcon />}
                  flexShrink={0}
                >
                  View Public Page
                </Button>
              </HStack>
            </Box>

            {/* Tabs */}
            <Tabs variant="line" colorScheme="purple">
              <TabList>
                <Tab fontSize="sm">Events</Tab>
                <Tab fontSize="sm">Theme</Tab>
                <Tab fontSize="sm">Discord</Tab>
                <Tab fontSize="sm">Editors</Tab>
              </TabList>

              <TabPanels>
                {/* ── Events tab ── */}
                <TabPanel px={0} pt={5}>
                  <VStack spacing={3} align="stretch">
                    {/* Sort controls */}
                    <HStack spacing={2} justify="flex-end">
                      <Select
                        size="xs"
                        value={eventSortKey}
                        onChange={(e) => setEventSortKey(e.target.value)}
                        bg="gray.800"
                        borderColor="gray.600"
                        w="auto"
                      >
                        <option value="startDate">Start Date</option>
                        <option value="endDate">End Date</option>
                        <option value="createdAt">Created</option>
                      </Select>
                      <Select
                        size="xs"
                        value={eventSortDir}
                        onChange={(e) => setEventSortDir(e.target.value)}
                        bg="gray.800"
                        borderColor="gray.600"
                        w="auto"
                      >
                        <option value="desc">Newest first</option>
                        <option value="asc">Oldest first</option>
                      </Select>
                    </HStack>

                    {activeEvents.length === 0 && !showCreate && (
                      <Box bg="gray.800" borderRadius="xl" p={8} textAlign="center">
                        <Text color="gray.400" mb={1}>
                          No active events.
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          Add an event to start tracking goals for your group.
                        </Text>
                      </Box>
                    )}

                    {activeEvents.map((e) => (
                      <EventRow
                        key={e.id}
                        event={e}
                        onEdit={(id, input) => updateEvent({ variables: { id, input } })}
                        onDelete={(id) => deleteEvent({ variables: { id } })}
                        deleting={deleting}
                        onRerun={handleRerun}
                        rerunLoading={creating}
                      />
                    ))}

                    {showCreate ? (
                      <Box
                        bg="gray.800"
                        border="2px solid"
                        borderColor="purple.600"
                        borderRadius="lg"
                        p={5}
                      >
                        <Text fontWeight="bold" color="gray.100" mb={4}>
                          New Event
                        </Text>
                        <GroupGoalEventEditor
                          onSave={(input) =>
                            createEvent({ variables: { dashboardId: dashboard.id, input } })
                          }
                          onCancel={() => setShowCreate(false)}
                          loading={creating}
                        />
                      </Box>
                    ) : (
                      <Button
                        leftIcon={<AddIcon />}
                        variant="outline"
                        colorScheme="purple"
                        size="sm"
                        alignSelf="flex-start"
                        onClick={() => setShowCreate(true)}
                      >
                        Add Event
                      </Button>
                    )}

                    {/* ── Archived section ── */}
                    {archivedEvents.length > 0 && (
                      <Box mt={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          rightIcon={showArchived ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          onClick={() => setShowArchived((v) => !v)}
                          color="gray.500"
                          _hover={{ color: 'gray.300' }}
                          px={1}
                          fontWeight="normal"
                        >
                          Archived ({archivedEvents.length})
                        </Button>

                        <Collapse in={showArchived} animateOpacity>
                          <VStack spacing={3} align="stretch" mt={3}>
                            {archivedEvents.map((e) => (
                              <EventRow
                                key={e.id}
                                event={e}
                                onDelete={(id) => deleteEvent({ variables: { id } })}
                                deleting={deleting}
                                onRerun={handleRerun}
                                rerunLoading={creating}
                                onViewLeaderboard={() => setLeaderboardEventId(e.id)}
                                archived
                              />
                            ))}
                          </VStack>
                        </Collapse>
                      </Box>
                    )}
                  </VStack>
                </TabPanel>

                {/* ── Theme tab ── */}
                <TabPanel px={0} pt={5}>
                  <Box bg="gray.800" borderRadius="xl" p={5}>
                    <GroupThemeEditor dashboard={dashboard} />
                  </Box>
                </TabPanel>

                {/* ── Discord tab ── */}
                <TabPanel px={0} pt={5}>
                  <Box bg="gray.800" borderRadius="xl" p={5}>
                    <GroupDiscordSetup dashboard={dashboard} />
                  </Box>
                </TabPanel>

                {/* ── Editors tab ── */}
                <TabPanel px={0} pt={5}>
                  <VStack spacing={4} align="stretch">
                    <Box bg="gray.800" borderRadius="xl" p={5}>
                      <Text fontSize="sm" color="gray.400" mb={5} lineHeight="1.6">
                        Editors can create, edit, and delete events and manage settings for this
                        dashboard.
                      </Text>
                      <EditorsPanel dashboard={dashboard} onRefetch={refetch} />
                    </Box>

                    {/* Transfer ownership — creator only */}
                    {String(dashboard.creatorId) === String(user.id) && (
                      <Box bg="gray.800" borderRadius="xl" p={5} border="1px solid" borderColor="red.900">
                        <Text fontSize="sm" fontWeight="semibold" color="red.300" mb={1}>
                          Transfer Ownership
                        </Text>
                        <Text fontSize="xs" color="gray.500" mb={3}>
                          Transfer full ownership to another editor. You will become an editor yourself.
                        </Text>
                        {!showTransfer ? (
                          <Button size="sm" colorScheme="red" variant="outline" onClick={() => { setShowTransfer(true); setConfirmTransferTo(null); }}>
                            Transfer Ownership
                          </Button>
                        ) : confirmTransferTo ? (
                          <VStack spacing={3} align="stretch">
                            <Box bg="red.900" border="1px solid" borderColor="red.600" borderRadius="md" p={3}>
                              <Text fontSize="sm" color="red.200" fontWeight="semibold" mb={1}>Are you sure?</Text>
                              <Text fontSize="xs" color="gray.300">
                                <Text as="span" fontWeight="bold">{confirmTransferTo.label}</Text> will become the new owner. You cannot undo this without their cooperation.
                              </Text>
                            </Box>
                            <HStack spacing={2}>
                              <Button
                                size="sm"
                                colorScheme="red"
                                isLoading={transferring}
                                onClick={() => transferDashboard({ variables: { id: dashboard.id, newOwnerId: confirmTransferTo.id } })}
                              >
                                Yes, Transfer Ownership
                              </Button>
                              <Button size="sm" variant="outline" colorScheme="gray" color="gray.300" borderColor="gray.500" onClick={() => setConfirmTransferTo(null)}>
                                Go Back
                              </Button>
                            </HStack>
                          </VStack>
                        ) : (
                          <VStack spacing={3} align="stretch">
                            <Text fontSize="xs" color="red.400">
                              Choose an existing editor to become the new owner:
                            </Text>
                            {(dashboard.admins ?? []).length === 0 ? (
                              <Text fontSize="xs" color="gray.500">Add at least one editor above before transferring.</Text>
                            ) : (
                              <VStack spacing={2} align="stretch">
                                {(dashboard.admins ?? []).map((admin) => (
                                  <HStack key={admin.id} px={3} py={2} bg="gray.700" borderRadius="md" justify="space-between" border="1px solid" borderColor="gray.600">
                                    <Text fontSize="sm" color="gray.200">
                                      {admin.displayName || admin.username}
                                      <Text as="span" color="gray.500"> · {admin.rsn}</Text>
                                    </Text>
                                    <Button
                                      size="xs"
                                      colorScheme="red"
                                      variant="outline"
                                      onClick={() => setConfirmTransferTo({ id: admin.id, label: admin.displayName || admin.username })}
                                    >
                                      Select
                                    </Button>
                                  </HStack>
                                ))}
                              </VStack>
                            )}
                            <Button size="xs" variant="outline" colorScheme="gray" color="gray.300" borderColor="gray.500" alignSelf="flex-start" onClick={() => setShowTransfer(false)}>
                              Cancel
                            </Button>
                          </VStack>
                        )}
                      </Box>
                    )}
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Box>
      </Flex>
    </>
  );
}
