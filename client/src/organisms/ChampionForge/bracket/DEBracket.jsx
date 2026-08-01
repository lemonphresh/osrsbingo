import { Box, HStack, VStack, Text, Divider } from '@chakra-ui/react';
import RoundColumn from './RoundColumn';
import MatchCard from './MatchCard';
import { getSELabel } from './SEBracket';

export default function DEBracket({
  bracket,
  teams,
  isAdmin,
  myTeamId,
  eventId,
  starting,
  onStartBattle,
  onSelectBattle,
  preview,
  nextUpMatchKey,
}) {
  const sharedProps = {
    teams,
    isAdmin,
    myTeamId,
    eventId,
    starting,
    onStartBattle,
    onSelectBattle,
    preview,
    nextUpMatchKey,
  };

  const lbRounds = bracket.losersBracket ?? [];
  const gf = bracket.grandFinal;

  const wbMaxMatches = Math.max(...bracket.rounds.map((r) => r.matches.length));
  const lbMaxMatches =
    lbRounds.length > 0 ? Math.max(...lbRounds.map((r) => r.matches.length)) : 1;

  return (
    <VStack align="stretch" spacing={6}>
      <Box>
        <HStack mb={3} spacing={2} align="center">
          <Text
            fontSize="xs"
            fontWeight="bold"
            color="yellow.400"
            textTransform="uppercase"
            letterSpacing={2}
          >
            Winners Bracket
          </Text>
          <Text fontSize="xs" color="gray.600">
            (lose here and you drop to Losers Bracket)
          </Text>
        </HStack>
        <Box overflowX="auto">
          <HStack align="flex-start" spacing={8} pb={2}>
            {bracket.rounds.map((round, roundIdx) => (
              <RoundColumn
                key={roundIdx}
                round={round}
                maxMatchesInSection={wbMaxMatches}
                roundLabel={round.label ?? getSELabel(roundIdx, bracket.rounds.length)}
                {...sharedProps}
              />
            ))}
          </HStack>
        </Box>
      </Box>

      <Divider borderColor="gray.700" />

      {lbRounds.length > 0 && (
        <Box>
          <HStack mb={3} spacing={2} align="center">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="orange.400"
              textTransform="uppercase"
              letterSpacing={2}
            >
              Losers Bracket
            </Text>
            <Text fontSize="xs" color="gray.600">
              (one more loss and you're eliminated)
            </Text>
          </HStack>
          <Box overflowX="auto">
            <HStack align="flex-start" spacing={8} pb={2}>
              {lbRounds.map((round, roundIdx) => (
                <RoundColumn
                  key={roundIdx}
                  round={round}
                  maxMatchesInSection={lbMaxMatches}
                  roundLabel={round.label ?? `LB Round ${roundIdx + 1}`}
                  {...sharedProps}
                />
              ))}
            </HStack>
          </Box>
        </Box>
      )}

      {gf && (
        <>
          <Divider borderColor="gray.700" />
          <Box alignSelf="flex-start">
            <Text
              fontSize="xs"
              fontWeight="bold"
              color="purple.300"
              textTransform="uppercase"
              letterSpacing={2}
              mb={3}
            >
              Grand Finale
            </Text>
            <MatchCard
              match={gf}
              {...sharedProps}
              isNextUp={sharedProps.nextUpMatchKey === `${gf.team1Id}-${gf.team2Id}`}
            />
          </Box>
        </>
      )}
    </VStack>
  );
}
