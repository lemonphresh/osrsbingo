import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Skeleton,
  Flex,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { useNavigate } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import { useAuth } from '../../providers/AuthProvider';
import { GET_MY_DRAFT_ROOMS } from '../../graphql/draftOperations';
import usePageTitle from '../../hooks/usePageTitle';
import { isBlindDraftEnabled } from '../../config/featureFlags';
import { useEffect } from 'react';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

// Status → HudChip visual mode. Keeps the semantic feel without wiring
// per-status colors; everything that's "going on right now" is cyan,
// finished/revealed is still cyan but muted via default, lobby waiting
// is muted.
const STATUS_MODE = {
  LOBBY: 'default',
  DRAFTING: 'active',
  REVEALED: 'active',
  COMPLETED: 'default',
};

const HOW_STEPS = [
  { step: '01', label: 'Create a room', detail: 'Set format, teams, and paste RSNs' },
  { step: '02', label: 'Captains join', detail: 'Share the link, each captain claims a seat' },
  { step: '03', label: 'Draft by stats', detail: 'Pick players blind using EHP, EHB, boss KCs' },
  { step: '04', label: 'Reveal names', detail: 'Organizer reveals all RSNs at once when done' },
];

export default function DraftDashboard() {
  usePageTitle('Blind Draft');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isBlindDraftEnabled(user)) navigate('/');
  }, [user, navigate]);

  const { data, loading } = useQuery(GET_MY_DRAFT_ROOMS, { skip: !user });

  const rooms = data?.getMyDraftRooms ?? [];

  return (
    <Box flex="1" my="36px" maxW="900px" mx="auto" w="100%" px={4} py={8}>
      <HStack justify="space-between" mb={6} flexWrap="wrap" gap={3}>
        <VStack align="flex-start" spacing={2}>
          <HStack spacing={3} align="center">
            <Box
              w="6px"
              h="22px"
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
              Draft Rooms
            </Text>
          </HStack>
          <Text
            fontFamily={HUD_FONT_DISPLAY}
            fontSize="3xl"
            fontWeight="700"
            lineHeight="1"
            letterSpacing="-0.01em"
            color={HUD.textPrimary}
          >
            Blind Draft
          </Text>
          <Text color={HUD.textSecondary} fontSize="sm">
            Anonymized player draft rooms for fair team selection
          </Text>
        </VStack>
        <Button
          leftIcon={<AddIcon />}
          onClick={() => navigate('/blind-draft/create')}
          isDisabled={!user}
          bg={HUD.cyan}
          color={HUD.bgDeep}
          fontFamily={HUD_FONT_DISPLAY}
          fontWeight="700"
          fontSize="sm"
          textTransform="uppercase"
          letterSpacing="0.15em"
          h="44px"
          px={6}
          borderRadius="2px"
          boxShadow={`0 0 20px ${HUD.cyanGlow}, inset 0 0 0 1px ${HUD.cyan}`}
          _hover={{
            filter: 'brightness(1.1)',
            boxShadow: `0 0 28px ${HUD.cyan}, inset 0 0 0 1px ${HUD.cyan}`,
          }}
          _active={{ filter: 'brightness(0.95)' }}
          _disabled={{
            bg: HUD.bgElevated,
            color: HUD.textMuted,
            boxShadow: 'none',
            cursor: 'not-allowed',
            _hover: {},
          }}
        >
          New Room
        </Button>
      </HStack>

      <Box
        bg={HUD.bgSurface}
        borderRadius="2px"
        p={5}
        mb={6}
        border="1px solid"
        borderColor={HUD.border}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '3px',
          bg: HUD.cyan,
          boxShadow: `0 0 10px ${HUD.cyanGlow}`,
        }}
      >
        <Text fontSize="sm" color={HUD.textSecondary} mb={4} lineHeight="1.65">
          <Text as="span" fontWeight="600" color={HUD.textPrimary}>
            How it works:
          </Text>{' '}
          As an organizer, you paste in a list of RSNs and the tool anonymizes them. Captains draft
          player cards by stats alone, with no names visible until the draft ends.
        </Text>
        <Flex flexDirection={['column', 'row']} gap={4} flexWrap="wrap">
          {HOW_STEPS.map(({ step, label, detail }) => (
            <HStack
              key={step}
              align="flex-start"
              spacing={3}
              flex={['1 1 100%', '1 1 180px']}
              minW={0}
            >
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="11px"
                fontWeight="600"
                color={HUD.cyan}
                flexShrink={0}
                mt="2px"
                w="22px"
              >
                {step}
              </Text>
              <VStack align="flex-start" spacing={0.5} minW={0}>
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="10px"
                  fontWeight="500"
                  color={HUD.textPrimary}
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                >
                  {label}
                </Text>
                <Text fontSize="xs" color={HUD.textSecondary} lineHeight="1.5">
                  {detail}
                </Text>
              </VStack>
            </HStack>
          ))}
        </Flex>
      </Box>

      {!user && (
        <Box
          bg={HUD.bgSurface}
          borderRadius="2px"
          p={6}
          textAlign="center"
          border="1px solid"
          borderColor={HUD.border}
        >
          <Text color={HUD.textSecondary}>Log in to create and manage draft rooms.</Text>
        </Box>
      )}

      {user && loading && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} h="120px" borderRadius="2px" startColor={HUD.bgSurface} endColor={HUD.bgElevated} />
          ))}
        </SimpleGrid>
      )}

      {user && !loading && rooms.length === 0 && (
        <Box
          bg={HUD.bgSurface}
          borderRadius="2px"
          p={8}
          textAlign="center"
          border="1px solid"
          borderColor={HUD.border}
        >
          <Text
            fontFamily={HUD_FONT_DISPLAY}
            fontWeight="600"
            fontSize="lg"
            color={HUD.textPrimary}
            mb={1}
          >
            No draft rooms yet
          </Text>
          <Text color={HUD.textSecondary} fontSize="sm" mb={5}>
            Create a room to get started with anonymous player drafts.
          </Text>
          <Button
            onClick={() => navigate('/blind-draft/create')}
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
            Create Your First Room
          </Button>
        </Box>
      )}

      {user && !loading && rooms.length > 0 && (
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={4}>
          {rooms.map((room) => (
            <Box
              key={room.roomId}
              bg={HUD.bgSurface}
              border="1px solid"
              borderColor={HUD.border}
              borderRadius="2px"
              p={4}
              cursor="pointer"
              onClick={() => navigate(`/blind-draft/${room.roomId}`)}
              _hover={{
                borderColor: HUD.cyan,
                boxShadow: `0 0 14px ${HUD.cyanGlow}`,
                transform: 'translateY(-1px)',
              }}
              transition="all 0.15s ease"
            >
              <HStack justify="space-between" mb={3} align="start">
                <Text
                  fontFamily={HUD_FONT_DISPLAY}
                  fontWeight="600"
                  fontSize="md"
                  color={HUD.textPrimary}
                  noOfLines={1}
                  flex={1}
                >
                  {room.roomName}
                </Text>
                <HudChip mode={STATUS_MODE[room.status] ?? 'default'}>
                  {room.status}
                </HudChip>
              </HStack>
              <HStack spacing={1.5} flexWrap="wrap" mb={3}>
                <HudChip>{room.draftFormat}</HudChip>
                <HudChip>{room.numberOfTeams} teams</HudChip>
              </HStack>
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="10px"
                color={HUD.textMuted}
                textTransform="uppercase"
                letterSpacing="0.1em"
              >
                {new Date(room.createdAt).toLocaleDateString()}
              </Text>
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
}
