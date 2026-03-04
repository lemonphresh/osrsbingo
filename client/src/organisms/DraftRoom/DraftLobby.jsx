import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  useClipboard,
  useColorMode,
  SimpleGrid,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { JOIN_DRAFT_ROOM_AS_CAPTAIN, START_DRAFT } from '../../graphql/draftOperations';
import { useToastContext } from '../../providers/ToastProvider';

export default function DraftLobby({ room, userRole, userId }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { showToast } = useToastContext();
  const [pinInput, setPinInput] = useState('');

  const roomUrl = `${window.location.origin}/blind-draft/${room.roomId}`;
  const { hasCopied, onCopy } = useClipboard(roomUrl);

  const [joinRoom, { loading: joining }] = useMutation(JOIN_DRAFT_ROOM_AS_CAPTAIN, {
    onError: (e) => showToast({ title: 'Failed to join', description: e.message, status: 'error' }),
  });

  const [startDraft, { loading: starting }] = useMutation(START_DRAFT, {
    onError: (e) => showToast({ title: 'Failed to start draft', description: e.message, status: 'error' }),
  });

  const allCaptainsJoined = room.teams.every((t) => t.captainJoined);
  const isOrganizer = userRole === 'organizer';

  // Check if this user has already claimed a seat
  const myTeam = room.teams.find((t) => t.captainUserId === userId);

  async function handleClaim(teamIndex) {
    await joinRoom({
      variables: { roomId: room.roomId, teamIndex, pin: pinInput || undefined },
    });
    setPinInput('');
  }

  async function handleStart() {
    await startDraft({ variables: { roomId: room.roomId } });
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Room link */}
      <Box
        bg={isDark ? '#2D3748' : 'gray.50'}
        border="1px solid"
        borderColor={isDark ? 'gray.600' : 'gray.200'}
        borderRadius="lg"
        p={4}
      >
        <Text fontSize="sm" fontWeight="semibold" mb={2}>Share this link with captains:</Text>
        <HStack>
          <Input value={roomUrl} isReadOnly size="sm" fontFamily="mono" />
          <Button size="sm" onClick={onCopy} colorScheme="purple" flexShrink={0}>
            {hasCopied ? 'Copied!' : 'Copy'}
          </Button>
        </HStack>
      </Box>

      {/* PIN input (if room has a PIN and user hasn't joined yet) */}
      {!myTeam && !isOrganizer && (
        <Box>
          <Text fontSize="sm" mb={1} color="gray.400">Room PIN (if required):</Text>
          <Input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            type="password"
            placeholder="Enter PIN..."
            size="sm"
            maxW="200px"
          />
        </Box>
      )}

      {/* Team slots */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Captain Seats ({room.teams.filter((t) => t.captainJoined).length}/{room.numberOfTeams} joined)
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
          {room.teams.map((team) => {
            const isMe = team.captainUserId === userId;
            const canClaim = !team.captainJoined && !myTeam && !isOrganizer;

            return (
              <Box
                key={team.index}
                bg={isDark ? '#2D3748' : 'white'}
                border="2px solid"
                borderColor={team.captainJoined ? 'green.500' : isDark ? 'gray.600' : 'gray.200'}
                borderRadius="lg"
                p={3}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="sm">{team.name}</Text>
                  <Badge colorScheme={team.captainJoined ? 'green' : 'gray'} fontSize="10px">
                    {team.captainJoined ? (isMe ? 'You' : 'Joined') : 'Empty'}
                  </Badge>
                </HStack>

                {canClaim && (
                  <Button
                    size="xs"
                    colorScheme="purple"
                    w="100%"
                    onClick={() => handleClaim(team.index)}
                    isLoading={joining}
                  >
                    Claim Seat
                  </Button>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      <Divider />

      {/* Draft info */}
      <HStack spacing={4} flexWrap="wrap">
        <Badge colorScheme="purple">{room.draftFormat} Draft</Badge>
        <Badge colorScheme="blue">{room.players.length} Players</Badge>
        <Badge colorScheme="gray">{room.pickTimeSeconds}s per pick</Badge>
      </HStack>

      {/* Start button (organizer only) */}
      {isOrganizer && (
        <Tooltip
          label={!allCaptainsJoined ? 'Waiting for all captains to claim their seats' : ''}
          isDisabled={allCaptainsJoined}
        >
          <Button
            colorScheme="green"
            size="lg"
            onClick={handleStart}
            isLoading={starting}
            isDisabled={!allCaptainsJoined}
            alignSelf="flex-start"
          >
            Start Draft
          </Button>
        </Tooltip>
      )}

      {!isOrganizer && !myTeam && (
        <Text fontSize="sm" color="gray.400">
          Claim a captain seat above to participate in the draft.
        </Text>
      )}

      {!isOrganizer && myTeam && (
        <Text fontSize="sm" color="green.300">
          You're in as captain of <strong>{myTeam.name}</strong>. Waiting for the organizer to start the draft.
        </Text>
      )}

      {isOrganizer && !allCaptainsJoined && (
        <Text fontSize="sm" color="gray.400">
          Waiting for all captains to join before you can start.
        </Text>
      )}
    </VStack>
  );
}
