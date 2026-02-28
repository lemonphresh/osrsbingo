import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  Container,
  useDisclosure,
  Switch,
  useToast,
  Icon,
  SimpleGrid,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_TREASURE_TEAM, GET_ALL_SUBMISSIONS } from '../graphql/queries';
import PlayerSubmissionsPanel from '../organisms/TreasureHunt/PlayerSubmissionsPanel';
import BuffHistoryPanel from '../organisms/TreasureHunt/BuffHistoryPanel';
import {
  ADMIN_COMPLETE_NODE,
  ADMIN_UNCOMPLETE_NODE,
  APPLY_BUFF_TO_NODE,
  VISIT_INN,
  SUBMISSION_ADDED_SUB,
  SUBMISSION_REVIEWED_SUB,
} from '../graphql/mutations';
import NodeDetailModal from '../organisms/TreasureHunt/NodeDetailModal';
import InnModal from '../organisms/TreasureHunt/TreasureInnModal';
import BuffApplicationModal from '../organisms/TreasureHunt/TreasureBuffApplicationModal';
import Section from '../atoms/Section';
import TreasureMapVisualization from '../organisms/TreasureHunt/TreasureMapVisualization';
import GemTitle from '../atoms/GemTitle';
import BuffInventory from '../organisms/TreasureHunt/TreasureBuffInventory';
import { useAuth } from '../providers/AuthProvider';
import { MdOutlineArrowBack } from 'react-icons/md';
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
import { FaCog } from 'react-icons/fa';
import AvailableTasksStrip from '../organisms/TreasureHunt/AvailableTasksStrip';
import AllNodesAccordion from '../organisms/TreasureHunt/AllNodesAccordion';
import TeamHeroStrip from '../organisms/TreasureHunt/TeamHeroStrip';

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
    await refetchTeam();
    await refetchEvent();
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

  const {
    data: submissionsData,
    loading: submissionsLoading,
    refetch: refetchSubmissions,
  } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
    pollInterval: 5 * 60 * 1000,
  });

  useSubscription(SUBMISSION_ADDED_SUB, {
    variables: { eventId },
    skip: !eventId,
    onData: () => refetchSubmissions(),
  });

  useSubscription(SUBMISSION_REVIEWED_SUB, {
    variables: { eventId },
    skip: !eventId,
    onData: () => refetchSubmissions(),
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
      if (buff.objectiveTypes && buff.objectiveTypes.length > 0) {
        if (!buff.objectiveTypes.includes(node.objective.type)) return false;
      }
      // Mirror server-side canApplyBuff: item_collection with <= 3 items can't be reduced
      if (node.objective.type === 'item_collection' && node.objective.quantity <= 3) return false;
      // Buff must result in a meaningful reduction
      const reduced = Math.ceil(node.objective.quantity * (1 - buff.reduction));
      if (reduced === 0 || reduced >= node.objective.quantity) return false;
      return true;
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
    setTimeout(() => setFlashNodeId(null), 2000);
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
      const { data: freshEventData } = await refetchEvent();
      const updatedNode = freshEventData?.getTreasureEvent?.nodes?.find(
        (n) => n.nodeId === selectedNode.nodeId
      );
      if (updatedNode) setSelectedNode(updatedNode);
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

  // Refetch team data when tab regains focus
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchTeam();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refetchTeam]);

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
          <TeamHeroStrip
            team={team}
            event={event}
            adminMode={adminMode}
            currentColors={currentColors}
            availableInns={availableInns}
            onAvailableInnsOpen={onAvailableInnsOpen}
            toast={toast}
          />

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
              onVisitInn={handleVisitInn}
              currentUser={user}
              onScrollToNode={scrollToNodeCard}
            />
          </Box>

          {/* ── Available Tasks STRIP ── */}
          <AvailableTasksStrip
            nodes={nodes}
            team={team}
            getNodeStatus={getNodeStatus}
            flashNodeId={flashNodeId}
            scrollRef={scrollRef}
            handleQuestScroll={handleQuestScroll}
            showLeftFade={showLeftFade}
            showRightFade={showRightFade}
            sectionBg={sectionBg}
            colorMode={colorMode}
            currentColors={currentColors}
            handleNodeClick={handleNodeClick}
          />

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

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <PlayerSubmissionsPanel
              submissions={teamSubmissions}
              nodes={nodes}
              teamId={teamId}
              loading={submissionsLoading}
            />
            <BuffHistoryPanel buffHistory={team.buffHistory || []} nodes={nodes} />
          </SimpleGrid>

          {/* ── FULL NODE LIST ── */}
          <AllNodesAccordion
            nodes={nodes}
            team={team}
            event={event}
            adminMode={adminMode}
            getNodeStatus={getNodeStatus}
            isLocationGroupCompleted={isLocationGroupCompleted}
            getCompletedNodeInGroup={getCompletedNodeInGroup}
            getNodeBorderColor={getNodeBorderColor}
            getNodeBadge={getNodeBadge}
            handleNodeClick={handleNodeClick}
            handleOpenBuffModal={handleOpenBuffModal}
            formatGP={formatGP}
            currentColors={currentColors}
            colorMode={colorMode}
          />
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
        onApplyComplete={onNodeOpen}
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
