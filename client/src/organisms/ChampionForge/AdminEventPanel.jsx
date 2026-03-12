import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import ConfirmModal from './ConfirmModal';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Input,
  Select,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { useToastContext } from '../../providers/ToastProvider';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import {
  UPDATE_CLAN_WARS_EVENT_STATUS,
  CREATE_CLAN_WARS_TEAM,
  DELETE_CLAN_WARS_TEAM,
  ADD_CLAN_WARS_TASK,
  DELETE_CLAN_WARS_TASK,
  SET_CLAN_WARS_CAPTAIN,
  GENERATE_CLAN_WARS_BRACKET,
  ADMIN_FORCE_EVENT_STATUS,
  ADMIN_LOCK_ALL_LOADOUTS,
} from '../../graphql/clanWarsOperations';

const IS_DEV = process.env.NODE_ENV !== 'production';

const DIFFICULTY_COLORS = { initiate: 'green', adept: 'yellow', master: 'red' };
const ROLE_COLORS = { PVMER: 'orange', SKILLER: 'teal', ANY: 'purple' };

// ---------------------------------------------------------------------------
// Team card (admin management view)
// ---------------------------------------------------------------------------
function TeamCard({ team, eventId, eventStatus, refetch }) {
  const { showToast } = useToastContext();
  const [deleteTeam] = useMutation(DELETE_CLAN_WARS_TEAM, { onCompleted: refetch });
  const [setCaptain] = useMutation(SET_CLAN_WARS_CAPTAIN, { onCompleted: refetch });
  const [captainInput, setCaptainInput] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteTeam({ variables: { eventId, teamId: team.teamId } });
      showToast('Team deleted', 'success');
    } catch {
      showToast('Failed to delete team', 'error');
    } finally {
      setDeleteOpen(false);
    }
  };

  const handleSetCaptainById = async (discordId) => {
    if (!discordId?.trim()) return;
    try {
      await setCaptain({ variables: { teamId: team.teamId, discordId: discordId.trim() } });
      showToast('Captain set', 'success');
      setCaptainInput('');
    } catch {
      showToast('Failed to set captain', 'error');
    }
  };

  return (
    <Box bg="gray.700" borderRadius="md" p={4} border="1px solid" borderColor="gray.600">
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold" color="white">
          {team.teamName}
        </Text>
        {eventStatus === 'DRAFT' && (
          <Button size="xs" colorScheme="red" variant="ghost" onClick={() => setDeleteOpen(true)}>
            Remove
          </Button>
        )}
      </HStack>

      <Text fontSize="xs" color="gray.400" mb={2}>
        {team.members?.length ?? 0} members
        {team.captainDiscordId && ` · Captain: ${team.captainDiscordId}`}
      </Text>

      <VStack align="stretch" spacing={1} mb={2}>
        {(team.members ?? []).slice(0, 4).map((m, i) => (
          <HStack key={m.discordId ?? i} spacing={2}>
            <Badge colorScheme={ROLE_COLORS[m.role] ?? 'gray'} fontSize="xs" flexShrink={0}>
              {m.role ?? '—'}
            </Badge>
            <Text fontSize="xs" color="gray.300" noOfLines={1}>
              {m.username ?? m.discordId}
            </Text>
          </HStack>
        ))}
        {(team.members?.length ?? 0) > 4 && (
          <Text fontSize="xs" color="gray.500">
            +{team.members.length - 4} more
          </Text>
        )}
      </VStack>

      <Box mt={2}>
        <Text fontSize="xs" color="gray.500" mb={1}>
          Set Captain
        </Text>
        <DiscordMemberInput
          value={captainInput}
          onChange={(id) => {
            setCaptainInput(id);
            handleSetCaptainById(id);
          }}
          onRemove={() => setCaptainInput('')}
          showRemove={!!captainInput}
        />
      </Box>

      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`Delete "${team.teamName}"?`}
        body="This will remove the team and cannot be undone."
        confirmLabel="Delete"
        colorScheme="red"
      />
    </Box>
  );
}

function AddTeamForm({ eventId, refetch }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();
  const [createTeam] = useMutation(CREATE_CLAN_WARS_TEAM, { onCompleted: refetch });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createTeam({
        variables: { eventId, input: { teamName: name.trim() } },
      });
      showToast('Team created', 'success');
      setName('');
    } catch {
      showToast('Failed to create team', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HStack spacing={2} mt={3}>
      <Input
        size="sm"
        placeholder="Team name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        bg="gray.700"
        borderColor="gray.600"
        color="white"
        _placeholder={{ color: 'gray.500' }}
      />
      <Button
        size="sm"
        colorScheme="purple"
        isLoading={loading}
        onClick={handleSubmit}
        flexShrink={0}
      >
        Add Team
      </Button>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Task pool manager
// ---------------------------------------------------------------------------
function TaskPool({ event, refetch }) {
  const { showToast } = useToastContext();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('adept');
  const [role, setRole] = useState('PVMER');
  const [addTask] = useMutation(ADD_CLAN_WARS_TASK, { onCompleted: refetch });
  const [deleteTask] = useMutation(DELETE_CLAN_WARS_TASK, { onCompleted: refetch });

  const handleAdd = async () => {
    if (!label.trim()) return;
    try {
      await addTask({
        variables: {
          eventId: event.eventId,
          input: { label: label.trim(), description: description.trim() || null, difficulty, role },
        },
      });
      showToast('Task added', 'success');
      setLabel('');
      setDescription('');
    } catch {
      showToast('Failed to add task', 'error');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask({ variables: { taskId } });
      showToast('Task removed', 'success');
    } catch {
      showToast('Failed to remove task', 'error');
    }
  };

  const tasks = event.tasks ?? [];
  const pvmerTasks = tasks.filter((t) => t.role === 'PVMER');
  const skillerTasks = tasks.filter((t) => t.role === 'SKILLER');

  return (
    <Box>
      <HStack mb={3} justify="space-between">
        <Text fontWeight="semibold" color="white">
          Task Pool ({tasks.length})
        </Text>
        <HStack spacing={2}>
          <Badge colorScheme="orange" fontSize="xs">
            {pvmerTasks.length} PvM
          </Badge>
          <Badge colorScheme="teal" fontSize="xs">
            {skillerTasks.length} Skill
          </Badge>
        </HStack>
      </HStack>

      <VStack
        align="stretch"
        spacing={1}
        mb={4}
        maxH="320px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: '#4A5568', borderRadius: '4px' },
        }}
      >
        {tasks.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            No tasks yet.
          </Text>
        )}
        {tasks.map((task) => (
          <HStack key={task.taskId} justify="space-between" p={2} bg="gray.700" borderRadius="md">
            <VStack align="flex-start" spacing={0}>
              <HStack flexWrap="wrap" gap={1}>
                <Badge colorScheme={DIFFICULTY_COLORS[task.difficulty]} fontSize="xs">
                  {task.difficulty}
                </Badge>
                <Badge colorScheme={ROLE_COLORS[task.role]} fontSize="xs">
                  {task.role}
                </Badge>
                <Text fontSize="sm" fontWeight="medium" color="white">
                  {task.label}
                </Text>
              </HStack>
              {task.description && (
                <Text fontSize="xs" color="gray.400">
                  {task.description}
                </Text>
              )}
            </VStack>
            <Button
              size="xs"
              colorScheme="red"
              variant="ghost"
              onClick={() => handleDelete(task.taskId)}
            >
              ×
            </Button>
          </HStack>
        ))}
      </VStack>

      {/* Add task form */}
      <VStack align="stretch" spacing={2} p={3} bg="gray.700" borderRadius="md">
        <Text
          fontSize="xs"
          color="gray.400"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Add custom task
        </Text>
        <HStack spacing={2} flexWrap="wrap">
          <Input
            size="sm"
            placeholder="Task label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
            color="white"
            _placeholder={{ color: 'gray.500' }}
            minW="120px"
          />
          <Select
            size="sm"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
            color="white"
            w="110px"
            flexShrink={0}
          >
            <option value="initiate">Initiate</option>
            <option value="adept">Adept</option>
            <option value="master">Master</option>
          </Select>
          <Select
            size="sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
            color="white"
            w="110px"
            flexShrink={0}
          >
            <option value="PVMER">PvMer</option>
            <option value="SKILLER">Skiller</option>
          </Select>
        </HStack>
        <HStack>
          <Input
            size="sm"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            bg="gray.800"
            borderColor="gray.600"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
          <Button size="sm" colorScheme="purple" onClick={handleAdd} flexShrink={0}>
            Add
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main admin panel — phase controls + team/task management + dev tools
// ---------------------------------------------------------------------------
export default function AdminEventPanel({ event, refetch }) {
  const { showToast } = useToastContext();
  const [updateStatus] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });
  const [generateBracket] = useMutation(GENERATE_CLAN_WARS_BRACKET, { onCompleted: refetch });
  const [forceStatus] = useMutation(ADMIN_FORCE_EVENT_STATUS, { onCompleted: refetch });
  const [lockAllLoadouts, { loading: lockingAll }] = useMutation(ADMIN_LOCK_ALL_LOADOUTS, {
    onCompleted: refetch,
  });
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [pendingNext, setPendingNext] = useState(null);

  const NEXT_STATUS = {
    DRAFT: 'GATHERING',
    GATHERING: 'OUTFITTING',
    OUTFITTING: 'BATTLE',
    BATTLE: 'COMPLETED',
  };

  const PHASE_LABELS = {
    GATHERING: 'Start Gathering',
    OUTFITTING: 'Start Outfitting',
    BATTLE: 'Start Battle Phase',
    COMPLETED: 'Mark Completed',
  };

  const handleAdvance = async () => {
    try {
      await updateStatus({ variables: { eventId: event.eventId, status: pendingNext } });
      showToast(`Moved to ${pendingNext}`, 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to update status', 'error');
    } finally {
      setAdvanceOpen(false);
      setPendingNext(null);
    }
  };

  const handleGenerateBracket = async () => {
    try {
      await generateBracket({ variables: { eventId: event.eventId } });
      showToast('Bracket generated!', 'success');
    } catch {
      showToast('Failed to generate bracket', 'error');
    }
  };

  const nextStatus = NEXT_STATUS[event.status];

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor="teal.700"
      borderRadius="xl"
      overflow="hidden"
    >
      {/* Admin panel header */}
      <HStack
        px={5}
        py={3}
        bg="teal.900"
        borderBottom="1px solid"
        borderColor="teal.700"
        justify="space-between"
      >
        <HStack spacing={2}>
          <Icon as={SettingsIcon} color="teal.300" />
          <Text fontWeight="semibold" color="teal.200" fontSize="sm">
            Admin Controls
          </Text>
        </HStack>

        {/* Phase advance */}
        <HStack spacing={2}>
          {event.status === 'OUTFITTING' && (
            <Button size="sm" variant="outline" colorScheme="blue" onClick={handleGenerateBracket}>
              Generate Bracket
            </Button>
          )}
          {nextStatus && (
            <Button
              size="sm"
              colorScheme="purple"
              onClick={() => {
                setPendingNext(nextStatus);
                setAdvanceOpen(true);
              }}
            >
              → {PHASE_LABELS[nextStatus]}
            </Button>
          )}
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={0} divider={<Divider borderColor="gray.700" />}>
        {/* Teams section */}
        <Accordion allowMultiple defaultIndex={[0]} reduceMotion>
          <AccordionItem border="none">
            <AccordionButton px={5} py={3} _hover={{ bg: 'gray.750' }}>
              <Box flex="1" textAlign="left">
                <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                  Teams ({event.teams?.length ?? 0})
                </Text>
              </Box>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel px={5} pb={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {(event.teams ?? []).map((team) => (
                  <TeamCard
                    key={team.teamId}
                    team={team}
                    eventId={event.eventId}
                    eventStatus={event.status}
                    refetch={refetch}
                  />
                ))}
              </SimpleGrid>
              {event.eventStatus === 'DRAFT' && (
                <AddTeamForm eventId={event.eventId} refetch={refetch} />
              )}
            </AccordionPanel>
          </AccordionItem>

          {/* Task pool section */}
          <AccordionItem border="none">
            <AccordionButton px={5} py={3} _hover={{ bg: 'gray.750' }}>
              <Box flex="1" textAlign="left">
                <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                  Task Pool ({event.tasks?.length ?? 0})
                </Text>
              </Box>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel px={5} pb={4}>
              <TaskPool event={event} refetch={refetch} />
            </AccordionPanel>
          </AccordionItem>

          {/* War chests section */}
          {/* {(event.teams?.length ?? 0) > 0 && (
            <AccordionItem border="none">
              <AccordionButton px={5} py={3} _hover={{ bg: 'gray.750' }}>
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                    War Chests
                  </Text>
                </Box>
                <AccordionIcon color="gray.400" />
              </AccordionButton>
              <AccordionPanel px={5} pb={4}>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {event.teams.map((team) => (
                    <WarChestPanel key={team.teamId} team={team} hidden={false} />
                  ))}
                </SimpleGrid>
              </AccordionPanel>
            </AccordionItem>
          )} */}
        </Accordion>

        {/* Bot instructions */}
        <Box
          px={5}
          py={4}
          bg="blue.900"
          borderLeft="3px solid"
          borderLeftColor="blue.400"
          mx={5}
          my={4}
          borderRadius="md"
        >
          <Text fontWeight="semibold" color="blue.200" mb={1} fontSize="sm">
            Discord Bot Setup
          </Text>
          <Text color="blue.300" fontSize="sm">
            Players mark tasks in-progress on the site, then submit via Discord:{' '}
            <code>!cfsubmit &lt;task_id&gt;</code> with a screenshot attached.
          </Text>
        </Box>

        {/* Dev tools */}
        {IS_DEV && (
          <Accordion allowToggle reduceMotion>
            <AccordionItem border="none">
              <AccordionButton
                px={5}
                py={3}
                _hover={{ bg: 'orange.900' }}
                borderTop="1px solid"
                borderColor="orange.800"
              >
                <Box flex="1" textAlign="left">
                  <Text fontWeight="semibold" color="orange.400" fontSize="sm">
                    🛠 Dev Tools
                  </Text>
                </Box>
                <AccordionIcon color="orange.400" />
              </AccordionButton>
              <AccordionPanel px={5} pb={5}>
                <Text fontSize="xs" color="orange.400" mb={4}>
                  Admin fast-forward controls — not shown in production.
                </Text>
                <VStack align="stretch" spacing={4}>
                  {/* Force phase jump */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.400"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      Force Phase Jump
                    </Text>
                    <HStack flexWrap="wrap" gap={2}>
                      {['DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED', 'ARCHIVED'].map(
                        (s) => (
                          <Button
                            key={s}
                            size="xs"
                            color={event.status === s ? 'white' : 'gray.300'}
                            variant={event.status === s ? 'solid' : 'outline'}
                            colorScheme={event.status === s ? 'orange' : 'gray'}
                            onClick={() =>
                              forceStatus({ variables: { eventId: event.eventId, status: s } })
                                .then(() => showToast(`Forced to ${s}`, 'success'))
                                .catch((e) => showToast(e.message, 'error'))
                            }
                          >
                            {s}
                          </Button>
                        )
                      )}
                    </HStack>
                  </Box>

                  {/* Lock all loadouts */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.400"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      Loadouts
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="orange"
                      variant="outline"
                      isLoading={lockingAll}
                      onClick={() =>
                        lockAllLoadouts({ variables: { eventId: event.eventId } })
                          .then(() => showToast('All loadouts locked', 'success'))
                          .catch((e) => showToast(e.message, 'error'))
                      }
                    >
                      Lock All Loadouts
                    </Button>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Locks teams that have an official loadout. Skips teams without one.
                    </Text>
                  </Box>

                  {/* Regenerate bracket */}
                  <Box>
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="gray.400"
                      mb={2}
                      textTransform="uppercase"
                      letterSpacing={1}
                    >
                      Bracket
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      onClick={() =>
                        generateBracket({ variables: { eventId: event.eventId } })
                          .then(() => showToast('Bracket regenerated', 'success'))
                          .catch((e) => showToast(e.message, 'error'))
                      }
                    >
                      Regenerate Bracket
                    </Button>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}
      </VStack>

      <ConfirmModal
        isOpen={advanceOpen}
        onClose={() => {
          setAdvanceOpen(false);
          setPendingNext(null);
        }}
        onConfirm={handleAdvance}
        title={pendingNext ? `${PHASE_LABELS[pendingNext]}?` : ''}
        body="This action cannot be undone."
        confirmLabel={pendingNext ? PHASE_LABELS[pendingNext] : 'Confirm'}
        colorScheme="purple"
      />
    </Box>
  );
}
