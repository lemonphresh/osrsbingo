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
  Icon,
  Button,
  Link,
} from '@chakra-ui/react';
import { InfoIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import theme from '../../theme';

const DiscordSetupModal = ({ isOpen, onClose, eventId }) => {
  const botInstallUrl = process.env.REACT_APP_DISCORD_BOT_INSTALLATION_URL;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg="gray.700" color="white" maxH="90vh">
        <ModalHeader textAlign="center" color="white">
          <HStack justify="center">
            <Icon as={InfoIcon} color={theme.colors.purple[300]} />
            <Text>Discord Bot Setup Guide</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="gray.400" _hover={{ color: 'white' }} />
        <ModalBody
          pb={6}
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4A5568',
              borderRadius: '10px',
              '&:hover': {
                background: '#718096',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#4A5568 transparent',
          }}
        >
          <VStack spacing={4} align="stretch">
            {/* Overview */}
            <Box>
              <Text fontWeight="bold" color="white" mb={2}>
                📱 Overview
              </Text>
              <Text fontSize="sm" color="gray.300">
                The Discord bot lets your teams interact with Gielinor Rush directly from Discord.
                Teams can view their progress, check available nodes, submit completions, and view
                the leaderboard - all without leaving your server!
              </Text>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Step 0: Install Bot */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 0
                </Badge>
                <Text fontWeight="bold" color="white">
                  Install the Bot
                </Text>
              </HStack>
              <VStack align="stretch" spacing={3}>
                <Text fontSize="sm" color="gray.300">
                  First, you need to add the Gielinor Rush bot to your Discord server.
                </Text>

                <Box p={3} bg="gray.800" borderRadius="md">
                  <Button
                    as={Link}
                    href={botInstallUrl}
                    isExternal
                    colorScheme={process.env.NODE_ENV === 'production' ? 'green' : 'yellow'}
                    size="sm"
                    rightIcon={<ExternalLinkIcon />}
                    _hover={{ textDecoration: 'none' }}
                    w="100%"
                  >
                    Add Bot to Discord Server
                  </Button>
                </Box>

                <Text fontSize="xs" color="gray.400">
                  You'll need "Manage Server" permissions to add the bot. The bot requires
                  permissions to read messages, send messages, and embed links.
                </Text>
              </VStack>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Step 1: Create Channels */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 1
                </Badge>
                <Text fontWeight="bold" color="white">
                  Create Event Channels
                </Text>
              </HStack>
              <OrderedList spacing={2} fontSize="sm" color="gray.300">
                <ListItem>
                  Create a text channel for your event (e.g.,{' '}
                  <Code bg="gray.800" color="gray.100">
                    #gielinor-rush-2025
                  </Code>
                  )
                </ListItem>
                <ListItem>
                  Set the channel topic to your Event ID:{' '}
                  <Code bg="gray.800" color={theme.colors.purple[300]}>
                    {eventId}
                  </Code>
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Important:
                  </Text>{' '}
                  The Event ID must be in the channel topic exactly as shown above for the bot to
                  work
                </ListItem>
              </OrderedList>
              <Box
                mt={2}
                p={2}
                bg="teal.900"
                borderRadius="md"
                borderWidth="1px"
                borderColor="teal.700"
              >
                <Text fontSize="xs" color="teal.100" fontWeight="bold">
                  💡 Pro Tip: You can create multiple channels for the same event (one per team) by
                  using the same Event ID in each channel's topic!
                </Text>
              </Box>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Step 2: Create Teams */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 2
                </Badge>
                <Text fontWeight="bold" color="white">
                  Set Up Teams
                </Text>
              </HStack>
              <Text fontSize="sm" color="gray.300" mb={2}>
                Team members are identified by their Discord User ID:
              </Text>
              <UnorderedList spacing={2} fontSize="sm" color="gray.300">
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Member List
                  </Text>{' '}
                  - Add Discord User IDs to each team. This allows members to use Discord commands
                  to submit screenshots, check progress, and more. They can also use the website to
                  manage buffs and inn items{' '}
                  <Text as="span" fontWeight="bold">
                    if their Discord ID is linked to their OSRS Bingo Hub profile
                  </Text>
                  .
                </ListItem>
              </UnorderedList>
              <Box
                mt={2}
                p={2}
                bg="yellow.900"
                borderRadius="md"
                borderWidth="1px"
                borderColor="yellow.700"
              >
                <Text fontSize="xs" color="yellow.200">
                  ⚠️ Enable Developer Mode in Discord (Settings → Advanced → Developer Mode) to copy
                  User IDs by right-clicking on users
                </Text>
              </Box>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Step 3: Bot Commands */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 3
                </Badge>
                <Text fontWeight="bold" color="white">
                  Available Commands
                </Text>
              </HStack>
              <VStack align="stretch" spacing={2}>
                {/* Help Command */}
                <Box p={2} bg="gray.800" borderRadius="md">
                  <HStack>
                    <Code bg="transparent" color={theme.colors.purple[300]}>
                      !treasurehunt
                    </Code>
                    <Text color="gray.500" fontSize="sm">
                      or
                    </Text>
                    <Code bg="transparent" color={theme.colors.purple[300]}>
                      !th
                    </Code>
                  </HStack>
                  <Text fontSize="xs" mt={1} color="gray.400">
                    Show all available commands and help information
                  </Text>
                </Box>

                {/* Nodes Command */}
                <Box p={2} bg="gray.800" borderRadius="md">
                  <Code bg="transparent" color="teal.300">
                    !nodes
                  </Code>
                  <Text fontSize="xs" mt={1} color="gray.400">
                    View your team's available nodes and current progress
                  </Text>
                </Box>

                {/* Submit Command */}
                <Box p={2} bg="gray.800" borderRadius="md">
                  <Code bg="transparent" color="orange.300">
                    !submit &lt;node_id&gt; [image_url]
                  </Code>
                  <Text fontSize="xs" mt={1} color="gray.400">
                    Submit a node completion with proof screenshot
                  </Text>
                  <VStack align="start" spacing={1} mt={2}>
                    <HStack>
                      <Badge size="sm" colorScheme="green" fontSize="xs">
                        Option 1
                      </Badge>
                      <Code fontSize="xs" bg="transparent" color="gray.500">
                        !submit evt_abc_node_042 https://imgur.com/...
                      </Code>
                    </HStack>
                    <HStack>
                      <Badge size="sm" colorScheme="green" fontSize="xs">
                        Option 2
                      </Badge>
                      <Code fontSize="xs" bg="transparent" color="gray.500">
                        !submit evt_abc_node_042
                      </Code>
                      <Text fontSize="xs" color="gray.500">
                        (attach image)
                      </Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Leaderboard Command */}
                <Box p={2} bg="gray.800" borderRadius="md">
                  <HStack>
                    <Code bg="transparent" color="teal.300">
                      !leaderboard
                    </Code>
                    <Text color="gray.500" fontSize="sm">
                      or
                    </Text>
                    <Code bg="transparent" color="teal.300">
                      !lb
                    </Code>
                  </HStack>
                  <Text fontSize="xs" mt={1} color="gray.400">
                    View the current event leaderboard with team standings
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Step 4: Admin Workflow */}
            <Box>
              <HStack mb={2}>
                <Badge colorScheme="purple" fontSize="sm">
                  Step 4
                </Badge>
                <Text fontWeight="bold" color="white">
                  Admin Workflow
                </Text>
              </HStack>
              <OrderedList spacing={2} fontSize="sm" color="gray.300">
                <ListItem>
                  Teams submit completions via Discord using{' '}
                  <Code bg="gray.800" color="gray.100">
                    !submit node_id
                  </Code>
                </ListItem>
                <ListItem>
                  Review submissions on this website in the "Pending Submissions" tab
                </ListItem>
                <ListItem>Approve or deny individual submissions as they come in</ListItem>
                <ListItem>
                  When a node's cumulative goal is met, click "Complete Node" to grant rewards
                </ListItem>
                <ListItem>
                  Teams see updates immediately with{' '}
                  <Code bg="gray.800" color="gray.100">
                    !nodes
                  </Code>{' '}
                  and{' '}
                  <Code bg="gray.800" color="gray.100">
                    !leaderboard
                  </Code>
                </ListItem>
              </OrderedList>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Troubleshooting */}
            <Box>
              <Text fontWeight="bold" color="white" mb={2}>
                🔧 Troubleshooting
              </Text>
              <VStack align="stretch" spacing={3} fontSize="sm">
                <Box>
                  <Text fontWeight="bold" color="gray.200" mb={1}>
                    Bot doesn't respond:
                  </Text>
                  <UnorderedList spacing={1} color="gray.400">
                    <ListItem>Verify the bot is installed in your server</ListItem>
                    <ListItem>Verify Event ID is in the channel topic</ListItem>
                    <ListItem>Check bot has permission to read/send messages</ListItem>
                    <ListItem>Ensure the bot appears online in the member list</ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Text fontWeight="bold" color="gray.200" mb={1}>
                    "You are not part of any team":
                  </Text>
                  <UnorderedList spacing={1} color="gray.400">
                    <ListItem>
                      Verify your Discord User ID is added to a team's member list
                    </ListItem>
                    <ListItem>
                      Make sure you're using commands in a channel with the correct Event ID
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Box>
                  <Text fontWeight="bold" color="gray.200" mb={1}>
                    Submissions not appearing:
                  </Text>
                  <UnorderedList spacing={1} color="gray.400">
                    <ListItem>Refresh the Pending Submissions tab</ListItem>
                    <ListItem>Check that the node ID matches an actual node</ListItem>
                    <ListItem>Ensure the image URL is accessible or file is attached</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </Box>

            <Divider borderColor="gray.600" />

            {/* Quick Reference */}
            <Box p={3} bg="purple.800" borderRadius="md" borderWidth="1px" borderColor="purple.600">
              <Text fontWeight="bold" color="white" mb={2}>
                📋 Quick Reference
              </Text>
              <VStack align="stretch" spacing={1}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="white">
                    Event ID:
                  </Text>
                  <Code bg="whiteAlpha.300" color="white" fontSize="sm" px={2} borderRadius="md">
                    {eventId}
                  </Code>
                </HStack>
                <Text fontSize="xs" color="whiteAlpha.800" mt={2}>
                  Add this to your Discord channel's topic to link it to this event
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DiscordSetupModal;
