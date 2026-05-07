import { useState, useEffect, useCallback } from 'react';
import { Box, Flex, Text, VStack, HStack, Select, Spinner, Center, IconButton, useToast } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, RepeatIcon } from '@chakra-ui/icons';

const WOM_BASE = 'https://api.wiseoldman.net/v2';
const GROUP_ID = 9738;
const INACTIVITY_DAYS = 30;

const METRIC_OPTIONS = [
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

function accountTag(type) {
  if (type === 'ironman') return 'IM';
  if (type === 'hardcore_ironman') return 'HC';
  if (type === 'ultimate') return 'UIM';
  if (type === 'group_ironman') return 'GIM';
  return null;
}

// --- Stat Cards ---
function StatCard({ label, value, sub }) {
  return (
    <Box bg="dark.cardBg" borderRadius="12px" p={5} flex="1" minW="130px">
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
function TopGainers() {
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
        const entries = Array.isArray(json) ? json.filter((e) => e.data?.gained > 0) : [];
        setData(entries);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [metric, period]);

  return (
    <Box
      bg="dark.cardBg"
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
              <option key={o.value} value={o.value} style={{ background: '#2D3748', color: '#E2E8F0' }}>
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
            {METRIC_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} style={{ background: '#2D3748', color: '#E2E8F0' }}>
                {o.label}
              </option>
            ))}
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
              const gained = formatGained(entry.data?.gained, metric);
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
function AchievementsFeed({ data, loading, error }) {
  return (
    <Box
      bg="dark.cardBg"
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
function InactivityTracker({ data, loading, error }) {
  const inactive = data
    .filter((m) => {
      const lc = m.player?.lastChangedAt;
      if (!lc) return true;
      return (Date.now() - new Date(lc).getTime()) / 86400000 >= INACTIVITY_DAYS;
    })
    .sort((a, b) => {
      const at = a.player?.lastChangedAt ? new Date(a.player.lastChangedAt).getTime() : 0;
      const bt = b.player?.lastChangedAt ? new Date(b.player.lastChangedAt).getTime() : 0;
      return at - bt;
    });

  return (
    <Box
      bg="dark.cardBg"
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
        <Text fontSize="sm" color="whiteAlpha.500">
          {loading ? '…' : `${inactive.length} inactive (${INACTIVITY_DAYS}+ days)`}
        </Text>
      </Flex>
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
              Last Active
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
                    <Text fontSize="sm" noOfLines={1}>
                      {player?.displayName || player?.username}
                    </Text>
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
                    {daysAgo(player?.lastChangedAt)}
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
function NameChanges({ data, loading, error }) {
  return (
    <Box
      bg="dark.cardBg"
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

export function DropsFeed({ mockDrops } = {}) {
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

  useEffect(() => { fetchDrops(); }, [fetchDrops]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch('/api/calendar/trackscape/sync', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      toast({ status: 'success', title: `Synced — ${data.inserted} new drop${data.inserted !== 1 ? 's' : ''} added`, duration: 3000 });
      fetchDrops();
    } catch (e) {
      toast({ status: 'error', title: e.message || 'Sync failed', duration: 4000 });
    } finally {
      setSyncing(false);
    }
  };

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  };
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const highValueDrops = drops.filter((d) => d.type === 'drop');
  const petDrops = drops.filter((d) => d.type === 'pet');
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Box bg="dark.cardBg" borderRadius="12px" p={6} width="100%">
      <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={2}>
        <Text fontWeight="bold" fontSize="lg">TrackScape Drops</Text>
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous month"
            icon={<ChevronLeftIcon />}
            size="xs"
            variant="ghost"
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
            onClick={nextMonth}
            isDisabled={isCurrentMonth}
          />
          {!mockDrops && (
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

      {loading && <Center py={6}><Spinner size="sm" /></Center>}
      {error && <Text color="dark.red.base" fontSize="sm">{error}</Text>}

      {!loading && !error && drops.length === 0 && (
        <Text fontSize="sm" color="whiteAlpha.500">No drops recorded for this month.</Text>
      )}

      {!loading && !error && drops.length > 0 && (
        <Flex gap={6} direction={['column', 'column', 'row']} align="flex-start">
          {/* Summary */}
          <Box flexShrink={0}>
            <Flex gap={4} mb={4} wrap="wrap">
              <Box bg="whiteAlpha.50" borderRadius="lg" px={4} py={3} minW="110px">
                <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide" mb={1}>High Value</Text>
                <Text fontSize="xl" fontWeight="bold">{highValueDrops.length}</Text>
              </Box>
              <Box bg="whiteAlpha.50" borderRadius="lg" px={4} py={3} minW="110px">
                <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide" mb={1}>Pets</Text>
                <Text fontSize="xl" fontWeight="bold">{petDrops.length}</Text>
              </Box>
            </Flex>
          </Box>

          {/* Drop lists */}
          <Flex gap={6} flex="1" direction={['column', 'row']} align="flex-start" width="100%">
            {highValueDrops.length > 0 && (
              <Box flex="1" minW="200px">
                <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide" mb={2}>
                  High Value Drops
                </Text>
                <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
                  {highValueDrops.map((d) => (
                    <Flex key={d.id} py={2} gap={2} borderBottom="1px solid" borderColor="whiteAlpha.50" align="center">
                      <Box flex="1" overflow="hidden">
                        <Text fontSize="sm" fontWeight="semibold" noOfLines={1}>{d.player}</Text>
                        <Text fontSize="xs" color="whiteAlpha.500" noOfLines={1}>{d.item}</Text>
                      </Box>
                      {d.value != null && (
                        <Text fontSize="sm" color="dark.turquoise.base" fontWeight="bold" flexShrink={0}>
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
                <Text fontSize="xs" color="whiteAlpha.500" textTransform="uppercase" letterSpacing="wide" mb={2}>
                  Pets
                </Text>
                <VStack spacing={0} align="stretch" maxH="400px" overflowY="auto">
                  {petDrops.map((d) => (
                    <Flex key={d.id} py={2} gap={2} borderBottom="1px solid" borderColor="whiteAlpha.50" align="center">
                      <Text fontSize="sm" flex="1" noOfLines={1}>{d.player}</Text>
                      <Text fontSize="xs" color="whiteAlpha.400" flexShrink={0}>
                        {new Date(d.droppedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

// --- Main ClanStats ---
export default function ClanStats() {
  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const [achievements, setAchievements] = useState([]);
  const [achLoading, setAchLoading] = useState(true);
  const [achError, setAchError] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);

  const [nameChanges, setNameChanges] = useState([]);
  const [ncLoading, setNcLoading] = useState(true);
  const [ncError, setNcError] = useState(null);

  useEffect(() => {
    // Group endpoint includes memberships inline — fetch once, use for both stats and inactivity
    Promise.all([
      fetch(`${WOM_BASE}/groups/${GROUP_ID}/statistics`).then((r) => r.json()),
      fetch(`${WOM_BASE}/groups/${GROUP_ID}`).then((r) => r.json()),
    ])
      .then(([stats, group]) => {
        setStatsData({ stats, memberCount: group.memberCount });
        setMembers(Array.isArray(group.memberships) ? group.memberships : []);
        setMembersLoading(false);
      })
      .catch((e) => {
        setStatsError(e.message);
        setMembersError(e.message);
        setMembersLoading(false);
      })
      .finally(() => setStatsLoading(false));

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
  }, []);

  const stats = statsData?.stats;
  const memberCount = statsData?.memberCount;

  return (
    <Flex
      direction="column"
      align="center"
      width="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['32px', '48px']}
      gap={6}
    >
      {/* Headline stat cards */}
      <Flex gap={4} width="100%" maxW="1200px" wrap="wrap">
        <StatCard label="Members" value={statsLoading ? '…' : memberCount} sub="in clan" />
        <StatCard
          label="Maxed Combat"
          value={statsLoading ? '…' : stats?.maxedCombatCount}
          sub={
            !statsLoading && memberCount
              ? `${Math.round((stats.maxedCombatCount / memberCount) * 100)}% of clan`
              : null
          }
        />
        <StatCard
          label="Maxed Total"
          value={statsLoading ? '…' : stats?.maxedTotalCount}
          sub={
            !statsLoading && memberCount
              ? `${Math.round((stats.maxedTotalCount / memberCount) * 100)}% of clan`
              : null
          }
        />
        <StatCard
          label="200M Clubs"
          value={statsLoading ? '…' : stats?.maxed200msCount}
          sub="skills at 200M XP"
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
          <TopGainers />
        </Box>
        <Box flex="1" width="100%">
          <AchievementsFeed data={achievements} loading={achLoading} error={achError} />
        </Box>
      </Flex>

      {/* Inactivity + Name Changes side by side */}
      <Flex
        gap={6}
        width="100%"
        maxW="1200px"
        align="flex-start"
        direction={['column', 'column', 'row']}
      >
        <Box flex="1" width="100%">
          <InactivityTracker data={members} loading={membersLoading} error={membersError} />
        </Box>
        <Box flex="1" width="100%">
          <NameChanges data={nameChanges} loading={ncLoading} error={ncError} />
        </Box>
      </Flex>

      {/* TrackScape drops */}
      <Box width="100%" maxW="1200px">
        <DropsFeed />
      </Box>
    </Flex>
  );
}
