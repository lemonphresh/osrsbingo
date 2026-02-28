import React from 'react';
import { Badge, Box, Flex, HStack, Icon, Text } from '@chakra-ui/react';
import { FaCoins } from 'react-icons/fa';
import GemTitle from '../../atoms/GemTitle';
import { OBJECTIVE_TYPES, formatGP } from '../../utils/treasureHuntHelpers';

const GROUP_COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'teal', 'purple', 'cyan', 'pink'];
const GROUP_SHAPES = ['◆', '▲', '●', '■', '★', '⬟', '⬢', '✦', '❖'];

const AvailableTasksStrip = ({
  nodes,
  team,
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

              return (
                <Box
                  id={`node-card-${node.nodeId}`}
                  key={node.nodeId}
                  w="220px"
                  flexShrink={0}
                  style={
                    flashNodeId !== node.nodeId
                      ? {
                          backgroundColor: `color-mix(in srgb, var(--chakra-colors-${groupColor}-100) 45%, white)`,
                        }
                      : undefined
                  }
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid"
                  borderColor={colorMode === 'dark' ? 'whiteAlpha.200' : 'gray.200'}
                  cursor="pointer"
                  _hover={{
                    transform: 'translateY(-4px)',
                    shadow: 'xl',
                    borderColor: accentColor,
                  }}
                  onClick={() => handleNodeClick(node)}
                  position="relative"
                  transition="background 0.3s ease"
                  sx={
                    flashNodeId === node.nodeId
                      ? {
                          animation: 'cardFlash 0.5s ease-in-out 4',
                          '@keyframes cardFlash': {
                            '0%, 100%': {
                              background: 'rgba(166, 255, 230, 0.85)',
                            },
                            '50%': {
                              background: 'rgba(166, 255, 219, 0.5)',
                            },
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
                          colorScheme={isInn ? 'yellow' : diffColor[node.difficultyTier] || 'gray'}
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
                        {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                        {node.objective.target}
                        {hasBuffApplied && (
                          <Text as="span" color="blue.300">
                            {' '}
                            (-{(node.objective.appliedBuff.reduction * 100).toFixed(0)}%)
                          </Text>
                        )}
                      </Text>
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
              );
            })}
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default AvailableTasksStrip;
