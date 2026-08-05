import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription, gql } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Center,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  SimpleGrid,
  Input,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Tooltip,
  Collapse,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import BSGrid from '../../organisms/battleship/BSGrid';
import {
  GET_BS_SHOT_LOG,
  FIRE_BS,
  ADD_BS_TEAM,
  UPDATE_BS_TEAM_MEMBERS,
  UPDATE_BS_TASK,
  SET_BS_SHIP_TEMPLATE,
  START_BS_PLACEMENT_PHASE,
  START_BS_GAME,
  DELETE_BS_EVENT,
  PLACE_BS_SHIP,
  GET_BS_VIEWER_COUNT,
  JOIN_BS_VIEW,
  LEAVE_BS_VIEW,
  BS_VIEWERS_UPDATED,
  BS_BOARD_UPDATED,
  BS_TILE_UPDATED,
  PROPOSE_BS_SHOT,
  VOTE_ON_BS_PROPOSAL,
  CLEAR_BS_PROPOSAL,
  BS_PROPOSAL_UPDATED,
  CREATE_BS_SUBMISSION,
  ADD_BS_REF,
  REMOVE_BS_REF,
} from '../../graphql/bsOperations';
import DiscordMemberInput from '../../molecules/DiscordMemberInput';
import { useToastContext } from '../../providers/ToastProvider';
import { GET_USER_BY_DISCORD_ID, SEARCH_USERS } from '../../graphql/queries';
import { useAuth } from '../../providers/AuthProvider';
import usePageTitle from '../../hooks/usePageTitle';

const API_BASE = process.env.REACT_APP_SERVER_URL || '';

// Resolves an array of discord user IDs → [{ discordUserId, discordUsername }]
// knownNames: optional { [discordUserId]: username } for IDs we already know
function useDiscordUsernames(ids, knownNames = {}) {
  const [nameMap, setNameMap] = useState(knownNames);

  useEffect(() => {
    setNameMap((prev) => ({ ...knownNames, ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(knownNames)]);

  useEffect(() => {
    const missing = (ids ?? []).filter((id) => id && !nameMap[id]);
    if (!missing.length) return;
    missing.forEach((id) => {
      fetch(`${API_BASE}/discuser/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const name = d?.global_name ?? d?.username ?? null;
          if (name) setNameMap((prev) => ({ ...prev, [id]: name }));
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(ids)]);

  return (ids ?? []).map((id) => ({ discordUserId: id, discordUsername: nameMap[id] ?? id }));
}

// ── Inline query (boards nested via field resolver) ───────────────────────

const GET_BS_EVENT_FULL = gql`
  query GetBSEventFull($eventId: ID!) {
    getBSEvent(eventId: $eventId) {
      eventId
      eventName
      status
      placementPhaseHours
      cooldownMinutes
      adminIds
      refIds
      creatorId
      teams {
        teamId
        teamName
        color
        members
        skipTokens
        lastShotAt
        board {
          boardId
          shipPlacements {
            placementId
            shipType
            orientation
            startRow
            startCol
            updatedAt
          }
          tiles {
            tileId
            row
            col
            shipType
            cellIndex
            taskId
            isShot
            taskCompleted
            skipped
            progress
            shotAt
            taskCompletedAt
            task {
              taskId
              label
              bossOrSkill
              metricType
              metricTarget
              metricLabel
            }
          }
        }
      }
      tasks {
        taskId
        label
        bossOrSkill
        metricType
        metricTarget
        metricUnit
        metricLabel
        validDrops
        womMetric
        description
        isActive
      }
      shipTemplates {
        templateId
        shipType
        cellIndex
        taskId
        task {
          taskId
          label
          bossOrSkill
          metricLabel
          validDrops
          description
          isActive
        }
      }
      refs {
        id
        displayName
        username
      }
    }
  }
`;

// ── Constants ─────────────────────────────────────────────────────────────

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

const STATUS_COLOR = {
  DRAFT: 'gray',
  PLACEMENT: 'yellow',
  ACTIVE: 'teal',
  COMPLETED: 'gray',
  ARCHIVED: 'gray',
};

const STATUS_LABEL = {
  DRAFT: 'Draft',
  PLACEMENT: 'Placement',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const SHIP_CONFIGS = [
  { shipType: 'CARRIER', label: 'CARRIER', cells: 5 },
  { shipType: 'BATTLESHIP', label: 'BATTLESHIP', cells: 4 },
  { shipType: 'CRUISER', label: 'CRUISER', cells: 3 },
  { shipType: 'SUBMARINE', label: 'SUBMARINE', cells: 3 },
  { shipType: 'DESTROYER', label: 'DESTROYER', cells: 2 },
];

const SHIP_SIZES = { CARRIER: 5, BATTLESHIP: 4, CRUISER: 3, SUBMARINE: 3, DESTROYER: 2 };

const SHIP_COLORS = {
  CARRIER: '#a855f7',
  BATTLESHIP: '#ef4444',
  CRUISER: '#22d3ee',
  SUBMARINE: '#f97316',
  DESTROYER: '#84cc16',
};

function getShipCells(shipType, orientation, startRow, startCol) {
  const size = SHIP_SIZES[shipType] ?? 1;
  const cells = [];
  for (let i = 0; i < size; i++) {
    cells.push({
      row: orientation === 'VERTICAL' ? startRow + i : startRow,
      col: orientation === 'HORIZONTAL' ? startCol + i : startCol,
    });
  }
  return cells;
}

function isValidPlacement(
  shipType,
  orientation,
  startRow,
  startCol,
  existing,
  replacingShipType = null
) {
  const cells = getShipCells(shipType, orientation, startRow, startCol);
  if (cells.some((c) => c.row < 0 || c.row > 9 || c.col < 0 || c.col > 9)) return false;
  const occupied = new Set();
  for (const p of existing) {
    if (p.shipType === replacingShipType) continue;
    for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
      occupied.add(`${c.row}-${c.col}`);
    }
  }
  return !cells.some((c) => occupied.has(`${c.row}-${c.col}`));
}

// All 100 cells are ocean tiles — ships replace them at runtime when placed
const DRAFT_OCEAN_CELLS = (() => {
  const cells = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
})();

// ── Helpers ───────────────────────────────────────────────────────────────

function coordLabel(row, col) {
  return `${COL_LABELS[col] ?? '?'}${row + 1}`;
}

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

function cooldownRemaining(lastShotAt, cooldownMinutes) {
  if (!lastShotAt || !cooldownMinutes) return 0;
  const shotTime = new Date(lastShotAt).getTime();
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const remaining = shotTime + cooldownMs - Date.now();
  return Math.max(0, remaining);
}

// ── Dev Admin Panel (non-production only) ────────────────────────────────

function DevAdminPanel({ pendingTask, eventId, proposeShot, proposing }) {
  const { showToast } = useToastContext();
  const [open, setOpen] = useState(false);
  const [fakeUsername, setFakeUsername] = useState('TestUser#1234');
  const [fakeScreenshot, setFakeScreenshot] = useState('https://i.imgur.com/fake.png');
  const [propRow, setPropRow] = useState(0);
  const [propCol, setPropCol] = useState(0);

  const [createSubmission, { loading: submitting }] = useMutation(CREATE_BS_SUBMISSION, {
    onCompleted: () => showToast('Fake submission created!', 'success'),
    onError: (e) => showToast(e.message ?? 'Submission failed', 'error'),
  });

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      zIndex={9999}
      bg="#060f0a"
      border="1px solid"
      borderColor="#facc15"
      borderRadius="md"
      overflow="hidden"
      maxW="320px"
      w="320px"
      boxShadow="0 0 12px rgba(250,204,21,0.2)"
    >
      <HStack
        px={3}
        py={2}
        cursor="pointer"
        justify="space-between"
        onClick={() => setOpen((o) => !o)}
        _hover={{ bg: '#0a1f0a' }}
      >
        <Text
          fontFamily="mono"
          fontSize="11px"
          color="#facc15"
          letterSpacing="widest"
          textTransform="uppercase"
        >
          ⚡ Dev Panel
        </Text>
        <Text fontFamily="mono" fontSize="11px" color="#facc15">
          {open ? '▲' : '▼'}
        </Text>
      </HStack>

      {open && (
        <Box px={3} pb={3}>
          <VStack align="stretch" spacing={3}>
            {/* ── Fake submission for active task ── */}
            <Box>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#6b9e78"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Submit for active task
              </Text>
              {!pendingTask ? (
                <Text fontFamily="mono" fontSize="10px" color="#3d6b4a">
                  No active task right now
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  <Box
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    borderRadius="sm"
                    px={2}
                    py={1}
                  >
                    <Text fontFamily="mono" fontSize="10px" color="#d4f0da">
                      {coordLabel(pendingTask.row, pendingTask.col)} —{' '}
                      {pendingTask.task?.label ?? pendingTask.tileId}
                    </Text>
                  </Box>

                  <Input
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={fakeUsername}
                    onChange={(e) => setFakeUsername(e.target.value)}
                    placeholder="Discord username"
                  />

                  <Input
                    size="xs"
                    fontFamily="mono"
                    bg="#091a10"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    value={fakeScreenshot}
                    onChange={(e) => setFakeScreenshot(e.target.value)}
                    placeholder="Screenshot URL"
                  />

                  <Button
                    size="xs"
                    colorScheme="yellow"
                    variant="outline"
                    fontFamily="mono"
                    isLoading={submitting}
                    onClick={() =>
                      createSubmission({
                        variables: {
                          input: {
                            tileId: pendingTask.tileId,
                            discordUserId: `dev-${Date.now()}`,
                            discordUsername: fakeUsername,
                            screenshotUrl: fakeScreenshot,
                          },
                        },
                      })
                    }
                  >
                    Submit
                  </Button>
                </VStack>
              )}
            </Box>

            <Divider borderColor="#1a4028" />

            {/* ── Fake proposal ── */}
            <Box>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#6b9e78"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Propose shot (as current user)
              </Text>
              <HStack spacing={2}>
                <Select
                  size="xs"
                  fontFamily="mono"
                  bg="#091a10"
                  borderColor="#1a4028"
                  color="#d4f0da"
                  value={propCol}
                  onChange={(e) => setPropCol(Number(e.target.value))}
                >
                  {COL_LABELS.map((lbl, i) => (
                    <option key={lbl} value={i}>
                      {lbl}
                    </option>
                  ))}
                </Select>
                <Select
                  size="xs"
                  fontFamily="mono"
                  bg="#091a10"
                  borderColor="#1a4028"
                  color="#d4f0da"
                  value={propRow}
                  onChange={(e) => setPropRow(Number(e.target.value))}
                >
                  {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={i}>
                      {i + 1}
                    </option>
                  ))}
                </Select>
                <Button
                  size="xs"
                  colorScheme="yellow"
                  variant="outline"
                  fontFamily="mono"
                  isLoading={proposing}
                  onClick={() =>
                    proposeShot({ variables: { eventId, row: propRow, col: propCol } })
                  }
                >
                  Propose
                </Button>
              </HStack>
            </Box>
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// ── Shot Proposal Modal ───────────────────────────────────────────────────

const GRID_SIZE = 10;
const CELL = 24; // px per cell in the mini-board

function ProposalMiniBoard({ opponentTiles, proposedRow, proposedCol }) {
  const tileMap = {};
  for (const t of opponentTiles) tileMap[`${t.row},${t.col}`] = t;

  return (
    <Box
      display="inline-block"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      overflow="hidden"
    >
      {/* Column labels */}
      <HStack spacing={0} pl={`${CELL}px`}>
        {COL_LABELS.map((lbl) => (
          <Box
            key={lbl}
            w={`${CELL}px`}
            h={`${CELL * 0.6}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily="mono" fontSize="8px" color="#3d6b4a">
              {lbl}
            </Text>
          </Box>
        ))}
      </HStack>
      {Array.from({ length: GRID_SIZE }, (_, row) => (
        <HStack key={row} spacing={0}>
          {/* Row label */}
          <Box
            w={`${CELL}px`}
            h={`${CELL}px`}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontFamily="mono" fontSize="8px" color="#3d6b4a">
              {row + 1}
            </Text>
          </Box>
          {Array.from({ length: GRID_SIZE }, (_, col) => {
            const tile = tileMap[`${row},${col}`];
            const isProposed = row === proposedRow && col === proposedCol;
            const isHit = tile?.isShot && tile?.shipType;
            const isMiss = tile?.isShot && !tile?.shipType;
            let bg = '#0a1f11';
            if (isProposed) bg = '#7f1d1d';
            else if (isHit) bg = '#991b1b';
            else if (isMiss) bg = '#1e3a28';
            return (
              <Box
                key={col}
                w={`${CELL}px`}
                h={`${CELL}px`}
                bg={bg}
                border="1px solid"
                borderColor={isProposed ? '#ef4444' : '#0e2418'}
                display="flex"
                alignItems="center"
                justifyContent="center"
                position="relative"
                sx={
                  isProposed
                    ? {
                        '@keyframes proposePulse': {
                          '0%,100%': { boxShadow: '0 0 6px 2px rgba(239,68,68,0.7)' },
                          '50%': { boxShadow: '0 0 12px 4px rgba(239,68,68,0.4)' },
                        },
                        animation: 'proposePulse 1.2s ease-in-out infinite',
                      }
                    : undefined
                }
              >
                {isHit && <Text fontSize="8px">💥</Text>}
                {isMiss && <Box w="4px" h="4px" borderRadius="full" bg="#3d6b4a" />}
                {isProposed && <Text fontSize="8px">🎯</Text>}
              </Box>
            );
          })}
        </HStack>
      ))}
    </Box>
  );
}

function ProposalModal({
  proposal,
  opponentTiles,
  currentDiscordId,
  teamMembers,
  onVote,
  onFire,
  onClose,
  votingLoading,
  firingLoading,
  proposalHistory,
}) {
  if (!proposal || proposal.status === 'CLEARED' || !proposal.proposalId) return null;

  const { status, approvals, rejections, threshold, row, col, proposedBy, proposalId } = proposal;
  const coord = coordLabel(row, col);
  const approvalCount = approvals?.length ?? 0;
  const alreadyApproved = approvals?.includes(currentDiscordId);
  const alreadyRejected = rejections?.includes(currentDiscordId);
  const alreadyVoted = alreadyApproved || alreadyRejected;
  const isProposer = proposedBy === currentDiscordId;

  const proposerName =
    teamMembers?.find((m) => m.discordUserId === proposedBy)?.discordUsername ??
    proposedBy ??
    'Someone';

  const isPending = status === 'PENDING';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        bg="#060f0a"
        border="1px solid"
        borderColor={isApproved ? '#22c55e' : isRejected ? '#ef4444' : '#1a4028'}
        borderRadius="lg"
        mx={3}
      >
        <ModalHeader fontFamily="mono" fontSize="sm" color="#d4f0da" pb={2}>
          <HStack spacing={2}>
            <Box
              w="6px"
              h="6px"
              borderRadius="full"
              bg={isApproved ? '#4ade80' : isRejected ? '#ef4444' : '#facc15'}
              flexShrink={0}
            />
            <Text>
              {isRejected
                ? 'Shot proposal rejected'
                : isApproved
                ? 'Proposal approved — fire when ready'
                : 'Shot proposed'}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="#6b9e78" />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Who proposed */}
            <Box
              bg="#091a10"
              border="1px solid"
              borderColor="#1a4028"
              borderRadius="md"
              px={3}
              py={2}
            >
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                <Text as="span" color="#d4f0da" fontWeight="bold">
                  {isProposer ? 'You propose' : `${proposerName} proposes`}
                </Text>{' '}
                firing at{' '}
                <Text as="span" color="#ef4444" fontWeight="bold" letterSpacing="widest">
                  {coord}
                </Text>
              </Text>
            </Box>

            {/* Mini board */}
            <Center>
              <ProposalMiniBoard
                opponentTiles={opponentTiles}
                proposedRow={row}
                proposedCol={col}
              />
            </Center>

            {/* Vote tally */}
            {!isRejected && (
              <Box>
                <HStack justify="space-between" mb={1}>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color="#6b9e78"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Approvals
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color={isApproved ? '#4ade80' : '#d4f0da'}
                    fontWeight="bold"
                  >
                    {approvalCount}/{threshold}
                  </Text>
                </HStack>
                <Box h="6px" bg="#1a4028" borderRadius="full" overflow="hidden">
                  <Box
                    h="100%"
                    w={`${Math.min(100, (approvalCount / (threshold || 1)) * 100)}%`}
                    bg={isApproved ? '#4ade80' : '#22d3ee'}
                    borderRadius="full"
                    transition="width 0.3s ease"
                  />
                </Box>
                {/* Who approved */}
                {approvals?.length > 0 && (
                  <HStack mt={2} spacing={1} flexWrap="wrap">
                    {approvals.map((id) => {
                      const name =
                        teamMembers?.find((m) => m.discordUserId === id)?.discordUsername ?? id;
                      return (
                        <Badge key={id} colorScheme="green" fontSize="9px">
                          ✓ {name}
                        </Badge>
                      );
                    })}
                  </HStack>
                )}
              </Box>
            )}

            {/* Rejection notice */}
            {isRejected && (
              <Box
                bg="#1c0a0a"
                border="1px solid"
                borderColor="#7f1d1d"
                borderRadius="md"
                px={3}
                py={2}
              >
                <Text fontFamily="mono" fontSize="xs" color="#f87171">
                  {rejections?.[0] && (
                    <>
                      <Text as="span" fontWeight="bold">
                        {teamMembers?.find((m) => m.discordUserId === rejections[0])
                          ?.discordUsername ?? rejections[0]}
                      </Text>{' '}
                      vetoed this shot. Propose a new target.
                    </>
                  )}
                </Text>
              </Box>
            )}

            {/* Actions */}
            {isPending && !alreadyVoted && !isProposer && (
              <HStack spacing={3} justify="center">
                <Tooltip label="Reject this shot" placement="top">
                  <IconButton
                    aria-label="Reject"
                    icon={<Text fontSize="xl">✗</Text>}
                    colorScheme="red"
                    variant="outline"
                    size="lg"
                    borderColor="#7f1d1d"
                    color="#f87171"
                    _hover={{ bg: '#1c0a0a', borderColor: '#ef4444' }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, false)}
                  />
                </Tooltip>
                <Tooltip label="Approve this shot" placement="top">
                  <IconButton
                    aria-label="Approve"
                    icon={<Text fontSize="xl">✓</Text>}
                    colorScheme="green"
                    variant="outline"
                    size="lg"
                    borderColor="#14532d"
                    color="#4ade80"
                    _hover={{ bg: '#052e16', borderColor: '#22c55e' }}
                    isLoading={votingLoading}
                    onClick={() => onVote(proposalId, true)}
                  />
                </Tooltip>
              </HStack>
            )}

            {isPending && alreadyVoted && !alreadyRejected && (
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78" textAlign="center">
                Awaiting {threshold - approvalCount} more approval
                {threshold - approvalCount !== 1 ? 's' : ''}…
              </Text>
            )}

            {isPending && isProposer && !alreadyVoted && (
              <Text fontFamily="mono" fontSize="xs" color="#6b9e78" textAlign="center">
                Your vote is counted. Waiting for {threshold - approvalCount} teammate
                {threshold - approvalCount !== 1 ? 's' : ''} to approve…
              </Text>
            )}

            {/* FIRE button — only appears when approved */}
            {isApproved && (
              <Button
                size="lg"
                bg="#991b1b"
                color="white"
                fontFamily="mono"
                fontWeight="bold"
                fontSize="md"
                letterSpacing="widest"
                textTransform="uppercase"
                _hover={{ bg: '#b91c1c' }}
                _active={{ bg: '#7f1d1d' }}
                isLoading={firingLoading}
                loadingText="Firing..."
                onClick={onFire}
                sx={{
                  '@keyframes firePulse': {
                    '0%,100%': { boxShadow: '0 0 8px 2px rgba(239,68,68,0.6)' },
                    '50%': { boxShadow: '0 0 20px 6px rgba(239,68,68,0.3)' },
                  },
                  animation: 'firePulse 1s ease-in-out infinite',
                }}
              >
                🔴 FIRE
              </Button>
            )}

            {/* Proposal history */}
            {proposalHistory.length > 0 && (
              <Box borderTop="1px solid" borderColor="#1a4028" pt={3}>
                <Text
                  fontFamily="mono"
                  fontSize="9px"
                  color="#3d6b4a"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  mb={2}
                >
                  This session's rejected proposals
                </Text>
                <VStack align="stretch" spacing={1}>
                  {proposalHistory.map((h, i) => (
                    <HStack key={i} spacing={2}>
                      <Text fontFamily="mono" fontSize="9px" color="#3d6b4a">
                        {coordLabel(h.row, h.col)}
                      </Text>
                      <Text fontFamily="mono" fontSize="9px" color="#f87171">
                        vetoed
                      </Text>
                      <Text fontFamily="mono" fontSize="9px" color="#3d6b4a">
                        {h.approvals?.length ?? 0}/{h.threshold} votes
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function formatMetricLabel(metricType, target) {
  const n = Number(target);
  if (!n) return '';
  if (metricType === 'xp') {
    if (n >= 1_000_000) {
      const m = n / 1_000_000;
      return `${Number.isInteger(m) ? m : m.toFixed(1)}m XP`;
    }
    return `${Math.round(n / 1000)}k XP`;
  }
  if (metricType === 'unique') return `${n} unique${n !== 1 ? 's' : ''}`;
  return `${n} kc`;
}

function metricUnitFor(type) {
  if (type === 'xp') return 'xp';
  if (type === 'unique') return 'uniques';
  return 'kc';
}

function formatCooldown(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

// ── Shared sub-components ─────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="10px"
      fontWeight="bold"
      color="#6b9e78"
      letterSpacing="widest"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

function FieldLabel({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="10px"
      fontWeight="bold"
      color="#6b9e78"
      letterSpacing="widest"
      textTransform="uppercase"
      mb={1}
    >
      {children}
    </Text>
  );
}

// ── ACTIVE view sub-components ────────────────────────────────────────────

function TeamStatusCard({ team, cooldownMinutes, isViewing }) {
  const cooldownMs = cooldownRemaining(team.lastShotAt, cooldownMinutes);
  const cooldownLabel = formatCooldown(cooldownMs);
  const accentColor = team.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box
      bg="#091a10"
      border="1px solid"
      borderColor={isViewing ? accentColor : '#1a4028'}
      borderRadius="md"
      p={4}
      position="relative"
    >
      {isViewing && (
        <Box
          position="absolute"
          top={2}
          right={2}
          px={1.5}
          py={0.5}
          bg={accentColor}
          borderRadius="sm"
        >
          <Text
            fontFamily="mono"
            fontSize="9px"
            fontWeight="bold"
            color="#060f0a"
            letterSpacing="wider"
          >
            YOU
          </Text>
        </Box>
      )}

      <HStack spacing={2} mb={2} align="center">
        <Box w="8px" h="8px" borderRadius="full" bg={accentColor} flexShrink={0} />
        <Text
          fontFamily="mono"
          fontSize="sm"
          fontWeight="bold"
          color="#d4f0da"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
      </HStack>

      <VStack align="stretch" spacing={1}>
        <HStack justify="space-between">
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
            Members
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
            {team.members?.length ?? 0}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
            Skip tokens
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
            {team.skipTokens ?? 0}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
            Cooldown
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={cooldownLabel ? 'yellow.400' : 'green.400'}>
            {cooldownLabel ? cooldownLabel : 'Ready'}
          </Text>
        </HStack>
      </VStack>
    </Box>
  );
}

function ShotLogEntry({ shot, teams }) {
  const firingTeam = teams.find((t) => t.teamId === shot.firingTeamId);
  const targetTeam = teams.find((t) => t.board?.boardId === shot.targetBoardId);
  const isHit = shot.result === 'HIT';
  const accentColor = firingTeam?.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box py={2} px={3} bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="sm">
      <HStack justify="space-between" align="center" spacing={3}>
        <HStack spacing={2} flex={1} minW={0}>
          <Box w="6px" h="6px" borderRadius="full" bg={accentColor} flexShrink={0} />
          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" fontWeight="bold" flexShrink={0}>
            {coordLabel(shot.row, shot.col)}
          </Text>
          <Text fontFamily="mono" fontSize="xs" color="#6b9e78" noOfLines={1}>
            {firingTeam?.teamName ?? 'Unknown'}
            {targetTeam && targetTeam.teamId !== firingTeam?.teamId
              ? ` → ${targetTeam.teamName}`
              : ''}
          </Text>
          <Badge
            colorScheme={isHit ? 'red' : 'gray'}
            fontSize="9px"
            textTransform="uppercase"
            letterSpacing="wider"
            flexShrink={0}
          >
            {isHit ? 'Hit' : 'Miss'}
          </Badge>
        </HStack>
        <Text fontFamily="mono" fontSize="10px" color="#6b9e78" flexShrink={0}>
          {timeAgo(shot.shotAt)}
        </Text>
      </HStack>
    </Box>
  );
}

function BoardPanel({ title, tiles, showShips, onCellClick, canFire, highlightedCell, radarCell }) {
  return (
    <Box
      bg="#091a10"
      border="1px solid"
      borderColor="#1a4028"
      borderRadius="md"
      p={[3, 4, 5]}
      display="flex"
      flexDirection="column"
      gap={3}
    >
      <Text
        fontFamily="mono"
        fontSize="xs"
        fontWeight="bold"
        color="#6b9e78"
        letterSpacing="widest"
        textTransform="uppercase"
      >
        {title}
      </Text>
      <Box overflowX="auto">
        <BSGrid
          tiles={tiles}
          showShips={showShips}
          onCellClick={onCellClick}
          canFire={canFire}
          highlightedCell={highlightedCell}
          radarCell={radarCell}
        />
      </Box>
    </Box>
  );
}

// ── DRAFT ADMIN: Tab 1 — Teams ────────────────────────────────────────────

function MemberTag({ discordId, onRemove, isUpdating }) {
  const [resolvedName, setResolvedName] = useState(null);

  const { loading } = useQuery(GET_USER_BY_DISCORD_ID, {
    variables: { discordUserId: discordId },
    fetchPolicy: 'cache-first',
    onCompleted: (data) => {
      if (data?.getUserByDiscordId?.displayName) {
        setResolvedName(data.getUserByDiscordId.displayName);
      } else {
        fetch(`${API_BASE}/discuser/${discordId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d?.username || d?.global_name) setResolvedName(d.global_name ?? d.username);
          })
          .catch(() => {});
      }
    },
  });

  const label = resolvedName ?? (loading ? '…' : `${discordId.slice(0, 8)}…`);

  return (
    <HStack
      key={discordId}
      justify="space-between"
      align="center"
      px={2}
      py={1}
      bg="#091a10"
      borderRadius="sm"
    >
      <Text fontFamily="mono" fontSize="xs" color="#b8d4c0" noOfLines={1}>
        {label}
      </Text>
      <Button
        size="xs"
        variant="ghost"
        color="#3d6b4a"
        fontFamily="mono"
        fontSize="10px"
        px={1}
        minW="auto"
        isLoading={isUpdating}
        _hover={{ color: 'red.400', bg: 'transparent' }}
        onClick={() => onRemove(discordId)}
      >
        ✕
      </Button>
    </HStack>
  );
}

function TeamCard({ team, allTeams, refetch }) {
  const { showToast } = useToastContext();
  const [pendingMemberId, setPendingMemberId] = useState('');

  const [updateMembers, { loading: updatingMembers }] = useMutation(UPDATE_BS_TEAM_MEMBERS, {
    onCompleted: () => {
      showToast('Members updated.', 'success');
      setPendingMemberId('');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update members.', 'error'),
  });

  const members = team.members ?? [];
  const otherTeamMemberMap = new Map(
    allTeams
      .filter((t) => t.teamId !== team.teamId)
      .flatMap((t) => (t.members ?? []).map((id) => [id, t.teamName]))
  );

  const handleAdd = (discordId) => {
    if (!discordId || members.includes(discordId)) return;
    updateMembers({ variables: { teamId: team.teamId, members: [...members, discordId] } });
  };

  const handleRemove = (discordId) => {
    updateMembers({
      variables: { teamId: team.teamId, members: members.filter((m) => m !== discordId) },
    });
  };

  const dotColor = team.color === 'RED' ? 'red.400' : 'cyan.400';

  return (
    <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
      <HStack spacing={2} mb={3} align="center">
        <Box w="8px" h="8px" borderRadius="full" bg={dotColor} flexShrink={0} />
        <Text
          fontFamily="mono"
          fontSize="sm"
          fontWeight="bold"
          color="#d4f0da"
          letterSpacing="wide"
        >
          {team.teamName}
        </Text>
        <Badge
          colorScheme={team.color === 'RED' ? 'red' : 'cyan'}
          fontSize="9px"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {team.color}
        </Badge>
      </HStack>

      <VStack align="stretch" spacing={2}>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#6b9e78"
          letterSpacing="widest"
          textTransform="uppercase"
        >
          Members — {members.length}
        </Text>

        {members.length > 0 && (
          <VStack align="stretch" spacing={1}>
            {members.map((discordId) => (
              <MemberTag
                key={discordId}
                discordId={discordId}
                onRemove={handleRemove}
                isUpdating={updatingMembers}
              />
            ))}
          </VStack>
        )}

        <Box>
          <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wider" mb={1}>
            ADD MEMBER
          </Text>
          <DiscordMemberInput
            value={pendingMemberId}
            onChange={(id) => {
              setPendingMemberId(id);
              if (id) handleAdd(id);
            }}
            onRemove={() => setPendingMemberId('')}
            showRemove={false}
            colorMode="dark"
            conflictTeam={pendingMemberId ? otherTeamMemberMap.get(pendingMemberId) ?? null : null}
            isDuplicateInForm={pendingMemberId ? members.includes(pendingMemberId) : false}
          />
        </Box>
      </VStack>
    </Box>
  );
}

function TeamsTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const teams = event.teams ?? [];
  const canAddTeam = teams.length < 2;
  const takenColors = teams.map((t) => t.color).filter(Boolean);
  const availableColors = ['BLUE', 'RED'].filter((c) => !takenColors.includes(c));

  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState(availableColors[0] ?? 'BLUE');

  useEffect(() => {
    if (availableColors.length > 0 && !availableColors.includes(teamColor)) {
      setTeamColor(availableColors[0]);
    }
  }, [availableColors.join(',')]);

  const [addBSTeam, { loading: addingTeam }] = useMutation(ADD_BS_TEAM, {
    onCompleted: () => {
      showToast('Team enlisted.', 'success');
      setTeamName('');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to add team.', 'error'),
  });

  const handleAddTeam = (e) => {
    e.preventDefault();
    const trimmed = teamName.trim();
    if (!trimmed) return;
    addBSTeam({
      variables: {
        eventId: event.eventId,
        input: { teamName: trimmed, color: teamColor },
      },
    });
  };

  return (
    <VStack align="stretch" spacing={5}>
      {teams.length === 0 ? (
        <Text fontFamily="mono" fontSize="xs" color="#6b9e78" letterSpacing="wide">
          No teams yet. Enlist two teams to begin.
        </Text>
      ) : (
        <VStack align="stretch" spacing={4}>
          {teams.map((team) => (
            <TeamCard key={team.teamId} team={team} allTeams={teams} refetch={refetch} />
          ))}
        </VStack>
      )}

      {canAddTeam && (
        <>
          <Divider borderColor="#1a4028" />
          <Box
            as="form"
            onSubmit={handleAddTeam}
            bg="#060f0a"
            border="1px solid"
            borderColor="#1a4028"
            borderRadius="md"
            p={4}
          >
            <VStack align="stretch" spacing={3}>
              <FieldLabel>Enlist New Team</FieldLabel>
              <HStack spacing={3} align="flex-end" flexWrap="wrap">
                <Box flex={1} minW="160px">
                  <FieldLabel>Team Name</FieldLabel>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Iron Armada"
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="sm"
                    size="sm"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  />
                </Box>
                <Box w="120px">
                  <FieldLabel>Color</FieldLabel>
                  <Select
                    value={teamColor}
                    onChange={(e) => setTeamColor(e.target.value)}
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="sm"
                    size="sm"
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  >
                    {availableColors.map((c) => (
                      <option key={c} value={c} style={{ background: '#091a10' }}>
                        {c.charAt(0) + c.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                </Box>
                <Button
                  type="submit"
                  isLoading={addingTeam}
                  colorScheme="green"
                  variant="outline"
                  borderColor="#1a4028"
                  color="#4ade80"
                  fontFamily="mono"
                  fontSize="10px"
                  letterSpacing="wider"
                  textTransform="uppercase"
                  size="sm"
                  _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
                  flexShrink={0}
                >
                  Enlist
                </Button>
              </HStack>
            </VStack>
          </Box>
        </>
      )}

      {!canAddTeam && (
        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wide">
          Maximum teams reached (2/2).
        </Text>
      )}
    </VStack>
  );
}

// ── DRAFT ADMIN: Tab 2 — Task Grid ────────────────────────────────────────

// sel: null | { type: 'ocean', row, col, task } | { type: 'ship', shipType, cellIndex }
function TaskGridTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const tasks = event.tasks ?? [];
  const shipTemplates = event.shipTemplates ?? [];

  const [sel, setSel] = useState(null);
  const [editBossOrSkill, setEditBossOrSkill] = useState('');
  const [editMetricType, setEditMetricType] = useState('kc');
  const [editMetricTarget, setEditMetricTarget] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  const templateMap = useMemo(() => {
    const m = {};
    for (const t of shipTemplates) m[`${t.shipType}:${t.cellIndex}`] = t;
    return m;
  }, [shipTemplates]);

  const templateTaskIds = useMemo(
    () => new Set(shipTemplates.map((t) => t.taskId)),
    [shipTemplates]
  );
  const oceanTasks = useMemo(
    () => tasks.filter((t) => !templateTaskIds.has(t.taskId)),
    [tasks, templateTaskIds]
  );

  // Shuffled display order — randomised on load and on demand
  const [displayOceanTasks, setDisplayOceanTasks] = useState([]);
  useEffect(() => {
    setDisplayOceanTasks([...oceanTasks].sort(() => Math.random() - 0.5));
  }, [oceanTasks]);

  const handleRandomize = () => {
    setDisplayOceanTasks((prev) => [...prev].sort(() => Math.random() - 0.5));
    setSel(null);
  };

  const oceanCellTaskMap = useMemo(() => {
    const m = {};
    DRAFT_OCEAN_CELLS.forEach((cell, i) => {
      if (displayOceanTasks[i]) m[`${cell.row}-${cell.col}`] = displayOceanTasks[i];
    });
    return m;
  }, [displayOceanTasks]);

  const contentLookup = useMemo(() => {
    const m = new Map();
    for (const t of tasks) {
      const name = t.bossOrSkill ?? t.label;
      if (!m.has(name)) m.set(name, t);
    }
    return m;
  }, [tasks]);

  const bossSkillOptions = useMemo(() => {
    const seen = new Set();
    const opts = [];
    for (const t of tasks) {
      const name = t.bossOrSkill ?? t.label;
      if (!seen.has(name)) {
        seen.add(name);
        opts.push(name);
      }
    }
    return opts.sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const [setBSShipTemplate, { loading: settingTemplate }] = useMutation(SET_BS_SHIP_TEMPLATE, {
    onCompleted: () => {
      showToast('Ship cell updated.', 'success');
      setSel(null);
      setTaskSearch('');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to assign.', 'error'),
  });

  const [updateBSTask, { loading: updatingTask }] = useMutation(UPDATE_BS_TASK, {
    onCompleted: () => {
      showToast('Task updated.', 'success');
      setSel(null);
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to update task.', 'error'),
  });

  const handleOceanClick = (row, col) => {
    if (sel?.type === 'ocean' && sel.row === row && sel.col === col) {
      setSel(null);
      return;
    }
    const task = oceanCellTaskMap[`${row}-${col}`];
    setSel({ type: 'ocean', row, col, task });
    setEditBossOrSkill(task?.bossOrSkill ?? task?.label ?? '');
    setEditMetricType(task?.metricType ?? 'kc');
    setEditMetricTarget(String(task?.metricTarget ?? ''));
  };

  const handleShipClick = (shipType, cellIndex) => {
    if (sel?.type === 'ship' && sel.shipType === shipType && sel.cellIndex === cellIndex) {
      setSel(null);
      return;
    }
    setSel({ type: 'ship', shipType, cellIndex });
    setTaskSearch('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (!taskSearch.trim()) return true;
    const q = taskSearch.trim().toLowerCase();
    return (
      (t.bossOrSkill ?? t.label).toLowerCase().includes(q) ||
      (t.metricLabel ?? '').toLowerCase().includes(q)
    );
  });

  const assignedCount = Object.keys(templateMap).length;
  const isShipSel = sel?.type === 'ship';
  const isOceanSel = sel?.type === 'ocean';

  return (
    <VStack align="stretch" spacing={5}>
      {/* Stats + randomize */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <HStack spacing={5}>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78">
            Ship templates:{' '}
            <Text
              as="span"
              color={assignedCount >= 17 ? 'green.400' : 'yellow.400'}
              fontWeight="bold"
            >
              {assignedCount}/17
            </Text>
          </Text>
          <Text fontFamily="mono" fontSize="10px" color="#6b9e78">
            Ocean tasks:{' '}
            <Text
              as="span"
              color={oceanTasks.length >= 100 ? 'green.400' : 'yellow.400'}
              fontWeight="bold"
            >
              {oceanTasks.length}/100
            </Text>
          </Text>
        </HStack>
        <Button
          size="xs"
          variant="outline"
          colorScheme="green"
          borderColor="#1a4028"
          color="#4ade80"
          fontFamily="mono"
          fontSize="10px"
          letterSpacing="wider"
          textTransform="uppercase"
          _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
          onClick={handleRandomize}
        >
          Randomize Ocean
        </Button>
      </HStack>

      {/* Grid + edit panel side by side */}
      <Box display="flex" gap={6} alignItems="flex-start">
        {/* LEFT: Ocean grid */}
        <Box overflowX="auto" flexShrink={0}>
          <VStack spacing={0} align="flex-start">
            <HStack spacing={0} pl="22px">
              {COL_LABELS.map((lbl) => (
                <Box
                  key={lbl}
                  w="52px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                    {lbl}
                  </Text>
                </Box>
              ))}
            </HStack>
            {Array.from({ length: 10 }, (_, row) => (
              <HStack key={row} spacing={0}>
                <Box w="22px" h="52px" display="flex" alignItems="center" justifyContent="center">
                  <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                    {row + 1}
                  </Text>
                </Box>
                {Array.from({ length: 10 }, (_, col) => {
                  const key = `${row}-${col}`;
                  const task = oceanCellTaskMap[key];
                  const isSelected = isOceanSel && sel.row === row && sel.col === col;
                  return (
                    <Box
                      key={col}
                      w="52px"
                      h="52px"
                      border="1px solid"
                      borderColor={isSelected ? '#22c55e' : '#1a4028'}
                      bg="#060f0a"
                      cursor="pointer"
                      onClick={() => handleOceanClick(row, col)}
                      p="3px"
                      overflow="hidden"
                      boxShadow={isSelected ? '0 0 0 1px #22c55e inset' : 'none'}
                      _hover={{ borderColor: '#4ade80' }}
                      title={`${COL_LABELS[col]}${row + 1}: ${
                        task ? (task.bossOrSkill ?? task.label) + ' — ' + task.metricLabel : 'empty'
                      }`}
                    >
                      {task ? (
                        <VStack spacing={0} align="stretch" h="full" justify="center">
                          <Text
                            fontFamily="mono"
                            fontSize="7px"
                            color="#b8d4c0"
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {task.bossOrSkill ?? task.label}
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="6px"
                            color="#2a6040"
                            noOfLines={1}
                            lineHeight="1.3"
                            mt="1px"
                          >
                            {task.metricLabel}
                          </Text>
                        </VStack>
                      ) : (
                        <Box
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Box w="3px" h="3px" bg="#1e3050" borderRadius="full" />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* RIGHT: Edit panel — only visible when a cell is selected */}
        {sel && (
          <Box flex="1" minW="280px" maxW="400px">
            <Box bg="#060f0a" border="1px solid" borderColor="#22c55e" borderRadius="md" p={4}>
              {/* Ship cell picker */}
              {isShipSel && (
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="center">
                    <Text
                      fontFamily="mono"
                      fontSize="10px"
                      color="#4ade80"
                      letterSpacing="widest"
                      textTransform="uppercase"
                    >
                      {sel.shipType} · Cell {sel.cellIndex}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="#3d6b4a"
                      fontFamily="mono"
                      fontSize="10px"
                      px={1}
                      minW="auto"
                      _hover={{ color: '#d4f0da', bg: 'transparent' }}
                      onClick={() => setSel(null)}
                    >
                      ✕
                    </Button>
                  </HStack>
                  {templateMap[`${sel.shipType}:${sel.cellIndex}`]?.task && (
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da" noOfLines={1}>
                      Current:{' '}
                      {templateMap[`${sel.shipType}:${sel.cellIndex}`].task.bossOrSkill ??
                        templateMap[`${sel.shipType}:${sel.cellIndex}`].task.label}
                      {' · '}
                      <Text as="span" color="#3d6b4a">
                        {templateMap[`${sel.shipType}:${sel.cellIndex}`].task.metricLabel}
                      </Text>
                    </Text>
                  )}
                  <Input
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search tasks..."
                    bg="#091a10"
                    border="1px solid"
                    borderColor="#1a4028"
                    color="#d4f0da"
                    fontFamily="mono"
                    fontSize="xs"
                    size="sm"
                    _placeholder={{ color: '#3d6b4a' }}
                    _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                    _hover={{ borderColor: '#1a5c2e' }}
                  />
                  <VStack align="stretch" spacing={0} maxH="300px" overflowY="auto">
                    {filteredTasks.length === 0 && (
                      <Text fontFamily="mono" fontSize="xs" color="#3d6b4a" px={2} py={1}>
                        No tasks match.
                      </Text>
                    )}
                    {filteredTasks.map((task) => {
                      const isCurrent =
                        templateMap[`${sel.shipType}:${sel.cellIndex}`]?.taskId === task.taskId;
                      return (
                        <Box
                          key={task.taskId}
                          py={2}
                          px={2}
                          cursor={settingTemplate ? 'not-allowed' : 'pointer'}
                          borderRadius="sm"
                          bg={isCurrent ? '#1a3a5c' : 'transparent'}
                          _hover={{ bg: '#091a10' }}
                          opacity={settingTemplate ? 0.5 : 1}
                          onClick={() => {
                            if (settingTemplate) return;
                            setBSShipTemplate({
                              variables: {
                                eventId: event.eventId,
                                shipType: sel.shipType,
                                cellIndex: sel.cellIndex,
                                taskId: task.taskId,
                              },
                            });
                          }}
                        >
                          <Text fontFamily="mono" fontSize="xs" color="#d4f0da" noOfLines={1}>
                            {task.bossOrSkill ?? task.label}
                          </Text>
                          {task.metricLabel && (
                            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" noOfLines={1}>
                              {task.metricLabel}
                            </Text>
                          )}
                        </Box>
                      );
                    })}
                  </VStack>
                </VStack>
              )}

              {/* Ocean cell editor */}
              {isOceanSel && (
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between" align="center">
                    <Text
                      fontFamily="mono"
                      fontSize="10px"
                      color="#4ade80"
                      letterSpacing="widest"
                      textTransform="uppercase"
                    >
                      Ocean · {COL_LABELS[sel.col]}
                      {sel.row + 1}
                    </Text>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="#3d6b4a"
                      fontFamily="mono"
                      fontSize="10px"
                      px={1}
                      minW="auto"
                      _hover={{ color: '#d4f0da', bg: 'transparent' }}
                      onClick={() => setSel(null)}
                    >
                      ✕
                    </Button>
                  </HStack>
                  {sel.task ? (
                    <>
                      <Box>
                        <Text
                          fontFamily="mono"
                          fontSize="10px"
                          color="#3d6b4a"
                          letterSpacing="wider"
                          mb={1}
                        >
                          BOSS / SKILL
                        </Text>
                        <Select
                          value={editBossOrSkill}
                          onChange={(e) => {
                            const name = e.target.value;
                            setEditBossOrSkill(name);
                            const ref = contentLookup.get(name);
                            if (ref) {
                              setEditMetricType(ref.metricType ?? 'kc');
                              setEditMetricTarget(String(ref.metricTarget ?? ''));
                            }
                          }}
                          bg="#091a10"
                          border="1px solid"
                          borderColor="#1a4028"
                          color="#d4f0da"
                          fontFamily="mono"
                          fontSize="xs"
                          size="sm"
                          _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                          _hover={{ borderColor: '#1a5c2e' }}
                        >
                          {bossSkillOptions.map((name) => (
                            <option key={name} value={name} style={{ background: '#091a10' }}>
                              {name}
                            </option>
                          ))}
                        </Select>
                      </Box>
                      <HStack spacing={3} align="flex-end">
                        <Box flex={1}>
                          <Text
                            fontFamily="mono"
                            fontSize="10px"
                            color="#3d6b4a"
                            letterSpacing="wider"
                            mb={1}
                          >
                            METRIC TYPE
                          </Text>
                          <Select
                            value={editMetricType}
                            onChange={(e) => setEditMetricType(e.target.value)}
                            bg="#091a10"
                            border="1px solid"
                            borderColor="#1a4028"
                            color="#d4f0da"
                            fontFamily="mono"
                            fontSize="xs"
                            size="sm"
                            _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                            _hover={{ borderColor: '#1a5c2e' }}
                          >
                            <option value="kc" style={{ background: '#091a10' }}>
                              Boss KC
                            </option>
                            <option value="unique" style={{ background: '#091a10' }}>
                              Uniques
                            </option>
                            <option value="xp" style={{ background: '#091a10' }}>
                              XP
                            </option>
                          </Select>
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontFamily="mono"
                            fontSize="10px"
                            color="#3d6b4a"
                            letterSpacing="wider"
                            mb={1}
                          >
                            TARGET
                          </Text>
                          <NumberInput
                            value={editMetricTarget}
                            onChange={(val) => setEditMetricTarget(val)}
                            min={1}
                            clampValueOnBlur
                          >
                            <NumberInputField
                              bg="#091a10"
                              border="1px solid"
                              borderColor="#1a4028"
                              color="#d4f0da"
                              fontFamily="mono"
                              fontSize="xs"
                              h="32px"
                              px={3}
                              _focus={{ borderColor: '#22c55e', boxShadow: 'none' }}
                              _hover={{ borderColor: '#1a5c2e' }}
                            />
                            <NumberInputStepper borderColor="#1a4028">
                              <NumberIncrementStepper
                                borderColor="#1a4028"
                                color="#6b9e78"
                                _hover={{ bg: '#091a10' }}
                              />
                              <NumberDecrementStepper
                                borderColor="#1a4028"
                                color="#6b9e78"
                                _hover={{ bg: '#091a10' }}
                              />
                            </NumberInputStepper>
                          </NumberInput>
                        </Box>
                      </HStack>
                      {editMetricType === 'unique' &&
                        editBossOrSkill &&
                        contentLookup.get(editBossOrSkill)?.validDrops?.length > 0 && (
                          <Box>
                            <Text
                              fontFamily="mono"
                              fontSize="10px"
                              color="#3d6b4a"
                              letterSpacing="wider"
                              mb={1}
                            >
                              VALID DROPS
                            </Text>
                            <VStack
                              align="stretch"
                              spacing={0}
                              maxH="72px"
                              overflowY="auto"
                              bg="#060f0a"
                              border="1px solid"
                              borderColor="#1a4028"
                              borderRadius="sm"
                              px={2}
                              py={1}
                            >
                              {contentLookup.get(editBossOrSkill).validDrops.map((drop) => (
                                <Text
                                  key={drop}
                                  fontFamily="mono"
                                  fontSize="10px"
                                  color="#6b9e78"
                                  noOfLines={1}
                                >
                                  {drop}
                                </Text>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      <HStack justify="flex-end" spacing={2}>
                        <Button
                          size="xs"
                          variant="ghost"
                          color="#3d6b4a"
                          fontFamily="mono"
                          fontSize="10px"
                          _hover={{ color: '#d4f0da', bg: 'transparent' }}
                          onClick={() => setSel(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="xs"
                          colorScheme="green"
                          variant="outline"
                          borderColor="#1a4028"
                          color="#4ade80"
                          fontFamily="mono"
                          fontSize="10px"
                          letterSpacing="wider"
                          textTransform="uppercase"
                          isLoading={updatingTask}
                          isDisabled={!editBossOrSkill || !Number(editMetricTarget)}
                          onClick={() => {
                            const target = Number(editMetricTarget);
                            const ref = contentLookup.get(editBossOrSkill);
                            updateBSTask({
                              variables: {
                                taskId: sel.task.taskId,
                                input: {
                                  label: editBossOrSkill,
                                  bossOrSkill: editBossOrSkill,
                                  metricType: editMetricType,
                                  metricTarget: target,
                                  metricUnit: metricUnitFor(editMetricType),
                                  metricLabel: formatMetricLabel(editMetricType, target),
                                  validDrops:
                                    editMetricType === 'unique' ? ref?.validDrops ?? [] : [],
                                  womMetric: ref?.womMetric ?? null,
                                },
                              },
                            });
                          }}
                          _hover={{ bg: '#091a10', borderColor: '#4ade80' }}
                        >
                          Save
                        </Button>
                      </HStack>
                    </>
                  ) : (
                    <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
                      No task at this position.
                    </Text>
                  )}
                </VStack>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Ship templates — below the grid */}
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#6b9e78"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={3}
        >
          Ship Templates
        </Text>
        <VStack align="stretch" spacing={4}>
          {SHIP_CONFIGS.map(({ shipType, label, cells }) => (
            <Box key={shipType}>
              <Text
                fontFamily="mono"
                fontSize="9px"
                color="#3d6b4a"
                letterSpacing="widest"
                textTransform="uppercase"
                mb={1}
              >
                {label} · {cells} cells
              </Text>
              <HStack spacing={0}>
                {Array.from({ length: cells }, (_, i) => {
                  const tmpl = templateMap[`${shipType}:${i}`];
                  const isSel = isShipSel && sel.shipType === shipType && sel.cellIndex === i;
                  return (
                    <Box
                      key={i}
                      w="72px"
                      h="56px"
                      bg="#0e1f30"
                      border="1px solid"
                      borderColor={isSel ? '#22c55e' : '#1a5c2e'}
                      borderRight={i < cells - 1 ? 'none' : undefined}
                      cursor="pointer"
                      onClick={() => handleShipClick(shipType, i)}
                      p="4px"
                      overflow="hidden"
                      transition="all 0.1s"
                      boxShadow={isSel ? '0 0 0 1px #22c55e inset' : 'none'}
                      _hover={{ borderColor: '#4ade80' }}
                      title={
                        tmpl?.task
                          ? (tmpl.task.bossOrSkill ?? tmpl.task.label) +
                            ' — ' +
                            tmpl.task.metricLabel
                          : 'unassigned'
                      }
                    >
                      {tmpl?.task ? (
                        <VStack spacing={0} align="stretch">
                          <Text
                            fontFamily="mono"
                            fontSize="7px"
                            color="#b8d4c0"
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {tmpl.task.bossOrSkill ?? tmpl.task.label}
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="6px"
                            color="#2a6040"
                            noOfLines={1}
                            lineHeight="1.3"
                            mt="1px"
                          >
                            {tmpl.task.metricLabel}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontFamily="mono" fontSize="9px" color="#1a5c2e">
                          —
                        </Text>
                      )}
                    </Box>
                  );
                })}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
}

// ── DRAFT ADMIN: Tab 4 — Launch ───────────────────────────────────────────

function LaunchTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const navigate = useNavigate();
  const teams = event.teams ?? [];
  const tasks = event.tasks ?? [];
  const shipTemplates = event.shipTemplates ?? [];

  const teamCount = teams.length;
  const taskCount = tasks.length;
  const templateCount = shipTemplates.length;

  const teamOk = teamCount >= 2;
  const templateOk = templateCount >= 17;
  const taskGreen = taskCount >= 100;

  const [confirmDelete, setConfirmDelete] = useState(false);

  const [startPlacement, { loading: starting }] = useMutation(START_BS_PLACEMENT_PHASE, {
    onCompleted: () => {
      showToast('Placement phase initiated. Teams may now place ships.', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to start placement phase.', 'error'),
  });

  const [deleteBSEvent, { loading: deleting }] = useMutation(DELETE_BS_EVENT, {
    onCompleted: () => {
      showToast('Campaign deleted.', 'success');
      navigate('/battleship');
    },
    onError: (err) => showToast(err.message ?? 'Failed to delete campaign.', 'error'),
  });

  const handleLaunch = () => {
    startPlacement({ variables: { eventId: event.eventId } });
  };

  function CheckRow({ label, ok, warn }) {
    const color = ok ? 'green.400' : warn ? 'yellow.400' : 'red.400';
    const indicator = ok ? '[ OK ]' : warn ? '[ ! ]' : '[  ]';
    return (
      <HStack
        py={2}
        px={3}
        bg="#060f0a"
        border="1px solid"
        borderColor="#1a4028"
        borderRadius="sm"
        spacing={3}
      >
        <Text fontFamily="mono" fontSize="xs" color={color} fontWeight="bold" flexShrink={0}>
          {indicator}
        </Text>
        <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
          {label}
        </Text>
      </HStack>
    );
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Text
        fontFamily="mono"
        fontSize="10px"
        color="#6b9e78"
        letterSpacing="widest"
        textTransform="uppercase"
      >
        Pre-launch Checklist
      </Text>

      <VStack align="stretch" spacing={2}>
        <CheckRow label={`Teams: ${teamCount}/2 enlisted`} ok={teamOk} warn={false} />
        <CheckRow
          label={`Ship templates: ${templateCount}/17 assigned`}
          ok={templateOk}
          warn={templateCount > 0 && !templateOk}
        />
        <CheckRow
          label={`Task pool: ${taskCount} tasks${
            taskGreen ? ' — sufficient' : ' — need 100+ ocean tasks'
          }`}
          ok={taskGreen}
          warn={taskCount > 0 && !taskGreen}
        />
      </VStack>

      <Divider borderColor="#1a4028" />

      <Box>
        <Button
          onClick={handleLaunch}
          isLoading={starting}
          loadingText="Initiating..."
          colorScheme="green"
          w="full"
          fontFamily="mono"
          fontSize="xs"
          fontWeight="bold"
          letterSpacing="widest"
          textTransform="uppercase"
          bg="#22c55e"
          color="#060f0a"
          _hover={{ bg: '#4ade80' }}
          _active={{ bg: '#16a34a' }}
        >
          Start Placement Phase
        </Button>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          mt={2}
          textAlign="center"
          letterSpacing="wide"
        >
          Teams and task edits can be finalized before players join.
        </Text>
      </Box>

      <Divider borderColor="#1a4028" />

      {/* Danger zone */}
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={3}
        >
          Danger Zone
        </Text>
        {!confirmDelete ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
            borderColor="#4c1a1a"
            color="#f87171"
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="wider"
            textTransform="uppercase"
            _hover={{ bg: '#1a0a0a', borderColor: '#f87171' }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete Campaign
          </Button>
        ) : (
          <Box bg="#1a0a0a" border="1px solid" borderColor="#7f1d1d" borderRadius="md" p={3}>
            <Text fontFamily="mono" fontSize="xs" color="#f87171" mb={3}>
              This will permanently delete the campaign, all teams, tasks, and boards. This cannot
              be undone.
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="red"
                fontFamily="mono"
                fontSize="10px"
                letterSpacing="wider"
                textTransform="uppercase"
                isLoading={deleting}
                loadingText="Deleting..."
                onClick={() => deleteBSEvent({ variables: { eventId: event.eventId } })}
              >
                Confirm Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                color="#3d6b4a"
                fontFamily="mono"
                fontSize="10px"
                _hover={{ color: '#d4f0da', bg: 'transparent' }}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </HStack>
          </Box>
        )}
      </Box>
    </VStack>
  );
}

// ── DRAFT ADMIN: Tab 3 — Refs ─────────────────────────────────────────────

function BSRefsTab({ event, refetch }) {
  const { showToast } = useToastContext();
  const [search, setSearch] = useState('');

  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { search },
    skip: search.length < 3,
  });

  const [addRef] = useMutation(ADD_BS_REF, {
    onCompleted: () => {
      refetch();
      setSearch('');
      showToast('Ref added', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to add ref', 'error'),
  });
  const [removeRef] = useMutation(REMOVE_BS_REF, {
    onCompleted: () => {
      refetch();
      showToast('Ref removed', 'success');
    },
    onError: (e) => showToast(e.message ?? 'Failed to remove ref', 'error'),
  });

  const currentRefIds = event.refIds ?? [];
  const results = (searchData?.searchUsers ?? []).filter(
    (u) => !currentRefIds.includes(String(u.id))
  );

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={1}
        >
          Add Refs
        </Text>
        <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" mb={3}>
          Refs can approve submissions and mark tasks complete, but cannot change event settings.
        </Text>
        <Input
          size="sm"
          fontFamily="mono"
          fontSize="xs"
          placeholder="Search by username… (min 3 chars)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          bg="#060f0a"
          borderColor="#1a4028"
          color="#d4f0da"
          _placeholder={{ color: '#3d6b4a' }}
          _focus={{ borderColor: '#4ade80', boxShadow: 'none' }}
          mb={2}
        />
        <VStack align="stretch" spacing={1}>
          {results.map((u) => (
            <HStack
              key={u.id}
              justify="space-between"
              px={3}
              py={2}
              bg="#060f0a"
              border="1px solid"
              borderColor="#1a4028"
              borderRadius="sm"
            >
              <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                {u.displayName ?? u.username}
                {u.rsn && (
                  <Text as="span" color="#6b9e78">
                    {' '}
                    — {u.rsn}
                  </Text>
                )}
              </Text>
              <IconButton
                icon={<Text fontSize="sm">+</Text>}
                size="xs"
                variant="outline"
                colorScheme="green"
                borderColor="#1a4028"
                color="#4ade80"
                _hover={{ bg: '#0a1f0a', borderColor: '#4ade80' }}
                aria-label="Add ref"
                onClick={() => addRef({ variables: { eventId: event.eventId, userId: u.id } })}
              />
            </HStack>
          ))}
          {search.length >= 3 && results.length === 0 && (
            <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
              No users found.
            </Text>
          )}
        </VStack>
      </Box>

      <Box>
        <Text
          fontFamily="mono"
          fontSize="10px"
          color="#3d6b4a"
          letterSpacing="widest"
          textTransform="uppercase"
          mb={2}
        >
          Current Refs ({currentRefIds.length})
        </Text>
        {currentRefIds.length === 0 ? (
          <Text fontFamily="mono" fontSize="xs" color="#3d6b4a">
            No refs added yet.
          </Text>
        ) : (
          <VStack align="stretch" spacing={1}>
            {(event.refs ?? []).map((ref) => (
              <HStack
                key={ref.id}
                justify="space-between"
                px={3}
                py={2}
                bg="#060f0a"
                border="1px solid"
                borderColor="#1a4028"
                borderRadius="sm"
              >
                <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                  {ref.displayName ?? ref.username}
                </Text>
                <IconButton
                  icon={<Text fontSize="sm">✕</Text>}
                  size="xs"
                  variant="ghost"
                  colorScheme="red"
                  color="#f87171"
                  _hover={{ bg: '#1c0a0a' }}
                  aria-label="Remove ref"
                  onClick={() =>
                    removeRef({ variables: { eventId: event.eventId, userId: ref.id } })
                  }
                />
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
}

// ── DRAFT ADMIN: Root component ───────────────────────────────────────────

function BSEventDraftAdmin({ event, refetch }) {
  const DRAFT_TABS = ['Teams', 'Task Grid', 'Refs', 'Launch'];

  return (
    <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md">
      <Tabs variant="unstyled" colorScheme="green">
        <TabList
          bg="#060f0a"
          borderBottom="1px solid"
          borderColor="#1a4028"
          px={4}
          pt={2}
          gap={1}
          borderTopRadius="md"
        >
          {DRAFT_TABS.map((label) => (
            <Tab
              key={label}
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="wider"
              textTransform="uppercase"
              color="#6b9e78"
              pb={2}
              px={3}
              _selected={{
                color: '#4ade80',
                borderBottom: '2px solid',
                borderColor: '#22c55e',
              }}
              _hover={{ color: '#d4f0da' }}
            >
              {label}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          <TabPanel p={5}>
            <TeamsTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <TaskGridTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <BSRefsTab event={event} refetch={refetch} />
          </TabPanel>
          <TabPanel p={5}>
            <LaunchTab event={event} refetch={refetch} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

// ── PLACEMENT: Ship placement UI ─────────────────────────────────────────

function BSPlacementView({ event, currentUser, topBar, refetch }) {
  const { showToast } = useToastContext();
  const teams = event.teams ?? [];

  const isAdmin =
    (event.adminIds ?? []).includes(String(currentUser?.id)) ||
    event.creatorId === String(currentUser?.id);

  const myTeam = teams.find((t) => (t.members ?? []).includes(currentUser?.discordUserId)) ?? null;
  const myBoard = myTeam?.board ?? null;
  const existingPlacements = myBoard?.shipPlacements ?? [];

  const [selectedShip, setSelectedShip] = useState('CARRIER');
  const [orientation, setOrientation] = useState('HORIZONTAL');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredHistoryShip, setHoveredHistoryShip] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const [placeBSShip, { loading: placing }] = useMutation(PLACE_BS_SHIP, {
    onCompleted: () => refetch(),
    onError: (err) => showToast(err.message ?? 'Failed to place ship.', 'error'),
  });

  const [startBSGame, { loading: startingGame }] = useMutation(START_BS_GAME, {
    onCompleted: () => {
      showToast('Battle phase started.', 'success');
      refetch();
    },
    onError: (err) => showToast(err.message ?? 'Failed to start battle phase.', 'error'),
  });

  const [joinBSView] = useMutation(JOIN_BS_VIEW);
  const [leaveBSView] = useMutation(LEAVE_BS_VIEW);

  // Initial viewer count fetch
  useQuery(GET_BS_VIEWER_COUNT, {
    variables: { eventId: event.eventId },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getBSViewerCount != null) setViewerCount(data.getBSViewerCount);
    },
  });

  // Live viewer count subscription
  useSubscription(BS_VIEWERS_UPDATED, {
    variables: { eventId: event.eventId },
    onData: ({ data }) => {
      if (data?.data?.bsViewersUpdated != null) setViewerCount(data.data.bsViewersUpdated);
    },
  });

  // Live board update subscription — refetch when any team places ships
  useSubscription(BS_BOARD_UPDATED, {
    variables: { eventId: event.eventId },
    onData: () => refetch(),
  });

  // Heartbeat join (30s interval) — only team members register
  useEffect(() => {
    joinBSView({ variables: { eventId: event.eventId } });
    const interval = setInterval(
      () => joinBSView({ variables: { eventId: event.eventId } }),
      30_000
    );
    return () => {
      clearInterval(interval);
      leaveBSView({ variables: { eventId: event.eventId } });
    };
  }, [event.eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const placedCellMap = useMemo(() => {
    const m = new Map();
    for (const p of existingPlacements) {
      for (const c of getShipCells(p.shipType, p.orientation, p.startRow, p.startCol)) {
        m.set(`${c.row}-${c.col}`, p.shipType);
      }
    }
    return m;
  }, [existingPlacements]);

  const placedShipTypes = useMemo(
    () => new Set(existingPlacements.map((p) => p.shipType)),
    [existingPlacements]
  );

  const previewCells = useMemo(() => {
    if (!hoveredCell) return new Set();
    const cells = getShipCells(selectedShip, orientation, hoveredCell.row, hoveredCell.col);
    return new Set(cells.map((c) => `${c.row}-${c.col}`));
  }, [hoveredCell, selectedShip, orientation]);

  const previewValid = useMemo(() => {
    if (!hoveredCell) return false;
    return isValidPlacement(
      selectedShip,
      orientation,
      hoveredCell.row,
      hoveredCell.col,
      existingPlacements,
      selectedShip
    );
  }, [hoveredCell, selectedShip, orientation, existingPlacements]);

  useEffect(() => {
    if (!placedShipTypes.has(selectedShip)) return;
    const next = SHIP_CONFIGS.find((s) => !placedShipTypes.has(s.shipType));
    if (next) setSelectedShip(next.shipType);
  }, [placedShipTypes.size]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellClick = (row, col) => {
    if (!myBoard || placing) return;
    if (!isValidPlacement(selectedShip, orientation, row, col, existingPlacements, selectedShip))
      return;
    placeBSShip({
      variables: {
        boardId: myBoard.boardId,
        input: { shipType: selectedShip, orientation, startRow: row, startCol: col },
      },
    });
  };

  const dotColor = myTeam?.color === 'RED' ? '#f87171' : '#60a5fa';

  const viewerBadge =
    viewerCount > 0 ? (
      <HStack spacing={1} align="center">
        <Box w="6px" h="6px" borderRadius="full" bg="green.400" />
        <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" letterSpacing="wide">
          {viewerCount} team member{viewerCount !== 1 ? 's' : ''} viewing
        </Text>
      </HStack>
    ) : null;

  // ── Admin view: no team to place for ───────────────────────────────────
  if (!myTeam) {
    return (
      <Box flex="1" minH="100vh" bg="#060f0a">
        {topBar}
        <Box maxW="700px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
          <VStack align="stretch" spacing={5}>
            <HStack justify="space-between" align="center">
              <Text
                fontFamily="mono"
                fontSize="10px"
                color="#6b9e78"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Placement Phase — Admin View
              </Text>
              {viewerBadge}
            </HStack>
            {teams.map((team) => {
              const board = team.board;
              const placed = (board?.shipPlacements ?? []).length;
              const tc = team.color === 'RED' ? '#f87171' : '#60a5fa';
              return (
                <Box
                  key={team.teamId}
                  bg="#091a10"
                  border="1px solid"
                  borderColor="#1a4028"
                  borderRadius="md"
                  p={4}
                >
                  <HStack justify="space-between" align="center">
                    <HStack spacing={2}>
                      <Box w="8px" h="8px" borderRadius="full" bg={tc} />
                      <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color="#d4f0da">
                        {team.teamName}
                      </Text>
                    </HStack>
                    <Badge
                      colorScheme="yellow"
                      fontSize="9px"
                      letterSpacing="wider"
                      textTransform="uppercase"
                    >
                      {placed}/5 ships placed
                    </Badge>
                  </HStack>
                </Box>
              );
            })}

            <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={4}>
              <Text fontFamily="mono" fontSize="10px" color="#6b9e78" letterSpacing="wide" mb={3}>
                Any teams with missing ships will have their fleet randomly positioned when battle
                begins.
              </Text>
              <Button
                size="sm"
                colorScheme="green"
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
                isLoading={startingGame}
                loadingText="Launching..."
                onClick={() => startBSGame({ variables: { eventId: event.eventId } })}
                bg="#22c55e"
                color="#060f0a"
                _hover={{ bg: '#4ade80' }}
              >
                Start Battle Phase
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>
    );
  }

  // ── Team member view: place ships ───────────────────────────────────────
  return (
    <Box flex="1" minH="100vh" bg="#060f0a">
      {topBar}
      <Box maxW="1100px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
        <HStack spacing={3} mb={5} align="center" justify="space-between">
          <HStack spacing={2}>
            <Box w="8px" h="8px" borderRadius="full" bg={dotColor} />
            <Text
              fontFamily="mono"
              fontSize="xs"
              fontWeight="bold"
              color="#d4f0da"
              letterSpacing="wide"
            >
              {myTeam.teamName}
            </Text>
          </HStack>
          {viewerBadge}
        </HStack>

        <Box display="flex" gap={8} alignItems="flex-start" flexWrap="wrap">
          {/* Grid */}
          <Box flexShrink={0}>
            <VStack spacing={0} align="flex-start">
              <HStack spacing={0} pl="22px">
                {COL_LABELS.map((lbl) => (
                  <Box
                    key={lbl}
                    w="52px"
                    h="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                      {lbl}
                    </Text>
                  </Box>
                ))}
              </HStack>
              {Array.from({ length: 10 }, (_, row) => (
                <HStack key={row} spacing={0}>
                  <Box w="22px" h="52px" display="flex" alignItems="center" justifyContent="center">
                    <Text fontFamily="mono" fontSize="9px" fontWeight="bold" color="#6b9e78">
                      {row + 1}
                    </Text>
                  </Box>
                  {Array.from({ length: 10 }, (_, col) => {
                    const key = `${row}-${col}`;
                    const shipType = placedCellMap.get(key);
                    const inPreview = previewCells.has(key);
                    const isHistoryHighlight =
                      hoveredHistoryShip && shipType === hoveredHistoryShip;
                    const shipColor = shipType ? SHIP_COLORS[shipType] : null;
                    const previewColor = previewValid ? SHIP_COLORS[selectedShip] : '#ef4444';

                    return (
                      <Box
                        key={col}
                        w="52px"
                        h="52px"
                        border="1px solid"
                        borderColor={
                          isHistoryHighlight
                            ? shipColor
                            : inPreview
                            ? previewValid
                              ? previewColor
                              : '#ef4444'
                            : shipType
                            ? `${shipColor}99`
                            : '#1a4028'
                        }
                        bg={
                          isHistoryHighlight
                            ? `${shipColor}55`
                            : inPreview
                            ? `${previewValid ? previewColor : '#ef4444'}22`
                            : shipType
                            ? `${shipColor}22`
                            : '#060f0a'
                        }
                        cursor="crosshair"
                        onClick={() => handleCellClick(row, col)}
                        onMouseEnter={() => !hoveredHistoryShip && setHoveredCell({ row, col })}
                        onMouseLeave={() => setHoveredCell(null)}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="all 0.08s"
                        boxShadow={isHistoryHighlight ? `0 0 6px ${shipColor}66` : undefined}
                      >
                        {shipType && (
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="sm"
                            bg={shipColor}
                            opacity={isHistoryHighlight ? 1 : 0.75}
                          />
                        )}
                      </Box>
                    );
                  })}
                </HStack>
              ))}
            </VStack>
            <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" mt={2} letterSpacing="wide">
              Click to place · hover to preview
            </Text>
          </Box>

          {/* Right panel: ship list + history + controls */}
          <Box flex="1" minW="240px">
            <VStack align="stretch" spacing={5}>
              {/* Explanatory copy */}
              <Box bg="#060f0a" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#6b9e78"
                  letterSpacing="wide"
                  lineHeight="tall"
                >
                  Position your fleet however you like during this phase. Whatever layout you have
                  when the placement window closes is what gets locked in — that's the board your
                  opponents will be firing at when the battle begins.
                </Text>
              </Box>

              {/* Orientation toggle */}
              <Box>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#3d6b4a"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  mb={2}
                >
                  Orientation
                </Text>
                <HStack spacing={2}>
                  {['HORIZONTAL', 'VERTICAL'].map((o) => (
                    <Button
                      key={o}
                      size="xs"
                      variant={orientation === o ? 'solid' : 'outline'}
                      colorScheme="green"
                      borderColor="#1a4028"
                      color={orientation === o ? '#060f0a' : '#4ade80'}
                      fontFamily="mono"
                      fontSize="10px"
                      letterSpacing="wider"
                      textTransform="uppercase"
                      onClick={() => setOrientation(o)}
                      _hover={{ borderColor: '#4ade80' }}
                    >
                      {o === 'HORIZONTAL' ? '— H' : '| V'}
                    </Button>
                  ))}
                </HStack>
              </Box>

              {/* Ship list */}
              <Box>
                <Text
                  fontFamily="mono"
                  fontSize="10px"
                  color="#3d6b4a"
                  letterSpacing="widest"
                  textTransform="uppercase"
                  mb={2}
                >
                  Ships
                </Text>
                <VStack align="stretch" spacing={1}>
                  {SHIP_CONFIGS.map(({ shipType, label, cells }) => {
                    const isPlaced = placedShipTypes.has(shipType);
                    const isSelected = selectedShip === shipType;
                    const color = SHIP_COLORS[shipType];
                    const placement = existingPlacements.find((p) => p.shipType === shipType);
                    return (
                      <Box
                        key={shipType}
                        px={3}
                        py={2}
                        border="1px solid"
                        borderColor={isSelected ? color : '#1a4028'}
                        borderRadius="sm"
                        bg={isSelected ? `${color}18` : '#060f0a'}
                        cursor="pointer"
                        onClick={() => setSelectedShip(shipType)}
                        onMouseEnter={() => isPlaced && setHoveredHistoryShip(shipType)}
                        onMouseLeave={() => setHoveredHistoryShip(null)}
                        _hover={{ borderColor: color }}
                        transition="all 0.1s"
                      >
                        <HStack justify="space-between">
                          <HStack spacing={2}>
                            <Box w="8px" h="8px" borderRadius="sm" bg={color} />
                            <Text
                              fontFamily="mono"
                              fontSize="xs"
                              color={isSelected ? '#d4f0da' : '#6b9e78'}
                              fontWeight={isSelected ? 'bold' : 'normal'}
                            >
                              {label}
                            </Text>
                            <Text fontFamily="mono" fontSize="10px" color="#3d6b4a">
                              {Array(cells).fill('▪').join('')}
                            </Text>
                          </HStack>
                          {isPlaced ? (
                            <Badge colorScheme="green" fontSize="9px" letterSpacing="wider">
                              placed
                            </Badge>
                          ) : null}
                        </HStack>
                        {isPlaced && placement?.updatedAt && (
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color="#3d6b4a"
                            mt={1}
                            letterSpacing="wide"
                          >
                            placed {timeAgo(placement.updatedAt)}
                          </Text>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </Box>

              {isAdmin && (
                <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
                  <Text
                    fontFamily="mono"
                    fontSize="9px"
                    color="#3d6b4a"
                    letterSpacing="wide"
                    mb={2}
                    textTransform="uppercase"
                  >
                    Admin
                  </Text>
                  <Text
                    fontFamily="mono"
                    fontSize="10px"
                    color="#6b9e78"
                    letterSpacing="wide"
                    mb={3}
                  >
                    Any teams with missing ships will be randomly positioned.
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="green"
                    fontFamily="mono"
                    fontSize="10px"
                    letterSpacing="widest"
                    textTransform="uppercase"
                    isLoading={startingGame}
                    loadingText="Launching..."
                    onClick={() => startBSGame({ variables: { eventId: event.eventId } })}
                    bg="#22c55e"
                    color="#060f0a"
                    _hover={{ bg: '#4ade80' }}
                    w="full"
                  >
                    Start Battle Phase
                  </Button>
                </Box>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────

export default function BattleshipEventPage() {
  const { eventId } = useParams();
  const { showToast } = useToastContext();
  const { user: currentUser } = useAuth();

  usePageTitle('Battleship');

  // Dev convenience — track which team index we're viewing as
  const [viewingTeamIndex, setViewingTeamIndex] = useState(0);
  const [highlightedCell, setHighlightedCell] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [proposalHistory, setProposalHistory] = useState([]);

  // ── Queries ─────────────────────────────────────────────────────────────

  const {
    data: eventData,
    loading: eventLoading,
    error: eventError,
    refetch: refetchEvent,
  } = useQuery(GET_BS_EVENT_FULL, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  const { data: shotLogData, refetch: refetchShotLog } = useQuery(GET_BS_SHOT_LOG, {
    variables: { eventId },
    fetchPolicy: 'cache-and-network',
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const [fireBS, { loading: firing }] = useMutation(FIRE_BS, {
    onCompleted: (data) => {
      const shot = data?.fireBS;
      if (shot?.result === 'HIT') {
        showToast('Direct hit! Enemy vessel struck.', 'success');
      } else {
        showToast('Miss. The shot fell wide.', 'info');
      }
      setActiveProposal(null);
      refetchEvent();
      refetchShotLog();
    },
    onError: (err) => {
      showToast(err.message ?? 'Failed to fire. Try again.', 'error');
    },
  });

  const [proposeShot, { loading: proposing }] = useMutation(PROPOSE_BS_SHOT, {
    onCompleted: (data) => {
      const p = data?.proposeBSShot;
      if (p) setActiveProposal(p);
    },
    onError: (err) => showToast(err.message ?? 'Failed to propose shot', 'error'),
  });

  const [voteOnProposal, { loading: votingOnProposal }] = useMutation(VOTE_ON_BS_PROPOSAL, {
    onError: (err) => showToast(err.message ?? 'Failed to vote', 'error'),
  });

  // ── Derived state ────────────────────────────────────────────────────────

  const event = eventData?.getBSEvent;
  const teams = event?.teams ?? [];
  const shotLog = shotLogData?.getBSShotLog ?? [];

  // Guard: need at least 2 teams
  const viewingTeam = teams[viewingTeamIndex] ?? null;
  const opponentTeam = teams.find((_, i) => i !== viewingTeamIndex) ?? null;

  const myBoard = viewingTeam?.board ?? null;
  const opponentBoard = opponentTeam?.board ?? null;

  // Live-update when a ref marks any tile complete on either board
  useSubscription(BS_TILE_UPDATED, {
    variables: { boardId: myBoard?.boardId },
    skip: !myBoard?.boardId || event?.status !== 'ACTIVE',
    onData: () => refetchEvent(),
  });
  useSubscription(BS_TILE_UPDATED, {
    variables: { boardId: opponentBoard?.boardId },
    skip: !opponentBoard?.boardId || event?.status !== 'ACTIVE',
    onData: () => refetchEvent(),
  });

  useSubscription(BS_PROPOSAL_UPDATED, {
    variables: { teamId: viewingTeam?.teamId },
    skip: !viewingTeam?.teamId || event?.status !== 'ACTIVE',
    onData: ({ data }) => {
      const p = data?.data?.bsProposalUpdated;
      if (!p || p.status === 'CLEARED' || !p.proposalId) {
        setActiveProposal(null);
        return;
      }
      if (p.status === 'REJECTED') {
        setProposalHistory((h) => [...h, p]);
        setActiveProposal(null);
        showToast('Shot proposal vetoed. Pick a new target.', 'warning');
        return;
      }
      setActiveProposal(p);
    },
  });

  const myTiles = myBoard?.tiles ?? [];
  const opponentTiles = opponentBoard?.tiles ?? [];

  const cooldownMs = cooldownRemaining(viewingTeam?.lastShotAt, event?.cooldownMinutes);

  // The viewing team's active task: the last tile THEY fired at (on the opponent's board)
  // that hasn't been marked complete yet. Blocks firing until done.
  const pendingTask =
    [...opponentTiles]
      .filter((t) => t.isShot && !t.taskCompleted && !t.skipped)
      .sort((a, b) => new Date(b.shotAt ?? 0) - new Date(a.shotAt ?? 0))[0] ?? null;

  // Radar pulse on the opponent's board at the active task tile
  const opponentPendingTile = pendingTask ?? null;

  const hasPendingProposal = !!(
    activeProposal?.proposalId &&
    (activeProposal?.status === 'PENDING' || activeProposal?.status === 'APPROVED')
  );
  const canFire =
    event?.status === 'ACTIVE' && cooldownMs <= 0 && !firing && !pendingTask && !hasPendingProposal;

  const isAdmin = !!(
    event &&
    currentUser &&
    (event.creatorId === String(currentUser.id) ||
      (event.adminIds ?? []).includes(String(currentUser.id)))
  );
  const isAdminOrRef =
    isAdmin || !!(event && currentUser && (event.refIds ?? []).includes(String(currentUser.id)));

  const resolvedTeamMembers = useDiscordUsernames(
    viewingTeam?.members ?? [],
    currentUser?.discordUserId
      ? { [currentUser.discordUserId]: currentUser.discordUsername ?? currentUser.displayName }
      : {}
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleFireCell = useCallback(
    (row, col) => {
      if (!canFire || !opponentTeam) return;
      proposeShot({ variables: { eventId, row, col } });
    },
    [canFire, opponentTeam, eventId, proposeShot]
  );

  const handleSwitchPov = () => {
    setViewingTeamIndex((prev) => (teams.length > 1 ? (prev + 1) % teams.length : prev));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (eventLoading) {
    return (
      <Center flex="1" minH="60vh" bg="#060f0a">
        <Spinner size="xl" color="green.500" thickness="3px" speed="0.8s" emptyColor="#1a4028" />
      </Center>
    );
  }

  if (eventError || !event) {
    return (
      <Center flex="1" minH="60vh" bg="#060f0a">
        <VStack spacing={3} align="center">
          <Text
            fontFamily="mono"
            fontSize="sm"
            color="red.400"
            letterSpacing="wide"
            textAlign="center"
          >
            FAILED TO LOAD EVENT
          </Text>
          <RouterLink to="/battleship">
            <Button
              size="sm"
              colorScheme="green"
              variant="ghost"
              fontFamily="mono"
              fontSize="xs"
              leftIcon={<ArrowBackIcon />}
            >
              Back to Campaigns
            </Button>
          </RouterLink>
        </VStack>
      </Center>
    );
  }

  const cooldownLabel = formatCooldown(cooldownMs);

  // ── Top bar (shared across all statuses) ─────────────────────────────────

  const topBar = (
    <Box
      bg="#091a10"
      borderBottom="1px solid"
      borderColor="#1a4028"
      px={[4, 6, 8]}
      py={3}
      position="sticky"
      top={0}
      zIndex={2}
    >
      <HStack
        justify="space-between"
        align="center"
        maxW="1400px"
        mx="auto"
        flexWrap="wrap"
        gap={2}
      >
        <HStack spacing={3} align="center" flexWrap="wrap" gap={2}>
          <RouterLink to="/battleship">
            <Button
              size="xs"
              variant="ghost"
              color="#6b9e78"
              leftIcon={<ArrowBackIcon />}
              fontFamily="mono"
              fontSize="xs"
              _hover={{ color: '#d4f0da', bg: 'transparent' }}
            >
              Campaigns
            </Button>
          </RouterLink>
          <Box w="1px" h="16px" bg="#1a4028" />
          <Text
            fontFamily="mono"
            fontSize="sm"
            fontWeight="bold"
            color="#d4f0da"
            letterSpacing="wide"
          >
            {event.eventName}
          </Text>
          <Badge
            colorScheme={STATUS_COLOR[event.status] ?? 'gray'}
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            {STATUS_LABEL[event.status] ?? event.status}
          </Badge>
          {event.status === 'PLACEMENT' && (
            <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
              Placement phase — {event.placementPhaseHours}h window
            </Text>
          )}
        </HStack>

        <HStack spacing={2}>
          {cooldownLabel && (
            <Text fontFamily="mono" fontSize="xs" color="yellow.400" letterSpacing="wide">
              Cooldown: {cooldownLabel}
            </Text>
          )}
          {!cooldownLabel && event.status === 'ACTIVE' && (
            <Text fontFamily="mono" fontSize="xs" color="green.400" letterSpacing="wide">
              Ready to fire
            </Text>
          )}
          {teams.length > 1 && event.status === 'ACTIVE' && isAdmin && (
            <Button
              size="xs"
              variant="outline"
              colorScheme="green"
              borderColor="#1a4028"
              color="#6b9e78"
              fontFamily="mono"
              fontSize="10px"
              letterSpacing="wider"
              onClick={handleSwitchPov}
              _hover={{ borderColor: '#4ade80', color: '#4ade80' }}
            >
              Switch POV
            </Button>
          )}
          {isAdminOrRef && (
            <RouterLink to={`/battleship/${eventId}/refs`}>
              <Button
                size="xs"
                variant="outline"
                borderColor="#1a4028"
                color="#6b9e78"
                fontFamily="mono"
                fontSize="10px"
                letterSpacing="wider"
                _hover={{ borderColor: '#4ade80', color: '#4ade80' }}
              >
                Refs ⚓
              </Button>
            </RouterLink>
          )}
        </HStack>
      </HStack>
    </Box>
  );

  // ── Status: DRAFT ─────────────────────────────────────────────────────────

  if (event.status === 'DRAFT') {
    return (
      <Box flex="1" minH="100vh" bg="#060f0a">
        {topBar}
        <Box maxW="1300px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
          <VStack align="stretch" spacing={6}>
            <VStack align="flex-start" spacing={1}>
              <Text
                fontFamily="mono"
                fontSize="10px"
                color="#6b9e78"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Admin — Campaign Setup
              </Text>
              <Text
                fontFamily="mono"
                fontSize="lg"
                fontWeight="bold"
                color="#d4f0da"
                letterSpacing="wide"
              >
                {event.eventName}
              </Text>
            </VStack>
            <BSEventDraftAdmin event={event} refetch={refetchEvent} />
          </VStack>
        </Box>
      </Box>
    );
  }

  // ── Status: PLACEMENT ─────────────────────────────────────────────────────

  if (event.status === 'PLACEMENT') {
    return (
      <BSPlacementView
        event={event}
        currentUser={currentUser}
        topBar={topBar}
        refetch={refetchEvent}
      />
    );
  }

  // ── Status: COMPLETED / ARCHIVED ─────────────────────────────────────────

  if (event.status === 'COMPLETED' || event.status === 'ARCHIVED') {
    return (
      <Box flex="1" minH="100vh" bg="#060f0a">
        {topBar}
        <Center minH="50vh">
          <Text
            fontFamily="mono"
            fontSize="sm"
            color="#6b9e78"
            letterSpacing="widest"
            textTransform="uppercase"
          >
            Event concluded.
          </Text>
        </Center>
      </Box>
    );
  }

  // ── Status: ACTIVE (existing view) ────────────────────────────────────────

  return (
    <Box flex="1" minH="100vh" bg="#060f0a">
      {topBar}

      <Box maxW="1400px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
        <SimpleGrid columns={{ base: 1, xl: 4 }} spacing={6}>
          {/* Main game area (3/4 width on xl) */}
          <Box gridColumn={{ xl: 'span 3' }}>
            <VStack align="stretch" spacing={6}>
              {/* Boards */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                {/* Your board */}
                <BoardPanel
                  title={`Your Waters — ${viewingTeam?.teamName ?? 'Team'}`}
                  tiles={myTiles}
                  showShips
                  canFire={false}
                />

                {/* Opponent board */}
                <BoardPanel
                  title={`Enemy Waters — ${opponentTeam?.teamName ?? 'Opponent'}`}
                  tiles={opponentTiles}
                  showShips={false}
                  onCellClick={event.status === 'ACTIVE' ? handleFireCell : undefined}
                  canFire={canFire}
                  highlightedCell={highlightedCell}
                  radarCell={opponentPendingTile}
                />
              </SimpleGrid>

              {/* Active task reveal */}
              {pendingTask &&
                (() => {
                  const task = pendingTask.task;
                  const isShipTask = !!pendingTask.shipType;
                  const progress = pendingTask.progress ?? 0;
                  const hasMetric = task?.metricType === 'kc' || task?.metricType === 'xp';
                  const copyCmd = (cmd) => {
                    navigator.clipboard.writeText(cmd).catch(() => {});
                    showToast('Command copied — attach your screenshot in Discord.', 'success');
                  };
                  return (
                    <Box
                      bg="#060f0a"
                      border="1px solid"
                      borderColor="#22c55e"
                      borderRadius="md"
                      px={4}
                      py={3}
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Box w="6px" h="6px" borderRadius="full" bg="#4ade80" />
                          <Text
                            fontFamily="mono"
                            fontSize="10px"
                            color="#4ade80"
                            letterSpacing="widest"
                            textTransform="uppercase"
                          >
                            Task Revealed — {coordLabel(pendingTask.row, pendingTask.col)}
                          </Text>
                        </HStack>
                        <Badge
                          colorScheme={isShipTask ? 'red' : 'gray'}
                          fontSize="9px"
                          textTransform="uppercase"
                          letterSpacing="wider"
                        >
                          {isShipTask ? 'Ship Hit' : 'Ocean Miss'}
                        </Badge>
                      </HStack>
                      <Text
                        fontFamily="mono"
                        fontSize="sm"
                        color="#d4f0da"
                        fontWeight="bold"
                        mb={1}
                      >
                        {task?.bossOrSkill ?? task?.label ?? 'Unknown task'}
                      </Text>
                      {task?.metricLabel && (
                        <Text fontFamily="mono" fontSize="xs" color="#6b9e78" mb={2}>
                          {task.metricLabel}
                        </Text>
                      )}
                      {/* Progress bar — updated live by refs */}
                      <Box mb={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color="#3d6b4a"
                            letterSpacing="wider"
                            textTransform="uppercase"
                          >
                            Progress
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color={progress >= 100 ? '#4ade80' : '#6b9e78'}
                          >
                            {progress}%
                          </Text>
                        </HStack>
                        <Box h="4px" bg="#1a4028" borderRadius="full" overflow="hidden">
                          <Box
                            h="100%"
                            w={`${progress}%`}
                            bg={progress >= 100 ? '#4ade80' : '#22d3ee'}
                            borderRadius="full"
                            transition="width 0.4s ease"
                          />
                        </Box>
                      </Box>
                      {/* Discord submission commands */}
                      <Box borderTop="1px solid" borderColor="#1a4028" pt={3} mb={2}>
                        {hasMetric && (
                          <Box mb={3}>
                            <Text
                              fontFamily="mono"
                              fontSize="9px"
                              color="#22d3ee"
                              letterSpacing="wider"
                              textTransform="uppercase"
                              mb={1}
                            >
                              📸 Step 1 — Pre-screenshot your current state:
                            </Text>
                            <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" mb={2}>
                              Run this before you start so refs can verify your progress gain.
                            </Text>
                            <HStack spacing={2}>
                              <Box
                                flex={1}
                                bg="#091a10"
                                border="1px solid"
                                borderColor="#1a4028"
                                borderRadius="md"
                                px={2}
                                py={1}
                                fontFamily="mono"
                                fontSize="11px"
                                color="#22d3ee"
                              >
                                !bspre
                              </Box>
                              <Button
                                size="xs"
                                colorScheme="cyan"
                                variant="outline"
                                fontFamily="mono"
                                fontSize="9px"
                                onClick={() => copyCmd('!bspre')}
                              >
                                Copy
                              </Button>
                            </HStack>
                          </Box>
                        )}
                        <Text
                          fontFamily="mono"
                          fontSize="9px"
                          color="#4ade80"
                          letterSpacing="wider"
                          textTransform="uppercase"
                          mb={1}
                        >
                          {hasMetric
                            ? '🏆 Step 2 — Submit when done:'
                            : '🏆 Submit via Discord when done:'}
                        </Text>
                        <Text fontFamily="mono" fontSize="9px" color="#3d6b4a" mb={2}>
                          Attach your completion screenshot when running the command.
                        </Text>
                        <HStack spacing={2}>
                          <Box
                            flex={1}
                            bg="#091a10"
                            border="1px solid"
                            borderColor="#1a4028"
                            borderRadius="md"
                            px={2}
                            py={1}
                            fontFamily="mono"
                            fontSize="11px"
                            color="#4ade80"
                          >
                            !bssubmit
                          </Box>
                          <Button
                            size="xs"
                            colorScheme="green"
                            variant="outline"
                            fontFamily="mono"
                            fontSize="9px"
                            onClick={() => copyCmd('!bssubmit')}
                          >
                            Copy
                          </Button>
                        </HStack>
                      </Box>
                      <Text fontFamily="mono" fontSize="10px" color="#3d6b4a" letterSpacing="wide">
                        {isShipTask
                          ? 'Opponents must complete this — refs will mark it done.'
                          : 'Your team must complete this — refs will mark it done.'}
                      </Text>
                    </Box>
                  );
                })()}

              {!pendingTask && event.status === 'ACTIVE' && !canFire && cooldownLabel && (
                <Box
                  bg="#091a10"
                  border="1px solid"
                  borderColor="#1a4028"
                  borderRadius="md"
                  px={4}
                  py={2}
                >
                  <Text fontFamily="mono" fontSize="xs" color="yellow.400" letterSpacing="wide">
                    WEAPONS COOLING DOWN — {cooldownLabel} remaining before next salvo
                  </Text>
                </Box>
              )}

              {/* Battle log */}
              <Box
                bg="#091a10"
                border="1px solid"
                borderColor="#1a4028"
                borderRadius="md"
                overflow="hidden"
              >
                <Box bg="#060f0a" borderBottom="1px solid" borderColor="#1a4028" px={4} py={2}>
                  <Text
                    fontFamily="mono"
                    fontSize="xs"
                    color="#6b9e78"
                    letterSpacing="widest"
                    textTransform="uppercase"
                  >
                    Battle Log
                  </Text>
                </Box>
                <Box p={4}>
                  {shotLog.length === 0 ? (
                    <Text fontFamily="mono" fontSize="xs" color="#6b9e78" letterSpacing="wide">
                      No shots fired yet. The seas are still.
                    </Text>
                  ) : (
                    <VStack align="stretch" spacing={1.5} maxH="320px" overflowY="auto">
                      {[...shotLog]
                        .sort((a, b) => new Date(b.shotAt) - new Date(a.shotAt))
                        .map((shot) => (
                          <ShotLogEntry key={shot.shotId} shot={shot} teams={teams} />
                        ))}
                    </VStack>
                  )}
                </Box>
              </Box>
            </VStack>
          </Box>

          {/* Right sidebar — team status */}
          <Box>
            <VStack align="stretch" spacing={4}>
              <SectionLabel>Fleet Status</SectionLabel>
              {teams.map((team, i) => (
                <TeamStatusCard
                  key={team.teamId}
                  team={team}
                  cooldownMinutes={event.cooldownMinutes}
                  isViewing={i === viewingTeamIndex}
                />
              ))}

              <Divider borderColor="#1a4028" />

              <Box bg="#091a10" border="1px solid" borderColor="#1a4028" borderRadius="md" p={3}>
                <SectionLabel>Event Info</SectionLabel>
                <VStack align="stretch" spacing={1}>
                  <HStack justify="space-between">
                    <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                      Cooldown
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                      {event.cooldownMinutes ?? 0}m
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                      Placement hours
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                      {event.placementPhaseHours ?? '—'}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                      Teams
                    </Text>
                    <Text fontFamily="mono" fontSize="xs" color="#d4f0da">
                      {teams.length}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </Box>
        </SimpleGrid>
      </Box>

      {activeProposal && (
        <ProposalModal
          proposal={activeProposal}
          opponentTiles={opponentTiles}
          currentDiscordId={currentUser?.discordUserId}
          teamMembers={resolvedTeamMembers}
          votingLoading={votingOnProposal}
          firingLoading={firing || proposing}
          proposalHistory={proposalHistory}
          onVote={(proposalId, approve) => {
            voteOnProposal({ variables: { proposalId, approve } });
          }}
          onFire={() => {
            if (!activeProposal || !opponentTeam) return;
            fireBS({
              variables: {
                eventId,
                targetTeamId: opponentTeam.teamId,
                row: activeProposal.row,
                col: activeProposal.col,
              },
            });
          }}
          onClose={() => setActiveProposal(null)}
        />
      )}

      {process.env.NODE_ENV !== 'production' && event?.status === 'ACTIVE' && (
        <DevAdminPanel
          pendingTask={pendingTask}
          eventId={eventId}
          proposeShot={proposeShot}
          proposing={proposing}
        />
      )}
    </Box>
  );
}
