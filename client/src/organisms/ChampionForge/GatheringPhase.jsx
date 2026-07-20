import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Switch,
  FormLabel,
  FormControl,
} from '@chakra-ui/react';
import { useTimezone } from '../../hooks/useTimezone';
import {
  playSubmissionIncoming,
  playSubmissionApproved,
  playSubmissionDenied,
  playTaskComplete,
  warmUpAudio,
} from '../../utils/soundEngine';
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

export default function GatheringPhase({
  event,
  isAdmin,
  refetch,
  showAdminTab: showAdminTabProp,
  isRefsPanel = false,
  onPendingCountChange,
}) {
  const showAdminTab = showAdminTabProp !== undefined ? showAdminTabProp : isAdmin;
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const { utc } = useTimezone();

  useEffect(() => {
    warmUpAudio();
  }, []);

  const [pendingNewSubs, setPendingNewSubs] = useState(0);
  const [stableGroupOrder, setStableGroupOrder] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioUnlockedRef = useRef(false);
  const soundEnabledRef = useRef(false);
  soundEnabledRef.current = soundEnabled;

  // openKeys tracks which taskId_teamId accordion items are expanded
  const [openKeys, setOpenKeys] = useState(new Set());
  const openKeysInitializedRef = useRef(false);
  const [completedOpenKeys, setCompletedOpenKeys] = useState(new Set());
  const [isCompletedOpen, setIsCompletedOpen] = useState(false);
  const [reviewedOpenKeys, setReviewedOpenKeys] = useState(new Set());
  const [isReviewedOpen, setIsReviewedOpen] = useState(false);

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
      playTaskComplete();
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
      if (isRefsPanel) {
        setPendingNewSubs((n) => n + 1);
        if (soundEnabledRef.current && audioUnlockedRef.current) playSubmissionIncoming();
        showToast('New submission!', 'info');
      } else {
        playSubmissionIncoming();
        triggerSubsRefetch();
        showToast('New submission!', 'info');
      }
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
  const summaries = useMemo(
    () => summariesData?.getClanWarsSubmissionSummaries ?? [],
    [summariesData]
  );
  const tasks = event.tasks ?? [];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const activeSummaries = useMemo(
    () =>
      summaries
        .filter((s) => {
          if (!(s.pendingCount > 0)) return false;
          const team = event.teams?.find((t) => t.teamId === s.teamId);
          return !(team?.completedTaskIds?.includes(s.taskId) ?? false);
        })
        .sort((a, b) => b.pendingCount - a.pendingCount),
    [summaries, event.teams]
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewedSummaries = useMemo(
    () =>
      summaries.filter((s) => {
        if (!(s.pendingCount === 0 && s.approvedCount > 0)) return false;
        const team = event.teams?.find((t) => t.teamId === s.teamId);
        return !(team?.completedTaskIds?.includes(s.taskId) ?? false);
      }),
    [summaries, event.teams] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completedSummaries = useMemo(
    () =>
      summaries.filter((s) => {
        if (!(s.pendingCount > 0 || s.approvedCount > 0)) return false;
        const team = event.teams?.find((t) => t.teamId === s.teamId);
        return !!(team?.completedTaskIds?.includes(s.taskId) ?? false);
      }),
    [summaries, event.teams]
  ); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleSummaries = useMemo(() => [...activeSummaries], [activeSummaries]);

  const sortedVisibleSummaries = useMemo(() => {
    if (!isRefsPanel || !stableGroupOrder) return visibleSummaries;
    const keyToSummary = Object.fromEntries(
      visibleSummaries.map((s) => [`${s.taskId}_${s.teamId}`, s])
    );
    const ordered = stableGroupOrder.map((k) => keyToSummary[k]).filter(Boolean);
    const brandNew = visibleSummaries.filter(
      (s) => !stableGroupOrder.includes(`${s.taskId}_${s.teamId}`)
    );
    return [...brandNew, ...ordered];
  }, [isRefsPanel, stableGroupOrder, visibleSummaries]);

  // Load sound pref on mount
  useEffect(() => {
    if (isRefsPanel && localStorage.getItem('cfRefs_sound_enabled') === 'true') {
      setSoundEnabled(true);
      audioUnlockedRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize open state: active groups open, completed closed
  useEffect(() => {
    if (!openKeysInitializedRef.current && summaries.length > 0) {
      openKeysInitializedRef.current = true;
      setOpenKeys(new Set(activeSummaries.map((s) => `${s.taskId}_${s.teamId}`)));
    }
  }, [summaries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable group order: snapshot on first load, re-snapshot after manual load
  useEffect(() => {
    if (!isRefsPanel) return;
    if (stableGroupOrder === null && visibleSummaries.length > 0) {
      setStableGroupOrder(visibleSummaries.map((s) => `${s.taskId}_${s.teamId}`));
    }
  }, [visibleSummaries, stableGroupOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch + reset stable order when tab regains focus
  useEffect(() => {
    if (!isRefsPanel) return;
    const handleRefresh = () => {
      setPendingNewSubs(0);
      setStableGroupOrder(null);
      triggerSubsRefetch();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') handleRefresh();
    };
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isRefsPanel, triggerSubsRefetch]);

  const openIndices = sortedVisibleSummaries
    .map((s, i) => (openKeys.has(`${s.taskId}_${s.teamId}`) ? i : -1))
    .filter((i) => i !== -1);

  const completedOpenIndices = completedSummaries
    .map((s, i) => (completedOpenKeys.has(`${s.taskId}_${s.teamId}`) ? i : -1))
    .filter((i) => i !== -1);

  const pendingCount = summaries.reduce((acc, s) => acc + s.pendingCount, 0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onPendingCountChange?.(pendingCount);
  }, [pendingCount, onPendingCountChange]);

  const gatheringEnded = event.gatheringEnd ? new Date(event.gatheringEnd) <= new Date() : false;

  const handleReview = async ({ submissionId, approved, rewardSlot, denialReason }) => {
    if (approved) playSubmissionApproved();
    else playSubmissionDenied();
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

  const handleLoadNewSubs = useCallback(() => {
    setPendingNewSubs(0);
    setStableGroupOrder(null);
    triggerSubsRefetch();
  }, [triggerSubsRefetch]);

  const handleEnableSound = useCallback(() => {
    audioUnlockedRef.current = true;
    setSoundEnabled(true);
    localStorage.setItem('cfRefs_sound_enabled', 'true');
    warmUpAudio();
    playSubmissionIncoming();
  }, []);

  const handleDisableSound = useCallback(() => {
    setSoundEnabled(false);
    localStorage.setItem('cfRefs_sound_enabled', 'false');
  }, []);

  return (
    <VStack align="stretch" spacing={4} w="100%" minW={0}>
      {/* ── Admin controls ── */}
      {isAdmin && pendingCount > 0 && (
        <HStack justify="center">
          <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
            {pendingCount} pending submissions
          </Badge>
        </HStack>
      )}

      <Tabs
        colorScheme="purple"
        variant="enclosed"
        w="100%"
        minW={0}
        defaultIndex={showAdminTab && gatheringEnded && !isRefsPanel ? 2 : 0}
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
          {showAdminTab && (
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
              {isRefsPanel && (
                <FormControl display="flex" alignItems="center" gap={2} w="auto">
                  <Switch
                    id="cf-sound"
                    colorScheme="green"
                    isChecked={soundEnabled}
                    onChange={soundEnabled ? handleDisableSound : handleEnableSound}
                    size="sm"
                  />
                  <FormLabel
                    htmlFor="cf-sound"
                    mb={0}
                    fontSize="sm"
                    color="gray.300"
                    cursor="pointer"
                  >
                    Sound
                  </FormLabel>
                </FormControl>
              )}
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

            {isAdmin && (
              <Box
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="lg"
                p={4}
                mb={2}
              >
                <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={3}>
                  How submissions work
                </Text>
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="xs" color="gray.400">
                    <Text as="span" color="white" fontWeight="semibold">
                      Submitting:{' '}
                    </Text>
                    Players submit via Discord with{' '}
                    <Code fontSize="xs" bg="gray.900" color="cyan.300" px={1} borderRadius="sm">
                      !cfsubmit &lt;taskId&gt;
                    </Code>{' '}
                    and a screenshot attached. Pre-screenshots use{' '}
                    <Code fontSize="xs" bg="gray.900" color="cyan.300" px={1} borderRadius="sm">
                      !cfpresubmit &lt;taskId&gt;
                    </Code>{' '}
                    and land in the prescreenshots stash to verify starting state before the grind.
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <Text as="span" color="orange.300" fontWeight="semibold">
                      PvM tasks:{' '}
                    </Text>
                    Check the drop against the Allowed Drops list on the task. When approving,
                    assign the reward slot that matches the item (i.e. Serpentine Visage or Torva
                    Helm = helm, Scythe or Tumeken's Shadow = weapon, Bandos Chestplate = chest,
                    Bandos Tassets = legs, anything else = misc). Not sure? Ask a fellow ref, or
                    just go with misc / random.
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <Text as="span" color="teal.300" fontWeight="semibold">
                      Skilling tasks:{' '}
                    </Text>
                    Verify the XP gain or completion count in the screenshot. Skilling rewards are
                    awarded randomly regardless of slot. Use "no reward" when approving a
                    contribution that doesn't earn anything yet, like multiple teammates chipping
                    away at the same shared goal.
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <Text as="span" color="blue.300" fontWeight="semibold">
                      Progress slider:{' '}
                    </Text>
                    For tasks with a quantity target, drag the slider inside the task accordion and
                    hit Save as the team advances toward the goal.
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    <Text as="span" color="green.300" fontWeight="semibold">
                      Mark complete:{' '}
                    </Text>
                    Once the task is fully done, use the Complete Task button (requires at least one
                    approved submission). This locks the task and grants the team the points.
                  </Text>
                </VStack>
              </Box>
            )}

            {isRefsPanel && pendingNewSubs > 0 && (
              <Box
                mb={3}
                px={4}
                py={2}
                borderRadius="md"
                bg="teal.700"
                _hover={{ bg: 'teal.600' }}
                cursor="pointer"
                onClick={handleLoadNewSubs}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="sm" fontWeight="semibold" color="white">
                  {pendingNewSubs} new submission{pendingNewSubs !== 1 ? 's' : ''} — click to load
                </Text>
              </Box>
            )}

            {sortedVisibleSummaries.length === 0 &&
            reviewedSummaries.length === 0 &&
            completedSummaries.length === 0 ? (
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
                            const s = sortedVisibleSummaries[i];
                            return s ? `${s.taskId}_${s.teamId}` : null;
                          })
                          .filter(Boolean)
                      )
                    );
                  }}
                >
                  {sortedVisibleSummaries.map((summary) => {
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

                {reviewedSummaries.length > 0 && (
                  <Accordion
                    allowToggle
                    mt={2}
                    onChange={(indices) => setIsReviewedOpen(indices.length > 0)}
                  >
                    <AccordionItem border="1px solid" borderColor="blue.900" borderRadius="md">
                      <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                        <HStack flex={1} spacing={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="blue.300">
                            Active Tasks
                          </Text>
                          <Badge colorScheme="blue" fontSize="xs">
                            {reviewedSummaries.length}
                          </Badge>
                        </HStack>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel px={0} pb={2}>
                        <Accordion
                          allowMultiple
                          index={reviewedSummaries
                            .map((s, i) =>
                              reviewedOpenKeys.has(`${s.taskId}_${s.teamId}`) ? i : null
                            )
                            .filter((i) => i !== null)}
                          onChange={(newIndices) =>
                            setReviewedOpenKeys(
                              new Set(
                                newIndices
                                  .map((i) => {
                                    const s = reviewedSummaries[i];
                                    return s ? `${s.taskId}_${s.teamId}` : null;
                                  })
                                  .filter(Boolean)
                              )
                            )
                          }
                        >
                          {reviewedSummaries.map((summary) => {
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
                                isOpen={isReviewedOpen && reviewedOpenKeys.has(key)}
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
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                )}

                {completedSummaries.length > 0 && (
                  <Accordion
                    allowToggle
                    mt={2}
                    onChange={(indices) => setIsCompletedOpen(indices.length > 0)}
                  >
                    <AccordionItem border="1px solid" borderColor="green.900" borderRadius="md">
                      <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                        <HStack flex={1} spacing={2}>
                          <Text fontSize="sm" fontWeight="semibold" color="green.300">
                            Completed Tasks
                          </Text>
                          <Badge colorScheme="green" fontSize="xs">
                            {completedSummaries.length}
                          </Badge>
                        </HStack>
                        <AccordionIcon color="gray.400" />
                      </AccordionButton>
                      <AccordionPanel px={0} pb={2}>
                        <Accordion
                          allowMultiple
                          index={completedOpenIndices}
                          onChange={(newIndices) =>
                            setCompletedOpenKeys(
                              new Set(
                                newIndices
                                  .map((i) => {
                                    const s = completedSummaries[i];
                                    return s ? `${s.taskId}_${s.teamId}` : null;
                                  })
                                  .filter(Boolean)
                              )
                            )
                          }
                        >
                          {completedSummaries.map((summary) => {
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
                                isOpen={isCompletedOpen && completedOpenKeys.has(key)}
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
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
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
          {showAdminTab && (
            <TabPanel px={0} w="100%">
              <AdminEventPanel event={event} isAdmin={isAdmin} refetch={refetch} />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
