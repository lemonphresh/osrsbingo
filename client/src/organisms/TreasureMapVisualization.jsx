import React, { useEffect, useRef } from 'react';
import { MapContainer, ImageOverlay, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import { Box, Badge, Text, VStack, HStack, Tooltip as ChakraTooltip } from '@chakra-ui/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom marker component with pulsing animation for available nodes
const createCustomIcon = (color, nodeType, status) => {
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
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        ${status === 'locked' ? 'opacity: 0.5;' : ''}
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

// Component to fit bounds after markers are added
const FitBoundsOnLoad = ({ nodes }) => {
  const map = useMap();
  const hasSetBounds = useRef(false);

  useEffect(() => {
    if (nodes.length > 0 && !hasSetBounds.current) {
      // Get all valid coordinate positions
      const positions = nodes
        .filter((n) => n.coordinates?.x && n.coordinates?.y)
        .map((n) => {
          const x = n.coordinates.x;
          const y = n.coordinates.y;
          // Using the conversion logic
          const osrsMinX = 1100;
          const osrsMaxX = 3900;
          const osrsMinY = 2500;
          const osrsMaxY = 4100;
          const mapWidth = 7168;
          const mapHeight = 3904;

          const normalizedX = (x - osrsMinX) / (osrsMaxX - osrsMinX);
          const normalizedY = (y - osrsMinY) / (osrsMaxY - osrsMinY);
          const pixelX = normalizedX * mapWidth;
          const pixelY = normalizedY * mapHeight;

          return [pixelY, pixelX];
        });

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 1 });
        hasSetBounds.current = true;
      }
    }
  }, [nodes, map]);

  return null;
};

const TreasureMapVisualization = ({
  nodes = [],
  team,
  mapImageUrl = 'https://oldschool.runescape.wiki/images/Old_School_RuneScape_world_map.png',
  onNodeClick,
}) => {
  const colors = {
    purple: '#7D5FFF',
    green: '#43AA8B',
    yellow: '#F4D35E',
    turquoise: '#28AFB0',
    red: '#FF4B5C',
    gray: '#718096',
  };

  const mapWidth = 7168;
  const mapHeight = 3904;
  const mapBounds = [
    [0, 0],
    [mapHeight, mapWidth],
  ];

  // Convert OSRS coordinates to pixel coordinates
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

  const getNodeStatus = (node) => {
    if (!team) return 'locked';
    if (team.completedNodes?.includes(node.nodeId)) return 'completed';
    if (team.availableNodes?.includes(node.nodeId)) return 'available';
    return 'locked';
  };

  const getNodeColor = (status, nodeType) => {
    if (nodeType === 'START') return colors.purple;
    if (nodeType === 'INN') return colors.yellow;
    if (status === 'completed') return colors.green;
    if (status === 'available') return colors.turquoise;
    return colors.gray;
  };

  const formatGP = (gp) => {
    if (!gp) return '0';
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const getPathColor = (fromNode, toNode) => {
    const fromStatus = getNodeStatus(fromNode);
    const toStatus = getNodeStatus(toNode);

    if (fromStatus === 'completed' && toStatus === 'completed') return colors.green;
    if (fromStatus === 'completed' && toStatus === 'available') return colors.turquoise;
    return colors.gray;
  };

  // Build edges from node connections
  const edges = [];
  nodes.forEach((node) => {
    if (node.unlocks && Array.isArray(node.unlocks)) {
      node.unlocks.forEach((targetNodeId) => {
        const targetNode = nodes.find((n) => n.nodeId === targetNodeId);
        if (targetNode && node.coordinates && targetNode.coordinates) {
          const fromPos = convertCoordinates(node.coordinates.x, node.coordinates.y);
          const toPos = convertCoordinates(targetNode.coordinates.x, targetNode.coordinates.y);
          edges.push({
            from: fromPos,
            to: toPos,
            color: getPathColor(node, targetNode),
            fromStatus: getNodeStatus(node),
            toStatus: getNodeStatus(targetNode),
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

        <FitBoundsOnLoad nodes={nodes} />

        {/* Draw connection lines */}
        {edges.map((edge, idx) => (
          <Polyline
            key={`edge-${idx}`}
            positions={[edge.from, edge.to]}
            color={edge.color}
            weight={edge.fromStatus === 'completed' ? 3 : 2}
            opacity={edge.fromStatus === 'completed' ? 0.8 : 0.4}
            dashArray={edge.fromStatus === 'locked' ? '8, 8' : null}
          />
        ))}

        {/* Node markers */}
        {nodes.map((node) => {
          if (!node.coordinates?.x || !node.coordinates?.y) return null;

          const status = getNodeStatus(node);
          const color = getNodeColor(status, node.nodeType);
          const position = convertCoordinates(node.coordinates.x, node.coordinates.y);

          return (
            <Marker
              key={node.nodeId}
              position={position}
              icon={createCustomIcon(color, node.nodeType, status)}
              eventHandlers={{
                click: () => {
                  if (onNodeClick && status !== 'locked') {
                    onNodeClick(node);
                  }
                },
              }}
            >
              <Popup maxWidth={300}>
                <VStack align="start" spacing={2} p={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="md" color="#1a1a1a">
                      {node.title}
                    </Text>
                    <Badge
                      colorScheme={
                        status === 'completed' ? 'green' : status === 'available' ? 'blue' : 'gray'
                      }
                      fontSize="xs"
                    >
                      {status.toUpperCase()}
                    </Badge>
                  </HStack>

                  {node.description && (
                    <Text fontSize="sm" color="#4a4a4a">
                      {node.description}
                    </Text>
                  )}

                  {node.objective && (
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="#2d3748" mb={1}>
                        Objective:
                      </Text>
                      <Text fontSize="xs" color="#4a5568">
                        {node.objective.type}: {node.objective.quantity} {node.objective.target}
                      </Text>
                    </Box>
                  )}

                  {node.rewards && (
                    <Box>
                      <Text fontSize="xs" fontWeight="bold" color="#2d3748" mb={1}>
                        Rewards:
                      </Text>
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
                    </Box>
                  )}

                  {status === 'available' && (
                    <Text fontSize="xs" color="#4a5568" fontStyle="italic" mt={2}>
                      Click marker or use Discord bot to submit completion
                    </Text>
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
              bg={colors.turquoise}
              borderRadius="full"
              border="2px solid white"
              position="relative"
            />
            <Text color="#2d3748">Available (click to view)</Text>
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
