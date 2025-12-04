import React from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Box,
  Text,
  Heading,
  Badge,
  List,
  ListItem,
  ListIcon,
  SimpleGrid,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';

const EventCreationGuide = ({ colorMode, currentColors }) => {
  return (
    <Card
      maxW="800px"
      w="100%"
      m="0 auto"
      bg="rgba(255,255,255,0.9)"
      borderWidth={2}
      borderColor={currentColors.purple.base}
    >
      <CardBody>
        <VStack spacing={6} align="stretch">
          <HStack>
            <Text fontSize="2xl">📝</Text>
            <Heading size="md" color={currentColors.textColor}>
              How to Create a Gielinor Rush Event
            </Heading>
          </HStack>

          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            Follow these steps to set up your perfect competitive event. The system will
            automatically generate a balanced treasure map based on your settings!
          </Text>

          <Accordion allowMultiple>
            {/* Step 1: Basic Info */}
            <AccordionItem
              bg="white"
              border="1px solid"
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                }}
              >
                <Box flex="1" textAlign="left">
                  <HStack>
                    <Badge colorScheme="purple">STEP 1</Badge>
                    <Text fontWeight="bold" color={currentColors.textColor}>
                      Basic Event Information
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      What You'll Enter:
                    </Text>
                    <List spacing={2} fontSize="sm">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Event Name:</strong> A catchy title for your event (like, "Sweatlord
                        Summit 2025")
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Start & End Dates:</strong> When the event runs - this determines
                        how many nodes are generated
                      </ListItem>
                    </List>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Step 2: Prize Pool */}
            <AccordionItem
              bg="white"
              border="1px solid"
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                }}
              >
                <Box flex="1" textAlign="left">
                  <HStack>
                    <Badge colorScheme="green">STEP 2</Badge>
                    <Text fontWeight="bold" color={currentColors.textColor}>
                      Prize Pool & Teams
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      Key Settings:
                    </Text>
                    <List spacing={2} fontSize="sm">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        <strong>Total Prize Pool:</strong> The total GP available (i.e.,
                        5,000,000,000 = 5B GP)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        <strong>Number of Teams:</strong> How many teams will compete
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        <strong>Players per Team:</strong> Team size affects difficulty scaling
                      </ListItem>
                    </List>
                  </Box>

                  <Box p={3} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
                    <Text fontSize="xs" fontWeight="bold" color={currentColors.textColor} mb={1}>
                      💡 How This Works:
                    </Text>
                    <Text fontSize="xs" color={currentColors.textColor}>
                      The system calculates an average reward per node to distribute the prize pool
                      fairly across all nodes. Harder nodes reward more GP, while easier ones give
                      less.
                    </Text>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Step 3: Difficulty & Balance */}
            <AccordionItem
              bg="white"
              border="1px solid"
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                }}
              >
                <Box flex="1" textAlign="left">
                  <HStack>
                    <Badge colorScheme="orange">STEP 3</Badge>
                    <Text fontWeight="bold" color={currentColors.textColor}>
                      Difficulty & Balance Settings
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      Choose Your Challenge Level:
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                        borderRadius="md"
                      >
                        <HStack mb={1}>
                          <Badge colorScheme="green">Easy (0.8x)</Badge>
                        </HStack>
                        <Text fontSize="xs" color={currentColors.textColor}>
                          Get 80 Boss KC, Gain 400K XP - Great for casual events or shorter
                          durations
                        </Text>
                      </Box>

                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
                        borderRadius="md"
                      >
                        <HStack mb={1}>
                          <Badge colorScheme="blue">Normal (1.0x)</Badge>
                        </HStack>
                        <Text fontSize="xs" color={currentColors.textColor}>
                          Get 100 Boss KC, Gain 500K XP - Balanced for most events
                        </Text>
                      </Box>

                      <Box
                        p={3}
                        bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'}
                        borderRadius="md"
                      >
                        <HStack mb={1}>
                          <Badge colorScheme="orange">Hard (1.4x)</Badge>
                        </HStack>
                        <Text fontSize="xs" color={currentColors.textColor}>
                          Get 140 Boss KC, Gain 700K XP - For experienced players
                        </Text>
                      </Box>

                      <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md">
                        <HStack mb={1}>
                          <Badge colorScheme="red">Sweatlord (2.0x)</Badge>
                        </HStack>
                        <Text fontSize="xs" color={currentColors.textColor}>
                          Get 200 Boss KC, Gain 1M XP - Extreme challenge for those that desperately
                          need to touch grass
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      Node-to-Inn Ratio:
                    </Text>
                    <Text fontSize="sm" color={currentColors.textColor} mb={2}>
                      Controls how often checkpoints (Inns) appear. Default: 5 nodes per Inn.
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">Low (3:1)</Badge>
                      <Text fontSize="xs" color={currentColors.textColor}>
                        More frequent checkpoints
                      </Text>
                    </HStack>
                    <HStack spacing={2} mt={1}>
                      <Badge colorScheme="purple">High (8:1)</Badge>
                      <Text fontSize="xs" color={currentColors.textColor}>
                        Fewer checkpoints, more challenge
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Step 4: What Happens */}
            <AccordionItem
              bg="white"
              border="1px solid"
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="md"
              mb={2}
            >
              <AccordionButton
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                }}
              >
                <Box flex="1" textAlign="left">
                  <HStack>
                    <Badge colorScheme="yellow">STEP 4</Badge>
                    <Text fontWeight="bold" color={currentColors.textColor}>
                      Map Generation & Setup
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color={currentColors.textColor}>
                    After creating the event, click "Generate Map" in the Event Settings tab to
                    automatically create your Gielinor Rush!
                  </Text>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      🎲 What Gets Generated:
                    </Text>
                    <List spacing={1} fontSize="xs">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Three Paths:</strong> Mountain (hard), Trade Route (medium), Coastal
                        (easy)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Varied Objectives:</strong> Boss KC, XP gains, item collection,
                        minigames, clue scrolls
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Strategic Placement:</strong> Nodes are placed on the OSRS world map
                        at real locations
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Inn Checkpoints:</strong> Safe havens where teams can trade keys for
                        bonus GP
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Buff Rewards:</strong> ~30% of nodes grant buffs to help with future
                        objectives
                      </ListItem>
                    </List>
                  </Box>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      📊 Example Calculation:
                    </Text>
                    <VStack spacing={2} align="stretch" fontSize="xs">
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Prize Pool:</Text>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          5,000M GP
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Teams:</Text>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          10
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Duration:</Text>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          2 weeks
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Players per team:</Text>
                        <Text fontWeight="bold" color={currentColors.textColor}>
                          5
                        </Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Expected nodes per team:</Text>
                        <Text fontWeight="bold" color="blue.400">
                          ~20 nodes
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Total nodes generated:</Text>
                        <Text fontWeight="bold" color="blue.400">
                          ~30 nodes
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Average GP per node:</Text>
                        <Text fontWeight="bold" color="green.400">
                          ~15M GP
                        </Text>
                      </HStack>
                    </VStack>
                    <Text
                      fontSize="xs"
                      color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                      mt={2}
                      fontStyle="italic"
                    >
                      * Harder nodes reward more, easier nodes reward less. The system automatically
                      balances distribution.
                    </Text>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>

            {/* Step 5: Adding Teams */}
            <AccordionItem
              bg="white"
              border="1px solid"
              borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
              borderRadius="md"
            >
              <AccordionButton
                _hover={{
                  bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                }}
              >
                <Box flex="1" textAlign="left">
                  <HStack>
                    <Badge colorScheme="cyan">STEP 5</Badge>
                    <Text fontWeight="bold" color={currentColors.textColor}>
                      Add Teams & Launch
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color={currentColors.textColor}>
                    Once your map is generated, add your competing teams:
                  </Text>

                  <List spacing={2} fontSize="sm">
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Click "Add Team" in the Event Settings tab
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Give each team a name and optional Discord role
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Teams automatically start at the START node
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Change event status from DRAFT to ACTIVE when ready
                    </ListItem>
                  </List>

                  <Box p={3} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      🎉 You're Ready!
                    </Text>
                    <Text fontSize="xs" color={currentColors.textColor}>
                      Teams can now view their maps, complete objectives, and compete for the prize
                      pool. Use the Submissions tab to review completions as an admin!
                    </Text>
                  </Box>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {/* Tips Section */}
          <Box p={4} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
            <HStack mb={2}>
              <StarIcon color="blue.400" />
              <Text fontWeight="bold" color={currentColors.textColor}>
                Pro Tips for Event Creators
              </Text>
            </HStack>
            <List spacing={1} fontSize="sm">
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                Longer events generate more nodes - plan accordingly
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                You can regenerate the map if you don't like the initial layout
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                Explore your event in DRAFT mode before going ACTIVE
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                Consider team skill levels when choosing difficulty
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                Enable Discord integration for easier team management
              </ListItem>
            </List>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default EventCreationGuide;
