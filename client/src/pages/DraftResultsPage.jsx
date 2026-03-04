import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  SimpleGrid,
  Skeleton,
  useColorMode,
  Button,
  useClipboard,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_DRAFT_ROOM } from '../graphql/draftOperations';
import PlayerCard from '../organisms/DraftRoom/PlayerCard';
import usePageTitle from '../hooks/usePageTitle';

export default function DraftResultsPage() {
  usePageTitle('Draft Results');
  const { roomId } = useParams();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const navigate = useNavigate();

  const { data, loading, error } = useQuery(GET_DRAFT_ROOM, {
    variables: { roomId },
    fetchPolicy: 'network-only',
  });

  const resultsUrl = window.location.href;
  const { hasCopied, onCopy } = useClipboard(resultsUrl);

  if (loading) {
    return (
      <Box maxW="900px" mx="auto" px={4} py={8}>
        <Skeleton h="200px" borderRadius="lg" />
      </Box>
    );
  }

  if (error || !data?.getDraftRoom) {
    return (
      <Box maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" mb={2}>Results not available</Text>
        <Text color="gray.400">This room doesn't exist or results haven't been revealed yet.</Text>
      </Box>
    );
  }

  const room = data.getDraftRoom;
  const revealed = room.status === 'REVEALED';

  if (!revealed) {
    return (
      <Box maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text fontSize="xl" fontWeight="bold" mb={2}>Results not yet revealed</Text>
        <Text color="gray.400" mb={4}>The organizer hasn't revealed names yet.</Text>
        <Button colorScheme="purple" onClick={() => navigate(`/blind-draft/${roomId}`)}>
          Go to Draft Room
        </Button>
      </Box>
    );
  }

  return (
    <Box maxW="1100px" mx="auto" px={4} py={8}>
      {/* Header */}
      <VStack align="flex-start" spacing={1} mb={6}>
        <HStack flexWrap="wrap" gap={2}>
          <Text fontSize="2xl" fontWeight="black">{room.roomName}</Text>
          <Badge colorScheme="green">Results</Badge>
        </HStack>
        <HStack spacing={2} flexWrap="wrap">
          <Badge variant="outline">{room.draftFormat} Draft</Badge>
          <Badge variant="outline">{room.players.length} Players</Badge>
          <Badge variant="outline">{room.numberOfTeams} Teams</Badge>
        </HStack>
      </VStack>

      {/* Share */}
      <HStack mb={8}>
        <Text fontSize="sm" color="gray.400">Share these results:</Text>
        <Button size="xs" colorScheme="purple" variant="outline" onClick={onCopy}>
          {hasCopied ? 'Copied!' : 'Copy Link'}
        </Button>
      </HStack>

      {/* Team results */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: Math.min(room.numberOfTeams, 3) }} spacing={5}>
        {room.teams.map((team) => {
          const drafted = room.players
            .filter((p) => p.teamIndex === team.index)
            .sort((a, b) => (a.pickOrder ?? 0) - (b.pickOrder ?? 0));

          return (
            <Box
              key={team.index}
              bg={isDark ? '#2D3748' : 'white'}
              border="1px solid"
              borderColor={isDark ? 'gray.600' : 'gray.200'}
              borderRadius="xl"
              p={4}
            >
              <Text fontWeight="black" fontSize="lg" mb={3}>{team.name}</Text>
              <VStack spacing={2} align="stretch">
                {drafted.map((player, i) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    statCategories={room.statCategories}
                  />
                ))}
                {drafted.length === 0 && (
                  <Text fontSize="sm" color="gray.500" fontStyle="italic">No players drafted</Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>

      <Box mt={8} textAlign="center">
        <Button variant="ghost" onClick={() => navigate(`/blind-draft/${roomId}`)}>
          ← Back to Draft Room
        </Button>
      </Box>
    </Box>
  );
}
