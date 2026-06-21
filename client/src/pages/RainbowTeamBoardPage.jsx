import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useQuery, useSubscription, useMutation, useApolloClient } from '@apollo/client';
import { useAuth } from '../providers/AuthProvider';
import { useCompletionSound } from '../hooks/useCompletionSound';
import { useRainbowCelebration } from '../hooks/useRainbowCelebration';
import { useRainbowCursorTrail } from '../hooks/useRainbowCursorTrail';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  Progress,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Checkbox,
  useClipboard,
  useToast,
  Button,
  Divider,
  Code,
} from '@chakra-ui/react';
import {
  GET_RAINBOW_TEAM_BY_TOKEN,
  GET_RAINBOW_TEAM_BOARD,
  RAINBOW_TEAM_BOARD_UPDATED,
  RAINBOW_SUBMISSION_REVIEWED,
  GET_RAINBOW_TILE_SUBMISSIONS,
  TEST_RAINBOW_NOTIFICATION,
  GET_ACTIVE_RAINBOW_EVENT,
  START_TEAM_WOM_SYNC,
  RESET_TEAM_WOM_COOLDOWN,
  GET_RAINBOW_SYNC_IN_PROGRESS,
  RAINBOW_SYNC_STATUS_CHANGED,
} from '../graphql/rainbowBingoOperations';
import {
  BOARD_LAYOUT,
  EDGES,
  CELL_PX,
  TILE_SIZE,
  BOARD_W,
  BOARD_H,
  tileStyle,
  tileCenterPx,
  COLOR_BG,
  COLOR_TEXT,
} from '../utils/rainbowBoard';
import dollyGnome from '../assets/dolly_gnomechild.png';
import gladfiuMp4 from '../assets/gladfiu.mp4';
import yassifiedGnome from '../assets/yassifiedgnomechild.png';
import { FaHeart, FaFire, FaSun, FaLeaf, FaDroplet, FaMoon, FaBolt } from 'react-icons/fa6';

const dragGifCtx = require.context('../assets/drag', false, /\.gif$/);
const DRAG_GIFS = dragGifCtx.keys().map((k) => dragGifCtx(k));

const COLOR_ICON = {
  red: FaHeart,
  orange: FaFire,
  yellow: FaSun,
  green: FaLeaf,
  blue: FaDroplet,
  indigo: FaMoon,
  violet: FaBolt,
};

const COLOR_LABEL = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  indigo: 'Indigo',
  violet: 'Violet',
  capstone: 'Capstone',
};
const COLOR_BADGE = {
  red: 'red',
  orange: 'orange',
  yellow: 'yellow',
  green: 'green',
  blue: 'blue',
  indigo: 'purple',
  violet: 'pink',
  capstone: 'gray',
};

function BoardEdges({ boardMap, showLocked }) {
  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: BOARD_W,
        height: BOARD_H,
        pointerEvents: 'none',
      }}
    >
      {EDGES.map(([from, to]) => {
        const fromPos = BOARD_LAYOUT[from];
        const toPos = BOARD_LAYOUT[to];
        if (!fromPos || !toPos) return null;
        const fromStatus = from === 'START' ? 'COMPLETE' : boardMap[from]?.status;
        const toStatus = boardMap[to]?.status;
        if (!showLocked && toStatus === 'LOCKED') return null;
        const active = fromStatus === 'COMPLETE' && toStatus && toStatus !== 'LOCKED';
        const a = tileCenterPx(fromPos);
        const b = tileCenterPx(toPos);
        return (
          <line
            key={`${from}-${to}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#ffffff"
            strokeOpacity={active ? 0.45 : 0.12}
            strokeWidth={active ? 2 : 1}
            strokeDasharray={active ? undefined : '4 4'}
          >
            {active && (
              <animate
                attributeName="stroke-opacity"
                values="0.2;0.65;0.2"
                dur="2.5s"
                repeatCount="indefinite"
              />
            )}
          </line>
        );
      })}
    </svg>
  );
}

const RING_PAD = 8;
const OVERLAY_SIZE = TILE_SIZE + RING_PAD * 2;
const OC = OVERLAY_SIZE / 2; // overlay center

function TileOverlay({ col, row, progress, status, hasSubmissions }) {
  const showRing = progress > 0;
  const showDot = hasSubmissions || status === 'COMPLETE';
  if (!showRing && !showDot) return null;

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const filled = circumference * (Math.min(progress, 100) / 100);

  // Dot at ~135° clockwise from top (bottom-right perimeter)
  const dotAngle = (315 * Math.PI) / 180;
  const dotR = r - 3;
  const dotX = OC + dotR * Math.sin(dotAngle);
  const dotY = OC - dotR * Math.cos(dotAngle);

  return (
    <svg
      style={{
        position: 'absolute',
        left: col * CELL_PX - RING_PAD,
        top: row * CELL_PX - RING_PAD,
        width: OVERLAY_SIZE,
        height: OVERLAY_SIZE,
        pointerEvents: 'none',
        zIndex: 5,
        overflow: 'visible',
      }}
    >
      {showRing && (
        <g transform={`rotate(-90, ${OC}, ${OC})`}>
          <circle cx={OC} cy={OC} r={r} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth={5} />
          <circle
            cx={OC}
            cy={OC}
            r={r}
            fill="none"
            stroke={progress >= 100 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'}
            strokeWidth={5}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
          />
        </g>
      )}
      {showDot && status === 'SUBMITTED' && (
        <>
          <circle cx={dotX} cy={dotY} r={6} fill="rgba(0,0,0,0.5)" />
          <circle cx={dotX} cy={dotY} r={5} fill="#ED8936" />
        </>
      )}
      {showDot && status === 'COMPLETE' && (
        <>
          <circle cx={dotX} cy={dotY} r={10} fill="rgba(0,0,0,0.65)" />
          <circle cx={dotX} cy={dotY} r={9} fill="#68D391" />
          <path
            d={`M ${dotX - 4.5} ${dotY + 0.5} L ${dotX - 1} ${dotY + 4} L ${dotX + 5} ${
              dotY - 3.5
            }`}
            stroke="white"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </>
      )}
    </svg>
  );
}

function TileCard({ tileCode, tile, isStart, onClick, isNewlyCompleted }) {
  const [isHovered, setIsHovered] = useState(false);
  if (isStart) {
    const { col, row } = BOARD_LAYOUT.START;
    return (
      <Box
        style={{ ...tileStyle(col, row), borderRadius: '50%' }}
        bg="#1a1a1a"
        border="2px solid #555"
        display="flex"
        alignItems="center"
        justifyContent="center"
        userSelect="none"
      >
        <Text fontSize="10px" color="#aaa" fontWeight="bold">
          START
        </Text>
      </Box>
    );
  }

  if (!tile) return null;
  const pos = BOARD_LAYOUT[tileCode];
  if (!pos) return null;

  const { status, progress, tileDef } = tile;
  const isCapstone = tileCode.startsWith('C');
  const color = tileDef?.color ?? 'capstone';
  const palette = COLOR_BG[color] ?? COLOR_BG.capstone;
  const textCol = COLOR_TEXT[color] ?? '#fff';

  const isLocked = status === 'LOCKED';
  const isComplete = status === 'COMPLETE';

  const progressLabel = (() => {
    if (isLocked || isComplete || !progress) return null;
    const { metricType, metricTarget, metricUnit } = tileDef ?? {};
    if (metricTarget && (metricType === 'unique' || metricType === 'minigame')) {
      const got = Math.round((progress / 100) * metricTarget);
      return `${got}/${metricTarget} ${metricUnit ?? 'uniques'}`;
    }
    return `${progress}%`;
  })();
  const bgColor = isLocked
    ? palette.locked
    : status === 'SUBMITTED'
    ? palette.submitted
    : isComplete
    ? palette.complete
    : palette.unlocked;

  return (
    <Box
      style={{
        ...tileStyle(pos.col, pos.row),
        borderRadius: '50%',
        ...(isCapstone && { transform: 'scale(1.18)', zIndex: 2 }),
        ...(isCapstone && isComplete && { boxShadow: '0 0 14px 4px #ffd70055' }),
        ...(isNewlyCompleted && { animation: 'tileComplete 2.5s ease-out', zIndex: 10 }),
      }}
      bg={bgColor}
      border={
        isCapstone
          ? `2.5px solid ${isComplete ? '#ffd700' : '#ffd70055'}`
          : `2px solid ${isComplete ? '#ffd700' : isLocked ? '#33333388' : '#ffffff33'}`
      }
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDir="column"
      overflow="hidden"
      userSelect="none"
      opacity={isLocked ? 0.4 : 1}
      transition="all 0.2s"
      _hover={
        onClick
          ? {
              transform: 'scale(1.12)',
              zIndex: 10,
              boxShadow: `0 0 16px 4px ${palette.unlocked}88`,
            }
          : undefined
      }
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick ?? undefined}
      title={isLocked ? `${tileCode} — Locked` : `${tileCode} — ${tileDef?.bossOrSkill}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isLocked ? (
        <>
          <Text fontSize="9px" color="#777" fontWeight="bold">
            {tileCode}
          </Text>
          <Text fontSize="14px" lineHeight="1">
            🔒
          </Text>
        </>
      ) : (
        <>
          {COLOR_ICON[color] && (
            <Box position="absolute" top="5px" left="50%" transform="translateX(-50%)">
              {React.createElement(COLOR_ICON[color], {
                size: 11,
                color: 'rgba(255,255,255,0.9)',
                style: { filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' },
              })}
            </Box>
          )}
          <Text fontSize="8px" color={textCol} fontWeight="bold" opacity={0.8} lineHeight="1">
            {tileCode}
          </Text>
          <Text
            fontSize="9px"
            color={textCol}
            textAlign="center"
            lineHeight="1.15"
            px="2px"
            noOfLines={2}
            fontWeight={isComplete ? 'bold' : 'normal'}
          >
            {tileDef?.funName ?? tileDef?.bossOrSkill ?? tileCode}
          </Text>
          {!isCapstone && (
            <Text
              fontSize="8px"
              color={textCol}
              opacity={isHovered && progressLabel ? 1 : 0.75}
              textAlign="center"
              lineHeight="1"
              px="2px"
              noOfLines={1}
              fontWeight={isHovered && progressLabel ? 'bold' : 'normal'}
            >
              {isHovered && progressLabel ? progressLabel : tileDef?.metricLabel}
            </Text>
          )}
        </>
      )}
    </Box>
  );
}

function CopyCommand({ cmd }) {
  const { onCopy, hasCopied } = useClipboard(cmd);
  return (
    <Box>
      <HStack gap={2}>
        <Code
          flex={1}
          px={3}
          py={2}
          bg="gray.700"
          color="gray.100"
          borderRadius="md"
          fontSize="sm"
          fontFamily="mono"
        >
          {cmd}
        </Code>
        <Button size="sm" colorScheme="purple" variant="outline" onClick={onCopy} flexShrink={0}>
          {hasCopied ? 'Copied!' : 'Copy'}
        </Button>
      </HStack>
      <Text fontSize="xs" color="gray.500" mt={1}>
        Paste this command in Discord and{' '}
        <Text as="span" color="gray.300" fontWeight="semibold">
          attach your screenshot directly in the same message
        </Text>
        .
      </Text>
    </Box>
  );
}

function SubmissionRow({ sub }) {
  const isPre = sub.type === 'PRE';
  const isPending = sub.status === 'PENDING';
  const isApproved = sub.status === 'APPROVED';
  const isDenied = sub.status === 'DENIED';
  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={isApproved ? 'green.700' : isDenied ? 'red.900' : 'gray.700'}
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" mb={sub.screenshotUrl ? 2 : 0} wrap="wrap" gap={2}>
        <HStack gap={2} wrap="wrap">
          <Badge colorScheme={isPre ? 'blue' : 'purple'} fontSize="xs" variant="outline">
            {isPre ? 'Pre-screenshot' : 'Final'}
          </Badge>
          <Badge colorScheme={isPending ? 'yellow' : isApproved ? 'green' : 'red'} fontSize="xs">
            {sub.status}
          </Badge>
          <Text fontSize="xs" color="gray.500">
            {sub.submittedAt
              ? new Date(sub.submittedAt).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : ''}
          </Text>
        </HStack>
        {sub.screenshotUrl && (
          <Button
            as="a"
            href={sub.screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            colorScheme="blue"
            variant="outline"
          >
            View screenshot
          </Button>
        )}
      </HStack>
      {isDenied && sub.denialReason && (
        <Text fontSize="xs" color="red.300" mt={1}>
          Reason: {sub.denialReason}
        </Text>
      )}
    </Box>
  );
}

const PRE_HINT = {
  xp: "Just one person needs to submit this. Have everyone participating on this tile log out on Wise Old Man first to sync your team's current xp, then take a screenshot of your team's xp gained for this skill in the WOM group overview.",
  kc: "Just one person needs to submit this. Have everyone participating on this tile log out on Wise Old Man first to sync, then take a screenshot of your team's boss kc gained for this boss in the WOM group overview.",
  minigame:
    'Everyone participating on this tile needs to submit a pre-screenshot. Take a screenshot showing 0 rewards points for this minigame before you start.',
  hunter_rumor:
    'Everyone participating on this tile needs to submit a pre-screenshot. Open your collection log and take a screenshot showing your current hunter rumor uniques before you start.',
};

const FINAL_HINT = {
  xp: "Have everyone participating on this tile log out on Wise Old Man to sync your team's final xp, then take a screenshot of your team's xp gained for this skill in the WOM group overview.",
  kc: "Have everyone participating on this tile log out on Wise Old Man to sync your team's final boss kc, then take a screenshot of your team's boss kc gained for this boss in the WOM group overview.",
  unique:
    'Make sure the event password is visible in the screenshot, the drop is visible in your chat, and set your loot value threshold low in settings so nothing gets filtered out.',
  minigame:
    'Make sure the event password is visible in the screenshot and drops are clearly shown in chat.',
  hunter_rumor:
    'Make sure the event password is visible in the screenshot and your collection log shows the new unique(s) obtained.',
};

function TileSubmissions({ eventId, teamId, tileCode, metricType }) {
  const { data, loading } = useQuery(GET_RAINBOW_TILE_SUBMISSIONS, {
    variables: { eventId, teamId, tileCode },
    fetchPolicy: 'cache-and-network',
  });

  const subs = data?.getRainbowSubmissions ?? [];
  const pre = subs.filter((s) => s.type === 'PRE');
  const final = subs.filter((s) => s.type === 'FINAL');

  if (loading)
    return (
      <Center py={4}>
        <Spinner size="sm" color="purple.400" />
      </Center>
    );

  return (
    <VStack align="stretch" gap={4}>
      {metricType !== 'unique' && (
        <>
          <Box>
            <HStack mb={2} gap={2}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                color="blue.300"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                📸 Pre-screenshots
              </Text>
              {pre.length > 0 && (
                <Badge colorScheme="blue" fontSize="xx-small">
                  {pre.length}
                </Badge>
              )}
            </HStack>
            <Box
              bg="blue.950"
              border="1px solid"
              borderColor="blue.800"
              borderRadius="md"
              p={3}
              mb={2}
            >
              <Text fontSize="xs" color="blue.200" lineHeight="1.6">
                A pre-screenshot proves your <strong>starting state</strong> before you begin, like
                your kc or xp before training. Submit one as soon as your team decides to start this
                tile.
              </Text>
              {PRE_HINT[metricType] && (
                <Text
                  fontSize="xs"
                  color="blue.300"
                  lineHeight="1.6"
                  mt={2}
                  pt={2}
                  borderTop="1px solid"
                  borderColor="blue.800"
                >
                  {PRE_HINT[metricType]}
                </Text>
              )}
            </Box>
            <CopyCommand cmd={`!rbpre ${tileCode}`} />
            {pre.length > 0 && (
              <VStack align="stretch" gap={2} mt={3} maxH="240px" overflowY="auto">
                {pre.map((s) => (
                  <SubmissionRow key={s.submissionId} sub={s} />
                ))}
              </VStack>
            )}
            {pre.length === 0 && (
              <Text fontSize="xs" color="gray.600" mt={2}>
                No pre-screenshots yet.
              </Text>
            )}
          </Box>

          <Divider borderColor="gray.700" />
        </>
      )}

      <Box>
        <HStack mb={2} gap={2}>
          <Text
            fontSize="xs"
            fontWeight="semibold"
            color="purple.300"
            textTransform="uppercase"
            letterSpacing="wider"
          >
            🏆 Final submissions
          </Text>
          {final.length > 0 && (
            <Badge colorScheme="purple" fontSize="xx-small">
              {final.length}
            </Badge>
          )}
        </HStack>
        <Box
          bg="purple.950"
          border="1px solid"
          borderColor="purple.800"
          borderRadius="md"
          p={3}
          mb={2}
        >
          <Text fontSize="xs" color="purple.200" lineHeight="1.6">
            Submit your completion proof once the tile is done. Multiple members can submit, of
            course! All submissions go into the review queue. A ref will approve or deny each one
            and mark the tile complete when satisfied.
          </Text>
          {FINAL_HINT[metricType] && (
            <Text
              fontSize="xs"
              color="purple.300"
              lineHeight="1.6"
              mt={2}
              pt={2}
              borderTop="1px solid"
              borderColor="purple.800"
            >
              {FINAL_HINT[metricType]}
            </Text>
          )}
        </Box>
        <CopyCommand cmd={`!rbsubmit ${tileCode}`} />
        {final.length > 0 && (
          <VStack align="stretch" gap={2} mt={3} maxH="240px" overflowY="auto">
            {final.map((s) => (
              <SubmissionRow key={s.submissionId} sub={s} />
            ))}
          </VStack>
        )}
        {final.length === 0 && (
          <Text fontSize="xs" color="gray.600" mt={2}>
            No final submissions yet.
          </Text>
        )}
      </Box>
    </VStack>
  );
}

const RULES_KEY = 'rainbowBingo_rulesAcknowledged';

function EventPasswordBadge({ password }) {
  const { onCopy, hasCopied } = useClipboard(password);
  return (
    <HStack
      gap={2}
      bg="whiteAlpha.50"
      border="1px solid"
      borderColor="whiteAlpha.100"
      borderRadius="md"
      px={3}
      py={1.5}
    >
      <Text fontSize="xs" color="gray.500">
        Event password:
      </Text>
      <Text fontSize="xs" fontFamily="mono" color="gray.200" fontWeight="semibold">
        {password}
      </Text>
      <Button
        size="xs"
        variant="ghost"
        colorScheme="purple"
        onClick={onCopy}
        h="auto"
        minW="auto"
        px={1}
        py={0.5}
      >
        {hasCopied ? 'Copied!' : 'Copy'}
      </Button>
    </HStack>
  );
}

function HowToPlayModal({ isOpen, onClose, eventPassword }) {
  const [checked, setChecked] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const handleBodyScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 8) setScrolledToBottom(true);
  };
  const handleConfirm = () => {
    localStorage.setItem(RULES_KEY, 'true');
    onClose();
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      closeOnOverlayClick={false}
      isCentered
      size="lg"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(4px)" />
      <ModalContent
        border="1px solid"
        borderColor="gray.700"
        color="white"
        style={{ background: '#12121f' }}
      >
        <ModalHeader>
          <Text
            bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
            bgClip="text"
            fontSize="xl"
            fontWeight="bold"
          >
            How to play Rainbow Bingo
          </Text>
        </ModalHeader>
        <ModalBody pb={2} onScroll={handleBodyScroll}>
          <VStack align="stretch" gap={4} fontSize="sm" color="gray.200">
            <Box bg="whiteAlpha.50" borderRadius="md" p={4}>
              <Text fontWeight="bold" color="white" mb={2}>
                The board
              </Text>
              <Text lineHeight="1.7">
                Your team has a Rainbow Bingo board with tiles across 7 colors: red, orange, yellow,
                green, blue, indigo, and violet, plus capstone tiles for each color. Completing
                tiles unlocks new ones along the path. Capstones are worth{' '}
                <Text as="span" color="yellow.300" fontWeight="bold">
                  3 points
                </Text>
                ; regular tiles are worth{' '}
                <Text as="span" color="white" fontWeight="bold">
                  1 point
                </Text>
                . Select the tile you'd like more information about, including the Discord commands
                you'll need to submit your progress.
              </Text>
            </Box>
            <Box bg="blue.950" border="1px solid" borderColor="blue.800" borderRadius="md" p={4}>
              <Text fontWeight="bold" color="blue.200" mb={2}>
                📸 Pre-screenshots
              </Text>
              <Text lineHeight="1.7" color="blue.100">
                Before starting a tile, submit a pre-screenshot showing your current state (kc, xp,
                etc.) using{' '}
                <Text as="span" fontFamily="mono" bg="blue.900" px={1} borderRadius="sm">
                  !rbpre [tile]
                </Text>{' '}
                in your team Discord channel with a screenshot attached. Include the event password
                {eventPassword ? (
                  <>
                    {' '}
                    (
                    <Text
                      as="span"
                      fontFamily="mono"
                      bg="blue.900"
                      px={1}
                      borderRadius="sm"
                      color="blue.200"
                    >
                      {eventPassword}
                    </Text>
                    )
                  </>
                ) : null}{' '}
                visibly in the screenshot.
              </Text>
            </Box>
            <Box
              bg="purple.950"
              border="1px solid"
              borderColor="purple.800"
              borderRadius="md"
              p={4}
            >
              <Text fontWeight="bold" color="purple.200" mb={2}>
                🏆 Final submissions
              </Text>
              <Text lineHeight="1.7" color="purple.100">
                When your tile is done, submit your completion proof using{' '}
                <Text as="span" fontFamily="mono" bg="purple.900" px={1} borderRadius="sm">
                  !rbsubmit [tile]
                </Text>{' '}
                in your Discord channel with a screenshot attached. Multiple members can submit. A
                ref will review and approve before marking the tile complete.
              </Text>
            </Box>
            <VStack align="stretch" spacing={3}>
              <Box p={3} bg="pink.700" borderRadius="md">
                <Text fontSize="xs" fontWeight="semibold" color="pink.200" mb={2}>
                  * Required for all submissions
                </Text>
                <VStack align="stretch" spacing={1}>
                  <Text fontSize="xs" color="pink.100">
                    • Full game client visible (not cropped)
                  </Text>
                  <Text fontSize="xs" color="pink.100">
                    • Event password{' '}
                    {eventPassword ? (
                      <>
                        {' '}
                        (
                        <Text
                          as="span"
                          fontFamily="mono"
                          bg="whiteAlpha.100"
                          px={1}
                          borderRadius="sm"
                        >
                          {eventPassword}
                        </Text>
                        )
                      </>
                    ) : null}{' '}
                    visible via Wise Old Man or Clan Events plugin
                  </Text>

                  <Text fontSize="xs" color="pink.100">
                    • The drop visible in your chatbox
                  </Text>
                  <Text fontSize="xs" color="pink.100">
                    • Boss kill count visible in chatbox or adventure log
                  </Text>
                </VStack>
              </Box>
            </VStack>

            <Box bg="whiteAlpha.50" borderRadius="md" p={4}>
              <Text fontWeight="bold" color="white" mb={2}>
                📋 Rules
              </Text>
              <VStack align="stretch" gap={1.5} color="gray.300">
                <Text>
                  • Pre-screenshots must be taken{' '}
                  <Text as="span" color="white" fontWeight="semibold">
                    before
                  </Text>{' '}
                  you begin working on a tile. Log out and back in to log accurate XP and KC to WOM
                  before taking any screenshots.
                </Text>
                <Text>
                  • Tiles must be completed by the same team. No borrowing progress from other
                  accounts outside your team.
                </Text>
                <Text>
                  • Refs have final say on approvals. If denied, check the reason and resubmit.
                </Text>
                <Text>
                  • Be respectful and have fun! This event celebrates the LGBTQIA+ community. 🏳️‍🌈
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter flexDir="column" gap={4} pt={4}>
          {!scrolledToBottom && (
            <Text fontSize="xs" color="gray.500" textAlign="center">
              scroll through the rules to continue
            </Text>
          )}
          <Checkbox
            isChecked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            isDisabled={!scrolledToBottom}
            colorScheme="purple"
            alignItems="flex-start"
            w="100%"
          >
            <Text fontSize="sm" color="gray.200" lineHeight="1.5">
              I have read and understand the rules
            </Text>
          </Checkbox>
          <Button
            colorScheme="purple"
            w="100%"
            isDisabled={!scrolledToBottom || !checked}
            onClick={handleConfirm}
          >
            Let's go! 🌈
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

const COLOR_ORDER = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'capstone'];

const MOCK_PROGRESS_TILES = [
  { tileCode: 'R1', status: 'COMPLETE',  progress: 100, tileDef: { color: 'red',     bossOrSkill: 'Moons of Peril',              metricType: 'unique', metricTarget: 3,       metricUnit: 'uniques', metricLabel: '3 uniques' } },
  { tileCode: 'R2', status: 'UNLOCKED',  progress: 67,  tileDef: { color: 'red',     bossOrSkill: 'Grotesque Guardians',         metricType: 'kc',     metricTarget: 300,     metricUnit: 'kc',      metricLabel: '300 kc' } },
  { tileCode: 'R4', status: 'SUBMITTED', progress: 100, tileDef: { color: 'red',     bossOrSkill: 'Abyssal Sire',                metricType: 'kc',     metricTarget: 400,     metricUnit: 'kc',      metricLabel: '400 kc' } },
  { tileCode: 'R5', status: 'UNLOCKED',  progress: 35,  tileDef: { color: 'red',     bossOrSkill: 'Woodcutting',                 metricType: 'xp',     metricTarget: 5000000, metricUnit: 'xp',      metricLabel: '5M xp' } },
  { tileCode: 'O1', status: 'COMPLETE',  progress: 100, tileDef: { color: 'orange',  bossOrSkill: 'Cooking',                     metricType: 'xp',     metricTarget: 5000000, metricUnit: 'xp',      metricLabel: '5M xp' } },
  { tileCode: 'O2', status: 'UNLOCKED',  progress: 50,  tileDef: { color: 'orange',  bossOrSkill: 'Dagannoth Kings',             metricType: 'unique', metricTarget: 8,       metricUnit: 'uniques', metricLabel: '8 uniques' } },
  { tileCode: 'O3', status: 'UNLOCKED',  progress: 0,   tileDef: { color: 'orange',  bossOrSkill: 'Zulrah',                      metricType: 'unique', metricTarget: 3,       metricUnit: 'uniques', metricLabel: '3 uniques' } },
  { tileCode: 'Y1', status: 'UNLOCKED',  progress: 80,  tileDef: { color: 'yellow',  bossOrSkill: 'Agility',                     metricType: 'xp',     metricTarget: 1500000, metricUnit: 'xp',      metricLabel: '1.5M xp' } },
  { tileCode: 'Y3', status: 'UNLOCKED',  progress: 20,  tileDef: { color: 'yellow',  bossOrSkill: 'Fletching',                   metricType: 'xp',     metricTarget: 5000000, metricUnit: 'xp',      metricLabel: '5M xp' } },
  { tileCode: 'Y5', status: 'UNLOCKED',  progress: 55,  tileDef: { color: 'yellow',  bossOrSkill: 'Shellbane',                   metricType: 'kc',     metricTarget: 500,     metricUnit: 'kc',      metricLabel: '500 kc' } },
  { tileCode: 'G4', status: 'UNLOCKED',  progress: 60,  tileDef: { color: 'green',   bossOrSkill: 'Fishing',                     metricType: 'xp',     metricTarget: 2500000, metricUnit: 'xp',      metricLabel: '2.5M xp' } },
  { tileCode: 'G5', status: 'COMPLETE',  progress: 100, tileDef: { color: 'green',   bossOrSkill: 'Kraken',                      metricType: 'kc',     metricTarget: 500,     metricUnit: 'kc',      metricLabel: '500 kc' } },
  { tileCode: 'G7', status: 'UNLOCKED',  progress: 10,  tileDef: { color: 'green',   bossOrSkill: 'Sailing',                     metricType: 'xp',     metricTarget: 6500000, metricUnit: 'xp',      metricLabel: '6.5M xp' } },
  { tileCode: 'B1', status: 'UNLOCKED',  progress: 25,  tileDef: { color: 'blue',    bossOrSkill: 'Crafting',                    metricType: 'xp',     metricTarget: 5000000, metricUnit: 'xp',      metricLabel: '5M xp' } },
  { tileCode: 'B3', status: 'UNLOCKED',  progress: 45,  tileDef: { color: 'blue',    bossOrSkill: 'Smithing',                    metricType: 'xp',     metricTarget: 4000000, metricUnit: 'xp',      metricLabel: '4M xp' } },
  { tileCode: 'B6', status: 'UNLOCKED',  progress: 0,   tileDef: { color: 'blue',    bossOrSkill: 'Thermonuclear Smoke Devil',    metricType: 'kc',     metricTarget: 500,     metricUnit: 'kc',      metricLabel: '500 kc' } },
  { tileCode: 'I4', status: 'UNLOCKED',  progress: 10,  tileDef: { color: 'indigo',  bossOrSkill: 'Mining',                      metricType: 'xp',     metricTarget: 2000000, metricUnit: 'xp',      metricLabel: '2M xp' } },
  { tileCode: 'I7', status: 'UNLOCKED',  progress: 88,  tileDef: { color: 'indigo',  bossOrSkill: 'Alchemical Hydra',            metricType: 'kc',     metricTarget: 300,     metricUnit: 'kc',      metricLabel: '300 kc' } },
  { tileCode: 'V1', status: 'UNLOCKED',  progress: 70,  tileDef: { color: 'violet',  bossOrSkill: 'Slayer',                      metricType: 'xp',     metricTarget: 4000000, metricUnit: 'xp',      metricLabel: '4M xp' } },
  { tileCode: 'V6', status: 'UNLOCKED',  progress: 42,  tileDef: { color: 'violet',  bossOrSkill: 'Cerberus',                    metricType: 'kc',     metricTarget: 500,     metricUnit: 'kc',      metricLabel: '500 kc' } },
  { tileCode: 'C1', status: 'UNLOCKED',  progress: 30,  tileDef: { color: 'capstone', bossOrSkill: 'Thieving',                   metricType: 'xp',     metricTarget: 4000000, metricUnit: 'xp',      metricLabel: '4M xp' } },
];

function TileProgressRow({ tile }) {
  const { status, progress, tileDef } = tile;
  const isComplete = status === 'COMPLETE';
  const { metricType, metricTarget, metricUnit, metricLabel, bossOrSkill, color } = tileDef ?? {};

  const label = (() => {
    if (isComplete) return 'Complete';
    if (!progress) return metricLabel ?? '—';
    if (metricTarget && (metricType === 'kc' || metricType === 'xp')) {
      const got = Math.round((progress / 100) * metricTarget);
      return `${got.toLocaleString()} / ${Number(metricTarget).toLocaleString()} ${metricUnit ?? ''}`;
    }
    if (metricTarget && (metricType === 'unique' || metricType === 'minigame')) {
      const got = Math.round((progress / 100) * metricTarget);
      return `${got} / ${metricTarget} ${metricUnit ?? ''}`;
    }
    return `${progress}%`;
  })();

  const scheme = COLOR_BADGE[color] ?? 'gray';

  return (
    <HStack gap={3} align="center" py="3px">
      <Text fontSize="11px" color="gray.600" fontFamily="mono" w="26px" flexShrink={0}>
        {tile.tileCode}
      </Text>
      <Tooltip label={bossOrSkill} placement="top" openDelay={400} hasArrow>
        <Text
          fontSize="xs"
          color={isComplete ? 'gray.600' : 'gray.300'}
          flexShrink={0}
          w="130px"
          noOfLines={1}
          textDecoration={isComplete ? 'line-through' : 'none'}
          cursor="default"
        >
          {bossOrSkill}
        </Text>
      </Tooltip>
      {isComplete ? (
        <Text fontSize="xs" color="green.400" fontWeight="semibold" flexShrink={0}>
          ✓
        </Text>
      ) : (
        <>
          <Box flex={1}>
            <Progress
              value={progress ?? 0}
              size="xs"
              colorScheme={scheme}
              borderRadius="full"
              bg="whiteAlpha.100"
            />
          </Box>
          <Text fontSize="11px" color="gray.500" flexShrink={0} w="185px" textAlign="right" fontFamily="mono">
            {label}
          </Text>
        </>
      )}
    </HStack>
  );
}

function TileProgressOverview({ tiles }) {
  const groups = useMemo(() => {
    const map = Object.fromEntries(COLOR_ORDER.map((c) => [c, []]));
    for (const tile of tiles) {
      if (tile.status === 'LOCKED') continue;
      const c = tile.tileDef?.color;
      if (c && map[c]) map[c].push(tile);
    }
    return map;
  }, [tiles]);

  const hasAny = COLOR_ORDER.some((c) => groups[c].length > 0);
  if (!hasAny) return null;

  return (
    <Box mt={6} maxW="860px" mx="auto" w="100%">
      <Text
        fontSize="xs"
        color="gray.500"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={4}
        textAlign="center"
      >
        Tile Progress
      </Text>
      <VStack align="stretch" gap={3}>
        {COLOR_ORDER.map((color) => {
          const group = groups[color];
          if (group.length === 0) return null;
          const Icon = COLOR_ICON[color];
          const complete = group.filter((t) => t.status === 'COMPLETE').length;
          const scheme = COLOR_BADGE[color];
          return (
            <Box
              key={color}
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="lg"
              p={3}
            >
              <HStack mb={2} gap={2}>
                {Icon && <Icon color={`var(--chakra-colors-${scheme}-400)`} size={12} />}
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color={`${scheme}.300`}
                  flex={1}
                >
                  {COLOR_LABEL[color]}
                </Text>
                <Text fontSize="10px" color="gray.600">
                  {complete}/{group.length}
                </Text>
              </HStack>
              <VStack gap={0} align="stretch" divider={<Box borderBottom="1px solid" borderColor="whiteAlpha.50" />}>
                {group.map((tile) => (
                  <TileProgressRow key={tile.tileCode} tile={tile} />
                ))}
              </VStack>
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}

function TileModal({ tile, onClose }) {
  if (!tile) return null;
  const { tileCode, status, tileDef, unlockedAt, completedAt, teamId, eventId } = tile;
  const color = tileDef?.color ?? 'capstone';
  const palette = COLOR_BG[color] ?? COLOR_BG.capstone;
  const isComplete = status === 'COMPLETE';
  const isSubmitted = status === 'SUBMITTED';

  return (
    <Modal isOpen onClose={onClose} isCentered size="lg" scrollBehavior="inside">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent
        border="1px solid"
        borderColor="gray.700"
        color="white"
        style={{ background: '#12121f' }}
      >
        <ModalHeader pb={2}>
          <HStack gap={3} align="flex-start">
            <Box
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: palette.unlocked,
                flexShrink: 0,
              }}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="xs" fontWeight="bold" color={COLOR_TEXT[color]}>
                {tileCode}
              </Text>
            </Box>
            <VStack align="flex-start" gap={1}>
              <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                {tileDef?.bossOrSkill ?? tileCode}
              </Text>
              {tileDef?.funName && (
                <Text fontSize="sm" color="pink.300" fontStyle="italic">
                  "{tileDef.funName}"
                </Text>
              )}
              <HStack gap={2} wrap="wrap">
                <Badge colorScheme={COLOR_BADGE[color]} fontSize="xs">
                  {COLOR_LABEL[color]}
                </Badge>
                {tileDef?.theme && (
                  <Badge colorScheme="gray" variant="outline" fontSize="xs">
                    {tileDef.theme}
                  </Badge>
                )}
                {isComplete && (
                  <Badge colorScheme="green" fontSize="xs">
                    ✅ Complete
                  </Badge>
                )}
                {isSubmitted && (
                  <Badge colorScheme="orange" fontSize="xs">
                    ⏳ In progress
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" gap={4}>
            <Box bg="whiteAlpha.50" borderRadius="md" p={3}>
              <Text
                fontSize="xs"
                color="gray.400"
                mb={1}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Objective
              </Text>
              <Text color="white" fontWeight="semibold">
                {tileDef?.metricLabel ?? '—'}
              </Text>
            </Box>
            {tileDef?.validDrops?.length > 0 && (
              <Box bg="whiteAlpha.50" borderRadius="md" p={3}>
                <Text
                  fontSize="xs"
                  color="gray.400"
                  mb={2}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Valid drops
                </Text>
                <HStack wrap="wrap" gap={1.5}>
                  {tileDef.validDrops.map((drop) => (
                    <Badge
                      key={drop}
                      colorScheme="purple"
                      variant="subtle"
                      fontSize="xs"
                      px={2}
                      py={0.5}
                    >
                      {drop}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}
            {tileDef?.notes && (
              <Box bg="whiteAlpha.50" borderRadius="md" p={3}>
                <Text
                  fontSize="xs"
                  color="gray.400"
                  mb={1}
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  Notes
                </Text>
                <Text color="gray.300" fontSize="sm">
                  {tileDef.notes}
                </Text>
              </Box>
            )}
            {(unlockedAt || completedAt) && (
              <HStack gap={6} fontSize="xs" color="gray.500" px={1}>
                {unlockedAt && <Text>Unlocked {new Date(unlockedAt).toLocaleDateString()}</Text>}
                {completedAt && (
                  <Text color="green.400">
                    ✅ Completed {new Date(completedAt).toLocaleDateString()}
                  </Text>
                )}
              </HStack>
            )}
            <Divider borderColor="gray.700" />
            <TileSubmissions
              eventId={eventId}
              teamId={teamId}
              tileCode={tileCode}
              metricType={tileDef?.metricType}
            />
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function RainbowTeamBoardPage() {
  const { token } = useParams();
  const { user } = useAuth();
  const isSiteAdmin = !!user?.admin;
  const toast = useToast();
  const [selectedTile, setSelectedTile] = useState(null);
  const [showLocked, setShowLocked] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showIntroVideo, setShowIntroVideo] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(RULES_KEY)) setShowHowToPlay(true);
  }, []);
  const [recentlyCompleted, setRecentlyCompleted] = useState(new Set());
  const prevBoardRef = useRef({});
  const boardScrollRef = useRef(null);
  const { playTileComplete, playCapstoneComplete, playBoardComplete } = useCompletionSound();
  const { trigger: triggerCelebration, overlay: celebrationOverlay } = useRainbowCelebration();
  useRainbowCursorTrail();

  const [dragGif, setDragGif] = useState(null);
  const [showProgressPreview, setShowProgressPreview] = useState(false);
  const dragGifTimerRef = useRef(null);
  const showDragGif = useCallback(() => {
    const gif = DRAG_GIFS[Math.floor(Math.random() * DRAG_GIFS.length)];
    setDragGif(gif);
    if (dragGifTimerRef.current) clearTimeout(dragGifTimerRef.current);
    dragGifTimerRef.current = setTimeout(() => setDragGif(null), 4500);
  }, []);

  const [testNotify] = useMutation(TEST_RAINBOW_NOTIFICATION, {
    onError: (e) =>
      toast({
        title: 'Discord test failed',
        description: e.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      }),
  });

  const apolloClient = useApolloClient();
  const COOLDOWN_MS = 15 * 60 * 1000;
  const [now, setNow] = useState(Date.now());

  const { data: syncStatusData } = useQuery(GET_RAINBOW_SYNC_IN_PROGRESS, { fetchPolicy: 'network-only' });
  const [globalSyncInProgress, setGlobalSyncInProgress] = useState(false);
  useEffect(() => {
    if (syncStatusData?.getRainbowSyncInProgress != null) setGlobalSyncInProgress(syncStatusData.getRainbowSyncInProgress);
  }, [syncStatusData]);
  useSubscription(RAINBOW_SYNC_STATUS_CHANGED, {
    onData: ({ data: subData }) => {
      const val = subData?.data?.rainbowSyncStatusChanged;
      if (val != null) {
        setGlobalSyncInProgress(val);
        if (!val) {
          // sync just finished — pick up the new lastWomSync from DB
          refetchTeam();
          setNow(Date.now());
          setSyncTileProgress({ done: 0, total: 0 });
        }
      }
    },
  });

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const [womSyncing, setWomSyncing] = useState(false);
  const [syncTileProgress, setSyncTileProgress] = useState({ done: 0, total: 0 });
  const [startWomSync] = useMutation(START_TEAM_WOM_SYNC);

  const [resetWomCooldown] = useMutation(RESET_TEAM_WOM_COOLDOWN, {
    onCompleted: () => {
      if (team) {
        apolloClient.writeQuery({
          query: GET_RAINBOW_TEAM_BY_TOKEN,
          variables: { token },
          data: { getRainbowTeamByToken: { ...team, lastWomSync: null } },
        });
      }
      setNow(Date.now());
    },
  });

  const triggerTest = (type) => {
    const CAPSTONES = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
    const codes = type === 'board' ? CAPSTONES : type === 'capstone' ? ['C1'] : ['R1'];
    setRecentlyCompleted((s) => {
      const n = new Set(s);
      codes.forEach((c) => n.add(c));
      return n;
    });
    setTimeout(() => {
      setRecentlyCompleted((s) => {
        const n = new Set(s);
        codes.forEach((c) => n.delete(c));
        return n;
      });
    }, 2500);
    if (type === 'board') {
      playBoardComplete();
      triggerCelebration('board');
      toast({ title: 'Board complete fired', status: 'success', duration: 2000 });
    } else if (type === 'capstone') {
      playCapstoneComplete();
      triggerCelebration('capstone');
      showDragGif();
      toast({ title: 'Capstone complete fired', status: 'success', duration: 2000 });
    } else {
      playTileComplete();
      triggerCelebration('tile');
      showDragGif();
      toast({ title: 'Tile complete fired', status: 'success', duration: 2000 });
    }
    const teamId = tokenData?.getRainbowTeamByToken?.teamId;
    if (teamId) {
      const discordType = type === 'board' ? 'BOARD' : type === 'capstone' ? 'CAPSTONE' : 'TILE';
      testNotify({ variables: { teamId, type: discordType } });
    }
  };

  const { data: tokenData, loading: tokenLoading, refetch: refetchTeam } = useQuery(GET_RAINBOW_TEAM_BY_TOKEN, {
    variables: { token },
    fetchPolicy: 'cache-and-network',
  });

  const team = tokenData?.getRainbowTeamByToken;

  const lastWomSyncMs = team?.lastWomSync ? new Date(team.lastWomSync).getTime() : null;
  const cooldownMinsLeft = lastWomSyncMs ? Math.ceil(Math.max(0, (lastWomSyncMs + COOLDOWN_MS - now) / 60000)) : 0;
  const womSyncOnCooldown = cooldownMinsLeft > 0;

  const { data: eventData } = useQuery(GET_ACTIVE_RAINBOW_EVENT, {
    skip: !team,
    fetchPolicy: 'cache-and-network',
  });
  const eventPassword = eventData?.getActiveRainbowEvent?.eventName ?? null;
  const hasWomCompetition = !!eventData?.getActiveRainbowEvent?.womCompetitionId;

  const { data, loading: boardLoading } = useQuery(GET_RAINBOW_TEAM_BOARD, {
    variables: { teamId: team?.teamId },
    skip: !team?.teamId,
    fetchPolicy: 'cache-and-network',
    onCompleted: (d) => {
      if (d?.getRainbowTeamBoard && Object.keys(prevBoardRef.current).length === 0) {
        prevBoardRef.current = Object.fromEntries(
          d.getRainbowTeamBoard.map((t) => [t.tileCode, t])
        );
      }
    },
  });

  useSubscription(RAINBOW_TEAM_BOARD_UPDATED, {
    variables: { teamId: team?.teamId },
    skip: !team?.teamId,
    onData: ({ client, data: subData }) => {
      const updated = subData?.data?.rainbowTeamBoardUpdated;
      if (!updated) return;
      const prev = prevBoardRef.current;
      const newlyDone = updated
        .filter((t) => t.status === 'COMPLETE' && prev[t.tileCode]?.status !== 'COMPLETE')
        .map((t) => t.tileCode);
      prevBoardRef.current = Object.fromEntries(updated.map((t) => [t.tileCode, t]));
      if (newlyDone.length > 0) {
        setRecentlyCompleted((s) => {
          const n = new Set(s);
          newlyDone.forEach((c) => n.add(c));
          return n;
        });
        setTimeout(() => {
          setRecentlyCompleted((s) => {
            const n = new Set(s);
            newlyDone.forEach((c) => n.delete(c));
            return n;
          });
        }, 2500);
        const isCapstone = newlyDone.some((c) => c.startsWith('C'));
        if (isCapstone) {
          playCapstoneComplete();
          triggerCelebration('capstone');
          showDragGif();
        } else {
          playTileComplete();
          triggerCelebration('tile');
          showDragGif();
        }
      }
      setSyncTileProgress((p) => p.total > 0 ? { ...p, done: Math.min(p.done + 1, p.total) } : p);
      client.writeQuery({
        query: GET_RAINBOW_TEAM_BOARD,
        variables: { teamId: team.teamId },
        data: { getRainbowTeamBoard: updated },
      });
    },
  });

  const eventId = eventData?.getActiveRainbowEvent?.eventId;
  useSubscription(RAINBOW_SUBMISSION_REVIEWED, {
    variables: { eventId },
    skip: !eventId,
    onData: ({ data: subData }) => {
      const reviewed = subData?.data?.rainbowSubmissionReviewed;
      if (reviewed?.status === 'APPROVED' && reviewed?.type === 'FINAL') {
        showDragGif();
      }
    },
  });

  const boardMap = useMemo(() => {
    const tiles = data?.getRainbowTeamBoard ?? [];
    return Object.fromEntries(tiles.map((t) => [t.tileCode, t]));
  }, [data]);

  const handleWomSync = useCallback(async () => {
    if (!team) return;
    setWomSyncing(true);
    try {
      const result = await startWomSync({ variables: { teamId: team.teamId } });
      const total = result.data?.startTeamWomSync?.tileCodes?.length ?? 0;
      setSyncTileProgress({ done: 0, total });
    } catch (e) {
      toast({ title: 'WOM sync failed', description: e.message, status: 'error', duration: 8000, isClosable: true });
    } finally {
      setWomSyncing(false);
    }
  }, [team, startWomSync, toast]);

  const boardCenteredRef = useRef(false);
  useEffect(() => {
    if (boardCenteredRef.current || !data) return;
    const el = boardScrollRef.current;
    if (!el) return;
    boardCenteredRef.current = true;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [data]);

  const stats = useMemo(() => {
    const tiles = data?.getRainbowTeamBoard ?? [];
    return {
      complete: tiles.filter((t) => t.status === 'COMPLETE').length,
      inProgress: tiles.filter(
        (t) => t.status === 'SUBMITTED' || (t.status === 'UNLOCKED' && t.progress > 0)
      ).length,
      total: tiles.length,
    };
  }, [data]);

  if (tokenLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }

  if (!team) {
    return (
      <Center h="60vh">
        <VStack>
          <Text fontSize="2xl">🔒</Text>
          <Text color="gray.400">Board not found. Check your link.</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      <Box minH="100vh" color="white" pt="56px" pb="64px" px={{ base: 3, md: 6 }}>
        <VStack align="stretch" gap={3} maxW="1200px" mx="auto">
          <VStack align="center" gap={1}>
            <HStack gap={3} align="center">
              <Box
                as="img"
                src={dollyGnome}
                alt=""
                h="48px"
                style={{ imageRendering: 'pixelated' }}
              />
              <Heading
                size="lg"
                bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
                bgClip="text"
              >
                Rainbow Bingo
              </Heading>
              <Box
                as="img"
                src={yassifiedGnome}
                alt=""
                h="48px"
                style={{ imageRendering: 'pixelated', transform: 'scaleX(-1)' }}
              />
            </HStack>
            <Text color="white" fontWeight="semibold" fontSize="lg">
              {team.teamName}
            </Text>
            {eventPassword && <EventPasswordBadge password={eventPassword} />}
            <Box
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.100"
              borderRadius="lg"
              px={4}
              py={3}
              maxW="520px"
              mt="12px"
              w="100%"
              textAlign="center"
            >
              <Text fontSize="sm" color="gray.300" mb={2} lineHeight="1.6">
                Complete nodes by submitting screenshots to your refs of your adventures and
                triumphs. Nodes unlock as you finish their prerequisites! Complete all 7 capstone
                nodes to finish the board and win!{' '}
              </Text>
              <Box
                as={RouterLink}
                to="/eg-rainbow"
                color="purple.300"
                _hover={{ color: 'purple.200', textDecoration: 'underline' }}
                display="inline"
              >
                View the public leaderboard →
              </Box>
              <Text fontSize="xs" color="red.400" fontWeight="semibold" mt={2}>
                ⚠ Do not share this page's link with anyone outside your team.
              </Text>
            </Box>
          </VStack>

          <HStack gap={6} wrap="wrap" justify="center">
            <HStack>
              <Box w="10px" h="10px" bg="green.400" borderRadius="full" />
              <Text fontSize="sm" color="gray.300">
                Complete ({stats.complete})
              </Text>
            </HStack>
            <HStack>
              <Box w="10px" h="10px" bg="orange.400" borderRadius="full" />
              <Text fontSize="sm" color="gray.300">
                In progress ({stats.inProgress})
              </Text>
            </HStack>
            {isSiteAdmin && (
              <Button
                size="xs"
                variant={showLocked ? 'solid' : 'outline'}
                colorScheme="purple"
                onClick={() => setShowLocked((v) => !v)}
              >
                {showLocked ? 'Admin: Hide locked' : 'Admin: Show locked'}
              </Button>
            )}
          </HStack>

          {boardLoading && !data ? (
            <Center py={10}>
              <Spinner size="xl" color="purple.400" />
            </Center>
          ) : (
            <Box overflowX="auto" pb={2} ref={boardScrollRef}>
              <style>{`@keyframes tileComplete { 0% { box-shadow: 0 0 0 0 rgba(255,215,0,0.9); } 50% { box-shadow: 0 0 0 16px rgba(255,215,0,0.35); } 100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); } }`}</style>
              <Box
                bg="rgba(255,255,255,0.03)"
                borderRadius="xl"
                p="12px"
                width="max-content"
                mx="auto"
              >
                <Box position="relative" style={{ width: BOARD_W, height: BOARD_H }}>
                  <BoardEdges boardMap={boardMap} showLocked={showLocked} />
                  <TileCard tileCode="START" tile={null} isStart onClick={null} />
                  {Object.keys(BOARD_LAYOUT)
                    .filter((k) => k !== 'START')
                    .map((code) => {
                      const pos = BOARD_LAYOUT[code];
                      const tile = boardMap[code];
                      if (tile?.status === 'LOCKED' && !showLocked) return null;
                      return (
                        <React.Fragment key={code}>
                          <TileCard
                            tileCode={code}
                            tile={tile}
                            isStart={false}
                            isNewlyCompleted={recentlyCompleted.has(code)}
                            onClick={tile?.status !== 'LOCKED' ? () => setSelectedTile(tile) : null}
                          />
                          {pos &&
                            (tile?.progress > 0 ||
                              tile?.hasSubmissions ||
                              tile?.status === 'COMPLETE') && (
                              <TileOverlay
                                col={pos.col}
                                row={pos.row}
                                progress={tile.progress ?? 0}
                                status={tile.status}
                                hasSubmissions={tile.hasSubmissions}
                              />
                            )}
                        </React.Fragment>
                      );
                    })}
                </Box>
              </Box>
            </Box>
          )}

          {hasWomCompetition && (
            <VStack align="center" gap={1}>
              <Button
                colorScheme="purple"
                variant="outline"
                isLoading={womSyncing || syncTileProgress.total > 0}
                loadingText={syncTileProgress.total > 0 ? `${syncTileProgress.done} / ${syncTileProgress.total} tiles…` : 'Syncing…'}
                isDisabled={womSyncOnCooldown || womSyncing || globalSyncInProgress}
                onClick={handleWomSync}
              >
                Sync WOM Progress
              </Button>
              <HStack gap={2} justify="center">
                <Text fontSize="xs" color="gray.500" textAlign="center">
                  {womSyncing || globalSyncInProgress
                    ? syncTileProgress.total > 0
                      ? `Checked ${syncTileProgress.done} of ${syncTileProgress.total} tiles — updates rolling in…`
                      : womSyncing
                      ? 'Starting sync…'
                      : 'A sync is currently in progress'
                    : womSyncOnCooldown
                    ? `Available in ${cooldownMinsLeft} minute${cooldownMinsLeft === 1 ? '' : 's'}`
                    : 'Pulls the latest XP and KC from Wise Old Man for your active tiles — has a 15 minute cooldown to avoid rate limiting'}
                </Text>
              </HStack>
            </VStack>
          )}

          <TileProgressOverview tiles={data?.getRainbowTeamBoard ?? []} />

          <TileModal
            tile={selectedTile ? boardMap[selectedTile.tileCode] ?? selectedTile : null}
            onClose={() => setSelectedTile(null)}
          />
        </VStack>

        {isSiteAdmin && process.env.REACT_APP_SHOW_DEV_TOOLS === 'true' && (
          <Box
            position="fixed"
            bottom={4}
            right={4}
            bg="gray.900"
            border="1px solid"
            borderColor="gray.600"
            borderRadius="lg"
            p={3}
            zIndex={100}
            minW="160px"
          >
            <Text
              fontSize="10px"
              color="gray.500"
              fontWeight="bold"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={2}
            >
              Dev tools
            </Text>
            <VStack gap={2} align="stretch">
              <Button
                size="xs"
                colorScheme="blue"
                variant="outline"
                onClick={() => triggerTest('tile')}
              >
                Test tile complete
              </Button>
              <Button
                size="xs"
                colorScheme="yellow"
                variant="outline"
                onClick={() => triggerTest('capstone')}
              >
                Test capstone
              </Button>
              <Button
                size="xs"
                colorScheme="purple"
                variant="outline"
                onClick={() => triggerTest('board')}
              >
                Test board complete
              </Button>
              <Button
                size="xs"
                colorScheme="pink"
                variant="outline"
                onClick={showDragGif}
              >
                Show drag gif
              </Button>
              <Button
                size="xs"
                colorScheme="teal"
                variant="outline"
                onClick={() => setShowProgressPreview(true)}
              >
                Preview progress
              </Button>
              <Button
                size="xs"
                colorScheme="orange"
                variant="outline"
                onClick={() => resetWomCooldown({ variables: { teamId: team.teamId } })}
              >
                Reset WOM cooldown
              </Button>
            </VStack>
          </Box>
        )}
      </Box>
      {celebrationOverlay}
      {dragGif && (
        <Box
          position="fixed"
          inset={0}
          zIndex={9997}
          pointerEvents="none"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="0 16px 64px rgba(0,0,0,0.8)"
            w="min(70vw, 640px)"
          >
            <img src={dragGif} alt="" style={{ width: '100%', display: 'block' }} />
          </Box>
        </Box>
      )}
      <Modal isOpen={showProgressPreview} onClose={() => setShowProgressPreview(false)} size="4xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700" color="white">
          <ModalHeader fontSize="md">Progress overview (mock data)</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <TileProgressOverview tiles={MOCK_PROGRESS_TILES} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => {
          setShowHowToPlay(false);
          setShowIntroVideo(true);
        }}
        eventPassword={eventPassword}
      />
      {showIntroVideo && (
        <Box
          position="fixed"
          inset={0}
          zIndex={9999}
          bg="black"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Box
            as="video"
            src={gladfiuMp4}
            autoPlay
            playsInline
            w="100%"
            h="100%"
            objectFit="contain"
            onEnded={() => setShowIntroVideo(false)}
          />
        </Box>
      )}
    </>
  );
}
