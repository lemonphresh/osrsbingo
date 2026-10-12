import { Box, VStack, HStack, Text, SimpleGrid } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { MAKE_DRAFT_PICK } from '../../graphql/draftOperations';
import PlayerCard from './PlayerCard';
import DraftBoard from './DraftBoard';
import TimerBar from './TimerBar';
import { useToastContext } from '../../providers/ToastProvider';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

function getCurrentTeamIndex(format, numberOfTeams, currentPickIndex) {
  if (format === 'LINEAR') return currentPickIndex % numberOfTeams;
  const round = Math.floor(currentPickIndex / numberOfTeams);
  const pos = currentPickIndex % numberOfTeams;
  return round % 2 === 0 ? pos : numberOfTeams - 1 - pos;
}

function SectionLabel({ children, ...rest }) {
  return (
    <Text
      fontFamily={HUD_FONT_MONO}
      fontSize="10px"
      color={HUD.textSecondary}
      textTransform="uppercase"
      letterSpacing="0.15em"
      {...rest}
    >
      {children}
    </Text>
  );
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
      <Box
        bg={HUD.bgSurface}
        border="1px solid"
        borderColor={HUD.cyan}
        borderRadius="2px"
        p={4}
        boxShadow={`0 0 18px ${HUD.cyanGlow}`}
      >
        <HStack justify="space-between" mb={3} flexWrap="wrap" gap={3} align="start">
          <VStack align="flex-start" spacing={1}>
            <SectionLabel color={HUD.cyan}>Pick #{room.currentPickIndex + 1}</SectionLabel>
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="xl"
              color={HUD.textPrimary}
              lineHeight="1.1"
            >
              {currentTeam?.name ?? '—'} is picking
            </Text>
          </VStack>
          <HStack spacing={1.5} flexWrap="wrap">
            <HudChip mode="active">{room.draftFormat}</HudChip>
            <HudChip>{undraftedPlayers.length} remaining</HudChip>
          </HStack>
        </HStack>
        <TimerBar startedAt={room.currentPickStartedAt} totalSeconds={room.pickTimeSeconds} />
        {canPick && (
          <Text
            fontFamily={HUD_FONT_MONO}
            fontSize="11px"
            color={HUD.cyan}
            mt={2.5}
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.12em"
          >
            {isOrganizer
              ? "▸ Your turn (organizer override)"
              : '▸ Your turn — click a player to pick'}
          </Text>
        )}
      </Box>

      {/* upcoming picks */}
      <Box>
        <SectionLabel mb={2}>Coming up</SectionLabel>
        <HStack spacing={1.5} flexWrap="wrap">
          {getUpcomingOrder().map((item, i) => (
            <HudChip key={item.pickNumber} mode={i === 0 ? 'active' : 'default'}>
              #{item.pickNumber} {item.team?.name}
            </HudChip>
          ))}
        </HStack>
      </Box>

      {/* player pool */}
      <Box>
        <HStack justify="space-between" mb={3} align="baseline">
          <SectionLabel>Available Players</SectionLabel>
          <Text
            fontFamily={HUD_FONT_MONO}
            fontSize="10px"
            color={HUD.cyan}
            letterSpacing="0.1em"
          >
            {undraftedPlayers.length}
          </Text>
        </HStack>
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
        <SectionLabel mb={3}>Team Rosters</SectionLabel>
        <DraftBoard room={room} currentTeamIndex={currentTeamIdx} />
      </Box>
    </VStack>
  );
}
