import { Box, VStack, HStack, Text, Badge, Skeleton, Button } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { GET_DRAFT_ROOM, DRAFT_ROOM_UPDATED } from '../graphql/draftOperations';
import CreateRoomForm from '../organisms/DraftRoom/CreateRoomForm';
import DraftLobby from '../organisms/DraftRoom/DraftLobby';
import ActiveDraft from '../organisms/DraftRoom/ActiveDraft';
import AuctionDraft from '../organisms/DraftRoom/AuctionDraft';
import RevealScreen from '../organisms/DraftRoom/RevealScreen';
import usePageTitle from '../hooks/usePageTitle';
import { loadCaptainSession } from '../utils/draftSession';

const STATUS_COLORS = {
  LOBBY: 'gray',
  DRAFTING: 'purple',
  REVEALED: 'green',
  COMPLETED: 'teal',
};

/** Derive the user's role in this room (supports anonymous captains via localStorage token). */
function deriveRole(room, userId, session) {
  const uid = userId;
  if (uid && (room.organizerUserId === uid || room.organizerUserId === String(uid)))
    return 'organizer';
  // Logged-in captain
  if (uid) {
    const captainTeam = room.teams.find(
      (t) => t.captainUserId === uid || t.captainUserId === String(uid)
    );
    if (captainTeam) return `captain:${captainTeam.index}`;
  }
  // Anonymous captain — matched by stored session token index
  if (session) {
    const slot = room.teams.find((t) => t.index === session.teamIndex && t.captainJoined);
    if (slot) return `captain:${session.teamIndex}`;
  }
  return 'spectator';
}

export default function DraftRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // No roomId = creation mode
  const isCreating = !roomId;
  usePageTitle(isCreating ? 'Create Draft Room' : 'Draft Room');

  const { data, loading, error, subscribeToMore } = useQuery(GET_DRAFT_ROOM, {
    variables: { roomId },
    skip: isCreating,
    fetchPolicy: 'network-only',
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (isCreating || !roomId) return;

    const unsub = subscribeToMore({
      document: DRAFT_ROOM_UPDATED,
      variables: { roomId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const { room } = subscriptionData.data.draftRoomUpdated;
        return { getDraftRoom: room };
      },
    });

    return () => unsub();
  }, [roomId, isCreating, subscribeToMore]);

  if (isCreating) {
    return (
      <Box flex="1" my="48px" maxW="900px" mx="auto" px={4} py={8}>
        <HStack mb={6} spacing={3}>
          <Button
            color="white"
            variant="outline"
            size="sm"
            onClick={() => navigate('/blind-draft')}
          >
            ← Back
          </Button>
          <Text fontSize="2xl" fontWeight="black">
            Create Draft Room
          </Text>
        </HStack>
        <CreateRoomForm />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box flex="1" my="48px" maxW="900px" mx="auto" px={4} py={8}>
        <Skeleton h="40px" mb={4} borderRadius="md" />
        <Skeleton h="200px" borderRadius="lg" />
      </Box>
    );
  }

  if (error || !data?.getDraftRoom) {
    return (
      <Box flex="1" my="48px" maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" mb={2}>
          Room not found
        </Text>
        <Text color="gray.400" mb={4}>
          This draft room doesn't exist or has been deleted.
        </Text>
        <Button colorScheme="purple" onClick={() => navigate('/blind-draft')}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  const room = data.getDraftRoom;
  const session = loadCaptainSession(roomId);
  const userRole = deriveRole(room, user?.id, session);
  const captainToken = session?.captainToken ?? null;

  return (
    <Box flex="1" my="48px" maxW="1100px" mx="auto" px={4} py={6}>
      {/* header */}
      <HStack justify="space-between" mb={5} flexWrap="wrap" gap={3}>
        <VStack align="flex-start" spacing={0}>
          <HStack>
            <Text fontSize="xl" fontWeight="black">
              {room.roomName}
            </Text>
            <Badge colorScheme={STATUS_COLORS[room.status] ?? 'gray'}>{room.status}</Badge>
          </HStack>
          <Text fontSize="xs" color="gray.400">
            {room.draftFormat} draft · {room.players.length} players · {room.numberOfTeams} teams
            {userRole !== 'spectator' ? ` · You: ${userRole}` : ' · Spectating'}
          </Text>
        </VStack>
        <Button
          colorScheme="yellow"
          variant="ghost"
          size="sm"
          onClick={() => navigate('/blind-draft')}
        >
          ← Dashboard
        </Button>
      </HStack>

      {/* Content based on status */}
      {room.status === 'LOBBY' && <DraftLobby room={room} userRole={userRole} userId={user?.id} />}

      {room.status === 'DRAFTING' && room.draftFormat !== 'AUCTION' && (
        <ActiveDraft
          room={room}
          userRole={userRole}
          userId={user?.id}
          captainToken={captainToken}
        />
      )}

      {room.status === 'DRAFTING' && room.draftFormat === 'AUCTION' && (
        <AuctionDraft
          room={room}
          userRole={userRole}
          userId={user?.id}
          captainToken={captainToken}
        />
      )}

      {(room.status === 'COMPLETED' || room.status === 'REVEALED') && (
        <RevealScreen room={room} userRole={userRole} />
      )}
    </Box>
  );
}
