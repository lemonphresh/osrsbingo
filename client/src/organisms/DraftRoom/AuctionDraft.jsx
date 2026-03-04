import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
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

const IS_DEV = process.env.NODE_ENV !== 'production';

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
      <Box bg="gray.700" border="2px solid" borderColor="yellow.400" borderRadius="lg" p={4}>
        <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider">
              Auction Round
            </Text>
            <Text fontWeight="bold" fontSize="lg">
              Up for bid:
            </Text>
          </VStack>
          <HStack>
            <Badge colorScheme="yellow">AUCTION</Badge>
            <Badge colorScheme="gray">
              {bidCount}/{totalTeams} bids in
            </Badge>
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
        <Box bg="gray.700" borderRadius="lg" p={4} border="1px solid" borderColor="gray.600">
          <Text fontWeight="semibold" mb={1}>
            Your bid
          </Text>
          <Text fontSize="xs" color="gray.400" mb={3}>
            Budget remaining: <strong>{myBudget} pts</strong>
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
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button colorScheme="yellow" size="sm" onClick={handleBid} isLoading={loading}>
              Submit Bid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBidAmount(0);
                handleBid();
              }}
              isLoading={loading}
              color="gray.400"
            >
              Pass
            </Button>
          </HStack>
        </Box>
      )}

      {iHaveBid && (
        <Text fontSize="sm" color="green.300" fontWeight="semibold">
          Your bid: {bids[myTeamIndex]} pts — waiting for other captains...
        </Text>
      )}

      {/* per-team bid status */}
      <Box>
        <Text fontWeight="semibold" mb={2}>
          Bid Status
        </Text>
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
          {room.teams.map((team) => {
            const hasBid = bids[team.index] !== undefined;
            return (
              <Box key={team.index} bg="gray.800" borderRadius="md" p={2}>
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>
                  {team.name}
                </Text>
                <HStack mt={1}>
                  <Badge colorScheme={hasBid ? 'green' : 'gray'} fontSize="9px">
                    {hasBid ? 'Bid in' : 'Waiting'}
                  </Badge>
                  <Text fontSize="xs" color="gray.400">
                    {team.budget ?? 100} pts left
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
          borderColor="yellow.600"
          borderRadius="lg"
          p={3}
          bg="yellow.900"
          opacity={0.85}
        >
          <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
            <VStack align="flex-start" spacing={0}>
              <Text
                fontSize="xs"
                fontWeight="bold"
                color="yellow.300"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Dev Tools
              </Text>
              <Text fontSize="xs" color="yellow.200">
                Submit bids for {unbidTeams.length} team(s) still waiting. Set amounts or leave at 0
                to pass.
              </Text>
            </VStack>
            <Button
              size="sm"
              colorScheme="yellow"
              variant="outline"
              onClick={handleDevPassAll}
              isLoading={devBidding}
              loadingText="Bidding..."
            >
              Submit All
            </Button>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2} mt={2}>
            {unbidTeams.map((team) => (
              <HStack key={team.index} spacing={2}>
                <Text fontSize="xs" color="yellow.200" minW="80px" noOfLines={1}>
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
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* team rosters */}
      <Box>
        <Text fontWeight="semibold" mb={3}>
          Team Rosters
        </Text>
        <DraftBoard room={room} currentTeamIndex={null} />
      </Box>
    </VStack>
  );
}
