import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  SimpleGrid,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { PLACE_BID } from '../../graphql/draftOperations';
import PlayerCard from './PlayerCard';
import DraftBoard from './DraftBoard';
import TimerBar from './TimerBar';
import { useToastContext } from '../../providers/ToastProvider';
import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../../atoms/hudTheme';
import HudChip from '../../atoms/HudChip';

const IS_DEV = process.env.NODE_ENV !== 'production';

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

// NumberInput styled for HUD surfaces — thin cyan accent on focus.
const hudNumberInputStyles = {
  bg: HUD.bgRecessed,
  borderColor: HUD.border,
  color: HUD.textPrimary,
  _hover: { borderColor: HUD.borderBright },
  _focus: { borderColor: HUD.cyan, boxShadow: `0 0 0 1px ${HUD.cyan}` },
  fontFamily: HUD_FONT_MONO,
};

export default function AuctionDraft({ room, userRole, userId, captainToken }) {
  const { showToast } = useToastContext();

  const auctionState = room.auctionState ?? {};
  const currentPlayer = room.players.find(
    (p) => String(p.id) === String(auctionState.currentPlayerId)
  );
  const bids = auctionState.bids ?? {};

  const isOrganizer = userRole === 'organizer';
  const myTeamIndex =
    typeof userRole === 'string' && userRole.startsWith('captain:')
      ? parseInt(userRole.split(':')[1], 10)
      : null;

  const myTeam = myTeamIndex !== null ? room.teams.find((t) => t.index === myTeamIndex) : null;
  const myBudget = myTeam?.budget ?? 100;
  const iHaveBid = myTeamIndex !== null && bids[myTeamIndex] !== undefined;

  const [bidAmount, setBidAmount] = useState(0);
  const [devBids, setDevBids] = useState({});
  const [devBidding, setDevBidding] = useState(false);

  const [placeBid, { loading }] = useMutation(PLACE_BID, {
    onError: (e) => showToast(`Bid failed: ${e.message}`, 'error'),
  });

  async function handleBid() {
    if (myTeamIndex === null) return;
    await placeBid({
      variables: {
        roomId: room.roomId,
        teamIndex: myTeamIndex,
        amount: bidAmount,
        captainToken: captainToken ?? undefined,
      },
    });
  }

  const totalTeams = room.teams.length;
  const bidCount = Object.keys(bids).length;
  const unbidTeams = room.teams.filter((t) => bids[t.index] === undefined);

  async function handleDevPassAll() {
    if (!IS_DEV || !isOrganizer) return;
    setDevBidding(true);
    for (const team of unbidTeams) {
      const amount = devBids[team.index] ?? 0;
      // eslint-disable-next-line no-await-in-loop
      await placeBid({ variables: { roomId: room.roomId, teamIndex: team.index, amount } });
    }
    setDevBidding(false);
    setDevBids({});
  }

  return (
    <VStack spacing={5} align="stretch">
      {/* auction header */}
      <Box
        bg={HUD.bgSurface}
        border="1px solid"
        borderColor={HUD.amber}
        borderRadius="2px"
        p={4}
        boxShadow="0 0 18px rgba(255, 184, 77, 0.18)"
      >
        <HStack justify="space-between" mb={3} flexWrap="wrap" gap={3} align="start">
          <VStack align="flex-start" spacing={1}>
            <SectionLabel color={HUD.amber}>Auction Round</SectionLabel>
            <Text
              fontFamily={HUD_FONT_DISPLAY}
              fontWeight="700"
              fontSize="xl"
              color={HUD.textPrimary}
              lineHeight="1.1"
            >
              Up for bid
            </Text>
          </VStack>
          <HStack spacing={1.5} flexWrap="wrap">
            <HudChip mode="warn">AUCTION</HudChip>
            <HudChip>
              {bidCount}/{totalTeams} bids in
            </HudChip>
          </HStack>
        </HStack>
        <TimerBar startedAt={room.currentPickStartedAt} totalSeconds={room.pickTimeSeconds} />
      </Box>

      {/* current auction player */}
      {currentPlayer && (
        <Box m="0 auto" maxW="200px">
          <PlayerCard player={currentPlayer} isAuctionTarget />
        </Box>
      )}

      {/* bid UI */}
      {myTeam && !iHaveBid && (
        <Box
          bg={HUD.bgSurface}
          borderRadius="2px"
          p={4}
          border="1px solid"
          borderColor={HUD.border}
        >
          <SectionLabel mb={1}>Your bid</SectionLabel>
          <Text fontSize="xs" color={HUD.textSecondary} mb={3}>
            Budget remaining:{' '}
            <Text as="span" color={HUD.cyan} fontFamily={HUD_FONT_MONO} fontWeight="600">
              {myBudget} pts
            </Text>
          </Text>
          <HStack>
            <NumberInput
              min={0}
              max={myBudget}
              value={bidAmount}
              onChange={(_, v) => setBidAmount(isNaN(v) ? 0 : v)}
              size="sm"
              maxW="120px"
            >
              <NumberInputField {...hudNumberInputStyles} />
              <NumberInputStepper>
                <NumberIncrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                <NumberDecrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
              </NumberInputStepper>
            </NumberInput>
            <Button
              size="sm"
              onClick={handleBid}
              isLoading={loading}
              bg={HUD.cyan}
              color={HUD.bgDeep}
              fontFamily={HUD_FONT_MONO}
              fontWeight="600"
              fontSize="11px"
              textTransform="uppercase"
              letterSpacing="0.1em"
              h="32px"
              px={4}
              borderRadius="2px"
              _hover={{ filter: 'brightness(1.1)', boxShadow: `0 0 14px ${HUD.cyanGlow}` }}
              _active={{ filter: 'brightness(0.95)' }}
            >
              Submit Bid
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setBidAmount(0);
                handleBid();
              }}
              isLoading={loading}
              bg="transparent"
              color={HUD.textMuted}
              fontFamily={HUD_FONT_MONO}
              fontWeight="500"
              fontSize="11px"
              textTransform="uppercase"
              letterSpacing="0.1em"
              h="32px"
              _hover={{ color: HUD.textPrimary, bg: HUD.bgElevated }}
            >
              Pass
            </Button>
          </HStack>
        </Box>
      )}

      {iHaveBid && (
        <Text
          fontFamily={HUD_FONT_MONO}
          fontSize="11px"
          color={HUD.cyan}
          fontWeight="500"
          textTransform="uppercase"
          letterSpacing="0.12em"
        >
          ▸ Your bid: {bids[myTeamIndex]} pts — waiting for other captains...
        </Text>
      )}

      {/* per-team bid status */}
      <Box>
        <SectionLabel mb={2}>Bid Status</SectionLabel>
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
          {room.teams.map((team) => {
            const hasBid = bids[team.index] !== undefined;
            return (
              <Box
                key={team.index}
                bg={HUD.bgSurface}
                border="1px solid"
                borderColor={hasBid ? HUD.cyan : HUD.border}
                borderRadius="2px"
                p={2}
                boxShadow={hasBid ? `0 0 10px ${HUD.cyanGlow}` : 'none'}
              >
                <Text
                  fontFamily={HUD_FONT_DISPLAY}
                  fontSize="xs"
                  fontWeight="600"
                  color={HUD.textPrimary}
                  noOfLines={1}
                >
                  {team.name}
                </Text>
                <HStack mt={1.5}>
                  <HudChip mode={hasBid ? 'active' : 'default'} fontSize="9px">
                    {hasBid ? 'Bid in' : 'Waiting'}
                  </HudChip>
                  <Text
                    fontFamily={HUD_FONT_MONO}
                    fontSize="10px"
                    color={HUD.textMuted}
                    letterSpacing="0.1em"
                  >
                    {team.budget ?? 100} pts
                  </Text>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* dev-only: bid on behalf of unbid teams */}
      {IS_DEV && isOrganizer && unbidTeams.length > 0 && (
        <Box
          border="1px dashed"
          borderColor={HUD.amberDim}
          borderRadius="2px"
          p={3}
          bg="rgba(255, 184, 77, 0.06)"
        >
          <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
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
                Submit bids for {unbidTeams.length} team(s) still waiting. Set amounts or leave at 0
                to pass.
              </Text>
            </VStack>
            <Button
              size="sm"
              onClick={handleDevPassAll}
              isLoading={devBidding}
              loadingText="Bidding..."
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
              Submit All
            </Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} mt={2}>
            {unbidTeams.map((team) => (
              <HStack key={team.index} spacing={2}>
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="xs"
                  color={HUD.amberDim}
                  minW="80px"
                  noOfLines={1}
                >
                  {team.name}
                </Text>
                <NumberInput
                  size="xs"
                  min={0}
                  max={team.budget ?? 100}
                  value={devBids[team.index] ?? 0}
                  onChange={(_, v) =>
                    setDevBids((prev) => ({ ...prev, [team.index]: isNaN(v) ? 0 : v }))
                  }
                  maxW="80px"
                >
                  <NumberInputField {...hudNumberInputStyles} />
                  <NumberInputStepper>
                    <NumberIncrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                    <NumberDecrementStepper color={HUD.textSecondary} borderColor={HUD.border} />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* team rosters */}
      <Box>
        <SectionLabel mb={3}>Team Rosters</SectionLabel>
        <DraftBoard room={room} currentTeamIndex={null} />
      </Box>
    </VStack>
  );
}
