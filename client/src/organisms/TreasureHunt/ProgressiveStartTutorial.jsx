import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  Icon,
  Code,
  Badge,
  Heading,
  Alert,
  AlertIcon,
  Divider,
  UnorderedList,
  ListItem,
  Kbd,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  InfoIcon,
  ArrowForwardIcon,
  CopyIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import { FaDiscord, FaCamera, FaClipboardCheck } from 'react-icons/fa';

const ProgressiveStartTutorial = ({
  nodeId,
  onComplete,
  isStartNode,
  colorMode = 'dark',
  compact = false,
  eventPassword,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [copiedNodeId, setCopiedNodeId] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);

  // When compact prop changes, sync expanded state
  useEffect(() => {
    setIsExpanded(!compact);
  }, [compact]);

  const colors = {
    dark: {
      purple: '#7D5FFF',
      green: '#43AA8B',
      cardBg: '#2D3748',
      textColor: '#F7FAFC',
      stepBg: '#1A202C',
    },
    light: {
      purple: '#7D5FFF',
      green: '#43AA8B',
      cardBg: 'white',
      textColor: '#171923',
      stepBg: '#F7FAFC',
    },
  };

  const currentColors = colors[colorMode];

  const steps = [
    {
      id: 0,
      title: 'Complete the objective in-game',
      icon: FaClipboardCheck,
      iconColor: 'green.500',
      description: `Head into Old School RuneScape and complete the ${
        isStartNode ? 'START' : ''
      } objective.`,
      content: (
        <VStack align="stretch" spacing={3}>
          {isStartNode && (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                The START node has no requirements! This is a tutorial node to get you familiar with
                the process.
              </Text>
            </Alert>
          )}
          <Box bg={currentColors.stepBg} p={4} borderRadius="md">
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Icon as={InfoIcon} color="blue.400" />
                <Text fontSize="sm" fontWeight="bold">
                  Pro Tips:
                </Text>
              </HStack>
              <UnorderedList fontSize="sm" spacing={1} ml={6}>
                <ListItem>Make sure you're on the correct account</ListItem>
                <ListItem>Complete the requirement with your team, communication is key!</ListItem>
                <ListItem>
                  If your event coordinators specified that the event should have a password in the
                  screenshots, be sure that's there! This event's password is:{' '}
                  <Code>{eventPassword}</Code>
                </ListItem>
              </UnorderedList>
            </VStack>
          </Box>
        </VStack>
      ),
      actionLabel: "I've completed the objective ✓",
      canSkip: false,
    },
    {
      id: 1,
      title: 'Take a clear screenshot as proof',
      icon: FaCamera,
      iconColor: 'purple.500',
      description:
        'Capture proof of completion. The clearer your screenshot, the faster the approval!',
      content: (
        <VStack align="stretch" spacing={3}>
          <Box bg={currentColors.stepBg} p={4} borderRadius="md">
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                ✅ Good Screenshot Checklist:
              </Text>
              <VStack align="stretch" spacing={2} pl={4}>
                {[
                  'Shows your character name',
                  'Clearly displays the objective completion',
                  'Include the relevant game UI (i.e., kill count, proof of drop in chat, etc)',
                  'Image is not blurry or too dark',
                  'Entire game window is visible',
                  'Has event password (again, yours is ' + eventPassword + ')',
                ].map((item, idx) => (
                  <HStack key={idx}>
                    <Icon as={CheckCircleIcon} color="green.500" boxSize={4} />
                    <Text fontSize="sm">{item}</Text>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1}>
                Common Rejection Reasons:
              </Text>
              <UnorderedList fontSize="xs" spacing={1}>
                <ListItem>No event password</ListItem>
                <ListItem>Screenshot doesn't show character name</ListItem>
                <ListItem>Objective count isn't visible</ListItem>
                <ListItem>Image is too blurry to verify</ListItem>
              </UnorderedList>
            </Box>
          </Alert>
        </VStack>
      ),
      actionLabel: 'Got my screenshot ✓',
      canSkip: false,
    },
    {
      id: 2,
      title: 'Copy the Node ID',
      icon: CopyIcon,
      iconColor: 'orange.500',
      description: "You'll need this ID to submit your completion via Discord.",
      content: (
        <VStack align="stretch" spacing={3}>
          <Box
            bg={currentColors.purple}
            p={4}
            borderRadius="md"
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top="-20px"
              right="-20px"
              width="100px"
              height="100px"
              bg="whiteAlpha.200"
              borderRadius="full"
            />
            <VStack spacing={3}>
              <Text color="white" fontWeight="bold" fontSize="lg">
                Your Node ID:
              </Text>
              <HStack
                bg="whiteAlpha.300"
                px={6}
                py={3}
                borderRadius="md"
                spacing={3}
                backdropFilter="blur(10px)"
              >
                <Code
                  fontSize="xl"
                  fontWeight="bold"
                  bg="transparent"
                  color="white"
                  letterSpacing="wider"
                >
                  {nodeId}
                </Code>
                <Button
                  size="sm"
                  colorScheme="whiteAlpha"
                  leftIcon={<CopyIcon />}
                  onClick={() => {
                    navigator.clipboard.writeText(nodeId);
                    setCopiedNodeId(true);
                    setTimeout(() => setCopiedNodeId(false), 2000);
                  }}
                >
                  {copiedNodeId ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
              {copiedNodeId && (
                <HStack color="white">
                  <CheckCircleIcon />
                  <Text fontSize="sm">Copied to clipboard!</Text>
                </HStack>
              )}
            </VStack>
          </Box>
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Text fontSize="xs">
              <strong>Tip:</strong> You can also find this ID anytime by using the{' '}
              <Kbd fontSize="xs">!nodes</Kbd> command in Discord
            </Text>
          </Alert>
        </VStack>
      ),
      actionLabel: 'Node ID copied ✓',
      canSkip: false,
      skipLabel: 'Skip',
    },
    {
      id: 3,
      title: 'Submit via Discord',
      icon: FaDiscord,
      iconColor: 'blue.500',
      description: 'Go to your event Discord channel and submit your completion.',
      content: (
        <VStack align="stretch" spacing={4}>
          <Alert status="warning" borderRadius="md" variant="left-accent">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1}>
                ⚠️ Important: Use the correct channel!
              </Text>
              <Text fontSize="xs">
                Make sure you're in your <strong>team's Discord channel</strong>. The bot reads the
                event ID from the channel topic. Submissions from other channels won't work!
              </Text>
            </Box>
          </Alert>
          <Box>
            <Text fontSize="sm" fontWeight="bold" mb={3} color={currentColors.textColor}>
              Choose your submission method:
            </Text>
            <Box
              bg={currentColors.stepBg}
              p={4}
              borderRadius="md"
              borderWidth={2}
              borderColor="green.400"
            >
              <Badge colorScheme="green" mb={2}>
                Direct File Upload
              </Badge>
              <VStack align="stretch" spacing={2}>
                <Text fontSize="sm">Attach your screenshot file directly:</Text>
                <HStack spacing={2} flexWrap="wrap">
                  <Code p={3} borderRadius="md" fontSize="sm" flex={1}>
                    !submit {nodeId}
                  </Code>
                  <Badge colorScheme="gray" fontSize="xs">
                    + attach file
                  </Badge>
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="green"
                  leftIcon={<CopyIcon />}
                  onClick={() => navigator.clipboard.writeText(`!submit ${nodeId}`)}
                >
                  Copy command
                </Button>
              </VStack>
            </Box>
          </Box>
          <Divider />
          <Box bg="purple.50" p={3} borderRadius="md">
            <HStack>
              <Icon as={InfoIcon} color="purple.500" />
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="xs" fontWeight="bold" color={currentColors.textColor}>
                  After Submission:
                </Text>
                <Text fontSize="xs" color="gray.600">
                  You'll get a Discord confirmation. An admin will review and approve/deny within a
                  few minutes to a few hours.
                </Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      ),
      actionLabel: "I've submitted! ✓",
      canSkip: false,
    },
    {
      id: 4,
      title: 'Wait for approval',
      icon: CheckCircleIcon,
      iconColor: 'green.500',
      description: 'An admin will review your submission and notify you via Discord.',
      content: (
        <VStack align="stretch" spacing={4}>
          <Box
            bgGradient="linear(to-r, green.400, blue.500)"
            p={6}
            borderRadius="lg"
            color="white"
            textAlign="center"
          >
            <Text fontSize="3xl" mb={2}>
              ⏳
            </Text>
            <Heading size="md" mb={2}>
              Submission Complete!
            </Heading>
            <Text fontSize="sm" opacity={0.9}>
              Your submission is now in the review queue.
            </Text>
          </Box>
          <Box bg={currentColors.stepBg} p={4} borderRadius="md">
            <VStack align="stretch" spacing={3}>
              <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                What happens next:
              </Text>
              <VStack align="stretch" spacing={2} pl={4}>
                {[
                  { icon: '🔍', text: 'Admin reviews your screenshot', time: 'Now' },
                  {
                    icon: '✅',
                    text: 'You get a Discord notification',
                    time: 'Within a few hours',
                  },
                  { icon: '💰', text: 'GP & rewards are automatically added', time: 'Instantly' },
                  { icon: '🗺️', text: 'New nodes unlock on the map', time: 'Instantly' },
                ].map((item, idx) => (
                  <HStack key={idx} spacing={3}>
                    <Text fontSize="lg">{item.icon}</Text>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm">{item.text}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {item.time}
                      </Text>
                    </VStack>
                  </HStack>
                ))}
              </VStack>
            </VStack>
          </Box>
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontSize="sm" fontWeight="bold" mb={1}>
                🎉 Great job completing the tutorial!
              </Text>
              <Text fontSize="xs">
                When the {isStartNode ? 'start node' : 'current node'} is completed by an admin, you
                can continue working on other available nodes while waiting for approval on future
                nodes.
              </Text>
            </Box>
          </Alert>
        </VStack>
      ),
      actionLabel: 'Got it! Close tutorial',
      canSkip: false,
      isFinal: true,
    },
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('treasureHunt_startTutorial_completed', 'true');
      onComplete?.();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  return (
    <Box
      bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
      borderWidth={2}
      borderColor={currentColors.purple}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Always-visible header — clicking toggles expanded */}
      <HStack
        bg={currentColors.purple}
        px={6}
        py={4}
        cursor="pointer"
        onClick={() => setIsExpanded((v) => !v)}
        justify="space-between"
      >
        <VStack align="start" spacing={1} flex={1}>
          <HStack w="full" justify="space-between">
            <Text fontSize="sm" fontWeight="bold" color="white">
              🎓 Getting Started Tutorial
            </Text>
            <HStack spacing={2}>
              {compact && !isExpanded && (
                <Text fontSize="xs" color="whiteAlpha.800">
                  Quick Start: complete → screenshot →{' '}
                  <Code fontSize="xs" bg="whiteAlpha.300" color="white" px={1}>
                    !submit {nodeId}
                  </Code>
                </Text>
              )}
              <IconButton
                icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                size="xs"
                variant="ghost"
                colorScheme="whiteAlpha"
                color="white"
                aria-label="Toggle tutorial"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded((v) => !v);
                }}
              />
            </HStack>
          </HStack>
          {isExpanded && (
            <Progress
              value={progress}
              size="sm"
              w="full"
              borderRadius="full"
              bg="whiteAlpha.300"
              sx={{ '& > div': { bg: 'white' } }}
            />
          )}
        </VStack>
      </HStack>

      {/* Collapsible body */}
      <Collapse in={isExpanded} animateOpacity>
        <Box p={6}>
          <VStack align="stretch" spacing={4}>
            <HStack spacing={4}>
              <Box
                bg={currentStepData.iconColor}
                p={3}
                borderRadius="lg"
                color="white"
                boxShadow="lg"
              >
                <Icon as={currentStepData.icon} boxSize={6} />
              </Box>
              <VStack align="start" spacing={1} flex={1}>
                <Heading size="md" color={currentColors.textColor}>
                  {currentStepData.title}
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  {currentStepData.description}
                </Text>
              </VStack>
            </HStack>

            <Divider />
            <Box>{currentStepData.content}</Box>
            <Divider />

            <HStack justify="space-between">
              <Button
                size="md"
                variant="ghost"
                onClick={handlePreviousStep}
                isDisabled={currentStep === 0}
                leftIcon={<ArrowForwardIcon transform="rotate(180deg)" />}
              >
                Previous
              </Button>
              <HStack spacing={2}>
                {currentStepData.canSkip && (
                  <Button size="md" variant="ghost" onClick={handleNextStep}>
                    {currentStepData.skipLabel || 'Skip'}
                  </Button>
                )}
                <Button
                  size="md"
                  colorScheme="purple"
                  onClick={handleNextStep}
                  rightIcon={currentStepData.isFinal ? <CheckCircleIcon /> : <ArrowForwardIcon />}
                >
                  {currentStepData.actionLabel}
                </Button>
              </HStack>
            </HStack>

            <HStack justify="center" spacing={2} pt={2}>
              {steps.map((step, idx) => (
                <Box
                  key={step.id}
                  w="8px"
                  h="8px"
                  borderRadius="full"
                  bg={
                    idx === currentStep
                      ? currentColors.purple
                      : completedSteps.includes(idx)
                      ? currentColors.green
                      : 'gray.300'
                  }
                  cursor="pointer"
                  onClick={() => setCurrentStep(idx)}
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.2)' }}
                />
              ))}
            </HStack>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default ProgressiveStartTutorial;
