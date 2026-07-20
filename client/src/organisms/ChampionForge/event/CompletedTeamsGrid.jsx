import { Box, HStack, VStack, Text, Badge, SimpleGrid } from '@chakra-ui/react';

export default function CompletedTeamsGrid({ teams, bracket }) {
  const winnerId =
    bracket?.grandFinal?.winnerId ?? bracket?.rounds?.slice(-1)[0]?.matches?.[0]?.winnerId;

  const runnerUpId = bracket?.grandFinal
    ? bracket.grandFinal.team1Id === winnerId
      ? bracket.grandFinal.team2Id
      : bracket.grandFinal.team1Id
    : bracket?.rounds?.slice(-1)[0]?.matches?.[0]
    ? bracket.rounds.slice(-1)[0].matches[0].team1Id === winnerId
      ? bracket.rounds.slice(-1)[0].matches[0].team2Id
      : bracket.rounds.slice(-1)[0].matches[0].team1Id
    : null;

  if (!teams?.length) return null;

  return (
    <Box>
      <Text
        fontWeight="semibold"
        fontSize="sm"
        color="gray.400"
        mb={3}
        textTransform="uppercase"
        letterSpacing="wide"
      >
        All Teams
      </Text>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={3}>
        {teams.map((team) => {
          const isWinner = team.teamId === winnerId;
          const isRunnerUp = team.teamId === runnerUpId;
          return (
            <Box
              key={team.teamId}
              bg="gray.800"
              border="1px solid"
              borderColor={isWinner ? 'yellow.500' : isRunnerUp ? 'gray.500' : 'gray.700'}
              borderRadius="lg"
              p={4}
            >
              <HStack mb={2} justify="space-between">
                <Text fontWeight="bold" color="white" fontSize="sm" noOfLines={1}>
                  {isWinner && '🏆 '}
                  {team.teamName}
                </Text>
                {isWinner && (
                  <Badge colorScheme="yellow" fontSize="xs">
                    Champion
                  </Badge>
                )}
                {isRunnerUp && (
                  <Badge colorScheme="gray" fontSize="xs">
                    Runner-up
                  </Badge>
                )}
              </HStack>
              <VStack align="flex-start" spacing={1}>
                <Text fontSize="xs" color="gray.500">
                  {team.members?.length ?? 0} members
                </Text>
                {(team.completedTaskIds?.length ?? 0) > 0 && (
                  <Text fontSize="xs" color="green.400">
                    ✓ {team.completedTaskIds.length} tasks completed
                  </Text>
                )}
                {(team.items?.length ?? 0) > 0 && (
                  <Text fontSize="xs" color="gray.400">
                    ⚔ {team.items.length} items
                  </Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
