import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Divider, Button, Center, Badge,
  Select, IconButton, Tag,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../providers/AuthProvider';
import { GET_SPOOPY_ADMIN_EVENT } from '../../graphql/spoopyOperations';
import SpoopyTile from '../../organisms/spoopy/SpoopyTile';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import SpoopyTileDialog from '../../organisms/spoopy/SpoopyTileDialog';
import SpoopyTaskCard from '../../organisms/spoopy/SpoopyTaskCard';
import SpoopyTaskModal from '../../organisms/spoopy/SpoopyTaskModal';
import SpoopyStartModal from '../../organisms/spoopy/SpoopyStartModal';
import SpoopyHauntedHouseModal from '../../organisms/spoopy/SpoopyHauntedHouseModal';
import SpoopyMossyWildyClue from '../../organisms/spoopy/SpoopyMossyWildyClue';
import SpoopyUiIcon from '../../organisms/spoopy/SpoopyUiIcon';
import {
  SPOOPY_COLORS, SPOOPY_FONTS, TILE_META, STATUS_META,
} from '../../organisms/spoopy/spoopyTheme';

// ── Mock board + content — mirrors server/utils/spoopy/spoopyMockEvent.js ──
// Kept inline so this page renders without any DB or GraphQL round trips.

const MOCK_BOARD = {
  dimensions: { rows: 3, cols: 7 },
  candybagTileId: 't-r2-c6',
  tiles: [
    { id: 't-r0-c0', tile_type: 'house',     position: { row: 0, col: 0 }, neighbors: ['t-r0-c2', 't-r2-c0'] },
    { id: 't-r0-c2', tile_type: 'pumpkin',   position: { row: 0, col: 2 }, neighbors: ['t-r0-c0', 't-r0-c4'] },
    { id: 't-r0-c4', tile_type: 'ghost',     position: { row: 0, col: 4 }, neighbors: ['t-r0-c2', 't-r0-c6'] },
    { id: 't-r0-c6', tile_type: 'grave',     position: { row: 0, col: 6 }, neighbors: ['t-r0-c4', 't-r2-c6'] },
    { id: 't-r2-c0', tile_type: 'house',     position: { row: 2, col: 0 }, neighbors: ['t-r0-c0'] },
    { id: 't-r2-c4', tile_type: 'black-cat', position: { row: 2, col: 4 }, neighbors: ['t-r2-c6'] },
    { id: 't-r2-c6', tile_type: 'candybag',  position: { row: 2, col: 6 }, neighbors: ['t-r0-c6', 't-r2-c4'] },
  ],
  cells: (() => {
    const grid = Array.from({ length: 3 }, () =>
      Array.from({ length: 7 }, () => ({ kind: 'empty' })),
    );
    // Connectors between the placed tiles (matches the mock event shape).
    [[0, 1], [0, 3], [0, 5], [1, 0], [1, 6], [2, 5]].forEach(([r, c]) => {
      grid[r][c] = { kind: 'connector' };
    });
    return grid;
  })(),
};

const MOCK_TEAM_STATE_MIXED = {
  tiles: {
    't-r0-c0': { status: 'complete' },
    't-r0-c2': { status: 'submitted' },
    't-r0-c4': { status: 'unlocked' },
    't-r0-c6': { status: 'locked' },
    't-r2-c0': { status: 'complete' },
    't-r2-c4': { status: 'locked' },
    't-r2-c6': { status: 'locked' },
  },
};

const MOCK_DIALOG = {
  prompt: "trick or treat! ohhh wow such spoopy costumes uwu did you visit lexi's house already?",
  options: {
    a: {
      label: "not yet, but we'll get there. didn't want to interrupt her path to max",
      outcome: 'treat',
      task: { kind: 'skilling_xp', target: 'firemaking', amount: 100000 },
      reward_gp: 500000,
    },
    b: {
      label: "tp'd the hell out of that thing and left toaster strudels",
      outcome: 'trick',
      task: { kind: 'boss_kc', target: 'callisto', amount: 5 },
      reward_gp: 200000,
    },
  },
};

// ─────────────────────────────────────────────────────────────────────

export default function SpoopyPlaygroundPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) return <Shell><Center py={20}><Text>...</Text></Center></Shell>;
  if (!isAuthenticated || !user?.admin) {
    return (
      <Shell>
        <Center py={20}>
          <VStack spacing={2}>
            <Text fontFamily={SPOOPY_FONTS.hand} fontSize="xl">nothing to see here</Text>
            <Text opacity={0.7} fontSize="sm">this page is site-admin only</Text>
          </VStack>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
      <VStack spacing={10} py={8} px={{ base: 4, md: 8 }} align="stretch" maxW="1200px" mx="auto">
        <Intro />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <ContentPreviewSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <PaletteSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <TypographySection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <TileMatrixSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <BoardSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <StartTileSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <DialogSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <TaskCardSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <HauntedHouseSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <GpBannerSection />
      </VStack>
    </Shell>
  );
}

// ── Sections ──────────────────────────────────────────────────────────

function Intro() {
  return (
    <VStack spacing={2} align="start">
      <Heading fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
        <HStack as="span" spacing={2}>
          <SpoopyUiIcon name="pumpkin" />
          <Text as="span">spoopy ui playground</Text>
        </HStack>
      </Heading>
      <Text opacity={0.75} fontSize="sm" maxW="lg">
        every component in isolation, on mock data. safe to click things, nothing here writes to
        the db. this is the reference sheet we're iterating against.
      </Text>
    </VStack>
  );
}

// ── Live content preview carousel ─────────────────────────────────────
//
// Loads the current event (first row from spoopyEvents) and lets the admin
// click through every tile view sequentially. Houses render twice — once
// per locked-in option (trick + treat) — so you can confirm both branches
// read correctly. Non-house tiles get one view each. Start and candybag
// also appear so you can eyeball the ready-up story and haunted-house flow.
//
// This is NOT the live board. Nothing here writes state. It's an inline
// preview for pre-flight content QA.

// Builds the flat list of previewable "entries" from an event. Each entry
// knows what modal to render and (for houses) which option to lock in.
function buildPreviewEntries(event) {
  if (!event) return [];
  const tiles = event.board?.tiles ?? [];
  const contentById = event.contentById ?? {};
  const sorted = [...tiles].sort((a, b) => {
    if (a.position?.row !== b.position?.row) return (a.position?.row ?? 0) - (b.position?.row ?? 0);
    return (a.position?.col ?? 0) - (b.position?.col ?? 0);
  });

  const entries = [];
  for (const tile of sorted) {
    const content = contentById[tile.id];
    if (tile.tile_type === 'house') {
      // Even if content is missing we still emit entries so the user sees
      // "this tile has no content yet" rather than skipping silently.
      //
      // Three entries per house: the pre-choice state (what players see when
      // they first click the tile, with both options and the discord
      // commands) plus one for each locked-in option so you can confirm the
      // revealed task card reads correctly on either branch.
      const outcomeA = content?.dialog?.options?.a?.outcome;
      const outcomeB = content?.dialog?.options?.b?.outcome;
      entries.push({
        key: `${tile.id}:pick`,
        tileId: tile.id,
        tileType: 'house',
        variant: null,
        label: `${tile.id} · trick or treat?`,
        tile,
        content,
      });
      entries.push({
        key: `${tile.id}:a`,
        tileId: tile.id,
        tileType: 'house',
        variant: 'a',
        label: `${tile.id} · option a${outcomeA ? ` (${outcomeA})` : ''}`,
        tile,
        content,
      });
      entries.push({
        key: `${tile.id}:b`,
        tileId: tile.id,
        tileType: 'house',
        variant: 'b',
        label: `${tile.id} · option b${outcomeB ? ` (${outcomeB})` : ''}`,
        tile,
        content,
      });
    } else {
      entries.push({
        key: tile.id,
        tileId: tile.id,
        tileType: tile.tile_type,
        variant: null,
        label: `${tile.id} · ${tile.tile_type}`,
        tile,
        content,
      });
    }
  }
  return entries;
}

function ContentPreviewSection() {
  const { data, loading, error, refetch } = useQuery(GET_SPOOPY_ADMIN_EVENT, {
    fetchPolicy: 'cache-and-network',
  });
  const event = data?.spoopyEvents?.[0] ?? null;
  const entries = useMemo(() => buildPreviewEntries(event), [event]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);

  const entry = entries[idx] ?? null;

  const prev = () => setIdx((i) => Math.max(0, i - 1));
  const next = () => setIdx((i) => Math.min(entries.length - 1, i + 1));

  return (
    <VStack spacing={3} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>
        content preview carousel
      </Heading>
      <Text fontSize="sm" opacity={0.75} maxW="lg">
        pulls the current event's tiles and content. click through every house trick + treat view
        and every non-house tile so you can confirm each one reads correctly before you flip the
        event live.
      </Text>

      {loading && !event && (
        <Text fontSize="sm" opacity={0.6}>loading event content…</Text>
      )}
      {error && (
        <Text fontSize="sm" color={SPOOPY_COLORS.ember}>failed to load: {error.message}</Text>
      )}
      {!loading && !event && (
        <Text fontSize="sm" opacity={0.6}>no event in the db yet. seed one or import content first.</Text>
      )}

      {event && (
        <HStack spacing={3} wrap="wrap">
          <Tag bg={SPOOPY_COLORS.night} color={SPOOPY_COLORS.paper}>
            {event.eventName}
          </Tag>
          <Tag bg={SPOOPY_COLORS.purpleLight} color={SPOOPY_COLORS.paper}>
            {entries.length} view{entries.length === 1 ? '' : 's'}
          </Tag>
          <Button
            size="sm"
            bg={SPOOPY_COLORS.pumpkin}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
            onClick={() => {
              setIdx(0);
              setOpen(true);
            }}
            isDisabled={entries.length === 0}
          >
            open preview
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            onClick={() => refetch()}
            leftIcon={<SpoopyUiIcon name="sync" />}
          >
            refresh
          </Button>
        </HStack>
      )}

      {open && entry && (
        <PreviewOverlay
          event={event}
          entry={entry}
          idx={idx}
          total={entries.length}
          entries={entries}
          onPrev={prev}
          onNext={next}
          onJump={(i) => setIdx(i)}
          onClose={() => setOpen(false)}
        />
      )}
    </VStack>
  );
}

// Renders the matching modal for an entry (dialog for houses, task modal
// for non-house, start modal for the start tile, haunted-house for the
// candybag), plus a fixed-position nav bar at the bottom for prev / next /
// jump-to. Nav bar sits above the modal overlay so it's always clickable.
function PreviewOverlay({ event, entry, idx, total, entries, onPrev, onNext, onJump, onClose }) {
  // Arrow-key navigation. Left/right to flip entries, escape to close. Doesn't
  // intercept keypresses targeted at a form control (the entry-select dropdown)
  // so you can still type-ahead inside it. Attached to window so you don't
  // have to focus the overlay first.
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onPrev, onNext, onClose]);

  // Build a synthetic "team state" entry for the tile so the task modal gets
  // sensible defaults (unlocked status, 0 progress, no submission). Only
  // used by SpoopyTaskModal which reads from tileState for the progress bar.
  const syntheticTileState = {
    status: 'unlocked',
    choice: entry.variant,
    progress: 0,
    submissionId: null,
  };

  // No-op handlers for the modals. Preview is read-only — if the user clicks
  // an action we just do nothing. onClose on each modal closes the overlay.
  const noop = () => {};

  let modal = null;

  if (entry.tileType === 'house') {
    const dialog = entry.content?.dialog;
    if (!dialog) {
      modal = <MissingContentModal entry={entry} onClose={onClose} />;
    } else {
      const chosenOptionData = dialog.options?.[entry.variant] ?? null;
      modal = (
        <SpoopyTileDialog
          isOpen
          onClose={onClose}
          dialog={dialog}
          choiceMade={entry.variant}
          onChoose={noop}
          tileId={entry.tileId}
          womEnabled={Boolean(event?.womCompetitionId)}
          resolvedTaskNode={
            chosenOptionData ? (
              <VStack align="stretch" spacing={3}>
                <SpoopyTaskCard task={chosenOptionData.task} status="unlocked" />
                {entry.tileId === 't-r12-c8' && chosenOptionData.outcome === 'trick' && (
                  <SpoopyMossyWildyClue locationNumber={4} />
                )}
              </VStack>
            ) : null
          }
        />
      );
    }
  } else if (entry.tileType === 'start') {
    modal = (
      <SpoopyStartModal
        isOpen
        onClose={onClose}
        story={entry.content?.story}
        eventPassword={event?.eventPassword}
      />
    );
  } else if (entry.tileType === 'candybag') {
    modal = (
      <SpoopyHauntedHouseModal
        isOpen
        onClose={onClose}
        warningDialog={event?.hauntedHouse?.warningTiers?.[0]?.dialog}
        msRemaining={6 * 60 * 60 * 1000}
        currentGp={0}
        bonusTask={event?.hauntedHouse?.task}
        bonusRewardGp={null}
        tileId={entry.tileId}
        gauntletLevel={0}
        onSubmit={onClose}
      />
    );
  } else if (!entry.content) {
    modal = <MissingContentModal entry={entry} onClose={onClose} />;
  } else {
    modal = (
      <SpoopyTaskModal
        isOpen
        onClose={onClose}
        content={entry.content}
        tileState={syntheticTileState}
        tileType={entry.tileType}
        womEnabled={Boolean(event?.womCompetitionId)}
      />
    );
  }

  return (
    <>
      {modal}
      <Box
        position="fixed"
        bottom={4}
        left="50%"
        transform="translateX(-50%)"
        zIndex={2000}
        bg={SPOOPY_COLORS.nightDeep}
        border="1px solid"
        borderColor={SPOOPY_COLORS.nightMist}
        borderRadius="full"
        px={3}
        py={2}
        boxShadow="0 10px 30px rgba(0,0,0,0.5)"
      >
        <HStack spacing={2}>
          <IconButton
            size="sm"
            aria-label="previous tile"
            icon={<ChevronLeftIcon />}
            onClick={onPrev}
            isDisabled={idx === 0}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
          />
          {/* Admin-only "owner" tag — uses flavor_text as a mnemonic for
              whose trick-or-treat this is. Only renders when the entry has
              flavor text set (common on houses once we start annotating). */}
          {entry.content?.flavor_text && (
            <Tag
              bg={SPOOPY_COLORS.pumpkin}
              color={SPOOPY_COLORS.paper}
              fontFamily={SPOOPY_FONTS.hand}
              fontSize="sm"
              px={2}
              py={1}
            >
              <HStack spacing={1.5}>
                <SpoopyUiIcon name="user" />
                <Text>{entry.content.flavor_text}</Text>
              </HStack>
            </Tag>
          )}
          <Select
            size="sm"
            value={entry.key}
            onChange={(e) => {
              const i = entries.findIndex((x) => x.key === e.target.value);
              if (i >= 0) onJump(i);
            }}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            borderColor={SPOOPY_COLORS.nightMist}
            fontFamily="mono"
            minW="240px"
          >
            {entries.map((e, i) => (
              <option
                key={e.key}
                value={e.key}
                style={{ color: '#000' }}
              >
                {i + 1}/{total} · {e.label}
              </option>
            ))}
          </Select>
          <IconButton
            size="sm"
            aria-label="next tile"
            icon={<ChevronRightIcon />}
            onClick={onNext}
            isDisabled={idx === total - 1}
            bg={SPOOPY_COLORS.night}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
          />
          <Button
            size="sm"
            variant="ghost"
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.nightMist }}
            onClick={onClose}
          >
            close
          </Button>
        </HStack>
      </Box>
    </>
  );
}

// Placeholder for tiles whose content is missing or malformed — we still
// show a modal so the user can see "this tile needs attention" in the
// carousel flow, rather than silently skipping.
function MissingContentModal({ entry, onClose }) {
  return (
    <Box
      position="fixed"
      inset={0}
      bg="rgba(20, 12, 26, 0.85)"
      backdropFilter="blur(4px)"
      zIndex={1400}
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onClose}
    >
      <Box
        bg={SPOOPY_COLORS.paper}
        color={SPOOPY_COLORS.paperInk}
        borderRadius="md"
        p={8}
        maxW="md"
        textAlign="center"
      >
        <Heading size="md" mb={3} fontFamily={SPOOPY_FONTS.heading}>
          <HStack as="span" justify="center" spacing={2}>
            <SpoopyUiIcon name="candle" />
            <Text as="span">no content for this tile</Text>
          </HStack>
        </Heading>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
          <code>{entry.tileId}</code> is a <strong>{entry.tileType}</strong>
          {entry.variant ? ` (option ${entry.variant})` : ''} but has no matching entry in the
          event's content. fill it in via the content csv or an admin edit.
        </Text>
      </Box>
    </Box>
  );
}

function PaletteSection() {
  const swatches = Object.entries(SPOOPY_COLORS);
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>palette</Heading>
      <SimpleGrid columns={{ base: 3, md: 6 }} spacing={3}>
        {swatches.map(([name, hex]) => (
          <VStack key={name} spacing={1} align="stretch">
            <Box height="72px" bg={hex} borderRadius="md" border="1px solid" borderColor="rgba(255,255,255,0.15)" />
            <Text fontSize="xs" fontFamily="mono">{name}</Text>
            <Text fontSize="xs" opacity={0.6}>{hex}</Text>
          </VStack>
        ))}
      </SimpleGrid>
    </VStack>
  );
}

function TypographySection() {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>typography</Heading>
      <VStack spacing={3} align="stretch">
        <FontRow role="heading" font="Eater" fontStack={SPOOPY_FONTS.heading} sample="Spooptober" size="4xl" />
        <FontRow role="hand" font="Special Elite" fontStack={SPOOPY_FONTS.hand} sample="trick or treat!" size="2xl" />
        <FontRow role="body" font="Poppins" fontStack={SPOOPY_FONTS.body} sample="You entered the spooky house. There's no turning back now." size="md" />
      </VStack>
    </VStack>
  );
}

function FontRow({ role, font, fontStack, sample, size }) {
  return (
    <Box
      bg={SPOOPY_COLORS.night}
      border="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
      p={3}
      borderRadius="md"
    >
      <HStack spacing={2} mb={1}>
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" opacity={0.6}>{role}</Text>
        <Text fontSize="xs" opacity={0.4} fontFamily="mono">({font})</Text>
      </HStack>
      <Text fontFamily={fontStack} fontSize={size}>{sample}</Text>
    </Box>
  );
}

function TileMatrixSection() {
  const tileTypes = Object.keys(TILE_META);
  const statuses = Object.keys(STATUS_META);
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>tile states</Heading>
      <Text fontSize="sm" opacity={0.7}>rows = tile type, cols = status. hover unlocked/submitted/complete to see the lift.</Text>
      <Box overflowX="auto">
        <Box display="grid" gridTemplateColumns={`120px repeat(${statuses.length}, 1fr)`} gap={4} minW="600px">
          <Box />
          {statuses.map((s) => (
            <Text key={s} fontFamily={SPOOPY_FONTS.hand} textAlign="center">{s}</Text>
          ))}
          {tileTypes.map((type) => (
            <React.Fragment key={type}>
              <Text alignSelf="center" fontSize="sm" fontFamily={SPOOPY_FONTS.hand}>
                {TILE_META[type].label}
              </Text>
              {statuses.map((status) => (
                <Center key={`${type}-${status}`} py={4}>
                  <SpoopyTile
                    tileType={type}
                    tileId={`${type}-${status}`}
                    status={status}
                    onClick={() => {}}
                    size={64}
                  />
                </Center>
              ))}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    </VStack>
  );
}

function BoardSection() {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>mini board</Heading>
      <Text fontSize="sm" opacity={0.7}>
        7-tile mock board on paper. mixed statuses (two complete, one submitted, one unlocked,
        the rest locked). clicking unlocked tiles logs in the console for now.
      </Text>
      <SpoopyBoard
        board={MOCK_BOARD}
        teamState={MOCK_TEAM_STATE_MIXED}
        onTileClick={(id) => console.log('tile clicked', id)}
      />
    </VStack>
  );
}

const MOCK_START_STORY = {
  intro:
    "it's spooky season, and it's time to get the gang together to go trick-or-treating... you've come to the most haunted neighborhood with the main goal to visit as many houses as possible before curfew is up. the group has agreed you absolutely MUST visit the scary house at the other end of the street before curfew is up though, even if it comes at the cost of not visiting the rest of the houses first... time to balance your trick-or-treating time with curfew, and see how much candy (gp) you can gather up for the team!",
  task:
    "for this first task, to get you familiar with the submission flow, the ask is for several of your team members to take an in-game selfie (individual){{passwordClause}} and submit it via {{command}} in your team channel.",
  passwordClauseTemplate: ' with the event password "{{password}}" visible in the WOM plugin overlay',
  command: '!spoopysubmit',
  footer: 'refs will approve and set you on your spooky way as soon as this is done! stay safe out there!!!',
};

function StartTileSection() {
  const [openWithPw, setOpenWithPw] = useState(false);
  const [openWithoutPw, setOpenWithoutPw] = useState(false);
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>start tile (ready up)</Heading>
      <Text fontSize="sm" opacity={0.7}>
        story-driven kickoff modal shown when the team clicks the start tile. copy adapts to whether
        the admin has set an event password.
      </Text>
      <HStack>
        <Button onClick={() => setOpenWithPw(true)} bg={SPOOPY_COLORS.pumpkin} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}>
          with event password
        </Button>
        <Button onClick={() => setOpenWithoutPw(true)} variant="outline" borderColor={SPOOPY_COLORS.nightMist} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.nightMist }}>
          no event password
        </Button>
      </HStack>
      <SpoopyStartModal
        isOpen={openWithPw}
        onClose={() => setOpenWithPw(false)}
        story={MOCK_START_STORY}
        eventPassword="spooptober2026"
      />
      <SpoopyStartModal
        isOpen={openWithoutPw}
        onClose={() => setOpenWithoutPw(false)}
        story={MOCK_START_STORY}
        eventPassword={null}
      />
    </VStack>
  );
}

function DialogSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [choice, setChoice] = useState(null);

  const chosenOption = choice ? MOCK_DIALOG.options[choice] : null;

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>trick-or-treat dialog</Heading>
      <Text fontSize="sm" opacity={0.7}>
        shown when a house tile is clicked. locks the choice + reveals the task on selection.
      </Text>
      <HStack>
        <Button onClick={() => { setChoice(null); setIsOpen(true); }} colorScheme="purple">
          open (no choice yet)
        </Button>
        <Button onClick={() => { setChoice('a'); setIsOpen(true); }} variant="outline" colorScheme="purple">
          open (treat chosen)
        </Button>
        <Button onClick={() => { setChoice('b'); setIsOpen(true); }} variant="outline" colorScheme="purple">
          open (trick chosen)
        </Button>
      </HStack>
      <SpoopyTileDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dialog={MOCK_DIALOG}
        choiceMade={choice}
        onChoose={(opt) => setChoice(opt)}
        resolvedTaskNode={
          chosenOption ? (
            <VStack align="stretch" spacing={3}>
              <SpoopyTaskCard
                task={chosenOption.task}
                status="unlocked"
              />
              {chosenOption.outcome === 'trick' && (
                <SpoopyMossyWildyClue locationNumber={4} />
              )}
            </VStack>
          ) : null
        }
      />
    </VStack>
  );
}

function TaskCardSection() {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>task cards</Heading>
      <Text fontSize="sm" opacity={0.7}>
        rendered inside dialogs (for houses) and directly on non-house tiles. all three statuses.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <SpoopyTaskCard
          task={{ kind: 'skilling_xp', target: 'firemaking', amount: 100000 }}
          status="unlocked"
        />
        <SpoopyTaskCard
          task={{ kind: 'boss_kc', target: 'venenatis', amount: 3 }}
          flavorText="a cracked headstone reads 'here lies a pker'"
          status="submitted"
        />
        <SpoopyTaskCard
          task={{ kind: 'uniques', target: 'nex', amount: 1 }}
          status="complete"
        />
      </SimpleGrid>
    </VStack>
  );
}

function HauntedHouseSection() {
  const [openWarning, setOpenWarning] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [tier, setTier] = useState('severe');

  const warningCopy =
    tier === 'severe'
      ? "you sure? you're really cashing out this early? the neighborhood elders will speak of your cowardice for generations..."
      : 'the night is nearly over. the candy bag is right there. go for it.';
  const ms = tier === 'severe' ? 8 * 60 * 60 * 1000 : 15 * 60 * 1000;

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>haunted house cash-out</Heading>
      <Text fontSize="sm" opacity={0.7}>
        two-phase modal: warning tier (based on time remaining) → confirmation with the bonus task.
      </Text>
      <HStack>
        <Button onClick={() => { setTier('severe'); setOpenWarning(true); }} bg={SPOOPY_COLORS.ember} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.emberDeep }}>
          severe warning
        </Button>
        <Button onClick={() => { setTier('light'); setOpenWarning(true); }} bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.purpleLight }}>
          light warning
        </Button>
        <Button onClick={() => setOpenConfirm(true)} bg={SPOOPY_COLORS.pumpkin} color={SPOOPY_COLORS.paper} _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}>
          confirm phase
        </Button>
      </HStack>

      <SpoopyHauntedHouseModal
        isOpen={openWarning}
        onClose={() => setOpenWarning(false)}
        warningDialog={warningCopy}
        msRemaining={ms}
        currentGp={1250000}
        phase="warning"
        onProceed={() => { setOpenWarning(false); setOpenConfirm(true); }}
      />

      <SpoopyHauntedHouseModal
        isOpen={openConfirm}
        onClose={() => setOpenConfirm(false)}
        phase="confirm"
        currentGp={1250000}
        bonusTask={{ kind: 'custom', target: 'group photo in spooky outfits', amount: 1 }}
        bonusRewardGp={1000000}
        onSubmit={() => setOpenConfirm(false)}
      />
    </VStack>
  );
}

function GpBannerSection() {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>gp banner states</Heading>
      <Text fontSize="sm" opacity={0.7}>
        the counter shown in the page header for a team. three states: mid-run, cashed out, forfeited.
      </Text>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Banner label="mid-run" bg={SPOOPY_COLORS.paper} fg={SPOOPY_COLORS.paperInk} value="1,250,000 gp" />
        <Banner label="cashed out" bg={SPOOPY_COLORS.green} fg={SPOOPY_COLORS.paper} value="2,250,000 gp (banked)" icon="party" />
        <Banner label="forfeited" bg={SPOOPY_COLORS.emberDeep} fg={SPOOPY_COLORS.paper} value="0 gp (forfeited)" icon="candle" />
      </SimpleGrid>
    </VStack>
  );
}

function Banner({ label, bg, fg, value, icon }) {
  return (
    <VStack spacing={1} align="stretch">
      <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">{label}</Text>
      <HStack bg={bg} color={fg} px={3} py={2} borderRadius="md" fontWeight="700" spacing={2}>
        <Text>{value}</Text>
        {icon && <SpoopyUiIcon name={icon} />}
      </HStack>
    </VStack>
  );
}

// ── Shell ─────────────────────────────────────────────────────────────

function Shell({ children }) {
  return (
    <Box minHeight="calc(100vh - 60px)" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
      <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
        <HStack justify="space-between" wrap="wrap" gap={2}>
          <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
            <HStack as="span" spacing={2}>
              <SpoopyUiIcon name="pumpkin" />
              <Text as="span">spoopy playground</Text>
            </HStack>
          </Heading>
          <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper} textTransform="lowercase">
            site admin only
          </Badge>
        </HStack>
      </Box>
      {children}
    </Box>
  );
}
