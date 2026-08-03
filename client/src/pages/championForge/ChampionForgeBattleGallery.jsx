import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Spinner,
  Center,
  Badge,
  Divider,
  Collapse,
} from '@chakra-ui/react';
import { GET_ALL_CLAN_WARS_EVENTS, GET_CF_BATTLES_BY_EVENT } from '../../graphql/cfOperations';
import { useAuth } from '../../providers/AuthProvider';
import { isChampionForgeEnabled } from '../../config/featureFlags';
import { ChampionForgeLanding } from '../../organisms/ChampionForge/ChampionForgeInfoModal';
import BattleReplayModal from '../../organisms/ChampionForge/BattleReplayModal';
import GemTitle from '../../atoms/GemTitle';
import usePageTitle from '../../hooks/usePageTitle';
import theme from '../../theme';

function BattleRow({ battle, teamMap, battleIds, onWatch }) {
  const team1Name = teamMap[battle.team1Id] ?? 'Team 1';
  const team2Name = teamMap[battle.team2Id] ?? 'Team 2';
  const winnerName = battle.winnerId ? (teamMap[battle.winnerId] ?? 'Unknown') : null;
  const loserName = battle.winnerId
    ? battle.winnerId === battle.team1Id
      ? team2Name
      : team1Name
    : null;

  const champion1Name = battle.championSnapshots?.champion1?.name ?? team1Name;
  const champion2Name = battle.championSnapshots?.champion2?.name ?? team2Name;

  const date = battle.endedAt
    ? new Date(battle.endedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <HStack
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="md"
      px={4}
      py={3}
      justify="space-between"
      align="center"
      spacing={4}
    >
      <VStack align="flex-start" spacing={0} flex={1} minW={0}>
        <HStack spacing={2} flexWrap="wrap">
          <Text fontWeight="semibold" fontSize="sm" color="white" noOfLines={1}>
            {champion1Name}
          </Text>
          <Text fontSize="xs" color="gray.500">vs</Text>
          <Text fontWeight="semibold" fontSize="sm" color="white" noOfLines={1}>
            {champion2Name}
          </Text>
        </HStack>
        {winnerName && (
          <HStack spacing={1} mt={0.5}>
            <Text fontSize="xs" color="yellow.400">⚔️</Text>
            <Text fontSize="xs" color="yellow.400" fontWeight="medium">
              {winnerName} defeated {loserName}
            </Text>
          </HStack>
        )}
        {date && (
          <Text fontSize="xs" color="gray.600" mt={0.5}>{date}</Text>
        )}
      </VStack>

      <Button
        size="xs"
        colorScheme="yellow"
        variant="outline"
        flexShrink={0}
        onClick={() => onWatch(battle.battleId)}
      >
        ▶ Watch
      </Button>
    </HStack>
  );
}

function EventBattleSection({ event }) {
  const [isOpen, setIsOpen] = useState(false);
  const [watchBattleId, setWatchBattleId] = useState(null);

  const { data, loading } = useQuery(GET_CF_BATTLES_BY_EVENT, {
    variables: { eventId: event.eventId },
    skip: !isOpen,
  });

  const battles = data?.getCFBattlesByEvent ?? [];
  const teamMap = Object.fromEntries((event.teams ?? []).map((t) => [t.teamId, t.teamName]));
  const battleIds = battles.map((b) => b.battleId);

  return (
    <Box
      bg="gray.900"
      border="1px solid"
      borderColor={isOpen ? 'yellow.700' : 'gray.700'}
      borderLeftWidth="3px"
      borderLeftColor="yellow.600"
      borderRadius="lg"
      overflow="hidden"
      transition="border-color 0.15s"
    >
      <HStack
        px={5}
        py={4}
        justify="space-between"
        cursor="pointer"
        _hover={{ bg: 'gray.800' }}
        transition="background 0.1s"
        onClick={() => setIsOpen((o) => !o)}
      >
        <VStack align="flex-start" spacing={0}>
          <Text fontWeight="bold" fontSize="md" color="white">
            {event.eventName}
          </Text>
          <HStack fontSize="xs" color="gray.500" spacing={3} mt={0.5}>
            <Text>{event.teams?.length ?? 0} teams</Text>
            {event.gatheringStart && (
              <Text>
                {new Date(event.gatheringStart).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            )}
          </HStack>
        </VStack>

        <HStack spacing={3}>
          <Badge colorScheme="purple" fontSize="xs">Completed</Badge>
          <Text fontSize="xs" color="gray.500">{isOpen ? '▲' : '▼'}</Text>
        </HStack>
      </HStack>

      <Collapse in={isOpen} animateOpacity>
        <Box px={5} pb={5}>
          <Divider borderColor="gray.700" mb={4} />
          {loading ? (
            <Center py={6}>
              <Spinner size="md" color="yellow.500" />
            </Center>
          ) : battles.length === 0 ? (
            <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
              No completed battles found for this event.
            </Text>
          ) : (
            <>
              <HStack justify="space-between" mb={3}>
                <Text fontSize="xs" color="gray.500">
                  {battles.length} {battles.length === 1 ? 'battle' : 'battles'}
                </Text>
                <Button
                  size="xs"
                  colorScheme="yellow"
                  variant="solid"
                  onClick={() => setWatchBattleId(battleIds[0])}
                >
                  ▶ Watch All
                </Button>
              </HStack>
              <VStack spacing={2} align="stretch">
                {battles.map((battle) => (
                  <BattleRow
                    key={battle.battleId}
                    battle={battle}
                    teamMap={teamMap}
                    battleIds={battleIds}
                    onWatch={setWatchBattleId}
                  />
                ))}
              </VStack>
            </>
          )}
        </Box>
      </Collapse>

      {watchBattleId && (
        <BattleReplayModal
          isOpen={!!watchBattleId}
          onClose={() => setWatchBattleId(null)}
          battleId={watchBattleId}
          battleIds={battleIds}
        />
      )}
    </Box>
  );
}

function ChampionForgeBattleGalleryContent() {
  usePageTitle('Battle Gallery — Champion Forge');

  const { data, loading, error } = useQuery(GET_ALL_CLAN_WARS_EVENTS);
  const completedEvents = (data?.getAllCFEvents ?? []).filter((e) => e.status === 'COMPLETED');

  if (loading) {
    return (
      <Center flex="1">
        <Spinner size="xl" color="yellow.500" thickness="4px" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex="1">
        <Text color="red.400">Failed to load events. Please refresh.</Text>
      </Center>
    );
  }

  return (
    <Box maxW="900px" mx="auto" px={[4, 6, 8]} py={[16, 20, 24]} flex="1">
      <VStack align="flex-start" spacing={1} mb={6}>
        <GemTitle gemColor="yellow">Battle Gallery</GemTitle>
        <Text fontSize="sm" color="gray.400">
          Watch replays from past Champion Forge tournaments.
        </Text>
      </VStack>

      <Divider mb={6} borderColor="gray.700" />

      <Box
        as={Link}
        to="/champion-forge"
        bg="gray.800"
        border="1px solid"
        borderColor="yellow.800"
        borderRadius="lg"
        px={5}
        py={4}
        mb={8}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        _hover={{ borderColor: 'yellow.500', bg: 'gray.750' }}
        transition="all 0.15s"
      >
        <Box>
          <Text fontWeight="semibold" color="yellow.200" fontSize="sm">
            Want to run your own tournament?
          </Text>
          <Text fontSize="xs" color="gray.400" mt={0.5}>
            Create a Champion Forge event for your clan or group of friends.
          </Text>
        </Box>
        <Text fontSize="sm" color="yellow.400" flexShrink={0} ml={4}>
          Get started →
        </Text>
      </Box>

      {completedEvents.length === 0 ? (
        <Center py={16}>
          <Box
            textAlign="center"
            maxW="420px"
            p={[8, 12]}
            bg={theme.colors.teal[900]}
            borderRadius="lg"
            border="1px solid"
            borderColor={theme.colors.teal[700]}
          >
            <Text fontSize="4xl" mb={4}>⚔️</Text>
            <Text fontSize="xl" fontWeight="bold" color="white" mb={2}>
              No battles yet
            </Text>
            <Text fontSize="sm" color="gray.400" lineHeight="1.7">
              Completed Champion Forge events will appear here once battles have been fought.
            </Text>
          </Box>
        </Center>
      ) : (
        <VStack spacing={3} align="stretch">
          {completedEvents.map((event) => (
            <EventBattleSection key={event.eventId} event={event} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

export default function ChampionForgeBattleGallery() {
  const { user } = useAuth();

  if (!isChampionForgeEnabled(user)) {
    return <ChampionForgeLanding />;
  }

  return <ChampionForgeBattleGalleryContent />;
}
