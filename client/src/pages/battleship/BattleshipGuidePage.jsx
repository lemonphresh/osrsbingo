import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, HStack, Text, SimpleGrid, Button, Icon } from '@chakra-ui/react';
import { FaArrowLeft, FaExclamationTriangle, FaInfoCircle, FaLock } from 'react-icons/fa';
import usePageTitle from '../../hooks/usePageTitle';

const NAVY = '#071523';
const BORDER = '#1e4976';
const CYAN = '#38bdf8';
const DIM = '#94a3b8';
const GREEN = '#4ade80';
const AMBER = '#fbbf24';
const PINK = '#f472b6';
const RED = '#f87171';

const TABS = ['Participants', 'Refs'];

function SectionHeader({ children }) {
  return (
    <Text
      fontFamily="mono"
      fontSize="xs"
      color={CYAN}
      letterSpacing="widest"
      textTransform="uppercase"
      mb={4}
      mt={8}
      borderBottom="1px solid"
      borderColor={BORDER}
      pb={2}
    >
      {children}
    </Text>
  );
}

function Step({ num, title, color = CYAN, children }) {
  return (
    <HStack align="flex-start" spacing={4} mb={4}>
      <Box
        flexShrink={0}
        w="28px"
        h="28px"
        border="1px solid"
        borderColor={color}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontFamily="mono" fontSize="xs" color={color} fontWeight="bold">
          {num}
        </Text>
      </Box>
      <Box>
        {title && (
          <Text fontFamily="mono" fontSize="sm" fontWeight="bold" color={color} mb={1}>
            {title}
          </Text>
        )}
        <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.9">
          {children}
        </Text>
      </Box>
    </HStack>
  );
}

function Callout({ color = BORDER, icon, children }) {
  return (
    <Box
      bg="#0d2137"
      border="1px solid"
      borderLeftWidth="3px"
      borderColor={BORDER}
      borderLeftColor={color}
      borderRadius="md"
      p={4}
      mb={4}
    >
      <HStack align="flex-start" spacing={3}>
        {icon && <Icon as={icon} color={color} boxSize={3} mt="2px" flexShrink={0} />}
        <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.9">
          {children}
        </Text>
      </HStack>
    </Box>
  );
}

function ParticipantGuide() {
  return (
    <Box>
      <Callout color={GREEN} icon={FaInfoCircle}>
        You&apos;re on a team of OSRS players squaring off against another team. Your goal: sink all
        five enemy ships by proposing shots, voting with your team, and completing the OSRS tasks
        that get revealed on every hit and miss.
      </Callout>

      <SectionHeader>Before You Play</SectionHeader>
      <Step num="1" title="Get on the roster" color={GREEN}>
        The event admin adds you by Discord ID. Link your Discord to your OSRS Bingo Hub account so
        the site can recognize you as a team member. Without it, you can&apos;t propose, vote, or
        submit tasks.
      </Step>
      <Step num="2" title="Turn on sound and pick a volume" color={GREEN}>
        The volume icon in the top bar sets a master level for radar pings, splashes, and ship-hit
        SFX. There&apos;s a test-sound button in the popover so you can dial it in. Sounds fire even
        when the tab is backgrounded once you&apos;ve interacted with the page, so treat them like
        notifications.
      </Step>

      <SectionHeader>Placement Phase</SectionHeader>
      <Callout color={GREEN} icon={FaInfoCircle}>
        Everyone on your team workshops a ship layout privately, then shares it as a suggestion for
        the team to vote on. Whichever layout has the most votes when placement ends becomes the
        team&apos;s fleet. Ties break at random.
      </Callout>
      <Step num="1" title="Workshop your layout" color={GREEN}>
        Click cells on your board to place all five ships (Carrier 5, Battleship 4, Cruiser 3,
        Submarine 3, Destroyer 2). It&apos;s saved locally to your browser and only you can see it
        until you share.
      </Step>
      <Step num="2" title="Share a suggestion" color={GREEN}>
        Hit <strong>Share Suggestion →</strong> once all five ships are placed. Your layout gets an
        automatic vote from you (you can move it later). Re-sharing a modified layout wipes your
        previous suggestion&apos;s votes.
      </Step>
      <Step num="3" title="Vote on teammates' suggestions" color={GREEN}>
        Everyone gets exactly one vote per team. Voting on a new suggestion moves your vote off the
        previous one. The UI shows a green &quot;✓ Your vote&quot; badge on whichever suggestion
        currently holds your vote. If a teammate&apos;s layout matches yours exactly, sharing yours
        just votes for theirs instead of duplicating.
      </Step>
      <Step num="4" title="Track team participation" color={GREEN}>
        The footer below the workshop shows every teammate with icons for &quot;shared&quot; and
        &quot;voted&quot; so you can see who&apos;s still catching up. A Discord reminder pings the
        channel one hour before placement ends. Get your votes in before the clock runs out.
      </Step>
      <Callout color={AMBER} icon={FaExclamationTriangle}>
        If nobody on your team shares a suggestion, the game randomly places your fleet for you. If
        it&apos;s just you on the team, your shared suggestion wins by default.
      </Callout>

      <SectionHeader>Battle Phase</SectionHeader>
      <Step num="1" title="Propose a shot" color={CYAN}>
        Click any unrevealed cell on the enemy board to propose firing there. Your teammates get a
        Discord ping and a modal opens on the event page so they can vote yes or no.
      </Step>
      <Step num="2" title="Vote your team's plan" color={CYAN}>
        The vote threshold (how many approvals are needed) is set per event. Usually it&apos;s 1 for
        small teams and up to 3 for larger ones, though the admin can change this. One veto rejects
        the proposal outright. Proposals expire after 2 minutes; if that happens, someone else can
        propose.
      </Step>
      <Step num="3" title="Fire (proposer only)" color={CYAN}>
        Once approved, only the person who proposed the shot sees the red <strong>FIRE</strong>
        button. Everyone else sees &quot;waiting for [name] to fire.&quot; This keeps chaos down;
        one person pulls the trigger.
      </Step>
      <Step num="4" title="Complete the revealed task" color={CYAN}>
        Every shot reveals an OSRS task on that tile, whether it&apos;s a hit or a miss. If
        it&apos;s a metric task (KC, XP), start with a <strong>!bspre</strong> baseline in Discord,
        then <strong>!bssubmit</strong> once you&apos;ve done the work. Non-metric tasks (unique
        drops, minigames) skip the baseline and go straight to <strong>!bssubmit</strong>.
      </Step>
      <Step num="5" title="Wait for a ref to mark complete" color={CYAN}>
        Your team can&apos;t fire again until a ref reviews your screenshot(s) and marks the tile
        complete. Watch the status light on the event page:{' '}
        <strong style={{ color: '#4ade80' }}>READY</strong> (free to propose),{' '}
        <strong style={{ color: '#facc15' }}>VOTING</strong> (proposal in flight),{' '}
        <strong style={{ color: '#facc15' }}>COOLDOWN</strong> (post-shot cooldown active),{' '}
        <strong style={{ color: '#f87171' }}>ON TASK</strong> (waiting on ref sign-off).
      </Step>
      <Step num="6" title="Skip a miss (if you have tokens)" color={AMBER}>
        If a miss task feels like it&apos;s not worth doing, the team can vote to spend a skip token
        instead. Skip proposals work the same way as shot proposals: teammates vote yes or no, and
        if approved the token is consumed and the tile is resolved. Skipping{' '}
        <strong>also clears your cooldown</strong> so you can propose the next shot immediately.
      </Step>
      <Step num="7" title="Under fire" color={AMBER}>
        The enemy shoots at your board too. Your Discord channel pings when a ship of yours takes a
        hit. Sunk ships get a distinct dark-red state with a ✕ marker across every cell.
      </Step>

      <SectionHeader>Submissions via Discord</SectionHeader>
      <Callout color={CYAN} icon={FaInfoCircle}>
        All proof goes through your team&apos;s Discord channel. Attach a screenshot to any
        submission command, make sure it includes the event password if the admin set one. The bot
        picks up whichever tile your team is currently on.
      </Callout>
      <Step num="1" title="!bspre: pre-screenshot" color={CYAN}>
        For tasks with a numeric target (X kc, N xp), post <strong>!bspre</strong> with a screenshot
        showing your current baseline (KC counter, XP total, whatever the task tracks). Refs approve
        this before you start grinding.
      </Step>
      <Step num="2" title="!bssubmit: completion / progress" color={CYAN}>
        Post <strong>!bssubmit</strong> with a screenshot to show progress or completion. Refs can
        adjust a progress slider along the way. For tasks with a unique-drops target the slider
        walks &quot;N / Total uniques,&quot; and for others it&apos;s 0 to 100%.
      </Step>

      <SectionHeader>Skip Tokens</SectionHeader>
      <Callout color={AMBER} icon={FaExclamationTriangle}>
        Every team starts with a small pool of skip tokens (event admin picks the count). Admins can
        also award or revoke tokens mid-game via the admin panel. When they do, your team channel
        gets a Discord post explaining why. Skipping consumes one token and resets your cooldown so
        you can immediately propose again.
      </Callout>

      <SectionHeader>Winning</SectionHeader>
      <Callout color={GREEN} icon={FaInfoCircle}>
        <strong>Standard win:</strong> sink all five enemy ships (every ship cell shot AND
        ref-approved). The game-over screen then animates the whole engagement log with sound, so
        make sure your volume is on for the finale.
      </Callout>
      <Callout color={AMBER} icon={FaExclamationTriangle}>
        <strong>Admin-called ending:</strong> the event admin can also end the campaign manually,
        either early (rare, for a stuck event) or at a pre-communicated end time (i.e.,
        &quot;we&apos;re calling it Sunday at midnight&quot;). When that happens, the winner is the
        team with the most
        <strong> ship-tile hits</strong>. Fewer misses breaks a tie. Admins should call this out in
        advance whenever possible so both teams know the finish line has moved from &quot;sink them
        all&quot; to &quot;hit more than they do.&quot; The game-over screen will say
        <em> Campaign Called</em> and the Discord post will announce the hit counts instead of a
        clean sweep.
      </Callout>
    </Box>
  );
}

function RefGuide() {
  return (
    <Box>
      <Callout color={PINK} icon={FaInfoCircle}>
        As a ref, you keep the game moving by reviewing screenshots and marking tiles complete. The
        event admin adds you via Discord ID. From then on you have access to the refs panel for that
        event and can see live team status. Event admins have all your powers plus event settings.
      </Callout>

      <SectionHeader>Your Refs Panel At A Glance</SectionHeader>
      <Callout color={PINK} icon={FaInfoCircle}>
        The refs panel updates live via subscriptions, so no refresh is needed. At the top
        you&apos;ll see the event password (if one is set), a live &quot;Fleet Status&quot; block
        showing both teams&apos; skip tokens and cooldown, a Colorblind toggle, and a Sound toggle
        (your setting persists across visits). Below that: pending submissions grouped by tile, with
        an inline screenshot thumbnail on each. Click any thumbnail to zoom.
      </Callout>

      <SectionHeader>The Review Loop</SectionHeader>
      <Step num="1" title="Skim the pending queue" color={PINK}>
        Pending submissions collect at the top of each tile group. Every tile also shows a live
        progress slider you can drag up as the player nears completion. Approving a submission alone
        does NOT unblock the firing team; the tile itself has to be marked complete.
      </Step>
      <Step num="2" title="Review pre-screenshots" color={PINK}>
        For tasks with a numeric metric (KC, XP), players post <strong>!bspre</strong> before
        starting. Verify the baseline reads correctly, then Approve. If it looks staged or wrong,
        Deny with a specific reason. The reason posts to the team channel with a mention.
      </Step>
      <Step num="3" title="Review completion screenshots" color={PINK}>
        When a completion (<strong>!bssubmit</strong>) comes in, compare against the baseline you
        approved earlier. Approve when the gain matches the task target. Deny with a reason if
        anything looks off.
      </Step>
      <Step num="4" title="Slide progress as you verify" color={PINK}>
        The progress slider shows partial work. For most tasks it&apos;s a 0 to 100% percentage.{' '}
        <strong>For unique-drop tasks it walks 1 / N uniques</strong> so you can tick off drops
        one-by-one. The slider must hit 100% (or full N uniques) before Mark Complete unlocks.
      </Step>
      <Step num="5" title="Mark Complete" color={PINK}>
        This is the button that actually resolves the tile and lets the firing team fire again. It
        also triggers ship-sunk and game-over checks. If clicking Mark Complete finishes the last
        ship on the losing team&apos;s board, the game ends and the game-over Discord posts fire
        automatically.
      </Step>

      <SectionHeader>Placement Suggestions (During Placement Phase)</SectionHeader>
      <Callout color={PINK} icon={FaInfoCircle}>
        On the admin page you can see each team&apos;s placement suggestions and vote counts.
        You&apos;ll only see the team you&apos;re actually on, unless you&apos;re also an event
        admin. This is read-only: refs don&apos;t vote, they just observe.
      </Callout>

      <SectionHeader>Submission Types</SectionHeader>
      <SimpleGrid columns={[1, 2]} spacing={4} mb={4}>
        <Box bg="#0d2137" border="1px solid" borderColor={BORDER} borderRadius="md" p={4}>
          <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color={CYAN} mb={2}>
            Pre-Screenshot (!bspre)
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.8">
            Only needed for numeric-metric tasks (KC/XP). Establishes a baseline before the player
            starts grinding. Approve if it shows a credible starting value; deny if it looks staged
            or unclear.
          </Text>
        </Box>
        <Box bg="#0d2137" border="1px solid" borderColor={BORDER} borderRadius="md" p={4}>
          <Text fontFamily="mono" fontSize="xs" fontWeight="bold" color={GREEN} mb={2}>
            Completion (!bssubmit)
          </Text>
          <Text fontFamily="mono" fontSize="xs" color={DIM} lineHeight="1.8">
            Progress and/or completion proof. Compare against the pre-screenshot; the gain has to
            match the task target. Approve, adjust the slider to reflect verified progress, and hit
            Mark Complete when it&apos;s truly done.
          </Text>
        </Box>
      </SimpleGrid>

      <SectionHeader>Discord Notifications</SectionHeader>
      <Callout color={AMBER} icon={FaInfoCircle}>
        Approving/denying a submission auto-posts a message to the team&apos;s Discord channel with
        a mention. Marking a tile complete posts a &quot;fire again&quot; message unless it was the
        game-winning move, in which case only the ship-sunk + game-over messages fire. You
        don&apos;t have to type anything by hand.
      </Callout>

      <SectionHeader>What Refs Can't Do</SectionHeader>
      <Callout color={RED} icon={FaLock}>
        Refs can&apos;t create/delete events, add or remove teams, change vote thresholds, award
        skip tokens, launch the placement or battle phase, vote on placement suggestions, or
        manually end the campaign (a separate admin-only tool that declares the winner by ship-hit
        count when a game needs to be called early or at a pre-communicated end time). All of those
        belong to the event admin/creator only.
      </Callout>
    </Box>
  );
}

export default function BattleshipGuidePage() {
  usePageTitle('Battleship / Game Guide');
  const [tab, setTab] = useState(0);

  return (
    <Box flex="1" minH="100vh" bg={NAVY}>
      <Box borderBottom="1px solid" borderColor={BORDER} position="relative" overflow="hidden">
        <Box
          position="absolute"
          inset={0}
          opacity={0.04}
          backgroundImage="repeating-linear-gradient(0deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #0ea5e9 0px, #0ea5e9 1px, transparent 1px, transparent 40px)"
          pointerEvents="none"
        />
        <Box maxW="900px" mx="auto" px={[4, 6, 8]} py={[10, 14]} position="relative" zIndex={1}>
          <RouterLink to="/battleship">
            <HStack spacing={2} mb={4} color={DIM} _hover={{ color: CYAN }}>
              <Icon as={FaArrowLeft} boxSize={3} />
              <Text
                fontFamily="mono"
                fontSize="xs"
                letterSpacing="widest"
                textTransform="uppercase"
              >
                Back to Campaigns
              </Text>
            </HStack>
          </RouterLink>
          <Text
            fontFamily="mono"
            fontSize={['2xl', '4xl']}
            fontWeight="bold"
            color="#e2e8f0"
            letterSpacing="widest"
            textTransform="uppercase"
            lineHeight="1"
          >
            BATTLESHIP
          </Text>
          <Text fontFamily="mono" fontSize="sm" color={DIM} letterSpacing="wider" mt={2}>
            Game Guide
          </Text>
          <HStack spacing={2} mt={4}>
            <Box w="32px" h="1px" bg={CYAN} />
            <Box w="8px" h="1px" bg={BORDER} />
          </HStack>
        </Box>
      </Box>

      <Box borderBottom="1px solid" borderColor={BORDER} bg="#0a1c2e">
        <Box maxW="900px" mx="auto" px={[4, 6, 8]}>
          <HStack spacing={0}>
            {TABS.map((t, i) => (
              <Box
                key={t}
                px={5}
                py={3}
                cursor="pointer"
                borderBottom="2px solid"
                borderColor={tab === i ? CYAN : 'transparent'}
                onClick={() => setTab(i)}
                _hover={{ borderColor: tab === i ? CYAN : BORDER }}
              >
                <Text
                  fontFamily="mono"
                  fontSize="xs"
                  color={tab === i ? CYAN : DIM}
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  {t}
                </Text>
              </Box>
            ))}
          </HStack>
        </Box>
      </Box>

      <Box maxW="900px" mx="auto" px={[4, 6, 8]} py={[8, 12]}>
        {tab === 0 ? <ParticipantGuide /> : <RefGuide />}

        <Box mt={12} pt={6} borderTop="1px solid" borderColor={BORDER}>
          <RouterLink to="/battleship">
            <Button
              size="sm"
              variant="outline"
              colorScheme="cyan"
              borderColor={BORDER}
              color={CYAN}
              fontFamily="mono"
              fontSize="xs"
              letterSpacing="widest"
              textTransform="uppercase"
              leftIcon={<Icon as={FaArrowLeft} boxSize={3} />}
              _hover={{ bg: '#0d2137', borderColor: CYAN }}
            >
              Back to Campaigns
            </Button>
          </RouterLink>
        </Box>
      </Box>
    </Box>
  );
}
