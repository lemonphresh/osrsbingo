import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
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
  useColorMode,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { useToastContext } from '../../providers/ToastProvider';
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

const PVMER_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'gloves', 'boots'];

const DIFFICULTY_COLORS = { easy: 'green', medium: 'yellow', hard: 'red' };
const ROLE_COLORS = { PVMER: 'orange', SKILLER: 'teal' };

function TeamCard({ team, eventId, isAdmin, refetch }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const [deleteTeam] = useMutation(DELETE_CLAN_WARS_TEAM, { onCompleted: refetch });
  const [setCaptain] = useMutation(SET_CLAN_WARS_CAPTAIN, { onCompleted: refetch });
  const [captainInput, setCaptainInput] = useState('');

  const bg = 'gray.50';

  const handleDelete = async () => {
    if (!window.confirm(`Delete team "${team.teamName}"?`)) return;
    try {
      await deleteTeam({ variables: { eventId, teamId: team.teamId } });
      showToast('Team deleted', 'success');
    } catch {
      showToast('Failed to delete team', 'error');
    }
  };

  const handleSetCaptain = async () => {
    if (!captainInput.trim()) return;
    try {
      await setCaptain({ variables: { teamId: team.teamId, discordId: captainInput.trim() } });
      showToast('Captain set', 'success');
      setCaptainInput('');
    } catch {
      showToast('Failed to set captain', 'error');
    }
  };

  return (
    <Box bg={bg} borderRadius="md" p={4} border="1px solid" borderColor={'gray.200'}>
      <HStack justify="space-between" mb={2}>
        <Text fontWeight="bold">{team.teamName}</Text>
        {isAdmin && (
          <Button size="xs" colorScheme="red" variant="ghost" onClick={handleDelete}>
            Remove
          </Button>
        )}
      </HStack>

      {team.discordRoleId && (
        <Text fontSize="xs" color="gray.500" mb={1}>
          Role ID: {team.discordRoleId}
        </Text>
      )}

      <Text fontSize="xs" color="gray.500" mb={2}>
        {team.members?.length ?? 0} members
        {team.captainDiscordId && ` · Captain: ${team.captainDiscordId}`}
      </Text>

      {team.members?.slice(0, 3).map((m) => (
        <HStack key={m.discordId} spacing={2} mb={1}>
          <Badge colorScheme={ROLE_COLORS[m.role] ?? 'gray'} fontSize="xs">
            {m.role}
          </Badge>
          <Text fontSize="xs">{m.username ?? m.discordId}</Text>
        </HStack>
      ))}

      {isAdmin && (
        <HStack mt={3} spacing={2}>
          <Input
            size="xs"
            placeholder="Set captain (Discord ID)"
            value={captainInput}
            onChange={(e) => setCaptainInput(e.target.value)}
          />
          <Button size="xs" colorScheme="purple" onClick={handleSetCaptain}>
            Set
          </Button>
        </HStack>
      )}
    </Box>
  );
}

function AddTeamForm({ eventId, refetch }) {
  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();
  const [createTeam] = useMutation(CREATE_CLAN_WARS_TEAM, { onCompleted: refetch });

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createTeam({
        variables: {
          eventId,
          input: { teamName: name.trim(), discordRoleId: roleId.trim() || null },
        },
      });
      showToast('Team created', 'success');
      setName('');
      setRoleId('');
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
      />
      <Input
        size="sm"
        placeholder="Discord Role ID (optional)"
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
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

function TaskPool({ event, isAdmin, refetch }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
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

  return (
    <Box>
      <Text fontWeight="semibold" mb={3}>
        Task Pool ({tasks.length})
      </Text>

      <VStack align="stretch" spacing={2} mb={4} maxH="300px" overflowY="auto">
        {tasks.length === 0 && (
          <Text fontSize="sm" color="gray.500">
            No tasks yet. Add tasks for players to submit via Discord.
          </Text>
        )}
        {tasks.map((task) => (
          <HStack key={task.taskId} justify="space-between" p={2} bg={'gray.50'} borderRadius="md">
            <VStack align="flex-start" spacing={0}>
              <HStack>
                <Badge colorScheme={DIFFICULTY_COLORS[task.difficulty]} fontSize="xs">
                  {task.difficulty}
                </Badge>
                <Badge colorScheme={ROLE_COLORS[task.role]} fontSize="xs">
                  {task.role}
                </Badge>
                <Text fontSize="sm" fontWeight="medium">
                  {task.label}
                </Text>
              </HStack>
              {task.description && (
                <Text fontSize="xs" color="gray.500">
                  {task.description}
                </Text>
              )}
              <Text fontSize="xs" color="gray.500" fontFamily="mono">
                {task.taskId}
              </Text>
            </VStack>
            {isAdmin && (
              <Button
                size="xs"
                colorScheme="red"
                variant="ghost"
                onClick={() => handleDelete(task.taskId)}
              >
                Remove
              </Button>
            )}
          </HStack>
        ))}
      </VStack>

      {isAdmin && (
        <VStack align="stretch" spacing={2} p={3} bg={'gray.100'} borderRadius="md">
          <HStack spacing={2}>
            <Input
              size="sm"
              placeholder="Task label (shown to players)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Select
              size="sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              w="auto"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <Select size="sm" value={role} onChange={(e) => setRole(e.target.value)} w="auto">
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
            />
            <Button size="sm" colorScheme="purple" onClick={handleAdd} flexShrink={0}>
              Add Task
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}

export default function AdminEventPanel({ event, isAdmin, refetch }) {
  const { colorMode } = useColorMode();
  const { showToast } = useToastContext();
  const [updateStatus] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });
  const [generateBracket] = useMutation(GENERATE_CLAN_WARS_BRACKET, { onCompleted: refetch });
  const [forceStatus] = useMutation(ADMIN_FORCE_EVENT_STATUS, { onCompleted: refetch });
  const [lockAllLoadouts, { loading: lockingAll }] = useMutation(ADMIN_LOCK_ALL_LOADOUTS, {
    onCompleted: refetch,
  });

  const handleAdvance = async (nextStatus) => {
    const labels = {
      GATHERING: 'Start Gathering Phase',
      OUTFITTING: 'Start Outfitting Phase',
      BATTLE: 'Start Battle Phase',
      COMPLETED: 'Mark Complete',
    };
    if (!window.confirm(`${labels[nextStatus]}? This cannot be undone.`)) return;
    try {
      await updateStatus({ variables: { eventId: event.eventId, status: nextStatus } });
      showToast(`Moved to ${nextStatus}`, 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to update status', 'error');
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

  const NEXT_STATUS = {
    DRAFT: 'GATHERING',
    GATHERING: 'OUTFITTING',
    OUTFITTING: 'BATTLE',
    BATTLE: 'COMPLETED',
  };

  const bgHeader = 'gray.50';

  return (
    <VStack align="stretch" spacing={6}>
      {/* Header */}
      <Box bg={bgHeader} borderRadius="lg" p={5} border="1px solid" borderColor={'gray.200'}>
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text color="gray.800" fontSize="xl" fontWeight="bold">
              {event.eventName}
            </Text>
            <HStack>
              <Badge colorScheme="gray">{event.status}</Badge>
              {event.clanId && (
                <Text fontSize="xs" color="gray.500">
                  Clan: {event.clanId}
                </Text>
              )}
            </HStack>
          </VStack>

          {isAdmin && NEXT_STATUS[event.status] && (
            <VStack align="flex-end" spacing={2}>
              <Button
                colorScheme="purple"
                size="sm"
                onClick={() => handleAdvance(NEXT_STATUS[event.status])}
              >
                → Start {NEXT_STATUS[event.status]}
              </Button>
              {event.status === 'OUTFITTING' && (
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleGenerateBracket}
                >
                  Generate Bracket
                </Button>
              )}
            </VStack>
          )}
        </HStack>

        {/* Config summary */}
        {event.eventConfig && (
          <SimpleGrid columns={3} spacing={4} mt={4} fontSize="sm">
            <Box>
              <Text color="gray.700" fontSize="xs">
                Gathering
              </Text>
              <Text color="gray.500" fontWeight="medium">
                {event.eventConfig.gatheringHours}h
              </Text>
            </Box>
            <Box>
              <Text color="gray.700" fontSize="xs">
                Outfitting
              </Text>
              <Text color="gray.500" fontWeight="medium">
                {event.eventConfig.outfittingHours}h
              </Text>
            </Box>
            <Box>
              <Text color="gray.700" fontSize="xs">
                Turn Timer
              </Text>
              <Text color="gray.500" fontWeight="medium">
                {event.eventConfig.turnTimerSeconds}s
              </Text>
            </Box>
          </SimpleGrid>
        )}
      </Box>

      <Accordion allowMultiple defaultIndex={[0, 1]}>
        {/* Teams section */}
        <AccordionItem border="none">
          <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
            <Box flex="1" textAlign="left">
              <Text fontWeight="semibold">Teams ({event.teams?.length ?? 0})</Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {(event.teams ?? []).map((team) => (
                <TeamCard
                  key={team.teamId}
                  team={team}
                  eventId={event.eventId}
                  isAdmin={isAdmin}
                  refetch={refetch}
                />
              ))}
            </SimpleGrid>
            {isAdmin && <AddTeamForm eventId={event.eventId} refetch={refetch} />}
          </AccordionPanel>
        </AccordionItem>

        <Divider />

        {/* Task pool section */}
        <AccordionItem border="none">
          <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
            <Box flex="1" textAlign="left">
              <Text fontWeight="semibold">Task Pool</Text>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0}>
            <TaskPool event={event} isAdmin={isAdmin} refetch={refetch} />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Bot instructions */}
      <Box p={4} bg={'blue.50'} borderRadius="md" fontSize="sm">
        <Text fontWeight="semibold" mb={1}>
          Discord Bot Setup
        </Text>
        <Text color={'blue.700'}>
          Players submit tasks with: <code>!cwsubmit &lt;task_id&gt; &lt;proof_url&gt;</code>
        </Text>
        <Text color={'blue.600'} mt={1}>
          The bot matches the player's Discord role to their team using the Role ID above.
        </Text>
      </Box>

      {/* Dev Tools — only shown outside production */}
      {IS_DEV && isAdmin && (
        <Accordion allowToggle>
          <AccordionItem border="1px solid" borderColor="orange.600" borderRadius="md">
            <AccordionButton _hover={{ bg: 'orange.50' }} borderRadius="md">
              <Box flex="1" textAlign="left">
                <Text fontWeight="semibold" color="orange.400">
                  🛠 Dev Tools
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
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
                          color="white"
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
                    Locks any team that has an official loadout set. Skips teams without one.
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
  );
}
