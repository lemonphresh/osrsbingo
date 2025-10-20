import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  ImageOverlay,
  Marker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import { Box, Badge, Text, VStack, HStack, Avatar, AvatarGroup } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import theme from '../theme';

// Component to handle map panning and pulsing
const MapController = ({ pulsingNodeId, teams, nodes, convertCoordinates }) => {
  const map = useMap();

  useEffect(() => {
    if (pulsingNodeId) {
      // Find the node to pan to
      const node = nodes.find((n) => n.nodeId === pulsingNodeId);
      if (node?.coordinates) {
        const position = convertCoordinates(node.coordinates.x, node.coordinates.y);
        map.flyTo(position, 1, { duration: 0.8 });
      }
    }
  }, [pulsingNodeId, map, nodes, convertCoordinates]);

  return null;
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
  mapImageUrl = 'https://oldschool.runescape.wiki/images/Old_School_RuneScape_world_map.png',
  onNodeClick,
}) => {
  const [selectedTeams, setSelectedTeams] = useState(teams.map((t) => t.teamId));
  const [pulsingNodes, setPulsingNodes] = useState(new Set());
  const [focusNodeId, setFocusNodeId] = useState(null);

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

  // Build edges between nodes
  const edges = [];
  nodes.forEach((node) => {
    if (node.unlocks && Array.isArray(node.unlocks)) {
      node.unlocks.forEach((targetNodeId) => {
        const targetNode = nodes.find((n) => n.nodeId === targetNodeId);
        if (targetNode && node.coordinates && targetNode.coordinates) {
          const fromPos = convertCoordinates(node.coordinates.x, node.coordinates.y);
          const toPos = convertCoordinates(targetNode.coordinates.x, targetNode.coordinates.y);
          edges.push({ from: fromPos, to: toPos });
        }
      });
    }
  });

  // Calculate which teams have completed which nodes
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
    if (!completion) return '#718096';

    if (nodeType === 'START') return '#7D5FFF';
    if (nodeType === 'INN') return '#F4D35E';

    // If any selected team completed it, show green
    if (completion.completed.length > 0) return '#43AA8B';
    // If any selected team can access it, show turquoise
    if (completion.available.length > 0) return '#28AFB0';

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
          minZoom={-2}
          maxZoom={2}
          crs={L.CRS.Simple}
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          maxBounds={mapBounds}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={true}
        >
          <ImageOverlay url={mapImageUrl} bounds={mapBounds} opacity={0.85} />

          <MapController
            pulsingNodeId={focusNodeId}
            teams={teams}
            nodes={nodes}
            convertCoordinates={convertCoordinates}
          />

          {/* Draw connection lines */}
          {edges.map((edge, idx) => (
            <Polyline
              key={`edge-${idx}`}
              positions={[edge.from, edge.to]}
              color="#718096"
              weight={2}
              opacity={0.3}
            />
          ))}

          {/* Node markers */}
          {nodes.map((node) => {
            if (!node.coordinates?.x || !node.coordinates?.y) return null;

            const position = convertCoordinates(node.coordinates.x, node.coordinates.y);
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
                <Popup maxWidth={350}>
                  <VStack align="start" spacing={2} p={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold" fontSize="md" color="#1a1a1a">
                        {node.title}
                      </Text>
                      <Badge colorScheme={node.nodeType === 'INN' ? 'yellow' : 'blue'}>
                        {node.nodeType}
                      </Badge>
                    </HStack>

                    {node.description && (
                      <Text fontSize="sm" color="#4a4a4a">
                        {node.description}
                      </Text>
                    )}

                    {completion.completed.length > 0 && (
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color="#2d3748" mb={1}>
                          Completed by:
                        </Text>
                        <VStack align="start" spacing={1}>
                          {completion.completed.map(({ team, color }) => (
                            <HStack key={team.teamId}>
                              <Box w={3} h={3} bg={color} borderRadius="full" />
                              <Text fontSize="xs">{team.teamName}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {completion.available.length > 0 && completion.completed.length === 0 && (
                      <Box>
                        <Text fontSize="xs" fontWeight="bold" color="#2d3748" mb={1}>
                          Available to:
                        </Text>
                        <VStack align="start" spacing={1}>
                          {completion.available.map(({ team, color }) => (
                            <HStack key={team.teamId}>
                              <Box w={3} h={3} bg={color} borderRadius="full" />
                              <Text fontSize="xs">{team.teamName}</Text>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {node.rewards && (
                      <HStack spacing={2}>
                        <Badge colorScheme="green" fontSize="xs">
                          {formatGP(node.rewards.gp)} GP
                        </Badge>
                        {node.rewards.keys?.map((key, idx) => (
                          <Badge key={idx} colorScheme={key.color} fontSize="xs">
                            {key.quantity}x {key.color}
                          </Badge>
                        ))}
                      </HStack>
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
                <Popup maxWidth={250}>
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold" fontSize="sm" color="#1a1a1a">
                      Teams at this node:
                    </Text>
                    {teamsAtNode.map(({ team, color }) => (
                      <HStack key={team.teamId}>
                        <Box w={4} h={4} bg={color} borderRadius="full" />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {team.teamName}
                          </Text>
                          <Text fontSize="xs" color="#718096">
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
          <Text fontWeight="bold" fontSize="sm" mb={3} color="#2d3748">
            Legend
          </Text>
          <VStack align="start" spacing={2} fontSize="xs" mb={3}>
            <HStack>
              <Box w={4} h={4} bg="#43AA8B" borderRadius="full" border="2px solid white" />
              <Text color="#2d3748">Completed</Text>
            </HStack>
            <HStack>
              <Box w={4} h={4} bg="#28AFB0" borderRadius="full" border="2px solid white" />
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
              <HStack color={theme.colors.gray[800]}>
                <Box w={4} h={4} bg={getTeamColor(idx)} borderRadius="full" />
                <Text fontWeight="bold" fontSize="sm">
                  {team.teamName}
                </Text>
              </HStack>
              <HStack spacing={4} color={theme.colors.gray[800]}>
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
