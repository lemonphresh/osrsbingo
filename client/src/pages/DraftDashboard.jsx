import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  SimpleGrid,
  Skeleton,
  useColorMode,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../providers/AuthProvider';
import { GET_MY_DRAFT_ROOMS } from '../graphql/draftOperations';
import usePageTitle from '../hooks/usePageTitle';

const STATUS_COLORS = {
  LOBBY: 'gray',
  DRAFTING: 'purple',
  REVEALED: 'green',
  COMPLETED: 'blue',
};

export default function DraftDashboard() {
  usePageTitle('Blind Draft');
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, loading } = useQuery(GET_MY_DRAFT_ROOMS, { skip: !user });

  const rooms = data?.getMyDraftRooms ?? [];

  return (
    <Box maxW="900px" mx="auto" px={4} py={8}>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <VStack align="flex-start" spacing={0}>
          <Text fontSize="2xl" fontWeight="black">Blind Draft</Text>
          <Text color="gray.400" fontSize="sm">
            Anonymized player draft rooms for fair team selection
          </Text>
        </VStack>
        <Button
          leftIcon={<AddIcon />}
          colorScheme="purple"
          onClick={() => navigate('/blind-draft/create')}
          isDisabled={!user}
        >
          New Room
        </Button>
      </HStack>

      {!user && (
        <Box
          bg={isDark ? '#2D3748' : 'gray.50'}
          borderRadius="lg"
          p={6}
          textAlign="center"
          border="1px solid"
          borderColor={isDark ? 'gray.600' : 'gray.200'}
        >
          <Text color="gray.400">Log in to create and manage draft rooms.</Text>
        </Box>
      )}

      {user && loading && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} h="120px" borderRadius="lg" />
          ))}
        </SimpleGrid>
      )}

      {user && !loading && rooms.length === 0 && (
        <Box
          bg={isDark ? '#2D3748' : 'gray.50'}
          borderRadius="lg"
          p={8}
          textAlign="center"
          border="1px solid"
          borderColor={isDark ? 'gray.600' : 'gray.200'}
        >
          <Text fontWeight="semibold" mb={1}>No draft rooms yet</Text>
          <Text color="gray.400" fontSize="sm" mb={4}>
            Create a room to get started with anonymous player drafts.
          </Text>
          <Button colorScheme="purple" onClick={() => navigate('/blind-draft/create')}>
            Create Your First Room
          </Button>
        </Box>
      )}

      {user && !loading && rooms.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {rooms.map((room) => (
            <Box
              key={room.roomId}
              bg={isDark ? '#2D3748' : 'white'}
              border="1px solid"
              borderColor={isDark ? 'gray.600' : 'gray.200'}
              borderRadius="lg"
              p={4}
              cursor="pointer"
              onClick={() => navigate(`/blind-draft/${room.roomId}`)}
              _hover={{ borderColor: 'purple.400', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
            >
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold" noOfLines={1} flex={1}>{room.roomName}</Text>
                <Badge colorScheme={STATUS_COLORS[room.status] ?? 'gray'} fontSize="10px" flexShrink={0}>
                  {room.status}
                </Badge>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <Badge variant="outline" fontSize="9px">{room.draftFormat}</Badge>
                <Badge variant="outline" fontSize="9px">{room.numberOfTeams} teams</Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500" mt={2}>
                {new Date(room.createdAt).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
