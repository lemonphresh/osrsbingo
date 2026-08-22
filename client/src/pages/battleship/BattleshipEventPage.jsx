import React, { useState, useCallback, useEffect, useRef } from 'react';
import { playBSSound } from '../../utils/battleship/bsAudio';
import { useParams, Link as RouterLink, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Spinner,
  Center,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import BSEventDraftAdmin from '../../organisms/battleship/BSDraftAdmin';
import { BSPlacementView } from '../../organisms/battleship/BSPlacementView';
import { BoardPanel, SectionLabel } from '../../organisms/battleship/BSSharedComponents';
import { TeamStatusCard, ShotLogEntry } from '../../organisms/battleship/BSActiveComponents';
import { ProposalModal } from '../../organisms/battleship/BSProposalModal';
import { DevAdminPanel } from '../../organisms/battleship/BSDevAdminPanel';
import {
  BSBattleIntroModal,
  getBSBattleIntroKey,
} from '../../organisms/battleship/BSBattleIntroModal';
import { BSGameOverScreen } from '../../organisms/battleship/BSGameOverScreen';
import { BSSpectatorView } from '../../organisms/battleship/BSSpectatorView';
import { SkipProposalModal } from '../../organisms/battleship/BSSkipProposalModal';
import {
  GET_BS_EVENT_FULL,
  GET_BS_SHOT_LOG,
  FIRE_BS,
  PROPOSE_BS_SHOT,
  VOTE_ON_BS_PROPOSAL,
  SKIP_BS_TILE,
  PROPOSE_SKIP_TOKEN,
  VOTE_ON_SKIP_PROPOSAL,
  BS_TILE_UPDATED,
  BS_SHOT_FIRED,
  BS_PROPOSAL_UPDATED,
  BS_SKIP_PROPOSAL_UPDATED,
  BS_GAME_OVER,
} from '../../graphql/bsOperations';
import { useToastContext } from '../../providers/ToastProvider';
import { useAuth } from '../../providers/AuthProvider';
import usePageTitle from '../../hooks/usePageTitle';
import useDiscordUsernames from '../../hooks/useBSDiscordUsernames';
import {
  STATUS_COLOR,
  STATUS_LABEL,
  cooldownRemaining,
  formatCooldown,
  coordLabel,
} from '../../utils/battleship/bsClientHelpers';
import { isBattleshipEnabled } from '../../config/featureFlags';

export default function BattleshipEventPage() {
  const { eventId } = useParams();
  const { showToast } = useToastContext();
  const { user: currentUser } = useAuth();

  usePageTitle('Battleship');

  const [colorblindMode, setColorblindMode] = useState(
    () => localStorage.getItem('bsColorblindMode') === 'true'
  );

  const toggleColorblindMode = useCallback(() => {
    setColorblindMode((v) => {
      const next = !v;
      localStorage.setItem('bsColorblindMode', String(next));
      return next;
    });
  }, []);

  const [showBattleIntro, setShowBattleIntro] = useState(
    () => !localStorage.getItem(getBSBattleIntroKey(eventId))
  );

  // Dev convenience — track which team index we're viewing as
  const [viewingTeamIndex, setViewingTeamIndex] = useState(0);
  const [highlightedCell] = useState(null);
  const [activeProposal, setActiveProposal] = useState(null);
  const [proposalHistory, setProposalHistory] = useState([]);
  const [activeSkipProposal, setActiveSkipProposal] = useState(null);
  const prevApprovalsRef = useRef(0);

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

  const [skipTile, { loading: skipping }] = useMutation(SKIP_BS_TILE, {
    onCompleted: () => {
      setActiveSkipProposal(null);
      refetchEvent();
      showToast('Skip token used. You may fire again.', 'success');
    },
    onError: (err) => showToast(err.message ?? 'Failed to skip tile', 'error'),
  });

  const [proposeSkip, { loading: proposingSkip }] = useMutation(PROPOSE_SKIP_TOKEN, {
    onCompleted: (data) => {
      const p = data?.proposeSkipToken;
      if (p) setActiveSkipProposal(p);
    },
    onError: (err) => showToast(err.message ?? 'Failed to propose skip', 'error'),
  });

  const [voteOnSkip, { loading: votingOnSkip }] = useMutation(VOTE_ON_SKIP_PROPOSAL, {
    onError: (err) => showToast(err.message ?? 'Failed to vote on skip', 'error'),
  });

  // ── Derived state ────────────────────────────────────────────────────────

  const event = eventData?.getBSEvent;
  const teams = event?.teams ?? [];
  const shotLog = shotLogData?.getBSShotLog ?? [];

  // On first load, snap the viewer to their own team so proposal subscriptions
  // and initial POV target the correct channel. Non-team members (refs/admins/
  // spectators) stay on the default (team 0).
  const didSnapPovRef = useRef(false);
  useEffect(() => {
    if (didSnapPovRef.current) return;
    if (!teams.length || !currentUser?.discordUserId) return;
    const myIndex = teams.findIndex((t) => (t.members ?? []).includes(currentUser.discordUserId));
    if (myIndex > 0) setViewingTeamIndex(myIndex);
    didSnapPovRef.current = true;
  }, [teams.length, currentUser?.discordUserId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useSubscription(BS_GAME_OVER, {
    variables: { eventId },
    skip: !eventId || event?.status === 'COMPLETED',
    onData: () => refetchEvent(),
  });

  useSubscription(BS_SHOT_FIRED, {
    variables: { eventId },
    skip: event?.status !== 'ACTIVE',
    onData: ({ data }) => {
      const shot = data?.data?.bsShotFired;
      if (!shot) return;
      const isFiringTeam = shot.firingTeamId === viewingTeam?.teamId;
      if (shot.result === 'HIT') {
        if (isFiringTeam) playBSSound('directhit');
        else playBSSound('imhitimhit');
      } else {
        playBSSound('splash');
      }
    },
  });

  useSubscription(BS_PROPOSAL_UPDATED, {
    variables: { teamId: viewingTeam?.teamId },
    skip: !viewingTeam?.teamId || event?.status !== 'ACTIVE',
    onData: ({ data }) => {
      const p = data?.data?.bsProposalUpdated;
      if (!p || p.status === 'CLEARED' || !p.proposalId) {
        prevApprovalsRef.current = 0;
        setActiveProposal(null);
        return;
      }
      if (p.status === 'REJECTED') {
        prevApprovalsRef.current = 0;
        setProposalHistory((h) => [...h, p]);
        setActiveProposal(null);
        showToast('Shot proposal vetoed. Pick a new target.', 'warning');
        return;
      }
      const newCount = (p.approvals ?? []).length;
      if (newCount > prevApprovalsRef.current) playBSSound('radar');
      prevApprovalsRef.current = newCount;
      setActiveProposal(p);
    },
  });

  useSubscription(BS_SKIP_PROPOSAL_UPDATED, {
    variables: { teamId: viewingTeam?.teamId },
    skip: !viewingTeam?.teamId || event?.status !== 'ACTIVE',
    onData: ({ data }) => {
      const p = data?.data?.bsSkipProposalUpdated;
      if (!p || p.status === 'CLEARED' || !p.proposalId) {
        setActiveSkipProposal(null);
        return;
      }
      if (p.status === 'REJECTED') {
        setActiveSkipProposal(null);
        showToast('Skip proposal vetoed. Tokens preserved.', 'warning');
        return;
      }
      setActiveSkipProposal(p);
    },
  });

  const myTiles = myBoard?.tiles ?? [];
  const opponentTiles = opponentBoard?.tiles ?? [];

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!viewingTeam?.lastShotAt || !event?.cooldownMinutes) return;
    const remaining = cooldownRemaining(viewingTeam.lastShotAt, event.cooldownMinutes);
    if (remaining <= 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [viewingTeam?.lastShotAt, event?.cooldownMinutes]);

  const cooldownMs = cooldownRemaining(viewingTeam?.lastShotAt, event?.cooldownMinutes, now);

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

  const myTeam =
    event && currentUser?.discordUserId
      ? teams.find((t) => t.members?.includes(currentUser.discordUserId))
      : null;
  const isSpectator = !!event && event.status === 'ACTIVE' && !myTeam;

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

  if (!isBattleshipEnabled(currentUser)) return <Navigate to="/" replace />;

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
              Placement phase / {event.placementPhaseHours}h window
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
          <Button
            size="xs"
            variant={colorblindMode ? 'solid' : 'outline'}
            colorScheme={colorblindMode ? 'blue' : 'gray'}
            borderColor="#1a4028"
            color={colorblindMode ? 'white' : '#6b9e78'}
            fontFamily="mono"
            fontSize="10px"
            letterSpacing="wider"
            onClick={toggleColorblindMode}
            title="Toggle colorblind-friendly colors"
            _hover={{ borderColor: '#4ade80', color: colorblindMode ? 'white' : '#4ade80' }}
          >
            Colorblind Mode
          </Button>
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
          {isAdmin && (
            <RouterLink to={`/battleship/${eventId}/admin`}>
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
                Admin
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
                Admin / Campaign Setup
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
        <BSGameOverScreen event={event} shotLog={shotLog} />
      </Box>
    );
  }

  // ── Status: ACTIVE (spectator) ────────────────────────────────────────────

  if (isSpectator) {
    return <BSSpectatorView event={event} refetch={refetchEvent} />;
  }

  // ── Status: ACTIVE ────────────────────────────────────────────────────────

  return (
    <Box flex="1" minH="100vh" bg="#060f0a">
      <BSBattleIntroModal
        isOpen={showBattleIntro}
        onClose={() => setShowBattleIntro(false)}
        eventId={event.eventId}
        cooldownMinutes={event.cooldownMinutes}
      />
      {topBar}

      <Box maxW="1400px" mx="auto" px={[4, 6, 8]} py={[6, 8]}>
        <SimpleGrid columns={{ base: 1, xl: 4 }} spacing={6}>
          {/* Main game area (3/4 width on xl) */}
          <Box gridColumn={{ xl: 'span 3' }}>
            <VStack align="stretch" spacing={6}>
              {/* Contextual how-to strip */}
              {(() => {
                const isShipTask = pendingTask ? !!pendingTask.shipType : false;
                const steps = pendingTask
                  ? isShipTask
                    ? [
                        'A ship cell was hit! Complete the task shown below to take that ship section down once and for all!',
                        'Submit your screenshot in Discord with !bssubmit',
                        'A ref will review and mark it complete, then fire again',
                      ]
                    : [
                        'You hit open ocean... Complete the task shown below to get another chance!',
                        'Submit your screenshot in Discord with !bssubmit',
                        'A ref will approve it, or your team can vote to use a skip token',
                      ]
                  : [
                      'Click any unrevealed cell on the enemy board to propose a shot',
                      'Your team votes: one veto cancels it, enough approvals lock it in',
                      'Confirm to fire once the proposal is approved',
                    ];
                const dotColor = pendingTask
                  ? isShipTask
                    ? colorblindMode
                      ? '#fbbf24'
                      : '#f87171'
                    : '#4ade80'
                  : '#4ade80';
                const borderColor = pendingTask
                  ? isShipTask
                    ? colorblindMode
                      ? '#78350f'
                      : '#2d0a0a'
                    : '#1a4028'
                  : '#1a4028';

                return (
                  <Box
                    bg="#060f0a"
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    px={4}
                    py={3}
                  >
                    <HStack
                      spacing={0}
                      align="center"
                      flexWrap="wrap"
                      rowGap={2}
                      divider={
                        <Text fontFamily="mono" fontSize="xs" color="#3d6b4a" mx={3}>
                          /
                        </Text>
                      }
                    >
                      {steps.map((label, i) => (
                        <HStack key={i} spacing={2}>
                          <Box
                            w="16px"
                            h="16px"
                            borderRadius="full"
                            bg="#1a4028"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Text
                              fontFamily="mono"
                              fontSize="9px"
                              color={dotColor}
                              fontWeight="bold"
                            >
                              {i + 1}
                            </Text>
                          </Box>
                          <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                            {label}
                          </Text>
                        </HStack>
                      ))}
                    </HStack>
                  </Box>
                );
              })()}

              {/* Boards */}
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                {/* Your board */}
                <BoardPanel
                  title={`Your Waters / ${viewingTeam?.teamName ?? 'Team'}`}
                  tiles={myTiles}
                  showShips
                  canFire={false}
                  colorblindMode={colorblindMode}
                />

                {/* Opponent board */}
                <BoardPanel
                  title={`Enemy Waters / ${opponentTeam?.teamName ?? 'Opponent'}`}
                  tiles={opponentTiles}
                  showShips={false}
                  onCellClick={event.status === 'ACTIVE' ? handleFireCell : undefined}
                  canFire={canFire}
                  highlightedCell={highlightedCell}
                  radarCell={opponentPendingTile}
                  colorblindMode={colorblindMode}
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
                  const th = isShipTask
                    ? colorblindMode
                      ? {
                          accent: '#fbbf24',
                          accentBright: '#fcd34d',
                          muted: '#78350f',
                          dark: '#2d1a00',
                          border: '#d97706',
                          bg: '#0d0800',
                          cmdBg: '#150d00',
                          submitScheme: 'orange',
                          preScheme: 'orange',
                        }
                      : {
                          accent: '#f87171',
                          accentBright: '#fca5a5',
                          muted: '#7f2020',
                          dark: '#2d0a0a',
                          border: '#c0392b',
                          bg: '#0d0505',
                          cmdBg: '#150505',
                          submitScheme: 'red',
                          preScheme: 'red',
                        }
                    : {
                        accent: '#4ade80',
                        accentBright: '#4ade80',
                        muted: '#3d6b4a',
                        dark: '#1a4028',
                        border: '#22c55e',
                        bg: '#060f0a',
                        cmdBg: '#091a10',
                        submitScheme: 'green',
                        preScheme: 'cyan',
                      };

                  return (
                    <Box
                      bg={th.bg}
                      border="1px solid"
                      borderColor={th.border}
                      borderRadius="md"
                      px={4}
                      py={3}
                    >
                      <HStack justify="space-between" mb={2}>
                        <HStack spacing={2}>
                          <Box w="6px" h="6px" borderRadius="full" bg={th.accent} />
                          <Text
                            fontFamily="mono"
                            fontSize="10px"
                            color={th.accent}
                            letterSpacing="widest"
                            textTransform="uppercase"
                          >
                            Task Revealed / {coordLabel(pendingTask.row, pendingTask.col)}
                          </Text>
                        </HStack>
                        <Badge
                          colorScheme={isShipTask ? (colorblindMode ? 'orange' : 'red') : 'gray'}
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
                        <Text fontFamily="mono" fontSize="xs" color={th.accent} mb={2}>
                          {task.metricLabel}
                        </Text>
                      )}
                      {/* Progress bar — updated live by refs */}
                      <Box mb={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color={th.muted}
                            letterSpacing="wider"
                            textTransform="uppercase"
                          >
                            Progress
                          </Text>
                          <Text
                            fontFamily="mono"
                            fontSize="9px"
                            color={progress >= 100 ? th.accent : th.muted}
                          >
                            {progress}%
                          </Text>
                        </HStack>
                        <Box h="4px" bg={th.dark} borderRadius="full" overflow="hidden">
                          <Box
                            h="100%"
                            w={`${progress}%`}
                            bg={progress >= 100 ? th.accent : '#22d3ee'}
                            borderRadius="full"
                            transition="width 0.4s ease"
                          />
                        </Box>
                      </Box>
                      {/* Discord submission commands */}
                      <Box borderTop="1px solid" borderColor={th.dark} pt={3} mb={2}>
                        {hasMetric && (
                          <Box mb={3}>
                            <Text
                              fontFamily="mono"
                              fontSize="9px"
                              color={th.accentBright}
                              letterSpacing="wider"
                              textTransform="uppercase"
                              mb={1}
                            >
                              📸 Step 1 / Pre-screenshot your current state:
                            </Text>
                            <Text fontFamily="mono" fontSize="9px" color={th.muted} mb={2}>
                              Run this before you start so refs can verify your progress gain.
                            </Text>
                            <HStack spacing={2}>
                              <Box
                                flex={1}
                                bg={th.cmdBg}
                                border="1px solid"
                                borderColor={th.dark}
                                borderRadius="md"
                                px={2}
                                py={1}
                                fontFamily="mono"
                                fontSize="11px"
                                color={th.accentBright}
                              >
                                !bspre
                              </Box>
                              <Button
                                size="xs"
                                colorScheme={th.preScheme}
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
                          color={th.accent}
                          letterSpacing="wider"
                          textTransform="uppercase"
                          mb={1}
                        >
                          {hasMetric
                            ? '🏆 Step 2 / Submit when done:'
                            : '🏆 Submit via Discord when done:'}
                        </Text>
                        <Text fontFamily="mono" fontSize="9px" color={th.muted} mb={2}>
                          Attach your completion screenshot when running the command.
                        </Text>
                        <HStack spacing={2}>
                          <Box
                            flex={1}
                            bg={th.cmdBg}
                            border="1px solid"
                            borderColor={th.dark}
                            borderRadius="md"
                            px={2}
                            py={1}
                            fontFamily="mono"
                            fontSize="11px"
                            color={th.accent}
                          >
                            !bssubmit
                          </Box>
                          <Button
                            size="xs"
                            colorScheme={th.submitScheme}
                            variant="outline"
                            fontFamily="mono"
                            fontSize="9px"
                            onClick={() => copyCmd('!bssubmit')}
                          >
                            Copy
                          </Button>
                        </HStack>
                      </Box>
                      <Text fontFamily="mono" fontSize="10px" color={th.muted} letterSpacing="wide">
                        {isShipTask
                          ? 'Opponents must complete this — refs will mark it done.'
                          : 'Your team must complete this — refs will mark it done.'}
                      </Text>
                      {!isShipTask && (viewingTeam?.skipTokens ?? 0) > 0 && (
                        <Box borderTop="1px solid" borderColor={th.dark} pt={3} mt={2}>
                          <HStack justify="space-between" align="center">
                            <Text fontFamily="mono" fontSize="10px" color={th.muted}>
                              {viewingTeam.skipTokens} skip token
                              {viewingTeam.skipTokens !== 1 ? 's' : ''} remaining
                            </Text>
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme="yellow"
                              fontFamily="mono"
                              fontSize="9px"
                              letterSpacing="wider"
                              isLoading={proposingSkip}
                              isDisabled={!!activeSkipProposal}
                              onClick={() => {
                                proposeSkip({
                                  variables: { tileId: pendingTask.tileId },
                                });
                              }}
                            >
                              {activeSkipProposal ? 'Vote in progress...' : 'Propose Skip'}
                            </Button>
                          </HStack>
                        </Box>
                      )}
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
                    WEAPONS COOLING DOWN / {cooldownLabel} remaining before next salvo
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
                  {event.eventPassword && (
                    <HStack justify="space-between">
                      <Text fontFamily="mono" fontSize="xs" color="#6b9e78">
                        Password
                      </Text>
                      <Text
                        fontFamily="mono"
                        fontSize="xs"
                        color="#facc15"
                        fontWeight="bold"
                        letterSpacing="wider"
                      >
                        {event.eventPassword}
                      </Text>
                    </HStack>
                  )}
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
          colorblindMode={colorblindMode}
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
                firingTeamId: activeProposal.firingTeamId,
              },
            });
          }}
          onClose={() => setActiveProposal(null)}
        />
      )}

      {activeSkipProposal && (
        <SkipProposalModal
          proposal={activeSkipProposal}
          currentDiscordId={currentUser?.discordUserId}
          teamMembers={resolvedTeamMembers}
          votingLoading={votingOnSkip}
          skipping={skipping}
          onVote={(proposalId, approve) => {
            voteOnSkip({ variables: { proposalId, approve } });
          }}
          onSkip={() => {
            if (!activeSkipProposal?.tileId) return;
            skipTile({ variables: { tileId: activeSkipProposal.tileId } });
          }}
          onClose={() => setActiveSkipProposal(null)}
        />
      )}

      {process.env.NODE_ENV !== 'production' && event?.status === 'ACTIVE' && (
        <DevAdminPanel
          pendingTask={pendingTask}
          eventId={eventId}
          proposeShot={proposeShot}
          proposing={proposing}
          teams={teams}
          cooldownMs={cooldownMs}
        />
      )}
    </Box>
  );
}
