import React from 'react';
import { Box, Flex, Heading, Text, VStack, UnorderedList, ListItem } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';

const TermsPage = () => {
  usePageTitle('Terms of Service');

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      <Section flexDirection="column" maxWidth="720px" width="100%">
        <GemTitle>Terms of Service</GemTitle>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Last updated: October 2026
        </Text>

        <VStack spacing={6} align="stretch" mt={6}>
          <Text>
            By using OSRS Bingo Hub ("the Service"), you agree to these terms. If you don't agree,
            please don't use the Service. The Service is a free hobby project built for the Old
            School RuneScape community — all tools are provided as-is at no cost.
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              1. Use of Service
            </Heading>
            <Text mb={2}>You agree to:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>Provide accurate information when creating an account</ListItem>
              <ListItem>Keep your password secure (we cannot recover it)</ListItem>
              <ListItem>Use the Service only for lawful purposes</ListItem>
              <ListItem>Not attempt to disrupt, abuse, scrape at scale, or reverse-engineer the Service</ListItem>
              <ListItem>Respect other users, teammates, refs, and event organizers</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              2. User Content
            </Heading>
            <Text mb={2}>
              You retain ownership of content you create (boards, draft rooms, events, tiles,
              tasks, etc.). By making content public — publishing a bingo board, submitting an
              event to the Eternal Gems calendar, launching a public event — you grant us a
              non-exclusive license to display it on the Service. You agree not to create content
              that:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>Is illegal, harmful, or offensive</ListItem>
              <ListItem>Infringes on others' rights (including copyright and trademarks)</ListItem>
              <ListItem>Contains spam, scams, or malicious links</ListItem>
              <ListItem>Impersonates another user, a clan, or a public figure</ListItem>
              <ListItem>Violates Jagex's terms of service or the OSRS rules</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              3. Events & Prize Pools
            </Heading>
            <Text mb={2}>
              The Service offers tools to run community competitions (Gielinor Rush, Battleship,
              Champion Forge, Spoopy, Blind Draft, Group Dashboard, etc.). If you host an event:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                You are the organizer and are solely responsible for the event's rules, prize pool,
                prize distribution, dispute resolution, and the conduct of participants.
              </ListItem>
              <ListItem>
                Any in-game GP or OSRS items you promise or distribute are between you and your
                participants. The Service does not hold funds, process payments, or guarantee any
                prize.
              </ListItem>
              <ListItem>
                If you participate in someone else's event, you accept their rules and
                acknowledge we are not responsible for how organizers run their events.
              </ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              4. WOM & External Data
            </Heading>
            <Text>
              Several features (Team Balancer, Group Dashboard, event progress tracking) depend on
              Wise Old Man and the OSRS hiscores. Those systems have their own caching, rate
              limits, and occasional outages. We display what they return; stats can lag,
              under-count, or temporarily be unavailable. The Service does not guarantee the
              accuracy, completeness, or availability of external data.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              5. Discord Integration
            </Heading>
            <Text>
              If you link Discord or if an event you join uses a Discord channel, the Service's
              bot may post messages (submission results, event start / curfew / game-over
              notifications, etc.) into channels configured by the event organizer. Your use of
              Discord is subject to Discord's own terms. You can disconnect at any time by
              unlinking your Discord account from the profile page.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              6. Account Termination
            </Heading>
            <Text>
              We reserve the right to suspend or terminate accounts that violate these terms or
              abuse the Service. You may delete your account at any time by contacting us (see
              below).
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              7. No Password Recovery
            </Heading>
            <Text>
              We do not collect email addresses, which means we cannot recover your password. If
              you lose your password, you will need to create a new account. This is a deliberate
              security decision, not a limitation.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              8. Disclaimer
            </Heading>
            <Text>
              OSRS Bingo Hub is provided "as is" and "as available" without warranties of any
              kind, express or implied. We are not affiliated with Jagex Ltd. Old School
              RuneScape and the OSRS Wiki trademarks and content belong to their respective
              owners. In-game item icons used by the Service are credited to the OSRS Wiki.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              9. Limitation of Liability
            </Heading>
            <Text>
              We are not liable for any damages arising from your use of the Service, including
              but not limited to loss of data, loss of account access, in-game losses, missed
              prizes, Discord disruptions, or any consequences of in-game activities related to
              boards or events.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              10. Changes to Terms
            </Heading>
            <Text>
              We may update these terms from time to time. The "Last updated" date at the top
              reflects the most recent revision. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              11. Governing Law
            </Heading>
            <Text>
              These terms are governed by the laws of Washington, USA. Any disputes will be
              resolved in the courts of Washington, USA.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Contact
            </Heading>
            <Text>
              Questions about these terms? Contact me on Discord at <strong>buttlid</strong>.
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default TermsPage;
