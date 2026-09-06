import React from 'react';
import { Box, Flex, Heading, Text, Link as ChakraLink, VStack, HStack } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import {
  isGielinorRushEnabled,
  isChampionForgeEnabled,
  isBattleshipEnabled,
  isBlindDraftEnabled,
  isGroupDashboardEnabled,
} from '../config/featureFlags';
import PleaseEffect from '../atoms/PleaseEffect';
import { useAuth } from '../providers/AuthProvider';

const AboutPage = () => {
  usePageTitle('About');
  const { user } = useAuth();
  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      <Section flexDirection="column" maxWidth="720px" width="100%">
        <GemTitle>About OSRS Bingo Hub</GemTitle>

        <VStack spacing={6} align="stretch" mt={6}>
          <Text>
            OSRS Bingo Hub is a free community tool for Old School RuneScape players and clans. It
            started as a better way to make bingo boards, and grew into a whole set of tools for
            running events, tracking group goals, and setting up clan competitions. No
            microtransactions, no ads, no nonsense. 🎯
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              What&apos;s on the site
            </Heading>
            <VStack align="stretch" spacing={2}>
              {[
                'Create custom bingo boards with your own objectives',
                'Track progress and compete with friends and clanmates',
                'Share public boards with the community',
                isGielinorRushEnabled(user)
                  ? 'Gielinor Rush: team-based treasure hunt events across Gielinor'
                  : undefined,
                isBattleshipEnabled(user)
                  ? 'Battleship: a big two-team competition where fleets are placed and OSRS tasks sink the enemy'
                  : 'Battleship: big two-team competition (coming soon)',
                isGroupDashboardEnabled(user)
                  ? 'Group Dashboard: track group goals and monthly bounties through Wise Old Man'
                  : undefined,
                'Team Balancer for evenly splitting your clan into teams',
                isBlindDraftEnabled(user)
                  ? 'Blind Draft for quick, fair draft picks'
                  : undefined,
                isChampionForgeEnabled(user)
                  ? 'Champion Forge tournaments (in testing): blind drafts, gathering phases, outfitting, and live bracket battles'
                  : undefined,
                'Discord integration for submissions and event management',
              ].map(
                (item, i) =>
                  item && (
                    <HStack key={i} spacing={3} align="start">
                      <CheckCircleIcon color="green.400" mt="3px" flexShrink={0} />
                      <Text>{item}</Text>
                    </HStack>
                  )
              )}
            </VStack>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              The Community 🫂
            </Heading>
            <Text>
              Since launching, over <strong>4,500 boards</strong> have been created by players from
              clans and communities across Gielinor, with <strong>125,000+ visitors</strong> since
              January 2026. Whether you&apos;re an ironman tracking collection log goals or a clan
              running a PvM competition, OSRS Bingo Hub has you covered. I&apos;ve seen some
              genuinely creative boards. You lot are not normal, and I mean that in the best way.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Privacy First 🔒
            </Heading>
            <Text>
              I intentionally don&apos;t collect email addresses to protect your OSRS credentials.
              Your account security matters to me, and we&apos;ve all seen what happens when sites
              get breached. Read more in the{' '}
              <Link to="/privacy" style={{ textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              .
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Support the Site ☕
            </Heading>
            <Text>
              OSRS Bingo Hub is a passion project built and maintained by one person. It runs on
              real server bills and stubborn love for the game. If it&apos;s been useful to you or
              your clan, consider{' '}
              <PleaseEffect>
                <ChakraLink
                  href="https://ko-fi.com/A667UUO"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  buying me a coffee
                </ChakraLink>
              </PleaseEffect>
              , or check out the full{' '}
              <Link to="/support" style={{ textDecoration: 'underline' }}>
                support page
              </Link>{' '}
              for other options. Any support keeps the lights on and is genuinely appreciated. 💛
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Say Hi 👋
            </Heading>
            <Text>
              Have questions, feedback, or found a bug? Slide into Discord at{' '}
              <strong>buttlid</strong> or join the{' '}
              <ChakraLink
                href="https://discord.gg/eternalgems"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                Eternal Gems Discord server
              </ChakraLink>
              . Bug reports, feature ideas, and fun bingo stories all welcome.
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default AboutPage;
