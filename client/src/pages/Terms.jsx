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
          Last updated: January 2026
        </Text>

        <VStack spacing={6} align="stretch" mt={6}>
          <Text>
            By using OSRS Bingo Hub ("the Service"), you agree to these terms. If you don't agree,
            please don't use the Service.
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
              <ListItem>Not attempt to disrupt or abuse the Service</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              2. User Content
            </Heading>
            <Text mb={2}>
              You retain ownership of content you create (boards, tiles, etc.). By making content
              public, you grant us a license to display it on the Service. You agree not to create
              content that:
            </Text>
            <UnorderedList spacing={2} pl={4}>
              <ListItem>Is illegal, harmful, or offensive</ListItem>
              <ListItem>Infringes on others' rights</ListItem>
              <ListItem>Contains spam or malicious links</ListItem>
              <ListItem>Impersonates others</ListItem>
              <ListItem>Violates Jagex's terms of service</ListItem>
            </UnorderedList>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              3. Account Termination
            </Heading>
            <Text>
              We reserve the right to suspend or terminate accounts that violate these terms or
              abuse the Service. You may delete your account at any time by contacting us.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              4. No Password Recovery
            </Heading>
            <Text>
              We do not collect email addresses, which means we cannot recover your password. If you
              lose your password, you will need to create a new account. This is a deliberate
              security decision, not a limitation.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              5. Disclaimer
            </Heading>
            <Text>
              OSRS Bingo Hub is provided "as is" without warranties of any kind. We are not
              affiliated with Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              6. Limitation of Liability
            </Heading>
            <Text>
              We are not liable for any damages arising from your use of the Service, including but
              not limited to loss of data, account access, or any consequences of in-game activities
              related to bingo boards.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              7. Changes to Terms
            </Heading>
            <Text>
              We may update these terms from time to time. Continued use of the Service after
              changes constitutes acceptance of the new terms.
            </Text>
          </Box>

          <Box>
            <Heading size="md" mb={3}>
              8. Governing Law
            </Heading>
            <Text>
              These terms are governed by the laws of Washington, USA. Any disputes will be resolved
              in the courts of Washington, USA.
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
