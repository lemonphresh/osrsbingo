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
  useColorMode,
} from '@chakra-ui/react';
import { useMutation } from '@apollo/client';
import { useState } from 'react';
import { PLACE_BID } from '../../graphql/draftOperations';
import PlayerCard from './PlayerCard';
import DraftBoard from './DraftBoard';
import TimerBar from './TimerBar';
import { useToastContext } from '../../providers/ToastProvider';

export default function AuctionDraft({ room, userRole, userId }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const { showToast } = useToastContext();

  const auctionState = room.auctionState ?? {};
  const currentPlayer = room.players.find((p) => p.id === auctionState.currentPlayerId);
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

  const [placeBid, { loading }] = useMutation(PLACE_BID, {
    onError: (e) => showToast({ title: 'Bid failed', description: e.message, status: 'error' }),
  });

  async function handleBid() {
    if (myTeamIndex === null) return;
    await placeBid({
      variables: { roomId: room.roomId, teamIndex: myTeamIndex, amount: bidAmount },
    });
  }

  const totalTeams = room.teams.length;
  const bidCount = Object.keys(bids).length;

  return (
    <VStack spacing={5} align="stretch">
      {/* Auction header */}
      <Box
        bg={isDark ? '#2D3748' : 'gray.50'}
        border="2px solid"
        borderColor="yellow.400"
        borderRadius="lg"
        p={4}
      >
        <HStack justify="space-between" mb={2} flexWrap="wrap" gap={2}>
          <VStack align="flex-start" spacing={0}>
            <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing="wider">
              Auction Round
            </Text>
            <Text fontWeight="bold" fontSize="lg">Up for bid:</Text>
          </VStack>
          <HStack>
            <Badge colorScheme="yellow">AUCTION</Badge>
            <Badge colorScheme="gray">{bidCount}/{totalTeams} bids in</Badge>
          </HStack>
        </HStack>
        <TimerBar
          startedAt={room.currentPickStartedAt}
          totalSeconds={room.pickTimeSeconds}
        />
      </Box>

      {/* Current auction player */}
      {currentPlayer && (
        <Box maxW="200px">
          <PlayerCard
            player={currentPlayer}
            statCategories={room.statCategories}
            isAuctionTarget
          />
        </Box>
      )}

      {/* Bid UI */}
      {myTeam && !iHaveBid && (
        <Box
          bg={isDark ? '#2D3748' : 'gray.50'}
          borderRadius="lg"
          p={4}
          border="1px solid"
          borderColor={isDark ? 'gray.600' : 'gray.200'}
        >
          <Text fontWeight="semibold" mb={1}>Your bid</Text>
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
            <Button
              colorScheme="yellow"
              size="sm"
              onClick={handleBid}
              isLoading={loading}
            >
              Submit Bid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setBidAmount(0); handleBid(); }}
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

      {/* Per-team bid status */}
      <Box>
        <Text fontWeight="semibold" mb={2}>Bid Status</Text>
        <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2}>
          {room.teams.map((team) => {
            const hasBid = bids[team.index] !== undefined;
            return (
              <Box
                key={team.index}
                bg={isDark ? '#1A202C' : 'gray.100'}
                borderRadius="md"
                p={2}
              >
                <Text fontSize="xs" fontWeight="bold" noOfLines={1}>{team.name}</Text>
                <HStack mt={1}>
                  <Badge colorScheme={hasBid ? 'green' : 'gray'} fontSize="9px">
                    {hasBid ? 'Bid in' : 'Waiting'}
                  </Badge>
                  <Text fontSize="xs" color="gray.400">{team.budget ?? 100} pts left</Text>
                </HStack>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Team rosters */}
      <Box>
        <Text fontWeight="semibold" mb={3}>Team Rosters</Text>
        <DraftBoard room={room} currentTeamIndex={null} />
      </Box>
    </VStack>
  );
}
