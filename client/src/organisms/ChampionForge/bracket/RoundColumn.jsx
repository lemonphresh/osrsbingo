import { Box, Text } from '@chakra-ui/react';
import MatchCard from './MatchCard';

const BASE_SLOT_H = { preview: 100, full: 220 };

export default function RoundColumn({
  round,
  roundLabel,
  maxMatchesInSection,
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
  const slotH = Math.round(
    ((preview ? BASE_SLOT_H.preview : BASE_SLOT_H.full) * maxMatchesInSection) /
      round.matches.length
  );
  return (
    <Box display="flex" flexDir="column" minW={preview ? '160px' : '240px'} flexShrink={0}>
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={4}>
        {roundLabel}
      </Text>
      <Box>
        {round.matches.map((match, matchIdx) => (
          <Box key={matchIdx} h={`${slotH}px`} display="flex" alignItems="center">
            <Box w="full">
              <MatchCard
                match={match}
                teams={teams}
                isAdmin={isAdmin}
                myTeamId={myTeamId}
                eventId={eventId}
                starting={starting}
                onStartBattle={onStartBattle}
                onSelectBattle={onSelectBattle}
                preview={preview}
                isNextUp={nextUpMatchKey === `${match.team1Id}-${match.team2Id}`}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
