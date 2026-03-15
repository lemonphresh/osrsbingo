import React, { useState, useMemo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { CHECK_DISCORD_CHANNELS, GET_TREASURE_ACTIVITIES } from '../../graphql/queries';
import {
  ADMIN_UNCOMPLETE_NODE,
  ADMIN_SILENT_RE_COMPLETE_NODE,
  ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS,
  ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY,
  ADMIN_REFUND_INN_PURCHASE,
} from '../../graphql/mutations';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  IconButton,
  Button,
  Badge,
  Collapse,
  Tooltip,
  Divider,
  SimpleGrid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useClipboard,
  Avatar,
  Switch,
} from '@chakra-ui/react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  SettingsIcon,
  ViewIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
} from '@chakra-ui/icons';
import {
  FaCog,
  FaClipboardList,
  FaUsers,
  FaTrophy,
  FaExclamationTriangle,
  FaChartLine,
  FaDiscord,
  FaEyeSlash,
  FaQuestionCircle,
  FaUserCheck,
  FaUserTimes,
  FaHistory,
  FaUnlock,
  FaBook,
  FaUndo,
  FaRedoAlt,
  FaKey,
} from 'react-icons/fa';

// Copy button as its own component so useClipboard can be called per-item
const CopyIdButton = ({ id }) => {
  const { onCopy, hasCopied } = useClipboard(id);
  return (
    <Tooltip label={hasCopied ? 'Copied!' : 'Copy Discord ID'} hasArrow placement="top">
      <IconButton
        size="xs"
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        onClick={onCopy}
        variant="ghost"
        color={hasCopied ? 'green.400' : 'gray.500'}
        _hover={{ color: 'white' }}
        aria-label="Copy Discord ID"
      />
    </Tooltip>
  );
};

const AdminQuickActionsPanel = ({
  event,
  teams = [],
  submissions = [],
  onNavigateToSubmissions,
  onNavigateToTeams,
  onOpenSettings,
  onOpenDiscordSetup,
  onOpenLaunchFAQ,
  isEventAdmin = false,
  onRefreshEvent,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    isOpen: isUnverifiedOpen,
    onOpen: onUnverifiedOpen,
    onClose: onUnverifiedClose,
  } = useDisclosure();
  const {
    isOpen: isChannelCheckOpen,
    onOpen: onChannelCheckOpen,
    onClose: onChannelCheckClose,
  } = useDisclosure();
  const {
    isOpen: isMoveHistoryOpen,
    onOpen: onMoveHistoryOpen,
    onClose: onMoveHistoryClose,
  } = useDisclosure();
  const {
    isOpen: isFullHistoryOpen,
    onOpen: onFullHistoryOpen,
    onClose: onFullHistoryClose,
  } = useDisclosure();
  const {
    isOpen: isUnlockHistoryOpen,
    onOpen: onUnlockHistoryOpen,
    onClose: onUnlockHistoryClose,
  } = useDisclosure();
  const {
    isOpen: isInnRefundOpen,
    onOpen: onInnRefundOpen,
    onClose: onInnRefundClose,
  } = useDisclosure();
  const {
    isOpen: isGpSplitOpen,
    onOpen: onGpSplitOpen,
    onClose: onGpSplitClose,
  } = useDisclosure();

  const [checkChannels, { data: channelCheckData, loading: channelCheckLoading }] = useLazyQuery(
    CHECK_DISCORD_CHANNELS,
    { fetchPolicy: 'network-only' }
  );
  const [fetchActivities, { loading: activitiesLoading }] = useLazyQuery(GET_TREASURE_ACTIVITIES, {
    fetchPolicy: 'network-only',
  });
  const [adminUncompleteNode] = useMutation(ADMIN_UNCOMPLETE_NODE);
  const [adminSilentReComplete] = useMutation(ADMIN_SILENT_RE_COMPLETE_NODE);
  const [adminRefundInnPurchase] = useMutation(ADMIN_REFUND_INN_PURCHASE);
  const [refundingInn, setRefundingInn] = useState(null); // `${teamId}:${nodeId}`
  const [locallyRefunded, setLocallyRefunded] = useState(new Set());
  // const [adminRestoreSiblings] = useMutation(ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS);
  // const [adminRepairAll] = useMutation(ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY);
  const [uncomletingId, setUncompletingId] = useState(null);
  const [reCompletingId, setReCompletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  // const [repairing, setRepairing] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [activitiesOffset, setActivitiesOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [unlockTimeUtc, setUnlockTimeUtc] = useState(false);
  const [fullHistoryUtc, setFullHistoryUtc] = useState(false);
  const [rewriteHistoryUtc, setRewriteHistoryUtc] = useState(false);
  const [fullHistoryTeamFilter, setFullHistoryTeamFilter] = useState(null); // null = all teams
  // Local override: track nodes uncompleted this session so the UI updates instantly
  // even if the parent's Apollo cache hasn't re-rendered yet
  const [locallyUncompleted, setLocallyUncompleted] = useState(new Set());
  const [locallyReCompleted, setLocallyReCompleted] = useState(new Set());
  const [awardRemainder, setAwardRemainder] = useState(false);
  const [splitTopTwo, setSplitTopTwo] = useState(false);
  const PAGE_SIZE = 50;

  const handleOpenFullHistory = () => {
    setAllActivities([]);
    setActivitiesOffset(0);
    setHasMore(true);
    setFullHistoryTeamFilter(null);
    fetchActivities({ variables: { eventId: event.eventId, limit: PAGE_SIZE, offset: 0 } }).then(
      ({ data }) => {
        const results = data?.getTreasureActivities ?? [];
        setAllActivities(results);
        setHasMore(results.length === PAGE_SIZE);
      }
    );
    onFullHistoryOpen();
  };

  const handleOpenMoveHistory = () => {
    setAllActivities([]);
    setActivitiesOffset(0);
    setHasMore(true);
    setLocallyUncompleted(new Set());
    fetchActivities({ variables: { eventId: event.eventId, limit: PAGE_SIZE, offset: 0 } }).then(
      ({ data }) => {
        const results = data?.getTreasureActivities ?? [];
        setAllActivities(results);
        setHasMore(results.length === PAGE_SIZE);
      }
    );
    onMoveHistoryOpen();
  };

  const handleLoadMore = () => {
    const nextOffset = activitiesOffset + PAGE_SIZE;
    fetchActivities({
      variables: { eventId: event.eventId, limit: PAGE_SIZE, offset: nextOffset },
    }).then(({ data }) => {
      const results = data?.getTreasureActivities ?? [];
      setAllActivities((prev) => [...prev, ...results]);
      setActivitiesOffset(nextOffset);
      setHasMore(results.length === PAGE_SIZE);
    });
  };

  const handleUncomplete = async (teamId, nodeId) => {
    const key = `${teamId}:${nodeId}`;
    setUncompletingId(key);
    try {
      await adminUncompleteNode({ variables: { eventId: event.eventId, teamId, nodeId } });
      // Immediately mark as uncompleted locally so the UI updates before Apollo cache refreshes
      setLocallyUncompleted((prev) => new Set([...prev, key]));
      // Refresh event (teams data) and activity list in parallel
      await Promise.all([
        onRefreshEvent?.(),
        fetchActivities({
          variables: { eventId: event.eventId, limit: activitiesOffset + PAGE_SIZE, offset: 0 },
        }).then(({ data }) => {
          setAllActivities(data?.getTreasureActivities ?? []);
          setLocallyUncompleted(new Set());
        }),
      ]);
    } finally {
      setUncompletingId(null);
    }
  };

  const handleSilentReComplete = async (teamId, nodeId) => {
    const key = `${teamId}:${nodeId}`;
    setReCompletingId(key);
    try {
      await adminSilentReComplete({ variables: { eventId: event.eventId, teamId, nodeId } });
      // Optimistically hide from Uncomplete History before data refreshes (prevents scroll jump)
      setLocallyReCompleted((prev) => new Set([...prev, key]));
      await Promise.all([
        onRefreshEvent?.(),
        fetchActivities({
          variables: { eventId: event.eventId, limit: activitiesOffset + PAGE_SIZE, offset: 0 },
        }).then(({ data }) => {
          setAllActivities(data?.getTreasureActivities ?? []);
          setLocallyReCompleted(new Set());
        }),
      ]);
    } finally {
      setReCompletingId(null);
    }
  };

  // const handleRestoreSiblings = async (teamId, nodeId) => {
  //   const key = `${teamId}:${nodeId}`;
  //   setRestoringId(key);
  //   try {
  //     await adminRestoreSiblings({ variables: { eventId: event.eventId, teamId, nodeId } });
  //   } finally {
  //     setRestoringId(null);
  //   }
  // };

  // const handleRepairAll = async () => {
  //   setRepairing(true);
  //   try {
  //     await adminRepairAll({ variables: { eventId: event.eventId } });
  //   } finally {
  //     setRepairing(false);
  //   }
  // };

  const handleRefundInn = async (teamId, nodeId) => {
    const key = `${teamId}:${nodeId}`;
    setRefundingInn(key);
    try {
      await adminRefundInnPurchase({ variables: { eventId: event.eventId, teamId, nodeId } });
      setLocallyRefunded((prev) => new Set([...prev, key]));
      await onRefreshEvent?.();
    } finally {
      setRefundingInn(null);
    }
  };

  const handleOpenChannelCheck = () => {
    const guildId = event?.discordConfig?.guildId;
    if (guildId) {
      checkChannels({ variables: { guildId, eventId: event.eventId } });
    }
    onChannelCheckOpen();
  };

  const stats = useMemo(() => {
    if (!isEventAdmin || !event || event.status === 'DRAFT') {
      return {};
    }

    const pendingSubmissions = submissions.filter((s) => {
      if (s.status !== 'PENDING_REVIEW') return false;
      const team = teams.find((t) => t.teamId === s.teamId);
      if (team?.completedNodes?.includes(s.nodeId)) {
        return false;
      }
      return true;
    });

    const activeTeams = teams.filter((t) => t.completedNodes?.length > 0);
    const inactiveTeams = teams.filter((t) => !t.completedNodes || t.completedNodes.length === 0);
    const leadingTeam = [...teams].sort((a, b) => (b.currentPot || 0) - (a.currentPot || 0))[0];
    const teamsWithoutMembers = teams.filter((t) => !t.members || t.members.length === 0);

    const allMembers = teams.flatMap((t) => t.members || []);
    const verifiedMembers = allMembers.filter((m) => m.username);
    const unverifiedMembers = allMembers.filter((m) => !m.username);

    const unverifiedByTeam = teams
      .map((t) => ({
        teamId: t.teamId,
        teamName: t.teamName,
        members: (t.members || []).filter((m) => !m.username),
      }))
      .filter((t) => t.members.length > 0);

    return {
      pending: pendingSubmissions.length,
      activeTeams: activeTeams.length,
      inactiveTeams: inactiveTeams.length,
      totalTeams: teams.length,
      leadingTeam,
      teamsWithoutMembers: teamsWithoutMembers.length,
      verified: verifiedMembers.length,
      unverified: unverifiedMembers.length,
      totalMembers: allMembers.length,
      unverifiedByTeam,
    };
  }, [event, isEventAdmin, submissions, teams]);

  const allMentions = (stats.unverifiedByTeam || [])
    .flatMap((t) => t.members)
    .map((m) => `<@${m.discordUserId}>`)
    .join(' ');
  const { onCopy: onCopyAll, hasCopied: hasCopiedAll } = useClipboard(allMentions);

  if (!isEventAdmin || !event || event.status === 'DRAFT') {
    return null;
  }

  const isPostEvent = event.status === 'COMPLETED' || event.status === 'ARCHIVED';

  const fmtGp = (n) => {
    const v = Number(n);
    if (!v) return '0';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}k`;
    return `${v}`;
  };

  const gpSplitModal = (() => {
    const prizePoolTotal = Number(event?.eventConfig?.prize_pool_total || 0);
    const totalEarned = teams.reduce((sum, t) => sum + Number(t.currentPot || 0), 0);
    const prizePoolLeftover = prizePoolTotal > 0 ? Math.max(0, prizePoolTotal - totalEarned) : 0;
    const sortedTeams = [...teams].sort((a, b) => Number(b.currentPot || 0) - Number(a.currentPot || 0));
    const leadingTeamId = sortedTeams[0]?.teamId;
    const isTopTied =
      sortedTeams.length >= 2 &&
      Number(sortedTeams[0]?.currentPot || 0) === Number(sortedTeams[1]?.currentPot || 0);
    const topTwoIds = isTopTied
      ? new Set([sortedTeams[0]?.teamId, sortedTeams[1]?.teamId])
      : new Set();

    return (
      <Modal isOpen={isGpSplitOpen} onClose={onGpSplitClose} scrollBehavior="inside" size="md">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaTrophy} color="yellow.400" />
              <Text>GP Split Calculator</Text>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Current pot divided equally among team members.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {teams.length === 0 ? (
              <Text color="gray.500" fontSize="sm">No teams.</Text>
            ) : (
              <VStack align="stretch" spacing={3}>
                {sortedTeams.map((team) => {
                  const isLeader = team.teamId === leadingTeamId;
                  const isTopTwo = topTwoIds.has(team.teamId);
                  const basePot = Number(team.currentPot || 0);
                  const pot =
                    isLeader && awardRemainder
                      ? basePot + prizePoolLeftover
                      : splitTopTwo && isTopTwo
                      ? basePot + Math.floor(prizePoolLeftover / 2)
                      : basePot;
                  const memberCount = (team.members || []).length;
                  const perMember = memberCount > 0 ? Math.floor(pot / memberCount) : 0;
                  return (
                    <Box
                      key={team.teamId}
                      p={3}
                      bg="gray.700"
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderLeftColor={
                        isLeader && awardRemainder
                          ? 'green.400'
                          : splitTopTwo && isTopTwo
                          ? 'blue.400'
                          : 'yellow.400'
                      }
                    >
                      <HStack justify="space-between" mb={1}>
                        <HStack spacing={2}>
                          <Text fontWeight="semibold" fontSize="sm">{team.teamName}</Text>
                          {isLeader && awardRemainder && (
                            <Badge colorScheme="green" fontSize="xs">+leftover</Badge>
                          )}
                          {splitTopTwo && isTopTwo && (
                            <Badge colorScheme="blue" fontSize="xs">+½ leftover</Badge>
                          )}
                        </HStack>
                        <Badge colorScheme="yellow">{pot.toLocaleString()} gp total</Badge>
                      </HStack>
                      <HStack justify="space-between" mb={memberCount > 0 ? 2 : 0}>
                        <Text fontSize="xs" color="gray.400">
                          {memberCount} member{memberCount !== 1 ? 's' : ''}
                        </Text>
                        <Text fontSize="sm" color="yellow.300" fontWeight="semibold">
                          {memberCount > 0 ? `${fmtGp(perMember)} gp each` : '—'}
                        </Text>
                      </HStack>
                      {memberCount > 0 && (
                        <VStack align="stretch" spacing={0.5}>
                          {(team.members || []).map((m) => (
                            <HStack
                              key={m.discordUserId}
                              justify="space-between"
                              px={1}
                              py={0.5}
                              borderRadius="sm"
                              _hover={{ bg: 'whiteAlpha.50' }}
                            >
                              <Text fontSize="xs" color="gray.300">
                                {m.username || m.discordUsername || m.discordUserId}
                              </Text>
                              <Text fontSize="xs" color="gray.400" fontFamily="mono">
                                {fmtGp(perMember)} gp
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  );
                })}

                {prizePoolTotal > 0 && (
                  <Box p={3} bg="gray.750" borderRadius="md" borderTop="2px solid" borderColor="gray.600">
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.400">Total prize pool</Text>
                        <Text fontSize="xs" color="gray.300" fontFamily="mono">{fmtGp(prizePoolTotal)} gp</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.400">Awarded to teams</Text>
                        <Text fontSize="xs" color="gray.300" fontFamily="mono">{fmtGp(totalEarned)} gp</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" color={prizePoolLeftover > 0 ? 'yellow.300' : 'gray.400'} fontWeight="semibold">
                          Leftover
                        </Text>
                        <Text fontSize="xs" color={prizePoolLeftover > 0 ? 'yellow.300' : 'gray.400'} fontFamily="mono" fontWeight="semibold">
                          {fmtGp(prizePoolLeftover)} gp
                        </Text>
                      </HStack>
                      {prizePoolLeftover > 0 && (
                        <VStack align="stretch" spacing={1} pt={1} borderTop="1px solid" borderColor="whiteAlpha.100">
                          <HStack justify="space-between">
                            <Text fontSize="xs" color="gray.300">Award leftover to leading team</Text>
                            <Switch
                              size="sm"
                              colorScheme="green"
                              isChecked={awardRemainder}
                              onChange={(e) => {
                                setAwardRemainder(e.target.checked);
                                if (e.target.checked) setSplitTopTwo(false);
                              }}
                            />
                          </HStack>
                          {isTopTied && (
                            <HStack justify="space-between">
                              <Text fontSize="xs" color="gray.300">Split leftover between tied #1 teams</Text>
                              <Switch
                                size="sm"
                                colorScheme="blue"
                                isChecked={splitTopTwo}
                                onChange={(e) => {
                                  setSplitTopTwo(e.target.checked);
                                  if (e.target.checked) setAwardRemainder(false);
                                }}
                              />
                            </HStack>
                          )}
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  })();

  if (isPostEvent) {
    return (
      <>
        <Box
          position="fixed"
          bottom={4}
          left={4}
          zIndex={1500}
          width={isMinimized ? 'auto' : '260px'}
          maxW="calc(100vw - 32px)"
          bg="gray.800"
          borderRadius="lg"
          boxShadow="2xl"
          border="2px solid"
          borderColor="teal.600"
          overflow="hidden"
          transition="all 0.3s ease"
        >
          <HStack
            p={3}
            bg="teal.700"
            justify="space-between"
            cursor="pointer"
            onClick={() => setIsMinimized(!isMinimized)}
            _hover={{ opacity: 0.9 }}
          >
            <HStack spacing={2}>
              <Icon as={FaCog} color="white" />
              <Text fontWeight="semibold" color="white" fontSize="sm">
                Post-Event Tools
              </Text>
            </HStack>
            <IconButton
              icon={isMinimized ? <ChevronUpIcon /> : <ChevronDownIcon />}
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              aria-label={isMinimized ? 'Expand' : 'Minimize'}
              onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            />
          </HStack>
          <Collapse in={!isMinimized} animateOpacity>
            <VStack p={3} spacing={2} align="stretch">
              <Button
                size="sm"
                leftIcon={<Icon as={FaTrophy} />}
                colorScheme="yellow"
                variant="outline"
                onClick={onGpSplitOpen}
              >
                GP Split Calculator
              </Button>
              <Button
                size="sm"
                leftIcon={<Icon as={FaBook} />}
                colorScheme="teal"
                variant="outline"
                onClick={handleOpenFullHistory}
              >
                Comprehensive History
              </Button>
            </VStack>
          </Collapse>
        </Box>
        {gpSplitModal}
        {/* Full History Modal */}
        <Modal
          isOpen={isFullHistoryOpen}
          onClose={onFullHistoryClose}
          scrollBehavior="inside"
          size="xl"
        >
          <ModalOverlay />
          <ModalContent
            bg="gray.800"
            color="white"
            maxH={{ base: '90dvh', md: '85vh' }}
            overflowY="auto"
          >
            <ModalHeader pb={2}>
              <HStack justify="space-between" align="start" mr={8}>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2}>
                    <Icon as={FaBook} color="teal.400" />
                    <Text>Comprehensive Move History</Text>
                  </HStack>
                  <HStack spacing={1}>
                    <Button
                      size="xs"
                      variant={!fullHistoryUtc ? 'solid' : 'outline'}
                      colorScheme={!fullHistoryUtc ? 'teal' : 'gray'}
                      color={!fullHistoryUtc ? 'white' : 'gray.300'}
                      onClick={() => setFullHistoryUtc(false)}
                    >
                      Local
                    </Button>
                    <Button
                      size="xs"
                      variant={fullHistoryUtc ? 'solid' : 'outline'}
                      colorScheme={fullHistoryUtc ? 'teal' : 'gray'}
                      color={fullHistoryUtc ? 'white' : 'gray.300'}
                      onClick={() => setFullHistoryUtc(true)}
                    >
                      UTC
                    </Button>
                  </HStack>
                </VStack>
                <HStack spacing={1} flexWrap="wrap" justify="flex-end" flex={1} ml={3}>
                  <Button
                    size="xs"
                    variant={fullHistoryTeamFilter === null ? 'solid' : 'outline'}
                    colorScheme={fullHistoryTeamFilter === null ? 'teal' : 'gray'}
                    color={fullHistoryTeamFilter === null ? 'white' : 'gray.300'}
                    onClick={() => setFullHistoryTeamFilter(null)}
                  >
                    All
                  </Button>
                  {teams.map((t) => (
                    <Button
                      key={t.teamId}
                      size="xs"
                      variant={fullHistoryTeamFilter === t.teamId ? 'solid' : 'outline'}
                      colorScheme={fullHistoryTeamFilter === t.teamId ? 'teal' : 'gray'}
                      color={fullHistoryTeamFilter === t.teamId ? 'white' : 'gray.300'}
                      onClick={() =>
                        setFullHistoryTeamFilter((prev) => (prev === t.teamId ? null : t.teamId))
                      }
                    >
                      {t.teamName}
                    </Button>
                  ))}
                </HStack>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { height: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
                '&::-webkit-scrollbar-thumb': { background: '#abb8ceff', borderRadius: '10px' },
                scrollbarWidth: 'thin',
                scrollbarColor: '#abb8ceff transparent',
              }}
              pb={4}
            >
              {(() => {
                const fmtGpLocal = (gp) => {
                  const n = Number(gp);
                  if (!n) return null;
                  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M gp`;
                  if (n >= 1_000) return `${Math.round(n / 1_000)}K gp`;
                  return `${n} gp`;
                };

                const keyColorScheme = {
                  bronze: 'orange', silver: 'gray', gold: 'yellow',
                  green: 'green', blue: 'blue', red: 'red', purple: 'purple',
                };

                const activityConfig = {
                  node_completed: { label: 'Completed', color: 'green.500', scheme: 'green', icon: FaHistory },
                  node_uncompleted: { label: 'Uncompleted', color: 'red.400', scheme: 'red', icon: FaUndo },
                  node_recompleted: { label: 'Re-completed', color: 'yellow.400', scheme: 'yellow', icon: FaRedoAlt },
                  inn_visited: { label: 'Inn', color: 'purple.400', scheme: 'purple', icon: FaKey },
                  inn_refunded: { label: 'Inn Refunded', color: 'orange.400', scheme: 'orange', icon: FaUndo },
                  gp_gained: { label: 'GP Gained', color: 'yellow.300', scheme: 'yellow', icon: FaHistory },
                };

                const SKIP_TYPES = new Set(['gp_gained']);
                const filtered = allActivities
                  .filter((a) => !SKIP_TYPES.has(a.type))
                  .filter((a) => (fullHistoryTeamFilter ? a.teamId === fullHistoryTeamFilter : true));

                if (activitiesLoading && filtered.length === 0) {
                  return <VStack py={6}><Text color="gray.400" fontSize="sm">Loading…</Text></VStack>;
                }
                if (filtered.length === 0) {
                  return <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>No activity recorded yet.</Text>;
                }

                const byDate = {};
                filtered.forEach((a) => {
                  const d = new Date(a.timestamp);
                  const dateKey = fullHistoryUtc
                    ? d.toISOString().slice(0, 10)
                    : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                  if (!byDate[dateKey]) byDate[dateKey] = [];
                  byDate[dateKey].push(a);
                });

                return (
                  <VStack align="stretch" spacing={4}>
                    {Object.entries(byDate).map(([date, entries]) => (
                      <Box key={date}>
                        <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wide" mb={2}>{date}</Text>
                        <VStack align="stretch" spacing={1}>
                          {entries.map((a) => {
                            const team = teams.find((t) => t.teamId === a.teamId);
                            const cfg = activityConfig[a.type] ?? { label: a.type, color: 'gray.500', scheme: 'gray', icon: FaHistory };
                            const timeStr = fullHistoryUtc
                              ? new Date(a.timestamp).toISOString().slice(11, 16) + ' UTC'
                              : new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            const pills = [];
                            const gp = a.data?.reward || a.data?.gpRemoved || a.data?.gpRestored || a.data?.gpEarned || a.data?.amount;
                            const gpStr = fmtGpLocal(gp);
                            if (gpStr) {
                              const isNegative = a.type === 'node_uncompleted';
                              pills.push(<Badge key="gp" colorScheme="yellow" variant="subtle" fontSize="xs">{isNegative ? '−' : '+'}{gpStr}</Badge>);
                            }
                            (a.data?.keyRewards || a.data?.keysRestored || []).forEach((k, i) => {
                              if (!k?.color || !k?.quantity) return;
                              pills.push(<Badge key={`kg-${i}`} colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'} variant="subtle" fontSize="xs">+{k.quantity}</Badge>);
                            });
                            (a.data?.keysRemoved || []).forEach((k, i) => {
                              if (!k?.color || !k?.quantity) return;
                              pills.push(<Badge key={`kr-${i}`} colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'} variant="outline" fontSize="xs">−{k.quantity}</Badge>);
                            });
                            (a.data?.keysSpent || []).forEach((k, i) => {
                              if (!k?.color || !k?.quantity) return;
                              pills.push(<Badge key={`ks-${i}`} colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'} variant="outline" fontSize="xs">−{k.quantity}</Badge>);
                            });
                            (a.data?.buffRewards || a.data?.buffsRestored || a.data?.buffsEarned || []).forEach((b, i) => {
                              const name = b?.buffType || b?.name || b;
                              if (!name) return;
                              pills.push(<Badge key={`bg-${i}`} colorScheme="purple" variant="subtle" fontSize="xs">+{name}</Badge>);
                            });
                            (a.data?.consumedBuffs || []).forEach((b, i) => {
                              pills.push(<Badge key={`bc-${i}`} colorScheme="red" variant="outline" fontSize="xs">{b} already used</Badge>);
                            });

                            const nodeName = a.data?.nodeTitle || a.data?.innName || a.data?.nodeId || a.data?.innId || '—';

                            return (
                              <Box key={a.id} p={2} bg="gray.700" borderRadius="md" borderLeft="3px solid" borderLeftColor={cfg.color}>
                                <HStack spacing={2} align="flex-start">
                                  <Text fontSize="xs" color="gray.500" flexShrink={0} w="50px" pt="2px">{timeStr}</Text>
                                  <VStack align="start" spacing={1} minW="110px">
                                    <Badge bg="gray.600" color="gray.300" fontSize="xs" flexShrink={0}>{team?.teamName ?? a.teamId}</Badge>
                                    <Badge colorScheme={cfg.scheme} fontSize="xs" flexShrink={0} alignSelf="flex-start">{cfg.label}</Badge>
                                  </VStack>
                                  <VStack align="start" spacing={1} flex={1} minW={0}>
                                    <HStack spacing={1} flexWrap="nowrap" minW={0}>
                                      <Text fontSize="sm" fontWeight="medium" noOfLines={1} flex={1} minW={0}>{nodeName}</Text>
                                    </HStack>
                                    {pills.length > 0 && <HStack spacing={1} flexWrap="wrap">{pills}</HStack>}
                                  </VStack>
                                </HStack>
                              </Box>
                            );
                          })}
                        </VStack>
                      </Box>
                    ))}
                    {hasMore && (
                      <Button size="sm" variant="outline" colorScheme="gray" color="gray.300" isLoading={activitiesLoading} onClick={handleLoadMore} mt={2}>
                        Load older entries
                      </Button>
                    )}
                  </VStack>
                );
              })()}
            </ModalBody>
          </ModalContent>
        </Modal>
      </>
    );
  }

  const hasUrgentItems = stats.pending > 0 || stats.teamsWithoutMembers > 0;

  const QuickStat = ({ label, value, icon, color, onClick, tooltip }) => (
    <Tooltip label={tooltip} hasArrow isDisabled={!tooltip}>
      <Box
        p={3}
        bg="gray.700"
        borderRadius="md"
        cursor={onClick ? 'pointer' : 'default'}
        onClick={onClick}
        transition="all 0.2s"
        _hover={onClick ? { transform: 'translateY(-2px)', shadow: 'md' } : {}}
        borderLeft="3px solid"
        borderLeftColor={color}
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Text fontSize="2xl" fontWeight="semibold" color="white">
              {value}
            </Text>
            <Text fontSize="xs" color="gray.300">
              {label}
            </Text>
          </VStack>
          <Icon as={icon} boxSize={5} color={color} />
        </HStack>
      </Box>
    </Tooltip>
  );

  return (
    <>
      <Box
        position="fixed"
        bottom={4}
        left={4}
        zIndex={1500}
        width={isMinimized ? 'auto' : isExpanded ? '350px' : '280px'}
        maxW="calc(100vw - 32px)"
        bg="gray.800"
        borderRadius="lg"
        boxShadow="2xl"
        border="2px solid"
        borderColor={hasUrgentItems ? 'orange.400' : 'orange.500'}
        transition="all 0.3s ease"
      >
        {/* Header */}
        <HStack
          p={3}
          bg={hasUrgentItems ? 'orange.500' : 'orange.600'}
          justify="space-between"
          cursor="pointer"
          onClick={() => setIsMinimized(!isMinimized)}
          _hover={{ opacity: 0.9 }}
        >
          <HStack spacing={2}>
            <Icon as={FaCog} color="white" />
            <Text fontWeight="semibold" color="white" fontSize="sm">
              Admin Panel
            </Text>
            {hasUrgentItems && !isMinimized && (
              <Badge colorScheme="red" fontSize="xs" variant="solid">
                {stats.pending > 0 ? `${stats.pending} pending` : 'Action needed'}
              </Badge>
            )}
          </HStack>

          <HStack spacing={1}>
            {!isMinimized && (
              <Tooltip
                label={isExpanded ? 'Show less details' : 'Show more details'}
                hasArrow
                placement="top"
              >
                <IconButton
                  icon={isExpanded ? <FaEyeSlash /> : <ViewIcon />}
                  size="xs"
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                />
              </Tooltip>
            )}
            <Tooltip
              label={isMinimized ? 'Expand panel' : 'Minimize panel'}
              hasArrow
              placement="top"
            >
              <IconButton
                icon={isMinimized ? <ChevronUpIcon /> : <ChevronDownIcon />}
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                aria-label={isMinimized ? 'Expand' : 'Minimize'}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Content */}
        <Collapse in={!isMinimized} animateOpacity>
          <VStack p={3} spacing={3} align="stretch">
            {/* Quick Stats Grid */}
            <SimpleGrid columns={2} spacing={2}>
              <QuickStat
                label="Pending"
                value={stats.pending}
                icon={FaClipboardList}
                color={stats.pending > 0 ? 'orange.400' : 'green.400'}
                onClick={onNavigateToSubmissions}
                tooltip="Click to review submissions"
              />
              <QuickStat
                label="Active Teams"
                value={`${stats.activeTeams}/${stats.totalTeams}`}
                icon={FaUsers}
                color="blue.400"
                onClick={onNavigateToTeams}
                tooltip="Teams that have started playing"
              />
            </SimpleGrid>

            {/* Expanded Stats */}
            <Collapse in={isExpanded} animateOpacity>
              <VStack spacing={2} align="stretch">
                <Divider borderColor="gray.600" />

                {/* Member verification */}
                {stats.totalMembers > 0 && (
                  <Box p={2} bg="gray.700" borderRadius="md">
                    <Text fontSize="xs" fontWeight="semibold" color="gray.300" mb={2}>
                      MEMBER VERIFICATION
                    </Text>
                    <HStack justify="space-between" fontSize="xs">
                      <HStack>
                        <Icon as={FaUserCheck} color="green.400" boxSize={3} />
                        <Text color="white">Verified (site account)</Text>
                      </HStack>
                      <Text color="green.400" fontWeight="semibold">
                        {stats.verified}
                      </Text>
                    </HStack>
                    <HStack justify="space-between" fontSize="xs" mt={1}>
                      <HStack>
                        <Icon as={FaUserTimes} color="yellow.400" boxSize={3} />
                        <Text color="white">Unverified (Discord only)</Text>
                      </HStack>
                      <Text color="yellow.400" fontWeight="semibold">
                        {stats.unverified}
                      </Text>
                    </HStack>
                  </Box>
                )}

                {/* Leading team */}
                {stats.leadingTeam && (
                  <Box p={2} bg="gray.700" borderRadius="md">
                    <Text fontSize="xs" fontWeight="semibold" color="gray.300" mb={1}>
                      LEADING TEAM
                    </Text>
                    <HStack justify="space-between">
                      <HStack>
                        <Icon as={FaTrophy} color="yellow.400" boxSize={4} />
                        <Text fontSize="sm" fontWeight="semibold" color="white">
                          {stats.leadingTeam.teamName}
                        </Text>
                      </HStack>
                      <Badge colorScheme="green">
                        {((stats.leadingTeam.currentPot || 0) / 1000000).toFixed(1)}M GP
                      </Badge>
                    </HStack>
                  </Box>
                )}

                {/* Warnings */}
                {stats.teamsWithoutMembers > 0 && (
                  <Box
                    p={2}
                    bg="orange.900"
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="orange.400"
                  >
                    <HStack>
                      <Icon as={FaExclamationTriangle} color="orange.400" boxSize={4} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" fontWeight="semibold" color="white">
                          {stats.teamsWithoutMembers} team
                          {stats.teamsWithoutMembers !== 1 ? 's' : ''} without members
                        </Text>
                        <Text fontSize="xs" color="gray.300">
                          Players can't join these teams
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}

                {stats.inactiveTeams > 0 && stats.inactiveTeams < stats.totalTeams && (
                  <Box
                    p={2}
                    bg="blue.900"
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="blue.400"
                  >
                    <HStack>
                      <Icon as={FaChartLine} color="blue.400" boxSize={4} />
                      <VStack align="start" spacing={0}>
                        <Text fontSize="xs" fontWeight="semibold" color="white">
                          {stats.inactiveTeams} team{stats.inactiveTeams !== 1 ? 's' : ''} haven't
                          started
                        </Text>
                        <Text fontSize="xs" color="gray.300">
                          No completions yet
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>
                )}
              </VStack>
            </Collapse>

            <Divider borderColor="gray.600" />

            {/* Quick Actions */}
            <HStack spacing={2} justify="center">
              <Menu placement="top-start">
                <MenuButton
                  size="sm"
                  variant="outline"
                  alignItems="center"
                  justifyContent="center"
                  display="flex"
                  color="gray.300"
                  borderColor="gray.500"
                  px={2}
                  py={1}
                  borderRadius="8px"
                  _hover={{ bg: 'gray.600' }}
                  aria-label="More actions"
                >
                  <SettingsIcon mr={2} />
                  Ref Tools
                </MenuButton>
                <MenuList bg="gray.700" borderColor="gray.600">
                  {onOpenLaunchFAQ && (
                    <MenuItem
                      icon={<FaQuestionCircle />}
                      color="white"
                      bg="gray.700"
                      onClick={onOpenLaunchFAQ}
                      _hover={{ bg: 'gray.600' }}
                    >
                      Participant FAQ
                    </MenuItem>
                  )}
                  <MenuItem
                    icon={<FaDiscord />}
                    color="white"
                    bg="gray.700"
                    onClick={onOpenDiscordSetup}
                    _hover={{ bg: 'gray.600' }}
                  >
                    Discord Setup
                  </MenuItem>
                  {event?.discordConfig?.guildId && (
                    <MenuItem
                      icon={<FaDiscord />}
                      color="white"
                      bg="gray.700"
                      onClick={handleOpenChannelCheck}
                      _hover={{ bg: 'gray.600' }}
                    >
                      Check Discord Channels
                    </MenuItem>
                  )}

                  {stats.unverified > 0 && (
                    <MenuItem
                      icon={<FaUserTimes />}
                      color="yellow.300"
                      bg="gray.700"
                      onClick={onUnverifiedOpen}
                      _hover={{ bg: 'gray.600' }}
                    >
                      Unverified Members ({stats.unverified})
                    </MenuItem>
                  )}

                  <MenuItem
                    icon={<FaBook />}
                    color="white"
                    bg="gray.700"
                    onClick={handleOpenFullHistory}
                    _hover={{ bg: 'gray.600' }}
                  >
                    Comprehensive Move History
                  </MenuItem>
                  <MenuItem
                    icon={<FaTrophy />}
                    color="white"
                    bg="gray.700"
                    onClick={onGpSplitOpen}
                    _hover={{ bg: 'gray.600' }}
                  >
                    GP Split Calculator
                  </MenuItem>
                  {isEventAdmin && (
                    <>
                      <MenuDivider borderColor="gray.600" />
                      <MenuGroup
                        title="Admin Only"
                        color="red.400"
                        fontSize="xs"
                        fontWeight="semibold"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        mx={3}
                        mt={1}
                        mb={0}
                      />
                      <MenuItem
                        icon={<SettingsIcon />}
                        color="white"
                        bg="gray.700"
                        onClick={onOpenSettings}
                        _hover={{ bg: 'gray.600' }}
                      >
                        Event Settings
                      </MenuItem>
                      <MenuItem
                        icon={<FaUnlock />}
                        color="white"
                        bg="gray.700"
                        onClick={onUnlockHistoryOpen}
                        _hover={{ bg: 'gray.600' }}
                      >
                        Node Unlock History
                      </MenuItem>
                      <MenuItem
                        icon={<FaHistory />}
                        color="white"
                        bg="gray.700"
                        onClick={handleOpenMoveHistory}
                        _hover={{ bg: 'gray.600' }}
                      >
                        Rewrite History Tool
                      </MenuItem>
                      <MenuItem
                        icon={<FaKey />}
                        color="white"
                        bg="gray.700"
                        onClick={() => {
                          setLocallyRefunded(new Set());
                          onInnRefundOpen();
                        }}
                        _hover={{ bg: 'gray.600' }}
                      >
                        Refund Inn Purchase
                      </MenuItem>
                    </>
                  )}
                  {/* <MenuItem
                    icon={<FaExclamationTriangle />}
                    color={repairing ? 'gray.400' : 'yellow.300'}
                    bg="gray.700"
                    onClick={handleRepairAll}
                    isDisabled={repairing}
                    _hover={{ bg: 'gray.600' }}
                  >
                    {repairing ? 'Repairing…' : 'Repair Location Group Availability'}
                  </MenuItem> */}
                </MenuList>
              </Menu>
            </HStack>
          </VStack>
        </Collapse>

        {/* Minimized state - show urgent indicator */}
        {isMinimized && hasUrgentItems && (
          <HStack p={2} justify="center" spacing={2}>
            {stats.pending > 0 && (
              <Tooltip label={`${stats.pending} pending submissions`} hasArrow>
                <Badge colorScheme="orange" variant="solid">
                  {stats.pending}
                </Badge>
              </Tooltip>
            )}
            {stats.teamsWithoutMembers > 0 && (
              <Tooltip label={`${stats.teamsWithoutMembers} teams without members`} hasArrow>
                <Icon as={FaExclamationTriangle} color="orange.400" boxSize={4} />
              </Tooltip>
            )}
          </HStack>
        )}
      </Box>

      {/* Unverified Members Modal */}
      <Modal
        isOpen={isUnverifiedOpen}
        onClose={onUnverifiedClose}
        scrollBehavior="inside"
        size="md"
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaUserTimes} color="yellow.400" />
              <Text>Unverified Members</Text>
              <Badge colorScheme="yellow" variant="solid">
                {stats.unverified}
              </Badge>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              These players haven't linked a site account. They won't see team progress on the site.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack align="stretch" spacing={4}>
              <Box p={3} bg="gray.700" borderRadius="md">
                <Text fontSize="xs" color="gray.400" mb={2}>
                  Paste into Discord to ping everyone at once:
                </Text>
                <HStack>
                  <Text
                    fontSize="xs"
                    fontFamily="mono"
                    color="gray.200"
                    flex={1}
                    noOfLines={2}
                    wordBreak="break-all"
                  >
                    {allMentions}
                  </Text>
                  <Button
                    size="xs"
                    leftIcon={hasCopiedAll ? <CheckIcon /> : <CopyIcon />}
                    colorScheme={hasCopiedAll ? 'green' : 'yellow'}
                    variant="solid"
                    onClick={onCopyAll}
                    flexShrink={0}
                  >
                    {hasCopiedAll ? 'Copied!' : 'Copy All'}
                  </Button>
                </HStack>
              </Box>
              {(stats.unverifiedByTeam || []).map((team) => (
                <Box key={team.teamId}>
                  <HStack mb={2}>
                    <Icon as={FaUsers} color="gray.400" boxSize={3} />
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.400"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {team.teamName}
                    </Text>
                    <Badge colorScheme="yellow" fontSize="xs" variant="subtle">
                      {team.members.length}
                    </Badge>
                  </HStack>
                  <VStack align="stretch" spacing={1}>
                    {team.members.map((m) => (
                      <HStack
                        key={m.discordUserId}
                        p={2}
                        bg="gray.700"
                        borderRadius="md"
                        justify="space-between"
                      >
                        <HStack spacing={2}>
                          <Avatar
                            size="xs"
                            name={m.discordUsername || m.discordUserId}
                            src={
                              m.discordAvatar
                                ? `https://cdn.discordapp.com/avatars/${m.discordUserId}/${m.discordAvatar}.png`
                                : undefined
                            }
                            bg="gray.600"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {m.discordUsername || 'Unknown'}
                            </Text>
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
                              {m.discordUserId}
                            </Text>
                          </VStack>
                        </HStack>
                        <CopyIdButton id={m.discordUserId} />
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Discord Channel Check Modal */}
      <Modal
        isOpen={isChannelCheckOpen}
        onClose={onChannelCheckClose}
        scrollBehavior="inside"
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaDiscord} color="blue.400" />
              <Text>Discord Channel Check</Text>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Channels in this guild whose topic contains the event ID.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {channelCheckLoading ? (
              <VStack py={6} spacing={2}>
                <Icon as={FaDiscord} boxSize={8} color="blue.400" />
                <Text color="gray.400" fontSize="sm">
                  Querying Discord…
                </Text>
              </VStack>
            ) : !channelCheckData ? (
              <Text color="gray.500" fontSize="sm">
                No data yet.
              </Text>
            ) : !channelCheckData.checkDiscordChannels.success ? (
              <Box
                p={3}
                bg="red.900"
                borderRadius="md"
                borderLeft="3px solid"
                borderLeftColor="red.400"
              >
                <Text fontSize="sm" color="red.200">
                  {channelCheckData.checkDiscordChannels.error || 'Unknown error'}
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                {/* Summary */}
                <Badge colorScheme="blue" fontSize="sm" px={2} py={1} alignSelf="start">
                  {channelCheckData.checkDiscordChannels.eventChannels?.length ?? 0} channels found
                </Badge>

                {/* Channel list */}
                {channelCheckData.checkDiscordChannels.eventChannels?.length === 0 ? (
                  <Box p={3} bg="gray.700" borderRadius="md">
                    <Text fontSize="sm" color="gray.400">
                      No channels found with the event ID in their topic.
                    </Text>
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color="gray.400"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      Channels
                    </Text>
                    {channelCheckData.checkDiscordChannels.eventChannels.map((ch) => (
                      <Box
                        key={ch.channelId}
                        p={3}
                        bg="gray.700"
                        borderRadius="md"
                        borderLeft="3px solid"
                        borderLeftColor="blue.400"
                      >
                        <HStack spacing={2}>
                          <Icon as={FaDiscord} color="blue.400" boxSize={3} />
                          <Text fontSize="sm" fontWeight="semibold">
                            #{ch.channelName}
                          </Text>
                        </HStack>
                        {ch.topic && (
                          <Text fontSize="xs" color="gray.400" mt={1} fontFamily="mono">
                            {ch.topic}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
      {/* Move History Modal */}
      <Modal
        isOpen={isMoveHistoryOpen}
        onClose={onMoveHistoryClose}
        scrollBehavior="inside"
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack justify="space-between" align="center" mr={8}>
              <HStack spacing={2}>
                <Icon as={FaHistory} color="orange.400" />
                <Text>Rewrite History Tool</Text>
              </HStack>
              <HStack spacing={1}>
                <Button
                  size="xs"
                  variant={!rewriteHistoryUtc ? 'solid' : 'outline'}
                  colorScheme={!rewriteHistoryUtc ? 'orange' : 'gray'}
                  color={!rewriteHistoryUtc ? 'white' : 'gray.300'}
                  onClick={() => setRewriteHistoryUtc(false)}
                >
                  Local
                </Button>
                <Button
                  size="xs"
                  variant={rewriteHistoryUtc ? 'solid' : 'outline'}
                  colorScheme={rewriteHistoryUtc ? 'orange' : 'gray'}
                  color={rewriteHistoryUtc ? 'white' : 'gray.300'}
                  onClick={() => setRewriteHistoryUtc(true)}
                >
                  UTC
                </Button>
              </HStack>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Completions grouped by team — most recent first, safe to Undo top-down. Click the
              "load more" button at the bottom to also see the "recomplete" section, which shows
              recently uncompleted nodes that can be quickly re-completed if undone by mistake.{' '}
              <strong>TREAD LIGHTLY</strong>.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {activitiesLoading && allActivities.length === 0 ? (
              <VStack py={6}>
                <Text color="gray.400" fontSize="sm">
                  Loading…
                </Text>
              </VStack>
            ) : (
              (() => {
                const completions = allActivities.filter((a) => a.type === 'node_completed');

                // Most recent CURRENTLY-COMPLETED activity per team — only that node is safe to undo
                // Excludes already-undone nodes so undoing one immediately promotes the next
                const mostRecentIdByTeam = {};
                completions
                  .filter((a) => {
                    const localKey = `${a.teamId}:${a.data?.nodeId}`;
                    if (locallyUncompleted.has(localKey)) return false;
                    const team = teams.find((t) => t.teamId === a.teamId);
                    return team?.completedNodes?.includes(a.data?.nodeId);
                  })
                  .forEach((a) => {
                    if (
                      !mostRecentIdByTeam[a.teamId] ||
                      new Date(a.timestamp) >
                        new Date(
                          completions.find((c) => c.id === mostRecentIdByTeam[a.teamId])
                            ?.timestamp ?? 0
                        )
                    ) {
                      mostRecentIdByTeam[a.teamId] = a.id;
                    }
                  });

                const ActivityRow = ({ a, showTeam = true }) => {
                  const team = teams.find((t) => t.teamId === a.teamId);
                  const ts = new Date(a.timestamp);
                  const timeStr = rewriteHistoryUtc
                    ? ts.toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
                    : ts.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                  const key = `${a.teamId}:${a.data?.nodeId}`;
                  const isSafeToUndo = mostRecentIdByTeam[a.teamId] === a.id;
                  const localKey = `${a.teamId}:${a.data?.nodeId}`;
                  const isCurrentlyCompleted =
                    !locallyUncompleted.has(localKey) &&
                    teams
                      .find((t) => t.teamId === a.teamId)
                      ?.completedNodes?.includes(a.data?.nodeId);
                  return (
                    <Box
                      key={a.id}
                      p={2}
                      bg="gray.700"
                      borderRadius="md"
                      borderLeft="3px solid"
                      borderLeftColor={
                        !isCurrentlyCompleted
                          ? 'gray.600'
                          : isSafeToUndo
                          ? 'green.500'
                          : 'orange.400'
                      }
                      opacity={!isCurrentlyCompleted ? 0.5 : 1}
                    >
                      <HStack justify="space-between" spacing={2}>
                        <VStack align="start" spacing={0} flex={1} minW={0}>
                          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                            {a.data?.nodeTitle ?? a.data?.nodeId}
                          </Text>
                          {showTeam && (
                            <HStack spacing={1}>
                              <Icon as={FaUsers} boxSize={3} color="gray.400" />
                              <Text fontSize="xs" color="gray.400">
                                {team?.teamName ?? a.teamId}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                        <HStack spacing={2} flexShrink={0}>
                          <Text fontSize="xs" color="gray.500">
                            {timeStr}
                          </Text>

                          <Tooltip
                            label={
                              !isCurrentlyCompleted
                                ? 'Already uncompleted'
                                : isSafeToUndo
                                ? 'Safe — most recent completion for this team'
                                : 'Caution: later completions exist for this team'
                            }
                            hasArrow
                            placement="top"
                          >
                            <Button
                              size="xs"
                              colorScheme={
                                !isCurrentlyCompleted ? 'gray' : isSafeToUndo ? 'green' : 'orange'
                              }
                              variant={isSafeToUndo ? 'solid' : 'outline'}
                              isLoading={uncomletingId === key}
                              isDisabled={!!uncomletingId || !!restoringId || !isCurrentlyCompleted}
                              onClick={() => handleUncomplete(a.teamId, a.data?.nodeId)}
                            >
                              Undo
                            </Button>
                          </Tooltip>
                        </HStack>
                      </HStack>
                    </Box>
                  );
                };

                const byTeam = {};
                completions.forEach((a) => {
                  if (!byTeam[a.teamId]) byTeam[a.teamId] = [];
                  byTeam[a.teamId].push(a);
                });
                // Sort each team's completions newest→oldest so Undo from top is safe (undo leaf nodes first)
                Object.values(byTeam).forEach((arr) =>
                  arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                );
                // Sort teams by their most recent completion (most active first)
                const sortedTeamIds = Object.keys(byTeam).sort(
                  (a, b) => new Date(byTeam[b][0].timestamp) - new Date(byTeam[a][0].timestamp)
                );

                return (
                  <VStack align="stretch" spacing={4}>
                    {sortedTeamIds.map((teamId) => {
                      const team = teams.find((t) => t.teamId === teamId);
                      return (
                        <Box key={teamId}>
                          <HStack mb={2} spacing={2}>
                            <Icon as={FaUsers} color="orange.400" boxSize={3} />
                            <Text
                              fontSize="xs"
                              fontWeight="semibold"
                              color="orange.300"
                              textTransform="uppercase"
                              letterSpacing="wide"
                            >
                              {team?.teamName ?? teamId}
                            </Text>
                            <Badge colorScheme="orange" fontSize="xs" variant="subtle">
                              {byTeam[teamId].length} nodes
                            </Badge>
                          </HStack>
                          <VStack align="stretch" spacing={1}>
                            {byTeam[teamId].map((a) => (
                              <ActivityRow key={a.id} a={a} showTeam={false} />
                            ))}
                          </VStack>
                        </Box>
                      );
                    })}
                    {completions.length === 0 && (
                      <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                        No completions yet
                      </Text>
                    )}
                    {hasMore && (
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="gray"
                        color="grey.300"
                        isLoading={activitiesLoading}
                        onClick={handleLoadMore}
                        mt={2}
                      >
                        Load older entries
                      </Button>
                    )}
                  </VStack>
                );
              })()
            )}

            {/* ── Uncomplete History ── */}
            {(() => {
              // Find node_completed activities whose nodeId is no longer in the team's completedNodes
              const seen = new Set();
              const uncompleted = allActivities
                .filter((a) => a.type === 'node_completed')
                .filter((a) => {
                  const key = `${a.teamId}:${a.data?.nodeId}`;
                  if (seen.has(key)) return false;
                  seen.add(key);
                  if (locallyReCompleted.has(key)) return false;
                  const team = teams.find((t) => t.teamId === a.teamId);
                  return !team?.completedNodes?.includes(a.data?.nodeId);
                });

              if (uncompleted.length === 0) return null;

              return (
                <>
                  <Divider borderColor="gray.600" mt={4} mb={3} />
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    color="yellow.300"
                    textTransform="uppercase"
                    letterSpacing="wide"
                    mb={2}
                  >
                    Uncomplete History — nodes that were completed then undone
                  </Text>
                  <Text fontSize="xs" color="gray.500" mb={3}>
                    Re-complete silently: fixes game state only — no rewards granted, no
                    notifications sent.
                  </Text>
                  <VStack align="stretch" spacing={1}>
                    {uncompleted.map((a) => {
                      const team = teams.find((t) => t.teamId === a.teamId);
                      const ts = new Date(a.timestamp);
                      const timeStr = ts.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const key = `${a.teamId}:${a.data?.nodeId}`;
                      return (
                        <Box
                          key={key}
                          p={2}
                          bg="gray.700"
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor="yellow.500"
                        >
                          <HStack justify="space-between" spacing={2}>
                            <VStack align="start" spacing={0} flex={1} minW={0}>
                              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {a.data?.nodeTitle ?? a.data?.nodeId}
                              </Text>
                              <HStack spacing={1}>
                                <Icon as={FaUsers} boxSize={3} color="gray.400" />
                                <Text fontSize="xs" color="gray.400">
                                  {team?.teamName ?? a.teamId}
                                </Text>
                                <Text fontSize="xs" color="gray.600">
                                  ·
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  originally {timeStr}
                                </Text>
                              </HStack>
                            </VStack>
                            <Button
                              size="xs"
                              colorScheme="yellow"
                              variant="solid"
                              isLoading={reCompletingId === key}
                              isDisabled={!!reCompletingId || !!uncomletingId}
                              onClick={() => handleSilentReComplete(a.teamId, a.data?.nodeId)}
                            >
                              Re-complete
                            </Button>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Comprehensive Move History Modal */}
      <Modal
        isOpen={isFullHistoryOpen}
        onClose={onFullHistoryClose}
        scrollBehavior="inside"
        size="xl"
      >
        <ModalOverlay />
        <ModalContent
          bg="gray.800"
          color="white"
          maxH={{ base: '90dvh', md: '85vh' }}
          overflowY="auto"
        >
          <ModalHeader pb={2}>
            <HStack justify="space-between" align="start" mr={8}>
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Icon as={FaBook} color="teal.400" />
                  <Text>Comprehensive Move History</Text>
                </HStack>
                <HStack spacing={1}>
                  <Button
                    size="xs"
                    variant={!fullHistoryUtc ? 'solid' : 'outline'}
                    colorScheme={!fullHistoryUtc ? 'teal' : 'gray'}
                    color={!fullHistoryUtc ? 'white' : 'gray.300'}
                    onClick={() => setFullHistoryUtc(false)}
                  >
                    Local
                  </Button>
                  <Button
                    size="xs"
                    variant={fullHistoryUtc ? 'solid' : 'outline'}
                    colorScheme={fullHistoryUtc ? 'teal' : 'gray'}
                    color={fullHistoryUtc ? 'white' : 'gray.300'}
                    onClick={() => setFullHistoryUtc(true)}
                  >
                    UTC
                  </Button>
                </HStack>
              </VStack>
              {/* Team filter */}
              <HStack spacing={1} flexWrap="wrap" justify="flex-end" flex={1} ml={3}>
                <Button
                  size="xs"
                  variant={fullHistoryTeamFilter === null ? 'solid' : 'outline'}
                  colorScheme={fullHistoryTeamFilter === null ? 'teal' : 'gray'}
                  color={fullHistoryTeamFilter === null ? 'white' : 'gray.300'}
                  onClick={() => setFullHistoryTeamFilter(null)}
                >
                  All
                </Button>
                {teams.map((t) => (
                  <Button
                    key={t.teamId}
                    size="xs"
                    variant={fullHistoryTeamFilter === t.teamId ? 'solid' : 'outline'}
                    colorScheme={fullHistoryTeamFilter === t.teamId ? 'teal' : 'gray'}
                    color={fullHistoryTeamFilter === t.teamId ? 'white' : 'gray.300'}
                    onClick={() =>
                      setFullHistoryTeamFilter((prev) => (prev === t.teamId ? null : t.teamId))
                    }
                  >
                    {t.teamName}
                  </Button>
                ))}
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': { height: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
              '&::-webkit-scrollbar-thumb': { background: '#abb8ceff', borderRadius: '10px' },
              scrollbarWidth: 'thin',
              scrollbarColor: '#abb8ceff transparent',
            }}
            pb={4}
          >
            {(() => {
              const fmtGp = (gp) => {
                const n = Number(gp);
                if (!n) return null;
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M gp`;
                if (n >= 1_000) return `${Math.round(n / 1_000)}K gp`;
                return `${n} gp`;
              };

              const keyColorScheme = {
                bronze: 'orange',
                silver: 'gray',
                gold: 'yellow',
                green: 'green',
                blue: 'blue',
                red: 'red',
                purple: 'purple',
              };

              const activityConfig = {
                node_completed: {
                  label: 'Completed',
                  color: 'green.500',
                  scheme: 'green',
                  icon: FaHistory,
                },
                node_uncompleted: {
                  label: 'Uncompleted',
                  color: 'red.400',
                  scheme: 'red',
                  icon: FaUndo,
                },
                node_recompleted: {
                  label: 'Re-completed',
                  color: 'yellow.400',
                  scheme: 'yellow',
                  icon: FaRedoAlt,
                },
                inn_visited: {
                  label: 'Inn',
                  color: 'purple.400',
                  scheme: 'purple',
                  icon: FaKey,
                },
                inn_refunded: {
                  label: 'Inn Refunded',
                  color: 'orange.400',
                  scheme: 'orange',
                  icon: FaUndo,
                },
                gp_gained: {
                  label: 'GP Gained',
                  color: 'yellow.300',
                  scheme: 'yellow',
                  icon: FaHistory,
                },
              };

              const SKIP_TYPES = new Set(['gp_gained']);

              const filtered = allActivities
                .filter((a) => !SKIP_TYPES.has(a.type))
                .filter((a) => (fullHistoryTeamFilter ? a.teamId === fullHistoryTeamFilter : true));

              if (activitiesLoading && filtered.length === 0) {
                return (
                  <VStack py={6}>
                    <Text color="gray.400" fontSize="sm">
                      Loading…
                    </Text>
                  </VStack>
                );
              }

              if (filtered.length === 0) {
                return (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>
                    No activity recorded yet.
                  </Text>
                );
              }

              // Group by date
              const byDate = {};
              filtered.forEach((a) => {
                const d = new Date(a.timestamp);
                const dateKey = fullHistoryUtc
                  ? d.toISOString().slice(0, 10)
                  : d.toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    });
                if (!byDate[dateKey]) byDate[dateKey] = [];
                byDate[dateKey].push(a);
              });

              return (
                <VStack align="stretch" spacing={4}>
                  {Object.entries(byDate).map(([date, entries]) => (
                    <Box key={date}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.400"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        mb={2}
                      >
                        {date}
                      </Text>
                      <VStack align="stretch" spacing={1}>
                        {entries.map((a) => {
                          const team = teams.find((t) => t.teamId === a.teamId);
                          const cfg = activityConfig[a.type] ?? {
                            label: a.type,
                            color: 'gray.500',
                            scheme: 'gray',
                            icon: FaHistory,
                          };
                          const timeStr = fullHistoryUtc
                            ? new Date(a.timestamp).toISOString().slice(11, 16) + ' UTC'
                            : new Date(a.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              });

                          // Build reward pills
                          const pills = [];

                          // GP
                          const gp =
                            a.data?.reward ||
                            a.data?.gpRemoved ||
                            a.data?.gpRestored ||
                            a.data?.gpEarned ||
                            a.data?.amount;
                          const gpStr = fmtGp(gp);
                          if (gpStr) {
                            const isNegative = a.type === 'node_uncompleted';
                            pills.push(
                              <Badge key="gp" colorScheme="yellow" variant="subtle" fontSize="xs">
                                {isNegative ? '−' : '+'}
                                {gpStr}
                              </Badge>
                            );
                          }

                          // Keys gained
                          const keyRewards = a.data?.keyRewards || a.data?.keysRestored || [];
                          keyRewards.forEach((k, i) => {
                            if (!k?.color || !k?.quantity) return;
                            pills.push(
                              <Badge
                                key={`key-gain-${i}`}
                                colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'}
                                variant="subtle"
                                fontSize="xs"
                              >
                                +{k.quantity}
                              </Badge>
                            );
                          });

                          // Keys removed
                          const keysRemoved = a.data?.keysRemoved || [];
                          keysRemoved.forEach((k, i) => {
                            if (!k?.color || !k?.quantity) return;
                            pills.push(
                              <Badge
                                key={`key-rm-${i}`}
                                colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'}
                                variant="outline"
                                fontSize="xs"
                              >
                                −{k.quantity}
                              </Badge>
                            );
                          });

                          // Keys spent at inn
                          const keysSpent = a.data?.keysSpent || [];
                          keysSpent.forEach((k, i) => {
                            if (!k?.color || !k?.quantity) return;
                            pills.push(
                              <Badge
                                key={`key-spent-${i}`}
                                colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'}
                                variant="outline"
                                fontSize="xs"
                              >
                                −{k.quantity}
                              </Badge>
                            );
                          });

                          // Buffs gained
                          const buffsGained =
                            a.data?.buffRewards ||
                            a.data?.buffsRestored ||
                            a.data?.buffsEarned ||
                            [];
                          buffsGained.forEach((b, i) => {
                            const name = b?.buffType || b?.name || b;
                            if (!name) return;
                            pills.push(
                              <Badge
                                key={`buff-gain-${i}`}
                                colorScheme="purple"
                                variant="subtle"
                                fontSize="xs"
                              >
                                +{name}
                              </Badge>
                            );
                          });

                          // Consumed buffs (couldn't be removed on uncomplete)
                          const consumed = a.data?.consumedBuffs || [];
                          consumed.forEach((b, i) => {
                            pills.push(
                              <Badge
                                key={`consumed-${i}`}
                                colorScheme="red"
                                variant="outline"
                                fontSize="xs"
                              >
                                {b} already used
                              </Badge>
                            );
                          });

                          const nodeName =
                            a.data?.nodeTitle ||
                            a.data?.innName ||
                            a.data?.nodeId ||
                            a.data?.innId ||
                            '—';

                          return (
                            <Box
                              key={a.id}
                              p={2}
                              bg="gray.700"
                              borderRadius="md"
                              borderLeft="3px solid"
                              borderLeftColor={cfg.color}
                            >
                              <HStack spacing={2} align="flex-start">
                                <Text
                                  fontSize="xs"
                                  color="gray.500"
                                  flexShrink={0}
                                  w="50px"
                                  pt="2px"
                                >
                                  {timeStr}
                                </Text>
                                <VStack align="start" spacing={1} minW="110px">
                                  <Badge
                                    bg="gray.600"
                                    color="gray.300"
                                    fontSize="xs"
                                    flexShrink={0}
                                  >
                                    {team?.teamName ?? a.teamId}
                                  </Badge>
                                  <Badge
                                    colorScheme={cfg.scheme}
                                    fontSize="xs"
                                    flexShrink={0}
                                    alignSelf="flex-start"
                                  >
                                    {cfg.label}
                                  </Badge>
                                </VStack>
                                <VStack align="start" spacing={1} flex={1} minW={0}>
                                  <HStack spacing={1} flexWrap="nowrap" minW={0}>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="medium"
                                      noOfLines={1}
                                      flex={1}
                                      minW={0}
                                    >
                                      {nodeName}
                                    </Text>
                                  </HStack>
                                  {pills.length > 0 && (
                                    <HStack spacing={1} flexWrap="wrap">
                                      {pills}
                                    </HStack>
                                  )}
                                </VStack>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  ))}
                  {hasMore && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="gray"
                      color="gray.300"
                      isLoading={activitiesLoading}
                      onClick={handleLoadMore}
                      mt={2}
                    >
                      Load older entries
                    </Button>
                  )}
                </VStack>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Unlock History Modal */}
      <Modal
        isOpen={isUnlockHistoryOpen}
        onClose={onUnlockHistoryClose}
        scrollBehavior="inside"
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white" maxH={{ base: '90dvh', md: '80vh' }}>
          <ModalHeader pb={2}>
            <HStack justify="space-between" align="center" mr={8}>
              <HStack spacing={2}>
                <Icon as={FaUnlock} color="teal.400" />
                <Text>Unlock History</Text>
              </HStack>
              <HStack spacing={1}>
                <Button
                  size="xs"
                  variant={!unlockTimeUtc ? 'solid' : 'outline'}
                  colorScheme={!unlockTimeUtc ? 'teal' : 'gray'}
                  color={!unlockTimeUtc ? 'white' : 'gray.300'}
                  onClick={() => setUnlockTimeUtc(false)}
                >
                  Local
                </Button>
                <Button
                  size="xs"
                  variant={unlockTimeUtc ? 'solid' : 'outline'}
                  colorScheme={unlockTimeUtc ? 'teal' : 'gray'}
                  color={unlockTimeUtc ? 'white' : 'gray.300'}
                  onClick={() => setUnlockTimeUtc(true)}
                >
                  UTC
                </Button>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody overflowY="auto" pb={4}>
            {(() => {
              const nodes = event?.nodes || [];
              // Flatten all teams' nodeUnlockTimes into a single sorted list
              const entries = [];
              teams.forEach((team) => {
                const unlockTimes = team.nodeUnlockTimes || {};
                Object.entries(unlockTimes).forEach(([nodeId, timestamp]) => {
                  const node = nodes.find((n) => n.nodeId === nodeId);
                  entries.push({ team, nodeId, timestamp, node });
                });
              });
              entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

              if (entries.length === 0) {
                return (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>
                    No unlock data yet. Timestamps are recorded as nodes are unlocked going forward.
                  </Text>
                );
              }

              // Group by date
              const byDate = {};
              entries.forEach((e) => {
                const d = new Date(e.timestamp);
                const date = unlockTimeUtc ? d.toISOString().slice(0, 10) : d.toLocaleDateString();
                if (!byDate[date]) byDate[date] = [];
                byDate[date].push(e);
              });

              return (
                <VStack align="stretch" spacing={4}>
                  {Object.entries(byDate).map(([date, dateEntries]) => (
                    <Box key={date}>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.400"
                        textTransform="uppercase"
                        letterSpacing="wide"
                        mb={2}
                      >
                        {date}
                      </Text>
                      <VStack align="stretch" spacing={1}>
                        {dateEntries.map(({ team, nodeId, timestamp, node }, idx) => (
                          <HStack
                            key={`${team.teamId}-${nodeId}-${idx}`}
                            spacing={3}
                            px={2}
                            py={1}
                            borderRadius="md"
                            _hover={{ bg: 'whiteAlpha.100' }}
                          >
                            <Text fontSize="xs" color="gray.500" flexShrink={0} w="72px">
                              {unlockTimeUtc
                                ? new Date(timestamp).toISOString().slice(11, 16) + ' UTC'
                                : new Date(timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                            </Text>
                            <Badge bg="teal.700" color="teal.200" fontSize="xs" flexShrink={0}>
                              {team.teamName}
                            </Badge>
                            <Text fontSize="sm" color="white" noOfLines={1} flex={1} minW={0}>
                              {node?.title ?? nodeId}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>
      {gpSplitModal}

      {/* Inn Refund Modal */}
      <Modal
        isOpen={isInnRefundOpen}
        onClose={onInnRefundClose}
        scrollBehavior="inside"
        size="lg"
      >
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaKey} color="orange.400" />
              <Text>Refund Inn Purchase</Text>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Restores keys and GP to the team and removes any buffs granted. Cannot be undone.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {(() => {
              const nodes = event?.nodes || [];
              const fmtGp = (gp) => {
                const n = Number(gp);
                if (!n) return '0 gp';
                if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M gp`;
                if (n >= 1_000) return `${Math.round(n / 1_000)}K gp`;
                return `${n} gp`;
              };
              const keyColorScheme = {
                bronze: 'orange', silver: 'gray', gold: 'yellow',
                green: 'green', blue: 'blue', red: 'red', purple: 'purple',
              };

              const allTransactions = teams.flatMap((team) =>
                (team.innTransactions || []).map((tx) => ({ team, tx }))
              );

              if (allTransactions.length === 0) {
                return (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={8}>
                    No inn purchases to refund.
                  </Text>
                );
              }

              // Group by team
              const byTeam = {};
              allTransactions.forEach(({ team, tx }) => {
                if (!byTeam[team.teamId]) byTeam[team.teamId] = { team, txs: [] };
                byTeam[team.teamId].txs.push(tx);
              });

              return (
                <VStack align="stretch" spacing={4}>
                  {Object.values(byTeam).map(({ team, txs }) => (
                    <Box key={team.teamId}>
                      <HStack mb={2} spacing={2}>
                        <Icon as={FaUsers} color="orange.400" boxSize={3} />
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="orange.300"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          {team.teamName}
                        </Text>
                        <Badge colorScheme="orange" fontSize="xs" variant="subtle">
                          {txs.length} purchase{txs.length !== 1 ? 's' : ''}
                        </Badge>
                      </HStack>
                      <VStack align="stretch" spacing={2}>
                        {txs.map((tx) => {
                          const key = `${team.teamId}:${tx.nodeId}`;
                          const isRefunded = locallyRefunded.has(key);
                          const innNode = nodes.find((n) => n.nodeId === tx.nodeId);
                          return (
                            <Box
                              key={tx.nodeId}
                              p={3}
                              bg="gray.700"
                              borderRadius="md"
                              borderLeft="3px solid"
                              borderLeftColor={isRefunded ? 'gray.600' : 'orange.400'}
                              opacity={isRefunded ? 0.5 : 1}
                            >
                              <HStack justify="space-between" align="start" spacing={2}>
                                <VStack align="start" spacing={1} flex={1} minW={0}>
                                  <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                    {innNode?.title ?? tx.nodeId}
                                  </Text>
                                  <HStack spacing={1} flexWrap="wrap">
                                    <Badge colorScheme="yellow" variant="subtle" fontSize="xs">
                                      +{fmtGp(tx.payout)}
                                    </Badge>
                                    {(tx.keysSpent || []).map((k, i) => (
                                      <Badge
                                        key={i}
                                        colorScheme={keyColorScheme[k.color?.toLowerCase()] ?? 'gray'}
                                        variant="outline"
                                        fontSize="xs"
                                      >
                                        -{k.quantity} {k.color}
                                      </Badge>
                                    ))}
                                    {(tx.buffsGranted || []).map((b, i) => (
                                      <Badge key={i} colorScheme="purple" variant="subtle" fontSize="xs">
                                        +{b.buffType}
                                      </Badge>
                                    ))}
                                  </HStack>
                                  {tx.purchasedAt && (
                                    <Text fontSize="xs" color="gray.500">
                                      {new Date(tx.purchasedAt).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                      })}
                                    </Text>
                                  )}
                                </VStack>
                                <Button
                                  size="xs"
                                  colorScheme="orange"
                                  variant={isRefunded ? 'ghost' : 'solid'}
                                  isDisabled={isRefunded || !!refundingInn}
                                  isLoading={refundingInn === key}
                                  onClick={() => handleRefundInn(team.teamId, tx.nodeId)}
                                  flexShrink={0}
                                >
                                  {isRefunded ? 'Refunded' : 'Refund'}
                                </Button>
                              </HStack>
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              );
            })()}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminQuickActionsPanel;
