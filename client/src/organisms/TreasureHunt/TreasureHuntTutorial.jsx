import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  OrderedList,
  ListItem,
  Icon,
  Code,
  Divider,
  IconButton,
  CloseButton,
  Collapse,
  Button,
} from '@chakra-ui/react';
import {
  InfoIcon,
  CheckCircleIcon,
  WarningIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';

/**
 * Tutorial component explaining how to get started with the Gielinor Rush
 * Shows when team has 0 completed nodes and START node is available
 * Can be dismissed and won't show again (stored in localStorage)
 */
export const TreasureHuntTutorial = ({
  colorMode = 'dark',
  compact = false,
  eventId = 'default',
}) => {
  const storageKey = `treasureHunt_tutorial_dismissed_${eventId}`;
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const colors = {
    dark: {
      purple: '#7D5FFF',
      green: '#43AA8B',
      yellow: '#F4D35E',
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: '#7D5FFF',
      green: '#43AA8B',
      yellow: '#F4D35E',
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  // Check if tutorial was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === 'true';
    setIsDismissed(dismissed);
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  if (compact) {
    return (
      <Alert
        status="info"
        variant="left-accent"
        borderRadius="md"
        bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
        borderColor={currentColors.purple}
        position="relative"
      >
        <AlertIcon color={currentColors.purple} />
        <Box flex="1">
          <AlertTitle fontSize="sm" color={currentColors.textColor}>
            🎯 Getting Started
          </AlertTitle>
          <AlertDescription fontSize="xs" color={currentColors.textColor}>
            Complete the{' '}
            <Badge colorScheme="purple" fontSize="xs">
              START
            </Badge>{' '}
            node first to unlock your initial nodes and begin the Gielinor Rush!
          </AlertDescription>
        </Box>
        <CloseButton
          size="sm"
          onClick={handleDismiss}
          position="absolute"
          right={2}
          top={2}
          color={currentColors.textColor}
        />
      </Alert>
    );
  }

  return (
    <Box
      bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
      borderWidth={2}
      borderColor={currentColors.purple}
      borderRadius="lg"
      mb={4}
      position="relative"
    >
      {/* Header with collapse/dismiss controls */}
      <HStack
        p={4}
        justify="space-between"
        cursor="pointer"
        onClick={handleCollapse}
        _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50' }}
        borderRadius="lg"
      >
        <HStack flex={1}>
          <Icon as={InfoIcon} color={currentColors.purple} boxSize={6} />
          <Heading size="md" color={currentColors.textColor}>
            🗺️ Welcome to the Gielinor Rush!
          </Heading>
          {isCollapsed && (
            <Badge colorScheme="purple" fontSize="xs">
              Click to expand
            </Badge>
          )}
        </HStack>
        <HStack spacing={1}>
          <IconButton
            icon={isCollapsed ? <ChevronDownIcon /> : <ChevronUpIcon />}
            size="lg"
            variant="ghost"
            aria-label={isCollapsed ? 'Expand tutorial' : 'Collapse tutorial'}
            color={currentColors.textColor}
            onClick={(e) => {
              e.stopPropagation();
              handleCollapse();
            }}
          />
          <IconButton
            icon={<CloseIcon />}
            size="sm"
            variant="ghost"
            aria-label="Dismiss tutorial"
            color={currentColors.textColor}
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
          />
        </HStack>
      </HStack>

      {/* Collapsible content */}
      <Collapse in={!isCollapsed} animateOpacity>
        <Box px={6} pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text fontSize="sm" color={currentColors.textColor}>
              Your adventure begins at the <Badge colorScheme="purple">START</Badge> node. Complete
              it to unlock your first set of objectives and begin earning GP!
            </Text>

            <Divider borderColor={currentColors.purple} opacity={0.3} />

            <Box>
              <Heading size="sm" mb={3} color={currentColors.textColor}>
                📋 How to Complete the START Node:
              </Heading>
              <OrderedList spacing={2} fontSize="sm" color={currentColors.textColor} pl={2}>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Find the START node
                  </Text>{' '}
                  in your map or available nodes list below
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Click on it
                  </Text>{' '}
                  to view the objective details
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Complete the objective
                  </Text>{' '}
                  in Old School RuneScape
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Take a screenshot
                  </Text>{' '}
                  as proof of completion
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Submit via Discord bot
                  </Text>{' '}
                  using one of these commands:
                  <VStack align="stretch" mt={2} spacing={1}>
                    <Code fontSize="xs" p={2} borderRadius="md">
                      !submit node_abc123 https://i.imgur.com/example.png
                    </Code>
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      or attach an image directly
                    </Text>
                    <Code fontSize="xs" p={2} borderRadius="md">
                      !submit node_abc123 (attach image file)
                    </Code>
                  </VStack>
                  <Box
                    mt={2}
                    p={2}
                    bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
                    borderRadius="md"
                  >
                    <HStack spacing={1}>
                      <Icon as={InfoIcon} boxSize={3} color="blue.400" />
                      <Text fontSize="xs" color={currentColors.textColor}>
                        <strong>Node ID:</strong> Found in the node details modal or by using{' '}
                        <Code fontSize="xs">!nodes</Code>
                      </Text>
                    </HStack>
                  </Box>
                </ListItem>
                <ListItem>
                  <Text as="span" fontWeight="bold">
                    Wait for admin approval
                  </Text>{' '}
                  - your submission will be reviewed shortly
                </ListItem>
              </OrderedList>
            </Box>

            <Divider borderColor={currentColors.purple} opacity={0.3} />

            <Box
              bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
              p={3}
              borderRadius="md"
              borderWidth={1}
              borderColor={currentColors.green}
            >
              <HStack mb={2}>
                <Icon as={CheckCircleIcon} color={currentColors.green} />
                <Heading size="xs" color={currentColors.textColor}>
                  What Happens Next?
                </Heading>
              </HStack>
              <VStack align="stretch" spacing={1} fontSize="sm" color={currentColors.textColor}>
                <Text>✅ You'll earn GP and possibly keys</Text>
                <Text>🔓 New nodes will unlock based on the map structure</Text>
                <Text>🎯 You can begin completing harder objectives for bigger rewards</Text>
                <Text>🏠 Complete Inn nodes to trade keys for bonus GP</Text>
                <Text>✨ Earn buffs to reduce future objective requirements</Text>
              </VStack>
            </Box>

            <Box
              bg={colorMode === 'dark' ? 'yellow.900' : 'yellow.50'}
              p={3}
              borderRadius="md"
              borderWidth={1}
              borderColor={currentColors.yellow}
            >
              <HStack mb={2}>
                <Text fontSize="lg">💡</Text>
                <Heading size="xs" color={currentColors.textColor}>
                  Pro Tips
                </Heading>
              </HStack>
              <VStack align="stretch" spacing={1} fontSize="xs" color={currentColors.textColor}>
                <Text>
                  • Use <Code fontSize="xs">!nodes</Code> in Discord to see available nodes anytime
                </Text>
                <Text>
                  • Strategic use of buffs can save you hours of grinding - use them wisely!
                </Text>
                <Text>• Check the leaderboard regularly to see how your team stacks up</Text>
              </VStack>
            </Box>

            {/* Important Notice */}
            <Box
              bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'}
              p={3}
              borderRadius="md"
              borderWidth={1}
              borderColor="orange.400"
            >
              <HStack mb={2}>
                <Icon as={WarningIcon} color="orange.400" />
                <Heading size="xs" color={currentColors.textColor}>
                  Important: Submit from Event Channel
                </Heading>
              </HStack>
              <Text fontSize="xs" color={currentColors.textColor}>
                Make sure to use the <Code fontSize="xs">!submit</Code> command in your event's
                Discord channel. The bot reads the event ID from the channel topic, so submissions
                from other channels won't work!
              </Text>
            </Box>

            {/* Dismiss button at bottom */}
            <HStack justify="center" pt={2}>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                color={currentColors.textColor}
                leftIcon={<CloseIcon />}
              >
                Don't show this again
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

/**
 * Inline tutorial for START node modal
 * More compact version for inside the modal
 * Also dismissable
 */
export const StartNodeTutorial = ({ colorMode = 'dark', nodeId, eventId = 'default' }) => {
  const storageKey = `treasureHunt_startNode_tutorial_dismissed_${eventId}`;
  const [isDismissed, setIsDismissed] = useState(false);

  const colors = {
    dark: {
      purple: '#7D5FFF',
      textColor: '#F7FAFC',
    },
    light: {
      purple: '#7D5FFF',
      textColor: '#171923',
    },
  };

  const currentColors = colors[colorMode];

  // Check if tutorial was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(storageKey) === 'true';
    setIsDismissed(dismissed);
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  // Don't render if dismissed
  if (isDismissed) {
    return null;
  }

  return (
    <Box
      bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
      p={4}
      borderRadius="md"
      borderWidth={1}
      borderColor={currentColors.purple}
      position="relative"
    >
      <CloseButton
        size="sm"
        onClick={handleDismiss}
        position="absolute"
        right={2}
        top={2}
        color={currentColors.textColor}
      />

      <VStack align="stretch" spacing={3}>
        <HStack>
          <Icon as={InfoIcon} color={currentColors.purple} />
          <Heading size="sm" color={currentColors.textColor}>
            🎯 First Steps
          </Heading>
        </HStack>

        <Text fontSize="sm" color={currentColors.textColor}>
          This is your <Badge colorScheme="purple">START</Badge> node - complete it to unlock your
          first set of objectives!
        </Text>

        <Divider borderColor={currentColors.purple} opacity={0.3} />

        <Box>
          <Text fontSize="xs" fontWeight="bold" mb={2} color={currentColors.textColor}>
            To submit completion:
          </Text>
          <VStack align="stretch" spacing={2}>
            <Text fontSize="xs" color={currentColors.textColor}>
              1. Complete the objective in-game
            </Text>
            <Text fontSize="xs" color={currentColors.textColor}>
              2. Take a screenshot as proof
            </Text>
            <Text fontSize="xs" color={currentColors.textColor}>
              3. Submit via Discord <strong>(in your event channel)</strong>:
            </Text>
            <Code fontSize="xs" p={2} borderRadius="md">
              !submit {nodeId} https://i.imgur.com/example.png
            </Code>
            <Text fontSize="xs" color="gray.500" textAlign="center">
              or
            </Text>
            <Code fontSize="xs" p={2} borderRadius="md">
              !submit {nodeId} (attach image)
            </Code>
          </VStack>
        </Box>

        <Box bg={colorMode === 'dark' ? 'green.900' : 'green.50'} p={2} borderRadius="md">
          <Text fontSize="xs" color={currentColors.textColor}>
            ✅ Once approved, new nodes will automatically unlock and you'll be on your way!
          </Text>
        </Box>

        <Box bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} p={2} borderRadius="md">
          <HStack spacing={1}>
            <Icon as={InfoIcon} boxSize={3} color="blue.400" />
            <Text fontSize="xs" color={currentColors.textColor}>
              <strong>Tip:</strong> Copy the node ID above or use <Code fontSize="xs">!nodes</Code>{' '}
              to see all IDs
            </Text>
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default TreasureHuntTutorial;
