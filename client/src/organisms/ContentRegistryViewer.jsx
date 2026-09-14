import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  HStack,
  Heading,
  Input,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import useContentRegistry from '../hooks/useContentRegistry';

// Readable browser for the WOM-backed content registry. Powers the "Content
// Registry" tab on the EG Hub so clan members can eyeball what osrs content
// is available for events (kc ranges, xp targets, valid drop pools). Fully
// derived from useContentRegistry, no writes.

const BUCKET_LABELS = { short: 'Short', medium: 'Medium', long: 'Long' };
const BUCKET_ORDER = ['short', 'medium', 'long'];

const CLUE_COLORS = {
  beginner: '#a3a3a3',
  easy: '#22c55e',
  medium: '#3b82f6',
  hard: '#a855f7',
  elite: '#eab308',
  master: '#ef4444',
};

function formatNumber(n) {
  if (n == null) return '';
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(n);
}

function formatRange(range) {
  if (!range) return '—';
  if (range.min === range.max) return formatNumber(range.min);
  return `${formatNumber(range.min)}–${formatNumber(range.max)}`;
}

// Compact 3-column table for quantities.short/medium/long. Unit is applied
// per entry type (kc / xp / clues / etc) so the same component reads
// consistently across sections.
function QuantitiesGrid({ quantities, unit }) {
  const rows = BUCKET_ORDER.filter((b) => quantities?.[b]);
  if (rows.length === 0) return null;
  return (
    <SimpleGrid columns={rows.length} spacing={2} mt={2}>
      {rows.map((bucket) => (
        <Box
          key={bucket}
          bg="whiteAlpha.50"
          border="1px solid"
          borderColor="whiteAlpha.100"
          borderRadius="md"
          px={2}
          py={1.5}
        >
          <Text
            fontFamily="mono"
            fontSize="9px"
            color="whiteAlpha.500"
            letterSpacing="wider"
            textTransform="uppercase"
          >
            {BUCKET_LABELS[bucket]}
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="whiteAlpha.900">
            {formatRange(quantities[bucket])}
            <Text as="span" color="whiteAlpha.500" ml={1}>
              {unit}
            </Text>
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  );
}

function DropsList({ drops, dropQuantities }) {
  if (!drops?.length) return null;
  const qtyRows = BUCKET_ORDER.filter((b) => dropQuantities?.[b]);
  return (
    <>
      {qtyRows.length > 0 && (
        <Box mt={3}>
          <Text
            fontFamily="mono"
            fontSize="9px"
            color="whiteAlpha.500"
            letterSpacing="wider"
            textTransform="uppercase"
            mb={1}
          >
            Drop Quantities
          </Text>
          <SimpleGrid columns={qtyRows.length} spacing={2}>
            {qtyRows.map((bucket) => (
              <Box
                key={bucket}
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="whiteAlpha.100"
                borderRadius="md"
                px={2}
                py={1.5}
              >
                <Text
                  fontFamily="mono"
                  fontSize="9px"
                  color="whiteAlpha.500"
                  letterSpacing="wider"
                  textTransform="uppercase"
                >
                  {BUCKET_LABELS[bucket]}
                </Text>
                <Text fontFamily="mono" fontSize="xs" color="whiteAlpha.900">
                  {formatRange(dropQuantities[bucket])}
                  <Text as="span" color="whiteAlpha.500" ml={1}>
                    uniques
                  </Text>
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
      <Box mt={3}>
        <Text
          fontFamily="mono"
          fontSize="9px"
          color="whiteAlpha.500"
          letterSpacing="wider"
          textTransform="uppercase"
          mb={1}
        >
          Valid Drops
        </Text>
        <Wrap spacing={1}>
          {drops.map((drop) => (
            <WrapItem key={drop}>
              <Tag size="sm" variant="subtle" colorScheme="purple" fontSize="10px">
                {drop}
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    </>
  );
}

function EntryCard({
  name,
  category,
  shortName,
  quantities,
  drops,
  dropQuantities,
  unit,
  accentColor,
}) {
  return (
    <Box
      bg="rgba(255,255,255,0.03)"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" align="flex-start" spacing={2} flexWrap="wrap">
        <Box>
          <HStack spacing={2} align="center">
            <Text fontWeight="bold" color={accentColor ?? 'whiteAlpha.900'}>
              {name}
            </Text>
            {shortName && (
              <Text fontFamily="mono" fontSize="10px" color="whiteAlpha.500">
                {shortName}
              </Text>
            )}
          </HStack>
          {category && (
            <Badge
              colorScheme="purple"
              variant="subtle"
              fontSize="9px"
              textTransform="capitalize"
              mt={1}
            >
              {category}
            </Badge>
          )}
        </Box>
      </HStack>
      <QuantitiesGrid quantities={quantities} unit={unit} />
      <DropsList drops={drops} dropQuantities={dropQuantities} />
    </Box>
  );
}

// One accordion section per registry collection.
function CollectionSection({
  title,
  description,
  entries,
  unit,
  extractCategory,
  extractShortName,
  extractDrops,
  extractDropQuantities,
  entryAccentColor,
  defaultIsOpen = false,
}) {
  if (!entries || entries.length === 0) return null;
  return (
    <AccordionItem
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      mb={3}
      overflow="hidden"
    >
      <AccordionButton
        px={4}
        py={3}
        bg="whiteAlpha.50"
        _hover={{ bg: 'whiteAlpha.100' }}
        _expanded={{ bg: 'whiteAlpha.100' }}
      >
        <HStack flex={1} spacing={2}>
          <Text fontWeight="bold" color="whiteAlpha.900">
            {title}
          </Text>
          <Badge colorScheme="purple" variant="subtle" fontSize="xs">
            {entries.length}
          </Badge>
        </HStack>
        <AccordionIcon color="whiteAlpha.700" />
      </AccordionButton>
      <AccordionPanel px={4} py={4} bg="rgba(0,0,0,0.15)">
        {description && (
          <Text fontSize="xs" color="whiteAlpha.600" mb={3} lineHeight="1.6">
            {description}
          </Text>
        )}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={3}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              name={entry.name}
              category={extractCategory ? extractCategory(entry) : null}
              shortName={extractShortName ? extractShortName(entry) : null}
              quantities={entry.quantities}
              drops={extractDrops ? extractDrops(entry) : null}
              dropQuantities={
                extractDropQuantities ? extractDropQuantities(entry) : null
              }
              unit={unit}
              accentColor={entryAccentColor ? entryAccentColor(entry) : null}
            />
          ))}
        </SimpleGrid>
      </AccordionPanel>
    </AccordionItem>
  );
}

// Search predicate: matches an entry against a lowercase query. Checks
// name, id, tags, and any drops on the entry so a search for "twisted bow"
// surfaces cox etc.
function matchesQuery(entry, q) {
  if (!q) return true;
  const haystack = [
    entry.name,
    entry.id,
    ...(entry.tags ?? []),
    ...(entry.drops ?? []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export default function ContentRegistryViewer() {
  const {
    soloBosses,
    raids,
    skills,
    minigames,
    clueTiers,
    loading,
    error,
  } = useContentRegistry();

  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Sort bosses by category then name so short-tier stuff floats to the top.
  const sortedBosses = useMemo(() => {
    if (!soloBosses) return [];
    const CAT_ORDER = { short: 0, medium: 1, long: 2, wilderness: 3 };
    return Object.values(soloBosses)
      .filter((b) => matchesQuery(b, q))
      .sort((a, b) => {
        const c = (CAT_ORDER[a.category] ?? 99) - (CAT_ORDER[b.category] ?? 99);
        if (c !== 0) return c;
        return a.name.localeCompare(b.name);
      });
  }, [soloBosses, q]);

  const sortedRaids = useMemo(() => {
    if (!raids) return [];
    return Object.values(raids)
      .filter((r) => matchesQuery(r, q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [raids, q]);

  const sortedSkills = useMemo(() => {
    if (!skills) return [];
    const CAT_ORDER = { gathering: 0, artisan: 1, combat: 2, support: 3 };
    return Object.values(skills)
      .filter((s) => matchesQuery(s, q))
      .sort((a, b) => {
        const c = (CAT_ORDER[a.category] ?? 99) - (CAT_ORDER[b.category] ?? 99);
        if (c !== 0) return c;
        return a.name.localeCompare(b.name);
      });
  }, [skills, q]);

  const sortedMinigames = useMemo(() => {
    if (!minigames) return [];
    return Object.values(minigames)
      .filter((m) => matchesQuery(m, q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [minigames, q]);

  const sortedClueTiers = useMemo(() => {
    if (!clueTiers) return [];
    const TIER_ORDER = ['beginner', 'easy', 'medium', 'hard', 'elite', 'master'];
    return Object.values(clueTiers)
      .filter((c) => matchesQuery(c, q))
      .sort((a, b) => TIER_ORDER.indexOf(a.id) - TIER_ORDER.indexOf(b.id));
  }, [clueTiers, q]);

  const totalMatches =
    sortedBosses.length +
    sortedRaids.length +
    sortedSkills.length +
    sortedMinigames.length +
    sortedClueTiers.length;

  if (loading) {
    return (
      <Flex align="center" justify="center" py={20}>
        <Spinner color="purple.300" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box p={6} bg="rgba(220,38,38,0.08)" borderRadius="md" border="1px solid" borderColor="red.700">
        <Text color="red.200">Could not load the content registry: {error.message}</Text>
      </Box>
    );
  }

  return (
    <Box py={5}>
      <VStack align="stretch" spacing={5}>
        <Box>
          <Heading size="md" color="whiteAlpha.900" mb={1}>
            OSRS content registry
          </Heading>
          <Text fontSize="sm" color="whiteAlpha.600" lineHeight="1.7">
            The full pool of osrs content that events on this site can draw from. Ranges are
            per-length-bucket targets (short heists / medium campaigns / long grinds). Drops lists
            show the tradeable/unique items that count for &quot;unique&quot; metric tasks.
          </Text>
        </Box>

        <Input
          placeholder="Search by name, tag, or drop (e.g. 'zulrah', 'twisted bow', 'wildy')"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          bg="whiteAlpha.50"
          borderColor="whiteAlpha.200"
          color="whiteAlpha.900"
          _placeholder={{ color: 'whiteAlpha.400' }}
          _focus={{ borderColor: 'purple.300', boxShadow: 'none' }}
          maxW="520px"
        />

        {q && (
          <Text fontSize="xs" color="whiteAlpha.500" fontFamily="mono">
            {totalMatches} match{totalMatches === 1 ? '' : 'es'} for &quot;{query}&quot;
          </Text>
        )}

        <Accordion allowMultiple defaultIndex={[0]}>
          <CollectionSection
            title="Solo bosses"
            description="Standalone boss fights tracked by WOM. Category tag reflects the typical fight length. Wilderness bosses carry inherent PK risk."
            entries={sortedBosses}
            unit="kc"
            extractCategory={(b) => b.category}
            extractDrops={(b) => b.drops}
            extractDropQuantities={(b) => b.dropQuantities}
          />
          <CollectionSection
            title="Raids"
            description="Group PvM raids. Drops lists are the shared reward pools that count as uniques."
            entries={sortedRaids}
            unit="kc"
            extractShortName={(r) => r.shortName}
            extractDrops={(r) => r.drops}
            extractDropQuantities={(r) => r.dropQuantities}
          />
          <CollectionSection
            title="Skills"
            description="Every WOM-tracked skill. Ranges are per-bucket XP targets."
            entries={sortedSkills}
            unit="xp"
            extractCategory={(s) => s.category}
          />
          <CollectionSection
            title="Minigames & activities"
            description="Minigames, activities, and shared-loot chests. Some are drop-bearing (barrows, lunar chests); most track by completions."
            entries={sortedMinigames}
            unit=""
            extractCategory={(m) => m.category}
            extractDrops={(m) => m.drops}
            extractDropQuantities={(m) => m.dropQuantities}
          />
          <CollectionSection
            title="Clue tiers"
            description="Clue-scroll completions by tier. Color matches the in-game scroll."
            entries={sortedClueTiers}
            unit="clues"
            entryAccentColor={(c) => CLUE_COLORS[c.id]}
          />
        </Accordion>
      </VStack>
    </Box>
  );
}
