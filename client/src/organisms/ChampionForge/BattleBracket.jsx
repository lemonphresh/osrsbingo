import React from 'react';
import {
  Box, VStack, HStack, Text, Button, Badge, useColorMode,
} from '@chakra-ui/react';

function MatchCard({ match, teams, onSelectBattle }) {
  const { colorMode } = useColorMode();
  const bg = colorMode === 'dark' ? 'gray.700' : 'white';

  const team1 = teams.find((t) => t.teamId === match.team1Id);
  const team2 = teams.find((t) => t.teamId === match.team2Id);

  if (match.isBye) {
    return (
      <Box bg={bg} borderRadius="md" p={3} border="1px solid" borderColor="gray.600" minW="160px">
        <Text fontSize="xs" color="gray.500" mb={1}>Bye</Text>
        <Text fontSize="sm" fontWeight="medium">{team1?.teamName ?? 'TBD'}</Text>
        <Badge colorScheme="green" fontSize="xs" mt={1}>Advances</Badge>
      </Box>
    );
  }

  return (
    <Box bg={bg} borderRadius="md" p={3} border="1px solid" borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'} minW="180px">
      <VStack spacing={1} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}
            color={match.winnerId === match.team1Id ? 'yellow.400' : 'inherit'}>
            {team1?.teamName ?? 'TBD'}
          </Text>
          {match.winnerId === match.team1Id && <Text fontSize="xs">🏆</Text>}
        </HStack>
        <Text fontSize="10px" color="gray.500" textAlign="center">vs</Text>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
            color={match.winnerId === match.team2Id ? 'yellow.400' : 'inherit'}>
            {team2?.teamName ?? 'TBD'}
          </Text>
          {match.winnerId === match.team2Id && <Text fontSize="xs">🏆</Text>}
        </HStack>

        {match.battleId && (
          <Button size="xs" colorScheme="red" variant="outline" mt={1}
            onClick={() => onSelectBattle?.(match.battleId)}>
            Watch
          </Button>
        )}

        {!match.winnerId && !match.battleId && (
          <Badge colorScheme="yellow" fontSize="xs" mt={1}>Upcoming</Badge>
        )}
      </VStack>
    </Box>
  );
}

export default function BattleBracket({ event, onSelectBattle }) {
  const { colorMode } = useColorMode();
  const bracket = event.bracket;
  const teams = event.teams ?? [];

  if (!bracket?.rounds?.length) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500" mb={2}>No bracket generated yet.</Text>
        {event.adminIds?.length > 0 && (
          <Text fontSize="sm" color="gray.400">Admins can generate the bracket from the event panel.</Text>
        )}
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <HStack align="flex-start" spacing={8} pb={4}>
        {bracket.rounds.map((round, roundIdx) => (
          <VStack key={roundIdx} align="flex-start" spacing={4}>
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1}>
              {roundIdx === bracket.rounds.length - 1 ? 'Final' :
               roundIdx === bracket.rounds.length - 2 ? 'Semifinal' :
               `Round ${roundIdx + 1}`}
            </Text>
            <VStack spacing={6} align="stretch">
              {round.matches.map((match, matchIdx) => (
                <MatchCard
                  key={matchIdx}
                  match={match}
                  teams={teams}
                  onSelectBattle={onSelectBattle}
                />
              ))}
            </VStack>
          </VStack>
        ))}
      </HStack>
    </Box>
  );
}
