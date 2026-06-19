import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  VStack,
  HStack,
  Heading,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Image,
  Textarea,
  Button,
  Input,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  FormLabel,
  FormControl,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import { useCompletionSound } from '../hooks/useCompletionSound';
import {
  GET_ACTIVE_RAINBOW_EVENT,
  GET_RAINBOW_TILE_DEFS,
  GET_RAINBOW_SUBMISSIONS,
  GET_RAINBOW_EVENT_BOARDS,
  RAINBOW_SUBMISSION_ADDED,
  RAINBOW_SUBMISSION_REVIEWED,
  RAINBOW_EVENT_BOARD_UPDATED,
  REVIEW_RAINBOW_SUBMISSION,
  COMPLETE_RAINBOW_TILE,
  SET_RAINBOW_TILE_PROGRESS,
  UNDO_RAINBOW_TILE_COMPLETE,
} from '../graphql/rainbowBingoOperations';

const COLOR_SCHEME = {
  red: { badge: 'red', label: 'Red' },
  orange: { badge: 'orange', label: 'Orange' },
  yellow: { badge: 'yellow', label: 'Yellow' },
  green: { badge: 'green', label: 'Green' },
  blue: { badge: 'blue', label: 'Blue' },
  indigo: { badge: 'purple', label: 'Indigo' },
  violet: { badge: 'pink', label: 'Violet' },
  capstone: { badge: 'gray', label: 'Capstone' },
};

const COLOR_ORDER = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'violet', 'capstone'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

// ── Single submission row with inline approve/deny ────────────────────────────

function ScreenshotThumb({ url }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Image
        src={url}
        alt="screenshot"
        boxSize="72px"
        objectFit="cover"
        borderRadius="md"
        cursor="pointer"
        flexShrink={0}
        border="1px solid"
        borderColor="gray.600"
        _hover={{ opacity: 0.8 }}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="gray.700">
          <ModalCloseButton color="white" />
          <ModalBody p={4}>
            <Image src={url} alt="screenshot" w="100%" borderRadius="md" objectFit="contain" />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

function SubmissionItem({ sub, onApprove, onDeny, loadingId, guildId }) {
  const [denyReason, setDenyReason] = useState('');
  const [showDeny, setShowDeny] = useState(false);
  const isPending = sub.status === 'PENDING';
  const isApproved = sub.status === 'APPROVED';
  const isDenied = sub.status === 'DENIED';

  return (
    <Box
      bg="gray.850"
      border="1px solid"
      borderColor={isApproved ? 'green.800' : isDenied ? 'red.900' : 'gray.700'}
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" align="flex-start" wrap="wrap" gap={2}>
        <VStack align="flex-start" gap={1} flex={1}>
          <HStack gap={2} wrap="wrap">
            <Badge
              colorScheme={sub.type === 'PRE' ? 'blue' : 'purple'}
              variant="outline"
              fontSize="xs"
            >
              {sub.type === 'PRE' ? 'Pre-screenshot' : 'Final'}
            </Badge>
            <Badge colorScheme={isPending ? 'yellow' : isApproved ? 'green' : 'red'} fontSize="xs">
              {sub.status}
            </Badge>
            {sub.discordUsername && (
              <Text fontSize="xs" color="gray.400" fontWeight="semibold">
                @{sub.discordUsername}
              </Text>
            )}
            {guildId && sub.channelId && sub.discordMessageId && (
              <Text
                as="a"
                href={`https://discord.com/channels/${guildId}/${sub.channelId}/${sub.discordMessageId}`}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="xs"
                color="blue.400"
                _hover={{ textDecoration: 'underline' }}
              >
                View in Discord ↗
              </Text>
            )}
            <Text fontSize="xs" color="gray.500">
              {formatDate(sub.submittedAt)}
            </Text>
          </HStack>
          {isDenied && sub.denialReason && (
            <Text fontSize="xs" color="red.300">
              Reason: {sub.denialReason}
            </Text>
          )}
          {sub.reviewedAt && (
            <Text fontSize="xs" color="gray.600">
              Reviewed {formatDate(sub.reviewedAt)}
            </Text>
          )}
        </VStack>

        <VStack align="flex-end" gap={2} flexShrink={0}>
          {isPending && (
            <>
              <HStack gap={2}>
                <Button
                  size="xs"
                  colorScheme="green"
                  isLoading={loadingId === sub.submissionId + '-approve'}
                  onClick={() => onApprove(sub.submissionId)}
                >
                  Approve
                </Button>
                <Button
                  size="xs"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setShowDeny((v) => !v)}
                >
                  Deny
                </Button>
              </HStack>
              {showDeny && (
                <VStack align="stretch" gap={2} w="220px">
                  <Textarea
                    placeholder="Reason (optional)"
                    value={denyReason}
                    onChange={(e) => setDenyReason(e.target.value)}
                    size="sm"
                    rows={2}
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                  />
                  <Button
                    size="xs"
                    colorScheme="red"
                    isLoading={loadingId === sub.submissionId + '-deny'}
                    onClick={() => {
                      onDeny(sub.submissionId, denyReason);
                      setShowDeny(false);
                    }}
                  >
                    Confirm Deny
                  </Button>
                </VStack>
              )}
            </>
          )}
          {isDenied && (
            <Button
              size="xs"
              colorScheme="green"
              variant="ghost"
              isLoading={loadingId === sub.submissionId + '-approve'}
              onClick={() => onApprove(sub.submissionId)}
            >
              Re-approve
            </Button>
          )}
        </VStack>
      </HStack>
      {sub.screenshotUrl && (
        <Box mt={3}>
          <ScreenshotThumb url={sub.screenshotUrl} />
        </Box>
      )}
    </Box>
  );
}

// ── Section within a group: pending shown, reviewed collapsed ─────────────────

function SubSection({ label, labelColor, subs, onApprove, onDeny, loadingId, guildId }) {
  const pending = subs.filter((s) => s.status === 'PENDING');
  const reviewed = subs.filter((s) => s.status !== 'PENDING');

  return (
    <Box>
      <Text
        fontSize="xs"
        color={labelColor}
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
      >
        {label} ({subs.length})
      </Text>
      <VStack align="stretch" gap={2}>
        {pending.map((s) => (
          <SubmissionItem
            key={s.submissionId}
            sub={s}
            onApprove={onApprove}
            onDeny={onDeny}
            loadingId={loadingId}
            guildId={guildId}
          />
        ))}
      </VStack>
      {reviewed.length > 0 && (
        <Accordion allowToggle mt={pending.length > 0 ? 2 : 0}>
          <AccordionItem border="none">
            <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }} color="gray.500">
              <AccordionIcon mr={1} />
              <Text fontSize="xs">Show reviewed ({reviewed.length})</Text>
            </AccordionButton>
            <AccordionPanel px={0} pb={0}>
              <VStack align="stretch" gap={2}>
                {reviewed.map((s) => (
                  <SubmissionItem
                    key={s.submissionId}
                    sub={s}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    loadingId={loadingId}
                    guildId={guildId}
                  />
                ))}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}
    </Box>
  );
}

// ── Completed tile row with undo ──────────────────────────────────────────────

function CompletedTileRow({ tile, onUndo }) {
  const [confirming, setConfirming] = useState(false);
  const cs = COLOR_SCHEME[tile.tileDef?.color ?? 'capstone'] ?? COLOR_SCHEME.capstone;
  return (
    <HStack justify="space-between" px={2} py={1} borderRadius="md" _hover={{ bg: 'gray.800' }}>
      <HStack gap={3} wrap="wrap">
        <Badge colorScheme={cs.badge} fontSize="sm" px={2} py={0.5} fontWeight="bold">
          {tile.tileCode}
        </Badge>
        <Text fontSize="sm" color="gray.200">
          {tile.tileDef?.bossOrSkill ?? tile.tileCode}
        </Text>
        <Badge colorScheme="gray" variant="outline" fontSize="xs">
          {tile.teamName}
        </Badge>
      </HStack>
      {confirming ? (
        <HStack gap={2} flexShrink={0}>
          <Button
            size="xs"
            colorScheme="orange"
            onClick={() => {
              setConfirming(false);
              onUndo(tile.teamId, tile.tileCode);
            }}
          >
            Confirm Undo
          </Button>
          <Button size="xs" variant="ghost" colorScheme="gray" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </HStack>
      ) : onUndo ? (
        <Button
          size="xs"
          colorScheme="orange"
          variant="outline"
          flexShrink={0}
          onClick={() => setConfirming(true)}
        >
          Undo
        </Button>
      ) : (
        <Tooltip
          label="Only the most recently completed tile per team can be undone, to avoid breaking the unlock chain."
          placement="left"
          hasArrow
        >
          <Button size="xs" colorScheme="orange" variant="outline" flexShrink={0} isDisabled>
            Undo
          </Button>
        </Tooltip>
      )}
    </HStack>
  );
}

// ── Progress editor ───────────────────────────────────────────────────────────

function TileProgressEditor({ teamId, tileCode, progress, tileDef, onSave }) {
  const hasMetric = tileDef?.metricTarget != null && tileDef.metricTarget > 0;
  const max = hasMetric ? tileDef.metricTarget : 100;
  const unit = hasMetric ? tileDef.metricUnit ?? '' : '%';
  const step = 1;

  const rawFromPct = (pct) => (hasMetric ? Math.round((pct / 100) * max) : pct);
  const pctFromRaw = (raw) => (hasMetric ? Math.round((raw / max) * 100) : raw);

  const [val, setVal] = useState(() => rawFromPct(progress));
  React.useEffect(() => {
    setVal(rawFromPct(progress));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  const clampedRaw = Math.max(0, Math.min(max, Number(val) || 0));
  const pct = pctFromRaw(clampedRaw);
  const color = pct >= 100 ? 'green' : 'blue';

  const commitInput = () => onSave(teamId, tileCode, pct);

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          color="gray.400"
          fontWeight="semibold"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          Progress
        </Text>
        <HStack gap={2}>
          <Input
            type="number"
            min={0}
            max={max}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commitInput}
            onKeyDown={(e) => e.key === 'Enter' && commitInput()}
            size="xs"
            w="70px"
            bg="gray.700"
            borderColor="gray.600"
            color="white"
            textAlign="center"
          />
          <Text fontSize="xs" color="gray.400">
            {unit}
          </Text>
          {hasMetric && (
            <Text fontSize="xs" color="gray.600">
              / {max}
            </Text>
          )}
        </HStack>
      </HStack>
      <Slider
        min={0}
        max={max}
        step={step}
        value={clampedRaw}
        onChange={(v) => setVal(v)}
        onChangeEnd={(v) => onSave(teamId, tileCode, pctFromRaw(v))}
        focusThumbOnChange={false}
      >
        <SliderTrack bg="gray.700" h="8px" borderRadius="full">
          <SliderFilledTrack bg={`${color}.400`} />
        </SliderTrack>
        <SliderThumb boxSize={5} bg={`${color}.300`} />
      </Slider>
    </Box>
  );
}

// ── Group: all submissions for one tile+team combo ────────────────────────────

function TileGroup({
  group,
  tileDef,
  tileStatus,
  tileProgress,
  onApprove,
  onDeny,
  onComplete,
  onSetProgress,
  loadingId,
  guildId,
}) {
  const { tileCode, teamId, teamName, subs } = group;
  const [confirming, setConfirming] = useState(false);
  const STATUS_ORDER = { PENDING: 0, APPROVED: 1, DENIED: 2 };
  const sortSubs = (arr) =>
    [...arr].sort((a, b) => {
      const statusDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  const pre = sortSubs(subs.filter((s) => s.type === 'PRE'));
  const final = sortSubs(subs.filter((s) => s.type === 'FINAL'));
  const pendingCount = subs.filter((s) => s.status === 'PENDING').length;
  const approvedFinal = final.filter((s) => s.status === 'APPROVED');
  const isComplete = tileStatus === 'COMPLETE';
  const progress = tileProgress ?? 0;
  const canComplete = approvedFinal.length > 0 && !isComplete && progress >= 100;
  const color = tileDef?.color ?? 'capstone';
  const cs = COLOR_SCHEME[color] ?? COLOR_SCHEME.capstone;

  return (
    <AccordionItem
      border="1px solid"
      borderColor={pendingCount > 0 ? 'yellow.700' : 'gray.700'}
      borderRadius="md"
      mb={2}
    >
      <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
        <HStack flex={1} gap={3} wrap="wrap" align="center" mr={2}>
          <Badge colorScheme={cs.badge} fontSize="sm" px={2} py={0.5} fontWeight="bold">
            {tileCode}
          </Badge>
          <Text color="white" fontSize="sm" fontWeight="semibold">
            {tileDef?.bossOrSkill ?? tileCode}
          </Text>
          <Badge colorScheme="gray" variant="outline" fontSize="xs">
            {teamName}
          </Badge>
          {pendingCount > 0 && (
            <Badge colorScheme="yellow" borderRadius="full" fontSize="xs">
              {pendingCount} pending
            </Badge>
          )}
          {progress > 0 && progress < 100 && (
            <Badge colorScheme="blue" variant="outline" fontSize="xs">
              {tileDef?.metricTarget
                ? `${Math.round((progress / 100) * tileDef.metricTarget)} / ${
                    tileDef.metricTarget
                  } ${tileDef.metricUnit ?? ''}`
                : `${progress}%`}
            </Badge>
          )}
        </HStack>
        {approvedFinal.length > 0 &&
          !isComplete &&
          (confirming ? (
            <HStack mr={3} flexShrink={0} onClick={(e) => e.stopPropagation()}>
              <Button
                size="xs"
                colorScheme="green"
                isLoading={loadingId === teamId + '-' + tileCode + '-complete'}
                onClick={() => {
                  setConfirming(false);
                  onComplete(teamId, tileCode);
                }}
              >
                Confirm
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </HStack>
          ) : (
            <Button
              size="sm"
              colorScheme="green"
              variant="solid"
              mr={3}
              flexShrink={0}
              isDisabled={!canComplete}
              title={progress < 100 ? 'Set progress to the full metric value first' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
            >
              Mark Node Complete
            </Button>
          ))}
        {isComplete && (
          <HStack mr={3} flexShrink={0} spacing={1}>
            <Text fontSize="sm" color="green.400" fontWeight="semibold">
              ✅ Completed
            </Text>
          </HStack>
        )}
        <AccordionIcon color="gray.400" />
      </AccordionButton>

      <AccordionPanel px={4} pb={4}>
        <VStack align="stretch" gap={4}>
          {tileDef?.metricLabel && (
            <Box bg="whiteAlpha.50" borderRadius="md" px={3} py={2}>
              <Text
                fontSize="xs"
                color="gray.400"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={0.5}
              >
                Goal
              </Text>
              <Text fontSize="sm" color="white" fontWeight="semibold">
                {tileDef.metricLabel}
              </Text>
              {tileDef.validDrops?.length > 0 && (
                <HStack wrap="wrap" gap={1.5} mt={2}>
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
              )}
            </Box>
          )}
          <TileProgressEditor
            teamId={teamId}
            tileCode={tileCode}
            progress={progress}
            tileDef={tileDef}
            onSave={onSetProgress}
          />
          <Divider borderColor="gray.700" />
          {pre.length > 0 && (
            <SubSection
              label="📸 Pre-screenshots"
              labelColor="blue.300"
              subs={pre}
              onApprove={onApprove}
              onDeny={onDeny}
              loadingId={loadingId}
              guildId={guildId}
            />
          )}
          {pre.length > 0 && final.length > 0 && <Divider borderColor="gray.700" />}
          {final.length > 0 && (
            <SubSection
              label="🏆 Final submissions"
              labelColor="purple.300"
              subs={final}
              onApprove={onApprove}
              onDeny={onDeny}
              loadingId={loadingId}
              guildId={guildId}
            />
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RainbowRefsPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const { showToast } = useToastContext();
  const { playSubmissionReceived } = useCompletionSound();
  const [loadingId, setLoadingId] = useState(null);
  const [pendingNewSubs, setPendingNewSubs] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioUnlockedRef = useRef(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (localStorage.getItem('rainbowRefs_sound_enabled') === 'true') setSoundEnabled(true);
    if (
      localStorage.getItem('rainbowRefs_notif_enabled') === 'true' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      setNotifEnabled(true);
    }
  }, []);

  const handleEnableSound = useCallback(() => {
    audioUnlockedRef.current = true;
    setSoundEnabled(true);
    localStorage.setItem('rainbowRefs_sound_enabled', 'true');
    playSubmissionReceived();
  }, [playSubmissionReceived]);

  const handleDisableSound = useCallback(() => {
    setSoundEnabled(false);
    localStorage.setItem('rainbowRefs_sound_enabled', 'false');
  }, []);

  const handleToggleNotif = useCallback(async () => {
    if (notifEnabled) {
      setNotifEnabled(false);
      localStorage.setItem('rainbowRefs_notif_enabled', 'false');
      return;
    }
    if (typeof Notification === 'undefined') return;
    let perm = notifPermission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setNotifPermission(perm);
    }
    if (perm === 'granted') {
      setNotifEnabled(true);
      localStorage.setItem('rainbowRefs_notif_enabled', 'true');
      new Notification('Rainbow Bingo Refs', {
        body: 'Desktop notifications enabled',
        icon: '/favicon.ico',
      });
    }
  }, [notifEnabled, notifPermission]);

  const fireNotif = useCallback(
    (title, body) => {
      if (!notifEnabled || notifPermission !== 'granted') return;
      try {
        const n = new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: 'rainbow-submission',
        });
        n.onclick = () => {
          window.focus();
          n.close();
        };
      } catch (_) {}
    },
    [notifEnabled, notifPermission]
  );

  // Track pending count across tab visibility changes so we can play sound on return
  const prevPendingRef = useRef(0);

  const { data: eventData, loading: eventLoading } = useQuery(GET_ACTIVE_RAINBOW_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  const { data: tileDefs, loading: tilesLoading } = useQuery(GET_RAINBOW_TILE_DEFS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-first',
  });

  const event = eventData?.getActiveRainbowEvent;
  const isAdmin = !!(user?.admin || (event?.adminIds && event.adminIds.includes(String(user?.id))));

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_RAINBOW_SUBMISSIONS, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId || !isAdmin,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5 * 60 * 1000,
  });

  const { data: boardsData, refetch: refetchBoards } = useQuery(GET_RAINBOW_EVENT_BOARDS, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId || !isAdmin,
    fetchPolicy: 'cache-and-network',
    pollInterval: 5 * 60 * 1000,
  });

  const { tileStatusMap, tileProgressMap, completedTilesList, latestCompletedKeys } =
    useMemo(() => {
      const statusMap = {};
      const progressMap = {};
      const completed = [];
      (boardsData?.getRainbowTeams ?? []).forEach((team) => {
        (team.tiles ?? []).forEach((tile) => {
          const key = `${tile.tileCode}_${team.teamId}`;
          statusMap[key] = tile.status;
          progressMap[key] = tile.progress ?? 0;
          if (tile.status === 'COMPLETE') {
            completed.push({
              teamId: team.teamId,
              teamName: team.teamName,
              tileCode: tile.tileCode,
              tileDef: tile.tileDef,
              completedAt: tile.completedAt,
            });
          }
        });
      });
      // Find most recently completed tile per team
      const latestByTeam = {};
      completed.forEach((t) => {
        if (!latestByTeam[t.teamId] || t.completedAt > latestByTeam[t.teamId].completedAt) {
          latestByTeam[t.teamId] = t;
        }
      });
      const latestKeys = new Set(
        Object.values(latestByTeam).map((t) => `${t.tileCode}_${t.teamId}`)
      );
      return {
        tileStatusMap: statusMap,
        tileProgressMap: progressMap,
        completedTilesList: completed,
        latestCompletedKeys: latestKeys,
      };
    }, [boardsData]);

  useSubscription(RAINBOW_SUBMISSION_ADDED, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId || !isAdmin,
    onData: ({ data: subData }) => {
      setPendingNewSubs((n) => n + 1);
      const sub = subData?.data?.rainbowSubmissionAdded;
      const label = sub
        ? `${sub.team?.teamName ?? 'A team'} — ${sub.tileCode} (${
            sub.type === 'PRE' ? 'pre-screenshot' : 'final'
          })`
        : 'New submission';
      if (soundEnabled) playSubmissionReceived();
      fireNotif('New Rainbow Bingo submission', label);
    },
  });

  useSubscription(RAINBOW_SUBMISSION_REVIEWED, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId || !isAdmin,
    onData: () => refetchSubs(),
  });

  useSubscription(RAINBOW_EVENT_BOARD_UPDATED, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId || !isAdmin,
    onData: () => refetchBoards(),
  });

  const [reviewSubmission] = useMutation(REVIEW_RAINBOW_SUBMISSION, {
    onCompleted: () => {
      refetchSubs();
      setLoadingId(null);
    },
    onError: (e) => {
      showToast(e.message, 'error');
      setLoadingId(null);
    },
  });

  const [completeTile] = useMutation(COMPLETE_RAINBOW_TILE, {
    onCompleted: () => {
      refetchSubs();
      refetchBoards();
      setLoadingId(null);
      showToast('Tile completed!', 'success');
    },
    onError: (e) => {
      showToast(e.message, 'error');
      setLoadingId(null);
    },
  });

  const [setTileProgress] = useMutation(SET_RAINBOW_TILE_PROGRESS, {
    onCompleted: () => refetchBoards(),
    onError: (e) => showToast(e.message, 'error'),
  });

  const [undoTileComplete] = useMutation(UNDO_RAINBOW_TILE_COMPLETE, {
    onCompleted: () => {
      refetchBoards();
      refetchSubs();
      showToast('Completion undone', 'info');
    },
    onError: (e) => showToast(e.message, 'error'),
  });

  const tileDefMap = useMemo(() => {
    const defs = tileDefs?.getRainbowTileDefs ?? [];
    return Object.fromEntries(defs.map((t) => [t.tileCode, t]));
  }, [tileDefs]);

  const groups = useMemo(() => {
    const allSubs = subsData?.getRainbowSubmissions ?? [];
    const map = {};
    allSubs.forEach((sub) => {
      const key = `${sub.tileCode}_${sub.teamId}`;
      if (!map[key])
        map[key] = {
          tileCode: sub.tileCode,
          teamId: sub.teamId,
          teamName: sub.team?.teamName ?? sub.teamId,
          subs: [],
        };
      map[key].subs.push(sub);
    });
    return Object.values(map)
      .filter((g) => tileStatusMap[`${g.tileCode}_${g.teamId}`] !== 'COMPLETE')
      .sort((a, b) => {
        const latestPending = (g) =>
          g.subs
            .filter((s) => s.status === 'PENDING')
            .reduce((max, s) => Math.max(max, new Date(s.submittedAt).getTime()), 0);
        const diff = latestPending(b) - latestPending(a);
        if (diff !== 0) return diff;
        return a.tileCode.localeCompare(b.tileCode);
      });
  }, [subsData, tileStatusMap]);

  // Stable group order — snapshot on first load, only reset when ref manually loads.
  // This prevents the list from re-sorting while a ref is mid-review.
  const [stableGroupOrder, setStableGroupOrder] = useState(null);
  useEffect(() => {
    if (stableGroupOrder === null && groups.length > 0) {
      setStableGroupOrder(groups.map((g) => `${g.tileCode}_${g.teamId}`));
    }
  }, [groups, stableGroupOrder]);

  const sortedGroups = useMemo(() => {
    if (!stableGroupOrder) return groups;
    const keyToGroup = Object.fromEntries(groups.map((g) => [`${g.tileCode}_${g.teamId}`, g]));
    const ordered = stableGroupOrder.map((k) => keyToGroup[k]).filter(Boolean);
    const brandNew = groups.filter((g) => !stableGroupOrder.includes(`${g.tileCode}_${g.teamId}`));
    return [...brandNew, ...ordered];
  }, [groups, stableGroupOrder]);

  const pendingCount = useMemo(
    () => groups.reduce((sum, g) => sum + g.subs.filter((s) => s.status === 'PENDING').length, 0),
    [groups]
  );

  useEffect(() => {
    document.title =
      pendingCount > 0 ? `(${pendingCount}) Rainbow Bingo Refs` : 'Rainbow Bingo Refs';
    return () => {
      document.title = 'OSRS Bingo Hub';
    };
  }, [pendingCount]);

  // Refetch on tab focus/visibility; play sound if new pending items arrived while away
  useEffect(() => {
    if (!isAdmin) return;
    const refetchAll = () => {
      refetchSubs();
      refetchBoards();
    };
    const onFocus = () => refetchAll();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refetchAll();
      }
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAdmin, refetchSubs, refetchBoards]);

  useEffect(() => {
    if (soundEnabled && pendingCount > prevPendingRef.current) {
      playSubmissionReceived();
    }
    prevPendingRef.current = pendingCount;
  }, [pendingCount, soundEnabled, playSubmissionReceived]);

  const handleApprove = (submissionId) => {
    setLoadingId(submissionId + '-approve');
    reviewSubmission({ variables: { submissionId, approved: true } });
  };
  const handleDeny = (submissionId, denialReason) => {
    setLoadingId(submissionId + '-deny');
    reviewSubmission({
      variables: { submissionId, approved: false, denialReason: denialReason || null },
    });
  };
  const handleComplete = (teamId, tileCode) => {
    setLoadingId(teamId + '-' + tileCode + '-complete');
    completeTile({ variables: { teamId, tileCode } });
  };
  const handleSetProgress = (teamId, tileCode, progress) => {
    setTileProgress({ variables: { teamId, tileCode, progress } });
  };
  const handleUndo = (teamId, tileCode) => {
    undoTileComplete({ variables: { teamId, tileCode } });
  };

  if (isCheckingAuth || eventLoading) {
    return (
      <Center h="60vh">
        <Spinner size="xl" color="purple.400" />
      </Center>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <Center h="60vh">
        <VStack>
          <Text fontSize="2xl">🔒</Text>
          <Text color="gray.400">You don't have access to this page.</Text>
        </VStack>
      </Center>
    );
  }

  const tiles = tileDefs?.getRainbowTileDefs ?? [];
  const byColor = COLOR_ORDER.reduce((acc, color) => {
    acc[color] = tiles.filter((t) => t.color === color).sort((a, b) => a.colorIndex - b.colorIndex);
    return acc;
  }, {});

  const handleLoadNewSubs = () => {
    setPendingNewSubs(0);
    setStableGroupOrder(null);
    refetchSubs();
  };

  return (
    <Box minH="100vh" bg="gray.900" color="white" pt="56px" pb={6} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" gap={6} maxW="1100px" mx="auto">
        <HStack justify="space-between" align="flex-start" wrap="wrap" gap={3}>
          <VStack align="flex-start" gap={1}>
            <HStack gap={3} align="center">
              <Heading
                size="lg"
                bgGradient="linear(to-r, red.400, orange.400, yellow.300, green.400, blue.400, purple.400, pink.400)"
                bgClip="text"
              >
                Rainbow Bingo: Refs
              </Heading>
              {pendingCount > 0 && (
                <Badge colorScheme="yellow" borderRadius="full" fontSize="sm" px={2} py={0.5}>
                  {pendingCount} pending
                </Badge>
              )}
            </HStack>
            {event && (
              <Text color="gray.400" fontSize="sm">
                pw: {event.eventName}
              </Text>
            )}
          </VStack>
          <HStack gap={2}>
            <FormControl display="flex" alignItems="center" gap={2} w="auto">
              <Switch
                id="sound-toggle"
                colorScheme="green"
                isChecked={soundEnabled}
                onChange={soundEnabled ? handleDisableSound : handleEnableSound}
              />
              <FormLabel
                htmlFor="sound-toggle"
                mb={0}
                fontSize="sm"
                color="gray.300"
                cursor="pointer"
              >
                Sound
              </FormLabel>
            </FormControl>
            <FormControl display="flex" alignItems="center" gap={2} w="auto">
              <Switch
                id="notif-toggle"
                colorScheme="blue"
                isChecked={notifEnabled}
                isDisabled={notifPermission === 'denied'}
                onChange={handleToggleNotif}
              />
              <FormLabel
                htmlFor="notif-toggle"
                mb={0}
                fontSize="sm"
                color={notifPermission === 'denied' ? 'gray.600' : 'gray.300'}
                cursor={notifPermission === 'denied' ? 'not-allowed' : 'pointer'}
                title={
                  notifPermission === 'denied'
                    ? 'Notifications blocked in browser settings'
                    : undefined
                }
              >
                Notify
              </FormLabel>
            </FormControl>
            <Button as={RouterLink} to="/eg-rainbow" size="sm" colorScheme="purple" variant="ghost">
              Main Bingo Page
            </Button>
          </HStack>
        </HStack>

        {/* Submission groups */}
        <Box>
          <HStack mb={3} gap={2}>
            <Heading size="sm" color="gray.300">
              Submissions
            </Heading>
            {sortedGroups.length > 0 && (
              <Badge colorScheme="purple" borderRadius="full">
                {sortedGroups.length} tile{sortedGroups.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </HStack>

          <Box
            bg="whiteAlpha.50"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="lg"
            p={4}
            mb={4}
            fontSize="sm"
            color="gray.300"
          >
            <Text fontWeight="semibold" color="white" mb={2}>
              How reffing works
            </Text>
            <VStack align="stretch" gap={2}>
              <Text>
                Submissions come in automatically from Discord. Open a tile to see what the team
                submitted and check it against the tile's{' '}
                <Text as="span" color="white" fontWeight="semibold">
                  Goal
                </Text>
                .
              </Text>
              <Text>
                <Text as="span" color="blue.300" fontWeight="semibold">
                  Pre-screenshots
                </Text>{' '}
                are submitted before a tile is started, they prove the team's starting state (i.e.
                kc or xp before training). Approve them as long as they show a reasonable baseline
                and the event password.
              </Text>
              <Text>
                <Text as="span" color="purple.300" fontWeight="semibold">
                  Final submissions
                </Text>{' '}
                are the completion proof. Review these carefully against the goal, ensure the event
                password and proof is in the screenshot. At least one approved final submission is
                required before you can mark a tile complete.
              </Text>
              <Text>
                Before marking complete, use the slider to set the{' '}
                <Text as="span" color="white" fontWeight="semibold">
                  progress to the tile's full metric value
                </Text>
                . The Complete Tile button will be locked until progress is at 100% and a final
                submission is approved.
              </Text>
              <Text>
                <Text as="span" color="green.300" fontWeight="semibold">
                  Marking a node complete
                </Text>{' '}
                is the last step to reward the team the point(s) associated with the tile, and to
                allow them to progress further down that color's path. Don't forget to do this after
                setting the progress to 100%! :)
              </Text>
            </VStack>
          </Box>

          {pendingNewSubs > 0 && (
            <Box
              px={4}
              py={2}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              onClick={handleLoadNewSubs}
              sx={{
                '@keyframes rainbowWave': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
                background: '#1fb7af',
                transition: 'background 0.2s',
                '&:hover': {
                  background:
                    'linear-gradient(270deg, #cc3333, #cc7711, #b89400, #2d9940, #1466dd, #7722cc, #cc3333)',
                  backgroundSize: '300% 300%',
                  animation: 'rainbowWave 1.8s ease infinite',
                },
              }}
            >
              <Text fontSize="sm" fontWeight="semibold" color="white">
                {pendingNewSubs} new submission{pendingNewSubs !== 1 ? 's' : ''} — click to load
              </Text>
            </Box>
          )}

          {!event && (
            <Text color="gray.500" fontSize="sm">
              No active event.
            </Text>
          )}

          {event && sortedGroups.length === 0 && (
            <Center py={8}>
              <Text color="gray.500">No submissions yet.</Text>
            </Center>
          )}

          {sortedGroups.length > 0 && (
            <Accordion
              allowMultiple
              defaultIndex={sortedGroups
                .map((_, i) => i)
                .filter((i) => sortedGroups[i].subs.some((s) => s.status === 'PENDING'))}
            >
              {sortedGroups.map((group) => (
                <TileGroup
                  key={`${group.tileCode}_${group.teamId}`}
                  group={group}
                  tileDef={tileDefMap[group.tileCode]}
                  tileStatus={tileStatusMap[`${group.tileCode}_${group.teamId}`]}
                  tileProgress={tileProgressMap[`${group.tileCode}_${group.teamId}`]}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onComplete={handleComplete}
                  onSetProgress={handleSetProgress}
                  loadingId={loadingId}
                  guildId={event?.guildId}
                />
              ))}
            </Accordion>
          )}
        </Box>

        {completedTilesList.length > 0 && (
          <>
            <Divider borderColor="gray.700" />
            <Box>
              <Accordion allowToggle>
                <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="md" mb={2}>
                  <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                    <HStack flex={1} gap={2}>
                      <Heading size="sm" color="gray.300">
                        Completion Log
                      </Heading>
                      <Badge colorScheme="green" borderRadius="full">
                        {completedTilesList.length}
                      </Badge>
                    </HStack>
                    <AccordionIcon color="gray.400" />
                  </AccordionButton>
                  <AccordionPanel px={4} pb={4}>
                    <VStack align="stretch" gap={1}>
                      {[...completedTilesList]
                        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
                        .map((t) => (
                          <HStack
                            key={`log_${t.tileCode}_${t.teamId}`}
                            gap={3}
                            py={1.5}
                            borderBottom="1px solid"
                            borderColor="whiteAlpha.50"
                            fontSize="sm"
                          >
                            <Text color="gray.500" fontSize="xs" flexShrink={0} w="120px">
                              {formatDate(t.completedAt)}
                            </Text>
                            <Badge
                              colorScheme={COLOR_SCHEME[t.tileDef?.color ?? 'capstone']?.badge ?? 'gray'}
                              flexShrink={0}
                            >
                              {t.tileCode}
                            </Badge>
                            <Text color="gray.300" flex={1} noOfLines={1}>
                              {t.tileDef?.bossOrSkill ?? t.tileCode}
                            </Text>
                            <Text color="gray.400" flexShrink={0} fontWeight="semibold">
                              {t.teamName}
                            </Text>
                          </HStack>
                        ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            <Box>
              <Accordion allowToggle>
                <AccordionItem border="1px solid" borderColor="gray.700" borderRadius="md">
                  <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                    <HStack flex={1} gap={2}>
                      <Heading size="sm" color="gray.300">
                        Completed Tiles
                      </Heading>
                      <Badge colorScheme="green" borderRadius="full">
                        {completedTilesList.length}
                      </Badge>
                    </HStack>
                    <AccordionIcon color="gray.400" />
                  </AccordionButton>
                  <AccordionPanel px={4} pb={4}>
                    <VStack align="stretch" gap={2}>
                      {completedTilesList.map((t) => (
                        <CompletedTileRow
                          key={`${t.tileCode}_${t.teamId}`}
                          tile={t}
                          onUndo={
                            latestCompletedKeys.has(`${t.tileCode}_${t.teamId}`)
                              ? handleUndo
                              : undefined
                          }
                        />
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </>
        )}

        <Divider borderColor="gray.700" />

        {/* Tile reference — collapsed */}
        <Box>
          <Heading size="sm" color="gray.300" mb={3}>
            Tile Reference
          </Heading>
          {tilesLoading ? (
            <Center py={6}>
              <Spinner color="purple.400" />
            </Center>
          ) : (
            <Accordion allowMultiple borderColor="gray.700">
              {COLOR_ORDER.map((color) => {
                const group = byColor[color];
                if (!group?.length) return null;
                const cs = COLOR_SCHEME[color];
                return (
                  <AccordionItem
                    key={color}
                    border="1px solid"
                    borderColor="gray.700"
                    borderRadius="md"
                    mb={2}
                  >
                    <AccordionButton px={4} py={3} _hover={{ bg: 'gray.800' }} borderRadius="md">
                      <Box flex={1} textAlign="left">
                        <HStack gap={2}>
                          <Badge colorScheme={cs.badge} fontSize="sm" px={2} py={0.5}>
                            {cs.label}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {group.length} tiles
                          </Text>
                        </HStack>
                      </Box>
                      <AccordionIcon color="gray.400" />
                    </AccordionButton>
                    <AccordionPanel px={4} pb={4}>
                      <Box overflowX="auto">
                        <Table size="sm" variant="simple">
                          <Thead>
                            <Tr>
                              <Th color="gray.400" w="50px">
                                Code
                              </Th>
                              <Th color="gray.400">Boss / Skill</Th>
                              <Th color="gray.400">Metric</Th>
                              <Th color="gray.400" isNumeric>
                                ~Hours
                              </Th>
                              <Th color="gray.400">Theme</Th>
                              <Th color="gray.400">Fun Name</Th>
                              <Th color="gray.400">Notes</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {group.map((tile) => (
                              <Tr key={tile.tileCode} _hover={{ bg: 'gray.800' }}>
                                <Td>
                                  <Badge colorScheme={cs.badge} variant="outline" fontSize="xs">
                                    {tile.tileCode}
                                  </Badge>
                                </Td>
                                <Td color="white" fontWeight="medium">
                                  {tile.bossOrSkill}
                                </Td>
                                <Td color="gray.300">{tile.metricLabel}</Td>
                                <Td isNumeric color="gray.400">
                                  {tile.hoursEstimate ?? '—'}
                                </Td>
                                <Td color="gray.400">{tile.theme ?? '—'}</Td>
                                <Td color="pink.300" fontStyle={tile.funName ? 'italic' : 'normal'}>
                                  {tile.funName ?? '—'}
                                </Td>
                                <Td
                                  color="gray.500"
                                  fontSize="xs"
                                  maxW="200px"
                                  whiteSpace="pre-wrap"
                                >
                                  {tile.notes ?? '—'}
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </AccordionPanel>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </Box>
      </VStack>
    </Box>
  );
}
