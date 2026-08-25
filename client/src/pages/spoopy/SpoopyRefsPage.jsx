import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
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
  HStack,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Switch,
  Text,
  Textarea,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import TileReviewControls, {
  canMarkTileComplete,
  normalizeSpoopyTask,
} from '../../molecules/TileReviewControls';
import { BellIcon } from '@chakra-ui/icons';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import {
  playSubmissionApproved,
  playSubmissionDenied,
  playSubmissionIncoming,
  warmUpAudio,
} from '../../utils/soundEngine';
import {
  GET_ACTIVE_SPOOPY_EVENT,
  GET_SPOOPY_ADMIN_EVENT,
  GET_SPOOPY_SUBMISSIONS,
  REVIEW_SPOOPY_SUBMISSION,
  SET_SPOOPY_TILE_PROGRESS,
  COMPLETE_SPOOPY_TILE,
  SPOOPY_SUBMISSION_ADDED,
  SPOOPY_SUBMISSION_REVIEWED,
} from '../../graphql/spoopyOperations';
import { SPOOPY_COLORS, SPOOPY_FONTS, TILE_META } from '../../organisms/spoopy/spoopyTheme';

// ── Utilities ────────────────────────────────────────────────────────────

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Grid position → "r19-c8" style label for the tile header.
function tilePosLabel(tile) {
  if (!tile?.position) return '?';
  return `r${tile.position.row}-c${tile.position.col}`;
}

// ── Screenshot thumbnail with click-to-expand modal ─────────────────────

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
        border="2px solid"
        borderColor={SPOOPY_COLORS.paperEdge}
        _hover={{ opacity: 0.9, borderColor: SPOOPY_COLORS.pumpkin }}
        onClick={onOpen}
      />
      <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={SPOOPY_COLORS.night} border="1px solid" borderColor={SPOOPY_COLORS.nightMist}>
          <ModalCloseButton color={SPOOPY_COLORS.paper} />
          <ModalBody p={4}>
            <Image src={url} alt="screenshot" w="100%" borderRadius="md" objectFit="contain" />
            <Text
              as="a"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              fontSize="xs"
              color={SPOOPY_COLORS.pumpkinLight}
              _hover={{ textDecoration: 'underline' }}
              display="block"
              mt={2}
              textAlign="right"
            >
              Open full size ↗
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

// ── Single submission card (approve / deny / re-approve UI) ─────────────

function SubmissionCard({ sub, onApprove, onDeny, loadingId }) {
  const [denying, setDenying] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const isPending = sub.status === 'PENDING';
  const isApproved = sub.status === 'APPROVED';
  const isDenied = sub.status === 'DENIED';

  const loadKey = sub.submissionId;
  const borderColor = isPending
    ? SPOOPY_COLORS.pumpkinDeep
    : isApproved
    ? SPOOPY_COLORS.greenDeep
    : SPOOPY_COLORS.emberDeep;

  const badgeBg = isPending
    ? SPOOPY_COLORS.pumpkin
    : isApproved
    ? SPOOPY_COLORS.green
    : SPOOPY_COLORS.ember;

  const isPre = sub.type === 'PRE';

  return (
    <Box
      bg={SPOOPY_COLORS.nightDeep}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" align="flex-start" mb={2}>
        <VStack align="flex-start" spacing={1} flex={1} minW={0}>
          <HStack spacing={2} flexWrap="wrap">
            <Badge bg={badgeBg} color={SPOOPY_COLORS.paper} fontSize="xs" textTransform="lowercase">
              {sub.status}
            </Badge>
            {isPre && (
              <Badge
                bg={SPOOPY_COLORS.purpleLight}
                color={SPOOPY_COLORS.paper}
                fontSize="xs"
                textTransform="lowercase"
              >
                pre-screenshot
              </Badge>
            )}
            {sub.discordUsername && (
              <Text fontSize="xs" color={SPOOPY_COLORS.paper} opacity={0.7} fontWeight="semibold">
                @{sub.discordUsername}
              </Text>
            )}
            {sub.channelId && sub.discordMessageId && (
              <Text
                as="a"
                href={`https://discord.com/channels/@me/${sub.channelId}/${sub.discordMessageId}`}
                target="_blank"
                rel="noopener noreferrer"
                fontSize="xs"
                color={SPOOPY_COLORS.pumpkinLight}
                _hover={{ textDecoration: 'underline' }}
              >
                view in discord ↗
              </Text>
            )}
            <Text fontSize="xs" opacity={0.55}>
              {formatTime(sub.submittedAt)}
            </Text>
          </HStack>
          {isDenied && sub.denialReason && (
            <Text fontSize="xs" color={SPOOPY_COLORS.emberDeep} mt={1}>
              reason: {sub.denialReason}
            </Text>
          )}
        </VStack>

        {sub.screenshotUrl && (
          <Box flexShrink={0}>
            <ScreenshotThumb url={sub.screenshotUrl} />
          </Box>
        )}
      </HStack>

      {isDenied && (
        <Button
          size="xs"
          variant="ghost"
          color={SPOOPY_COLORS.green}
          _hover={{ bg: SPOOPY_COLORS.night }}
          isLoading={loadingId === loadKey + '-approve'}
          onClick={() => onApprove(sub.submissionId)}
        >
          re-approve
        </Button>
      )}

      {isPending && !denying && (
        <HStack spacing={2} justify="flex-end">
          <Button
            size="xs"
            variant="outline"
            borderColor={SPOOPY_COLORS.emberDeep}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.emberDeep }}
            onClick={() => setDenying(true)}
            isDisabled={!!loadingId}
          >
            deny
          </Button>
          <Button
            size="xs"
            bg={SPOOPY_COLORS.green}
            color={SPOOPY_COLORS.paper}
            _hover={{ bg: SPOOPY_COLORS.greenDeep }}
            isLoading={loadingId === loadKey + '-approve'}
            isDisabled={!!loadingId && loadingId !== loadKey + '-approve'}
            onClick={() => onApprove(sub.submissionId)}
          >
            approve
          </Button>
        </HStack>
      )}

      {isPending && denying && (
        <VStack align="stretch" spacing={2} mt={2}>
          <Textarea
            placeholder="denial reason (optional)"
            value={denyReason}
            onChange={(e) => setDenyReason(e.target.value)}
            size="sm"
            bg={SPOOPY_COLORS.night}
            borderColor={SPOOPY_COLORS.nightMist}
            color={SPOOPY_COLORS.paper}
            rows={2}
            resize="none"
          />
          <HStack justify="flex-end" spacing={2}>
            <Button
              size="xs"
              variant="ghost"
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
              onClick={() => {
                setDenying(false);
                setDenyReason('');
              }}
            >
              cancel
            </Button>
            <Button
              size="xs"
              bg={SPOOPY_COLORS.ember}
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.emberDeep }}
              isLoading={loadingId === loadKey + '-deny'}
              onClick={() => {
                onDeny(sub.submissionId, denyReason);
                setDenying(false);
                setDenyReason('');
              }}
            >
              confirm deny
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}

// ── Tile group (accordion item per unique tile) ─────────────────────────

function TileGroup({ group, onApprove, onDeny, onSetProgress, onComplete, loadingId }) {
  const {
    tileId,
    tileTypeLabel,
    teamName,
    teamId,
    submissions,
    tile,
    tileType,
    isComplete,
    progress,
    task,
  } = group;
  const pending = submissions.filter((s) => s.status === 'PENDING');
  const approved = submissions.filter((s) => s.status === 'APPROVED');
  const denied = submissions.filter((s) => s.status === 'DENIED');
  const coord = tilePosLabel(tile);
  const canComplete = canMarkTileComplete({
    isComplete,
    hasApproved: approved.length > 0,
    hasPending: pending.length > 0,
    progress,
  });

  const dotColor = tileType === 'start'
    ? SPOOPY_COLORS.green
    : tileType === 'candybag'
    ? SPOOPY_COLORS.ember
    : SPOOPY_COLORS.pumpkin;

  return (
    <AccordionItem
      border="1px solid"
      borderColor={pending.length > 0 ? SPOOPY_COLORS.pumpkinDeep : SPOOPY_COLORS.nightMist}
      borderRadius="lg"
      mb={2}
      overflow="hidden"
    >
      <AccordionButton
        px={4}
        py={3}
        bg={SPOOPY_COLORS.night}
        _hover={{ bg: SPOOPY_COLORS.nightMist }}
        _expanded={{ bg: SPOOPY_COLORS.night }}
      >
        <HStack flex={1} justify="space-between" align="center" mr={2}>
          <HStack spacing={2} flexWrap="wrap">
            <Box w={2} h={2} borderRadius="full" bg={dotColor} flexShrink={0} />
            <Text
              fontSize="xs"
              fontFamily="mono"
              color={SPOOPY_COLORS.pumpkinLight}
              fontWeight="bold"
              letterSpacing="wider"
            >
              {coord}
            </Text>
            <Text
              fontSize="sm"
              fontWeight="semibold"
              color={SPOOPY_COLORS.paper}
              fontFamily={SPOOPY_FONTS.hand}
            >
              {tileTypeLabel ?? tileId}
            </Text>
            <Text fontSize="xs" opacity={0.65}>
              {teamName}
            </Text>
            {pending.length > 0 && (
              <Badge bg={SPOOPY_COLORS.pumpkin} color={SPOOPY_COLORS.paper} fontSize="xs">
                {pending.length} pending
              </Badge>
            )}
            {approved.length > 0 && !isComplete && (
              <Badge bg={SPOOPY_COLORS.purpleLight} color={SPOOPY_COLORS.paper} fontSize="xs">
                {approved.length} approved
              </Badge>
            )}
            {isComplete && (
              <Badge bg={SPOOPY_COLORS.green} color={SPOOPY_COLORS.paper} fontSize="xs">
                complete
              </Badge>
            )}
          </HStack>

          {canComplete && (
            <Badge bg={SPOOPY_COLORS.green} color={SPOOPY_COLORS.paper} fontSize="xs">
              ready to complete
            </Badge>
          )}
        </HStack>
        <AccordionIcon color={SPOOPY_COLORS.paper} />
      </AccordionButton>

      <AccordionPanel px={4} py={4} bg={SPOOPY_COLORS.nightDeep}>
        <VStack align="stretch" spacing={4}>
          <TileReviewControls
            progress={progress}
            onSetProgress={(pct) => onSetProgress(teamId, tileId, pct)}
            hasApproved={approved.length > 0}
            hasPending={pending.length > 0}
            isComplete={isComplete}
            loading={loadingId === tileId + '-complete'}
            onComplete={() => onComplete?.(teamId, tileId)}
            activeColor={SPOOPY_COLORS.pumpkin}
            doneColor={SPOOPY_COLORS.green}
            trackColor={SPOOPY_COLORS.nightMist}
            mutedColor={SPOOPY_COLORS.paper}
            buttonColorScheme="green"
            {...normalizeSpoopyTask(task)}
          />


          {pending.length > 0 && (
            <Section label="pending" count={pending.length} color={SPOOPY_COLORS.pumpkin}>
              {pending.map((sub) => (
                <SubmissionCard
                  key={sub.submissionId}
                  sub={sub}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  loadingId={loadingId}
                />
              ))}
            </Section>
          )}

          {approved.length > 0 && (
            <Section label="approved" count={approved.length} color={SPOOPY_COLORS.green}>
              {approved.map((sub) => (
                <SubmissionCard
                  key={sub.submissionId}
                  sub={sub}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  loadingId={loadingId}
                />
              ))}
            </Section>
          )}

          {denied.length > 0 && (
            <Section label="denied" count={denied.length} color={SPOOPY_COLORS.ember}>
              {denied.map((sub) => (
                <SubmissionCard
                  key={sub.submissionId}
                  sub={sub}
                  onApprove={onApprove}
                  onDeny={onDeny}
                  loadingId={loadingId}
                />
              ))}
            </Section>
          )}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  );
}

function Section({ label, count, color, children }) {
  return (
    <Box>
      <Text
        fontSize="xs"
        color={color}
        fontWeight="semibold"
        textTransform="uppercase"
        letterSpacing="wider"
        mb={2}
      >
        {label} ({count})
      </Text>
      <VStack align="stretch" spacing={2}>{children}</VStack>
    </Box>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export default function SpoopyRefsPage() {
  const { user, isAuthenticated, isCheckingAuth } = useAuth();
  const { showToast } = useToastContext();

  const { data: activeData, loading: eventLoading } = useQuery(GET_ACTIVE_SPOOPY_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const eventId = activeData?.getActiveSpoopyEvent?.eventId ?? null;

  // Full event (teams + admins) — needed to resolve team names / tile info.
  const { data: adminData } = useQuery(GET_SPOOPY_ADMIN_EVENT, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const event = adminData?.spoopyEvents?.find((e) => e.eventId === eventId) ?? adminData?.spoopyEvents?.[0] ?? null;

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_SPOOPY_SUBMISSIONS, {
    variables: { eventId },
    skip: !isAuthenticated || !eventId,
    fetchPolicy: 'network-only',
  });

  const [doReview] = useMutation(REVIEW_SPOOPY_SUBMISSION);
  const [doSetProgress] = useMutation(SET_SPOOPY_TILE_PROGRESS);
  const [doCompleteTile] = useMutation(COMPLETE_SPOOPY_TILE);

  const [loadingId, setLoadingId] = useState(null);
  const [pendingNew, setPendingNew] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [openKeys, setOpenKeys] = useState(new Set());
  const [reviewedOpenKeys, setReviewedOpenKeys] = useState(new Set());
  const [completedOpenKeys, setCompletedOpenKeys] = useState(new Set());
  const [stableGroupOrder, setStableGroupOrder] = useState(null);
  const [stickyTileIds, setStickyTileIds] = useState(new Set());
  const stickyTimersRef = useRef({});
  const openKeysInitializedRef = useRef(false);

  const isAdminOrRef = useMemo(() => {
    if (!event || !user) return false;
    if (user.admin) return true;
    return (event.adminIds ?? []).includes(String(user.id));
  }, [event, user]);

  const addStickyTile = useCallback((tileId) => {
    if (!tileId) return;
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

  useSubscription(SPOOPY_SUBMISSION_ADDED, {
    variables: { eventId },
    skip: !eventId || !isAuthenticated,
    onData: () => {
      setPendingNew((n) => n + 1);
      if (soundEnabled) playSubmissionIncoming();
    },
  });

  useSubscription(SPOOPY_SUBMISSION_REVIEWED, {
    variables: { eventId },
    skip: !eventId || !isAuthenticated,
    onData: () => refetchSubs(),
  });

  // Group submissions by tileId, split into three pools mirroring battleship.
  const { activeGroups, reviewedGroups, completedGroups } = useMemo(() => {
    const allSubs = subsData?.spoopySubmissions ?? [];
    const teamMap = Object.fromEntries((event?.teams ?? []).map((t) => [t.teamId, t]));
    const boardTiles = Object.fromEntries(
      (event?.board?.tiles ?? []).map((t) => [t.id, t]),
    );
    const contentById = event?.contentById ?? {};
    const map = new Map();

    // For house tiles, the active task depends on the team's locked-in choice.
    // For everything else it's just the tile's task. Uses the submission's
    // `teamTile.choice` since we already have that in the fragment.
    const resolveTask = (tileId, tileType, teamTile) => {
      const content = contentById[tileId];
      if (!content) return null;
      if (tileType === 'house') {
        const choice = teamTile?.choice;
        if (!choice) return null;
        return content.dialog?.options?.[choice]?.task ?? null;
      }
      return content.task ?? null;
    };

    for (const sub of allSubs) {
      if (!map.has(sub.tileId)) {
        const team = teamMap[sub.teamId];
        const boardTile = boardTiles[sub.tileId];
        const tileType = boardTile?.tile_type ?? 'house';
        map.set(sub.tileId, {
          tileId: sub.tileId,
          tileType,
          tileTypeLabel: TILE_META[tileType]?.label ?? tileType,
          teamId: sub.teamId,
          teamName: team?.teamName ?? sub.teamId,
          tile: boardTile,
          task: resolveTask(sub.tileId, tileType, sub.teamTile),
          submissions: [],
          progress: sub.teamTile?.progress ?? 0,
          teamTileStatus: sub.teamTile?.status ?? null,
          isComplete: false,
        });
      }
      map.get(sub.tileId).submissions.push(sub);
    }

    // Only the authoritative team-tile status marks a tile complete. Approve
    // no longer auto-completes — a ref has to click "mark complete" to move
    // the tile out of the active/reviewed pools. Mirrors battleship's
    // `tile.taskCompleted` check exactly.
    for (const group of map.values()) {
      group.isComplete = group.teamTileStatus === 'complete';
    }

    const active = [];
    const reviewed = [];
    const completed = [];
    for (const group of map.values()) {
      if (group.isComplete) {
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
        0,
      ),
    [activeGroups],
  );

  // Stable group order — snapshot on first load so tiles don't jump around
  // when new submissions land. Manual refresh re-snapshots.
  const sortedActiveGroups = useMemo(() => {
    if (!stableGroupOrder) return activeGroups;
    const byId = Object.fromEntries(activeGroups.map((g) => [g.tileId, g]));
    const ordered = stableGroupOrder.map((k) => byId[k]).filter(Boolean);
    const brandNew = activeGroups.filter((g) => !stableGroupOrder.includes(g.tileId));
    return [...brandNew, ...ordered];
  }, [stableGroupOrder, activeGroups]);

  useEffect(() => {
    if (!openKeysInitializedRef.current && activeGroups.length > 0) {
      openKeysInitializedRef.current = true;
      setOpenKeys(new Set(activeGroups.map((g) => g.tileId)));
    }
  }, [activeGroups.length]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const reviewedOpenIndices = reviewedGroups
    .map((g, i) => (reviewedOpenKeys.has(g.tileId) ? i : -1))
    .filter((i) => i !== -1);

  const handleRefresh = useCallback(() => {
    setPendingNew(0);
    setStableGroupOrder(null);
    refetchSubs();
  }, [refetchSubs]);

  // Auto-refresh when the tab regains focus so refs coming back from Discord
  // don't stare at stale data.
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
    document.title = totalPending > 0 ? `(${totalPending}) 🎃 spoopy refs` : '🎃 spoopy refs';
    return () => {
      document.title = 'OSRS Bingo Hub';
    };
  }, [totalPending]);

  const handleApprove = async (submissionId) => {
    setLoadingId(submissionId + '-approve');
    const tileId = subsData?.spoopySubmissions?.find((s) => s.submissionId === submissionId)?.tileId;
    if (tileId) addStickyTile(tileId);
    try {
      await doReview({ variables: { submissionId, approved: true } });
      if (soundEnabled) playSubmissionApproved();
      showToast('submission approved', 'success');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'failed to approve', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSetProgress = async (teamId, tileId, progress) => {
    try {
      await doSetProgress({ variables: { teamId, tileId, progress } });
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'failed to set progress', 'error');
    }
  };

  const handleCompleteTile = async (teamId, tileId) => {
    setLoadingId(tileId + '-complete');
    addStickyTile(tileId);
    try {
      await doCompleteTile({ variables: { teamId, tileId } });
      showToast('tile marked complete', 'success');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'failed to complete tile', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeny = async (submissionId, denialReason) => {
    setLoadingId(submissionId + '-deny');
    const tileId = subsData?.spoopySubmissions?.find((s) => s.submissionId === submissionId)?.tileId;
    if (tileId) addStickyTile(tileId);
    try {
      await doReview({
        variables: { submissionId, approved: false, denialReason: denialReason || null },
      });
      if (soundEnabled) playSubmissionDenied();
      showToast('submission denied', 'info');
      await refetchSubs();
    } catch (e) {
      showToast(e.message ?? 'failed to deny', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  if (isCheckingAuth || (eventLoading && !event)) {
    return (
      <Center h="60vh" bg={SPOOPY_COLORS.nightDeep}>
        <Spinner size="xl" color={SPOOPY_COLORS.pumpkin} />
      </Center>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!event) {
    return (
      <Shell>
        <Center py={20}>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="xl">no active spoopy event to review</Text>
        </Center>
      </Shell>
    );
  }
  if (!isAdminOrRef) {
    return (
      <Shell event={event}>
        <Center h="60vh">
          <VStack spacing={3}>
            <Text fontSize="2xl">🔒</Text>
            <Text opacity={0.7}>you don't have access to this page</Text>
          </VStack>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell event={event}>
      <VStack align="stretch" spacing={5} maxW="960px" mx="auto" py={6} px={{ base: 3, md: 6 }}>
        <HStack justify="space-between" wrap="wrap" gap={3}>
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" opacity={0.75}>reviewing submissions for <strong>{event.eventName}</strong></Text>
          </VStack>
          <HStack spacing={3}>
            <HStack spacing={2} fontSize="xs" opacity={0.75}>
              <BellIcon />
              <Text>sound</Text>
              <Switch
                size="sm"
                colorScheme="purple"
                isChecked={soundEnabled}
                onChange={(e) => {
                  const next = e.target.checked;
                  setSoundEnabled(next);
                  if (next) warmUpAudio();
                }}
              />
            </HStack>
            <Button
              size="sm"
              onClick={handleRefresh}
              variant="outline"
              borderColor={SPOOPY_COLORS.nightMist}
              color={SPOOPY_COLORS.paper}
              _hover={{ bg: SPOOPY_COLORS.nightMist }}
            >
              refresh
            </Button>
          </HStack>
        </HStack>

        {/* Info card */}
        <Box
          bg={SPOOPY_COLORS.night}
          border="1px solid"
          borderColor={SPOOPY_COLORS.nightMist}
          borderRadius="lg"
          p={4}
          fontSize="sm"
        >
          <Text
            fontWeight="semibold"
            color={SPOOPY_COLORS.paper}
            fontFamily={SPOOPY_FONTS.heading}
            mb={2}
            letterSpacing="wider"
          >
            🕯️ how reffing works
          </Text>
          <VStack align="stretch" spacing={2} opacity={0.85}>
            <Text>
              submissions come in from discord when a team completes a tile task. teams keep working
              in parallel while pending submissions wait for review here.
            </Text>
            <Text>
              <Text as="span" color={SPOOPY_COLORS.green} fontWeight="semibold">approve</Text>{' '}
              a submission once you've verified the screenshot. teams can stack multiple
              submissions on a tile — approving one doesn't finish the tile.
            </Text>
            <Text>
              <Text as="span" color={SPOOPY_COLORS.ember} fontWeight="semibold">deny</Text>{' '}
              rejects the screenshot with an optional reason (e.g. "missing event password",
              "wrong screenshot"). the team can just resubmit.
            </Text>
            <Text>
              use the{' '}
              <Text as="span" color={SPOOPY_COLORS.paper} fontWeight="semibold">progress slider</Text>{' '}
              to reflect multi-step progress. click{' '}
              <Text as="span" color={SPOOPY_COLORS.green} fontWeight="semibold">mark complete</Text>{' '}
              once all approvals are in — that's what unlocks neighbors, banks gp, and cashes
              out the scary castle.
            </Text>
            <Text opacity={0.7}>
              pre-screenshots are informational only — they don't advance the tile.
            </Text>
          </VStack>
        </Box>

        {/* New submissions banner */}
        {pendingNew > 0 && (
          <Box
            px={4}
            py={2}
            borderRadius="md"
            bg={SPOOPY_COLORS.pumpkin}
            _hover={{ bg: SPOOPY_COLORS.pumpkinDeep }}
            cursor="pointer"
            onClick={handleRefresh}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="sm" fontWeight="semibold" color={SPOOPY_COLORS.paper}>
              🎃 {pendingNew} new submission{pendingNew !== 1 ? 's' : ''} — click to load
            </Text>
          </Box>
        )}

        {/* Submission groups */}
        <Box>
          <HStack mb={3} spacing={2}>
            <Heading size="sm" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
              submissions
            </Heading>
            {totalPending > 0 && (
              <Badge bg={SPOOPY_COLORS.pumpkin} color={SPOOPY_COLORS.paper} borderRadius="full">
                {totalPending} pending
              </Badge>
            )}
          </HStack>

          {activeGroups.length === 0 &&
            reviewedGroups.length === 0 &&
            completedGroups.length === 0 && (
              <Center py={10}>
                <Text opacity={0.65} fontFamily={SPOOPY_FONTS.hand} fontSize="md">
                  no submissions yet — quiet night
                </Text>
              </Center>
            )}

          {sortedActiveGroups.length > 0 && (
            <Accordion
              allowMultiple
              index={openIndices}
              onChange={(newIndices) =>
                setOpenKeys(
                  new Set(newIndices.map((i) => sortedActiveGroups[i]?.tileId).filter(Boolean)),
                )
              }
            >
              {sortedActiveGroups.map((group) => (
                <TileGroup
                  key={group.tileId}
                  group={group}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onSetProgress={handleSetProgress}
                  onComplete={handleCompleteTile}
                  loadingId={loadingId}
                />
              ))}
            </Accordion>
          )}

          {reviewedGroups.length > 0 && (
            <Accordion allowToggle mt={2}>
              <AccordionItem border="1px solid" borderColor={SPOOPY_COLORS.nightMist} borderRadius="md">
                <AccordionButton
                  px={4}
                  py={3}
                  bg={SPOOPY_COLORS.night}
                  _hover={{ bg: SPOOPY_COLORS.nightMist }}
                  borderRadius="md"
                >
                  <HStack flex={1} spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold" color={SPOOPY_COLORS.purpleLight} fontFamily={SPOOPY_FONTS.hand}>
                      recently reviewed
                    </Text>
                    <Badge bg={SPOOPY_COLORS.purple} color={SPOOPY_COLORS.paper} fontSize="xs">
                      {reviewedGroups.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={SPOOPY_COLORS.paper} />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <Accordion
                    allowMultiple
                    index={reviewedOpenIndices}
                    onChange={(newIndices) =>
                      setReviewedOpenKeys(
                        new Set(newIndices.map((i) => reviewedGroups[i]?.tileId).filter(Boolean)),
                      )
                    }
                  >
                    {reviewedGroups.map((group) => (
                      <TileGroup
                        key={group.tileId}
                        group={group}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                  onSetProgress={handleSetProgress}
                  onComplete={handleCompleteTile}
                        loadingId={loadingId}
                      />
                    ))}
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}

          {completedGroups.length > 0 && (
            <Accordion allowToggle mt={2}>
              <AccordionItem border="1px solid" borderColor={SPOOPY_COLORS.greenDeep} borderRadius="md">
                <AccordionButton
                  px={4}
                  py={3}
                  bg={SPOOPY_COLORS.night}
                  _hover={{ bg: SPOOPY_COLORS.nightMist }}
                  borderRadius="md"
                >
                  <HStack flex={1} spacing={2}>
                    <Text fontSize="sm" fontWeight="semibold" color={SPOOPY_COLORS.green} fontFamily={SPOOPY_FONTS.hand}>
                      completed tiles
                    </Text>
                    <Badge bg={SPOOPY_COLORS.green} color={SPOOPY_COLORS.paper} fontSize="xs">
                      {completedGroups.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={SPOOPY_COLORS.paper} />
                </AccordionButton>
                <AccordionPanel px={0} pb={2}>
                  <Accordion
                    allowMultiple
                    index={completedOpenIndices}
                    onChange={(newIndices) =>
                      setCompletedOpenKeys(
                        new Set(newIndices.map((i) => completedGroups[i]?.tileId).filter(Boolean)),
                      )
                    }
                  >
                    {completedGroups.map((group) => (
                      <TileGroup
                        key={group.tileId}
                        group={group}
                        onApprove={handleApprove}
                        onDeny={handleDeny}
                  onSetProgress={handleSetProgress}
                  onComplete={handleCompleteTile}
                        loadingId={loadingId}
                      />
                    ))}
                  </Accordion>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </Box>

        <Divider borderColor={SPOOPY_COLORS.nightMist} />
        <Text
          fontSize="xs"
          opacity={0.5}
          textAlign="center"
          fontFamily={SPOOPY_FONTS.hand}
          letterSpacing="wider"
        >
          osrs bingo hub · 🕯️ spoopy refs console
        </Text>
      </VStack>
    </Shell>
  );
}

function Shell({ event, children }) {
  return (
    <Box minHeight="calc(100vh - 60px)" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
      <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
        <VStack align="start" spacing={0}>
          <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
            🕯️ spoopy refs
          </Heading>
          {event?.eventPassword && (
            <Text fontSize="xs" opacity={0.7} fontFamily={SPOOPY_FONTS.hand}>
              event password:{' '}
              <Text as="span" fontFamily="mono" color={SPOOPY_COLORS.pumpkinLight}>
                {event.eventPassword}
              </Text>
            </Text>
          )}
        </VStack>
      </Box>
      {children}
    </Box>
  );
}
