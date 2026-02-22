import {
  VStack,
  HStack,
  Box,
  Text,
  Button,
  SimpleGrid,
  Badge,
  Divider,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  List,
  ListItem,
  ListIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import {
  InfoIcon,
  CheckCircleIcon,
  StarIcon,
  LockIcon,
  UnlockIcon,
  WarningIcon,
} from '@chakra-ui/icons';
import TreasureBuffInfoModal from './TreasureHuntBuffInfoModal';

const GameRulesTab = ({ colorMode, currentColors, event }) => {
  const {
    isOpen: isBuffModalOpen,
    onOpen: onBuffModalOpen,
    onClose: onBuffModalClose,
  } = useDisclosure();

  const formatGP = (gp) => {
    if (!gp) return '0';
    return (gp / 1000000).toFixed(1) + 'M';
  };

  return (
    <VStack spacing={6} align="stretch" mx={[1, 2, 4]} mb={4}>
      {/* Header */}
      <Box>
        <HStack mb={2}>
          <InfoIcon color="blue.400" boxSize={6} />
          <Text fontSize="2xl" fontWeight="bold" color={currentColors.white}>
            How to Play Gielinor Rush
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.200">
          Everything you need to know about competing in this event
        </Text>
      </Box>
      <Divider />
      {/* Quick Start Guide */}
      <Box bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} p={4} borderRadius="md">
        <HStack mb={3}>
          <Text fontSize="2xl">🎯</Text>
          <Text fontWeight="bold" fontSize="lg" color={currentColors.textColor}>
            Quick Start Guide
          </Text>
        </HStack>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box>
            <HStack mb={2}>
              <Badge colorScheme="blue" fontSize="sm">
                STEP 1
              </Badge>
              <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                View Your Map
              </Text>
            </HStack>
            <Text fontSize="xs" color={currentColors.textColor}>
              Navigate to your team's page to see the treasure map. You'll start at a single node
              and unlock new ones as you progress.
            </Text>
          </Box>

          <Box>
            <HStack mb={2}>
              <Badge colorScheme="green" fontSize="sm">
                STEP 2
              </Badge>
              <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                Complete Objectives
              </Text>
            </HStack>
            <Text fontSize="xs" color={currentColors.textColor}>
              Click on available nodes to view their objectives. Complete the required tasks in OSRS
              (boss kills, XP gain, item collection, etc.)
            </Text>
          </Box>

          <Box>
            <HStack mb={2}>
              <Badge colorScheme="orange" fontSize="sm">
                STEP 3
              </Badge>
              <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                Submit Proof
              </Text>
            </HStack>
            <Text fontSize="xs" color={currentColors.textColor}>
              Take screenshots showing your completion and submit them via Discord bot. Include
              timestamps, event password and RSN.
            </Text>
          </Box>

          <Box>
            <HStack mb={2}>
              <Badge colorScheme="purple" fontSize="sm">
                STEP 4
              </Badge>
              <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                Claim Rewards & Advance
              </Text>
            </HStack>
            <Text fontSize="xs" color={currentColors.textColor}>
              Once approved, you'll receive GP, keys, and possibly buffs. New nodes will unlock,
              allowing you to continue your journey!
            </Text>
          </Box>
        </SimpleGrid>
      </Box>
      <Divider />
      {/* Core Concepts */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" color={currentColors.white} mb={4}>
          📚 Core Concepts
        </Text>

        <Accordion allowMultiple>
          {/* Node Types */}
          <AccordionItem borderRadius="md" backgroundColor="#ffffff77" mb={2}>
            <AccordionButton
              _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Text fontSize="lg">🗺️</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    Node Types
                  </Text>
                </HStack>
              </Box>
              <AccordionIcon color={currentColors.textColor} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Box p={3} bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'} borderRadius="md">
                  <HStack mb={1}>
                    <Badge colorScheme="purple">START</Badge>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      Starting Node
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Where every team begins. No objective, and automatically unlocks the first set
                    of nodes. Think of it as a tutorial node that gets you onto the map and familiar
                    with the gameplay.
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} borderRadius="md">
                  <HStack mb={1}>
                    <Badge colorScheme="green">EASY</Badge>
                    <Badge colorScheme="yellow">MEDIUM</Badge>
                    <Badge colorScheme="red">HARD</Badge>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      Challenge Nodes
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    The main nodes with objectives. Complete these to earn GP, keys, and sometimes
                    buffs. Each one unlocks new nodes.
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'} borderRadius="md">
                  <HStack mb={1}>
                    <WarningIcon color="orange.400" mr={1} />
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      One Difficulty Per Location
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Each location offers Easy, Medium, and Hard variants, but your team can only
                    complete <strong>ONE</strong> difficulty per location. Choose wisely! Harder
                    nodes give more GP but take longer.
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'yellow.900' : 'yellow.50'} borderRadius="md">
                  <HStack mb={1}>
                    <Badge colorScheme="yellow">INN</Badge>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      Inn Checkpoints
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Safe havens where you can trade keys for bonus GP and/or buffs. Inns connect
                    multiple paths and provide strategic rest points.
                  </Text>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Rewards System */}
          <AccordionItem backgroundColor="#ffffff77" borderRadius="md" mb={2}>
            <AccordionButton
              _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Text fontSize="lg">💰</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    Rewards System
                  </Text>
                </HStack>
              </Box>
              <AccordionIcon color={currentColors.textColor} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Box>
                  <HStack mb={2}>
                    <Text fontSize="lg">💵</Text>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      GP (Gold Pieces)
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                    Your main score! Every node grants GP to your team's pot. The team with the
                    highest pot at the end wins the event.
                  </Text>

                  {/* GP Allocation Table */}
                  <Box
                    p={3}
                    bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                    borderRadius="md"
                    mb={3}
                  >
                    <Text fontSize="xs" fontWeight="bold" color={currentColors.textColor} mb={2}>
                      Prize Pool Distribution:
                    </Text>
                    <List spacing={1} color={currentColors.textColor} fontSize="xs">
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="green.400" />
                        <strong>70%</strong> allocated to node completions
                      </ListItem>
                      <ListItem>
                        <ListIcon as={CheckCircleIcon} color="yellow.400" />
                        <strong>30%</strong> allocated to Inn rewards
                      </ListItem>
                    </List>
                  </Box>

                  {/* Node Rewards Table */}
                  <TableContainer mb={3}>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th color={currentColors.textColor}>Difficulty</Th>
                          <Th color={currentColors.textColor}>GP Reward</Th>
                          <Th color={currentColors.textColor}>Keys</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>
                            <Badge colorScheme="green">EASY</Badge>
                          </Td>
                          <Td color={currentColors.textColor}>0.5x base</Td>
                          <Td color={currentColors.textColor}>1 key</Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <Badge colorScheme="yellow">MEDIUM</Badge>
                          </Td>
                          <Td color={currentColors.textColor}>1.0x base</Td>
                          <Td color={currentColors.textColor}>1 key</Td>
                        </Tr>
                        <Tr>
                          <Td>
                            <Badge colorScheme="red">HARD</Badge>
                          </Td>
                          <Td color={currentColors.textColor}>1.5x base</Td>
                          <Td color={currentColors.textColor}>2 keys</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>

                  <Text fontSize="xs" color={currentColors.textColor} fontStyle="italic">
                    💡 Hard nodes give 3x more GP than Easy nodes, but require more effort!
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <HStack mb={2}>
                    <Text fontSize="lg">🔑</Text>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      Keys
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                    Colored keys earned from completing nodes. Trade them at Inns for bonus GP.
                  </Text>
                  <SimpleGrid columns={3} spacing={2}>
                    <Badge colorScheme="red">Red Keys</Badge>
                    <Badge colorScheme="blue">Blue Keys</Badge>
                    <Badge colorScheme="green">Green Keys</Badge>
                  </SimpleGrid>
                  <Text fontSize="xs" color={currentColors.textColor} mt={2}>
                    Different paths reward different key colors. Diversify your keys for better Inn
                    trades!
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <HStack mb={2}>
                    <Text fontSize="lg">✨</Text>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      Buffs
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                    Powerful rewards that do cool things like reduce future objective requirements
                    by 25-75%. Some nodes and inns grant buffs as rewards.
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    leftIcon={<StarIcon />}
                    onClick={onBuffModalOpen}
                  >
                    Learn More About Buffs
                  </Button>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Node Progression */}
          <AccordionItem backgroundColor="#ffffff77" borderRadius="md" mb={2}>
            <AccordionButton
              _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Text fontSize="lg">🔓</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    Node Progression & Paths
                  </Text>
                </HStack>
              </Box>
              <AccordionIcon color={currentColors.textColor} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Box
                  p={3}
                  bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                  borderRadius="md"
                >
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    <LockIcon mr={2} />
                    Locked Nodes
                  </Text>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Nodes that haven't been unlocked yet. You can't see their details until you
                    complete their prerequisite nodes.
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'orange.900' : 'orange.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    <UnlockIcon mr={2} />
                    Available Nodes
                  </Text>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Nodes you can currently work on. Click them to view objectives and submit
                    completions.
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    <CheckCircleIcon mr={2} />
                    Completed Nodes
                  </Text>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Nodes your team has finished. You've already received the rewards and unlocked
                    their connected nodes.
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    Location Groups
                  </Text>
                  <Text fontSize="xs" color={currentColors.textColor} mb={2}>
                    Each location on the map offers three difficulty choices. Once you complete any
                    difficulty at a location, the other two become locked.
                  </Text>
                  <Box p={2} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md">
                    <Text fontSize="xs" color={currentColors.textColor}>
                      <WarningIcon color="red.400" mr={1} />
                      <strong>Important:</strong> You cannot go back and complete a different
                      difficulty at the same location!
                    </Text>
                  </Box>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Inn System */}
          <AccordionItem backgroundColor="#ffffff77" borderRadius="md" mb={2}>
            <AccordionButton
              _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Text fontSize="lg">🏠</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    How Inns Work
                  </Text>
                </HStack>
              </Box>
              <AccordionIcon color={currentColors.textColor} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Text fontSize="sm" color={currentColors.textColor}>
                  Inns are special checkpoint nodes where you can trade your collected keys for
                  bonus GP and/or buffs. They're strategically placed throughout the map.
                </Text>

                <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md">
                  <HStack mb={1}>
                    <WarningIcon color="red.400" />
                    <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                      One Purchase Per Inn
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Each team can only make <strong>ONE purchase</strong> from each Inn. Choose your
                    trade wisely, you can't come back for more!
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'yellow.900' : 'yellow.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    Available Trades
                  </Text>
                  <TableContainer>
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th color={currentColors.textColor}>Trade</Th>
                          <Th color={currentColors.textColor}>Key Cost</Th>
                          <Th color={currentColors.textColor}>GP Reward</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td color={currentColors.textColor}>Small</Td>
                          <Td>
                            <Badge>2 any</Badge>
                          </Td>
                          <Td color={currentColors.textColor}>0.8x base</Td>
                        </Tr>
                        <Tr>
                          <Td color={currentColors.textColor}>Medium</Td>
                          <Td>
                            <Badge>4 any</Badge>
                          </Td>
                          <Td color={currentColors.textColor}>1.0x base</Td>
                        </Tr>
                        <Tr>
                          <Td color={currentColors.textColor}>Combo</Td>
                          <Td>
                            <HStack spacing={1}>
                              <Badge colorScheme="red">2</Badge>
                              <Badge colorScheme="blue">2</Badge>
                              <Badge colorScheme="green">2</Badge>
                            </HStack>
                          </Td>
                          <Td color={currentColors.textColor}>1.2x base</Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </TableContainer>
                  <Text fontSize="xs" color={currentColors.textColor} mt={2} fontStyle="italic">
                    💡 Combo trades give 50% more GP than Small trades, but require diverse keys!
                  </Text>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    💡 Strategic Tips
                  </Text>
                  <List spacing={1} color="gray.600" fontSize="xs">
                    <ListItem>
                      <ListIcon as={StarIcon} color="blue.400" />
                      Save for combo trades by taking different paths to collect diverse keys
                    </ListItem>
                    <ListItem>
                      <ListIcon as={StarIcon} color="blue.400" />
                      If you can't afford combo, medium is better value than small
                    </ListItem>
                    <ListItem>
                      <ListIcon as={StarIcon} color="blue.400" />
                      Don't hoard keys forever, you can only trade at each Inn once!
                    </ListItem>
                  </List>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Submission Rules */}
          <AccordionItem backgroundColor="#ffffff77" borderRadius="md" mb={2}>
            <AccordionButton
              _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
            >
              <Box flex="1" textAlign="left">
                <HStack>
                  <Text fontSize="lg">📸</Text>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    Submission Guidelines
                  </Text>
                </HStack>
              </Box>
              <AccordionIcon color={currentColors.textColor} />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <Box p={3} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    ✅ Valid Submissions Must Include:
                  </Text>
                  <List spacing={1} color="gray.600" fontSize="xs">
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.400" />
                      Clear screenshot or video proof of completion
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.400" />
                      Visible timestamp (in-game or system time)
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.400" />
                      Your RSN (RuneScape Name) and event password visible in the proof
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="green.400" />
                      Progress must be gained during the event period
                    </ListItem>
                  </List>
                </Box>

                <Box p={3} bg={colorMode === 'dark' ? 'red.900' : 'red.50'} borderRadius="md">
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    ❌ Invalid Submissions:
                  </Text>
                  <List spacing={1} color="gray.600" fontSize="xs">
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="red.400" />
                      Blurry or edited screenshots
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="red.400" />
                      Lacking visible timestamps, RSN, or event password presence
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="red.400" />
                      Progress from before the event started
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="red.400" />
                      Screenshots from other players' accounts
                    </ListItem>
                    <ListItem>
                      <ListIcon as={CheckCircleIcon} color="red.400" />
                      Duplicate submissions for the same objective
                    </ListItem>
                  </List>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor} mb={2}>
                    Review Process
                  </Text>
                  <Text fontSize="xs" color={currentColors.textColor}>
                    Event admins will review your submission. Once approved, rewards are granted
                    automatically and new nodes unlock. Typically reviewed within 24 hours.
                  </Text>
                </Box>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
      <Divider />
      {/* Winning the Event */}
      <Box p={4} bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'} borderRadius="md">
        <HStack mb={3}>
          <Text fontSize="2xl">🏆</Text>
          <Text fontWeight="bold" fontSize="lg" color={currentColors.textColor}>
            How to Win
          </Text>
        </HStack>
        <VStack spacing={2} align="stretch">
          <Text fontSize="sm" color={currentColors.textColor}>
            The team with the <strong>highest GP pot</strong> when the event ends wins! The prize
            pool is distributed based on final rankings.
          </Text>
          {event?.eventConfig && (
            <Box
              p={2}
              bg={colorMode === 'dark' ? 'whiteAlpha.200' : 'blackAlpha.100'}
              borderRadius="md"
            >
              <Text fontSize="xs" fontWeight="bold" color={currentColors.textColor}>
                This Event's Prize Pool: {formatGP(event.eventConfig.prize_pool_total)}
              </Text>
              {event?.derivedValues?.max_reward_per_team && (
                <Text fontSize="xs" color={currentColors.textColor}>
                  Maximum per team: {formatGP(event.derivedValues.max_reward_per_team)}
                </Text>
              )}
            </Box>
          )}
          <Text fontSize="xs" color={currentColors.textColor} fontStyle="italic" mt={2}>
            💡 Strategy Tip: Hard nodes give 3x more GP than Easy nodes, but take longer. Balance
            speed with reward size. Use buffs strategically to tackle difficult challenges, and
            diversify your paths to unlock combo Inn trades!
          </Text>
        </VStack>
      </Box>
      <hr />
      <Box>
        <Text fontSize="xl" fontWeight="bold" color={currentColors.white} mb={4}>
          🤖 Discord Bot Commands
        </Text>

        <Box p={4} bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'} borderRadius="md" mb={4}>
          <HStack mb={2}>
            <InfoIcon color="blue.400" />
            <Text fontWeight="bold" color={currentColors.textColor}>
              Using the Discord Bot
            </Text>
          </HStack>
          <Text fontSize="sm" color={currentColors.textColor} mb={2}>
            You can use the bot to interact with Gielinor Rush directly from Discord! All commands
            start with <Badge>!</Badge>
          </Text>
          <Text fontSize="xs" color={currentColors.textColor}>
            💡 Make sure you're in the right channel (check the channel topic for the event ID)
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {/* View Commands */}
          <Box p={4} bg="blackAlpha.300" borderRadius="md">
            <HStack mb={3}>
              <Text fontSize="lg">📊</Text>
              <Text fontWeight="bold" color={currentColors.white}>
                View Commands
              </Text>
            </HStack>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Badge colorScheme="purple" mb={1}>
                  !treasurehunt
                </Badge>
                <Text fontSize="xs" color="orange">
                  Show all available commands and help information
                </Text>
                <Text fontSize="xs" color={currentColors.white} mt={1}>
                  Aliases: <Badge size="sm">!th</Badge>
                </Text>
              </Box>

              <Box>
                <Badge colorScheme="purple" mb={1}>
                  !nodes
                </Badge>
                <Text fontSize="xs" color="orange">
                  View all available nodes your team can work on
                </Text>
                <Text fontSize="xs" color={currentColors.white} mt={1}>
                  Shows objectives, rewards, and node IDs
                </Text>
              </Box>

              <Box>
                <Badge colorScheme="purple" mb={1}>
                  !leaderboard
                </Badge>
                <Text fontSize="xs" color="orange">
                  View the event leaderboard with top teams
                </Text>
                <Text fontSize="xs" color={currentColors.white} mt={1}>
                  Aliases: <Badge size="sm">!lb</Badge>
                </Text>
              </Box>
            </VStack>
          </Box>

          {/* Action Commands */}
          <Box p={4} bg="blackAlpha.300" borderRadius="md">
            <HStack mb={3}>
              <Text fontSize="lg">⚔️</Text>
              <Text fontWeight="bold" color={currentColors.white}>
                Action Commands
              </Text>
            </HStack>
            <VStack align="stretch" spacing={3}>
              <Box>
                <Badge colorScheme="green" mb={1}>
                  !submit
                </Badge>
                <Text fontSize="xs" color={currentColors.white} mb={1}>
                  Submit a node completion for review
                </Text>
                <Box p={2} bg="blackAlpha.300" borderRadius="sm" fontSize="xs">
                  <Text color={currentColors.white} mt={1}>
                    Attach your screenshot with the event password visible:
                    <br />
                    <Badge size="sm" colorScheme="gray" mr={1}>
                      !submit
                    </Badge>
                    <Badge size="sm">node_id</Badge> (attach your screenshot to the message)
                  </Text>
                </Box>
              </Box>
            </VStack>
          </Box>
        </SimpleGrid>

        {/* Example Workflow */}
        <Box mt={4} p={4} bg={colorMode === 'dark' ? 'green.900' : 'green.50'} borderRadius="md">
          <HStack mb={3}>
            <Text fontSize="lg">📖</Text>
            <Text fontWeight="bold" color={currentColors.textColor}>
              Example Workflow
            </Text>
          </HStack>
          <VStack align="stretch" spacing={2}>
            <HStack>
              <Badge colorScheme="green">1</Badge>
              <Text fontSize="sm" color={currentColors.textColor}>
                <Badge colorScheme="gray" mr={1}>
                  !nodes
                </Badge>{' '}
                - View available nodes
              </Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">2</Badge>
              <Text fontSize="sm" color={currentColors.textColor}>
                Complete the objective in OSRS (i.e., kill 100 Abyssal Demons)
              </Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">3</Badge>
              <Text fontSize="sm" color={currentColors.textColor}>
                <Badge colorScheme="gray" mr={1}>
                  !submit evt_abc_node_042
                </Badge>{' '}
                + attach screenshot
              </Text>
            </HStack>
            <HStack>
              <Badge colorScheme="green">4</Badge>
              <Text fontSize="sm" color={currentColors.textColor}>
                Wait for admin approval, then continue to newly unlocked nodes!
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Pro Tips */}
        <Box mt={4} p={4} bg="purple.50" borderRadius="md">
          <HStack mb={2}>
            <StarIcon color="purple.400" />
            <Text fontWeight="bold" color={currentColors.textColor}>
              Discord Bot Pro Tips
            </Text>
          </HStack>
          <List color="gray.600" spacing={2} fontSize="sm">
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="purple.400" />
              Use <Badge size="sm">!nodes</Badge> to find node IDs as an alternative to looking at
              the map
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="purple.400" />
              When submitting, include your RSN, event password and timestamps in your screenshots
            </ListItem>
            <ListItem>
              <ListIcon as={CheckCircleIcon} color="purple.400" />
              Upload images directly to Discord instead of using external URLs when submitting proof
            </ListItem>
          </List>
        </Box>
      </Box>
      <hr />
      {/* FAQ */}
      <Box>
        <Text fontSize="xl" fontWeight="bold" color={currentColors.white} mb={4}>
          ❓ Frequently Asked Questions
        </Text>
        <VStack spacing={2} align="stretch">
          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              Can I work on multiple nodes at once?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              Yes! You can work on any available node simultaneously, but check with your team on
              which tiles you actually should be working on...strategizing and communication is part
              of the fun! Then submit completions in any order.
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              What happens if I complete Easy at a location, can I also do Hard?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              No! Once you complete any difficulty at a location, the other difficulties become
              locked. Choose wisely based on your team's capabilities and time.
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              Can I trade at an Inn multiple times?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              No, each team can only make ONE purchase per Inn. Make sure you have enough keys for
              the trade you want before purchasing!
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              What if I make a mistake in my submission?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              Admins may ask for clarification. You can resubmit with better proof if needed. Honest
              mistakes are fine!
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              Do I need to complete every node?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              No, and actually, you can't! Focus on maximizing your GP pot, not completing every
              single node.
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              Can team members split up objectives?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              Yes! Teams can divide and conquer. Multiple members can contribute/submit to the same
              objective.
            </Text>
          </Box>

          <Box p={3} bg="blackAlpha.50" borderRadius="md">
            <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={1}>
              What happens if the event ends before I submit proof?
            </Text>
            <Text fontSize="xs" color={currentColors.white}>
              Only completed and approved nodes count. Make sure to submit with enough time for
              admin review before the event deadline!
            </Text>
          </Box>
        </VStack>
      </Box>{' '}
      <hr />
      {/* Help Section */}
      <Box p={4} bg="blackAlpha.200" borderRadius="md" textAlign="center">
        <Text fontSize="sm" fontWeight="bold" color={currentColors.white} mb={2}>
          Need More Help?
        </Text>
        <Text fontSize="xs" color={currentColors.white}>
          Contact event admins through Discord or check with your team captain for any
          event-specific rules or clarifications.
        </Text>
      </Box>
      <TreasureBuffInfoModal isOpen={isBuffModalOpen} onClose={onBuffModalClose} />
    </VStack>
  );
};

export default GameRulesTab;
