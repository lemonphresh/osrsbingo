import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Code,
  SimpleGrid,
  Accordion,
} from '@chakra-ui/react';
import { useTimezone } from '../../hooks/useTimezone';
import TimezoneToggle from '../../atoms/TimezoneToggle';
import {
  GET_CLAN_WARS_SUBMISSION_SUMMARIES,
  CREATE_CLAN_WARS_SUBMISSION,
  REVIEW_CLAN_WARS_SUBMISSION,
  CLAN_WARS_SUBMISSION_ADDED,
  CLAN_WARS_SUBMISSION_REVIEWED,
  MARK_TASK_COMPLETE,
  UNDO_SUBMISSION_APPROVAL,
  UNDO_TASK_COMPLETE,
  GET_CLAN_WARS_PRE_SCREENSHOTS,
  CLAN_WARS_PRESCREENSHOT_ADDED,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import AdminEventPanel from './AdminEventPanel';
import WarChestPanel from './WarChestPanel';
import TaskGroupItem from './TaskGroupItem';

const IS_DEV = process.env.NODE_ENV !== 'production';
const COMPLETED_PAGE_SIZE = 5;

export default function GatheringPhase({ event, isAdmin, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const { utc } = useTimezone();

  const [showAllCompleted, setShowAllCompleted] = useState(false);

  // openKeys tracks which taskId_teamId accordion items are expanded
  const [openKeys, setOpenKeys] = useState(new Set());
  const openKeysInitializedRef = useRef(false);

  // Incremented after mutations so open TaskGroupItems know to refetch their subs
  const [subsRefetchSignal, setSubsRefetchSignal] = useState(0);

  const { data: summariesData, refetch: refetchSummaries } = useQuery(
    GET_CLAN_WARS_SUBMISSION_SUMMARIES,
    { variables: { eventId: event.eventId }, fetchPolicy: 'cache-and-network' }
  );

  const triggerSubsRefetch = useCallback(() => {
    refetchSummaries();
    setSubsRefetchSignal((s) => s + 1);
  }, [refetchSummaries]);

  const [reviewSubmission] = useMutation(REVIEW_CLAN_WARS_SUBMISSION, {
    onCompleted: () => {
      triggerSubsRefetch();
      showToast('Submission reviewed', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [createSubmission] = useMutation(CREATE_CLAN_WARS_SUBMISSION, {
    onCompleted: () => {
      triggerSubsRefetch();
      showToast('Submission added!', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [markTaskComplete] = useMutation(MARK_TASK_COMPLETE, {
    onCompleted: () => {
      refetch();
      showToast('Task marked complete!', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [undoSubmissionApprovalMutation] = useMutation(UNDO_SUBMISSION_APPROVAL, {
    onCompleted: () => {
      triggerSubsRefetch();
      showToast('Approval undone', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [undoTaskCompleteMutation] = useMutation(UNDO_TASK_COMPLETE, {
    onCompleted: () => {
      refetch();
      triggerSubsRefetch();
      showToast('Task completion undone', 'success');
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  useSubscription(CLAN_WARS_SUBMISSION_ADDED, {
    variables: { eventId: event.eventId },
    onData: () => {
      triggerSubsRefetch();
      showToast('New submission!', 'info');
    },
  });
  useSubscription(CLAN_WARS_SUBMISSION_REVIEWED, {
    variables: { eventId: event.eventId },
    onData: () => triggerSubsRefetch(),
  });

  const { data: prescreensData, refetch: refetchPrescreens } = useQuery(
    GET_CLAN_WARS_PRE_SCREENSHOTS,
    {
      variables: { eventId: event.eventId },
      fetchPolicy: 'cache-and-network',
      skip: !isAdmin,
    }
  );
  useSubscription(CLAN_WARS_PRESCREENSHOT_ADDED, {
    variables: { eventId: event.eventId },
    skip: !isAdmin,
    onData: () => {
      refetchPrescreens();
      showToast('New prescreenshot submitted!', 'info');
    },
  });

  const preScreenshots = prescreensData?.getClanWarsPreScreenshots ?? [];
  const summaries = summariesData?.getClanWarsSubmissionSummaries ?? [];
  const tasks = event.tasks ?? [];

  // Build sorted visible groups from summaries
  const relevantSummaries = summaries
    .filter((s) => s.pendingCount > 0 || s.approvedCount > 0)
    .sort((a, b) => {
      const teamA = event.teams?.find((t) => t.teamId === a.teamId);
      const teamB = event.teams?.find((t) => t.teamId === b.teamId);
      const completedA = teamA?.completedTaskIds?.includes(a.taskId) ?? false;
      const completedB = teamB?.completedTaskIds?.includes(b.taskId) ?? false;
      if (completedA !== completedB) return completedA ? 1 : -1;
      return b.pendingCount - a.pendingCount;
    });

  const activeSummaries = relevantSummaries.filter((s) => {
    const team = event.teams?.find((t) => t.teamId === s.teamId);
    return !(team?.completedTaskIds?.includes(s.taskId) ?? false);
  });
  const completedSummaries = relevantSummaries.filter((s) => {
    const team = event.teams?.find((t) => t.teamId === s.teamId);
    return team?.completedTaskIds?.includes(s.taskId) ?? false;
  });
  const visibleCompleted = showAllCompleted
    ? completedSummaries
    : completedSummaries.slice(0, COMPLETED_PAGE_SIZE);
  const visibleSummaries = [...activeSummaries, ...visibleCompleted];

  // Initialize open state: active groups open, completed closed
  useEffect(() => {
    if (!openKeysInitializedRef.current && summaries.length > 0) {
      openKeysInitializedRef.current = true;
      setOpenKeys(new Set(activeSummaries.map((s) => `${s.taskId}_${s.teamId}`)));
    }
  }, [summaries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const openIndices = visibleSummaries
    .map((s, i) => (openKeys.has(`${s.taskId}_${s.teamId}`) ? i : -1))
    .filter((i) => i !== -1);

  const pendingCount = summaries.reduce((acc, s) => acc + s.pendingCount, 0);

  const gatheringEnded = event.gatheringEnd ? new Date(event.gatheringEnd) <= new Date() : false;

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

  return (
    <VStack align="stretch" spacing={4} w="100%" minW={0}>
      {/* ── Admin controls ── */}
      {isAdmin && pendingCount > 0 && (
        <HStack justify="flex-end">
          <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
            {pendingCount} pending
          </Badge>
        </HStack>
      )}

      <HStack spacing={3} align="center">
        <Divider borderColor="gray.600" />
        <Text fontSize="xs" color="gray.500" whiteSpace="nowrap" fontStyle="italic">
          ↓ admin / ref eyes only ↓
        </Text>
        <Divider borderColor="gray.600" />
      </HStack>

      <Tabs
        colorScheme="purple"
        variant="enclosed"
        w="100%"
        minW={0}
        defaultIndex={isAdmin && gatheringEnded ? 2 : 0}
      >
        <TabList borderColor="gray.600">
          <Tab
            fontSize="sm"
            color="gray.400"
            _selected={{
              color: 'white',
              bg: 'gray.700',
              borderColor: 'gray.600',
              borderBottomColor: 'gray.700',
            }}
          >
            Submissions
          </Tab>
          <Tab
            fontSize="sm"
            color="gray.400"
            _selected={{
              color: 'white',
              bg: 'gray.700',
              borderColor: 'gray.600',
              borderBottomColor: 'gray.700',
            }}
          >
            War Chests
          </Tab>
          {isAdmin && (
            <Tab
              fontSize="sm"
              color="gray.400"
              _selected={{
                color: 'white',
                bg: 'gray.700',
                borderColor: 'gray.600',
                borderBottomColor: 'gray.700',
              }}
            >
              Admin
            </Tab>
          )}
        </TabList>

        <TabPanels w="100%" minW={0} overflowX="hidden">
          {/* ─── Submissions tab ─── */}
          <TabPanel px={0} w="100%">
            <HStack mb={3} justify="flex-end" spacing={3}>
              <TimezoneToggle />
              {IS_DEV && (
                <Button
                  size="xs"
                  colorScheme="orange"
                  variant="outline"
                  onClick={handleDevRandomSubmit}
                >
                  🎲 Random Submission (TESTING ONLY)
                </Button>
              )}
            </HStack>

            {visibleSummaries.length === 0 ? (
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
              </Box>
            ) : (
              <>
                <Accordion
                  allowMultiple
                  index={openIndices}
                  onChange={(newIndices) => {
                    setOpenKeys(
                      new Set(
                        newIndices
                          .map((i) => {
                            const s = visibleSummaries[i];
                            return s ? `${s.taskId}_${s.teamId}` : null;
                          })
                          .filter(Boolean)
                      )
                    );
                  }}
                >
                  {visibleSummaries.map((summary) => {
                    const key = `${summary.taskId}_${summary.teamId}`;
                    return (
                      <TaskGroupItem
                        key={key}
                        eventId={event.eventId}
                        taskId={summary.taskId}
                        teamId={summary.teamId}
                        task={tasks.find((t) => t.taskId === summary.taskId)}
                        team={event.teams?.find((t) => t.teamId === summary.teamId)}
                        summary={summary}
                        isAdmin={isAdmin}
                        isOpen={openKeys.has(key)}
                        prescreens={preScreenshots}
                        guildId={event.guildId}
                        handleReview={handleReview}
                        onUndoApproval={(submissionId) =>
                          undoSubmissionApprovalMutation({ variables: { submissionId } })
                        }
                        onUndoTaskComplete={({ teamId, taskId }) =>
                          undoTaskCompleteMutation({
                            variables: { eventId: event.eventId, teamId, taskId },
                          })
                        }
                        onMarkTaskComplete={({ teamId, taskId }) =>
                          markTaskComplete({
                            variables: { eventId: event.eventId, teamId, taskId },
                          })
                        }
                        subsRefetchSignal={subsRefetchSignal}
                        onEventRefetch={refetch}
                        utc={utc}
                        tasks={tasks}
                      />
                    );
                  })}
                </Accordion>

                {!showAllCompleted && completedSummaries.length > COMPLETED_PAGE_SIZE && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setShowAllCompleted(true)}
                    w="100%"
                    mt={1}
                  >
                    Show {completedSummaries.length - COMPLETED_PAGE_SIZE} more completed tasks
                  </Button>
                )}
                {showAllCompleted && completedSummaries.length > COMPLETED_PAGE_SIZE && (
                  <Button
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setShowAllCompleted(false)}
                    w="100%"
                    mt={1}
                  >
                    Show fewer
                  </Button>
                )}
              </>
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
    </VStack>
  );
}
