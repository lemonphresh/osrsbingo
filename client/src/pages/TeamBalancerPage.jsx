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
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { useApolloClient, useMutation } from '@apollo/client';
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FETCH_WOM_STATS, FETCH_PLAYER_COMP_HISTORY } from '../graphql/draftOperations';
import { INCREMENT_TEAM_BALANCE } from '../graphql/mutations';
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

// Columns shown in the player table (all except name which is sticky)
const COLUMNS = [
  { key: 'totalLevel', label: 'Lvl', title: 'Total Level' },
  { key: 'ehp', label: 'EHP', title: 'Efficient Hours Played (lifetime)' },
  { key: 'ehpy', label: 'EHP/Y', title: 'EHP gained in the last year' },
  { key: 'ehb', label: 'EHB', title: 'Efficient Hours Bossed (lifetime)' },
  { key: 'ehby', label: 'EHB/Y', title: 'EHB gained in the last year' },
  { key: 'cox', label: 'CoX', title: 'Chambers of Xeric KC (incl. CM)' },
  { key: 'tob', label: 'ToB', title: 'Theatre of Blood KC (incl. HM)' },
  { key: 'toa', label: 'ToA', title: 'Tombs of Amascut KC (incl. Expert)' },
  { key: 'score', label: 'Score', title: 'Weighted balance score' },
];

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
  const extra = n % numTeams;

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const teams = Array.from({ length: numTeams }, (_, i) => ({
    index: i,
    players: [],
    total: 0,
  }));

  for (const player of sorted) {
    const overflowCount = teams.filter((t) => t.players.length > baseSize).length;
    const eligible = teams.filter(
      (t) => t.players.length < baseSize || (t.players.length === baseSize && overflowCount < extra)
    );
    const target = eligible.reduce((min, t) => (t.total < min.total ? t : min), eligible[0]);
    target.players.push(player);
    target.total += player.score;
  }

  return teams;
}

function recalcTotal(team) {
  return { ...team, total: team.players.reduce((s, p) => s + p.score, 0) };
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

function exportToCsv(teams, preset) {
  const anyHours = teams.some((t) => t.players.some((p) => p.hoursPerDay !== null));
  const rows = [
    [
      'Team',
      'RSN',
      'Level',
      'EHP',
      'EHP/Y',
      'EHB',
      'EHB/Y',
      'CoX',
      'ToB',
      'ToA',
      ...(anyHours ? ['Hrs/Day'] : []),
      'Score',
    ],
  ];
  teams.forEach((team, i) => {
    team.players.forEach((p) => {
      rows.push([
        `Team ${i + 1}`,
        p.rsn,
        p.totalLevel ?? 0,
        Math.round(p.ehp ?? 0),
        Math.round(p.ehpy ?? 0),
        Math.round(p.ehb ?? 0),
        Math.round(p.ehby ?? 0),
        Math.round(p.cox ?? 0),
        Math.round(p.tob ?? 0),
        Math.round(p.toa ?? 0),
        ...(anyHours ? [p.hoursPerDay ?? ''] : []),
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
  const [incrementTeamBalance] = useMutation(INCREMENT_TEAM_BALANCE);

  const [rsnText, setRsnText] = useState('');
  const [numTeams, setNumTeams] = useState(2);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [teams, setTeams] = useState(null);
  const [notFoundRsns, setNotFoundRsns] = useState([]);
  const [progress, setProgress] = useState(null);

  // Sort state: applies to all team tables simultaneously
  const [sortCol, setSortCol] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  // Competition history: rsn → { count, participationRate, recent[] }
  const [compData, setCompData] = useState(null); // null = not loaded
  const [compLoading, setCompLoading] = useState(false);

  // Drag state
  const dragInfo = useRef(null); // { rsn, fromTeamIdx }
  const [dragOverTeam, setDragOverTeam] = useState(null);

  // Refetch state for not-found RSNs
  const [refetchProgress, setRefetchProgress] = useState(null); // { fetched, total, current } | null

  // Manual edit tracking for rebalance confirmation
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [showRebalanceConfirm, setShowRebalanceConfirm] = useState(false);

  // Hours/day baseline for score multiplier (8h = 1.0×)
  const [hoursBaseline, setHoursBaseline] = useState(8);

  // Custom weights — start from the selected preset, editable in Advanced
  const [customWeights, setCustomWeights] = useState(null); // null = use preset

  const activeWeights = customWeights ?? PRESETS[preset];

  function setWeight(key, value) {
    setCustomWeights((prev) => ({ ...(prev ?? PRESETS[preset]), [key]: value }));
  }

  // Reset custom weights when preset changes (unless user explicitly edited)
  function handlePresetChange(name) {
    setPreset(name);
    setCustomWeights(null);
  }

  // When weights change: rebalance directly, or prompt if user has manual edits
  useEffect(() => {
    if (!teams) return;
    if (hasManualEdits) {
      // Re-score in place so numbers reflect new weights, but don't move anyone
      setTeams((prev) =>
        prev.map((team) => {
          const rescored = team.players.map((p) => ({
            ...p,
            score:
              scorePlayer(p, activeWeights) *
              (p.hoursPerDay != null ? p.hoursPerDay / hoursBaseline : 1),
          }));
          return { ...team, players: rescored, total: rescored.reduce((s, p) => s + p.score, 0) };
        })
      );
      setShowRebalanceConfirm(true);
    } else {
      setTeams((prev) => {
        const allPlayers = prev
          .flatMap((t) => t.players)
          .map((p) => ({
            ...p,
            score:
              scorePlayer(p, activeWeights) *
              (p.hoursPerDay != null ? p.hoursPerDay / hoursBaseline : 1),
          }));
        return balanceTeams(allPlayers, prev.length);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customWeights, preset, hoursBaseline]);

  if (!user) {
    return (
      <Box flex="1" my="36px" maxW="1100px" mx="auto" w="100%" px={4} py={8}>
        <VStack align="flex-start" spacing={1} mb={6}>
          <GemTitle fontSize="2xl" fontWeight="black">
            Team Balancer
          </GemTitle>
          <Text color="gray.400" fontSize="sm">
            Paste RSNs, pick a metric, and get auto-balanced teams based on WOM stats.
          </Text>
        </VStack>

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
                <Text fontSize="sm" mb={1}>
                  RSNs
                </Text>
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
                  <Text fontSize="sm" mb={1}>
                    Number of Teams
                  </Text>
                  <Box
                    bg="gray.800"
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.600"
                    w="100px"
                    h="40px"
                  />
                </Box>
                <Box flex={1}>
                  <Text fontSize="sm" mb={1}>
                    Balancing Metric
                  </Text>
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
                  <Button
                    variant="outline"
                    colorScheme="whiteAlpha"
                    borderColor="whiteAlpha.400"
                    color="white"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              </HStack>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  function parseRsnInput() {
    return rsnText
      .split(/[\n,]+/)
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return null;
        const match = trimmed.match(/^(.+?)\s*-\s*(\d+(?:\.\d+)?)\s*$/);
        if (match) {
          return { rsn: match[1].trim(), hoursPerDay: parseFloat(match[2]) };
        }
        return { rsn: trimmed, hoursPerDay: null };
      })
      .filter(Boolean);
  }

  async function handleBalance() {
    const parsed = parseRsnInput();
    if (parsed.length < numTeams) {
      return showToast(`Need at least ${numTeams} RSNs for ${numTeams} teams`, 'warning');
    }

    const allStats = [];
    try {
      for (let i = 0; i < parsed.length; i++) {
        setProgress({ fetched: i, total: parsed.length, current: parsed[i].rsn });
        const result = await apolloClient.query({
          query: FETCH_WOM_STATS,
          variables: { rsns: [parsed[i].rsn] },
          fetchPolicy: 'network-only',
        });
        allStats.push(...(result.data?.fetchWomStats ?? []));
        if (i < parsed.length - 1)
          await new Promise((res) => setTimeout(res, CLIENT_FETCH_DELAY_MS));
      }
    } catch (e) {
      showToast(`Failed to fetch stats: ${e.message}`, 'error');
      setProgress(null);
      return;
    }

    const weights = activeWeights;
    const parsedByRsn = Object.fromEntries(parsed.map((p) => [p.rsn.toLowerCase(), p]));
    const notFound = allStats
      .filter((s) => s.notFound)
      .map((s) => ({
        rsn: s.rsn,
        hoursPerDay: parsedByRsn[s.rsn.toLowerCase()]?.hoursPerDay ?? null,
      }));
    setNotFoundRsns(notFound);

    const found = allStats.filter((s) => !s.notFound);
    const scored = found.map((s) => {
      const hoursPerDay = parsedByRsn[s.rsn.toLowerCase()]?.hoursPerDay ?? null;
      return {
        ...s,
        hoursPerDay,
        score: scorePlayer(s, weights) * (hoursPerDay != null ? hoursPerDay / hoursBaseline : 1),
      };
    });
    setTeams(balanceTeams(scored, numTeams));
    incrementTeamBalance().catch(() => {});
    setCompData(null);
    setProgress(null);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
  }

  async function handleLoadCompHistory() {
    if (!teams) return;
    const allRsns = teams.flatMap((t) => t.players.map((p) => p.rsn));
    setCompLoading(true);
    try {
      const result = await apolloClient.query({
        query: FETCH_PLAYER_COMP_HISTORY,
        variables: { rsns: allRsns },
        fetchPolicy: 'network-only',
      });
      const entries = result.data?.fetchPlayerCompHistory ?? [];
      const map = {};
      entries.forEach((e) => {
        map[e.rsn.toLowerCase()] = e;
      });
      setCompData(map);
    } catch (e) {
      showToast(`Failed to fetch competition history: ${e.message}`, 'error');
    }
    setCompLoading(false);
  }

  function handleReset() {
    setTeams(null);
    setNotFoundRsns([]);
    setProgress(null);
    setCompData(null);
    setRefetchProgress(null);
    setSortCol('score');
    setSortDir('desc');
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
  }

  async function handleRefetchNotFound() {
    const weights = activeWeights;
    const allStats = [];
    try {
      for (let i = 0; i < notFoundRsns.length; i++) {
        setRefetchProgress({
          fetched: i,
          total: notFoundRsns.length,
          current: notFoundRsns[i].rsn,
        });
        const result = await apolloClient.query({
          query: FETCH_WOM_STATS,
          variables: { rsns: [notFoundRsns[i].rsn] },
          fetchPolicy: 'network-only',
        });
        allStats.push(...(result.data?.fetchWomStats ?? []));
        if (i < notFoundRsns.length - 1)
          await new Promise((res) => setTimeout(res, CLIENT_FETCH_DELAY_MS));
      }
    } catch (e) {
      showToast(`Failed to refetch: ${e.message}`, 'error');
      setRefetchProgress(null);
      return;
    }

    const notFoundByRsn = Object.fromEntries(notFoundRsns.map((p) => [p.rsn.toLowerCase(), p]));
    const stillNotFound = allStats
      .filter((s) => s.notFound)
      .map((s) => ({
        rsn: s.rsn,
        hoursPerDay: notFoundByRsn[s.rsn.toLowerCase()]?.hoursPerDay ?? null,
      }));
    const nowFound = allStats.filter((s) => !s.notFound);

    if (nowFound.length === 0) {
      showToast('Still not found on WOM — check the usernames', 'warning');
      setRefetchProgress(null);
      return;
    }

    // Merge newly found players into the existing pool and rebalance everything
    const existingPlayers = teams.flatMap((t) => t.players);
    const allPlayers = [
      ...existingPlayers,
      ...nowFound.map((s) => {
        const hoursPerDay = notFoundByRsn[s.rsn.toLowerCase()]?.hoursPerDay ?? null;
        return {
          ...s,
          hoursPerDay,
          score: scorePlayer(s, weights) * (hoursPerDay != null ? hoursPerDay / hoursBaseline : 1),
        };
      }),
    ];
    setTeams(balanceTeams(allPlayers, teams.length));
    setNotFoundRsns(stillNotFound);
    setCompData(null);
    setRefetchProgress(null);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);

    if (stillNotFound.length === 0) {
      showToast(`Found all players — teams rebalanced!`, 'success');
    } else {
      showToast(`Found ${nowFound.length}, still missing ${stillNotFound.length}`, 'warning');
    }
  }

  function handleSortCol(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  }

  function getSortedPlayers(players) {
    return [...players].sort((a, b) => {
      const av = a[sortCol] ?? 0;
      const bv = b[sortCol] ?? 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }

  // Drag & drop handlers
  function onDragStart(rsn, fromTeamIdx) {
    dragInfo.current = { rsn, fromTeamIdx };
  }

  function onDragOver(e, toTeamIdx) {
    e.preventDefault();
    setDragOverTeam(toTeamIdx);
  }

  function onDragLeave() {
    setDragOverTeam(null);
  }

  function onDrop(e, toTeamIdx) {
    e.preventDefault();
    setDragOverTeam(null);
    if (!dragInfo.current) return;
    const { rsn, fromTeamIdx } = dragInfo.current;
    dragInfo.current = null;
    if (fromTeamIdx === toTeamIdx) return;

    setHasManualEdits(true);
    setShowRebalanceConfirm(false);
    setTeams((prev) => {
      const next = prev.map((t) => ({ ...t, players: [...t.players] }));
      const fromTeam = next[fromTeamIdx];
      const toTeam = next[toTeamIdx];
      const playerIdx = fromTeam.players.findIndex((p) => p.rsn === rsn);
      if (playerIdx === -1) return prev;
      const [player] = fromTeam.players.splice(playerIdx, 1);
      toTeam.players.push(player);
      next[fromTeamIdx] = recalcTotal(fromTeam);
      next[toTeamIdx] = recalcTotal(toTeam);
      return next;
    });
  }

  function onDragEnd() {
    dragInfo.current = null;
    setDragOverTeam(null);
  }

  const parsed = parseRsnInput();
  const hasEnough = parsed.length >= numTeams;
  const isFetching = progress !== null;

  const balanceRatio =
    teams && teams.length > 1
      ? Math.min(...teams.map((t) => t.total)) / Math.max(...teams.map((t) => t.total))
      : null;

  // Show Hrs/D column only when at least one player has hours specified
  const hasHoursData = teams?.some((t) => t.players.some((p) => p.hoursPerDay !== null)) ?? false;

  // Determine columns to show — add Hrs/D and Comps when applicable
  const visibleColumns = [
    ...COLUMNS.filter((c) => c.key !== 'score'),
    ...(hasHoursData
      ? [{ key: 'hoursPerDay', label: 'Hrs/D', title: 'Estimated hours played per day' }]
      : []),
    COLUMNS.find((c) => c.key === 'score'),
    ...(compData
      ? [{ key: '__comps', label: 'Comps', title: 'Competition participations (last 20 on WOM)' }]
      : []),
  ];

  return (
    <Box flex="1" my="36px" maxW="1100px" mx="auto" w="100%" px={4} py={8}>
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
                  {parsed.length} player{parsed.length !== 1 ? 's' : ''}
                  {!hasEnough && parsed.length > 0 ? ` (need at least ${numTeams})` : ''}
                </Text>
              </HStack>
              <Textarea
                value={rsnText}
                onChange={(e) => setRsnText(e.target.value)}
                placeholder={
                  'Zezima\nWoox - 8\nB0aty - 4\nPvM King\n...\n\nOptionally add " - N" after a name where N = estimated hours of play/day to take that into consideration as well'
                }
                minH="160px"
                fontFamily="mono"
                fontSize="sm"
                isDisabled={isFetching}
              />
            </Box>

            {parsed.some((p) => p.hoursPerDay !== null) && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="sm">Hours/day baseline</Text>
                  <Text fontSize="xs" color="cyan.300" fontWeight="semibold">
                    {hoursBaseline}h = 1.0×&nbsp;&nbsp;
                    <Text as="span" color="gray.400" fontWeight="normal">
                      (players at this threshold are weighted normally)
                    </Text>
                  </Text>
                </HStack>
                <Slider
                  min={1}
                  max={16}
                  step={1}
                  value={hoursBaseline}
                  onChange={setHoursBaseline}
                  isDisabled={isFetching}
                  focusThumbOnChange={false}
                >
                  <SliderTrack bg="gray.600">
                    <SliderFilledTrack bg="cyan.500" />
                  </SliderTrack>
                  <SliderThumb boxSize={3} />
                </Slider>
                <HStack justify="space-between" mt={0.5}>
                  <Text fontSize="10px" color="gray.500">
                    1h
                  </Text>
                  <Text fontSize="10px" color="gray.500">
                    16h
                  </Text>
                </HStack>
              </Box>
            )}

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
                      onClick={() => handlePresetChange(name)}
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

            <Accordion allowToggle>
              <AccordionItem border="none">
                <AccordionButton px={0} _hover={{ bg: 'transparent' }}>
                  <Text fontSize="sm" color="gray.400" flex={1} textAlign="left">
                    Advanced: Custom Weights
                    {customWeights && (
                      <Text as="span" fontSize="xs" color="purple.400" ml={2}>
                        (modified)
                      </Text>
                    )}
                  </Text>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <VStack spacing={3} align="stretch" pt={1}>
                    <Text fontSize="xs" color="gray.500">
                      Fine-tune the weight of each stat in the balance score. Higher = more
                      influence. Changing a value here overrides the selected preset.
                    </Text>
                    {[
                      { key: 'ehpWeight', label: 'EHP (lifetime)' },
                      { key: 'ehpyWeight', label: 'EHP/Y (past year)' },
                      { key: 'ehbWeight', label: 'EHB (lifetime)' },
                      { key: 'ehbyWeight', label: 'EHB/Y (past year)' },
                      { key: 'totalLevelWeight', label: 'Total Level' },
                      { key: 'coxWeight', label: 'CoX KC' },
                      { key: 'tobWeight', label: 'ToB KC' },
                      { key: 'toaWeight', label: 'ToA KC' },
                    ].map(({ key, label }) => {
                      const val = activeWeights[key] ?? 0;
                      return (
                        <HStack key={key} spacing={3} align="center">
                          <Text fontSize="xs" color="gray.300" w="130px" flexShrink={0}>
                            {label}
                          </Text>
                          <Slider
                            min={0}
                            max={5}
                            step={0.05}
                            value={val}
                            onChange={(v) => setWeight(key, v)}
                            flex={1}
                            isDisabled={isFetching}
                            focusThumbOnChange={false}
                          >
                            <SliderTrack bg="gray.600">
                              <SliderFilledTrack bg="pink.400" />
                            </SliderTrack>
                            <SliderThumb boxSize={3} />
                          </Slider>
                          <Text
                            fontSize="xs"
                            color="gray.300"
                            w="30px"
                            textAlign="right"
                            flexShrink={0}
                          >
                            {val.toFixed(2)}
                          </Text>
                        </HStack>
                      );
                    })}
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      alignSelf="flex-start"
                      onClick={() => setCustomWeights(null)}
                      isDisabled={!customWeights}
                    >
                      Reset to preset
                    </Button>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>

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
                  This might take a few minutes 'cause I throttle the speed of my requests to WOM. I
                  don't want to ice barrage their servers! Hang tight!
                </Text>
                <Text fontSize="xs" color="gray.500" ml={2} mt={2}>
                  &lt;3 Lemon the Dev
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

            <HStack spacing={2} ml="auto" flexWrap="wrap">
              {!compData && (
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                  onClick={handleLoadCompHistory}
                  isLoading={compLoading}
                  loadingText="Loading..."
                >
                  Load Competition History
                </Button>
              )}
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

          <Text fontSize="xs" color="gray.500" px={1}>
            This is not perfect team balancing! You know your players better than any algorithm
            does. Drag players between teams to adjust, scores recalculate automatically.
          </Text>

          {/* Preset + weight controls available in results view too */}
          <Box bg="gray.700" borderRadius="lg" p={4} border="1px solid" borderColor="gray.600">
            <VStack spacing={3} align="stretch">
              <HStack flexWrap="wrap" spacing={2}>
                {Object.keys(PRESETS).map((name) => (
                  <Button
                    key={name}
                    size="sm"
                    variant={preset === name && !customWeights ? 'solid' : 'outline'}
                    colorScheme="pink"
                    onClick={() => handlePresetChange(name)}
                  >
                    {name}
                  </Button>
                ))}
              </HStack>
              <Text fontSize="xs" color="gray.400">
                {PRESET_DESCRIPTIONS[preset]}
              </Text>
              <Text fontSize="xs" color="gray.500" px={1}>
                Score = a weighted sum of EHP, EHB, Total Level, EHP/Y, EHB/Y, and raid KCs (CoX,
                ToB, ToA) based on the selected preset. EHP/Y and EHB/Y (gains over the past year)
                are weighted heavily since they reflect how active a player has been recently, not
                just their total lifetime progress. If hours/day are specified (e.g. "RSN - 8"), the
                score is multiplied by that number to factor in availability.
              </Text>
              {hasHoursData && (
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.300">
                      Hours/day baseline
                    </Text>
                    <Text fontSize="xs" color="cyan.300" fontWeight="semibold">
                      {hoursBaseline}h = 1.0×
                    </Text>
                  </HStack>
                  <Slider
                    min={1}
                    max={16}
                    step={1}
                    value={hoursBaseline}
                    onChange={setHoursBaseline}
                    focusThumbOnChange={false}
                  >
                    <SliderTrack bg="gray.600">
                      <SliderFilledTrack bg="cyan.500" />
                    </SliderTrack>
                    <SliderThumb boxSize={3} />
                  </Slider>
                  <HStack justify="space-between" mt={0.5}>
                    <Text fontSize="10px" color="gray.500">
                      1h
                    </Text>
                    <Text fontSize="10px" color="gray.500">
                      16h
                    </Text>
                  </HStack>
                </Box>
              )}
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }}>
                    <Text fontSize="sm" color="gray.400" flex={1} textAlign="left">
                      Advanced: Custom Weights
                      {customWeights && (
                        <Text as="span" fontSize="xs" color="purple.400" ml={2}>
                          (modified)
                        </Text>
                      )}
                    </Text>
                    <AccordionIcon color="gray.400" />
                  </AccordionButton>
                  <AccordionPanel px={0} pb={2}>
                    <VStack spacing={3} align="stretch" pt={1}>
                      {[
                        { key: 'ehpWeight', label: 'EHP (lifetime)' },
                        { key: 'ehpyWeight', label: 'EHP/Y (past year)' },
                        { key: 'ehbWeight', label: 'EHB (lifetime)' },
                        { key: 'ehbyWeight', label: 'EHB/Y (past year)' },
                        { key: 'totalLevelWeight', label: 'Total Level' },
                        { key: 'coxWeight', label: 'CoX KC' },
                        { key: 'tobWeight', label: 'ToB KC' },
                        { key: 'toaWeight', label: 'ToA KC' },
                      ].map(({ key, label }) => {
                        const val = activeWeights[key] ?? 0;
                        return (
                          <HStack key={key} spacing={3} align="center">
                            <Text fontSize="xs" color="gray.300" w="130px" flexShrink={0}>
                              {label}
                            </Text>
                            <Slider
                              min={0}
                              max={5}
                              step={0.05}
                              value={val}
                              onChange={(v) => setWeight(key, v)}
                              flex={1}
                              focusThumbOnChange={false}
                            >
                              <SliderTrack bg="gray.600">
                                <SliderFilledTrack bg="pink.400" />
                              </SliderTrack>
                              <SliderThumb boxSize={3} />
                            </Slider>
                            <Text
                              fontSize="xs"
                              color="gray.300"
                              w="30px"
                              textAlign="right"
                              flexShrink={0}
                            >
                              {val.toFixed(2)}
                            </Text>
                          </HStack>
                        );
                      })}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        alignSelf="flex-start"
                        onClick={() => setCustomWeights(null)}
                        isDisabled={!customWeights}
                      >
                        Reset to preset
                      </Button>
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </VStack>
          </Box>

          {/* Rebalance confirmation */}
          {showRebalanceConfirm && (
            <Box
              bg="orange.900"
              border="1px solid"
              borderColor="orange.600"
              borderRadius="lg"
              px={4}
              py={3}
            >
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <Text fontSize="sm" color="orange.100">
                  Rebalance teams with the new weights? This will undo your manual player moves.
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onClick={() => {
                      setTeams((prev) => {
                        const allPlayers = prev
                          .flatMap((t) => t.players)
                          .map((p) => ({
                            ...p,
                            score:
                              scorePlayer(p, activeWeights) *
                              (p.hoursPerDay != null ? p.hoursPerDay / hoursBaseline : 1),
                          }));
                        return balanceTeams(allPlayers, prev.length);
                      });
                      setHasManualEdits(false);
                      setShowRebalanceConfirm(false);
                    }}
                  >
                    Rebalance
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    onClick={() => setShowRebalanceConfirm(false)}
                  >
                    Keep my changes
                  </Button>
                </HStack>
              </HStack>
            </Box>
          )}

          {/* Team cards */}
          <SimpleGrid columns={{ base: 1, lg: Math.min(teams.length, 2) }} spacing={4}>
            {teams.map((team, i) => {
              const color = TEAM_COLORS[i % TEAM_COLORS.length];
              const isDragTarget = dragOverTeam === i;
              const sorted = getSortedPlayers(team.players);

              return (
                <Box
                  key={team.index}
                  bg="gray.800"
                  border="2px solid"
                  borderColor={isDragTarget ? color : 'gray.600'}
                  borderRadius="xl"
                  overflow="hidden"
                  transition="border-color 0.15s"
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, i)}
                >
                  {/* Team header */}
                  <Box bg="gray.700" px={4} py={3} borderBottom="1px solid" borderColor="gray.600">
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Box w={3} h={3} borderRadius="full" bg={color} flexShrink={0} />
                        <Text fontWeight="black" fontSize="md">
                          Team {i + 1}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          ({team.players.length})
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

                  {/* Scrollable table */}
                  <Box overflowX="auto">
                    <Box
                      as="table"
                      w="100%"
                      style={{ borderCollapse: 'collapse', tableLayout: 'auto' }}
                    >
                      {/* Column headers */}
                      <Box as="thead">
                        <Box as="tr" bg="gray.750">
                          {/* Sticky name column header */}
                          <Box
                            as="th"
                            position="sticky"
                            left={0}
                            zIndex={1}
                            bg="gray.750"
                            px={4}
                            py={1.5}
                            textAlign="left"
                            fontSize="9px"
                            color="gray.400"
                            fontWeight="semibold"
                            textTransform="uppercase"
                            letterSpacing="wide"
                            borderBottom="1px solid"
                            borderColor="gray.700"
                            whiteSpace="nowrap"
                            minW="120px"
                          >
                            Player
                          </Box>
                          {visibleColumns.map((col) => (
                            <Box
                              as="th"
                              key={col.key}
                              px={3}
                              py={1.5}
                              textAlign="right"
                              fontSize="9px"
                              color={sortCol === col.key ? 'purple.300' : 'gray.400'}
                              fontWeight="semibold"
                              textTransform="uppercase"
                              letterSpacing="wide"
                              borderBottom="1px solid"
                              borderColor="gray.700"
                              cursor="pointer"
                              whiteSpace="nowrap"
                              _hover={{ color: 'gray.200' }}
                              onClick={() => col.key !== '__comps' && handleSortCol(col.key)}
                              title={col.title}
                            >
                              <Tooltip label={col.title} placement="top" openDelay={300}>
                                <span>
                                  {col.label}

                                  {sortCol === col.key && col.key !== '__comps' && (
                                    <Text as="span" ml={0.5}>
                                      {sortDir === 'desc' ? '↓' : '↑'}
                                    </Text>
                                  )}
                                </span>
                              </Tooltip>
                            </Box>
                          ))}
                        </Box>
                      </Box>

                      {/* Rows */}
                      <Box as="tbody">
                        {sorted.map((player, pi) => {
                          const compEntry = compData ? compData[player.rsn.toLowerCase()] : null;
                          return (
                            <Box
                              as="tr"
                              key={player.rsn}
                              draggable
                              onDragStart={() => onDragStart(player.rsn, i)}
                              onDragEnd={onDragEnd}
                              bg="gray.800"
                              _hover={{ bg: 'gray.750' }}
                              cursor="grab"
                              borderBottom={pi < sorted.length - 1 ? '1px solid' : 'none'}
                              borderColor="gray.700"
                              style={{ transition: 'background 0.1s' }}
                            >
                              {/* Sticky name cell */}
                              <Box
                                as="td"
                                position="sticky"
                                left={0}
                                zIndex={1}
                                bg="inherit"
                                px={4}
                                py={2}
                                borderRight="1px solid"
                                borderColor="gray.700"
                                whiteSpace="nowrap"
                              >
                                <Text fontWeight="semibold" fontSize="sm">
                                  {player.rsn}
                                </Text>
                              </Box>

                              {/* Stat cells */}
                              {visibleColumns.map((col) => {
                                if (col.key === '__comps') {
                                  if (!compEntry) {
                                    return (
                                      <Box as="td" key="__comps" px={3} py={2} textAlign="right">
                                        <Text fontSize="xs" color="gray.600">
                                          —
                                        </Text>
                                      </Box>
                                    );
                                  }
                                  return (
                                    <Box as="td" key="__comps" px={3} py={2} textAlign="right">
                                      <Popover
                                        placement="left"
                                        trigger="hover"
                                        openDelay={100}
                                        closeDelay={200}
                                      >
                                        <PopoverTrigger>
                                          <Badge
                                            colorScheme={
                                              compEntry.count >= 15
                                                ? 'green'
                                                : compEntry.count >= 5
                                                ? 'yellow'
                                                : 'gray'
                                            }
                                            fontSize="10px"
                                            cursor="pointer"
                                          >
                                            {compEntry.count}
                                          </Badge>
                                        </PopoverTrigger>
                                        <PopoverContent
                                          bg="gray.800"
                                          border="1px solid"
                                          borderColor="gray.600"
                                          boxShadow="lg"
                                          w="auto"
                                          minW="240px"
                                          maxW="320px"
                                          _focus={{ outline: 'none' }}
                                        >
                                          <PopoverBody p={3} textAlign="left">
                                            <Text fontWeight="bold" mb={2} fontSize="sm">
                                              {compEntry.count} competition
                                              {compEntry.count !== 1 ? 's' : ''} on WOM
                                            </Text>
                                            <Text fontSize="xs" color="gray.400" mb={2}>
                                              Most recent competitions:
                                            </Text>
                                            {compEntry.recent.length > 0 && (
                                              <VStack align="stretch" spacing={0.5}>
                                                {compEntry.recent.map((c, ci) => {
                                                  return (
                                                    <Box
                                                      key={ci}
                                                      as="a"
                                                      href={`https://wiseoldman.net/competitions/${c.id}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      display="block"
                                                      borderRadius="sm"
                                                      px={1.5}
                                                      py={1}
                                                      _hover={{
                                                        bg: 'gray.700',
                                                        textDecoration: 'none',
                                                      }}
                                                    >
                                                      <Text fontSize="xs" color="gray.300">
                                                        {c.title}
                                                      </Text>
                                                    </Box>
                                                  );
                                                })}
                                              </VStack>
                                            )}
                                          </PopoverBody>
                                        </PopoverContent>
                                      </Popover>
                                    </Box>
                                  );
                                }
                                if (col.key === 'hoursPerDay') {
                                  return (
                                    <Box as="td" key="hoursPerDay" px={3} py={2} textAlign="right">
                                      <Text
                                        fontSize="xs"
                                        color={
                                          player.hoursPerDay !== null ? 'cyan.300' : 'gray.600'
                                        }
                                      >
                                        {player.hoursPerDay !== null ? player.hoursPerDay : '—'}
                                      </Text>
                                    </Box>
                                  );
                                }
                                const val = player[col.key] ?? 0;
                                const isScore = col.key === 'score';
                                return (
                                  <Box as="td" key={col.key} px={3} py={2} textAlign="right">
                                    <Text
                                      fontSize="xs"
                                      fontWeight={isScore ? 'bold' : 'normal'}
                                      color={isScore ? color : 'gray.200'}
                                    >
                                      {fmt(val)}
                                    </Text>
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  </Box>

                  {/* Footer averages */}
                  {team.players.length > 0 && (
                    <Box px={4} py={2} borderTop="1px solid" borderColor="gray.700" bg="gray.750">
                      {(() => {
                        const avg = (key) =>
                          team.players.reduce((s, p) => s + (p[key] ?? 0), 0) / team.players.length;
                        const stats = [
                          { label: 'avg EHP', val: avg('ehp') },
                          { label: 'avg EHP/Y', val: avg('ehpy') },
                          { label: 'avg EHB', val: avg('ehb') },
                          { label: 'avg EHB/Y', val: avg('ehby') },
                        ];
                        return (
                          <HStack spacing={4} flexWrap="wrap">
                            {stats.map(({ label, val }) => (
                              <Text key={label} fontSize="9px" color="gray.500">
                                {label}:{' '}
                                <Text as="span" color="gray.300">
                                  {fmt(val)}
                                </Text>
                              </Text>
                            ))}
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

          {/* Not-found players */}
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
                {notFoundRsns.map(({ rsn }, i) => (
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
              <Box px={4} py={3} borderTop="1px solid" borderColor="gray.700">
                {refetchProgress ? (
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="xs" color="gray.400">
                        Retrying{' '}
                        <Text as="span" color="white" fontWeight="semibold">
                          {refetchProgress.current}
                        </Text>
                        ...
                      </Text>
                      <Text fontSize="xs" color="orange.300" fontWeight="bold">
                        {refetchProgress.fetched} / {refetchProgress.total}
                      </Text>
                    </HStack>
                    <Progress
                      value={(refetchProgress.fetched / refetchProgress.total) * 100}
                      colorScheme="orange"
                      size="xs"
                      borderRadius="full"
                    />
                  </Box>
                ) : (
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="xs" color="gray.400">
                      Are these RSNs correct? If so, try refetching — WOM may have been
                      rate-limited.
                    </Text>
                    <HStack spacing={2}>
                      <Button
                        size="sm"
                        colorScheme="orange"
                        variant="outline"
                        onClick={handleRefetchNotFound}
                      >
                        Retry{' '}
                        {notFoundRsns.length === 1
                          ? 'this player'
                          : `these ${notFoundRsns.length} players`}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="whiteAlpha"
                        onClick={handleReset}
                      >
                        Go back and edit
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}
