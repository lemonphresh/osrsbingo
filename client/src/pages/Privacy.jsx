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
          Last updated: January 2026
        </Text>

        <VStack spacing={6} align="stretch" mt={6}>
          <Text>
            OSRS Bingo Hub ("we", "our", "us") is committed to protecting your privacy. This policy
            explains what information we collect and how we use it.
          </Text>

          <Box>
            <Heading size="md" mb={3}>
              Information We Collect
            </Heading>
            <Text mb={2}>We collect minimal information necessary to provide our service:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Account information:</strong> Username, display name, and optionally your
                RuneScape name (RSN). We do NOT collect email addresses.
              </ListItem>
              <ListItem>
                <strong>Board data:</strong> Bingo boards you create, including tile names,
                completion status, and settings.
              </ListItem>
              <ListItem>
                <strong>Discord User ID:</strong> If you link your Discord account for Treasure Hunt
                events.
              </ListItem>
              <ListItem>
                <strong>Usage data:</strong> Basic analytics like page views to help us improve the
                site.
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
              security is more important than password recovery convenience.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              How We Use Your Information
            </Heading>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>To provide and maintain the service</ListItem>
              <ListItem>To save your boards and track your progress</ListItem>
              <ListItem>To enable multiplayer features like Treasure Hunt events</ListItem>
              <ListItem>To improve the site based on usage patterns</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Information Sharing
            </Heading>
            <Text>
              We do not sell, trade, or rent your personal information to third parties. We may
              share anonymous, aggregated statistics (like total boards created) publicly.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Cookies
            </Heading>
            <Text>
              We use cookies to keep you logged in and remember your preferences. We may use
              third-party analytics services that set their own cookies to help us understand how
              the site is used.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Data Retention
            </Heading>
            <Text>
              Your account and board data are retained as long as your account exists. You may
              request deletion of your account and associated data by contacting us.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Third-Party Services
            </Heading>
            <Text>We use the following third-party services:</Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>
                <strong>Heroku:</strong> Hosting provider
              </ListItem>
              <ListItem>
                <strong>Discord:</strong> Bot integration for events
              </ListItem>
              {/* Add if you use analytics */}
              {/* <ListItem><strong>Google Analytics:</strong> Usage analytics</ListItem> */}
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
              We may update this policy from time to time. We will notify users of significant
              changes by posting a notice on the site.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              Contact Us
            </Heading>
            <Text>
              Questions about this policy? Contact me on Discord at <strong>buttlid</strong>.
            </Text>
          </Box>
        </VStack>
      </Section>
    </Flex>
  );
};

export default PrivacyPage;
