import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Divider,
  Code,
  Badge,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import theme from '../theme';
import { usePageTitle } from '../hooks/usePageTitle';

// ---------------------------------------------------------------------------
// Primitives (mirrored from ChampionForgeGuidePage)
// ---------------------------------------------------------------------------

function Breadcrumb() {
  return (
    <HStack spacing={2} mb={6}>
      <RouterLink to="/gielinor-rush">
        <Text
          fontSize="sm"
          color={theme.colors.purple[400]}
          textDecoration="none"
          _hover={{ textDecoration: 'underline' }}
        >
          Gielinor Rush
        </Text>
      </RouterLink>
      <Text fontSize="sm" color={theme.colors.gray[600]}>
        ›
      </Text>
      <Text fontSize="sm" color={theme.colors.gray[400]}>
        Event Guide
      </Text>
    </HStack>
  );
}

function SectionLabel({ icon, label, color }) {
  return (
    <HStack spacing={2} mb={2}>
      <Text fontSize="lg">{icon}</Text>
      <Text
        fontSize="xs"
        letterSpacing="widest"
        fontWeight="bold"
        color={color}
        textTransform="uppercase"
      >
        {label}
      </Text>
    </HStack>
  );
}

function StepCard({ number, title, children }) {
  return (
    <HStack spacing={4} alignItems="flex-start">
      <Box
        flexShrink={0}
        width="28px"
        height="28px"
        borderRadius="full"
        bg={theme.colors.purple[800]}
        border={`2px solid ${theme.colors.purple[500]}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt="2px"
      >
        <Text fontSize="xs" fontWeight="bold" color={theme.colors.purple[200]}>
          {number}
        </Text>
      </Box>
      <VStack spacing={2} alignItems="flex-start" flex={1}>
        <Text fontWeight="bold" color="white" fontSize="sm">
          {title}
        </Text>
        <Box fontSize="sm" color={theme.colors.gray[300]} lineHeight="tall">
          {children}
        </Box>
      </VStack>
    </HStack>
  );
}

function PhaseHeader({ icon, label, color, borderColor, description }) {
  return (
    <Box
      padding="20px 24px"
      borderRadius="10px"
      backgroundColor={theme.colors.gray[800]}
      borderWidth="2px"
      borderColor={borderColor}
      mb={6}
    >
      <HStack spacing={3} mb={2}>
        <Text fontSize="xl">{icon}</Text>
        <Text fontSize="xl" fontWeight="bold" color={color}>
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" color={theme.colors.gray[300]} lineHeight="tall">
        {description}
      </Text>
    </Box>
  );
}

function ColumnHeader({ icon, label, labelColor, bg, borderColor }) {
  return (
    <Box
      padding="10px 16px"
      borderRadius="8px 8px 0 0"
      backgroundColor={bg}
      borderBottomWidth="2px"
      borderColor={borderColor}
    >
      <HStack spacing={2}>
        <Text fontSize="md">{icon}</Text>
        <Text fontSize="sm" fontWeight="bold" color={labelColor} letterSpacing="wide">
          {label}
        </Text>
      </HStack>
    </Box>
  );
}

function ColumnBody({ children }) {
  return (
    <Box
      padding="16px"
      backgroundColor={theme.colors.gray[850] || theme.colors.gray[900]}
      borderRadius="0 0 8px 8px"
      borderWidth="1px"
      borderTopWidth="0"
      borderColor={theme.colors.gray[700]}
      flex={1}
    >
      <VStack spacing={4} alignItems="flex-start">
        {children}
      </VStack>
    </Box>
  );
}

function Column({ icon, label, labelColor, headerBg, headerBorderColor, children }) {
  return (
    <Flex flexDirection="column" height="100%">
      <ColumnHeader
        icon={icon}
        label={label}
        labelColor={labelColor}
        bg={headerBg}
        borderColor={headerBorderColor}
      />
      <ColumnBody>{children}</ColumnBody>
    </Flex>
  );
}

function BulletItem({ number, children }) {
  return (
    <HStack spacing={3} alignItems="flex-start" width="100%">
      <Box
        flexShrink={0}
        width="20px"
        height="20px"
        borderRadius="full"
        bg={theme.colors.gray[700]}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt="2px"
      >
        <Text fontSize="10px" fontWeight="bold" color={theme.colors.gray[400]}>
          {number}
        </Text>
      </Box>
      <Text fontSize="sm" color={theme.colors.gray[200]} lineHeight="tall" flex={1}>
        {children}
      </Text>
    </HStack>
  );
}

function TipBox({ icon = '💡', label = 'Tip', colorScheme = 'blue', children }) {
  const schemes = {
    blue: {
      bg: theme.colors.blue[900],
      border: theme.colors.blue[700],
      labelColor: theme.colors.blue[300],
    },
    orange: {
      bg: theme.colors.orange[900],
      border: theme.colors.orange[700],
      labelColor: theme.colors.orange[300],
    },
    green: {
      bg: theme.colors.green[900],
      border: theme.colors.green[700],
      labelColor: theme.colors.green[300],
    },
    purple: {
      bg: theme.colors.purple[900],
      border: theme.colors.purple[700],
      labelColor: theme.colors.purple[300],
    },
    yellow: {
      bg: theme.colors.yellow[900],
      border: theme.colors.yellow[700],
      labelColor: theme.colors.yellow[300],
    },
  };
  const s = schemes[colorScheme] || schemes.blue;
  return (
    <Box
      padding="12px 14px"
      borderRadius="8px"
      backgroundColor={s.bg}
      borderWidth="1px"
      borderColor={s.border}
      width="100%"
    >
      <HStack spacing={2} mb={1}>
        <Text fontSize="xs">{icon}</Text>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={s.labelColor}
          letterSpacing="wide"
          textTransform="uppercase"
        >
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" color="gray.200" lineHeight="tall">
        {children}
      </Text>
    </Box>
  );
}

function CommandSnippet({ command, description }) {
  return (
    <Box width="100%">
      <Code
        display="block"
        padding="6px 10px"
        borderRadius="6px"
        backgroundColor={theme.colors.gray[700]}
        color={theme.colors.purple[300]}
        fontSize="xs"
        fontFamily="mono"
        mb={description ? 1 : 0}
      >
        {command}
      </Code>
      {description && (
        <Text fontSize="xs" color={theme.colors.gray[400]} ml={1}>
          {description}
        </Text>
      )}
    </Box>
  );
}

function StatRow({ label, value, color }) {
  return (
    <HStack justify="space-between" width="100%">
      <Text fontSize="xs" color={theme.colors.gray[400]}>
        {label}
      </Text>
      <Text fontSize="xs" fontWeight="bold" color={color || 'white'}>
        {value}
      </Text>
    </HStack>
  );
}

function SectionDivider() {
  return <Divider borderColor={theme.colors.gray[700]} my={8} />;
}

// ---------------------------------------------------------------------------
// Event Creator Section
// ---------------------------------------------------------------------------

function EventCreatorSection() {
  return (
    <Box>
      <SectionLabel icon="🎯" label="Event Creator Setup" color={theme.colors.purple[400]} />
      <Text fontSize="sm" color={theme.colors.gray[400]} mb={8} lineHeight="tall">
        Everything you need to do before players show up. This is done by the event organizer from
        the event page after creation.
      </Text>

      <VStack spacing={6} alignItems="stretch">
        <StepCard number="1" title="Create the Event">
          From the Gielinor Rush dashboard, click{' '}
          <strong style={{ color: 'white' }}>+ New Event</strong>. Enter a name, set your start and
          end dates, choose a difficulty, and configure your prize pool. The event length and
          difficulty together determine how many nodes the generated map will contain.
        </StepCard>

        <StepCard number="2" title="Set Your Prize Pool and Teams">
          Enter the total GP prize pool and the number of competing teams. The system hard-caps
          payouts so you will never exceed your budget. Each team's maximum possible earnings equal
          exactly their share of the pool (Prize Pool ÷ Number of Teams). Average teams typically
          earn their full maximum, leaving leftover GP for bonus prizes, podium rewards, or future
          events.
        </StepCard>

        <StepCard number="3" title="Choose Difficulty">
          Four tiers scale how hard the nodes' objectives are:
          <VStack spacing={1} mt={3} alignItems="flex-start" pl={2}>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="green" fontSize="xs">
                Easy 0.8×
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                Casual events or shorter durations
              </Text>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="blue" fontSize="xs">
                Normal 1.0×
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                Balanced for most events
              </Text>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="orange" fontSize="xs">
                Hard 1.4×
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                For experienced players
              </Text>
            </HStack>
            <HStack spacing={2} flexWrap="wrap">
              <Badge colorScheme="red" fontSize="xs">
                Sweatlord 2.0×
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                Extreme challenge for dedicated groups
              </Text>
            </HStack>
          </VStack>
        </StepCard>

        <StepCard number="4" title="Generate the Map">
          After creating the event, open the Admin Checklist and click{' '}
          <strong style={{ color: 'white' }}>Generate Map</strong>. The system builds a unique,
          procedurally generated treasure map for this event: three branching paths (each with
          different key colors and buff opportunities), location groups with three difficulty
          variants each, Inn checkpoints at regular intervals, and randomised objectives spread
          across real OSRS locations. You can regenerate the map if you don't like the initial
          layout. Do this before going public.
        </StepCard>

        <StepCard number="5" title="Configure Node-to-Inn Ratio">
          Controls how frequently Inn checkpoints appear between groups of challenge nodes. The
          default is one Inn per 5 location groups.
          <VStack spacing={1} mt={2} alignItems="flex-start" pl={2}>
            <HStack spacing={2}>
              <Badge colorScheme="blue" fontSize="xs">
                Low 3:1
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                More frequent checkpoints; more key-trading opportunities
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Badge colorScheme="purple" fontSize="xs">
                High 8:1
              </Badge>
              <Text fontSize="xs" color={theme.colors.gray[300]}>
                Fewer Inns; requires more strategic key management
              </Text>
            </HStack>
          </VStack>
        </StepCard>

        <StepCard number="6" title="Set Up Discord Channels">
          Open the Discord Setup section in the Admin Checklist. Invite the OSRS Bingo Hub bot to
          your server and configure a submission channel per team (for example, #red-team-submit and
          #blue-team-submit). This keeps screenshot submissions organized and separated from general
          team chat. The bot posts approval and denial results back to the channel automatically.
        </StepCard>

        <StepCard number="7" title="Add Teams and Set an Event Password">
          Click <strong style={{ color: 'white' }}>Add Team</strong> in the Admin Checklist for
          each competing team. Give each a name and add their player RSNs. The event password is
          displayed on every team's dashboard. Players include it in their screenshot submissions so
          you can verify the screenshot was taken during the event.
        </StepCard>

        <StepCard number="8" title="Share Bot Commands with Players">
          Distribute these commands to participants before the event starts:
          <VStack spacing={3} mt={3} alignItems="stretch">
            <CommandSnippet
              command="!submit <node_id>"
              description="Submit a node completion with a screenshot attached. Routes to the admin review queue."
            />
            <CommandSnippet
              command="!gr"
              description="Lists all available bot commands and usage details."
            />
          </VStack>
        </StepCard>

        <StepCard number="9" title="Preview in Draft Mode, then Go Public">
          Before publishing, switch the event to Draft mode and walk through your team's view to
          verify map layout, node objectives, and Inn placement look correct. When you're satisfied,
          change status to{' '}
          <strong style={{ color: 'white' }}>Public</strong> so teams can see their maps and start
          submitting.
        </StepCard>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Gameplay Section
// ---------------------------------------------------------------------------

function GameplaySection() {
  return (
    <Box>
      <PhaseHeader
        icon="🗺️"
        label="Navigating the Map"
        color={theme.colors.green[400]}
        borderColor={theme.colors.green[700]}
        description="Teams start at the same node and race to complete objectives across Gielinor. Every node unlocks new paths. Strategic choices about which difficulty to attempt, and when to visit Inns, separate good teams from great ones."
      />

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <Column
          icon="⚙️"
          label="Admin / Ref"
          labelColor={theme.colors.yellow[200]}
          headerBg={theme.colors.yellow[900]}
          headerBorderColor={theme.colors.yellow[600]}
        >
          <BulletItem number="1">
            Watch the Submissions tab on the event page. Every time a player runs{' '}
            <Code fontSize="xs" bg="gray.700" color="purple.300">
              !submit
            </Code>{' '}
            in Discord, the submission appears here with their screenshot attached.
          </BulletItem>
          <BulletItem number="2">
            Review each screenshot carefully. Check that the RSN, event password, and objective
            completion are all visible. Click <strong>Approve</strong> to mark the node complete and
            award GP, keys, and any buff rewards to the team.
          </BulletItem>
          <BulletItem number="3">
            Click <strong>Deny</strong> and provide a reason if the screenshot is missing required
            information, is unclear, or doesn't satisfy the objective. The player sees the reason in
            their team's Discord channel and can re-submit.
          </BulletItem>
          <BulletItem number="4">
            You can manually complete a node from the admin view if a submission is lost or a
            special situation arises. Use this sparingly and consistently across all teams.
          </BulletItem>
          <TipBox icon="⚠️" label="Stay Active" colorScheme="orange">
            Submissions queue until you manually review them. Players can't advance to locked nodes
            until their completion is approved. Check the queue frequently so teams don't stall
            waiting for a review.
          </TipBox>
        </Column>

        <Column
          icon="👥"
          label="Team Member"
          labelColor={theme.colors.green[200]}
          headerBg={theme.colors.green[900]}
          headerBorderColor={theme.colors.green[600]}
        >
          <BulletItem number="1">
            Go to your team's page to see the live treasure map. Every team starts at the{' '}
            <strong>START</strong> node, which auto-completes and unlocks the first set of available
            nodes. Locked nodes are hidden until you complete their prerequisites.
          </BulletItem>
          <BulletItem number="2">
            Click any unlocked node to open its detail panel. You'll see the location, the
            objective, the difficulty (Short / Medium / Long), and the GP and key rewards for
            completion.
          </BulletItem>
          <BulletItem number="3">
            <strong>Each location offers three difficulty variants, but you can only complete
            one.</strong> Short nodes pay 20% of the max GP for that node. Medium pays 70%. Long
            pays 100%. All three variants are on the same path and award the same key color —
            difficulty only affects GP and key quantity. Choose based on your team's available time
            and skills: once you complete a difficulty at a location, the others are locked out
            permanently.
          </BulletItem>
          <BulletItem number="4">
            Complete the objective in OSRS. Take a screenshot showing your RSN, the event password
            (visible on your team dashboard), and proof of completion. Timestamps help.
          </BulletItem>
          <BulletItem number="5">
            In your team's Discord channel, run{' '}
            <Code fontSize="xs" bg="gray.700" color="purple.300">
              !submit &lt;node_id&gt;
            </Code>{' '}
            and attach the screenshot. The node ID is shown in the node detail panel. Your
            submission enters the admin review queue immediately.
          </BulletItem>
          <BulletItem number="6">
            Once approved, your team's GP pot increases, new nodes unlock on the map, and any key or
            buff rewards are added to your inventory. Coordinate with teammates to cover multiple
            nodes simultaneously and advance faster than other teams.
          </BulletItem>
        </Column>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Keys and Inns Section
// ---------------------------------------------------------------------------

function KeysAndInnsSection() {
  return (
    <Box>
      <PhaseHeader
        icon="🔑"
        label="Keys and Inn Checkpoints"
        color={theme.colors.yellow[400]}
        borderColor={theme.colors.yellow[700]}
        description="Keys are earned from node completions. Inns are checkpoint nodes where teams trade keys for bonus GP and strategic buffs. Managing your keys well is one of the most impactful decisions a team can make."
      />

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
        <Column
          icon="🔑"
          label="Keys"
          labelColor={theme.colors.yellow[200]}
          headerBg={theme.colors.yellow[900]}
          headerBorderColor={theme.colors.yellow[600]}
        >
          <BulletItem number="1">
            Keys come in three colors: <strong>Red</strong>, <strong>Blue</strong>, and{' '}
            <strong>Green</strong>. Each map path awards a fixed key color regardless of which
            difficulty you choose at a location. Mountain path nodes always give red keys, trade
            route nodes give blue, and coastal path nodes give green.
          </BulletItem>
          <BulletItem number="2">
            Most nodes award 1 key; Long nodes award 2. Some nodes are keyless and pay out bonus GP
            instead. Long nodes are least likely to be keyless (~10% vs ~30% for Short), so they
            yield the most keys of their path's color. Key diversity for Combo Inn trades still
            requires nodes across multiple paths, not just picking Long everywhere.
          </BulletItem>
          <BulletItem number="3">
            Keys have no expiry. Accumulate them as you progress and spend them strategically at
            Inns. Don't burn them all at the first checkpoint if a later Inn offers better trades.
          </BulletItem>
          <BulletItem number="4">
            The best Inn trade (Combo) requires 2 red + 2 blue + 2 green keys. Teams that only run
            one path will be locked out of Combo trades and forced into lower-value options.
          </BulletItem>
          <TipBox icon="💡" label="Strategy" colorScheme="yellow">
            Send different teammates down different paths simultaneously. You earn keys faster and
            arrive at Inns with a balanced spread of all three colors.
          </TipBox>
        </Column>

        <Column
          icon="🏨"
          label="Inns"
          labelColor={theme.colors.green[200]}
          headerBg={theme.colors.green[900]}
          headerBorderColor={theme.colors.green[600]}
        >
          <BulletItem number="1">
            Inn nodes appear at regular intervals set by your admin. They have no objectives: just
            visit the Inn and choose a trade. Visiting also unlocks the paths beyond it, so you
            don't need to spend any keys to advance.
          </BulletItem>
          <BulletItem number="2">
            Each team gets exactly one purchase per Inn. Three trade tiers are available:
            <VStack spacing={1} mt={2} alignItems="flex-start" pl={2}>
              <HStack spacing={2}>
                <Badge colorScheme="gray" fontSize="xs">Small</Badge>
                <Text fontSize="xs" color={theme.colors.gray[300]}>2 any keys = 0.8x base GP</Text>
              </HStack>
              <HStack spacing={2}>
                <Badge colorScheme="blue" fontSize="xs">Medium</Badge>
                <Text fontSize="xs" color={theme.colors.gray[300]}>4 any keys = 1.0x base GP</Text>
              </HStack>
              <HStack spacing={2}>
                <Badge colorScheme="purple" fontSize="xs">Combo</Badge>
                <Text fontSize="xs" color={theme.colors.gray[300]}>2 red + 2 blue + 2 green = 1.2x base GP</Text>
              </HStack>
            </VStack>
          </BulletItem>
          <BulletItem number="3">
            Some Inns also offer buffs as a trade option. Buffs reduce objective requirements on
            future nodes by 25-75% depending on the buff tier. At least 40% of Inns on any map
            will have a buff available.
          </BulletItem>
          <BulletItem number="4">
            You cannot return to an Inn for a second trade. Once your team makes a purchase, that
            Inn is spent. Choose carefully.
          </BulletItem>
          <TipBox icon="💡" label="When to spend" colorScheme="green">
            Combo trades give 50% more GP than Small trades but need diverse keys. Save buffs for
            nodes where your team is struggling. A 50% reduction buff on a Long boss KC node can
            save hours of grind.
          </TipBox>
        </Column>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Prize Pool Section
// ---------------------------------------------------------------------------

function PrizePoolSection() {
  return (
    <Box>
      <PhaseHeader
        icon="💰"
        label="Prize Pool and Scoring"
        color={theme.colors.green[400]}
        borderColor={theme.colors.green[700]}
        description="Your team's running GP total is your score. The team with the highest pot at the end of the event wins. The prize pool is hard-capped: the event organizer will never pay out more than the configured total."
      />

      <VStack spacing={4} alignItems="stretch">
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box
            padding="16px"
            borderRadius="8px"
            bg={theme.colors.gray[800]}
            borderWidth="1px"
            borderColor={theme.colors.green[700]}
          >
            <Text fontSize="xs" fontWeight="bold" color={theme.colors.green[400]} mb={3} textTransform="uppercase" letterSpacing="wider">
              Node Rewards (70%)
            </Text>
            <VStack spacing={2} alignItems="stretch">
              <StatRow label="Short node" value="20% of max GP, up to 1 key" color={theme.colors.green[300]} />
              <StatRow label="Medium node" value="70% of max GP, up to 1 key" color={theme.colors.yellow[300]} />
              <StatRow label="Long node" value="100% of max GP, up to 2 keys" color={theme.colors.red[300]} />
            </VStack>
            <Text fontSize="xs" color={theme.colors.gray[500]} mt={3} fontStyle="italic">
              70% of the prize pool is distributed through node completions
            </Text>
          </Box>

          <Box
            padding="16px"
            borderRadius="8px"
            bg={theme.colors.gray[800]}
            borderWidth="1px"
            borderColor={theme.colors.yellow[700]}
          >
            <Text fontSize="xs" fontWeight="bold" color={theme.colors.yellow[400]} mb={3} textTransform="uppercase" letterSpacing="wider">
              Inn Rewards (30%)
            </Text>
            <VStack spacing={2} alignItems="stretch">
              <StatRow label="Key exchanges" value="Bonus GP" color={theme.colors.yellow[300]} />
              <StatRow label="Buff purchases" value="Req. reduction" color={theme.colors.purple[300]} />
            </VStack>
            <Text fontSize="xs" color={theme.colors.gray[500]} mt={3} fontStyle="italic">
              30% of the prize pool is available through Inn checkpoints
            </Text>
          </Box>

          <Box
            padding="16px"
            borderRadius="8px"
            bg={theme.colors.gray[800]}
            borderWidth="1px"
            borderColor={theme.colors.blue[700]}
          >
            <Text fontSize="xs" fontWeight="bold" color={theme.colors.blue[400]} mb={3} textTransform="uppercase" letterSpacing="wider">
              Hard Cap Guarantee
            </Text>
            <VStack spacing={2} alignItems="stretch">
              <StatRow label="Max payout possible" value="= Prize Pool" color={theme.colors.green[300]} />
              <StatRow label="Actual earnings" value="Depends on play" color={theme.colors.blue[300]} />
            </VStack>
            <Text fontSize="xs" color={theme.colors.gray[500]} mt={3} fontStyle="italic">
              Even if every team plays perfectly, total payout never exceeds the configured pool
            </Text>
          </Box>
        </SimpleGrid>

        <TipBox icon="💡" label="Leftover GP" colorScheme="purple">
          Teams rarely max out their entire budget, so you'll likely have GP left over. Consider
          setting aside a portion for a winner's bonus, podium prizes, or an MVP award voted on by
          all participants. Announce this before the event to add extra motivation.
        </TipBox>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function GielinorRushGuidePage() {
  usePageTitle('Gielinor Rush Guide');

  return (
    <Box maxWidth="1000px" margin="0 auto" padding={['16px', '24px', '48px']} paddingBottom="80px">
      <Breadcrumb />

      <Box mb={10}>
        <Text fontSize={['2xl', '3xl']} fontWeight="bold" color="white" mb={3}>
          Gielinor Rush: Event Guide
        </Text>
        <Text fontSize="md" color={theme.colors.gray[400]} lineHeight="tall" maxWidth="600px">
          A complete walkthrough of the Gielinor Rush format, from generating a map through the
          final tally. Use this as a reference before running or competing in an event.
        </Text>
      </Box>

      <VStack spacing={0} alignItems="stretch">
        <EventCreatorSection />
        <SectionDivider />
        <GameplaySection />
        <SectionDivider />
        <KeysAndInnsSection />
        <SectionDivider />
        <PrizePoolSection />
      </VStack>
    </Box>
  );
}
