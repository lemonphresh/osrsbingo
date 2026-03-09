import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Button, Badge,
} from '@chakra-ui/react';
import ConfirmModal from './ConfirmModal';
import { SET_CAPTAIN_READY } from '../../graphql/clanWarsOperations';

function MatchCard({
  match, teams, isAdmin, myTeamId, eventId,
  starting, onStartBattle, onSelectBattle,
}) {
  const team1 = teams.find((t) => t.teamId === match.team1Id);
  const team2 = teams.find((t) => t.teamId === match.team2Id);

  const isActive    = !!match.battleId && !match.winnerId;
  const isCompleted = !!match.winnerId;
  const isUpcoming  = !match.battleId && !match.winnerId;

  const bothReady   = !!match.team1Ready && !!match.team2Ready;
  const myTeamIsTeam1 = myTeamId === match.team1Id;
  const myTeamIsTeam2 = myTeamId === match.team2Id;
  const iAmInThisMatch = myTeamIsTeam1 || myTeamIsTeam2;
  const amIReady = myTeamIsTeam1 ? !!match.team1Ready : myTeamIsTeam2 ? !!match.team2Ready : false;

  const [startConfirmOpen, setStartConfirmOpen] = useState(false);

  const [setCaptainReady, { loading: readying }] = useMutation(SET_CAPTAIN_READY);

  const handleReady = () => {
    setCaptainReady({ variables: { eventId, teamId: myTeamId } });
  };

  const handleStartClick = () => setStartConfirmOpen(true);

  if (match.isBye) {
    return (
      <Box bg="gray.700" borderRadius="md" p={3} border="1px solid" borderColor="gray.600" minW="200px">
        <Text fontSize="xs" color="gray.500" mb={1}>Bye</Text>
        <Text fontSize="sm" fontWeight="medium" color="white">{team1?.teamName ?? 'TBD'}</Text>
        <Badge colorScheme="green" fontSize="xs" mt={1}>Advances</Badge>
      </Box>
    );
  }

  return (
    <>
      <Box
        bg={isActive ? 'red.950' : 'gray.800'}
        borderRadius="lg"
        p={4}
        border="2px solid"
        borderColor={isActive ? 'red.400' : isCompleted ? 'green.700' : 'gray.600'}
        minW="220px"
        boxShadow={isActive ? '0 0 12px rgba(197,48,48,0.3)' : 'none'}
      >
        {/* Status badge */}
        <HStack mb={3} flexWrap="wrap" spacing={1}>
          {isActive    && <Badge colorScheme="red"    fontSize="xs">⚔️ In Progress</Badge>}
          {isCompleted && <Badge colorScheme="green"  fontSize="xs">✅ Completed</Badge>}
          {isUpcoming  && <Badge colorScheme="yellow" fontSize="xs">🔜 Upcoming</Badge>}
        </HStack>

        {/* Teams + ready indicators */}
        <VStack spacing={1} align="stretch" mb={3}>
          <HStack justify="space-between">
            <Text
              fontSize="sm"
              fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}
              color={match.winnerId === match.team1Id ? 'yellow.400' : 'white'}
            >
              {team1?.teamName ?? 'TBD'}
            </Text>
            {match.winnerId === match.team1Id && <Text fontSize="xs">🏆</Text>}
            {isUpcoming && (
              match.team1Ready
                ? <Badge colorScheme="green" fontSize="xx-small">✅ ready</Badge>
                : <Badge colorScheme="gray"  fontSize="xx-small">⏳ waiting</Badge>
            )}
          </HStack>

          <Text fontSize="10px" color="gray.500" textAlign="center" letterSpacing={2}>VS</Text>

          <HStack justify="space-between">
            <Text
              fontSize="sm"
              fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
              color={match.winnerId === match.team2Id ? 'yellow.400' : 'white'}
            >
              {team2?.teamName ?? 'TBD'}
            </Text>
            {match.winnerId === match.team2Id && <Text fontSize="xs">🏆</Text>}
            {isUpcoming && (
              match.team2Ready
                ? <Badge colorScheme="green" fontSize="xx-small">✅ ready</Badge>
                : <Badge colorScheme="gray"  fontSize="xx-small">⏳ waiting</Badge>
            )}
          </HStack>
        </VStack>

        {/* Captain ready button */}
        {isUpcoming && iAmInThisMatch && !isAdmin && (
          amIReady ? (
            <Button size="xs" colorScheme="green" w="full" isDisabled variant="solid" mb={2}>
              ✅ You're Ready!
            </Button>
          ) : (
            <Button
              size="xs"
              colorScheme="green"
              w="full"
              mb={2}
              isLoading={readying}
              onClick={handleReady}
            >
              ✅ Ready Up
            </Button>
          )
        )}

        {/* Admin ready-up on behalf + start */}
        {isUpcoming && isAdmin && (
          <VStack spacing={1}>
            {/* Admin can ready both teams too */}
            <HStack w="full" spacing={1}>
              {!match.team1Ready && (
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="green"
                  flex={1}
                  isLoading={readying}
                  onClick={() => setCaptainReady({ variables: { eventId, teamId: match.team1Id } })}
                >
                  Ready {team1?.teamName?.split(' ')[0]}
                </Button>
              )}
              {!match.team2Ready && (
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="green"
                  flex={1}
                  isLoading={readying}
                  onClick={() => setCaptainReady({ variables: { eventId, teamId: match.team2Id } })}
                >
                  Ready {team2?.teamName?.split(' ')[0]}
                </Button>
              )}
            </HStack>

            <Button
              size="xs"
              colorScheme={bothReady ? 'red' : 'yellow'}
              w="full"
              isLoading={starting}
              isDisabled={!team1 || !team2}
              onClick={handleStartClick}
            >
              {bothReady ? '⚔️ Start Battle' : '⚠️ Start Anyway'}
            </Button>
          </VStack>
        )}

        {/* Watch / view log */}
        {(isActive || isCompleted) && match.battleId && (
          <Button
            size="xs"
            colorScheme={isActive ? 'red' : 'gray'}
            variant={isActive ? 'solid' : 'outline'}
            w="full"
            mt={isCompleted ? 0 : undefined}
            onClick={() => onSelectBattle?.(match.battleId)}
          >
            {isActive ? '👁 Watch Live' : '📜 View Log'}
          </Button>
        )}
      </Box>

      {/* Start confirm with ready-check warning */}
      <ConfirmModal
        isOpen={startConfirmOpen}
        onClose={() => setStartConfirmOpen(false)}
        onConfirm={() => {
          setStartConfirmOpen(false);
          onStartBattle?.(match.team1Id, match.team2Id);
        }}
        title={bothReady ? 'Start Battle?' : '⚠️ Not All Captains Ready'}
        body={
          bothReady
            ? `${team1?.teamName} vs ${team2?.teamName} — both captains are ready. Let's go!`
            : `${!match.team1Ready ? team1?.teamName : team2?.teamName} hasn't readied up yet. Start the battle anyway?`
        }
        confirmLabel="Start Battle"
        colorScheme={bothReady ? 'red' : 'yellow'}
      />
    </>
  );
}

export default function BattleBracket({
  event, isAdmin, myTeamId, starting, onStartBattle, onSelectBattle,
}) {
  const bracket = event.bracket;
  const teams = event.teams ?? [];

  if (!bracket?.rounds?.length) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">No bracket generated yet.</Text>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <HStack align="flex-start" spacing={8} pb={4}>
        {bracket.rounds.map((round, roundIdx) => (
          <VStack key={roundIdx} align="flex-start" spacing={4} minW="240px">
            <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1}>
              {roundIdx === bracket.rounds.length - 1
                ? 'Final'
                : roundIdx === bracket.rounds.length - 2 && bracket.rounds.length > 2
                ? 'Semifinal'
                : `Round ${roundIdx + 1}`}
            </Text>
            <VStack spacing={6} align="stretch">
              {round.matches.map((match, matchIdx) => (
                <MatchCard
                  key={matchIdx}
                  match={match}
                  teams={teams}
                  isAdmin={isAdmin}
                  myTeamId={myTeamId}
                  eventId={event.eventId}
                  starting={starting}
                  onStartBattle={onStartBattle}
                  onSelectBattle={onSelectBattle}
                />
              ))}
            </VStack>
          </VStack>
        ))}
      </HStack>
    </Box>
  );
}
