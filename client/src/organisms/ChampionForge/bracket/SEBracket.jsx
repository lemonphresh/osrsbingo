import { Box, HStack } from '@chakra-ui/react';
import RoundColumn from './RoundColumn';

export function getSELabel(roundIdx, totalRounds) {
  if (roundIdx === totalRounds - 1) return 'Final';
  if (roundIdx === totalRounds - 2 && totalRounds > 2) return 'Semifinal';
  return `Round ${roundIdx + 1}`;
}

export default function SEBracket({
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
  const maxMatches = Math.max(...bracket.rounds.map((r) => r.matches.length));
  return (
    <Box overflowX="auto">
      <HStack align="flex-start" spacing={preview ? 4 : 8} pb={4}>
        {bracket.rounds.map((round, roundIdx) => (
          <RoundColumn
            key={roundIdx}
            round={round}
            maxMatchesInSection={maxMatches}
            roundLabel={getSELabel(roundIdx, bracket.rounds.length)}
            teams={teams}
            isAdmin={isAdmin}
            myTeamId={myTeamId}
            eventId={eventId}
            starting={starting}
            onStartBattle={onStartBattle}
            onSelectBattle={onSelectBattle}
            preview={preview}
            nextUpMatchKey={nextUpMatchKey}
          />
        ))}
      </HStack>
    </Box>
  );
}
