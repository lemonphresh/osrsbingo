import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Link as RouterLink, useParams } from 'react-router-dom';
import { useMutation, useQuery, useSubscription } from '@apollo/client';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Center,
  Divider,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spinner,
  Switch,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';
import { isBattleshipEnabled } from '../../config/featureFlags';
import { useToastContext } from '../../providers/ToastProvider';
import {
  GET_BS_EVENT,
  GET_BS_SUBMISSIONS,
  REVIEW_BS_SUBMISSION,
  COMPLETE_BS_TILE,
  SET_BS_TILE_PROGRESS,
  BS_SUBMISSION_ADDED,
  BS_SUBMISSION_REVIEWED,
} from '../../graphql/bsOperations';
import {
  playSubmissionIncoming,
  playSubmissionApproved,
  playSubmissionDenied,
  warmUpAudio,
} from '../../utils/soundEngine';

const GREEN = '#4ade80';
const DIM = '#6b9e78';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function coordLabel(row, col) {
  if (row == null || col == null) return '?';
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

// ── Progress slider ────────────────────────────────────────────────────────

function TileProgressSlider({ tileId, initialProgress, onSave }) {
  const [val, setVal] = useState(initialProgress ?? 0);

  useEffect(() => {
    setVal(initialProgress ?? 0);
  }, [initialProgress]);

  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text
          fontSize="xs"
          color={DIM}
          textTransform="uppercase"
          letterSpacing="wider"
          fontWeight="semibold"
        >
          Progress
        </Text>
        <Text fontSize="xs" color={val >= 100 ? '#4ade80' : '#22d3ee'} fontWeight="bold">
          {val}%
        </Text>
      </HStack>
      <Slider
        min={0}
        max={100}
        step={1}
        value={val}
        onChange={setVal}
        onChangeEnd={(v) => onSave(tileId, v)}
        focusThumbOnChange={false}
      >
        <SliderTrack bg="#1a4028" h="6px" borderRadius="full">
          <SliderFilledTrack bg={val >= 100 ? '#4ade80' : '#22d3ee'} />
        </SliderTrack>
        <SliderThumb boxSize={4} bg={val >= 100 ? '#4ade80' : '#22d3ee'} />
      </Slider>
    </Box>
  );
}

// ── Submission card ────────────────────────────────────────────────────────

function SubmissionCard({ sub, onApprove, onDeny, loadingId, guildId, colorblindMode }) {
  const [denying, setDenying] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const isPending = sub.status === 'PENDING';
  const isApproved = sub.status === 'APPROVED';
  const isDenied = sub.status === 'DENIED';
  const subLoadKey = sub.submissionId;

  const borderColor = isDenied
    ? colorblindMode
      ? '#78350f'
      : '#7f1d1d'
    : isApproved
    ? colorblindMode
      ? '#1e3a8a'
      : '#14532d'
    : '#1a4028';

  const badgeScheme = isPending
    ? 'yellow'
    : isApproved
    ? colorblindMode
      ? 'blue'
      : 'green'
    : colorblindMode
    ? 'orange'
    : 'red';

  return (
    <Box bg="#091a10" border="1px solid" borderColor={borderColor} borderRadius="md" p={3}>
      <HStack justify="space-between" align="flex-start" mb={2}>
        <VStack align="flex-start" spacing={0.5} flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Badge colorScheme={badgeScheme} fontSize="xs">
              {sub.status}
            </Badge>
            {sub.discordUsername && (
              <Text fontSize="xs" color={DIM} fontWeight="semibold">
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
                color="#22d3ee"
                _hover={{ textDecoration: 'underline' }}
              >
                View in Discord ↗
              </Text>
            )}
            <Text fontSize="xs" color={DIM}>
              {formatTime(sub.submittedAt)}
            </Text>
          </HStack>
          {isDenied && sub.denialReason && (
            <Text fontSize="xs" color="#fca5a5" mt={1}>
              Reason: {sub.denialReason}
            </Text>
          )}
        </VStack>

        <HStack spacing={2} flexShrink={0}>
          {sub.screenshotUrl && (
            <Button
              as="a"
              href={sub.screenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="outline"
              borderColor="#1a4028"
              color={DIM}
              _hover={{ borderColor: GREEN, color: GREEN }}
            >
              Screenshot
            </Button>
          )}
        </HStack>
      </HStack>

      {isDenied && (
        <Button
          size="xs"
          colorScheme="green"
          variant="ghost"
          isLoading={loadingId === subLoadKey + '-approve'}
          onClick={() => onApprove(sub.submissionId)}
        >
          Re-approve
        </Button>
      )}

      {isPending && !denying && (
        <HStack spacing={2} justify="flex-end">
          <Button
            size="xs"
            variant="outline"
            colorScheme="red"
            onClick={() => setDenying(true)}
            isDisabled={!!loadingId}
          >
            Deny
          </Button>
          <Button
            size="xs"
            colorScheme="green"
            isLoading={loadingId === subLoadKey + '-approve'}
            isDisabled={!!loadingId && loadingId !== subLoadKey + '-approve'}
            onClick={() => onApprove(sub.submissionId)}
          >
            Approve
          </Button>
        </HStack>
      )}

      {isPending && denying && (
        <VStack align="stretch" spacing={2} mt={2}>
          <Textarea
            placeholder="Denial reason (optional)"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            size="sm"
            bg="#060f0a"
            borderColor="#1a4028"
            color="#d4f0da"
            rows={2}
            resize="none"
          />
          <HStack justify="flex-end" spacing={2}>
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
              onClick={() => {
                setDenying(false);
                setDenyReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              colorScheme="red"
              isLoading={loadingId === subLoadKey + '-deny'}
              onClick={() => {
                onDeny(sub.submissionId, denyReason);
                setDenying(false);
                setDenyReason('');
              }}
            >
              Confirm Denial
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}

// ── Tile group ─────────────────────────────────────────────────────────────

function TileGroup({
  group,
  onApprove,
  onDeny,
  onComplete,
  onSetProgress,
  loadingId,
  guildId,
  colorblindMode,
}) {
  const { tileId, tileLabel, teamName, teamColor, submissions, tile } = group;
  const [confirming, setConfirming] = useState(false);
  const [localProgress, setLocalProgress] = useState(tile?.progress ?? 0);

  useEffect(() => {
    setLocalProgress(tile?.progress ?? 0);
  }, [tile?.progress]);

  const pending = submissions.filter((s) => s.status === 'PENDING');
  const approved = submissions.filter((s) => s.status === 'APPROVED');
  const denied = submissions.filter((s) => s.status === 'DENIED');
  const progress = localProgress;
  const isComplete = tile?.taskCompleted;
  const canComplete = approved.length > 0 && !isComplete && pending.length === 0 && progress >= 100;

  const coord = tile ? coordLabel(tile.row, tile.col) : '?';
  const dotColor = teamColor === 'RED' ? (colorblindMode ? '#fb923c' : '#f87171') : '#60a5fa';

  return (
    <AccordionItem
      border="1px solid"
      borderColor={pending.length > 0 ? '#854d0e' : '#1a4028'}
      borderRadius="lg"
      mb={2}
      overflow="hidden"
    >
      <AccordionButton
        px={4}
        py={3}
        bg="#091a10"
        _hover={{ bg: '#0e2418' }}
        _expanded={{ bg: '#091a10' }}
      >
        <HStack flex={1} justify="space-between" align="center" mr={2}>
          <HStack spacing={2} flexWrap="wrap">
            <Box w={2} h={2} borderRadius="full" bg={dotColor} flexShrink={0} />
            <Text
              fontSize="xs"
              fontFamily="mono"
              color={GREEN}
              fontWeight="bold"
              letterSpacing="wider"
            >
              {coord}
            </Text>
            <Text fontSize="sm" fontWeight="semibold" color="#d4f0da">
              {tileLabel ?? tileId}
            </Text>
            <Text fontSize="xs" color={DIM}>
              {teamName}
            </Text>
            {pending.length > 0 && (
              <Badge colorScheme="yellow" fontSize="xs">
                {pending.length} pending
              </Badge>
            )}
            {isComplete && (
              <Badge colorScheme="green" fontSize="xs">
                complete
              </Badge>
            )}
          </HStack>

          {!isComplete && canComplete && (
            <Box onClick={(e) => e.stopPropagation()} flexShrink={0}>
              {confirming ? (
                <HStack spacing={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    isLoading={loadingId === tileId + '-complete'}
                    onClick={() => {
                      setConfirming(false);
                      onComplete(tileId);
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
                  size="xs"
                  colorScheme="green"
                  variant="outline"
                  onClick={() => setConfirming(true)}
                >
                  Mark Complete
                </Button>
              )}
            </Box>
          )}
        </HStack>
        <AccordionIcon color={DIM} />
      </AccordionButton>

      <AccordionPanel px={4} py={4} bg="#060f0a">
        <VStack align="stretch" spacing={4}>
          {!isComplete && (
            <TileProgressSlider
              tileId={tileId}
              initialProgress={progress}
              onSave={(tid, v) => {
                setLocalProgress(v);
                onSetProgress(tid, v);
              }}
            />
          )}

          {pending.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                color="#fbbf24"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Pending ({pending.length})
              </Text>
              <VStack align="stretch" spacing={2}>
                {pending.map((sub) => (
                  <SubmissionCard
                    key={sub.submissionId}
                    sub={sub}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    loadingId={loadingId}
                    guildId={guildId}
                    colorblindMode={colorblindMode}
                  />
                ))}
              </VStack>
            </Box>
          )}

          {approved.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                color={colorblindMode ? '#60a5fa' : '#4ade80'}
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Approved ({approved.length})
              </Text>
              <VStack align="stretch" spacing={2}>
                {approved.map((sub) => (
                  <SubmissionCard
                    key={sub.submissionId}
                    sub={sub}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    loadingId={loadingId}
                    guildId={guildId}
                    colorblindMode={colorblindMode}
                  />
                ))}
              </VStack>
            </Box>
          )}

          {denied.length > 0 && (
            <Box>
              <Text
                fontSize="xs"
                color={colorblindMode ? '#fb923c' : '#f87171'}
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                mb={2}
              >
                Denied ({denied.length})
              </Text>
              <VStack align="stretch" spacing={2}>
                {denied.map((sub) => (
                  <SubmissionCard
                    key={sub.submissionId}
                    sub={sub}
                    onApprove={onApprove}
                    onDeny={onDeny}
                    loadingId={loadingId}
                    guildId={guildId}
                    colorblindMode={colorblindMode}
                  />
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function BattleshipRefsPage() {
  const { eventId } = useParams();
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const { showToast } = useToastContext();

  const [loadingId, setLoadingId] = useState(null);
  const [pendingNew, setPendingNew] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [colorblindMode, setColorblindMode] = useState(
    () => localStorage.getItem('bsColorblindMode') === 'true'
  );

  const [stableGroupOrder, setStableGroupOrder] = useState(null);
  const [openKeys, setOpenKeys] = useState(new Set());
  const openKeysInitializedRef = useRef(false);
  const [reviewedOpenKeys, setReviewedOpenKeys] = useState(new Set());
  const [completedOpenKeys, setCompletedOpenKeys] = useState(new Set());
  const [stickyTileIds, setStickyTileIds] = useState(new Set());
  const stickyTimersRef = useRef({});

  const { data: eventData, loading: eventLoading } = useQuery(GET_BS_EVENT, {
    variables: { eventId },
    skip: !isAuthenticated || !eventId,
    fetchPolicy: 'cache-and-network',
  });

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_BS_SUBMISSIONS, {
    variables: { eventId },
    skip: !isAuthenticated || !eventId,
    fetchPolicy: 'network-only',
  });

  const [doReview] = useMutation(REVIEW_BS_SUBMISSION);
  const [doComplete] = useMutation(COMPLETE_BS_TILE);
  const [doProgress] = useMutation(SET_BS_TILE_PROGRESS);

  const addStickyTile = useCallback((tileId) => {
    setStickyTileIds((prev) => new Set([...prev, tileId]));
    if (stickyTimersRef.current[tileId]) clearTimeout(stickyTimersRef.current[tileId]);
    stickyTimersRef.current[tileId] = setTimeout(() => {
      setStickyTileIds((prev) => {
        const next = new Set(prev);
        next.delete(tileId);
        return next;
      });
      delete stickyTimersRef.current[tileId];
    }, 8000);
  }, []);

  useEffect(() => {
    const timers = stickyTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const event = eventData?.getBSEvent;
  const isAdminOrRef = useMemo(() => {
    if (!event || !user) return false;
    if (user.admin) return true;
    const uid = String(user.id);
    return (
      event.creatorId === uid ||
      (event.adminIds ?? []).includes(uid) ||
      (event.refIds ?? []).includes(uid)
    );
  }, [event, user]);

  useSubscription(BS_SUBMISSION_ADDED, {
    variables: { eventId },
    skip: !eventId || !isAuthenticated,
    onData: () => {
      setPendingNew((n) => n + 1);
      if (soundEnabled) playSubmissionIncoming();
    },
  });

  useSubscription(BS_SUBMISSION_REVIEWED, {
    variables: { eventId },
    skip: !eventId || !isAuthenticated,
    onData: () => refetchSubs(),
  });

  // Group submissions by tileId, split into three pools
  const { activeGroups, reviewedGroups, completedGroups } = useMemo(() => {
    const allSubs = subsData?.submissions ?? [];
    const teamMap = Object.fromEntries((event?.teams ?? []).map((t) => [t.teamId, t]));
    const map = new Map();

    for (const sub of allSubs) {
      if (!map.has(sub.tileId)) {
        const team = teamMap[sub.teamId] ?? sub.team;
        map.set(sub.tileId, {
          tileId: sub.tileId,
          tileLabel: sub.tileLabel,
          teamId: sub.teamId,
          teamName: team?.teamName ?? sub.teamId,
          teamColor: team?.color,
          tile: sub.tile,
          submissions: [],
        });
      }
      map.get(sub.tileId).submissions.push(sub);
    }

    const active = [],
      reviewed = [],
      completed = [];
    for (const group of map.values()) {
      if (group.tile?.taskCompleted) {
        completed.push(group);
      } else {
        const pendingCount = group.submissions.filter((s) => s.status === 'PENDING').length;
        if (pendingCount > 0 || stickyTileIds.has(group.tileId)) active.push(group);
        else reviewed.push(group);
      }
    }

    active.sort((a, b) => {
      const pc = (g) => g.submissions.filter((s) => s.status === 'PENDING').length;
      return pc(b) - pc(a);
    });

    return { activeGroups: active, reviewedGroups: reviewed, completedGroups: completed };
  }, [subsData, event, stickyTileIds]);

  const totalPending = useMemo(
    () =>
      activeGroups.reduce(
        (n, g) => n + g.submissions.filter((s) => s.status === 'PENDING').length,
        0
      ),
    [activeGroups]
  );

  // Stable group order: snapshot on first load, re-snapshot on manual refresh
  const sortedActiveGroups = useMemo(() => {
    if (!stableGroupOrder) return activeGroups;
    const byId = Object.fromEntries(activeGroups.map((g) => [g.tileId, g]));
    const ordered = stableGroupOrder.map((k) => byId[k]).filter(Boolean);
    const brandNew = activeGroups.filter((g) => !stableGroupOrder.includes(g.tileId));
    return [...brandNew, ...ordered];
  }, [stableGroupOrder, activeGroups]);

  // Initialize open keys once when data first arrives
  useEffect(() => {
    if (!openKeysInitializedRef.current && activeGroups.length > 0) {
      openKeysInitializedRef.current = true;
      setOpenKeys(new Set(activeGroups.map((g) => g.tileId)));
    }
  }, [activeGroups.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Snapshot the stable order on first load
  useEffect(() => {
    if (stableGroupOrder === null && activeGroups.length > 0) {
      setStableGroupOrder(activeGroups.map((g) => g.tileId));
    }
  }, [activeGroups, stableGroupOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const openIndices = sortedActiveGroups
    .map((g, i) => (openKeys.has(g.tileId) ? i : -1))
    .filter((i) => i !== -1);

  const completedOpenIndices = completedGroups
    .map((g, i) => (completedOpenKeys.has(g.tileId) ? i : -1))
    .filter((i) => i !== -1);

  const handleRefresh = useCallback(() => {
    setPendingNew(0);
    setStableGroupOrder(null);
    refetchSubs();
  }, [refetchSubs]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') handleRefresh();
    };
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [handleRefresh]);

  useEffect(() => {
    document.title = totalPending > 0 ? `(${totalPending}) BS Refs` : 'Battleship Refs';
    return () => {
      document.title = 'OSRS Bingo Hub';
    };
  }, [totalPending]);

  const handleApprove = async (submissionId) => {
    setLoadingId(submissionId + '-approve');
    const tileId = subsData?.submissions?.find((s) => s.submissionId === submissionId)?.tileId;
    if (tileId) addStickyTile(tileId);
    try {
      await doReview({ variables: { submissionId, approved: true } });
      if (soundEnabled) playSubmissionApproved();
      showToast('Submission approved', 'success');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'Failed to approve', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeny = async (submissionId, denialReason) => {
    setLoadingId(submissionId + '-deny');
    const tileId = subsData?.submissions?.find((s) => s.submissionId === submissionId)?.tileId;
    if (tileId) addStickyTile(tileId);
    try {
      await doReview({
        variables: { submissionId, approved: false, denialReason: denialReason || null },
      });
      if (soundEnabled) playSubmissionDenied();
      showToast('Submission denied', 'info');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'Failed to deny', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleComplete = async (tileId) => {
    setLoadingId(tileId + '-complete');
    try {
      await doComplete({ variables: { tileId } });
      showToast('Tile marked complete!', 'success');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'Failed to complete tile', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSetProgress = async (tileId, progress) => {
    try {
      await doProgress({ variables: { tileId, progress } });
    } catch (e) {
      showToast(e.message ?? 'Failed to set progress', 'error');
    }
  };

  if (isCheckingAuth || eventLoading) {
    return (
      <Center h="60vh" bg="#060f0a">
        <Spinner size="xl" color={GREEN} />
      </Center>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isBattleshipEnabled(user)) return <Navigate to="/" replace />;

  if (!isAdminOrRef) {
    return (
      <Center h="60vh" bg="#060f0a">
        <VStack spacing={3}>
          <Text fontSize="2xl">🔒</Text>
          <Text color={DIM}>You don't have access to this page.</Text>
          <Button
            as={RouterLink}
            to={`/battleship/${eventId}`}
            size="sm"
            colorScheme="green"
            variant="ghost"
          >
            Back to Event
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box minH="100vh" bg="#060f0a" color="#d4f0da" pt="56px" pb={8} px={{ base: 3, md: 6 }}>
      <VStack align="stretch" spacing={6} maxW="900px" mx="auto">
        {/* Header */}
        <HStack justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <HStack spacing={3} align="center">
              <Heading size="lg" color={GREEN} fontFamily="mono" letterSpacing="tight">
                ⚓ BATTLESHIP / REFS
              </Heading>
              {totalPending > 0 && (
                <Badge colorScheme="yellow" borderRadius="full" fontSize="sm" px={2} py={0.5}>
                  {totalPending} pending
                </Badge>
              )}
            </HStack>
            {event && (
              <Text color={DIM} fontSize="sm">
                {event.eventName}
              </Text>
            )}
          </VStack>

          <HStack spacing={3} flexWrap="wrap">
            <FormControl display="flex" alignItems="center" gap={2} w="auto">
              <Switch
                id="cb-toggle"
                colorScheme="blue"
                isChecked={colorblindMode}
                onChange={() => {
                  setColorblindMode((v) => {
                    const next = !v;
                    localStorage.setItem('bsColorblindMode', String(next));
                    return next;
                  });
                }}
              />
              <FormLabel htmlFor="cb-toggle" mb={0} fontSize="sm" color={DIM} cursor="pointer">
                Colorblind Mode
              </FormLabel>
            </FormControl>
            <FormControl display="flex" alignItems="center" gap={2} w="auto">
              <Switch
                id="sound-toggle"
                colorScheme="green"
                isChecked={soundEnabled}
                onChange={() => {
                  if (!soundEnabled) warmUpAudio();
                  setSoundEnabled((v) => !v);
                }}
              />
              <FormLabel htmlFor="sound-toggle" mb={0} fontSize="sm" color={DIM} cursor="pointer">
                Sound
              </FormLabel>
            </FormControl>
            <Button
              as={RouterLink}
              to={`/battleship/${eventId}`}
              size="sm"
              variant="ghost"
              color={DIM}
              _hover={{ color: GREEN }}
            >
              ← Event Page
            </Button>
          </HStack>
        </HStack>

        {/* Info card */}
        <Box
          bg="#091a10"
          border="1px solid"
          borderColor="#1a4028"
          borderRadius="lg"
          p={4}
          fontSize="sm"
          color={DIM}
        >
          <Text fontWeight="semibold" color="#d4f0da" mb={2}>
            How reffing works
          </Text>
          <VStack align="stretch" spacing={2}>
            <Text>
              Submissions come in from Discord when a team completes a tile task. Teams are paused
              between shots until a ref approves and marks the tile complete.
            </Text>
            <Text>
              <Text as="span" color="#22d3ee" fontWeight="semibold">
                Approve
              </Text>{' '}
              a submission once you've verified the screenshot. Denied submissions can be
              resubmitted.
            </Text>
            <Text>
              Use the{' '}
              <Text as="span" color="#d4f0da" fontWeight="semibold">
                progress slider
              </Text>{' '}
              to reflect how far the team is through a multi-step task. Set to 100% and click{' '}
              <Text as="span" color={GREEN} fontWeight="semibold">
                Mark Complete
              </Text>{' '}
              once verified.
            </Text>
          </VStack>
        </Box>

        {/* New submissions banner */}
        {pendingNew > 0 && (
          <Box
            px={4}
            py={2}
            borderRadius="md"
            bg="#854d0e"
            _hover={{ bg: '#92400e' }}
            cursor="pointer"
            onClick={handleRefresh}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" fontWeight="semibold" color="white">
              {pendingNew} new submission{pendingNew !== 1 ? 's' : ''} — click to load
            </Text>
          </Box>
        )}

        {/* Submission groups */}
        <Box>
          <HStack mb={3} spacing={2}>
            <Heading size="sm" color={DIM} fontFamily="mono">
              SUBMISSIONS
            </Heading>
            {totalPending > 0 && (
              <Badge colorScheme="yellow" borderRadius="full">
                {totalPending} pending
              </Badge>
            )}
          </HStack>

          {activeGroups.length === 0 &&
            reviewedGroups.length === 0 &&
            completedGroups.length === 0 && (
              <Center py={10}>
                <Text color={DIM} fontFamily="mono" fontSize="sm">
                  NO SUBMISSIONS YET
                </Text>
              </Center>
            )}

          {/* Active: has pending submissions */}
          {sortedActiveGroups.length > 0 && (
            <Accordion
              allowMultiple
              index={openIndices}
              onChange={(newIndices) =>
                setOpenKeys(
                  new Set(newIndices.map((i) => sortedActiveGroups[i]?.tileId).filter(Boolean))
                )
              }
            >
              {sortedActiveGroups.map((group) => (
                <TileGroup
                  key={group.tileId}
                  group={group}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onComplete={handleComplete}
                  onSetProgress={handleSetProgress}
                  loadingId={loadingId}
                  guildId={event?.guildId}
                  colorblindMode={colorblindMode}
                />
              ))}
            </Accordion>
          )}

          {/* Reviewed: all approved/denied, not yet completed */}
          {reviewedGroups.length > 0 && (
            <Accordion allowToggle mt={2} onChange={() => {}}>
              <AccordionItem border="1px solid" borderColor="#1a4028" borderRadius="md">
                <AccordionButton
                  px={4}
                  py={3}
                  bg="#091a10"
                  _hover={{ bg: '#0e2418' }}
                  borderRadius="md"
                >
                  <HStack flex={1} spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold" color="#22d3ee">
                      Active Tiles
                    </Text>
                    <Badge colorScheme="cyan" fontSize="xs">
                      {reviewedGroups.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={DIM} />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <Accordion
                    allowMultiple
                    index={reviewedGroups
                      .map((g, i) => (reviewedOpenKeys.has(g.tileId) ? i : null))
                      .filter((i) => i !== null)}
                    onChange={(newIndices) =>
                      setReviewedOpenKeys(
                        new Set(newIndices.map((i) => reviewedGroups[i]?.tileId).filter(Boolean))
                      )
                    }
                  >
                    {reviewedGroups.map((group) => (
                      <TileGroup
                        key={group.tileId}
                        group={group}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                        onComplete={handleComplete}
                        onSetProgress={handleSetProgress}
                        loadingId={loadingId}
                        guildId={event?.guildId}
                      />
                    ))}
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {/* Completed tiles */}
          {completedGroups.length > 0 && (
            <Accordion allowToggle mt={2} onChange={() => {}}>
              <AccordionItem border="1px solid" borderColor="#14532d" borderRadius="md">
                <AccordionButton
                  px={4}
                  py={3}
                  bg="#091a10"
                  _hover={{ bg: '#0e2418' }}
                  borderRadius="md"
                >
                  <HStack flex={1} spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold" color={GREEN}>
                      Completed Tiles
                    </Text>
                    <Badge colorScheme="green" fontSize="xs">
                      {completedGroups.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={DIM} />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <Accordion
                    allowMultiple
                    index={completedOpenIndices}
                    onChange={(newIndices) =>
                      setCompletedOpenKeys(
                        new Set(newIndices.map((i) => completedGroups[i]?.tileId).filter(Boolean))
                      )
                    }
                  >
                    {completedGroups.map((group) => (
                      <TileGroup
                        key={group.tileId}
                        group={group}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                        onComplete={handleComplete}
                        onSetProgress={handleSetProgress}
                        loadingId={loadingId}
                        guildId={event?.guildId}
                      />
                    ))}
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </Box>

        <Divider borderColor="#1a4028" />
        <Text fontSize="xs" color={DIM} textAlign="center" fontFamily="mono">
          OSRS BINGO HUB / BATTLESHIP REFS CONSOLE
        </Text>
      </VStack>
    </Box>
  );
}
