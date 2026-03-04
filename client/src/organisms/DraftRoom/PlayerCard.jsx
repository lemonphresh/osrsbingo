import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  SimpleGrid,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from '@chakra-ui/react';
import { SOLO_BOSSES, RAIDS, MINIGAMES } from '../../utils/objectiveCollections';

// build WOM snake_case key → display name from objectiveCollections
const BOSS_DISPLAY = {};
[...Object.values(SOLO_BOSSES), ...Object.values(RAIDS), ...Object.values(MINIGAMES)].forEach(
  ({ id, name, shortName }) => {
    const womKey = id.replace(/([A-Z])/g, '_$1').toLowerCase();
    BOSS_DISPLAY[womKey] = shortName ?? name;
  }
);

function formatBossName(womKey) {
  return BOSS_DISPLAY[womKey] ?? womKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

const TIER_COLORS = {
  S: { bg: '#FFD700', color: '#1A202C' },
  A: { bg: '#9B84FF', color: '#1A202C' },
  B: { bg: '#43AA8B', color: '#fff' },
  C: { bg: '#4ECDC4', color: '#1A202C' },
  D: { bg: '#A0AEC0', color: '#1A202C' },
};

function StatChip({ label, value }) {
  return (
    <VStack spacing={0} align="center">
      <Text fontSize="10px" color="gray.400" lineHeight={1}>
        {label}
      </Text>
      <Text fontSize="xs" fontWeight="bold" lineHeight={1.3}>
        {value}
      </Text>
    </VStack>
  );
}

function StatRow({ label, value }) {
  return (
    <HStack justify="space-between" w="100%">
      <Text fontSize="xs" color="gray.400">
        {label}
      </Text>
      <Text fontSize="xs" fontWeight="bold">
        {value}
      </Text>
    </HStack>
  );
}

function SkillsPopover({ womData }) {
  const skills = womData?.skills ?? {};
  const skillNames = Object.keys(skills)
    .filter((s) => s !== 'overall')
    .sort();
  if (skillNames.length === 0) return null;

  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="xs" fontWeight="bold" color="gray.300" mb={1}>
        All Skills
      </Text>
      <SimpleGrid columns={2} spacing={1}>
        {skillNames.map((skill) => (
          <StatRow
            key={skill}
            label={skill.charAt(0).toUpperCase() + skill.slice(1)}
            value={skills[skill] ?? 1}
          />
        ))}
      </SimpleGrid>
      {womData.totalLevel > 0 && (
        <StatRow label="Total Level" value={(womData.totalLevel ?? 0).toLocaleString()} />
      )}
    </VStack>
  );
}

export default function PlayerCard({
  player,
  onClick,
  isPickable = false,
  isCurrentPick = false,
  isAuctionTarget = false,
}) {
  const revealed = player.rsn !== null && player.rsn !== undefined;
  const drafted = player.teamIndex !== null && player.teamIndex !== undefined;

  const tierColor = TIER_COLORS[player.tierBadge];

  const borderColor =
    isCurrentPick || isAuctionTarget ? 'purple.400' : drafted ? 'green.600' : 'gray.600';

  const womData = player.womData ?? {};
  // handle both old topBossKcs and new bossKcs field
  const bossKcs = womData.bossKcs ?? womData.topBossKcs ?? [];

  const card = (
    <Box
      border="2px solid"
      borderColor={borderColor}
      borderRadius="xl"
      overflow="hidden"
      cursor={isPickable && !drafted ? 'pointer' : 'default'}
      opacity={drafted && !isCurrentPick && !isAuctionTarget ? 0.5 : 1}
      onClick={isPickable && !drafted ? onClick : undefined}
      transition="all 0.15s"
      _hover={
        isPickable && !drafted ? { borderColor: 'purple.300', transform: 'translateY(-2px)' } : {}
      }
      w="100%"
      minW="140px"
      bg="gray.800"
    >
      {/* header */}
      <Box bg={isCurrentPick || isAuctionTarget ? 'purple.700' : 'gray.700'} px={2.5} py={1.5}>
        <HStack justify="space-between" align="flex-start" spacing={1}>
          <VStack spacing={0} align="flex-start" flex={1} minW={0}>
            <Text
              fontWeight="black"
              fontSize="sm"
              noOfLines={1}
              lineHeight={1.3}
              color={revealed ? 'white' : 'gray.100'}
            >
              {revealed ? player.rsn : player.alias}
            </Text>
            {revealed && (
              <Text fontSize="10px" color="gray.400" noOfLines={1}>
                {player.alias}
              </Text>
            )}
          </VStack>
          {tierColor && (
            <Badge
              bg={tierColor.bg}
              color={tierColor.color}
              fontSize="xs"
              fontWeight="black"
              px={1.5}
              borderRadius="sm"
              flexShrink={0}
            >
              {player.tierBadge}
            </Badge>
          )}
        </HStack>
      </Box>

      {womData.notFound ? (
        <Box px={2.5} py={2}>
          <Text fontSize="xs" color="orange.300">
            Not on WOM
          </Text>
        </Box>
      ) : (
        <Box
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
        >
          {/* key stats row */}
          <Box px={2.5} py={2} borderBottom="1px solid" borderColor="gray.700">
            <SimpleGrid columns={5} spacing={1}>
              <StatChip label="Cmbt" value={womData.combatLevel ?? '?'} />
              <StatChip label="Total" value={(womData.totalLevel ?? 0).toLocaleString()} />
              <StatChip label="Slay" value={womData.slayerLevel ?? '?'} />
              <StatChip label="EHP" value={Math.round(womData.ehp ?? 0)} />
              <StatChip label="EHB" value={Math.round(womData.ehb ?? 0)} />
            </SimpleGrid>
          </Box>

          {/* boss KCs */}
          {bossKcs.length > 0 && (
            <Box px={2.5} py={2} maxH="160px" overflowY="auto">
              <Text
                fontSize="10px"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={1}
              >
                Boss KCs
              </Text>
              <VStack spacing={0.5} align="stretch">
                {bossKcs.map((b) => (
                  <HStack key={b.boss} justify="space-between" spacing={1}>
                    <Text fontSize="10px" color="gray.400" noOfLines={1}>
                      {formatBossName(b.boss)}
                    </Text>
                    <Text fontSize="10px" fontWeight="bold" flexShrink={0}>
                      {b.kc.toLocaleString()}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {bossKcs.length === 0 && (
            <Box px={2.5} py={2}>
              <Text fontSize="10px" color="gray.600" fontStyle="italic">
                No boss KCs
              </Text>
            </Box>
          )}
        </Box>
      )}

      {drafted && (
        <Box px={2.5} pb={1.5}>
          <Badge colorScheme="green" fontSize="9px">
            Drafted
          </Badge>
        </Box>
      )}
    </Box>
  );

  // wrap in popover showing all skill levels on hover
  const hasSkills = Object.keys(womData.skills ?? {}).length > 0;
  if (hasSkills && !womData.notFound) {
    return (
      <Popover trigger="hover" placement="right" isLazy openDelay={300}>
        <PopoverTrigger>{card}</PopoverTrigger>
        <PopoverContent bg="gray.800" borderColor="gray.600" maxW="210px">
          <PopoverBody>
            <SkillsPopover womData={womData} />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }

  return card;
}
