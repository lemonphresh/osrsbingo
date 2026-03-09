import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Button, Center, Spinner,
} from '@chakra-ui/react';
import ConfirmModal from './ConfirmModal';
import BattleScreen from './BattleScreen';
import BattleBracket from './BattleBracket';
import PostBattleSummary from './PostBattleSummary';
import {
  GET_CLAN_WARS_EVENT,
  GET_CLAN_WARS_BATTLE,
  GET_CLAN_WARS_WAR_CHEST,
  START_CLAN_WARS_BATTLE,
  UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';

export default function BattlePhase({ event: initialEvent, isAdmin, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  // Poll for event updates so everyone auto-detects when a battle starts/ends
  const { data: eventData } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId: initialEvent.eventId },
    pollInterval: 5000,
    fetchPolicy: 'network-only',
  });
  const event = eventData?.getClanWarsEvent ?? initialEvent;

  // Find the currently active battle from the bracket:
  // a match has battleId set but no winnerId yet = IN_PROGRESS
  const activeBattleId = useMemo(() => {
    const bracket = event?.bracket;
    if (!bracket?.rounds) return null;
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (match.battleId && !match.winnerId) return match.battleId;
      }
    }
    return null;
  }, [event]);

  const { data: battleData, loading: battleLoading } = useQuery(GET_CLAN_WARS_BATTLE, {
    variables: { battleId: activeBattleId },
    skip: !activeBattleId,
    fetchPolicy: 'cache-and-network',
  });
  const activeBattle = battleData?.getClanWarsBattle;

  const myTeam = event.teams?.find((t) =>
    t.captainDiscordId === user?.discordUserId ||
    (isAdmin && t.captainDiscordId == null)
  );

  const { data: chestData } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: myTeam?.teamId },
    skip: !myTeam,
  });
  const myItems = chestData?.getClanWarsWarChest ?? [];

  const [startBattle] = useMutation(START_CLAN_WARS_BATTLE);
  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  const isEventDone = event.status === 'COMPLETED' || event.status === 'ARCHIVED';

  const allMatchesDone = useMemo(() => {
    const rounds = event.bracket?.rounds;
    if (!rounds?.length) return false;
    return rounds.every((r) => r.matches.every((m) => m.isBye || !!m.winnerId));
  }, [event]);

  const handleStartBattle = async (t1, t2) => {
    setStarting(true);
    try {
      await startBattle({ variables: { eventId: event.eventId, team1Id: t1, team2Id: t2 } });
      showToast('Battle started!', 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to start battle', 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6}>
      {/* Phase header */}
      <Box p={5} bg="red.900" borderRadius="lg">
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="red.200">
              ⚔️ Battle Phase — {event.eventName}
            </Text>
            <Text fontSize="sm" color="red.300">
              Champions battle for glory. Captains command, teammates cheer.
            </Text>
          </VStack>
          {isAdmin && (isEventDone || allMatchesDone) && !isEventDone && (
            <Button size="sm" colorScheme="purple" onClick={() => setCompleteOpen(true)}>
              ✅ Complete Event
            </Button>
          )}
        </HStack>
      </Box>

      {/* Main view */}
      {isEventDone ? (
        <PostBattleSummary event={event} />
      ) : activeBattleId ? (
        battleLoading && !activeBattle ? (
          <Center h="300px"><Spinner color="red.400" size="xl" /></Center>
        ) : activeBattle ? (
          <BattleScreen
            battle={activeBattle}
            myTeamId={myTeam?.teamId}
            allItems={myItems}
            turnTimerSeconds={event.eventConfig?.turnTimerSeconds ?? 60}
          />
        ) : (
          <Center h="200px">
            <Text color="gray.500">Battle not found.</Text>
          </Center>
        )
      ) : (
        /* Lobby — no active battle */
        <VStack align="stretch" spacing={5}>
          <Box
            textAlign="center"
            p={8}
            bg="gray.800"
            borderRadius="xl"
            border="1px solid"
            borderColor="gray.600"
          >
            <Text fontSize="4xl" mb={2}>⚔️</Text>
            <Text fontSize="xl" fontWeight="bold" color="red.300" mb={1}>
              Battle Starting Soon
            </Text>
            <Text fontSize="sm" color="gray.400">
              {isAdmin
                ? 'Start a match from the bracket below.'
                : 'Waiting for the admin to kick things off...'}
            </Text>
          </Box>

          <BattleBracket
            event={event}
            isAdmin={isAdmin}
            myTeamId={myTeam?.teamId}
            starting={starting}
            onStartBattle={handleStartBattle}
          />

          {isAdmin && allMatchesDone && (
            <Box textAlign="right">
              <Button colorScheme="purple" size="sm" onClick={() => setCompleteOpen(true)}>
                ✅ Complete Event
              </Button>
            </Box>
          )}
        </VStack>
      )}

      <ConfirmModal
        isOpen={completeOpen}
        onClose={() => setCompleteOpen(false)}
        onConfirm={() => {
          advancePhase({ variables: { eventId: event.eventId, status: 'COMPLETED' } });
          setCompleteOpen(false);
        }}
        title="Mark Event as Completed?"
        body="This will end the battle phase and finalize the event."
        confirmLabel="Complete Event"
        colorScheme="purple"
      />
    </VStack>
  );
}
