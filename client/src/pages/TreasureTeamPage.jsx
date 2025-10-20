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
} from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon } from '@chakra-ui/icons';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_TREASURE_EVENT, GET_TREASURE_TEAM } from '../graphql/queries';
import NodeDetailModal from '../organisms/NodeDetailModal';
import Section from '../atoms/Section';
import TreasureMapVisualization from '../organisms/TreasureMapVisualization';

const TreasureTeamView = () => {
  const { colorMode } = useColorMode();
  const { eventId, teamId } = useParams();
  const { isOpen: isNodeOpen, onOpen: onNodeOpen, onClose: onNodeClose } = useDisclosure();

  const { data: eventData, loading: eventLoading } = useQuery(GET_TREASURE_EVENT, {
    variables: { eventId },
  });

  const { data: teamData, loading: teamLoading } = useQuery(GET_TREASURE_TEAM, {
    variables: { eventId, teamId },
  });

  const [selectedNode, setSelectedNode] = useState(null);

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
    },
  };

  const currentColors = colors[colorMode];

  const event = eventData?.getTreasureEvent;
  const team = teamData?.getTreasureTeam;
  const nodes = event?.nodes || [];

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  // Determine node status based on team progress
  const getNodeStatus = (node) => {
    if (!team) return 'locked';
    if (team.completedNodes.includes(node.nodeId)) return 'completed';
    if (team.availableNodes.includes(node.nodeId)) return 'available';
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
    if (status === 'locked') return;

    setSelectedNode({ ...node, status });
    onNodeOpen();
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
              <Heading size="xl" color={currentColors.textColor}>
                {team.teamName}
              </Heading>
              <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>Team Progress</Text>
            </VStack>
          </HStack>

          <StatGroup>
            <Stat>
              <StatLabel color={currentColors.textColor}>Current Pot</StatLabel>
              <StatNumber color={currentColors.green.base}>{formatGP(team.currentPot)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel color={currentColors.textColor}>Nodes Completed</StatLabel>
              <StatNumber color={currentColors.textColor}>{team.completedNodes.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel color={currentColors.textColor}>Keys Held</StatLabel>
              <StatNumber>
                <HStack spacing={2}>
                  {team.keysHeld.map((key) => (
                    <Badge key={key.color} colorScheme={key.color} fontSize="md">
                      {key.color}: {key.quantity}
                    </Badge>
                  ))}
                </HStack>
              </StatNumber>
            </Stat>
          </StatGroup>

          <Box>
            <Heading size="md" mb={4} color={currentColors.textColor}>
              Treasure Map
            </Heading>
            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.600'} mb={6}>
              Click on any available node to view details. Submit completions via Discord bot.
            </Text>

            <TreasureMapVisualization nodes={nodes} team={team} onNodeClick={handleNodeClick} />

            <VStack spacing={4} align="stretch">
              {nodes.map((node) => {
                const status = getNodeStatus(node);
                return (
                  <Card
                    key={node.nodeId}
                    bg={currentColors.cardBg}
                    borderWidth={2}
                    borderColor={getNodeBorderColor(status, node.nodeType)}
                    cursor={status !== 'locked' ? 'pointer' : 'not-allowed'}
                    opacity={status === 'locked' ? 0.5 : 1}
                    onClick={() => handleNodeClick(node)}
                    _hover={
                      status !== 'locked' ? { shadow: 'lg', transform: 'translateY(-2px)' } : {}
                    }
                    transition="all 0.2s"
                  >
                    <CardBody>
                      <HStack justify="space-between">
                        <HStack spacing={4}>
                          {status === 'completed' && (
                            <CheckCircleIcon color={currentColors.green.base} boxSize={6} />
                          )}
                          {status === 'locked' && <LockIcon color="gray.400" boxSize={6} />}
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Text fontWeight="bold" fontSize="lg" color={currentColors.textColor}>
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
                            </HStack>
                            <Text
                              fontSize="sm"
                              color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                            >
                              {node.description}
                            </Text>
                          </VStack>
                        </HStack>
                        {node.rewards && (
                          <VStack align="end" spacing={1}>
                            <Text fontWeight="bold" color={currentColors.green.base}>
                              {formatGP(node.rewards.gp)}
                            </Text>
                            {node.rewards.keys && node.rewards.keys.length > 0 && (
                              <HStack spacing={1}>
                                {node.rewards.keys.map((key, idx) => (
                                  <Badge key={idx} colorScheme={key.color} size="sm">
                                    {key.quantity} {key.color}
                                  </Badge>
                                ))}
                              </HStack>
                            )}
                          </VStack>
                        )}
                      </HStack>
                    </CardBody>
                  </Card>
                );
              })}
            </VStack>
          </Box>
        </VStack>
      </Section>

      <NodeDetailModal isOpen={isNodeOpen} onClose={onNodeClose} node={selectedNode} />
    </Flex>
  );
};

export default TreasureTeamView;
