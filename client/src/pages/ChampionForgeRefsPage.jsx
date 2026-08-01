import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useSubscription } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  SimpleGrid,
  useDisclosure,
  Image,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import {
  GET_CLAN_WARS_EVENT,
  CLAN_WARS_EVENT_UPDATED,
  GET_CLAN_WARS_WAR_CHEST,
  BATTLE_VIEWERS_UPDATED,
  GET_BATTLE_VIEWER_COUNT,
} from '../graphql/clanWarsOperations';
import { useAuth } from '../providers/AuthProvider';
import { isChampionForgeEnabled } from '../config/featureFlags';
import usePageTitle from '../hooks/usePageTitle';
import GatheringPhase from '../organisms/ChampionForge/GatheringPhase';
import WarChestPanel from '../organisms/ChampionForge/WarChestPanel';
import { ChampionForgeInfoModal } from '../organisms/ChampionForge/ChampionForgeInfoModal';
import ChampionSprite from '../organisms/ChampionForge/ChampionSprite';
import {
  BASE_SPRITES,
  LAYER_SPRITES,
  getIconSprite,
} from '../assets/champion-forge/sprites/spriteRegistry';
import { computeChampionStats, GEAR_SLOTS } from '../organisms/ChampionForge/OutfittingScreen';
import { BACK_SLOTS, LAYER_ORDER } from '../organisms/ChampionForge/championLayers';

function getUnfinishedMatches(bracket) {
  if (!bracket) return { live: [], pending: [] };
  const live = [], pending = [];
  const collect = (rounds) => {
    for (const round of rounds ?? []) {
      for (const match of round.matches ?? []) {
        if (match.isBye || !match.team1Id || !match.team2Id || match.winnerId) continue;
        (match.battleId ? live : pending).push(match);
      }
    }
  };
  collect(bracket.rounds);
  collect(bracket.losersBracket);
  const gf = bracket.grandFinal;
  if (gf && !gf.isBye && gf.team1Id && gf.team2Id && !gf.winnerId) {
    (gf.battleId ? live : pending).push(gf);
  }
  return { live, pending };
}

const STATUS_COLOR = {
  DRAFT: 'gray',
  GATHERING: 'green',
  OUTFITTING: 'blue',
  BATTLE: 'red',
  COMPLETED: 'purple',
};

const SLOT_EMOJI = {
  weapon: '⚔️',
  helm: '🪖',
  chest: '🛡️',
  legs: '🩲',
  gloves: '🧤',
  boots: '👢',
  shield: '🛡',
  ring: '💍',
  amulet: '📿',
  cape: '🧣',
  trinket: '🔮',
};

function OutfittingTeamCard({ team }) {
  const { data } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });
  const items = data?.getClanWarsWarChest ?? [];
  const loadout = team.officialLoadout ?? {};
  const baseSprite = loadout.baseSprite ?? 'baseSprite1';
  const captain = (team.members ?? []).find((m) => m.discordId === team.captainDiscordId);
  const captainName = captain?.username ?? team.captainDiscordId ?? 'Unknown';

  const resolveLayer = (slot) => {
    const id = loadout[slot];
    if (!id) return null;
    const item = items.find((i) => i.itemId === id);
    const key = item?.itemSnapshot?.spriteIcon ?? item?.itemSnapshot?.spriteKey;
    return key ? LAYER_SPRITES[key] : null;
  };

  const equippedItems = GEAR_SLOTS
    .map((slot) => {
      const id = loadout[slot];
      if (!id) return null;
      const item = items.find((i) => i.itemId === id);
      if (!item) return null;
      return { slot, item };
    })
    .filter(Boolean);

  const stats = computeChampionStats(loadout, items);

  const STAT_CELLS = [
    { label: 'ATK', value: stats.attack, color: 'red.400' },
    { label: 'DEF', value: stats.defense, color: 'blue.400' },
    { label: 'HP', value: stats.maxHp, color: 'pink.400' },
    { label: 'SPD', value: stats.speed >= 0 ? `+${stats.speed}` : stats.speed, color: 'green.400' },
    { label: 'CRIT', value: `${stats.crit}%`, color: 'yellow.400' },
  ];

  return (
    <Box
      p={4}
      bg="gray.800"
      border="1px solid"
      borderColor={team.loadoutLocked ? 'green.700' : 'gray.600'}
      borderRadius="lg"
    >
      <HStack justify="space-between" mb={3}>
        <VStack align="flex-start" spacing={0}>
          <Text fontWeight="semibold" color="white" fontSize="sm">{team.teamName}</Text>
          <Text fontSize="xs" color="gray.400">Captain: {captainName}</Text>
        </VStack>
        <Badge colorScheme={team.loadoutLocked ? 'green' : 'yellow'} fontSize="xs">
          {team.loadoutLocked ? '🔒 Locked' : 'In progress'}
        </Badge>
      </HStack>

      <Center mb={3}>
        <ChampionSprite
          size={110}
          src={BASE_SPRITES[baseSprite]}
          backLayers={BACK_SLOTS.map(resolveLayer).filter(Boolean)}
          layers={LAYER_ORDER.map(resolveLayer).filter(Boolean)}
          color={team.loadoutLocked ? '#48bb78' : '#888'}
        />
      </Center>

      {/* Stats row */}
      <SimpleGrid columns={5} spacing={1} mb={3}>
        {STAT_CELLS.map(({ label, value, color }) => (
          <Box key={label} textAlign="center" bg="gray.900" borderRadius="sm" py={1} px={1}>
            <Text fontSize="9px" color="gray.500" lineHeight="1">{label}</Text>
            <Text fontSize="xs" fontWeight="bold" color={color} lineHeight="1.4">{value}</Text>
          </Box>
        ))}
      </SimpleGrid>

      <Divider borderColor="gray.700" mb={2} />

      {/* Equipped items */}
      <VStack spacing={1} align="stretch">
        {equippedItems.length > 0 ? (
          equippedItems.map(({ slot, item }) => {
            const iconKey = item.itemSnapshot?.inventoryIcon ?? item.itemSnapshot?.spriteKey;
            const iconSrc = iconKey ? getIconSprite(iconKey) : null;
            return (
              <HStack key={slot} spacing={2}>
                <Text fontSize="xs" w="18px" flexShrink={0}>{SLOT_EMOJI[slot] ?? '•'}</Text>
                {iconSrc ? (
                  <Image
                    src={iconSrc}
                    boxSize="16px"
                    flexShrink={0}
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <Box boxSize="16px" flexShrink={0} />
                )}
                <Text fontSize="xs" color="gray.300" noOfLines={1}>
                  {item.itemSnapshot?.name ?? item.name ?? slot}
                </Text>
              </HStack>
            );
          })
        ) : (
          <Text fontSize="xs" color="gray.600" fontStyle="italic">No items equipped</Text>
        )}
      </VStack>
    </Box>
  );
}

export default function ChampionForgeRefsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const { isOpen: isInfoOpen, onOpen: onInfoOpen, onClose: onInfoClose } = useDisclosure();

  const { data: viewerData } = useQuery(GET_BATTLE_VIEWER_COUNT, {
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (viewerData?.getBattleViewerCount != null) setViewerCount(viewerData.getBattleViewerCount);
  }, [viewerData]);

  useSubscription(BATTLE_VIEWERS_UPDATED, {
    variables: { eventId },
    skip: !eventId,
    onData: ({ data }) => {
      if (data?.data?.battleViewersUpdated != null) {
        setViewerCount(data.data.battleViewersUpdated);
      }
    },
  });

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  useSubscription(CLAN_WARS_EVENT_UPDATED, {
    variables: { eventId },
    onData: () => refetch(),
  });

  const event = data?.getClanWarsEvent ?? null;

  const teamById = Object.fromEntries((event?.teams ?? []).map((t) => [t.teamId, t]));
  const { live: liveBattles, pending: pendingMatches } =
    event?.status === 'BATTLE' ? getUnfinishedMatches(event.bracket) : { live: [], pending: [] };

  const isAdmin = !!(
    user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id)
  );

  const baseTitle = event ? `Refs Panel — ${event.eventName}` : 'Refs Panel';
  usePageTitle(baseTitle);

  useEffect(() => {
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) ${baseTitle}`;
    }
    // usePageTitle sets the title; only override when there's a count
  }, [pendingCount, baseTitle]);

  if (!isChampionForgeEnabled(user)) return <Navigate to="/champion-forge" replace />;

  if (loading && !event) {
    return (
      <Center flex="1">
        <Spinner size="xl" color="red.500" thickness="4px" />
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

  if (!isAdmin) {
    return <Navigate to={`/champion-forge/${eventId}`} replace />;
  }

  return (
    <Box maxW="1200px" mx="auto" px={4} py={6} flex="1" w="100%">
      <VStack align="stretch" spacing={6}>
        {/* Nav */}
        <HStack justify="space-between">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/champion-forge/${eventId}`)}
            color="gray.400"
            _hover={{ color: 'white' }}
          >
            Back to event
          </Button>
          <Badge
            colorScheme={STATUS_COLOR[event.status] ?? 'gray'}
            fontSize="xs"
            px={2}
            py={1}
          >
            {event.status}
          </Badge>
        </HStack>

        {/* Header */}
        <Box
          p={4}
          bg="red.900"
          border="1px solid"
          borderColor="red.700"
          borderLeftWidth="3px"
          borderLeftColor="red.400"
          borderRadius="lg"
        >
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={0}>
              <Text fontWeight="bold" color="red.200" fontSize="lg">
                🛡️ Refs Panel
              </Text>
              <Text fontSize="sm" color="red.300">
                {event.eventName}
              </Text>
            </VStack>
            <Text fontSize="xs" color="red.600">
              Admin &amp; refs only — not visible to participants
            </Text>
          </HStack>
        </Box>

        {/* Helpful resources */}
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

        {/* Gathering: submissions + war chests, no admin tab */}
        {event.status === 'GATHERING' && (
          <GatheringPhase
            event={event}
            isAdmin={true}
            refetch={refetch}
            isRefsPanel={true}
            onPendingCountChange={setPendingCount}
          />
        )}

        {/* Outfitting: champion sprites + lock status */}
        {event.status === 'OUTFITTING' && (
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {(event.teams ?? []).map((team) => (
              <OutfittingTeamCard key={team.teamId} team={team} />
            ))}
          </SimpleGrid>
        )}

        {/* Battle: refs watch alongside participants */}
        {event.status === 'BATTLE' && (
          <>
            <Box
              p={3}
              bg="red.900"
              border="1px solid"
              borderColor="red.700"
              borderLeftWidth="3px"
              borderLeftColor="red.400"
              borderRadius="md"
            >
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="semibold" color="red.200">
                  ⚔️ Battle is live
                </Text>
                <Badge colorScheme="gray" fontSize="xs" variant="subtle">
                  👁 {viewerCount} watching
                </Badge>
              </HStack>
              <Text fontSize="xs" color="red.300" mb={3}>
                Watch the battles alongside the participants. The admin will advance each battle
                as results come in — your job is to be present and help resolve any disputes.
              </Text>

              {/* Live matches */}
              {liveBattles.length > 0 && (
                <VStack align="stretch" spacing={1} mb={3}>
                  {liveBattles.map((match) => (
                    <HStack key={match.battleId} spacing={2}>
                      <Badge colorScheme="red" fontSize="9px">LIVE</Badge>
                      <Text fontSize="xs" color="red.200">
                        {teamById[match.team1Id]?.teamName ?? match.team1Id} vs {teamById[match.team2Id]?.teamName ?? match.team2Id}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              )}

              {/* Pending match readiness */}
              {pendingMatches.length > 0 && (
                <Box mb={3}>
                  <Text fontSize="xs" fontWeight="semibold" color="red.400" mb={2}>
                    Captain readiness
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    {pendingMatches.map((match) => {
                      const t1 = teamById[match.team1Id];
                      const t2 = teamById[match.team2Id];
                      const readyCount = (match.team1Ready ? 1 : 0) + (match.team2Ready ? 1 : 0);
                      return (
                        <Box key={`${match.team1Id}-${match.team2Id}`}>
                          <Text fontSize="9px" color="red.500" mb={1}>{readyCount}/2 captains ready</Text>
                          <HStack spacing={2}>
                            <Badge colorScheme={match.team1Ready ? 'green' : 'gray'} fontSize="xs">
                              {match.team1Ready ? '✅' : '⏳'} {t1?.teamName ?? match.team1Id}
                            </Badge>
                            <Text fontSize="xs" color="red.700">vs</Text>
                            <Badge colorScheme={match.team2Ready ? 'green' : 'gray'} fontSize="xs">
                              {match.team2Ready ? '✅' : '⏳'} {t2?.teamName ?? match.team2Id}
                            </Badge>
                          </HStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              )}

              <Button
                as={RouterLink}
                to={`/champion-forge/${eventId}/battle`}
                size="xs"
                colorScheme="red"
                variant="outline"
              >
                ⚔️ Go to Battle Page
              </Button>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {(event.teams ?? []).map((team) => (
                <OutfittingTeamCard key={team.teamId} team={team} />
              ))}
            </SimpleGrid>
          </>
        )}

        {/* Completed / other phases: war chests */}
        {event.status !== 'GATHERING' && event.status !== 'OUTFITTING' && event.status !== 'BATTLE' && (
          <>
            <Box p={3} bg="gray.800" border="1px solid" borderColor="gray.700" borderRadius="md">
              <Text fontSize="sm" color="gray.400">
                Gathering has ended. Submissions were processed during that phase.
              </Text>
            </Box>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {(event.teams ?? []).map((team) => (
                <WarChestPanel key={team.teamId} team={team} hidden={false} />
              ))}
            </SimpleGrid>
          </>
        )}
      </VStack>
      <ChampionForgeInfoModal isOpen={isInfoOpen} onClose={onInfoClose} />
    </Box>
  );
}
