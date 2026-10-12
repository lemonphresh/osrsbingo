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
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  useColorMode,
  VStack,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import React, { useMemo, useState } from 'react';
import theme from '../theme';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePageTitle from '../hooks/usePageTitle';
import {
  isGielinorRushEnabled,
  isChampionForgeEnabled,
  isBlindDraftEnabled,
  isGroupDashboardEnabled,
  isBattleshipEnabled,
} from '../config/featureFlags';
import { useAuth } from '../providers/AuthProvider';

// Section definitions. Each `title` begins with an emoji glyph that gets
// split out and rendered as a colored tile beside the title text; the
// rest of the title string becomes the heading itself.
const FAQ_SECTIONS = (user) =>
  [
    isGroupDashboardEnabled(user) && {
      title: '📊 Group Goals Dashboard',
      colorKey: 'orange',
      items: [
        {
          q: 'What is the Group Goals Dashboard?',
          a: 'A shared dashboard that tracks collective XP, boss KC, clue scrolls, minigame scores, and more for any Wise Old Man group. Set timed events with specific targets and get a live leaderboard of top contributors, all on a shareable public page.',
        },
        {
          q: 'Do I need a Wise Old Man account?',
          a: "No. You just need your WOM group ID (the number in your group's WOM URL). The dashboard pulls progress data directly from WOM's public API.",
        },
        {
          q: 'How often does the data refresh?',
          a: 'Data is cached for 1 hour and shared across all visitors, so everyone sees the same snapshot.',
        },
        {
          q: 'Can I set up Discord notifications?',
          a: 'Yes! Connect your Discord server in Manage → Discord. The bot will ping your chosen channel at 25%, 50%, 75%, and 100% milestones, including a live top-contributors leaderboard and a direct link to the dashboard.',
        },
        {
          q: 'Who can manage a dashboard?',
          a: 'The creator is always the owner. You can add extra editors in Manage > Editors. Editors can create and modify events, update the theme, and configure Discord.',
        },
        {
          q: 'What goal types are supported?',
          a: 'Boss KC, Skill XP, Clue Scrolls (any tier), Minigames (LMS, Soul Wars, etc.), EHB, and EHP. All track WOM group gains over your chosen date range.',
        },
      ],
    },
    {
      title: '⚖️ Team Balancer',
      colorKey: 'green',
      items: [
        {
          q: 'What is the Team Balancer?',
          a: 'Paste a list of RSNs and the Team Balancer automatically splits them into fair teams using Wise Old Man stats. Pick a preset (All-Rounder, PvM, Skilling, or Raid) and get balanced teams sorted by EHB/Y, EHP/Y, raid KCs, and more.',
        },
        {
          q: 'How does it balance the teams?',
          a: 'Each player gets a score based on the chosen preset (i.e. EHB/Y for PvM). Players are distributed so the total score per team is as close as possible. The algorithm does a greedy sort-and-assign pass, so large skill gaps between players are smoothed out across teams.',
        },
      ],
    },
    isBlindDraftEnabled(user) && {
      title: '🎲 Blind Draft',
      colorKey: 'pink',
      items: [
        {
          q: 'What is Blind Draft?',
          a: 'A fair team-drafting tool where captains pick players by stats alone, with no names visible until after the draft is over. Great for clans that want to remove bias from team selection.',
        },
        {
          q: 'What draft formats are supported?',
          a: 'Snake (alternating picks), Linear (same pick order every round), and Auction (captains bid with a budget). All formats support a real-time pick timer.',
        },
        {
          q: 'Who can see the player names during the draft?',
          a: 'Nobody. Players are shown as anonymized cards with stats and a tier badge. Names are revealed automatically once the draft completes using the Reveal Names action.',
        },
        {
          q: 'Do players need an account to participate?',
          a: 'Captains join with a pin given by the room organizer. Players listed in the draft do not need accounts. Only the organizer needs to be logged in to create the room.',
        },
      ],
    },
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
    isBattleshipEnabled(user) && {
      title: '🚢 Battleship',
      colorKey: 'turquoise',
      items: [
        {
          q: 'What is Battleship?',
          a: 'Battleship is a two-team competitive mode played on 10×10 grids. Each team places five ships (Carrier, Battleship, Cruiser, Submarine, Destroyer) on their own board, then takes turns firing at the enemy board. Every shot reveals an OSRS task the firing team must complete before they can fire again. Tasks include boss KC, XP goals, unique drops, and minigame scores.',
        },
        {
          q: 'Who can create a Battleship event?',
          a: 'Any logged-in user can create an event. The creator is the event admin and can add other admins and refs. Refs handle the review queue. Admins have all ref powers plus event settings and lifecycle controls.',
        },
        {
          q: 'How do the phases work?',
          a: (
            <>
              <strong>Placement</strong>: teammates workshop ship layouts privately, then share one
              as a suggestion for the team to vote on. Whichever layout has the most votes at the
              placement deadline becomes the team&apos;s fleet. Ties break at random. If nobody
              shares a layout, the fleet is auto-placed.
              <br />
              <br />
              <strong>Battle</strong>: teams alternate proposing and firing shots at the enemy
              board. Each shot lands on a tile with an OSRS task that must be verified by a ref
              before the team can fire again.
            </>
          ),
        },
        {
          q: 'How do teams take a shot?',
          a: (
            <>
              Any teammate proposes a target by clicking an unrevealed cell on the enemy board.
              Teammates get a Discord ping and vote yes/no in a modal. Once the proposal hits the
              vote threshold (usually 1 for small teams, up to 3 for larger ones), the proposer
              sees a <strong>FIRE</strong> button and pulls the trigger. One veto rejects the
              proposal outright. Unresolved proposals expire after 2 minutes.
            </>
          ),
        },
        {
          q: 'What happens when a shot connects with a ship?',
          a: (
            <>
              The tile is marked as a hit and the OSRS task on it must be completed and
              ref-approved. When every tile of a ship has been hit AND approved, the ship is sunk.
              Sink all five enemy ships to win. The game-over screen then animates the entire
              engagement log with sound.
            </>
          ),
        },
        {
          q: 'What are skip tokens?',
          a: 'Skip tokens let a team skip a miss tile they don\'t want to grind out. Each event starts with a configurable amount (default 2), and admins can award more. Skips require a team vote too, same as shots. Hit tiles can never be skipped.',
        },
        {
          q: 'How does the game end?',
          a: (
            <>
              <strong>Standard</strong>: the first team to sink all five enemy ships wins.
              <br />
              <br />
              <strong>Admin-called</strong>: the event admin can also end the campaign manually,
              either early (for a stuck event) or at a pre-communicated end time. In that case
              the winner is the team with the most ship-tile hits. Fewer misses breaks a tie. The
              game-over screen shows &quot;Campaign Called&quot; and the Discord post announces a
              hit-count victory instead of a clean sweep.
            </>
          ),
        },
        {
          q: 'Do I need a Discord bot for Battleship?',
          a: (
            <>
              Yes. The Discord bot handles task submissions and channel pings. Players post{' '}
              <code>!bspre</code> before starting a metric task (KC/XP) so refs have a baseline,
              then <code>!bssubmit</code> with a screenshot when it&apos;s done. Non-metric tasks
              (unique drops, minigames) skip the baseline and go straight to <code>!bssubmit</code>.
            </>
          ),
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

// Extract a leading emoji + rest of the title. The current section titles
// follow the shape "<emoji> Title Words", so splitting on the first space
// isolates the glyph so we can render it in its own colored tile and the
// title text as plain prose.
function splitEmoji(title) {
  const [maybeEmoji, ...rest] = title.split(' ');
  return { emoji: maybeEmoji, label: rest.join(' ') };
}

// Case-insensitive substring match that also walks JSX children. Lets the
// search bar find questions whose answers contain JSX (<code> snippets,
// <strong> labels, etc.) rather than falling back on the raw q-only match.
function stringify(node) {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(stringify).join(' ');
  if (React.isValidElement(node)) return stringify(node.props.children);
  return '';
}

function sectionAnchorId(title) {
  return `faq-section-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;
}

// Chip-ish count tag used both on the section header and on the empty-state
// summary row.
const CountTag = ({ children, colorMode, colorKey }) => (
  <Box
    as="span"
    display="inline-flex"
    alignItems="center"
    px={2}
    py={0.5}
    borderRadius="full"
    bg={`${theme.colors[colorMode][colorKey].base}20`}
    color={theme.colors[colorMode][colorKey].base}
    fontSize="xs"
    fontWeight="bold"
    letterSpacing="wider"
    textTransform="uppercase"
  >
    {children}
  </Box>
);

// Tile holding the section emoji. Lightly-tinted square that reinforces
// the section's accent color.
const EmojiTile = ({ emoji, colorMode, colorKey }) => (
  <Flex
    alignItems="center"
    justifyContent="center"
    width="48px"
    height="48px"
    flexShrink={0}
    borderRadius="12px"
    bg={`${theme.colors[colorMode][colorKey].base}1a`}
    border="1px solid"
    borderColor={`${theme.colors[colorMode][colorKey].base}33`}
    fontSize="24px"
    lineHeight="1"
  >
    {emoji}
  </Flex>
);

const FaqSection = ({ title, colorKey, items, colorMode, matchingIndices, isSearching }) => {
  const { emoji, label } = splitEmoji(title);
  const accent = theme.colors[colorMode][colorKey].base;

  // When the user is searching, we expand matching items by default so
  // the hit is visible without an extra click.
  const defaultIndex = isSearching ? matchingIndices : [];

  return (
    <Box
      id={sectionAnchorId(title)}
      marginTop="24px"
      marginBottom="8px"
      position="relative"
      pl={['14px', '20px']}
      _before={{
        content: '""',
        position: 'absolute',
        left: 0,
        top: '18px',
        bottom: '18px',
        width: '3px',
        bg: accent,
        borderRadius: '2px',
        opacity: 0.75,
      }}
    >
      {/* Section header */}
      <HStack spacing={3} marginBottom="14px" alignItems="center">
        <EmojiTile emoji={emoji} colorMode={colorMode} colorKey={colorKey} />
        <VStack align="flex-start" spacing={1} flex="1" minW={0}>
          <Heading
            size="md"
            color={accent}
            noOfLines={1}
            fontFamily={theme.fonts.heading}
            letterSpacing="-0.01em"
          >
            {label}
          </Heading>
          <CountTag colorMode={colorMode} colorKey={colorKey}>
            {items.length} {items.length === 1 ? 'question' : 'questions'}
          </CountTag>
        </VStack>
      </HStack>

      <Accordion
        allowMultiple
        borderColor="transparent"
        width="100%"
        {...(isSearching
          ? { key: `search-${defaultIndex.join('-')}`, defaultIndex }
          : { key: 'default' })}
      >
        {items.map((item, idx) => (
          <AccordionItem
            key={idx}
            backgroundColor="whiteAlpha.100"
            borderRadius="12px"
            marginY="8px"
            border="1px solid"
            borderColor="whiteAlpha.100"
            overflow="hidden"
          >
            <AccordionButton
              minHeight="56px"
              paddingY="12px"
              paddingX="16px"
              _expanded={{ bg: `${accent}1a` }}
            >
              <Box
                as="span"
                flex="1"
                textAlign="left"
                fontSize="sm"
                fontFamily={theme.fonts.heading}
                fontWeight="600"
              >
                <Box
                  as="span"
                  fontFamily="mono"
                  fontSize="xs"
                  color={accent}
                  opacity={0.7}
                  marginRight="12px"
                >
                  {String(idx + 1).padStart(2, '0')}
                </Box>
                {item.q}
              </Box>
              <AccordionIcon color={accent} />
            </AccordionButton>
            <AccordionPanel paddingY={4} paddingX={{ base: 4, md: 6 }} textAlign="left">
              <Text lineHeight="1.75">{item.a}</Text>
            </AccordionPanel>
          </AccordionItem>
        ))}
      </Accordion>
    </Box>
  );
};

const Faq = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  usePageTitle('FAQ');

  const [query, setQuery] = useState('');

  const allSections = useMemo(() => FAQ_SECTIONS(user), [user]);
  const totalQuestions = useMemo(
    () => allSections.reduce((sum, s) => sum + s.items.length, 0),
    [allSections]
  );

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  // Filtered sections: keep only sections that have at least one matching
  // Q or A. Each kept section carries the indices of its matching items so
  // we can auto-expand them in the accordion.
  const filteredSections = useMemo(() => {
    if (!isSearching) {
      return allSections.map((s) => ({
        ...s,
        matchingIndices: [],
      }));
    }
    const needle = trimmedQuery;
    return allSections
      .map((section) => {
        const matches = [];
        section.items.forEach((item, idx) => {
          const haystack = `${item.q} ${stringify(item.a)}`.toLowerCase();
          if (haystack.includes(needle)) matches.push(idx);
        });
        if (matches.length === 0) return null;
        return { ...section, matchingIndices: matches };
      })
      .filter(Boolean);
  }, [allSections, isSearching, trimmedQuery]);

  const matchCount = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.matchingIndices.length, 0),
    [filteredSections]
  );

  function scrollToSection(title) {
    const el = document.getElementById(sectionAnchorId(title));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

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
      <Section flexDirection="column" width="100%" maxWidth="840px">
        {/* Hero: title + supporting line + total count */}
        <Flex direction="column" alignItems="center" width="100%">
          <GemTitle>FAQ</GemTitle>
          <Text
            marginTop="-8px"
            marginBottom="18px"
            textAlign="center"
            maxWidth="520px"
            color="white"
            fontSize={['sm', 'md']}
            fontWeight="500"
            lineHeight="1.6"
          >
            Everything you've been wondering about, from boards to battle, drafts to dashboards.
          </Text>
          <Box marginBottom="20px">
            <CountTag colorMode={colorMode} colorKey="turquoise">
              {totalQuestions} questions answered
            </CountTag>
          </Box>
        </Flex>

        {/* Search */}
        <InputGroup marginBottom="18px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.500" />
          </InputLeftElement>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions or answers..."
            bg="white"
            color="gray.900"
            borderColor="whiteAlpha.400"
            fontWeight="500"
            _hover={{ borderColor: 'whiteAlpha.600' }}
            _focus={{
              borderColor: theme.colors[colorMode].turquoise.base,
              boxShadow: `0 0 0 1px ${theme.colors[colorMode].turquoise.base}`,
            }}
            _placeholder={{ color: 'gray.500' }}
          />
          {query && (
            <InputRightElement>
              <IconButton
                aria-label="Clear search"
                icon={<CloseIcon boxSize={2.5} />}
                size="xs"
                variant="ghost"
                color="gray.600"
                _hover={{ bg: 'blackAlpha.100' }}
                onClick={() => setQuery('')}
              />
            </InputRightElement>
          )}
        </InputGroup>

        {/* Section quick-nav (jump to). Only shown when NOT searching. */}
        {!isSearching && (
          <HStack
            spacing={2}
            flexWrap="wrap"
            marginBottom="12px"
            justifyContent={['flex-start', 'center']}
          >
            {allSections.map((section) => {
              const { emoji, label } = splitEmoji(section.title);
              const accent = theme.colors[colorMode][section.colorKey].base;
              return (
                <Box
                  as="button"
                  key={section.title}
                  onClick={() => scrollToSection(section.title)}
                  display="inline-flex"
                  alignItems="center"
                  gap={1.5}
                  px={3}
                  py={1.5}
                  borderRadius="full"
                  border="1px solid"
                  borderColor={`${accent}44`}
                  bg={`${accent}0d`}
                  color={accent}
                  fontSize="xs"
                  fontWeight="semibold"
                  _hover={{ bg: `${accent}1f`, borderColor: `${accent}88` }}
                  transition="all 0.15s ease"
                >
                  <Text as="span" fontSize="sm" lineHeight="1">
                    {emoji}
                  </Text>
                  <Text as="span">{label}</Text>
                </Box>
              );
            })}
          </HStack>
        )}

        {/* Search results summary */}
        {isSearching && (
          <Text
            marginBottom="8px"
            fontSize="sm"
            color="white"
            fontWeight="500"
            textAlign="center"
          >
            {matchCount > 0
              ? `${matchCount} ${matchCount === 1 ? 'match' : 'matches'} for "${query}"`
              : `No matches for "${query}"`}
          </Text>
        )}

        {/* Empty state */}
        {isSearching && filteredSections.length === 0 && (
          <Flex
            direction="column"
            alignItems="center"
            justifyContent="center"
            paddingY="48px"
            opacity={0.75}
          >
            <Text fontSize="3xl" marginBottom="8px">
              👻
            </Text>
            <Text fontSize="md" fontWeight="semibold">
              Nothing here matches that.
            </Text>
            <Text fontSize="sm" color="white">
              Try fewer words, or clear the search to see every section.
            </Text>
          </Flex>
        )}

        {/* Sections */}
        {filteredSections.map((section) => (
          <FaqSection
            key={section.title}
            {...section}
            colorMode={colorMode}
            isSearching={isSearching}
          />
        ))}
      </Section>
    </Flex>
  );
};

export default Faq;
