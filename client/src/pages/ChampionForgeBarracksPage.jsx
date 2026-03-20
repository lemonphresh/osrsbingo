import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
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
  Code,
  ButtonGroup,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  useClipboard,
  IconButton,
  Image,
} from '@chakra-ui/react';
import { LockIcon, ArrowBackIcon, CheckCircleIcon, CopyIcon } from '@chakra-ui/icons';
import { FaDiscord } from 'react-icons/fa';
import {
  GET_CLAN_WARS_EVENT,
  JOIN_TASK_IN_PROGRESS,
  LEAVE_TASK_IN_PROGRESS,
  UPDATE_CLAN_WARS_TEAM_MEMBERS,
  GET_CLAN_WARS_SUBMISSIONS,
  CLAN_WARS_SUBMISSION_ADDED,
  CLAN_WARS_SUBMISSION_REVIEWED,
  CLAN_WARS_EVENT_UPDATED,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import { playSubmissionApproved, playSubmissionDenied, playTaskComplete, warmUpAudio } from '../utils/soundEngine';
import { useTimezone, fmtTs } from '../hooks/useTimezone';
import TimezoneToggle from '../atoms/TimezoneToggle';
import { TeamOutfitter } from '../organisms/ChampionForge/OutfittingScreen';
import laidee from '../assets/laidee.png';
import gnomeChild from '../assets/gnomechild.png';
import gemoji from '../assets/adventurepath-small.webp';
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
// Task detail modal
// ---------------------------------------------------------------------------
function TaskDetailModal({
  isOpen,
  onClose,
  task,
  isCompleted,
  isMeInProgress,
  canJoin,
  othersInProgress,
  inProgressIds,
  getMemberName,
  numericTaskProgress,
  onJoin,
  onLeave,
  handleCopyCommand,
  gatheringStart,
  gatheringEnd,
  eventId,
  currentUserDiscordId,
}) {
  const { utc } = useTimezone();
  const { showToast } = useToastContext();

  const isDropTask = task?.acceptableItems?.length > 0;
  const isXpTask = !isDropTask && task?.quantity > 0;
  const taskRole = isDropTask ? 'PVMER' : 'SKILLER';

  const { data: subData } = useQuery(GET_CLAN_WARS_SUBMISSIONS, {
    variables: { eventId },
    skip: !eventId || !currentUserDiscordId,
    fetchPolicy: 'cache-first',
  });

  const hasSubmittedToType = (subData?.clanWarsSubmissions ?? []).some(
    (s) => s.submittedBy === currentUserDiscordId && s.role === taskRole
  );

  const handleJoin = () => {
    onJoin();
    onClose();
  };

  if (!task) return null;

  const handleCopyPrescreen = () => {
    navigator.clipboard.writeText(`!cfpresubmit ${task.taskId}`);
    showToast('Prescreenshot command copied! Attach your screenshot in Discord.', 'success');
  };

  const progress = numericTaskProgress?.[task.taskId] ?? 0;
  const pct = isCompleted ? 100 : Math.min(100, Math.round((progress / task.quantity) * 100));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
      <ModalContent
        bg="gray.800"
        border="1px solid"
        borderColor="gray.600"
        borderRadius="xl"
        mx={4}
      >
        <ModalHeader pb={2}>
          <HStack spacing={3} align="flex-start" pr={8}>
            {isCompleted && <Icon as={CheckCircleIcon} color="green.400" mt="3px" flexShrink={0} />}
            <VStack align="flex-start" spacing={2} flex={1}>
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={isCompleted ? 'green.200' : 'white'}
                lineHeight="short"
              >
                {task.label}
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Badge colorScheme={DIFF_COLOR[task.difficulty]}>{task.difficulty}</Badge>
                <Badge colorScheme={task.role === 'PVMER' ? 'orange' : 'teal'} variant="outline">
                  {task.role === 'PVMER' ? 'PvM' : 'Skilling'}
                </Badge>
                {isCompleted && <Badge colorScheme="green">done</Badge>}
                {isMeInProgress && <Badge colorScheme="teal">in progress</Badge>}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" />

        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Description */}
            {task.description && (
              <Text fontSize="sm" color="gray.300">
                {task.description}
              </Text>
            )}

            {/* Acceptable drops — PvM tasks */}
            {task.acceptableItems?.length > 0 && (
              <Box
                p={3}
                bg="orange.900"
                borderRadius="md"
                border="1px solid"
                borderColor="orange.700"
              >
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="orange.300"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  Acceptable Drops
                </Text>
                <HStack flexWrap="wrap" gap={1}>
                  {task.acceptableItems.map((item) => (
                    <Badge key={item} colorScheme="orange" variant="outline" fontSize="xs">
                      {item}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Progress bar */}
            {task.quantity > 0 && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text
                    fontSize="xs"
                    color="gray.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Progress
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {isCompleted ? task.quantity.toLocaleString() : progress.toLocaleString()} /{' '}
                    {task.quantity.toLocaleString()} ({pct}%)
                  </Text>
                </HStack>
                <Progress
                  value={pct}
                  size="sm"
                  colorScheme={isCompleted ? 'green' : 'blue'}
                  borderRadius="full"
                  bg="gray.700"
                />
              </Box>
            )}

            {/* Who's working on it */}
            {inProgressIds.length > 0 && (
              <Box>
                <Text
                  fontSize="xs"
                  color="gray.400"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  Currently working on this
                </Text>
                <VStack align="stretch" spacing={1}>
                  {inProgressIds.map((id) => (
                    <HStack key={id} px={2} py={1} bg="gray.700" borderRadius="md" spacing={2}>
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg={id === inProgressIds[0] ? 'teal.400' : 'gray.500'}
                        flexShrink={0}
                      />
                      <Text fontSize="sm" color={id === inProgressIds[0] ? 'teal.200' : 'gray.300'}>
                        {getMemberName(id)}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Actions */}
            {!isCompleted && (
              <Box pt={1}>
                {isMeInProgress ? (
                  <Box p={3} bg="blackAlpha.400" borderRadius="md">
                    {isXpTask && (
                      <Box
                        mb={3}
                        p={3}
                        bg="blue.900"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="blue.700"
                      >
                        <Text fontSize="xs" color="blue.300" fontWeight="semibold" mb={1}>
                          📸 Step 1 — Prescreenshot your current XP:
                        </Text>
                        <Text fontSize="xs" color="blue.400" mb={2}>
                          Run this before you start grinding so admins can verify your gain.
                        </Text>
                        <HStack spacing={2}>
                          <Code
                            fontSize="xs"
                            bg="gray.900"
                            color="blue.200"
                            px={2}
                            py={1}
                            borderRadius="md"
                            flex={1}
                          >
                            !cfpresubmit {task.taskId}
                          </Code>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            leftIcon={<CopyIcon />}
                            onClick={handleCopyPrescreen}
                          >
                            Copy
                          </Button>
                        </HStack>
                      </Box>
                    )}
                    <Text fontSize="xs" color="teal.300" mb={2}>
                      {isXpTask
                        ? 'Step 2 — Submit via Discord when done grinding:'
                        : 'Submit via Discord when done in-game:'}
                    </Text>
                    <HStack spacing={2} mb={2}>
                      <Code
                        fontSize="xs"
                        bg="gray.900"
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
                    </HStack>
                    <Text fontSize="xs" color="teal.400" mb={3}>
                      Attach your screenshot in Discord when you run the command.
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => {
                        onLeave();
                        onClose();
                      }}
                      w="full"
                    >
                      Leave quest
                    </Button>
                  </Box>
                ) : canJoin ? (
                  <Button
                    size="sm"
                    colorScheme={othersInProgress.length > 0 ? 'blue' : 'teal'}
                    onClick={handleJoin}
                    w="full"
                  >
                    {othersInProgress.length > 0 ? 'Join quest' : 'Start quest'}
                  </Button>
                ) : null}
              </Box>
            )}
            {/* Screenshot guidelines */}
            <Divider borderColor="gray.600" />
            <Accordion allowToggle defaultIndex={hasSubmittedToType ? undefined : 0}>
              <AccordionItem border="none">
                <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
                  <Text
                    flex={1}
                    textAlign="left"
                    fontSize="xs"
                    color="gray.400"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    What makes a valid screenshot?
                  </Text>
                  <AccordionIcon color="gray.500" />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <VStack align="stretch" spacing={3}>
                    <Box p={3} bg="gray.700" borderRadius="md">
                      <Text fontSize="xs" fontWeight="semibold" color="gray.300" mb={2}>
                        Required for all submissions
                      </Text>
                      <VStack align="stretch" spacing={1}>
                        <Text fontSize="xs" color="gray.400">
                          • Full game client visible (not cropped)
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          • Event password visible via Wise Old Man or Clan Events plugin
                        </Text>
                        {isDropTask && (
                          <>
                            <Text fontSize="xs" color="gray.400">
                              • The drop visible in your chatbox
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              • Boss kill count visible in chatbox or adventure log
                            </Text>
                          </>
                        )}
                      </VStack>
                    </Box>

                    {isXpTask && (
                      <Box
                        p={3}
                        bg="blue.900"
                        border="1px solid"
                        borderColor="blue.700"
                        borderRadius="md"
                      >
                        <Text fontSize="xs" fontWeight="semibold" color="blue.300" mb={2}>
                          XP gain verification
                        </Text>
                        <VStack align="stretch" spacing={2}>
                          <Text fontSize="xs" color="gray.300">
                            Submit a screenshot of your character's{' '}
                            <Text as="span" color="blue.200" fontWeight="semibold">
                              Wise Old Man
                            </Text>{' '}
                            page showing gains from the event start time to the end:
                          </Text>
                          <HStack spacing={2} flexWrap="wrap">
                            <Text fontSize="xs" color="gray.400" flexShrink={0}>
                              Start:
                            </Text>
                            <Code
                              fontSize="xs"
                              bg="gray.800"
                              color="blue.200"
                              px={1}
                              borderRadius="sm"
                            >
                              {fmtTs(gatheringStart, utc)}
                            </Code>
                          </HStack>
                          <HStack spacing={2} flexWrap="wrap">
                            <Text fontSize="xs" color="gray.400" flexShrink={0}>
                              End:
                            </Text>
                            <Code
                              fontSize="xs"
                              bg="gray.800"
                              color="blue.200"
                              px={1}
                              borderRadius="sm"
                            >
                              {fmtTs(gatheringEnd, utc)}
                            </Code>
                          </HStack>
                          <Text fontSize="xs" color="gray.400">
                            If the xp values in WOM look off, log out and back in then refresh Wise
                            Old Man.
                          </Text>
                          <Box
                            p={2}
                            bg="yellow.900"
                            border="1px solid"
                            borderColor="yellow.700"
                            borderRadius="sm"
                          >
                            <Text fontSize="xs" color="yellow.300">
                              ⚠️ If you already had XP in this skill before the event, use{' '}
                              <Code
                                fontSize="xs"
                                bg="blackAlpha.400"
                                color="yellow.200"
                                px={1}
                                borderRadius="sm"
                              >
                                !cfpresubmit
                              </Code>{' '}
                              (from Step 1) before grinding to record your baseline.
                            </Text>
                          </Box>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
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
  gatheringStart,
  gatheringEnd,
  eventId,
}) {
  const { showToast } = useToastContext();
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const progress = numericTaskProgress?.[task.taskId] ?? 0;
  const pct = isCompleted
    ? 100
    : Math.min(100, Math.round((progress / (task.quantity || 1)) * 100));

  return (
    <>
      <Box
        p={3}
        bg={isCompleted ? 'green.900' : isMeInProgress ? 'teal.900' : 'gray.800'}
        borderRadius="md"
        border="1px solid"
        borderColor={isCompleted ? 'green.700' : isMeInProgress ? 'teal.600' : 'gray.700'}
        opacity={isCompleted ? 0.75 : 1}
        cursor="pointer"
        onClick={onOpen}
        _hover={{
          borderColor: isCompleted ? 'green.600' : isMeInProgress ? 'teal.400' : 'gray.500',
        }}
        transition="border-color 0.15s"
      >
        <HStack justify="space-between" align="flex-start">
          <HStack spacing={3} flex={1} minW={0} align="flex-start">
            {isCompleted && <Icon as={CheckCircleIcon} color="green.400" flexShrink={0} mt="2px" />}
            <VStack align="flex-start" spacing={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" color={isCompleted ? 'green.200' : 'white'}>
                {task.label}
              </Text>
              {task.description && (
                <Text fontSize="xs" color="gray.300" noOfLines={2}>
                  {task.description}
                </Text>
              )}
              {inProgressIds.length > 0 && (
                <HStack spacing={1} flexWrap="wrap">
                  <Text fontSize="xs" color="gray.500">
                    working:
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
            </VStack>
          </HStack>

          <VStack spacing={1} flexShrink={0} align="flex-end">
            <HStack spacing={1}>
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
            </HStack>
            {!isCompleted && !isMeInProgress && canJoin && (
              <Button
                size="xs"
                colorScheme={othersInProgress.length > 0 ? 'blue' : 'teal'}
                onClick={(e) => {
                  e.stopPropagation();
                  onJoin();
                }}
              >
                {othersInProgress.length > 0 ? 'Join quest' : 'Start quest'}
              </Button>
            )}
          </VStack>
        </HStack>

        {/* Compact progress bar */}
        {task.quantity > 0 && (
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
        )}
      </Box>

      <TaskDetailModal
        isOpen={isOpen}
        onClose={onClose}
        task={task}
        isCompleted={isCompleted}
        isMeInProgress={isMeInProgress}
        canJoin={canJoin}
        othersInProgress={othersInProgress}
        inProgressIds={inProgressIds}
        getMemberName={getMemberName}
        numericTaskProgress={numericTaskProgress}
        onJoin={onJoin}
        onLeave={onLeave}
        handleCopyCommand={handleCopyCommand}
        gatheringStart={gatheringStart}
        gatheringEnd={gatheringEnd}
        eventId={eventId}
        currentUserDiscordId={currentUserDiscordId}
      />
    </>
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
  gatheringStart,
  gatheringEnd,
  eventId,
}) {
  const byDiff = DIFF_ORDER.reduce((acc, d) => {
    acc[d] = tasks.filter((t) => t.difficulty === d);
    return acc;
  }, {});

  const total = tasks.length;
  const done = tasks.filter((t) => completedTaskIds.includes(t.taskId)).length;

  return (
    <Box
      bg="gray.700"
      border="1px solid"
      borderColor="gray.600"
      borderRadius="lg"
      p={3}
      display="flex"
      flexDir="column"
      h="100%"
    >
      <HStack mb={1} justify="space-between" flexShrink={0}>
        <HStack spacing={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {title}
          </Text>
          <Badge colorScheme={colorScheme} fontSize="xx-small">
            {done}/{total}
          </Badge>
        </HStack>
      </HStack>
      {subtitle && (
        <Text fontSize="xs" color="gray.500" mb={2} flexShrink={0}>
          {subtitle}
        </Text>
      )}

      <Box
        overflowY="auto"
        flex={1}
        pr={1}
        css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
          '&::-webkit-scrollbar-thumb': {
            background: '#abb8ceff',
            borderRadius: '10px',
            '&:hover': { background: '#718096' },
          },
          scrollbarWidth: 'thin',
          scrollbarColor: '#abb8ceff transparent',
        }}
      >
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
                      gatheringStart={gatheringStart}
                      gatheringEnd={gatheringEnd}
                      eventId={eventId}
                    />
                  ))}
                </VStack>
              </Box>
            );
          })}
        </VStack>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Role selector — lets the current member update their own role
// ---------------------------------------------------------------------------
const ROLES = [
  {
    key: 'PVMER',
    label: 'PvMer',
    scheme: 'orange',
    img: laidee,
    desc: 'Boss kills & combat drops. Earns gear slots: weapon, helm, chest, legs, gloves, boots, or trinket.',
  },
  {
    key: 'SKILLER',
    label: 'Skiller',
    scheme: 'teal',
    img: gnomeChild,
    desc: 'XP gains & minigame tasks. Earns utility slots: consumables, rings, amulets, capes, or shields.',
  },
  {
    key: 'FLEX',
    label: 'Flex',
    scheme: 'purple',
    img: gemoji,
    desc: 'Any task goes. Rewards earned depend on the specific task you complete.',
  },
];

function MyRoleSelector({ team, myDiscordId, currentRole, refetch }) {
  const { showToast } = useToastContext();
  const [hoveredRole, setHoveredRole] = useState(null);
  const [updateMembers, { loading }] = useMutation(UPDATE_CLAN_WARS_TEAM_MEMBERS, {
    onCompleted: () => {
      showToast('Role updated', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update role', 'error'),
  });

  const setRole = (role) => {
    const newRole = role === currentRole ? 'UNSET' : role;
    const updated = (team.members ?? []).map((m) =>
      m.discordId === myDiscordId
        ? { discordId: m.discordId, username: m.username, avatar: m.avatar ?? null, role: newRole }
        : { discordId: m.discordId, username: m.username, avatar: m.avatar ?? null, role: m.role }
    );
    updateMembers({ variables: { teamId: team.teamId, members: updated } });
  };

  const isUnset = !currentRole || currentRole === 'UNSET';
  const activeRole = ROLES.find((r) => r.key === currentRole);

  if (!isUnset) {
    return (
      <Box p={3} bg="gray.800" border="1px solid" borderColor="gray.600" borderRadius="lg">
        <HStack spacing={3} flexWrap="wrap" align="center">
          <Text fontSize="xs" color="gray.400" fontWeight="semibold" flexShrink={0}>
            My role:
          </Text>
          <ButtonGroup size="sm" isAttached isDisabled={loading}>
            {ROLES.map(({ key, label, scheme }) => (
              <Button
                key={key}
                colorScheme={scheme}
                variant={currentRole === key ? 'solid' : 'ghost'}
                onClick={() => setRole(key)}
              >
                {label}
              </Button>
            ))}
          </ButtonGroup>
          {activeRole && (
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              {activeRole.desc}
            </Text>
          )}
        </HStack>
      </Box>
    );
  }

  return (
    <Box p={4} bg="yellow.900" border="2px solid" borderColor="yellow.600" borderRadius="lg">
      <VStack align="stretch" spacing={4}>
        <VStack align="flex-start" spacing={1}>
          <Text fontWeight="bold" color="yellow.200" fontSize="md">
            ⚠️ Choose your role before joining tasks
          </Text>
          <Text fontSize="sm" color="yellow.400">
            Coordinate with your team! Decide who's bossing, who's skilling, and who's going flex.
            Your role determines which tasks you can join and what reward slots you can earn.
          </Text>
        </VStack>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          {ROLES.map(({ key, label, scheme, img, desc }) => (
            <Box
              key={key}
              as="button"
              onClick={() => !loading && setRole(key)}
              onMouseEnter={() => setHoveredRole(key)}
              onMouseLeave={() => setHoveredRole(null)}
              p={4}
              bg={hoveredRole === key ? `${scheme}.900` : 'blackAlpha.400'}
              border="2px solid"
              borderColor={hoveredRole === key ? `${scheme}.400` : `${scheme}.700`}
              borderRadius="lg"
              textAlign="left"
              cursor="pointer"
              transition="all 0.15s"
              disabled={loading}
            >
              <HStack spacing={3} align="center">
                <Box display="flex" alignItems="center" justifyContent="center" flexShrink={0}>
                  <Image
                    src={img}
                    alt={label}
                    w="64px"
                    h="64px"
                    objectFit="contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </Box>
                <VStack align="flex-start" spacing={1} flex={1}>
                  <Text fontSize="lg" fontWeight="bold" color={`${scheme}.300`}>
                    {label}
                  </Text>
                  <Text fontSize="sm" color="gray.300" lineHeight="short" textAlign="left">
                    {desc}
                  </Text>
                </VStack>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
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
// Submission feed — player-facing, read-only
// ---------------------------------------------------------------------------
const STATUS_COLOR = { PENDING: 'yellow', APPROVED: 'green', DENIED: 'red' };
const STATUS_LABEL = { PENDING: 'pending', APPROVED: 'approved', DENIED: 'denied' };

function SubmissionFeed({ eventId, teamId }) {
  const { utc } = useTimezone();
  const { data, refetch } = useQuery(GET_CLAN_WARS_SUBMISSIONS, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(CLAN_WARS_SUBMISSION_ADDED, {
    variables: { eventId },
    onData: () => refetch(),
  });
  useSubscription(CLAN_WARS_SUBMISSION_REVIEWED, {
    variables: { eventId },
    onData: ({ data }) => {
      refetch();
      const status = data?.data?.clanWarsSubmissionReviewed?.status;
      if (status === 'APPROVED') playSubmissionApproved();
      else if (status === 'DENIED') playSubmissionDenied();
    },
  });

  const subs = (data?.getClanWarsSubmissions ?? [])
    .filter((s) => s.teamId === teamId)
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  if (subs.length === 0) return null;

  const pendingCount = subs.filter((s) => s.status === 'PENDING').length;

  return (
    <Box>
      <HStack mb={2} spacing={2} justify="space-between">
        <HStack spacing={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            Submissions
          </Text>
          {pendingCount > 0 && (
            <Badge colorScheme="yellow" fontSize="xx-small">
              {pendingCount} pending
            </Badge>
          )}
        </HStack>
        <TimezoneToggle />
      </HStack>
      <VStack
        spacing={1}
        align="stretch"
        maxH="400px"
        overflowY="auto"
        css={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '10px' },
          scrollbarWidth: 'thin',
          scrollbarColor: '#4a5568 transparent',
        }}
      >
        {subs.map((sub) => (
          <Box
            key={sub.submissionId}
            px={2}
            py={2}
            bg="gray.800"
            borderRadius="md"
            border="1px solid"
            borderColor={
              sub.status === 'APPROVED'
                ? 'green.700'
                : sub.status === 'DENIED'
                ? 'red.900'
                : 'gray.600'
            }
          >
            <HStack justify="space-between" flexWrap="wrap" gap={1}>
              <HStack spacing={2} flex={1} minW={0}>
                <Badge colorScheme={STATUS_COLOR[sub.status]} fontSize="xs" flexShrink={0}>
                  {STATUS_LABEL[sub.status]}
                </Badge>
                <Text fontSize="xs" color="white" noOfLines={1}>
                  {sub.taskLabel ?? sub.taskId}
                </Text>
              </HStack>
              <Text fontSize="xs" color="gray.500" flexShrink={0}>
                {fmtTs(sub.submittedAt, utc)}
              </Text>
            </HStack>

            {sub.status === 'APPROVED' && sub.rewardItem && (
              <HStack mt={1} spacing={1}>
                <Text fontSize="xs" color="gray.400">
                  reward:
                </Text>
                <Badge
                  colorScheme={
                    sub.rewardItem.rarity === 'epic'
                      ? 'purple'
                      : sub.rewardItem.rarity === 'rare'
                      ? 'blue'
                      : sub.rewardItem.rarity === 'uncommon'
                      ? 'green'
                      : 'gray'
                  }
                  fontSize="xs"
                >
                  {sub.rewardItem.rarity}
                </Badge>
                <Text fontSize="xs" color="gray.300">
                  {sub.rewardItem.name}
                </Text>
              </HStack>
            )}

            {sub.status === 'APPROVED' && !sub.rewardItem && (
              <Text fontSize="xs" color="gray.500" mt={1}>
                approved — reward rolls when task is marked complete
              </Text>
            )}

            {sub.status === 'DENIED' && sub.reviewNote && (
              <Box mt={1} px={2} py={1} bg="red.900" borderRadius="sm">
                <Text fontSize="xs" color="red.200">
                  <Text as="span" fontWeight="semibold">
                    reason:{' '}
                  </Text>
                  {sub.reviewNote}
                </Text>
              </Box>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// GATHERING phase
// ---------------------------------------------------------------------------
const IS_DEV = process.env.NODE_ENV !== 'production';

function GatheringPhaseBarracks({ event, team, isAdmin, user, refetch }) {
  const { showToast } = useToastContext();
  const [previewRole, setPreviewRole] = useState(null);

  const [joinTask] = useMutation(JOIN_TASK_IN_PROGRESS, {
    onCompleted: refetch,
    onError: (err) => showToast(err.message ?? 'Failed to join task', 'error'),
  });
  const [leaveTask] = useMutation(LEAVE_TASK_IN_PROGRESS, {
    onCompleted: refetch,
    onError: (err) => showToast(err.message ?? 'Failed to leave task', 'error'),
  });

  const tasks = event.tasks ?? [];
  const completedTaskIds = React.useMemo(() => team.completedTaskIds ?? [], [team.completedTaskIds]);
  const taskProgress = team.taskProgress ?? {};
  const numericTaskProgress = team.numericTaskProgress ?? {};
  const currentUserDiscordId = user?.discordUserId ?? null;

  const prevCompletedRef = useRef(completedTaskIds);
  useEffect(() => {
    const prev = prevCompletedRef.current;
    const hasNew = completedTaskIds.some((id) => !prev.includes(id));
    if (hasNew) playTaskComplete();
    prevCompletedRef.current = completedTaskIds;
  }, [completedTaskIds]);

  // Find the current user's role within this team
  const memberRecord = (team.members ?? []).find(
    (m) => typeof m !== 'string' && m.discordId === currentUserDiscordId
  );
  const userMemberRole = memberRecord?.role ?? 'ANY';
  const effectiveRole = previewRole ?? userMemberRole;

  const pvmerTasks = tasks.filter((t) => t.role === 'PVMER');
  const skillerTasks = tasks.filter((t) => t.role === 'SKILLER');

  const [selectedQuestTaskId, setSelectedQuestTaskId] = useState(null);
  const selectedQuestTask = tasks.find((t) => t.taskId === selectedQuestTaskId) ?? null;

  const getMemberName = (discordId) => {
    const m = (team.members ?? []).find((tm) => tm.discordId === discordId);
    return m?.username ?? discordId;
  };

  const handleQuestCopyCommand = () => {
    if (selectedQuestTask) {
      navigator.clipboard.writeText(`!cfsubmit ${selectedQuestTask.taskId}`);
      showToast('Command copied! Attach your screenshot in Discord.', 'success');
    }
  };

  // Active quest log: tasks with player assignments, not yet completed, sorted by progress %
  const questEntries = React.useMemo(() => {
    const entries = [];
    for (const [taskId, assignedIds] of Object.entries(taskProgress)) {
      if (!assignedIds?.length) continue;
      const task = tasks.find((t) => t.taskId === taskId);
      if (!task || !task.isActive) continue;
      if (completedTaskIds.includes(taskId)) continue;
      const progress = numericTaskProgress[taskId] ?? 0;
      const total = task.quantity ?? null;
      const percent = total ? progress / total : 0;
      const assignedPlayers = assignedIds
        .map((id) => (team.members ?? []).find((m) => m.discordId === id))
        .filter(Boolean);
      entries.push({ taskId, task, assignedPlayers, progress, total, percent });
    }
    return entries.sort((a, b) => b.percent - a.percent);
  }, [taskProgress, numericTaskProgress, completedTaskIds, tasks, team.members]);

  const gatheringCountdown = useCountdown(event.gatheringEnd);
  const { onCopy: copyPassword, hasCopied: passwordCopied } = useClipboard(
    event.eventPassword ?? ''
  );

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
    userMemberRole: effectiveRole,
    onJoin: handleJoin,
    onLeave: handleLeave,
    gatheringStart: event.gatheringStart,
    gatheringEnd: event.gatheringEnd,
    eventId: event.eventId,
  };

  return (
    <VStack align="stretch" spacing={6}>
      {/* Phase banner */}
      <Box p={4} bg="green.900" borderRadius="lg" border="1px solid" borderColor="green.700">
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
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
        {event.eventPassword && (
          <HStack my={3} spacing={2} align="center">
            <Text fontSize="xs" color="green.400" fontWeight="semibold">
              Event Password:
            </Text>
            <Code
              fontSize="sm"
              bg="gray.800"
              color="green.200"
              px={2}
              py={0.5}
              borderRadius="sm"
              letterSpacing="wider"
            >
              {event.eventPassword}
            </Code>
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="green"
              aria-label="Copy password"
              icon={<CopyIcon />}
              onClick={copyPassword}
              title={passwordCopied ? 'Copied!' : 'Copy password'}
            />
            {passwordCopied && (
              <Text fontSize="xs" color="green.400">
                Copied!
              </Text>
            )}
          </HStack>
        )}
      </Box>

      {memberRecord && (
        <MyRoleSelector
          team={team}
          myDiscordId={currentUserDiscordId}
          currentRole={userMemberRole}
          refetch={refetch}
        />
      )}

      {/* Admin role preview — dev/staging only */}
      {isAdmin && IS_DEV && (
        <Box
          px={3}
          py={2}
          bg="purple.900"
          border="1px solid"
          borderColor="purple.700"
          borderRadius="md"
        >
          <HStack spacing={3} flexWrap="wrap" align="center">
            <Text
              fontSize="xs"
              color="purple.300"
              fontWeight="semibold"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              🛠 (TESTING ONLY) Preview as:
            </Text>
            <ButtonGroup size="xs" isAttached>
              {[
                ['PVMER', 'orange'],
                ['SKILLER', 'teal'],
                ['FLEX', 'purple'],
              ].map(([role, scheme]) => (
                <Button
                  key={role}
                  colorScheme={scheme}
                  variant={previewRole === role ? 'solid' : 'ghost'}
                  onClick={() => setPreviewRole(previewRole === role ? null : role)}
                >
                  {role === 'PVMER' ? 'PvMer' : role === 'SKILLER' ? 'Skiller' : 'Flex'}
                </Button>
              ))}
            </ButtonGroup>
            {previewRole ? (
              <>
                <Text fontSize="xs" color="purple.400">
                  viewing as <strong>{previewRole}</strong>
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => setPreviewRole(null)}
                >
                  reset
                </Button>
              </>
            ) : (
              <Text fontSize="xs" color="purple.600">
                select a role to preview task visibility
              </Text>
            )}
          </HStack>
        </Box>
      )}

      {/* Active Quest Log */}
      {questEntries.length > 0 && (
        <Box>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={3}
          >
            Active Quests
          </Text>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 4 }} spacing={3}>
            {questEntries.map(({ taskId, task, assignedPlayers, progress, total }) => (
              <Box
                key={taskId}
                bg="gray.800"
                border="1px solid"
                borderColor="gray.600"
                borderRadius="md"
                p={3}
                cursor="pointer"
                onClick={() => setSelectedQuestTaskId(taskId)}
                _hover={{ borderColor: 'gray.400' }}
                transition="border-color 0.15s"
              >
                <HStack mb={1} spacing={1} flexWrap="wrap">
                  <Badge
                    colorScheme={task.role === 'PVMER' ? 'orange' : 'teal'}
                    fontSize="2xs"
                  >
                    {task.role === 'PVMER' ? 'PvM' : 'Skill'}
                  </Badge>
                  <Badge
                    colorScheme={DIFF_COLOR[task.difficulty] ?? 'gray'}
                    fontSize="2xs"
                  >
                    {task.difficulty}
                  </Badge>
                </HStack>
                <Text
                  fontSize="sm"
                  fontWeight="semibold"
                  color="white"
                  lineHeight="shorter"
                  mb={2}
                  noOfLines={2}
                >
                  {task.label}
                </Text>
                {total != null && (
                  <>
                    <Progress
                      value={(progress / total) * 100}
                      size="xs"
                      colorScheme="green"
                      borderRadius="full"
                      mb={1}
                    />
                    <Text fontSize="xs" color="gray.400" mb={1}>
                      {progress} / {total}
                    </Text>
                  </>
                )}
                <VStack align="flex-start" spacing={0} mt={1}>
                  <Text fontSize="2xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                    Adventurers
                  </Text>
                  <HStack spacing={1} flexWrap="wrap">
                    {assignedPlayers.map((p) => (
                      <Text
                        key={p.discordId}
                        fontSize="xs"
                        color={
                          p.role === 'PVMER' ? 'orange.300'
                          : p.role === 'SKILLER' ? 'teal.300'
                          : p.role === 'FLEX' || p.role === 'ANY' ? 'purple.300'
                          : 'gray.300'
                        }
                      >
                        {p.rsn || p.username}
                      </Text>
                    ))}
                  </HStack>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {selectedQuestTask && (
        <TaskDetailModal
          isOpen={!!selectedQuestTaskId}
          onClose={() => setSelectedQuestTaskId(null)}
          task={selectedQuestTask}
          isCompleted={completedTaskIds.includes(selectedQuestTaskId)}
          isMeInProgress={!!(taskProgress[selectedQuestTaskId]?.includes(currentUserDiscordId))}
          canJoin={
            !completedTaskIds.includes(selectedQuestTaskId) &&
            !(taskProgress[selectedQuestTaskId]?.includes(currentUserDiscordId)) &&
            !!effectiveRole && effectiveRole !== 'UNSET' &&
            (selectedQuestTask.role === 'ANY' || effectiveRole === 'ANY' || effectiveRole === 'FLEX' || effectiveRole === selectedQuestTask.role)
          }
          othersInProgress={(taskProgress[selectedQuestTaskId] ?? []).filter((id) => id !== currentUserDiscordId)}
          inProgressIds={taskProgress[selectedQuestTaskId] ?? []}
          getMemberName={getMemberName}
          numericTaskProgress={numericTaskProgress}
          onJoin={handleJoin}
          onLeave={handleLeave}
          handleCopyCommand={handleQuestCopyCommand}
          gatheringStart={event.gatheringStart}
          gatheringEnd={event.gatheringEnd}
          eventId={event.eventId}
          currentUserDiscordId={currentUserDiscordId}
        />
      )}

      {/* Two-column layout: quest logs + sidebar */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} alignItems="stretch">
        {/* Quest logs — PvM and Skilling side by side, takes 2/3 */}
        <Box gridColumn={{ lg: 'span 2' }} h="100%">
          {tasks.length === 0 ? (
            <Center h="200px">
              <Text color="gray.500">No tasks assigned to this event yet.</Text>
            </Center>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} h="100%">
              {pvmerTasks.length > 0 && (
                <TaskSection
                  title="PvM Tasks"
                  subtitle="Drops: weapon, helm, chest, legs, or misc"
                  colorScheme="orange"
                  tasks={pvmerTasks}
                  {...sharedTaskProps}
                />
              )}
              {skillerTasks.length > 0 && (
                <TaskSection
                  title="Skilling Tasks"
                  subtitle="Drops: consumable, ring, amulet, cape, or shield"
                  colorScheme="teal"
                  tasks={skillerTasks}
                  {...sharedTaskProps}
                />
              )}
            </SimpleGrid>
          )}
        </Box>

        {/* Right sidebar — war chest + submissions */}
        <VStack align="stretch" spacing={4}>
          {/* Team roster */}
          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Team Roster
            </Text>
            <VStack
              align="stretch"
              spacing={1}
              p={2}
              bg="gray.800"
              borderRadius="md"
              border="1px solid"
              borderColor="gray.700"
              maxH="180px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '10px' },
                scrollbarWidth: 'thin',
                scrollbarColor: '#4a5568 transparent',
              }}
            >
              {(team.members ?? []).filter((m) => typeof m !== 'string').length === 0 ? (
                <Text fontSize="xs" color="gray.600">No members yet.</Text>
              ) : (
                (team.members ?? [])
                  .filter((m) => typeof m !== 'string')
                  .sort((a, b) => {
                    const order = { PVMER: 0, SKILLER: 1, FLEX: 2, ANY: 3 };
                    return (order[a.role] ?? 4) - (order[b.role] ?? 4);
                  })
                  .map((m) => (
                    <HStack key={m.discordId} spacing={2} justify="space-between">
                      <Text fontSize="xs" color="gray.300" isTruncated>
                        {m.rsn || m.username || m.discordId}
                      </Text>
                      <Badge
                        fontSize="2xs"
                        colorScheme={
                          m.role === 'PVMER' ? 'orange'
                          : m.role === 'SKILLER' ? 'teal'
                          : 'purple'
                        }
                        flexShrink={0}
                      >
                        {m.role === 'ANY' ? 'FLEX' : m.role}
                      </Badge>
                    </HStack>
                  ))
              )}
            </VStack>
          </Box>

          <Box>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              War Chest
            </Text>
            <Box
              maxH="360px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#4a5568', borderRadius: '10px' },
                scrollbarWidth: 'thin',
                scrollbarColor: '#4a5568 transparent',
              }}
            >
              <WarChestPanel team={team} hidden={false} />
            </Box>
          </Box>
          <SubmissionFeed eventId={event.eventId} teamId={team.teamId} />
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

  if (phase === 'COMPLETED') {
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

  useEffect(() => { warmUpAudio(); }, []);

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(CLAN_WARS_EVENT_UPDATED, {
    variables: { eventId },
    onData: () => refetch(),
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
