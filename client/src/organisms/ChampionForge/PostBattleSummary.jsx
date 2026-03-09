import React from 'react';
import {
  Box, VStack, HStack, Text, Badge, Divider, SimpleGrid,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { GET_CLAN_WARS_BATTLE } from '../../graphql/clanWarsOperations';

function StatRow({ label, value }) {
  return (
    <HStack justify="space-between" py={1} borderBottom="1px solid" borderColor="gray.700">
      <Text fontSize="sm" color="gray.500">{label}</Text>
      <Text fontSize="sm" fontWeight="medium" color="white">{value}</Text>
    </HStack>
  );
}

function ChampionRecap({ team, isWinner, battleLog }) {
  const myActions = (battleLog ?? []).filter((e) => e.actorSide === team?.teamId);
  const totalDmg = myActions.reduce((sum, e) => sum + (e.damageDealt ?? 0), 0);
  const crits = myActions.filter((e) => e.isCrit).length;
  const specials = myActions.filter((e) => e.action === 'SPECIAL').length;
  const snap = team?.championSnapshot;

  return (
    <Box bg="gray.800" borderRadius="lg" p={5} border="2px solid"
      borderColor={isWinner ? 'yellow.400' : 'gray.600'}>
      <VStack spacing={3} align="stretch">
        <HStack justify="space-between">
          <Text fontWeight="bold" fontSize="lg" color="white">
            {isWinner && '🏆 '}{team?.teamName ?? 'Unknown Team'}
          </Text>
          {isWinner && <Badge colorScheme="yellow" fontSize="sm">Winner</Badge>}
        </HStack>

        <Box h="80px" bg="gray.700" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
          <Text fontSize="3xl">⚔️</Text>
        </Box>

        <Divider borderColor="gray.600" />

        {snap && (
          <VStack spacing={1} align="stretch">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={1}>
              Champion Stats
            </Text>
            <StatRow label="Attack"  value={snap.stats?.attack  ?? '—'} />
            <StatRow label="Defense" value={snap.stats?.defense ?? '—'} />
            <StatRow label="Speed"   value={snap.stats?.speed   ?? '—'} />
            <StatRow label="Crit %"  value={snap.stats?.crit != null ? `${snap.stats.crit}%` : '—'} />
          </VStack>
        )}

        <Divider borderColor="gray.600" />

        <VStack spacing={1} align="stretch">
          <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={1}>
            Battle Performance
          </Text>
          <StatRow label="Total Damage"  value={totalDmg} />
          <StatRow label="Critical Hits" value={crits} />
          <StatRow label="Specials Used" value={specials} />
          <StatRow label="Turns Taken"   value={myActions.length} />
        </VStack>
      </VStack>
    </Box>
  );
}

function BattleTimeline({ battleLog }) {
  if (!battleLog?.length) return null;
  return (
    <Box bg="gray.800" borderRadius="lg" p={5} border="1px solid" borderColor="gray.700">
      <Text fontWeight="bold" mb={3} color="white">Battle Log</Text>
      <VStack spacing={1} align="stretch" maxH="240px" overflowY="auto">
        {battleLog.map((entry, idx) => (
          <HStack key={idx} spacing={2} py={1} borderBottom="1px solid" borderColor="gray.700">
            <Text fontSize="xs" color="gray.500" minW="28px">T{entry.turnNumber}</Text>
            <Text fontSize="xs" flex={1} color="gray.300">{entry.narrative ?? entry.action}</Text>
            {entry.damageDealt > 0 && (
              <Badge colorScheme={entry.isCrit ? 'red' : 'gray'} fontSize="xs">
                {entry.isCrit ? '💥 ' : ''}{entry.damageDealt}
              </Badge>
            )}
          </HStack>
        ))}
      </VStack>
    </Box>
  );
}

export default function PostBattleSummary({ event }) {
  const teams = event.teams ?? [];

  const completedBattles = (event.battles ?? []).filter((b) => b.winnerId);
  const finalBattle = completedBattles[completedBattles.length - 1];

  const { data: logData } = useQuery(GET_CLAN_WARS_BATTLE, {
    variables: { battleId: finalBattle?.battleId },
    skip: !finalBattle?.battleId,
  });

  const battleLog = logData?.getClanWarsBattle?.battleLog ?? [];

  const winnerTeam = finalBattle
    ? teams.find((t) => t.teamId === finalBattle.winnerId)
    : null;

  const loserTeam = finalBattle
    ? teams.find((t) => t.teamId !== finalBattle.winnerId &&
        (t.teamId === finalBattle.team1Id || t.teamId === finalBattle.team2Id))
    : null;

  return (
    <VStack spacing={6} align="stretch" p={4}>
      <Box textAlign="center" py={4}>
        <Text fontSize="3xl" mb={2}>🏆</Text>
        <Text fontSize="2xl" fontWeight="bold" color="white">
          {event.status === 'COMPLETED' ? 'Champion Forge Complete!' : 'Event Archived'}
        </Text>
        {winnerTeam && (
          <Text fontSize="lg" color="yellow.400" mt={1}>
            {winnerTeam.teamName} wins the forge!
          </Text>
        )}
        <Badge colorScheme={event.status === 'COMPLETED' ? 'green' : 'gray'} mt={2}>
          {event.status}
        </Badge>
      </Box>

      {finalBattle && (winnerTeam || loserTeam) && (
        <Box>
          <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={3}>
            Final Battle Recap
          </Text>
          <SimpleGrid columns={[1, 2]} spacing={4}>
            {winnerTeam && (
              <ChampionRecap
                team={{ ...winnerTeam, championSnapshot: finalBattle.championSnapshots?.find(s => s.teamId === winnerTeam.teamId) }}
                isWinner
                battleLog={battleLog}
              />
            )}
            {loserTeam && (
              <ChampionRecap
                team={{ ...loserTeam, championSnapshot: finalBattle.championSnapshots?.find(s => s.teamId === loserTeam.teamId) }}
                isWinner={false}
                battleLog={battleLog}
              />
            )}
          </SimpleGrid>
        </Box>
      )}

      {!finalBattle && (
        <Box textAlign="center" py={8} bg="gray.800" borderRadius="lg">
          <Text color="gray.500">No battle data available.</Text>
        </Box>
      )}

      {battleLog.length > 0 && <BattleTimeline battleLog={battleLog} />}

      {teams.length > 0 && (
        <Box>
          <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={3}>
            Final War Chests
          </Text>
          <SimpleGrid columns={[1, 2, teams.length > 2 ? 3 : 2]} spacing={3}>
            {teams.map((team) => (
              <Box
                key={team.teamId}
                bg="gray.800"
                borderRadius="md"
                p={4}
                border="1px solid"
                borderColor={team.teamId === finalBattle?.winnerId ? 'yellow.400' : 'gray.700'}
              >
                <Text fontWeight="bold" mb={2} color="white">
                  {team.teamId === finalBattle?.winnerId && '🏆 '}{team.teamName}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  {(team.warChest ?? []).length} items collected
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
}
