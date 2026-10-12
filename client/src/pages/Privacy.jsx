import React from 'react';
import { Box, Flex, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';

const PrivacyPage = () => {
  usePageTitle('Privacy Policy');
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      <Section flexDirection="column" maxWidth="720px" width="100%">
        <GemTitle>Privacy Policy</GemTitle>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Last updated: October 2026
        </Text>

        <VStack spacing={6} align="stretch" mt={6}>
          <Text>
            OSRS Bingo Hub ("we", "our", "us") is committed to protecting your privacy. This policy
            explains what information we collect and how we use it. The site is a free hobby
            project built for the Old School RuneScape community.
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              Information We Collect
            </Heading>
            <Text mb={2}>We collect the minimum necessary to run the service:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Account information:</strong> Username, display name, and optionally your
                RuneScape name (RSN). We do NOT collect email addresses.
              </ListItem>
              <ListItem>
                <strong>Content you create:</strong> Bingo boards, draft rooms, events (Gielinor
                Rush, Battleship, Champion Forge, Spoopy, Whodunnit), group dashboards, and the
                tiles / tasks / settings associated with them.
              </ListItem>
              <ListItem>
                <strong>Event participation data:</strong> Team membership, roles (admin / ref /
                captain / player), submissions, approvals, and progress — only within the events
                you participate in.
              </ListItem>
              <ListItem>
                <strong>Discord IDs:</strong> If you link Discord, we store your Discord user id so
                you can submit via the bot and get event notifications. For event admins, we also
                store Discord channel + role ids they configure on their own events.
              </ListItem>
              <ListItem>
                <strong>RSNs you supply:</strong> Any RSN you paste into the Team Balancer, Blind
                Draft, Group Dashboard, or an event roster. These are sent to Wise Old Man (WOM)
                to look up public game stats.
              </ListItem>
              <ListItem>
                <strong>Usage data:</strong> Basic server logs (page views, errors) to keep the
                site stable and improve it over time.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Why No Email?
            </Heading>
            <Text>
              We intentionally do not collect email addresses. Many users reuse passwords or emails
              across services, including their OSRS accounts. By not collecting emails, we reduce
              the risk of your credentials being exposed in a potential data breach. Your account
              security is more important than password-recovery convenience.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              How We Use Your Information
            </Heading>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>Provide and maintain the service</ListItem>
              <ListItem>Save your boards, drafts, events, and progress</ListItem>
              <ListItem>Enable multiplayer features (events, group dashboards, drafts)</ListItem>
              <ListItem>
                Deliver bot messages to your team's Discord channel when you've opted in by
                joining an event
              </ListItem>
              <ListItem>
                Pull public stats from Wise Old Man so progress bars and team balancing work
              </ListItem>
              <ListItem>Improve the site based on error reports and usage patterns</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Public vs. Private Content
            </Heading>
            <Text mb={2}>
              Some things you create on the site are public by design and are visible to anyone,
              including non-logged-in visitors:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Public bingo boards:</strong> Can be browsed, searched, and viewed by
                anyone. Searches match on your board name, your username, your display name, and
                your RSN — so other users can find all boards you've made public under your
                account.
              </ListItem>
              <ListItem>
                <strong>Public events:</strong> Event names, team names, status, and leaderboards
                are visible on event spectator pages.
              </ListItem>
              <ListItem>
                <strong>Eternal Gems calendar:</strong> Scheduled community events submitted
                through the calendar are public.
              </ListItem>
            </UnorderedList>
            <Text mt={2}>
              Private boards, draft rooms, and in-progress events are only visible to the owner,
              invited editors, team members, and refs/admins.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Information Sharing
            </Heading>
            <Text>
              We do not sell, trade, or rent your personal information to third parties. Public
              content is public by your choice. We may share anonymous, aggregated statistics
              (like total boards created, number of events run) in site posts or changelogs.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Cookies & Local Storage
            </Heading>
            <Text mb={2}>We use browser storage to make the site work:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Session cookies:</strong> Keep you logged in and remember a few UI
                preferences (sound toggles, holiday-emoji preference, etc.).
              </ListItem>
              <ListItem>
                <strong>Local storage:</strong> Caches short-lived tokens so anonymous captains in
                a draft room can rejoin, per-event flags like "I've seen the Spoopy rules modal,"
                and similar session niceties. All of this is scoped to your browser and can be
                cleared via your browser's site data settings.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Data Retention
            </Heading>
            <Text>
              Your account and the content tied to it are retained as long as your account exists.
              You may request deletion of your account and associated data by contacting us (see
              below). Deleting your account removes your boards, event entries, and personal
              data; public content you created may still appear in historical references (e.g.
              archived event results) in anonymized form.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Third-Party Services
            </Heading>
            <Text mb={2}>We rely on the following third parties to run the site:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Heroku:</strong> Hosting the web app and background workers.
              </ListItem>
              <ListItem>
                <strong>Wise Old Man (WOM):</strong> Public OSRS stats, XP, KC, and competition
                data. We send RSNs you supply (via Team Balancer, Group Dashboard, event rosters,
                etc.) to their public API and store the returned snapshots.
              </ListItem>
              <ListItem>
                <strong>Discord:</strong> Our bot posts into event channels and reads commands
                from team channels you've connected. We follow Discord's own privacy policy for
                anything that happens inside Discord itself.
              </ListItem>
              <ListItem>
                <strong>OSRS Wiki:</strong> Images and iconography for in-game items are credited
                from the OSRS Wiki, which operates under its own terms.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Children's Privacy
            </Heading>
            <Text>
              Our service is not directed at children under 13. We do not knowingly collect
              information from children under 13.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Changes to This Policy
            </Heading>
            <Text>
              We may update this policy from time to time. We'll bump the "Last updated" date at
              the top and, for significant changes, post a notice in the site changelog or on the
              hub's Discord.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Contact Us
            </Heading>
            <Text>
              Questions about this policy, or want your data removed? Contact me on Discord at{' '}
              <strong>buttlid</strong>.
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default PrivacyPage;
