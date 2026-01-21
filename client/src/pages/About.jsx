import React from 'react';
import { Box, Flex, Heading, Text, Link as ChakraLink, VStack, HStack } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { Link } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';

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
            share, and track bingo boards for their in-game goals and clan events.
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
                  ? 'Run Gielinor Rush events with teams, maps, and rewards'
                  : undefined,
                'Share public boards with the community',
                'Discord bot integration for clan events',
              ].map(
                (item, i) =>
                  item && (
                    <HStack key={i} spacing={3}>
                      <CheckCircleIcon color="green.400" />
                      <Text>{item}</Text>
                    </HStack>
                  )
              )}
            </VStack>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Our Community
            </Heading>
            <Text>
              Since launching, over <strong>3,000 boards</strong> have been created by players from
              clans and communities across Gielinor. Whether you're an ironman tracking collection
              log goals or a clan running a PvM competition, OSRS Bingo Hub has you covered.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Privacy First
            </Heading>
            <Text>
              We intentionally don't collect email addresses to protect your OSRS credentials. Your
              account security matters to us. Read more in our{' '}
              <Link to="/privacy" style={{ textDecoration: 'underline' }}>
                Privacy Policy
              </Link>
              .
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Support the Site
            </Heading>
            <Text>
              OSRS Bingo Hub is a passion project built and maintained by a solo developer. If you
              find it useful, consider{' '}
              <ChakraLink
                href="https://ko-fi.com/A667UUO"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                buying me a coffee
              </ChakraLink>{' '}
              to help keep the servers running!
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Contact
            </Heading>
            <Text>
              Have questions, feedback, or found a bug? Reach out via Discord at{' '}
              <strong>buttlid</strong> or join our{' '}
              <ChakraLink
                href="https://discord.gg/eternalgems"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                community Discord server
              </ChakraLink>
              .
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default AboutPage;
