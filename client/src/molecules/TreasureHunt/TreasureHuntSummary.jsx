// src/components/molecules/TreasureHuntSummary.jsx
import {
  VStack,
  HStack,
  Text,
  Box,
  Image,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Divider,
} from '@chakra-ui/react';
import GemTitle from '../../atoms/GemTitle';
import Section from '../../atoms/Section';
import ExampleTreasure from '../../assets/exampleGR.png';
import Map from '../../assets/osrsmap.png';
import Objective from '../../assets/adventurepath-small.webp';
import Laidee from '../../assets/laidee.png';
import HouseTab from '../../assets/housetab.png';
import { FaDiscord } from 'react-icons/fa';
import { GiTreasureMap, GiSwordsPower, GiCastle, GiRun } from 'react-icons/gi';

const TreasureHuntSummary = () => {
  const c = {
    textColor: '#F7FAFC',
    cardBg: '#2D3748',
    subtext: 'gray.400',
    mutedBg: 'whiteAlpha.100',
  };

  const steps = [
    {
      icon: GiTreasureMap,
      title: 'Admin generates a map',
      desc: 'Procedurally generated paths with branching routes, hidden inns, and randomised objectives across Gielinor.',
    },
    {
      icon: GiRun,
      title: 'Teams race to complete nodes',
      desc: 'Each team starts at the same node and unlocks new paths by completing PvM kills, skilling objectives, and more.',
    },
    {
      icon: GiSwordsPower,
      title: 'Submit proof via Discord',
      desc: "Attach your screenshot and use !submit in your team's channel. Admins review and approve directly from the web dashboard.",
    },
    {
      icon: GiCastle,
      title: 'Visit Inns, spend keys, win GP',
      desc: 'Earn keys from completed nodes, trade them at Inn checkpoints for GP rewards and strategic buffs.',
    },
  ];

  const features = [
    {
      img: Map,
      alt: 'Dynamic maps',
      title: 'Procedural Maps',
      desc: 'No two events are the same. Every map is generated fresh with branching paths and unique node layouts.',
    },
    {
      img: Objective,
      alt: 'Varied objectives',
      title: 'PvM & Skilling',
      desc: 'Boss kills, XP targets, collection log slots--objectives scale to your event difficulty and duration.',
    },
    {
      img: Laidee,
      alt: 'Buff system',
      title: 'Buff System',
      desc: 'Earn and spend buffs strategically to reduce objective requirements. Save them for the hard nodes.',
    },
    {
      img: HouseTab,
      alt: 'Inn checkpoints',
      title: 'Inn Checkpoints',
      desc: 'Rest stops along the route where teams can exchange keys for GP payouts and bonus buffs.',
    },
  ];

  return (
    <VStack spacing={10} maxW="1200px" w="100%" mx="auto">
      {/* Hero */}
      <Section bg="rgba(99, 122, 74, 0.55)">
        <VStack spacing={6} textAlign="center" py={8}>
          <GemTitle size="lg" gemColor="blue">
            Gielinor Rush
          </GemTitle>
          <Text fontSize="xl" fontWeight="semibold" color={c.textColor} maxW="650px">
            Competitive team events for OSRS clans. Generate a map, form your squads, and race to
            complete objectives across Gielinor for a GP prize pool.
          </Text>
          <Text fontSize="md" color={c.textColor} maxW="600px">
            Every event is unique! Procedurally generated maps with branching paths, randomised
            objectives, strategic buffs, and Discord-native submissions. Run it your way.
          </Text>
          <Box
            w="100%"
            maxW="500px"
            borderRadius="10px"
            overflow="hidden"
            boxShadow="0 20px 60px rgba(0,0,0,0.5)"
            borderWidth="1px"
            borderColor="whiteAlpha.200"
          >
            <HStack px={3} py={2} bg="gray.800" spacing={2} flexShrink={0}>
              <Box w="10px" h="10px" borderRadius="full" bg="red.400" />
              <Box w="10px" h="10px" borderRadius="full" bg="yellow.400" />
              <Box w="10px" h="10px" borderRadius="full" bg="green.400" />
              <Box flex={1} bg="gray.700" borderRadius="4px" h="18px" mx={2} />
            </HStack>
            <Box
              maxH="400px"
              overflowY="auto"
              css={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                },
              }}
            >
              <Image
                src={ExampleTreasure}
                alt="Example Gielinor Rush game board"
                w="100%"
                display="block"
                loading="lazy"
              />
            </Box>
          </Box>
        </VStack>
      </Section>

      {/* How it works */}
      <VStack spacing={4} w="100%" align="start">
        <GemTitle size="sm" gemColor="yellow" color={c.textColor}>
          How It Works
        </GemTitle>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
          {steps.map((step, i) => (
            <Card key={i} bg={c.cardBg} borderWidth={1}>
              <CardBody>
                <HStack align="start" spacing={4}>
                  <Box
                    bg="purple.600"
                    color="white"
                    borderRadius="full"
                    w="32px"
                    h="32px"
                    flexShrink={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="semibold"
                    fontSize="sm"
                  >
                    {i + 1}
                  </Box>
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Icon as={step.icon} color="yellow.400" boxSize={4} />
                      <Text fontWeight="semibold" fontSize="sm" color={c.textColor}>
                        {step.title}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" color={c.subtext}>
                      {step.desc}
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>

      <Divider />

      {/* Feature grid */}
      <VStack spacing={4} w="100%" align="start">
        <GemTitle size="sm" gemColor="purple" color={c.textColor}>
          Features
        </GemTitle>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="100%">
          {features.map((f, i) => (
            <Card key={i} bg={c.cardBg} borderWidth={1}>
              <CardBody py={4}>
                <VStack spacing={2}>
                  <Image h="40px" src={f.img} alt={f.alt} />
                  <Text fontWeight="semibold" fontSize="xs" color={c.textColor} textAlign="center">
                    {f.title}
                  </Text>
                  <Text fontSize="xs" color={c.subtext} textAlign="center">
                    {f.desc}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>

      <Divider />

      {/* Discord callout */}
      <Card bg={c.mutedBg} borderWidth={1} w="100%">
        <CardBody>
          <HStack spacing={4} align="start">
            <Icon as={FaDiscord} boxSize={8} color="#5865F2" flexShrink={0} mt={1} />
            <VStack align="start" spacing={1}>
              <Text fontWeight="semibold" color={c.textColor}>
                Built around Discord
              </Text>
              <Text fontSize="sm" color={c.subtext}>
                Teams submit proof with{' '}
                <Text as="code" fontSize="xs" bg={c.mutedBg} px={1} borderRadius="sm">
                  !submit &lt;node_id&gt;
                </Text>{' '}
                and attach a screenshot directly in Discord. Admins review and approve from the web
                dashboard, and results are posted back to the channel automatically. No external
                tools needed.
              </Text>
            </VStack>
          </HStack>
        </CardBody>
      </Card>

      {/* Prize pool note */}
      <Box textAlign="center" py={2}>
        <Text fontSize="sm" color={c.subtext} maxW="500px" mx="auto">
          Prize pools up to 2B GP. Configure team sizes, event duration, difficulty, and content
          selections. Sharpen your dragon dagger! Adventure awaits.
        </Text>
      </Box>
    </VStack>
  );
};

export default TreasureHuntSummary;
