import React, { useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Flex,
  Heading,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { MdOutlineArrowBack } from 'react-icons/md';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_ALL_SUBMISSIONS } from '../graphql/queries';
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
import CreateTeamModal from '../organisms/TreasureHunt/CreateTreasureTeamModal';
import EditEventModal from '../organisms/TreasureHunt/EditTreasureEventModal';
import EditTeamModal from '../organisms/TreasureHunt/EditTreasureTeamModal';
import MultiTeamTreasureMap from '../organisms/TreasureHunt/MultiTeamTreasureMapVisualization';
import { useAuth } from '../providers/AuthProvider';
import { FaCog } from 'react-icons/fa';
import DiscordSetupModal from '../molecules/TreasureHunt/DiscordSetupModal';
import GameRulesTab from '../organisms/TreasureHunt/TreasureHuntGameRulesTab';
import { useThemeColors } from '../hooks/useThemeColors';
import AdminLaunchChecklist from '../organisms/TreasureHunt/AdminChecklist';
import AdminQuickActionsPanel from '../organisms/TreasureHunt/AdminQuickActions';
import EventStatusBanner from '../organisms/TreasureHunt/EventStatusBanner';
import usePageTitle from '../hooks/usePageTitle';
import LaunchCheckModal from '../organisms/TreasureHunt/LaunchCheckModal';
import EventSummaryPanel from '../organisms/TreasureHunt/EventSummaryPanel';
import DenialReasonModal from '../organisms/TreasureHunt/DenialReasonModal';
import CompleteNodeDialog from '../organisms/TreasureHunt/CompleteNodeDialog';

// Extracted components
import DraftGateView from '../organisms/TreasureHunt/DraftGateView';
import EventHeroStrip from '../organisms/TreasureHunt/EventHeroStrip';
import EventStatBar from '../organisms/TreasureHunt/EventStatBar';
import LeaderboardPanel from '../organisms/TreasureHunt/LeaderboardPanel';
import SubmissionsTab from '../organisms/TreasureHunt/SubmissionsTab';
import EventSettingsTab from '../organisms/TreasureHunt/EventSettingsTab';
import AllNodesTab from '../organisms/TreasureHunt/AllNodesTab';
import AdminLaunchFAQModal from '../organisms/TreasureHunt/AdminLaunchFAQModal';

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
  const {
    isOpen: isNotifPromptOpen,
    onOpen: onNotifPromptOpen,
    onClose: onNotifPromptClose,
  } = useDisclosure();
  const {
    isOpen: isLaunchFAQOpen,
    onOpen: onLaunchFAQOpen,
    onClose: onLaunchFAQClose,
  } = useDisclosure();

  const [nodeToComplete, setNodeToComplete] = useState(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [submissionToDeny, setSubmissionToDeny] = useState(null);
  const [showAllNodesToggle, setShowAllNodesToggle] = useState(true);
  const [highlightedTeamId, setHighlightedTeamId] = useState(null);
  const [nodeSort, setNodeSort] = useState({ col: 'type', dir: 'asc' });
  const [mapGenCooldownLeft, setMapGenCooldownLeft] = useState(0);

  const cancelRef = useRef();

  // ── Queries ────────────────────────────────────────────────────────────────
  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_TREASURE_EVENT, { variables: { eventId } });
  const { data: submissionsData, refetch: refetchSubmissions } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
    pollInterval: 5 * 60 * 1000,
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

  useEffect(() => {
    if (!event?.lastMapGeneratedAt) {
      setMapGenCooldownLeft(0);
      return;
    }
    const COOLDOWN_MS = 60 * 1000;
    const update = () => {
      const elapsed = Date.now() - new Date(event.lastMapGeneratedAt).getTime();
      setMapGenCooldownLeft(Math.max(0, Math.ceil((COOLDOWN_MS - elapsed) / 1000)));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [event?.lastMapGeneratedAt]);

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

  useEffect(() => {
    if (
      isEventAdminOrRef &&
      notificationsSupported &&
      !notificationsEnabled &&
      !localStorage.getItem('treasureHunt_notif_prompt_seen')
    ) {
      const timer = setTimeout(onNotifPromptOpen, 1500);
      return () => clearTimeout(timer);
    }
  }, [isEventAdminOrRef, notificationsSupported, notificationsEnabled, onNotifPromptOpen]);

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
    return <DraftGateView event={event} isAdmin={isEventAdmin} currentColors={currentColors} />;
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

      {/* Admin end-of-event warning */}
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
          <EventHeroStrip
            event={event}
            currentColors={currentColors}
            isEventAdmin={isEventAdmin}
            onEditEventOpen={onEditEventOpen}
            showToast={showToast}
          />

          {/* ── STAT BAR ───────────────────────────────────────────────────── */}
          {event.status !== 'COMPLETED' && (
            <EventStatBar
              event={event}
              teams={teams}
              allPendingIncompleteSubmissionsCount={allPendingIncompleteSubmissionsCount}
              currentColors={currentColors}
            />
          )}

          {(event.status === 'COMPLETED' || event.status === 'ARCHIVED') && (
            <EventSummaryPanel event={event} teams={teams} nodes={event.nodes || []} />
          )}

          {/* ── MAIN BODY: two-column leaderboard + map ─────────────────────── */}
          {event.status !== 'COMPLETED' &&
            (event.nodes && event.nodes.length > 0 ? (
              <Flex
                gap={[0, 0, 0, 6]}
                align="flex-start"
                flexDirection={['column', 'column', 'column', 'row']}
              >
                {/* LEFT: Leaderboard */}
                <LeaderboardPanel
                  sortedTeams={sortedTeams}
                  event={event}
                  currentColors={currentColors}
                  colorMode={colorMode}
                  isEventAdmin={isEventAdmin}
                  onCreateTeamOpen={onCreateTeamOpen}
                  onTeamClick={handleTeamCardClick}
                  onEditTeam={handleEditTeam}
                  userDiscordId={user?.discordUserId}
                />

                {/* RIGHT: Map */}
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
                  <Heading size="sm" color={currentColors.textColor} mb={3}>
                    🏆 Leaderboard
                  </Heading>
                  <LeaderboardPanel
                    sortedTeams={sortedTeams}
                    event={event}
                    currentColors={currentColors}
                    colorMode={colorMode}
                    isEventAdmin={isEventAdmin}
                    onCreateTeamOpen={onCreateTeamOpen}
                    onTeamClick={handleTeamCardClick}
                    onEditTeam={handleEditTeam}
                    userDiscordId={user?.discordUserId}
                  />
                </Box>
              )
            ))}

          {/* ── TABS ────────────────────────────────────────────────────────── */}
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
                    <SubmissionsTab
                      allSubmissions={allSubmissions}
                      event={event}
                      currentColors={currentColors}
                      colorMode={colorMode}
                      isEventAdmin={isEventAdmin}
                      setSubmissionToDeny={setSubmissionToDeny}
                      onDenialModalOpen={onDenialModalOpen}
                      setNodeToComplete={setNodeToComplete}
                      onOpenCompleteDialog={onOpenCompleteDialog}
                      handleReviewSubmission={handleReviewSubmission}
                    />
                  </TabPanel>
                )}

                {/* EVENT SETTINGS */}
                {isEventAdmin && (
                  <TabPanel>
                    <EventSettingsTab
                      event={event}
                      eventId={eventId}
                      currentColors={currentColors}
                      colorMode={colorMode}
                      notificationsSupported={notificationsSupported}
                      notificationsEnabled={notificationsEnabled}
                      notificationPermission={notificationPermission}
                      requestNotificationPermission={requestNotificationPermission}
                      disableNotifications={disableNotifications}
                      handleGenerateMap={handleGenerateMap}
                      generateLoading={generateLoading}
                      mapGenCooldownLeft={mapGenCooldownLeft}
                      onCreateTeamOpen={onCreateTeamOpen}
                      onDiscordSetupOpen={onDiscordSetupOpen}
                    />
                  </TabPanel>
                )}

                {/* GAME RULES */}
                <TabPanel px={0}>
                  <GameRulesTab colorMode={colorMode} currentColors={currentColors} event={event} />
                </TabPanel>

                {/* ALL NODES */}
                {isEventAdminOrRef && event.nodes?.length > 0 && (
                  <TabPanel px={0}>
                    <AllNodesTab
                      nodes={sortedNodes}
                      nodeSort={nodeSort}
                      onSort={handleNodeSort}
                      currentColors={currentColors}
                      colorMode={colorMode}
                    />
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
          mapGenCooldownLeft={mapGenCooldownLeft}
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
          onOpenLaunchFAQ={onLaunchFAQOpen}
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
        eventStatus={event?.status}
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
          onLaunchFAQOpen();
        }}
      />

      <AdminLaunchFAQModal
        isOpen={isLaunchFAQOpen}
        onClose={onLaunchFAQClose}
        currentColors={currentColors}
        colorMode={colorMode}
      />

      {/* One-time notification prompt for admins/refs */}
      <Modal isOpen={isNotifPromptOpen} onClose={onNotifPromptClose} isCentered size="md">
        <ModalOverlay />
        <ModalContent bg={currentColors.cardBg}>
          <ModalCloseButton
            onClick={() => {
              localStorage.setItem('treasureHunt_notif_prompt_seen', 'true');
              onNotifPromptClose();
            }}
          />
          <ModalHeader color={currentColors.textColor}>🔔 Submission Notifications</ModalHeader>
          <ModalBody>
            <VStack align="start" spacing={3}>
              <Text color={currentColors.textColor}>
                As an admin or ref, you can get browser notifications whenever a new submission
                comes in, so you don't have to keep the tab open and watching.
              </Text>
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                You can also enable sound alerts and manage this in the Event Settings tab.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.setItem('treasureHunt_notif_prompt_seen', 'true');
                onNotifPromptClose();
              }}
            >
              Maybe later
            </Button>
            <Button
              colorScheme="blue"
              onClick={async () => {
                localStorage.setItem('treasureHunt_notif_prompt_seen', 'true');
                onNotifPromptClose();
                await requestNotificationPermission();
              }}
            >
              Enable Notifications
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default TreasureEventView;
