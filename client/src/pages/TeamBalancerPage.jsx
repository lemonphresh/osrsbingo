import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Textarea,
  Input,
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
import { useLoginUrl, useSignupUrl } from '../utils/loginRedirect';
import { FETCH_WOM_STATS, FETCH_PLAYER_COMP_HISTORY } from '../graphql/draftOperations';
import { INCREMENT_TEAM_BALANCE } from '../graphql/mutations';
import usePageTitle from '../hooks/usePageTitle';
import { useToastContext } from '../providers/ToastProvider';
import { useAuth } from '../providers/AuthProvider';
import GemTitle from '../atoms/GemTitle';
import { getWomErrorMessage, WOM_ERROR_TOAST_DURATION } from '../utils/womErrorMessage';
import {
  classifyWomPlayerResults,
  usesYearlyWomGains,
  WOM_PLAYER_STATUS,
} from '../utils/womPlayerResolution';
import {
  combineCompetitionPaces,
  getCompetitionScoreMultiplier,
} from '../utils/womCompetitionBalance';

import { HUD, HUD_FONT_DISPLAY, HUD_FONT_MONO } from '../atoms/hudTheme';
import HudChip from '../atoms/HudChip';
// Local alias so the existing JSX below can keep using <Chip mode="..."/>
// without a sweeping rename. HudChip is identical to the Chip helper that
// used to live inline in this file.
const Chip = HudChip;

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

const WOM_STATS_BATCH_SIZE = 50;
const CLIENT_BATCH_DELAY_MS = 500;
const COMP_HISTORY_BATCH_SIZE = 5;
const COMP_HISTORY_DETAIL_BUDGET = 40;

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

function AutoRetryCountdown({ disabled, onRetry }) {
  const [seconds, setSeconds] = useState(30);
  const triggered = useRef(false);

  useEffect(() => {
    if (disabled || triggered.current || seconds === 0) return undefined;
    const timeout = setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [disabled, seconds]);

  useEffect(() => {
    if (seconds !== 0 || disabled || triggered.current) return;
    triggered.current = true;
    onRetry();
  }, [disabled, onRetry, seconds]);

  if (triggered.current) return null;
  return (
    <Text fontSize="10px" color="yellow.300">
      Auto-retry in {seconds}s
    </Text>
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

function formatRsnLines(players) {
  return players
    .map((player) =>
      player.hoursPerDay == null ? player.rsn : `${player.rsn} - ${player.hoursPerDay}`
    )
    .join('\n');
}

function competitionPaceRatio(players, compData, metric) {
  const yearlyKey = metric === 'ehp' ? 'ehpy' : 'ehby';
  let actual = 0;
  let expected = 0;

  players.forEach((player) => {
    const performance = compData?.[player.rsn.toLowerCase()]?.performance?.[metric];
    const yearlyGain = player[yearlyKey] ?? 0;
    if (!performance || performance.durationDays <= 0 || yearlyGain <= 0) return;
    actual += performance.gained;
    expected += (yearlyGain / 365) * performance.durationDays;
  });

  return expected > 0 ? actual / expected : null;
}

function weightedCompetitionPace(player, compData, weights) {
  return combineCompetitionPaces(
    {
      ehp: competitionPaceRatio([player], compData, 'ehp'),
      ehb: competitionPaceRatio([player], compData, 'ehb'),
    },
    weights
  );
}

function calculatePlayerScore(
  player,
  weights,
  hoursBaseline,
  compData = null,
  competitionInfluence = 0
) {
  const availabilityMultiplier =
    player.hoursPerDay != null ? player.hoursPerDay / hoursBaseline : 1;
  const baseScore = scorePlayer(player, weights) * availabilityMultiplier;
  const competitionPace =
    compData && competitionInfluence > 0
      ? weightedCompetitionPace(player, compData, weights)
      : null;
  const competitionScoreMultiplier = getCompetitionScoreMultiplier(
    competitionPace,
    competitionInfluence
  );

  return {
    ...player,
    score: baseScore * competitionScoreMultiplier,
    competitionPace,
    competitionScoreMultiplier,
  };
}

function formatPace(ratio) {
  return ratio == null ? 'N/A' : `${Math.round(ratio * 100)}%`;
}

function exportToCsv(teams, preset, compData) {
  const anyHours = teams.some((t) => t.players.some((p) => p.hoursPerDay !== null));
  const hasCompetitionData = compData !== null;
  const hasCompetitionBalance = teams.some((team) =>
    team.players.some((player) => player.competitionPace != null)
  );
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
      ...(hasCompetitionData
        ? [
            'Comp EHP Pace %',
            'Comp EHB Pace %',
            'Sampled Competitions',
            'Comp EHP Gained',
            'Comp EHB Gained',
            ...(hasCompetitionBalance ? ['Competition Score Modifier'] : []),
          ]
        : []),
    ],
  ];
  teams.forEach((team, i) => {
    team.players.forEach((p) => {
      const compEntry = compData?.[p.rsn.toLowerCase()];
      const ehpPerformance = compEntry?.performance?.ehp;
      const ehbPerformance = compEntry?.performance?.ehb;
      const ehpPace = competitionPaceRatio([p], compData, 'ehp');
      const ehbPace = competitionPaceRatio([p], compData, 'ehb');
      const sampledCompetitions = Math.max(
        ehpPerformance?.competitions ?? 0,
        ehbPerformance?.competitions ?? 0
      );
      rows.push([
        `Team ${i + 1}`,
        p.rsn,
        p.totalLevel ?? 0,
        Math.round(p.ehp ?? 0),
        p.yearlyGainsUnavailable ? '' : Math.round(p.ehpy ?? 0),
        Math.round(p.ehb ?? 0),
        p.yearlyGainsUnavailable ? '' : Math.round(p.ehby ?? 0),
        Math.round(p.cox ?? 0),
        Math.round(p.tob ?? 0),
        Math.round(p.toa ?? 0),
        ...(anyHours ? [p.hoursPerDay ?? ''] : []),
        Math.round(p.score),
        ...(hasCompetitionData
          ? [
              ehpPace == null ? '' : `${Math.round(ehpPace * 100)}%`,
              ehbPace == null ? '' : `${Math.round(ehbPace * 100)}%`,
              sampledCompetitions || '',
              ehpPerformance?.gained?.toFixed(2) ?? '',
              ehbPerformance?.gained?.toFixed(2) ?? '',
              ...(hasCompetitionBalance
                ? [
                    p.competitionPace == null
                      ? ''
                      : `${((p.competitionScoreMultiplier - 1) * 100).toFixed(1)}%`,
                  ]
                : []),
            ]
          : []),
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
  const loginUrl = useLoginUrl();
  const signupUrl = useSignupUrl();
  const { showToast } = useToastContext();
  const apolloClient = useApolloClient();
  const [incrementTeamBalance] = useMutation(INCREMENT_TEAM_BALANCE);

  const [rsnText, setRsnText] = useState('');
  const [numTeams, setNumTeams] = useState(2);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [teams, setTeams] = useState(null);
  const [unresolvedPlayers, setUnresolvedPlayers] = useState([]);
  const [progress, setProgress] = useState(null);

  // Sort state: applies to all team tables simultaneously
  const [sortCol, setSortCol] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  // Competition history: rsn → { count, recent[], performance: { ehp, ehb } }
  const [compData, setCompData] = useState(null); // null = not loaded
  const [compLoading, setCompLoading] = useState(false);
  const [compLoadingMode, setCompLoadingMode] = useState(null);
  const [compProgress, setCompProgress] = useState(null);
  const [competitionInfluence, setCompetitionInfluence] = useState(0.25);
  const [appliedCompetitionInfluence, setAppliedCompetitionInfluence] = useState(null);

  // Drag state
  const dragInfo = useRef(null); // { rsn, fromTeamIdx }
  const [dragOverTeam, setDragOverTeam] = useState(null);

  // Retry state for players that WOM could not fully resolve
  const [refetchProgress, setRefetchProgress] = useState(null); // { fetched, total, current } | null

  // Manual edit tracking for rebalance confirmation
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [showRebalanceConfirm, setShowRebalanceConfirm] = useState(false);

  // Hours/day baseline for score multiplier (8h = 1.0×)
  const [hoursBaseline, setHoursBaseline] = useState(8);

  // Custom weights start from the selected preset and are editable in Advanced.
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
    const playersMissingWeightedYearlyStats = teams
      .flatMap((team) => team.players)
      .filter((player) => player.yearlyGainsUnavailable);
    if (usesYearlyWomGains(activeWeights) && playersMissingWeightedYearlyStats.length > 0) {
      const missingRsns = new Set(
        playersMissingWeightedYearlyStats.map((player) => player.rsn.toLowerCase())
      );
      setUnresolvedPlayers((current) => [
        ...current,
        ...playersMissingWeightedYearlyStats
          .filter(
            (player) =>
              !current.some(
                (row) =>
                  row.status === WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE &&
                  row.rsn.toLowerCase() === player.rsn.toLowerCase()
              )
          )
          .map((player) => ({
            id: `yearly:${player.sourceIndex ?? player.rsn.toLowerCase()}`,
            sourceIndex: player.sourceIndex,
            originalRsn: player.originalRsn ?? player.rsn,
            rsn: player.rsn,
            draftRsn: player.rsn,
            hoursPerDay: player.hoursPerDay,
            status: WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE,
            stats: player,
          })),
      ]);
      setTeams((current) => {
        const available = current
          .flatMap((team) => team.players)
          .filter((player) => !missingRsns.has(player.rsn.toLowerCase()))
          .map((player) => calculatePlayerScore(player, activeWeights, hoursBaseline));
        return balanceTeams(available, current.length);
      });
      setCompData(null);
      setAppliedCompetitionInfluence(null);
      showToast(
        'Yearly weighting needs complete yearly stats. Affected players were moved to the attention panel.',
        'warning',
        WOM_ERROR_TOAST_DURATION
      );
      return;
    }
    if (hasManualEdits) {
      // Re-score in place so numbers reflect new weights, but don't move anyone
      setTeams((prev) =>
        prev.map((team) => {
          const rescored = team.players.map((player) =>
            calculatePlayerScore(
              player,
              activeWeights,
              hoursBaseline,
              compData,
              appliedCompetitionInfluence ?? 0
            )
          );
          return { ...team, players: rescored, total: rescored.reduce((s, p) => s + p.score, 0) };
        })
      );
      setShowRebalanceConfirm(true);
    } else {
      setTeams((prev) => {
        const allPlayers = prev
          .flatMap((t) => t.players)
          .map((player) =>
            calculatePlayerScore(
              player,
              activeWeights,
              hoursBaseline,
              compData,
              appliedCompetitionInfluence ?? 0
            )
          );
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
                <Link to={loginUrl}>
                  <Button colorScheme="purple">Log In</Button>
                </Link>
                <Link to={signupUrl}>
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

  async function fetchWomStatsInBatches(rsns, setFetchProgress) {
    const allStats = [];
    for (let start = 0; start < rsns.length; start += WOM_STATS_BATCH_SIZE) {
      const batch = rsns.slice(start, start + WOM_STATS_BATCH_SIZE);
      setFetchProgress({
        fetched: start,
        total: rsns.length,
        current: batch.length === 1 ? batch[0] : `${batch[0]} + ${batch.length - 1} more`,
      });
      const result = await apolloClient.query({
        query: FETCH_WOM_STATS,
        variables: { rsns: batch },
        fetchPolicy: 'network-only',
      });
      allStats.push(...(result.data?.fetchWomStats ?? []));
      if (start + batch.length < rsns.length) {
        await new Promise((resolve) => setTimeout(resolve, CLIENT_BATCH_DELAY_MS));
      }
    }
    return allStats;
  }

  async function handleBalance() {
    const parsed = parseRsnInput();
    if (parsed.length < numTeams) {
      return showToast(`Need at least ${numTeams} RSNs for ${numTeams} teams`, 'warning');
    }
    const duplicateRsns = parsed
      .map((player) => player.rsn.toLowerCase())
      .filter((rsn, index, all) => all.indexOf(rsn) !== index);
    if (duplicateRsns.length > 0) {
      return showToast(
        `Remove duplicate RSNs before balancing: ${[...new Set(duplicateRsns)].join(', ')}`,
        'warning',
        7000
      );
    }

    let allStats;
    try {
      allStats = await fetchWomStatsInBatches(
        parsed.map((player) => player.rsn),
        setProgress
      );
    } catch (e) {
      showToast(getWomErrorMessage(e), 'error', WOM_ERROR_TOAST_DURATION);
      setProgress(null);
      return;
    }

    const weights = activeWeights;
    const { ready, unresolved } = classifyWomPlayerResults(allStats, parsed, weights);
    const scored = ready.map((stats) => {
      const { hoursPerDay } = stats;
      return {
        ...stats,
        score:
          scorePlayer(stats, weights) * (hoursPerDay != null ? hoursPerDay / hoursBaseline : 1),
      };
    });
    setUnresolvedPlayers(unresolved);
    setTeams(balanceTeams(scored, numTeams));
    if (unresolved.length === 0) {
      incrementTeamBalance().catch(() => {});
    } else {
      showToast(
        `${unresolved.length} player${
          unresolved.length === 1 ? '' : 's'
        } need attention. Successful players are saved below while you fix or retry them.`,
        'warning',
        WOM_ERROR_TOAST_DURATION
      );
    }
    setCompData(null);
    setAppliedCompetitionInfluence(null);
    setProgress(null);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
  }

  async function handleLoadCompHistory({ rsns = null, forceRefresh = false } = {}) {
    if (!teams) return;
    const allRsns = rsns ?? teams.flatMap((t) => t.players.map((p) => p.rsn));
    if (allRsns.length === 0) return;
    setCompLoading(true);
    setCompLoadingMode(rsns ? 'retry' : compData ? 'refresh' : 'initial');
    const batchCount = Math.ceil(allRsns.length / COMP_HISTORY_BATCH_SIZE);
    const totalDetailBudget = Math.min(COMP_HISTORY_DETAIL_BUDGET, allRsns.length * 5);
    let remainingDetailBudget = totalDetailBudget;
    let nextCompData = compData ? { ...compData } : {};
    let failedBatchPlayers = 0;

    for (let start = 0; start < allRsns.length; start += COMP_HISTORY_BATCH_SIZE) {
      const batch = allRsns.slice(start, start + COMP_HISTORY_BATCH_SIZE);
      const batchIndex = Math.floor(start / COMP_HISTORY_BATCH_SIZE);
      const remainingBatches = batchCount - batchIndex;
      const maxDetailRequests = Math.max(1, Math.floor(remainingDetailBudget / remainingBatches));
      remainingDetailBudget -= maxDetailRequests;
      setCompProgress({
        fetched: start,
        total: allRsns.length,
        current: batch.length === 1 ? batch[0] : `${batch[0]} and ${batch.length - 1} more`,
      });

      let entries;
      try {
        const result = await apolloClient.query({
          query: FETCH_PLAYER_COMP_HISTORY,
          variables: { rsns: batch, forceRefresh, maxDetailRequests },
          fetchPolicy: 'network-only',
        });
        entries = result.data?.fetchPlayerCompHistory ?? [];
      } catch {
        failedBatchPlayers += batch.length;
        entries = batch.map((rsn) => ({
          rsn,
          analysisStatus: 'TEMPORARY_ERROR',
          count: 0,
          recent: [],
          performance: {
            ehp: { gained: 0, durationDays: 0, competitions: 0 },
            ehb: { gained: 0, durationDays: 0, competitions: 0 },
          },
        }));
      }

      entries.forEach((entry) => {
        nextCompData[entry.rsn.toLowerCase()] = entry;
      });
      nextCompData = { ...nextCompData };
      setCompData(nextCompData);
      setCompProgress({
        fetched: Math.min(start + batch.length, allRsns.length),
        total: allRsns.length,
        current: null,
      });
    }

    if (appliedCompetitionInfluence != null) {
      setTeams((currentTeams) => {
        if (hasManualEdits) {
          return currentTeams.map((team) =>
            recalcTotal({
              ...team,
              players: team.players.map((player) =>
                calculatePlayerScore(
                  player,
                  activeWeights,
                  hoursBaseline,
                  nextCompData,
                  appliedCompetitionInfluence
                )
              ),
            })
          );
        }
        const rescored = currentTeams
          .flatMap((team) => team.players)
          .map((player) =>
            calculatePlayerScore(
              player,
              activeWeights,
              hoursBaseline,
              nextCompData,
              appliedCompetitionInfluence
            )
          );
        return balanceTeams(rescored, currentTeams.length);
      });
    }

    const requestedEntries = allRsns.map((rsn) => nextCompData[rsn.toLowerCase()]);
    const incompleteCount = requestedEntries.filter(
      (entry) => !entry || entry.analysisStatus !== 'READY'
    ).length;
    if (incompleteCount > 0) {
      showToast(
        `${allRsns.length - incompleteCount} of ${
          allRsns.length
        } competition histories are ready. The remaining ${incompleteCount} can be retried without losing progress.`,
        failedBatchPlayers > 0 ? 'error' : 'warning',
        WOM_ERROR_TOAST_DURATION
      );
    } else if (rsns) {
      showToast('Competition analysis is now complete.', 'success');
    }
    setCompLoading(false);
    setCompLoadingMode(null);
    setCompProgress(null);
  }

  function handleApplyCompetitionBalance() {
    if (!compData || comparableCompEntries.length === 0) return;
    setTeams((currentTeams) => {
      const rescored = currentTeams
        .flatMap((team) => team.players)
        .map((player) =>
          calculatePlayerScore(player, activeWeights, hoursBaseline, compData, competitionInfluence)
        );
      return balanceTeams(rescored, currentTeams.length);
    });
    setAppliedCompetitionInfluence(competitionInfluence);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
    setSortCol('score');
    setSortDir('desc');
    showToast('Teams rebalanced with competition pace included.', 'success');
  }

  function handleClearCompetitionBalance({ hideAnalysis = false } = {}) {
    setTeams((currentTeams) => {
      const rescored = currentTeams
        .flatMap((team) => team.players)
        .map((player) => calculatePlayerScore(player, activeWeights, hoursBaseline));
      return balanceTeams(rescored, currentTeams.length);
    });
    setAppliedCompetitionInfluence(null);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
    if (hideAnalysis) setCompData(null);
    showToast(
      hideAnalysis
        ? 'Competition analysis hidden. Teams restored to the normal balance.'
        : 'Competition adjustment removed. Teams restored to the normal balance.',
      'info'
    );
  }

  function handleHideCompetitionAnalysis() {
    if (appliedCompetitionInfluence != null) {
      handleClearCompetitionBalance({ hideAnalysis: true });
    } else {
      setCompData(null);
    }
  }

  function handleReset() {
    setTeams(null);
    setUnresolvedPlayers([]);
    setProgress(null);
    setCompData(null);
    setCompLoadingMode(null);
    setCompProgress(null);
    setAppliedCompetitionInfluence(null);
    setRefetchProgress(null);
    setSortCol('score');
    setSortDir('desc');
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
  }

  async function handleRetryPlayers(ids, { isAutoRetry = false } = {}) {
    const weights = activeWeights;
    const rows = unresolvedPlayers.filter((player) => ids.includes(player.id));
    if (rows.length === 0) return;
    if (rows.some((player) => !player.draftRsn.trim())) {
      showToast('Enter an RSN for every selected row before retrying.', 'warning');
      return;
    }

    const occupiedRsns = [
      ...teams.flatMap((team) => team.players.map((player) => player.rsn)),
      ...unresolvedPlayers
        .filter((player) => !ids.includes(player.id))
        .map((player) => player.draftRsn),
    ].map((rsn) => rsn.trim().toLowerCase());
    const retryRsns = rows.map((player) => player.draftRsn.trim().toLowerCase());
    const duplicateRsn = retryRsns.find(
      (rsn, index) => occupiedRsns.includes(rsn) || retryRsns.indexOf(rsn) !== index
    );
    if (duplicateRsn) {
      showToast(`"${duplicateRsn}" is already in this balance. Use a unique RSN.`, 'warning', 7000);
      return;
    }

    setUnresolvedPlayers((current) =>
      current.map((player) =>
        ids.includes(player.id)
          ? {
              ...player,
              isRetrying: true,
              autoRetryAttempted: player.autoRetryAttempted || isAutoRetry,
            }
          : player
      )
    );

    let allStats;
    try {
      allStats = await fetchWomStatsInBatches(
        rows.map((player) => player.draftRsn.trim()),
        rows.length > 1 ? setRefetchProgress : () => {}
      );
    } catch (e) {
      showToast(getWomErrorMessage(e), 'error', WOM_ERROR_TOAST_DURATION);
      setUnresolvedPlayers((current) =>
        current.map((player) =>
          ids.includes(player.id) ? { ...player, isRetrying: false } : player
        )
      );
      setRefetchProgress(null);
      return;
    }

    const resolved = [];
    const sourceUpdates = [];
    const replacements = new Map();
    rows.forEach((row, index) => {
      const classified = classifyWomPlayerResults(
        [allStats[index]],
        [{ rsn: row.draftRsn, hoursPerDay: row.hoursPerDay }],
        weights
      );
      if (classified.ready.length > 0) {
        const readyStats = {
          ...classified.ready[0],
          sourceIndex: row.sourceIndex,
          originalRsn: row.originalRsn,
        };
        resolved.push(readyStats);
        sourceUpdates.push({ sourceIndex: row.sourceIndex, rsn: readyStats.rsn });
        replacements.set(row.id, null);
      } else {
        replacements.set(row.id, {
          ...classified.unresolved[0],
          id: row.id,
          originalRsn: row.originalRsn,
          sourceIndex: row.sourceIndex,
          autoRetryAttempted: row.autoRetryAttempted || isAutoRetry,
          isRetrying: false,
        });
      }
    });

    if (resolved.length > 0) {
      const updatedSource = parseRsnInput();
      sourceUpdates.forEach(({ sourceIndex, rsn }) => {
        if (updatedSource[sourceIndex]) updatedSource[sourceIndex].rsn = rsn;
      });
      setRsnText(formatRsnLines(updatedSource));

      setTeams((currentTeams) => {
        const existingPlayers = currentTeams.flatMap((team) => team.players);
        const newlyScored = resolved.map((stats) => ({
          ...stats,
          score:
            scorePlayer(stats, weights) *
            (stats.hoursPerDay != null ? stats.hoursPerDay / hoursBaseline : 1),
        }));
        return balanceTeams([...existingPlayers, ...newlyScored], currentTeams.length);
      });
    }

    setUnresolvedPlayers((current) =>
      current
        .map((player) => (replacements.has(player.id) ? replacements.get(player.id) : player))
        .filter(Boolean)
    );
    setCompData(null);
    setAppliedCompetitionInfluence(null);
    setRefetchProgress(null);
    setHasManualEdits(false);
    setShowRebalanceConfirm(false);
    setSortCol('score');
    setSortDir('desc');

    const remainingCount = unresolvedPlayers.length - resolved.length;
    if (remainingCount === 0) {
      incrementTeamBalance().catch(() => {});
      showToast('All players resolved. Teams rebalanced!', 'success');
    } else if (resolved.length > 0) {
      showToast(`Resolved ${resolved.length}; ${remainingCount} still need attention.`, 'warning');
    } else {
      showToast('Those players still need attention. You can edit their RSNs or retry.', 'warning');
    }
  }

  function handleRetryPlayer(id) {
    return handleRetryPlayers([id]);
  }

  function handleRetryAll() {
    return handleRetryPlayers(unresolvedPlayers.map((player) => player.id));
  }

  function handleResolutionEdit(id, draftRsn) {
    setUnresolvedPlayers((current) =>
      current.map((player) => (player.id === id ? { ...player, draftRsn } : player))
    );
  }

  function handleRemoveUnresolved(id) {
    setUnresolvedPlayers((current) => current.filter((player) => player.id !== id));
    if (unresolvedPlayers.length === 1) {
      incrementTeamBalance().catch(() => {});
      showToast('Player removed. The remaining teams are now final.', 'info');
    }
  }

  function handleContinueWithoutYearly() {
    const yearlyRows = unresolvedPlayers.filter(
      (player) => player.status === WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE
    );
    if (yearlyRows.length === 0) return;

    const weights = { ...activeWeights, ehbyWeight: 0, ehpyWeight: 0 };
    setCustomWeights(weights);
    setTeams((currentTeams) => {
      const players = [
        ...currentTeams.flatMap((team) => team.players),
        ...yearlyRows.map((row) => ({
          ...row.stats,
          sourceIndex: row.sourceIndex,
          originalRsn: row.originalRsn,
          hoursPerDay: row.hoursPerDay,
        })),
      ].map((player) => ({
        ...player,
        score:
          scorePlayer(player, weights) *
          (player.hoursPerDay != null ? player.hoursPerDay / hoursBaseline : 1),
      }));
      return balanceTeams(players, currentTeams.length);
    });
    setUnresolvedPlayers((current) =>
      current.filter((player) => player.status !== WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE)
    );
    if (unresolvedPlayers.length === yearlyRows.length) {
      incrementTeamBalance().catch(() => {});
    }
    showToast('Yearly EHP/EHB weights set to zero. Partial players were added.', 'warning', 7000);
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
  const isResolvingPlayers = unresolvedPlayers.some((player) => player.isRetrying);
  const autoRetryPlayerIds = unresolvedPlayers
    .filter(
      (player) =>
        player.status === WOM_PLAYER_STATUS.TEMPORARY_ERROR &&
        !player.autoRetryAttempted &&
        !player.isRetrying &&
        player.draftRsn.trim() === player.rsn
    )
    .map((player) => player.id);
  const autoRetryLeadId = autoRetryPlayerIds[0];

  const assignedPlayerCount = teams?.reduce((sum, team) => sum + team.players.length, 0) ?? 0;
  const maxTeamTotal = teams ? Math.max(...teams.map((team) => team.total)) : 0;
  const compEntries = compData ? Object.values(compData) : [];
  const incompleteCompEntries = compEntries.filter((entry) => entry.analysisStatus !== 'READY');
  const comparableCompEntries = compEntries.filter(
    (entry) =>
      Math.max(
        entry.performance?.ehp?.competitions ?? 0,
        entry.performance?.ehb?.competitions ?? 0
      ) > 0
  );
  const noCompHistoryEntries = compEntries.filter(
    (entry) => entry.analysisStatus === 'READY' && entry.count === 0
  );
  const balanceRatio =
    teams && teams.length > 1 && assignedPlayerCount > 0 && maxTeamTotal > 0
      ? Math.min(...teams.map((team) => team.total)) / maxTeamTotal
      : null;

  // Show Hrs/D column only when at least one player has hours specified
  const hasHoursData = teams?.some((t) => t.players.some((p) => p.hoursPerDay !== null)) ?? false;

  // Determine columns to show, including Hrs/D and competition pace when applicable.
  const visibleColumns = [
    ...COLUMNS.filter((c) => c.key !== 'score'),
    ...(hasHoursData
      ? [{ key: 'hoursPerDay', label: 'Hrs/D', title: 'Estimated hours played per day' }]
      : []),
    COLUMNS.find((c) => c.key === 'score'),
    ...(compData
      ? [
          {
            key: '__comps',
            label: 'Comp Pace',
            title: 'Finished WOM competitions and EHP/EHB pace versus normal',
          },
        ]
      : []),
  ];

  return (
    <Box flex="1" my="36px" maxW="1100px" mx="auto" w="100%" px={4} py={8}>
      <VStack align="flex-start" spacing={2} mb={6}>
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
            Nerd Balancing Terminal
          </Text>
        </HStack>
        <GemTitle
          fontSize="3xl"
          fontWeight="700"
          style={{ fontFamily: HUD_FONT_DISPLAY, letterSpacing: '-0.01em' }}
        >
          Team Balancer
        </GemTitle>
        <Text color={HUD.textSecondary} fontSize="sm" maxW="640px" lineHeight="1.6">
          Paste RSNs, pick a metric, and get auto-balanced teams based on WOM stats.
        </Text>
      </VStack>

      <Accordion allowToggle mb={6}>
        <AccordionItem border="none">
          <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }} w="fit-content">
            <Text
              fontFamily={HUD_FONT_MONO}
              fontSize="10px"
              color={HUD.textSecondary}
              textTransform="uppercase"
              letterSpacing="0.2em"
              mr={1}
            >
              [ How it works ]
            </Text>
            <AccordionIcon color={HUD.textMuted} boxSize={3} />
          </AccordionButton>
          <AccordionPanel px={0} pt={2} pb={4}>
            <VStack
              align="stretch"
              spacing={3}
              bg={HUD.bgSurface}
              border="1px solid"
              borderColor={HUD.border}
              borderRadius="2px"
              p={4}
              maxW="640px"
            >
              {[
                {
                  step: '01',
                  text: 'Paste RSNs one per line. Optionally add " - N" after any name (i.e. "Zezima - 4") to weight that player by their estimated hours of play per day.',
                },
                {
                  step: '02',
                  text: 'Pick a balancing preset based on your event type: All-Rounder works for most events; PvM Focused or Raid Specialist prioritize bosses; Skilling Focused ignores combat entirely.',
                },
                {
                  step: '03',
                  text: 'Stats are pulled live from Wise Old Man: EHP, EHB, EHP/Y, EHB/Y, and raid KCs (CoX, ToB, ToA). Each player gets a weighted score, then teams are distributed to minimize the gap.',
                },
                {
                  step: '04',
                  text: "After balancing, drag players between teams to fine-tune. Export to CSV when you're happy.",
                },
              ].map(({ step, text }) => (
                <HStack key={step} align="flex-start" spacing={3}>
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
                  <Text fontSize="xs" color={HUD.textSecondary} lineHeight="1.65">
                    {text}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {!teams ? (
        <Box
          bg={HUD.bgSurface}
          borderRadius="2px"
          p={6}
          border="1px solid"
          borderColor={HUD.border}
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            bg: `linear-gradient(90deg, transparent 0%, ${HUD.cyan} 20%, ${HUD.cyan} 80%, transparent 100%)`,
            opacity: 0.4,
          }}
        >
          <VStack spacing={5} align="stretch">
            <Box>
              <HStack justify="space-between" mb={1.5}>
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="10px"
                  color={HUD.textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                >
                  RSNs
                </Text>
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="10px"
                  color={hasEnough ? HUD.cyan : HUD.amber}
                  textTransform="uppercase"
                  letterSpacing="0.1em"
                >
                  {parsed.length} player{parsed.length !== 1 ? 's' : ''}
                  {!hasEnough && parsed.length > 0 ? ` · need ${numTeams}+` : ''}
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
              <Text fontSize="xs" color="yellow.300" mt={2} lineHeight="1.5">
                Large player lists can trigger Wise Old Man rate limits and may need a few retry
                rounds. Successful lookups are kept between retries, so you will not need to start
                over.
              </Text>
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
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="10px"
                  color={HUD.textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  mb={1.5}
                >
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
                <Text
                  fontFamily={HUD_FONT_MONO}
                  fontSize="10px"
                  color={HUD.textSecondary}
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  mb={1.5}
                >
                  Balancing Metric
                </Text>
                <HStack flexWrap="wrap" spacing={1.5}>
                  {Object.keys(PRESETS).map((name) => {
                    const active = preset === name;
                    return (
                      <Button
                        key={name}
                        size="sm"
                        onClick={() => handlePresetChange(name)}
                        isDisabled={isFetching}
                        bg={active ? HUD.cyanGlow : 'transparent'}
                        color={active ? HUD.cyan : HUD.textSecondary}
                        borderWidth="1px"
                        borderStyle="solid"
                        borderColor={active ? HUD.cyan : HUD.border}
                        borderRadius="2px"
                        fontFamily={HUD_FONT_MONO}
                        fontSize="11px"
                        fontWeight="500"
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                        px={3}
                        h="30px"
                        boxShadow={active ? `0 0 10px ${HUD.cyanGlow}` : 'none'}
                        _hover={{
                          bg: active ? HUD.cyanGlow : HUD.bgElevated,
                          borderColor: active ? HUD.cyan : HUD.borderBright,
                          color: active ? HUD.cyan : HUD.textPrimary,
                        }}
                        _disabled={{
                          opacity: 0.4,
                          cursor: 'not-allowed',
                          _hover: {},
                        }}
                      >
                        {name}
                      </Button>
                    );
                  })}
                </HStack>
                <Text fontSize="xs" color={HUD.textMuted} mt={2} lineHeight="1.6">
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
              <Button
                isDisabled={!hasEnough}
                onClick={handleBalance}
                size="lg"
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
                  bg: HUD.cyan,
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
                ▸ Balance Teams
              </Button>
            )}
          </VStack>
        </Box>
      ) : (
        <VStack spacing={5} align="stretch">
          {/* Summary bar */}
          <HStack
            bg={HUD.bgSurface}
            borderRadius="2px"
            px={6}
            py={5}
            border="1px solid"
            borderColor={HUD.border}
            flexWrap="wrap"
            gap={6}
            align="center"
          >
            <VStack spacing={3} align="flex-start">
              <Text
                fontFamily={HUD_FONT_DISPLAY}
                fontWeight="600"
                fontSize="lg"
                color={HUD.textPrimary}
                lineHeight="1.1"
              >
                {assignedPlayerCount} ready player{assignedPlayerCount === 1 ? '' : 's'}{' '}
                <Text as="span" color={HUD.cyan} mx={2} fontFamily={HUD_FONT_MONO} fontWeight="500">
                  →
                </Text>{' '}
                {teams.length} teams
              </Text>
              <HStack spacing={2} flexWrap="wrap">
                <Chip py={1} px={2.5}>
                  {preset} metric
                </Chip>
                {unresolvedPlayers.length > 0 && (
                  <Chip mode="warn" py={1} px={2.5}>
                    Provisional · {unresolvedPlayers.length} need attention
                  </Chip>
                )}
                {appliedCompetitionInfluence != null && (
                  <Chip mode="active" py={1} px={2.5}>
                    Competition pace applied
                  </Chip>
                )}
              </HStack>
            </VStack>

            {balanceRatio !== null && (
              <Tooltip
                label="Balance ratio: min team score ÷ max team score. Closer to 1.0 = more balanced."
                placement="top"
              >
                <VStack spacing={1} align="flex-start" cursor="help">
                  <Text
                    fontFamily={HUD_FONT_MONO}
                    fontSize="10px"
                    color={HUD.textSecondary}
                    textTransform="uppercase"
                    letterSpacing="0.2em"
                  >
                    Balance
                  </Text>
                  <Text
                    fontFamily={HUD_FONT_DISPLAY}
                    fontSize="3xl"
                    fontWeight="700"
                    lineHeight="1"
                    color={
                      balanceRatio > 0.9
                        ? HUD.cyan
                        : balanceRatio > 0.75
                        ? HUD.textPrimary
                        : HUD.amber
                    }
                  >
                    {(balanceRatio * 100).toFixed(1)}%
                  </Text>
                  <Text fontSize="xs" color={HUD.textMuted}>
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
              <Button
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={() => exportToCsv(teams, preset, compData)}
                isDisabled={unresolvedPlayers.length > 0 || compLoading}
              >
                Export CSV
              </Button>
              <Button
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                onClick={handleReset}
                isDisabled={isResolvingPlayers || compLoading}
              >
                Start Over
              </Button>
            </HStack>
          </HStack>

          <Text fontSize="xs" color="gray.500" px={1}>
            {unresolvedPlayers.length > 0
              ? 'These teams are provisional. Resolve the attention rows before exporting or manually rearranging players.'
              : 'This is not perfect team balancing! You know your players better than any algorithm does. Drag players between teams to adjust; scores recalculate automatically.'}
          </Text>

          <Box
            px={4}
            py={3.5}
            bg={HUD.bgSurface}
            border="1px solid"
            borderColor={HUD.border}
            borderRadius="2px"
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
            <HStack align="flex-start" justify="space-between" spacing={4} flexWrap="wrap">
              <Box flex="1 1 460px">
                <Text
                  fontFamily={HUD_FONT_DISPLAY}
                  fontSize="md"
                  color={HUD.textPrimary}
                  fontWeight="600"
                >
                  Do they go full sweat during competitions?
                </Text>
                <Text fontSize="xs" color={HUD.textSecondary} mt={1.5} lineHeight="1.6">
                  Compare each player’s EHP and EHB rate during up to five recent finished WOM
                  competitions against their normal past-year rate. For example, 150% means they
                  progressed 50% faster in competitions than usual.
                </Text>
                <Text fontSize="10px" color={HUD.textMuted} mt={1.5} lineHeight="1.6">
                  This is extra context only. It does not change scores or rebalance the teams.
                  Large rosters may take a little while because WOM requests are paced.
                </Text>
                {unresolvedPlayers.length > 0 && (
                  <Text fontSize="10px" color={HUD.amber} mt={1.5}>
                    Resolve the player rows needing attention before running this comparison.
                  </Text>
                )}
              </Box>

              {!compData ? (
                <Button
                  size="sm"
                  onClick={() => handleLoadCompHistory()}
                  isLoading={compLoading}
                  isDisabled={unresolvedPlayers.length > 0}
                  loadingText="Comparing..."
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
                  px={4}
                  h="32px"
                  _hover={{ bg: HUD.cyanGlow, boxShadow: `0 0 12px ${HUD.cyanGlow}` }}
                  _disabled={{ opacity: 0.4, cursor: 'not-allowed', _hover: {} }}
                >
                  Compare Competition Pace
                </Button>
              ) : (
                <HStack spacing={1.5} flexWrap="wrap">
                  {incompleteCompEntries.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleLoadCompHistory({
                          rsns: incompleteCompEntries.map((entry) => entry.rsn),
                          forceRefresh: false,
                        })
                      }
                      isLoading={compLoading && compLoadingMode === 'retry'}
                      isDisabled={compLoading}
                      loadingText="Retrying..."
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
                      px={3}
                      h="30px"
                      _hover={{ bg: 'rgba(255,184,77,0.08)', borderColor: HUD.amber }}
                      _disabled={{ opacity: 0.4, cursor: 'not-allowed', _hover: {} }}
                    >
                      Retry {incompleteCompEntries.length} Incomplete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleLoadCompHistory({ forceRefresh: true })}
                    isLoading={compLoading && compLoadingMode === 'refresh'}
                    isDisabled={compLoading}
                    loadingText="Rechecking..."
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
                    px={3}
                    h="30px"
                    _hover={{
                      bg: HUD.bgElevated,
                      borderColor: HUD.borderBright,
                      color: HUD.textPrimary,
                    }}
                    _disabled={{ opacity: 0.4, cursor: 'not-allowed', _hover: {} }}
                  >
                    Recheck All
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleHideCompetitionAnalysis}
                    isDisabled={compLoading}
                    color={HUD.textMuted}
                    fontFamily={HUD_FONT_MONO}
                    fontSize="11px"
                    fontWeight="500"
                    textTransform="uppercase"
                    letterSpacing="0.1em"
                    h="30px"
                    _hover={{ bg: HUD.bgElevated, color: HUD.textPrimary }}
                    _disabled={{ opacity: 0.4, cursor: 'not-allowed', _hover: {} }}
                  >
                    {appliedCompetitionInfluence == null ? 'Hide' : 'Hide and Restore'}
                  </Button>
                </HStack>
              )}
            </HStack>

            {compData && (
              <HStack spacing={2} mt={3} flexWrap="wrap">
                <Badge colorScheme="blue">Checked {compEntries.length} players</Badge>
                <Badge colorScheme="green">{comparableCompEntries.length} with pace data</Badge>
                <Badge colorScheme="gray">
                  {noCompHistoryEntries.length} with no finished competitions
                </Badge>
                {incompleteCompEntries.length > 0 && (
                  <Badge colorScheme="orange">
                    {incompleteCompEntries.length} incomplete, safe to retry
                  </Badge>
                )}
              </HStack>
            )}
            {compLoading && (
              <Box mt={3}>
                <HStack justify="space-between" mb={1}>
                  <Text fontSize="10px" color="blue.300">
                    {compProgress?.current
                      ? `Checking ${compProgress.current}`
                      : 'Saving completed competition results'}
                  </Text>
                  <Text fontSize="10px" color="blue.200" fontWeight="bold">
                    {compProgress?.fetched ?? 0} / {compProgress?.total ?? 0} players
                  </Text>
                </HStack>
                <Progress
                  size="xs"
                  colorScheme="blue"
                  value={
                    compProgress?.total ? (compProgress.fetched / compProgress.total) * 100 : 0
                  }
                  borderRadius="full"
                />
                <Text fontSize="10px" color="blue.300" mt={1}>
                  {compLoadingMode === 'retry'
                    ? 'Retrying only incomplete players. Existing results remain in place.'
                    : compLoadingMode === 'refresh'
                    ? 'Rechecking every player and replacing the previous analysis as each batch finishes.'
                    : 'Results are saved every five players. Large rosters commonly take a couple minutes at least, so go touch some grass.'}
                </Text>
              </Box>
            )}

            {compData && comparableCompEntries.length > 0 && (
              <Box mt={4} pt={3} borderTop="1px solid" borderColor="blue.700">
                <HStack justify="space-between" align="flex-start" spacing={4} flexWrap="wrap">
                  <Box flex="1 1 440px">
                    <HStack spacing={2} flexWrap="wrap">
                      <Text fontSize="sm" color="blue.100" fontWeight="bold">
                        Balance teams with competition pace considered
                      </Text>
                      {appliedCompetitionInfluence != null && (
                        <Badge colorScheme="green">
                          Applied at {Math.round(appliedCompetitionInfluence * 100)}% influence
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="blue.200" mt={1} lineHeight="1.6">
                      This applies a controlled modifier to each player’s normal score. At the
                      current setting, a player at 150% of their usual pace receives a{' '}
                      {(competitionInfluence * 50).toFixed(1)}% score increase. Pace is capped
                      between 50% and 200%, and players without comparable data are unchanged.
                    </Text>
                    {incompleteCompEntries.length > 0 && (
                      <Text fontSize="10px" color="orange.300" mt={1}>
                        {incompleteCompEntries.length} incomplete player
                        {incompleteCompEntries.length === 1 ? '' : 's'} will use available data or
                        receive no adjustment. Retry them first for the fairest result.
                      </Text>
                    )}
                    {hasManualEdits && (
                      <Text fontSize="10px" color="orange.300" mt={1}>
                        {appliedCompetitionInfluence == null
                          ? 'Applying this will replace your manual team moves.'
                          : 'Updating or restoring the balance will replace your manual team moves.'}
                      </Text>
                    )}
                  </Box>

                  <Box minW="220px" flex="0 1 300px">
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="xs" color="blue.200">
                        Competition influence
                      </Text>
                      <Text fontSize="xs" color="white" fontWeight="bold">
                        {Math.round(competitionInfluence * 100)}%
                      </Text>
                    </HStack>
                    <Slider
                      min={0.1}
                      max={0.5}
                      step={0.05}
                      value={competitionInfluence}
                      onChange={setCompetitionInfluence}
                      isDisabled={compLoading}
                      focusThumbOnChange={false}
                    >
                      <SliderTrack bg="blue.800">
                        <SliderFilledTrack bg="cyan.400" />
                      </SliderTrack>
                      <SliderThumb boxSize={3} />
                    </Slider>
                    <HStack spacing={2} mt={2} justify="flex-end" flexWrap="wrap">
                      {appliedCompetitionInfluence != null && (
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="whiteAlpha"
                          onClick={() => handleClearCompetitionBalance()}
                          isDisabled={compLoading}
                        >
                          Restore Normal Balance
                        </Button>
                      )}
                      <Button
                        size="sm"
                        colorScheme="cyan"
                        onClick={handleApplyCompetitionBalance}
                        isDisabled={compLoading}
                      >
                        {appliedCompetitionInfluence == null
                          ? 'Balance With Competition Pace'
                          : 'Update Competition Balance'}
                      </Button>
                    </HStack>
                  </Box>
                </HStack>
              </Box>
            )}
          </Box>

          {/* Preset + weight controls available in results view too */}
          <Box
            bg={HUD.bgSurface}
            borderRadius="2px"
            p={4}
            border="1px solid"
            borderColor={HUD.border}
          >
            <VStack spacing={3} align="stretch">
              <HStack flexWrap="wrap" spacing={1.5}>
                {Object.keys(PRESETS).map((name) => {
                  const active = preset === name && !customWeights;
                  return (
                    <Button
                      key={name}
                      size="sm"
                      onClick={() => handlePresetChange(name)}
                      isDisabled={isResolvingPlayers}
                      bg={active ? HUD.cyanGlow : 'transparent'}
                      color={active ? HUD.cyan : HUD.textSecondary}
                      borderWidth="1px"
                      borderStyle="solid"
                      borderColor={active ? HUD.cyan : HUD.border}
                      borderRadius="2px"
                      fontFamily={HUD_FONT_MONO}
                      fontSize="11px"
                      fontWeight="500"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                      px={3}
                      h="30px"
                      boxShadow={active ? `0 0 10px ${HUD.cyanGlow}` : 'none'}
                      _hover={{
                        bg: active ? HUD.cyanGlow : HUD.bgElevated,
                        borderColor: active ? HUD.cyan : HUD.borderBright,
                        color: active ? HUD.cyan : HUD.textPrimary,
                      }}
                      _disabled={{
                        opacity: 0.4,
                        cursor: 'not-allowed',
                        _hover: {},
                      }}
                    >
                      {name}
                    </Button>
                  );
                })}
              </HStack>
              <Text fontSize="xs" color={HUD.textSecondary} lineHeight="1.6">
                {PRESET_DESCRIPTIONS[preset]}
              </Text>
              <Text fontSize="xs" color={HUD.textMuted} px={1} lineHeight="1.6">
                Score = a weighted sum of EHP, EHB, Total Level, EHP/Y, EHB/Y, and raid KCs (CoX,
                ToB, ToA) based on the selected preset. EHP/Y and EHB/Y (gains over the past year)
                are weighted heavily since they reflect how active a player has been recently, not
                just their total lifetime progress. If hours/day are specified (i.e. "RSN - 8"), the
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
                    isDisabled={isResolvingPlayers}
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
                              isDisabled={isResolvingPlayers}
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
                        isDisabled={!customWeights || isResolvingPlayers}
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
                          .map((player) =>
                            calculatePlayerScore(
                              player,
                              activeWeights,
                              hoursBaseline,
                              compData,
                              appliedCompetitionInfluence ?? 0
                            )
                          );
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
                  bg={HUD.bgSurface}
                  border="1px solid"
                  borderColor={isDragTarget ? color : HUD.border}
                  borderRadius="2px"
                  overflow="hidden"
                  transition="border-color 0.15s, box-shadow 0.15s"
                  boxShadow={isDragTarget ? `0 0 24px ${color}44` : 'none'}
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    bg: color,
                    boxShadow: `0 0 12px ${color}66`,
                  }}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, i)}
                >
                  {/* Team header — scoreboard moment */}
                  <Box px={4} py={3.5} borderBottom="1px solid" borderColor={HUD.border}>
                    <HStack justify="space-between" align="center">
                      <HStack spacing={3} align="baseline">
                        <Text
                          fontFamily={HUD_FONT_MONO}
                          fontSize="10px"
                          color={HUD.textMuted}
                          textTransform="uppercase"
                          letterSpacing="0.2em"
                        >
                          Team
                        </Text>
                        <Text
                          fontFamily={HUD_FONT_DISPLAY}
                          fontWeight="700"
                          fontSize="xl"
                          color={color}
                          lineHeight="1"
                        >
                          {String(i + 1).padStart(2, '0')}
                        </Text>
                        <Text fontFamily={HUD_FONT_MONO} fontSize="10px" color={HUD.textMuted}>
                          · {team.players.length} player{team.players.length === 1 ? '' : 's'}
                        </Text>
                      </HStack>
                      <VStack spacing={0} align="flex-end">
                        <Text
                          fontFamily={HUD_FONT_MONO}
                          fontSize="9px"
                          color={HUD.textMuted}
                          textTransform="uppercase"
                          letterSpacing="0.2em"
                        >
                          Score
                        </Text>
                        <Text
                          fontFamily={HUD_FONT_DISPLAY}
                          fontWeight="700"
                          fontSize="2xl"
                          color={color}
                          lineHeight="1"
                          mt={0.5}
                        >
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
                        <Box as="tr" bg={HUD.bgRecessed}>
                          {/* Sticky name column header */}
                          <Box
                            as="th"
                            position="sticky"
                            left={0}
                            zIndex={1}
                            bg={HUD.bgRecessed}
                            px={4}
                            py={2}
                            textAlign="left"
                            fontFamily={HUD_FONT_MONO}
                            fontSize="9px"
                            color={HUD.textMuted}
                            fontWeight="500"
                            textTransform="uppercase"
                            letterSpacing="0.15em"
                            borderBottom="1px solid"
                            borderColor={HUD.border}
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
                              py={2}
                              textAlign="right"
                              fontFamily={HUD_FONT_MONO}
                              fontSize="9px"
                              color={sortCol === col.key ? HUD.cyan : HUD.textMuted}
                              fontWeight="500"
                              textTransform="uppercase"
                              letterSpacing="0.15em"
                              borderBottom="1px solid"
                              borderColor={HUD.border}
                              cursor="pointer"
                              whiteSpace="nowrap"
                              _hover={{ color: HUD.textPrimary }}
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
                              draggable={unresolvedPlayers.length === 0}
                              onDragStart={() => onDragStart(player.rsn, i)}
                              onDragEnd={onDragEnd}
                              bg="gray.800"
                              _hover={{ bg: 'gray.750' }}
                              cursor={unresolvedPlayers.length === 0 ? 'grab' : 'default'}
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
                                          N/A
                                        </Text>
                                      </Box>
                                    );
                                  }
                                  const analysisUnavailable =
                                    compEntry.analysisStatus === 'TEMPORARY_ERROR' ||
                                    compEntry.analysisStatus === 'NOT_FOUND';
                                  const analysisPartial = compEntry.analysisStatus === 'PARTIAL';
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
                                              analysisUnavailable
                                                ? 'red'
                                                : analysisPartial
                                                ? 'orange'
                                                : compEntry.count >= 15
                                                ? 'green'
                                                : compEntry.count >= 5
                                                ? 'yellow'
                                                : 'gray'
                                            }
                                            fontSize="10px"
                                            cursor="pointer"
                                          >
                                            {analysisUnavailable
                                              ? 'Unavailable'
                                              : analysisPartial
                                              ? `${compEntry.count} · partial`
                                              : compEntry.count}
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
                                            {analysisUnavailable ? (
                                              <VStack align="stretch" spacing={2}>
                                                <Text fontWeight="bold" fontSize="sm">
                                                  Competition history unavailable
                                                </Text>
                                                <Text fontSize="xs" color="gray.400">
                                                  WOM did not return this player’s history. This is
                                                  not the same as having zero competitions and is
                                                  safe to retry.
                                                </Text>
                                                <Button
                                                  size="xs"
                                                  colorScheme="orange"
                                                  variant="outline"
                                                  onClick={() =>
                                                    handleLoadCompHistory({
                                                      rsns: [player.rsn],
                                                      forceRefresh: false,
                                                    })
                                                  }
                                                  isLoading={compLoading}
                                                >
                                                  Retry this player
                                                </Button>
                                              </VStack>
                                            ) : (
                                              <>
                                                <Text fontWeight="bold" mb={1} fontSize="sm">
                                                  {compEntry.count} finished competition
                                                  {compEntry.count !== 1 ? 's' : ''} on WOM
                                                </Text>
                                                {analysisPartial && (
                                                  <Text fontSize="10px" color="orange.300" mb={2}>
                                                    Only part of the recent sample loaded. The pace
                                                    shown below is usable but incomplete.
                                                  </Text>
                                                )}
                                                {compEntry.count === 0 ? (
                                                  <Text fontSize="xs" color="gray.400">
                                                    No finished WOM competitions were found for this
                                                    player.
                                                  </Text>
                                                ) : (
                                                  <>
                                                    <Text fontSize="xs" color="gray.400" mb={2}>
                                                      Competition pace versus their usual past-year
                                                      pace:
                                                    </Text>
                                                    {['ehp', 'ehb'].map((metric) => {
                                                      const performance =
                                                        compEntry.performance?.[metric];
                                                      const yearlyGain =
                                                        player[
                                                          metric === 'ehp' ? 'ehpy' : 'ehby'
                                                        ] ?? 0;
                                                      const expected =
                                                        yearlyGain > 0 &&
                                                        performance?.durationDays > 0
                                                          ? (yearlyGain / 365) *
                                                            performance.durationDays
                                                          : 0;
                                                      const ratio =
                                                        expected > 0
                                                          ? performance.gained / expected
                                                          : null;
                                                      return (
                                                        <Box key={metric} mb={1}>
                                                          <Text fontSize="xs" color="gray.300">
                                                            {metric.toUpperCase()}:{' '}
                                                            <Text
                                                              as="span"
                                                              fontWeight="bold"
                                                              color="blue.200"
                                                            >
                                                              {ratio == null
                                                                ? 'Not enough data'
                                                                : `${formatPace(
                                                                    ratio
                                                                  )} of usual pace`}
                                                            </Text>
                                                          </Text>{' '}
                                                          <Text fontSize="10px" color="gray.500">
                                                            {ratio == null
                                                              ? 'Needs both past-year activity and an analyzed competition.'
                                                              : `${performance.gained.toFixed(
                                                                  1
                                                                )} ${metric.toUpperCase()} across ${
                                                                  performance.competitions
                                                                } sampled competition${
                                                                  performance.competitions === 1
                                                                    ? ''
                                                                    : 's'
                                                                }.`}
                                                          </Text>
                                                        </Box>
                                                      );
                                                    })}
                                                    {player.competitionPace != null && (
                                                      <Box
                                                        mt={2}
                                                        pt={2}
                                                        borderTop="1px solid"
                                                        borderColor="gray.700"
                                                      >
                                                        <Text fontSize="xs" color="cyan.200">
                                                          Balance modifier:{' '}
                                                          <Text as="span" fontWeight="bold">
                                                            {player.competitionScoreMultiplier >= 1
                                                              ? '+'
                                                              : ''}
                                                            {(
                                                              (player.competitionScoreMultiplier -
                                                                1) *
                                                              100
                                                            ).toFixed(1)}
                                                            % score
                                                          </Text>
                                                        </Text>
                                                        <Text fontSize="10px" color="gray.500">
                                                          Combined competition pace:{' '}
                                                          {formatPace(player.competitionPace)} of
                                                          normal.
                                                        </Text>
                                                      </Box>
                                                    )}
                                                    {compEntry.recent.length > 0 && (
                                                      <VStack align="stretch" spacing={0.5} mt={2}>
                                                        {compEntry.recent.map((c) => (
                                                          <Box
                                                            key={c.id}
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
                                                        ))}
                                                      </VStack>
                                                    )}
                                                  </>
                                                )}
                                              </>
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
                                        {player.hoursPerDay !== null ? player.hoursPerDay : 'N/A'}
                                      </Text>
                                    </Box>
                                  );
                                }
                                const yearlyUnavailable =
                                  player.yearlyGainsUnavailable &&
                                  (col.key === 'ehpy' || col.key === 'ehby');
                                const val = player[col.key] ?? 0;
                                const isScore = col.key === 'score';
                                return (
                                  <Box as="td" key={col.key} px={3} py={2} textAlign="right">
                                    <Text
                                      fontSize="xs"
                                      fontWeight={isScore ? 'bold' : 'normal'}
                                      color={isScore ? color : 'gray.200'}
                                    >
                                      {yearlyUnavailable ? 'N/A' : fmt(val)}
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
                        const avg = (key) => {
                          const values = team.players
                            .map((player) => player[key])
                            .filter((value) => value != null);
                          if (values.length === 0) return null;
                          return values.reduce((sum, value) => sum + value, 0) / values.length;
                        };
                        const stats = [
                          { label: 'avg EHP', val: avg('ehp') },
                          { label: 'avg EHP/Y', val: avg('ehpy') },
                          { label: 'avg EHB', val: avg('ehb') },
                          { label: 'avg EHB/Y', val: avg('ehby') },
                        ];
                        const ehpPace = competitionPaceRatio(team.players, compData, 'ehp');
                        const ehbPace = competitionPaceRatio(team.players, compData, 'ehb');
                        return (
                          <HStack spacing={4} flexWrap="wrap">
                            {stats.map(({ label, val }) => (
                              <Text key={label} fontSize="9px" color="gray.500">
                                {label}:{' '}
                                <Text as="span" color="gray.300">
                                  {val == null ? 'N/A' : fmt(val)}
                                </Text>
                              </Text>
                            ))}
                            <Text fontSize="9px" color="gray.500">
                              {team.players.length} player{team.players.length !== 1 ? 's' : ''}
                            </Text>
                            {compData && (
                              <Tooltip
                                label="EHP/EHB earned during sampled competitions versus each player's past-year pace, normalized for competition duration. This measures efficiency gains, not placement, rank, or the competition's original metric. N/A means there is not enough history to compare."
                                placement="top"
                              >
                                <Text fontSize="9px" color="blue.300" cursor="help">
                                  vs usual pace: EHP {formatPace(ehpPace)} · EHB{' '}
                                  {formatPace(ehbPace)}
                                </Text>
                              </Tooltip>
                            )}
                          </HStack>
                        );
                      })()}
                    </Box>
                  )}
                </Box>
              );
            })}
          </SimpleGrid>

          {/* Players whose WOM data needs attention */}
          {unresolvedPlayers.length > 0 && (
            <Box
              bg="gray.800"
              border="1px solid"
              borderColor="orange.700"
              borderRadius="xl"
              overflow="hidden"
            >
              <Box bg="gray.700" px={4} py={3} borderBottom="1px solid" borderColor="orange.700">
                <HStack spacing={3} justify="space-between" flexWrap="wrap">
                  <Box>
                    <HStack spacing={2}>
                      <Box w={3} h={3} borderRadius="full" bg="orange.400" flexShrink={0} />
                      <Text fontWeight="black" fontSize="md">
                        Players need attention
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Ready players are saved above. Fix, retry, or remove these rows before export.
                    </Text>
                    <Text fontSize="xs" color="yellow.300" mt={1} maxW="650px">
                      Rate limits can clear gradually, especially for large lists. Retry only checks
                      the unresolved players, and it is normal to need a few rounds.
                    </Text>
                  </Box>
                  <HStack spacing={2}>
                    {unresolvedPlayers.some(
                      (player) => player.status === WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="yellow"
                        onClick={handleContinueWithoutYearly}
                        isDisabled={isResolvingPlayers}
                      >
                        Continue without yearly metrics
                      </Button>
                    )}
                    <Button
                      size="sm"
                      colorScheme="orange"
                      onClick={handleRetryAll}
                      isLoading={unresolvedPlayers.some((player) => player.isRetrying)}
                      loadingText="Retrying"
                    >
                      Retry all
                    </Button>
                  </HStack>
                </HStack>
              </Box>
              {refetchProgress && (
                <Box px={4} py={3} borderBottom="1px solid" borderColor="gray.700">
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
              )}
              <VStack spacing={0} align="stretch">
                {unresolvedPlayers.map((player, index) => {
                  const isEdited = player.draftRsn.trim() !== player.rsn;
                  const isTemporary = player.status === WOM_PLAYER_STATUS.TEMPORARY_ERROR;
                  const isYearly = player.status === WOM_PLAYER_STATUS.YEARLY_UNAVAILABLE;
                  const description = isTemporary
                    ? player.errorCode === 'RATE_LIMITED'
                      ? isEdited
                        ? 'Name changed. Save and retry when you are ready.'
                        : player.autoRetryAttempted
                        ? 'WOM still rate-limited this lookup. Retry again when you are ready.'
                        : 'WOM rate-limited this lookup. It will retry once automatically.'
                      : player.autoRetryAttempted
                      ? 'WOM is still unavailable for this lookup. Retry again when you are ready.'
                      : 'WOM was temporarily unavailable. It will retry once automatically.'
                    : isYearly
                    ? 'Core stats loaded, but yearly EHP/EHB is unavailable and currently weighted.'
                    : 'No WOM player matched this exact name. Check spelling and spacing.';

                  return (
                    <Box
                      key={player.id}
                      px={4}
                      py={3}
                      borderBottom={index < unresolvedPlayers.length - 1 ? '1px solid' : 'none'}
                      borderColor="gray.700"
                    >
                      <HStack spacing={3} align="center" flexWrap="wrap">
                        <Box minW="145px" flex="1 1 240px">
                          <HStack spacing={2} mb={1}>
                            <Badge
                              colorScheme={isTemporary ? 'yellow' : isYearly ? 'purple' : 'orange'}
                            >
                              {isTemporary
                                ? 'Temporary error'
                                : isYearly
                                ? 'Yearly stats'
                                : 'Not found'}
                            </Badge>
                            {player.id === autoRetryLeadId && (
                              <AutoRetryCountdown
                                disabled={isResolvingPlayers}
                                onRetry={() =>
                                  handleRetryPlayers(autoRetryPlayerIds, { isAutoRetry: true })
                                }
                              />
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.400">
                            {description}
                          </Text>
                        </Box>
                        <Input
                          size="sm"
                          value={player.draftRsn}
                          onChange={(event) => handleResolutionEdit(player.id, event.target.value)}
                          isDisabled={player.isRetrying}
                          aria-label={`RSN for ${player.rsn}`}
                          maxW="240px"
                          fontFamily="mono"
                        />
                        <HStack spacing={2}>
                          <Button
                            size="sm"
                            colorScheme="orange"
                            variant="outline"
                            onClick={() => handleRetryPlayer(player.id)}
                            isLoading={player.isRetrying}
                            loadingText="Retrying"
                            isDisabled={isResolvingPlayers || !player.draftRsn.trim()}
                          >
                            {isEdited ? 'Save & retry' : 'Retry now'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            colorScheme="whiteAlpha"
                            onClick={() => handleRemoveUnresolved(player.id)}
                            isDisabled={
                              isResolvingPlayers ||
                              assignedPlayerCount + unresolvedPlayers.length <= numTeams
                            }
                            title={
                              assignedPlayerCount + unresolvedPlayers.length <= numTeams
                                ? `Keep at least ${numTeams} players for ${numTeams} teams`
                                : 'Remove this player from this balance'
                            }
                          >
                            Remove
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
              <Box px={4} py={3} borderTop="1px solid" borderColor="gray.700">
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    onClick={handleReset}
                    isDisabled={isResolvingPlayers}
                  >
                    Go back to full list
                  </Button>
                  <Text fontSize="xs" color="gray.500">
                    Editing here preserves each player’s hours/day value.
                  </Text>
                </HStack>
              </Box>
            </Box>
          )}
        </VStack>
      )}
    </Box>
  );
}
