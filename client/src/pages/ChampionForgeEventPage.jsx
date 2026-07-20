import React, { useState } from 'react';
import { useParams, Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  Button,
  SimpleGrid,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import { FaShieldAlt } from 'react-icons/fa';
import BattleReplayModal from '../organisms/ChampionForge/BattleReplayModal';
import { ChampionForgeInfoModal } from '../organisms/ChampionForge/ChampionForgeInfoModal';
import {
  GET_CLAN_WARS_EVENT,
  CLAN_WARS_EVENT_UPDATED,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { isChampionForgeEnabled } from '../config/featureFlags';
import usePageTitle from '../hooks/usePageTitle';
import BattleBracket from '../organisms/ChampionForge/BattleBracket';
import ClanWarsDraftPanel from '../organisms/ChampionForge/ClanWarsDraftPanel';
import EventPasswordBadge from '../organisms/ChampionForge/event/EventPasswordBadge';
import PhaseBanner from '../organisms/ChampionForge/event/PhaseBanner';
import WinnerBanner from '../organisms/ChampionForge/event/WinnerBanner';
import CompletedBracket from '../organisms/ChampionForge/event/CompletedBracket';
import CompletedTeamsGrid from '../organisms/ChampionForge/event/CompletedTeamsGrid';
import TeamCard from '../organisms/ChampionForge/event/TeamCard';

const STATUS_META = {
  DRAFT: { label: 'Draft', color: 'gray', description: 'Event is being set up.' },
  GATHERING: {
    label: 'Gathering',
    color: 'green',
    description: 'Players are completing tasks to fill their war chest.',
  },
  OUTFITTING: {
    label: 'Outfitting',
    color: 'blue',
    description: 'Teams are drafting their loadouts.',
  },
  BATTLE: { label: 'Battle', color: 'red', description: 'Champions are fighting!' },
  COMPLETED: { label: 'Completed', color: 'purple', description: 'The event has ended.' },
};

function getBracketBattleIds(bracket) {
  if (!bracket) return [];
  const ids = [];
  for (const round of bracket.rounds ?? []) {
    for (const match of round.matches) {
      if (match.battleId) ids.push(match.battleId);
    }
  }
  for (const round of bracket.losersBracket ?? []) {
    for (const match of round.matches) {
      if (match.battleId) ids.push(match.battleId);
    }
  }
  if (bracket.grandFinal?.battleId) ids.push(bracket.grandFinal.battleId);
  return ids;
}

export default function ChampionForgeEventPage() {
  const { eventId } = useParams();
  const { user } = useAuth();

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(CLAN_WARS_EVENT_UPDATED, {
    variables: { eventId },
    onData: () => refetch(),
  });

  const event = data?.getClanWarsEvent;

  usePageTitle(event ? `${event.eventName} — Champion Forge` : 'Champion Forge');

  const isAdmin = !!(
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id)
  );

  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();
  const [replayBattleId, setReplayBattleId] = useState(null);

  const currentUserDiscordId = user?.discordUserId ?? null;

  if (!isChampionForgeEnabled(user)) return <Navigate to="/champion-forge" replace />;

  if (loading && !event) {
    return (
      <Center flex="1">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Center flex="1">
        <Text color="red.400">Event not found or failed to load.</Text>
      </Center>
    );
  }

  const meta = STATUS_META[event.status] ?? STATUS_META.DRAFT;

  const backNav = (
    <Button
      as={RouterLink}
      to="/champion-forge"
      size="sm"
      variant="ghost"
      color="gray.400"
      leftIcon={<ArrowBackIcon />}
      alignSelf="flex-start"
      _hover={{ color: 'white' }}
    >
      All Events
    </Button>
  );

  const eventHeader = (
    <Box
      bg="gray.800"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.700"
      borderTopWidth="3px"
      borderTopColor={`${meta.color}.500`}
      overflow="hidden"
    >
      <Box px={6} pt={5} pb={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={4} align="flex-start">
          <VStack align="flex-start" spacing={1}>
            <Heading size="lg" color="white" lineHeight="shorter">
              {event.eventName}
            </Heading>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme={meta.color} fontSize="xs" px={2} py={0.5}>
                {meta.label}
              </Badge>
              <Text fontSize="sm" color="gray.400">
                {meta.description}
              </Text>
            </HStack>
            {event.clanId && (
              <Text fontSize="xs" color="gray.600" fontFamily="mono">
                {event.clanId}
              </Text>
            )}
            {event.eventPassword && <EventPasswordBadge password={event.eventPassword} />}
          </VStack>

          {event.eventConfig && (
            <HStack spacing={6} flexShrink={0}>
              {[
                { label: 'Gathering', value: `${event.eventConfig.gatheringHours}h` },
                { label: 'Outfitting', value: `${event.eventConfig.outfittingHours}h` },
                { label: 'Turn Timer', value: `${event.eventConfig.turnTimerSeconds}s` },
              ].map(({ label, value }) => (
                <Box key={label} textAlign="center">
                  <Text
                    color="gray.500"
                    fontSize="xs"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    mb={0.5}
                  >
                    {label}
                  </Text>
                  <Text color="white" fontWeight="bold" fontSize="md">
                    {value}
                  </Text>
                </Box>
              ))}
            </HStack>
          )}
        </HStack>
      </Box>
    </Box>
  );

  // ── Completed event layout ──
  if (event.status === 'COMPLETED') {
    const bracketBattleIds = getBracketBattleIds(event.bracket);
    return (
      <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
        <VStack align="stretch" spacing={6}>
          {backNav}
          <WinnerBanner event={event} />
          {bracketBattleIds.length > 0 && (
            <Box textAlign="center">
              <Button
                colorScheme="blue"
                size="md"
                onClick={() => setReplayBattleId(bracketBattleIds[0])}
              >
                📺 Rewatch All Battles in Order
              </Button>
            </Box>
          )}
          {event.bracket && (
            <CompletedBracket
              bracket={event.bracket}
              teams={event.teams}
              onRewatch={(id) => setReplayBattleId(id)}
            />
          )}
          <CompletedTeamsGrid teams={event.teams} bracket={event.bracket} />
        </VStack>
        <BattleReplayModal
          isOpen={!!replayBattleId}
          onClose={() => setReplayBattleId(null)}
          battleId={replayBattleId}
          battleIds={bracketBattleIds}
        />
      </Box>
    );
  }

  // ── Draft phase layout ──
  if (event.status === 'DRAFT') {
    if (isAdmin) {
      return (
        <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
          <VStack align="stretch" spacing={6}>
            {backNav}
            {eventHeader}
            <ClanWarsDraftPanel event={event} refetch={refetch} />
          </VStack>
        </Box>
      );
    }

    return (
      <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" overflow="hidden" w="100%">
        <VStack align="stretch" spacing={6}>
          {backNav}
          {eventHeader}
          <Box
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="xl"
            p={10}
            textAlign="center"
          >
            <Text fontSize="2xl" mb={3}>
              ⚙️
            </Text>
            <Text fontWeight="bold" color="gray.300" fontSize="lg" mb={1}>
              Event in Preparation
            </Text>
            <Text fontSize="sm" color="gray.500">
              The admins are setting up this event. Check back soon!
            </Text>
          </Box>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={16} flex="1" overflow="hidden" w="100%">
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between" align="center">
          {backNav}
          {isAdmin && (
            <Button
              as={RouterLink}
              to={`/champion-forge/${eventId}/refs-only`}
              size="xs"
              variant="outline"
              colorScheme="red"
              borderColor="red.700"
              color="red.400"
              _hover={{ borderColor: 'red.500', color: 'red.300' }}
            >
              🛡️ Refs Panel
            </Button>
          )}
        </HStack>
        {eventHeader}

        <PhaseBanner event={event} eventId={eventId} />

        {event.status === 'OUTFITTING' && isAdmin && (
          <Box
            p={3}
            bg="yellow.900"
            border="1px solid"
            borderColor="yellow.700"
            borderLeftWidth="3px"
            borderLeftColor="yellow.400"
            borderRadius="md"
          >
            <Text fontSize="xs" fontWeight="semibold" color="yellow.300" mb={1}>
              Battle start is manual
            </Text>
            <Text fontSize="xs" color="yellow.200">
              The battle phase won't start automatically when outfitting ends. Once all captains
              have locked their loadouts, come back here and hit Start Battle Phase from the Admin
              panel.
            </Text>
          </Box>
        )}

        <Box
          p={3}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="md"
        >
          <Text fontSize="xs" fontWeight="semibold" color="gray.400" mb={2}>
            Helpful Resources
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            <Button size="xs" colorScheme="yellow" variant="outline" onClick={onInfoOpen}>
              ℹ️ How it Works
            </Button>
            <Button
              as={RouterLink}
              to="/champion-forge/guide"
              size="xs"
              colorScheme="teal"
              variant="outline"
            >
              📖 Event Guide
            </Button>
          </HStack>
        </Box>

        <Box>
          <HStack mb={4} spacing={3} align="center">
            <Box w="3px" h="18px" bg="teal.400" borderRadius="full" flexShrink={0} />
            <Icon as={FaShieldAlt} color="teal.300" boxSize={4} />
            <Text fontWeight="bold" color="white" fontSize="md">
              Teams
            </Text>
            <Badge colorScheme="gray" fontSize="xs">
              {event.teams?.length ?? 0}
            </Badge>
            <Box flex={1} h="1px" bg="gray.700" />
            {!currentUserDiscordId && (
              <Text fontSize="xs" color="gray.600" flexShrink={0}>
                Link Discord to enter your barracks.
              </Text>
            )}
          </HStack>

          {event.teams?.length ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {event.teams.map((team) => (
                <TeamCard
                  key={team.teamId}
                  team={team}
                  eventId={eventId}
                  currentUserDiscordId={currentUserDiscordId}
                  isAdmin={isAdmin}
                  phase={event.status}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box
              bg="gray.800"
              borderRadius="lg"
              p={10}
              textAlign="center"
              border="1px dashed"
              borderColor="gray.600"
            >
              <Text fontSize="2xl" mb={2}>
                🛡️
              </Text>
              <Text fontWeight="semibold" color="gray.400" mb={1}>
                No teams yet
              </Text>
              <Text fontSize="sm" color="gray.600">
                Teams will appear here once they've been added to this event.
              </Text>
            </Box>
          )}
        </Box>

        {event.status === 'OUTFITTING' &&
          (event.bracket ? (
            <BattleBracket event={event} preview />
          ) : (
            <Box
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              borderRadius="xl"
              p={10}
              textAlign="center"
            >
              <Text fontSize="2xl" mb={3}>
                ⚔️
              </Text>
              <Text fontWeight="bold" color="gray.300" fontSize="lg" mb={1}>
                Outfitting Phase
              </Text>
              <Text fontSize="sm" color="gray.500">
                Captains are selecting their champions' loadouts. Visit your team's barracks to kit
                out your champion.
              </Text>
            </Box>
          ))}
      </VStack>
      <ChampionForgeInfoModal isOpen={isInfoOpen} onClose={onInfoClose} />
    </Box>
  );
}
