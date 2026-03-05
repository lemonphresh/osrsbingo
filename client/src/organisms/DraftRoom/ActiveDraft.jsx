import { Box, VStack, HStack, Text, Badge, SimpleGrid } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { MAKE_DRAFT_PICK } from '../../graphql/draftOperations';
import PlayerCard from './PlayerCard';
import DraftBoard from './DraftBoard';
import TimerBar from './TimerBar';
import { useToastContext } from '../../providers/ToastProvider';

function getCurrentTeamIndex(format, numberOfTeams, currentPickIndex) {
  if (format === 'LINEAR') return currentPickIndex % numberOfTeams;
  // SNAKE
  const round = Math.floor(currentPickIndex / numberOfTeams);
  const pos = currentPickIndex % numberOfTeams;
  return round % 2 === 0 ? pos : numberOfTeams - 1 - pos;
}

export default function ActiveDraft({ room, userRole, userId, captainToken }) {
  const { showToast } = useToastContext();

  const currentTeamIdx = getCurrentTeamIndex(
    room.draftFormat,
    room.numberOfTeams,
    room.currentPickIndex,
    room.picksPerTurn ?? 1,
    room.players.length
  );
  const currentTeam = room.teams.find((t) => t.index === currentTeamIdx);

  const isOrganizer = userRole === 'organizer';
  const isMyCaptainTurn =
    typeof userRole === 'string' &&
    userRole.startsWith('captain:') &&
    parseInt(userRole.split(':')[1], 10) === currentTeamIdx;
  const canPick = isOrganizer || isMyCaptainTurn;

  const undraftedPlayers = room.players.filter(
    (p) => p.teamIndex === null || p.teamIndex === undefined
  );

  const [makePick, { loading }] = useMutation(MAKE_DRAFT_PICK, {
    onError: (e) => showToast(`Pick failed: ${e.message}`, 'error'),
  });

  async function handlePick(playerId) {
    if (!canPick || loading) return;
    await makePick({
      variables: {
        roomId: room.roomId,
        playerId: String(playerId),
        captainToken: captainToken ?? undefined,
      },
    });
  }

  // build draft order preview (next 5 picks)
  function getUpcomingOrder() {
    const picks = [];
    let idx = room.currentPickIndex;
    const total = room.players.length;
    for (let i = 0; i < 5 && idx < total; i++) {
      const tIdx = getCurrentTeamIndex(
        room.draftFormat,
        room.numberOfTeams,
        idx,
        room.picksPerTurn ?? 1,
        total
      );
      picks.push({ pickNumber: idx + 1, team: room.teams.find((t) => t.index === tIdx) });
      idx++;
    }
    return picks;
  }

  return (
    <VStack spacing={5} align="stretch">
      {/* header: whose turn */}
      <Box bg="gray.700" border="2px solid" borderColor="purple.400" borderRadius="lg" p={4}>
        <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider">
              Pick #{room.currentPickIndex + 1}
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              {currentTeam?.name ?? '—'} is picking
            </Text>
          </VStack>
          <HStack spacing={2}>
            <Badge colorScheme="purple">{room.draftFormat}</Badge>
            <Badge colorScheme="gray">{undraftedPlayers.length} remaining</Badge>
          </HStack>
        </HStack>
        <TimerBar startedAt={room.currentPickStartedAt} totalSeconds={room.pickTimeSeconds} />
        {canPick && (
          <Text fontSize="xs" color="purple.300" mt={2} fontWeight="semibold">
            {isOrganizer
              ? "It's your turn (organizer override)"
              : "It's your turn — click a player to pick!"}
          </Text>
        )}
      </Box>

      {/* upcoming picks */}
      <Box>
        <Text fontSize="xs" color="gray.400" mb={1} textTransform="uppercase" letterSpacing="wider">
          Coming up
        </Text>
        <HStack spacing={2} flexWrap="wrap">
          {getUpcomingOrder().map((item, i) => (
            <Badge key={item.pickNumber} colorScheme={i === 0 ? 'purple' : 'gray'} fontSize="10px">
              #{item.pickNumber} {item.team?.name}
            </Badge>
          ))}
        </HStack>
      </Box>

      {/* player pool */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Available Players ({undraftedPlayers.length})
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing={3}>
          {undraftedPlayers.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              isPickable={canPick}
              onClick={() => handlePick(player.id)}
            />
          ))}
        </SimpleGrid>
      </Box>

      {/* draft board */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Team Rosters
        </Text>
        <DraftBoard room={room} currentTeamIndex={currentTeamIdx} />
      </Box>
    </VStack>
  );
}
