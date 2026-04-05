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
// Primitives
// ---------------------------------------------------------------------------

function Breadcrumb() {
  return (
    <HStack spacing={2} mb={6}>
      <RouterLink to="/champion-forge">
        <Text
          fontSize="sm"
          color={theme.colors.teal[400]}
          textDecoration="none"
          _hover={{ textDecoration: 'underline' }}
        >
          Champion Forge
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
        bg={theme.colors.teal[800]}
        border={`2px solid ${theme.colors.teal[500]}`}
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt="2px"
      >
        <Text fontSize="xs" fontWeight="bold" color={theme.colors.teal[200]}>
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

function CaptainNote({ children }) {
  return (
    <Box
      padding="12px 14px"
      borderRadius="8px"
      backgroundColor={theme.colors.yellow[900]}
      borderWidth="1px"
      borderColor={theme.colors.yellow[600]}
      width="100%"
    >
      <HStack spacing={2} mb={1}>
        <Text fontSize="xs">👑</Text>
        <Text
          fontSize="xs"
          fontWeight="bold"
          color={theme.colors.yellow[300]}
          letterSpacing="wide"
          textTransform="uppercase"
        >
          Captain
        </Text>
      </HStack>
      <Text fontSize="sm" color={theme.colors.yellow[100]} lineHeight="tall">
        {children}
      </Text>
    </Box>
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
        color={theme.colors.teal[300]}
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

function RoleBadge({ role }) {
  const styles = {
    PvMer: { bg: theme.colors.orange[800], color: theme.colors.orange[200] },
    Skiller: { bg: theme.colors.teal[800], color: theme.colors.teal[200] },
    Flex: { bg: theme.colors.purple[800], color: theme.colors.purple[200] },
  };
  const s = styles[role] || styles.Flex;
  return (
    <Badge
      fontSize="10px"
      px={2}
      py={0.5}
      borderRadius="full"
      bg={s.bg}
      color={s.color}
      fontWeight="bold"
      letterSpacing="wide"
    >
      {role}
    </Badge>
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
      <SectionLabel icon="🎯" label="Event Creator Setup" color={theme.colors.teal[400]} />
      <Text fontSize="sm" color={theme.colors.gray[400]} mb={8} lineHeight="tall">
        Everything you need to do before players show up. This is done by the event organizer using
        the Admin Controls panel on the event page.
      </Text>

      <VStack spacing={6} alignItems="stretch">
        <StepCard number="1" title="Create the Event">
          From the Champion Forge dashboard, click{' '}
          <strong style={{ color: 'white' }}>+ New Event</strong>. Give the event a name, then set
          three timers: the gathering phase duration (in hours), the outfitting phase duration (in
          hours), and the turn timer (in seconds). The turn timer controls how long each player has
          per battle turn. Click <strong style={{ color: 'white' }}>Create</strong> to continue.
        </StepCard>

        <StepCard number="2" title="Add Your Teams">
          In the Admin Controls panel on the event page, open the{' '}
          <strong style={{ color: 'white' }}>Teams</strong> accordion. Click{' '}
          <strong style={{ color: 'white' }}>Add Team</strong> for each team and enter a team name.
          A minimum of two teams is required. Teams cannot be added after the event leaves Draft
          phase, so set them all up now.
        </StepCard>

        <StepCard number="3" title="Populate Rosters">
          For each team card, use the Discord ID input field at the bottom to add players one at a
          time. You need each player's Discord user ID (a long numeric ID, not their username).
          Players can find their own ID in Discord by enabling Developer Mode under Advanced
          settings, then right-clicking their name and selecting Copy User ID.
          <br />
          <br />
          Remove a player with the <strong style={{ color: 'white' }}>×</strong> button on their
          row. Rosters can be edited through Gathering and Outfitting phases, but lock during
          Battle.
        </StepCard>

        <StepCard number="4" title="Set Team Captains">
          Click the <strong style={{ color: 'white' }}>crown icon</strong> next to any team member
          to assign them as that team's captain. Each team must have a captain before outfitting
          begins, so teams or admins will have time to determine who a viable captain will be.
          Because captains are the only ones who can build and save the team loadout, this MUST be
          done before the outfitting phase begins. Captains also control the ready-up process during
          Battle phase.
        </StepCard>

        <StepCard number="5" title="Invite the Discord Bot">
          Open the <strong style={{ color: 'white' }}>Discord Bot Setup</strong> accordion in Admin
          Controls. Follow the invite link in Step 1 to add the OSRS Bingo Hub bot to your Discord
          server. Set the announcements channel ID so the bot can post phase change notifications.
          <br />
          <br />
          Recommended: create a dedicated submission channel per team (for example, #red-team-bot
          and #blue-team-bot) so screenshots stay organized and separated from your general team
          chat.
        </StepCard>

        <StepCard number="6" title="Share Bot Commands with Players">
          Give these commands to your players in Discord before gathering begins. They use the bot
          to submit completions directly from the game.
          <VStack spacing={3} mt={3} alignItems="stretch">
            <CommandSnippet
              command="!cfpresubmit <taskId>"
              description="Records a baseline XP/KC/whatever snapshot at the start of a progression-based task. Must be run before you train."
            />
            <CommandSnippet
              command="!cfsubmit <taskId>"
              description="Submits a task completion with a screenshot attached. Routes to the admin review queue."
            />
            <CommandSnippet
              command="!cf"
              description="Lists all available commands and usage details."
            />
          </VStack>
        </StepCard>

        <StepCard number="7" title="Create Gathering Tasks">
          In the Admin Controls, open the <strong style={{ color: 'white' }}>Tasks</strong> section
          to add the objectives players will complete during gathering. Each task needs:
          <VStack spacing={1} mt={3} alignItems="flex-start" pl={2}>
            <Text fontSize="sm" color={theme.colors.gray[300]}>
              <strong style={{ color: 'white' }}>Name and description</strong> visible to players in
              barracks
            </Text>
            <Text fontSize="sm" color={theme.colors.gray[300]}>
              <strong style={{ color: 'white' }}>Type:</strong> PvM (boss kills and combat drops) or
              Skilling (XP milestones and minigames)
            </Text>
            <Text fontSize="sm" color={theme.colors.gray[300]}>
              <strong style={{ color: 'white' }}>Difficulty:</strong> Initiate, Adept, or Master.
              Higher difficulty weights toward rarer item drops.
            </Text>
            <Text fontSize="sm" color={theme.colors.gray[300]}>
              <strong style={{ color: 'white' }}>Valid drop categories:</strong> the gear slot
              categories a completion can reward. PvM tasks typically yield weapons and armor;
              skilling tasks typically yield consumables, rings, amulets, capes, and shields.
            </Text>
            <Text fontSize="sm" color={theme.colors.gray[300]}>
              <strong style={{ color: 'white' }}>Progress target:</strong> for quantified tasks like
              "gain 50,000 Slayer XP." Players use !cfpresubmit to record their starting
              XP/KC/whatever, then !cfsubmit after reaching the goal.
            </Text>
          </VStack>
        </StepCard>

        <StepCard number="8" title="Launch Gathering">
          When teams are populated with captains and tasks are ready, click{' '}
          <strong style={{ color: 'white' }}>Start Gathering</strong> in the Admin Controls header.
          The gathering timer begins, and team barracks become accessible to all members. Share the
          event URL with your participants and remind them to link their Discord accounts before
          trying to enter barracks.
        </StepCard>
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Gathering Section
// ---------------------------------------------------------------------------

function GatheringSection() {
  return (
    <Box>
      <PhaseHeader
        icon="⛏️"
        label="Phase 2: Gathering"
        color={theme.colors.green[400]}
        borderColor={theme.colors.green[700]}
        description="Teams race to complete OSRS tasks. Each approved completion earns items for the team war chest. The quality of your gathering directly determines the strength of your champion in battle."
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
            Watch the Submission Feed in the Admin Controls panel. Every time a player runs{' '}
            <Code fontSize="xs" bg="gray.700" color="teal.300">
              !cfsubmit
            </Code>{' '}
            in Discord, the submission appears here with their screenshot attached.
          </BulletItem>
          <BulletItem number="2">
            Review each screenshot. Click <strong>Approve</strong> to award a randomly rolled item
            from the task's valid drop categories to the team war chest. Item rarity scales with
            task difficulty: Initiate tasks drop common gear, Master tasks can drop epic gear.
          </BulletItem>
          <BulletItem number="3">
            Click <strong>Deny</strong> and enter a reason if the screenshot is unclear, missing
            required info, or does not satisfy the task criteria. The player will see the denial
            reason in their barracks submission feed and can re-submit.
          </BulletItem>
          <BulletItem number="4">
            You can add or remove team members at any point during Gathering and Outfitting. Go to
            Admin Controls, find the team card, and use the member management controls. Member edits
            lock when Battle phase begins.
          </BulletItem>
          <BulletItem number="5">
            When you are ready to end gathering, click <strong>Start Outfitting</strong> in the
            Admin Controls header. If time is still remaining on the timer, you'll see a warning.
            Advancing phases is permanent.
          </BulletItem>
          <TipBox icon="⚠️" label="Note" colorScheme="orange">
            Submissions wait in the queue until you manually approve or deny them. Stay active in
            Discord during gathering so players aren't left waiting for hours on a pending
            submission.
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
            Go to the event page and find your team card. Click <strong>Enter Barracks</strong>. You
            must have a Discord account linked to your OSRS Bingo Hub profile. If the button is
            unavailable, ask your admin to add your Discord user ID to the roster.
          </BulletItem>
          <BulletItem number="2">
            Choose your role from the role selector at the top of barracks:
            <VStack spacing={2} mt={2} alignItems="flex-start">
              <HStack spacing={2} flexWrap="wrap">
                <RoleBadge role="PvMer" />
                <Text fontSize="xs" color={theme.colors.gray[300]}>
                  Boss kills, combat drops, and wilderness tasks. Drops weapon and armor slots.
                </Text>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <RoleBadge role="Skiller" />
                <Text fontSize="xs" color={theme.colors.gray[300]}>
                  XP milestones and minigames. Drops consumables, rings, amulets, capes, shields.
                </Text>
              </HStack>
              <HStack spacing={2} flexWrap="wrap">
                <RoleBadge role="Flex" />
                <Text fontSize="xs" color={theme.colors.gray[300]}>
                  Can attempt any task type. Slots are capped at roughly 20% of the team. The card
                  shows how many flex slots are taken.
                </Text>
              </HStack>
            </VStack>
          </BulletItem>
          <BulletItem number="3">
            <strong>Your role locks when you join your first task.</strong> Until then, you can
            switch freely. A confirmation modal appears before the lock happens so you can
            double-check your choice.
          </BulletItem>
          <BulletItem number="4">
            Browse tasks in your section. Click any task row to open its detail modal and see the
            full description, screenshot requirements, and what items it can drop. Click{' '}
            <strong>Join Quest</strong> to start working it.
          </BulletItem>
          <BulletItem number="5">
            For XP-based tasks, run{' '}
            <Code fontSize="xs" bg="gray.700" color="teal.300">
              !cfpresubmit &lt;taskId&gt;
            </Code>{' '}
            in your team's Discord channel <em>before</em> you start training to record your
            baseline XP. Then run{' '}
            <Code fontSize="xs" bg="gray.700" color="teal.300">
              !cfsubmit &lt;taskId&gt;
            </Code>{' '}
            after you've hit the XP target with a screenshot showing the gain. For non-XP tasks,
            just run !cfsubmit directly with your screenshot.
          </BulletItem>
          <BulletItem number="6">
            Watch the war chest panel in the right sidebar of barracks. Items appear there after an
            admin approves your submission. Coordinate with teammates to cover different tasks and
            maximize your chest variety.
          </BulletItem>
          <BulletItem number="7">
            The Quest Log at the top of barracks shows all active tasks across your team. Use it to
            avoid doubling up on tasks when one teammate is already close to finishing and you could
            get more value elsewhere.
          </BulletItem>
          <CaptainNote>
            The right sidebar of your barracks shows the full submission feed for your whole team,
            including pending, approved, and denied statuses. Keep an eye on it so you know exactly
            what's in your war chest and can start planning your loadout strategy before outfitting
            begins.
          </CaptainNote>
        </Column>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Outfitting Section
// ---------------------------------------------------------------------------

function OutfittingSection() {
  return (
    <Box>
      <PhaseHeader
        icon="🛡️"
        label="Phase 3: Outfitting"
        color={theme.colors.blue[400]}
        borderColor={theme.colors.blue[700]}
        description="Captains build their champion from the war chest. Equip gear into each slot, fill your battle pack with consumables, and choose your active special ability. Your loadout locks when battle begins."
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
            In the Admin Controls panel, choose a bracket format before generating. Two options:
            <VStack spacing={1} mt={2} alignItems="flex-start" pl={2}>
              <Text fontSize="sm" color={theme.colors.gray[300]}>
                <strong style={{ color: 'white' }}>Single Elimination:</strong> one loss and you're
                out. Faster format, good for smaller fields.
              </Text>
              <Text fontSize="sm" color={theme.colors.gray[300]}>
                <strong style={{ color: 'white' }}>Double Elimination:</strong> two losses required
                to be eliminated. More matches, higher stakes at the end, better suited to larger
                fields or when you want a Grand Final.
              </Text>
            </VStack>
          </BulletItem>
          <BulletItem number="2">
            Click <strong>Generate Bracket</strong>. Teams are seeded randomly. The bracket becomes
            visible to everyone on the event page immediately as a read-only preview. Players can
            see their potential first-round matchup and start planning accordingly.
          </BulletItem>
          <BulletItem number="3">
            Let captains know outfitting is open and they need to build their loadouts. You can
            track which teams have saved drafts from the admin view.
          </BulletItem>
          <BulletItem number="4">
            When you're ready to start the tournament, click <strong>Start Battle Phase</strong>.
            This action is permanent. All remaining loadouts lock automatically at this point,
            whether captains finished or not.
          </BulletItem>
          <TipBox icon="💡" label="Tip" colorScheme="blue">
            Generate the bracket early in outfitting rather than right before battle. It gives
            players time to look at their matchup and potentially counter-build, which adds
            strategic depth.
          </TipBox>
        </Column>

        <Column
          icon="👥"
          label="Team Member"
          labelColor={theme.colors.blue[200]}
          headerBg={theme.colors.blue[900]}
          headerBorderColor={theme.colors.blue[600]}
        >
          <BulletItem number="1">
            Enter barracks during outfitting. The task list is replaced by the outfitting screen
            where you can see all the gear your team earned during gathering.
          </BulletItem>
          <BulletItem number="2">
            Check the event page to see the bracket preview and your potential first-round opponent.
            Knowing who you're up against can inform how the captain builds the loadout.
          </BulletItem>
          <BulletItem number="3">
            Any team member can use the outfitting screen to experiment with the war chest and put
            together a proposed loadout. Use the <strong>Export</strong> button to copy a loadout
            code, then share it in your team chat. Your captain can paste it in using the{' '}
            <strong>Import</strong> button to load up your proposed build and run a Preview battle
            against the Training Dummy to test how it performs before committing to it.
          </BulletItem>
          <CaptainNote>
            The outfitting screen has three main areas: the paperdoll on the left for visualizing
            your equipped gear, the champion sprite in the center, and the stats and action panel on
            the right. Start by clicking a slot on the paperdoll to select it, then pick an item
            from the inventory below to equip it.
          </CaptainNote>
          <CaptainNote>
            Each item card shows its stat contributions (ATK, DEF, SPD, CRT, HP) and any special
            ability it grants. When a slot is selected and you hover an item, you'll see a green
            comparison delta showing exactly how that item changes your stats versus what's
            currently equipped. Use the "All Items" toggle to browse the full war chest grouped by
            slot, or stay on the per-slot filter view for a cleaner look.
          </CaptainNote>
          <CaptainNote>
            Assign up to 4 consumables to your Battle Pack. These are single-use items available
            during the fight: heals, stat boosts, debuffs on your opponent. Choose them based on
            your matchup and your champion's weaknesses.
          </CaptainNote>
          <CaptainNote>
            If your war chest contains more than one special ability, the Special Picker lets you
            choose which one fires in battle. Only one special can be active. Read each one
            carefully before choosing since they have very different tactical uses.
          </CaptainNote>
          <CaptainNote>
            Click <strong>Save Draft</strong> to save your current loadout without locking. You can
            keep editing until battle begins. Use the battle preview (the "Preview" link near the
            action buttons) to test your build against a Training Dummy and get a feel for how your
            stats translate into actual combat before committing to a final loadout.
          </CaptainNote>
        </Column>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Battle Section
// ---------------------------------------------------------------------------

function BattleSection() {
  return (
    <Box>
      <PhaseHeader
        icon="⚔️"
        label="Phase 4: Battle"
        color={theme.colors.red[400]}
        borderColor={theme.colors.red[700]}
        description="Champions face off in the bracket in live, synchronous combat. Captains must be present and actively playing. Every turn requires a real decision from a real person. This is not automated. Schedule your matches in advance and make sure everyone shows up."
      />

      <TipBox icon="🔴" label="This is a live event" colorScheme="orange">
        Battle phase is real-time and turn-based. Captains are required to be online and actively
        choosing actions each turn. Teammates, opponents, and spectators are all watching at the
        same time. Treat each scheduled match like a live competition. Coordinate times in advance
        and do not go missing without warning.
      </TipBox>

      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4} mt={4}>
        <Column
          icon="⚙️"
          label="Admin / Ref"
          labelColor={theme.colors.yellow[200]}
          headerBg={theme.colors.yellow[900]}
          headerBorderColor={theme.colors.yellow[600]}
        >
          <BulletItem number="1">
            Before starting battle phase, coordinate with all team captains to agree on match
            scheduling. Battles are live events and both captains must be present and online when
            a match starts. Announce times in your event Discord so there are no surprises.
          </BulletItem>
          <BulletItem number="2">
            Go to the battle page from any team's barracks "Watch the Battle" button or via the
            event page. The full bracket is displayed with round-by-round match cards.
          </BulletItem>
          <BulletItem number="3">
            For each upcoming match, wait for both captains to ready up. Their ready status shows on
            the match card. Once both are green, click <strong>Start Battle</strong> to begin the
            fight.
          </BulletItem>
          <BulletItem number="4">
            If a captain is unavailable, use the force-ready buttons (visible on match cards when
            you're in admin view) to mark their team ready on their behalf. Then click{' '}
            <strong>Start Anyway</strong> to proceed.
          </BulletItem>
          <BulletItem number="5">
            Battles resolve turn by turn based on captain choices. Each turn has a timer. Watch the
            live battle log as it plays out and be ready to intervene if a captain goes unresponsive
            mid-fight.
          </BulletItem>
          <BulletItem number="6">
            After each match concludes the bracket advances automatically and the next round of
            matches becomes available. Repeat until all matches are done.
          </BulletItem>
          <BulletItem number="7">
            Click <strong>Mark Completed</strong> to close the event after the final match. The
            completed event view shows the winning team, the final bracket, and replay links for
            every fight.
          </BulletItem>
        </Column>

        <Column
          icon="👥"
          label="Team Member"
          labelColor={theme.colors.red[200]}
          headerBg={theme.colors.red[900]}
          headerBorderColor={theme.colors.red[700]}
        >
          <BulletItem number="1">
            From your barracks, click <strong>Watch the Battle</strong> to go to the live battle
            page. Alternatively, navigate from the event page which shows the bracket and a Watch
            button when battle is in progress.
          </BulletItem>
          <BulletItem number="2">
            The bracket shows all matches grouped by round. In Double Elimination there are three
            sections: Winners Bracket, Losers Bracket, and Grand Final. A loss in the Winners
            Bracket drops you to Losers but does not eliminate you.
          </BulletItem>
          <BulletItem number="3">
            Watch matches as they play out in the battle log. Every action is shown: attack damage,
            critical hits, defend blocks, special ability effects (bleed, lifesteal, chain
            lightning, and more), and consumable uses. The log colors actions by type so you can
            follow the momentum of the fight.
          </BulletItem>
          <BulletItem number="4">
            Spectators can send emoji reacts during a live battle to hype up their team. Use them
            to cheer on your captain when they land a big hit or make a clutch play.
          </BulletItem>
          <BulletItem number="5">
            After your match ends you can view the complete battle log replay at any time by
            clicking the match card in the bracket. Full replays are available for every fight in
            the event.
          </BulletItem>
          <CaptainNote>
            <strong>You must be present and actively playing during your match.</strong> When the
            battle starts, you will see action buttons each turn: attack, defend, use a special,
            or use a consumable. You choose one per turn. The turn timer runs down and if you
            miss it the game picks for you, so stay focused. Coordinate your match time with the
            opposing captain and your admin in advance. Do not go offline during Battle phase
            without letting your admin know.
          </CaptainNote>
        </Column>
      </SimpleGrid>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChampionForgeGuidePage() {
  usePageTitle('Champion Forge Guide');

  return (
    <Box maxWidth="1000px" margin="0 auto" padding={['16px', '24px', '48px']} paddingBottom="80px">
      <Breadcrumb />

      <Box mb={10}>
        <Text fontSize={['2xl', '3xl']} fontWeight="bold" color="white" mb={3}>
          Champion Forge: Event Guide
        </Text>
        <Text fontSize="md" color={theme.colors.gray[400]} lineHeight="tall" maxWidth="600px">
          A complete walkthrough of the Champion Forge format from event setup through the final
          battle. Use this as a reference before running or participating in an event.
        </Text>
      </Box>

      <VStack spacing={0} alignItems="stretch">
        <EventCreatorSection />
        <SectionDivider />
        <GatheringSection />
        <SectionDivider />
        <OutfittingSection />
        <SectionDivider />
        <BattleSection />
      </VStack>
    </Box>
  );
}
