import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Skeleton,
  Button,
  useClipboard,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_DRAFT_ROOM } from '../../graphql/draftOperations';
import PlayerCard from '../../organisms/DraftRoom/PlayerCard';
import usePageTitle from '../../hooks/usePageTitle';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

export default function DraftResultsPage() {
  usePageTitle('Draft Results');
  const { roomId } = useParams();
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
        <Skeleton h="200px" borderRadius="2px" startColor={HUD.bgSurface} endColor={HUD.bgElevated} />
      </Box>
    );
  }

  if (error || !data?.getDraftRoom) {
    return (
      <Box maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text
          fontFamily={HUD_FONT_DISPLAY}
          fontSize="xl"
          fontWeight="700"
          color={HUD.textPrimary}
          mb={2}
        >
          Results not available
        </Text>
        <Text color={HUD.textSecondary}>
          This room doesn't exist or results haven't been revealed yet.
        </Text>
      </Box>
    );
  }

  const room = data.getDraftRoom;
  const revealed = room.status === 'REVEALED';

  if (!revealed) {
    return (
      <Box my="48px" maxW="900px" mx="auto" px={4} py={8} textAlign="center">
        <Text
          fontFamily={HUD_FONT_DISPLAY}
          fontSize="xl"
          fontWeight="700"
          color={HUD.textPrimary}
          mb={2}
        >
          Results not yet revealed
        </Text>
        <Text color={HUD.textSecondary} mb={5}>
          The organizer hasn't revealed names yet.
        </Text>
        <Button
          onClick={() => navigate(`/blind-draft/${roomId}`)}
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
          h="34px"
          px={5}
          _hover={{ bg: HUD.cyanGlow, boxShadow: `0 0 12px ${HUD.cyanGlow}` }}
        >
          Go to Draft Room
        </Button>
      </Box>
    );
  }

  return (
    <Box my="48px" maxW="1100px" mx="auto" px={4} py={8}>
      {/* Header */}
      <VStack align="flex-start" spacing={2} mb={6}>
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
            Draft Results
          </Text>
        </HStack>
        <HStack flexWrap="wrap" gap={3} align="center">
          <Text
            fontFamily={HUD_FONT_DISPLAY}
            fontSize="3xl"
            fontWeight="700"
            lineHeight="1"
            letterSpacing="-0.01em"
            color={HUD.textPrimary}
          >
            {room.roomName}
          </Text>
          <HudChip mode="active">Results</HudChip>
        </HStack>
        <HStack spacing={1.5} flexWrap="wrap" mt={1}>
          <HudChip>{room.draftFormat} Draft</HudChip>
          <HudChip>{room.players.length} Players</HudChip>
          <HudChip>{room.numberOfTeams} Teams</HudChip>
        </HStack>
      </VStack>

      {/* Share */}
      <HStack mb={8} spacing={3}>
        <Text
          fontFamily={HUD_FONT_MONO}
          fontSize="10px"
          color={HUD.textSecondary}
          textTransform="uppercase"
          letterSpacing="0.15em"
        >
          Share these results:
        </Text>
        <Button
          size="xs"
          onClick={onCopy}
          bg="transparent"
          color={hasCopied ? HUD.cyan : HUD.textSecondary}
          borderWidth="1px"
          borderStyle="solid"
          borderColor={hasCopied ? HUD.cyan : HUD.border}
          borderRadius="2px"
          fontFamily={HUD_FONT_MONO}
          fontSize="10px"
          fontWeight="500"
          textTransform="uppercase"
          letterSpacing="0.1em"
          h="26px"
          px={3}
          _hover={{
            borderColor: HUD.cyan,
            color: HUD.cyan,
            bg: HUD.cyanGlow,
          }}
        >
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
              bg={HUD.bgSurface}
              border="1px solid"
              borderColor={HUD.border}
              borderRadius="2px"
              p={4}
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                bg: HUD.cyan,
                boxShadow: `0 0 10px ${HUD.cyanGlow}`,
              }}
            >
              <Text
                fontFamily={HUD_FONT_DISPLAY}
                fontWeight="700"
                fontSize="lg"
                color={HUD.textPrimary}
                mb={3}
                mt={1}
              >
                {team.name}
              </Text>
              <VStack spacing={2} align="stretch">
                {drafted.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
                {drafted.length === 0 && (
                  <Text fontSize="sm" color={HUD.textMuted} fontStyle="italic">
                    No players drafted
                  </Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </SimpleGrid>

      <Box mt={8} textAlign="center">
        <Button
          onClick={() => navigate(`/blind-draft/${roomId}`)}
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
          px={4}
          _hover={{ bg: HUD.bgElevated, borderColor: HUD.borderBright, color: HUD.textPrimary }}
        >
          ← Back to Draft Room
        </Button>
      </Box>
    </Box>
  );
}
