import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import {
  Box,
  Center,
  Spinner,
  Text,
  Heading,
  VStack,
  HStack,
  Badge,
  Button,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useLoginUrl } from '../../utils/loginRedirect';
import { useAuth } from '../../providers/AuthProvider';
import {
  MY_SPOOPY_SITUATION,
  SPOOPY_TEAM_BOARD_UPDATED,
  SPOOPY_SPECTATOR_BOARD_UPDATED,
  SPOOPY_SPECTATOR_EVENT_UPDATED,
  CREATE_SPOOPY_SUBMISSION,
  CREATE_SPOOPY_CHOICE,
  ENTER_SPOOPY_HAUNTED_HOUSE,
  GET_SPOOPY_SPECTATOR_EVENT,
  GET_SPOOPY_SPECTATOR_TEAM_BOARD,
  GET_SPOOPY_SPECTATOR_ALL_TEAM_BOARDS,
} from '../../graphql/spoopyOperations';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import SpoopyActiveTasks from '../../organisms/spoopy/SpoopyActiveTasks';
import SpoopyTileDialog from '../../organisms/spoopy/SpoopyTileDialog';
import SpoopyTaskCard from '../../organisms/spoopy/SpoopyTaskCard';
import SpoopyStartModal from '../../organisms/spoopy/SpoopyStartModal';
import SpoopyTaskModal from '../../organisms/spoopy/SpoopyTaskModal';
import SpoopyHauntedHouseModal from '../../organisms/spoopy/SpoopyHauntedHouseModal';
import SpoopyLastHourModal from '../../organisms/spoopy/SpoopyLastHourModal';
import SpoopyCashedOutModal from '../../organisms/spoopy/SpoopyCashedOutModal';
import SpoopyAmbiancePlayer from '../../organisms/spoopy/SpoopyAmbiancePlayer';
import SpoopyRulesModal, { getSpoopyRulesKey } from '../../organisms/spoopy/SpoopyRulesModal';
import SpoopyTutorial, { hasSeenSpoopyTutorial } from '../../organisms/spoopy/SpoopyTutorial';
import SpoopyMossyWildyClue from '../../organisms/spoopy/SpoopyMossyWildyClue';
import SpoopyUiIcon from '../../organisms/spoopy/SpoopyUiIcon';
import { isDevEnv, MOCK_SCREENSHOT_URL } from '../../organisms/spoopy/spoopyDevUtils';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';
import { formatCandy, formatGp } from '../../organisms/spoopy/spoopyCurrency';
import candyIconAsset from '../../assets/spoopy/candy_individual.webp';
import leatherTextureAsset from '../../assets/spoopy/leather.webp';
import allureDrawingAsset from '../../assets/spoopy/alluresdrawing.webp';
import {
  getCompletedSpoopyTileIds,
  hasNewSpoopyCompletion,
  playSpoopySound,
  warmUpSpoopySounds,
} from '../../utils/spoopy/spoopyAudio';

// Curated spooky-lofi loop that plays via the floating ambiance widget.
const SPOOPY_AMBIANCE_YT_ID = 'Wwk7oJRUhqQ';

// /spoopy-event — the main landing page for the halloween event.
//
// Rendering matrix:
//   not authed        → "log in to play" empty state
//   loading           → spinner
//   no event          → "no event yet" empty state
//   status = SETUP    → placeholder art / "coming spooktober" teaser
//   status = COMPLETE → recap: gp banked or forfeited
//   status = ACTIVE, no team → "you're not on a team yet" empty state
//   status = ACTIVE, on team → team board rendered with live tile statuses

export default function SpoopyEventPage() {
  const { isAuthenticated, isCheckingAuth } = useAuth();
  const { data, loading, error, refetch } = useQuery(MY_SPOOPY_SITUATION, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const {
    data: spectatorEventData,
    loading: spectatorEventLoading,
    error: spectatorEventError,
    refetch: refetchSpectatorEvent,
  } = useQuery(GET_SPOOPY_SPECTATOR_EVENT, {
    fetchPolicy: 'cache-and-network',
  });

  const situation = data?.mySpoopySituation ?? { event: null, myTeam: null, teamBoard: null };
  const { myTeam, teamBoard } = situation;
  const event = isAuthenticated
    ? situation.event
    : spectatorEventData?.spoopySpectatorEvent ?? null;
  // Snapshot of completed tile ids tracked ONLY by the subscription path. We
  // seed it once per team from the initial query payload below, then
  // deliberately leave it alone — any refetch that bumps `teamBoard` must
  // not racily overwrite this ref, or we'd silently lose the "new tile
  // completed" signal when the subscription delivery arrives moments later.
  const completedTileIdsRef = useRef(null);
  const seededForTeamRef = useRef(null);
  const eventStatusRef = useRef(null);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  // Post-rules walkthrough that points out the zoom + ambiance controls.
  // Shows once per player per event — stored under its own localStorage
  // key so admins can replay their own rules modal (via Esc) without
  // retriggering the tutorial every time.
  const [tutorialOpen, setTutorialOpen] = useState(false);
  // Apollo's useSubscription captures `onData` at setup — React state inside
  // that closure can be stale by the time a frame arrives. Mirror
  // `rulesAccepted` into a ref so the subscription handler always reads the
  // live value instead of the mount-time `false`.
  const rulesAcceptedRef = useRef(false);
  useEffect(() => {
    rulesAcceptedRef.current = rulesAccepted;
  }, [rulesAccepted]);

  useEffect(() => {
    warmUpSpoopySounds();
  }, []);

  useEffect(() => {
    if (!event?.eventId || event.status !== 'ACTIVE' || !myTeam?.teamId) {
      setRulesOpen(false);
      return;
    }
    let accepted = false;
    try {
      accepted = localStorage.getItem(getSpoopyRulesKey(event.eventId)) === 'true';
    } catch (_) {}
    setRulesAccepted(accepted);
    setRulesOpen(!accepted);
  }, [event?.eventId, event?.status, myTeam?.teamId]);

  // One-shot seed per team. Runs on the very first teamBoard delivery (or
  // whenever the player switches teams) and never again — so the dedicated
  // subscription-only ref above stays authoritative for sound-trigger
  // detection. Resets both refs if the team unsubscribes/clears.
  useEffect(() => {
    if (!myTeam?.teamId) {
      completedTileIdsRef.current = null;
      seededForTeamRef.current = null;
      return;
    }
    if (teamBoard && seededForTeamRef.current !== myTeam.teamId) {
      completedTileIdsRef.current = getCompletedSpoopyTileIds(teamBoard);
      seededForTeamRef.current = myTeam.teamId;
    }
  }, [myTeam?.teamId, teamBoard]);

  useEffect(() => {
    if (!event?.eventId || !event.status) return;
    const previous = eventStatusRef.current;
    // Play the game-over sting when either:
    //  (a) the event transitions ACTIVE → COMPLETE while the page is open, or
    //  (b) the user lands on / refreshes the recap page (previous ref is
    //      either null or pointed at a different event).
    // Autoplay policy still applies — if the browser blocks, the sound stays
    // silent until the user interacts; nothing to do about that here.
    const transitionedToComplete =
      previous?.eventId === event.eventId &&
      previous.status === 'ACTIVE' &&
      event.status === 'COMPLETE';
    const firstViewOfComplete = previous?.eventId !== event.eventId && event.status === 'COMPLETE';
    if (transitionedToComplete || firstViewOfComplete) {
      playSpoopySound('gameOver');
    }
    eventStatusRef.current = { eventId: event.eventId, status: event.status };
  }, [event?.eventId, event?.status]);

  // Event lifecycle changes are separate from team-board updates. Listening
  // here moves open participant and spectator pages to the recap immediately
  // when an admin ends the game.
  useSubscription(SPOOPY_SPECTATOR_EVENT_UPDATED, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId,
    onData: () => {
      refetchSpectatorEvent().catch(() => {});
      if (isAuthenticated) refetch().catch(() => {});
    },
  });

  // Live board updates — the server publishes SPOOPY_TEAM_BOARD_UPDATED_{teamId}
  // whenever a tile transitions (approval/deny/choice/etc.). Mirrors the
  // battleship pattern: inspect the subscription payload directly and play
  // the sound inline before kicking off a refetch to resync the rest of the
  // UI. WebSocket handlers fire in background tabs, so this reaches the
  // player even while the tab is unfocused (modulo browser throttling of
  // the socket itself).
  useSubscription(SPOOPY_TEAM_BOARD_UPDATED, {
    variables: { teamId: myTeam?.teamId },
    skip: !myTeam?.teamId,
    onData: ({ data: subscriptionData }) => {
      const incomingBoard = subscriptionData?.data?.spoopyTeamBoardUpdated;
      if (
        rulesAcceptedRef.current &&
        incomingBoard &&
        hasNewSpoopyCompletion(completedTileIdsRef.current, incomingBoard)
      ) {
        playSpoopySound('taskComplete');
      }
      if (incomingBoard) {
        completedTileIdsRef.current = getCompletedSpoopyTileIds(incomingBoard);
      }
      refetch();
    },
  });

  // Tab-focus refetch — WebSocket subscriptions can drop when the tab is
  // backgrounded (browser throttling / network suspend), so pubsub events
  // fired while the tab was hidden never reach us. Refetching on visibility
  // change guarantees the board is in sync the moment the user comes back.
  // Same pattern battleship uses on its event page.
  useEffect(() => {
    const onFocus = () => {
      refetchSpectatorEvent().catch(() => {});
      if (isAuthenticated) refetch().catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated, refetch, refetchSpectatorEvent]);

  if (isCheckingAuth)
    return (
      <PageShell>
        <CenteredSpinner />
      </PageShell>
    );
  if (!isAuthenticated) {
    if (spectatorEventLoading && !spectatorEventData)
      return (
        <PageShell>
          <CenteredSpinner />
        </PageShell>
      );
    if (spectatorEventError)
      return (
        <PageShell>
          <ErrorState message={spectatorEventError.message} />
        </PageShell>
      );
    if (!event)
      return (
        <PageShell>
          <LoggedOutState />
        </PageShell>
      );
    return (
      <PageShell event={event}>
        <SpectatorView event={event} />
        <SpoopyAmbiancePlayer videoId={SPOOPY_AMBIANCE_YT_ID} />
      </PageShell>
    );
  }
  if (loading && !data)
    return (
      <PageShell>
        <CenteredSpinner />
      </PageShell>
    );
  if (error)
    return (
      <PageShell>
        <ErrorState message={error.message} />
      </PageShell>
    );

  if (!event)
    return (
      <PageShell>
        <NoEventState />
      </PageShell>
    );

  if (event.status === 'SETUP') {
    return (
      <PageShell event={event}>
        <SetupPlaceholder event={event} />
      </PageShell>
    );
  }

  if (event.status === 'COMPLETE') {
    return (
      <PageShell event={event}>
        <CompleteRecap event={event} myTeam={myTeam} />
      </PageShell>
    );
  }

  // ACTIVE
  if (!myTeam) {
    return (
      <PageShell event={event}>
        <SpectatorView event={event} />
        <SpoopyAmbiancePlayer videoId={SPOOPY_AMBIANCE_YT_ID} />
      </PageShell>
    );
  }

  return (
    <PageShell event={event} myTeam={myTeam} onOpenRules={() => setRulesOpen(true)}>
      <TeamHeader event={event} team={myTeam} />
      <ActiveBoard event={event} team={myTeam} teamBoard={teamBoard} refetch={refetch} />
      <SpoopyAmbiancePlayer videoId={SPOOPY_AMBIANCE_YT_ID} />
      <SpoopyRulesModal
        isOpen={rulesOpen}
        onClose={() => setRulesOpen(false)}
        onAccept={() => {
          setRulesAccepted(true);
          setRulesOpen(false);
          // Fire the walkthrough right after the rules close — but only the
          // first time this player sees this event. Deferred a tick so the
          // tutorial's rect measurement happens AFTER the rules modal has
          // fully unmounted (its backdrop would otherwise sit in front).
          if (!hasSeenSpoopyTutorial(event.eventId)) {
            setTimeout(() => setTutorialOpen(true), 150);
          }
        }}
        eventId={event.eventId}
        curfewEnd={event.curfewEnd}
        requiresAcceptance={!rulesAccepted}
      />
      <SpoopyTutorial
        isOpen={tutorialOpen}
        eventId={event.eventId}
        onClose={() => setTutorialOpen(false)}
      />
    </PageShell>
  );
}

// ── Interactive board wrapper ─────────────────────────────────────────

function ActiveBoard({ event, team, teamBoard, refetch }) {
  const toast = useToast();
  const { user } = useAuth();
  const [openTileId, setOpenTileId] = useState(null);
  const [mocking, setMocking] = useState(false);

  const showMockDev = user?.admin === true && isDevEnv();

  const [createSubmission] = useMutation(CREATE_SPOOPY_SUBMISSION);
  const [chooseOption] = useMutation(CREATE_SPOOPY_CHOICE);
  const [mockChoosingLetter, setMockChoosingLetter] = useState(null);

  // Haunted-house warning flow — the modal is a viewer over the server's
  // gauntlet state. We fetch the severity dialog once when the tile opens
  // (via ENTER_SPOOPY_HAUNTED_HOUSE) but the phase is driven purely by
  // teamBoard.hauntedGauntletLevel, which streams live via the team-board
  // subscription while the team runs !stepinside / !imserious / etc.
  const [enterHauntedHouse] = useMutation(ENTER_SPOOPY_HAUNTED_HOUSE);
  const [hauntedInfo, setHauntedInfo] = useState(null);

  // Admin dev shortcut — locks in option A or B without going through the
  // discord bot. Same gating as handleMockSubmit: site admin + dev/staging
  // env only. The site-facing createSpoopyChoice resolver already allows
  // site admins bypass the discord-linked-member check.
  const handleMockChoose = async (tileId, letter) => {
    if (!tileId) return;
    setMockChoosingLetter(letter);
    try {
      await chooseOption({
        variables: { input: { teamId: team.teamId, tileId, option: letter } },
      });
      toast({ title: `mock option ${letter} locked`, status: 'success' });
      await refetch();
    } catch (err) {
      toast({ title: 'mock choice failed', description: err.message, status: 'error' });
    } finally {
      setMockChoosingLetter(null);
    }
  };

  // Admin dev shortcut — fires a mock PRE (informational) then a mock FINAL
  // (advances the tile to SUBMITTED). Uses staff-spoofing on discordUserId
  // so the mock rows are attributed to the admin's own discord id if linked.
  const handleMockSubmit = async (tileId) => {
    if (!tileId) return;
    setMocking(true);
    try {
      await createSubmission({
        variables: {
          input: {
            teamId: team.teamId,
            tileId,
            type: 'PRE',
            screenshotUrl: MOCK_SCREENSHOT_URL,
            discordUserId: user?.discordUserId ?? null,
            discordUsername: user?.displayName ?? user?.username ?? 'mock admin',
          },
        },
      });
      await createSubmission({
        variables: {
          input: {
            teamId: team.teamId,
            tileId,
            type: 'FINAL',
            screenshotUrl: MOCK_SCREENSHOT_URL,
            discordUserId: user?.discordUserId ?? null,
            discordUsername: user?.displayName ?? user?.username ?? 'mock admin',
          },
        },
      });
      toast({ title: 'mock pre + submission fired', status: 'success' });
      await refetch();
    } catch (err) {
      toast({ title: 'mock submit failed', description: err.message, status: 'error' });
    } finally {
      setMocking(false);
    }
  };

  const openTile = openTileId ? event.board.tiles.find((t) => t.id === openTileId) : null;
  const openContent = openTileId ? event.contentById?.[openTileId] : null;
  const openState = openTileId ? teamBoard?.tiles?.[openTileId] : null;

  // Hard-lock interactions once the team has cashed out at the spooky house.
  // The modal rendered below also obscures the board, but the handler guard
  // keeps programmatic paths (active-tasks card, haunted-house redirect) from
  // sneaking a submit through after the team's night is done.
  const hasCashedOut = Boolean(team.cashedOut && !team.cashedOut.forfeited);

  const handleTileClick = async (tileId) => {
    if (hasCashedOut) return;
    const tile = event.board.tiles.find((t) => t.id === tileId);
    if (!tile) return;
    // Candybag gets the special haunted-house warning flow — the tier of
    // warning depends on how far from curfew we are, so fetch fresh each
    // click. All other tile types just open their local modal.
    if (tile.tile_type === 'candybag') {
      setOpenTileId(tileId);
      try {
        const { data } = await enterHauntedHouse({
          variables: { input: { teamId: team.teamId } },
        });
        setHauntedInfo(data?.enterSpoopyHauntedHouse ?? null);
      } catch (err) {
        toast({ title: 'the door is stuck', description: err.message, status: 'error' });
      }
      return;
    }
    // All other tile types — house has trick-or-treat, start has the
    // ready-up story, everything else uses the generic task modal with the
    // progress bar and discord submission hints.
    setOpenTileId(tileId);
  };

  const closeHauntedHouse = () => {
    setOpenTileId(null);
    setHauntedInfo(null);
  };

  const chosenOption = openState?.choice ?? null;
  const chosenOptionData =
    openContent?.dialog && chosenOption ? openContent.dialog.options[chosenOption] : null;

  return (
    <>
      <SpoopyBoard board={event.board} teamState={teamBoard} onTileClick={handleTileClick} />

      {/* Scannable "what's in play right now" panel — lives outside the
          board's scroll area so it stays visible on any screen. Clicking a
          card opens the same tile modal the board opens. */}
      <SpoopyActiveTasks event={event} teamState={teamBoard} onTileClick={handleTileClick} />

      {openTile?.tile_type === 'house' && openContent?.dialog && (
        <SpoopyTileDialog
          isOpen
          onClose={() => setOpenTileId(null)}
          dialog={openContent.dialog}
          choiceMade={chosenOption}
          tileId={openTile.id}
          womEnabled={Boolean(event?.womCompetitionId)}
          onMockSubmit={showMockDev ? () => handleMockSubmit(openTile.id) : null}
          mockSubmitting={mocking}
          onMockChoose={showMockDev ? (letter) => handleMockChoose(openTile.id, letter) : null}
          mockChoosingLetter={mockChoosingLetter}
          resolvedTaskNode={
            chosenOptionData ? (
              <VStack align="stretch" spacing={3}>
                <SpoopyTaskCard
                  task={chosenOptionData.task}
                  status={
                    openState?.status === 'submitted'
                      ? 'submitted'
                      : openState?.status === 'complete'
                      ? 'complete'
                      : 'unlocked'
                  }
                />
                {openTile.id === 't-r12-c8' && chosenOptionData.outcome === 'trick' && (
                  <SpoopyMossyWildyClue locationNumber={team.mossyWildyLocation} />
                )}
              </VStack>
            ) : null
          }
        />
      )}

      {openTile?.tile_type === 'start' && openContent?.story && (
        <SpoopyStartModal
          isOpen
          onClose={() => setOpenTileId(null)}
          story={openContent.story}
          eventPassword={event.eventPassword}
          onMockSubmit={showMockDev ? () => handleMockSubmit(openTile.id) : null}
          mockSubmitting={mocking}
        />
      )}

      {openTile &&
        openTile.tile_type !== 'house' &&
        openTile.tile_type !== 'start' &&
        openTile.tile_type !== 'candybag' &&
        openContent?.task && (
          <SpoopyTaskModal
            isOpen
            onClose={() => setOpenTileId(null)}
            content={openContent}
            tileState={openState}
            tileType={openTile.tile_type}
            womEnabled={Boolean(event?.womCompetitionId)}
            onMockSubmit={showMockDev ? () => handleMockSubmit(openTile.id) : null}
            mockSubmitting={mocking}
          />
        )}

      {openTile?.tile_type === 'candybag' && (
        <SpoopyHauntedHouseModal
          isOpen
          onClose={closeHauntedHouse}
          warningDialog={hauntedInfo?.warningDialog}
          msRemaining={hauntedInfo?.msRemaining ?? 0}
          currentGp={hauntedInfo?.currentGp ?? teamBoard?.gpEarned ?? 0}
          bonusTask={event.hauntedHouse?.task}
          bonusRewardGp={event.hauntedHouse?.bonusReward_gp}
          tileId={openTile.id}
          gauntletLevel={teamBoard?.hauntedGauntletLevel ?? 0}
          onSubmit={closeHauntedHouse}
        />
      )}

      <SpoopyLastHourModal
        eventId={event.eventId}
        curfewEnd={event.curfewEnd}
        cashedOut={team.cashedOut}
        onGoToCandybag={() => {
          const candybagId = event.board?.candybagTileId;
          if (candybagId) handleTileClick(candybagId);
        }}
      />

      <SpoopyCashedOutModal
        isOpen={hasCashedOut}
        gpEarned={team.gpEarned ?? teamBoard?.gpEarned ?? 0}
        teamName={team.teamName}
      />
    </>
  );
}

// ── Shell / states ─────────────────────────────────────────────────────

function PageShell({ event, myTeam, onOpenRules, children }) {
  const { user } = useAuth();
  // Site admin gets a link to the admin surface; site admins + event admins
  // both get a link to the refs queue.
  const isSiteAdmin = user?.admin === true;
  const isEventAdmin =
    event && user ? (event.adminIds ?? []).map(String).includes(String(user.id)) : false;
  const showRefs = isSiteAdmin || isEventAdmin;
  const showAdmin = isSiteAdmin;

  return (
    <Box
      minHeight="calc(100vh - 60px)"
      bg={SPOOPY_COLORS.nightDeep}
      color={SPOOPY_COLORS.paper}
      position="relative"
      // Leather grain sits over the base color at low opacity — no blend
      // mode so the texture shows up regardless of what's behind, but stays
      // subtle enough that the palette still reads. Larger backgroundSize
      // pushes the tiling seams further apart.
      _before={{
        content: '""',
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${leatherTextureAsset})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '520px',
        opacity: 0.2,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Everything inside sits above the leather overlay. */}
      <Box position="relative" zIndex={1}>
        <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={2}
          >
            <VStack align="start" spacing={0}>
              <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
                <HStack as="span" spacing={2}>
                  <SpoopyUiIcon name="pumpkin" />
                  <Text as="span">spoopy event</Text>
                </HStack>
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
            {event && (
              <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
                <Text opacity={0.8} fontSize="sm">
                  {event.eventName}
                </Text>
                <StatusBadge status={event.status} />
                {myTeam && <GpBadge gp={myTeam.gpEarned} cashedOut={myTeam.cashedOut} />}
                {myTeam && onOpenRules && (
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor={SPOOPY_COLORS.nightMist}
                    color={SPOOPY_COLORS.paper}
                    onClick={onOpenRules}
                    _hover={{ bg: SPOOPY_COLORS.nightMist }}
                    leftIcon={<SpoopyUiIcon name="rules" />}
                  >
                    rules
                  </Button>
                )}
                {(showRefs || showAdmin) && (
                  <Box display="flex" gap={2}>
                    {showRefs && (
                      <Button
                        as={RouterLink}
                        to="/spoopy-event/refs"
                        size="sm"
                        variant="outline"
                        borderColor={SPOOPY_COLORS.nightMist}
                        color={SPOOPY_COLORS.paper}
                        _hover={{ bg: SPOOPY_COLORS.nightMist }}
                        leftIcon={<SpoopyUiIcon name="refs" />}
                      >
                        refs
                      </Button>
                    )}
                    {showAdmin && (
                      <Button
                        as={RouterLink}
                        to="/spoopy-event/admin"
                        size="sm"
                        variant="outline"
                        borderColor={SPOOPY_COLORS.nightMist}
                        color={SPOOPY_COLORS.paper}
                        _hover={{ bg: SPOOPY_COLORS.nightMist }}
                        leftIcon={<SpoopyUiIcon name="admin" />}
                      >
                        admin
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
        {children}
      </Box>
    </Box>
  );
}

function StatusBadge({ status }) {
  const map = {
    SETUP: { label: 'coming soon', bg: SPOOPY_COLORS.purple },
    ACTIVE: { label: 'live', bg: SPOOPY_COLORS.pumpkin },
    COMPLETE: { label: 'over', bg: SPOOPY_COLORS.green },
  };
  const m = map[status] ?? { label: status, bg: SPOOPY_COLORS.purple };
  return (
    <Badge
      bg={m.bg}
      color={SPOOPY_COLORS.paper}
      px={2}
      py={1}
      borderRadius="md"
      fontFamily={SPOOPY_FONTS.hand}
      textTransform="lowercase"
    >
      {m.label}
    </Badge>
  );
}

function GpBadge({ gp, cashedOut }) {
  const isForfeited = cashedOut?.forfeited;
  return (
    <Box
      bg={isForfeited ? SPOOPY_COLORS.emberDeep : SPOOPY_COLORS.paper}
      color={isForfeited ? SPOOPY_COLORS.paper : SPOOPY_COLORS.paperInk}
      px={3}
      py={1}
      borderRadius="md"
      fontWeight="700"
      fontSize="sm"
      display="flex"
      alignItems="center"
      gap={2}
    >
      <img
        src={candyIconAsset}
        alt=""
        width={16}
        height={16}
        style={{ objectFit: 'contain', pointerEvents: 'none' }}
      />
      {isForfeited ? 'forfeited' : formatCandy(gp)}
    </Box>
  );
}

// Inline candy count with the individual-candy icon. Reused wherever a
// reward amount is shown to a player.
function CandyStat({ gp, size = 16, color, fontWeight = '600' }) {
  return (
    <Box display="inline-flex" alignItems="center" gap={2} color={color} fontWeight={fontWeight}>
      <img
        src={candyIconAsset}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', pointerEvents: 'none' }}
      />
      <span>{formatCandy(gp)}</span>
    </Box>
  );
}

function CenteredSpinner() {
  return (
    <Center py={20}>
      <Spinner size="xl" color={SPOOPY_COLORS.pumpkin} />
    </Center>
  );
}

function ErrorState({ message }) {
  return (
    <Center py={20}>
      <VStack spacing={3}>
        <Text fontSize="lg">something went wrong</Text>
        <Text opacity={0.7} fontSize="sm">
          {message}
        </Text>
      </VStack>
    </Center>
  );
}

function LoggedOutState() {
  // Hook has to live here so the login URL carries `/spoopy-event` back as
  // the returnTo — the parent page is a Fragment, there's no useLocation
  // available higher up without more plumbing.
  const loginUrl = useLoginUrl();
  return (
    <Center py={20}>
      <VStack spacing={4}>
        <HStack fontFamily={SPOOPY_FONTS.hand} fontSize="2xl" spacing={2}>
          <SpoopyUiIcon name="pumpkin" />
          <Text>log in to trick or treat</Text>
        </HStack>
        <Button
          as={RouterLink}
          to={loginUrl}
          colorScheme="purple"
          leftIcon={<SpoopyUiIcon name="signIn" />}
        >
          log in
        </Button>
      </VStack>
    </Center>
  );
}

function NoEventState() {
  return (
    <Center py={20}>
      <VStack spacing={2}>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl">
          no spoopy event right now
        </Text>
        <HStack opacity={0.7} fontSize="sm" spacing={2}>
          <Text>check back closer to halloween</Text>
          <SpoopyUiIcon name="ghost" />
        </HStack>
      </VStack>
    </Center>
  );
}

// Palette for the "all teams" overlay chips when team.color isn't set. Each
// team gets assigned by index so the color stays stable within a session.
const SPECTATOR_COLORS = [
  '#e07a3b', // pumpkin
  '#5c8aa3', // dusk blue
  '#7a5988', // purple
  '#8c3a2d', // ember
  '#5c7a56', // moss
  '#c4a04a', // mustard
  '#4a6b6f', // teal
  '#9f4f4f', // brick
  '#6b5fa6', // violet
  '#78a35b', // leaf
];

// Builds a tileId → markers map from an array of team board states. Only
// non-locked tiles contribute a marker (locked tiles would be noise since
// nothing's happening there yet). Markers for the same tile stack in the
// bottom-right of the tile cell in SpoopyBoard's TeamMarkerStack.
function buildTeamMarkers(teams, boards) {
  const byTeamId = new Map();
  teams.forEach((t, idx) => {
    byTeamId.set(t.teamId, {
      teamName: t.teamName,
      color: t.color || SPECTATOR_COLORS[idx % SPECTATOR_COLORS.length],
    });
  });

  const markers = {};
  for (const board of boards || []) {
    if (!board?.tiles) continue;
    const meta = byTeamId.get(board.teamId);
    if (!meta) continue;
    for (const [tileId, tileState] of Object.entries(board.tiles)) {
      const status = tileState?.status;
      if (!status || status === 'locked') continue;
      if (!markers[tileId]) markers[tileId] = [];
      markers[tileId].push({
        teamId: board.teamId,
        teamName: meta.teamName,
        color: meta.color,
        status,
      });
    }
  }
  // Sort each tile's markers so complete tiles sit first (most interesting),
  // then submitted, then unlocked. Keeps the chip stack visually priority-ordered.
  const order = { complete: 0, submitted: 1, unlocked: 2 };
  for (const tileId of Object.keys(markers)) {
    markers[tileId].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
  }
  return markers;
}

// Spectator view for admins / event refs who aren't on a team themselves.
// Lists every team on the event as a picker chip, plus an "all teams" chip
// that overlays everyone's current positions as colored markers on the
// shared board. The board is read-only in both modes — no tile click
// handler is wired, so modals never open (same visual as players see, minus
// the interactions).
function SpectatorView({ event }) {
  // Memoize to keep a stable identity across renders — otherwise the `?? []`
  // fallback produces a new array each render, which would re-fire the
  // teamMarkers useMemo below unnecessarily.
  const teams = useMemo(() => event?.teams ?? [], [event?.teams]);
  // null => "all teams" overlay mode. Otherwise a specific teamId.
  const [selectedTeamId, setSelectedTeamId] = useState(() => teams[0]?.teamId ?? null);
  const selectedTeam = teams.find((t) => t.teamId === selectedTeamId) ?? null;
  const isAllTeams = selectedTeamId === '__all__';

  const { data: oneData, refetch: refetchOne } = useQuery(GET_SPOOPY_SPECTATOR_TEAM_BOARD, {
    variables: { teamId: selectedTeamId },
    skip: !selectedTeamId || isAllTeams,
    fetchPolicy: 'cache-and-network',
  });
  const teamBoard = oneData?.spoopySpectatorTeamBoard ?? null;

  // One public, batched baseline powers the all-teams overlay and lets the
  // completion detector distinguish a new completion from tiles that were
  // already complete when the spectator opened the page.
  const {
    data: allData,
    refetch: refetchAll,
    loading: loadingAll,
  } = useQuery(GET_SPOOPY_SPECTATOR_ALL_TEAM_BOARDS, {
    variables: { eventId: event?.eventId },
    skip: !event?.eventId,
    fetchPolicy: 'cache-and-network',
  });
  const allBoards = allData?.spoopySpectatorAllTeamBoards ?? null;
  const completedByTeamRef = useRef(new Map());

  useEffect(() => {
    for (const board of allBoards ?? []) {
      if (!completedByTeamRef.current.has(board.teamId)) {
        completedByTeamRef.current.set(board.teamId, getCompletedSpoopyTileIds(board));
      }
    }
  }, [allBoards]);

  useEffect(() => {
    if (teamBoard && !completedByTeamRef.current.has(teamBoard.teamId)) {
      completedByTeamRef.current.set(teamBoard.teamId, getCompletedSpoopyTileIds(teamBoard));
    }
  }, [teamBoard]);

  const handleSpectatorBoardUpdate = useCallback(
    (teamId, incomingBoard) => {
      if (!incomingBoard) return;
      const previous = completedByTeamRef.current.get(teamId);
      if (previous && hasNewSpoopyCompletion(previous, incomingBoard)) {
        playSpoopySound('taskComplete');
      }
      completedByTeamRef.current.set(teamId, getCompletedSpoopyTileIds(incomingBoard));
      refetchAll().catch(() => {});
      if (!isAllTeams && selectedTeamId === teamId) refetchOne().catch(() => {});
    },
    [isAllTeams, refetchAll, refetchOne, selectedTeamId]
  );

  const teamMarkers = useMemo(
    () => (isAllTeams ? buildTeamMarkers(teams, allBoards) : null),
    [isAllTeams, teams, allBoards]
  );

  if (teams.length === 0) {
    return (
      <Center py={16}>
        <VStack spacing={2} maxW="md" textAlign="center">
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl">
            spectator mode
          </Text>
          <Text opacity={0.75} fontSize="sm">
            no teams on this event yet. once teams are added, pick one here to watch their board.
          </Text>
        </VStack>
      </Center>
    );
  }

  return (
    <VStack align="stretch" spacing={4} py={{ base: 4, md: 6 }} px={{ base: 2, md: 6 }}>
      <SpectatorBoardSubscriptions
        teamIds={teams.map((team) => team.teamId)}
        onBoardUpdate={handleSpectatorBoardUpdate}
      />
      <Box textAlign="center">
        <Badge
          bg={SPOOPY_COLORS.purple}
          color={SPOOPY_COLORS.paper}
          fontFamily={SPOOPY_FONTS.hand}
          textTransform="lowercase"
          fontSize="sm"
          px={3}
          py={1}
        >
          <HStack as="span" spacing={1.5}>
            <SpoopyUiIcon name="eye" />
            <Text as="span">spectator mode</Text>
          </HStack>
        </Badge>
        <Text fontSize="xs" opacity={0.6} mt={1}>
          pick a team to watch their board (updates live), or "all teams" to overlay everyone's
          positions on one map.
        </Text>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={2} justifyContent="center" maxW="900px" mx="auto">
        {teams.map((t, idx) => {
          const isActive = t.teamId === selectedTeamId;
          const forfeited = t.cashedOut?.forfeited;
          const color = t.color || SPECTATOR_COLORS[idx % SPECTATOR_COLORS.length];
          return (
            <Button
              key={t.teamId}
              size="sm"
              bg={isActive ? SPOOPY_COLORS.pumpkin : SPOOPY_COLORS.night}
              color={SPOOPY_COLORS.paper}
              borderWidth="1px"
              borderColor={isActive ? SPOOPY_COLORS.pumpkin : SPOOPY_COLORS.nightMist}
              _hover={{ bg: isActive ? SPOOPY_COLORS.pumpkinDeep : SPOOPY_COLORS.nightMist }}
              onClick={() => setSelectedTeamId(t.teamId)}
              fontFamily={SPOOPY_FONTS.hand}
            >
              {/* Color dot matches the chip color used in the all-teams overlay
                  so the admin can map team → marker at a glance. */}
              <Box
                as="span"
                display="inline-block"
                width="8px"
                height="8px"
                borderRadius="full"
                bg={color}
                mr={2}
              />
              {t.teamName}
              <HStack
                as="span"
                ml={2}
                fontSize="10px"
                opacity={0.8}
                color={forfeited ? SPOOPY_COLORS.ember : SPOOPY_COLORS.paper}
                spacing={1}
              >
                <SpoopyUiIcon name={forfeited ? 'candle' : 'candy'} />
                <Text as="span">{forfeited ? 'forfeited' : formatCandy(t.gpEarned ?? 0)}</Text>
              </HStack>
            </Button>
          );
        })}
        <Button
          size="sm"
          bg={isAllTeams ? SPOOPY_COLORS.pumpkin : SPOOPY_COLORS.night}
          color={SPOOPY_COLORS.paper}
          borderWidth="1px"
          borderColor={isAllTeams ? SPOOPY_COLORS.pumpkin : SPOOPY_COLORS.nightMist}
          _hover={{ bg: isAllTeams ? SPOOPY_COLORS.pumpkinDeep : SPOOPY_COLORS.nightMist }}
          onClick={() => setSelectedTeamId('__all__')}
          fontFamily={SPOOPY_FONTS.hand}
          leftIcon={<SpoopyUiIcon name="map" />}
        >
          all teams
        </Button>
      </Box>

      {isAllTeams ? (
        <Box>
          <Center py={2}>
            <HStack spacing={3}>
              <Text fontSize="xs" opacity={0.65}>
                {loadingAll
                  ? 'loading all teams…'
                  : `${(allBoards ?? []).length} team board${
                      (allBoards ?? []).length === 1 ? '' : 's'
                    } overlaid`}
              </Text>
              <Button
                size="xs"
                variant="outline"
                borderColor={SPOOPY_COLORS.nightMist}
                color={SPOOPY_COLORS.paper}
                _hover={{ bg: SPOOPY_COLORS.nightMist }}
                onClick={() => refetchAll().catch(() => {})}
                leftIcon={<SpoopyUiIcon name="sync" />}
              >
                refresh
              </Button>
            </HStack>
          </Center>
          <SpoopyBoard board={event.board} teamMarkers={teamMarkers} />
        </Box>
      ) : selectedTeam ? (
        <Box>
          <TeamHeader event={event} team={selectedTeam} />
          <SpoopyBoard board={event.board} teamState={teamBoard} />
        </Box>
      ) : null}
    </VStack>
  );
}

function SpectatorBoardSubscriptions({ teamIds, onBoardUpdate }) {
  return teamIds.map((teamId) => (
    <SpectatorBoardSubscription
      key={teamId}
      teamId={teamId}
      onBoardUpdate={onBoardUpdate}
    />
  ));
}

function SpectatorBoardSubscription({ teamId, onBoardUpdate }) {
  useSubscription(SPOOPY_SPECTATOR_BOARD_UPDATED, {
    variables: { teamId },
    onData: ({ data: subscriptionData }) => {
      onBoardUpdate(teamId, subscriptionData?.data?.spoopySpectatorBoardUpdated ?? null);
    },
  });
  return null;
}

function SetupPlaceholder({ event }) {
  // Deliberate placeholder — real teaser art / video will drop in here, same
  // vibe as rainbow's pre-launch page. Keeping the copy warm and low-key.
  return (
    <Center py={{ base: 12, md: 20 }} px={4}>
      <VStack spacing={6} maxW="xl" textAlign="center">
        <HStack fontSize={{ base: '5xl', md: '7xl' }} lineHeight={1} spacing={4}>
          <SpoopyUiIcon name="pumpkin" />
          <SpoopyUiIcon name="ghost" />
          <SpoopyUiIcon name="candle" />
        </HStack>
        <Heading size="xl" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wide">
          {event.eventName}
        </Heading>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="xl" opacity={0.9}>
          coming soon...
        </Text>
        <Text opacity={0.75} fontSize="sm">
          teams will trick-or-treat their way down a haunted street. cash out at the spooky house
          before curfew, or lose everything. more details closer to the night.
        </Text>
        {event.curfewStart && (
          <Text fontSize="sm" opacity={0.7}>
            starts{' '}
            <Text as="span" fontFamily={SPOOPY_FONTS.hand} color={SPOOPY_COLORS.pumpkinLight}>
              {new Date(event.curfewStart).toLocaleString()}
            </Text>
          </Text>
        )}
      </VStack>
    </Center>
  );
}

function CompleteRecap({ event, myTeam }) {
  const teams = event?.teams ?? [];
  // Sort by final haul, high → low. Forfeited teams naturally end up at
  // the bottom since gpEarned is zeroed on curfew.
  const ranked = [...teams].sort((a, b) => (b.gpEarned ?? 0) - (a.gpEarned ?? 0));
  const winner = ranked.find((t) => !t.cashedOut?.forfeited && (t.gpEarned ?? 0) > 0) ?? null;
  const cashedOutCount = teams.filter((t) => t.cashedOut && !t.cashedOut.forfeited).length;
  const forfeitedCount = teams.filter((t) => t.cashedOut?.forfeited).length;
  const totalGp = teams.reduce((sum, t) => sum + (t.gpEarned ?? 0), 0);

  return (
    <Center py={{ base: 8, md: 16 }} px={4}>
      <VStack spacing={8} maxW="900px" textAlign="center" w="100%">
        {/* Dramatic opener — the sun is up, bats are scattering, the party's
            over. Scattered icons at casual rotations do the heavy lifting. */}
        <VStack spacing={3} position="relative" w="100%">
          <HStack
            spacing={{ base: 4, md: 8 }}
            fontSize={{ base: '3xl', md: '5xl' }}
            lineHeight={1}
            justify="center"
            opacity={0.9}
          >
            <Box transform="rotate(-14deg)" color={SPOOPY_COLORS.pumpkin}>
              <SpoopyUiIcon name="pumpkin" />
            </Box>
            <Box transform="rotate(6deg)" color={SPOOPY_COLORS.paper}>
              <SpoopyUiIcon name="ghost" />
            </Box>
            <Box transform="rotate(-4deg)" color={SPOOPY_COLORS.ember}>
              <SpoopyUiIcon name="candle" />
            </Box>
            <Box transform="rotate(10deg)" color={SPOOPY_COLORS.paper}>
              <SpoopyUiIcon name="skull" />
            </Box>
            <Box transform="rotate(-8deg)" color={SPOOPY_COLORS.pumpkinLight}>
              <SpoopyUiIcon name="pumpkin" />
            </Box>
          </HStack>
          <Heading
            size={{ base: 'xl', md: '2xl' }}
            fontFamily={SPOOPY_FONTS.heading}
            letterSpacing="wider"
            color={SPOOPY_COLORS.paper}
          >
            the night is over
          </Heading>
          <Text
            fontFamily={SPOOPY_FONTS.hand}
            fontSize={{ base: 'md', md: 'lg' }}
            opacity={0.75}
            maxW="520px"
          >
            the sun comes up over the neighborhood. porch lights blink off, one by one.
            {' ' + event.eventName} has wrapped. here's how it all shook out.
          </Text>
        </VStack>

        {/* Event-wide stats strip — quick scannable numbers for the whole
            night. All sourced from the team roster so nothing extra needs
            fetching. */}
        <HStack
          spacing={{ base: 2, md: 4 }}
          align="stretch"
          w="100%"
          justify="center"
          flexWrap="wrap"
        >
          <StatCard
            icon="candy"
            iconColor={SPOOPY_COLORS.pumpkin}
            value={formatCandy(totalGp)}
            label="candies banked"
          />
          <StatCard
            icon="house"
            iconColor={SPOOPY_COLORS.paper}
            value={`${cashedOutCount} / ${teams.length}`}
            label="teams made it home"
          />
          <StatCard
            icon="candle"
            iconColor={SPOOPY_COLORS.ember}
            value={String(forfeitedCount)}
            label={forfeitedCount === 1 ? 'team forfeited' : 'teams forfeited'}
          />
        </HStack>

        {/* Winner spotlight — big crown + name + haul. Only shows when a team
            actually cashed out something; a forfeited-only night skips this
            section rather than crowning someone who banked zero. */}
        {winner && (
          <VStack
            spacing={2}
            bg={`linear-gradient(180deg, ${SPOOPY_COLORS.pumpkinDeep} 0%, ${SPOOPY_COLORS.night} 100%)`}
            border="2px solid"
            borderColor={SPOOPY_COLORS.pumpkin}
            borderRadius="xl"
            px={{ base: 5, md: 8 }}
            py={{ base: 4, md: 6 }}
            w="100%"
            maxW="640px"
            boxShadow={`0 0 30px rgba(238, 118, 35, 0.25)`}
          >
            <HStack spacing={2} opacity={0.85}>
              <SpoopyUiIcon name="trophy" color={SPOOPY_COLORS.pumpkinLight} />
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize="sm"
                letterSpacing="widest"
                textTransform="uppercase"
                color={SPOOPY_COLORS.pumpkinLight}
              >
                top of the street
              </Text>
              <SpoopyUiIcon name="trophy" color={SPOOPY_COLORS.pumpkinLight} />
            </HStack>
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              fontFamily={SPOOPY_FONTS.heading}
              color={SPOOPY_COLORS.paper}
            >
              {winner.teamName}
            </Heading>
            <HStack spacing={2}>
              <Box as="img" src={candyIconAsset} alt="candy" w="24px" h="24px" />
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize={{ base: 'xl', md: '2xl' }}
                color={SPOOPY_COLORS.paper}
              >
                {formatCandy(winner.gpEarned ?? 0)}
              </Text>
            </HStack>
            <Text fontSize="xs" opacity={0.7}>
              ({formatGp(winner.gpEarned ?? 0)})
            </Text>
            {myTeam && winner.teamId === myTeam.teamId && (
              <Text
                fontFamily={SPOOPY_FONTS.hand}
                fontSize="md"
                color={SPOOPY_COLORS.pumpkinLight}
                mt={1}
              >
                ✨ that's you! happy halloween ✨
              </Text>
            )}
          </VStack>
        )}

        {/* Full leaderboard — framed as a hand-drawn tally sheet. */}
        <Box
          bg={SPOOPY_COLORS.paper}
          color={SPOOPY_COLORS.paperInk}
          border="3px solid"
          borderColor={SPOOPY_COLORS.paperEdge}
          borderRadius="lg"
          p={{ base: 4, md: 6 }}
          w="100%"
          transform="rotate(-0.3deg)"
        >
          <HStack
            fontFamily={SPOOPY_FONTS.hand}
            fontSize="lg"
            mb={4}
            lineHeight={1.4}
            justify="center"
          >
            <SpoopyUiIcon name="candy" flexShrink={0} />
            <Text>
              final tally! we can't pay you in candies, but hopefully the gp equivalent will do.
            </Text>
            <SpoopyUiIcon name="candy" flexShrink={0} />
          </HStack>

          {ranked.length === 0 ? (
            <Text opacity={0.7}>no teams to tally.</Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {ranked.map((team, i) => (
                <TeamHaulRow
                  key={team.teamId}
                  team={team}
                  rank={i + 1}
                  isYou={myTeam && team.teamId === myTeam.teamId}
                />
              ))}
            </VStack>
          )}
        </Box>

        {myTeam?.cashedOut?.forfeited && (
          <HStack
            spacing={2}
            fontFamily={SPOOPY_FONTS.hand}
            fontSize="sm"
            opacity={0.8}
            color={SPOOPY_COLORS.ember}
          >
            <SpoopyUiIcon name="candle" />
            <Text>
              your team didn't make it to the spooky house in time. curfew hit and the sweets
              vanished. better luck next spooktober.
            </Text>
          </HStack>
        )}

        {/* Signoff piece — a framed drawing by allure. Sits at the bottom of
            the recap so it reads as a "signed & sealed" close to the event
            rather than competing with the leaderboard for attention. */}
        <VStack spacing={2} pt={4}>
          <Text
            fontFamily={SPOOPY_FONTS.hand}
            fontSize="sm"
            opacity={0.6}
            letterSpacing="widest"
            textTransform="uppercase"
          >
            — a scene from the night —
          </Text>
          <Box
            // Chunky paper frame with a subtle drop shadow. Rotation matches
            // the other paper elements on the page for a hand-placed feel.
            bg={SPOOPY_COLORS.paper}
            border="6px solid"
            borderColor={SPOOPY_COLORS.paperEdge}
            borderRadius="sm"
            p={2}
            transform="rotate(1.2deg)"
            boxShadow={`0 12px 0 ${SPOOPY_COLORS.paperShadow}, 0 20px 40px rgba(0,0,0,0.35)`}
            maxW="780px"
          >
            <Box
              as="img"
              src={allureDrawingAsset}
              alt="a drawing by allure"
              display="block"
              w="100%"
              h="auto"
              borderRadius="sm"
            />
          </Box>
          <Text
            fontFamily={SPOOPY_FONTS.hand}
            fontSize="sm"
            opacity={0.7}
            transform="rotate(-0.6deg)"
            mt="16px"
          >
            drawn by allure
          </Text>
        </VStack>

        <Text
          fontFamily={SPOOPY_FONTS.heading}
          fontSize={{ base: 'xl', md: '2xl' }}
          letterSpacing="wider"
          color={SPOOPY_COLORS.pumpkinLight}
          pt={4}
        >
          🎃 happy halloween, ghouls and ghasts, now please go shake some ass 🎃
        </Text>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="sm" opacity={0.7} mt="16px">
          i hope you had fun. i had a lot of fun building this one. special thanks to allure for
          help with the art and the great trick-or-treat related idea in the first place :) i hope
          y'all look forward to the last lemon event i'm running in december, and as always, thank
          you for playing.{' '}
        </Text>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="sm" opacity={0.7}>
          love, lemon{' '}
        </Text>
      </VStack>
    </Center>
  );
}

// Small stat tile used by the recap's event-wide stats strip. Fixed-ish
// width + flex-wrap in the parent so three cards sit neatly in a row on
// desktop and stack cleanly on narrow screens.
function StatCard({ icon, iconColor, value, label }) {
  return (
    <VStack
      spacing={1}
      bg="rgba(30, 20, 37, 0.45)"
      border="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
      borderRadius="md"
      px={{ base: 3, md: 5 }}
      py={{ base: 3, md: 4 }}
      minW={{ base: '140px', md: '180px' }}
      flex="1"
    >
      <Box fontSize="2xl" color={iconColor}>
        <SpoopyUiIcon name={icon} />
      </Box>
      <Text
        fontFamily={SPOOPY_FONTS.hand}
        fontSize={{ base: 'xl', md: '2xl' }}
        color={SPOOPY_COLORS.paper}
        lineHeight={1}
      >
        {value}
      </Text>
      <Text fontSize="xs" opacity={0.7} letterSpacing="wider">
        {label}
      </Text>
    </VStack>
  );
}

function TeamHaulRow({ team, rank, isYou }) {
  const forfeited = team.cashedOut?.forfeited;
  const gp = team.gpEarned ?? 0;
  const medalColor = rank === 1 ? '#b8860b' : rank === 2 ? '#6f7782' : '#a05a2c';
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      bg={isYou ? SPOOPY_COLORS.paperShadow : 'transparent'}
      border={isYou ? '2px dashed' : '1px solid'}
      borderColor={isYou ? SPOOPY_COLORS.pumpkin : 'rgba(0,0,0,0.1)'}
      borderRadius="md"
      px={4}
      py={3}
      gap={3}
    >
      <Box display="flex" alignItems="center" gap={3} minW={0}>
        {rank <= 3 ? (
          <SpoopyUiIcon name="medal" color={medalColor} boxSize={5} minW="32px" />
        ) : (
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" minW="32px">
            #{rank}
          </Text>
        )}
        <VStack align="start" spacing={0} minW={0}>
          <Text fontWeight="bold" fontSize="md" isTruncated>
            {team.teamName}
            {isYou && (
              <Text as="span" ml={2} fontSize="xs" opacity={0.7} fontFamily={SPOOPY_FONTS.hand}>
                (your team)
              </Text>
            )}
          </Text>
          {forfeited && (
            <HStack
              fontSize="xs"
              color={SPOOPY_COLORS.emberDeep}
              fontFamily={SPOOPY_FONTS.hand}
              spacing={1}
            >
              <SpoopyUiIcon name="candle" />
              <Text>forfeited at curfew</Text>
            </HStack>
          )}
        </VStack>
      </Box>
      <VStack align="end" spacing={0}>
        <CandyStat gp={gp} size={18} color={SPOOPY_COLORS.pumpkinDeep} />
        <Text fontSize="xs" opacity={0.65}>
          {formatGp(gp)}
        </Text>
      </VStack>
    </Box>
  );
}

function TeamHeader({ event, team }) {
  const curfewEnd = event.curfewEnd ? new Date(event.curfewEnd) : null;
  return (
    <Box
      px={{ base: 4, md: 8 }}
      py={3}
      bg={SPOOPY_COLORS.night}
      borderBottom="1px solid"
      borderColor={SPOOPY_COLORS.nightMist}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      flexWrap="wrap"
      gap={3}
    >
      <VStack align="start" spacing={0}>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">
          team {team.teamName}
        </Text>
        <Text fontSize="xs" opacity={0.7}>
          {team.members?.length ?? 0} members
        </Text>
      </VStack>
      {curfewEnd && (
        <VStack align="end" spacing={0}>
          <Text fontSize="xs" opacity={0.7}>
            curfew
          </Text>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
            {curfewEnd.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </VStack>
      )}
    </Box>
  );
}
