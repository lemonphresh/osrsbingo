import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Center, Spinner, Text, VStack, HStack, Heading, Button,
  Badge, Alert, AlertIcon, Icon, SimpleGrid, Input, Modal,
  ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter,
  ModalCloseButton, Divider, Textarea, Tooltip,
} from '@chakra-ui/react';
import { LockIcon, ArrowBackIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import {
  GET_CLAN_WARS_EVENT,
  CREATE_CLAN_WARS_SUBMISSION,
  SAVE_OFFICIAL_LOADOUT,
  LOCK_CLAN_WARS_LOADOUT,
  GET_CLAN_WARS_WAR_CHEST,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import { TeamOutfitter } from '../organisms/ChampionForge/OutfittingScreen';
import WarChestPanel from '../organisms/ChampionForge/WarChestPanel';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DIFF_COLOR = { easy: 'green', medium: 'yellow', hard: 'red' };
const DIFF_ORDER = ['easy', 'medium', 'hard'];

// ---------------------------------------------------------------------------
// Access gate
// ---------------------------------------------------------------------------
function BarracksAccessOverlay({ reason, teamName, eventId, userDiscordId }) {
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <Box
      position="fixed"
      top={0} left={0} right={0} bottom={0}
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
          <Alert status="warning" variant="subtle" flexDirection="column" alignItems="center"
            textAlign="center" borderRadius="md" bg="yellow.900">
            <AlertIcon boxSize="36px" mr={0} color="yellow.400" />
            <Text fontWeight="bold" mt={3} mb={1} color="yellow.200">Discord Account Required</Text>
            <Text fontSize="sm" color="yellow.300">
              Link your Discord account in your profile to access your team's barracks.
            </Text>
          </Alert>
        )}

        {reason === 'not_member' && (
          <Alert status="error" variant="subtle" flexDirection="column" alignItems="center"
            textAlign="center" borderRadius="md" bg="red.900">
            <AlertIcon boxSize="36px" mr={0} color="red.400" />
            <Text fontWeight="bold" mt={3} mb={1} color="red.200">Not a Team Member</Text>
            <Text fontSize="sm" color="red.300">
              You are not on <strong>{teamName}</strong>. Only team members and event admins
              can enter this barracks.
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
            <Button colorScheme="purple" size="lg" w="full"
              leftIcon={<Icon as={FaDiscord} />}
              onClick={() => navigate('/user/me')}>
              Link Discord Account
            </Button>
          )}
          <Button variant="outline" size="lg" w="full" leftIcon={<ArrowBackIcon />}
            color="white" borderColor="gray.500"
            onClick={() => navigate(`/champion-forge/${eventId}`)}>
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
// Submit Proof Modal
// ---------------------------------------------------------------------------
function SubmitProofModal({ isOpen, task, team, event, onClose, user }) {
  const { showToast } = useToastContext();
  const [proofUrl, setProofUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const [createSubmission] = useMutation(CREATE_CLAN_WARS_SUBMISSION, {
    onError: (err) => showToast(err.message, 'error'),
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createSubmission({
        variables: {
          input: {
            eventId: event.eventId,
            teamId: team.teamId,
            submittedBy: user?.discordUserId ?? String(user?.id),
            submittedUsername: user?.discordUsername ?? user?.username ?? null,
            taskId: task.taskId,
            difficulty: task.difficulty,
            role: task.role,
            proofUrl: proofUrl.trim() || null,
          },
        },
      });
      showToast('Proof submitted! Awaiting admin review.', 'success');
      setProofUrl('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent bg="gray.800" color="white">
        <ModalHeader pb={2} color="white">Submit Proof</ModalHeader>
        <ModalCloseButton color="gray.400" />
        <ModalBody>
          {task && (
            <VStack align="stretch" spacing={4}>
              <Box bg="gray.700" p={3} borderRadius="md">
                <HStack mb={1} spacing={2}>
                  <Badge colorScheme={DIFF_COLOR[task.difficulty]} fontSize="xs">{task.difficulty}</Badge>
                  <Badge colorScheme={task.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">{task.role}</Badge>
                </HStack>
                <Text fontWeight="medium" color="white">{task.label}</Text>
                {task.description && (
                  <Text fontSize="sm" color="gray.400" mt={1}>{task.description}</Text>
                )}
              </Box>

              <Box>
                <Text fontSize="sm" color="gray.300" mb={2}>
                  Proof URL <Text as="span" color="gray.500">(screenshot, video clip, etc.)</Text>
                </Text>
                <Input
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://imgur.com/... or Discord attachment URL"
                  bg="gray.700"
                  border="1px solid"
                  borderColor="gray.600"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                />
              </Box>

              <Text fontSize="xs" color="gray.500">
                An admin will review your submission. If approved, your team will receive a reward item.
              </Text>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" color="gray.400" mr={3} onClick={onClose}>Cancel</Button>
          <Button colorScheme="purple" isLoading={loading} onClick={handleSubmit}>
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Task row in gathering phase
// ---------------------------------------------------------------------------
function TaskRow({ task, isCompleted, onSubmit }) {
  return (
    <HStack
      justify="space-between"
      p={3}
      bg={isCompleted ? 'green.900' : 'gray.700'}
      borderRadius="md"
      border="1px solid"
      borderColor={isCompleted ? 'green.700' : 'gray.600'}
      opacity={isCompleted ? 0.8 : 1}
    >
      <HStack spacing={3} flex={1} minW={0}>
        {isCompleted && <Icon as={CheckCircleIcon} color="green.400" flexShrink={0} />}
        <VStack align="flex-start" spacing={0} minW={0}>
          <Text fontSize="sm" fontWeight="medium" color={isCompleted ? 'green.200' : 'white'} noOfLines={1}>
            {task.label}
          </Text>
          {task.description && (
            <Text fontSize="xs" color="gray.400" noOfLines={1}>{task.description}</Text>
          )}
        </VStack>
      </HStack>
      <HStack spacing={2} flexShrink={0}>
        <Badge colorScheme={DIFF_COLOR[task.difficulty]} fontSize="xs">{task.difficulty}</Badge>
        {isCompleted ? (
          <Badge colorScheme="green" fontSize="xs">done</Badge>
        ) : (
          <Button size="xs" colorScheme="purple" onClick={() => onSubmit(task)}>
            Submit
          </Button>
        )}
      </HStack>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Task list grouped by role + difficulty
// ---------------------------------------------------------------------------
function TaskSection({ title, colorScheme, tasks, completedTaskIds, onSubmit }) {
  const byDiff = DIFF_ORDER.reduce((acc, d) => {
    acc[d] = tasks.filter((t) => t.difficulty === d);
    return acc;
  }, {});

  const total = tasks.length;
  const done = tasks.filter((t) => completedTaskIds.includes(t.taskId)).length;

  return (
    <Box>
      <HStack mb={3} justify="space-between">
        <HStack spacing={2}>
          <Badge colorScheme={colorScheme} fontSize="sm" px={2} py={1}>{title}</Badge>
          <Text fontSize="xs" color="gray.400">{done}/{total} completed</Text>
        </HStack>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {DIFF_ORDER.map((diff) => {
          const diffTasks = byDiff[diff];
          if (!diffTasks.length) return null;
          return (
            <Box key={diff}>
              <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={1}>
                {diff}
              </Text>
              <VStack align="stretch" spacing={1}>
                {diffTasks.map((task) => (
                  <TaskRow
                    key={task.taskId}
                    task={task}
                    isCompleted={completedTaskIds.includes(task.taskId)}
                    onSubmit={onSubmit}
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
// GATHERING phase
// ---------------------------------------------------------------------------
function GatheringPhaseBarracks({ event, team, isAdmin, user }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const tasks = event.tasks ?? [];
  const completedTaskIds = team.completedTaskIds ?? [];

  const pvmerTasks = tasks.filter((t) => t.role === 'PVMER');
  const skillerTasks = tasks.filter((t) => t.role === 'SKILLER');

  const gatheringEnd = event.gatheringEnd ? new Date(event.gatheringEnd) : null;
  const now = new Date();
  const hoursLeft = gatheringEnd ? Math.max(0, (gatheringEnd - now) / 1000 / 3600) : null;

  return (
    <VStack align="stretch" spacing={6}>
      {/* Phase banner */}
      <Box p={4} bg="green.900" borderRadius="lg" border="1px solid" borderColor="green.700">
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="green.200">⚒️ Gathering Phase</Text>
            <Text fontSize="sm" color="green.300">
              Complete tasks to earn items for your war chest.
            </Text>
          </VStack>
          {hoursLeft !== null && (
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {hoursLeft < 1 ? '< 1h remaining' : `~${hoursLeft.toFixed(0)}h left`}
            </Badge>
          )}
        </HStack>
      </Box>

      {/* Two-column layout: tasks + war chest */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {/* Task list — takes 2/3 */}
        <Box gridColumn={{ lg: 'span 2' }}>
          <VStack align="stretch" spacing={6}>
            {pvmerTasks.length > 0 && (
              <TaskSection
                title="PvM Tasks"
                colorScheme="orange"
                tasks={pvmerTasks}
                completedTaskIds={completedTaskIds}
                onSubmit={setSelectedTask}
              />
            )}
            {pvmerTasks.length > 0 && skillerTasks.length > 0 && (
              <Divider borderColor="gray.600" />
            )}
            {skillerTasks.length > 0 && (
              <TaskSection
                title="Skilling Tasks"
                colorScheme="teal"
                tasks={skillerTasks}
                completedTaskIds={completedTaskIds}
                onSubmit={setSelectedTask}
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
          <Text fontSize="sm" fontWeight="semibold" color="gray.300">Your War Chest</Text>
          <WarChestPanel team={team} hidden={false} />
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Items earned here are used during the Outfitting phase to build your champion.
          </Text>
        </VStack>
      </SimpleGrid>

      {/* Submit proof modal */}
      <SubmitProofModal
        isOpen={!!selectedTask}
        task={selectedTask}
        team={team}
        event={event}
        onClose={() => setSelectedTask(null)}
        user={user}
      />
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// OUTFITTING phase
// ---------------------------------------------------------------------------
function OutfittingPhaseBarracks({ event, team, isAdmin }) {
  return (
    <VStack align="stretch" spacing={6}>
      <Box p={4} bg="blue.900" borderRadius="lg" border="1px solid" borderColor="blue.700">
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontWeight="bold" color="blue.200">🛡️ Outfitting Phase</Text>
            <Text fontSize="sm" color="blue.300">
              Kit out your champion using war chest items. The captain saves and locks the final loadout.
            </Text>
          </VStack>
          {event.outfittingEnd && (
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              Ends {new Date(event.outfittingEnd).toLocaleString()}
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
      <Text fontSize="xl" fontWeight="bold" color="red.300">Battle is underway!</Text>
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
function PhaseContent({ event, team, isAdmin, user }) {
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
    return <GatheringPhaseBarracks event={event} team={team} isAdmin={isAdmin} user={user} />;
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

  const { data, loading, error } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  const event = data?.getClanWarsEvent;
  const team = event?.teams?.find((t) => t.teamId === teamId);

  usePageTitle(team ? `${team.teamName} Barracks — Champion Forge` : 'Champion Forge');

  const isAdmin = user?.admin ||
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

  if (!team) {
    return (
      <Center h="60vh">
        <Text color="red.400">Team not found.</Text>
      </Center>
    );
  }

  const { hasAccess, reason } = checkAccess();

  return (
    <Box maxW="1200px" mx="auto" px={4} py={8} position="relative">
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
            <Text fontSize="2xl" fontWeight="bold" color="purple.300">
              {team.teamName}
            </Text>
            <Badge colorScheme="purple" fontSize="sm">Barracks</Badge>
            {team.loadoutLocked && <Badge colorScheme="green" fontSize="sm">🔒 Locked</Badge>}
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {event.eventName} · {event.status}
          </Text>
        </VStack>
        <HStack spacing={2}>
          {isAdmin && (
            <Badge colorScheme="purple" variant="outline" fontSize="xs" px={2} py={1}>Admin</Badge>
          )}
          <Button size="sm" variant="outline" leftIcon={<ArrowBackIcon />} color="gray.300"
            borderColor="gray.600"
            onClick={() => window.history.back()}>
            Back
          </Button>
        </HStack>
      </HStack>

      <PhaseContent event={event} team={team} isAdmin={isAdmin} user={user} />
    </Box>
  );
}
