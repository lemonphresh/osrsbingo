import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Button, Badge, Tabs, TabList, Tab, TabPanels, TabPanel,
  Link, Select, SimpleGrid, Spinner, Center, Input, Code, Divider,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import {
  GET_CLAN_WARS_SUBMISSIONS,
  REVIEW_CLAN_WARS_SUBMISSION,
  CLAN_WARS_SUBMISSION_ADDED, CLAN_WARS_SUBMISSION_REVIEWED,
  UPDATE_CLAN_WARS_EVENT_STATUS,
  JOIN_TASK_IN_PROGRESS,
  LEAVE_TASK_IN_PROGRESS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import AdminEventPanel from './AdminEventPanel';
import WarChestPanel from './WarChestPanel';
import ConfirmModal from './ConfirmModal';

const PVMER_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'gloves', 'boots'];
const DIFFICULTY_COLOR = { initiate: 'green', adept: 'yellow', master: 'red' };

// ---------------------------------------------------------------------------
// SubmissionCard
// ---------------------------------------------------------------------------
function SubmissionCard({ submission, isAdmin, onReview }) {
  const [rewardSlot, setRewardSlot] = useState('weapon');
  const [denialReason, setDenialReason] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPending = submission.status === 'PENDING';

  const handleReview = async (approved) => {
    setLoading(true);
    try {
      await onReview({
        submissionId: submission.submissionId,
        approved,
        rewardSlot: approved && submission.role === 'PVMER' ? rewardSlot : undefined,
        denialReason: !approved ? denialReason : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.700" border="1px solid" borderColor="gray.600" borderRadius="md" p={4}>
      <HStack justify="space-between" mb={2}>
        <VStack align="flex-start" spacing={0}>
          <HStack>
            <Badge colorScheme={submission.status === 'APPROVED' ? 'green' : submission.status === 'DENIED' ? 'red' : 'yellow'}>
              {submission.status}
            </Badge>
            <Badge colorScheme={submission.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">{submission.role}</Badge>
            <Badge colorScheme={DIFFICULTY_COLOR[submission.difficulty] ?? 'gray'} fontSize="xs">
              {submission.difficulty}
            </Badge>
          </HStack>
          <Text fontWeight="medium" fontSize="sm" mt={1} color="white">{submission.taskLabel ?? submission.taskId}</Text>
          <Text fontSize="xs" color="gray.400">
            {submission.submittedUsername ?? submission.submittedBy} ·{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}
          </Text>
        </VStack>

        {submission.screenshot && (
          <Link href={submission.screenshot} isExternal>
            <Button size="xs" colorScheme="blue" variant="outline">View Screenshot</Button>
          </Link>
        )}
      </HStack>

      {submission.status === 'APPROVED' && submission.rewardItem && (
        <HStack mt={2} p={2} bg="gray.800" borderRadius="md">
          <Text fontSize="xs" color="gray.400">Rewarded:</Text>
          <Badge colorScheme={
            submission.rewardItem.rarity === 'epic' ? 'purple' :
            submission.rewardItem.rarity === 'rare' ? 'blue' :
            submission.rewardItem.rarity === 'uncommon' ? 'green' : 'gray'
          }>{submission.rewardItem.rarity}</Badge>
          <Text fontSize="xs" fontWeight="medium" color="white">{submission.rewardItem.name}</Text>
          <Text fontSize="xs" color="gray.500">({submission.rewardItem.slot})</Text>
        </HStack>
      )}

      {submission.status === 'DENIED' && submission.reviewNote && (
        <Text fontSize="xs" color="red.400" mt={2}>Denied: {submission.reviewNote}</Text>
      )}

      {isAdmin && isPending && (
        <VStack align="stretch" spacing={2} mt={3} pt={3} borderTop="1px solid" borderColor="gray.600">
          {submission.role === 'PVMER' && (
            <HStack>
              <Text fontSize="xs" color="gray.400">Reward Slot:</Text>
              <Select size="xs" value={rewardSlot} onChange={(e) => setRewardSlot(e.target.value)} w="auto"
                bg="gray.800" borderColor="gray.600" color="white">
                {PVMER_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </HStack>
          )}
          <HStack spacing={2}>
            <Button size="sm" colorScheme="green" isLoading={loading} onClick={() => handleReview(true)} flex={1}>
              ✓ Approve
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" isLoading={loading} onClick={() => setExpanded(!expanded)} flex={1}>
              ✗ Deny
            </Button>
          </HStack>
          {expanded && (
            <VStack align="stretch" spacing={2}>
              <Input size="sm" placeholder="Denial reason (shown to player)" value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                bg="gray.800" borderColor="gray.600" color="white" _placeholder={{ color: 'gray.500' }} />
              <Button size="sm" colorScheme="red" isLoading={loading} onClick={() => handleReview(false)}>
                Confirm Denial
              </Button>
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// TaskCard — shows a single task with in-progress tracking & copy command
// ---------------------------------------------------------------------------
function TaskCard({ task, myTeam, myDiscordId, eventId, refetch }) {
  const { showToast } = useToastContext();
  const inProgressIds = myTeam?.taskProgress?.[task.taskId] ?? [];
  const isCompleted = myTeam?.completedTaskIds?.includes(task.taskId);
  const iAmInProgress = myDiscordId && inProgressIds.includes(myDiscordId);
  const hasOthers = inProgressIds.length > 0;

  const [join, { loading: joining }] = useMutation(JOIN_TASK_IN_PROGRESS, { onCompleted: refetch });
  const [leave, { loading: leaving }] = useMutation(LEAVE_TASK_IN_PROGRESS, { onCompleted: refetch });

  const memberName = (discordId) =>
    myTeam?.members?.find((m) => m.discordId === discordId)?.username ?? discordId;

  const handleCopy = () => {
    navigator.clipboard.writeText(`!cwsubmit ${task.taskId}`);
    showToast('Submit command copied!', 'success');
  };

  const borderColor = isCompleted ? 'green.700' : hasOthers ? 'yellow.700' : 'gray.600';

  return (
    <Box
      bg="gray.700"
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
      opacity={isCompleted ? 0.7 : 1}
    >
      <HStack justify="space-between" align="flex-start" mb={1}>
        <VStack align="flex-start" spacing={0} flex={1} mr={2}>
          <Text fontWeight="medium" fontSize="sm" color={isCompleted ? 'green.300' : 'white'}>
            {task.label}
          </Text>
          {task.description && (
            <Text fontSize="xs" color="gray.400">{task.description}</Text>
          )}
        </VStack>
        <HStack spacing={1} flexShrink={0}>
          <Badge colorScheme={task.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">{task.role}</Badge>
          <Badge colorScheme={DIFFICULTY_COLOR[task.difficulty] ?? 'gray'} fontSize="xs">{task.difficulty}</Badge>
          {isCompleted && <Badge colorScheme="green" fontSize="xs">✅ Done</Badge>}
        </HStack>
      </HStack>

      {hasOthers && !isCompleted && (
        <Text fontSize="xs" color="yellow.400" mb={2}>
          In progress: {inProgressIds.map(memberName).join(', ')}
        </Text>
      )}

      {!isCompleted && myTeam && (
        <HStack spacing={2} mt={2}>
          {iAmInProgress ? (
            <Button
              size="xs"
              colorScheme="red"
              variant="outline"
              isLoading={leaving}
              onClick={() => leave({ variables: { eventId, teamId: myTeam.teamId, taskId: task.taskId } })}
            >
              Leave
            </Button>
          ) : (
            <Button
              size="xs"
              colorScheme={hasOthers ? 'blue' : 'green'}
              variant="outline"
              isLoading={joining}
              onClick={() => join({ variables: { eventId, teamId: myTeam.teamId, taskId: task.taskId } })}
            >
              {hasOthers ? '+ Join' : 'Mark In Progress'}
            </Button>
          )}

          <HStack
            spacing={1}
            px={2}
            py={1}
            bg="gray.800"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.600"
            cursor="pointer"
            onClick={handleCopy}
            _hover={{ borderColor: 'gray.400' }}
            flexShrink={0}
          >
            <Code fontSize="xs" bg="transparent" color="gray.300">!cwsubmit {task.taskId}</Code>
            <CopyIcon boxSize={3} color="gray.400" />
          </HStack>
        </HStack>
      )}

      {isCompleted && (
        <HStack spacing={2} mt={2}>
          <HStack
            spacing={1}
            px={2}
            py={1}
            bg="gray.800"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.600"
            cursor="pointer"
            onClick={handleCopy}
            _hover={{ borderColor: 'gray.400' }}
          >
            <Code fontSize="xs" bg="transparent" color="gray.500">!cwsubmit {task.taskId}</Code>
            <CopyIcon boxSize={3} color="gray.500" />
          </HStack>
        </HStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// GatheringPhase
// ---------------------------------------------------------------------------
export default function GatheringPhase({ event, isAdmin, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [outfittingConfirmOpen, setOutfittingConfirmOpen] = useState(false);

  const myTeam = event.teams?.find(
    (t) =>
      t.captainDiscordId === user?.discordUserId ||
      t.members?.some((m) => m.discordId === user?.discordUserId)
  );
  const myDiscordId = user?.discordUserId ?? null;

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_CLAN_WARS_SUBMISSIONS, {
    variables: { eventId: event.eventId, status: statusFilter || undefined },
    fetchPolicy: 'cache-and-network',
  });

  const [reviewSubmission] = useMutation(REVIEW_CLAN_WARS_SUBMISSION, {
    onCompleted: () => { refetchSubs(); showToast('Submission reviewed', 'success'); },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  useSubscription(CLAN_WARS_SUBMISSION_ADDED, {
    variables: { eventId: event.eventId },
    onData: () => { refetchSubs(); showToast('New submission!', 'info'); },
  });
  useSubscription(CLAN_WARS_SUBMISSION_REVIEWED, {
    variables: { eventId: event.eventId },
    onData: () => refetchSubs(),
  });

  const submissions = subsData?.getClanWarsSubmissions ?? [];
  const tasks = event.tasks ?? [];

  const handleReview = async ({ submissionId, approved, rewardSlot, denialReason }) => {
    await reviewSubmission({
      variables: {
        submissionId,
        approved,
        reviewerId: String(user?.id ?? user?.discordUserId ?? 'admin'),
        rewardSlot: rewardSlot ?? null,
        denialReason: denialReason ?? null,
      },
    });
  };

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  const gatheringEnd = event.gatheringEnd ? new Date(event.gatheringEnd) : null;
  const now = new Date();
  const hoursLeft = gatheringEnd ? Math.max(0, (gatheringEnd - now) / 1000 / 3600) : null;

  // Group tasks by difficulty for display
  const tasksByDiff = {
    initiate: tasks.filter((t) => t.difficulty === 'initiate'),
    adept:    tasks.filter((t) => t.difficulty === 'adept'),
    master:   tasks.filter((t) => t.difficulty === 'master'),
  };

  return (
    <VStack align="stretch" spacing={6}>
      <Box p={5} bg="green.900" borderRadius="lg">
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="green.200">
              ⚔️ Gathering Phase — {event.eventName}
            </Text>
            <Text fontSize="sm" color="green.300">
              Mark tasks in-progress, then submit via Discord with a screenshot attached.
            </Text>
            {hoursLeft !== null && (
              <Text fontSize="xs" color="green.400">
                {hoursLeft < 1 ? 'Less than 1 hour remaining' : `~${hoursLeft.toFixed(0)}h remaining`}
              </Text>
            )}
          </VStack>
          <VStack align="flex-end" spacing={1}>
            <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>{pendingCount} pending</Badge>
            {isAdmin && (
              <Button size="sm" colorScheme="blue" onClick={() => setOutfittingConfirmOpen(true)}>
                → Start Outfitting
              </Button>
            )}
          </VStack>
        </HStack>
      </Box>

      <Tabs colorScheme="purple" variant="soft-rounded">
        <TabList>
          <Tab fontSize="sm">Tasks</Tab>
          <Tab fontSize="sm">Submissions</Tab>
          <Tab fontSize="sm">War Chests</Tab>
          {isAdmin && <Tab fontSize="sm">Admin</Tab>}
        </TabList>

        <TabPanels>
          {/* ─── Tasks tab ─── */}
          <TabPanel px={0}>
            {tasks.length === 0 ? (
              <Center h="200px">
                <Text color="gray.500">No tasks in the pool yet.</Text>
              </Center>
            ) : (
              <VStack align="stretch" spacing={5}>
                {['initiate', 'adept', 'master'].map((diff) => {
                  const group = tasksByDiff[diff];
                  if (!group.length) return null;
                  return (
                    <Box key={diff}>
                      <HStack mb={3} spacing={2}>
                        <Badge colorScheme={DIFFICULTY_COLOR[diff]} fontSize="sm" px={2} py={1}>
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </Badge>
                        <Divider borderColor="gray.600" />
                        <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                          {group.length} task{group.length !== 1 ? 's' : ''}
                        </Text>
                      </HStack>
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                        {group.map((task) => (
                          <TaskCard
                            key={task.taskId}
                            task={task}
                            myTeam={myTeam}
                            myDiscordId={myDiscordId}
                            eventId={event.eventId}
                            refetch={refetch}
                          />
                        ))}
                      </SimpleGrid>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </TabPanel>

          {/* ─── Submissions tab ─── */}
          <TabPanel px={0}>
            <HStack mb={4} spacing={2}>
              <Text fontSize="sm" color="gray.400">Filter:</Text>
              {['PENDING', 'APPROVED', 'DENIED', ''].map((s) => (
                <Button
                  key={s}
                  size="xs"
                  colorScheme={statusFilter === s ? 'purple' : 'gray'}
                  variant={statusFilter === s ? 'solid' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                >
                  {s || 'All'}
                </Button>
              ))}
            </HStack>

            {submissions.length === 0 ? (
              <Center h="200px">
                <Text color="gray.500">No submissions {statusFilter ? `(${statusFilter})` : ''} yet.</Text>
              </Center>
            ) : (
              <VStack align="stretch" spacing={3}>
                {submissions.map((sub) => (
                  <SubmissionCard
                    key={sub.submissionId}
                    submission={sub}
                    isAdmin={isAdmin}
                    onReview={handleReview}
                  />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* ─── War Chests tab ─── */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {(event.teams ?? []).map((team) => (
                <WarChestPanel key={team.teamId} team={team} hidden={true} />
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* ─── Admin tab ─── */}
          {isAdmin && (
            <TabPanel px={0}>
              <AdminEventPanel event={event} isAdmin={isAdmin} refetch={refetch} />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      <ConfirmModal
        isOpen={outfittingConfirmOpen}
        onClose={() => setOutfittingConfirmOpen(false)}
        onConfirm={() => {
          advancePhase({ variables: { eventId: event.eventId, status: 'OUTFITTING' } });
          setOutfittingConfirmOpen(false);
        }}
        title="Start Outfitting Phase?"
        body="This will end the gathering phase. This action cannot be undone."
        confirmLabel="Start Outfitting"
        colorScheme="blue"
      />
    </VStack>
  );
}
