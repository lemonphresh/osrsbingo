import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, Center, Spinner, Text, VStack, HStack, Button, Badge,
  Tabs, TabList, Tab, TabPanels, TabPanel, Select, Divider,
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

  const [activeBattleId, setActiveBattleId] = useState(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [starting, setStarting] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_CLAN_WARS_EVENT, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  const { data: battleData, loading: battleLoading } = useQuery(GET_CLAN_WARS_BATTLE, {
    variables: { battleId: activeBattleId },
    skip: !activeBattleId,
    fetchPolicy: 'cache-and-network',
  });

  const event = data?.getClanWarsEvent;
  const battle = battleData?.getClanWarsBattle;

  usePageTitle(event ? `${event.eventName} — Battle` : 'Champion Forge Battle');

  const isAdmin = user?.admin ||
    event?.adminIds?.includes(String(user?.id)) ||
    event?.creatorId === String(user?.id);

  const myTeam = event?.teams?.find((t) =>
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

  const teams = event?.teams ?? [];
  const lockedTeams = teams.filter((t) => t.loadoutLocked);
  const isCompleted = event?.status === 'COMPLETED' || event?.status === 'ARCHIVED';

  const handleStartBattle = async () => {
    if (!team1Id || !team2Id || team1Id === team2Id) {
      showToast('Select two different teams', 'warning');
      return;
    }
    setStarting(true);
    try {
      const { data: res } = await startBattle({ variables: { eventId, team1Id, team2Id } });
      setActiveBattleId(res.startClanWarsBattle.battleId);
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
            {teams.length} teams · {lockedTeams.length} locked loadouts
          </Text>
        </VStack>
        <HStack spacing={2}>
          {isAdmin && !isCompleted && (
            <Button size="sm" colorScheme="purple" onClick={() => setCompleteOpen(true)}>
              ✅ Complete Event
            </Button>
          )}
          <Button size="sm" variant="outline" leftIcon={<ArrowBackIcon />} color="gray.300"
            borderColor="gray.600" onClick={() => navigate(`/champion-forge/${eventId}`)}>
            Event Overview
          </Button>
        </HStack>
      </HStack>

      {/* Completed summary */}
      {isCompleted ? (
        <PostBattleSummary event={event} />
      ) : (
        <Tabs colorScheme="red" variant="soft-rounded">
          <TabList>
            <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>
              {activeBattleId ? 'Active Battle' : 'Watch Battle'}
            </Tab>
            <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>Bracket</Tab>
            {isAdmin && (
              <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>Start Match</Tab>
            )}
          </TabList>

          <TabPanels>
            {/* Active battle viewer */}
            <TabPanel px={0}>
              {!activeBattleId ? (
                <Center h="300px" flexDir="column" gap={4}>
                  <Text fontSize="3xl">⚔️</Text>
                  <Text color="gray.400" fontWeight="medium">No battle selected</Text>
                  <Text fontSize="sm" color="gray.500">
                    {isAdmin
                      ? 'Use the "Start Match" tab to begin a battle, or select one from the Bracket.'
                      : 'Select a match from the Bracket tab to watch.'}
                  </Text>
                </Center>
              ) : battleLoading && !battle ? (
                <Center h="300px"><Spinner color="red.400" size="xl" /></Center>
              ) : battle ? (
                <BattleScreen
                  battle={battle}
                  myTeamId={myTeam?.teamId}
                  allItems={myItems}
                  turnTimerSeconds={event.eventConfig?.turnTimerSeconds ?? 60}
                />
              ) : (
                <Center h="200px">
                  <Text color="gray.500">Battle not found.</Text>
                </Center>
              )}
            </TabPanel>

            {/* Bracket */}
            <TabPanel px={0}>
              <BattleBracket event={event} onSelectBattle={(id) => {
                setActiveBattleId(id);
              }} />
            </TabPanel>

            {/* Start match (admin only) */}
            {isAdmin && (
              <TabPanel px={0}>
                <VStack align="flex-start" spacing={4} maxW="420px">
                  <Text fontWeight="semibold" color="white">Start a New Match</Text>
                  <Text fontSize="sm" color="gray.400">Both teams must have locked loadouts.</Text>

                  <HStack w="full" spacing={3}>
                    <Box flex={1}>
                      <Text fontSize="xs" color="gray.400" mb={1}>Team 1</Text>
                      <Select size="sm" value={team1Id} onChange={(e) => setTeam1Id(e.target.value)}
                        placeholder="Select team" bg="gray.700" borderColor="gray.600" color="white">
                        {lockedTeams.map((t) => (
                          <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                        ))}
                      </Select>
                    </Box>
                    <Text fontSize="sm" color="gray.600" mt={4}>vs</Text>
                    <Box flex={1}>
                      <Text fontSize="xs" color="gray.400" mb={1}>Team 2</Text>
                      <Select size="sm" value={team2Id} onChange={(e) => setTeam2Id(e.target.value)}
                        placeholder="Select team" bg="gray.700" borderColor="gray.600" color="white">
                        {lockedTeams.map((t) => (
                          <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                        ))}
                      </Select>
                    </Box>
                  </HStack>

                  <Button colorScheme="red" isLoading={starting} onClick={handleStartBattle}
                    isDisabled={!team1Id || !team2Id || team1Id === team2Id}>
                    ⚔️ Start Battle
                  </Button>

                  {lockedTeams.length < 2 && (
                    <Text fontSize="xs" color="orange.400">
                      Need at least 2 teams with locked loadouts to start a battle.
                    </Text>
                  )}
                </VStack>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
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
