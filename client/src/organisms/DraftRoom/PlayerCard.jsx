import { useMemo } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from '@chakra-ui/react';
import useContentRegistry from '../../hooks/useContentRegistry';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

// Tier badge colors — kept distinct from the HUD cyan accent so the tier
// is visually independent from the "active pick" indicator.
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
      <Text
        fontFamily={HUD_FONT_MONO}
        fontSize="9px"
        color={HUD.textMuted}
        textTransform="uppercase"
        letterSpacing="0.1em"
        lineHeight={1}
      >
        {label}
      </Text>
      <Text
        fontFamily={HUD_FONT_MONO}
        fontSize="xs"
        fontWeight="600"
        color={HUD.textPrimary}
        lineHeight={1.3}
      >
        {value}
      </Text>
    </VStack>
  );
}

function StatRow({ label, value }) {
  return (
    <HStack justify="space-between" w="100%">
      <Text fontSize="xs" color={HUD.textSecondary}>
        {label}
      </Text>
      <Text fontFamily={HUD_FONT_MONO} fontSize="xs" fontWeight="600" color={HUD.textPrimary}>
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
      <Text
        fontFamily={HUD_FONT_MONO}
        fontSize="10px"
        color={HUD.textSecondary}
        textTransform="uppercase"
        letterSpacing="0.15em"
        mb={1}
      >
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
  const { soloBosses, raids, minigames } = useContentRegistry();

  const bossDisplay = useMemo(() => {
    const map = {};
    for (const entry of [
      ...Object.values(soloBosses ?? {}),
      ...Object.values(raids ?? {}),
      ...Object.values(minigames ?? {}),
    ]) {
      const womKey = entry.id.replace(/([A-Z])/g, '_$1').toLowerCase();
      map[womKey] = entry.shortName ?? entry.name;
    }
    return map;
  }, [soloBosses, raids, minigames]);

  const formatBossName = (womKey) =>
    bossDisplay[womKey] ?? womKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const revealed = player.rsn !== null && player.rsn !== undefined;
  const drafted = player.teamIndex !== null && player.teamIndex !== undefined;

  const tierColor = TIER_COLORS[player.tierBadge];

  const highlighted = isCurrentPick || isAuctionTarget;
  const borderColor = highlighted ? HUD.cyan : drafted ? HUD.cyanDim : HUD.border;

  const womData = player.womData ?? {};
  const bossKcs = womData.bossKcs ?? womData.topBossKcs ?? [];

  const card = (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2px"
      overflow="hidden"
      cursor={isPickable && !drafted ? 'pointer' : 'default'}
      opacity={drafted && !isCurrentPick && !isAuctionTarget ? 0.5 : 1}
      onClick={isPickable && !drafted ? onClick : undefined}
      transition="all 0.15s ease"
      _hover={
        isPickable && !drafted
          ? { borderColor: HUD.cyan, transform: 'translateY(-1px)', boxShadow: `0 0 14px ${HUD.cyanGlow}` }
          : {}
      }
      boxShadow={highlighted ? `0 0 18px ${HUD.cyanGlow}` : 'none'}
      w="100%"
      minW="140px"
      bg={HUD.bgSurface}
    >
      {/* header */}
      <Box
        bg={highlighted ? HUD.cyanGlow : HUD.bgRecessed}
        px={2.5}
        py={1.5}
        borderBottom="1px solid"
        borderColor={HUD.border}
      >
        <HStack justify="space-between" align="flex-start" spacing={1}>
          <VStack spacing={0} align="flex-start" flex={1} minW={0}>
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="sm"
              noOfLines={1}
              lineHeight={1.3}
              color={HUD.textPrimary}
            >
              {revealed ? player.rsn : player.alias}
            </Text>
            {revealed && (
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="10px"
                color={HUD.textMuted}
                noOfLines={1}
                letterSpacing="0.05em"
              >
                {player.alias}
              </Text>
            )}
          </VStack>
          {tierColor && (
            <Box
              bg={tierColor.bg}
              color={tierColor.color}
              fontFamily={HUD_FONT_DISPLAY}
              fontSize="xs"
              fontWeight="700"
              px={1.5}
              py={0.5}
              borderRadius="2px"
              flexShrink={0}
              lineHeight={1.2}
            >
              {player.tierBadge}
            </Box>
          )}
        </HStack>
      </Box>

      {womData.notFound ? (
        <Box px={2.5} py={2}>
          <HudChip mode="warn">Not on WOM</HudChip>
        </Box>
      ) : (
        <Box
          css={{
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-track': { background: 'transparent', borderRadius: '10px' },
            '&::-webkit-scrollbar-thumb': {
              background: HUD.borderBright,
              borderRadius: '10px',
              '&:hover': { background: HUD.textMuted },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: `${HUD.borderBright} transparent`,
          }}
        >
          {/* key stats row */}
          <Box px={2.5} py={2} borderBottom="1px solid" borderColor={HUD.border}>
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
                fontFamily={HUD_FONT_MONO}
                fontSize="9px"
                color={HUD.textMuted}
                textTransform="uppercase"
                letterSpacing="0.15em"
                mb={1}
              >
                Boss KCs
              </Text>
              <VStack spacing={0.5} align="stretch">
                {bossKcs.map((b) => (
                  <HStack key={b.boss} justify="space-between" spacing={1}>
                    <Text fontSize="10px" color={HUD.textSecondary} noOfLines={1}>
                      {formatBossName(b.boss)}
                    </Text>
                    <Text
                      fontFamily={HUD_FONT_MONO}
                      fontSize="10px"
                      fontWeight="600"
                      color={HUD.textPrimary}
                      flexShrink={0}
                    >
                      {b.kc.toLocaleString()}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {bossKcs.length === 0 && (
            <Box px={2.5} py={2}>
              <Text fontSize="10px" color={HUD.textMuted} fontStyle="italic">
                No boss KCs
              </Text>
            </Box>
          )}
        </Box>
      )}

      {drafted && (
        <Box px={2.5} pb={1.5}>
          <HudChip mode="active">Drafted</HudChip>
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
        <PopoverContent
          bg={HUD.bgSurface}
          borderColor={HUD.border}
          borderRadius="2px"
          maxW="210px"
          boxShadow={`0 10px 40px rgba(0,0,0,0.6), 0 0 10px ${HUD.cyanGlow}`}
        >
          <PopoverBody>
            <SkillsPopover womData={womData} />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }

  return card;
}
