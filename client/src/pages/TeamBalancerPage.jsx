import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  SimpleGrid,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Divider,
  Tooltip,
  Progress,
} from '@chakra-ui/react';
import { useApolloClient } from '@apollo/client';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FETCH_WOM_STATS } from '../graphql/draftOperations';
import usePageTitle from '../hooks/usePageTitle';
import { useToastContext } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';

const PRESETS = {
  'All-Rounder': {
    ehpWeight: 0.25,
    ehbWeight: 0.25,
    totalLevelWeight: 0.25,
    ehbyWeight: 2.0,
    ehpyWeight: 2.0,
    coxWeight: 0.1,
    tobWeight: 0.15,
    toaWeight: 0.1,
  },
  'PvM Focused': {
    ehpWeight: 0.1,
    ehbWeight: 0.25,
    totalLevelWeight: 0.1,
    ehbyWeight: 3.0,
    ehpyWeight: 0.25,
    coxWeight: 0.15,
    tobWeight: 0.2,
    toaWeight: 0.15,
  },
  'Skilling Focused': {
    ehpWeight: 0.25,
    ehbWeight: 0,
    totalLevelWeight: 0.5,
    ehbyWeight: 0,
    ehpyWeight: 3.0,
    coxWeight: 0,
    tobWeight: 0,
    toaWeight: 0,
  },
  'Raid Specialist': {
    ehpWeight: 0,
    ehbWeight: 0.25,
    totalLevelWeight: 0,
    ehbyWeight: 1.0,
    ehpyWeight: 0,
    coxWeight: 0.3,
    tobWeight: 0.4,
    toaWeight: 0.3,
  },
};

const DEFAULT_PRESET = 'All-Rounder';

const PRESET_DESCRIPTIONS = {
  'All-Rounder':
    'Balances recent EHP/Y and EHB/Y with lifetime stats and total level. Good for mixed-content events where overall versatility matters.',
  'PvM Focused':
    'Heavily weights recent bossing activity (EHB/Y) alongside raid KCs. Best for events centered around bossing and monster killing.',
  'Skilling Focused':
    'Prioritizes recent EHP gains and total level. Ignores bossing stats entirely, ideal for skilling events or XP races.',
  'Raid Specialist':
    'Focuses on raid kill counts (CoX, ToB, ToA) and recent EHB/Y. Best when raid experience is the primary skill being tested.',
};

const TEAM_COLORS = [
  'purple.400',
  'teal.400',
  'orange.400',
  'pink.400',
  'blue.400',
  'green.400',
  'yellow.400',
  'red.400',
];

// Delay between per-player fetches to stay under WOM rate limits
const CLIENT_FETCH_DELAY_MS = 1000;

function scorePlayer(womData, weights) {
  const normalizedTotalLevel = ((womData.totalLevel ?? 0) / 2376) * 100;
  return (
    weights.ehpWeight * (womData.ehp ?? 0) +
    weights.ehbWeight * (womData.ehb ?? 0) +
    weights.totalLevelWeight * normalizedTotalLevel +
    weights.ehbyWeight * (womData.ehby ?? 0) +
    weights.ehpyWeight * (womData.ehpy ?? 0) +
    weights.coxWeight * (womData.cox ?? 0) +
    weights.tobWeight * (womData.tob ?? 0) +
    weights.toaWeight * (womData.toa ?? 0)
  );
}

function balanceTeams(players, numTeams) {
  const n = players.length;
  const baseSize = Math.floor(n / numTeams);
  const extra = n % numTeams; // this many teams get one extra player

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const teams = Array.from({ length: numTeams }, (_, i) => ({
    index: i,
    players: [],
    total: 0,
  }));

  for (const player of sorted) {
    // Teams already at baseSize+1 count toward the extra quota
    const overflowCount = teams.filter((t) => t.players.length > baseSize).length;

    // A team can accept this player if it's under the base size,
    // or at the base size and there's still room in the extra quota
    const eligible = teams.filter(
      (t) => t.players.length < baseSize || (t.players.length === baseSize && overflowCount < extra)
    );

    const target = eligible.reduce((min, t) => (t.total < min.total ? t : min), eligible[0]);
    target.players.push(player);
    target.total += player.score;
  }

  return teams;
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function exportToCsv(teams, preset) {
  const rows = [['Team', 'RSN', 'EHP', 'EHP/Y', 'EHB', 'EHB/Y', 'Score']];
  teams.forEach((team, i) => {
    team.players.forEach((p) => {
      rows.push([
        `Team ${i + 1}`,
        p.rsn,
        Math.round(p.ehp ?? 0),
        Math.round(p.ehpy ?? 0),
        Math.round(p.ehb ?? 0),
        Math.round(p.ehby ?? 0),
        Math.round(p.score),
      ]);
    });
  });
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `teams-${preset.toLowerCase().replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TeamBalancerPage() {
  usePageTitle('Team Balancer');
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const apolloClient = useApolloClient();

  const [rsnText, setRsnText] = useState('');
  const [numTeams, setNumTeams] = useState(2);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [teams, setTeams] = useState(null);
  const [notFoundRsns, setNotFoundRsns] = useState([]);
  // { fetched, total, current } — null when idle
  const [progress, setProgress] = useState(null);

  if (!user) {
    return (
      <Box flex="1" my="36px" maxW="1000px" mx="auto" w="100%" px={4} py={8}>
        <VStack align="flex-start" spacing={1} mb={6}>
          <GemTitle fontSize="2xl" fontWeight="black">
            Team Balancer
          </GemTitle>
          <Text color="gray.400" fontSize="sm">
            Paste RSNs, pick a metric, and get auto-balanced teams based on WOM stats.
          </Text>
        </VStack>

        {/* Blurred preview of the form */}
        <Box position="relative">
          <Box
            bg="gray.700"
            borderRadius="xl"
            p={6}
            border="1px solid"
            borderColor="gray.600"
            opacity={0.35}
            filter="blur(3px)"
            pointerEvents="none"
            userSelect="none"
          >
            <VStack spacing={5} align="stretch">
              <Box>
                <Text fontSize="sm" mb={1}>RSNs</Text>
                <Box
                  bg="gray.800"
                  borderRadius="md"
                  border="1px solid"
                  borderColor="gray.600"
                  h="160px"
                  p={3}
                >
                  <Text fontSize="sm" fontFamily="mono" color="gray.500">
                    Zezima{'\n'}Woox{'\n'}B0aty{'\n'}...
                  </Text>
                </Box>
              </Box>
              <HStack spacing={6}>
                <Box>
                  <Text fontSize="sm" mb={1}>Number of Teams</Text>
                  <Box bg="gray.800" borderRadius="md" border="1px solid" borderColor="gray.600" w="100px" h="40px" />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" mb={1}>Balancing Metric</Text>
                  <HStack spacing={2}>
                    {Object.keys(PRESETS).map((name) => (
                      <Box key={name} bg="gray.600" borderRadius="md" px={3} py={1}>
                        <Text fontSize="sm">{name}</Text>
                      </Box>
                    ))}
                  </HStack>
                </Box>
              </HStack>
              <Box bg="green.700" borderRadius="md" h="48px" />
            </VStack>
          </Box>

          {/* Login overlay */}
          <Box
            position="absolute"
            inset={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              bg="gray.800"
              border="1px solid"
              borderColor="gray.500"
              borderRadius="xl"
              p={8}
              textAlign="center"
              maxW="360px"
              boxShadow="0 8px 32px rgba(0,0,0,0.6)"
            >
              <Text fontSize="lg" fontWeight="bold" mb={2}>
                Log in to use Team Balancer
              </Text>
              <Text color="gray.400" fontSize="sm" mb={6}>
                Create a free account or log in to balance teams from your RSN list.
              </Text>
              <HStack spacing={3} justify="center">
                <Link to="/login">
                  <Button colorScheme="purple">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="outline" colorScheme="whiteAlpha" borderColor="whiteAlpha.400" color="white">Sign Up Free</Button>
                </Link>
              </HStack>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  function getRsns() {
    return rsnText
      .split(/[\n,]+/)
      .map((r) => r.trim())
      .filter(Boolean);
  }

  async function handleBalance() {
    const rsns = getRsns();
    if (rsns.length < numTeams) {
      return showToast(`Need at least ${numTeams} RSNs for ${numTeams} teams`, 'warning');
    }

    const allStats = [];

    try {
      for (let i = 0; i < rsns.length; i++) {
        setProgress({ fetched: i, total: rsns.length, current: rsns[i] });

        const result = await apolloClient.query({
          query: FETCH_WOM_STATS,
          variables: { rsns: [rsns[i]] },
          fetchPolicy: 'network-only',
        });
        allStats.push(...(result.data?.fetchWomStats ?? []));

        // Throttle between requests — server also delays but client pacing
        // adds an extra buffer against WOM rate limits
        if (i < rsns.length - 1) {
          await new Promise((res) => setTimeout(res, CLIENT_FETCH_DELAY_MS));
        }
      }
    } catch (e) {
      showToast(`Failed to fetch stats: ${e.message}`, 'error');
      setProgress(null);
      return;
    }

    const weights = PRESETS[preset];
    const notFound = allStats.filter((s) => s.notFound).map((s) => s.rsn);
    setNotFoundRsns(notFound);

    const found = allStats.filter((s) => !s.notFound);
    const scored = found.map((s) => ({ ...s, score: scorePlayer(s, weights) }));
    setTeams(balanceTeams(scored, numTeams));
    setProgress(null);
  }

  function handleReset() {
    setTeams(null);
    setNotFoundRsns([]);
    setProgress(null);
  }

  const rsns = getRsns();
  const hasEnough = rsns.length >= numTeams;
  const isFetching = progress !== null;

  const balanceRatio =
    teams && teams.length > 1
      ? Math.min(...teams.map((t) => t.total)) / Math.max(...teams.map((t) => t.total))
      : null;

  return (
    <Box flex="1" my="36px" maxW="1000px" mx="auto" w="100%" px={4} py={8}>
      <VStack align="flex-start" spacing={1} mb={6}>
        <GemTitle fontSize="2xl" fontWeight="black">
          Team Balancer
        </GemTitle>
        <Text color="gray.400" fontSize="sm">
          Paste RSNs, pick a metric, and get auto-balanced teams based on WOM stats.
        </Text>
      </VStack>

      {!teams ? (
        <Box bg="gray.700" borderRadius="xl" p={6} border="1px solid" borderColor="gray.600">
          <VStack spacing={5} align="stretch">
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="sm">RSNs</Text>
                <Text fontSize="xs" color={hasEnough ? 'green.300' : 'orange.300'}>
                  {rsns.length} player{rsns.length !== 1 ? 's' : ''}
                  {!hasEnough && rsns.length > 0 ? ` (need at least ${numTeams})` : ''}
                </Text>
              </HStack>
              <Textarea
                value={rsnText}
                onChange={(e) => setRsnText(e.target.value)}
                placeholder={'Zezima\nWoox\nB0aty\nPvM King\n...'}
                minH="160px"
                fontFamily="mono"
                fontSize="sm"
                isDisabled={isFetching}
              />
            </Box>

            <HStack spacing={6} flexWrap="wrap">
              <Box>
                <Text fontSize="sm" mb={1}>
                  Number of Teams
                </Text>
                <NumberInput
                  min={2}
                  max={8}
                  value={numTeams}
                  onChange={(_, v) => setNumTeams(Math.max(2, Math.min(8, v || 2)))}
                  maxW="100px"
                  isDisabled={isFetching}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </Box>

              <Box flex={1}>
                <Text fontSize="sm" mb={1}>
                  Balancing Metric
                </Text>
                <HStack flexWrap="wrap" spacing={2}>
                  {Object.keys(PRESETS).map((name) => (
                    <Button
                      key={name}
                      size="sm"
                      variant={preset === name ? 'solid' : 'outline'}
                      colorScheme="pink"
                      onClick={() => setPreset(name)}
                      isDisabled={isFetching}
                    >
                      {name}
                    </Button>
                  ))}
                </HStack>
                <Text fontSize="xs" color="gray.400" mt={1}>
                  {PRESET_DESCRIPTIONS[preset]}
                </Text>
              </Box>
            </HStack>

            <Divider />

            {isFetching ? (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm" color="gray.400">
                    Fetching{' '}
                    <Text as="span" color="white" fontWeight="semibold">
                      {progress.current}
                    </Text>
                    ...
                  </Text>
                  <Text fontSize="sm" fontWeight="bold" color="purple.300">
                    {progress.fetched} / {progress.total}
                  </Text>
                </HStack>
                <Progress
                  value={(progress.fetched / progress.total) * 100}
                  colorScheme="purple"
                  borderRadius="full"
                  size="sm"
                  hasStripe
                  isAnimated
                />
                <Text fontSize="xs" color="gray.500" mt={2}>
                  This might take a few minutes, as I need to throttle the WOM API calls and not
                  completely barrage their servers with queries. &lt;3 Lemon the Dev
                </Text>
              </Box>
            ) : (
              <Button colorScheme="green" isDisabled={!hasEnough} onClick={handleBalance} size="lg">
                Balance Teams
              </Button>
            )}
          </VStack>
        </Box>
      ) : (
        <VStack spacing={5} align="stretch">
          {/* Summary bar */}
          <HStack
            bg="gray.700"
            borderRadius="lg"
            p={4}
            border="1px solid"
            borderColor="gray.600"
            flexWrap="wrap"
            gap={3}
          >
            <VStack spacing={0} align="flex-start">
              <Text fontWeight="bold">
                {teams.reduce((sum, t) => sum + t.players.length, 0)} players → {teams.length} teams
              </Text>
              <Text fontSize="xs" color="gray.400">
                {preset} metric
              </Text>
            </VStack>

            {balanceRatio !== null && (
              <Tooltip
                label="Balance ratio: min team score ÷ max team score. Closer to 1.0 = more balanced."
                placement="top"
              >
                <VStack spacing={0} align="flex-start" cursor="help">
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color={
                      balanceRatio > 0.9
                        ? 'green.300'
                        : balanceRatio > 0.75
                        ? 'yellow.300'
                        : 'orange.300'
                    }
                  >
                    Balance: {(balanceRatio * 100).toFixed(1)}%
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    {balanceRatio > 0.9
                      ? 'Very balanced'
                      : balanceRatio > 0.75
                      ? 'Reasonably balanced'
                      : 'Somewhat uneven'}
                  </Text>
                </VStack>
              </Tooltip>
            )}

            <HStack spacing={2} ml="auto">
              <Button
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => exportToCsv(teams, preset)}
              >
                Export CSV
              </Button>
              <Button size="sm" variant="ghost" colorScheme="whiteAlpha" onClick={handleReset}>
                Start Over
              </Button>
            </HStack>
          </HStack>

          {/* Disclaimer */}
          <Text fontSize="xs" color="gray.500" px={1}>
            This is not perfect team balancing! You know your players better than any algorithm
            does. Move folks around if these metrics don't reflect reality.
          </Text>

          {/* Team cards */}
          <SimpleGrid columns={{ base: 1, sm: 2, md: Math.min(teams.length, 3) }} spacing={4}>
            {teams.map((team, i) => {
              const color = TEAM_COLORS[i % TEAM_COLORS.length];
              return (
                <Box
                  key={team.index}
                  bg="gray.800"
                  border="2px solid"
                  borderColor="gray.600"
                  borderRadius="xl"
                  overflow="hidden"
                >
                  <Box bg="gray.700" px={4} py={3} borderBottom="1px solid" borderColor="gray.600">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Box w={3} h={3} borderRadius="full" bg={color} flexShrink={0} />
                        <Text fontWeight="black" fontSize="md">
                          Team {i + 1}
                        </Text>
                      </HStack>
                      <VStack spacing={0} align="flex-end">
                        <Text fontSize="xs" color="gray.400">
                          Score
                        </Text>
                        <Text fontWeight="bold" fontSize="sm" color={color}>
                          {fmt(team.total)}
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  <VStack spacing={0} align="stretch">
                    {team.players.map((player, pi) => (
                      <Box
                        key={player.rsn}
                        px={4}
                        py={2.5}
                        borderBottom={pi < team.players.length - 1 ? '1px solid' : 'none'}
                        borderColor="gray.700"
                      >
                        <HStack justify="space-between" spacing={2}>
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={1} flex={1} minW={0}>
                            {player.rsn}
                          </Text>
                          <HStack spacing={3} flexShrink={0}>
                            {[
                              { label: 'EHP', val: player.ehp },
                              { label: 'EHP/Y', val: player.ehpy },
                              { label: 'EHB', val: player.ehb },
                              { label: 'EHB/Y', val: player.ehby },
                            ].map(({ label, val }) => (
                              <VStack key={label} spacing={0} align="center">
                                <Text fontSize="9px" color="gray.500" lineHeight={1}>
                                  {label}
                                </Text>
                                <Text fontSize="xs" fontWeight="bold" lineHeight={1.3}>
                                  {fmt(val ?? 0)}
                                </Text>
                              </VStack>
                            ))}
                            <VStack spacing={0} align="center">
                              <Text fontSize="9px" color="gray.500" lineHeight={1}>
                                Score
                              </Text>
                              <Text fontSize="xs" fontWeight="bold" lineHeight={1.3} color={color}>
                                {fmt(player.score)}
                              </Text>
                            </VStack>
                          </HStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>

                  {team.players.length > 0 && (
                    <Box px={4} py={2} borderTop="1px solid" borderColor="gray.700" bg="gray.750">
                      {(() => {
                        const avgEhp =
                          team.players.reduce((s, p) => s + (p.ehp ?? 0), 0) / team.players.length;
                        const avgEhb =
                          team.players.reduce((s, p) => s + (p.ehb ?? 0), 0) / team.players.length;
                        return (
                          <HStack spacing={4}>
                            <Text fontSize="9px" color="gray.500">
                              avg EHP:{' '}
                              <Text as="span" color="gray.300">
                                {fmt(avgEhp)}
                              </Text>
                            </Text>
                            <Text fontSize="9px" color="gray.500">
                              avg EHB:{' '}
                              <Text as="span" color="gray.300">
                                {fmt(avgEhb)}
                              </Text>
                            </Text>
                            <Text fontSize="9px" color="gray.500">
                              {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                            </Text>
                          </HStack>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              );
            })}
          </SimpleGrid>

          {/* Not-found players — separate card, not assigned to any team */}
          {notFoundRsns.length > 0 && (
            <Box
              bg="gray.800"
              border="1px solid"
              borderColor="orange.700"
              borderRadius="xl"
              overflow="hidden"
            >
              <Box bg="gray.700" px={4} py={3} borderBottom="1px solid" borderColor="orange.700">
                <HStack spacing={2}>
                  <Box w={3} h={3} borderRadius="full" bg="orange.400" flexShrink={0} />
                  <Text fontWeight="black" fontSize="md">
                    Not Found on WOM
                  </Text>
                  <Text fontSize="xs" color="gray.400">
                    — not assigned to a team
                  </Text>
                </HStack>
              </Box>
              <VStack spacing={0} align="stretch" px={4} py={2}>
                {notFoundRsns.map((rsn, i) => (
                  <Text
                    key={rsn}
                    fontSize="sm"
                    color="orange.300"
                    py={1.5}
                    borderBottom={i < notFoundRsns.length - 1 ? '1px solid' : 'none'}
                    borderColor="gray.700"
                  >
                    {rsn}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}
