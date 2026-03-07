import React, { useState, useMemo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { CHECK_DISCORD_CHANNELS, GET_TREASURE_ACTIVITIES } from '../../graphql/queries';
import {
  ADMIN_UNCOMPLETE_NODE,
  ADMIN_SILENT_RE_COMPLETE_NODE,
  ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS,
  ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY,
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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useClipboard,
  Avatar,
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

  const [checkChannels, { data: channelCheckData, loading: channelCheckLoading }] = useLazyQuery(
    CHECK_DISCORD_CHANNELS,
    { fetchPolicy: 'network-only' }
  );
  const [fetchActivities, { loading: activitiesLoading }] = useLazyQuery(GET_TREASURE_ACTIVITIES, {
    fetchPolicy: 'network-only',
  });
  const [adminUncompleteNode] = useMutation(ADMIN_UNCOMPLETE_NODE);
  const [adminSilentReComplete] = useMutation(ADMIN_SILENT_RE_COMPLETE_NODE);
  const [adminRestoreSiblings] = useMutation(ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS);
  const [adminRepairAll] = useMutation(ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY);
  const [uncomletingId, setUncompletingId] = useState(null);
  const [reCompletingId, setReCompletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [allActivities, setAllActivities] = useState([]);
  const [activitiesOffset, setActivitiesOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [historyView, setHistoryView] = useState('timeline');
  // Local override: track nodes uncompleted this session so the UI updates instantly
  // even if the parent's Apollo cache hasn't re-rendered yet
  const [locallyUncompleted, setLocallyUncompleted] = useState(new Set());
  const [locallyReCompleted, setLocallyReCompleted] = useState(new Set());
  const PAGE_SIZE = 50;

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

  const handleRestoreSiblings = async (teamId, nodeId) => {
    const key = `${teamId}:${nodeId}`;
    setRestoringId(key);
    try {
      await adminRestoreSiblings({ variables: { eventId: event.eventId, teamId, nodeId } });
    } finally {
      setRestoringId(null);
    }
  };

  const handleRepairAll = async () => {
    setRepairing(true);
    try {
      await adminRepairAll({ variables: { eventId: event.eventId } });
    } finally {
      setRepairing(false);
    }
  };

  const handleOpenChannelCheck = () => {
    const guildId = event?.discordConfig?.guildId;
    const teamIds = teams.map((t) => t.teamId);
    if (guildId && teamIds.length > 0) {
      checkChannels({ variables: { guildId, eventId: event.eventId, teamIds } });
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

    const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
    const deniedSubmissions = submissions.filter((s) => s.status === 'DENIED');
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
      approved: approvedSubmissions.length,
      denied: deniedSubmissions.length,
      totalSubmissions: submissions.length,
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
        overflow="hidden"
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

                {/* Submission breakdown */}
                <Box p={2} bg="gray.700" borderRadius="md">
                  <Text fontSize="xs" fontWeight="semibold" color="gray.300" mb={2}>
                    SUBMISSION STATS
                  </Text>
                  <HStack justify="space-between" fontSize="xs">
                    <HStack>
                      <Icon as={CheckIcon} color="green.400" boxSize={3} />
                      <Text color="white">Approved</Text>
                    </HStack>
                    <Text color="green.400" fontWeight="semibold">
                      {stats.approved}
                    </Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="xs" mt={1}>
                    <HStack>
                      <Icon as={CloseIcon} color="red.400" boxSize={3} />
                      <Text color="white">Denied</Text>
                    </HStack>
                    <Text color="red.400" fontWeight="semibold">
                      {stats.denied}
                    </Text>
                  </HStack>
                </Box>

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
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<SettingsIcon />}
                  size="sm"
                  variant="outline"
                  color="gray.300"
                  borderColor="gray.500"
                  _hover={{ bg: 'gray.600' }}
                  aria-label="More actions"
                />
                <MenuList bg="gray.700" borderColor="gray.600">
                  <MenuItem
                    icon={<FaDiscord />}
                    color="white"
                    bg="gray.700"
                    onClick={onOpenDiscordSetup}
                    _hover={{ bg: 'gray.600' }}
                  >
                    Discord Setup
                  </MenuItem>
                  <MenuItem
                    icon={<SettingsIcon />}
                    color="white"
                    bg="gray.700"
                    onClick={onOpenSettings}
                    _hover={{ bg: 'gray.600' }}
                  >
                    Event Settings
                  </MenuItem>
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
                    icon={<FaHistory />}
                    color="white"
                    bg="gray.700"
                    onClick={handleOpenMoveHistory}
                    _hover={{ bg: 'gray.600' }}
                  >
                    Move History
                  </MenuItem>
                  <MenuItem
                    icon={<FaExclamationTriangle />}
                    color={repairing ? 'gray.400' : 'yellow.300'}
                    bg="gray.700"
                    onClick={handleRepairAll}
                    isDisabled={repairing}
                    _hover={{ bg: 'gray.600' }}
                  >
                    {repairing ? 'Repairing…' : 'Repair Location Group Availability'}
                  </MenuItem>
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
              Channels in this guild whose topic contains the event ID, and which team IDs they
              cover.
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
                <HStack spacing={3}>
                  <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                    {channelCheckData.checkDiscordChannels.eventChannels?.length ?? 0} channels
                    found
                  </Badge>
                  {channelCheckData.checkDiscordChannels.coveredTeamIds?.length > 0 && (
                    <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                      {channelCheckData.checkDiscordChannels.coveredTeamIds.length} teams covered
                    </Badge>
                  )}
                  {channelCheckData.checkDiscordChannels.missingTeamIds?.length > 0 && (
                    <Badge colorScheme="orange" fontSize="sm" px={2} py={1}>
                      {channelCheckData.checkDiscordChannels.missingTeamIds.length} teams missing
                    </Badge>
                  )}
                </HStack>

                {/* Missing teams warning */}
                {channelCheckData.checkDiscordChannels.missingTeamIds?.length > 0 && (
                  <Box
                    p={3}
                    bg="orange.900"
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="orange.400"
                  >
                    <Text fontSize="xs" fontWeight="semibold" color="orange.300" mb={1}>
                      No channel found for these team IDs:
                    </Text>
                    <VStack align="start" spacing={1}>
                      {channelCheckData.checkDiscordChannels.missingTeamIds.map((teamId) => {
                        const team = teams.find((t) => t.teamId === teamId);
                        return (
                          <HStack key={teamId} spacing={2}>
                            <Icon as={FaExclamationTriangle} color="orange.400" boxSize={3} />
                            <Text fontSize="xs" color="white" fontWeight="medium">
                              {team?.teamName ?? teamId}
                            </Text>
                            <Text fontSize="xs" color="gray.400" fontFamily="mono">
                              {teamId}
                            </Text>
                          </HStack>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

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
                    {channelCheckData.checkDiscordChannels.eventChannels.map((ch) => {
                      const covered = ch.matchedTeamIds?.length > 0;
                      return (
                        <Box
                          key={ch.channelId}
                          p={3}
                          bg="gray.700"
                          borderRadius="md"
                          borderLeft="3px solid"
                          borderLeftColor={covered ? 'green.400' : 'gray.500'}
                        >
                          <HStack justify="space-between" mb={1}>
                            <HStack spacing={2}>
                              <Icon as={FaDiscord} color="blue.400" boxSize={3} />
                              <Text fontSize="sm" fontWeight="semibold">
                                #{ch.channelName}
                              </Text>
                            </HStack>
                            {covered ? (
                              <Badge colorScheme="green" fontSize="xs">
                                {ch.matchedTeamIds.length} team
                                {ch.matchedTeamIds.length !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray" fontSize="xs">
                                no teams
                              </Badge>
                            )}
                          </HStack>
                          {ch.matchedTeamIds?.length > 0 && (
                            <HStack spacing={1} flexWrap="wrap" mt={1}>
                              {ch.matchedTeamIds.map((teamId) => {
                                const team = teams.find((t) => t.teamId === teamId);
                                return (
                                  <Badge
                                    key={teamId}
                                    colorScheme="blue"
                                    fontSize="xs"
                                    variant="subtle"
                                  >
                                    {team?.teamName ?? teamId}
                                  </Badge>
                                );
                              })}
                            </HStack>
                          )}
                        </Box>
                      );
                    })}
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
            <HStack justify="space-between" align="start">
              <HStack spacing={2}>
                <Icon as={FaHistory} color="orange.400" />
                <Text>Move History</Text>
              </HStack>
              <HStack spacing={1} mr={8}>
                <Button
                  size="xs"
                  color="gray.300"
                  variant={historyView === 'timeline' ? 'solid' : 'outline'}
                  colorScheme={historyView === 'timeline' ? 'orange' : 'gray'}
                  onClick={() => setHistoryView('timeline')}
                >
                  Timeline
                </Button>
                <Button
                  size="xs"
                  color="gray.300"
                  variant={historyView === 'by_team' ? 'solid' : 'outline'}
                  colorScheme={historyView === 'by_team' ? 'orange' : 'gray'}
                  onClick={() => setHistoryView('by_team')}
                >
                  By Team
                </Button>
              </HStack>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              {historyView === 'by_team'
                ? 'Completions grouped by team — most recent first, safe to Undo top-down'
                : 'All completions newest first'}
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
                  const timeStr = ts.toLocaleString(undefined, {
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
                    teams.find((t) => t.teamId === a.teamId)?.completedNodes?.includes(a.data?.nodeId);
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
                            label="Restore location group siblings to available tasks"
                            hasArrow
                            placement="top"
                          >
                            <Button
                              size="xs"
                              colorScheme="blue"
                              variant="ghost"
                              isLoading={restoringId === key}
                              isDisabled={!!uncomletingId || !!restoringId || !isCurrentlyCompleted}
                              onClick={() => handleRestoreSiblings(a.teamId, a.data?.nodeId)}
                            >
                              Siblings
                            </Button>
                          </Tooltip>
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

                if (historyView === 'by_team') {
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
                }

                return (
                  <VStack align="stretch" spacing={1}>
                    {completions.map((a) => (
                      <ActivityRow key={a.id} a={a} />
                    ))}
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
    </>
  );
};

export default AdminQuickActionsPanel;
