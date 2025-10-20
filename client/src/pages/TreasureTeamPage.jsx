import React, { useState } from 'react';
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
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  useColorMode,
  Spinner,
  Container,
  useDisclosure,
  Switch,
  FormControl,
  FormLabel,
  useToast,
  Button,
} from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon, QuestionIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_TREASURE_TEAM } from '../graphql/queries';
import {
  ADMIN_COMPLETE_NODE,
  ADMIN_UNCOMPLETE_NODE,
  APPLY_BUFF_TO_NODE,
} from '../graphql/mutations';
import NodeDetailModal from '../organisms/NodeDetailModal';
import InnModal from '../organisms/TreasureInnModal';
import BuffApplicationModal from '../organisms/TreasureBuffApplicationModal';
import Section from '../atoms/Section';
import TreasureMapVisualization from '../organisms/TreasureMapVisualization';
import GemTitle from '../atoms/GemTitle';
import BuffInventory from '../organisms/TreasureBuffInventory';
import theme from '../theme';
import { RedactedText } from '../molecules/RedactedTreasureInfo';
import { useAuth } from '../providers/AuthProvider';

const TreasureTeamView = () => {
  const { colorMode } = useColorMode();
  const { eventId, teamId } = useParams();
  const toast = useToast();
  const { isOpen: isNodeOpen, onOpen: onNodeOpen, onClose: onNodeClose } = useDisclosure();
  const { isOpen: isInnOpen, onOpen: onInnOpen, onClose: onInnClose } = useDisclosure();
  const {
    isOpen: isBuffModalOpen,
    onOpen: onBuffModalOpen,
    onClose: onBuffModalClose,
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
  const [applyBuffToNode] = useMutation(APPLY_BUFF_TO_NODE);

  const [selectedNode, setSelectedNode] = useState(null);
  const [adminMode, setAdminMode] = useState(false);

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      yellow: { base: '#F4D35E' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      redacted: '#1A202C',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      yellow: { base: '#F4D35E' },
      sapphire: { base: '#19647E' },
      turquoise: { base: '#28AFB0' },
      textColor: '#171923',
      cardBg: 'white',
      redacted: '#E2E8F0',
    },
  };

  const currentColors = colors[colorMode];

  const event = eventData?.getTreasureEvent;
  const team = teamData?.getTreasureTeam;
  const nodes = event?.nodes || [];
  const { user } = useAuth();
  const isAdmin =
    user && event && (user.id === event.creatorId || event.adminIds?.includes(user.id));

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const getNodeStatus = (node) => {
    if (!team) return 'locked';
    if (team.completedNodes?.includes(node.nodeId)) return 'completed';
    if (team.availableNodes?.includes(node.nodeId)) return 'available';
    return 'locked';
  };

  const getNodeBorderColor = (status, nodeType) => {
    if (nodeType === 'START') return currentColors.purple.base;
    if (nodeType === 'INN') return currentColors.yellow.base;
    if (status === 'completed') return currentColors.green.base;
    if (status === 'available') return currentColors.turquoise.base;
    return colorMode === 'dark' ? '#4A5568' : '#CBD5E0';
  };

  const handleNodeClick = (node) => {
    const status = getNodeStatus(node);
    // In admin mode, allow viewing locked nodes
    if (status === 'locked' && !adminMode) return;

    setSelectedNode({ ...node, status });

    // Open Inn modal for completed Inn nodes (unless in admin mode)
    if (node.nodeType === 'INN' && status === 'completed' && !adminMode) {
      onInnOpen();
    } else {
      onNodeOpen();
    }
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

  if (eventLoading || teamLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Spinner size="xl" />
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

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingY={['40px', '56px']}
      marginX="12px"
    >
      <Section maxWidth="1200px" width="100%" py={8}>
        <VStack spacing={8} align="stretch" width="100%">
          <HStack justify="space-between">
            <VStack align="start" spacing={1}>
              <GemTitle size="xl" color={currentColors.textColor}>
                {team.teamName}
              </GemTitle>
              <Text color={theme.colors.gray[200]}>Team Progress</Text>
            </VStack>

            {isAdmin && (
              <FormControl display="flex" alignItems="center" w="auto">
                <FormLabel
                  htmlFor="admin-mode"
                  mb="0"
                  fontSize="sm"
                  color={currentColors.textColor}
                >
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
          </HStack>

          {adminMode && (
            <Box bg={currentColors.red.base} color="white" p={3} borderRadius="md" fontSize="sm">
              <Text fontWeight="bold">⚠️ Admin Mode Active</Text>
              <Text fontSize="xs" mt={1}>
                Click any node in the map or list below to view details and toggle completion
                status.
              </Text>
            </Box>
          )}

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
              <StatLabel color={currentColors.textColor}>Current Pot</StatLabel>
              <StatNumber color={currentColors.green.base}>{formatGP(team.currentPot)}</StatNumber>
            </Stat>
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel color={currentColors.textColor}>Nodes Completed</StatLabel>
              <StatNumber color={currentColors.textColor}>
                {team.completedNodes?.length || 0}
              </StatNumber>
            </Stat>
            <Stat
              bg={currentColors.cardBg}
              py="6px"
              minW={['216px', '216px', 'auto']}
              h="100%"
              textAlign="center"
              borderRadius="md"
            >
              <StatLabel color={currentColors.textColor}>Keys Held</StatLabel>
              <StatNumber>
                <HStack alignItems="center" h="100%" spacing={2} justifyContent="center">
                  {(!team.keysHeld || team.keysHeld.length === 0) && (
                    <Text
                      mt={2}
                      w="100%"
                      textAlign="center"
                      fontSize="md"
                      color={currentColors.textColor}
                    >
                      N/A
                    </Text>
                  )}
                  {team.keysHeld?.map((key) => (
                    <Badge key={key.color} colorScheme={key.color} fontSize="md">
                      {key.color}: {key.quantity}
                    </Badge>
                  ))}
                </HStack>
              </StatNumber>
            </Stat>
          </StatGroup>

          {/* NEW: Active Buffs Section */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md" color={currentColors.textColor}>
                Active Buffs
              </Heading>
              <Badge colorScheme="purple" fontSize="sm">
                {team.activeBuffs?.length || 0} available
              </Badge>
            </HStack>
            <BuffInventory buffs={team.activeBuffs || []} colorMode={colorMode} />
            {team.activeBuffs && team.activeBuffs.length > 0 && (
              <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                💡 Tip: Apply buffs when viewing available nodes to reduce objective requirements
              </Text>
            )}
          </Box>

          <Box>
            <Heading size="md" mb={4} color={currentColors.textColor}>
              Treasure Map
            </Heading>
            <Text color={theme.colors.gray[200]} mb={6}>
              Click on any available node to view details.
              {adminMode
                ? ' (Admin Mode: Click nodes to manage completion)'
                : ' Completed Inns can be visited to trade keys for GP.'}
            </Text>

            <TreasureMapVisualization
              nodes={nodes}
              team={team}
              onNodeClick={handleNodeClick}
              adminMode={adminMode}
              onAdminComplete={handleAdminCompleteNode}
              onAdminUncomplete={handleAdminUncompleteNode}
            />

            <VStack mt={4} spacing={4} align="stretch">
              {nodes
                .slice()
                .sort((a, b) => {
                  const statusA = getNodeStatus(a);
                  const statusB = getNodeStatus(b);

                  // Define sort order: available = 0, completed = 1, locked = 2
                  const order = { available: 0, completed: 1, locked: 2 };

                  return order[statusA] - order[statusB];
                })
                .map((node) => {
                  const status = getNodeStatus(node);
                  const isLocked = status === 'locked' && !adminMode;
                  const isInn = node.nodeType === 'INN';
                  const isCompletedInn = isInn && status === 'completed';
                  const isAvailableWithBuffs =
                    status === 'available' &&
                    team.activeBuffs?.length > 0 &&
                    node.objective &&
                    team.activeBuffs.some((buff) =>
                      buff.objectiveTypes.includes(node.objective.type)
                    );

                  return (
                    <Card
                      key={node.nodeId}
                      bg={currentColors.cardBg}
                      borderWidth={2}
                      borderColor={getNodeBorderColor(status, node.nodeType)}
                      cursor={isLocked ? 'not-allowed' : 'pointer'}
                      opacity={isLocked ? 0.7 : 1}
                      onClick={() => handleNodeClick(node)}
                      _hover={
                        !isLocked || adminMode
                          ? { shadow: 'lg', transform: 'translateY(-2px)' }
                          : {}
                      }
                      transition="all 0.2s"
                      position="relative"
                    >
                      <CardBody>
                        <HStack justify="space-between" align="start">
                          <HStack spacing={4} flex={1}>
                            {status === 'completed' && (
                              <CheckCircleIcon color={currentColors.green.base} boxSize={6} />
                            )}
                            {isLocked && <LockIcon color="gray.400" boxSize={6} />}
                            {status === 'available' && (
                              <QuestionIcon color={currentColors.turquoise.base} boxSize={6} />
                            )}

                            <VStack align="start" spacing={2} flex={1}>
                              <HStack flexWrap="wrap">
                                {isLocked ? (
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
                                      bg={getNodeBorderColor(status, node.nodeType)}
                                      color="white"
                                      px={2}
                                      borderRadius="md"
                                    >
                                      {node.nodeType}
                                    </Badge>
                                    {node.rewards?.buffs && node.rewards.buffs.length > 0 && (
                                      <Badge colorScheme="purple" fontSize="xs">
                                        🎁 Buff Reward
                                      </Badge>
                                    )}
                                    {isCompletedInn && !adminMode && (
                                      <Badge colorScheme="yellow" fontSize="xs">
                                        Click to trade keys
                                      </Badge>
                                    )}
                                    {isAvailableWithBuffs && (
                                      <Badge colorScheme="blue" fontSize="xs">
                                        ✨ Buff available
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

                              {isLocked ? (
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
                                        {node.objective.type}: {node.objective.quantity}{' '}
                                        {node.objective.target}
                                      </Text>
                                      {node.objective.appliedBuff && (
                                        <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                          ✨ {node.objective.appliedBuff.buffName} applied (-
                                          {(node.objective.appliedBuff.reduction * 100).toFixed(0)}
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
                            bg={colorMode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}
                            backdropFilter="blur(2px)"
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
      />

      <InnModal
        isOpen={isInnOpen}
        onClose={onInnClose}
        node={selectedNode}
        team={team}
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
    </Flex>
  );
};

export default TreasureTeamView;
