import React, { useEffect, useState } from 'react';
import { useQuery, useSubscription, useMutation } from '@apollo/client';
import { Box, Center, Spinner, Text, Heading, VStack, Badge, Button, useToast } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import {
  MY_SPOOPY_SITUATION,
  SPOOPY_TEAM_BOARD_UPDATED,
  CREATE_SPOOPY_SUBMISSION,
  CREATE_SPOOPY_CHOICE,
  ENTER_SPOOPY_HAUNTED_HOUSE,
} from '../../graphql/spoopyOperations';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import SpoopyTileDialog from '../../organisms/spoopy/SpoopyTileDialog';
import SpoopyTaskCard from '../../organisms/spoopy/SpoopyTaskCard';
import SpoopyStartModal from '../../organisms/spoopy/SpoopyStartModal';
import SpoopyTaskModal from '../../organisms/spoopy/SpoopyTaskModal';
import SpoopyHauntedHouseModal from '../../organisms/spoopy/SpoopyHauntedHouseModal';
import SpoopyAmbiancePlayer from '../../organisms/spoopy/SpoopyAmbiancePlayer';
import { isDevEnv, MOCK_SCREENSHOT_URL } from '../../organisms/spoopy/spoopyDevUtils';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';
import { formatCandy, formatGp } from '../../organisms/spoopy/spoopyCurrency';
import candyIconAsset from '../../assets/spoopy/candy_individual.webp';
import leatherTextureAsset from '../../assets/spoopy/leather.webp';

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

  const situation = data?.mySpoopySituation ?? { event: null, myTeam: null, teamBoard: null };
  const { event, myTeam, teamBoard } = situation;

  // Live board updates — the server publishes SPOOPY_TEAM_BOARD_UPDATED_{teamId}
  // whenever a tile transitions (approval/deny/choice/etc.). Subscribing here
  // keeps the visible board in sync without polling.
  useSubscription(SPOOPY_TEAM_BOARD_UPDATED, {
    variables: { teamId: myTeam?.teamId },
    skip: !myTeam?.teamId,
    onData: () => {
      // Simplest correct approach — refetch the situation so team gp, cashedOut,
      // and per-tile state all update together. Subscription payload already
      // contains the board state; we could update the cache directly, but
      // refetch keeps this component free of cache-shape assumptions.
      refetch();
    },
  });

  // Tab-focus refetch — WebSocket subscriptions can drop when the tab is
  // backgrounded (browser throttling / network suspend), so pubsub events
  // fired while the tab was hidden never reach us. Refetching on visibility
  // change guarantees the board is in sync the moment the user comes back.
  // Same pattern battleship uses on its event page.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const onFocus = () => refetch().catch(() => {});
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isAuthenticated, refetch]);

  if (isCheckingAuth) return <PageShell><CenteredSpinner /></PageShell>;
  if (!isAuthenticated) return <PageShell><LoggedOutState /></PageShell>;
  if (loading && !data) return <PageShell><CenteredSpinner /></PageShell>;
  if (error) return <PageShell><ErrorState message={error.message} /></PageShell>;

  if (!event) return <PageShell><NoEventState /></PageShell>;

  if (event.status === 'SETUP') {
    return <PageShell event={event}><SetupPlaceholder event={event} /></PageShell>;
  }

  if (event.status === 'COMPLETE') {
    return <PageShell event={event}><CompleteRecap event={event} myTeam={myTeam} /></PageShell>;
  }

  // ACTIVE
  if (!myTeam) {
    return <PageShell event={event}><NotOnTeamState event={event} /></PageShell>;
  }

  return (
    <PageShell event={event} myTeam={myTeam}>
      <TeamHeader event={event} team={myTeam} />
      <ActiveBoard event={event} team={myTeam} teamBoard={teamBoard} refetch={refetch} />
      <SpoopyAmbiancePlayer videoId={SPOOPY_AMBIANCE_YT_ID} />
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

  const handleTileClick = async (tileId) => {
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

      {openTile?.tile_type === 'house' && openContent?.dialog && (
        <SpoopyTileDialog
          isOpen
          onClose={() => setOpenTileId(null)}
          dialog={openContent.dialog}
          choiceMade={chosenOption}
          tileId={openTile.id}
          onMockSubmit={showMockDev ? () => handleMockSubmit(openTile.id) : null}
          mockSubmitting={mocking}
          onMockChoose={showMockDev ? (letter) => handleMockChoose(openTile.id, letter) : null}
          mockChoosingLetter={mockChoosingLetter}
          resolvedTaskNode={
            chosenOptionData ? (
              <SpoopyTaskCard
                task={chosenOptionData.task}
                rewardGp={chosenOptionData.reward_gp}
                status={openState?.status === 'submitted' ? 'submitted' : (openState?.status === 'complete' ? 'complete' : 'unlocked')}
              />
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

      {openTile
        && openTile.tile_type !== 'house'
        && openTile.tile_type !== 'start'
        && openTile.tile_type !== 'candybag'
        && openContent?.task && (
        <SpoopyTaskModal
          isOpen
          onClose={() => setOpenTileId(null)}
          content={openContent}
          tileState={openState}
          tileType={openTile.tile_type}
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
    </>
  );
}

// ── Shell / states ─────────────────────────────────────────────────────

function PageShell({ event, myTeam, children }) {
  const { user } = useAuth();
  // Site admin gets a link to the admin surface; site admins + event admins
  // both get a link to the refs queue.
  const isSiteAdmin = user?.admin === true;
  const isEventAdmin = event && user
    ? (event.adminIds ?? []).map(String).includes(String(user.id))
    : false;
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
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <VStack align="start" spacing={0}>
            <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
              🎃 spoopy event
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
              <Text opacity={0.8} fontSize="sm">{event.eventName}</Text>
              <StatusBadge status={event.status} />
              {myTeam && <GpBadge gp={myTeam.gpEarned} cashedOut={myTeam.cashedOut} />}
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
                    >
                      🕯️ refs
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
                    >
                      🎃 admin
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
    SETUP:    { label: 'coming soon', bg: SPOOPY_COLORS.purple },
    ACTIVE:   { label: 'live',        bg: SPOOPY_COLORS.pumpkin },
    COMPLETE: { label: 'over',        bg: SPOOPY_COLORS.green },
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
  return <Center py={20}><Spinner size="xl" color={SPOOPY_COLORS.pumpkin} /></Center>;
}

function ErrorState({ message }) {
  return (
    <Center py={20}>
      <VStack spacing={3}>
        <Text fontSize="lg">something went wrong</Text>
        <Text opacity={0.7} fontSize="sm">{message}</Text>
      </VStack>
    </Center>
  );
}

function LoggedOutState() {
  return (
    <Center py={20}>
      <VStack spacing={4}>
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl">
          🎃 log in to trick or treat
        </Text>
        <Button as={RouterLink} to="/login" colorScheme="purple">
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
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl">no spoopy event right now</Text>
        <Text opacity={0.7} fontSize="sm">check back closer to halloween 👻</Text>
      </VStack>
    </Center>
  );
}

function NotOnTeamState({ event }) {
  return (
    <Center py={20}>
      <VStack spacing={2} maxW="md" textAlign="center">
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl">you're not on a team yet</Text>
        <Text opacity={0.75} fontSize="sm">
          {event.eventName} is live, but your discord id isn't on a team roster yet. talk to an event
          admin to get signed up, or make sure your discord is linked to your profile.
        </Text>
      </VStack>
    </Center>
  );
}

function SetupPlaceholder({ event }) {
  // Deliberate placeholder — real teaser art / video will drop in here, same
  // vibe as rainbow's pre-launch page. Keeping the copy warm and low-key.
  return (
    <Center py={{ base: 12, md: 20 }} px={4}>
      <VStack spacing={6} maxW="xl" textAlign="center">
        <Text fontSize={{ base: '6xl', md: '8xl' }} lineHeight={1}>
          🎃👻🕯️
        </Text>
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

  return (
    <Center py={{ base: 8, md: 16 }} px={4}>
      <VStack spacing={6} maxW="2xl" textAlign="center" w="100%">
        <Text fontSize="6xl">🎃</Text>
        <Heading size="xl" fontFamily={SPOOPY_FONTS.heading}>
          {event.eventName} is over
        </Heading>

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
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" mb={4} lineHeight={1.4}>
            well, we can't pay you in candies… but we hope the gp equivalent is sufficient. 🍬
          </Text>

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
          <Text opacity={0.75} fontSize="sm">
            your team didn't make it to the spooky house in time. curfew hit and the sweets vanished.
            better luck next spooktober!
          </Text>
        )}
      </VStack>
    </Center>
  );
}

function TeamHaulRow({ team, rank, isYou }) {
  const forfeited = team.cashedOut?.forfeited;
  const gp = team.gpEarned ?? 0;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
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
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg" minW="32px">
          {medal}
        </Text>
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
            <Text fontSize="xs" color={SPOOPY_COLORS.emberDeep} fontFamily={SPOOPY_FONTS.hand}>
              🕯️ forfeited at curfew
            </Text>
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
        <Text fontFamily={SPOOPY_FONTS.hand} fontSize="lg">team {team.teamName}</Text>
        <Text fontSize="xs" opacity={0.7}>{team.members?.length ?? 0} members</Text>
      </VStack>
      {curfewEnd && (
        <VStack align="end" spacing={0}>
          <Text fontSize="xs" opacity={0.7}>curfew</Text>
          <Text fontFamily={SPOOPY_FONTS.hand} fontSize="md">
            {curfewEnd.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </VStack>
      )}
    </Box>
  );
}
