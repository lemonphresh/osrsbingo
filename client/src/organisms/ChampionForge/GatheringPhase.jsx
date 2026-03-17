import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Link,
  Select,
  SimpleGrid,
  Input,
  Code,
  Divider,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  NumberInput,
  NumberInputField,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import {
  GET_CLAN_WARS_SUBMISSIONS,
  REVIEW_CLAN_WARS_SUBMISSION,
  CHANGE_SUBMISSION_REWARD_SLOT,
  CREATE_CLAN_WARS_SUBMISSION,
  CLAN_WARS_SUBMISSION_ADDED,
  CLAN_WARS_SUBMISSION_REVIEWED,
  UPDATE_CLAN_WARS_EVENT_STATUS,
  SET_TASK_PROGRESS,
  MARK_TASK_COMPLETE,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import AdminEventPanel from './AdminEventPanel';
import WarChestPanel from './WarChestPanel';
import ConfirmModal from './ConfirmModal';

const IS_DEV = process.env.NODE_ENV !== 'production';
const PVMER_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'misc'];
const PVMER_SLOT_LABELS = {
  weapon: 'Weapon',
  helm: 'Helm',
  chest: 'Chest',
  legs: 'Legs',
  misc: 'Misc — randomly rolls gloves, boots, or trinket',
};
const DIFFICULTY_COLOR = { initiate: 'green', adept: 'yellow', master: 'red' };

// ---------------------------------------------------------------------------
// SubmissionCard
// hideTaskInfo=true when rendered inside a task group (header already has task info)
// ---------------------------------------------------------------------------
function SubmissionCard({
  submission,
  isAdmin,
  onReview,
  onSlotChanged,
  tasks,
  hideTaskInfo = false,
}) {
  const { showToast } = useToastContext();
  const [rewardSlot, setRewardSlot] = useState('weapon');
  const [denialReason, setDenialReason] = useState('');
  const [denyExpanded, setDenyExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState(false);
  const [editSlotValue, setEditSlotValue] = useState(submission.rewardSlot ?? 'weapon');
  const [slotSaving, setSlotSaving] = useState(false);
  const [savedSlot, setSavedSlot] = useState(null); // optimistic local override

  const [changeRewardSlotMutation] = useMutation(CHANGE_SUBMISSION_REWARD_SLOT, {
    onError: (err) => showToast(err.message, 'error'),
  });

  const isPending = submission.status === 'PENDING';
  const taskMeta = tasks?.find((t) => t.taskId === submission.taskId);

  const handleSaveSlot = async () => {
    setSlotSaving(true);
    try {
      await changeRewardSlotMutation({
        variables: { submissionId: submission.submissionId, rewardSlot: editSlotValue },
      });
      showToast('Reward slot updated', 'success');
      setSavedSlot(editSlotValue);
      setEditingSlot(false);
      onSlotChanged?.();
    } finally {
      setSlotSaving(false);
    }
  };

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

  const statusColor =
    submission.status === 'APPROVED' ? 'green' : submission.status === 'DENIED' ? 'red' : 'yellow';

  return (
    <Box
      bg="gray.700"
      border="1px solid"
      borderColor={
        submission.status === 'APPROVED'
          ? 'green.700'
          : submission.status === 'DENIED'
          ? 'red.900'
          : 'gray.600'
      }
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" mb={hideTaskInfo ? 1 : 2}>
        <VStack align="flex-start" spacing={0}>
          <HStack flexWrap="wrap" gap={1}>
            <Badge colorScheme={statusColor} mb={1} fontSize="xs">
              {submission.status}
            </Badge>
            {!hideTaskInfo && (
              <>
                <Badge colorScheme={submission.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">
                  {submission.role}
                </Badge>
                <Badge
                  colorScheme={DIFFICULTY_COLOR[submission.difficulty] ?? 'gray'}
                  fontSize="xs"
                >
                  {submission.difficulty}
                </Badge>
              </>
            )}
          </HStack>
          {!hideTaskInfo && (
            <>
              <Text fontWeight="medium" fontSize="sm" mt={1} color="white">
                {submission.taskLabel ?? submission.taskId}
              </Text>
              {taskMeta?.description && (
                <Text fontSize="xs" color="gray.400" mt={0.5}>
                  {taskMeta.description}
                </Text>
              )}
            </>
          )}
          <Text fontSize="xs" color="gray.500" mt={hideTaskInfo ? 0 : 1}>
            {submission.submittedUsername ?? submission.submittedBy} ·{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}
          </Text>
        </VStack>

        {submission.screenshot && (
          <Link href={submission.screenshot} isExternal flexShrink={0}>
            <Button size="xs" colorScheme="blue" variant="outline">
              View Screenshot
            </Button>
          </Link>
        )}
      </HStack>

      {submission.status === 'APPROVED' && (
        <Box mt={2} p={2} bg="gray.800" borderRadius="md">
          {submission.rewardItem ? (
            <HStack flexWrap="wrap" gap={1}>
              <Text fontSize="xs" color="gray.400">
                To Be Rewarded:
              </Text>
              <Badge
                colorScheme={
                  submission.rewardItem.rarity === 'epic'
                    ? 'purple'
                    : submission.rewardItem.rarity === 'rare'
                    ? 'blue'
                    : submission.rewardItem.rarity === 'uncommon'
                    ? 'green'
                    : 'gray'
                }
              >
                {submission.rewardItem.rarity}
              </Badge>
              <Text fontSize="xs" fontWeight="medium" color="white">
                {submission.rewardItem.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({savedSlot ?? submission.rewardItem.slot})
              </Text>
            </HStack>
          ) : savedSlot ?? submission.rewardSlot ? (
            <Text fontSize="xs" color="gray.400">
              Reward slot:{' '}
              <Text as="span" color="white">
                {savedSlot ?? submission.rewardSlot}
              </Text>
            </Text>
          ) : null}

          {isAdmin && submission.role === 'PVMER' && (
            <Box mt={2}>
              {editingSlot ? (
                <HStack spacing={2}>
                  <Select
                    size="xs"
                    value={editSlotValue}
                    onChange={(e) => setEditSlotValue(e.target.value)}
                    w="auto"
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                  >
                    {PVMER_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {PVMER_SLOT_LABELS[s] ?? s}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    isLoading={slotSaving}
                    onClick={handleSaveSlot}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setEditingSlot(false)}
                  >
                    Cancel
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  onClick={() => {
                    setEditSlotValue(submission.rewardSlot ?? 'weapon');
                    setEditingSlot(true);
                  }}
                >
                  ✏️ Change reward slot
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      {submission.status === 'DENIED' && submission.reviewNote && (
        <Box mt={2} p={2} bg="red.900" borderRadius="sm">
          <Text fontSize="xs" color="red.200">
            <Text as="span" fontWeight="semibold">
              Denial reason:
            </Text>{' '}
            {submission.reviewNote}
          </Text>
        </Box>
      )}

      {isAdmin && isPending && (
        <VStack
          align="stretch"
          spacing={2}
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor="gray.600"
        >
          {submission.role === 'PVMER' && (
            <>
              <Text fontSize="sm" color="gray.300">
                Based on the player's actual drop, assign the reward slot.
              </Text>
              <HStack>
                <Text fontSize="xs" color="gray.400">
                  Reward Slot:
                </Text>
                <Select
                  size="xs"
                  value={rewardSlot}
                  onChange={(e) => setRewardSlot(e.target.value)}
                  w="auto"
                  bg="gray.800"
                  borderColor="gray.600"
                  color="white"
                >
                  {PVMER_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </HStack>
            </>
          )}
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme="green"
              isLoading={loading}
              onClick={() => handleReview(true)}
              flex={1}
            >
              ✓ Approve
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              isLoading={loading}
              onClick={() => setDenyExpanded(!denyExpanded)}
              flex={1}
            >
              ✗ Deny
            </Button>
          </HStack>
          {denyExpanded && (
            <VStack align="stretch" spacing={2}>
              <Input
                size="sm"
                placeholder="Denial reason (shown to player)"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
              <Button
                size="sm"
                colorScheme="red"
                isLoading={loading}
                onClick={() => handleReview(false)}
              >
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
// TaskProgressEditor — admin-only slider to set numeric progress toward a task
// ---------------------------------------------------------------------------
function TaskProgressEditor({
  eventId,
  teamId,
  taskId,
  quantity,
  currentProgress,
  isAdmin,
  onSaved,
}) {
  const { showToast } = useToastContext();
  const [value, setValue] = useState(currentProgress ?? 0);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setValue(currentProgress ?? 0);
  }, [currentProgress]);

  const [setTaskProgressMutation] = useMutation(SET_TASK_PROGRESS, {
    onError: (err) => showToast(err.message, 'error'),
  });

  const isDirty = value !== (currentProgress ?? 0);
  const pct = quantity > 0 ? Math.min(100, Math.round((value / quantity) * 100)) : 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await setTaskProgressMutation({ variables: { eventId, teamId, taskId, value } });
      onSaved?.();
      showToast('Progress saved', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={3} bg="whiteAlpha.50" borderRadius="md" border="1px solid" borderColor="gray.600">
      <HStack justify="space-between" mb={2}>
        <Text fontSize="xs" fontWeight="semibold" color="white">
          📊 Progress
        </Text>
        <Text fontSize="xs" color="gray.400">
          {quantity > 0
            ? `${value.toLocaleString()} / ${quantity.toLocaleString()} (${pct}%)`
            : value.toLocaleString()}
        </Text>
      </HStack>

      {isAdmin && (
        <VStack spacing={2} align="stretch" mt={quantity > 0 ? 0 : 0}>
          {quantity > 0 && (
            <Slider
              min={0}
              max={quantity}
              step={1}
              value={value}
              onChange={(v) => setValue(v)}
              focusThumbOnChange={false}
            >
              <SliderTrack bg="gray.700">
                <SliderFilledTrack bg="green.400" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          )}
          <HStack>
            <NumberInput
              min={0}
              max={quantity > 0 ? quantity : undefined}
              value={value}
              onChange={(_, v) => {
                if (!isNaN(v))
                  setValue(quantity > 0 ? Math.max(0, Math.min(v, quantity)) : Math.max(0, v));
              }}
              size="sm"
              flex={1}
            >
              <NumberInputField bg="gray.800" color="white" borderColor="gray.600" />
            </NumberInput>
            <Button
              size="sm"
              colorScheme="blue"
              isLoading={saving}
              isDisabled={!isDirty}
              onClick={handleSave}
            >
              Save
            </Button>
          </HStack>
        </VStack>
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
  const [outfittingConfirmOpen, setOutfittingConfirmOpen] = useState(false);
  const [confirmingKey, setConfirmingKey] = useState(null);

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_CLAN_WARS_SUBMISSIONS, {
    variables: { eventId: event.eventId },
    fetchPolicy: 'cache-and-network',
  });

  const [reviewSubmission] = useMutation(REVIEW_CLAN_WARS_SUBMISSION, {
    onCompleted: () => {
      refetchSubs();
      showToast('Submission reviewed', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [createSubmission] = useMutation(CREATE_CLAN_WARS_SUBMISSION, {
    onCompleted: () => {
      refetchSubs();
      showToast('Submission added!', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  const [markTaskComplete] = useMutation(MARK_TASK_COMPLETE, {
    onCompleted: () => {
      refetch();
      showToast('Task marked complete!', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  useSubscription(CLAN_WARS_SUBMISSION_ADDED, {
    variables: { eventId: event.eventId },
    onData: () => {
      refetchSubs();
      showToast('New submission!', 'info');
    },
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

  const handleDevRandomSubmit = async () => {
    const allTasks = event.tasks ?? [];
    const allTeams = event.teams ?? [];
    if (!allTasks.length || !allTeams.length) return;
    const task = allTasks[Math.floor(Math.random() * allTasks.length)];
    const team = allTeams[Math.floor(Math.random() * allTeams.length)];
    await createSubmission({
      variables: {
        input: {
          eventId: event.eventId,
          teamId: team.teamId,
          taskId: task.taskId,
          difficulty: task.difficulty,
          role: task.role,
          submittedBy: String(user?.discordUserId ?? user?.id ?? 'dev'),
          submittedUsername: user?.username ?? 'dev',
          screenshot: 'https://i.imgur.com/placeholder.png',
        },
      },
    });
  };

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  const gatheringEnd = event.gatheringEnd ? new Date(event.gatheringEnd) : null;
  const now = new Date();
  const hoursLeft = gatheringEnd ? Math.max(0, (gatheringEnd - now) / 1000 / 3600) : null;

  // Group submissions by taskId_teamId (mirrors GR's nodeId_teamId grouping).
  // A group is relevant if it has any PENDING or APPROVED submission.
  const groupedByTaskTeam = {};
  submissions.forEach((s) => {
    const key = `${s.taskId}_${s.teamId}`;
    if (!groupedByTaskTeam[key]) groupedByTaskTeam[key] = [];
    groupedByTaskTeam[key].push(s);
  });

  const relevantGroups = Object.entries(groupedByTaskTeam)
    .filter(([, subs]) => subs.some((s) => s.status === 'PENDING' || s.status === 'APPROVED'))
    .sort(([, subsA], [, subsB]) => {
      const teamA = event.teams?.find((t) => t.teamId === subsA[0].teamId);
      const teamB = event.teams?.find((t) => t.teamId === subsB[0].teamId);
      const completedA = teamA?.completedTaskIds?.includes(subsA[0].taskId) ?? false;
      const completedB = teamB?.completedTaskIds?.includes(subsB[0].taskId) ?? false;
      if (completedA !== completedB) return completedA ? 1 : -1;
      const latestA = Math.max(...subsA.map((s) => new Date(s.submittedAt || 0).getTime()));
      const latestB = Math.max(...subsB.map((s) => new Date(s.submittedAt || 0).getTime()));
      return latestB - latestA;
    });

  return (
    <VStack align="stretch" spacing={6} w="100%" minW={0}>
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
                {hoursLeft < 1
                  ? 'Less than 1 hour remaining'
                  : `~${hoursLeft.toFixed(0)}h remaining`}
              </Text>
            )}
          </VStack>
          <VStack align="flex-end" spacing={1}>
            <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
              {pendingCount} pending
            </Badge>
            {isAdmin && (
              <Button size="sm" colorScheme="blue" onClick={() => setOutfittingConfirmOpen(true)}>
                → Start Outfitting
              </Button>
            )}
          </VStack>
        </HStack>
      </Box>

      <Tabs colorScheme="purple" variant="soft-rounded" w="100%" minW={0}>
        <TabList>
          <Tab fontSize="sm">Submissions</Tab>
          <Tab fontSize="sm">War Chests</Tab>
          {isAdmin && <Tab fontSize="sm">Admin</Tab>}
        </TabList>

        <TabPanels w="100%" minW={0} overflowX="hidden">
          {/* ─── Submissions tab ─── */}
          <TabPanel px={0} w="100%">
            {IS_DEV && (
              <HStack mb={3} justify="flex-end">
                <Button
                  size="xs"
                  colorScheme="orange"
                  variant="outline"
                  onClick={handleDevRandomSubmit}
                >
                  🎲 Random Submission
                </Button>
              </HStack>
            )}

            {relevantGroups.length === 0 ? (
              <Box
                p={6}
                bg="gray.800"
                borderRadius="md"
                border="1px dashed"
                borderColor="gray.600"
                textAlign="center"
              >
                <Text fontSize="sm" fontWeight="semibold" color="gray.300" mb={2}>
                  No pending submissions
                </Text>
                <Text fontSize="xs" color="gray.500" mb={3}>
                  Players submit via Discord by attaching a screenshot and typing:
                </Text>
                <Code fontSize="xs" px={3} py={1} borderRadius="md" bg="gray.700" color="gray.300">
                  !cfsubmit &lt;taskId&gt;
                </Code>
                {IS_DEV && (
                  <Text fontSize="xs" color="gray.500" mt={3}>
                    Use{' '}
                    <Text as="span" color="orange.400" fontWeight="semibold">
                      🎲 Random Submission
                    </Text>{' '}
                    above to add a test submission.
                  </Text>
                )}
              </Box>
            ) : (
              <Accordion allowMultiple defaultIndex={relevantGroups.map((_, i) => i)}>
                {relevantGroups.map(([key, groupSubs]) => {
                  const taskId = groupSubs[0].taskId;
                  const teamId = groupSubs[0].teamId;
                  const task = tasks.find((t) => t.taskId === taskId);
                  const team = event.teams?.find((t) => t.teamId === teamId);
                  const isCompleted = team?.completedTaskIds?.includes(taskId) ?? false;
                  const approvedCount = groupSubs.filter((s) => s.status === 'APPROVED').length;
                  const pendingSubs = groupSubs.filter((s) => s.status === 'PENDING').length;
                  const quantity = task?.quantity ?? null;
                  const numericProgress = team?.numericTaskProgress?.[taskId] ?? 0;
                  const progressPct = isCompleted
                    ? 100
                    : quantity > 0
                    ? Math.min(100, Math.round((numericProgress / quantity) * 100))
                    : 0;
                  const progressScheme = isCompleted ? 'green' : quantity > 0 ? 'blue' : 'gray';

                  return (
                    <AccordionItem
                      key={key}
                      border="1px solid"
                      borderColor={isCompleted ? 'green.700' : 'gray.600'}
                      borderRadius="md"
                      mb={3}
                      overflow="hidden"
                      opacity={isCompleted ? 0.75 : 1}
                    >
                      <AccordionButton
                        px={4}
                        py={3}
                        bg={isCompleted ? 'green.900' : 'gray.800'}
                        _hover={{ bg: isCompleted ? 'green.800' : 'gray.750' }}
                        _expanded={{
                          borderBottom: '1px solid',
                          borderColor: isCompleted ? 'green.700' : 'gray.700',
                        }}
                        flexDirection="column"
                        alignItems="stretch"
                      >
                        <HStack justify="space-between" flexWrap="wrap" gap={2} w="100%">
                          {/* left: task info */}
                          <VStack align="flex-start" spacing={0.5} flex={1} minW={0}>
                            <HStack spacing={2} flexWrap="wrap">
                              {isCompleted && (
                                <Text color="green.300" fontSize="sm">
                                  ✅
                                </Text>
                              )}
                              <Text
                                fontWeight="semibold"
                                fontSize="sm"
                                color={isCompleted ? 'green.200' : 'white'}
                                textAlign="left"
                              >
                                {task?.label ?? taskId}
                              </Text>
                              <Badge colorScheme="purple" fontSize="xs">
                                {team?.teamName ?? teamId}
                              </Badge>
                            </HStack>
                            {task?.description && (
                              <Text fontSize="xs" color="gray.400" textAlign="left">
                                {task.description}
                              </Text>
                            )}
                            <HStack spacing={1} flexWrap="wrap">
                              <Badge
                                colorScheme={task?.role === 'PVMER' ? 'orange' : 'teal'}
                                fontSize="xs"
                              >
                                {task?.role}
                              </Badge>
                              <Badge
                                colorScheme={DIFFICULTY_COLOR[task?.difficulty] ?? 'gray'}
                                fontSize="xs"
                              >
                                {task?.difficulty}
                              </Badge>
                              <Badge
                                colorScheme={
                                  isCompleted ? 'green' : pendingSubs > 0 ? 'yellow' : 'red'
                                }
                                fontSize="xs"
                              >
                                {approvedCount > 0
                                  ? `✓ ${approvedCount} approved`
                                  : `${pendingSubs} pending`}
                              </Badge>
                            </HStack>
                          </VStack>

                          {/* right: complete button (admin only, not yet completed) */}
                          {isAdmin && !isCompleted && approvedCount > 0 && (
                            <VStack
                              spacing={1}
                              align="flex-end"
                              flexShrink={0}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {confirmingKey === key ? (
                                <HStack>
                                  <Text fontSize="xs" color="orange.300" fontWeight="semibold">
                                    Are you sure?
                                  </Text>
                                  <Button
                                    size="xs"
                                    colorScheme="green"
                                    leftIcon={<CheckIcon />}
                                    onClick={() => {
                                      setConfirmingKey(null);
                                      markTaskComplete({
                                        variables: { eventId: event.eventId, teamId, taskId },
                                      });
                                    }}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    size="xs"
                                    color="white"
                                    _hover={{ color: 'white', bg: 'gray.500' }}
                                    variant="outline"
                                    onClick={() => setConfirmingKey(null)}
                                  >
                                    Cancel
                                  </Button>
                                </HStack>
                              ) : (
                                <Button
                                  size="xs"
                                  colorScheme="green"
                                  leftIcon={<CheckIcon />}
                                  onClick={() => setConfirmingKey(key)}
                                >
                                  Complete Task
                                </Button>
                              )}
                            </VStack>
                          )}

                          <AccordionIcon color="gray.400" flexShrink={0} />
                        </HStack>

                        {/* progress bar — only shown when task has a quantity */}
                        {quantity > 0 && (
                          <Box mt={2}>
                            <Text fontSize="xs" color="gray.400" mb={1}>
                              {numericProgress.toLocaleString()} / {quantity.toLocaleString()} (
                              {progressPct}%)
                            </Text>
                            <Progress
                              value={progressPct}
                              colorScheme={progressScheme}
                              size="xs"
                              borderRadius="full"
                              bg="gray.700"
                            />
                          </Box>
                        )}
                      </AccordionButton>

                      <AccordionPanel px={4} py={3} bg="gray.900">
                        <VStack align="stretch" spacing={3}>
                          {/* allowed drops — PVMER tasks only */}
                          {task?.role === 'PVMER' && task?.acceptableItems?.length > 0 && (
                            <Box
                              p={3}
                              bg="orange.900"
                              borderRadius="md"
                              border="1px solid"
                              borderColor="orange.700"
                            >
                              <Text fontSize="xs" fontWeight="semibold" color="orange.300" mb={2}>
                                Allowed Drops
                              </Text>
                              <HStack flexWrap="wrap" gap={1}>
                                {task.acceptableItems.map((item) => (
                                  <Badge
                                    key={item}
                                    colorScheme="orange"
                                    fontSize="xs"
                                    variant="outline"
                                  >
                                    {item}
                                  </Badge>
                                ))}
                              </HStack>
                            </Box>
                          )}
                          {groupSubs.map((sub, idx) => (
                            <React.Fragment key={sub.submissionId}>
                              {idx > 0 && <Divider borderColor="gray.700" />}
                              <SubmissionCard
                                submission={sub}
                                isAdmin={isAdmin}
                                onReview={handleReview}
                                onSlotChanged={refetchSubs}
                                tasks={tasks}
                                hideTaskInfo
                              />
                            </React.Fragment>
                          ))}
                          {/* progress tracker — bar visible to all (when quantity set), editing admin-only */}
                          {!isCompleted && (isAdmin || quantity > 0) && (
                            <TaskProgressEditor
                              eventId={event.eventId}
                              teamId={teamId}
                              taskId={taskId}
                              quantity={quantity}
                              currentProgress={numericProgress}
                              isAdmin={isAdmin}
                              onSaved={refetch}
                            />
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabPanel>

          {/* ─── War Chests tab ─── */}
          <TabPanel px={0} w="100%">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {(event.teams ?? []).map((team) => (
                <WarChestPanel key={team.teamId} team={team} hidden={!isAdmin} />
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* ─── Admin tab ─── */}
          {isAdmin && (
            <TabPanel px={0} w="100%">
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
