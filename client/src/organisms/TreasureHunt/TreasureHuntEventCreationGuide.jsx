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
import { CheckCircleIcon, StarIcon, WarningIcon } from '@chakra-ui/icons';
import { isGielinorRushEnabled } from '../../config/featureFlags';

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
              Study Up: Gielinor Rush Event Creation Guide
            </Heading>
          </HStack>

          <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
            {isGielinorRushEnabled() ? (
              <>
                Follow these steps to set up your perfect competitive event. The system will
                automatically generate a balanced treasure map based on your settings!
              </>
            ) : (
              <>
                When the new event system is live, follow these steps to set up your perfect
                competitive event. The system will automatically generate a balanced treasure map
                based on your settings!
              </>
            )}
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
                    <Text fontWeight="semibold" color={currentColors.textColor}>
                      Basic Event Information
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
                      What You'll Enter:
                    </Text>
                    <List spacing={2} fontSize="sm">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Event Name:</strong> A catchy title for your event (like "Sweatlord
                        Summit 2025")
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Start & End Dates:</strong> When the event runs, this alongside a
                        difficulty setting will determine how many nodes are generated
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Event Password:</strong> A code displayed on team dashboards for
                        screenshot verification
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
                    <Text fontWeight="semibold" color={currentColors.textColor}>
                      Prize Pool & Teams
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
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

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                    borderRadius="md"
                    borderWidth={2}
                    borderColor="green.400"
                  >
                    <HStack mb={2}>
                      <Text fontSize="lg">🔒</Text>
                      <Text fontSize="sm" fontWeight="semibold" color={currentColors.textColor}>
                        Hard-Capped Budget System
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                      Your prize pool is <strong>guaranteed to never be exceeded</strong>. Here's
                      how it works:
                    </Text>
                    <List spacing={1} fontSize="xs">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Budget is allocated per team: <strong>Prize Pool ÷ Number of Teams</strong>
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        The system budgets for the <strong>worst-case scenario</strong> (every team
                        picks the hardest nodes with maximum multipliers)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Maximum possible team earnings = <strong>exactly 100%</strong> of their
                        budget allocation
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        Average teams typically earn around <strong>~67%</strong> of max potential
                      </ListItem>
                    </List>
                  </Box>

                  <Box p={3} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={1}
                    >
                      💡 What This Means For You:
                    </Text>
                    <Text fontSize="xs" color={currentColors.textColor}>
                      If you set a 10B prize pool with 10 teams, each team's maximum possible
                      earnings is 1B GP. You'll never pay out more than your allocated prize pool,
                      even if every team plays perfectly!
                    </Text>
                  </Box>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'yellow.900' : 'yellow.50'}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="yellow.400"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
                      💰 What To Do With Leftover GP:
                    </Text>
                    <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                      Since average teams earn ~67% of their max budget, you'll likely have GP left
                      over. Here are some ideas:
                    </Text>
                    <List spacing={1} fontSize="xs">
                      <ListItem>
                        <ListIcon as={StarIcon} color="yellow.500" />
                        <strong>Winner's Bonus:</strong> Award extra GP to the 1st place team
                      </ListItem>
                      <ListItem>
                        <ListIcon as={StarIcon} color="yellow.500" />
                        <strong>Podium Prizes:</strong> Split among top 3 teams
                      </ListItem>
                      <ListItem>
                        <ListIcon as={StarIcon} color="yellow.500" />
                        <strong>MVP Awards:</strong> Let teams vote for standout players across all
                        teams
                      </ListItem>
                      <ListItem>
                        <ListIcon as={StarIcon} color="yellow.500" />
                        <strong>Future Events:</strong> Bank it for your next Gielinor Rush!
                      </ListItem>
                    </List>
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
                    <Text fontWeight="semibold" color={currentColors.textColor}>
                      Difficulty & Balance Settings
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
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
                          Great for casual events or shorter durations
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
                          Balanced for most events
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
                          For experienced players
                        </Text>
                      </Box>

                      <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md">
                        <HStack mb={1}>
                          <Badge colorScheme="red">Sweatlord (2.0x)</Badge>
                        </HStack>
                        <Text fontSize="xs" color={currentColors.textColor}>
                          Extreme challenge for those who desperately need to touch grass
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </Box>

                  <Box>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
                      Node-to-Inn Ratio:
                    </Text>
                    <Text fontSize="sm" color={currentColors.textColor} mb={2}>
                      Controls how often checkpoints (Inns) appear. Default: 5 location groups per
                      Inn.
                    </Text>
                    <HStack spacing={2}>
                      <Badge colorScheme="blue">Low (3:1)</Badge>
                      <Text fontSize="xs" color={currentColors.textColor}>
                        More frequent checkpoints, more key and buff trading opportunities
                      </Text>
                    </HStack>
                    <HStack spacing={2} mt={1}>
                      <Badge colorScheme="purple">High (8:1)</Badge>
                      <Text fontSize="xs" color={currentColors.textColor}>
                        Fewer checkpoints, requires more strategic planning
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
                    <Text fontWeight="semibold" color={currentColors.textColor}>
                      Map Generation & Setup
                    </Text>
                  </HStack>
                </Box>
                <AccordionIcon color={currentColors.textColor} />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack spacing={3} align="stretch">
                  <Text fontSize="sm" color={currentColors.textColor}>
                    After creating the event, follow the Admin Checklist to generate the map, set up
                    your Discord channels, and onboard teams. The system will create a unique,
                    balanced treasure map based on your settings, so no two events are the same!
                  </Text>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
                    borderRadius="md"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
                      🎲 What Gets Generated:
                    </Text>
                    <List spacing={1} fontSize="xs">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Three Paths:</strong> Easy, Medium, and Hard routes with different
                        key colors and buffs
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Location Groups:</strong> Each location has 3 difficulty variants,
                        but teams can only complete one difficulty per location group
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
                        bonus GP and/or buffs
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="purple.400" />
                        <strong>Buff Rewards:</strong> Some nodes and inns grant buffs to reduce
                        future objective requirements
                      </ListItem>
                    </List>
                  </Box>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="orange.400"
                  >
                    <HStack mb={2}>
                      <WarningIcon color="orange.400" />
                      <Text fontSize="sm" fontWeight="semibold" color={currentColors.textColor}>
                        Location Group System
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                      Each map location offers <strong>three difficulty choices</strong> (Easy,
                      Medium, Hard). Teams can only complete{' '}
                      <strong>one difficulty per location</strong>.
                    </Text>
                    <List spacing={1} fontSize="xs">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="orange.400" />
                        <strong>Easy:</strong> Lower requirements, lower GP rewards
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="orange.400" />
                        <strong>Medium:</strong> Moderate requirements, moderate rewards
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="orange.400" />
                        <strong>Hard:</strong> Higher requirements, higher GP rewards
                      </ListItem>
                    </List>
                    <Text fontSize="xs" color={currentColors.textColor} mt={2} fontStyle="italic">
                      This creates strategic choices: go for easier guaranteed completion or risk
                      harder nodes for bigger rewards!
                    </Text>
                  </Box>

                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="md"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
                      📊 Example Budget Breakdown:
                    </Text>
                    <VStack spacing={2} align="stretch" fontSize="xs">
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Prize Pool:</Text>
                        <Text fontWeight="semibold" color={currentColors.textColor}>
                          10,000M GP (10B)
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>Teams:</Text>
                        <Text fontWeight="semibold" color={currentColors.textColor}>
                          10
                        </Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Max per team:</Text>
                        <Text fontWeight="semibold" color="green.400">
                          1,000M GP (1B)
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Average team earnings:</Text>
                        <Text fontWeight="semibold" color="blue.400">
                          ~670M GP
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color={currentColors.textColor}>→ Your maximum payout:</Text>
                        <Text fontWeight="semibold" color="green.400">
                          ≤ 10,000M GP ✓
                        </Text>
                      </HStack>
                    </VStack>
                    <Text
                      fontSize="xs"
                      color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                      mt={2}
                      fontStyle="italic"
                    >
                      * Even if all 10 teams play perfectly and pick all hard nodes, you'll never
                      exceed your prize pool!
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
                    <Text fontWeight="semibold" color={currentColors.textColor}>
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
                      Click "Add Team" via the Admin Checklist or in the Event Settings tab
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Give each team a name and add their players
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Teams automatically start at the START node
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="cyan.400" />
                      Complete the Admin Checklist to set up Discord channels and review the event
                      in DRAFT mode before going ACTIVE
                    </ListItem>
                  </List>

                  <Box p={3} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md">
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color={currentColors.textColor}
                      mb={2}
                    >
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
              <Text fontWeight="semibold" color={currentColors.textColor}>
                Pro Tips for Event Runners
              </Text>
            </HStack>
            <List spacing={1} fontSize="sm">
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                <strong>Budget guarantee:</strong> You'll never pay out more than your prize pool.
                The system handles it for you!
              </ListItem>
              <ListItem>
                <ListIcon as={CheckCircleIcon} color="blue.400" />
                Longer events generate more nodes...plan accordingly!
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
                The event password appears on team dashboards. Useful for verifying screenshots from
                the teams
              </ListItem>
            </List>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default EventCreationGuide;
