import { useState, useEffect, useCallback } from 'react';
import trackscapeImg from '../assets/trackscape.png';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Select,
  Spinner,
  Center,
  IconButton,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Image,
  Collapse,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon, ChevronDownIcon } from '@chakra-ui/icons';

const WOM_BASE = 'https://api.wiseoldman.net/v2';
const LEAGUES_WOM_BASE = 'https://api.wiseoldman.net/league';
const GROUP_ID = 9738;
const LEAGUES_GROUP_ID = 211;
const REFRESH_COOLDOWN_MS = 60_000;
const AUTO_REFRESH_MS = 60 * 60_000;

const SKILL_OPTIONS = [
  { value: 'ehp', label: 'EHP (Efficient Hours Played)' },
  { value: 'ehb', label: 'EHB (Efficient Hours Bossed)' },
  { value: 'overall', label: 'Overall XP' },
  { value: 'attack', label: 'Attack' },
  { value: 'defence', label: 'Defence' },
  { value: 'strength', label: 'Strength' },
  { value: 'hitpoints', label: 'Hitpoints' },
  { value: 'ranged', label: 'Ranged' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'magic', label: 'Magic' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'woodcutting', label: 'Woodcutting' },
  { value: 'fishing', label: 'Fishing' },
  { value: 'firemaking', label: 'Firemaking' },
  { value: 'crafting', label: 'Crafting' },
  { value: 'smithing', label: 'Smithing' },
  { value: 'mining', label: 'Mining' },
  { value: 'herblore', label: 'Herblore' },
  { value: 'agility', label: 'Agility' },
  { value: 'thieving', label: 'Thieving' },
  { value: 'slayer', label: 'Slayer' },
  { value: 'farming', label: 'Farming' },
  { value: 'runecrafting', label: 'Runecrafting' },
  { value: 'hunter', label: 'Hunter' },
  { value: 'construction', label: 'Construction' },
];

const BOSS_OPTIONS = [
  { value: 'abyssal_sire', label: 'Abyssal Sire' },
  { value: 'alchemical_hydra', label: 'Alchemical Hydra' },
  { value: 'amoxliatl', label: 'Amoxliatl' },
  { value: 'araxxor', label: 'Araxxor' },
  { value: 'artio', label: 'Artio' },
  { value: 'barrows_chests', label: 'Barrows' },
  { value: 'bryophyta', label: 'Bryophyta' },
  { value: 'callisto', label: 'Callisto' },
  { value: 'calvarion', label: "Calvar'ion" },
  { value: 'cerberus', label: 'Cerberus' },
  { value: 'chambers_of_xeric', label: 'Chambers of Xeric' },
  { value: 'chambers_of_xeric_challenge_mode', label: 'CoX Challenge Mode' },
  { value: 'chaos_elemental', label: 'Chaos Elemental' },
  { value: 'chaos_fanatic', label: 'Chaos Fanatic' },
  { value: 'commander_zilyana', label: 'Commander Zilyana' },
  { value: 'corporeal_beast', label: 'Corporeal Beast' },
  { value: 'crazy_archaeologist', label: 'Crazy Archaeologist' },
  { value: 'dagannoth_prime', label: 'Dagannoth Prime' },
  { value: 'dagannoth_rex', label: 'Dagannoth Rex' },
  { value: 'dagannoth_supreme', label: 'Dagannoth Supreme' },
  { value: 'deranged_archaeologist', label: 'Deranged Archaeologist' },
  { value: 'duke_sucellus', label: 'Duke Sucellus' },
  { value: 'general_graardor', label: 'General Graardor' },
  { value: 'giant_mole', label: 'Giant Mole' },
  { value: 'grotesque_guardians', label: 'Grotesque Guardians' },
  { value: 'hespori', label: 'Hespori' },
  { value: 'kalphite_queen', label: 'Kalphite Queen' },
  { value: 'king_black_dragon', label: 'King Black Dragon' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'kreearra', label: "Kree'arra" },
  { value: 'kril_tsutsaroth', label: "K'ril Tsutsaroth" },
  { value: 'maggot_king', label: 'The Maggot King' },
  { value: 'mimic', label: 'The Mimic' },
  { value: 'nex', label: 'Nex' },
  { value: 'nightmare', label: 'The Nightmare' },
  { value: 'obor', label: 'Obor' },
  { value: 'phantom_muspah', label: 'Phantom Muspah' },
  { value: 'phosanis_nightmare', label: "Phosani's Nightmare" },
  { value: 'sarachnis', label: 'Sarachnis' },
  { value: 'scorpia', label: 'Scorpia' },
  { value: 'scurrius', label: 'Scurrius' },
  { value: 'skotizo', label: 'Skotizo' },
  { value: 'sol_heredit', label: 'Sol Heredit' },
  { value: 'spindel', label: 'Spindel' },
  { value: 'tempoross', label: 'Tempoross' },
  { value: 'the_corrupted_gauntlet', label: 'The Corrupted Gauntlet' },
  { value: 'the_gauntlet', label: 'The Gauntlet' },
  { value: 'the_hueycoatl', label: 'The Hueycoatl' },
  { value: 'the_leviathan', label: 'The Leviathan' },
  { value: 'the_whisperer', label: 'The Whisperer' },
  { value: 'theatre_of_blood', label: 'Theatre of Blood' },
  { value: 'theatre_of_blood_hard_mode', label: 'Theatre of Blood HM' },
  { value: 'thermonuclear_smoke_devil', label: 'Thermonuclear Smoke Devil' },
  { value: 'tombs_of_amascut', label: 'Tombs of Amascut' },
  { value: 'tombs_of_amascut_expert', label: 'ToA Expert Mode' },
  { value: 'tzkal_zuk', label: 'TzKal-Zuk' },
  { value: 'tztok_jad', label: 'TzTok-Jad' },
  { value: 'vardorvis', label: 'Vardorvis' },
  { value: 'venenatis', label: 'Venenatis' },
  { value: 'vetion', label: "Vet'ion" },
  { value: 'vorkath', label: 'Vorkath' },
  { value: 'wintertodt', label: 'Wintertodt' },
  { value: 'zalcano', label: 'Zalcano' },
  { value: 'zulrah', label: 'Zulrah' },
];

const PERIOD_OPTIONS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
];

function formatNumber(n) {
  if (n == null) return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.round(n));
}

function formatGained(value, metric) {
  if (value == null || value === 0) return null;
  if (metric === 'ehp' || metric === 'ehb') return '+' + value.toFixed(1) + ' hrs';
  return '+' + formatNumber(value);
}

function daysAgo(dateStr) {
  if (!dateStr) return 'never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return 'never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function accountTag(type) {
  if (type === 'ironman') return 'IM';
  if (type === 'hardcore_ironman') return 'HC';
  if (type === 'ultimate') return 'UIM';
  if (type === 'group_ironman') return 'GIM';
  return null;
}

// --- Stat Cards ---
function StatCard({ label, value, sub, cardBg = 'dark.cardBg' }) {
  return (
    <Box bg={cardBg} borderRadius="12px" p={5} flex="1" minW="130px">
      <Text
        fontSize="xs"
        color="whiteAlpha.500"
        mb={1}
        textTransform="uppercase"
        letterSpacing="wide"
      >
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold">
        {value ?? '—'}
      </Text>
      {sub && (
        <Text fontSize="xs" color="whiteAlpha.400" mt={1}>
          {sub}
        </Text>
      )}
    </Box>
  );
}

// --- Top Gainers ---
function TopGainers({ cardBg = 'dark.cardBg' }) {
  const [metric, setMetric] = useState('ehp');
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${WOM_BASE}/groups/${GROUP_ID}/gained?metric=${metric}&period=${period}&limit=20`)
      .then((r) => {
        if (!r.ok) throw new Error(`WOM API error ${r.status}`);
        return r.json();
      })
      .then((json) => {
        const entries = Array.isArray(json)
          ? json.filter((e) => (e.gained ?? e.data?.gained ?? 0) > 0)
          : [];
        setData(entries);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [metric, period]);

  return (
    <Box
      bg={cardBg}
      borderRadius="12px"
      p={6}
      width="100%"
      height="100%"
      minH="600px"
      maxH="600px"
      display="flex"
      flexDirection="column"
    >
      <Flex
        align="center"
        height="100%"
        justify="space-between"
        mb={4}
        wrap="wrap"
        gap={2}
        flexShrink={0}
      >
        <Text fontWeight="bold" fontSize="lg">
          Top Gainers
        </Text>
        <HStack spacing={2}>
          <Select
            size="xs"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            maxW="120px"
            bg="gray.700"
            color="gray.100"
            borderColor="whiteAlpha.300"
          >
            {PERIOD_OPTIONS.map((o) => (
              <option
                key={o.value}
                value={o.value}
                style={{ background: '#2D3748', color: '#E2E8F0' }}
              >
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            size="xs"
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            maxW="200px"
            bg="gray.700"
            color="gray.100"
            borderColor="whiteAlpha.300"
          >
            <optgroup label="Skills / EHP" style={{ background: '#2D3748', color: '#A0AEC0' }}>
              {SKILL_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  style={{ background: '#2D3748', color: '#E2E8F0' }}
                >
                  {o.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Bosses" style={{ background: '#2D3748', color: '#A0AEC0' }}>
              {BOSS_OPTIONS.map((o) => (
                <option
                  key={o.value}
                  value={o.value}
                  style={{ background: '#2D3748', color: '#E2E8F0' }}
                >
                  {o.label}
                </option>
              ))}
            </optgroup>
          </Select>
        </HStack>
      </Flex>

      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        {loading && (
          <Center flex="1">
            <Spinner size="sm" />
          </Center>
        )}
        {error && (
          <Text color="dark.red.base" fontSize="sm">
            {error}
          </Text>
        )}
        {!loading && !error && data.length === 0 && (
          <Text fontSize="sm" color="whiteAlpha.500">
            No gains recorded for this period.
          </Text>
        )}
        {!loading && !error && data.length > 0 && (
          <VStack spacing={0} align="stretch" overflowY="auto" paddingRight={2} flex="1">
            {data.map((entry, idx) => {
              const player = entry.player;
              const gained = formatGained(entry.gained ?? entry.data?.gained, metric);
              const tag = accountTag(player?.type);
              return (
                <Flex key={player?.id ?? idx} align="center" py={2} gap={3}>
                  <Text fontSize="sm" color="whiteAlpha.400" minW="20px" textAlign="right">
                    {idx + 1}
                  </Text>
                  <Flex flex="1" align="center" gap={2} overflow="hidden">
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {player?.displayName || player?.username}
                    </Text>
                    {tag && (
                      <Text fontSize="9px" color="whiteAlpha.500" fontWeight="bold" flexShrink={0}>
                        {tag}
                      </Text>
                    )}
                  </Flex>
                  {gained && (
                    <Text
                      fontSize="sm"
                      color="dark.turquoise.base"
                      fontWeight="bold"
                      flexShrink={0}
                    >
                      {gained}
                    </Text>
                  )}
                </Flex>
              );
            })}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

// --- Achievements Feed ---
function AchievementsFeed({ data, loading, error, cardBg = 'dark.cardBg' }) {
  return (
    <Box
      bg={cardBg}
      borderRadius="12px"
      p={6}
      width="100%"
      minH="600px"
      maxH="600px"
      display="flex"
      flexDirection="column"
    >
      <Text fontWeight="bold" fontSize="lg" mb={4} flexShrink={0}>
        Recent Milestones
      </Text>

      <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
        {loading && (
          <Center flex="1">
            <Spinner size="sm" />
          </Center>
        )}
        {error && (
          <Text color="dark.red.base" fontSize="sm">
            {error}
          </Text>
        )}
        {!loading && !error && data.length === 0 && (
          <Text fontSize="sm" color="whiteAlpha.500">
            No recent milestones.
          </Text>
        )}
        {!loading && !error && data.length > 0 && (
          <VStack spacing={0} align="stretch" overflowY="auto" paddingRight={2} flex="1">
            {data.map((a, i) => (
              <Box key={i}>
                <Flex py={3} justify="space-between" align="flex-start" gap={3}>
                  <Box flex="1" overflow="hidden">
                    <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                      {a.player?.displayName || a.player?.username}
                    </Text>
                    <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1}>
                      {a.name}
                    </Text>
                  </Box>
                  <Text fontSize="xs" color="whiteAlpha.400" flexShrink={0} pt="2px">
                    {daysAgo(a.createdAt)}
                  </Text>
                </Flex>
                {i < data.length - 1 && <Box h="1px" bg="whiteAlpha.100" />}
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

// --- Inactivity Tracker ---
function InactivityTracker({
  data,
  loading,
  error,
  fetchedAt,
  onRefresh,
  cooldownRemaining,
  cardBg = 'dark.cardBg',
}) {
  const [thresholdDays, setThresholdDays] = useState(30);
  const [showDate, setShowDate] = useState(false);

  const inactive = data
    .filter((m) => {
      const lc = m.player?.lastChangedAt;
      if (!lc) return true;
      return (Date.now() - new Date(lc).getTime()) / 86400000 >= thresholdDays;
    })
    .sort((a, b) => {
      const at = a.player?.lastChangedAt ? new Date(a.player.lastChangedAt).getTime() : 0;
      const bt = b.player?.lastChangedAt ? new Date(b.player.lastChangedAt).getTime() : 0;
      return at - bt;
    });

  return (
    <Box
      bg={cardBg}
      maxH="600px"
      borderRadius="12px"
      p={6}
      width="100%"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" mb={2} flexShrink={0}>
        <Text fontWeight="bold" fontSize="lg">
          Inactive Members
        </Text>
        <HStack spacing={2}>
          <Text fontSize="sm" color="whiteAlpha.500">
            {loading ? '…' : `${inactive.length} inactive (${thresholdDays}+ days)`}
          </Text>
          {cooldownRemaining > 0 && (
            <Text fontSize="xs" color="whiteAlpha.300">
              {cooldownRemaining}s
            </Text>
          )}
          <IconButton
            icon={<RepeatIcon />}
            size="xs"
            variant="ghost"
            colorScheme="whiteAlpha"
            aria-label="Refresh"
            isLoading={loading}
            isDisabled={cooldownRemaining > 0}
            onClick={onRefresh}
          />
        </HStack>
      </Flex>
      <Flex align="center" gap={3} mb={3} flexShrink={0} wrap="wrap">
        <HStack spacing={1}>
          <Text fontSize="xs" color="whiteAlpha.500">
            Min days inactive:
          </Text>
          <NumberInput
            size="xs"
            value={thresholdDays}
            min={1}
            max={9999}
            onChange={(_, val) => !isNaN(val) && val >= 1 && setThresholdDays(val)}
            w="72px"
          >
            <NumberInputField px={2} />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </HStack>
        <Button
          size="xs"
          variant="outline"
          colorScheme="whiteAlpha"
          onClick={() => setShowDate((v) => !v)}
        >
          {showDate ? 'Show days ago' : 'Show date'}
        </Button>
      </Flex>
      {fetchedAt && (
        <Text fontSize="xs" color="whiteAlpha.300" mb={1} flexShrink={0}>
          Fetched {fetchedAt.toLocaleTimeString()}
        </Text>
      )}
      <Text fontSize="xs" color="whiteAlpha.400" mb={4} flexShrink={0}>
        Based on WOM data freshness, so dates only update when WOM syncs a player.{' '}
        <a
          href="https://wiseoldman.net/groups/9738"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'inherit', textDecoration: 'underline' }}
        >
          Update all on WOM
        </a>{' '}
        for accurate results.
      </Text>

      {loading && (
        <Center py={8}>
          <Spinner size="sm" />
        </Center>
      )}
      {error && (
        <Text color="dark.red.base" fontSize="sm">
          {error}
        </Text>
      )}
      {!loading && !error && inactive.length === 0 && (
        <Text fontSize="sm" color="whiteAlpha.500">
          No inactive members! Nice work keeping the clan active!
        </Text>
      )}
      {!loading && !error && inactive.length > 0 && (
        <Box flex="1" display="flex" flexDirection="column" overflow="hidden">
          <Flex
            py={2}
            gap={3}
            borderBottom="1px solid"
            borderColor="whiteAlpha.100"
            mb={1}
            flexShrink={0}
          >
            <Text
              flex="1"
              fontSize="xs"
              color="whiteAlpha.400"
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Player
            </Text>
            <Text
              fontSize="xs"
              color="whiteAlpha.400"
              textTransform="uppercase"
              letterSpacing="wide"
              minW="100px"
              textAlign="right"
            >
              {showDate ? 'Last Active' : 'Days Inactive'}
            </Text>
            <Text
              fontSize="xs"
              color="whiteAlpha.400"
              textTransform="uppercase"
              letterSpacing="wide"
              minW="80px"
              textAlign="right"
            >
              Role
            </Text>
          </Flex>
          <VStack spacing={0} align="stretch" overflowY="auto" flex="1">
            {inactive.map((m, i) => {
              const player = m.player;
              const tag = accountTag(player?.type);
              return (
                <Flex
                  key={player?.id ?? i}
                  align="center"
                  py={2}
                  gap={3}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.50"
                >
                  <Flex flex="1" align="center" gap={2} overflow="hidden">
                    <a
                      href={`https://wiseoldman.net/players/${encodeURIComponent(
                        player?.username || player?.displayName
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '14px',
                        color: 'inherit',
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(255,255,255,0.2)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {player?.displayName || player?.username}
                    </a>
                    {tag && (
                      <Text fontSize="9px" color="whiteAlpha.500" fontWeight="bold" flexShrink={0}>
                        {tag}
                      </Text>
                    )}
                  </Flex>
                  <Text
                    fontSize="sm"
                    color="dark.red.base"
                    minW="100px"
                    textAlign="right"
                    flexShrink={0}
                  >
                    {showDate ? formatDate(player?.lastChangedAt) : daysAgo(player?.lastChangedAt)}
                  </Text>
                  <Text
                    fontSize="sm"
                    color="whiteAlpha.500"
                    minW="80px"
                    textAlign="right"
                    flexShrink={0}
                  >
                    {m.role || '—'}
                  </Text>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// --- Name Changes ---
function NameChanges({ data, loading, error, cardBg = 'dark.cardBg' }) {
  return (
    <Box
      bg={cardBg}
      borderRadius="12px"
      p={6}
      width="100%"
      maxH="600px"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      <Text fontWeight="bold" fontSize="lg" mb={4} flexShrink={0}>
        Name Changes
      </Text>
      {loading && (
        <Center py={8}>
          <Spinner size="sm" />
        </Center>
      )}
      {error && (
        <Text color="dark.red.base" fontSize="sm">
          {error}
        </Text>
      )}
      {!loading && !error && data.length === 0 && (
        <Text fontSize="sm" color="whiteAlpha.500">
          No recent name changes.
        </Text>
      )}
      {!loading && !error && data.length > 0 && (
        <VStack spacing={0} align="stretch" overflowY="auto" paddingRight={2} flex="1">
          {data.map((nc) => (
            <Flex
              key={nc.id}
              align="center"
              py={2}
              gap={3}
              borderBottom="1px solid"
              borderColor="whiteAlpha.50"
            >
              <Box flex="1" overflow="hidden">
                <Flex align="center" gap={2} wrap="wrap">
                  <Text fontSize="sm" color="whiteAlpha.500" noOfLines={1} flexShrink={0}>
                    {nc.oldName}
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.300" flexShrink={0}>
                    →
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                    {nc.newName}
                  </Text>
                </Flex>
              </Box>
              <Text fontSize="xs" color="whiteAlpha.400" flexShrink={0}>
                {daysAgo(nc.resolvedAt)}
              </Text>
            </Flex>
          ))}
        </VStack>
      )}
    </Box>
  );
}

// --- TrackScape Drop Feed ---
function formatValue(v) {
  if (v == null) return null;
  const n = Number(v);
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return String(Math.round(n));
}

// RuneLite cash stack color tiers
function getDropValueColor(v) {
  const n = Number(v);
  if (n >= 100_000_000) return 'cyan.300'; // 100M+
  if (n >= 50_000_000) return 'pink.300'; // 50M+
  if (n >= 10_000_000) return 'purple.400'; // 10M+
  if (n >= 5_000_000) return 'green.400'; // 10M+
  if (n >= 1_000_000) return 'yellow.300'; // 1M+
  return 'whiteAlpha.800';
}

export function DropsFeed({ mockDrops, hideSync, cardBg = 'dark.cardBg' } = {}) {
  const now = new Date();
  const toast = useToast();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [drops, setDrops] = useState(mockDrops ?? []);
  const [loading, setLoading] = useState(!mockDrops);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const fetchDrops = useCallback(() => {
    if (mockDrops) return;
    setLoading(true);
    setError(null);
    fetch(`/api/calendar/trackscape/drops?year=${year}&month=${month}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setDrops(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [year, month, mockDrops]);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch('/api/calendar/trackscape/sync', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      toast({
        status: 'success',
        title: `Synced — ${data.inserted} new drop${data.inserted !== 1 ? 's' : ''} added`,
        duration: 3000,
      });
      fetchDrops();
    } catch (e) {
      toast({ status: 'error', title: e.message || 'Sync failed', duration: 4000 });
    } finally {
      setSyncing(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const highValueDrops = drops.filter((d) => d.type === 'drop');
  const petDrops = drops.filter((d) => d.type === 'pet');
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <Box bg={cardBg} borderRadius="12px" p={6} width="100%">
      <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={2}>
        <Text fontWeight="bold" fontSize="lg">
          TrackScape Drops
        </Text>
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous month"
            icon={<ChevronLeftIcon />}
            size="xs"
            variant="ghost"
            color="white"
            onClick={prevMonth}
          />
          <Text fontSize="sm" color="whiteAlpha.700" minW="130px" textAlign="center">
            {monthLabel}
          </Text>
          <IconButton
            aria-label="Next month"
            icon={<ChevronRightIcon />}
            size="xs"
            variant="ghost"
            color="white"
            onClick={nextMonth}
            isDisabled={isCurrentMonth}
          />
          {!mockDrops && !hideSync && (
            <IconButton
              aria-label="Sync drops"
              icon={<RepeatIcon />}
              size="xs"
              variant="ghost"
              color="whiteAlpha.500"
              _hover={{ color: 'whiteAlpha.800' }}
              isLoading={syncing}
              onClick={handleSync}
            />
          )}
        </HStack>
      </Flex>

      {loading && (
        <Center py={6}>
          <Spinner size="sm" />
        </Center>
      )}
      {error && (
        <Text color="dark.red.base" fontSize="sm">
          {error}
        </Text>
      )}

      {!loading && !error && drops.length === 0 && (
        <Text fontSize="sm" color="whiteAlpha.500">
          No drops recorded for this month.
        </Text>
      )}

      {!loading && !error && drops.length > 0 && (
        <Flex gap={6} direction={['column', 'row']} align={['stretch', 'flex-start']} width="100%">
          {highValueDrops.length > 0 && (
              <Box flex="1" minW="0">
                <Flex align="baseline" gap={2} mb={2}>
                  <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide">
                    High Value Drops
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.400" fontWeight="bold">{highValueDrops.length}</Text>
                </Flex>
                <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
                  {highValueDrops.map((d) => (
                    <Flex
                      key={d.id}
                      py={2}
                      gap={2}
                      borderBottom="1px solid"
                      borderColor="whiteAlpha.50"
                      align="center"
                    >
                      <Box flex="1" overflow="hidden">
                        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                          {d.player}
                        </Text>
                        <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1}>
                          {d.item}
                        </Text>
                      </Box>
                      {d.value != null && (
                        <Text
                          fontSize="sm"
                          color={getDropValueColor(d.value)}
                          fontWeight="bold"
                          flexShrink={0}
                        >
                          {formatValue(d.value)}
                        </Text>
                      )}
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}

            {petDrops.length > 0 && (
              <Box flex="1" minW="180px">
                <Flex align="baseline" gap={2} mb={2}>
                  <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide">
                    Pets
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.400" fontWeight="bold">{petDrops.length}</Text>
                </Flex>
                <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
                  {petDrops.map((d) => (
                    <Flex
                      key={d.id}
                      py={2}
                      gap={2}
                      borderBottom="1px solid"
                      borderColor="whiteAlpha.50"
                      align="center"
                    >
                      <Box flex="1" overflow="hidden">
                        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>
                          {d.player}
                        </Text>
                        {d.item && (
                          <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1}>
                            {d.item}
                          </Text>
                        )}
                      </Box>
                      <Text fontSize="xs" color="whiteAlpha.400" flexShrink={0}>
                        {new Date(d.droppedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
        </Flex>
      )}
    </Box>
  );
}

// --- TrackScape Recruitment Banner ---
function TrackScapeBanner({ cardBg = 'dark.cardBg' }) {
  const [open, setOpen] = useState(false);
  return (
    <Box bg={cardBg} borderRadius="12px" overflow="hidden" position="relative">
      <Flex
        as="button"
        onClick={() => setOpen((v) => !v)}
        align="center"
        justify="space-between"
        w="100%"
        px={6}
        py={4}
        cursor="pointer"
        _hover={{ bg: 'whiteAlpha.50' }}
        transition="background 0.15s"
        textAlign="left"
      >
        <Text fontWeight="semibold" fontSize="sm" color="whiteAlpha.800">
          Want to help with TrackScape coverage?
        </Text>
        <ChevronDownIcon
          color="whiteAlpha.500"
          boxSize={4}
          transform={open ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s"
        />
      </Flex>
      <Collapse in={open} animateOpacity>
        <Flex
          direction={['column', 'column', 'row']}
          align={['flex-start', 'flex-start', 'center']}
          gap={6}
          px={6}
          pb={6}
        >
          <Flex direction="column" gap={3} flex="1">
            <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
              TrackScape automatically captures clan highlights: valuable drops, pets, and coffer
              deposits, straight from clan chat. However, it only records when a clan member with
              the plugin is actively logged in! The more people running it, the better our coverage.
            </Text>
            <Box borderLeft="3px solid" borderColor="dark.turquoise.base" pl={3}>
              <Text fontSize="xs" color="whiteAlpha.500" lineHeight="tall">
                The plugin also records clan chat messages, which are stored privately in a staff
                channel and used solely for moderation purposes.
              </Text>
            </Box>
            <Text fontSize="sm" color="whiteAlpha.600">
              Want to help? Install the{' '}
              <Text as="span" color="white" fontWeight="semibold">
                TrackScape Connector
              </Text>{' '}
              plugin, details in the image:
            </Text>
          </Flex>{' '}
          <Image
            src={trackscapeImg}
            alt="TrackScape plugin"
            h={['150px', '240px']}
            w={['150px', '240px']}
            objectFit="contain"
            flexShrink={0}
            mx="auto"
            borderRadius="8px"
          />
        </Flex>
      </Collapse>
    </Box>
  );
}

// --- Main ClanStats ---
export default function ClanStats({ isPublic = false, cardBg = 'dark.cardBg', noPadding = false }) {
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [achievements, setAchievements] = useState([]);
  const [achLoading, setAchLoading] = useState(true);
  const [achError, setAchError] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [membersFetchedAt, setMembersFetchedAt] = useState(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const [nameChanges, setNameChanges] = useState([]);
  const [ncLoading, setNcLoading] = useState(true);
  const [ncError, setNcError] = useState(null);

  const fetchGroupData = useCallback(() => {
    setMembersLoading(true);
    setStatsLoading(true);
    // Timestamp busts Cloudflare's edge cache — cache: 'no-store' alone doesn't reach the origin
    const t = Date.now();
    const nc = { cache: 'no-store' };
    Promise.all([
      fetch(`${WOM_BASE}/groups/${GROUP_ID}/statistics`).then((r) => r.json()),
      fetch(`${WOM_BASE}/groups/${GROUP_ID}?_=${t}`, nc).then((r) => r.json()),
      fetch(`${LEAGUES_WOM_BASE}/groups/${LEAGUES_GROUP_ID}?_=${t}`, nc)
        .then((r) => r.json())
        .catch(() => null),
    ])
      .then(([stats, group, leaguesGroup]) => {
        setStatsData({ stats, memberCount: group.memberCount });

        const regularMembers = Array.isArray(group.memberships) ? group.memberships : [];

        // Build a map of username -> lastChangedAt from leagues WOM
        const leaguesLastChanged = {};
        if (leaguesGroup?.memberships) {
          for (const m of leaguesGroup.memberships) {
            if (m.player?.username && m.player?.lastChangedAt) {
              leaguesLastChanged[m.player.username] = m.player.lastChangedAt;
            }
          }
        }

        // Merge: use whichever lastChangedAt is more recent
        const merged = regularMembers.map((m) => {
          const leaguesDate = leaguesLastChanged[m.player?.username];
          if (!leaguesDate) return m;
          const regular = m.player?.lastChangedAt ? new Date(m.player.lastChangedAt).getTime() : 0;
          const leagues = new Date(leaguesDate).getTime();
          if (leagues <= regular) return m;
          return { ...m, player: { ...m.player, lastChangedAt: leaguesDate } };
        });

        setMembers(merged);
        setMembersFetchedAt(new Date());
        setMembersLoading(false);
      })
      .catch((e) => {
        setStatsError(e.message);
        setMembersError(e.message);
        setMembersLoading(false);
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const handleRefresh = useCallback(() => {
    fetchGroupData();
    setCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
  }, [fetchGroupData]);

  // Countdown tick — updates cooldownRemaining every second while cooldown is active
  useEffect(() => {
    const id = setInterval(() => {
      setCooldownRemaining(Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownUntil]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const id = setInterval(handleRefresh, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [handleRefresh]);

  useEffect(() => {
    fetchGroupData();

    fetch(`${WOM_BASE}/groups/${GROUP_ID}/achievements?limit=50`)
      .then((r) => r.json())
      .then((json) => setAchievements(Array.isArray(json) ? json : []))
      .catch((e) => setAchError(e.message))
      .finally(() => setAchLoading(false));

    fetch(`${WOM_BASE}/groups/${GROUP_ID}/name-changes?limit=50`)
      .then((r) => r.json())
      .then((json) =>
        setNameChanges(Array.isArray(json) ? json.filter((nc) => nc.status === 'approved') : [])
      )
      .catch((e) => setNcError(e.message))
      .finally(() => setNcLoading(false));
  }, [fetchGroupData]);

  const stats = statsData?.stats;
  const memberCount = statsData?.memberCount;

  return (
    <Flex
      direction="column"
      align="center"
      width="100%"
      paddingX={noPadding ? 0 : ['16px', '24px', '64px']}
      paddingY={noPadding ? 0 : ['32px', '48px']}
      gap={6}
    >
      {/* Headline stat cards */}
      <Flex gap={4} width="100%" maxW="1200px" wrap="wrap">
        <StatCard
          label="Members"
          value={statsLoading ? '…' : memberCount}
          sub="in clan"
          cardBg={cardBg}
        />
        <StatCard
          label="Maxed Combat"
          value={statsLoading ? '…' : stats?.maxedCombatCount}
          sub={
            !statsLoading && memberCount
              ? `${Math.round((stats.maxedCombatCount / memberCount) * 100)}% of clan`
              : null
          }
          cardBg={cardBg}
        />
        <StatCard
          label="Maxed Total"
          value={statsLoading ? '…' : stats?.maxedTotalCount}
          sub={
            !statsLoading && memberCount
              ? `${Math.round((stats.maxedTotalCount / memberCount) * 100)}% of clan`
              : null
          }
          cardBg={cardBg}
        />
        <StatCard
          label="200M Clubs"
          value={statsLoading ? '…' : stats?.maxed200msCount}
          sub="skills at 200M XP"
          cardBg={cardBg}
        />
      </Flex>
      {statsError && (
        <Text color="dark.red.base" fontSize="sm">
          {statsError}
        </Text>
      )}

      {/* Gainers + Achievements side by side, equal height */}
      <Flex
        gap={6}
        width="100%"
        maxW="1200px"
        align="flex-start"
        direction={['column', 'column', 'row']}
      >
        <Box flex="1" width="100%">
          <TopGainers cardBg={cardBg} />
        </Box>
        <Box flex="1" width="100%">
          <AchievementsFeed
            data={achievements}
            loading={achLoading}
            error={achError}
            cardBg={cardBg}
          />
        </Box>
      </Flex>

      {/* Inactivity + Name Changes side by side (inactivity hidden on public page) */}
      {!isPublic && (
        <Flex
          gap={6}
          width="100%"
          maxW="1200px"
          align="flex-start"
          direction={['column', 'column', 'row']}
        >
          <Box flex="1" width="100%">
            <InactivityTracker
              data={members}
              loading={membersLoading}
              error={membersError}
              fetchedAt={membersFetchedAt}
              onRefresh={handleRefresh}
              cooldownRemaining={cooldownRemaining}
              cardBg={cardBg}
            />
          </Box>

          <Box flex="1" width="100%">
            <NameChanges data={nameChanges} loading={ncLoading} error={ncError} cardBg={cardBg} />
          </Box>
        </Flex>
      )}

      {/* TrackScape drops */}
      <Box width="100%" maxW="1200px">
        <DropsFeed hideSync={isPublic} cardBg={cardBg} />
      </Box>

      {isPublic && (
        <Box width="100%" maxW="1200px">
          <TrackScapeBanner cardBg={cardBg} />
        </Box>
      )}
    </Flex>
  );
}
