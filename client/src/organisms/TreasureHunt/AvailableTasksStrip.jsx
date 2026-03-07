import React, { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
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
import { FaCoins } from 'react-icons/fa';
import GemTitle from '../../atoms/GemTitle';
import { OBJECTIVE_TYPES, formatGP } from '../../utils/treasureHuntHelpers';
import NodeBookmarkButton from './NodeBookmarkButton';

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
  const [tipFired, setTipFired] = useState(false);

  const handleBookmarkFirstHover = () => {
    if (tipFired || localStorage.getItem('osrsbingo_bookmark_tip_seen')) return;
    setTipFired(true);
    localStorage.setItem('osrsbingo_bookmark_tip_seen', '1');
    openTip();
  };

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
                    onClick={() => handleNodeClick(node)}
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
                          </HStack>
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
