import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Button, Badge, SimpleGrid, Spinner, Center,
  Tabs, TabList, Tab, TabPanels, TabPanel, Select,
} from '@chakra-ui/react';
import ConfirmModal from './ConfirmModal';
import {
  GET_CLAN_WARS_BATTLE, GET_CLAN_WARS_WAR_CHEST,
  START_CLAN_WARS_BATTLE, UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import BattleScreen from './BattleScreen';
import BattleBracket from './BattleBracket';

export default function BattlePhase({ event, isAdmin, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();

  const [activeBattleId, setActiveBattleId] = useState(null);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [starting, setStarting] = useState(false);

  const [startBattle] = useMutation(START_CLAN_WARS_BATTLE);
  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  const { data: battleData, loading: battleLoading } = useQuery(GET_CLAN_WARS_BATTLE, {
    variables: { battleId: activeBattleId },
    skip: !activeBattleId,
    fetchPolicy: 'cache-and-network',
  });

  const battle = battleData?.getClanWarsBattle;

  const myTeam = event.teams?.find((t) =>
    t.captainDiscordId === user?.discordUserId ||
    (isAdmin && t.captainDiscordId == null)
  );

  const { data: chestData } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: myTeam?.teamId },
    skip: !myTeam,
  });
  const myItems = chestData?.getClanWarsWarChest ?? [];

  const teams = event.teams ?? [];
  const lockedTeams = teams.filter((t) => t.loadoutLocked);

  const handleStartBattle = async () => {
    if (!team1Id || !team2Id || team1Id === team2Id) {
      showToast('Select two different teams', 'warning');
      return;
    }
    setStarting(true);
    try {
      const { data } = await startBattle({ variables: { eventId: event.eventId, team1Id, team2Id } });
      setActiveBattleId(data.startClanWarsBattle.battleId);
      showToast('Battle started!', 'success');
    } catch (err) {
      showToast(err.message ?? 'Failed to start battle', 'error');
    } finally {
      setStarting(false);
    }
  };

  return (
    <VStack align="stretch" spacing={6}>
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
          {isAdmin && (
            <Button size="sm" colorScheme="purple" onClick={() => setCompleteOpen(true)}>
              ✅ Complete Event
            </Button>
          )}
        </HStack>
      </Box>

      <Tabs colorScheme="red" variant="soft-rounded">
        <TabList>
          <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>Active Battle</Tab>
          <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>Bracket</Tab>
          {isAdmin && <Tab fontSize="sm" color="gray.300" _selected={{ color: 'white' }}>Start Battle</Tab>}
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            {!activeBattleId ? (
              <Center h="200px" flexDir="column" gap={3}>
                <Text fontSize="2xl">⚔️</Text>
                <Text color="gray.500">No active battle selected.</Text>
                {isAdmin && <Text fontSize="sm" color="gray.400">Use the "Start Battle" tab to begin a match.</Text>}
              </Center>
            ) : battleLoading && !battle ? (
              <Center h="200px"><Spinner color="red.400" /></Center>
            ) : battle ? (
              <BattleScreen
                battle={battle}
                myTeamId={myTeam?.teamId}
                allItems={myItems}
                turnTimerSeconds={event.eventConfig?.turnTimerSeconds ?? 60}
              />
            ) : (
              <Text color="gray.500">Battle not found.</Text>
            )}
          </TabPanel>

          <TabPanel px={0}>
            <BattleBracket event={event} onSelectBattle={setActiveBattleId} />
          </TabPanel>

          {isAdmin && (
            <TabPanel px={0}>
              <VStack align="flex-start" spacing={4} maxW="400px">
                <Text fontWeight="semibold" color="white">Start a New Match</Text>
                <Text fontSize="sm" color="gray.400">Both teams must have locked loadouts.</Text>

                <HStack w="full">
                  <Box flex={1}>
                    <Text fontSize="xs" color="gray.400" mb={1}>Team 1</Text>
                    <Select size="sm" value={team1Id} onChange={(e) => setTeam1Id(e.target.value)}
                      placeholder="Select team" bg="gray.700" borderColor="gray.600" color="white">
                      {lockedTeams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
                    </Select>
                  </Box>
                  <Text fontSize="sm" color="gray.500" mt={4}>vs</Text>
                  <Box flex={1}>
                    <Text fontSize="xs" color="gray.400" mb={1}>Team 2</Text>
                    <Select size="sm" value={team2Id} onChange={(e) => setTeam2Id(e.target.value)}
                      placeholder="Select team" bg="gray.700" borderColor="gray.600" color="white">
                      {lockedTeams.map((t) => <option key={t.teamId} value={t.teamId}>{t.teamName}</option>)}
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
