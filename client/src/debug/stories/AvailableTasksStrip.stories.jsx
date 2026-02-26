import React, { useRef, useState } from 'react';
import { StoryPage, StoryLayout } from '../StoryLayout';
import { Box, HStack, VStack, Text, Badge, Icon, Flex, useColorMode } from '@chakra-ui/react';
import { FaCoins } from 'react-icons/fa';
import GemTitle from '../../atoms/GemTitle';
import { OBJECTIVE_TYPES } from '../../utils/treasureHuntHelpers';

// ── Helpers ──────────────────────────────────────────────────────────────────

const sectionBg = 'rgb(0, 80, 80)';
const formatGP = (gp) => (gp / 1_000_000).toFixed(1) + 'M';

const GROUP_COLORS = ['red', 'blue', 'yellow', 'green', 'orange', 'teal', 'purple', 'cyan', 'pink'];
const GROUP_SHAPES = ['◆', '▲', '●', '■', '★', '⬟', '⬢', '✦', '❖'];

// ── Mock nodes ────────────────────────────────────────────────────────────────

const mkStandard = (id, groupId, tier, title, objective, opts = {}) => ({
  nodeId: id,
  nodeType: 'STANDARD',
  locationGroupId: groupId,
  difficultyTier: tier,
  title,
  description: `${title} description`,
  objective,
  rewards: {
    gp: tier * 1_000_000,
    keys: [{ color: tier === 5 ? 'red' : tier === 3 ? 'blue' : 'green', quantity: 1 }],
    buffs: opts.buffReward ? [{ buffType: 'kill_reduction_minor', buffName: "Slayer's Edge" }] : [],
  },
  ...opts,
});

const mkInn = (id, title) => ({
  nodeId: id,
  nodeType: 'INN',
  title,
  description: 'Trade your keys here.',
  objective: null,
  rewards: null,
  availableRewards: [],
});

// Location groups
const GRP_LUMBRIDGE = 'grp_lumbridge';
const GRP_VARROCK = 'grp_varrock';
const GRP_FALADOR = 'grp_falador';
const GRP_ARDOUGNE = 'grp_ardougne';

const NODES = {
  // Lumbridge group (3 tiers)
  lumb_easy: mkStandard('lumb_1', GRP_LUMBRIDGE, 1, 'Lumbridge - Goblins', {
    type: 'boss_kc',
    target: 'Goblins',
    quantity: 30,
  }),
  lumb_med: mkStandard('lumb_2', GRP_LUMBRIDGE, 3, 'Lumbridge - Moss Giants', {
    type: 'xp_gain',
    target: 'Slayer',
    quantity: 50000,
  }),
  lumb_hard: mkStandard('lumb_3', GRP_LUMBRIDGE, 5, 'Lumbridge - Abyssal Demons', {
    type: 'boss_kc',
    target: 'Abyssal Demons',
    quantity: 100,
  }),

  // Varrock group (3 tiers)
  varr_easy: mkStandard('varr_1', GRP_VARROCK, 1, 'Varrock - Cows', {
    type: 'item_collection',
    target: 'Cowhide',
    quantity: 50,
  }),
  varr_med: mkStandard('varr_2', GRP_VARROCK, 3, 'Varrock - Hill Giants', {
    type: 'boss_kc',
    target: 'Hill Giants',
    quantity: 60,
  }),
  varr_hard: mkStandard('varr_3', GRP_VARROCK, 5, 'Varrock - Greater Demons', {
    type: 'boss_kc',
    target: 'Greater Demons',
    quantity: 150,
  }),

  // Falador group (3 tiers)
  fala_easy: mkStandard('fala_1', GRP_FALADOR, 1, 'Falador - Chickens', {
    type: 'item_collection',
    target: 'Feather',
    quantity: 200,
  }),
  fala_med: mkStandard('fala_2', GRP_FALADOR, 3, 'Falador - Ice Warriors', {
    type: 'boss_kc',
    target: 'Ice Warriors',
    quantity: 75,
  }),
  fala_hard: mkStandard('fala_3', GRP_FALADOR, 5, 'Falador - Black Knights', {
    type: 'xp_gain',
    target: 'Defence',
    quantity: 100000,
  }),

  // Ardougne group (3 tiers)
  ardo_easy: mkStandard('ardo_1', GRP_ARDOUGNE, 1, 'Ardougne - Paladins', {
    type: 'clue_scrolls',
    target: 'Hard Clues',
    quantity: 5,
  }),
  ardo_med: mkStandard('ardo_2', GRP_ARDOUGNE, 3, 'Ardougne - Watchmen', {
    type: 'boss_kc',
    target: 'Watchmen',
    quantity: 80,
  }),
  ardo_hard: mkStandard(
    'ardo_3',
    GRP_ARDOUGNE,
    5,
    'Ardougne - Dagannoth Kings',
    { type: 'boss_kc', target: 'Dagannoth Kings', quantity: 50 },
    { buffReward: true }
  ),

  // Buff-applied node (no group)
  buffed_node: mkStandard('buffed_1', null, 5, 'Canifis - Bloodvelds (Buffed)', {
    type: 'boss_kc',
    target: 'Bloodvelds',
    quantity: 125,
    originalQuantity: 500,
    appliedBuff: { buffId: 'b1', buffName: "Slayer's Focus", reduction: 0.75, savedAmount: 375 },
  }),

  // Inn (completed, no transaction)
  inn: mkInn('inn_001', 'Varrock Inn - Checkpoint 1'),
};

// ── Strip renderer (mirrors TreasureTeamPage logic) ──────────────────────────

function AvailableTasksStrip({
  nodes = [],
  availableNodeIds = [],
  completedNodeIds = [],
  innTransactions = [],
}) {
  const { colorMode } = useColorMode();
  const scrollRef = useRef(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const team = {
    completedNodes: completedNodeIds,
    availableNodes: availableNodeIds,
    innTransactions,
  };

  const getNodeStatus = (node) => {
    if (team.completedNodes?.includes(node.nodeId)) return 'completed';
    if (team.availableNodes?.includes(node.nodeId)) return 'available';
    return 'locked';
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
      const aInn = a.nodeType === 'INN' && getNodeStatus(a) === 'completed';
      const bInn = b.nodeType === 'INN' && getNodeStatus(b) === 'completed';
      const aBuffed = !!a.objective?.appliedBuff;
      const bBuffed = !!b.objective?.appliedBuff;
      if (aInn !== bInn) return aInn ? -1 : 1;
      if (aBuffed !== bBuffed) return aBuffed ? -1 : 1;
      return 0;
    });

  if (availableNodes.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500" py={6} textAlign="center">
        (empty — strip is hidden in production)
      </Text>
    );
  }

  const groupColorMap = {};
  let groupIndex = 0;
  availableNodes.forEach((node) => {
    const key = node.locationGroupId || `solo-${node.nodeId}`;
    if (!(key in groupColorMap)) groupColorMap[key] = groupIndex++;
  });

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <GemTitle gemColor="green" size="sm" mb={0}>
          Available Tasks
        </GemTitle>
        <Badge bg="green.500" color="white" fontSize="sm" px={2} py={1} borderRadius="md">
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
          onScroll={(e) => {
            const el = e.target;
            setShowLeftFade(el.scrollLeft > 0);
            setShowRightFade(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
          }}
          css={{
            '&::-webkit-scrollbar': { height: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
            '&::-webkit-scrollbar-thumb': { background: '#abb8ceff', borderRadius: '10px' },
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
                  key={node.nodeId}
                  w="220px"
                  flexShrink={0}
                  style={{
                    backgroundColor: `color-mix(in srgb, var(--chakra-colors-${groupColor}-100) 45%, white)`,
                  }}
                  borderRadius="lg"
                  overflow="hidden"
                  border="1px solid"
                  borderColor="gray.200"
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-4px)', shadow: 'xl', borderColor: accentColor }}
                  transition="background 0.3s ease"
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
                    <Flex w="100%" justifyContent="space-between" alignSelf="flex-end" mt="auto">
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

      {/* Debug legend */}
      <HStack mt={3} spacing={3} flexWrap="wrap">
        {Object.entries(groupColorMap).map(([key, idx]) => {
          const color = GROUP_COLORS[idx % GROUP_COLORS.length];
          const shape = GROUP_SHAPES[idx % GROUP_SHAPES.length];
          return (
            <HStack key={key} spacing={1}>
              <Box
                w={3}
                h={3}
                borderRadius="sm"
                bg={colorMode === 'dark' ? `${color}.900` : `${color}.100`}
                border="1px solid"
                borderColor={colorMode === 'dark' ? `${color}.700` : `${color}.300`}
              />
              <Text fontSize="xs" color="gray.500">
                {shape} {key.replace('grp_', '').replace('solo-', '')} (#{idx})
              </Text>
            </HStack>
          );
        })}
      </HStack>
    </Box>
  );
}

// ── Story scenarios ───────────────────────────────────────────────────────────

const ALL_NODE_IDS = Object.values(NODES).map((n) => n.nodeId);
const LUMB_IDS = ['lumb_1', 'lumb_2', 'lumb_3'];
const VARR_IDS = ['varr_1', 'varr_2', 'varr_3'];
const FALA_IDS = ['fala_1', 'fala_2', 'fala_3'];
const ARDO_IDS = ['ardo_1', 'ardo_2', 'ardo_3'];
const ALL_STANDARD_IDS = [...LUMB_IDS, ...VARR_IDS, ...FALA_IDS, ...ARDO_IDS];
const ALL_NODES_LIST = Object.values(NODES);

export default function AvailableTasksStripStories() {
  return (
    <StoryPage
      title="AvailableTasksStrip"
      description="Horizontal scrollable strip showing available tasks. Cards within the same location group share a background; adjacent groups alternate between white and gray.50 (light) or whiteAlpha.100 / whiteAlpha.200 (dark). A debug legend below each scenario shows the group-to-index mapping."
    >
      {/* 1 */}
      <StoryLayout
        title="Empty — no available nodes"
        description="Strip is hidden when there are no available tasks"
        tags={['empty state']}
      >
        <AvailableTasksStrip nodes={ALL_NODES_LIST} availableNodeIds={[]} completedNodeIds={[]} />
      </StoryLayout>

      {/* 2 */}
      <StoryLayout
        title="Single node — no location group"
        description="One easy standard node without a locationGroupId. Falls into its own solo group."
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[{ ...NODES.lumb_easy, locationGroupId: null }]}
          availableNodeIds={['lumb_1']}
        />
      </StoryLayout>

      {/* 3 */}
      <StoryLayout
        title="One group — three difficulty tiers"
        description="All three Lumbridge nodes share the same locationGroupId, so they all render the same background color"
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[NODES.lumb_easy, NODES.lumb_med, NODES.lumb_hard]}
          availableNodeIds={LUMB_IDS}
        />
      </StoryLayout>

      {/* 4 */}
      <StoryLayout
        title="Two groups — alternating"
        description="Lumbridge (group 0 = white) and Varrock (group 1 = gray.50) should visually alternate"
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[
            ...Object.values(NODES).filter((n) => LUMB_IDS.includes(n.nodeId)),
            ...Object.values(NODES).filter((n) => VARR_IDS.includes(n.nodeId)),
          ]}
          availableNodeIds={[...LUMB_IDS, ...VARR_IDS]}
        />
      </StoryLayout>

      {/* 5 */}
      <StoryLayout
        title="Four groups — full alternating pattern"
        description="Lumbridge → Varrock → Falador → Ardougne; groups 0 & 2 share one shade, groups 1 & 3 the other"
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={ALL_NODES_LIST.filter((n) => ALL_STANDARD_IDS.includes(n.nodeId))}
          availableNodeIds={ALL_STANDARD_IDS}
        />
      </StoryLayout>

      {/* 6 */}
      <StoryLayout
        title="Buffed node — solo group"
        description="A buffed node has no locationGroupId so it is its own group. The ✨ Buffed badge and blue accent should appear."
        tags={['buff']}
      >
        <AvailableTasksStrip nodes={[NODES.buffed_node]} availableNodeIds={['buffed_1']} />
      </StoryLayout>

      {/* 7 */}
      <StoryLayout
        title="Buffed node sorts first within group mix"
        description="Buffed node appears before unbuffed available nodes"
        tags={['buff']}
      >
        <AvailableTasksStrip
          nodes={[NODES.lumb_easy, NODES.lumb_med, NODES.buffed_node, NODES.varr_hard]}
          availableNodeIds={['lumb_1', 'lumb_2', 'buffed_1', 'varr_3']}
        />
      </StoryLayout>

      {/* 8 */}
      <StoryLayout
        title="Inn sorts first — available inn + standard nodes"
        description="A completed inn with no transaction appears at the front of the strip"
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[NODES.inn, ...ALL_NODES_LIST.filter((n) => LUMB_IDS.includes(n.nodeId))]}
          availableNodeIds={LUMB_IDS}
          completedNodeIds={['inn_001']}
          innTransactions={[]}
        />
      </StoryLayout>

      {/* 9 */}
      <StoryLayout
        title="Inn already visited — doesn't appear"
        description="Inn with a transaction in innTransactions is excluded from the strip"
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[NODES.inn, ...ALL_NODES_LIST.filter((n) => VARR_IDS.includes(n.nodeId))]}
          availableNodeIds={VARR_IDS}
          completedNodeIds={['inn_001']}
          innTransactions={[{ nodeId: 'inn_001' }]}
        />
      </StoryLayout>

      {/* 10 */}
      <StoryLayout
        title="Buff-reward node — 🎁 badge"
        description="Ardougne hard node grants a buff on completion — shows 🎁 Buff badge"
        tags={['buff', 'happy path']}
      >
        <AvailableTasksStrip
          nodes={ALL_NODES_LIST.filter((n) => ARDO_IDS.includes(n.nodeId))}
          availableNodeIds={ARDO_IDS}
        />
      </StoryLayout>

      {/* 11 */}
      <StoryLayout
        title="Full mix — inn + 4 groups + buffed node"
        description="Everything at once: sorted inn first, then buffed node, then four alternating location groups. Scroll to see all cards."
        tags={['happy path']}
      >
        <AvailableTasksStrip
          nodes={[
            NODES.inn,
            NODES.buffed_node,
            ...ALL_NODES_LIST.filter((n) => ALL_STANDARD_IDS.includes(n.nodeId)),
          ]}
          availableNodeIds={ALL_STANDARD_IDS.concat(['buffed_1'])}
          completedNodeIds={['inn_001']}
          innTransactions={[]}
        />
      </StoryLayout>
    </StoryPage>
  );
}
