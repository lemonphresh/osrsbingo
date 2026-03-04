import { Box, Text, VStack, HStack, Badge, SimpleGrid, useColorMode } from '@chakra-ui/react';

/** Side panel showing each team's drafted players. */
export default function DraftBoard({ room, currentTeamIndex }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
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
            bg={isDark ? '#2D3748' : 'white'}
            border="2px solid"
            borderColor={isActive ? 'purple.400' : isDark ? 'gray.600' : 'gray.200'}
            borderRadius="lg"
            p={3}
          >
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold" fontSize="sm" noOfLines={1}>{team.name}</Text>
              {isActive && (
                <Badge colorScheme="purple" fontSize="9px">Picking</Badge>
              )}
            </HStack>

            <VStack align="stretch" spacing={1}>
              {drafted.length === 0 ? (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">No picks yet</Text>
              ) : (
                drafted.map((p) => (
                  <HStack key={p.id} spacing={1}>
                    <Text fontSize="xs" color="gray.400" minW="18px">#{(p.pickOrder ?? 0) + 1}</Text>
                    <Text fontSize="xs" fontWeight="medium" noOfLines={1}>
                      {revealed ? p.rsn : p.alias}
                    </Text>
                    {p.tierBadge && (
                      <Badge fontSize="9px" colorScheme="purple" flexShrink={0}>
                        {p.tierBadge}
                      </Badge>
                    )}
                  </HStack>
                ))
              )}
            </VStack>

            <Text fontSize="xs" color="gray.500" mt={2}>
              {drafted.length} player{drafted.length !== 1 ? 's' : ''}
            </Text>
          </Box>
        );
      })}
    </SimpleGrid>
  );
}
