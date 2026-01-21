import React, { useEffect } from 'react';
import { Button, Flex, Image, Text, HStack, Box, SimpleGrid } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import OsrsWikiLogo from '../assets/osrswikilogo.png';
import ExampleTreasure2 from '../assets/exampletreasure2.png';
import ExampleBoard from '../assets/ExampleBoard.png';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import IronmanIcon from '../assets/ironman.png';
import ClanIcon from '../assets/clanicon.png';
import Gold from '../assets/gold-small.webp';
import Lemon from '../assets/selfie.webp';
import usePageTitle from '../hooks/usePageTitle';
import { isGielinorRushEnabled } from '../config/featureFlags';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  usePageTitle(null);

  useEffect(() => {
    if (user) {
      navigate(`/user/${user.id}`);
    }
  }, [navigate, user]);

  return (
    <Flex
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingTop="72px"
      paddingBottom={['32px', '64px']}
    >
      {/* Hero */}
      <Section flexDirection="column" width="100%" marginBottom="40px">
        <GemTitle gemColor="purple">OSRS Bingo Hub</GemTitle>
        <Text
          fontSize={['md', 'lg']}
          textAlign="center"
          marginX={['0px', '32px', '100px']}
          marginBottom="28px"
        >
          Track your Old School RuneScape goals with custom bingo boards, or run competitive team
          events with prize pools. Built for clans, friend groups, and community competitions.
        </Text>

        <HStack justifyContent="center" spacing={4} flexWrap="wrap">
          <NavLink to="/login">
            <Button
              backgroundColor={theme.colors.pink[400]}
              height="50px"
              paddingX="32px"
              _hover={{ backgroundColor: theme.colors.pink[500] }}
            >
              Log In
            </Button>
          </NavLink>
          <NavLink to="/signup">
            <Button
              backgroundColor={theme.colors.blue[400]}
              height="50px"
              paddingX="32px"
              _hover={{ backgroundColor: theme.colors.blue[500] }}
            >
              Sign Up
            </Button>
          </NavLink>
        </HStack>
      </Section>

      {/* Two Main Features */}
      <Flex flexDirection={['column', 'column', 'row']} gap="24px" marginBottom="48px">
        {/* Bingo Boards */}
        <Box
          flex="1"
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          padding={['20px', '28px']}
          borderWidth="2px"
          borderColor={theme.colors.purple[400]}
        >
          <Text
            fontSize="xl"
            fontWeight="bold"
            color={theme.colors.purple[300]}
            marginBottom="16px"
          >
            Bingo Boards
          </Text>

          <Flex justifyContent="center" marginBottom="20px">
            <Image
              alt="Example OSRS bingo board with goals like pet drops and skill milestones"
              backgroundColor={theme.colors.gray[900]}
              borderRadius="8px"
              maxHeight="180px"
              padding="8px"
              src={ExampleBoard}
              loading="lazy"
            />
          </Flex>

          <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
            Create custom bingo boards to track any goals you want — boss kills, collection log
            slots, skill milestones, or anything else. Share with your clan or browse public boards
            for ideas.
          </Text>

          <Link to="/boards">
            <Button
              width="100%"
              backgroundColor={theme.colors.purple[500]}
              _hover={{ backgroundColor: theme.colors.purple[600] }}
            >
              Browse Public Boards
            </Button>
          </Link>
        </Box>

        {/* Gielinor Rush */}
        <Box
          flex="1"
          backgroundColor={theme.colors.teal[900]}
          borderRadius="12px"
          padding={['20px', '28px']}
          borderWidth="2px"
          borderColor={theme.colors.orange[400]}
        >
          <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
            <Text fontSize="xl" fontWeight="bold" color={theme.colors.orange[300]}>
              Gielinor Rush
            </Text>
            <Text fontSize="xs" bg={theme.colors.orange[600]} px={2} py={1} borderRadius="full">
              {isGielinorRushEnabled() ? 'NEW' : 'COMING SOON'}
            </Text>
          </HStack>

          <Flex justifyContent="center" marginBottom="20px">
            <Image
              alt="Gielinor Rush treasure hunt map showing OSRS locations with objectives"
              backgroundColor={theme.colors.gray[900]}
              borderRadius="8px"
              maxHeight="180px"
              padding="8px"
              src={ExampleTreasure2}
              loading="lazy"
            />
          </Flex>

          <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
            Team-based treasure hunt competitions with GP prize pools. Generate maps with PvM,
            skilling, and collection objectives. Discord integration for submissions,
            budget-guaranteed payouts.
          </Text>

          <Link to="/gielinor-rush">
            <Button
              width="100%"
              backgroundColor={theme.colors.orange[500]}
              _hover={{ backgroundColor: theme.colors.orange[600] }}
            >
              {isGielinorRushEnabled() ? 'Get Started' : 'Learn More'}
            </Button>
          </Link>
        </Box>
      </Flex>

      {/* Popular Uses */}
      <Box marginBottom="48px">
        <Text
          fontSize="lg"
          fontWeight="bold"
          textAlign="center"
          marginBottom="24px"
          color={theme.colors.yellow[300]}
        >
          Popular Uses
        </Text>

        <SimpleGrid columns={[1, 3]} spacing={4}>
          <Flex
            padding="20px"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="8px"
            borderLeftWidth="3px"
            borderLeftColor={theme.colors.blue[400]}
            flexDirection="column"
          >
            <Flex justifyContent="start">
              <Image src={IronmanIcon} alt="Ironman Icon" boxSize="20px" marginRight="8px" />
              <Text fontWeight="bold" marginBottom="8px" color={theme.colors.blue[300]}>
                Ironman Progress
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.400" lineHeight="1.6">
              Track your collection log, boss uniques, and milestones as you progress through your
              account.
            </Text>
          </Flex>

          <Flex
            padding="20px"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="8px"
            borderLeftWidth="3px"
            borderLeftColor={theme.colors.purple[400]}
            flexDirection="column"
          >
            <Flex justifyContent="start">
              <Image src={ClanIcon} alt="Clan Icon" boxSize="20px" marginRight="8px" />

              <Text fontWeight="bold" marginBottom="8px" color={theme.colors.purple[300]}>
                Clan Competitions
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.400" lineHeight="1.6">
              Run bingo events or team competitions for your clan. Weekly challenges, monthly races,
              whatever works for your group.
            </Text>
          </Flex>

          <Flex
            padding="20px"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="8px"
            borderLeftWidth="3px"
            borderLeftColor={theme.colors.orange[400]}
            flexDirection="column"
          >
            <Flex justifyContent="start">
              <Image src={Gold} alt="Gold" boxSize="20px" marginRight="8px" />
              <Text fontWeight="bold" marginBottom="8px" color={theme.colors.orange[300]}>
                Prize Pool Events
              </Text>
            </Flex>
            <Text fontSize="sm" color="gray.400" lineHeight="1.6">
              Host GP tournaments with Gielinor Rush. Set your budget, generate a map, and let teams
              compete for rewards.
            </Text>
          </Flex>
        </SimpleGrid>
      </Box>

      {/* Activity Types */}
      <Box
        marginBottom="48px"
        padding={['20px', '28px']}
        backgroundColor={theme.colors.teal[900]}
        borderRadius="12px"
      >
        <Text
          fontSize="lg"
          fontWeight="bold"
          textAlign="center"
          marginBottom="20px"
          color={theme.colors.green[300]}
        >
          Supports All Kinds of OSRS Goals
        </Text>

        <Flex flexWrap="wrap" justifyContent="center" gap={3}>
          {[
            'PvM & Bossing',
            'Skilling',
            'Clue Scrolls',
            'Minigames',
            'Collection Goals',
            'Team Challenges',
          ].map((activity) => (
            <Box
              key={activity}
              px={4}
              py={2}
              backgroundColor={theme.colors.teal[700]}
              borderRadius="full"
              fontSize="sm"
              color="gray.300"
            >
              {activity}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* About */}
      <Box
        marginBottom="48px"
        padding={['20px', '28px']}
        backgroundColor={theme.colors.teal[800]}
        borderRadius="12px"
        borderWidth="1px"
        borderColor={theme.colors.teal[600]}
      >
        <Text fontSize="md" fontWeight="bold" marginBottom="12px" color={theme.colors.pink[300]}>
          About This Project
        </Text>

        <Flex alignItems="center" flexDirection={['column', 'column', 'row']}>
          <Box
            overflow="hidden"
            borderRadius="50px"
            maxH={24}
            maxW={24}
            h="100%"
            w="100%"
            marginBottom={['16px', '16px', '0']}
          >
            <Image alt="Blonde girlie with makeup and dimples" opacity="0.9" src={Lemon} />
          </Box>{' '}
          <Text fontSize="sm" color="gray.300" marginLeft={['0', '0', '16px']} lineHeight="1.8">
            Hey! I'm a cute lil queer software engineer who built this as a passion project. It
            started when my clan wanted to run events but the existing tools were clunky or didn't
            quite fit what we needed. So I made something better! I figured I'd share it with anyone
            else who could use it. No premium tiers, just tools to make OSRS more fun for everyone.
            Enjoy, happy scaping, and as always: fuck ICE! 💜
          </Text>
        </Flex>
      </Box>

      {/* FAQ */}
      <Text marginBottom="40px" textAlign="center" color="gray.400">
        Questions? Check the{' '}
        <NavLink to="/faq">
          <span style={{ color: theme.colors.blue[400], textDecoration: 'underline' }}>FAQ</span>
        </NavLink>
      </Text>

      {/* Credits */}
      <Flex
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        width="100%"
        opacity={0.6}
      >
        <Text color={theme.colors.gray[500]} marginBottom="12px" fontSize="xs">
          Assets courtesy of the OSRS Wiki
        </Text>
        <Image
          alt="Old School RuneScape Wiki logo"
          maxWidth="200px"
          src={OsrsWikiLogo}
          width={['140px', '180px', '200px']}
          loading="lazy"
        />
      </Flex>
    </Flex>
  );
};

export default Landing;
