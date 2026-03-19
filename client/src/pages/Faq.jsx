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
import { isGielinorRushEnabled, isChampionForgeEnabled } from '../config/featureFlags';
import { useAuth } from '../providers/AuthProvider';

const FAQ_SECTIONS = (user) =>
  [
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
    isChampionForgeEnabled(user) && {
      title: '⚔️ Champion Forge',
      colorKey: 'yellow',
      items: [
        {
          q: 'What is Champion Forge?',
          a: 'Champion Forge is a clan tournament mode with four phases: gathering, outfitting, battle, and a final bracket. Teams complete OSRS tasks to earn gear for their champion, then fight head-to-head in turn-based battles.',
        },
        {
          q: 'Who can create a Champion Forge event?',
          a: 'Any logged-in user can create an event. The creator automatically becomes the event admin. Admins can add other admins and refs.',
        },
        {
          q: 'How does the gathering phase work?',
          a: (
            <>
              Players submit proof of completed tasks via the Discord bot command{' '}
              <code>!cfsubmit &lt;taskId&gt;</code> with a screenshot. Admins and refs review
              submissions and approve or deny them. Approved submissions award items to the team war
              chest.
            </>
          ),
        },
        {
          q: 'What are PVMER and SKILLER roles?',
          a: 'Each team member is assigned a role: PVMER or SKILLER. Tasks also have a required role (PVMER, SKILLER, or ANY). You can only submit to tasks that match your role or ANY. PvM tasks give each approved submitter their own individual item drop. Skilling tasks give one item total to the team.',
        },
        {
          q: 'What does the war chest contain?',
          a: 'Items earned during gathering: weapons, armor, consumables, and trinkets. Each item has stat bonuses (attack, defense, speed, HP, crit chance) and may have a special ability or consumable effect. These are what you equip during outfitting.',
        },
        {
          q: 'How does outfitting work?',
          a: 'The team captain equips gear from the war chest into 11 slots: weapon, helm, chest, legs, gloves, boots, shield, ring, amulet, cape, and trinket. You also select up to 4 consumables for the battle pack. If multiple items have specials, you pick which one fires in battle.',
        },
        {
          q: 'What actions are available in battle?',
          a: (
            <>
              Each turn you choose one of four actions:
              <br />
              <strong>Attack</strong>: deal damage based on your ATK vs their DEF.
              <br />
              <strong>Defend</strong>: reduce the next hit you take by 60%.
              <br />
              <strong>Special</strong>: one-time use ability from your equipped gear (cleave,
              ambush, barrage, chain lightning, lifesteal, or fortress).
              <br />
              <strong>Use Item</strong>: consume an item from your battle pack (heal, magic damage,
              debuff, or buff).
            </>
          ),
        },
        {
          q: 'What do the special abilities do?',
          a: (
            <>
              <strong>Cleave</strong>: 80% ATK damage + applies bleed for 3 turns.
              <br />
              <strong>Ambush</strong>: guaranteed crit, ignores defense.
              <br />
              <strong>Barrage</strong>: two hits at 65% ATK each.
              <br />
              <strong>Chain Lightning</strong>: 120% ATK as unblockable magic damage.
              <br />
              <strong>Lifesteal</strong>: normal attack + heals you for 30% of damage dealt.
              <br />
              <strong>Fortress</strong>: reduces incoming damage by 60% for 2 turns.
            </>
          ),
        },
        {
          q: 'Can I watch a battle I am not in?',
          a: 'Yes. Any logged-in user can spectate a live battle. Spectators can see HP bars, status effects, and the action feed in real time, and can send emotes. They just cannot take actions.',
        },
        {
          q: 'Can I rewatch a battle after it ends?',
          a: 'Yes. Every action in every battle is logged. You can step through a full replay from the bracket view after the battle is over.',
        },
      ],
    },
    isGielinorRushEnabled(user) && {
      title: '🗺️ Gielinor Rush',
      colorKey: 'orange',
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
              Teams submit directly from Discord using the <code>!submit</code> command with a node
              ID and proof (screenshot link or attached image). Admins review submissions and
              approve or deny them via the web dashboard.
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
  const { user } = useAuth();
  usePageTitle('FAQ');

  const sections = FAQ_SECTIONS(user);

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
        {sections.map((section, idx) => (
          <FaqSection key={idx} {...section} colorMode={colorMode} />
        ))}
      </Section>
    </Flex>
  );
};

export default Faq;
