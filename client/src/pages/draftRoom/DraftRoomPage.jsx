import { Box, VStack, HStack, Text, Skeleton, Button } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { GET_DRAFT_ROOM, DRAFT_ROOM_UPDATED } from '../../graphql/draftOperations';
import CreateRoomForm from '../../organisms/DraftRoom/CreateRoomForm';
import DraftLobby from '../../organisms/DraftRoom/DraftLobby';
import ActiveDraft from '../../organisms/DraftRoom/ActiveDraft';
import AuctionDraft from '../../organisms/DraftRoom/AuctionDraft';
import RevealScreen from '../../organisms/DraftRoom/RevealScreen';
import usePageTitle from '../../hooks/usePageTitle';
import { loadCaptainSession } from '../../utils/draftSession';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

const STATUS_MODE = {
  LOBBY: 'default',
  DRAFTING: 'active',
  REVEALED: 'active',
  COMPLETED: 'default',
};

/** Derive the user's role in this room (supports anonymous captains via localStorage token). */
function deriveRole(room, userId, session) {
  const uid = userId;
  if (uid && (room.organizerUserId === uid || room.organizerUserId === String(uid)))
    return 'organizer';
  if (uid) {
    const captainTeam = room.teams.find(
      (t) => t.captainUserId === uid || t.captainUserId === String(uid)
    );
    if (captainTeam) return `captain:${captainTeam.index}`;
  }
  if (session) {
    const slot = room.teams.find((t) => t.index === session.teamIndex && t.captainJoined);
    if (slot) return `captain:${session.teamIndex}`;
  }
  return 'spectator';
}

// Shared outline-style back button for header navigation. Same geometry
// as HudChip-adjacent buttons used elsewhere on the HUD surfaces.
function BackButton({ children, ...rest }) {
  return (
    <Button
      bg="transparent"
      color={HUD.textSecondary}
      borderWidth="1px"
      borderStyle="solid"
      borderColor={HUD.border}
      borderRadius="2px"
      fontFamily={HUD_FONT_MONO}
      fontSize="11px"
      fontWeight="500"
      textTransform="uppercase"
      letterSpacing="0.1em"
      h="30px"
      px={3}
      _hover={{ bg: HUD.bgElevated, borderColor: HUD.borderBright, color: HUD.textPrimary }}
      {...rest}
    >
      {children}
    </Button>
  );
}

export default function DraftRoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isCreating = !roomId;
  usePageTitle(isCreating ? 'Create Draft Room' : 'Draft Room');

  const { data, loading, error, subscribeToMore } = useQuery(GET_DRAFT_ROOM, {
    variables: { roomId },
    skip: isCreating,
    fetchPolicy: 'network-only',
  });

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
        <HStack mb={6} spacing={4} align="center">
          <BackButton onClick={() => navigate('/blind-draft')}>← Back</BackButton>
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={3} align="center">
              <Box
                w="6px"
                h="20px"
                bg={HUD.cyan}
                boxShadow={`0 0 10px ${HUD.cyanGlow}`}
                borderRadius="1px"
              />
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="10px"
                color={HUD.cyan}
                textTransform="uppercase"
                letterSpacing="0.3em"
              >
                New Room
              </Text>
            </HStack>
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontSize="2xl"
              fontWeight="700"
              lineHeight="1"
              letterSpacing="-0.01em"
              color={HUD.textPrimary}
            >
              Create Draft Room
            </Text>
          </VStack>
        </HStack>
        <CreateRoomForm />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box flex="1" my="48px" maxW="900px" mx="auto" px={4} py={8}>
        <Skeleton h="40px" mb={4} borderRadius="2px" startColor={HUD.bgSurface} endColor={HUD.bgElevated} />
        <Skeleton h="200px" borderRadius="2px" startColor={HUD.bgSurface} endColor={HUD.bgElevated} />
      </Box>
    );
  }

  if (error || !data?.getDraftRoom) {
    return (
      <Box flex="1" my="48px" maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text
          fontFamily={HUD_FONT_DISPLAY}
          fontSize="xl"
          fontWeight="700"
          color={HUD.textPrimary}
          mb={2}
        >
          Room not found
        </Text>
        <Text color={HUD.textSecondary} mb={5}>
          This draft room doesn't exist or has been deleted.
        </Text>
        <BackButton onClick={() => navigate('/blind-draft')}>Back to Dashboard</BackButton>
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
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3} align="center">
        <VStack align="flex-start" spacing={1}>
          <HStack spacing={3} align="center" flexWrap="wrap">
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontSize="2xl"
              fontWeight="700"
              lineHeight="1"
              letterSpacing="-0.01em"
              color={HUD.textPrimary}
            >
              {room.roomName}
            </Text>
            <HudChip mode={STATUS_MODE[room.status] ?? 'default'}>{room.status}</HudChip>
          </HStack>
          <Text
            fontFamily={HUD_FONT_MONO}
            fontSize="10px"
            color={HUD.textSecondary}
            textTransform="uppercase"
            letterSpacing="0.12em"
          >
            {room.draftFormat} draft · {room.players.length} players · {room.numberOfTeams} teams
            {userRole !== 'spectator' ? ` · You: ${userRole}` : ' · Spectating'}
          </Text>
        </VStack>
        <BackButton onClick={() => navigate('/blind-draft')}>← Dashboard</BackButton>
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
