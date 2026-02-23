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
  Badge,
  Divider,
  useColorMode,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon, InfoIcon } from '@chakra-ui/icons';

const BuffInfoModal = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      highlightBg: '#1A202C',
    },
    light: {
      textColor: '#171923',
      cardBg: 'white',
      highlightBg: '#F7FAFC',
    },
  };

  const currentColors = colors[colorMode];

  const buffTiers = [
    {
      tier: 'Minor',
      color: 'green',
      reduction: '25%',
      icon: '✨',
      description: 'Small reduction, commonly found on early nodes',
      examples: ["Slayer's Edge", 'Training Efficiency', 'Efficient Gathering'],
    },
    {
      tier: 'Moderate',
      color: 'blue',
      reduction: '50%',
      icon: '💫',
      description: 'Significant reduction, found on mid-tier nodes',
      examples: ["Slayer's Focus", 'Training Momentum', 'Master Gatherer'],
    },
    {
      tier: 'Major',
      color: 'purple',
      reduction: '75%',
      icon: '⚡',
      description: 'Massive reduction, rare rewards from difficult nodes',
      examples: ["Slayer's Mastery", 'Training Enlightenment', 'Legendary Gatherer'],
    },
    {
      tier: 'Universal',
      color: 'yellow',
      reduction: '50%',
      icon: '🌟',
      description: 'Can be applied to ANY objective type',
      examples: ['Versatile Training'],
    },
  ];

  const buffTypes = [
    {
      type: 'Kill Reduction',
      icon: '⚔️',
      color: 'red',
      applies: ['Boss KC', 'Monster Kills'],
      example: 'Reduces "Kill 100 Abyssal Demons" to "Kill 50 Abyssal Demons"',
    },
    {
      type: 'XP Reduction',
      icon: '📚',
      color: 'blue',
      applies: ['XP Gain objectives'],
      example: 'Reduces "Gain 1M Slayer XP" to "Gain 500K Slayer XP"',
    },
    {
      type: 'Item Reduction',
      icon: '📦',
      color: 'green',
      applies: ['Item Collection objectives'],
      example: 'Reduces "Collect 500 Oak Logs" to "Collect 250 Oak Logs"',
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg} maxH="90vh">
        <ModalHeader color={currentColors.textColor}>
          <HStack>
            <Text fontSize="2xl">✨</Text>
            <Text>How Buffs Work</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={6}>
            {/* Overview */}
            <Box p={4} bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'} borderRadius="md">
              <HStack mb={2}>
                <InfoIcon color="purple.400" />
                <Text fontWeight="semibold" color={currentColors.textColor}>
                  What are Buffs?
                </Text>
              </HStack>
              <Text fontSize="sm" color={currentColors.textColor}>
                Buffs are powerful rewards that reduce the requirements of future objectives.
                They're earned by completing specific nodes and can give your team a significant
                strategic advantage!
              </Text>
            </Box>

            <Divider />

            {/* How to Get Buffs */}
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor} mb={3}>
                💎 How to Earn Buffs
              </Text>
              <List spacing={2}>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  Complete nodes that have the{' '}
                  <Badge colorScheme="purple" fontSize="xs">
                    🎁 BUFF REWARD
                  </Badge>{' '}
                  badge
                </ListItem>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  Higher difficulty nodes typically offer stronger buffs
                </ListItem>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="green.400" />
                  Buffs are added to your team's inventory automatically upon completion
                </ListItem>
              </List>
            </Box>

            <Divider />

            {/* Buff Tiers */}
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor} mb={3}>
                🏆 Buff Tiers
              </Text>
              <VStack spacing={3}>
                {buffTiers.map((buff) => (
                  <Box
                    key={buff.tier}
                    p={3}
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="md"
                    w="full"
                    borderLeft="4px solid"
                    borderLeftColor={`${buff.color}.400`}
                  >
                    <HStack justify="space-between" mb={1}>
                      <HStack>
                        <Text fontSize="xl">{buff.icon}</Text>
                        <Text fontWeight="semibold" color={currentColors.textColor}>
                          {buff.tier}
                        </Text>
                        <Badge colorScheme={buff.color}>{buff.reduction} Reduction</Badge>
                      </HStack>
                    </HStack>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                      {buff.description}
                    </Text>
                    <Text
                      fontSize="xs"
                      color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                      mt={1}
                    >
                      Examples: {buff.examples.join(', ')}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* Buff Types */}
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor} mb={3}>
                🎯 Buff Types
              </Text>
              <VStack spacing={3}>
                {buffTypes.map((buff) => (
                  <Box
                    key={buff.type}
                    p={3}
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="md"
                    w="full"
                  >
                    <HStack mb={2}>
                      <Text fontSize="xl">{buff.icon}</Text>
                      <Text fontWeight="semibold" color={currentColors.textColor}>
                        {buff.type}
                      </Text>
                      <Badge colorScheme={buff.color} fontSize="xs">
                        {buff.applies.join(', ')}
                      </Badge>
                    </HStack>
                    <Box
                      p={2}
                      bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                      borderRadius="sm"
                    >
                      <Text fontSize="xs" color={currentColors.textColor}>
                        <Text as="span" fontWeight="semibold">
                          Example:{' '}
                        </Text>
                        {buff.example}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* How to Use Buffs */}
            <Box>
              <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor} mb={3}>
                🎮 How to Use Buffs
              </Text>
              <Accordion allowMultiple>
                <AccordionItem border="none">
                  <AccordionButton
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    borderRadius="md"
                    mb={2}
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm" color={currentColors.textColor}>
                        Step 1: View Available Nodes
                      </Text>
                    </Box>
                    <AccordionIcon color={currentColors.textColor} />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm" color={currentColors.textColor}>
                      Navigate to your team's map and look for nodes marked as "Available". These
                      are nodes your team can currently work on.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                  <AccordionButton
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    borderRadius="md"
                    mb={2}
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm" color={currentColors.textColor}>
                        Step 2: Click Node with Compatible Buff
                      </Text>
                    </Box>
                    <AccordionIcon color={currentColors.textColor} />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm" color={currentColors.textColor} mb={2}>
                      If you have a buff that can be applied to the node's objective type, you'll
                      see:
                    </Text>
                    <Badge colorScheme="blue" fontSize="xs">
                      ✨ Buff available
                    </Badge>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                  <AccordionButton
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    borderRadius="md"
                    mb={2}
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm" color={currentColors.textColor}>
                        Step 3: Apply Your Buff
                      </Text>
                    </Box>
                    <AccordionIcon color={currentColors.textColor} />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm" color={currentColors.textColor} mb={2}>
                      In the node details, click "Apply Buff" and choose which buff to use. You'll
                      see a preview of the reduction before confirming.
                    </Text>
                  </AccordionPanel>
                </AccordionItem>

                <AccordionItem border="none">
                  <AccordionButton
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100' }}
                    borderRadius="md"
                  >
                    <Box flex="1" textAlign="left">
                      <Text fontWeight="semibold" fontSize="sm" color={currentColors.textColor}>
                        Step 4: Complete Reduced Objective
                      </Text>
                    </Box>
                    <AccordionIcon color={currentColors.textColor} />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text fontSize="sm" color={currentColors.textColor}>
                      Once a buff is applied, the objective requirement is permanently reduced for
                      that node. Complete the new, easier requirement and submit proof!
                    </Text>
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>

            <Divider />

            {/* Strategy Tips */}
            <Box p={4} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
              <HStack mb={2}>
                <StarIcon color="blue.400" />
                <Text fontWeight="semibold" color={currentColors.textColor}>
                  Strategic Tips
                </Text>
              </HStack>
              <List spacing={2}>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Save major buffs for the hardest objectives
                </ListItem>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Universal buffs are flexible - use them on high-value targets
                </ListItem>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Plan your path to collect buffs before tackling difficult sections
                </ListItem>
                <ListItem fontSize="sm" color={currentColors.textColor}>
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Multi-use buffs can be applied to multiple objectives - use them wisely!
                </ListItem>
              </List>
            </Box>

            {/* Important Notes */}
            <Box p={4} bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'} borderRadius="md">
              <Text fontWeight="semibold" fontSize="sm" color={currentColors.textColor} mb={2}>
                ⚠️ Important Notes
              </Text>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={currentColors.textColor}>
                  • Buffs can only be applied to available (unlocked) nodes
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  • Each buff can only be used once (unless it's a multi-use buff)
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  • Once applied, a buff cannot be removed or transferred
                </Text>
                <Text fontSize="xs" color={currentColors.textColor}>
                  • Buffs must match the objective type (Kill buffs on Kill objectives, etc.)
                </Text>
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BuffInfoModal;
