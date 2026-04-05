import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Box, VStack, HStack, Text, Button, Badge, Divider } from '@chakra-ui/react';
import ConfirmModal from './ConfirmModal';
import { SET_CAPTAIN_READY } from '../../graphql/clanWarsOperations';

function MatchCard({
  match,
  teams,
  isAdmin,
  myTeamId,
  eventId,
  starting,
  onStartBattle,
  onSelectBattle,
  preview,
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

  const [setCaptainReady, { loading: readying }] = useMutation(SET_CAPTAIN_READY);

  const handleReady = () => {
    setCaptainReady({ variables: { eventId, teamId: myTeamId } });
  };

  const handleStartClick = () => setStartConfirmOpen(true);

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

  // Preview mode — team names only, no status/ready/action UI
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
        <Text fontSize="sm" color={match.winnerId === match.team1Id ? 'yellow.400' : 'white'} fontWeight={match.winnerId === match.team1Id ? 'bold' : 'normal'}>
          {team1?.teamName ?? 'TBD'}
        </Text>
        <Text fontSize="10px" color="gray.600" textAlign="center" letterSpacing={2} my={1}>
          VS
        </Text>
        <Text fontSize="sm" color={match.winnerId === match.team2Id ? 'yellow.400' : 'white'} fontWeight={match.winnerId === match.team2Id ? 'bold' : 'normal'}>
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
        {/* Status badge */}
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

        {/* Captain ready button */}
        {isUpcoming &&
          match.team1Id && match.team2Id &&
          iAmInThisMatch &&
          !isAdmin &&
          (amIReady ? (
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
          ))}

        {/* Admin ready-up on behalf + start */}
        {isUpcoming && isAdmin && match.team1Id && match.team2Id && (
          <VStack spacing={1}>
            <HStack w="full" spacing={1}>
              <Button
                size="xs"
                variant={match.team1Ready ? 'solid' : 'outline'}
                colorScheme="green"
                flex={1}
                isLoading={readying && !match.team1Ready}
                isDisabled={!!match.team1Ready}
                onClick={() => !match.team1Ready && setCaptainReady({ variables: { eventId, teamId: match.team1Id } })}
              >
                {match.team1Ready ? '✅' : `Ready ${team1?.teamName?.split(' ')[0]}`}
              </Button>
              <Button
                size="xs"
                variant={match.team2Ready ? 'solid' : 'outline'}
                colorScheme="green"
                flex={1}
                isLoading={readying && !match.team2Ready}
                isDisabled={!!match.team2Ready}
                onClick={() => !match.team2Ready && setCaptainReady({ variables: { eventId, teamId: match.team2Id } })}
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

// Base slot height per match for the busiest round in a section.
// Slot height = BASE * maxMatchesInSection / round.matches.length
// so every column in the section has the same total height → proper ">" alignment.
const BASE_SLOT_H = { preview: 100, full: 220 };

function RoundColumn({ round, roundLabel, maxMatchesInSection, teams, isAdmin, myTeamId, eventId, starting, onStartBattle, onSelectBattle, preview }) {
  const slotH = Math.round(
    (preview ? BASE_SLOT_H.preview : BASE_SLOT_H.full) * maxMatchesInSection / round.matches.length
  );
  return (
    <Box display="flex" flexDir="column" minW={preview ? '160px' : '240px'} flexShrink={0}>
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing={1} mb={4}>
        {roundLabel}
      </Text>
      <Box>
        {round.matches.map((match, matchIdx) => (
          <Box key={matchIdx} h={`${slotH}px`} display="flex" alignItems="center">
            <Box w="full">
              <MatchCard
                match={match}
                teams={teams}
                isAdmin={isAdmin}
                myTeamId={myTeamId}
                eventId={eventId}
                starting={starting}
                onStartBattle={onStartBattle}
                onSelectBattle={onSelectBattle}
                preview={preview}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function getSELabel(roundIdx, totalRounds) {
  if (roundIdx === totalRounds - 1) return 'Final';
  if (roundIdx === totalRounds - 2 && totalRounds > 2) return 'Semifinal';
  return `Round ${roundIdx + 1}`;
}

// ---------------------------------------------------------------------------
// Single-elimination layout (original)
// ---------------------------------------------------------------------------
function SEBracket({ bracket, teams, isAdmin, myTeamId, eventId, starting, onStartBattle, onSelectBattle, preview }) {
  const maxMatches = Math.max(...bracket.rounds.map((r) => r.matches.length));
  return (
    <Box overflowX="auto">
      <HStack align="flex-start" spacing={preview ? 4 : 8} pb={4}>
        {bracket.rounds.map((round, roundIdx) => (
          <RoundColumn
            key={roundIdx}
            round={round}
            maxMatchesInSection={maxMatches}
            roundLabel={getSELabel(roundIdx, bracket.rounds.length)}
            teams={teams}
            isAdmin={isAdmin}
            myTeamId={myTeamId}
            eventId={eventId}
            starting={starting}
            onStartBattle={onStartBattle}
            onSelectBattle={onSelectBattle}
            preview={preview}
          />
        ))}
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Double-elimination layout
// ---------------------------------------------------------------------------
function DEBracket({ bracket, teams, isAdmin, myTeamId, eventId, starting, onStartBattle, onSelectBattle, preview }) {
  const sharedProps = { teams, isAdmin, myTeamId, eventId, starting, onStartBattle, onSelectBattle, preview };

  const lbRounds = bracket.losersBracket ?? [];
  const gf = bracket.grandFinal;

  const wbMaxMatches = Math.max(...bracket.rounds.map((r) => r.matches.length));
  const lbMaxMatches = lbRounds.length > 0 ? Math.max(...lbRounds.map((r) => r.matches.length)) : 1;

  return (
    <VStack align="stretch" spacing={6}>
      {/* Winners Bracket */}
      <Box>
        <HStack mb={3} spacing={2} align="center">
          <Text fontSize="xs" fontWeight="bold" color="yellow.400" textTransform="uppercase" letterSpacing={2}>
            Winners Bracket
          </Text>
          <Text fontSize="xs" color="gray.600">(lose here and you drop to Losers Bracket)</Text>
        </HStack>
        <Box overflowX="auto">
          <HStack align="flex-start" spacing={8} pb={2}>
            {bracket.rounds.map((round, roundIdx) => (
              <RoundColumn
                key={roundIdx}
                round={round}
                maxMatchesInSection={wbMaxMatches}
                roundLabel={round.label ?? getSELabel(roundIdx, bracket.rounds.length)}
                {...sharedProps}
              />
            ))}
          </HStack>
        </Box>
      </Box>

      <Divider borderColor="gray.700" />

      {/* Losers Bracket */}
      {lbRounds.length > 0 && (
        <Box>
          <HStack mb={3} spacing={2} align="center">
            <Text fontSize="xs" fontWeight="bold" color="orange.400" textTransform="uppercase" letterSpacing={2}>
              Losers Bracket
            </Text>
            <Text fontSize="xs" color="gray.600">(one more loss and you're eliminated)</Text>
          </HStack>
          <Box overflowX="auto">
            <HStack align="flex-start" spacing={8} pb={2}>
              {lbRounds.map((round, roundIdx) => (
                <RoundColumn
                  key={roundIdx}
                  round={round}
                  maxMatchesInSection={lbMaxMatches}
                  roundLabel={round.label ?? `LB Round ${roundIdx + 1}`}
                  {...sharedProps}
                />
              ))}
            </HStack>
          </Box>
        </Box>
      )}

      {/* Grand Final */}
      {gf && (
        <>
          <Divider borderColor="gray.700" />
          <Box alignSelf="flex-start">
            <Text fontSize="xs" fontWeight="bold" color="purple.300" textTransform="uppercase" letterSpacing={2} mb={3}>
              Grand Final
            </Text>
            <MatchCard match={gf} {...sharedProps} />
          </Box>
        </>
      )}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function BattleBracket({
  event,
  isAdmin,
  myTeamId,
  starting,
  onStartBattle,
  onSelectBattle,
  preview,
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

  const sharedProps = { teams, isAdmin, myTeamId, eventId: event.eventId, starting, onStartBattle, onSelectBattle, preview };

  if (bracket.type === 'DOUBLE_ELIMINATION') {
    return <DEBracket bracket={bracket} {...sharedProps} />;
  }

  return <SEBracket bracket={bracket} {...sharedProps} />;
}
