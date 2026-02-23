import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Badge,
  Spinner,
  Container,
  useDisclosure,
  Switch,
  useToast,
  Button,
  Icon,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from '@chakra-ui/react';
import { CheckCircleIcon, CopyIcon, LockIcon, QuestionIcon } from '@chakra-ui/icons';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_TREASURE_TEAM, GET_ALL_SUBMISSIONS } from '../graphql/queries';
import PlayerSubmissionsPanel from '../organisms/TreasureHunt/PlayerSubmissionsPanel';
import {
  ADMIN_COMPLETE_NODE,
  ADMIN_UNCOMPLETE_NODE,
  APPLY_BUFF_TO_NODE,
  VISIT_INN,
} from '../graphql/mutations';
import NodeDetailModal from '../organisms/TreasureHunt/NodeDetailModal';
import InnModal from '../organisms/TreasureHunt/TreasureInnModal';
import BuffApplicationModal from '../organisms/TreasureHunt/TreasureBuffApplicationModal';
import Section from '../atoms/Section';
import TreasureMapVisualization from '../organisms/TreasureHunt/TreasureMapVisualization';
import GemTitle from '../atoms/GemTitle';
import BuffInventory from '../organisms/TreasureHunt/TreasureBuffInventory';
import theme from '../theme';
import { RedactedText } from '../molecules/TreasureHunt/RedactedTreasureInfo';
import { useAuth } from '../providers/AuthProvider';
import { MdHome, MdOutlineArrowBack } from 'react-icons/md';
import { OBJECTIVE_TYPES } from '../utils/treasureHuntHelpers';
import { useCallback } from 'react';
import TreasureHuntTutorial from '../organisms/TreasureHunt/TreasureHuntTutorial';
import AvailableInnsModal from '../organisms/TreasureHunt/AvailableInnsModal';
import BuffApplicationListModal from '../organisms/TreasureHunt/BuffApplicationListModal';
import TeamAccessOverlay from '../organisms/TreasureHunt/TeamAccessOverlay';
import EnhancedTeamStats from '../organisms/TreasureHunt/EnhancedTeamStats';
import { useThemeColors } from '../hooks/useThemeColors';
import useSubmissionCelebrations from '../hooks/useSubmissionCelebrations';
import DevTestPanel from '../organisms/TreasureHunt/DevTestPanel';
import { unlockAudio } from '../utils/celebrationUtils';
import usePageTitle from '../hooks/usePageTitle';
import DiscordLinkBanner from '../molecules/TreasureHunt/DiscordLinkBanner';
import EventStatusBanner from '../organisms/TreasureHunt/EventStatusBanner';
import { FaCog, FaCoins } from 'react-icons/fa';

const TreasureTeamView = () => {
  const { colors: currentColors, colorMode } = useThemeColors();

  const { eventId, teamId } = useParams();
  const toast = useToast();
  const [selectedBuff, setSelectedBuff] = useState(null);
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const { isOpen: isNodeOpen, onOpen: onNodeOpen, onClose: onNodeClose } = useDisclosure();
  const { isOpen: isInnOpen, onOpen: onInnOpen, onClose: onInnClose } = useDisclosure();
  const {
    isOpen: isBuffModalOpen,
    onOpen: onBuffModalOpen,
    onClose: onBuffModalClose,
  } = useDisclosure();
  const {
    isOpen: isAvailableInnsOpen,
    onOpen: onAvailableInnsOpen,
    onClose: onAvailableInnsClose,
  } = useDisclosure();
  const {
    isOpen: isBuffListOpen,
    onOpen: onBuffListOpen,
    onClose: onBuffListClose,
  } = useDisclosure();

  const {
    data: eventData,
    loading: eventLoading,
    refetch: refetchEvent,
  } = useQuery(GET_TREASURE_EVENT, { variables: { eventId } });

  const {
    data: teamData,
    loading: teamLoading,
    refetch: refetchTeam,
  } = useQuery(GET_TREASURE_TEAM, { variables: { eventId, teamId } });

  const [adminCompleteNode] = useMutation(ADMIN_COMPLETE_NODE);
  const [adminUncompleteNode] = useMutation(ADMIN_UNCOMPLETE_NODE);
  const [applyBuffToNode] = useMutation(APPLY_BUFF_TO_NODE, {
    onCompleted: () => refetchEvent(),
  });
  const [visitInn] = useMutation(VISIT_INN);

  const handleVisitInn = async (nodeId) => {
    await visitInn({ variables: { eventId, teamId, nodeId } });
  };

  const [selectedNode, setSelectedNode] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  const event = eventData?.getTreasureEvent;
  const team = teamData?.getTreasureTeam;
  const lastCompletedNodeId =
    team?.completedNodes?.length > 0 ? team.completedNodes[team.completedNodes.length - 1] : null;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodes = event?.nodes || [];
  const { user } = useAuth();
  const isAdmin =
    user &&
    event &&
    (user.id === event.creatorId ||
      event.adminIds?.includes(user.id) ||
      event.refIds?.includes(user.id));

  const checkTeamAccess = () => {
    if (isAdmin) return { hasAccess: true, reason: 'authorized' };
    if (!user?.discordUserId) return { hasAccess: false, reason: 'no_discord' };
    const isTeamMember =
      user?.discordUserId &&
      team?.members?.some((m) => m.discordUserId?.toString() === user.discordUserId?.toString());
    if (!isTeamMember) return { hasAccess: false, reason: 'not_member' };
    return { hasAccess: true, reason: 'authorized' };
  };

  const { data: submissionsData, loading: submissionsLoading } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
  });

  const accessCheck = checkTeamAccess();
  const formatGP = (gp) => (gp / 1000000).toFixed(1) + 'M';

  const getNodeStatus = (node) => {
    if (!team) return 'locked';
    if (team.completedNodes?.includes(node.nodeId)) return 'completed';
    if (team.availableNodes?.includes(node.nodeId)) return 'available';
    return 'locked';
  };

  const getNodeBadge = (node) => {
    const tier = Number(node.difficultyTier);
    if (tier === 5) return 'hard';
    if (tier === 3) return 'medium';
    if (tier === 1) return 'easy';
  };

  // Helper to check if a location group has been completed
  const isLocationGroupCompleted = (node, team, event) => {
    if (!node.locationGroupId || !event.mapStructure?.locationGroups) return false;
    const group = event.mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
    if (!group) return false;
    return group.nodeIds.some((nodeId) => team.completedNodes?.includes(nodeId));
  };

  // Helper to get which node was completed in the group
  const getCompletedNodeInGroup = (node, team, event) => {
    if (!node.locationGroupId || !event.mapStructure?.locationGroups) return null;
    const group = event.mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
    if (!group) return null;
    const completedNodeId = group.nodeIds.find((nodeId) => team.completedNodes?.includes(nodeId));
    if (!completedNodeId) return null;
    return nodes.find((n) => n.nodeId === completedNodeId);
  };

  const getNodeBorderColor = (status, node) => {
    if (node.nodeType === 'START') return currentColors.purple.base;
    if (node.nodeType === 'INN') return currentColors.yellow.base;
    if (status === 'locked') return colorMode === 'dark' ? '#4A5568' : '#CBD5E0';
    if (status === 'completed') return currentColors.green.base;
    const tier = parseInt(node.difficultyTier);
    if (tier === 5) return currentColors.red.base;
    if (tier === 3) return currentColors.orange.base;
    if (tier === 1) return currentColors.green.base;
    if (status === 'available') return currentColors.turquoise.base;
    return colorMode === 'dark' ? '#4A5568' : '#CBD5E0';
  };

  const getNumberOfAvailableInns = () =>
    nodes.filter((node) => {
      const hasTransaction = team?.innTransactions?.some((t) => t.nodeId === node.nodeId);
      return getNodeStatus(node) === 'completed' && node.nodeType === 'INN' && !hasTransaction;
    }).length;

  const getAvailableInnsList = () =>
    nodes.filter((node) => {
      const hasTransaction = team?.innTransactions?.some((t) => t.nodeId === node.nodeId);
      return getNodeStatus(node) === 'completed' && node.nodeType === 'INN' && !hasTransaction;
    });

  const handleSelectInn = (inn) => {
    setSelectedNode(inn);
    onInnOpen();
  };

  const handleBuffClick = (buff) => {
    setSelectedBuff(buff);
    onBuffListOpen();
  };

  const getNodesForBuff = (buff) => {
    if (!buff || !team || !nodes) return [];
    return nodes.filter((node) => {
      const status = getNodeStatus(node);
      if (status !== 'available') return false;
      if (node.nodeType !== 'STANDARD') return false;
      if (!node.objective) return false;
      if (node.objective.appliedBuff) return false;
      if (!buff.objectiveTypes || buff.objectiveTypes.length === 0) return true;
      return buff.objectiveTypes.includes(node.objective.type);
    });
  };

  const maxCompletableNodes = useMemo(() => {
    const innCount = nodes.filter((n) => n.nodeType === 'INN').length;
    const startCount = nodes.filter((n) => n.nodeType === 'START').length;
    const standardNodes = nodes.filter((n) => n.nodeType === 'STANDARD').length;
    const uniqueStandardLocations = Math.round(standardNodes / 3);
    return uniqueStandardLocations + innCount + startCount;
  }, [nodes]);

  const handleNodeClick = useCallback(
    (node) => {
      let status = 'locked';
      if (team) {
        if (team.completedNodes?.includes(node.nodeId)) status = 'completed';
        else if (team.availableNodes?.includes(node.nodeId)) status = 'available';
      }
      if (status === 'locked' && !adminMode) return;
      setSelectedNode({ ...node, status });
      if (node.nodeType === 'INN' && status === 'completed' && !adminMode) {
        onInnOpen();
      } else {
        onNodeOpen();
      }
    },
    [team, adminMode, onInnOpen, onNodeOpen]
  );

  const handleSelectNodeFromBuffList = (node) => {
    handleNodeClick(node);
    onNodeOpen();
  };

  const scrollToNodeCard = (nodeId) => {
    const el = document.getElementById(`node-card-${nodeId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashNodeId(nodeId);
    setTimeout(() => setFlashNodeId(null), 2000); // flash for 2s
  };

  const handleAdminCompleteNode = async (nodeId) => {
    try {
      await adminCompleteNode({ variables: { eventId, teamId, nodeId } });
      await refetchTeam();
      toast({
        title: 'Node completed',
        description: 'Successfully marked node as completed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAdminUncompleteNode = async (nodeId) => {
    try {
      await adminUncompleteNode({ variables: { eventId, teamId, nodeId } });
      await refetchTeam();
      toast({
        title: 'Node un-completed',
        description:
          'Completion removed. GP, keys, and any unused buffs from this node have been returned/reversed.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleApplyBuff = async (buffId) => {
    try {
      await applyBuffToNode({
        variables: { eventId, teamId, nodeId: selectedNode.nodeId, buffId },
      });
      await refetchTeam();
      await refetchEvent();
      toast({
        title: 'Buff applied!',
        description: 'The buff has been successfully applied to this objective',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error applying buff',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleOpenBuffModal = (node) => {
    setSelectedNode(node);
    onBuffModalOpen();
  };

  const handleQuestScroll = (e) => {
    const el = e.target;
    setShowLeftFade(el.scrollLeft > 0);
    setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  const [flashNodeId, setFlashNodeId] = useState(null);

  usePageTitle(event ? `Gielinor Rush - ${team ? team.teamName : 'Team'}` : 'Gielinor Rush Team');

  const teamSubmissions = useMemo(() => {
    const allSubmissions = submissionsData?.getAllSubmissions || [];
    return allSubmissions
      .filter((s) => s.teamId === teamId || s.team?.teamId === teamId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 10);
  }, [submissionsData?.getAllSubmissions, teamId]);

  useSubmissionCelebrations(eventId, teamId, nodes, true, () => refetchTeam());

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      document.removeEventListener('mousemove', unlock);
    };
    document.addEventListener('mousemove', unlock);
    return () => document.removeEventListener('mousemove', unlock);
  }, []);

  // Seed right fade on mount / when nodes change
  useEffect(() => {
    const el = scrollRef.current;
    if (el) setShowRightFade(el.scrollWidth > el.clientWidth);
  }, [nodes, team]);

  if (eventLoading || teamLoading) {
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
        <Spinner m="0 auto" size="xl" />
      </Container>
    );
  }

  if (!event || !team) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text color={currentColors.textColor}>Team or event not found</Text>
      </Container>
    );
  }

  if (event.status === 'DRAFT' && !isAdmin) {
    return (
      <Flex
        alignItems="center"
        flex="1"
        flexDirection="column"
        height="100%"
        paddingY={['40px', '56px']}
        marginX={['12px', '36px']}
      >
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
            <Link to="/gielinor-rush">Back to Events</Link>
          </Text>
        </Flex>
        <Section maxWidth="600px" width="100%" py={8}>
          <VStack spacing={6} align="center" textAlign="center">
            <Box fontSize="6xl">🔒</Box>
            <VStack spacing={2}>
              <Heading size="lg" color={currentColors.textColor}>
                Event Not Available...Yet!
              </Heading>
              <Text color={currentColors.textColor} fontSize="lg">
                This event is currently in draft mode
              </Text>
            </VStack>
            <Box p={4} bg="whiteAlpha.400" borderRadius="md" width="100%">
              <Text fontSize="sm" color={currentColors.textColor}>
                This Gielinor Rush event is still being set up by the event organizers. It will
                become visible once the admins publish it.
              </Text>
            </Box>
          </VStack>
        </Section>
      </Flex>
    );
  }

  const availableInns = getNumberOfAvailableInns();
  const sectionBg = 'rgb(0, 80, 80)';

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['24px', '40px']}
      marginX={['8px', '20px', '36px']}
    >
      <EventStatusBanner event={event} isAdmin={isAdmin} />
      <DiscordLinkBanner user={user} />

      {/* ── BACK NAV ── */}
      <Flex
        alignItems="center"
        justifyContent="space-between"
        mb={4}
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
          <Link to={`/gielinor-rush/${eventId}`}>Back to Event</Link>
        </Text>

        {isAdmin && (
          <HStack
            px={3}
            py={2}
            bg={adminMode ? currentColors.red.base : 'whiteAlpha.100'}
            borderRadius="md"
            cursor="pointer"
            onClick={() => setAdminMode((p) => !p)}
            transition="all 0.2s"
            _hover={{ opacity: 0.85 }}
          >
            <Icon as={FaCog} color={adminMode ? 'white' : 'gray.400'} />
            <Text fontSize="sm" fontWeight="semibold" color={adminMode ? 'white' : 'gray.300'}>
              {adminMode ? '⚠️ Admin Mode ON' : 'Admin Mode'}
            </Text>
            <Switch
              size="sm"
              colorScheme="red"
              isChecked={adminMode}
              onChange={() => {}}
              pointerEvents="none"
            />
          </HStack>
        )}
      </Flex>

      <Section maxWidth="1200px" width="100%" py={6}>
        <VStack spacing={6} w="100%" maxW="100%" align="stretch">
          {/* ── TEAM HEADER ── */}

          <Flex
            align={['flex-start', 'center']}
            justify="space-between"
            flexDir={['column', 'row']}
            gap={3}
          >
            {/* Left: title + chips */}
            <VStack align="start" spacing={2} flexShrink={0}>
              <HStack>
                <GemTitle size="lg" mb={0}>
                  {team.teamName}
                </GemTitle>
                {adminMode && (
                  <Badge bg={currentColors.red.base} color="white" fontSize="sm">
                    ⚙️ ADMIN
                  </Badge>
                )}
              </HStack>
              <Tooltip label={`Click to copy — ${event.eventId}`} hasArrow>
                <HStack
                  spacing={2}
                  px={2}
                  py={0.5}
                  bg="whiteAlpha.100"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{ bg: 'whiteAlpha.300' }}
                  onClick={() => {
                    navigator.clipboard.writeText(event.eventId);
                    toast({ title: 'Event ID Copied!', status: 'success', duration: 2000 });
                  }}
                >
                  <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
                    Event ID: {event.eventId}
                  </Text>
                  <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
                </HStack>
              </Tooltip>
              {event.eventPassword && (
                <Tooltip label="Click to copy Event Password" hasArrow>
                  <HStack
                    spacing={2}
                    px={2}
                    py={0.5}
                    bg="whiteAlpha.100"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    onClick={() => {
                      navigator.clipboard.writeText(event.eventPassword);
                      toast({ title: 'Event Password Copied!', status: 'success', duration: 2000 });
                    }}
                  >
                    <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
                      Event Password: {event.eventPassword}
                    </Text>
                    <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
                  </HStack>
                </Tooltip>
              )}
            </VStack>

            {/* Center: team members — fills the blank space */}
            {team.members?.length > 0 && (
              <Flex
                flex={1}
                mx={6}
                flexWrap="wrap"
                gap={2}
                align="center"
                justify={['flex-start', 'center']}
              >
                <Text fontSize="sm" color={currentColors.white} fontWeight="medium">
                  Team Members:
                </Text>
                {team.members.map((member, idx) => (
                  <HStack
                    key={idx}
                    spacing={1.5}
                    px={3}
                    py={1}
                    bg="whiteAlpha.100"
                    borderRadius="full"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg={currentColors.green.base}
                      flexShrink={0}
                    />
                    <Text fontSize="sm" color={currentColors.white} fontWeight="medium">
                      {member.rsn || member.discordUsername || member.discordUserId}
                    </Text>
                  </HStack>
                ))}
              </Flex>
            )}

            {/* Right: Prize Pot + Inn button (Completed stat removed) */}
            <HStack spacing={3} flexWrap="wrap" alignSelf="flex-start" flexShrink={0}>
              <Stat
                bg={currentColors.cardBg}
                px={4}
                py={2}
                borderRadius="md"
                minW="100px"
                textAlign="center"
              >
                <StatLabel fontSize="xs" color={currentColors.textColor}>
                  Prize Pot
                </StatLabel>
                <StatNumber fontSize="lg" color={currentColors.green.base}>
                  {formatGP(team.currentPot || 0)} GP
                </StatNumber>
              </Stat>
              {availableInns > 0 && (
                <Button
                  bg="yellow.400"
                  color="gray.900"
                  fontWeight="semibold"
                  leftIcon={<Icon as={MdHome} />}
                  onClick={onAvailableInnsOpen}
                  animation="pulseInn 2s ease-in-out infinite"
                  sx={{
                    '@keyframes pulseInn': {
                      '0%,100%': { boxShadow: '0 0 0 0 rgba(236,201,75,0.6)' },
                      '50%': { boxShadow: '0 0 12px 4px rgba(236,201,75,0.8)' },
                    },
                  }}
                >
                  🏠 {availableInns} Inn{availableInns > 1 ? 's' : ''} Available!
                </Button>
              )}
            </HStack>
          </Flex>

          {adminMode && (
            <Box bg={currentColors.red.base} color="white" p={3} borderRadius="md" fontSize="sm">
              <Text fontWeight="semibold">⚠️ Admin Mode Active</Text>
              <Text fontSize="xs" mt={1}>
                Click any node in the map or list below to view details and toggle completion
                status.
              </Text>
            </Box>
          )}

          {/* ── TUTORIAL (first-timers only) ── */}
          {!adminMode && (
            <TreasureHuntTutorial
              eventPassword={event.eventPassword}
              colorMode={colorMode}
              compact={team.completedNodes?.length === 0}
              eventId={eventId}
              collapsed={isAdmin}
            />
          )}

          {/* ── MAP ── */}
          <Box>
            <HStack justify="space-between" mb={2}>
              <GemTitle gemColor="purple" w="100%" size="sm" mb={0}>
                🗺️ Treasure Map
              </GemTitle>
              <Text fontSize="xs" color="gray.400">
                {adminMode
                  ? 'Admin mode: click any node to manage'
                  : 'Click an available node to view details'}
              </Text>
            </HStack>
            <TreasureMapVisualization
              nodes={nodes}
              team={team}
              event={event}
              onNodeClick={handleNodeClick}
              adminMode={adminMode}
              onAdminComplete={handleAdminCompleteNode}
              onAdminUncomplete={handleAdminUncompleteNode}
              currentUser={user}
              onScrollToNode={scrollToNodeCard}
            />
          </Box>

          {/* ── Available Tasks STRIP ── */}
          {(() => {
            const availableNodes = nodes
              .filter((n) => {
                const status = getNodeStatus(n);
                return (
                  status === 'available' ||
                  (n.nodeType === 'INN' &&
                    status === 'completed' &&
                    !team.innTransactions?.some((t) => t.nodeId === n.nodeId))
                );
              })
              .sort((a, b) => {
                const aIsInnNoTx = a.nodeType === 'INN' && getNodeStatus(a) === 'completed';
                const bIsInnNoTx = b.nodeType === 'INN' && getNodeStatus(b) === 'completed';
                const aBuffed = !!a.objective?.appliedBuff;
                const bBuffed = !!b.objective?.appliedBuff;
                if (aIsInnNoTx !== bIsInnNoTx) return aIsInnNoTx ? -1 : 1;
                if (aBuffed !== bBuffed) return aBuffed ? -1 : 1;
                return 0;
              });

            if (availableNodes.length === 0) return null;

            return (
              <Box>
                <HStack justify="space-between" mb={3}>
                  <GemTitle gemColor="green" size="sm" mb={0}>
                    Available Tasks
                  </GemTitle>
                  <Badge
                    bg={currentColors.green.base}
                    color="white"
                    fontSize="sm"
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {availableNodes.length} available
                  </Badge>
                </HStack>

                <Box position="relative">
                  <Box
                    position="absolute"
                    left="-4px"
                    top={0}
                    bottom={3}
                    w="48px"
                    bgGradient={`linear(to-r, ${sectionBg}, transparent)`}
                    zIndex={1}
                    pointerEvents="none"
                    borderLeftRadius="lg"
                    opacity={showLeftFade ? 1 : 0}
                    transition="opacity 0.2s"
                  />
                  <Box
                    position="absolute"
                    right="-4px"
                    top={0}
                    bottom={3}
                    w="48px"
                    bgGradient={`linear(to-l, ${sectionBg}, transparent)`}
                    zIndex={1}
                    pointerEvents="none"
                    borderRightRadius="lg"
                    opacity={showRightFade ? 1 : 0}
                    transition="opacity 0.2s"
                  />
                  <Box
                    ref={scrollRef}
                    overflowX="auto"
                    pb={3}
                    onScroll={handleQuestScroll}
                    css={{
                      '&::-webkit-scrollbar': { height: '6px' },
                      '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                        borderRadius: '10px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#abb8ceff',
                        borderRadius: '10px',
                        '&:hover': { background: '#718096' },
                      },
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#abb8ceff transparent',
                    }}
                  >
                    <HStack spacing={3} align="stretch" width="max-content" px={1} py={1}>
                      {availableNodes.map((node) => {
                        const isInn = node.nodeType === 'INN';
                        const hasBuffApplied = !!node.objective?.appliedBuff;
                        const diffMap = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };
                        const diffColor = { 1: 'green', 3: 'orange', 5: 'red' };
                        const accentColor = isInn
                          ? 'yellow.400'
                          : hasBuffApplied
                          ? 'blue.400'
                          : node.difficultyTier === 5
                          ? 'red.400'
                          : node.difficultyTier === 3
                          ? 'orange.400'
                          : 'green.400';

                        return (
                          <Box
                            id={`node-card-${node.nodeId}`}
                            key={node.nodeId}
                            w="220px"
                            flexShrink={0}
                            bg={
                              flashNodeId === node.nodeId
                                ? undefined // let the animation handle bg
                                : colorMode === 'dark'
                                ? 'whiteAlpha.100'
                                : 'white'
                            }
                            borderRadius="lg"
                            overflow="hidden"
                            border="1px solid"
                            borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
                            cursor="pointer"
                            _hover={{
                              transform: 'translateY(-4px)',
                              shadow: 'xl',
                              borderColor: accentColor,
                            }}
                            onClick={() => handleNodeClick(node)}
                            position="relative"
                            transition="background 0.3s ease"
                            sx={
                              flashNodeId === node.nodeId
                                ? {
                                    animation: 'cardFlash 0.5s ease-in-out 4',
                                    '@keyframes cardFlash': {
                                      '0%, 100%': {
                                        background: 'rgba(166, 255, 230, 0.85)',
                                      },
                                      '50%': {
                                        background: 'rgba(166, 255, 219, 0.5)',
                                      },
                                    },
                                  }
                                : {}
                            }
                          >
                            <Box h="4px" bg={accentColor} w="100%" />
                            <Flex flexDirection="column" h="100%" p={3}>
                              <HStack justify="space-between" mb={2}>
                                <Badge
                                  colorScheme={
                                    isInn ? 'yellow' : diffColor[node.difficultyTier] || 'gray'
                                  }
                                  fontSize="xs"
                                >
                                  {isInn ? '🏠 Inn' : diffMap[node.difficultyTier] || node.nodeType}
                                </Badge>
                                {hasBuffApplied && (
                                  <Badge colorScheme="blue" fontSize="xs">
                                    ✨ Buffed
                                  </Badge>
                                )}
                                {!hasBuffApplied && node.rewards?.buffs?.length > 0 && (
                                  <Badge colorScheme="purple" fontSize="xs">
                                    🎁 Buff
                                  </Badge>
                                )}
                              </HStack>
                              <Text
                                fontWeight="semibold"
                                color={colorMode === 'dark' ? 'white' : 'gray.800'}
                                fontSize="sm"
                                mb={1}
                                noOfLines={2}
                              >
                                {node.title}
                              </Text>
                              {node.objective && !isInn && (
                                <Text
                                  fontSize="xs"
                                  color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                                  noOfLines={2}
                                  mb={2}
                                >
                                  {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                                  {node.objective.target}
                                  {hasBuffApplied && (
                                    <Text as="span" color="blue.300">
                                      {' '}
                                      (-{(node.objective.appliedBuff.reduction * 100).toFixed(0)}%)
                                    </Text>
                                  )}
                                </Text>
                              )}
                              {isInn && (
                                <Text fontSize="xs" color="yellow.400" mb={2} fontWeight="semibold">
                                  Trade keys for GP →
                                </Text>
                              )}
                              <Flex
                                w="100%"
                                justifyContent="space-between"
                                alignSelf="flex-end"
                                mt="auto"
                              >
                                {node.rewards?.gp && !isInn && (
                                  <HStack spacing={1}>
                                    <Icon as={FaCoins} color="yellow.500" boxSize={3} />
                                    <Text fontSize="xs" color="yellow.500" fontWeight="semibold">
                                      {formatGP(node.rewards.gp)} GP
                                    </Text>
                                  </HStack>
                                )}
                                <Text
                                  fontSize="xs"
                                  color={colorMode === 'dark' ? 'purple.300' : 'purple.600'}
                                  ml="auto"
                                >
                                  Click to view →
                                </Text>
                              </Flex>
                            </Flex>
                          </Box>
                        );
                      })}
                    </HStack>
                  </Box>
                </Box>
              </Box>
            );
          })()}

          {/* ── STATS + BUFFS GRID ── */}
          <SimpleGrid columns={[1, 1, 2]} spacing={4}>
            <Flex bg={currentColors.cardBg} flexDirection="column" borderRadius="lg" p={4}>
              <GemTitle gemColor="blue" size="sm" mb={3} color={currentColors.textColor}>
                Stats
              </GemTitle>
              <Flex>
                <EnhancedTeamStats
                  team={team}
                  allTeams={[]}
                  totalNodes={nodes.length}
                  availableInns={availableInns}
                  onVisitInn={onAvailableInnsOpen}
                  maxCompletableNodes={maxCompletableNodes}
                />
              </Flex>
            </Flex>
            <Box bg={currentColors.cardBg} borderRadius="lg" p={4}>
              <GemTitle gemColor="yellow" size="sm" mb={3} color={currentColors.textColor}>
                Buff Inventory
              </GemTitle>
              <BuffInventory
                buffs={team.activeBuffs || []}
                colorMode={colorMode}
                onBuffClick={handleBuffClick}
              />
              {team.activeBuffs?.length > 0 && (
                <Text fontSize="xs" color="gray.400" mt={3} textAlign="center">
                  💡 Apply buffs to an active quest to reduce its requirement
                </Text>
              )}
              {(!team.activeBuffs || team.activeBuffs.length === 0) && (
                <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
                  No buffs yet — complete nodes to earn them!
                </Text>
              )}
            </Box>
          </SimpleGrid>

          <PlayerSubmissionsPanel
            submissions={teamSubmissions}
            nodes={nodes}
            teamId={teamId}
            loading={submissionsLoading}
          />

          {/* ── FULL NODE LIST ── */}

          <Accordion allowToggle>
            <AccordionItem border="none">
              <AccordionButton
                alignItems="center"
                p={3}
                borderRadius="10px"
                bg="whiteAlpha.100"
                _hover={{ bg: 'transparent' }}
                justifyContent="space-between"
              >
                <Text fontWeight="semibold" mb={0}>
                  All Nodes
                </Text>
                <HStack spacing={2}>
                  <Text fontSize="xs" color="gray.400">
                    Expand to see all {nodes.length} nodes
                  </Text>
                  <AccordionIcon color="gray.400" />
                </HStack>
              </AccordionButton>
              <AccordionPanel px={0} pb={4}>
                <VStack spacing={3} align="stretch">
                  {nodes
                    .slice()
                    .sort((a, b) => {
                      const statusA = getNodeStatus(a);
                      const statusB = getNodeStatus(b);
                      const isInnA = a.nodeType === 'INN';
                      const isInnB = b.nodeType === 'INN';
                      const hasTxA = team.innTransactions?.some((t) => t.nodeId === a.nodeId);
                      const hasTxB = team.innTransactions?.some((t) => t.nodeId === b.nodeId);
                      const isAvailableInnA = isInnA && statusA === 'available';
                      const isCompletedInnNoTxA = isInnA && statusA === 'completed' && !hasTxA;
                      const isCompletedInnNoTxB = isInnB && statusB === 'completed' && !hasTxB;
                      const hasBuffAppliedA = statusA === 'available' && !!a.objective?.appliedBuff;
                      const hasBuffAppliedB = statusB === 'available' && !!b.objective?.appliedBuff;
                      const order = (
                        status,
                        isAvailableInn,
                        isCompletedInnNoTx,
                        hasBuffApplied
                      ) => {
                        if (isAvailableInn) return 0;
                        if (isCompletedInnNoTx) return 1;
                        if (hasBuffApplied) return 2;
                        if (status === 'available') return 3;
                        if (status === 'completed') return 4;
                        return 5;
                      };
                      const orderA = order(
                        statusA,
                        isAvailableInnA,
                        isCompletedInnNoTxA,
                        hasBuffAppliedA
                      );
                      const orderB = order(
                        statusB,
                        isCompletedInnNoTxB,
                        isCompletedInnNoTxB,
                        hasBuffAppliedB
                      );
                      return orderA - orderB;
                    })
                    .map((node) => {
                      const status = getNodeStatus(node);
                      const isLocked = status === 'locked' && !adminMode;
                      const isInn = node.nodeType === 'INN';
                      const isCompletedInn = isInn && status === 'completed';
                      const hasTransaction = team.innTransactions?.some(
                        (t) => t.nodeId === node.nodeId
                      );
                      const groupCompleted = isLocationGroupCompleted(node, team, event);
                      const completedNodeInGroup = groupCompleted
                        ? getCompletedNodeInGroup(node, team, event)
                        : null;
                      const isOtherDifficultyCompleted =
                        groupCompleted && !team.completedNodes?.includes(node.nodeId);
                      const isLocationLocked = isOtherDifficultyCompleted && status !== 'completed';
                      const hasAffordableRewards =
                        isCompletedInn &&
                        !hasTransaction &&
                        node.availableRewards?.some((reward) =>
                          reward.key_cost.every((cost) => {
                            if (cost.color === 'any') {
                              const totalKeys =
                                team.keysHeld?.reduce((sum, k) => sum + k.quantity, 0) || 0;
                              return totalKeys >= cost.quantity;
                            }
                            const teamKey = team.keysHeld?.find((k) => k.color === cost.color);
                            return teamKey && teamKey.quantity >= cost.quantity;
                          })
                        );
                      const isAvailableWithBuffs =
                        status === 'available' &&
                        team.activeBuffs?.length > 0 &&
                        node.objective &&
                        team.activeBuffs.some(
                          (buff) =>
                            buff.objectiveTypes.includes(node.objective.type) &&
                            !(
                              node.objective.type === 'item_collection' &&
                              node.objective.quantity <= 3
                            )
                        );
                      const hasBuffApplied = !!node.objective?.appliedBuff;

                      return (
                        <Card
                          key={node.nodeId}
                          bg={
                            (status === 'completed' && isInn && hasTransaction) ||
                            (status === 'completed' && !isInn)
                              ? 'whiteAlpha.800'
                              : currentColors.cardBg
                          }
                          borderWidth={3}
                          borderColor={
                            isLocationLocked ? 'orange.500' : getNodeBorderColor(status, node)
                          }
                          cursor={isLocked || isLocationLocked ? 'not-allowed' : 'pointer'}
                          opacity={isLocked || isLocationLocked ? 0.7 : 1}
                          onClick={() => !isLocationLocked && handleNodeClick(node)}
                          _hover={
                            !isLocked && !isLocationLocked && (status !== 'locked' || adminMode)
                              ? { shadow: 'lg', transform: 'translateY(-2px)' }
                              : {}
                          }
                          transition="all 0.2s"
                          position="relative"
                        >
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <HStack spacing={4} flex={1}>
                                {status === 'completed' && !isLocationLocked && (
                                  <CheckCircleIcon color={currentColors.green.base} boxSize={6} />
                                )}
                                {(isLocked || isLocationLocked) && (
                                  <LockIcon color="gray.400" boxSize={6} />
                                )}
                                {status === 'available' && (
                                  <QuestionIcon color={currentColors.orange} boxSize={6} />
                                )}

                                <VStack align="start" spacing={2} flex={1}>
                                  <HStack flexWrap="wrap">
                                    {isLocked || isLocationLocked ? (
                                      <>
                                        {isLocationLocked ? (
                                          <>
                                            <Text
                                              fontWeight="semibold"
                                              fontSize="lg"
                                              color={currentColors.textColor}
                                            >
                                              {node.title}
                                            </Text>
                                            <Badge
                                              bg="orange.500"
                                              color="white"
                                              px={2}
                                              borderRadius="md"
                                            >
                                              LOCATION COMPLETED
                                            </Badge>
                                          </>
                                        ) : (
                                          <>
                                            <RedactedText length="long" />
                                            <Badge
                                              bg={getNodeBorderColor(status, node)}
                                              color="white"
                                              px={2}
                                              borderRadius="md"
                                            >
                                              LOCKED
                                            </Badge>
                                          </>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Text
                                          fontWeight="semibold"
                                          fontSize="lg"
                                          color={currentColors.textColor}
                                        >
                                          {isInn ? '🏠 ' : ''}
                                          {node.title}
                                        </Text>
                                        <Badge
                                          bg={getNodeBorderColor(status, node)}
                                          color="white"
                                          px={2}
                                          borderRadius="md"
                                        >
                                          {node.nodeType === 'STANDARD'
                                            ? getNodeBadge(node).toUpperCase()
                                            : node.nodeType}
                                        </Badge>
                                        {status !== 'completed' &&
                                          node.rewards?.buffs?.length > 0 && (
                                            <Badge colorScheme="purple" fontSize="xs">
                                              🎁 Earn a Buff
                                            </Badge>
                                          )}
                                        {hasAffordableRewards && !adminMode && (
                                          <Badge colorScheme="yellow" fontSize="xs">
                                            💰 Rewards available - Click to trade
                                          </Badge>
                                        )}
                                        {isCompletedInn && hasTransaction && !adminMode && (
                                          <Badge colorScheme="green" fontSize="xs">
                                            ✅ Already purchased from this Inn
                                          </Badge>
                                        )}
                                        {hasBuffApplied && (
                                          <Badge colorScheme="green" fontSize="xs">
                                            💪 Buff Applied
                                          </Badge>
                                        )}
                                        {isCompletedInn &&
                                          !hasTransaction &&
                                          !hasAffordableRewards &&
                                          !adminMode && (
                                            <Badge colorScheme="gray" fontSize="xs">
                                              🙈 Not enough keys for trades
                                            </Badge>
                                          )}
                                        {isAvailableWithBuffs && (
                                          <Badge colorScheme="blue" fontSize="xs">
                                            ✨ Can Apply A Buff
                                          </Badge>
                                        )}
                                        {adminMode && (
                                          <Badge
                                            colorScheme={status === 'completed' ? 'red' : 'green'}
                                            fontSize="xs"
                                          >
                                            Click to view
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </HStack>

                                  {isLocationLocked ? (
                                    <VStack align="start" spacing={1} w="full">
                                      <Text fontSize="sm" color="orange.500">
                                        Your team completed:{' '}
                                        <strong>{completedNodeInGroup?.title}</strong>
                                      </Text>
                                      <Text fontSize="xs" color={theme.colors.gray[500]}>
                                        Only one difficulty per location can be completed
                                      </Text>
                                    </VStack>
                                  ) : isLocked ? (
                                    <VStack align="start" spacing={1} w="full">
                                      <RedactedText length="full" />
                                      <RedactedText length="long" />
                                    </VStack>
                                  ) : (
                                    <VStack align="start" spacing={2} w="full">
                                      <Text fontSize="sm" color={theme.colors.gray[600]}>
                                        {node.description}
                                      </Text>
                                      {node.objective && status === 'available' && (
                                        <Box
                                          w="full"
                                          p={2}
                                          bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                                          borderRadius="md"
                                        >
                                          <Text
                                            fontSize="xs"
                                            fontWeight="semibold"
                                            color={currentColors.textColor}
                                          >
                                            Objective:
                                          </Text>
                                          <Text fontSize="sm" color={currentColors.textColor}>
                                            {OBJECTIVE_TYPES[node.objective.type]}:{' '}
                                            {node.objective.quantity} {node.objective.target}
                                          </Text>
                                          {node.objective?.appliedBuff && (
                                            <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                              ✨ {node.objective.appliedBuff.buffName} applied (-
                                              {(node.objective.appliedBuff.reduction * 100).toFixed(
                                                0
                                              )}
                                              %)
                                            </Badge>
                                          )}
                                        </Box>
                                      )}
                                      {isAvailableWithBuffs &&
                                        adminMode &&
                                        !node.objective?.appliedBuff && (
                                          <Button
                                            size="sm"
                                            colorScheme="blue"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenBuffModal(node);
                                            }}
                                            leftIcon={<Text>✨</Text>}
                                            w="full"
                                          >
                                            Apply Buff to Reduce Requirement
                                          </Button>
                                        )}
                                    </VStack>
                                  )}
                                </VStack>
                              </HStack>

                              {(isLocked || isLocationLocked) && (
                                <Box
                                  position="absolute"
                                  top={0}
                                  left={0}
                                  right={0}
                                  bottom={0}
                                  bg={
                                    isLocationLocked
                                      ? 'rgba(255, 140, 0, 0.1)'
                                      : colorMode === 'dark'
                                      ? 'rgba(0,0,0,0.3)'
                                      : 'rgba(255,255,255,0.3)'
                                  }
                                  backdropFilter={isLocationLocked ? undefined : 'blur(2px)'}
                                  borderRadius="md"
                                  pointerEvents="none"
                                />
                              )}

                              {isLocked ? (
                                <VStack align="end" spacing={1}>
                                  <RedactedText length="short" />
                                  <HStack spacing={1}>
                                    <RedactedText length="short" />
                                  </HStack>
                                </VStack>
                              ) : (
                                node.rewards &&
                                !isInn &&
                                (adminMode || status === 'completed') && (
                                  <VStack align="end" spacing={1}>
                                    <Text fontWeight="semibold" color={currentColors.green.base}>
                                      {formatGP(node.rewards.gp)}
                                    </Text>
                                    {node.rewards.keys?.length > 0 && (
                                      <HStack spacing={1} flexWrap="wrap" justify="flex-end">
                                        {node.rewards.keys.map((key, idx) => (
                                          <Badge key={idx} colorScheme={key.color} size="sm">
                                            {key.quantity} {key.color}
                                          </Badge>
                                        ))}
                                      </HStack>
                                    )}
                                  </VStack>
                                )
                              )}
                            </HStack>

                            {isLocked && (
                              <Box
                                position="absolute"
                                top={0}
                                left={0}
                                right={0}
                                bottom={0}
                                bg={
                                  colorMode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                                }
                                backdropFilter={isLocationLocked ? undefined : 'blur(2px)'}
                                borderRadius="md"
                                pointerEvents="none"
                              />
                            )}
                          </CardBody>
                        </Card>
                      );
                    })}
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Section>

      {/* Dev panel */}
      {isAdmin && process.env.NODE_ENV === 'development' && (
        <DevTestPanel eventId={eventId} teamId={teamId} onSuccess={refetchTeam} />
      )}

      {/* ── MODALS ── */}
      <NodeDetailModal
        isOpen={isNodeOpen}
        onClose={onNodeClose}
        node={selectedNode}
        team={team}
        event={event}
        adminMode={adminMode}
        onAdminComplete={handleAdminCompleteNode}
        onAdminUncomplete={handleAdminUncompleteNode}
        onOpenBuffModal={handleOpenBuffModal}
        onApplyBuff={(node) => {
          onNodeClose();
          handleOpenBuffModal(node);
        }}
        onVisitInn={async () => {
          await handleVisitInn(selectedNode.nodeId);
          onInnOpen();
        }}
        currentUser={user}
        appliedBuff={selectedNode?.objective?.appliedBuff}
        lastCompletedNodeId={lastCompletedNodeId}
      />
      <InnModal
        isOpen={isInnOpen}
        onClose={onInnClose}
        node={selectedNode}
        team={team}
        eventId={eventId}
        currentUser={user}
        onPurchaseComplete={refetchTeam}
      />
      <BuffApplicationModal
        isOpen={isBuffModalOpen}
        onClose={onBuffModalClose}
        buff={selectedBuff}
        node={selectedNode}
        team={team}
        eventId={eventId}
        onApplyBuff={handleApplyBuff}
        availableBuffs={team?.activeBuffs || []}
      />
      <AvailableInnsModal
        isOpen={isAvailableInnsOpen}
        onClose={onAvailableInnsClose}
        availableInns={getAvailableInnsList()}
        onSelectInn={handleSelectInn}
      />
      <BuffApplicationListModal
        isOpen={isBuffListOpen}
        onClose={onBuffListClose}
        selectedBuff={selectedBuff}
        availableNodes={selectedBuff ? getNodesForBuff(selectedBuff) : []}
        onSelectNode={handleSelectNodeFromBuffList}
      />
      <TeamAccessOverlay accessCheck={accessCheck} team={team} event={event} />
    </Flex>
  );
};

export default TreasureTeamView;
