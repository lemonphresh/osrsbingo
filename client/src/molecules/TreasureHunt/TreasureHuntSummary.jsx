// src/components/molecules/TreasureHuntSummary.jsx
import {
  VStack,
  Text,
  Badge,
  Box,
  Image,
  SimpleGrid,
  Card,
  CardBody,
  useColorMode,
} from '@chakra-ui/react';
import GemTitle from '../../atoms/GemTitle';
import Section from '../../atoms/Section';
import ExampleTreasure from '../../assets/exampletreasure.png';
import Map from '../../assets/osrsmap.png';
import Objective from '../../assets/adventurepath-small.webp';
import Laidee from '../../assets/laidee.png';
import HouseTab from '../../assets/housetab.png';
import theme from '../../theme';

const TreasureHuntSummary = () => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      subtext: 'gray.400',
    },
    light: {
      textColor: '#171923',
      cardBg: 'white',
      subtext: 'gray.600',
    },
  };

  const currentColors = colors[colorMode];

  return (
    <VStack spacing={8} maxW="1200px" w="100%" mx="auto">
      {/* Hero */}
      <Section bg="rgba(255, 248, 174, 0.55)">
        <VStack spacing={4} textAlign="center" py={8}>
          <VStack spacing={3} justify="center">
            <GemTitle size="lg" gemColor="blue">
              Gielinor Rush
            </GemTitle>
            <Badge colorScheme="orange" fontSize="md" px={3} py={1}>
              Coming Soon
            </Badge>
          </VStack>
          <Text fontSize="lg" color="white" maxW="600px">
            Competitive clan treasure hunts are almost here. Race your clanmates through OSRS
            challenges to claim the prize.
          </Text>
          <Image
            m="0 auto"
            alt="Example Gielinor Rush game board showing a map with various challenge nodes"
            backgroundColor={theme.colors.gray[900]}
            borderRadius="8px"
            maxHeight="500px"
            maxWidth="500px"
            padding="8px"
            src={ExampleTreasure}
            loading="lazy"
          />
        </VStack>
      </Section>

      {/* Quick feature overview */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Card bg={currentColors.cardBg} borderWidth={1}>
          <CardBody py={4}>
            <VStack spacing={2}>
              <Image h="40px" src={Map} alt="Dynamic maps" />
              <Text
                fontWeight="bold"
                fontSize="xs"
                color={currentColors.textColor}
                textAlign="center"
              >
                Dynamic Maps
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={currentColors.cardBg} borderWidth={1}>
          <CardBody py={4}>
            <VStack spacing={2}>
              <Image h="40px" src={Objective} alt="Varied objectives" />
              <Text
                fontWeight="bold"
                fontSize="xs"
                color={currentColors.textColor}
                textAlign="center"
              >
                PvM & Skilling
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={currentColors.cardBg} borderWidth={1}>
          <CardBody py={4}>
            <VStack spacing={2}>
              <Image h="40px" src={Laidee} alt="Buff system" />
              <Text
                fontWeight="bold"
                fontSize="xs"
                color={currentColors.textColor}
                textAlign="center"
              >
                Strategic Buffs
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card bg={currentColors.cardBg} borderWidth={1}>
          <CardBody py={4}>
            <VStack spacing={2}>
              <Image h="40px" src={HouseTab} alt="Inn checkpoints" />
              <Text
                fontWeight="bold"
                fontSize="xs"
                color={currentColors.textColor}
                textAlign="center"
              >
                Inn Checkpoints
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Teaser text */}
      <Box textAlign="center" py={4}>
        <Text fontSize="sm" color={currentColors.white} maxW="500px" mx="auto">
          Generate unique maps, form teams, compete for GP prize pools, and use Discord for
          submissions. Sharpen your dragon dagger...adventure awaits!
        </Text>
      </Box>
    </VStack>
  );
};

export default TreasureHuntSummary;
