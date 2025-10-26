import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Box,
  Code,
  Badge,
  Divider,
  OrderedList,
  ListItem,
  UnorderedList,
  useColorMode,
  Icon,
  Button,
  Link,
} from '@chakra-ui/react';
import { InfoIcon, ExternalLinkIcon } from '@chakra-ui/icons';

const DiscordSetupModal = ({ isOpen, onClose, eventId }) => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF' },
      turquoise: { base: '#28AFB0' },
      orange: { base: '#FF914D' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      codeBg: '#1A202C',
    },
    light: {
      purple: { base: '#7D5FFF' },
      turquoise: { base: '#28AFB0' },
      orange: { base: '#FF914D' },
      textColor: '#171923',
      cardBg: 'white',
      codeBg: '#F7FAFC',
    },
  };

  const currentColors = colors[colorMode];
  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg} maxH="90vh">
        <ModalHeader color={currentColors.textColor}>
          <HStack>
            <Icon as={InfoIcon} color={currentColors.purple.base} />
            <Text>Discord Bot Setup Guide</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            {/* Overview */}
            <Box>
              <Text fontWeight="bold" color={currentColors.textColor} mb={2}>
                📱 Overview
              </Text>
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                The Discord bot lets your teams interact with the Treasure Hunt directly from
                Discord. Teams can view their progress, check available nodes, submit completions,
                and use buffs - all without leaving your server!
              </Text>
            </Box>

            <Divider />

            {/* Step 0: Install Bot */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 0
                </Badge>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Install the Bot
                </Text>
              </HStack>
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                  First, you need to add the Treasure Hunt bot to your Discord server.
                </Text>
                {botInstallUrl ? (
                  <Button
                    as={Link}
                    href={botInstallUrl}
                    isExternal
                    colorScheme="purple"
                    size="md"
                    rightIcon={<ExternalLinkIcon />}
                    _hover={{ textDecoration: 'none' }}
                  >
                    Add Bot to Discord Server
                  </Button>
                ) : (
                  <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.100'} borderRadius="md">
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'red.200' : 'red.800'}>
                      ⚠️ Bot installation URL not configured. Please contact your administrator.
                    </Text>
                  </Box>
                )}
                <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                  You'll need "Manage Server" permissions to add the bot. The bot requires
                  permissions to read messages, send messages, and embed links.
                </Text>
              </VStack>
            </Box>

            <Divider />

            {/* Step 1: Create Channels */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 1
                </Badge>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Create Event Channels
                </Text>
              </HStack>
              <OrderedList
                spacing={2}
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}
              >
                <ListItem>
                  Create a text channel for your event (e.g.,{' '}
                  <Code bg={currentColors.codeBg}>#treasure-hunt-2025</Code>)
                </ListItem>
                <ListItem>
                  Set the channel topic to your Event ID:{' '}
                  <Code bg={currentColors.codeBg}>{eventId}</Code>
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Important:
                  </Text>{' '}
                  The Event ID must be in the channel topic exactly as shown above for the bot to
                  work
                </ListItem>
              </OrderedList>
              <Box mt={2} p={2} bg={currentColors.turquoise.base} borderRadius="md">
                <Text fontSize="xs" color="white" fontWeight="bold">
                  💡 Pro Tip: You can create multiple channels for the same event (one per team) by
                  using the same Event ID in each channel's topic!
                </Text>
              </Box>
            </Box>

            <Divider />

            {/* Step 2: Create Teams */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 2
                </Badge>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Set Up Teams
                </Text>
              </HStack>
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} mb={2}>
                Team members are identified <strong>in one way:</strong>
              </Text>
              <UnorderedList
                spacing={2}
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}
              >
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Member List
                  </Text>{' '}
                  - Add Discord User IDs to each team you create. This will allow them to use
                  Discord commands to submit their screenshots, check progress and more. They'll
                  also be able to use the site UI on their team's page to use buffs, buy items from
                  inns, etc.
                </ListItem>
              </UnorderedList>
              <Box
                mt={2}
                p={2}
                bg={colorMode === 'dark' ? 'yellow.900' : 'yellow.100'}
                borderRadius="md"
              >
                <Text fontSize="xs" color={colorMode === 'dark' ? 'yellow.200' : 'yellow.900'}>
                  ⚠️ Enable Developer Mode in Discord (Settings → Advanced → Developer Mode) to copy
                  User IDs
                </Text>
              </Box>
            </Box>

            <Divider />

            {/* Step 3: Bot Commands */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 3
                </Badge>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Available Commands
                </Text>
              </HStack>
              <VStack align="stretch" spacing={2}>
                <Box p={2} bg={currentColors.codeBg} borderRadius="md">
                  <Code bg="transparent" color={currentColors.purple.base}>
                    !treasurehunt
                  </Code>{' '}
                  or{' '}
                  <Code bg="transparent" color={currentColors.purple.base}>
                    !th
                  </Code>
                  <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    Show all available commands
                  </Text>
                </Box>

                <Box p={2} bg={currentColors.codeBg} borderRadius="md">
                  <Code bg="transparent" color={currentColors.turquoise.base}>
                    !nodes
                  </Code>
                  <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    If a member on a team, view your available nodes
                  </Text>
                </Box>

                <Box p={2} bg={currentColors.codeBg} borderRadius="md">
                  <Code bg="transparent" color={currentColors.orange.base}>
                    !submit &lt;node_id&gt; link_to_screenshot_img
                  </Code>
                  <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    Submit node completion with proof (URL or attach image to message)
                  </Text>
                  <VStack align="start" spacing={1} mt={1}>
                    <Code
                      fontSize="xs"
                      bg="transparent"
                      color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                    >
                      Option 1: !submit evt_abc_node_042 link_to_screenshot_img
                    </Code>
                    <Code
                      fontSize="xs"
                      bg="transparent"
                      color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                    >
                      Option 2: !submit evt_abc_node_042 (attach image file)
                    </Code>
                  </VStack>
                </Box>

                <Box p={2} bg={currentColors.codeBg} borderRadius="md">
                  <Code bg="transparent" color={currentColors.turquoise.base}>
                    !leaderboard
                  </Code>{' '}
                  or{' '}
                  <Code bg="transparent" color={currentColors.turquoise.base}>
                    !lb
                  </Code>
                  <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    View the event leaderboard
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Step 4: Admin Workflow */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 4
                </Badge>
                <Text fontWeight="bold" color={currentColors.textColor}>
                  Admin Workflow
                </Text>
              </HStack>
              <OrderedList
                spacing={2}
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}
              >
                <ListItem>
                  Teams submit completions via Discord:{' '}
                  <Code bg={currentColors.codeBg}>!submit node_id proof_url</Code>
                </ListItem>
                <ListItem>
                  You review submissions on this website in the "Pending Submissions" tab
                </ListItem>
                <ListItem>Approve/deny individual submissions as they come in</ListItem>
                <ListItem>
                  When cumulative goal is met, click "Complete Node" button to grant rewards
                </ListItem>
                <ListItem>
                  Teams can immediately see progress with{' '}
                  <Code bg={currentColors.codeBg}>!team</Code> and{' '}
                  <Code bg={currentColors.codeBg}>!nodes</Code>
                </ListItem>
              </OrderedList>
            </Box>

            <Divider />

            {/* Troubleshooting */}
            <Box>
              <Text fontWeight="bold" color={currentColors.textColor} mb={2}>
                🔧 Troubleshooting
              </Text>
              <VStack align="stretch" spacing={2} fontSize="sm">
                <Box>
                  <Text fontWeight="bold" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                    Bot doesn't respond:
                  </Text>
                  <UnorderedList spacing={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    <ListItem>Verify the bot is installed in your server</ListItem>
                    <ListItem>Verify Event ID is in channel topic</ListItem>
                    <ListItem>Check bot has permission to read/send messages in channel</ListItem>
                    <ListItem>Ensure bot is online in server member list</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Text fontWeight="bold" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                    "You are not part of any team":
                  </Text>
                  <UnorderedList spacing={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    <ListItem>
                      Verify your User ID is in the team's member list on this website
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Text fontWeight="bold" color={colorMode === 'dark' ? 'gray.300' : 'gray.700'}>
                    Submissions not appearing:
                  </Text>
                  <UnorderedList spacing={1} color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                    <ListItem>Refresh the Pending Submissions tab</ListItem>
                    <ListItem>Check the node ID in the submission matches an actual node</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </Box>

            <Divider />

            {/* Quick Reference */}
            <Box p={3} bg={currentColors.purple.base} borderRadius="md">
              <Text fontWeight="bold" color="white" mb={2}>
                📋 Quick Reference
              </Text>
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="white">
                    Event ID:
                  </Text>
                  <Code bg="whiteAlpha.300" color="white" fontSize="sm">
                    {eventId}
                  </Code>
                </HStack>
                <Text fontSize="xs" color="whiteAlpha.800" mt={2}>
                  Add this to your Discord channel's topic to link it to this event
                </Text>
              </VStack>
            </Box>

            {/* Help Link */}
            {/* <Box textAlign="center" pt={2}>
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}>
                Need more help? Check the{' '}
                <Link color={currentColors.turquoise.base} href="#" isExternal>
                  full documentation <ExternalLinkIcon mx="2px" />
                </Link>
              </Text>
            </Box> */}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DiscordSetupModal;
