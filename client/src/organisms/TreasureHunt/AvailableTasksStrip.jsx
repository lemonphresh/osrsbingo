import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Progress,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { FaBookmark, FaCoins } from 'react-icons/fa';
import GemTitle from '../../atoms/GemTitle';
import { OBJECTIVE_TYPES, formatGP } from '../../utils/treasureHuntHelpers';
import NodeBookmarkButton from './NodeBookmarkButton';
import { HamburgerIcon } from '@chakra-ui/icons';
import Key from '../../assets/Key.png';

const GROUP_COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'teal', 'purple', 'cyan', 'pink'];
const GROUP_SHAPES = ['◆', '▲', '●', '■', '★', '⬟', '⬢', '✦', '❖'];

const AvailableTasksStrip = ({
  nodes,
  team,
  eventId,
  getNodeStatus,
  flashNodeId,
  scrollRef,
  handleQuestScroll,
  showLeftFade,
  showRightFade,
  sectionBg,
  colorMode,
  currentColors,
  handleNodeClick,
}) => {
  const { isOpen: isTipOpen, onOpen: openTip, onClose: closeTip } = useDisclosure();
  const { isOpen: isListOpen, onOpen: openList, onClose: closeList } = useDisclosure();
  const [tipFired, setTipFired] = useState(false);

  const seenStorageKey = `osrsbingo_seen_nodes_${eventId}_${team?.teamId}`;
  const [seenNodeIds, setSeenNodeIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(seenStorageKey) || '[]'));
    } catch {
      return new Set();
    }
  });

  const markSeen = (nodeId) => {
    setSeenNodeIds((prev) => {
      if (prev.has(nodeId)) return prev;
      const next = new Set(prev);
      next.add(nodeId);
      try {
        localStorage.setItem(seenStorageKey, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const handleBookmarkFirstHover = () => {
    if (tipFired || localStorage.getItem('osrsbingo_bookmark_tip_seen')) return;
    setTipFired(true);
    localStorage.setItem('osrsbingo_bookmark_tip_seen', '1');
    openTip();
  };

  const filteredNodes = nodes.filter((n) => {
    const status = getNodeStatus(n);
    return (
      status === 'available' ||
      (n.nodeType === 'INN' &&
        status === 'completed' &&
        !team.innTransactions?.some((t) => t.nodeId === n.nodeId))
    );
  });

  // Compute group-level priority so all members of a group sort together
  const groupPriority = {};
  filteredNodes.forEach((n) => {
    const key = n.locationGroupId || `solo-${n.nodeId}`;
    if (!groupPriority[key]) groupPriority[key] = { isInn: false };
    if (n.nodeType === 'INN' && getNodeStatus(n) === 'completed') groupPriority[key].isInn = true;
  });

  const availableNodes = filteredNodes.sort((a, b) => {
    const aKey = a.locationGroupId || `solo-${a.nodeId}`;
    const bKey = b.locationGroupId || `solo-${b.nodeId}`;
    const aPriority = groupPriority[aKey];
    const bPriority = groupPriority[bKey];
    if (aPriority.isInn !== bPriority.isInn) return aPriority.isInn ? -1 : 1;
    // Keep same-group nodes adjacent, then easy → medium → hard
    if (aKey !== bKey) return aKey < bKey ? -1 : 1;
    return (a.difficultyTier || 0) - (b.difficultyTier || 0);
  });

  if (availableNodes.length === 0) return null;

  // Assign alternating color indices by location group order
  const groupColorMap = {};
  let groupIndex = 0;
  availableNodes.forEach((node) => {
    const groupKey = node.locationGroupId || `solo-${node.nodeId}`;
    if (!(groupKey in groupColorMap)) groupColorMap[groupKey] = groupIndex++;
  });

  return (
    <>
      <Box>
        <HStack justify="space-between" align="flex-start" mb={3}>
          <GemTitle gemColor="green" size="sm" mb={0}>
            Available Tasks
          </GemTitle>
          <Flex direction={{ base: 'column', sm: 'row' }} gap={2} align="stretch">
            {availableNodes.some((n) => !seenNodeIds.has(n.nodeId)) && (
              <Badge
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
                cursor="pointer"
                colorScheme="green"
                variant="outline"
                textAlign="center"
                display="flex"
                alignItems="center"
                justifyContent="center"
                onClick={() => {
                  const allIds = availableNodes.map((n) => n.nodeId);
                  setSeenNodeIds((prev) => {
                    const next = new Set(prev);
                    allIds.forEach((id) => next.add(id));
                    try {
                      localStorage.setItem(seenStorageKey, JSON.stringify([...next]));
                    } catch {}
                    return next;
                  });
                }}
                _hover={{ opacity: 0.85 }}
              >
                Mark all seen
              </Badge>
            )}
            <Badge
              bg={currentColors.green.base}
              color="white"
              fontSize="sm"
              px={2}
              py={1}
              borderRadius="md"
              cursor="pointer"
              onClick={openList}
              textAlign="center"
              display="flex"
              alignItems="center"
              justifyContent="center"
              _hover={{ opacity: 0.85 }}
            >
              <HamburgerIcon boxSize={3} mr={1} />
              {availableNodes.length} available
            </Badge>
          </Flex>
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

                const groupKey = node.locationGroupId || `solo-${node.nodeId}`;
                const groupIdx = groupColorMap[groupKey] ?? 0;
                const groupColor = GROUP_COLORS[groupIdx % GROUP_COLORS.length];
                const groupShape = GROUP_SHAPES[groupIdx % GROUP_SHAPES.length];

                const nodeProgress = team?.nodeProgress?.[node.nodeId];
                const progressPct =
                  nodeProgress != null && node.objective?.quantity
                    ? Math.min(100, Math.round((nodeProgress / node.objective.quantity) * 100))
                    : null;

                return (
                  <Box
                    id={`node-card-${node.nodeId}`}
                    key={node.nodeId}
                    w="220px"
                    flexShrink={0}
                    position="relative"
                    cursor="pointer"
                    borderRadius="lg"
                    _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                    onClick={() => {
                      markSeen(node.nodeId);
                      handleNodeClick(node);
                    }}
                    transition="transform 0.2s ease, box-shadow 0.2s ease"
                  >
                    {/* Inner card — overflow:hidden for rounded corners, separate from bookmark */}
                    <Box
                      style={
                        flashNodeId !== node.nodeId
                          ? {
                              backgroundColor: `color-mix(in srgb, var(--chakra-colors-${groupColor}-100) 45%, white)`,
                            }
                          : undefined
                      }
                      h="100%"
                      borderRadius="lg"
                      overflow="hidden"
                      border="1px solid"
                      borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
                      _hover={{ borderColor: accentColor }}
                      transition="background 0.3s ease, border-color 0.2s ease"
                      sx={
                        flashNodeId === node.nodeId
                          ? {
                              animation: 'cardFlash 0.5s ease-in-out 4',
                              '@keyframes cardFlash': {
                                '0%, 100%': { background: 'rgba(166, 255, 230, 0.85)' },
                                '50%': { background: 'rgba(166, 255, 219, 0.5)' },
                              },
                            }
                          : {}
                      }
                    >
                      <Box h="4px" bg={accentColor} w="100%" />
                      <Flex flexDirection="column" h="100%" p={3}>
                        <HStack justify="space-between" mb={2}>
                          <HStack spacing={1}>
                            <Text
                              fontSize="sm"
                              color="gray.600"
                              opacity="0.7"
                              userSelect="none"
                              lineHeight={1}
                            >
                              {groupShape}
                            </Text>
                            <Badge
                              colorScheme={
                                isInn ? 'yellow' : diffColor[node.difficultyTier] || 'gray'
                              }
                              fontSize="xs"
                            >
                              {isInn ? '🏠 Inn' : diffMap[node.difficultyTier] || node.nodeType}
                            </Badge>
                            {!seenNodeIds.has(node.nodeId) && (
                              <Badge
                                colorScheme="green"
                                fontSize="9px"
                                px={1}
                                sx={{
                                  animation: 'newPulse 1.8s ease-in-out infinite',
                                  '@keyframes newPulse': {
                                    '0%, 100%': { opacity: 1 },
                                    '50%': { opacity: 0.45 },
                                  },
                                }}
                              >
                                NEW
                              </Badge>
                            )}
                          </HStack>
                          <HStack spacing={1}>
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
                            {OBJECTIVE_TYPES[node.objective.type]}:{' '}
                            {node.objective.quantity?.toLocaleString()} {node.objective.target}
                            {hasBuffApplied && (
                              <Text as="span" color="blue.300">
                                {' '}
                                (-{(node.objective.appliedBuff.reduction * 100).toFixed(0)}%)
                              </Text>
                            )}
                          </Text>
                        )}
                        {progressPct !== null && (
                          <Box mb={2}>
                            <Progress
                              value={progressPct}
                              size="xs"
                              colorScheme="green"
                              borderRadius="full"
                              bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
                              mb={1}
                            />
                            <Text
                              fontSize="xs"
                              color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                            >
                              {nodeProgress.toLocaleString()} /{' '}
                              {node.objective.quantity.toLocaleString()} ({progressPct}%)
                            </Text>
                          </Box>
                        )}
                        {isInn && (
                          <Text fontSize="xs" color="yellow.500" mb={2} fontWeight="semibold">
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
                    {/* Bookmark rendered outside overflow:hidden so it isn't clipped */}
                    {eventId && (
                      <NodeBookmarkButton
                        eventId={eventId}
                        teamId={team?.teamId}
                        nodeId={node.nodeId}
                        isBookmarked={team?.inProgressNodes?.includes(node.nodeId) ?? false}
                        onFirstHover={handleBookmarkFirstHover}
                      />
                    )}
                  </Box>
                );
              })}
            </HStack>
          </Box>
        </Box>
      </Box>

      <Modal isOpen={isListOpen} onClose={closeList} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white" maxH="80vh">
          <ModalHeader fontSize="md">All Available Tasks</ModalHeader>
          <ModalBody
            overflowY="auto"
            css={{
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#abb8ceff',
                borderRadius: '10px',
                '&:hover': {
                  background: '#718096',
                },
              },
              scrollbarWidth: 'thin',
              scrollbarColor: '#abb8ceff transparent',
            }}
            pb={4}
          >
            {(() => {
              const seen = new Set();
              return availableNodes.map((node) => {
                const isInn = node.nodeType === 'INN';
                const groupKey = node.locationGroupId || `solo-${node.nodeId}`;
                const groupIdx = groupColorMap[groupKey] ?? 0;
                const groupColor = GROUP_COLORS[groupIdx % GROUP_COLORS.length];
                const groupShape = GROUP_SHAPES[groupIdx % GROUP_SHAPES.length];
                const isFirstInGroup = !seen.has(groupKey);
                if (isFirstInGroup) seen.add(groupKey);
                const locationName = node.title.includes(' - ') ? node.title.split(' - ')[0] : null;
                const diffMap = { 1: 'Easy', 3: 'Medium', 5: 'Hard' };
                const diffColor = { 1: 'green', 3: 'orange', 5: 'red' };
                const hasBuffApplied = !!node.objective?.appliedBuff;
                return (
                  <Box key={node.nodeId}>
                    {isFirstInGroup && locationName && (
                      <HStack mt={3} mb={1} spacing={1}>
                        <Text fontSize="xs" color={`${groupColor}.300`} userSelect="none">
                          {groupShape}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.400"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          {locationName}
                        </Text>
                      </HStack>
                    )}
                    <Flex
                      align="center"
                      justify="space-between"
                      px={3}
                      py={2}
                      bg="whiteAlpha.100"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'whiteAlpha.200' }}
                      onClick={() => {
                        markSeen(node.nodeId);
                        handleNodeClick(node);
                      }}
                      borderLeft="3px solid"
                      borderLeftColor={`${groupColor}.400`}
                      mb={1}
                    >
                      <HStack spacing={2} flex={1} minW={0}>
                        <Badge
                          colorScheme={isInn ? 'yellow' : diffColor[node.difficultyTier] || 'gray'}
                          fontSize="xs"
                          flexShrink={0}
                        >
                          {isInn ? 'Inn' : diffMap[node.difficultyTier] || node.nodeType}
                        </Badge>
                        <Text fontSize="sm" noOfLines={1} color="white">
                          {node.title.includes(' - ')
                            ? node.title.split(' - ').slice(1).join(' - ')
                            : node.title}
                        </Text>
                        {!seenNodeIds.has(node.nodeId) && (
                          <Badge colorScheme="green" fontSize="9px" px={1} flexShrink={0}>
                            NEW
                          </Badge>
                        )}
                        {team?.inProgressNodes?.includes(node.nodeId) && (
                          <Icon as={FaBookmark} color="#F5C518" boxSize="10px" flexShrink={0} />
                        )}
                        {hasBuffApplied && (
                          <Badge colorScheme="blue" fontSize="xs" flexShrink={0}>
                            Buffed
                          </Badge>
                        )}
                      </HStack>
                      {!isInn && (node.rewards?.gp || node.rewards?.keys?.length > 0) && (
                        <HStack spacing={1} flexShrink={0} ml={2}>
                          {node.rewards?.keys?.map((key, idx) => (
                            <Badge
                              display="inline-flex"
                              alignItems="center"
                              justifyContent="center"
                              key={idx}
                              mr="4px"
                              colorScheme={key.color}
                              fontSize="xs"
                            >
                              <Image src={Key} alt="Key" mr="4px" height="12px" /> {key.quantity}
                            </Badge>
                          ))}
                          {node.rewards?.gp && (
                            <>
                              <Icon as={FaCoins} color="yellow.500" boxSize={3} />
                              <Text fontSize="xs" color="yellow.500" fontWeight="semibold">
                                {formatGP(node.rewards.gp)}
                              </Text>
                            </>
                          )}
                        </HStack>
                      )}
                    </Flex>
                  </Box>
                );
              });
            })()}
          </ModalBody>
          <ModalFooter>
            <Button size="sm" variant="ghost" colorScheme="whiteAlpha" onClick={closeList}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isTipOpen} onClose={closeTip} isCentered size="sm">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="md">Mark a task as In Progress</ModalHeader>
          <ModalBody fontSize="sm" color="gray.600" pb={2}>
            Tap the bookmark ribbon on any task to let your team know what you're actively working
            on. Each location group can only have one active bookmark. Picking a new one clears the
            previous.
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="green" size="sm" onClick={closeTip}>
              Got it
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AvailableTasksStrip;
