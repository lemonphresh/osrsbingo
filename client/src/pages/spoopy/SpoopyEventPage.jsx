import React from 'react';
import { useQuery, useSubscription } from '@apollo/client';
import { Box, Center, Spinner, Text, Heading, VStack, Badge, Button } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import {
  MY_SPOOPY_SITUATION,
  SPOOPY_TEAM_BOARD_UPDATED,
} from '../../graphql/spoopyOperations';
import SpoopyBoard from '../../organisms/spoopy/SpoopyBoard';
import { SPOOPY_COLORS, SPOOPY_FONTS } from '../../organisms/spoopy/spoopyTheme';

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
      <SpoopyBoard board={event.board} teamState={teamBoard} />
    </PageShell>
  );
}

// ── Shell / states ─────────────────────────────────────────────────────

function PageShell({ event, myTeam, children }) {
  return (
    <Box minHeight="calc(100vh - 60px)" bg={SPOOPY_COLORS.nightDeep} color={SPOOPY_COLORS.paper}>
      <Box borderBottom="2px solid" borderColor={SPOOPY_COLORS.nightMist} py={3} px={6}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Heading size="lg" fontFamily={SPOOPY_FONTS.heading} letterSpacing="wider">
            🎃 spoopy event
          </Heading>
          {event && (
            <Box display="flex" alignItems="center" gap={3}>
              <Text opacity={0.8} fontSize="sm">{event.eventName}</Text>
              <StatusBadge status={event.status} />
              {myTeam && <GpBadge gp={myTeam.gpEarned} cashedOut={myTeam.cashedOut} />}
            </Box>
          )}
        </Box>
      </Box>
      {children}
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
    >
      {isForfeited ? '0 gp — forfeited' : `${(gp ?? 0).toLocaleString()} gp`}
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
  const cashedOut = myTeam?.cashedOut;
  const forfeited = cashedOut?.forfeited;
  return (
    <Center py={20}>
      <VStack spacing={4} maxW="xl" textAlign="center">
        <Text fontSize="6xl">{forfeited ? '🕯️' : '🎃'}</Text>
        <Heading size="xl" fontFamily={SPOOPY_FONTS.heading}>
          {event.eventName} is over
        </Heading>
        {myTeam ? (
          forfeited ? (
            <Text opacity={0.8}>
              your team didn't make it to the spooky house in time. curfew hit and the sweets
              vanished. better luck next spooktober!
            </Text>
          ) : cashedOut ? (
            <Text fontFamily={SPOOPY_FONTS.hand} fontSize="2xl" color={SPOOPY_COLORS.pumpkinLight}>
              {(myTeam.gpEarned ?? 0).toLocaleString()} gp banked
            </Text>
          ) : (
            <Text opacity={0.8}>final results are being tallied up.</Text>
          )
        ) : (
          <Text opacity={0.8}>thanks for watching! recap will be posted soon.</Text>
        )}
      </VStack>
    </Center>
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
