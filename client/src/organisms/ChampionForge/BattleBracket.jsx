import { Box, Text } from '@chakra-ui/react';
import SEBracket from './bracket/SEBracket';
import DEBracket from './bracket/DEBracket';

export default function BattleBracket({
  event,
  isAdmin,
  myTeamId,
  starting,
  onStartBattle,
  onSelectBattle,
  preview,
}) {
  const bracket = event.bracket;
  const teams = event.teams ?? [];

  if (!bracket?.rounds?.length) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No bracket generated yet.</Text>
      </Box>
    );
  }

  const allMatches = [
    ...(bracket.rounds ?? []).flatMap((r) => r.matches),
    ...(bracket.losersBracket ?? []).flatMap((r) => r.matches),
    ...(bracket.grandFinal ? [bracket.grandFinal] : []),
  ];
  const nextUp = allMatches.find(
    (m) => !m.isBye && m.team1Id && m.team2Id && !m.battleId && !m.winnerId
  );
  const nextUpMatchKey = nextUp ? `${nextUp.team1Id}-${nextUp.team2Id}` : null;

  const sharedProps = {
    teams,
    isAdmin,
    myTeamId,
    eventId: event.eventId,
    starting,
    onStartBattle,
    onSelectBattle,
    preview,
    nextUpMatchKey,
  };

  if (bracket.type === 'DOUBLE_ELIMINATION') {
    return <DEBracket bracket={bracket} {...sharedProps} />;
  }

  return <SEBracket bracket={bracket} {...sharedProps} />;
}
