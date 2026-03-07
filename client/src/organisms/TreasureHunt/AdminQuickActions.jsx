import React, { useState, useMemo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { CHECK_DISCORD_CHANNELS, GET_TREASURE_ACTIVITIES } from '../../graphql/queries';
import { ADMIN_UNCOMPLETE_NODE, ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS, ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY } from '../../graphql/mutations';
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
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const { isOpen: isUnverifiedOpen, onOpen: onUnverifiedOpen, onClose: onUnverifiedClose } = useDisclosure();
  const { isOpen: isChannelCheckOpen, onOpen: onChannelCheckOpen, onClose: onChannelCheckClose } = useDisclosure();
  const { isOpen: isMoveHistoryOpen, onOpen: onMoveHistoryOpen, onClose: onMoveHistoryClose } = useDisclosure();

  const [checkChannels, { data: channelCheckData, loading: channelCheckLoading }] = useLazyQuery(
    CHECK_DISCORD_CHANNELS,
    { fetchPolicy: 'network-only' },
  );
  const [fetchActivities, { data: activitiesData, loading: activitiesLoading }] = useLazyQuery(
    GET_TREASURE_ACTIVITIES,
    { fetchPolicy: 'network-only' },
  );
  const [adminUncompleteNode] = useMutation(ADMIN_UNCOMPLETE_NODE);
  const [adminRestoreSiblings] = useMutation(ADMIN_RESTORE_LOCATION_GROUP_SIBLINGS);
  const [adminRepairAll] = useMutation(ADMIN_REPAIR_LOCATION_GROUP_AVAILABILITY);
  const [uncomletingId, setUncompletingId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);
  const [repairing, setRepairing] = useState(false);

  const handleOpenMoveHistory = () => {
    fetchActivities({ variables: { eventId: event.eventId, limit: 50 } });
    onMoveHistoryOpen();
  };

  const handleUncomplete = async (teamId, nodeId) => {
    const key = `${teamId}:${nodeId}`;
    setUncompletingId(key);
    try {
      await adminUncompleteNode({ variables: { eventId: event.eventId, teamId, nodeId } });
      fetchActivities({ variables: { eventId: event.eventId, limit: 50 } });
    } finally {
      setUncompletingId(null);
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
          <Tooltip label={isMinimized ? 'Expand panel' : 'Minimize panel'} hasArrow placement="top">
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
      <Modal isOpen={isUnverifiedOpen} onClose={onUnverifiedClose} scrollBehavior="inside" size="md">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaUserTimes} color="yellow.400" />
              <Text>Unverified Members</Text>
              <Badge colorScheme="yellow" variant="solid">{stats.unverified}</Badge>
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
                    <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wide">
                      {team.teamName}
                    </Text>
                    <Badge colorScheme="yellow" fontSize="xs" variant="subtle">{team.members.length}</Badge>
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
                            src={m.discordAvatar
                              ? `https://cdn.discordapp.com/avatars/${m.discordUserId}/${m.discordAvatar}.png`
                              : undefined}
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
      <Modal isOpen={isChannelCheckOpen} onClose={onChannelCheckClose} scrollBehavior="inside" size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaDiscord} color="blue.400" />
              <Text>Discord Channel Check</Text>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Channels in this guild whose topic contains the event ID, and which team IDs they cover.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {channelCheckLoading ? (
              <VStack py={6} spacing={2}>
                <Icon as={FaDiscord} boxSize={8} color="blue.400" />
                <Text color="gray.400" fontSize="sm">Querying Discord…</Text>
              </VStack>
            ) : !channelCheckData ? (
              <Text color="gray.500" fontSize="sm">No data yet.</Text>
            ) : !channelCheckData.checkDiscordChannels.success ? (
              <Box p={3} bg="red.900" borderRadius="md" borderLeft="3px solid" borderLeftColor="red.400">
                <Text fontSize="sm" color="red.200">
                  {channelCheckData.checkDiscordChannels.error || 'Unknown error'}
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                {/* Summary */}
                <HStack spacing={3}>
                  <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                    {channelCheckData.checkDiscordChannels.eventChannels?.length ?? 0} channels found
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
                  <Box p={3} bg="orange.900" borderRadius="md" borderLeft="3px solid" borderLeftColor="orange.400">
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
                    <Text fontSize="xs" fontWeight="semibold" color="gray.400" textTransform="uppercase" letterSpacing="wide">
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
                              <Text fontSize="sm" fontWeight="semibold">#{ch.channelName}</Text>
                            </HStack>
                            {covered ? (
                              <Badge colorScheme="green" fontSize="xs">
                                {ch.matchedTeamIds.length} team{ch.matchedTeamIds.length !== 1 ? 's' : ''}
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray" fontSize="xs">no teams</Badge>
                            )}
                          </HStack>
                          {ch.matchedTeamIds?.length > 0 && (
                            <HStack spacing={1} flexWrap="wrap" mt={1}>
                              {ch.matchedTeamIds.map((teamId) => {
                                const team = teams.find((t) => t.teamId === teamId);
                                return (
                                  <Badge key={teamId} colorScheme="blue" fontSize="xs" variant="subtle">
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
      <Modal isOpen={isMoveHistoryOpen} onClose={onMoveHistoryClose} scrollBehavior="inside" size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader pb={2}>
            <HStack spacing={2}>
              <Icon as={FaHistory} color="orange.400" />
              <Text>Move History</Text>
            </HStack>
            <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>
              Last 50 node completions across all teams
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {activitiesLoading ? (
              <VStack py={6}><Text color="gray.400" fontSize="sm">Loading…</Text></VStack>
            ) : (
              <VStack align="stretch" spacing={1}>
                {(activitiesData?.getTreasureActivities ?? [])
                  .filter((a) => a.type === 'node_completed')
                  .map((a) => {
                    const team = teams.find((t) => t.teamId === a.teamId);
                    const ts = new Date(a.timestamp);
                    const timeStr = ts.toLocaleString(undefined, {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    });
                    const key = `${a.teamId}:${a.data?.nodeId}`;
                    const isUncompleting = uncomletingId === key;
                    return (
                      <Box key={a.id} p={2} bg="gray.700" borderRadius="md">
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
                            </HStack>
                          </VStack>
                          <HStack spacing={2} flexShrink={0}>
                            <Text fontSize="xs" color="gray.500">{timeStr}</Text>
                            <Tooltip label="Restore location group siblings to available tasks" hasArrow placement="top">
                              <Button
                                size="xs"
                                colorScheme="blue"
                                variant="ghost"
                                isLoading={restoringId === key}
                                isDisabled={!!uncomletingId || !!restoringId}
                                onClick={() => handleRestoreSiblings(a.teamId, a.data?.nodeId)}
                              >
                                Siblings
                              </Button>
                            </Tooltip>
                            <Button
                              size="xs"
                              colorScheme="red"
                              variant="ghost"
                              isLoading={isUncompleting}
                              isDisabled={!!uncomletingId || !!restoringId}
                              onClick={() => handleUncomplete(a.teamId, a.data?.nodeId)}
                            >
                              Undo
                            </Button>
                          </HStack>
                        </HStack>
                      </Box>
                    );
                  })}
                {!activitiesLoading && (activitiesData?.getTreasureActivities ?? []).filter((a) => a.type === 'node_completed').length === 0 && (
                  <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>No completions yet</Text>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdminQuickActionsPanel;
