import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAuth } from '../../providers/AuthProvider';
import ConfirmModal from './ConfirmModal';
import ClanWarsStaffManager from './ClanWarsStaffManager';
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
  Code,
  Link,
  Tooltip,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { FaCrown } from 'react-icons/fa';
import { useToastContext } from '../../providers/ToastProvider';
import {
  UPDATE_CLAN_WARS_EVENT_STATUS,
  UPDATE_CLAN_WARS_TEAM_MEMBERS,
  CREATE_CLAN_WARS_TEAM,
  DELETE_CLAN_WARS_TEAM,
  ADD_CLAN_WARS_TASK,
  DELETE_CLAN_WARS_TASK,
  SET_CLAN_WARS_CAPTAIN,
  GENERATE_CLAN_WARS_BRACKET,
} from '../../graphql/clanWarsOperations';

const DIFFICULTY_COLORS = { initiate: 'green', adept: 'yellow', master: 'red' };
const ROLE_COLORS = { PVMER: 'orange', SKILLER: 'teal', ANY: 'purple' };

// ---------------------------------------------------------------------------
// Team card (admin management view)
// ---------------------------------------------------------------------------
function TeamCard({ team, eventId, eventStatus, refetch }) {
  const { showToast } = useToastContext();
  const [deleteTeam] = useMutation(DELETE_CLAN_WARS_TEAM, { onCompleted: refetch });
  const [setCaptain] = useMutation(SET_CLAN_WARS_CAPTAIN, { onCompleted: refetch });
  const [updateMembers] = useMutation(UPDATE_CLAN_WARS_TEAM_MEMBERS, { onCompleted: refetch });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newDiscordId, setNewDiscordId] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  const canEditMembers = !['BATTLE', 'COMPLETED'].includes(eventStatus);

  const memberInputs = (members) =>
    members.map((m) => ({ discordId: m.discordId, username: m.username ?? null, avatar: m.avatar ?? null, role: m.role ?? null }));

  const handleRemoveMember = async (discordId) => {
    const updated = (team.members ?? []).filter((m) => m.discordId !== discordId);
    try {
      await updateMembers({ variables: { teamId: team.teamId, members: memberInputs(updated) } });
      showToast('Member removed', 'success');
    } catch {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleAddMember = async () => {
    const id = newDiscordId.trim();
    if (!id) return;
    if ((team.members ?? []).some((m) => m.discordId === id)) {
      showToast('Already a member', 'error');
      return;
    }
    setAddLoading(true);
    try {
      const updated = [...(team.members ?? []), { discordId: id, username: null, avatar: null, role: null }];
      await updateMembers({ variables: { teamId: team.teamId, members: memberInputs(updated) } });
      showToast('Member added', 'success');
      setNewDiscordId('');
    } catch {
      showToast('Failed to add member', 'error');
    } finally {
      setAddLoading(false);
    }
  };

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

  const handleSetCaptain = async (discordId) => {
    try {
      await setCaptain({ variables: { teamId: team.teamId, discordId } });
      showToast('Captain set', 'success');
    } catch {
      showToast('Failed to set captain', 'error');
    }
  };

  const captainMember = (team.members ?? []).find((m) => m.discordId === team.captainDiscordId);

  return (
    <Box
      bg="gray.700"
      borderRadius="md"
      p={4}
      border="1px solid"
      borderColor="gray.600"
      display="flex"
      flexDirection="column"
    >
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
        {captainMember
          ? ` · Captain: ${captainMember.rsn || captainMember.username || captainMember.discordId}`
          : team.captainDiscordId
          ? ` · Captain: ${team.captainDiscordId}`
          : ' · No captain set'}
      </Text>

      <VStack align="stretch" spacing={0}>
        {(team.members ?? []).length === 0 ? (
          <Text fontSize="xs" color="gray.500" py={1}>
            No members yet.
          </Text>
        ) : (
          (team.members ?? []).map((m) => {
            const isCaptain = m.discordId === team.captainDiscordId;
            return (
              <HStack
                key={m.discordId}
                spacing={2}
                py={1}
                borderBottom="1px solid"
                borderColor="gray.600"
              >
                <Badge colorScheme={ROLE_COLORS[m.role] ?? 'gray'} fontSize="xs" flexShrink={0}>
                  {m.role ?? 'ANY'}
                </Badge>
                {isCaptain && <Icon as={FaCrown} color="yellow.400" boxSize={3} flexShrink={0} />}
                <Text
                  fontSize="xs"
                  color={isCaptain ? 'yellow.300' : 'gray.300'}
                  flex={1}
                  noOfLines={1}
                >
                  {m.rsn || m.username || m.discordId}
                </Text>
                {!isCaptain && (
                  <Tooltip label="Set as captain" placement="top" hasArrow openDelay={200}>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="yellow"
                      onClick={() => handleSetCaptain(m.discordId)}
                      px={1}
                    >
                      <Icon as={FaCrown} boxSize={3} />
                    </Button>
                  </Tooltip>
                )}
                {canEditMembers && (
                  <Tooltip label="Remove member" placement="top" hasArrow openDelay={200}>
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleRemoveMember(m.discordId)}
                      px={1}
                    >
                      ×
                    </Button>
                  </Tooltip>
                )}
              </HStack>
            );
          })
        )}
      </VStack>

      {canEditMembers && (
        <HStack spacing={2} mt={3}>
          <Input
            size="xs"
            placeholder="Discord user ID"
            value={newDiscordId}
            onChange={(e) => setNewDiscordId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            bg="gray.800"
            borderColor="gray.600"
            color="white"
            _placeholder={{ color: 'gray.500' }}
          />
          <Button
            size="xs"
            colorScheme="green"
            isLoading={addLoading}
            onClick={handleAddMember}
            flexShrink={0}
          >
            Add
          </Button>
        </HStack>
      )}

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
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [updateStatus] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });
  const [bracketType, setBracketType] = useState('SINGLE_ELIMINATION');
  const [generateBracket] = useMutation(GENERATE_CLAN_WARS_BRACKET, { onCompleted: refetch });
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
      await generateBracket({ variables: { eventId: event.eventId, bracketType } });
      showToast('Bracket generated!', 'success');
    } catch {
      showToast('Failed to generate bracket', 'error');
    }
  };

  const nextStatus = NEXT_STATUS[event.status];

  const gatheringMsLeft = event.gatheringEnd ? new Date(event.gatheringEnd) - Date.now() : 0;
  function fmtDuration(ms) {
    const totalMinutes = Math.floor(ms / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
    return parts.join(' ');
  }
  const advanceConfirmBody =
    pendingNext === 'OUTFITTING' && gatheringMsLeft > 0
      ? `This will end the gathering phase early — ${fmtDuration(
          gatheringMsLeft
        )} still remaining. This action cannot be undone.`
      : 'This action cannot be undone.';

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
        <HStack spacing={3}>
          <Icon as={SettingsIcon} color="teal.300" />
          <Text fontWeight="semibold" color="teal.200" fontSize="sm">
            Admin Controls
          </Text>
        </HStack>

        {/* Phase advance */}
        <HStack spacing={2}>
          {event.status === 'OUTFITTING' && (
            <HStack spacing={1}>
              <Select
                size="sm"
                value={bracketType}
                onChange={(e) => setBracketType(e.target.value)}
                w="auto"
                bg="gray.700"
                borderColor="gray.600"
                color="gray.200"
                fontSize="xs"
              >
                <option value="SINGLE_ELIMINATION">Single Elim</option>
                <option value="DOUBLE_ELIMINATION">Double Elim</option>
              </Select>
              <Button
                size="sm"
                variant="outline"
                colorScheme="blue"
                onClick={handleGenerateBracket}
              >
                Generate Bracket
              </Button>
            </HStack>
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
              {event.status === 'DRAFT' && (
                <AddTeamForm eventId={event.eventId} refetch={refetch} />
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Staff manager — admins + refs */}
        <Accordion allowMultiple reduceMotion>
          <AccordionItem border="none">
            <AccordionButton px={5} py={3} _hover={{ bg: 'gray.750' }}>
              <Box flex="1" textAlign="left">
                <Text fontWeight="semibold" color="gray.200" fontSize="sm">
                  Staff - Admins & Ref Setup
                </Text>
              </Box>
              <AccordionIcon color="gray.400" />
            </AccordionButton>
            <AccordionPanel px={5} pb={4}>
              <ClanWarsStaffManager event={event} currentUserId={user?.id} refetch={refetch} />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Bot instructions */}
        <Box mx={5} my={4}>
          <Text fontWeight="semibold" color="blue.200" mb={3} fontSize="sm">
            ⚔️ Discord Bot Setup
          </Text>
          <VStack align="stretch" spacing={3}>
            {/* Steps */}
            {[
              {
                n: '1',
                heading: 'Add the bot to your server',
                body: (
                  <Text fontSize="xs" color="gray.300">
                    Use the{' '}
                    <Link
                      href={process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL}
                      isExternal
                      color="blue.300"
                    >
                      bot installation link
                    </Link>{' '}
                    to invite the Bingo Hub bot to your Discord server.
                  </Text>
                ),
              },
              {
                n: '2',
                heading: 'Add player Discord IDs to their team entries',
                body: (
                  <Text fontSize="xs" color="gray.300">
                    When creating or editing teams, paste each player's Discord user ID into their
                    member entry. The bot uses this to identify who is submitting, no roles or
                    channel setup needed.
                  </Text>
                ),
              },
              {
                n: '3',
                heading: 'Share these commands with your players',
                body: (
                  <VStack align="stretch" spacing={1}>
                    {[
                      ['!cfsubmit <task_id> [attach screenshot]', 'submit a completion'],
                      [
                        '!cfpresubmit <task_id> [attach screenshot]',
                        'record baseline XP or collection log stuff before grinding',
                      ],
                      ['!cf', 'show command help'],
                    ].map(([cmd, desc]) => (
                      <HStack key={cmd} spacing={2} align="baseline">
                        <Code
                          fontSize="xs"
                          bg="gray.800"
                          color="blue.200"
                          px={1.5}
                          py={0.5}
                          borderRadius="sm"
                          flexShrink={0}
                        >
                          {cmd}
                        </Code>
                        <Text fontSize="xs" color="gray.400">
                          {desc}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                ),
              },
            ].map(({ n, heading, body }) => (
              <HStack key={n} align="flex-start" spacing={3}>
                <Box
                  w="20px"
                  h="20px"
                  borderRadius="full"
                  bg="blue.700"
                  flexShrink={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mt="1px"
                >
                  <Text fontSize="xs" fontWeight="bold" color="blue.200">
                    {n}
                  </Text>
                </Box>
                <VStack align="flex-start" spacing={1} flex={1}>
                  <Text fontSize="xs" fontWeight="semibold" color="white">
                    {heading}
                  </Text>
                  {body}
                </VStack>
              </HStack>
            ))}

            {/* Hot tip */}
            <Box
              mt={1}
              px={3}
              py={2}
              bg="yellow.900"
              border="1px solid"
              borderColor="yellow.700"
              borderRadius="md"
            >
              <Text fontSize="xs" color="yellow.300">
                <Text as="span" fontWeight="bold">
                  💡 Hot tip:{' '}
                </Text>
                Set up a dedicated{' '}
                <Text as="span" color="yellow.200" fontWeight="semibold">
                  #team-name-bot
                </Text>{' '}
                channel for bot commands alongside each{' '}
                <Text as="span" color="yellow.200" fontWeight="semibold">
                  #team-name-chat
                </Text>{' '}
                channel so players can use the bot channel for bot commands and keep their yapping
                separate in the chat channel. It keeps things tidy and makes it easier for admins to
                cross check pending submissions.
              </Text>
            </Box>
          </VStack>
        </Box>
      </VStack>

      <ConfirmModal
        isOpen={advanceOpen}
        onClose={() => {
          setAdvanceOpen(false);
          setPendingNext(null);
        }}
        onConfirm={handleAdvance}
        title={pendingNext ? `${PHASE_LABELS[pendingNext]}?` : ''}
        body={advanceConfirmBody}
        confirmLabel={pendingNext ? PHASE_LABELS[pendingNext] : 'Confirm'}
        colorScheme="purple"
      />
    </Box>
  );
}
