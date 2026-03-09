import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Center, Spinner, Text, VStack, HStack, Button, Badge,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  GET_CLAN_WARS_EVENT,
  GET_CLAN_WARS_BATTLE,
  GET_CLAN_WARS_WAR_CHEST,
  START_CLAN_WARS_BATTLE,
  UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import BattleScreen from '../organisms/ChampionForge/BattleScreen';
import BattleBracket from '../organisms/ChampionForge/BattleBracket';
import PostBattleSummary from '../organisms/ChampionForge/PostBattleSummary';
import ConfirmModal from '../organisms/ChampionForge/ConfirmModal';

export default function ChampionForgeBattlePage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const [completeOpen, setCompleteOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    pollInterval: 5000,
    fetchPolicy: 'cache-and-network',
  });

  const event = data?.getClanWarsEvent;

  usePageTitle(event ? `${event.eventName} — Battle` : 'Champion Forge Battle');

  const isAdmin =
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id);

  const myTeam = event?.teams?.find((t) =>
    t.captainDiscordId === user?.discordUserId ||
    (isAdmin && t.captainDiscordId == null)
  );

  // Find the currently active battle from bracket
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

  const { data: chestData } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: myTeam?.teamId },
    skip: !myTeam,
  });
  const myItems = chestData?.getClanWarsWarChest ?? [];

  const [startBattle] = useMutation(START_CLAN_WARS_BATTLE);
  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  const isEventDone = event?.status === 'COMPLETED' || event?.status === 'ARCHIVED';

  const allMatchesDone = useMemo(() => {
    const rounds = event?.bracket?.rounds;
    if (!rounds?.length) return false;
    return rounds.every((r) => r.matches.every((m) => m.isBye || !!m.winnerId));
  }, [event]);

  const handleStartBattle = async (t1, t2) => {
    setStarting(true);
    try {
      await startBattle({ variables: { eventId, team1Id: t1, team2Id: t2 } });
      showToast('Battle started!', 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to start battle', 'error');
    } finally {
      setStarting(false);
    }
  };

  if (loading && !event) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="red.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Center h="60vh">
        <Text color="red.400">Event not found or failed to load.</Text>
      </Center>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={8}>
      {/* Header */}
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <VStack align="flex-start" spacing={1}>
          <HStack>
            <Text fontSize="2xl" fontWeight="bold" color="red.300">⚔️ {event.eventName}</Text>
            <Badge colorScheme="red" fontSize="sm">Battle</Badge>
          </HStack>
          <Text fontSize="sm" color="gray.400">
            {(event.teams ?? []).length} teams
          </Text>
        </VStack>
        <HStack spacing={2}>
          {isAdmin && (allMatchesDone || isEventDone) && !isEventDone && (
            <Button size="sm" colorScheme="purple" onClick={() => setCompleteOpen(true)}>
              ✅ Complete Event
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<ArrowBackIcon />}
            color="gray.300"
            borderColor="gray.600"
            onClick={() => navigate(`/champion-forge/${eventId}`)}
          >
            Event Overview
          </Button>
        </HStack>
      </HStack>

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
        /* Lobby */
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
          advancePhase({ variables: { eventId, status: 'COMPLETED' } });
          setCompleteOpen(false);
        }}
        title="Mark Event as Completed?"
        body="This will end the battle phase and finalize the event."
        confirmLabel="Complete Event"
        colorScheme="purple"
      />
    </Box>
  );
}
