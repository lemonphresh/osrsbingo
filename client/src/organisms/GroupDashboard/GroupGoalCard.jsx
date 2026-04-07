import { Box, Text, HStack, VStack, Button, useClipboard } from '@chakra-ui/react';

const RANK_COLORS = ['#f5c518', '#c0c0c0', '#cd7f32'];

function fmt(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

function fmtEta(days) {
  if (days < 1) return '< 1d';
  if (days < 7) return `${Math.ceil(days)}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;
  return `${Math.round(days / 30)}mo`;
}

function KPI({ label, value, sub, valueColor }) {
  return (
    <VStack align="center" spacing={0} flex={1} textAlign="center">
      <Text fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider" mb={0.5}>
        {label}
      </Text>
      <Text fontSize="2xl" fontWeight="bold" color={valueColor ?? 'white'} lineHeight="1.1">
        {value}
      </Text>
      {sub && (
        <Text fontSize="xs" color="gray.500" mt={0.5}>
          {sub}
        </Text>
      )}
    </VStack>
  );
}

function IndividualGoalCard({ goalConfig = {}, progress, accentColor, userRsn }) {
  const displayName = progress?.displayName ?? goalConfig.displayName ?? goalConfig.metric ?? 'Goal';
  const emoji = goalConfig.emoji ?? '🎯';
  const contributors = progress?.topContributors ?? [];
  const individualTarget = progress?.individualTarget ?? goalConfig.target ?? 1;
  const completedCount = progress?.current ?? 0;
  const activeCount = progress?.target ?? 0;

  const completedRsns = contributors.filter((c) => c.completed).map((c) => c.rsn).join('\n');
  const { onCopy, hasCopied } = useClipboard(completedRsns);

  return (
    <Box
      bg="gray.800"
      border="2px solid"
      borderColor={accentColor ?? '#7D5FFF'}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      _hover={{ transform: 'translateY(-1px)' }}
    >
      {/* Header */}
      <HStack px={5} pt={4} pb={3} justify="space-between" align="center">
        <HStack spacing={3} minW={0} flex={1}>
          <Text fontSize="xl" lineHeight="1" flexShrink={0}>{emoji}</Text>
          <Text fontWeight="bold" color="white" fontSize="lg" noOfLines={1}>{displayName}</Text>
        </HStack>
        <Box
          px={3} py={1}
          bg="gray.700" border="1px solid" borderColor="gray.600"
          borderRadius="md" flexShrink={0} ml={3}
        >
          <Text fontSize="sm" fontWeight="bold" color="gray.200">
            Individual · {fmt(individualTarget)} each
          </Text>
        </Box>
      </HStack>

      {/* Summary bar */}
      <HStack px={5} pb={4} justify="space-between" align="center">
        <Text fontSize="sm" color="gray.400">
          <Text as="span" fontWeight="bold" color="green.300">{completedCount}</Text>
          {' of '}
          <Text as="span" fontWeight="bold" color="gray.200">{activeCount}</Text>
          {' members completed'}
        </Text>
        {completedCount > 0 && (
          <Button
            size="xs"
            variant="outline"
            colorScheme="green"
            onClick={onCopy}
            flexShrink={0}
          >
            {hasCopied ? 'Copied!' : `Copy RSNs (${completedCount})`}
          </Button>
        )}
      </HStack>

      {/* Member leaderboard */}
      {contributors.length > 0 && (
        <Box bg="gray.900" borderTop="1px solid" borderColor="gray.700">
          <HStack px={5} py={2} gap={3} borderBottom="1px solid" borderColor="gray.800">
            <Box w="32px" flexShrink={0} />
            <Text flex="1" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              Player
            </Text>
            <Text w="100px" textAlign="right" fontSize="xs" color="gray.500" textTransform="uppercase" letterSpacing="wider">
              Progress
            </Text>
          </HStack>

          {contributors.map((c, i) => {
            const isMe = userRsn && c.rsn.toLowerCase() === userRsn.toLowerCase();
            return (
            <HStack
              key={c.rsn}
              px={5} py={2.5} gap={3}
              borderTop="1px solid" borderColor="gray.800"
              bg={isMe ? `${accentColor}18` : c.completed ? 'rgba(72,187,120,0.06)' : undefined}
              _hover={{ bg: isMe ? `${accentColor}28` : c.completed ? 'rgba(72,187,120,0.1)' : 'gray.800' }}
              transition="background 0.15s"
            >
              <Text w="32px" fontSize="xs" fontWeight="bold" color={i < 3 ? RANK_COLORS[i] : 'gray.500'} flexShrink={0}>
                #{i + 1}
              </Text>
              <HStack flex="1" spacing={2} minW={0}>
                <Text
                  fontSize="sm"
                  fontWeight={c.completed ? 'semibold' : 'normal'}
                  color={c.completed ? 'green.300' : 'gray.300'}
                  noOfLines={1} minW={0}
                >
                  {c.completed && '✓ '}{c.rsn}
                </Text>
                {c.role && (
                  <Text fontSize="10px" color="gray.400" border="1px solid" borderColor="gray.600"
                    px={1.5} borderRadius="sm" flexShrink={0} textTransform="capitalize"
                    lineHeight="1.7" whiteSpace="nowrap">
                    {c.role.replace(/_/g, ' ')}
                  </Text>
                )}
              </HStack>
              <VStack w="100px" align="flex-end" spacing={1} flexShrink={0}>
                <Text fontSize="xs" color={c.completed ? 'green.300' : 'gray.400'} whiteSpace="nowrap">
                  {fmt(c.value)} / {fmt(individualTarget)}
                </Text>
                <Box w="100%" bg="gray.700" borderRadius={3} h="4px" overflow="hidden">
                  <Box
                    h="full" borderRadius={3}
                    w={`${Math.min(100, c.percent)}%`}
                    bg={c.completed ? '#f5c518' : accentColor ?? '#7D5FFF'}
                    transition="width 0.4s ease"
                  />
                </Box>
              </VStack>
            </HStack>
            );
          })}
        </Box>
      )}

      {!progress && (
        <Text fontSize="xs" color="gray.400" px={5} py={3}>Fetching data...</Text>
      )}
    </Box>
  );
}

export default function GroupGoalCard({ goalConfig = {}, progress, accentColor, eventStartDate, userRsn }) {
  if (progress?.isIndividual || goalConfig.type?.startsWith('individual_')) {
    return <IndividualGoalCard goalConfig={goalConfig} progress={progress} accentColor={accentColor} userRsn={userRsn} />;
  }
  const displayName =
    progress?.displayName ?? goalConfig.displayName ?? goalConfig.metric ?? 'Goal';
  const emoji = goalConfig.emoji ?? '🎯';
  const current = progress?.current ?? 0;
  const target = progress?.target ?? goalConfig.target ?? 1;
  const percent = progress?.percent ?? 0;
  const contributors = progress?.topContributors ?? [];

  const pct = Math.min(100, percent);
  const barColor =
    pct >= 100
      ? '#43aa8b'
      : pct >= 75
      ? '#f4a732'
      : pct >= 50
      ? '#f4d35e'
      : accentColor ?? '#7D5FFF';

  const daysElapsed = eventStartDate
    ? Math.max(0.1, (Date.now() - new Date(eventStartDate)) / 86400000)
    : null;
  const ratePerDay = daysElapsed && current > 0 ? current / daysElapsed : 0;
  const etaDays = ratePerDay > 0 ? Math.max(0, target - current) / ratePerDay : null;
  const isDone = pct >= 100;
  const topGrinder = contributors[0] ?? null;
  const topGrinderRate = daysElapsed && topGrinder ? topGrinder.value / daysElapsed : null;

  const unitLabel =
    goalConfig.type === 'skill_xp' ? 'xp/day'
    : goalConfig.type === 'boss_kc' ? 'kc/day'
    : goalConfig.type === 'clue_kc' ? 'clues/day'
    : goalConfig.type === 'ehb' ? 'ehb/day'
    : goalConfig.type === 'ehp' ? 'ehp/day'
    : '/day';

  return (
    <Box
      bg="gray.800"
      border="2px solid"
      borderColor={barColor}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      _hover={{ transform: 'translateY(-1px)' }}
    >
      {/* ── HEADER: goal name + pct ── */}
      <HStack px={5} pt={4} pb={3} justify="space-between" align="center">
        <HStack spacing={3} minW={0} flex={1}>
          <Text fontSize="xl" lineHeight="1" flexShrink={0}>
            {emoji}
          </Text>
          <Text fontWeight="bold" color="white" fontSize="lg" noOfLines={1}>
            {displayName}
          </Text>
        </HStack>
        <Box
          px={3}
          py={1}
          bg={isDone ? 'green.800' : 'gray.700'}
          border="1px solid"
          borderColor={isDone ? 'green.600' : 'gray.600'}
          borderRadius="md"
          flexShrink={0}
          ml={3}
        >
          <Text fontSize="sm" fontWeight="bold" color={isDone ? 'green.300' : 'gray.200'}>
            {isDone ? 'COMPLETED' : `${Math.round(percent)}%`}
          </Text>
        </Box>
      </HStack>

      {/* ── PROGRESS BAR ── */}
      <Box px={5} pb={4}>
        <Box bg="#111" borderRadius={6} h="14px" overflow="hidden" border="1px solid #333" mb={2}>
          <Box
            h="full"
            w={`${pct}%`}
            bg={barColor}
            borderRadius={6}
            transition="width 0.4s ease"
            boxShadow={`0 0 8px ${barColor}88`}
          />
        </Box>
        <HStack justify="space-between">
          <Text fontSize="xs" color="gray.500">
            {fmt(current)} gained
          </Text>
          <Text fontSize="xs" color="gray.500">
            target: {fmt(target)}
          </Text>
        </HStack>
      </Box>

      {/* ── KPI GRID ── */}
      <HStack
        bg="gray.700"
        borderTop="1px solid"
        borderColor="gray.600"
        px={5}
        py={4}
        justify="space-between"
        align="center"
      >
        <KPI label="Total Gained" value={fmt(current)} valueColor="white" />
        <KPI
          label={unitLabel}
          value={ratePerDay > 0 ? fmt(Math.round(ratePerDay)) : '—'}
          sub={daysElapsed ? `over ${Math.floor(daysElapsed)}d` : undefined}
          valueColor={barColor}
        />
        <KPI
          label={isDone ? 'Status' : 'ETA'}
          value={isDone ? '🎉 Done' : etaDays != null ? fmtEta(etaDays) : '—'}
          valueColor={isDone ? '#43aa8b' : 'gray.100'}
        />
      </HStack>

      {/* ── TOP GRINDER ── */}
      {topGrinder && (
        <HStack
          bg="yellow.900"
          borderTop="1px solid"
          borderColor="yellow.700"
          px={5}
          py={3}
          spacing={3}
        >
          <Text flexShrink={0}>🏆</Text>
          <Text
            fontSize="xs"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
            flexShrink={0}
          >
            Top Grinder
          </Text>
          <Text fontSize="md" fontWeight="bold" color="yellow.300" noOfLines={1} flex={1} minW={0}>
            {topGrinder.rsn}
          </Text>
          <Text fontSize="md" fontWeight="semibold" color="gray.200" flexShrink={0}>
            {fmt(topGrinder.value)}
          </Text>
          {topGrinderRate != null && (
            <Text fontSize="sm" color="gray.400" flexShrink={0}>
              {fmt(Math.round(topGrinderRate))} {unitLabel}
            </Text>
          )}
        </HStack>
      )}

      {/* ── LEADERBOARD ── */}
      {contributors.length > 0 && (
        <Box bg="gray.900" borderTop="1px solid" borderColor="gray.700">
          {/* Column header — widths must mirror data row columns exactly */}
          <HStack px={5} py={2} gap={3} borderBottom="1px solid" borderColor="gray.800">
            <Box w="32px" flexShrink={0} />
            <Text
              flex="1"
              fontSize="xs"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
              textAlign="left"
            >
              Player
            </Text>
            <Text
              w="72px"
              textAlign="right"
              fontSize="xs"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Gained
            </Text>
            {daysElapsed && (
              <Text
                w="72px"
                textAlign="right"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                {unitLabel}
              </Text>
            )}
            <Text
              w="44px"
              textAlign="right"
              fontSize="xs"
              color="gray.500"
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Share
            </Text>
          </HStack>

          {contributors.map((c, i) => {
            const isTop3 = i < 3;
            const nameColor = i === 0 ? 'yellow.300' : i === 1 ? 'gray.100' : 'gray.300';
            const rate = daysElapsed ? fmt(Math.round(c.value / daysElapsed)) : null;
            const isMe = userRsn && c.rsn.toLowerCase() === userRsn.toLowerCase();
            return (
              <HStack
                key={c.rsn}
                px={5}
                py={2.5}
                gap={3}
                borderTop="1px solid"
                borderColor="gray.800"
                bg={isMe ? `${barColor}18` : undefined}
                _hover={{ bg: isMe ? `${barColor}28` : 'gray.800' }}
                transition="background 0.15s"
              >
                {/* Rank — fixed width matches header spacer */}
                <Text
                  w="32px"
                  fontSize="xs"
                  fontWeight="bold"
                  color={isTop3 ? RANK_COLORS[i] : 'gray.500'}
                  flexShrink={0}
                  whiteSpace="nowrap"
                >
                  #{i + 1}
                </Text>
                {/* Player name + role badge */}
                <HStack flex="1" spacing={2} minW={0}>
                  <Text
                    fontSize="sm"
                    fontWeight={isTop3 ? 'semibold' : 'normal'}
                    color={nameColor}
                    noOfLines={1}
                    minW={0}
                  >
                    {c.rsn}
                  </Text>
                  {c.role && (
                    <Text
                      fontSize="10px"
                      color="gray.400"
                      border="1px solid"
                      borderColor="gray.600"
                      px={1.5}
                      borderRadius="sm"
                      flexShrink={0}
                      textTransform="capitalize"
                      lineHeight="1.7"
                      whiteSpace="nowrap"
                    >
                      {c.role.replace(/_/g, ' ')}
                    </Text>
                  )}
                </HStack>
                <Text w="72px" textAlign="right" fontSize="sm" color="gray.300">
                  {fmt(c.value)}
                </Text>
                {daysElapsed && (
                  <Text w="72px" textAlign="right" fontSize="sm" color="gray.400">
                    {rate}
                  </Text>
                )}
                <Text w="44px" textAlign="right" fontSize="xs" color="gray.500" whiteSpace="nowrap">
                  {c.percent.toFixed(1)}%
                </Text>
              </HStack>
            );
          })}
        </Box>
      )}

      {!progress && (
        <Text fontSize="xs" color="gray.400" px={5} py={3}>
          Fetching data...
        </Text>
      )}
    </Box>
  );
}
