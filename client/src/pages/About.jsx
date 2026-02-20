import React from 'react';
import { Box, Flex, Heading, Text, Link as ChakraLink, VStack, HStack } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';
import PleaseEffect from '../atoms/PleaseEffect';

const AboutPage = () => {
  usePageTitle('About');
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
            OSRS Bingo Hub is a free community tool for Old School RuneScape players to create,
            share, and track bingo boards for their in-game goals and clan events. No
            microtransactions, no ads, no nonsense. Just bingo. 🎯
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              What We Offer
            </Heading>
            <VStack align="stretch" spacing={2}>
              {[
                'Create custom bingo boards with your own objectives',
                'Track progress and compete with friends and clanmates',
                isGielinorRushEnabled()
                  ? 'Run Gielinor Rush events: team-based treasure hunts across Gielinor'
                  : undefined,
                'Share public boards with the community',
                'Discord bot integration for clan events',
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
              Since launching, over <strong>3,000 boards</strong> have been created by players from
              clans and communities across Gielinor. Whether you're an ironman tracking collection
              log goals or a clan running a PvM competition, OSRS Bingo Hub has you covered. I've
              seen some genuinely creative boards. You lot are not normal, and I mean that in the
              best way.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Privacy First 🔒
            </Heading>
            <Text>
              I intentionally don't collect email addresses to protect your OSRS credentials. Your
              account security matters to me; we've all seen what happens when sites get breached.
              Read more in our{' '}
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
              OSRS Bingo Hub is a passion project built and maintained by a singular goblin with too
              much free time. If you find it useful, consider{' '}
              <PleaseEffect>
                <ChakraLink
                  href="https://ko-fi.com/A667UUO"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'underline' }}
                >
                  buying me a coffee
                </ChakraLink>
              </PleaseEffect>{' '}
              to help keep the servers running. Every little bit helps and is genuinely appreciated!
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
              . Bug reports, feature ideas, and fun bingo-related stories all welcome.
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default AboutPage;
