import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Flex,
  Heading,
  Link,
  Text,
  Box,
  useColorMode,
} from '@chakra-ui/react';
import React from 'react';
import theme from '../theme';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';

const BingoQAList = [
  {
    q: <Text>How do I get removed from an editors list?</Text>,
    a: (
      <Text>
        You'll have to contact the board owner or a fellow editor of a board to get removed from an
        editors list. If they've mysteriously disappeared, I suppose I could help remove you, too.
        However, if you're the owner, you can't remove yourself from an editors list, though that is
        typical CEO behavior of you to try.
      </Text>
    ),
  },
  {
    q: <Text>Can I make my bingo board private?</Text>,
    a: (
      <Text>
        Yes! When creating or editing a board, you can set it to private. Private boards are only
        visible to you and any editors you've added.
      </Text>
    ),
  },
  {
    q: <Text>How many tiles can I have on a board?</Text>,
    a: (
      <Text>
        You can create boards with 9, 16, or 25 tiles (3x3, 4x4, or 5x5 grids). Choose the size that
        works best for your goals!
      </Text>
    ),
  },
];

const TreasureHuntQAList = [
  {
    q: <Text>What is Gielinor Rush mode?</Text>,
    a: (
      <Text>
        Gielinor Rush is a competitive, team-based game mode where clans navigate through an
        interconnected map of OSRS challenges. Teams complete objectives, earn rewards, and race to
        the treasure!
      </Text>
    ),
  },
  {
    q: <Text>How do I create a Gielinor Rush event?</Text>,
    a: (
      <Text>
        Log in and navigate to the Gielinor Rush section. Click "Create Event" to set up your event,
        define objectives, create teams, and connect your Discord server for submissions and
        notifications.
      </Text>
    ),
  },
  {
    q: <Text>How do teams submit completions?</Text>,
    a: (
      <Text>
        Teams submit directly from Discord using the <code>!submit</code> command with a node ID and
        proof (screenshot link or attached image). Admins review submissions and approve or deny
        them via the web dashboard.
      </Text>
    ),
  },
  {
    q: <Text>What are keys, buffs, and Inns?</Text>,
    a: (
      <Text>
        <strong>Keys</strong> are rewards earned from completing nodes. <strong>Buffs</strong>{' '}
        provide advantages like reduced objective requirements. <strong>Inns</strong> are special
        nodes where teams can trade keys for bonus rewards and strategic advantages.
      </Text>
    ),
  },
  {
    q: <Text>Can I have multiple teams in one event?</Text>,
    a: (
      <Text>
        Absolutely! Events support multiple teams competing against each other. Each team has their
        own progress, rewards, and leaderboard position. Perfect for clan competitions!
      </Text>
    ),
  },
  {
    q: <Text>Do I need a Discord bot for Gielinor Rush?</Text>,
    a: (
      <Text>
        Yes, the Discord bot is required for submission commands and notifications. You'll need to
        invite the bot to your server and configure it with your event. Instructions are provided
        during event setup.
      </Text>
    ),
  },
];

const GeneralQAList = [
  {
    q: <Text>What if I would like to request a feature?</Text>,
    a: (
      <>
        <Text>
          I would encourage you to DM me on the{' '}
          <Link
            color={theme.colors.dark.turquoise.base}
            fontWeight="bold"
            href="https://www.discord.gg/eternalgems"
          >
            Eternal Gems Discord Server
          </Link>{' '}
          @buttlid and let me know. No guarantees, though. XP loss and all, you know.
        </Text>
      </>
    ),
  },
  {
    q: <Text>I love this product and also you. How can I support you?</Text>,
    a: (
      <Text>
        First of all, thank you. Secondly,{' '}
        <Link color={theme.colors.dark.turquoise.base} fontWeight="bold" to="/support">
          go here to learn more
        </Link>
        .
      </Text>
    ),
  },
  {
    q: <Text>Was this website crafted by gnomes?</Text>,
    a: <Text>You are goddamn right.</Text>,
  },
];

const Faq = () => {
  const { colorMode } = useColorMode();

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      justifyContent="flex-start"
      paddingY={['72px', '112px']}
      paddingX={['16px', '24px']}
      width="100%"
    >
      <Section flexDirection="column" width="100%" maxWidth="800px">
        <GemTitle>FAQ</GemTitle>

        {/* Bingo Boards Section */}
        <Box marginTop="32px" marginBottom="24px">
          <Heading size="md" color={theme.colors[colorMode].purple.base} marginBottom="16px">
            📋 Bingo Boards
          </Heading>
          <Accordion allowToggle borderColor="transparent" width="100%">
            {BingoQAList.map((i, idx) => (
              <AccordionItem
                backgroundColor="whiteAlpha.200"
                borderRadius="12px"
                marginY="8px"
                key={idx}
              >
                <AccordionButton height="64px">
                  <Flex flex="1">
                    <Heading size="sm" textAlign="left">
                      {i.q}
                    </Heading>
                  </Flex>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel display="flex" flexDirection="column" paddingY={4} textAlign="left">
                  {i.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>

        {/* Gielinor Rush Section */}
        <Box marginTop="32px" marginBottom="24px">
          <Heading size="md" color={theme.colors[colorMode].turquoise.base} marginBottom="16px">
            🗺️ Gielinor Rush
          </Heading>
          <Accordion allowToggle borderColor="transparent" width="100%">
            {TreasureHuntQAList.map((i, idx) => (
              <AccordionItem
                backgroundColor="whiteAlpha.200"
                borderRadius="12px"
                marginY="8px"
                key={idx}
              >
                <AccordionButton height="64px">
                  <Flex flex="1">
                    <Heading size="sm" textAlign="left">
                      {i.q}
                    </Heading>
                  </Flex>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel display="flex" flexDirection="column" paddingY={4} textAlign="left">
                  {i.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>

        {/* General Section */}
        <Box marginTop="32px" marginBottom="24px">
          <Heading size="md" color={theme.colors[colorMode].yellow.base} marginBottom="16px">
            💡 General
          </Heading>
          <Accordion allowToggle borderColor="transparent" width="100%">
            {GeneralQAList.map((i, idx) => (
              <AccordionItem
                backgroundColor="whiteAlpha.200"
                borderRadius="12px"
                marginY="8px"
                key={idx}
              >
                <AccordionButton height="64px">
                  <Flex flex="1">
                    <Heading size="sm" textAlign="left">
                      {i.q}
                    </Heading>
                  </Flex>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel display="flex" flexDirection="column" paddingY={4} textAlign="left">
                  {i.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      </Section>
    </Flex>
  );
};

export default Faq;
