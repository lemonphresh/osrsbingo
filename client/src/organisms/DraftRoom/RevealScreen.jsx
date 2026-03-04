import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { REVEAL_NAMES } from '../../graphql/draftOperations';
import DraftBoard from './DraftBoard';
import { useToastContext } from '../../providers/ToastProvider';
import { keyframes } from '@emotion/react';

const flashAnimation = keyframes`
  0%   { background-color: transparent; }
  20%  { background-color: rgba(159, 122, 234, 0.3); }
  100% { background-color: transparent; }
`;

export default function RevealScreen({ room, userRole }) {
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const isOrganizer = userRole === 'organizer';
  const revealed = room.status === 'REVEALED';

  const [revealNames, { loading }] = useMutation(REVEAL_NAMES, {
    onError: (e) => showToast(`Reveal failed: ${e.message}`, 'error'),
  });

  async function handleReveal() {
    await revealNames({ variables: { roomId: room.roomId } });
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* pre-reveal: organizer sees the big button */}
      {!revealed && isOrganizer && (
        <Box
          bg="gray.700"
          borderRadius="xl"
          p={8}
          textAlign="center"
          border="2px solid"
          borderColor="purple.400"
        >
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Draft Complete!
          </Text>
          <Text color="gray.400" mb={6}>
            All {room.players.length} players have been drafted across {room.numberOfTeams} teams.
            Ready to reveal the real names?
          </Text>
          <Button colorScheme="purple" size="lg" onClick={handleReveal} isLoading={loading} px={10}>
            Reveal Names
          </Button>
        </Box>
      )}

      {/* pre-reveal: spectators/captains waiting */}
      {!revealed && !isOrganizer && (
        <Box textAlign="center" py={8}>
          <Text fontSize="xl" fontWeight="bold" mb={2}>
            Draft Complete!
          </Text>
          <Text color="gray.400">Waiting for the organizer to reveal names...</Text>
        </Box>
      )}

      {/* post-reveal */}
      {revealed && (
        <Box padding="16px" borderRadius="12px" animation={`${flashAnimation} 1s ease-out`}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text fontSize="2xl" fontWeight="black">
                Names Revealed!
              </Text>
              <Button
                size="sm"
                colorScheme="purple"
                variant="outline"
                onClick={() => navigate(`/blind-draft/${room.roomId}/results`)}
              >
                View Full Results
              </Button>
            </HStack>
            <Text color="gray.400" fontSize="sm">
              Final team assignments with real RSNs:
            </Text>
            <DraftBoard room={room} currentTeamIndex={null} />
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
