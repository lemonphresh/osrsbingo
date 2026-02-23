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
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';

const FAQ_SECTIONS = [
  {
    title: '📋 Bingo Boards',
    colorKey: 'pink',
    items: [
      {
        q: 'How do I get removed from an editors list?',
        a: "You'll have to contact the board owner or a fellow editor of a board to get removed from an editors list. If they've mysteriously disappeared, I suppose I could help remove you, too. However, if you're the owner, you can't remove yourself from an editors list, though that is typical CEO behavior of you to try.",
      },
      {
        q: 'Can I make my bingo board private?',
        a: "Yes! When creating or editing a board, you can set it to private. Private boards are only visible to you and any editors you've added.",
      },
      {
        q: 'How many tiles can I have on a board?',
        a: 'You can create boards with 9, 16, or 25 tiles (3x3, 4x4, or 5x5 grids). Choose the size that works best for your goals!',
      },
    ],
  },
  isGielinorRushEnabled() && {
    title: '🗺️ Gielinor Rush',
    colorKey: 'yellow',
    items: [
      {
        q: 'What is Gielinor Rush mode?',
        a: 'Gielinor Rush is a competitive, team-based game mode where clans navigate through an interconnected map of OSRS challenges. Teams complete objectives, earn rewards, and race to the treasure!',
      },
      {
        q: 'How do I create a Gielinor Rush event?',
        a: 'Log in and navigate to the Gielinor Rush section. Click "Create Event" to set up your event, define objectives, create teams, and connect your Discord server for submissions and notifications.',
      },
      {
        q: 'How do teams submit completions?',
        a: (
          <>
            Teams submit directly from Discord using the <code>!submit</code> command with a node ID
            and proof (screenshot link or attached image). Admins review submissions and approve or
            deny them via the web dashboard.
          </>
        ),
      },
      {
        q: 'What are keys, buffs, and Inns?',
        a: (
          <>
            <strong>Keys</strong> are rewards earned from completing nodes. <strong>Buffs</strong>{' '}
            provide advantages like reduced objective requirements. <strong>Inns</strong> are
            special nodes where teams can trade keys for bonus rewards and strategic advantages.
          </>
        ),
      },
      {
        q: 'Can I have multiple teams in one event?',
        a: 'Absolutely! Events support multiple teams competing against each other. Each team has their own progress, rewards, and leaderboard position. Perfect for clan competitions!',
      },
      {
        q: 'Do I need a Discord bot for Gielinor Rush?',
        a: "Yes, the Discord bot is required for submission commands and notifications. You'll need to invite the bot to your server and configure it with your event. Instructions are provided during event setup.",
      },
    ],
  },
  {
    title: '💡 General',
    colorKey: 'orange',
    items: [
      {
        q: 'What if I would like to request a feature?',
        a: (
          <>
            I would encourage you to DM me on the{' '}
            <Link
              color={theme.colors.dark.turquoise.base}
              fontWeight="semibold"
              href="https://www.discord.gg/eternalgems"
              isExternal
            >
              Eternal Gems Discord Server
            </Link>{' '}
            @buttlid and let me know. No guarantees, though. XP loss and all, you know.
          </>
        ),
      },
      {
        q: 'I love this product and also you. How can I support you?',
        a: (
          <>
            First of all, thank you. Secondly,{' '}
            <Link color={theme.colors.dark.turquoise.base} fontWeight="semibold" href="/support">
              go here to learn more
            </Link>
            .
          </>
        ),
      },
      {
        q: 'Was this website crafted by gnomes?',
        a: 'You are goddamn right.',
      },
    ],
  },
].filter(Boolean);

const FaqSection = ({ title, colorKey, items, colorMode }) => (
  <Box marginTop="32px" marginBottom="24px">
    <Heading size="md" color={theme.colors[colorMode][colorKey].base} marginBottom="16px">
      {title}
    </Heading>
    <Accordion allowToggle borderColor="transparent" width="100%">
      {items.map((item, idx) => (
        <AccordionItem backgroundColor="whiteAlpha.200" borderRadius="12px" marginY="8px" key={idx}>
          <AccordionButton height="64px">
            <Flex flex="1">
              <Heading size="sm" textAlign="left">
                {item.q}
              </Heading>
            </Flex>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel paddingY={4} textAlign="left">
            <Text>{item.a}</Text>
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  </Box>
);

const Faq = () => {
  const { colorMode } = useColorMode();
  usePageTitle('FAQ');

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
        {FAQ_SECTIONS.map((section, idx) => (
          <FaqSection key={idx} {...section} colorMode={colorMode} />
        ))}
      </Section>
    </Flex>
  );
};

export default Faq;
