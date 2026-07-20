import { Box, HStack, VStack, Text, Badge, Button } from '@chakra-ui/react';

function MatchRow({ match, teamMap, onRewatch }) {
  const team1 = teamMap[match.team1Id];
  const team2 = match.team2Id ? teamMap[match.team2Id] : null;
  const winner = match.winnerId ? teamMap[match.winnerId] : null;

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={match.winnerId ? 'teal.700' : 'gray.700'}
      borderRadius="lg"
      p={3}
      transition="border-color 0.15s"
      _hover={{ borderColor: match.winnerId ? 'teal.500' : 'gray.500' }}
    >
      {match.isBye ? (
        <HStack spacing={3}>
          <Text color="teal.200" fontWeight="bold">
            {team1?.teamName ?? match.team1Id}
          </Text>
          <Badge colorScheme="gray" fontSize="xs">
            Bye
          </Badge>
        </HStack>
      ) : (
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <HStack spacing={3}>
            <Text
              color={match.winnerId === match.team1Id ? 'teal.200' : 'gray.400'}
              fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}
            >
              {team1?.teamName ?? match.team1Id}
            </Text>
            <Text color="gray.600" fontSize="xs">
              vs
            </Text>
            <Text
              color={match.winnerId === match.team2Id ? 'teal.200' : 'gray.400'}
              fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
            >
              {team2?.teamName ?? match.team2Id}
            </Text>
          </HStack>
          <HStack spacing={2}>
            {winner && (
              <Badge colorScheme="teal" fontSize="xs">
                Winner: {winner.teamName}
              </Badge>
            )}
            {!match.winnerId && (
              <Badge colorScheme="gray" fontSize="xs">
                Pending
              </Badge>
            )}
            {match.battleId && (
              <Button
                size="xs"
                colorScheme="purple"
                variant="ghost"
                onClick={() => onRewatch(match.battleId)}
              >
                ⏮ Rewatch
              </Button>
            )}
          </HStack>
        </HStack>
      )}
    </Box>
  );
}

function RoundSection({ label, matches, accent, teamMap, onRewatch }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        color={accent ?? 'gray.500'}
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
      >
        {label}
      </Text>
      <VStack align="stretch" spacing={2}>
        {matches.map((match, i) => (
          <MatchRow key={i} match={match} teamMap={teamMap} onRewatch={onRewatch} />
        ))}
      </VStack>
    </Box>
  );
}

function getSELabel(i, total) {
  if (total === 1 || i === total - 1) return 'Final';
  if (i === total - 2) return 'Semifinals';
  return `Round ${i + 1}`;
}

export default function CompletedBracket({ bracket, teams, onRewatch }) {
  if (!bracket?.rounds?.length) return null;

  const isDE = bracket.type === 'DOUBLE_ELIMINATION';
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.teamId, t]));

  return (
    <Box bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="xl" p={5}>
      <HStack mb={5} spacing={3} align="center">
        <Box w="3px" h="18px" bg="red.400" borderRadius="full" flexShrink={0} />
        <Text fontSize="lg">⚔️</Text>
        <Text fontWeight="bold" color="white" fontSize="md">
          Battle Results
        </Text>
        <Box flex={1} h="1px" bg="gray.700" />
      </HStack>

      {isDE ? (
        <VStack align="stretch" spacing={6}>
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="teal.300" mb={3}>
              Winners Bracket
            </Text>
            <VStack align="stretch" spacing={5}>
              {bracket.rounds.map((round, i) => (
                <RoundSection
                  key={i}
                  label={round.label ?? `Round ${i + 1}`}
                  matches={round.matches}
                  teamMap={teamMap}
                  onRewatch={onRewatch}
                />
              ))}
            </VStack>
          </Box>
          {bracket.losersBracket?.length > 0 && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="orange.300" mb={3}>
                Losers Bracket
              </Text>
              <VStack align="stretch" spacing={5}>
                {bracket.losersBracket.map((round, i) => (
                  <RoundSection
                    key={i}
                    label={round.label ?? `LB Round ${i + 1}`}
                    matches={round.matches}
                    accent="orange.700"
                    teamMap={teamMap}
                    onRewatch={onRewatch}
                  />
                ))}
              </VStack>
            </Box>
          )}
          {bracket.grandFinal && (
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="yellow.300" mb={3}>
                Grand Finale
              </Text>
              <Box
                bg="gray.700"
                border="2px solid"
                borderColor="yellow.600"
                borderRadius="lg"
                p={3}
              >
                <HStack justify="space-between" flexWrap="wrap" gap={2}>
                  <HStack spacing={3}>
                    <Text
                      color={
                        bracket.grandFinal.winnerId === bracket.grandFinal.team1Id
                          ? 'yellow.300'
                          : 'gray.400'
                      }
                      fontWeight={
                        bracket.grandFinal.winnerId === bracket.grandFinal.team1Id
                          ? 'bold'
                          : 'normal'
                      }
                    >
                      {teamMap[bracket.grandFinal.team1Id]?.teamName ?? bracket.grandFinal.team1Id}
                    </Text>
                    <Text color="gray.600" fontSize="xs">
                      vs
                    </Text>
                    <Text
                      color={
                        bracket.grandFinal.winnerId === bracket.grandFinal.team2Id
                          ? 'yellow.300'
                          : 'gray.400'
                      }
                      fontWeight={
                        bracket.grandFinal.winnerId === bracket.grandFinal.team2Id
                          ? 'bold'
                          : 'normal'
                      }
                    >
                      {teamMap[bracket.grandFinal.team2Id]?.teamName ?? bracket.grandFinal.team2Id}
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    {bracket.grandFinal.winnerId && (
                      <Badge colorScheme="yellow" fontSize="xs">
                        🏆 {teamMap[bracket.grandFinal.winnerId]?.teamName}
                      </Badge>
                    )}
                    {bracket.grandFinal.battleId && (
                      <Button
                        size="xs"
                        colorScheme="purple"
                        variant="ghost"
                        onClick={() => onRewatch(bracket.grandFinal.battleId)}
                      >
                        ⏮ Rewatch
                      </Button>
                    )}
                  </HStack>
                </HStack>
              </Box>
            </Box>
          )}
        </VStack>
      ) : (
        <VStack align="stretch" spacing={5}>
          {bracket.rounds.map((round, i) => (
            <RoundSection
              key={i}
              label={getSELabel(i, bracket.rounds.length)}
              matches={round.matches}
              teamMap={teamMap}
              onRewatch={onRewatch}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}
