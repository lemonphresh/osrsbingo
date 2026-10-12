import { Box, Text, VStack, HStack, SimpleGrid } from '@chakra-ui/react';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

/** side panel showing each team's drafted players. */
export default function DraftBoard({ room, currentTeamIndex }) {
  const revealed = room.status === 'REVEALED';

  return (
    <SimpleGrid columns={{ base: 1, sm: Math.min(room.numberOfTeams, 3) }} spacing={3}>
      {room.teams.map((team) => {
        const drafted = room.players
          .filter((p) => p.teamIndex === team.index)
          .sort((a, b) => (a.pickOrder ?? 0) - (b.pickOrder ?? 0));

        const isActive = team.index === currentTeamIndex;

        return (
          <Box
            key={team.index}
            bg={HUD.bgSurface}
            border="1px solid"
            borderColor={isActive ? HUD.cyan : HUD.border}
            borderRadius="2px"
            p={3}
            boxShadow={isActive ? `0 0 14px ${HUD.cyanGlow}` : 'none'}
            transition="all 0.15s ease"
          >
            <HStack justify="space-between" mb={2} align="center">
              <Text
                fontFamily={HUD_FONT_DISPLAY}
                fontWeight="700"
                fontSize="sm"
                color={HUD.textPrimary}
                noOfLines={1}
              >
                {team.name}
              </Text>
              {isActive && <HudChip mode="active">Picking</HudChip>}
            </HStack>

            <VStack align="stretch" spacing={1}>
              {drafted.length === 0 ? (
                <Text fontSize="xs" color={HUD.textMuted} fontStyle="italic">
                  No picks yet
                </Text>
              ) : (
                drafted.map((p) => (
                  <HStack key={p.id} spacing={1.5}>
                    <Text
                      fontFamily={HUD_FONT_MONO}
                      fontSize="xs"
                      color={HUD.textMuted}
                      minW="20px"
                    >
                      #{(p.pickOrder ?? 0) + 1}
                    </Text>
                    <Text fontSize="xs" fontWeight="500" color={HUD.textPrimary} noOfLines={1}>
                      {revealed ? p.rsn : p.alias}
                    </Text>
                    {p.tierBadge && (
                      <Text
                        fontFamily={HUD_FONT_MONO}
                        fontSize="9px"
                        fontWeight="700"
                        color={HUD.cyan}
                        letterSpacing="0.1em"
                        flexShrink={0}
                      >
                        {p.tierBadge}
                      </Text>
                    )}
                  </HStack>
                ))
              )}
            </VStack>

            <Text
              fontFamily={HUD_FONT_MONO}
              fontSize="10px"
              color={HUD.textMuted}
              mt={2}
              textTransform="uppercase"
              letterSpacing="0.1em"
            >
              {drafted.length} player{drafted.length !== 1 ? 's' : ''}
            </Text>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
