import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { REVEAL_NAMES } from '../../graphql/draftOperations';
import DraftBoard from './DraftBoard';
import { useToastContext } from '../../providers/ToastProvider';
import { keyframes } from '@emotion/react';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';

const flashAnimation = keyframes`
  0%   { background-color: transparent; box-shadow: 0 0 0 rgba(0, 217, 255, 0); }
  25%  { background-color: rgba(0, 217, 255, 0.08); box-shadow: 0 0 40px rgba(0, 217, 255, 0.25); }
  100% { background-color: transparent; box-shadow: 0 0 0 rgba(0, 217, 255, 0); }
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
          bg={HUD.bgSurface}
          borderRadius="2px"
          p={8}
          textAlign="center"
          border="1px solid"
          borderColor={HUD.cyan}
          position="relative"
          boxShadow={`0 0 24px ${HUD.cyanGlow}`}
        >
          <Text
            fontFamily={HUD_FONT_MONO}
            fontSize="10px"
            color={HUD.cyan}
            textTransform="uppercase"
            letterSpacing="0.3em"
            mb={3}
          >
            All Picks In
          </Text>
          <Text
            fontFamily={HUD_FONT_DISPLAY}
            fontSize="2xl"
            fontWeight="700"
            color={HUD.textPrimary}
            mb={2}
            letterSpacing="-0.01em"
          >
            Draft Complete!
          </Text>
          <Text color={HUD.textSecondary} mb={6}>
            All {room.players.length} players have been drafted across {room.numberOfTeams} teams.
            Ready to reveal the real names?
          </Text>
          <Button
            size="lg"
            onClick={handleReveal}
            isLoading={loading}
            px={10}
            h="56px"
            bg={HUD.cyan}
            color={HUD.bgDeep}
            fontFamily={HUD_FONT_DISPLAY}
            fontWeight="700"
            fontSize="md"
            textTransform="uppercase"
            letterSpacing="0.15em"
            borderRadius="2px"
            boxShadow={`0 0 24px ${HUD.cyanGlow}, inset 0 0 0 1px ${HUD.cyan}`}
            _hover={{
              filter: 'brightness(1.1)',
              boxShadow: `0 0 32px ${HUD.cyan}, inset 0 0 0 1px ${HUD.cyan}`,
            }}
            _active={{ filter: 'brightness(0.95)' }}
          >
            ▸ Reveal Names
          </Button>
        </Box>
      )}

      {/* pre-reveal: spectators/captains waiting */}
      {!revealed && !isOrganizer && (
        <Box textAlign="center" py={8}>
          <Text
            fontFamily={HUD_FONT_DISPLAY}
            fontSize="2xl"
            fontWeight="700"
            color={HUD.textPrimary}
            mb={2}
          >
            Draft Complete!
          </Text>
          <Text color={HUD.textSecondary}>Waiting for the organizer to reveal names...</Text>
        </Box>
      )}

      {/* post-reveal */}
      {revealed && (
        <Box padding="16px" borderRadius="2px" animation={`${flashAnimation} 1.4s ease-out`}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" flexWrap="wrap" gap={2} align="baseline">
              <Text
                fontFamily={HUD_FONT_DISPLAY}
                fontSize="2xl"
                fontWeight="700"
                color={HUD.textPrimary}
                letterSpacing="-0.01em"
              >
                Names Revealed!
              </Text>
              <Button
                size="sm"
                onClick={() => navigate(`/blind-draft/${room.roomId}/results`)}
                bg="transparent"
                color={HUD.cyan}
                borderWidth="1px"
                borderStyle="solid"
                borderColor={HUD.cyan}
                borderRadius="2px"
                fontFamily={HUD_FONT_MONO}
                fontSize="11px"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.1em"
                h="30px"
                px={3}
                _hover={{ bg: HUD.cyanGlow, boxShadow: `0 0 12px ${HUD.cyanGlow}` }}
              >
                View Full Results
              </Button>
            </HStack>
            <Text color={HUD.textSecondary} fontSize="sm">
              Final team assignments with real RSNs:
            </Text>
            <DraftBoard room={room} currentTeamIndex={null} />
          </VStack>
        </Box>
      )}
    </VStack>
  );
}
