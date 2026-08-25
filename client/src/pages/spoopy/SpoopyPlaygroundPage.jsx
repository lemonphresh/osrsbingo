import React, { useState } from 'react';
import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Divider, Button, Center, Badge,
} from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';
import SpoopyTile from '../../organisms/spoopy/SpoopyTile';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import SpoopyTileDialog from '../../organisms/spoopy/SpoopyTileDialog';
import SpoopyTaskCard from '../../organisms/spoopy/SpoopyTaskCard';
import SpoopyStartModal from '../../organisms/spoopy/SpoopyStartModal';
import SpoopyHauntedHouseModal from '../../organisms/spoopy/SpoopyHauntedHouseModal';
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
        🎃 spoopy ui playground
      </Heading>
      <Text opacity={0.75} fontSize="sm" maxW="lg">
        every component in isolation, on mock data. safe to click things — nothing here writes to
        the db. this is the reference sheet we're iterating against.
      </Text>
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
        <Text fontSize="xs" opacity={0.4} fontFamily="mono">— {font}</Text>
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
        7-tile mock board on paper. mixed statuses — two complete, one submitted, one unlocked,
        the rest locked. clicking unlocked tiles logs in the console for now.
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
          open — no choice yet
        </Button>
        <Button onClick={() => { setChoice('a'); setIsOpen(true); }} variant="outline" colorScheme="purple">
          open — treat chosen
        </Button>
        <Button onClick={() => { setChoice('b'); setIsOpen(true); }} variant="outline" colorScheme="purple">
          open — trick chosen
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
            <SpoopyTaskCard
              task={chosenOption.task}
              rewardGp={chosenOption.reward_gp}
              status="unlocked"
            />
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
          rewardGp={500000}
          status="unlocked"
        />
        <SpoopyTaskCard
          task={{ kind: 'boss_kc', target: 'venenatis', amount: 3 }}
          flavorText="a cracked headstone reads 'here lies a pker'"
          status="submitted"
        />
        <SpoopyTaskCard
          task={{ kind: 'uniques', target: 'nex', amount: 1 }}
          rewardGp={250000}
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
        two-phase modal — warning tier (based on time remaining) → confirmation with the bonus task.
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
        <Banner label="cashed out" bg={SPOOPY_COLORS.green} fg={SPOOPY_COLORS.paper} value="2,250,000 gp — banked 🎉" />
        <Banner label="forfeited" bg={SPOOPY_COLORS.emberDeep} fg={SPOOPY_COLORS.paper} value="0 gp — forfeited 🕯️" />
      </SimpleGrid>
    </VStack>
  );
}

function Banner({ label, bg, fg, value }) {
  return (
    <VStack spacing={1} align="stretch">
      <Text fontSize="xs" opacity={0.6} textTransform="uppercase" letterSpacing="wider">{label}</Text>
      <Box bg={bg} color={fg} px={3} py={2} borderRadius="md" fontWeight="700">
        {value}
      </Box>
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
            🎃 spoopy playground
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
