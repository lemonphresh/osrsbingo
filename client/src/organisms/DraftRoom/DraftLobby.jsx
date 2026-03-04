import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  useClipboard,
  SimpleGrid,
  Divider,
  Tooltip,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { JOIN_DRAFT_ROOM_AS_CAPTAIN, START_DRAFT } from '../../graphql/draftOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { saveCaptainSession, loadCaptainSession } from '../../utils/draftSession';

const IS_DEV = process.env.NODE_ENV !== 'production';

export default function DraftLobby({ room, userRole, userId }) {
  const { showToast } = useToastContext();
  const [pinInput, setPinInput] = useState('');
  const [devFilling, setDevFilling] = useState(false);

  const roomUrl = `${window.location.origin}/blind-draft/${room.roomId}`;
  const { hasCopied, onCopy } = useClipboard(roomUrl);

  const [joinRoom, { loading: joining }] = useMutation(JOIN_DRAFT_ROOM_AS_CAPTAIN, {
    onError: (e) => showToast(`Failed to join: ${e.message}`, 'error'),
    update(cache, { data }) {
      // write the returned room back into the getDraftRoom cache entry
      const room = data?.joinDraftRoomAsCaptain?.room;
      if (!room) return;
      cache.writeQuery({
        query: require('../../graphql/draftOperations').GET_DRAFT_ROOM,
        variables: { roomId: room.roomId },
        data: { getDraftRoom: room },
      });
    },
  });

  const [startDraft, { loading: starting }] = useMutation(START_DRAFT, {
    onError: (e) => showToast(`Failed to start draft: ${e.message}`, 'error'),
  });

  const allCaptainsJoined = room.teams.every((t) => t.captainJoined);
  const isOrganizer = userRole === 'organizer';

  // check if this user has already claimed a seat (via auth or stored session token)
  const session = loadCaptainSession(room.roomId);
  const myTeamIndex =
    session?.teamIndex ??
    (userId ? room.teams.find((t) => t.captainUserId === userId)?.index : undefined);
  const myTeam = myTeamIndex !== undefined ? room.teams.find((t) => t.index === myTeamIndex) : null;

  async function handleClaim(teamIndex) {
    const result = await joinRoom({
      variables: { roomId: room.roomId, teamIndex, pin: pinInput || undefined },
    });
    if (result?.data?.joinDraftRoomAsCaptain) {
      const { captainToken, teamIndex: idx } = result.data.joinDraftRoomAsCaptain;
      saveCaptainSession(room.roomId, idx, captainToken);
    }
    setPinInput('');
  }

  async function handleStart() {
    await startDraft({ variables: { roomId: room.roomId } });
  }

  async function handleDevFillCaptains() {
    if (!IS_DEV || !isOrganizer) return;
    setDevFilling(true);
    const unclaimed = room.teams.filter((t) => !t.captainJoined);
    for (const team of unclaimed) {
      // eslint-disable-next-line no-await-in-loop
      await joinRoom({ variables: { roomId: room.roomId, teamIndex: team.index } });
    }
    setDevFilling(false);
    showToast(`Dev: filled ${unclaimed.length} captain seat(s)`, 'info');
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* room link */}
      <Box bg="gray.700" border="1px solid" borderColor="gray.600" borderRadius="lg" p={4}>
        <Text fontSize="sm" fontWeight="semibold" mb={2}>
          Share this link with captains:
        </Text>
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
          <Text fontSize="sm" mb={1} color="gray.400">
            Room PIN (if required):
          </Text>
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

      {/* team slots */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Captain Seats ({room.teams.filter((t) => t.captainJoined).length}/{room.numberOfTeams}{' '}
          joined)
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
          {room.teams.map((team) => {
            const isMe = team.captainUserId === userId;
            const canClaim = !team.captainJoined && !myTeam && !isOrganizer;

            return (
              <Box
                key={team.index}
                bg="gray.700"
                border="2px solid"
                borderColor={team.captainJoined ? 'green.500' : 'gray.600'}
                borderRadius="lg"
                p={3}
              >
                <HStack justify="space-between" mb={2}>
                  <Text fontWeight="bold" fontSize="sm">
                    {team.name}
                  </Text>
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

      {/* draft info */}
      <HStack spacing={4} flexWrap="wrap">
        <Badge colorScheme="purple">{room.draftFormat} Draft</Badge>
        <Badge colorScheme="blue">{room.players.length} Players</Badge>
        <Badge colorScheme="gray">{room.pickTimeSeconds}s per pick</Badge>
      </HStack>

      {/* start button (organizer only) */}
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
          You're in as captain of <strong>{myTeam.name}</strong>. Waiting for the organizer to start
          the draft.
        </Text>
      )}

      {isOrganizer && !allCaptainsJoined && (
        <Text fontSize="sm" color="gray.400">
          Waiting for all captains to join before you can start.
        </Text>
      )}

      {/* dev-only: auto-fill unclaimed captain seats for local testing */}
      {IS_DEV && isOrganizer && !allCaptainsJoined && (
        <Box
          border="1px dashed"
          borderColor="yellow.600"
          borderRadius="lg"
          p={3}
          bg="yellow.900"
          opacity={0.85}
        >
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="yellow.300"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Dev Tools
              </Text>
              <Text fontSize="xs" color="yellow.200">
                Auto-fill {room.teams.filter((t) => !t.captainJoined).length} unclaimed seat(s) so
                you can start the draft alone.
              </Text>
            </VStack>
            <Button
              size="sm"
              colorScheme="yellow"
              variant="outline"
              onClick={handleDevFillCaptains}
              isLoading={devFilling}
              loadingText="Filling..."
            >
              Auto-fill Captains
            </Button>
          </HStack>
        </Box>
      )}
    </VStack>
  );
}
