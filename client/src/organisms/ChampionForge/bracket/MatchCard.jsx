import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Box, HStack, VStack, Text, Button, Badge } from '@chakra-ui/react';
import { SET_CAPTAIN_READY } from '../../../graphql/clanWarsOperations';
import ConfirmModal from '../ConfirmModal';

export default function MatchCard({
  match,
  teams,
  isAdmin,
  myTeamId,
  eventId,
  starting,
  onStartBattle,
  onSelectBattle,
  preview,
  isNextUp,
}) {
  const team1 = teams.find((t) => t.teamId === match.team1Id);
  const team2 = teams.find((t) => t.teamId === match.team2Id);

  const isActive = !!match.battleId && !match.winnerId;
  const isCompleted = !!match.winnerId;
  const isUpcoming = !match.battleId && !match.winnerId;

  const bothReady = !!match.team1Ready && !!match.team2Ready;
  const myTeamIsTeam1 = myTeamId === match.team1Id;
  const myTeamIsTeam2 = myTeamId === match.team2Id;
  const iAmInThisMatch = myTeamIsTeam1 || myTeamIsTeam2;
  const amIReady = myTeamIsTeam1 ? !!match.team1Ready : myTeamIsTeam2 ? !!match.team2Ready : false;

  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [readyingTeamId, setReadyingTeamId] = useState(null);
  const [setCaptainReady, { loading: readying }] = useMutation(SET_CAPTAIN_READY);

  const handleReady = (teamId) => {
    setReadyingTeamId(teamId);
    setCaptainReady({ variables: { eventId, teamId } }).finally(() => setReadyingTeamId(null));
  };

  if (match.isBye) {
    return (
      <Box
        bg="gray.700"
        borderRadius="md"
        p={3}
        border="1px solid"
        borderColor="gray.600"
        minW="200px"
      >
        <Text fontSize="xs" color="gray.500" mb={1}>
          Bye
        </Text>
        <Text fontSize="sm" fontWeight="medium" color="white">
          {team1?.teamName ?? 'TBD'}
        </Text>
        {!preview && (
          <Badge colorScheme="green" fontSize="xs" mt={1}>
            Advances
          </Badge>
        )}
      </Box>
    );
  }

  if (preview) {
    return (
      <Box
        bg="gray.800"
        borderRadius="lg"
        p={3}
        border="1px solid"
        borderColor="gray.600"
        minW="180px"
      >
        <Text
          fontSize="sm"
          color={match.winnerId === match.team1Id ? 'yellow.400' : 'white'}
          fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}
        >
          {team1?.teamName ?? 'TBD'}
        </Text>
        <Text fontSize="10px" color="gray.600" textAlign="center" letterSpacing={2} my={1}>
          VS
        </Text>
        <Text
          fontSize="sm"
          color={match.winnerId === match.team2Id ? 'yellow.400' : 'white'}
          fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
        >
          {team2?.teamName ?? 'TBD'}
        </Text>
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
        <HStack mb={3} flexWrap="wrap" spacing={1}>
          {isActive && (
            <Badge colorScheme="red" fontSize="xs">
              ⚔️ In Progress
            </Badge>
          )}
          {isCompleted && (
            <Badge colorScheme="green" fontSize="xs">
              ✅ Completed
            </Badge>
          )}
          {isUpcoming && (
            <Badge colorScheme="yellow" fontSize="xs">
              🔜 Upcoming
            </Badge>
          )}
        </HStack>

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
            {isUpcoming &&
              (match.team1Ready ? (
                <Badge colorScheme="green" fontSize="xx-small">
                  ✅ ready
                </Badge>
              ) : (
                <Badge colorScheme="gray" fontSize="xx-small">
                  ⏳ waiting
                </Badge>
              ))}
          </HStack>

          <Text fontSize="10px" color="gray.500" textAlign="center" letterSpacing={2}>
            VS
          </Text>

          <HStack justify="space-between">
            <Text
              fontSize="sm"
              fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}
              color={match.winnerId === match.team2Id ? 'yellow.400' : 'white'}
            >
              {team2?.teamName ?? 'TBD'}
            </Text>
            {match.winnerId === match.team2Id && <Text fontSize="xs">🏆</Text>}
            {isUpcoming &&
              (match.team2Ready ? (
                <Badge colorScheme="green" fontSize="xx-small">
                  ✅ ready
                </Badge>
              ) : (
                <Badge colorScheme="gray" fontSize="xx-small">
                  ⏳ waiting
                </Badge>
              ))}
          </HStack>
        </VStack>

        {isUpcoming && isNextUp && match.team1Id && match.team2Id && iAmInThisMatch && !isAdmin && (
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
              isDisabled={readying}
              onClick={() => handleReady(myTeamId)}
            >
              ✅ Ready Up
            </Button>
          )
        )}

        {isUpcoming && isNextUp && isAdmin && match.team1Id && match.team2Id && (
          <VStack spacing={1}>
            <HStack w="full" spacing={1}>
              <Button
                size="xs"
                variant={match.team1Ready ? 'solid' : 'outline'}
                colorScheme="green"
                flex={1}
                isLoading={readying && readyingTeamId === match.team1Id}
                isDisabled={!!match.team1Ready || readying}
                onClick={() => !match.team1Ready && handleReady(match.team1Id)}
              >
                {match.team1Ready ? '✅' : `Ready ${team1?.teamName?.split(' ')[0]}`}
              </Button>
              <Button
                size="xs"
                variant={match.team2Ready ? 'solid' : 'outline'}
                colorScheme="green"
                flex={1}
                isLoading={readying && readyingTeamId === match.team2Id}
                isDisabled={!!match.team2Ready || readying}
                onClick={() => !match.team2Ready && handleReady(match.team2Id)}
              >
                {match.team2Ready ? '✅' : `Ready ${team2?.teamName?.split(' ')[0]}`}
              </Button>
            </HStack>
            <Button
              size="xs"
              colorScheme={bothReady ? 'red' : 'yellow'}
              w="full"
              isLoading={starting}
              isDisabled={!team1 || !team2}
              onClick={() => setStartConfirmOpen(true)}
            >
              {bothReady ? '⚔️ Start Battle' : '⚠️ Start Anyway'}
            </Button>
          </VStack>
        )}

        {(isActive || isCompleted) && match.battleId && (
          <Button
            size="xs"
            colorScheme={isActive ? 'red' : 'blue'}
            variant="solid"
            w="full"
            color="white"
            mt={isCompleted ? 0 : undefined}
            onClick={() => onSelectBattle?.(match.battleId)}
          >
            {isActive ? '👁 Watch Live' : '📜 View Log'}
          </Button>
        )}
      </Box>

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
            : `${
                !match.team1Ready ? team1?.teamName : team2?.teamName
              } hasn't readied up yet. Start the battle anyway?`
        }
        confirmLabel="Start Battle"
        colorScheme={bothReady ? 'red' : 'yellow'}
      />
    </>
  );
}
