import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Button,
  Badge,
  Alert,
  AlertIcon,
  Icon,
  SimpleGrid,
  Divider,
  Tooltip,
  Code,
  ButtonGroup,
  Progress,
} from '@chakra-ui/react';
import { LockIcon, ArrowBackIcon, CheckCircleIcon, CopyIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import {
  GET_CLAN_WARS_EVENT,
  SAVE_OFFICIAL_LOADOUT,
  LOCK_CLAN_WARS_LOADOUT,
  GET_CLAN_WARS_WAR_CHEST,
  JOIN_TASK_IN_PROGRESS,
  LEAVE_TASK_IN_PROGRESS,
  UPDATE_CLAN_WARS_TEAM_MEMBERS,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import { TeamOutfitter } from '../organisms/ChampionForge/OutfittingScreen';
import WarChestPanel from '../organisms/ChampionForge/WarChestPanel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DIFF_COLOR = { initiate: 'green', adept: 'yellow', master: 'red' };
const DIFF_ORDER = ['initiate', 'adept', 'master'];

// ---------------------------------------------------------------------------
// Access gate
// ---------------------------------------------------------------------------
function BarracksAccessOverlay({ reason, teamName, eventId, userDiscordId }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(26, 32, 44, 0.85)"
      backdropFilter="blur(20px)"
      zIndex={9999}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p={4}
    >
      <VStack
        spacing={6}
        maxW="480px"
        bg="gray.700"
        p={8}
        borderRadius="xl"
        boxShadow="2xl"
        border="2px solid"
        borderColor="red.500"
      >
        <Box p={4} bg="red.500" borderRadius="full">
          <Icon as={LockIcon} boxSize={8} color="white" />
        </Box>

        <Heading size="lg" color="white" textAlign="center">
          Barracks Access Restricted
        </Heading>

        {reason === 'no_discord' && (
          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            borderRadius="md"
            bg="yellow.900"
          >
            <AlertIcon boxSize="36px" mr={0} color="yellow.400" />
            <Text fontWeight="bold" mt={3} mb={1} color="yellow.200">
              Discord Account Required
            </Text>
            <Text fontSize="sm" color="yellow.300">
              Link your Discord account in your profile to access your team's barracks.
            </Text>
          </Alert>
        )}

        {reason === 'not_member' && (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            textAlign="center"
            borderRadius="md"
            bg="red.900"
          >
            <AlertIcon boxSize="36px" mr={0} color="red.400" />
            <Text fontWeight="bold" mt={3} mb={1} color="red.200">
              Not a Team Member
            </Text>
            <Text fontSize="sm" color="red.300">
              You are not on <strong>{teamName}</strong>. Only team members and event admins can
              enter this barracks.
            </Text>
            {userDiscordId && (
              <Text fontSize="xs" mt={2} color="gray.400">
                Your Discord ID: <code>{userDiscordId}</code>
              </Text>
            )}
          </Alert>
        )}

        <VStack spacing={3} w="full">
          {reason === 'no_discord' && (
            <Button
              colorScheme="purple"
              size="lg"
              w="full"
              leftIcon={<Icon as={FaDiscord} />}
              onClick={() => navigate('/user/me')}
            >
              Link Discord Account
            </Button>
          )}
          <Button
            variant="outline"
            size="lg"
            w="full"
            leftIcon={<ArrowBackIcon />}
            color="white"
            borderColor="gray.500"
            onClick={() => navigate(`/champion-forge/${eventId}`)}
          >
            Back to Event Overview
          </Button>
        </VStack>

        <Text fontSize="xs" color="gray.500" textAlign="center">
          If you think this is an error, contact the event admin.
        </Text>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Task row — in-progress tracking + Discord submit command
// ---------------------------------------------------------------------------
function TaskRow({
  task,
  isCompleted,
  taskProgress,
  numericTaskProgress,
  teamMembers,
  currentUserDiscordId,
  userMemberRole,
  onJoin,
  onLeave,
}) {
  const { showToast } = useToastContext();

  const inProgressIds = taskProgress?.[task.taskId] ?? [];
  const isMeInProgress = !!currentUserDiscordId && inProgressIds.includes(currentUserDiscordId);
  const othersInProgress = inProgressIds.filter((id) => id !== currentUserDiscordId);

  const roleUnset = !userMemberRole || userMemberRole === 'UNSET';
  const canJoin =
    !isCompleted &&
    !isMeInProgress &&
    !roleUnset &&
    (task.role === 'ANY' ||
      userMemberRole === 'ANY' ||
      userMemberRole === 'FLEX' ||
      userMemberRole === task.role);

  const getMemberName = (discordId) => {
    const m = (teamMembers ?? []).find((tm) => tm.discordId === discordId);
    return m?.username ?? discordId;
  };

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(`!cfsubmit ${task.taskId}`);
    showToast('Command copied! Attach your screenshot in Discord.', 'success');
  };

  return (
    <Box
      p={3}
      bg={isCompleted ? 'green.900' : isMeInProgress ? 'teal.900' : 'gray.700'}
      borderRadius="md"
      border="1px solid"
      borderColor={isCompleted ? 'green.700' : isMeInProgress ? 'teal.600' : 'gray.600'}
      opacity={isCompleted ? 0.75 : 1}
    >
      <HStack justify="space-between" mb={isMeInProgress || inProgressIds.length > 0 ? 2 : 0}>
        <HStack spacing={3} flex={1} minW={0}>
          {isCompleted && <Icon as={CheckCircleIcon} color="green.400" flexShrink={0} />}
          <VStack align="flex-start" spacing={0} minW={0}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={isCompleted ? 'green.200' : 'white'}
              noOfLines={2}
            >
              {task.label}
            </Text>
            {task.description && (
              <Text fontSize="xs" color="gray.400" noOfLines={1}>
                {task.description}
              </Text>
            )}
          </VStack>
        </HStack>
        <HStack spacing={2} flexShrink={0}>
          <Badge colorScheme={DIFF_COLOR[task.difficulty]} fontSize="xs">
            {task.difficulty}
          </Badge>
          {isCompleted && (
            <Badge colorScheme="green" fontSize="xs">
              done
            </Badge>
          )}
          {isMeInProgress && (
            <Badge colorScheme="teal" fontSize="xs">
              in progress
            </Badge>
          )}
          {!isCompleted && !isMeInProgress && canJoin && (
            <Button
              size="xs"
              colorScheme={othersInProgress.length > 0 ? 'blue' : 'teal'}
              onClick={onJoin}
            >
              {othersInProgress.length > 0 ? 'Join them' : 'Work on this'}
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Who's working on it */}
      {inProgressIds.length > 0 && (
        <HStack spacing={1} flexWrap="wrap" mt={1} mb={isMeInProgress ? 2 : 0}>
          <Text fontSize="xs" color="gray.400">
            Working on it:
          </Text>
          {inProgressIds.map((id) => (
            <Badge
              key={id}
              colorScheme={id === currentUserDiscordId ? 'teal' : 'gray'}
              fontSize="xs"
            >
              {getMemberName(id)}
            </Badge>
          ))}
        </HStack>
      )}

      {/* My in-progress controls: copy command + leave */}
      {isMeInProgress && (
        <Box mt={1} p={2} bg="teal.900" borderRadius="md">
          <Text fontSize="xs" color="teal.300" mb={1}>
            When done in-game, submit via Discord:
          </Text>
          <HStack spacing={2}>
            <Code
              fontSize="xs"
              bg="gray.800"
              color="teal.200"
              px={2}
              py={1}
              borderRadius="md"
              flex={1}
            >
              !cfsubmit {task.taskId}
            </Code>
            <Button
              size="xs"
              colorScheme="teal"
              leftIcon={<CopyIcon />}
              onClick={handleCopyCommand}
            >
              Copy
            </Button>
            <Button size="xs" colorScheme="red" variant="ghost" onClick={onLeave}>
              Leave
            </Button>
          </HStack>
          <Text fontSize="xs" color="teal.400" mt={1}>
            Attach your screenshot in Discord when you run the command.
          </Text>
        </Box>
      )}

      {/* Numeric progress bar — only shown when task has a quantity */}
      {task.quantity > 0 && (() => {
        const progress = numericTaskProgress?.[task.taskId] ?? 0;
        const pct = isCompleted ? 100 : Math.min(100, Math.round((progress / task.quantity) * 100));
        return (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.400" mb={1}>
              {isCompleted ? task.quantity.toLocaleString() : progress.toLocaleString()} /{' '}
              {task.quantity.toLocaleString()} ({pct}%)
            </Text>
            <Progress
              value={pct}
              size="xs"
              colorScheme={isCompleted ? 'green' : 'blue'}
              borderRadius="full"
              bg="gray.700"
            />
          </Box>
        );
      })()}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Task list grouped by role + difficulty
// ---------------------------------------------------------------------------
function TaskSection({
  title,
  subtitle,
  colorScheme,
  tasks,
  completedTaskIds,
  taskProgress,
  numericTaskProgress,
  teamMembers,
  currentUserDiscordId,
  userMemberRole,
  onJoin,
  onLeave,
}) {
  const byDiff = DIFF_ORDER.reduce((acc, d) => {
    acc[d] = tasks.filter((t) => t.difficulty === d);
    return acc;
  }, {});

  const total = tasks.length;
  const done = tasks.filter((t) => completedTaskIds.includes(t.taskId)).length;

  return (
    <Box>
      <HStack mb={subtitle ? 1 : 3} justify="space-between">
        <HStack spacing={2}>
          <Badge colorScheme={colorScheme} fontSize="sm" px={2} py={1}>
            {title}
          </Badge>
          <Text fontSize="xs" color="gray.400">
            {done}/{total} completed
          </Text>
        </HStack>
      </HStack>
      {subtitle && (
        <Text fontSize="xs" color="gray.500" mb={3}>
          {subtitle}
        </Text>
      )}

      <VStack align="stretch" spacing={2}>
        {DIFF_ORDER.map((diff) => {
          const diffTasks = byDiff[diff];
          if (!diffTasks.length) return null;
          return (
            <Box key={diff}>
              <Text
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                {diff}
              </Text>
              <VStack align="stretch" spacing={1}>
                {diffTasks.map((task) => (
                  <TaskRow
                    key={task.taskId}
                    task={task}
                    isCompleted={completedTaskIds.includes(task.taskId)}
                    taskProgress={taskProgress}
                    numericTaskProgress={numericTaskProgress}
                    teamMembers={teamMembers}
                    currentUserDiscordId={currentUserDiscordId}
                    userMemberRole={userMemberRole}
                    onJoin={() => onJoin(task.taskId)}
                    onLeave={() => onLeave(task.taskId)}
                  />
                ))}
              </VStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Role selector — lets the current member update their own role
// ---------------------------------------------------------------------------
function MyRoleSelector({ team, myDiscordId, currentRole, refetch }) {
  const { showToast } = useToastContext();
  const [updateMembers, { loading }] = useMutation(UPDATE_CLAN_WARS_TEAM_MEMBERS, {
    onCompleted: () => {
      showToast('Role updated', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update role', 'error'),
  });

  const setRole = (role) => {
    if (role === currentRole) return;
    const updated = (team.members ?? []).map((m) =>
      m.discordId === myDiscordId
        ? { discordId: m.discordId, username: m.username, avatar: m.avatar ?? null, role }
        : { discordId: m.discordId, username: m.username, avatar: m.avatar ?? null, role: m.role }
    );
    updateMembers({ variables: { teamId: team.teamId, members: updated } });
  };

  const isUnset = !currentRole || currentRole === 'UNSET';

  const ROLE_TOOLTIPS = {
    PVMER: 'Complete boss & combat tasks. Admin assigns the reward slot (weapon, helm, chest, legs, gloves, boots, or trinket) based on your actual drop.',
    SKILLER: 'Complete XP & minigame tasks. Rewards are auto-assigned — consumables, rings, amulets, capes, or shields.',
    FLEX: 'Work on any task. Reward type depends on the task you complete.',
  };

  return (
    <HStack spacing={2} flexWrap="wrap" align="center">
      <Text fontSize="xs" color={isUnset ? 'yellow.300' : 'gray.400'} fontWeight="semibold">
        {isUnset ? '⚠️ Set your role to join tasks:' : 'My role:'}
      </Text>
      <ButtonGroup size="xs" isAttached isDisabled={loading}>
        {[
          ['PVMER', 'orange'],
          ['SKILLER', 'teal'],
          ['FLEX', 'purple'],
        ].map(([role, scheme]) => (
          <Tooltip key={role} label={ROLE_TOOLTIPS[role]} hasArrow placement="top">
            <Button
              colorScheme={scheme}
              variant={currentRole === role ? 'solid' : 'outline'}
              onClick={() => setRole(role)}
            >
              {role === 'PVMER' ? 'PvMer' : role === 'SKILLER' ? 'Skiller' : 'Flex'}
            </Button>
          </Tooltip>
        ))}
      </ButtonGroup>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Live countdown hook
// ---------------------------------------------------------------------------
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
// GATHERING phase
// ---------------------------------------------------------------------------
function GatheringPhaseBarracks({ event, team, isAdmin, user, refetch }) {
  const { showToast } = useToastContext();

  const [joinTask] = useMutation(JOIN_TASK_IN_PROGRESS, {
    onCompleted: refetch,
    onError: (err) => showToast(err.message ?? 'Failed to join task', 'error'),
  });
  const [leaveTask] = useMutation(LEAVE_TASK_IN_PROGRESS, {
    onCompleted: refetch,
    onError: (err) => showToast(err.message ?? 'Failed to leave task', 'error'),
  });

  const tasks = event.tasks ?? [];
  const completedTaskIds = team.completedTaskIds ?? [];
  const taskProgress = team.taskProgress ?? {};
  const numericTaskProgress = team.numericTaskProgress ?? {};
  const currentUserDiscordId = user?.discordUserId ?? null;

  // Find the current user's role within this team
  const memberRecord = (team.members ?? []).find(
    (m) => typeof m !== 'string' && m.discordId === currentUserDiscordId
  );
  const userMemberRole = memberRecord?.role ?? 'ANY';

  const pvmerTasks = tasks.filter((t) => t.role === 'PVMER');
  const skillerTasks = tasks.filter((t) => t.role === 'SKILLER');

  const gatheringCountdown = useCountdown(event.gatheringEnd);

  const handleJoin = (taskId) => {
    joinTask({ variables: { eventId: event.eventId, teamId: team.teamId, taskId } });
  };

  const handleLeave = (taskId) => {
    leaveTask({ variables: { eventId: event.eventId, teamId: team.teamId, taskId } });
  };

  const sharedTaskProps = {
    completedTaskIds,
    taskProgress,
    numericTaskProgress,
    teamMembers: team.members,
    currentUserDiscordId,
    userMemberRole,
    onJoin: handleJoin,
    onLeave: handleLeave,
  };

  return (
    <VStack align="stretch" spacing={6}>
      {/* Phase banner */}
      <Box p={4} bg="green.900" borderRadius="lg" border="1px solid" borderColor="green.700">
        <HStack justify="space-between" flexWrap="wrap" gap={2} mb={memberRecord ? 3 : 0}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="green.200">
              ⚒️ Gathering Phase
            </Text>
            <Text fontSize="sm" color="green.300">
              Complete tasks to earn items for your war chest. Mark tasks in progress to coordinate
              with your team, then submit via Discord with your screenshot.
            </Text>
          </VStack>
          {gatheringCountdown && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {gatheringCountdown}
            </Badge>
          )}
        </HStack>
        {memberRecord && (
          <MyRoleSelector
            team={team}
            myDiscordId={currentUserDiscordId}
            currentRole={userMemberRole}
            refetch={refetch}
          />
        )}
      </Box>

      {/* Two-column layout: tasks + war chest */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Task list — takes 2/3 */}
        <Box gridColumn={{ lg: 'span 2' }}>
          <VStack align="stretch" spacing={6}>
            {pvmerTasks.length > 0 && (
              <TaskSection
                title="PvM Tasks"
                subtitle="Drops: weapon, helm, chest, legs, gloves, boots, or trinket — admin picks your slot"
                colorScheme="orange"
                tasks={pvmerTasks}
                {...sharedTaskProps}
              />
            )}
            {pvmerTasks.length > 0 && skillerTasks.length > 0 && <Divider borderColor="gray.600" />}
            {skillerTasks.length > 0 && (
              <TaskSection
                title="Skilling Tasks"
                subtitle="Drops: consumable, ring, amulet, cape, or shield — auto-assigned"
                colorScheme="teal"
                tasks={skillerTasks}
                {...sharedTaskProps}
              />
            )}
            {tasks.length === 0 && (
              <Center h="200px">
                <Text color="gray.500">No tasks assigned to this event yet.</Text>
              </Center>
            )}
          </VStack>
        </Box>

        {/* War chest sidebar */}
        <VStack align="stretch" spacing={4}>
          <Text fontSize="sm" fontWeight="semibold" color="gray.300">
            Your War Chest
          </Text>
          <WarChestPanel team={team} hidden={false} />
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Items earned here are used during the Outfitting phase to build your champion.
          </Text>
        </VStack>
      </SimpleGrid>
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// OUTFITTING phase
// ---------------------------------------------------------------------------
function OutfittingPhaseBarracks({ event, team, isAdmin }) {
  const outfittingCountdown = useCountdown(event.outfittingEnd);
  return (
    <VStack align="stretch" spacing={6}>
      <Box p={4} bg="blue.900" borderRadius="lg" border="1px solid" borderColor="blue.700">
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="blue.200">
              🛡️ Outfitting Phase
            </Text>
            <Text fontSize="sm" color="blue.300">
              Kit out your champion using war chest items. The captain saves and locks the final
              loadout.
            </Text>
          </VStack>
          {outfittingCountdown && (
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {outfittingCountdown}
            </Badge>
          )}
        </HStack>
      </Box>

      {team.loadoutLocked && (
        <Alert status="success" borderRadius="md" bg="green.900">
          <AlertIcon color="green.400" />
          <Text color="green.200">
            Loadout locked! <strong>{team.teamName}</strong> is ready for battle. 🔒
          </Text>
        </Alert>
      )}

      <TeamOutfitter team={team} event={event} isAdmin={isAdmin} />
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// BATTLE / COMPLETED phases
// ---------------------------------------------------------------------------
function BattlePhaseBarracks({ event, team }) {
  const navigate = useNavigate();
  return (
    <Center h="40vh" flexDir="column" gap={4}>
      <Text fontSize="4xl">⚔️</Text>
      <Text fontSize="xl" fontWeight="bold" color="red.300">
        Battle is underway!
      </Text>
      <Text color="gray.400" textAlign="center">
        Your team's champion is in battle. Head to the event overview to watch.
      </Text>
      <Button colorScheme="red" onClick={() => navigate(`/champion-forge/${event.eventId}`)}>
        Watch the Battle
      </Button>
    </Center>
  );
}

// ---------------------------------------------------------------------------
// Phase-aware content dispatcher
// ---------------------------------------------------------------------------
function PhaseContent({ event, team, isAdmin, user, refetch }) {
  const phase = event.status;

  if (phase === 'DRAFT') {
    return (
      <Center h="40vh" flexDir="column" gap={3}>
        <Text fontSize="3xl">🏰</Text>
        <Text color="gray.500">The event hasn't started yet. Check back when it's live.</Text>
      </Center>
    );
  }

  if (phase === 'GATHERING') {
    return (
      <GatheringPhaseBarracks
        event={event}
        team={team}
        isAdmin={isAdmin}
        user={user}
        refetch={refetch}
      />
    );
  }

  if (phase === 'OUTFITTING') {
    return <OutfittingPhaseBarracks event={event} team={team} isAdmin={isAdmin} />;
  }

  if (phase === 'BATTLE') {
    return <BattlePhaseBarracks event={event} team={team} />;
  }

  if (phase === 'COMPLETED' || phase === 'ARCHIVED') {
    return (
      <Center h="40vh" flexDir="column" gap={3}>
        <Text fontSize="3xl">🏆</Text>
        <Text color="gray.400">This event has concluded. Well fought!</Text>
      </Center>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ChampionForgeBarracksPage() {
  const { eventId, teamId } = useParams();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  const event = data?.getClanWarsEvent;
  const team = event?.teams?.find((t) => t.teamId === teamId);

  usePageTitle(team ? `${team.teamName} Barracks — Champion Forge` : 'Champion Forge');

  const isAdmin =
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id);

  const checkAccess = () => {
    if (isAdmin) return { hasAccess: true, reason: 'authorized' };
    if (!user?.discordUserId) return { hasAccess: false, reason: 'no_discord' };

    const members = team?.members ?? [];
    const isMember = members.some((m) =>
      typeof m === 'string'
        ? m === user.discordUserId
        : (m?.discordId ?? m?.discordUserId) === user.discordUserId
    );

    return isMember
      ? { hasAccess: true, reason: 'authorized' }
      : { hasAccess: false, reason: 'not_member' };
  };

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

  if (!team) {
    return (
      <Center flex="1">
        <Text color="red.400">Team not found.</Text>
      </Center>
    );
  }

  const { hasAccess, reason } = checkAccess();

  return (
    <Box maxW="1200px" mx="auto" px={4} py={8} position="relative" flex="1">
      {!hasAccess && (
        <BarracksAccessOverlay
          reason={reason}
          teamName={team.teamName}
          eventId={eventId}
          userDiscordId={user?.discordUserId}
        />
      )}

      {/* Page header */}
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <VStack align="flex-start" spacing={1}>
          <HStack>
            <Text fontSize="2xl" fontWeight="bold" color="teal.300">
              {team.teamName}
            </Text>
            <Badge colorScheme="teal" fontSize="sm">
              Barracks
            </Badge>
            {team.loadoutLocked && (
              <Badge colorScheme="green" fontSize="sm">
                🔒 Locked
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {event.eventName} · {event.status}
          </Text>
        </VStack>
        <HStack spacing={2}>
          {isAdmin && (
            <Badge colorScheme="teal" variant="outline" fontSize="xs" px={2} py={1}>
              Admin
            </Badge>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ArrowBackIcon />}
            color="gray.300"
            borderColor="gray.600"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
        </HStack>
      </HStack>

      <PhaseContent event={event} team={team} isAdmin={isAdmin} user={user} refetch={refetch} />
    </Box>
  );
}
