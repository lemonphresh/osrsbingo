import React, { useMemo, useState } from 'react';
import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Divider, Button, Center, Badge,
  Tag,
} from '@chakra-ui/react';
import { useQuery } from '@apollo/client';
import { useAuth } from '../../providers/AuthProvider';
import { GET_SPOOPY_ADMIN_EVENT } from '../../graphql/spoopyOperations';
import SpoopyTile from '../../organisms/spoopy/SpoopyTile';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import SpoopyTileDialog from '../../organisms/spoopy/SpoopyTileDialog';
import SpoopyTaskCard, { taskLine, AcceptableUniquesDrops } from '../../organisms/spoopy/SpoopyTaskCard';
import SpoopyStartModal from '../../organisms/spoopy/SpoopyStartModal';
import SpoopyHauntedHouseModal from '../../organisms/spoopy/SpoopyHauntedHouseModal';
import SpoopyCashedOutModal from '../../organisms/spoopy/SpoopyCashedOutModal';
import SpoopyMossyWildyClue from '../../organisms/spoopy/SpoopyMossyWildyClue';
import SpoopyUiIcon from '../../organisms/spoopy/SpoopyUiIcon';
import SpoopyActivatePreflightModal from '../../organisms/spoopy/SpoopyActivatePreflightModal';
import SpoopyContentGallery, { buildSpoopyContentEntries } from '../../organisms/spoopy/SpoopyContentGallery';
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
        <RefsGoalPanelSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <HauntedHouseSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <CashedOutSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <GpBannerSection />
        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <ActivatePreflightSection />
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

function ContentPreviewSection() {
  const { data, loading, error, refetch } = useQuery(GET_SPOOPY_ADMIN_EVENT, {
    fetchPolicy: 'cache-and-network',
  });
  const event = data?.spoopyEvents?.[0] ?? null;
  const entries = useMemo(() => buildSpoopyContentEntries(event), [event]);

  const [open, setOpen] = useState(false);

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
            onClick={() => setOpen(true)}
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

      <SpoopyContentGallery
        event={event}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </VStack>
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

// Mirrors the "goal" panel + accepted-drops grid that renders inside each
// TileGroup on SpoopyRefsPage. Examples are copy-pasted from
// server/utils/spoopy/fixtures/content.csv so refs can preview what a real
// custom / uniques / house-choice tile looks like in the review flow.
const REFS_GOAL_EXAMPLES = [
  {
    coord: 'r19-c1',
    tileType: 'ghost',
    note: 'custom task with multi-boss drop pool override',
    task: {
      kind: 'custom',
      target: "any uniques from K'ril or Bandos combined",
      amount: 4,
      acceptable_drops: [
        'Staff of the Dead', 'Zamorakian Spear', 'Steam Battlestaff',
        'Zamorak Hilt', "K'ril Tsutsaroth Jr.", 'Bandos Chestplate',
        'Bandos Tassets', 'Bandos Boots', 'Bandos Hilt', 'General Graardor Jr.',
      ],
    },
  },
  {
    coord: 'r9-c8',
    tileType: 'ghost',
    flavorText: null,
    note: 'standard uniques tile — registry-fallback would also work',
    task: {
      kind: 'uniques',
      target: 'vorkath',
      amount: 5,
      acceptable_drops: [
        'Dragonbone Necklace', 'Jar of Decay', "Vorkath's Head (not 50kc one)",
        'Vorki', 'Skeletal Visage', 'Draconic Visage',
      ],
    },
  },
  {
    coord: 'r12-c8',
    tileType: 'house',
    note: 'Mossy Way treat option — custom sentence IS the goal',
    task: {
      kind: 'custom',
      target: 'Travel to a spooky spot in the Wilderness. Draw a Jack o\' lantern on the minimap using dropped bat bones',
      amount: 1,
    },
  },
];

function RefsGoalPanelSection() {
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>refs goal panel</Heading>
      <Text fontSize="sm" opacity={0.7}>
        the "what was the player supposed to do" block that sits above the progress
        slider on each tile group in the refs page. especially matters for custom
        tasks where the sentence IS the whole requirement.
      </Text>
      <VStack align="stretch" spacing={3}>
        {REFS_GOAL_EXAMPLES.map(({ coord, tileType, task, flavorText, note }) => (
          <Box
            key={coord}
            bg={SPOOPY_COLORS.nightDeep}
            borderRadius="lg"
            border="1px solid"
            borderColor={SPOOPY_COLORS.nightMist}
            p={4}
          >
            <HStack mb={3} spacing={2}>
              <Text fontSize="xs" fontFamily="mono" color={SPOOPY_COLORS.pumpkinLight} fontWeight="bold" letterSpacing="wider">
                {coord}
              </Text>
              <Text fontSize="xs" color={SPOOPY_COLORS.paper} opacity={0.7}>
                {TILE_META[tileType]?.label ?? tileType}
              </Text>
              <Text fontSize="xs" color={SPOOPY_COLORS.paper} opacity={0.5}>· {note}</Text>
            </HStack>

            <VStack align="stretch" spacing={3}>
              <Box
                bg={SPOOPY_COLORS.night}
                border="1px solid"
                borderColor={SPOOPY_COLORS.nightMist}
                borderRadius="md"
                px={3}
                py={2}
              >
                <Text
                  fontSize="10px"
                  color={SPOOPY_COLORS.pumpkinLight}
                  fontWeight="bold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={1}
                >
                  goal
                </Text>
                <Text fontSize="sm" color={SPOOPY_COLORS.paper} fontFamily={SPOOPY_FONTS.hand}>
                  {taskLine(task)}
                </Text>
                {flavorText && (
                  <Text fontSize="xs" color={SPOOPY_COLORS.paper} opacity={0.65} mt={1}>
                    {flavorText}
                  </Text>
                )}
              </Box>
              <AcceptableUniquesDrops task={task} />
            </VStack>
          </Box>
        ))}
      </VStack>
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

function CashedOutSection() {
  const [open, setOpen] = useState(false);
  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>cashed-out modal</Heading>
      <Text fontSize="sm" opacity={0.7}>
        pops the moment a team cashes out at the spooky house. non-dismissable; obscures the
        board so the team can't keep interacting after their night is done.
      </Text>
      <HStack>
        <Button
          bg={SPOOPY_COLORS.pumpkin}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
          onClick={() => setOpen(true)}
        >
          open cashed-out modal
        </Button>
        {open && (
          <Button variant="ghost" onClick={() => setOpen(false)}>
            close (preview only)
          </Button>
        )}
      </HStack>
      <SpoopyCashedOutModal
        isOpen={open}
        gpEarned={2250000}
        teamName="the ghouls next door"
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

// ── Pre-flight overview (SETUP → ACTIVE confirmation modal) ──────────
//
// Three fixture scenarios so you can inspect how the modal renders at
// different readiness levels:
//   - happy    : every field populated, no blockers, no warnings
//   - warnings : populated enough to be live-able, but with a bunch of
//                yellow soft warnings (missing pw, team with 0 members,
//                teams without role, pending drops, etc.)
//   - blocked  : missing teams AND a candybag — "go live" button disabled

const MOCK_PREFLIGHT_BASE = {
  eventId: 'spoopy_mock',
  eventName: 'A Spoopy Situation',
  prizePool: 25_000_000,
  curfewStart: '2026-10-31T18:00:00.000Z',
  curfewEnd: '2026-11-01T00:00:00.000Z',
  eventPassword: 'ghouls gone wild',
  adminIds: ['site-admin-1', 'site-admin-2'],
  womCompetitionId: '98765',
  startingTileIds: ['t-r21-c15'],
  board: {
    dimensions: { rows: 22, cols: 30 },
    candybagTileId: 't-r0-c15',
    tiles: [
      ...Array.from({ length: 20 }, (_, i) => ({ id: `h-${i}`, tile_type: 'house' })),
      ...Array.from({ length: 8 }, (_, i) => ({ id: `g-${i}`, tile_type: 'ghost' })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: `gr-${i}`, tile_type: 'grave' })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `p-${i}`, tile_type: 'pumpkin' })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `c-${i}`, tile_type: 'black-cat' })),
      { id: 't-r21-c15', tile_type: 'start' },
      { id: 't-r0-c15', tile_type: 'candybag' },
    ],
  },
  contentById: {},
};

const MOCK_PREFLIGHT_HAPPY_TEAMS = [
  { teamId: 't1', teamName: 'Head Stoners', color: '#8c3a2b', members: ['u1', 'u2', 'u3', 'u4'], discordChannelId: '111', discordRoleId: '222', mossyWildyLocation: 3 },
  { teamId: 't2', teamName: 'Casket Cases', color: '#6a4e8e', members: ['u5', 'u6', 'u7'], discordChannelId: '112', discordRoleId: '223', mossyWildyLocation: 7 },
  { teamId: 't3', teamName: 'Just Bat It', color: '#2f6e3e', members: ['u8', 'u9', 'u10', 'u11', 'u12'], discordChannelId: '113', discordRoleId: '224', mossyWildyLocation: 1 },
  { teamId: 't4', teamName: 'Wax On Zuk Off', color: '#d38a52', members: ['u13', 'u14', 'u15'], discordChannelId: '114', discordRoleId: '225', mossyWildyLocation: 11 },
];

const MOCK_PREFLIGHT_WARNING_TEAMS = [
  { teamId: 't1', teamName: 'Head Stoners', color: '#8c3a2b', members: ['u1', 'u2', 'u3'], discordChannelId: '111', discordRoleId: '222', mossyWildyLocation: 3 },
  { teamId: 't2', teamName: 'Casket Cases', color: '#6a4e8e', members: [], discordChannelId: '112', discordRoleId: null, mossyWildyLocation: 7 },
  { teamId: 't3', teamName: 'Spin Doctors', color: '#2f6e3e', members: ['u5', 'u6'], discordChannelId: null, discordRoleId: null, mossyWildyLocation: 1 },
];

const MOCK_PREFLIGHT_BLOCKED_BASE = {
  ...MOCK_PREFLIGHT_BASE,
  startingTileIds: [],
  board: {
    dimensions: { rows: 22, cols: 30 },
    candybagTileId: null,
    tiles: [],
  },
};

function makePreflightEvent({ teams, override = {} }) {
  return {
    ...MOCK_PREFLIGHT_BASE,
    ...override,
    teams,
  };
}

function ActivatePreflightSection() {
  const [variant, setVariant] = useState(null);

  const event = useMemo(() => {
    if (variant === 'happy') {
      return makePreflightEvent({ teams: MOCK_PREFLIGHT_HAPPY_TEAMS });
    }
    if (variant === 'warnings') {
      return makePreflightEvent({
        teams: MOCK_PREFLIGHT_WARNING_TEAMS,
        override: {
          eventPassword: null,
          womCompetitionId: null,
          contentById: {
            'h-0': { task: { kind: 'uniques', acceptable_drops: [] } },
            'h-1': {
              dialog: { options: { a: { task: { kind: 'uniques', acceptable_drops: [] } } } },
            },
            'h-2': {
              dialog: { options: { b: { task: { kind: 'uniques', acceptable_drops: [] } } } },
            },
          },
        },
      });
    }
    if (variant === 'blocked') {
      return {
        ...MOCK_PREFLIGHT_BLOCKED_BASE,
        teams: [],
      };
    }
    return null;
  }, [variant]);

  return (
    <VStack spacing={4} align="stretch">
      <Heading size="md" fontFamily={SPOOPY_FONTS.heading}>pre-flight (setup → active)</Heading>
      <Text fontSize="sm" opacity={0.7}>
        confirmation modal shown before flipping the event live. three fixtures: everything clean, a
        realistic mix of soft warnings, and a hard-blocker state where "go live" is disabled.
      </Text>
      <HStack flexWrap="wrap">
        <Button
          onClick={() => setVariant('happy')}
          bg={SPOOPY_COLORS.pumpkin}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
        >
          happy path
        </Button>
        <Button
          onClick={() => setVariant('warnings')}
          variant="outline"
          borderColor={SPOOPY_COLORS.pumpkin}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
        >
          with warnings
        </Button>
        <Button
          onClick={() => setVariant('blocked')}
          variant="outline"
          borderColor={SPOOPY_COLORS.ember}
          color={SPOOPY_COLORS.paper}
          _hover={{ bg: SPOOPY_COLORS.nightMist }}
        >
          blocked (no candybag / no teams)
        </Button>
      </HStack>
      <SpoopyActivatePreflightModal
        isOpen={variant !== null}
        onClose={() => setVariant(null)}
        event={event}
        isConfirming={false}
        onConfirm={() => setVariant(null)}
      />
    </VStack>
  );
}

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
