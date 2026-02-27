import React, { useRef, useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Box,
  Flex,
  Container,
  Heading,
  Image,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  IconButton,
  Tooltip,
  Spinner,
  useDisclosure,
  Icon,
  Switch,
  CircularProgress,
  CircularProgressLabel,
  SimpleGrid,
} from '@chakra-ui/react';
import {
  AddIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  ExternalLinkIcon,
  InfoIcon,
  CheckCircleIcon,
  TriangleDownIcon,
  TriangleUpIcon,
} from '@chakra-ui/icons';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_ALL_SUBMISSIONS } from '../graphql/queries';
import { formatDisplayDateTime } from '../utils/dateUtils';
import useSubmissionNotifications from '../hooks/useSubmissionNotifications';
import {
  REVIEW_SUBMISSION,
  GENERATE_TREASURE_MAP,
  ADMIN_COMPLETE_NODE,
  TREASURE_ACTIVITY_SUB,
} from '../graphql/mutations';
import { useToastContext } from '../providers/ToastProvider';
import Section from '../atoms/Section';
import theme from '../theme';
import GemTitle from '../atoms/GemTitle';
import CreateTeamModal from '../organisms/TreasureHunt/CreateTreasureTeamModal';
import EditEventModal from '../organisms/TreasureHunt/EditTreasureEventModal';
import EditTeamModal from '../organisms/TreasureHunt/EditTreasureTeamModal';
import MultiTeamTreasureMap from '../organisms/TreasureHunt/MultiTeamTreasureMapVisualization';
import EventAdminManager from '../organisms/TreasureHunt/TreasureAdminManager';
import TreasureRefManager from '../organisms/TreasureHunt/TreasureRefManager';
import { useAuth } from '../providers/AuthProvider';
import { MdOutlineArrowBack } from 'react-icons/md';
import { FaCog, FaCoins, FaCrown, FaMap } from 'react-icons/fa';
import DiscordSetupModal from '../molecules/TreasureHunt/DiscordSetupModal';
import GameRulesTab from '../organisms/TreasureHunt/TreasureHuntGameRulesTab';
import NodeNoteEditor from '../organisms/TreasureHunt/NodeNoteEditor';
import { OBJECTIVE_TYPES } from '../utils/treasureHuntHelpers';
import Gold from '../assets/gold-small.webp';
import Dossier from '../assets/dossier.png';
import Clan from '../assets/clan.png';
import ScrollableTableContainer from '../atoms/ScrollableTableContainer';
import DenialReasonModal from '../organisms/TreasureHunt/DenialReasonModal';
import CompleteNodeDialog from '../organisms/TreasureHunt/CompleteNodeDialog';
import { useThemeColors } from '../hooks/useThemeColors';
import AdminLaunchChecklist from '../organisms/TreasureHunt/AdminChecklist';
import AdminQuickActionsPanel from '../organisms/TreasureHunt/AdminQuickActions';
import EventStatusBanner from '../organisms/TreasureHunt/EventStatusBanner';
import usePageTitle from '../hooks/usePageTitle';
import LaunchCheckModal from '../organisms/TreasureHunt/LaunchCheckModal';
import EventSummaryPanel from '../organisms/TreasureHunt/EventSummaryPanel';

const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E9',
];
const formatGP = (gp) => {
  if (!gp) return '0';
  return (gp / 1000000).toFixed(1) + 'M';
};
// ─── StandingsCard — matches the look from MultiTeamTreasureMapVisualization ─
const StandingsCard = ({
  team,
  index,
  event,
  currentColors,
  colorMode,
  onEditTeam,
  onTeamClick,
  userDiscordId,
}) => {
  const navigate = useNavigate();
  const teamColor = PRESET_COLORS[index % PRESET_COLORS.length];
  const isLeader = index === 0 && (team.currentPot || 0) > 0;
  const isOnTeam = userDiscordId && team.members?.some((m) => m.discordUserId === userDiscordId);
  const standardCount = event.nodes?.filter((n) => n.nodeType === 'STANDARD').length ?? 0;
  const innCount = event.nodes?.filter((n) => n.nodeType === 'INN').length ?? 0;
  const startCount = event.nodes?.filter((n) => n.nodeType === 'START').length ?? 0;
  const totalNodes = Math.max(Math.round(standardCount / 3) + innCount + startCount, 1);
  const completedCount = team.completedNodes?.length || 0;
  const progressPct = (completedCount / totalNodes) * 100;

  return (
    <HStack
      p={4}
      bg={
        isLeader
          ? colorMode === 'dark'
            ? 'yellow.900'
            : 'yellow.50'
          : colorMode === 'dark'
          ? 'whiteAlpha.50'
          : 'blackAlpha.50'
      }
      borderRadius="md"
      border={isLeader ? '2px solid' : '1px solid'}
      borderColor={isLeader ? 'yellow.400' : 'transparent'}
      spacing={4}
      transition="all 0.2s"
      _hover={{
        shadow: 'md',
        backgroundColor: isLeader
          ? colorMode === 'dark'
            ? 'yellow.800'
            : 'yellow.100'
          : 'whiteAlpha.300',
      }}
      cursor="pointer"
      onClick={() => {
        onTeamClick?.(team); // pulse the map nodes
      }}
    >
      {/* Rank circle */}
      <Flex
        w={isLeader ? '32px' : '24px'}
        h={isLeader ? '32px' : '24px'}
        bg={isLeader ? 'yellow.400' : teamColor}
        borderRadius="full"
        align="center"
        justify="center"
        color="white"
        fontWeight="semibold"
        fontSize="sm"
        flexShrink={0}
      >
        {isLeader ? <Icon as={FaCrown} /> : index + 1}
      </Flex>

      {/* Team info */}
      <VStack align="start" spacing={1} flex={1} minW={0}>
        <HStack>
          <Text
            fontWeight="semibold"
            color={isLeader ? currentColors.textColor : currentColors.white}
            fontSize="md"
            isTruncated
          >
            {team.teamName}
          </Text>
          {isLeader && (
            <Badge colorScheme="yellow" fontSize="xs">
              Leader
            </Badge>
          )}
        </HStack>
        <HStack spacing={3} flexWrap="wrap">
          <HStack spacing={1}>
            <Icon as={FaCoins} color="yellow.400" boxSize={3} />
            <Text fontSize="sm" color={isLeader ? 'gray.500' : 'gray.200'}>
              {formatGP(team.currentPot || 0)} GP
            </Text>
          </HStack>
          <HStack spacing={1}>
            <Icon as={CheckCircleIcon} color="green.400" boxSize={3} />
            <Text fontSize="sm" color={isLeader ? 'gray.500' : 'gray.200'}>
              {completedCount} {completedCount === 1 ? 'node' : 'nodes'}
            </Text>
          </HStack>
          {event.nodes?.length > 0 && (isOnTeam || onEditTeam) && (
            <Button
              size="sm"
              bg={isLeader ? 'blackAlpha.100' : 'whiteAlpha.200'}
              color={isLeader ? 'gray.500' : 'gray.200'}
              fontWeight="normal"
              _hover={{ bg: isLeader ? 'blackAlpha.200' : 'whiteAlpha.300' }}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/gielinor-rush/${event.eventId}/team/${team.teamId}`);
              }}
              whiteSpace="nowrap"
            >
              <Icon as={FaMap} />
              &nbsp; View Page
            </Button>
          )}
          {onEditTeam && (
            <IconButton
              size="xs"
              icon={<EditIcon />}
              bg={currentColors.turquoise.base}
              color="white"
              _hover={{ opacity: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onEditTeam(team);
              }}
              aria-label="Edit team"
            />
          )}
        </HStack>
      </VStack>

      {/* Circular progress */}
      <CircularProgress
        value={progressPct}
        size="40px"
        color={teamColor}
        trackColor={isLeader ? 'gray.300' : 'gray.200'}
        thickness="8px"
      >
        <CircularProgressLabel fontSize="xs" color={isLeader ? 'gray.500' : 'gray.200'}>
          {Math.round(progressPct)}%
        </CircularProgressLabel>
      </CircularProgress>
    </HStack>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const TreasureEventView = () => {
  const { colors: currentColors, colorMode } = useThemeColors();
  const { eventId } = useParams();
  const { showToast } = useToastContext();
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { user } = useAuth();
  const submissionsTabRef = useRef(null);
  const settingsTabRef = useRef(null);
  const leaderboardTabRef = useRef(null);

  // ── Modal disclosures ─────────────────────────────────────────────────────
  const {
    isOpen: isEditTeamOpen,
    onOpen: onEditTeamOpen,
    onClose: onEditTeamClose,
  } = useDisclosure();
  const {
    isOpen: isLaunchConfirmOpen,
    onOpen: onLaunchConfirmOpen,
    onClose: onLaunchConfirmClose,
  } = useDisclosure();
  const {
    isOpen: isCreateTeamOpen,
    onOpen: onCreateTeamOpen,
    onClose: onCreateTeamClose,
  } = useDisclosure();
  const {
    isOpen: isEditEventOpen,
    onOpen: onEditEventOpen,
    onClose: onEditEventClose,
  } = useDisclosure();
  const {
    isOpen: isRegenerateOpen,
    onOpen: onRegenerateOpen,
    onClose: onRegenerateClose,
  } = useDisclosure();
  const {
    isOpen: isDiscordSetupOpen,
    onOpen: onDiscordSetupOpen,
    onClose: onDiscordSetupClose,
  } = useDisclosure();
  const {
    isOpen: isDenialModalOpen,
    onOpen: onDenialModalOpen,
    onClose: onDenialModalClose,
  } = useDisclosure();
  const {
    isOpen: isCompleteDialogOpen,
    onOpen: onOpenCompleteDialog,
    onClose: onCloseCompleteDialog,
  } = useDisclosure();

  const [nodeToComplete, setNodeToComplete] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [submissionToDeny, setSubmissionToDeny] = useState(null);
  const [showAllNodesToggle, setShowAllNodesToggle] = useState(true);
  const [highlightedTeamId, setHighlightedTeamId] = useState(null);
  const [nodeSort, setNodeSort] = useState({ col: 'type', dir: 'asc' });

  const cancelRef = useRef();

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_TREASURE_EVENT, { variables: { eventId } });
  const { data: submissionsData, refetch: refetchSubmissions } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
    pollInterval: 5 * 60 * 1000, // 5-minute fallback poll in case WebSocket misses an event
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const [generateMap, { loading: generateLoading }] = useMutation(GENERATE_TREASURE_MAP, {
    refetchQueries: ['GetTreasureEvent', 'GetAllSubmissions'],
    awaitRefetchQueries: true,
    onCompleted: () => {
      showToast('Map generated successfully!', 'success');
      onRegenerateClose();
    },
    onError: (error) => showToast(`Error generating map: ${error.message}`, 'error'),
  });

  const [reviewSubmission] = useMutation(REVIEW_SUBMISSION, {
    onCompleted: () => {
      showToast('Submission reviewed!', 'success');
      refetchSubmissions();
    },
    onError: (error) => showToast(`Error: ${error.message}`, 'error'),
  });

  const [adminCompleteNode] = useMutation(ADMIN_COMPLETE_NODE);

  const REFETCH_ACTIVITY_TYPES = new Set([
    'node_completed',
    'buff_applied',
    'inn_visited',
    'submission_added',
    'submission_reviewed',
  ]);

  useSubscription(TREASURE_ACTIVITY_SUB, {
    variables: { eventId },
    onData: ({ data }) => {
      const activity = data?.data?.treasureHuntActivity;
      if (activity && REFETCH_ACTIVITY_TYPES.has(activity.type)) {
        refetchEvent();
        refetchSubmissions();
      }
    },
    skip: !eventId,
  });

  // ── Derived state ──────────────────────────────────────────────────────────
  const event = eventData?.getTreasureEvent;
  const teams = event?.teams || [];
  const allSubmissions = submissionsData?.getAllSubmissions || [];
  const allPendingSubmissions = allSubmissions.filter((s) => s.status === 'PENDING_REVIEW');
  const allPendingIncompleteSubmissionsCount = allPendingSubmissions.filter((s) => {
    const t = teams.find((t) => t.teamId === s.teamId);
    return !t?.completedNodes?.includes(s.nodeId);
  }).length;

  const sortedTeams = [...teams].sort((a, b) => {
    const diff = Number(b.currentPot || 0) - Number(a.currentPot || 0);
    if (diff !== 0) return diff;
    return (b.completedNodes?.length || 0) - (a.completedNodes?.length || 0);
  });

  const handleNodeSort = (col) =>
    setNodeSort((prev) => ({
      col,
      dir: prev.col === col && prev.dir === 'asc' ? 'desc' : 'asc',
    }));

  const sortedNodes = [...(event?.nodes || [])].sort((a, b) => {
    const d = nodeSort.dir === 'asc' ? 1 : -1;
    switch (nodeSort.col) {
      case 'id':
        return d * (a.nodeId || '').localeCompare(b.nodeId || '');
      case 'title':
        return d * (a.title || '').localeCompare(b.title || '');
      case 'type': {
        const o = { START: 0, INN: 1, STANDARD: 2, TREASURE: 3 };
        const diff = (o[a.nodeType] ?? 99) - (o[b.nodeType] ?? 99);
        return diff !== 0 ? d * diff : d * (a.title || '').localeCompare(b.title || '');
      }
      case 'difficulty':
        return d * ((a.difficultyTier || 0) - (b.difficultyTier || 0));
      case 'location':
        return d * (a.mapLocation || '').localeCompare(b.mapLocation || '');
      case 'gp':
        return d * ((a.rewards?.gp || 0) - (b.rewards?.gp || 0));
      case 'keys':
        return d * ((a.rewards?.keys?.length || 0) - (b.rewards?.keys?.length || 0));
      case 'buffs':
        return d * ((a.rewards?.buffs?.length || 0) - (b.rewards?.buffs?.length || 0));
      case 'objective':
        return d * (a.objective?.target || '').localeCompare(b.objective?.target || '');
      case 'amount':
        return d * ((a.objective?.amount || 0) - (b.objective?.amount || 0));
      case 'prereqs':
        return d * ((a.prerequisites?.length || 0) - (b.prerequisites?.length || 0));
      case 'unlocks':
        return d * ((a.unlocks?.length || 0) - (b.unlocks?.length || 0));
      default:
        return 0;
    }
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleGenerateMap = () => {
    if (event.nodes?.length > 0) onRegenerateOpen();
    else generateMap({ variables: { eventId } });
  };

  const handleNavigateToSubmissions = () => {
    submissionsTabRef.current?.click();
    submissionsTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleNavigateToTeams = () => {
    leaderboardTabRef.current?.click();
    leaderboardTabRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    onEditTeamOpen();
  };

  const handleTeamCardClick = (team) => {
    setHighlightedTeamId(team.teamId);
    // clear after 2.5s (slightly longer than the pulse animation duration)
    setTimeout(() => setHighlightedTeamId(null), 2500);
  };

  const handleCompleteNode = async (congratsMessage) => {
    if (!nodeToComplete) return;
    setCompleteLoading(true);
    try {
      await adminCompleteNode({
        variables: {
          eventId,
          teamId: nodeToComplete.teamId,
          nodeId: nodeToComplete.nodeId,
          congratsMessage,
        },
      });
      showToast('Node completed successfully!', 'success');
      refetchSubmissions();
      refetchEvent();
      onCloseCompleteDialog();
      setNodeToComplete(null);
    } catch (error) {
      showToast(`Failed to complete node: ${error.message}`, 'error');
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleReviewSubmission = async (submissionId, approved, denialReason = null) => {
    try {
      await reviewSubmission({
        variables: { submissionId, approved, reviewerId: user?.username || 'admin', denialReason },
      });
    } catch (err) {
      console.error('Error reviewing submission:', err);
    }
  };

  const handleDenyWithReason = async (submissionId, denialReason) => {
    await handleReviewSubmission(submissionId, false, denialReason);
  };

  const formatObjectiveAmount = (node) => {
    if (!node?.objective) return '—';
    const q = node.objective.quantity ?? 0;
    switch (node.objective.type) {
      case 'xp_gain':
        return `${q.toLocaleString()} XP`;
      case 'boss_kc':
        return `${q} KC`;
      case 'minigame':
        return `${q} runs`;
      case 'item_collection':
        return `${q} collected`;
      case 'clue_scrolls':
        return `${q} clues`;
      default:
        return `${q}`;
    }
  };

  const isEventAdmin =
    user && event && (user.id === event.creatorId || event.adminIds?.includes(user.id));
  const isEventRef = user && event && event.refIds?.includes(user.id);
  const isEventAdminOrRef = isEventAdmin || isEventRef;

  const {
    isSupported: notificationsSupported,
    notificationsEnabled,
    permission: notificationPermission,
    requestPermission: requestNotificationPermission,
    disableNotifications,
    pendingCount,
  } = useSubmissionNotifications(
    allSubmissions.filter((s) => s.status === 'PENDING_REVIEW'),
    isEventAdminOrRef,
    event?.eventName || 'Event',
    refetchSubmissions,
    event?.id,
    allPendingIncompleteSubmissionsCount
  );

  const pageTitle = event?.eventName
    ? pendingCount > 0 && isEventAdminOrRef
      ? `(${pendingCount}) ${event.eventName}`
      : event.eventName
    : null;
  usePageTitle(pageTitle);

  // ── Loading / not found ────────────────────────────────────────────────────
  if (eventLoading) {
    return (
      <Container
        display="flex"
        alignItems="center"
        justifyContent="center"
        flex="1"
        maxW="container.xl"
        w="100%"
        py={8}
      >
        <Spinner size="xl" />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color={currentColors.textColor}>Event not found</Text>
      </Container>
    );
  }

  // ── Draft gate for non-admins ──────────────────────────────────────────────
  if (event.status === 'DRAFT' && !isEventAdmin) {
    return (
      <Flex
        alignItems="center"
        flex="1"
        flexDirection="column"
        height="100%"
        paddingY={['40px', '56px']}
        marginX={['12px', '36px']}
      >
        <EventStatusBanner event={event} isAdmin={isEventAdmin} />

        <Flex
          alignItems="center"
          flexDirection={['column', 'row']}
          justifyContent="space-between"
          marginBottom="16px"
          maxWidth="1200px"
          width="100%"
        >
          <Text
            alignItems="center"
            display="inline-flex"
            _hover={{ borderBottom: '1px solid white', marginBottom: '0px' }}
            fontWeight="semibold"
            justifyContent="center"
            marginBottom="1px"
          >
            <Icon as={MdOutlineArrowBack} marginRight="8px" />
            <Link to="/gielinor-rush"> Back to Events</Link>
          </Text>
        </Flex>
        <Section maxWidth="600px" width="100%" py={8}>
          <VStack spacing={6} align="center" textAlign="center">
            <Box fontSize="6xl">🔒</Box>
            <VStack spacing={2}>
              <Heading size="lg" color={currentColors.white}>
                Event Not Available...Yet!
              </Heading>
              <Text color={currentColors.white} fontSize="lg">
                This event is currently in draft mode
              </Text>
            </VStack>
            <Box p={4} bg="whiteAlpha.400" borderRadius="md" width="100%">
              <Text fontSize="sm" color={currentColors.white}>
                This Gielinor Rush event is still being set up by the event organizers. It will
                become visible once the admins publish it.
              </Text>
            </Box>
          </VStack>
        </Section>
      </Flex>
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
      marginX={['12px', '36px']}
    >
      <EventStatusBanner event={event} isAdmin={isEventAdmin} />
      {isEventAdmin &&
        event.status === 'PUBLIC' &&
        new Date(event.endDate) - new Date() <= 8 * 60 * 60 * 1000 &&
        new Date(event.endDate) > new Date() && (
          <Box
            w="full"
            maxW="1200px"
            bg="orange.800"
            border="1px solid"
            borderColor="orange.500"
            borderRadius="lg"
            px={4}
            py={3}
            mb={6}
          >
            <Text color="orange.100" fontWeight="semibold" fontSize="sm">
              ⏰ <strong>Admin Eyes Only:</strong> The event ends soon. Once it's over, open the{' '}
              <strong>Edit Event</strong> form and set the status to <strong>COMPLETE</strong> to
              publish the final summary at this URL and send the Discord announcement.
            </Text>
          </Box>
        )}
      {/* Back nav */}
      <Flex
        alignItems="center"
        flexDirection={['column', 'row']}
        justifyContent="space-between"
        marginBottom="16px"
        maxWidth="1200px"
        width="100%"
      >
        <Text
          alignItems="center"
          display="inline-flex"
          _hover={{ borderBottom: '1px solid white', marginBottom: '0px' }}
          fontWeight="semibold"
          justifyContent="center"
          marginBottom="1px"
        >
          <Icon as={MdOutlineArrowBack} marginRight="8px" />
          <Link to="/gielinor-rush"> Your Events</Link>
        </Text>
      </Flex>

      <Section maxWidth="1200px" width="100%" py={8}>
        <VStack spacing={8} align="stretch" width="100%">
          {/* ── HERO STRIP ─────────────────────────────────────────────────── */}
          <VStack position="relative" align="center" spacing={1}>
            <GemTitle size="xl" mb="0">
              {event.status === 'COMPLETED' ? 'Summary' : event.eventName}
            </GemTitle>

            <HStack>
              <Badge
                bg={event.status === 'DRAFT' ? currentColors.red : currentColors.green.base}
                color="white"
                px={2}
                py={1}
                borderRadius="md"
                fontSize="md"
              >
                {event.status}
              </Badge>
              <Text color={theme.colors.gray[300]}>
                {formatDisplayDateTime(event.startDate)} – {formatDisplayDateTime(event.endDate)}
              </Text>
            </HStack>

            {/* Copyable IDs / URL */}
            <HStack spacing={2} flexWrap="wrap" justify="center" mt={2}>
              {[
                {
                  label: `ID: ${event.eventId}`,
                  value: event.eventId,
                  toastTitle: 'Event ID Copied!',
                },
                ...(event.eventPassword
                  ? [
                      {
                        label: `Password: ${event.eventPassword}`,
                        value: event.eventPassword,
                        toastTitle: 'Event Password Copied!',
                      },
                    ]
                  : []),
                {
                  label: `URL: ${window.location.href}`,
                  value: window.location.href,
                  toastTitle: 'URL Copied!',
                },
              ].map(({ label, value, toastTitle }) => (
                <Tooltip key={label} label={`Click to copy — ${value}`} hasArrow>
                  <HStack
                    spacing={2}
                    px={3}
                    py={1}
                    bg="whiteAlpha.100"
                    borderRadius="md"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: 'whiteAlpha.400' }}
                    onClick={() => {
                      navigator.clipboard.writeText(value);
                      showToast(toastTitle, 'success');
                    }}
                  >
                    <Text
                      fontSize="xs"
                      color={currentColors.orange}
                      fontFamily="mono"
                      maxW="260px"
                      isTruncated
                    >
                      {label}
                    </Text>
                    <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
                  </HStack>
                </Tooltip>
              ))}
            </HStack>

            {/* Admin edit button */}
            {isEventAdmin && (
              <>
                <Button
                  position="absolute"
                  alignSelf="end"
                  display={['none', 'none', 'block']}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{ bg: currentColors.purple.light }}
                  onClick={onEditEventOpen}
                >
                  Edit Event
                </Button>
                <IconButton
                  display={['block', 'block', 'none']}
                  icon={<EditIcon />}
                  bg={currentColors.purple.base}
                  color="white"
                  _hover={{ bg: currentColors.purple.light }}
                  onClick={onEditEventOpen}
                  aria-label="Edit Event"
                />
              </>
            )}
          </VStack>

          {/* ── STAT BAR ───────────────────────────────────────────────────── */}
          {event.status !== 'COMPLETED' && (
            <StatGroup
              alignSelf="center"
              alignItems="center"
              maxWidth="740px"
              w="100%"
              justifyContent={['center', 'center', 'space-between']}
              flexDirection={['column', 'column', 'row']}
              gap={4}
            >
              <Stat
                bg={currentColors.cardBg}
                py="6px"
                minW={['216px', '216px', 'auto']}
                textAlign="center"
                borderRadius="md"
              >
                <StatLabel mb={2} color={currentColors.textColor}>
                  Total Prize Pool
                </StatLabel>
                <Image h="32px" m="0 auto" src={Gold} />
                <StatNumber color={currentColors.green.base}>
                  {event.eventConfig ? formatGP(event.eventConfig.prize_pool_total) : 'N/A'}
                </StatNumber>
              </Stat>
              <Stat
                bg={currentColors.cardBg}
                py="6px"
                minW={['216px', '216px', 'auto']}
                textAlign="center"
                borderRadius="md"
              >
                <StatLabel mb={2} color={currentColors.textColor}>
                  Total Teams
                </StatLabel>
                <Image h="32px" m="0 auto" src={Clan} />
                <StatNumber color={currentColors.textColor}>{teams.length}</StatNumber>
              </Stat>
              <Stat
                bg={currentColors.cardBg}
                py="6px"
                minW={['216px', '216px', 'auto']}
                textAlign="center"
                borderRadius="md"
              >
                <StatLabel mb={2} color={currentColors.textColor}>
                  Pending Submissions
                </StatLabel>
                <Image h="32px" m="0 auto" src={Dossier} />
                <StatNumber color={currentColors.textColor}>
                  {allPendingIncompleteSubmissionsCount}
                </StatNumber>
              </Stat>
            </StatGroup>
          )}

          {event.status === 'COMPLETED' ||
            (event.status === 'ARCHIVED' && (
              <EventSummaryPanel event={event} teams={teams} nodes={event.nodes || []} />
            ))}

          {/* ── MAIN BODY: two-column leaderboard + map ─────────────────────── */}
          {event.status !== 'COMPLETED' &&
            (event.nodes && event.nodes.length > 0 ? (
              <Flex
                gap={[0, 0, 0, 6]}
                align="flex-start"
                flexDirection={['column', 'column', 'column', 'row']}
              >
                {/* LEFT: Leaderboard — natural height, min width so it doesn't collapse */}
                <Box
                  flexShrink={0}
                  flexGrow={0}
                  h={['auto', 'auto', 'auto', '96%']}
                  w={['100%', '100%', '100%', '340px']}
                  minW={0}
                  mb={[-2, -2, -2, 0]}
                >
                  <HStack justify="space-between" mb={3}>
                    <Heading size="sm" color={currentColors.white}>
                      🏆 &nbsp;Leaderboard
                    </Heading>
                    {isEventAdmin && event.status === 'DRAFT' && (
                      <Button
                        size="xs"
                        leftIcon={<AddIcon />}
                        bg={currentColors.turquoise.base}
                        color="white"
                        _hover={{ opacity: 0.8 }}
                        onClick={onCreateTeamOpen}
                      >
                        Add Team
                      </Button>
                    )}
                  </HStack>

                  {sortedTeams.length === 0 ? (
                    <Box p={6} textAlign="center" bg={currentColors.cardBg} borderRadius="md">
                      <Text color="gray.400" mb={3}>
                        No teams yet.
                      </Text>
                      {isEventAdmin && event.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          leftIcon={<AddIcon />}
                          bg={currentColors.turquoise.base}
                          color="white"
                          _hover={{ opacity: 0.8 }}
                          onClick={onCreateTeamOpen}
                        >
                          Add the first team
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <VStack
                      align="stretch"
                      h="100%"
                      maxH={['250px', '250px', '250px', '100%']}
                      py={3}
                      pl={3}
                      mb="0"
                      bg="whiteAlpha.100"
                      borderTopLeftRadius="8px"
                      borderTopRightRadius="8px"
                      spacing={3}
                      overflow="scroll"
                      css={{
                        '&::-webkit-scrollbar': {
                          width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: 'transparent',
                          borderRadius: '10px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#abb8ceff',
                          borderRadius: '10px',
                          '&:hover': {
                            background: '#718096',
                          },
                        },
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#abb8ceff transparent',
                      }}
                    >
                      {sortedTeams.map((team, idx) => (
                        <StandingsCard
                          key={team.teamId}
                          team={team}
                          index={idx}
                          event={event}
                          currentColors={currentColors}
                          colorMode={colorMode}
                          onTeamClick={handleTeamCardClick}
                          onEditTeam={isEventAdmin ? handleEditTeam : null}
                          userDiscordId={user?.discordUserId}
                        />
                      ))}
                    </VStack>
                  )}
                </Box>

                {/* RIGHT: Map — takes remaining space, full width on mobile */}
                <Box flex={1} minW={0} w={['100%', '100%', '100%', 'auto']}>
                  {isEventAdmin && event.status !== 'DRAFT' && (
                    <Card mb={3} bg={currentColors.cardBg} borderRadius="md">
                      <CardBody py={3}>
                        <HStack justify="space-between" align="center">
                          <HStack>
                            <Icon as={FaCog} boxSize={5} mr={1} color={currentColors.purple.base} />
                            <Text
                              fontSize="sm"
                              fontWeight="semibold"
                              color={currentColors.textColor}
                            >
                              Show All Nodes
                            </Text>
                          </HStack>
                          <Switch
                            size="md"
                            colorScheme="purple"
                            isChecked={showAllNodesToggle}
                            onChange={(e) => setShowAllNodesToggle(e.target.checked)}
                          />
                        </HStack>
                      </CardBody>
                    </Card>
                  )}
                  <MultiTeamTreasureMap
                    nodes={event.nodes || []}
                    teams={teams || []}
                    event={event}
                    onRefresh={() => refetchEvent()}
                    showAllNodes={isEventAdmin && showAllNodesToggle}
                    highlightedTeamId={highlightedTeamId}
                  />
                </Box>
              </Flex>
            ) : (
              /* no map yet — show leaderboard solo if there are teams */
              teams.length > 0 && (
                <Box>
                  <HStack justify="space-between" mb={3}>
                    <Heading size="sm" color={currentColors.textColor}>
                      🏆 Leaderboard
                    </Heading>
                  </HStack>
                  <VStack align="stretch" spacing={3}>
                    {sortedTeams.map((team, idx) => (
                      <StandingsCard
                        key={team.teamId}
                        team={team}
                        index={idx}
                        event={event}
                        currentColors={currentColors}
                        colorMode={colorMode}
                        onTeamClick={handleTeamCardClick}
                        onEditTeam={isEventAdmin ? handleEditTeam : null}
                      />
                    ))}
                  </VStack>
                </Box>
              )
            ))}

          {/* ── TABS (admin tools + game rules) ────────────────────────────── */}
          {event.status !== 'COMPLETED' && (
            <Tabs
              size="sm"
              position="relative"
              variant="soft-rounded"
              maxW="100%"
              defaultIndex={isEventAdmin && teams.length === 0 ? 2 : 0}
            >
              <TabList
                pb="6px"
                overflowY="hidden"
                overflowX="scroll"
                css={{
                  '&::-webkit-scrollbar': { display: 'none' },
                  '-ms-overflow-style': 'none',
                  'scrollbar-width': 'none',
                }}
              >
                {isEventAdminOrRef && (
                  <Tab ref={submissionsTabRef} whiteSpace="nowrap" color={theme.colors.gray[400]}>
                    Submissions ({allPendingIncompleteSubmissionsCount} Pending)
                    {allPendingIncompleteSubmissionsCount > 0 && (
                      <Box
                        position="absolute"
                        top="4px"
                        right="8px"
                        w="8px"
                        h="8px"
                        bg="tomato"
                        borderRadius="full"
                        boxShadow="0 0 0 2px white"
                        animation="pulse 2s infinite"
                        sx={{
                          '@keyframes pulse': {
                            '0%,100%': { opacity: 1 },
                            '50%': { opacity: 0.5 },
                          },
                        }}
                      />
                    )}
                  </Tab>
                )}
                {isEventAdmin && (
                  <Tab ref={settingsTabRef} whiteSpace="nowrap" color={theme.colors.gray[400]}>
                    Event Settings
                  </Tab>
                )}
                <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                  Game Rules
                </Tab>
                {isEventAdminOrRef && event.nodes?.length > 0 && (
                  <Tab whiteSpace="nowrap" color={theme.colors.gray[400]}>
                    All Nodes
                  </Tab>
                )}
              </TabList>

              <TabPanels>
                {/* SUBMISSIONS */}
                {isEventAdminOrRef && (
                  <TabPanel px={0}>
                    <VStack spacing={4} align="stretch">
                      <Box bg={currentColors.turquoise.base} color="white" p={3} borderRadius="md">
                        <Text fontWeight="semibold" fontSize="sm" mb={1}>
                          📋 Submission Review Workflow
                        </Text>
                        <Text fontSize="xs">
                          1. Review and approve/deny individual submissions below
                          <br />
                          2. Track progress toward node objectives
                          <br />
                          3. When cumulative goal is met, complete the node to grant rewards and
                          unlock next nodes
                        </Text>
                      </Box>

                      {(() => {
                        const groupedSubmissions = {};
                        allSubmissions.forEach((s) => {
                          const key = `${s.nodeId}_${s.team?.teamId}`;
                          if (!groupedSubmissions[key]) groupedSubmissions[key] = [];
                          groupedSubmissions[key].push(s);
                        });

                        const relevantGroups = Object.entries(groupedSubmissions).filter(
                          ([, subs]) =>
                            subs.some(
                              (s) => s.status === 'PENDING_REVIEW' || s.status === 'APPROVED'
                            )
                        );

                        if (relevantGroups.length === 0) {
                          return (
                            <Text color={currentColors.white} textAlign="center" py={8}>
                              No pending submissions
                            </Text>
                          );
                        }

                        const sortedGroups = [...relevantGroups].sort((a, b) => {
                          const [, subsA] = a;
                          const [, subsB] = b;
                          const nodeIdA = subsA[0].nodeId;
                          const teamA = event.teams?.find(
                            (t) => t.teamId === subsA[0].team?.teamId
                          );
                          const isCompletedA = teamA?.completedNodes?.includes(nodeIdA);
                          const nodeIdB = subsB[0].nodeId;
                          const teamB = event.teams?.find(
                            (t) => t.teamId === subsB[0].team?.teamId
                          );
                          const isCompletedB = teamB?.completedNodes?.includes(nodeIdB);
                          if (isCompletedA !== isCompletedB) return isCompletedA ? 1 : -1;
                          const pendA = subsA.filter((s) => s.status === 'PENDING_REVIEW').length;
                          const pendB = subsB.filter((s) => s.status === 'PENDING_REVIEW').length;
                          if (pendA !== pendB) return pendB - pendA;
                          const latestA = Math.max(
                            ...subsA.map((s) => new Date(s.submittedAt || 0).getTime())
                          );
                          const latestB = Math.max(
                            ...subsB.map((s) => new Date(s.submittedAt || 0).getTime())
                          );
                          return latestB - latestA;
                        });

                        return (
                          <Accordion allowMultiple>
                            {sortedGroups.map(([key, submissions]) => {
                              const nodeId = submissions[0].nodeId;
                              const node = event.nodes?.find((n) => n.nodeId === nodeId);
                              const nodeTitle = node ? node.title : nodeId;
                              const nodeType = node ? node.nodeType : 'STANDARD';
                              const teamId = submissions[0].team?.teamId;
                              const team = event.teams?.find((t) => t.teamId === teamId);
                              const isCompleted = team?.completedNodes?.includes(nodeId);
                              const pendingSubmissions = submissions.filter(
                                (s) => s.status === 'PENDING_REVIEW'
                              );
                              const approvedSubmissions = submissions.filter(
                                (s) => s.status === 'APPROVED'
                              );
                              const deniedSubmissions = submissions.filter(
                                (s) => s.status === 'DENIED'
                              );

                              return (
                                <AccordionItem
                                  key={key}
                                  border="1px solid"
                                  borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                                  borderRadius="md"
                                  mb={2}
                                  bg={currentColors.cardBg}
                                  opacity={isCompleted ? 0.75 : 1}
                                >
                                  <h2>
                                    <AccordionButton
                                      _hover={{
                                        bg:
                                          colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                                      }}
                                      py={4}
                                    >
                                      <HStack justify="space-between" align="start" flex={1}>
                                        <VStack align="start" spacing={1} flex={1}>
                                          <HStack>
                                            <AccordionIcon color={currentColors.textColor} />
                                            <Text
                                              fontWeight="semibold"
                                              fontSize="lg"
                                              color={currentColors.textColor}
                                            >
                                              {nodeType === 'INN' ? '🏠 ' : ''}
                                              {nodeTitle}
                                            </Text>
                                            <Badge
                                              bg={
                                                nodeType === 'INN'
                                                  ? theme.colors.yellow.base
                                                  : nodeType === 'START'
                                                  ? currentColors.purple.base
                                                  : currentColors.turquoise.base
                                              }
                                              color="white"
                                            >
                                              {nodeType}
                                            </Badge>
                                            {isCompleted && (
                                              <Badge colorScheme="green">✅ COMPLETED</Badge>
                                            )}
                                          </HStack>
                                          <HStack ml={6}>
                                            <Badge bg={currentColors.purple.base} color="white">
                                              {submissions[0].team?.teamName || 'Unknown Team'}
                                            </Badge>
                                            {pendingSubmissions.length > 0 && (
                                              <Badge colorScheme="orange">
                                                {pendingSubmissions.length} pending
                                              </Badge>
                                            )}
                                            {approvedSubmissions.length > 0 && (
                                              <Badge colorScheme="green">
                                                {approvedSubmissions.length} approved
                                              </Badge>
                                            )}
                                            {deniedSubmissions.length > 0 && (
                                              <Badge colorScheme="red">
                                                {deniedSubmissions.length} denied
                                              </Badge>
                                            )}
                                          </HStack>
                                          <Text ml={6} fontSize="xs" color="gray.500">
                                            Node ID: {nodeId}
                                          </Text>
                                        </VStack>

                                        {!isCompleted && approvedSubmissions.length > 0 && (
                                          <VStack
                                            spacing={1}
                                            align="end"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <Text
                                              fontSize="14px"
                                              lineHeight="16px"
                                              textAlign="right"
                                              color="gray.700"
                                              mb="4px"
                                            >
                                              Once the objective is completed <br />
                                              and submissions approved:
                                            </Text>
                                            <Button
                                              size="sm"
                                              colorScheme="green"
                                              leftIcon={<CheckIcon />}
                                              onClick={() => {
                                                setNodeToComplete({
                                                  nodeId,
                                                  teamId,
                                                  nodeTitle,
                                                  teamName:
                                                    submissions[0].team?.teamName || team?.teamName,
                                                });
                                                onOpenCompleteDialog();
                                              }}
                                            >
                                              Complete This Node
                                            </Button>
                                            <Text fontSize="xs" color="gray.500">
                                              Grant rewards
                                            </Text>
                                          </VStack>
                                        )}
                                      </HStack>
                                    </AccordionButton>
                                  </h2>

                                  <AccordionPanel pb={4}>
                                    <VStack align="stretch" spacing={3}>
                                      {node?.objective && (
                                        <Box
                                          p={2}
                                          bg={
                                            colorMode === 'dark'
                                              ? 'whiteAlpha.100'
                                              : 'blackAlpha.50'
                                          }
                                          borderRadius="md"
                                        >
                                          <Text
                                            fontSize="xs"
                                            fontWeight="semibold"
                                            color={currentColors.textColor}
                                          >
                                            Objective:
                                          </Text>
                                          <Text
                                            fontSize="xs"
                                            color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                          >
                                            {OBJECTIVE_TYPES[node.objective.type]}:{' '}
                                            {node.objective.quantity} {node.objective.target}
                                          </Text>
                                          {node.objective.appliedBuff && (
                                            <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                              ✨ Buff Applied: -
                                              {(node.objective.appliedBuff.reduction * 100).toFixed(
                                                0
                                              )}
                                              %
                                            </Badge>
                                          )}
                                        </Box>
                                      )}

                                      {isCompleted && (
                                        <Box
                                          p={2}
                                          bg={currentColors.green.base}
                                          color="white"
                                          borderRadius="md"
                                        >
                                          <Text fontSize="xs" fontWeight="semibold">
                                            ℹ️ This node is already completed. Submissions can still
                                            be reviewed for record-keeping.
                                          </Text>
                                        </Box>
                                      )}

                                      <VStack align="stretch" spacing={2}>
                                        {submissions
                                          .sort((a, b) => {
                                            const order = {
                                              PENDING_REVIEW: 0,
                                              APPROVED: 1,
                                              DENIED: 2,
                                            };
                                            return order[a.status] - order[b.status];
                                          })
                                          .map((submission) => (
                                            <Box
                                              key={submission.submissionId}
                                              p={3}
                                              bg={
                                                submission.status === 'APPROVED'
                                                  ? colorMode === 'dark'
                                                    ? 'green.900'
                                                    : 'green.50'
                                                  : submission.status === 'DENIED'
                                                  ? colorMode === 'dark'
                                                    ? 'red.900'
                                                    : 'red.50'
                                                  : colorMode === 'dark'
                                                  ? '#1A202C'
                                                  : '#F7FAFC'
                                              }
                                              borderRadius="md"
                                              borderWidth={submission.status === 'APPROVED' ? 2 : 1}
                                              borderColor={
                                                submission.status === 'APPROVED'
                                                  ? currentColors.green.base
                                                  : submission.status === 'DENIED'
                                                  ? currentColors.red
                                                  : 'transparent'
                                              }
                                            >
                                              <HStack justify="space-between" mb={2}>
                                                <VStack align="start" spacing={0}>
                                                  <HStack>
                                                    <Text
                                                      fontSize="sm"
                                                      fontWeight="semibold"
                                                      color={currentColors.textColor}
                                                    >
                                                      Submitted by {submission.submittedByUsername}{' '}
                                                      (ID: {submission.submittedBy})
                                                    </Text>
                                                    {submission.status !== 'PENDING_REVIEW' && (
                                                      <Badge
                                                        colorScheme={
                                                          submission.status === 'APPROVED'
                                                            ? 'green'
                                                            : 'red'
                                                        }
                                                        fontSize="xs"
                                                      >
                                                        {submission.status}
                                                      </Badge>
                                                    )}
                                                  </HStack>
                                                  <Text
                                                    fontSize="xs"
                                                    color={
                                                      colorMode === 'dark' ? 'gray.400' : 'gray.600'
                                                    }
                                                  >
                                                    {new Date(
                                                      submission.submittedAt
                                                    ).toLocaleString()}
                                                  </Text>
                                                  {submission.reviewedAt && (
                                                    <Text
                                                      fontSize="xs"
                                                      color={
                                                        colorMode === 'dark'
                                                          ? 'gray.500'
                                                          : 'gray.600'
                                                      }
                                                    >
                                                      Reviewed:{' '}
                                                      {new Date(
                                                        submission.reviewedAt
                                                      ).toLocaleString()}
                                                    </Text>
                                                  )}
                                                </VStack>
                                              </HStack>
                                              <HStack justify="space-between">
                                                <Button
                                                  leftIcon={<ExternalLinkIcon />}
                                                  size="sm"
                                                  variant="outline"
                                                  as="a"
                                                  href={submission.proofUrl}
                                                  target="_blank"
                                                  color={currentColors.textColor}
                                                >
                                                  View Proof
                                                </Button>
                                                {submission.status === 'PENDING_REVIEW' && (
                                                  <HStack>
                                                    <Tooltip label="Deny Submission">
                                                      <IconButton
                                                        icon={<CloseIcon />}
                                                        colorScheme="red"
                                                        size="sm"
                                                        onClick={() => {
                                                          setSubmissionToDeny(submission);
                                                          onDenialModalOpen();
                                                        }}
                                                      />
                                                    </Tooltip>
                                                    <Tooltip label="Approve Submission">
                                                      <IconButton
                                                        icon={<CheckIcon />}
                                                        colorScheme="green"
                                                        size="sm"
                                                        onClick={() =>
                                                          handleReviewSubmission(
                                                            submission.submissionId,
                                                            true
                                                          )
                                                        }
                                                      />
                                                    </Tooltip>
                                                  </HStack>
                                                )}
                                              </HStack>
                                            </Box>
                                          ))}
                                      </VStack>

                                      {/* Admin / Ref Notes */}
                                      <NodeNoteEditor
                                        eventId={event.eventId}
                                        teamId={teamId}
                                        nodeId={nodeId}
                                        initialComments={team?.nodeNotes?.[nodeId] || []}
                                        isAdmin={isEventAdmin}
                                      />
                                    </VStack>
                                  </AccordionPanel>
                                </AccordionItem>
                              );
                            })}
                          </Accordion>
                        );
                      })()}
                    </VStack>
                  </TabPanel>
                )}

                {/* EVENT SETTINGS */}
                {isEventAdmin && (
                  <TabPanel>
                    <Card bg={currentColors.cardBg}>
                      <CardBody>
                        <VStack align="stretch" spacing={4}>
                          <Heading size="md" color={currentColors.textColor}>
                            Event Configuration
                          </Heading>

                          {notificationsSupported && (
                            <Card bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}>
                              <CardBody>
                                <VStack align="stretch" spacing={3}>
                                  <HStack justify="space-between" align="start">
                                    <VStack align="start" spacing={2} flex={1}>
                                      <HStack>
                                        <Text fontSize="2xl">
                                          {notificationsEnabled ? '🔔' : '🔕'}
                                        </Text>
                                        <Heading size="sm" color={currentColors.textColor}>
                                          Submission Notifications
                                        </Heading>
                                        {notificationsEnabled && (
                                          <Badge colorScheme="green" fontSize="xs">
                                            PUBLIC
                                          </Badge>
                                        )}
                                        <HStack
                                          borderLeft="1px solid gray"
                                          paddingLeft={3}
                                          marginLeft={2}
                                          spacing={2}
                                        >
                                          {notificationsEnabled ? (
                                            <>
                                              <Button
                                                size="sm"
                                                colorScheme="blue"
                                                variant="outline"
                                                onClick={() => {
                                                  if (Notification.permission === 'granted') {
                                                    if (
                                                      localStorage.getItem(
                                                        'treasureHunt_sound_enabled'
                                                      ) !== 'false'
                                                    ) {
                                                      const ac = new (window.AudioContext ||
                                                        window.webkitAudioContext)();
                                                      const playTone = (f, d, t) => {
                                                        const o = ac.createOscillator();
                                                        const g = ac.createGain();
                                                        o.connect(g);
                                                        g.connect(ac.destination);
                                                        o.frequency.value = f;
                                                        o.type = 'sine';
                                                        g.gain.setValueAtTime(0, t);
                                                        g.gain.linearRampToValueAtTime(
                                                          0.3,
                                                          t + 0.01
                                                        );
                                                        g.gain.exponentialRampToValueAtTime(
                                                          0.01,
                                                          t + d
                                                        );
                                                        o.start(t);
                                                        o.stop(t + d);
                                                      };
                                                      const now = ac.currentTime;
                                                      playTone(800, 0.1, now);
                                                      playTone(600, 0.15, now + 0.1);
                                                    }
                                                    const n = new Notification(
                                                      'Test Notification',
                                                      {
                                                        body: 'If you can see this, notifications are working!',
                                                        icon: '/favicon.ico',
                                                        tag: 'manual-test',
                                                        silent: true,
                                                      }
                                                    );
                                                    n.onclick = () => {
                                                      window.focus();
                                                      n.close();
                                                    };
                                                  }
                                                }}
                                              >
                                                Send Test
                                              </Button>
                                              <Button
                                                size="sm"
                                                colorScheme="red"
                                                variant="outline"
                                                onClick={disableNotifications}
                                              >
                                                Disable
                                              </Button>
                                            </>
                                          ) : (
                                            <Button
                                              size="sm"
                                              colorScheme="green"
                                              onClick={requestNotificationPermission}
                                              isDisabled={notificationPermission === 'denied'}
                                            >
                                              Enable Notifications
                                            </Button>
                                          )}
                                        </HStack>
                                      </HStack>
                                      <Text
                                        fontSize="sm"
                                        color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                      >
                                        {notificationsEnabled
                                          ? "You'll receive browser notifications when new submissions arrive"
                                          : 'Enable notifications to get alerts for new submissions'}
                                      </Text>
                                      {notificationPermission === 'denied' && (
                                        <Text fontSize="xs" color="red.500">
                                          ⚠️ Notifications are blocked. Please enable them in your
                                          browser settings.
                                        </Text>
                                      )}

                                      {notificationsEnabled && (
                                        <HStack
                                          p={2}
                                          bg={
                                            colorMode === 'dark'
                                              ? 'whiteAlpha.100'
                                              : 'blackAlpha.50'
                                          }
                                          borderRadius="md"
                                          w="full"
                                        >
                                          <Text fontSize="2xl">🔊</Text>
                                          <VStack align="start" spacing={0} flex={1}>
                                            <Text
                                              fontSize="sm"
                                              fontWeight="semibold"
                                              color={currentColors.textColor}
                                            >
                                              Notification Sound
                                            </Text>
                                            <Text
                                              fontSize="xs"
                                              color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                            >
                                              Play a sound when new submissions arrive
                                            </Text>
                                          </VStack>
                                          <Switch
                                            colorScheme="purple"
                                            defaultChecked={
                                              localStorage.getItem('treasureHunt_sound_enabled') !==
                                              'false'
                                            }
                                            onChange={(e) => {
                                              localStorage.setItem(
                                                'treasureHunt_sound_enabled',
                                                e.target.checked.toString()
                                              );
                                              if (e.target.checked) {
                                                const ac = new (window.AudioContext ||
                                                  window.webkitAudioContext)();
                                                const playTone = (f, d, t) => {
                                                  const o = ac.createOscillator();
                                                  const g = ac.createGain();
                                                  o.connect(g);
                                                  g.connect(ac.destination);
                                                  o.frequency.value = f;
                                                  o.type = 'sine';
                                                  g.gain.setValueAtTime(0, t);
                                                  g.gain.linearRampToValueAtTime(0.3, t + 0.01);
                                                  g.gain.exponentialRampToValueAtTime(0.01, t + d);
                                                  o.start(t);
                                                  o.stop(t + d);
                                                };
                                                const now = ac.currentTime;
                                                playTone(800, 0.1, now);
                                                playTone(600, 0.15, now + 0.1);
                                              }
                                            }}
                                          />
                                        </HStack>
                                      )}
                                    </VStack>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          )}

                          <hr />
                          {event.status === 'DRAFT' && (
                            <HStack gap={4}>
                              <Button
                                colorScheme="green"
                                onClick={handleGenerateMap}
                                isLoading={generateLoading}
                                animation={
                                  !event.nodes || event.nodes.length === 0
                                    ? 'flashButton 1.5s ease-in-out infinite'
                                    : 'none'
                                }
                                sx={{
                                  '@keyframes flashButton': {
                                    '0%,100%': {
                                      boxShadow: '0 0 0 0 rgba(72,187,120,0.7)',
                                      transform: 'scale(1)',
                                    },
                                    '50%': {
                                      boxShadow: '0 0 20px 5px rgba(72,187,120,0.9)',
                                      transform: 'scale(1.05)',
                                    },
                                  },
                                }}
                              >
                                {event.nodes?.length > 0 ? 'Regenerate Map' : 'Generate Map'}
                              </Button>
                              <Button
                                leftIcon={<AddIcon />}
                                bg={currentColors.turquoise.base}
                                color="white"
                                _hover={{ opacity: 0.8 }}
                                onClick={onCreateTeamOpen}
                              >
                                Add Team
                              </Button>
                            </HStack>
                          )}

                          <Card bg={currentColors.purple.base} color="white" borderRadius="md">
                            <CardBody>
                              <VStack align="start" spacing={3}>
                                <HStack>
                                  <Icon as={InfoIcon} boxSize={5} />
                                  <Heading size="sm">Discord Integration</Heading>
                                </HStack>
                                <Text fontSize="sm">
                                  Connect your Discord server to let teams interact with the
                                  Treasure Hunt directly from Discord.
                                </Text>
                                <Button
                                  size="sm"
                                  colorScheme="whiteAlpha"
                                  variant="solid"
                                  onClick={onDiscordSetupOpen}
                                  leftIcon={<InfoIcon />}
                                >
                                  View Setup Instructions
                                </Button>
                              </VStack>
                            </CardBody>
                          </Card>
                          <hr />
                          <SimpleGrid columns={[1, 1, 2]} spacing={6}>
                            <EventAdminManager
                              event={event}
                              onUpdate={() => window.location.reload()}
                            />
                            <TreasureRefManager event={event} />
                          </SimpleGrid>
                        </VStack>
                      </CardBody>
                    </Card>
                  </TabPanel>
                )}

                {/* GAME RULES */}
                <TabPanel px={0}>
                  <GameRulesTab colorMode={colorMode} currentColors={currentColors} event={event} />
                </TabPanel>

                {/* ALL NODES */}
                {isEventAdminOrRef && event.nodes?.length > 0 && (
                  <TabPanel px={0}>
                    <Box
                      bg={currentColors.cardBg}
                      borderRadius="8px"
                      overflow="hidden"
                      sx={{
                        '&::-webkit-scrollbar': { width: '8px' },
                        '&::-webkit-scrollbar-track': {
                          background: 'rgba(255,255,255,0.1)',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: 'rgba(125,95,255,0.6)',
                          borderRadius: '4px',
                          '&:hover': { background: 'rgba(125,95,255,0.8)' },
                        },
                        scrollbarWidth: 'thin',
                        scrollbarColor: `rgba(125,95,255,0.6) rgba(255,255,255,0.1)`,
                      }}
                    >
                      <ScrollableTableContainer width="100%">
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              {[
                                { col: 'id', label: 'ID' },
                                { col: 'title', label: 'Title' },
                                { col: 'type', label: 'Type' },
                                { col: 'difficulty', label: 'Difficulty' },
                                { col: 'location', label: 'Location / Path' },
                                { col: 'gp', label: 'GP', isNumeric: true },
                                { col: 'keys', label: 'Keys' },
                                { col: 'buffs', label: 'Buffs' },
                                { col: 'objective', label: 'Objective' },
                                { col: 'amount', label: 'Amount', isNumeric: true },
                                { col: 'prereqs', label: 'Prereqs', isNumeric: true },
                                { col: 'unlocks', label: 'Unlocks', isNumeric: true },
                              ].map(({ col, label, isNumeric }) => (
                                <Th
                                  key={col}
                                  isNumeric={isNumeric}
                                  color="gray.600"
                                  cursor="pointer"
                                  userSelect="none"
                                  onClick={() => handleNodeSort(col)}
                                  _hover={{ color: 'gray.700' }}
                                >
                                  <HStack
                                    spacing={1}
                                    justify={isNumeric ? 'flex-end' : 'flex-start'}
                                  >
                                    <span>{label}</span>
                                    {nodeSort.col === col ? (
                                      nodeSort.dir === 'asc' ? (
                                        <TriangleUpIcon color="gray.800" boxSize={2.5} />
                                      ) : (
                                        <TriangleDownIcon color="gray.800" boxSize={2.5} />
                                      )
                                    ) : (
                                      <TriangleDownIcon
                                        color="gray.800"
                                        boxSize={2.5}
                                        opacity={0.2}
                                      />
                                    )}
                                  </HStack>
                                </Th>
                              ))}
                            </Tr>
                          </Thead>
                          <Tbody>
                            {sortedNodes.map((node) => {
                              const diffMap = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };
                              const diffBadgeScheme =
                                node.difficultyTier === 5
                                  ? 'red'
                                  : node.difficultyTier === 3
                                  ? 'orange'
                                  : node.difficultyTier === 1
                                  ? 'green'
                                  : 'gray';
                              const gp = node.rewards?.gp || 0;
                              const keys = node.rewards?.keys || [];
                              const buffs = node.rewards?.buffs || [];
                              const objective = node.objective ? ` ${node.objective.target}` : '—';

                              return (
                                <Tr key={node.nodeId}>
                                  <Td>
                                    <HStack spacing={2}>
                                      <Tooltip label="Copy Node ID">
                                        <IconButton
                                          aria-label="Copy Node ID"
                                          icon={<CopyIcon />}
                                          size="xs"
                                          variant="ghost"
                                          onClick={() => navigator.clipboard.writeText(node.nodeId)}
                                        />
                                      </Tooltip>
                                      <Text
                                        color={currentColors.textColor}
                                        fontSize="xs"
                                        fontFamily="mono"
                                      >
                                        {node.nodeId}
                                      </Text>
                                    </HStack>
                                  </Td>
                                  <Td color={currentColors.textColor} maxW="280px" isTruncated>
                                    {node.title || '—'}
                                  </Td>
                                  <Td>
                                    <Badge
                                      bg={
                                        node.nodeType === 'INN'
                                          ? 'yellow.300'
                                          : node.nodeType === 'START'
                                          ? currentColors.purple.base
                                          : currentColors.turquoise.base
                                      }
                                      color="white"
                                    >
                                      {node.nodeType}
                                    </Badge>
                                  </Td>
                                  <Td>
                                    {node.nodeType === 'STANDARD' ? (
                                      <Badge colorScheme={diffBadgeScheme}>
                                        {diffMap[node.difficultyTier] || '—'}
                                      </Badge>
                                    ) : (
                                      <Badge colorScheme="gray">—</Badge>
                                    )}
                                  </Td>
                                  <Td color={currentColors.textColor}>
                                    <Text whiteSpace="nowrap" fontSize="sm">
                                      {node.mapLocation || '—'}
                                    </Text>
                                  </Td>
                                  <Td isNumeric color={currentColors.green.base}>
                                    {node.nodeType === 'INN' ? (
                                      node.availableRewards?.length > 0 ? (
                                        <Tooltip label="Inn trade rewards (min - max)">
                                          <Text whiteSpace="nowrap">
                                            {formatGP(
                                              Math.min(
                                                ...node.availableRewards.map((r) => r.payout)
                                              )
                                            )}{' '}
                                            -{' '}
                                            {formatGP(
                                              Math.max(
                                                ...node.availableRewards.map((r) => r.payout)
                                              )
                                            )}
                                          </Text>
                                        </Tooltip>
                                      ) : (
                                        '—'
                                      )
                                    ) : gp ? (
                                      formatGP(gp)
                                    ) : (
                                      '0.0M'
                                    )}
                                  </Td>
                                  <Td>
                                    <HStack spacing={1} wrap="wrap">
                                      {keys.length > 0 ? (
                                        keys.map((k, i) => (
                                          <Badge key={i} colorScheme={k.color}>
                                            {k.quantity} {k.color}
                                          </Badge>
                                        ))
                                      ) : (
                                        <Text fontSize="xs" color="gray.500">
                                          —
                                        </Text>
                                      )}
                                    </HStack>
                                  </Td>
                                  <Td>
                                    {buffs.length > 0 ? (
                                      <Badge colorScheme="purple">{buffs.length}</Badge>
                                    ) : (
                                      <Text fontSize="xs" color="gray.500">
                                        —
                                      </Text>
                                    )}
                                  </Td>
                                  <Td color={currentColors.textColor} maxW="320px" isTruncated>
                                    {objective}
                                  </Td>
                                  <Td color={currentColors.textColor} isNumeric>
                                    {node?.objective?.appliedBuff ? (
                                      <Tooltip
                                        hasArrow
                                        label={`Reduced from ${(
                                          node.objective.originalQuantity ?? node.objective.quantity
                                        ).toLocaleString()}`}
                                      >
                                        <HStack justify="flex-end" spacing={2}>
                                          <Text>{formatObjectiveAmount(node)}</Text>
                                          <Badge colorScheme="blue">
                                            -
                                            {(node.objective.appliedBuff.reduction * 100).toFixed(
                                              0
                                            )}
                                            %
                                          </Badge>
                                        </HStack>
                                      </Tooltip>
                                    ) : (
                                      <Text whiteSpace="nowrap">{formatObjectiveAmount(node)}</Text>
                                    )}
                                  </Td>
                                  <Td isNumeric color={currentColors.textColor}>
                                    {node.prerequisites?.length || 0}
                                  </Td>
                                  <Td isNumeric color={currentColors.textColor}>
                                    {node.unlocks?.length || 0}
                                  </Td>
                                </Tr>
                              );
                            })}
                          </Tbody>
                        </Table>
                      </ScrollableTableContainer>
                    </Box>
                  </TabPanel>
                )}
              </TabPanels>
            </Tabs>
          )}
        </VStack>
      </Section>

      {/* Floating admin panels */}
      {isEventAdmin && (
        <AdminLaunchChecklist
          event={event}
          onGenerateMap={handleGenerateMap}
          onAddTeam={onCreateTeamOpen}
          onEditTeam={handleEditTeam}
          onOpenDiscordSetup={onDiscordSetupOpen}
          onLaunchEvent={onLaunchConfirmOpen}
          isGeneratingMap={generateLoading}
        />
      )}
      {isEventAdmin && event.status === 'PUBLIC' && (
        <AdminQuickActionsPanel
          event={event}
          teams={teams}
          submissions={allSubmissions}
          onNavigateToSubmissions={handleNavigateToSubmissions}
          onNavigateToTeams={handleNavigateToTeams}
          onOpenSettings={onEditEventOpen}
          onOpenDiscordSetup={onDiscordSetupOpen}
          isEventAdmin={isEventAdmin}
        />
      )}

      {/* Modals */}
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={onCreateTeamClose}
        eventId={eventId}
        existingTeams={event?.teams || []}
        onSuccess={async () => {
          await refetchEvent();
          await refetchSubmissions();
        }}
      />
      <EditEventModal
        isOpen={isEditEventOpen}
        onClose={onEditEventClose}
        event={event}
        onSuccess={async () => {
          await refetchEvent();
        }}
      />
      <EditTeamModal
        isOpen={isEditTeamOpen}
        onClose={onEditTeamClose}
        team={selectedTeam}
        eventId={eventId}
        existingTeams={event?.teams || []}
        allowDelete={event?.status === 'DRAFT'}
        onSuccess={async () => {
          await refetchEvent();
          await refetchSubmissions();
        }}
      />
      <DiscordSetupModal
        isOpen={isDiscordSetupOpen}
        onClose={onDiscordSetupClose}
        eventId={eventId}
        onConfirmed={async () => {
          await refetchEvent();
        }}
      />
      <DenialReasonModal
        isOpen={isDenialModalOpen}
        onClose={onDenialModalClose}
        onDeny={handleDenyWithReason}
        submissionId={submissionToDeny?.submissionId}
        submittedBy={submissionToDeny?.submittedByUsername || submissionToDeny?.submittedBy}
      />
      <CompleteNodeDialog
        isOpen={isCompleteDialogOpen}
        nodeToComplete={nodeToComplete}
        onClose={onCloseCompleteDialog}
        onComplete={handleCompleteNode}
        isLoading={completeLoading}
      />

      {/* Regenerate map confirmation */}
      <AlertDialog
        isOpen={isRegenerateOpen}
        leastDestructiveRef={cancelRef}
        onClose={onRegenerateClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={currentColors.cardBg}>
            <AlertDialogHeader fontSize="lg" fontWeight="semibold" color={currentColors.textColor}>
              Regenerate Map
            </AlertDialogHeader>
            <AlertDialogBody color={currentColors.textColor}>
              Are you sure you want to regenerate the map? This will delete all existing nodes and
              reset all team progress. This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onRegenerateClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => generateMap({ variables: { eventId } })}
                ml={3}
                isLoading={generateLoading}
              >
                Regenerate
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <LaunchCheckModal
        isOpen={isLaunchConfirmOpen}
        onClose={onLaunchConfirmClose}
        event={event}
        onEventLaunched={async () => {
          onLaunchConfirmClose();
          await refetchEvent();
        }}
      />
    </Flex>
  );
};

export default TreasureEventView;
