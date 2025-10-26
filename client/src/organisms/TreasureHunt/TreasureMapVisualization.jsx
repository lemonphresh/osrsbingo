import React, { useEffect, useState } from 'react';
import { MapContainer, ImageOverlay, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import {
  Box,
  Badge,
  Text,
  VStack,
  HStack,
  Button,
  Image,
  Flex,
  IconButton,
  useToast,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, CopyIcon } from '@chakra-ui/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RedactedText } from '../../molecules/TreasureHunt/RedactedTreasureInfo';
import { OBJECTIVE_TYPES } from '../../utils/treasureHuntHelpers';
import Casket from '../../assets/casket.png';
const RecenterButton = ({ nodes }) => {
  const map = useMap();
  const [isOffCenter, setIsOffCenter] = useState(false);

  useEffect(() => {
    const checkPosition = () => {
      const center = map.getCenter();
      const mapCenter = { lat: 1952, lng: 3584 }; // mapHeight/2, mapWidth/2

      // Calculate distance from center
      const distance = Math.sqrt(
        Math.pow(center.lat - mapCenter.lat, 2) + Math.pow(center.lng - mapCenter.lng, 2)
      );

      // Show button if more than 500 pixels from center
      setIsOffCenter(distance > 500);
    };

    map.on('moveend', checkPosition);
    checkPosition(); // Initial check

    return () => {
      map.off('moveend', checkPosition);
    };
  }, [map]);

  const handleRecenter = () => {
    if (nodes.length > 0) {
      // Fit bounds to all nodes
      const positions = nodes
        .filter((n) => n.coordinates?.x && n.coordinates?.y)
        .map((n) => {
          const osrsMinX = 1100;
          const osrsMaxX = 3900;
          const osrsMinY = 2500;
          const osrsMaxY = 4100;
          const mapWidth = 7168;
          const mapHeight = 3904;

          const normalizedX = (n.coordinates.x - osrsMinX) / (osrsMaxX - osrsMinX);
          const normalizedY = (n.coordinates.y - osrsMinY) / (osrsMaxY - osrsMinY);
          const pixelX = normalizedX * mapWidth;
          const pixelY = normalizedY * mapHeight;

          return [pixelY, pixelX];
        });

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 1, animate: true, duration: 1 });
      }
    }
  };

  if (!isOffCenter) return null;

  return (
    <Box position="absolute" bottom={4} right={4} zIndex={1000}>
      <Button
        size="sm"
        colorScheme="green"
        onClick={handleRecenter}
        boxShadow="lg"
        leftIcon={
          <Box as="span" fontSize="lg">
            🎯
          </Box>
        }
      >
        Recenter Map
      </Button>
    </Box>
  );
};

const createCustomIcon = (color, nodeType, status, adminMode = false, appliedBuff) => {
  const isAvailable = status === 'available';
  const iconHtml = `
    <div style="
            position: relative;
            width: 24px;
            height: 24px;
    ">
            ${
              isAvailable
                ? `
                    <div style="
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 24px;
                            height: 24px;
                            background-color: ${color};
                            border-radius: ${nodeType === 'INN' ? '4px' : '50%'};
                            opacity: 0.4;
                            animation: pulse 2s ease-in-out infinite;
                    "></div>
            `
                : ''
            }
            <div style="
                    position: relative;
                    background-color: ${color};
                    width: 24px;
                    height: 24px;
                    border-radius: ${nodeType === 'INN' ? '4px' : '50%'};
                    border: 3px solid ${adminMode ? '#7D5FFF' : 'white'};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    ${status === 'locked' && !adminMode ? 'opacity: 0.5;' : ''}
            ">
                    ${
                      nodeType === 'START'
                        ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 12px; font-weight: bold;">S</div>'
                        : ''
                    }
                    ${
                      nodeType === 'INN'
                        ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 10px;">🏠</div>'
                        : ''
                    }
                    ${
                      status === 'completed'
                        ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1.5); text-shadow: 1px 1px 0 black, -1px -1px 0 black, 1px -1px 0 black, -1px 1px 0 black; color: #f36757ff; font-size: 24px;">✓</div>'
                        : ''
                    }
                     ${
                       appliedBuff
                         ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1.5); color: white; font-size: 12px;">✨</div>'
                         : ''
                     }
                   
            </div>
    </div>
    <style>
            @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.5); opacity: 0; }
            }
    </style>
`;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
};

const TreasureMapVisualization = ({
  nodes = [],
  team,
  event,
  mapImageUrl = 'https://oldschool.runescape.wiki/images/Old_School_RuneScape_world_map.png',
  adminMode = false,
  onAdminComplete,
  onAdminUncomplete,
}) => {
  const toast = useToast();

  const colors = {
    purple: '#7D5FFF',
    green: '#43AA8B',
    yellow: '#F4D35E',
    turquoise: '#28AFB0',
    red: '#FF4B5C',
    orange: '#FF914D',
    gray: '#9ca8baff',
    pink: '#ff9dffff',
  };

  const mapWidth = 7168;
  const mapHeight = 3904;
  const mapBounds = [
    [0, 0],
    [mapHeight, mapWidth],
  ];

  const convertCoordinates = (osrsX, osrsY) => {
    const osrsMinX = 1100;
    const osrsMaxX = 3900;
    const osrsMinY = 2500;
    const osrsMaxY = 4100;

    const normalizedX = (osrsX - osrsMinX) / (osrsMaxX - osrsMinX);
    const normalizedY = (osrsY - osrsMinY) / (osrsMaxY - osrsMinY);

    const pixelX = normalizedX * mapWidth;
    const pixelY = normalizedY * mapHeight;

    return [pixelY, pixelX];
  };

  // Helper function to get difficulty badge color from tier
  const getDifficultyColor = (difficultyTier) => {
    if (difficultyTier === 1) return 'green';
    if (difficultyTier === 3) return 'orange';
    if (difficultyTier === 5) return 'red';
    return 'gray';
  };

  // Helper function to get difficulty name from tier
  const getDifficultyName = (difficultyTier) => {
    if (difficultyTier === 1) return 'EASY';
    if (difficultyTier === 3) return 'MEDIUM';
    if (difficultyTier === 5) return 'HARD';
    return '';
  };

  // Helper to check if a location group has been completed (any node in the group)
  const isLocationGroupCompleted = (node, event) => {
    if (!node.locationGroupId || !event?.mapStructure?.locationGroups) return false;

    const group = event.mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
    if (!group) return false;

    // Check if any node in this group has been completed by this team
    return group.nodeIds.some((nodeId) => team?.completedNodes?.includes(nodeId));
  };

  const getNodeStatus = (node, event) => {
    if (!team) return 'locked';
    if (team.completedNodes?.includes(node.nodeId)) return 'completed';

    if (isLocationGroupCompleted(node, event)) return 'unavailable';

    if (team.availableNodes?.includes(node.nodeId)) return 'available';
    return 'locked';
  };

  const getNodeColor = (status, nodeType, appliedBuff) => {
    if (nodeType === 'START') return colors.purple;
    if (nodeType === 'INN') return colors.yellow;
    if (status === 'completed') return colors.green;
    if (status === 'available' && appliedBuff) return colors.pink;
    if (status === 'available') return colors.orange;
    if (status === 'unavailable') return colors.red; // Node at completed location
    return colors.gray;
  };

  const formatGP = (gp) => {
    if (!gp) return '0';
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const getNodePosition = (node, allNodes) => {
    const basePosition = convertCoordinates(node.coordinates.x, node.coordinates.y);

    const sameLocationNodes = allNodes.filter(
      (n) => n.coordinates?.x === node.coordinates.x && n.coordinates?.y === node.coordinates.y
    );

    if (sameLocationNodes.length === 1) {
      return basePosition;
    }

    const index = sameLocationNodes.findIndex((n) => n.nodeId === node.nodeId);
    const totalNodes = sameLocationNodes.length;

    const radius = 25;
    const angle = (index * 2 * Math.PI) / totalNodes;
    const offsetY = Math.sin(angle) * radius;
    const offsetX = Math.cos(angle) * radius;

    return [basePosition[0] + offsetY, basePosition[1] + offsetX];
  };

  const getPathColor = (fromNode, toNode) => {
    const fromStatus = getNodeStatus(fromNode, event);
    const toStatus = getNodeStatus(toNode, event);

    if (fromStatus === 'completed' && toStatus === 'completed') return colors.green;
    if (fromStatus === 'completed' && toStatus === 'available') return colors.turquoise;
    if (fromStatus === 'available' || toStatus === 'available') return colors.turquoise;
    return 'tomato';
  };

  const getPathStyle = (fromNode, toNode) => {
    const fromStatus = getNodeStatus(fromNode, event);
    const toStatus = getNodeStatus(toNode, event);

    if (fromStatus === 'completed' && toStatus === 'completed') {
      return { weight: 4, opacity: 0.9, dashArray: null };
    }

    if (
      (fromStatus === 'completed' && toStatus === 'available') ||
      fromStatus === 'available' ||
      toStatus === 'available'
    ) {
      return { weight: 4, opacity: 0.8, dashArray: null };
    }

    return { weight: 2, opacity: 0.2, dashArray: '8, 8' };
  };

  const edges = [];
  nodes.forEach((node) => {
    if (node.unlocks && Array.isArray(node.unlocks)) {
      node.unlocks.forEach((targetNodeId) => {
        const targetNode = nodes.find((n) => n.nodeId === targetNodeId);
        if (targetNode && node.coordinates && targetNode.coordinates) {
          // HIDE edges if either node is locked/unavailable (unless admin mode)
          const fromStatus = getNodeStatus(node, event);
          const toStatus = getNodeStatus(targetNode, event);

          if (
            !adminMode &&
            (fromStatus === 'locked' ||
              fromStatus === 'unavailable' ||
              toStatus === 'locked' ||
              toStatus === 'unavailable')
          ) {
            return; // Skip this edge
          }

          const fromPos = convertCoordinates(node.coordinates.x, node.coordinates.y);
          const toPos = convertCoordinates(targetNode.coordinates.x, targetNode.coordinates.y);
          const style = getPathStyle(node, targetNode);
          edges.push({
            from: fromPos,
            to: toPos,
            color: getPathColor(node, targetNode),
            ...style,
          });
        }
      });
    }
  });

  return (
    <Box
      height="600px"
      width="100%"
      borderRadius="8px"
      overflow="hidden"
      position="relative"
      boxShadow="lg"
    >
      <MapContainer
        center={[mapHeight / 2, mapWidth / 2]}
        zoom={-2}
        minZoom={-3}
        maxZoom={2}
        crs={L.CRS.Simple}
        style={{ height: '100%', width: '100%', background: '#64769e' }}
        scrollWheelZoom={true}
      >
        <ImageOverlay url={mapImageUrl} bounds={mapBounds} opacity={1} />
        <RecenterButton nodes={nodes} />
        {edges.map((edge, idx) => (
          <Polyline
            key={`edge-${idx}`}
            positions={[edge.from, edge.to]}
            color={edge.color}
            weight={edge.weight}
            opacity={edge.opacity}
            dashArray={edge.dashArray}
          />
        ))}
        {nodes.map((node) => {
          if (!node.coordinates?.x || !node.coordinates?.y) return null;

          const status = getNodeStatus(node, event);

          // HIDE locked and unavailable nodes (unless in admin mode)
          if (!adminMode && (status === 'locked' || status === 'unavailable')) {
            return null;
          }

          const color = getNodeColor(status, node.nodeType, !!node.objective?.appliedBuff);
          const position = getNodePosition(node, nodes);
          return (
            <Marker
              key={node.nodeId}
              position={position}
              icon={createCustomIcon(
                color,
                node.nodeType,
                status,
                adminMode,
                !!node.objective?.appliedBuff
              )}
            >
              <Popup
                maxWidth={350}
                autoPan={true}
                autoPanPaddingTopLeft={[10, 80]}
                autoPanPaddingBottomRight={[10, 10]}
              >
                <VStack align="start" spacing={2} p={2}>
                  <HStack justify="space-between" w="full">
                    {(status === 'locked' || status === 'unavailable') && !adminMode ? (
                      <>
                        <RedactedText length="long" />
                        <Badge
                          colorScheme={status === 'unavailable' ? 'red' : 'gray'}
                          fontSize="xs"
                        >
                          {status === 'unavailable' ? 'UNAVAILABLE' : 'LOCKED'}
                        </Badge>
                      </>
                    ) : (
                      <>
                        <Text m="0!important" fontWeight="bold" fontSize="md" color="#1a1a1a">
                          {node.title}
                        </Text>
                        <Badge
                          colorScheme={
                            status === 'completed'
                              ? 'green'
                              : status === 'available'
                              ? 'orange'
                              : status === 'unavailable'
                              ? 'red'
                              : 'gray'
                          }
                          fontSize="xs"
                        >
                          {status === 'unavailable'
                            ? 'UNAVAILABLE'
                            : node.nodeType === 'INN' && status === 'completed'
                            ? 'VISITED'
                            : status.toUpperCase()}
                        </Badge>
                        {node.difficultyTier && node.nodeType === 'STANDARD' && (
                          <Badge
                            colorScheme={getDifficultyColor(node.difficultyTier)}
                            fontSize="xs"
                          >
                            {getDifficultyName(node.difficultyTier)}
                          </Badge>
                        )}
                      </>
                    )}
                  </HStack>

                  {(status === 'locked' || status === 'unavailable') && !adminMode ? (
                    <VStack align="start" spacing={1} w="full">
                      <RedactedText length="full" />
                      <RedactedText length="medium" />
                      <Box pt={2}>
                        <Text fontSize="xs" color="#718096" fontStyle="italic">
                          {status === 'unavailable'
                            ? 'Another difficulty at this location has already been completed. Only one node per location can be completed.'
                            : 'Complete prerequisites to unlock'}
                        </Text>
                      </Box>
                    </VStack>
                  ) : (
                    <>
                      {node.description && (
                        <Text
                          w="100%"
                          p={2}
                          borderRadius="md"
                          bg="gray.100"
                          m="0!important"
                          fontSize="sm"
                          color="#4a4a4a"
                        >
                          {node.description}
                        </Text>
                      )}

                      {node.objective && (
                        <Box>
                          <Text
                            m="0!important"
                            fontSize="xs"
                            fontWeight="bold"
                            color="#2d3748"
                            mb={1}
                          >
                            Objective:
                          </Text>
                          <Text fontSize="xs" m="0!important" color="#4a5568">
                            {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                            {node.objective.target}
                          </Text>
                        </Box>
                      )}

                      {node.rewards && (
                        <Flex
                          p={2}
                          borderRadius="md"
                          flexDirection="column"
                          alignItems="center"
                          m="0 auto"
                          mt={3}
                          bg="orange.100"
                          transition="all 0.3s ease"
                          animation="pulseGlow 2s infinite alternate"
                          sx={{
                            '@keyframes pulseGlow': {
                              from: { boxShadow: `0 0 8px 2px #e3c0ffff` },
                              to: { boxShadow: `0 0 16px 4px #cf9efdff` },
                            },
                          }}
                        >
                          <VStack mb={3}>
                            <Text
                              m="0!important"
                              fontSize="xs"
                              fontWeight="bold"
                              color="#2d3748"
                              mb={1}
                            >
                              Rewards:
                            </Text>
                            <Image h="32px" src={Casket} />
                          </VStack>

                          <HStack spacing={2}>
                            <Badge colorScheme="green" fontSize="xs">
                              {formatGP(node.rewards.gp)} GP
                            </Badge>
                            {node.rewards.keys?.map((key, idx) => (
                              <Badge key={idx} colorScheme={key.color} fontSize="xs">
                                {key.quantity}x {key.color} key
                              </Badge>
                            ))}
                          </HStack>

                          {node.rewards.buffs &&
                            node.rewards.buffs.length > 0 &&
                            (status !== 'locked' || adminMode) && (
                              <Box mt={2} p={2} borderRadius="md">
                                <Text
                                  fontSize="xs"
                                  m="0!important"
                                  fontWeight="bold"
                                  color="#2d3748"
                                  mb={1}
                                >
                                  🎁 Buff Rewards:
                                </Text>
                                <VStack align="start" spacing={1}>
                                  {node.rewards.buffs.map((buff, idx) => (
                                    <HStack mt={1} key={idx} spacing={1}>
                                      <Badge
                                        colorScheme={
                                          buff.tier === 'major'
                                            ? 'purple'
                                            : buff.tier === 'moderate'
                                            ? 'blue'
                                            : buff.tier === 'universal'
                                            ? 'yellow'
                                            : 'green'
                                        }
                                        fontSize="xs"
                                      >
                                        {buff.tier.toUpperCase()}
                                      </Badge>
                                      <Text m="0!important" fontSize="xs" color="#4a5568">
                                        {buff.buffType.replace(/_/g, ' ')}
                                      </Text>
                                    </HStack>
                                  ))}
                                </VStack>
                              </Box>
                            )}
                        </Flex>
                      )}

                      {adminMode && (
                        <Box w="full" pt={2} borderTop="1px solid #e2e8f0">
                          <Text fontSize="xs" fontWeight="bold" color="#7D5FFF" mb={2}>
                            🛡️ Admin Controls
                          </Text>
                          <Text fontSize="xs" color="#718096" mb={2}>
                            {status === 'completed'
                              ? 'Un-completing will remove rewards and re-lock downstream nodes.'
                              : 'Completing will grant rewards and unlock connected nodes.'}
                          </Text>
                          <HStack spacing={2}>
                            {status !== 'completed' ? (
                              <Button
                                size="xs"
                                colorScheme="green"
                                leftIcon={<CheckIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAdminComplete && onAdminComplete(node.nodeId);
                                }}
                                flex={1}
                              >
                                Complete
                              </Button>
                            ) : (
                              <Button
                                size="xs"
                                colorScheme="red"
                                leftIcon={<CloseIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAdminUncomplete && onAdminUncomplete(node.nodeId);
                                }}
                                flex={1}
                              >
                                Un-complete
                              </Button>
                            )}
                          </HStack>
                        </Box>
                      )}

                      {!adminMode && status === 'available' && (
                        <Box mt={2}>
                          {node.nodeType === 'INN' ? (
                            <VStack align="center" spacing={1}>
                              <Button
                                colorScheme="green"
                                size="md"
                                w="full"
                                leftIcon={<Text fontSize="xl">🏠</Text>}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAdminComplete) {
                                    onAdminComplete(node.nodeId);
                                  }
                                }}
                              >
                                Visit Inn
                              </Button>
                              <Text
                                fontSize="xs"
                                color="#4a5568"
                                textAlign="center"
                                fontStyle="italic"
                              >
                                Rest at the inn to recover and prepare for your next adventure!
                              </Text>
                            </VStack>
                          ) : (
                            // Discord submit instructions for regular nodes
                            <>
                              <Text
                                textAlign="center"
                                fontSize="xs"
                                color="#4a5568"
                                fontStyle="italic"
                                sx={{
                                  code: { backgroundColor: '#e7ffeaff' },
                                }}
                              >
                                <strong>Submit completion via Discord bot:</strong>
                              </Text>
                              <HStack justify="center" mt={1} spacing={1}>
                                <code
                                  className="code"
                                  style={{
                                    backgroundColor: '#e7ffeaff',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                  }}
                                >
                                  !submit {node.nodeId} link_to_screenshot_img
                                </code>
                                <IconButton
                                  icon={<CopyIcon />}
                                  size="xs"
                                  colorScheme="green"
                                  aria-label="Copy command"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(`!submit ${node.nodeId}`);
                                    toast({
                                      title: 'Copied!',
                                      description: `Command copied to clipboard`,
                                      status: 'success',
                                      duration: 2000,
                                      isClosable: true,
                                    });
                                  }}
                                />
                              </HStack>
                              <Text
                                textAlign="center"
                                fontSize="xs"
                                color="#4a5568"
                                fontStyle="italic"
                                mt={1}
                                sx={{
                                  code: { backgroundColor: '#e7ffeaff' },
                                }}
                              >
                                or
                                <br />
                                <code className="code">
                                  !submit {node.nodeId} (attach image file)
                                </code>
                              </Text>
                            </>
                          )}
                        </Box>
                      )}
                    </>
                  )}
                </VStack>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <Box
        position="absolute"
        top={4}
        right={4}
        bg="rgba(255, 255, 255, 0.95)"
        p={3}
        borderRadius="md"
        boxShadow="xl"
        zIndex={1000}
        border="1px solid #e2e8f0"
      >
        {adminMode && (
          <Badge colorScheme="purple" fontSize="xs" mb={2} w="full" textAlign="center">
            ADMIN MODE
          </Badge>
        )}
        <Text fontWeight="bold" fontSize="sm" mb={3} color="#2d3748">
          Map Legend
        </Text>
        <VStack align="start" spacing={2} fontSize="xs">
          <HStack>
            <Box w={4} h={4} bg={colors.green} borderRadius="full" border="2px solid white" />
            <Text color="#2d3748">Completed</Text>
          </HStack>
          <HStack>
            <Box
              w={4}
              h={4}
              bg={colors.orange}
              borderRadius="full"
              border="2px solid white"
              position="relative"
            />
            <Text color="#2d3748">Available {!adminMode && '(click to view)'}</Text>
          </HStack>
          <HStack>
            <Box
              w={4}
              h={4}
              bg={colors.gray}
              borderRadius="full"
              border="2px solid white"
              opacity={0.5}
            />
            <Text color="#2d3748">Locked</Text>
          </HStack>
          <HStack>
            <Box w={4} h={4} bg={colors.yellow} borderRadius="sm" border="2px solid white" />
            <Text color="#2d3748">Inn (checkpoint)</Text>
          </HStack>
          <HStack>
            <Box w={4} h={4} bg={colors.purple} borderRadius="full" border="2px solid white" />
            <Text color="#2d3748">Start</Text>
          </HStack>
        </VStack>

        <Box mt={3} pt={3} borderTop="1px solid #e2e8f0">
          <Text fontSize="xs" color="#718096">
            Scroll to zoom • Drag to pan
          </Text>
        </Box>
      </Box>

      {/* Team stats overlay */}
      {team && (
        <Box
          position="absolute"
          bottom={4}
          left={4}
          bg="rgba(255, 255, 255, 0.95)"
          p={3}
          borderRadius="md"
          boxShadow="xl"
          zIndex={1000}
          border="1px solid #e2e8f0"
        >
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="sm" color="#2d3748">
              Progress
            </Text>
            <HStack spacing={4}>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="#718096">
                  Completed
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={colors.green}>
                  {team.completedNodes?.length || 0}
                </Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="#718096">
                  Available
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={colors.turquoise}>
                  {team.availableNodes?.length || 0}
                </Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text fontSize="xs" color="#718096">
                  Total GP
                </Text>
                <Text fontSize="lg" fontWeight="bold" color={colors.green}>
                  {formatGP(team.currentPot || 0)}
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default TreasureMapVisualization;
