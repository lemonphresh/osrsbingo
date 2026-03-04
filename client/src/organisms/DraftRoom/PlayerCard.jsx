import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  Tooltip,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  useColorMode,
} from '@chakra-ui/react';

const TIER_COLORS = {
  S: { bg: '#FFD700', color: '#1A202C' },
  A: '#9B84FF',
  B: '#43AA8B',
  C: '#4ECDC4',
  D: '#A0AEC0',
};

const STAT_LABELS = {
  combatLevel: 'Combat',
  totalLevel: 'Total Lvl',
  ehp: 'EHP',
  ehb: 'EHB',
  slayerLevel: 'Slayer',
};

function StatRow({ label, value }) {
  return (
    <HStack justify="space-between" w="100%">
      <Text fontSize="xs" color="gray.400">{label}</Text>
      <Text fontSize="xs" fontWeight="bold">{value}</Text>
    </HStack>
  );
}

function ExpandedStats({ womData, statCategories }) {
  if (!womData || womData.notFound) {
    return <Text fontSize="xs" color="gray.400">Stats unavailable</Text>;
  }

  const skills = womData.skills ?? {};
  const skillNames = Object.keys(skills).filter((s) => s !== 'overall').sort();

  return (
    <VStack align="stretch" spacing={1} maxH="300px" overflowY="auto" pr={1}>
      <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>All Skills</Text>
      <SimpleGrid columns={2} spacing={1}>
        {skillNames.map((skill) => (
          <StatRow
            key={skill}
            label={skill.charAt(0).toUpperCase() + skill.slice(1)}
            value={skills[skill] ?? 1}
          />
        ))}
      </SimpleGrid>
      {(womData.topBossKcs ?? []).length > 0 && (
        <>
          <Text fontSize="xs" fontWeight="bold" color="gray.300" mt={2} mb={1}>Top Boss KCs</Text>
          {(womData.topBossKcs ?? []).map((b) => (
            <StatRow
              key={b.boss}
              label={b.boss.replace(/_/g, ' ')}
              value={b.kc.toLocaleString()}
            />
          ))}
        </>
      )}
    </VStack>
  );
}

/**
 * Anonymous player stat card.
 * Shows alias + selected stats. RSN shows only when revealed (rsn prop is non-null).
 * Supports a CSS flip animation on reveal (add .revealed class when flipped).
 */
export default function PlayerCard({
  player,
  statCategories = [],
  onClick,
  isPickable = false,
  isCurrentPick = false,
  isAuctionTarget = false,
}) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const revealed = player.rsn !== null && player.rsn !== undefined;
  const drafted = player.teamIndex !== null && player.teamIndex !== undefined;

  const tierColor = TIER_COLORS[player.tierBadge];
  const tierBg = typeof tierColor === 'object' ? tierColor.bg : tierColor;
  const tierText = typeof tierColor === 'object' ? tierColor.color : 'white';

  const cardBg = isDark ? '#2D3748' : 'white';
  const borderColor = isCurrentPick || isAuctionTarget
    ? 'purple.400'
    : drafted
    ? 'green.600'
    : isDark
    ? 'gray.600'
    : 'gray.200';

  const womData = player.womData ?? {};

  const mainStats = [];
  if (statCategories.includes('combatLevel') && womData.combatLevel)
    mainStats.push({ label: 'Combat', value: womData.combatLevel });
  if (statCategories.includes('totalLevel') && womData.totalLevel)
    mainStats.push({ label: 'Total', value: womData.totalLevel.toLocaleString() });
  if (statCategories.includes('ehp') && womData.ehp !== undefined)
    mainStats.push({ label: 'EHP', value: Math.round(womData.ehp).toLocaleString() });
  if (statCategories.includes('ehb') && womData.ehb !== undefined)
    mainStats.push({ label: 'EHB', value: Math.round(womData.ehb).toLocaleString() });
  if (statCategories.includes('slayerLevel') && womData.slayerLevel)
    mainStats.push({ label: 'Slayer', value: womData.slayerLevel });
  if (statCategories.includes('topBossKcs')) {
    (womData.topBossKcs ?? []).forEach((b) => {
      mainStats.push({ label: b.boss.replace(/_/g, ' ').slice(0, 10), value: b.kc.toLocaleString() });
    });
  }

  const card = (
    <Box
      bg={cardBg}
      border="2px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={3}
      cursor={isPickable ? 'pointer' : drafted ? 'default' : 'default'}
      opacity={drafted && !isCurrentPick ? 0.55 : 1}
      onClick={isPickable && !drafted ? onClick : undefined}
      transition="all 0.2s"
      _hover={isPickable && !drafted ? { borderColor: 'purple.300', transform: 'translateY(-2px)' } : {}}
      position="relative"
      minW="130px"
      w="100%"
    >
      {/* Tier badge */}
      {player.tierBadge && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          bg={tierBg}
          color={tierText}
          fontSize="xs"
          fontWeight="black"
          px={1.5}
          borderRadius="sm"
        >
          {player.tierBadge}
        </Badge>
      )}

      <VStack spacing={1} align="stretch">
        {/* Identity */}
        <Text fontWeight="bold" fontSize="sm" noOfLines={1} pr={player.tierBadge ? 8 : 0}>
          {revealed ? player.rsn : player.alias}
        </Text>
        {revealed && (
          <Text fontSize="xs" color="gray.400" noOfLines={1}>{player.alias}</Text>
        )}

        {/* Stats */}
        {womData.notFound ? (
          <Text fontSize="xs" color="orange.300">Not on WOM</Text>
        ) : (
          <VStack spacing={0} align="stretch" mt={1}>
            {mainStats.slice(0, 4).map((s) => (
              <StatRow key={s.label} label={s.label} value={s.value} />
            ))}
          </VStack>
        )}

        {drafted && (
          <Badge colorScheme="green" fontSize="9px" mt={1} alignSelf="flex-start">
            Drafted
          </Badge>
        )}
      </VStack>
    </Box>
  );

  if (!womData.notFound && (womData.skills || (womData.topBossKcs ?? []).length > 0)) {
    return (
      <Popover trigger="hover" placement="right" isLazy>
        <PopoverTrigger>{card}</PopoverTrigger>
        <PopoverContent bg={isDark ? '#1A202C' : 'white'} borderColor="gray.600" maxW="220px">
          <PopoverBody>
            <ExpandedStats womData={womData} statCategories={statCategories} />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }

  return card;
}
