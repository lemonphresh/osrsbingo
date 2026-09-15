import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Center,
  Divider,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';

import { BSInfoModal } from '../../organisms/battleship/BSInfoModal';
import { BSBattleIntroModal } from '../../organisms/battleship/BSBattleIntroModal';
import { BSPlacementIntroModal } from '../../organisms/battleship/BSPlacementIntroModal';
import BSMultiplierModal from '../../organisms/battleship/BSMultiplierModal';
import BSContentSelectionModal from '../../organisms/battleship/BSContentSelectionModal';
import { SkipProposalModal } from '../../organisms/battleship/BSSkipProposalModal';
import { ProposalModal } from '../../organisms/battleship/BSProposalModal';
import BSDiscordSetupModal from '../../molecules/battleship/BSDiscordSetupModal';
import BSParticipantSetupModal from '../../molecules/battleship/BSParticipantSetupModal';
import { BSGameOverScreen } from '../../organisms/battleship/BSGameOverScreen';
import BSLaunchControl from '../../organisms/battleship/BSLaunchControl';
import BSVolumeControl from '../../molecules/battleship/BSVolumeControl';
import { BSPlacementCountdown } from '../../organisms/battleship/BSFlipClock';
import { SectionLabel, FieldLabel, BoardPanel } from '../../organisms/battleship/BSSharedComponents';

// ─── palette / typography ────────────────────────────────────────────
const BS_PALETTE = {
  navy: { '#071523': 'navy', '#0d2137': 'card', '#1e4976': 'border' },
  cyan: { '#0ea5e9': 'cyan', '#38bdf8': 'cyan hover', '#0284c7': 'cyan active' },
  text: {
    '#94a3b8': 'dim',
    '#cbd5e1': 'body',
    '#e2e8f0': 'bright',
    '#475569': 'gray',
  },
  green: {
    '#4ade80': 'bright hit',
    '#22c55e': 'approve',
    '#14532d': 'border',
    '#060f0a': 'dark bg',
    '#1a4028': 'dark border',
    '#6b9e78': 'label',
    '#d4f0da': 'bright text',
  },
  amber: {
    '#f59e0b': 'amber',
    '#d97706': 'amber deep',
    '#ca8a04': 'yellow amber',
    '#facc15': 'pending dot',
    '#fcd34d': 'hint',
    '#fde68a': 'bright',
  },
  red: {
    '#ef4444': 'red',
    '#f87171': 'red light',
    '#991b1b': 'red bg',
    '#7f1d1d': 'red border',
    '#c0392b': 'hit cell',
  },
  colorblind: { '#c2700a': 'CB hit', '#4a2a05': 'CB sunk' },
};

// ─── mock tiles for grid demos ───────────────────────────────────────
const shipTile = (row, col, shipType, opts = {}) => ({
  row, col, shipType, isShot: false, taskCompleted: false, skipped: false, ...opts,
});

const OCEAN_TILES = [];

const OWN_FLEET_TILES = [
  shipTile(0, 0, 'CARRIER'), shipTile(0, 1, 'CARRIER'), shipTile(0, 2, 'CARRIER'),
  shipTile(0, 3, 'CARRIER'), shipTile(0, 4, 'CARRIER'),
  shipTile(2, 1, 'BATTLESHIP'), shipTile(2, 2, 'BATTLESHIP'),
  shipTile(2, 3, 'BATTLESHIP'), shipTile(2, 4, 'BATTLESHIP'),
  shipTile(4, 6, 'CRUISER'), shipTile(5, 6, 'CRUISER'), shipTile(6, 6, 'CRUISER'),
  shipTile(7, 2, 'SUBMARINE'), shipTile(7, 3, 'SUBMARINE'), shipTile(7, 4, 'SUBMARINE'),
  shipTile(9, 8, 'DESTROYER'), shipTile(9, 9, 'DESTROYER'),
];

const MID_BATTLE_ENEMY = [
  // sunk carrier
  shipTile(0, 0, 'CARRIER', { isShot: true, taskCompleted: true }),
  shipTile(0, 1, 'CARRIER', { isShot: true, taskCompleted: true }),
  shipTile(0, 2, 'CARRIER', { isShot: true, taskCompleted: true }),
  shipTile(0, 3, 'CARRIER', { isShot: true, taskCompleted: true }),
  shipTile(0, 4, 'CARRIER', { isShot: true, taskCompleted: true }),
  // partially hit battleship
  shipTile(2, 1, 'BATTLESHIP', { isShot: true, taskCompleted: true }),
  shipTile(2, 2, 'BATTLESHIP', { isShot: true, taskCompleted: true }),
  shipTile(2, 3, 'BATTLESHIP'),
  shipTile(2, 4, 'BATTLESHIP'),
  // untouched cruiser
  shipTile(4, 6, 'CRUISER'), shipTile(5, 6, 'CRUISER'), shipTile(6, 6, 'CRUISER'),
  // skipped tile with a miss
  { row: 5, col: 2, isShot: true, taskCompleted: false, skipped: true },
  // scattered misses
  { row: 6, col: 0, isShot: true, taskCompleted: true },
  { row: 8, col: 5, isShot: true, taskCompleted: true },
  { row: 3, col: 8, isShot: true, taskCompleted: true },
];

const CELL_STATE_TILES = [
  { row: 0, col: 0 }, // ocean (implicit)
  shipTile(0, 2, 'CRUISER'), // own ship
  { row: 0, col: 4, isShot: true, taskCompleted: true }, // miss
  shipTile(0, 6, 'DESTROYER', { isShot: true, taskCompleted: true }), // hit (not sunk yet)
  shipTile(2, 0, 'DESTROYER', { isShot: true, taskCompleted: true }),
  shipTile(2, 1, 'DESTROYER', { isShot: true, taskCompleted: true }), // sunk (2-cell destroyer)
  { row: 2, col: 3, isShot: true, taskCompleted: false, skipped: true }, // skipped
  shipTile(2, 5, 'DESTROYER', { isShot: true, taskCompleted: false }), // pending confirmation
];

// ─── mock proposals ───────────────────────────────────────────────────
const NOW = Date.now();

const mockPendingProposal = () => ({
  proposalId: 'prop_pending',
  status: 'PENDING',
  approvals: ['discord-1'],
  rejections: [],
  threshold: 3,
  row: 4,
  col: 6,
  tileLabel: 'G5',
  proposedBy: 'discord-1',
  proposedAt: new Date(NOW - 30 * 1000).toISOString(),
  expiresAt: new Date(NOW + 90 * 1000).toISOString(),
});

const mockApprovedProposal = () => ({
  ...mockPendingProposal(),
  proposalId: 'prop_approved',
  status: 'APPROVED',
  approvals: ['discord-1', 'discord-2', 'discord-3'],
});

const mockRejectedProposal = () => ({
  ...mockPendingProposal(),
  proposalId: 'prop_rejected',
  status: 'REJECTED',
  approvals: ['discord-1'],
  rejections: ['discord-2'],
});

const MOCK_TEAM = [
  { discordUserId: 'discord-1', discordUsername: 'admiral_lem' },
  { discordUserId: 'discord-2', discordUsername: 'gunner_pete' },
  { discordUserId: 'discord-3', discordUsername: 'nav_ovis' },
  { discordUserId: 'discord-4', discordUsername: 'bosun_zeke' },
];

// ─── mock game over event ─────────────────────────────────────────────
const MOCK_GAME_OVER_EVENT = {
  eventId: 'mock-game-over',
  eventName: 'Playground Skirmish',
  status: 'COMPLETED',
  endedByAdmin: false,
  winnerId: 'team-alpha',
  placementEndsAt: new Date(NOW - 6 * 60 * 60 * 1000).toISOString(),
  completedAt: new Date(NOW - 60 * 1000).toISOString(),
  refs: [],
  teams: [
    {
      teamId: 'team-alpha',
      teamName: 'Team Alpha',
      board: { boardId: 'board-a', tiles: OWN_FLEET_TILES },
    },
    {
      teamId: 'team-bravo',
      teamName: 'Team Bravo',
      board: { boardId: 'board-b', tiles: MID_BATTLE_ENEMY },
    },
  ],
};

const MOCK_SHOT_LOG = [
  { firingTeamId: 'team-alpha', targetBoardId: 'board-b', row: 0, col: 0, result: 'HIT', shotAt: new Date(NOW - 3000000).toISOString() },
  { firingTeamId: 'team-bravo', targetBoardId: 'board-a', row: 3, col: 3, result: 'MISS', shotAt: new Date(NOW - 2800000).toISOString() },
  { firingTeamId: 'team-alpha', targetBoardId: 'board-b', row: 0, col: 1, result: 'HIT', shotAt: new Date(NOW - 2600000).toISOString() },
  { firingTeamId: 'team-alpha', targetBoardId: 'board-b', row: 0, col: 2, result: 'HIT', shotAt: new Date(NOW - 2400000).toISOString() },
  { firingTeamId: 'team-bravo', targetBoardId: 'board-a', row: 5, col: 5, result: 'MISS', shotAt: new Date(NOW - 2200000).toISOString() },
];

// ─── mock event for launch control ────────────────────────────────────
const MOCK_DRAFT_EVENT = {
  eventId: 'mock-draft-event',
  status: 'DRAFT',
  scheduledPlacementStart: null,
  teams: [
    { teamId: 't-1', teamName: 'Team Alpha', discordChannelId: '123' },
    { teamId: 't-2', teamName: 'Team Bravo', discordChannelId: '456' },
  ],
};

// ─── mock placement countdown event ──────────────────────────────────
const MOCK_PLACEMENT_EVENT_LIVE = {
  placementStartsAt: new Date(NOW - 60 * 60 * 1000).toISOString(),
  placementEndsAt: new Date(NOW + 90 * 60 * 1000).toISOString(),
  placementPhaseHours: 2.5,
};

const MOCK_PLACEMENT_EVENT_CLOSED = {
  placementStartsAt: new Date(NOW - 3 * 60 * 60 * 1000).toISOString(),
  placementEndsAt: new Date(NOW - 30 * 60 * 1000).toISOString(),
  placementPhaseHours: 2.5,
};

// ─── page ─────────────────────────────────────────────────────────────
export default function BattleshipPlaygroundPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return <Shell><Center py={20}><Text color="#94a3b8">Loading...</Text></Center></Shell>;
  }
  if (!isAuthenticated || !user?.admin) {
    return (
      <Shell>
        <Center py={20}>
          <VStack spacing={2}>
            <Text color="#e2e8f0" fontSize="xl">Restricted waters.</Text>
            <Text color="#94a3b8" fontSize="sm">Site admins only.</Text>
          </VStack>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
      <VStack
        spacing={10}
        py={8}
        px={{ base: 4, md: 8 }}
        align="stretch"
        maxW="1200px"
        mx="auto"
        color="#cbd5e1"
      >
        <Intro />
        <SectionDivider />
        <PaletteSection />
        <SectionDivider />
        <TypographySection />
        <SectionDivider />
        <SharedLabelsSection />
        <SectionDivider />
        <GridSection />
        <SectionDivider />
        <BoardPanelSection />
        <SectionDivider />
        <FlipClockSection />
        <SectionDivider />
        <VolumeSection />
        <SectionDivider />
        <ModalsSection user={user} />
        <SectionDivider />
        <GameOverSection />
        <SectionDivider />
        <LaunchControlSection />
      </VStack>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <Box minH="100vh" bg="#071523">
      {children}
    </Box>
  );
}

function SectionDivider() {
  return <Divider borderColor="#1e4976" />;
}

function SectionHeading({ children, note }) {
  return (
    <VStack align="stretch" spacing={1}>
      <Heading size="md" color="#e2e8f0" fontFamily="mono" letterSpacing="wider">
        {children}
      </Heading>
      {note && <Text fontSize="sm" color="#94a3b8">{note}</Text>}
    </VStack>
  );
}

function Intro() {
  return (
    <VStack spacing={2} align="start">
      <Heading color="#38bdf8" fontFamily="mono" letterSpacing="widest">
        ⚓ BATTLESHIP UI PLAYGROUND
      </Heading>
      <Text color="#94a3b8" fontSize="sm" maxW="lg">
        Every Battleship modal, grid, and screen in isolation, on frozen mock data. Safe to click.
        Modals wired to real GraphQL (Discord setup, launch control, content selection) will hit the
        actual server — noted where relevant.
      </Text>
    </VStack>
  );
}

function PaletteSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Recurring hex values across the Battleship module.">Palette</SectionHeading>
      {Object.entries(BS_PALETTE).map(([group, swatches]) => (
        <VStack key={group} align="stretch" spacing={2}>
          <FieldLabel>{group}</FieldLabel>
          <SimpleGrid columns={{ base: 3, md: 6 }} spacing={3}>
            {Object.entries(swatches).map(([hex, name]) => (
              <VStack key={hex} align="stretch" spacing={1}>
                <Box
                  h="60px"
                  bg={hex}
                  borderRadius="md"
                  border="1px solid"
                  borderColor="#1e4976"
                />
                <Text fontSize="xs" fontFamily="mono" color="#cbd5e1">{name}</Text>
                <Text fontSize="xs" fontFamily="mono" color="#94a3b8">{hex}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </VStack>
      ))}
    </VStack>
  );
}

function TypographySection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Chakra defaults + mono for HUD-style labels/headings.">Typography</SectionHeading>
      <VStack align="stretch" spacing={3}>
        <FontRow role="heading (mono)" fontFamily="mono" sample="⚓ BATTLESHIP UI PLAYGROUND" size="2xl" color="#38bdf8" />
        <FontRow role="section label" fontFamily="mono" sample="SECTION LABEL" size="10px" color="#6b9e78" upper />
        <FontRow role="body" fontFamily="body" sample="The fleet with the sharpest gunners wins the day." size="md" color="#cbd5e1" />
        <FontRow role="dim / hint" fontFamily="body" sample="Placement window closes in one hour." size="sm" color="#94a3b8" />
      </VStack>
    </VStack>
  );
}

function FontRow({ role, fontFamily, sample, size, color, upper }) {
  return (
    <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={3} borderRadius="md">
      <Text fontSize="xs" color="#6b9e78" fontFamily="mono" letterSpacing="widest" textTransform="uppercase" mb={1}>
        {role}
      </Text>
      <Text
        fontFamily={fontFamily}
        fontSize={size}
        color={color}
        letterSpacing={upper ? 'widest' : undefined}
        textTransform={upper ? 'uppercase' : undefined}
      >
        {sample}
      </Text>
    </Box>
  );
}

function SharedLabelsSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="From BSSharedComponents — 10px mono uppercase, olive-green.">Shared labels</SectionHeading>
      <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
        <SectionLabel>Section label</SectionLabel>
        <FieldLabel>Field label</FieldLabel>
        <Text color="#cbd5e1" fontSize="sm">
          Both render identically today. Kept as separate exports so callers can convey intent, and so
          spacing can diverge later without a rename.
        </Text>
      </Box>
    </VStack>
  );
}

function GridSection() {
  const [colorblind, setColorblind] = useState(false);
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [radarCell, setRadarCell] = useState(null);

  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Ocean / own-ship / miss / hit / sunk / skipped / pending states. Toggle colorblind mode and click a cell to preview highlight + radar decorations.">
        Grid cells
      </SectionHeading>
      <HStack spacing={3} wrap="wrap">
        <Button size="sm" colorScheme="cyan" variant={colorblind ? 'solid' : 'outline'} onClick={() => setColorblind((v) => !v)}>
          Colorblind: {colorblind ? 'ON' : 'OFF'}
        </Button>
        <Button size="sm" variant="outline" colorScheme="green" onClick={() => setHighlightedCell({ row: 5, col: 5 })}>
          Highlight (5,5)
        </Button>
        <Button size="sm" variant="outline" colorScheme="orange" onClick={() => setRadarCell({ row: 5, col: 5 })}>
          Radar (5,5)
        </Button>
        <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => { setHighlightedCell(null); setRadarCell(null); }}>
          Clear
        </Button>
      </HStack>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <BoardPanel
          title="Cell states (hover for coords)"
          tiles={CELL_STATE_TILES}
          showShips
          colorblindMode={colorblind}
          highlightedCell={highlightedCell}
          radarCell={radarCell}
        />
        <BoardPanel
          title="Enemy board — mid battle (canFire on)"
          tiles={MID_BATTLE_ENEMY}
          canFire
          onCellClick={(row, col) => setHighlightedCell({ row, col })}
          colorblindMode={colorblind}
          highlightedCell={highlightedCell}
          radarCell={radarCell}
        />
      </SimpleGrid>
    </VStack>
  );
}

function BoardPanelSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="BoardPanel from BSSharedComponents wraps BSGrid with a titled card frame.">
        Board panels
      </SectionHeading>
      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
        <BoardPanel title="Your fleet — showShips" tiles={OWN_FLEET_TILES} showShips />
        <BoardPanel title="Empty ocean" tiles={OCEAN_TILES} />
      </SimpleGrid>
    </VStack>
  );
}

function FlipClockSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Countdown until placement ends. Live vs. closed variants.">
        Placement countdown
      </SectionHeading>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
          <FieldLabel>Live — 90 min remaining</FieldLabel>
          <BSPlacementCountdown event={MOCK_PLACEMENT_EVENT_LIVE} />
        </Box>
        <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
          <FieldLabel>Closed</FieldLabel>
          <BSPlacementCountdown event={MOCK_PLACEMENT_EVENT_CLOSED} />
        </Box>
      </SimpleGrid>
    </VStack>
  );
}

function VolumeSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Persists to localStorage. Test sound plays a radar ping.">
        Volume control
      </SectionHeading>
      <HStack spacing={6}>
        <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
          <FieldLabel>size xs (default)</FieldLabel>
          <BSVolumeControl />
        </Box>
        <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
          <FieldLabel>size sm</FieldLabel>
          <BSVolumeControl size="sm" />
        </Box>
      </HStack>
    </VStack>
  );
}

function ModalsSection({ user }) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [battleOpen, setBattleOpen] = useState(false);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [multiplierOpen, setMultiplierOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [discordOpen, setDiscordOpen] = useState(false);
  const [participantOpen, setParticipantOpen] = useState(false);

  const [skipVariant, setSkipVariant] = useState(null); // 'pending' | 'approved' | 'rejected'
  const [proposalVariant, setProposalVariant] = useState(null);

  const skipProposal = useMemo(() => {
    if (skipVariant === 'pending') return mockPendingProposal();
    if (skipVariant === 'approved') return mockApprovedProposal();
    if (skipVariant === 'rejected') return mockRejectedProposal();
    return null;
  }, [skipVariant]);

  const proposal = useMemo(() => {
    if (proposalVariant === 'pending') return mockPendingProposal();
    if (proposalVariant === 'approved') return mockApprovedProposal();
    if (proposalVariant === 'rejected') return mockRejectedProposal();
    return null;
  }, [proposalVariant]);

  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Every Battleship modal. Real-server modals are marked with ⚡.">
        Modals
      </SectionHeading>
      <Wrap spacing={3}>
        <WrapItem><Button colorScheme="cyan" onClick={() => setInfoOpen(true)}>Info modal</Button></WrapItem>
        <WrapItem><Button colorScheme="cyan" variant="outline" onClick={() => setBattleOpen(true)}>Battle intro</Button></WrapItem>
        <WrapItem><Button colorScheme="cyan" variant="outline" onClick={() => setPlacementOpen(true)}>Placement intro</Button></WrapItem>
        <WrapItem><Button colorScheme="purple" variant="outline" onClick={() => setMultiplierOpen(true)}>Difficulty multiplier</Button></WrapItem>
        <WrapItem><Button colorScheme="purple" variant="outline" onClick={() => setContentOpen(true)}>⚡ Content selection</Button></WrapItem>
        <WrapItem><Button colorScheme="purple" variant="outline" onClick={() => setDiscordOpen(true)}>⚡ Discord setup</Button></WrapItem>
        <WrapItem><Button colorScheme="purple" variant="outline" onClick={() => setParticipantOpen(true)}>Participant setup</Button></WrapItem>
      </Wrap>

      <VStack align="stretch" spacing={2} pt={4}>
        <FieldLabel>Skip proposal modal — vote states</FieldLabel>
        <HStack spacing={2} wrap="wrap">
          <Button size="sm" colorScheme="yellow" variant="outline" onClick={() => setSkipVariant('pending')}>Pending</Button>
          <Button size="sm" colorScheme="green" variant="outline" onClick={() => setSkipVariant('approved')}>Approved</Button>
          <Button size="sm" colorScheme="red" variant="outline" onClick={() => setSkipVariant('rejected')}>Rejected</Button>
        </HStack>
      </VStack>

      <VStack align="stretch" spacing={2}>
        <FieldLabel>Shot proposal modal — vote states (no built-in close)</FieldLabel>
        <HStack spacing={2} wrap="wrap">
          <Button size="sm" colorScheme="yellow" variant="outline" onClick={() => setProposalVariant('pending')}>Pending</Button>
          <Button size="sm" colorScheme="green" variant="outline" onClick={() => setProposalVariant('approved')}>Approved</Button>
          <Button size="sm" colorScheme="red" variant="outline" onClick={() => setProposalVariant('rejected')}>Rejected</Button>
          {proposalVariant && (
            <Button size="sm" variant="ghost" colorScheme="gray" onClick={() => setProposalVariant(null)}>
              Close (playground only)
            </Button>
          )}
        </HStack>
      </VStack>

      {/* modals */}
      <BSInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
      <BSBattleIntroModal
        isOpen={battleOpen}
        onClose={() => setBattleOpen(false)}
        eventId="playground"
        cooldownMinutes={10}
      />
      <BSPlacementIntroModal
        isOpen={placementOpen}
        onClose={() => setPlacementOpen(false)}
        eventId="playground"
        placementPhaseHours={2}
      />
      <BSMultiplierModal
        isOpen={multiplierOpen}
        onClose={() => setMultiplierOpen(false)}
        currentMultiplier={1}
        onSave={() => setMultiplierOpen(false)}
      />
      <BSContentSelectionModal
        isOpen={contentOpen}
        onClose={() => setContentOpen(false)}
        currentSelections={{ bosses: [], raids: [], skills: [], minigames: [], clues: [], metricTypes: [] }}
        onSave={() => setContentOpen(false)}
      />
      <BSDiscordSetupModal
        isOpen={discordOpen}
        onClose={() => setDiscordOpen(false)}
        eventId="playground"
      />
      <BSParticipantSetupModal
        isOpen={participantOpen}
        onClose={() => setParticipantOpen(false)}
        user={user}
        eventId="playground"
      />

      {skipProposal && (
        <SkipProposalModal
          proposal={skipProposal}
          currentDiscordId="discord-2"
          teamMembers={MOCK_TEAM}
          onVote={() => {}}
          onSkip={() => setSkipVariant(null)}
          onClose={() => setSkipVariant(null)}
        />
      )}

      {proposal && (
        <ProposalModal
          proposal={proposal}
          opponentTiles={MID_BATTLE_ENEMY}
          currentDiscordId="discord-2"
          teamMembers={MOCK_TEAM}
          onVote={() => {}}
          onFire={() => setProposalVariant(null)}
          proposalHistory={[]}
        />
      )}
    </VStack>
  );
}

function GameOverSection() {
  const [show, setShow] = useState(false);
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="Full end-of-event screen. Auto-plays the campaign song on mount, so it's gated behind a click.">
        Game over screen
      </SectionHeading>
      {!show ? (
        <Button colorScheme="cyan" alignSelf="start" onClick={() => setShow(true)}>
          Show game over screen (plays audio)
        </Button>
      ) : (
        <VStack align="stretch" spacing={3}>
          <Button size="sm" variant="outline" colorScheme="gray" alignSelf="start" onClick={() => setShow(false)}>
            Stop / hide
          </Button>
          <Box border="1px solid" borderColor="#1e4976" borderRadius="md" overflow="hidden">
            <BSGameOverScreen event={MOCK_GAME_OVER_EVENT} shotLog={MOCK_SHOT_LOG} />
          </Box>
        </VStack>
      )}
    </VStack>
  );
}

function LaunchControlSection() {
  return (
    <VStack align="stretch" spacing={4}>
      <SectionHeading note="⚡ Wired to real START_BS_PLACEMENT_PHASE / UPDATE_BS_EVENT mutations. Buttons will call the server against mock IDs and fail — this is just the layout.">
        Launch control (DRAFT event)
      </SectionHeading>
      <Box bg="#0d2137" border="1px solid" borderColor="#1e4976" p={4} borderRadius="md">
        <BSLaunchControl event={MOCK_DRAFT_EVENT} refetch={() => {}} />
      </Box>
    </VStack>
  );
}
