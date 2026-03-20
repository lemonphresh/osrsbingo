import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Link,
  Divider,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { fmtTs } from '../../hooks/useTimezone';
import { GET_CLAN_WARS_TASK_SUBMISSIONS } from '../../graphql/clanWarsOperations';
import { DIFFICULTY_COLOR } from './gatheringConstants';
import SubmissionCard from './SubmissionCard';
import TaskProgressEditor from './TaskProgressEditor';

const TEAM_COLORS = ['purple', 'cyan', 'pink', 'blue', 'teal', 'orange', 'yellow', 'green'];
function teamColor(teamId) {
  let h = 0;
  for (let i = 0; i < (teamId ?? '').length; i++) h = (h * 31 + teamId.charCodeAt(i)) >>> 0;
  return TEAM_COLORS[h % TEAM_COLORS.length];
}

// One AccordionItem for a task+team pair. Lazy-loads full submissions only when
// isOpen, and re-fetches when subsRefetchSignal increments after a parent mutation.
export default function TaskGroupItem({
  eventId,
  taskId,
  teamId,
  task,
  team,
  summary,
  isAdmin,
  isOpen,
  prescreens,
  guildId,
  handleReview,
  onUndoApproval,
  onUndoTaskComplete,
  onMarkTaskComplete,
  subsRefetchSignal,
  onEventRefetch,
  utc,
  tasks,
}) {
  const [confirmingKey, setConfirmingKey] = useState(null);
  const key = `${taskId}_${teamId}`;

  const isCompleted = team?.completedTaskIds?.includes(taskId) ?? false;
  const approvedCount = summary?.approvedCount ?? 0;
  const pendingSubs = summary?.pendingCount ?? 0;
  const quantity = task?.quantity ?? null;
  const numericProgress = team?.numericTaskProgress?.[taskId] ?? 0;
  const progressPct = isCompleted
    ? 100
    : quantity > 0
    ? Math.min(100, Math.round((numericProgress / quantity) * 100))
    : 0;
  const progressScheme = isCompleted ? 'green' : quantity > 0 ? 'blue' : 'gray';

  const { data: taskSubsData, refetch: refetchTaskSubs } = useQuery(GET_CLAN_WARS_TASK_SUBMISSIONS, {
    variables: { eventId, taskId, teamId },
    fetchPolicy: 'cache-and-network',
    skip: !isOpen,
  });

  // Re-fetch local submissions when a parent mutation fires (review, undo, etc.)
  useEffect(() => {
    if (isOpen && subsRefetchSignal > 0) {
      refetchTaskSubs();
    }
  }, [subsRefetchSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const groupSubs = taskSubsData?.getClanWarsTaskSubmissions ?? [];
  const taskPrescreens = isAdmin
    ? (prescreens ?? []).filter((ps) => ps.taskId === taskId && ps.teamId === teamId)
    : [];

  return (
    <AccordionItem
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
              <Badge colorScheme={teamColor(teamId)} fontSize="xs">
                {team?.teamName ?? teamId}
              </Badge>
            </HStack>
            {task?.description && (
              <Text fontSize="xs" my={2} color="gray.400" textAlign="left">
                {task.description}
              </Text>
            )}
            <HStack spacing={1} flexWrap="wrap">
              <Badge
                colorScheme={task?.role === 'PVMER' ? 'orange' : 'teal'}
                variant="outline"
                fontSize="xs"
              >
                {task?.role}
              </Badge>
              <Badge
                colorScheme={DIFFICULTY_COLOR[task?.difficulty] ?? 'gray'}
                variant="outline"
                fontSize="xs"
              >
                {task?.difficulty}
              </Badge>
              <Badge
                colorScheme={isCompleted ? 'green' : pendingSubs > 0 ? 'yellow' : 'red'}
                fontSize="xs"
              >
                {approvedCount > 0 ? `✓ ${approvedCount} approved` : `${pendingSubs} pending`}
              </Badge>
            </HStack>
          </VStack>

          {/* right: complete / undo buttons (admin only) */}
          {isAdmin && (
            <VStack
              spacing={1}
              align="flex-end"
              flexShrink={0}
              onClick={(e) => e.stopPropagation()}
            >
              {isCompleted ? (
                confirmingKey === `undo_${key}` ? (
                  <HStack>
                    <Text fontSize="xs" color="orange.300" fontWeight="semibold">
                      Undo completion?
                    </Text>
                    <Button
                      size="xs"
                      colorScheme="orange"
                      onClick={() => {
                        setConfirmingKey(null);
                        onUndoTaskComplete({ teamId, taskId });
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
                    colorScheme="orange"
                    variant="outline"
                    onClick={() => setConfirmingKey(`undo_${key}`)}
                  >
                    ↩ Undo Complete
                  </Button>
                )
              ) : approvedCount > 0 ? (
                confirmingKey === key ? (
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
                        onMarkTaskComplete({ teamId, taskId });
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
                )
              ) : null}
            </VStack>
          )}

          <AccordionIcon color="gray.400" flexShrink={0} />
        </HStack>

        {/* progress bar — only shown when task has a quantity */}
        {quantity > 0 && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.400" mb={1}>
              {(isCompleted ? quantity : numericProgress).toLocaleString()} /{' '}
              {quantity.toLocaleString()} ({progressPct}%)
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
        {/* prescreenshots stash — admin only */}
        {isAdmin && taskPrescreens.length > 0 && (
          <Accordion allowToggle mb={3}>
            <AccordionItem border="none">
              <AccordionButton
                px={2}
                py={1}
                bg="blue.900"
                borderRadius="md"
                _hover={{ bg: 'blue.800' }}
              >
                <HStack flex="1" spacing={2}>
                  <Text fontSize="xs" fontWeight="semibold" color="blue.300">
                    📸 Prescreenshots stash
                  </Text>
                  <Badge colorScheme="blue" fontSize="xx-small">
                    {taskPrescreens.length}
                  </Badge>
                </HStack>
                <AccordionIcon color="blue.400" />
              </AccordionButton>
              <AccordionPanel px={2} py={2} bg="blue.950" borderRadius="md" mt={1}>
                <VStack align="stretch" spacing={2}>
                  {taskPrescreens.map((ps) => {
                    const permalink =
                      ps.channelId && ps.messageId && guildId
                        ? `https://discord.com/channels/${guildId}/${ps.channelId}/${ps.messageId}`
                        : null;
                    return (
                      <Box
                        key={ps.preScreenshotId}
                        p={2}
                        bg="gray.800"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="blue.700"
                      >
                        <HStack justify="space-between" flexWrap="wrap" gap={1}>
                          <VStack align="flex-start" spacing={0}>
                            <Text fontSize="xs" color="blue.200" fontWeight="semibold">
                              {ps.submittedUsername ?? ps.submittedBy}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {fmtTs(ps.submittedAt, utc)}
                            </Text>
                          </VStack>
                          <HStack spacing={1}>
                            {ps.screenshotUrl && (
                              <Link
                                href={ps.screenshotUrl}
                                isExternal
                                fontSize="xs"
                                color="blue.300"
                              >
                                view
                              </Link>
                            )}
                            {permalink && (
                              <Link href={permalink} isExternal fontSize="xs" color="gray.400">
                                discord msg
                              </Link>
                            )}
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        )}

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
                  <Badge key={item} colorScheme="orange" fontSize="xs" variant="outline">
                    {item}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}

          {/* submissions — loaded lazily when accordion opens */}
          {groupSubs.length === 0 ? (
            <Text fontSize="xs" color="gray.500" py={2}>
              {isOpen ? 'Loading submissions…' : ''}
            </Text>
          ) : (
            groupSubs.map((sub, idx) => (
              <React.Fragment key={sub.submissionId}>
                {idx > 0 && <Divider borderColor="gray.700" />}
                <SubmissionCard
                  submission={sub}
                  isAdmin={isAdmin}
                  onReview={handleReview}
                  onUndoApproval={onUndoApproval}
                  onSlotChanged={refetchTaskSubs}
                  tasks={tasks}
                  hideTaskInfo
                  utc={utc}
                />
              </React.Fragment>
            ))
          )}

          {/* progress tracker — bar visible to all (when quantity set), editing admin-only */}
          {!isCompleted && (isAdmin || quantity > 0) && (
            <TaskProgressEditor
              eventId={eventId}
              teamId={teamId}
              taskId={taskId}
              quantity={quantity}
              currentProgress={numericProgress}
              isAdmin={isAdmin}
              onSaved={onEventRefetch}
            />
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}
