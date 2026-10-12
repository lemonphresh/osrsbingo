import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
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
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

const IS_DEV =
  process.env.NODE_ENV !== 'production' || process.env.REACT_APP_ENV === 'staging';

// Compact mono-styled section label used throughout the HUD surfaces.
function SectionLabel({ children, ...rest }) {
  return (
    <Text
      fontFamily={HUD_FONT_MONO}
      fontSize="10px"
      color={HUD.textSecondary}
      textTransform="uppercase"
      letterSpacing="0.15em"
      {...rest}
    >
      {children}
    </Text>
  );
}

export default function DraftLobby({ room, userRole, userId }) {
  const { showToast } = useToastContext();
  const [pinInput, setPinInput] = useState('');
  const [devFilling, setDevFilling] = useState(false);

  const roomUrl = `${window.location.origin}/blind-draft/${room.roomId}`;
  const { hasCopied, onCopy } = useClipboard(roomUrl);

  const [joinRoom, { loading: joining }] = useMutation(JOIN_DRAFT_ROOM_AS_CAPTAIN, {
    onError: (e) => showToast(`Failed to join: ${e.message}`, 'error'),
    update(cache, { data }) {
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
      <Box
        bg={HUD.bgSurface}
        border="1px solid"
        borderColor={HUD.border}
        borderRadius="2px"
        p={4}
      >
        <SectionLabel mb={2}>Share this link with captains</SectionLabel>
        <HStack>
          <Input
            value={roomUrl}
            isReadOnly
            size="sm"
            fontFamily={HUD_FONT_MONO}
            fontSize="xs"
            bg={HUD.bgRecessed}
            borderColor={HUD.border}
            color={HUD.textPrimary}
            _hover={{ borderColor: HUD.borderBright }}
            _focus={{ borderColor: HUD.cyan, boxShadow: `0 0 0 1px ${HUD.cyan}` }}
          />
          <Button
            size="sm"
            onClick={onCopy}
            flexShrink={0}
            bg={hasCopied ? HUD.cyanGlow : 'transparent'}
            color={hasCopied ? HUD.cyan : HUD.textSecondary}
            borderWidth="1px"
            borderStyle="solid"
            borderColor={hasCopied ? HUD.cyan : HUD.border}
            borderRadius="2px"
            fontFamily={HUD_FONT_MONO}
            fontSize="11px"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.1em"
            h="30px"
            px={3}
            _hover={{ borderColor: HUD.cyan, color: HUD.cyan, bg: HUD.cyanGlow }}
          >
            {hasCopied ? 'Copied!' : 'Copy'}
          </Button>
        </HStack>
      </Box>

      {/* PIN input (if room has a PIN and user hasn't joined yet) */}
      {!myTeam && !isOrganizer && (
        <Box>
          <SectionLabel mb={1.5}>Room PIN (if required)</SectionLabel>
          <Input
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            type="password"
            placeholder="Enter PIN..."
            size="sm"
            maxW="200px"
            fontFamily={HUD_FONT_MONO}
            bg={HUD.bgRecessed}
            borderColor={HUD.border}
            color={HUD.textPrimary}
            _placeholder={{ color: HUD.textMuted }}
            _hover={{ borderColor: HUD.borderBright }}
            _focus={{ borderColor: HUD.cyan, boxShadow: `0 0 0 1px ${HUD.cyan}` }}
          />
        </Box>
      )}

      {/* team slots */}
      <Box>
        <HStack justify="space-between" mb={3} align="baseline" flexWrap="wrap" gap={2}>
          <SectionLabel>Captain Seats</SectionLabel>
          <Text
            fontFamily={HUD_FONT_MONO}
            fontSize="10px"
            color={HUD.cyan}
            letterSpacing="0.1em"
          >
            {room.teams.filter((t) => t.captainJoined).length}/{room.numberOfTeams} joined
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={3}>
          {room.teams.map((team) => {
            const isMe = team.captainUserId === userId;
            const canClaim = !team.captainJoined && !myTeam && !isOrganizer;

            return (
              <Box
                key={team.index}
                bg={HUD.bgSurface}
                border="1px solid"
                borderColor={team.captainJoined ? HUD.cyan : HUD.border}
                borderRadius="2px"
                p={3}
                position="relative"
                boxShadow={team.captainJoined ? `0 0 14px ${HUD.cyanGlow}` : 'none'}
              >
                <HStack justify="space-between" mb={2}>
                  <Text
                    fontFamily={HUD_FONT_DISPLAY}
                    fontWeight="600"
                    fontSize="sm"
                    color={HUD.textPrimary}
                  >
                    {team.name}
                  </Text>
                  <HudChip mode={team.captainJoined ? 'active' : 'default'}>
                    {team.captainJoined ? (isMe ? 'You' : 'Joined') : 'Empty'}
                  </HudChip>
                </HStack>

                {canClaim && (
                  <Button
                    size="xs"
                    w="100%"
                    onClick={() => handleClaim(team.index)}
                    isLoading={joining}
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
                    h="28px"
                    _hover={{ bg: HUD.cyanGlow, boxShadow: `0 0 10px ${HUD.cyanGlow}` }}
                  >
                    Claim Seat
                  </Button>
                )}
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      <Divider borderColor={HUD.border} />

      {/* draft info */}
      <HStack spacing={1.5} flexWrap="wrap">
        <HudChip>{room.draftFormat} Draft</HudChip>
        <HudChip>{room.players.length} Players</HudChip>
        <HudChip>{room.pickTimeSeconds}s per pick</HudChip>
      </HStack>

      {/* start button (organizer only) */}
      {isOrganizer && (
        <Tooltip
          label={!allCaptainsJoined ? 'Waiting for all captains to claim their seats' : ''}
          isDisabled={allCaptainsJoined}
        >
          <Button
            size="lg"
            onClick={handleStart}
            isLoading={starting}
            isDisabled={!allCaptainsJoined}
            alignSelf="flex-start"
            h="56px"
            px={8}
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
            _disabled={{
              bg: HUD.bgElevated,
              color: HUD.textMuted,
              boxShadow: 'none',
              cursor: 'not-allowed',
              _hover: {},
            }}
          >
            ▸ Start Draft
          </Button>
        </Tooltip>
      )}

      {!isOrganizer && !myTeam && (
        <Text fontSize="sm" color={HUD.textSecondary}>
          Claim a captain seat above to participate in the draft.
        </Text>
      )}

      {!isOrganizer && myTeam && (
        <Text fontSize="sm" color={HUD.cyan}>
          You're in as captain of <strong>{myTeam.name}</strong>. Waiting for the organizer to start
          the draft.
        </Text>
      )}

      {isOrganizer && !allCaptainsJoined && (
        <Text fontSize="sm" color={HUD.textSecondary}>
          Waiting for all captains to join before you can start.
        </Text>
      )}

      {/* dev-only: auto-fill unclaimed captain seats for local testing */}
      {IS_DEV && isOrganizer && !allCaptainsJoined && (
        <Box
          border="1px dashed"
          borderColor={HUD.amberDim}
          borderRadius="2px"
          p={3}
          bg="rgba(255, 184, 77, 0.06)"
        >
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={0.5}>
              <Text
                fontFamily={HUD_FONT_MONO}
                fontSize="10px"
                fontWeight="500"
                color={HUD.amber}
                textTransform="uppercase"
                letterSpacing="0.2em"
              >
                Dev Tools
              </Text>
              <Text fontSize="xs" color={HUD.amberDim}>
                Auto-fill {room.teams.filter((t) => !t.captainJoined).length} unclaimed seat(s) so
                you can start the draft alone.
              </Text>
            </VStack>
            <Button
              size="sm"
              onClick={handleDevFillCaptains}
              isLoading={devFilling}
              loadingText="Filling..."
              bg="transparent"
              color={HUD.amber}
              borderWidth="1px"
              borderStyle="solid"
              borderColor={HUD.amberDim}
              borderRadius="2px"
              fontFamily={HUD_FONT_MONO}
              fontSize="11px"
              fontWeight="500"
              textTransform="uppercase"
              letterSpacing="0.1em"
              h="30px"
              _hover={{ bg: 'rgba(255,184,77,0.08)', borderColor: HUD.amber }}
            >
              Auto-fill Captains
            </Button>
          </HStack>
        </Box>
      )}
    </VStack>
  );
}
