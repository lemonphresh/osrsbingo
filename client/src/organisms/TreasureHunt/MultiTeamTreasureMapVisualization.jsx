import { useState, useEffect } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Box, Badge, Text, VStack, HStack, Button, Image } from '@chakra-ui/react';
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

// Component to handle map panning and pulsing
const MapController = ({ pulsingNodeId, nodes }) => {
  const map = useMap();

  useEffect(() => {
    if (pulsingNodeId) {
      const node = nodes.find((n) => n.nodeId === pulsingNodeId);
      if (node?.coordinates) {
        // Convert coordinates inline to avoid dependency issues
        const osrsMinX = 1100;
        const osrsMaxX = 3900;
        const osrsMinY = 2500;
        const osrsMaxY = 4100;
        const mapWidth = 7168;
        const mapHeight = 3904;

        const normalizedX = (node.coordinates.x - osrsMinX) / (osrsMaxX - osrsMinX);
        const normalizedY = (node.coordinates.y - osrsMinY) / (osrsMaxY - osrsMinY);
        const pixelX = normalizedX * mapWidth;
        const pixelY = normalizedY * mapHeight;
        const position = [pixelY, pixelX];

        map.flyTo(position, map.getZoom(), { animate: true, duration: 1.5 });
      }
    }
  }, [pulsingNodeId, map, nodes]);

  return null;
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

// Generate unlimited distinct colors using HSL color space
const generateTeamColor = (index) => {
  // Use golden ratio conjugate for evenly distributed hues
  const goldenRatioConjugate = 0.618033988749895;
  const hue = (index * goldenRatioConjugate * 360) % 360;

  // Use high saturation and medium lightness for vibrant, readable colors
  const saturation = 65 + (index % 3) * 10; // 65-85%
  const lightness = 50 + (index % 2) * 5; // 50-55%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Predefined palette for first 10 teams (optional - for consistency)
const PRESET_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52B788',
];

// Custom icon for nodes with pulsing animation
const createNodeIcon = (color, nodeType, isCompleted = false, isPulsing = false) => {
  const iconHtml = `
    <div style="position: relative; width: 20px; height: 20px;">
      ${
        isPulsing
          ? `
        <style>
          @keyframes glow-pulse {
            0%, 100% { 
              box-shadow: 0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color};
              transform: scale(1);
            }
            50% { 
              box-shadow: 0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color};
              transform: scale(1.3);
            }
          }
          .pulsing-node {
            animation: glow-pulse 1s ease-in-out 2;
          }
        </style>
        <div class="pulsing-node" style="
          position: absolute;
          top: 0;
          left: 0;
          width: 20px;
          height: 20px;
          border-radius: ${nodeType === 'INN' ? '3px' : '50%'};
          background-color: ${color};
          border: 2px solid white;
        "></div>
      `
          : `
        <div style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: ${nodeType === 'INN' ? '3px' : '50%'};
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          opacity: ${isCompleted ? 0.6 : 1};
        "></div>
      `
      }
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
};

// Team position marker (shows which teams are at which nodes)
const createTeamMarker = (teamColor, teamInitials, isMultiple = false) => {
  const iconHtml = `
    <div style="
      background-color: ${teamColor};
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: ${isMultiple ? '10px' : '11px'};
      color: white;
      position: relative;
      z-index: 1000;
    ">
      ${teamInitials}
      ${
        isMultiple
          ? '<div style="position: absolute; top: -2px; right: -2px; background: #FF4B5C; width: 10px; height: 10px; border-radius: 50%; border: 1px solid white;"></div>'
          : ''
      }
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'team-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
  });
};

const MultiTeamTreasureMap = ({
  nodes = [],
  teams = [],
  event, // NEW: Need event to check location groups
  mapImageUrl = 'https://oldschool.runescape.wiki/images/Old_School_RuneScape_world_map.png',
  onNodeClick,
  showAllNodes = false, // Admin mode: if true, show all node details regardless of unlock status
}) => {
  const [selectedTeams, setSelectedTeams] = useState(teams.map((t) => t.teamId));
  const [pulsingNodes, setPulsingNodes] = useState(new Set());
  const [focusNodeId, setFocusNodeId] = useState(null);

  // Determine if we should show all nodes based on event status
  // DRAFT mode: show all nodes (for setup/testing)
  // ACTIVE/COMPLETED/ARCHIVED: only show unlocked nodes (cleaner view)
  const shouldShowAllNodes = showAllNodes || event?.status === 'DRAFT';

  const mapWidth = 7168;
  const mapHeight = 3904;
  const mapBounds = [
    [0, 0],
    [mapHeight, mapWidth],
  ];

  // Convert OSRS coordinates
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

  const formatGP = (gp) => {
    if (!gp) return '0';
    return (gp / 1000000).toFixed(1) + 'M';
  };

  // Calculate offset for overlapping nodes in a circular pattern
  const getNodePosition = (node, allNodes) => {
    const basePosition = convertCoordinates(node.coordinates.x, node.coordinates.y);

    // Find all nodes at the same coordinates
    const sameLocationNodes = allNodes.filter(
      (n) => n.coordinates?.x === node.coordinates.x && n.coordinates?.y === node.coordinates.y
    );

    if (sameLocationNodes.length === 1) {
      return basePosition;
    }

    // Get index of current node among overlapping nodes
    const index = sameLocationNodes.findIndex((n) => n.nodeId === node.nodeId);
    const totalNodes = sameLocationNodes.length;

    // Calculate circular offset
    const radius = 25; // pixels from center
    const angle = (index * 2 * Math.PI) / totalNodes;
    const offsetY = Math.sin(angle) * radius;
    const offsetX = Math.cos(angle) * radius;

    return [basePosition[0] + offsetY, basePosition[1] + offsetX];
  };

  // Get color for team - uses preset colors first, then generates unlimited colors
  const getTeamColor = (teamIndex) => {
    if (teamIndex < PRESET_COLORS.length) {
      return PRESET_COLORS[teamIndex];
    }
    return generateTeamColor(teamIndex);
  };

  // Get team initials
  const getTeamInitials = (teamName) => {
    const words = teamName.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return teamName.substring(0, 2).toUpperCase();
  };

  // Calculate which teams have completed/can access which nodes
  // Helper to check if a location group has been completed by ANY selected team
  const isLocationGroupCompletedByAnyTeam = (node) => {
    if (!node.locationGroupId || !event?.mapStructure?.locationGroups) return false;

    const group = event.mapStructure.locationGroups.find((g) => g.groupId === node.locationGroupId);
    if (!group) return false;

    // Check if any selected team has completed any node in this group
    return teams.some((team) => {
      if (!selectedTeams.includes(team.teamId)) return false;
      return group.nodeIds.some((nodeId) => team.completedNodes?.includes(nodeId));
    });
  };

  const getNodeAccessStatus = (nodeId) => {
    // In admin mode OR draft mode, all nodes are considered unlocked
    if (shouldShowAllNodes) return 'unlocked';

    const node = nodes.find((n) => n.nodeId === nodeId);

    // NEW: Check if this location has been completed by any team
    if (node && isLocationGroupCompletedByAnyTeam(node)) {
      // Check if THIS specific node was completed
      const thisNodeCompleted = teams.some((team) => {
        if (!selectedTeams.includes(team.teamId)) return false;
        return team.completedNodes?.includes(nodeId);
      });

      // If this node wasn't completed, but the location was, mark as unavailable
      if (!thisNodeCompleted) return 'unavailable';
    }

    let anyTeamCompleted = false;
    let anyTeamAvailable = false;

    teams.forEach((team) => {
      if (!selectedTeams.includes(team.teamId)) return;
      if (team.completedNodes?.includes(nodeId)) anyTeamCompleted = true;
      if (team.availableNodes?.includes(nodeId)) anyTeamAvailable = true;
    });

    if (anyTeamCompleted || anyTeamAvailable) return 'unlocked';
    return 'locked';
  };

  // Build edges between nodes with better visibility for unlocked paths
  const edges = [];
  nodes.forEach((node) => {
    if (node.unlocks && Array.isArray(node.unlocks)) {
      node.unlocks.forEach((targetNodeId) => {
        const targetNode = nodes.find((n) => n.nodeId === targetNodeId);
        if (targetNode && node.coordinates && targetNode.coordinates) {
          const fromAccess = getNodeAccessStatus(node.nodeId);
          const toAccess = getNodeAccessStatus(targetNode.nodeId);

          // HIDE edges if either node is locked/unavailable (unless admin mode or draft status)
          if (
            !shouldShowAllNodes &&
            (fromAccess === 'locked' ||
              fromAccess === 'unavailable' ||
              toAccess === 'locked' ||
              toAccess === 'unavailable')
          ) {
            return; // Skip this edge
          }

          const fromPos = convertCoordinates(node.coordinates.x, node.coordinates.y);
          const toPos = convertCoordinates(targetNode.coordinates.x, targetNode.coordinates.y);

          let weight = 2;
          let opacity = 0.4;
          let dashArray = '8, 8';

          // If either node is unlocked by any team, make path more visible
          if (fromAccess === 'unlocked' && toAccess === 'unlocked' && !shouldShowAllNodes) {
            weight = 4;
            opacity = 0.7;
            dashArray = null;
          } else if (
            (fromAccess === 'unlocked' || toAccess === 'unlocked') &&
            !shouldShowAllNodes
          ) {
            weight = 3;
            opacity = 0.5;
            dashArray = null;
          }

          edges.push({ from: fromPos, to: toPos, weight, opacity, dashArray });
        }
      });
    }
  });

  const nodeCompletionMap = {};
  nodes.forEach((node) => {
    nodeCompletionMap[node.nodeId] = {
      completed: [],
      available: [],
    };
  });

  teams.forEach((team, idx) => {
    if (!selectedTeams.includes(team.teamId)) return;

    team.completedNodes?.forEach((nodeId) => {
      if (nodeCompletionMap[nodeId]) {
        nodeCompletionMap[nodeId].completed.push({ team, color: getTeamColor(idx) });
      }
    });

    team.availableNodes?.forEach((nodeId) => {
      if (nodeCompletionMap[nodeId]) {
        nodeCompletionMap[nodeId].available.push({ team, color: getTeamColor(idx) });
      }
    });
  });

  // Group teams by their current position (last completed or available nodes)
  const teamPositions = {};
  teams.forEach((team, idx) => {
    if (!selectedTeams.includes(team.teamId)) return;

    // Find team's current position (their available nodes)
    const currentNodes = team.availableNodes || [];
    currentNodes.forEach((nodeId) => {
      if (!teamPositions[nodeId]) {
        teamPositions[nodeId] = [];
      }
      teamPositions[nodeId].push({
        team,
        color: getTeamColor(idx),
        initials: getTeamInitials(team.teamName),
      });
    });
  });

  const getNodeColor = (nodeId, nodeType) => {
    const completion = nodeCompletionMap[nodeId];
    const accessStatus = getNodeAccessStatus(nodeId);

    if (!completion && accessStatus !== 'unavailable') return '#718096';

    if (nodeType === 'START') return '#7D5FFF';
    if (nodeType === 'INN') return '#F4D35E';

    // NEW: If location is completed but not this specific node, show red
    if (accessStatus === 'unavailable') return '#FF4B5C';

    // If any selected team completed it, show green
    if (completion?.completed.length > 0) return '#43AA8B';
    // If any selected team can access it, show orange
    if (completion?.available.length > 0) return '#FF914D';

    return '#718096';
  };

  const toggleTeam = (teamId) => {
    setSelectedTeams((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
    );
  };

  // Handle team click to highlight their positions
  const handleTeamClick = (team) => {
    // Get all nodes this team is currently at (available nodes)
    const teamNodes = team.availableNodes || [];

    if (teamNodes.length === 0) return;

    // Add nodes to pulsing set
    const newPulsingNodes = new Set(teamNodes);
    setPulsingNodes(newPulsingNodes);

    // Focus on first node
    setFocusNodeId(teamNodes[0]);

    // Remove pulsing effect after 2 seconds
    setTimeout(() => {
      setPulsingNodes(new Set());
      setFocusNodeId(null);
    }, 2000);
  };

  return (
    <Box width="100%">
      <Box
        height="600px"
        width="100%"
        borderRadius="8px"
        overflow="hidden"
        position="relative"
        boxShadow="lg"
        mb={4}
      >
        <MapContainer
          center={[mapHeight / 2, mapWidth / 2]}
          zoom={-1}
          minZoom={-3}
          maxZoom={2}
          crs={L.CRS.Simple}
          style={{ height: '100%', width: '100%', background: '#64769e' }}
          scrollWheelZoom={true}
        >
          <ImageOverlay url={mapImageUrl} bounds={mapBounds} opacity={1} />
          <RecenterButton nodes={nodes} />
          <MapController pulsingNodeId={focusNodeId} nodes={nodes} />

          {/* Draw connection lines */}
          {edges.map((edge, idx) => (
            <Polyline
              key={`edge-${idx}`}
              positions={[edge.from, edge.to]}
              color="#718096"
              weight={edge.weight}
              opacity={edge.opacity}
              dashArray={edge.dashArray}
            />
          ))}

          {/* Node markers */}
          {nodes.map((node) => {
            if (!node.coordinates?.x || !node.coordinates?.y) return null;

            const accessStatus = getNodeAccessStatus(node.nodeId);

            // HIDE locked and unavailable nodes (unless admin mode or draft status)
            if (
              !shouldShowAllNodes &&
              (accessStatus === 'locked' || accessStatus === 'unavailable')
            ) {
              return null;
            }

            const position = getNodePosition(node, nodes);
            const color = getNodeColor(node.nodeId, node.nodeType);
            const completion = nodeCompletionMap[node.nodeId];
            const hasCompletions = completion?.completed.length > 0;
            const isPulsing = pulsingNodes.has(node.nodeId);

            return (
              <Marker
                key={node.nodeId}
                position={position}
                icon={createNodeIcon(color, node.nodeType, hasCompletions, isPulsing)}
                eventHandlers={{
                  click: () => onNodeClick && onNodeClick(node),
                }}
              >
                <Popup
                  maxWidth={350}
                  autoPan={true}
                  autoPanPaddingTopLeft={[10, 80]}
                  autoPanPaddingBottomRight={[10, 10]}
                  keepInView={true}
                >
                  <VStack align="start" spacing={2} p={2}>
                    <HStack mb={2} justify="space-between" w="full">
                      {getNodeAccessStatus(node.nodeId) === 'locked' ||
                      getNodeAccessStatus(node.nodeId) === 'unavailable' ? (
                        <>
                          <RedactedText length="long" />
                          <Badge
                            colorScheme={
                              getNodeAccessStatus(node.nodeId) === 'unavailable' ? 'red' : 'gray'
                            }
                          >
                            {getNodeAccessStatus(node.nodeId) === 'unavailable'
                              ? 'UNAVAILABLE'
                              : 'LOCKED'}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Text m="0!important" fontWeight="bold" fontSize="md" color="#1a1a1a">
                            {node.title}
                          </Text>
                          <Badge colorScheme={node.nodeType === 'INN' ? 'yellow' : 'blue'}>
                            {node.nodeType}
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

                    {getNodeAccessStatus(node.nodeId) === 'locked' ||
                    getNodeAccessStatus(node.nodeId) === 'unavailable' ? (
                      <VStack align="start" spacing={1} w="full">
                        <RedactedText length="full" />
                        <RedactedText length="medium" />
                        <Box pt={2}>
                          <Text fontSize="xs" color="#718096" fontStyle="italic">
                            {getNodeAccessStatus(node.nodeId) === 'unavailable'
                              ? 'A team has already completed another difficulty at this location. Only one node per location can be completed.'
                              : 'No teams have unlocked this node yet'}
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
                            pb={2}
                          >
                            {node.description}
                          </Text>
                        )}

                        {node.objective && (
                          <Box>
                            <Text
                              fontSize="xs"
                              m="0!important"
                              fontWeight="bold"
                              color="#2d3748"
                              pb={1}
                            >
                              Objective:
                            </Text>
                            <Text fontSize="xs" m="0!important" color="#4a5568">
                              {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                              {node.objective.target}
                            </Text>
                          </Box>
                        )}

                        {showAllNodes &&
                          completion.completed.length === 0 &&
                          completion.available.length === 0 && (
                            <Badge colorScheme="orange" fontSize="xs" mb={2}>
                              ADMIN VIEW - Not yet unlocked by any team
                            </Badge>
                          )}

                        {completion.completed.length > 0 && (
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color="#2d3748" pb={1}>
                              Completed by:
                            </Text>
                            <VStack align="start" spacing={1}>
                              {completion.completed.map(({ team, color }) => (
                                <HStack key={team.teamId}>
                                  <Box w={3} h={3} bg={color} borderRadius="full" />
                                  <Text m="0!important" fontSize="xs">
                                    {team.teamName}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        {completion.available.length > 0 && completion.completed.length === 0 && (
                          <Box>
                            <Text
                              fontSize="xs"
                              m="0!important"
                              fontWeight="bold"
                              color="#2d3748"
                              pb={1}
                            >
                              Available to:
                            </Text>
                            <VStack align="start" spacing={1}>
                              {completion.available.map(({ team, color }) => (
                                <HStack key={team.teamId}>
                                  <Box w={3} h={3} bg={color} borderRadius="full" />
                                  <Text m="0!important" fontSize="xs">
                                    {team.teamName}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}

                        {node.rewards && (
                          <Box
                            bg="orange.100"
                            transition="all 0.3s ease"
                            animation="pulseGlow 2s infinite alternate"
                            p={2}
                            borderRadius="md"
                            m="0 auto"
                            sx={{
                              '@keyframes pulseGlow': {
                                from: { boxShadow: `0 0 8px 2px #e3c0ffff` },
                                to: { boxShadow: `0 0 16px 4px #cf9efdff` },
                              },
                            }}
                          >
                            <VStack>
                              <Text
                                m="0!important"
                                fontSize="xs"
                                fontWeight="bold"
                                color="#2d3748"
                                pb={1}
                              >
                                Rewards:
                              </Text>
                              <Image h="32px" src={Casket} />
                            </VStack>
                            <HStack justifyContent="center" mt={2} spacing={2}>
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
                              (getNodeAccessStatus(node.nodeId) !== 'locked' || showAllNodes) && (
                                <Box my={2} p={2} bg="purple.50" borderRadius="md">
                                  <Text
                                    m="0!important"
                                    pb={1}
                                    fontSize="xs"
                                    fontWeight="bold"
                                    color="#2d3748"
                                  >
                                    🎁 Buff Rewards:
                                  </Text>
                                  <VStack align="start" spacing={1}>
                                    {node.rewards.buffs.map((buff, idx) => (
                                      <HStack key={idx} spacing={1}>
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
                          </Box>
                        )}
                      </>
                    )}
                  </VStack>
                </Popup>
              </Marker>
            );
          })}

          {/* Team position markers */}
          {Object.entries(teamPositions).map(([nodeId, teamsAtNode]) => {
            const node = nodes.find((n) => n.nodeId === nodeId);
            if (!node?.coordinates) return null;

            const position = convertCoordinates(node.coordinates.x, node.coordinates.y);
            const isMultiple = teamsAtNode.length > 1;

            // Show first team or stack indicator
            const displayTeam = teamsAtNode[0];

            return (
              <Marker
                key={`team-pos-${nodeId}`}
                position={[position[0] + 15, position[1] + 15]} // Offset from node
                icon={createTeamMarker(
                  displayTeam.color,
                  isMultiple ? teamsAtNode.length.toString() : displayTeam.initials,
                  isMultiple
                )}
              >
                <Popup
                  maxWidth={250}
                  autoPan={true}
                  autoPanPaddingTopLeft={[10, 80]}
                  autoPanPaddingBottomRight={[10, 10]}
                  keepInView={true}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold" fontSize="sm" color="#1a1a1a">
                      Teams at this node:
                    </Text>
                    {teamsAtNode.map(({ team, color }) => (
                      <HStack key={team.teamId}>
                        <Box w={4} h={4} bg={color} borderRadius="full" />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" m="0!important" fontWeight="bold">
                            {team.teamName}
                          </Text>
                          <Text fontSize="xs" m="0!important" color="#718096">
                            {formatGP(team.currentPot)} • {team.completedNodes?.length || 0} nodes
                          </Text>
                        </VStack>
                      </HStack>
                    ))}
                  </VStack>
                </Popup>
                <Tooltip direction="top" permanent={false}>
                  {isMultiple ? `${teamsAtNode.length} teams` : displayTeam.team.teamName}
                </Tooltip>
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
          maxH="400px"
          overflowY="auto"
        >
          {showAllNodes && (
            <Badge colorScheme="orange" fontSize="xs" mb={2} w="full" textAlign="center">
              ADMIN MODE
            </Badge>
          )}
          {event?.status === 'DRAFT' && !showAllNodes && (
            <Badge colorScheme="purple" fontSize="xs" mb={2} w="full" textAlign="center">
              DRAFT MODE - Showing all nodes
            </Badge>
          )}

          <Text fontWeight="bold" fontSize="sm" mb={3} color="#2d3748">
            Legend
          </Text>
          <VStack align="start" spacing={2} fontSize="xs" mb={3}>
            <HStack>
              <Box w={4} h={4} bg="#43AA8B" borderRadius="full" border="2px solid white" />
              <Text color="#2d3748">Completed</Text>
            </HStack>
            <HStack>
              <Box w={4} h={4} bg="#FF914D" borderRadius="full" border="2px solid white" />
              <Text color="#2d3748">Available</Text>
            </HStack>
            <HStack>
              <Box
                w={4}
                h={4}
                bg="#718096"
                borderRadius="full"
                border="2px solid white"
                opacity={0.5}
              />
              <Text color="#2d3748">Locked</Text>
            </HStack>
            <HStack>
              <Box w={4} h={4} bg="#F4D35E" borderRadius="sm" border="2px solid white" />
              <Text color="#2d3748">Inn</Text>
            </HStack>
          </VStack>

          <Text
            fontWeight="bold"
            fontSize="sm"
            mb={2}
            color="#2d3748"
            pt={2}
            borderTop="1px solid #e2e8f0"
          >
            Teams
          </Text>
          <VStack align="start" spacing={1} maxH="200px" overflowY="auto">
            {teams.map((team, idx) => (
              <HStack
                key={team.teamId}
                cursor="pointer"
                onClick={() => toggleTeam(team.teamId)}
                opacity={selectedTeams.includes(team.teamId) ? 1 : 0.4}
                _hover={{ opacity: 0.8 }}
                w="full"
                p={1}
                borderRadius="sm"
                bg={selectedTeams.includes(team.teamId) ? 'gray.50' : 'transparent'}
              >
                <Box w={3} h={3} bg={getTeamColor(idx)} borderRadius="full" />
                <Text
                  fontSize="xs"
                  color="#2d3748"
                  fontWeight={selectedTeams.includes(team.teamId) ? 'bold' : 'normal'}
                >
                  {team.teamName}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </Box>

      {/* Team stats summary */}
      <VStack spacing={2} align="stretch">
        {teams.map((team, idx) => {
          if (!selectedTeams.includes(team.teamId)) return null;

          return (
            <HStack
              key={team.teamId}
              p={3}
              bg="rgba(255, 255, 255, 0.95)"
              borderRadius="md"
              borderLeft="4px solid"
              borderLeftColor={getTeamColor(idx)}
              justify="space-between"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ transform: 'translateX(4px)', boxShadow: 'md' }}
              onClick={() => handleTeamClick(team)}
            >
              <HStack color="#2d3748">
                <Box w={4} h={4} bg={getTeamColor(idx)} borderRadius="full" />
                <Text fontWeight="bold" fontSize="sm">
                  {team.teamName}
                </Text>
              </HStack>
              <HStack spacing={4} color="#2d3748">
                <VStack spacing={0} align="end">
                  <Text fontSize="xs" color="#718096">
                    Pot
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="#43AA8B">
                    {formatGP(team.currentPot)}
                  </Text>
                </VStack>
                <VStack spacing={0} align="end">
                  <Text fontSize="xs" color="#718096">
                    Completed
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {team.completedNodes?.length || 0}
                  </Text>
                </VStack>
                <VStack spacing={0} align="end">
                  <Text fontSize="xs" color="#718096">
                    Available
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {team.availableNodes?.length || 0}
                  </Text>
                </VStack>
              </HStack>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default MultiTeamTreasureMap;
