import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  FormLabel,
  useToast,
  Button,
  Icon,
  Tooltip,
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

const TreasureTeamView = () => {
  const { colors: currentColors, colorMode } = useThemeColors();

  const { eventId, teamId } = useParams();
  const toast = useToast();
  const [selectedBuff, setSelectedBuff] = useState(null);

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

  const { data: eventData, loading: eventLoading } = useQuery(GET_TREASURE_EVENT, {
    variables: { eventId },
  });

  const {
    data: teamData,
    loading: teamLoading,
    refetch: refetchTeam,
  } = useQuery(GET_TREASURE_TEAM, {
    variables: { eventId, teamId },
  });

  const [adminCompleteNode] = useMutation(ADMIN_COMPLETE_NODE);
  const [adminUncompleteNode] = useMutation(ADMIN_UNCOMPLETE_NODE);
  const [applyBuffToNode] = useMutation(APPLY_BUFF_TO_NODE, {
    refetchQueries: ['GetTreasureEvent', 'GetTreasureTeam'],
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  const event = eventData?.getTreasureEvent;
  const team = teamData?.getTreasureTeam;
  const nodes = event?.nodes || [];
  const { user } = useAuth();
  const isAdmin =
    user && event && (user.id === event.creatorId || event.adminIds?.includes(user.id));

  const checkTeamAccess = () => {
    // Admins can view any team
    if (isAdmin) {
      return { hasAccess: true, reason: 'authorized' };
    }

    // Check if user has Discord linked
    if (!user?.discordUserId) {
      return { hasAccess: false, reason: 'no_discord' };
    }

    // Check if user's Discord ID is in the team's member list
    const isTeamMember =
      user?.discordUserId &&
      team?.members?.some((m) => m.toString() === user.discordUserId.toString());
    if (!isTeamMember) {
      return { hasAccess: false, reason: 'not_member' };
    }

    return { hasAccess: true, reason: 'authorized' };
  };
  const { data: submissionsData, loading: submissionsLoading } = useQuery(GET_ALL_SUBMISSIONS, {
    variables: { eventId },
  });

  const accessCheck = checkTeamAccess();

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

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

    // Check if any node in this group has been completed by this team
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
    // Preserve special node types
    if (node.nodeType === 'START') return currentColors.purple.base;
    if (node.nodeType === 'INN') return currentColors.yellow.base;
    if (status === 'locked') return colorMode === 'dark' ? '#4A5568' : '#CBD5E0';
    if (status === 'completed') return currentColors.green.base;
    // difficultyTier: 1 (easy), 3 (medium), 5 (hard)
    const tier = parseInt(node.difficultyTier);

    if (tier === 5) return currentColors.red.base; // hard = red
    if (tier === 3) return currentColors.orange.base;
    if (tier === 1) return currentColors.green.base; // easy = green

    // Fallbacks if tier missing
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

      if (!buff.objectiveTypes || buff.objectiveTypes.length === 0) {
        return true;
      }

      return buff.objectiveTypes.includes(node.objective.type);
    });
  };

  const handleNodeClick = useCallback(
    (node) => {
      // Calculate status inside the callback using current team state
      let status = 'locked';
      if (team) {
        if (team.completedNodes?.includes(node.nodeId)) status = 'completed';
        else if (team.availableNodes?.includes(node.nodeId)) status = 'available';
      }

      // In admin mode, allow viewing locked nodes
      if (status === 'locked' && !adminMode) return;

      setSelectedNode({ ...node, status });

      // Open Inn modal for completed Inn nodes (unless in admin mode)
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

  const handleAdminCompleteNode = async (nodeId) => {
    try {
      await adminCompleteNode({
        variables: { eventId, teamId, nodeId },
      });
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
      await adminUncompleteNode({
        variables: { eventId, teamId, nodeId },
      });
      await refetchTeam();
      toast({
        title: 'Node un-completed',
        description: 'Successfully removed completion status',
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

  const handleApplyBuff = async (buffId) => {
    try {
      await applyBuffToNode({
        variables: {
          eventId,
          teamId,
          nodeId: selectedNode.nodeId,
          buffId,
        },
      });
      await refetchTeam();
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

  usePageTitle(event ? `Gielinor Rush - ${team ? team.teamName : 'Team'}` : 'Gielinor Rush Team');

  const teamSubmissions = useMemo(() => {
    const allSubmissions = submissionsData?.getAllSubmissions || [];

    return allSubmissions
      .filter((s) => s.teamId === teamId || s.team?.teamId === teamId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 10);
  }, [submissionsData?.getAllSubmissions, teamId]);

  useSubmissionCelebrations(eventId, teamId, nodes, true, () => {
    refetchTeam();
  });

  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      document.removeEventListener('mousemove', unlock);
    };
    document.addEventListener('mousemove', unlock);
    return () => document.removeEventListener('mousemove', unlock);
  }, []);

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
          flexDirection={['column', 'row', 'row']}
          justifyContent="space-between"
          marginBottom="16px"
          maxWidth="1200px"
          width="100%"
        >
          <Text
            alignItems="center"
            display="inline-flex"
            _hover={{
              borderBottom: '1px solid white',
              marginBottom: '0px',
            }}
            fontWeight="bold"
            justifyContent="center"
            marginBottom="1px"
          >
            <Icon as={MdOutlineArrowBack} marginRight="8px" />
            <Link to={`/gielinor-rush`}> Back to Events</Link>
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

  return (
    <>
      {' '}
      <DevTestPanel />
      <Flex
        alignItems="center"
        flex="1"
        flexDirection="column"
        height="100%"
        paddingY={['40px', '56px']}
        marginX="12px"
      >
        <TeamAccessOverlay
          show={event.status === 'ACTIVE' && !accessCheck.hasAccess}
          reason={accessCheck.reason}
          eventId={eventId}
          teamName={team?.teamName || 'this team'}
          userDiscordId={user?.discordUserId}
          hasLinkedDiscord={!!user?.discordUserId}
        />
        <Flex
          alignItems="center"
          flexDirection={['column', 'row', 'row']}
          justifyContent="space-between"
          marginBottom="16px"
          maxWidth="1200px"
          width="100%"
        >
          <Text
            alignItems="center"
            display="inline-flex"
            _hover={{
              borderBottom: '1px solid white',
              marginBottom: '0px',
            }}
            fontWeight="bold"
            justifyContent="center"
            marginBottom="1px"
          >
            <Icon as={MdOutlineArrowBack} marginRight="8px" />
            <Link to={`/gielinor-rush/${eventId}`}> Event Overview</Link>
          </Text>
        </Flex>
        <Section maxWidth="1200px" width="100%" py={8}>
          <VStack position="relative" spacing={8} align="stretch" width="100%">
            {isAdmin && (
              <FormControl
                position="absolute"
                alignSelf="end"
                display="flex"
                alignItems="center"
                w="auto"
              >
                <FormLabel htmlFor="admin-mode" mb="0" fontSize="sm" color={currentColors.white}>
                  Admin Mode
                </FormLabel>
                <Switch
                  id="admin-mode"
                  colorScheme="purple"
                  isChecked={adminMode}
                  onChange={(e) => setAdminMode(e.target.checked)}
                />
              </FormControl>
            )}
            <VStack align="center" spacing={1}>
              <GemTitle maxW="720px" size="xl" color={currentColors.textColor}>
                {team.teamName}
              </GemTitle>
              <Tooltip label="Click to copy Event ID" hasArrow>
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
                    navigator.clipboard.writeText(event.eventId);
                    toast({
                      title: 'Event ID Copied!',
                      description: `Event ID: ${event.eventId}`,
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    });
                  }}
                >
                  <Text fontSize="xs" color={currentColors.orange} fontFamily="mono">
                    ID: {event.eventId}
                  </Text>
                  <Icon as={CopyIcon} boxSize={3} color={currentColors.orange} />
                </HStack>
              </Tooltip>
              {event.eventPassword && (
                <Tooltip label="Click to copy Event ID" hasArrow>
                  <HStack
                    spacing={2}
                    px={3}
                    py={1}
                    mt={2}
                    bg="whiteAlpha.100"
                    borderRadius="md"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: 'whiteAlpha.400' }}
                    onClick={() => {
                      navigator.clipboard.writeText(event.eventPassword);
                      toast({
                        title: 'Event Password Copied!',
                        description: `Event Password: ${event.eventPassword}`,
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      });
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

            {adminMode && (
              <Box bg={currentColors.red.base} color="white" p={3} borderRadius="md" fontSize="sm">
                <Text fontWeight="bold">⚠️ Admin Mode Active</Text>
                <Text fontSize="xs" mt={1}>
                  Click any node in the map or list below to view details and toggle completion
                  status.
                </Text>
              </Box>
            )}

            {team.completedNodes?.length === 0 && !adminMode && (
              <>
                <TreasureHuntTutorial
                  collapsed={isAdmin}
                  colorMode={colorMode}
                  compact={false}
                  eventId={eventId}
                />
                <hr />
              </>
            )}

            <EnhancedTeamStats
              team={team}
              allTeams={[]}
              totalNodes={nodes.length}
              availableInns={availableInns}
              onVisitInn={isAvailableInnsOpen}
            />
            <PlayerSubmissionsPanel
              submissions={teamSubmissions}
              nodes={nodes}
              teamId={teamId}
              loading={submissionsLoading}
            />

            <hr />

            <Box>
              <HStack w="100%" justify="center" mb={4}>
                <GemTitle mb={1} gemColor="yellow" size="sm" color={currentColors.textColor}>
                  Available Buffs
                </GemTitle>
              </HStack>
              <BuffInventory
                buffs={team.activeBuffs || []}
                colorMode={colorMode}
                onBuffClick={handleBuffClick}
              />{' '}
              {team.activeBuffs && team.activeBuffs.length > 0 && (
                <Text fontSize="xs" color="gray.300" mt={2} textAlign="center">
                  💡 Tip: Apply buffs when viewing available nodes to reduce objective requirements
                </Text>
              )}
            </Box>
            <hr />

            <Box>
              <GemTitle
                m="0 auto"
                w="fit-content"
                gemColor="purple"
                size="sm"
                my={4}
                color={currentColors.textColor}
              >
                Treasure Map
              </GemTitle>
              <Text fontSize="sm" color={theme.colors.gray[200]} my={4} textAlign="center">
                Click on any available node to view details.
                {adminMode
                  ? ' (Admin Mode: Click nodes to manage completion)'
                  : ' Completed Inns can be visited to trade keys for GP.'}
              </Text>

              <TreasureMapVisualization
                nodes={nodes}
                team={team}
                event={event}
                onNodeClick={handleNodeClick}
                adminMode={adminMode}
                onAdminComplete={handleAdminCompleteNode}
                onAdminUncomplete={handleAdminUncompleteNode}
              />

              <VStack mt={4} spacing={4} align="stretch">
                {availableInns > 0 && (
                  <Box
                    p={4}
                    bg="green.100"
                    width="fit-content"
                    borderRadius="md"
                    m="0 auto"
                    cursor="pointer"
                    onClick={onAvailableInnsOpen}
                    _hover={{
                      bg: 'green.200',
                      transform: 'translateY(-2px)',
                      shadow: 'lg',
                    }}
                    transition="all 0.2s"
                  >
                    <HStack>
                      <Icon
                        as={MdHome}
                        color="green.600"
                        height={['48px', '32px']}
                        width={['48px', '32px']}
                      />
                      <Text color={currentColors.textColor}>
                        You have {availableInns} available Inn
                        {availableInns !== 1 ? 's' : ''} to purchase from.
                      </Text>
                      <Text color="green.700" fontSize="sm" fontWeight="bold">
                        Click to view →
                      </Text>
                    </HStack>
                  </Box>
                )}
                {nodes
                  .slice()
                  .sort((a, b) => {
                    const statusA = getNodeStatus(a);
                    const statusB = getNodeStatus(b);

                    const isInnA = a.nodeType === 'INN';
                    const isInnB = b.nodeType === 'INN';

                    const hasTxA = team.innTransactions?.some((t) => t.nodeId === a.nodeId);
                    const hasTxB = team.innTransactions?.some((t) => t.nodeId === b.nodeId);

                    // Available inn (not yet visited/completed)
                    const isAvailableInnA = isInnA && statusA === 'available';

                    // Completed inn that hasn't been purchased from yet
                    const isCompletedInnNoTxA = isInnA && statusA === 'completed' && !hasTxA;
                    const isCompletedInnNoTxB = isInnB && statusB === 'completed' && !hasTxB;

                    // Available node with a buff already applied
                    const hasBuffAppliedA = statusA === 'available' && !!a.objective?.appliedBuff;
                    const hasBuffAppliedB = statusB === 'available' && !!b.objective?.appliedBuff;

                    // Order:
                    // 0 - Unvisited inns (available)
                    // 1 - Completed inns w/o transaction (purchases available)
                    // 2 - Available nodes with buff applied
                    // 3 - Available nodes (no buff)
                    // 4 - Completed (inns with tx, or regular nodes)
                    // 5 - Locked
                    const order = (status, isAvailableInn, isCompletedInnNoTx, hasBuffApplied) => {
                      if (isAvailableInn) return 0;
                      if (isCompletedInnNoTx) return 1;
                      if (hasBuffApplied) return 2;
                      if (status === 'available') return 3;
                      if (status === 'completed') return 4;
                      return 5; // locked
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

                    // Check if team has already made a transaction at this Inn
                    const hasTransaction = team.innTransactions?.some(
                      (t) => t.nodeId === node.nodeId
                    );

                    const groupCompleted = isLocationGroupCompleted(node, team, event);
                    const completedNodeInGroup = groupCompleted
                      ? getCompletedNodeInGroup(node, team, event)
                      : null;
                    const isOtherDifficultyCompleted =
                      groupCompleted && !team.completedNodes?.includes(node.nodeId);

                    // If another difficulty at this location was completed, this node should be locked
                    const isLocationLocked = isOtherDifficultyCompleted && status !== 'completed';

                    // Check if this Inn has rewards the team can afford (and hasn't been purchased from yet)
                    const hasAffordableRewards =
                      isCompletedInn &&
                      !hasTransaction && // Only show if no transaction has been made at this Inn
                      node.availableRewards?.some((reward) => {
                        // Check if team can afford this reward
                        return reward.key_cost.every((cost) => {
                          if (cost.color === 'any') {
                            // For "any" color, sum all keys
                            const totalKeys =
                              team.keysHeld?.reduce((sum, k) => sum + k.quantity, 0) || 0;
                            return totalKeys >= cost.quantity;
                          }
                          // For specific colors, check that exact color
                          const teamKey = team.keysHeld?.find((k) => k.color === cost.color);
                          return teamKey && teamKey.quantity >= cost.quantity;
                        });
                      });

                    const isAvailableWithBuffs =
                      status === 'available' &&
                      team.activeBuffs?.length > 0 &&
                      node.objective &&
                      team.activeBuffs.some((buff) =>
                        buff.objectiveTypes.includes(node.objective.type)
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
                                            fontWeight="bold"
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
                                            bg={getNodeBorderColor(status, node.nodeType)}
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
                                        fontWeight="bold"
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
                                        node.rewards?.buffs &&
                                        node.rewards.buffs.length > 0 && (
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

                                    {/* Show objective with buff indicator if already applied */}
                                    {node.objective && status === 'available' && (
                                      <Box
                                        w="full"
                                        p={2}
                                        bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                                        borderRadius="md"
                                      >
                                        <Text
                                          fontSize="xs"
                                          fontWeight="bold"
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

                                    {/* Show apply buff button if buffs available and no buff applied yet */}
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
                                  <Text fontWeight="bold" color={currentColors.green.base}>
                                    {formatGP(node.rewards.gp)}
                                  </Text>
                                  {node.rewards.keys && node.rewards.keys.length > 0 && (
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
            </Box>
          </VStack>
        </Section>

        <NodeDetailModal
          isOpen={isNodeOpen}
          onClose={onNodeClose}
          node={selectedNode}
          team={team}
          adminMode={adminMode}
          onAdminComplete={handleAdminCompleteNode}
          onAdminUncomplete={handleAdminUncompleteNode}
          onApplyBuff={(node) => {
            onNodeClose();
            handleOpenBuffModal(node);
          }}
          currentUser={user}
          event={event}
          appliedBuff={selectedNode?.objective?.appliedBuff}
        />

        <InnModal
          isOpen={isInnOpen}
          onClose={onInnClose}
          node={selectedNode}
          team={team}
          currentUser={user}
          eventId={eventId}
          onPurchaseComplete={refetchTeam}
        />

        <BuffApplicationModal
          isOpen={isBuffModalOpen}
          onClose={onBuffModalClose}
          node={selectedNode}
          availableBuffs={team.activeBuffs || []}
          onApplyBuff={handleApplyBuff}
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
      </Flex>
    </>
  );
};

export default TreasureTeamView;
