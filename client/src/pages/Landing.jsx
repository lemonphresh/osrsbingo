import React, { useEffect } from 'react';
import { Button, Flex, Image, Text, VStack, HStack, Icon, Box } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import OsrsWikiLogo from '../assets/osrswikilogo.png';
import ExampleTreasure2 from '../assets/exampletreasure2.png';
import ExampleBoard from '../assets/ExampleBoard.png';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaUsers, FaTrophy, FaMap, FaDiscord } from 'react-icons/fa';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
      <Flex flexDirection={['column', 'column', 'column', 'row']} gridGap="32px">
        <Section flexDirection="column" width="100%">
          <GemTitle gemColor="purple">OSRS Bingo Hub</GemTitle>
          <Text marginX={['0px', '16px', '56px', '16px']}>
            Are you an OSRS gamer and are looking to manage a personal/clan-wide bingo board? Cool,
            I built a tool for you. <br />
            <br />
            Browse public boards for ideas, follow your friends' and clanmates' progress, and create
            your own bingo boards to keep track of your exciting gamer goals!
          </Text>
          <Flex alignItems="center" justifyContent="center" marginTop="16px">
            <Image
              alt="Example Old School RuneScape bingo board, some tiles are complete and some are not."
              backgroundColor={theme.colors.gray[900]}
              borderRadius="8px"
              maxHeight="200px"
              maxWidth="200px"
              padding="8px"
              src={ExampleBoard}
              loading="lazy"
            />
          </Flex>
        </Section>
        <Section flexDirection="column" width="100%">
          <GemTitle>Get Started</GemTitle>
          <Text marginBottom="8px" marginX={['0px', '16px', '56px', '16px']}>
            Log in or sign up to participate in events, access your private collection of boards,
            and more!
          </Text>
          <Flex
            height="100%"
            flexDirection="column"
            gridGap="24px"
            marginX={['0px', '16px', '56px']}
            marginY={['16px', '16px', '56px']}
          >
            <NavLink to="/login">
              <Button
                backgroundColor={theme.colors.pink[400]}
                height={['64px', '56px']}
                width="100%"
              >
                Log In
              </Button>
            </NavLink>
            <NavLink to="/signup">
              <Button
                backgroundColor={theme.colors.blue[300]}
                height={['64px', '56px']}
                width="100%"
              >
                Sign Up
              </Button>
            </NavLink>

            <hr />

            <Flex
              _hover={{
                color: theme.colors.yellow[300],
              }}
              alignItems="center"
              fontSize="18px"
              fontWeight="bold"
              justifyContent="center"
              textAlign="center"
              textDecoration="underline"
            >
              <Link to="/boards">Browse Public Boards</Link>
            </Flex>
          </Flex>
        </Section>
      </Flex>

      {/* Treasure Hunt Section */}
      <Section flexDirection="column" width="100%" marginTop="32px">
        <GemTitle gemColor="orange">Treasure Hunt Mode</GemTitle>
        <Image
          backgroundColor={theme.colors.gray[900]}
          borderRadius="8px"
          maxHeight="300px"
          padding="8px"
          src={ExampleTreasure2}
          margin="0 auto"
        />
        <Text marginX={['0px', '16px', '56px', '16px']} marginY="24px" textAlign="center">
          Looking for something even more competitive? Try our team-based Treasure Hunt events!
        </Text>

        <VStack spacing={4} marginX={['0px', '16px', '56px', '16px']}>
          <HStack
            spacing={4}
            alignItems="flex-start"
            width="100%"
            flexDirection={['column', 'column', 'row']}
          >
            <Box
              flex="1"
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderWidth="2px"
              borderColor={theme.colors.purple[400]}
            >
              <HStack marginBottom="12px">
                <Icon as={FaUsers} color={theme.colors.purple[400]} boxSize={6} />
                <Text fontSize="lg" fontWeight="bold" color={theme.colors.purple[400]}>
                  Team Competition
                </Text>
              </HStack>
              <Text fontSize="sm">
                Form teams and compete against each other! Complete objectives together and watch
                your team climb the leaderboard.
              </Text>
            </Box>

            <Box
              flex="1"
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderWidth="2px"
              borderColor={theme.colors.green[400]}
            >
              <HStack marginBottom="12px">
                <Icon as={FaMap} color={theme.colors.green[400]} boxSize={6} />
                <Text fontSize="lg" fontWeight="bold" color={theme.colors.green[400]}>
                  Dynamic Map
                </Text>
              </HStack>
              <Text fontSize="sm">
                Navigate through an interconnected map of challenges. Unlock new paths as you
                progress and strategize your route to victory!
              </Text>
            </Box>
          </HStack>

          <HStack
            spacing={4}
            alignItems="flex-start"
            width="100%"
            flexDirection={['column', 'column', 'row']}
          >
            <Box
              flex="1"
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderWidth="2px"
              borderColor={theme.colors.yellow[400]}
            >
              <HStack marginBottom="12px">
                <Icon as={FaTrophy} color={theme.colors.yellow[400]} boxSize={6} />
                <Text fontSize="lg" fontWeight="bold" color={theme.colors.yellow[400]}>
                  Earn Rewards
                </Text>
              </HStack>
              <Text fontSize="sm">
                Complete nodes to earn GP, keys, and powerful buffs. Trade keys at Inns for bonus
                rewards and strategic advantages!
              </Text>
            </Box>

            <Box
              flex="1"
              padding="20px"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="8px"
              borderWidth="2px"
              borderColor={theme.colors.blue[400]}
            >
              <HStack marginBottom="12px">
                <Icon as={FaDiscord} color={theme.colors.blue[400]} boxSize={6} />
                <Text fontSize="lg" fontWeight="bold" color={theme.colors.blue[400]}>
                  Discord Integration
                </Text>
              </HStack>
              <Text fontSize="sm">
                Submit completions directly from Discord! Get instant notifications when your
                submissions are reviewed and nodes are completed.
              </Text>
            </Box>
          </HStack>

          <Box
            padding="24px"
            bg="teal.900"
            borderRadius="8px"
            borderWidth="2px"
            borderColor={theme.colors.pink[400]}
            width="100%"
          >
            <VStack spacing={4} align="stretch">
              <Text
                fontSize="lg"
                fontWeight="bold"
                color={theme.colors.pink[400]}
                textAlign="center"
              >
                How It Works
              </Text>

              {/* Admin Section */}
              <Box
                padding="16px"
                bg="teal.700"
                borderRadius="6px"
                borderLeftWidth="4px"
                borderLeftColor={theme.colors.blue[400]}
              >
                <HStack marginBottom="8px">
                  <Text fontSize="md" fontWeight="bold" color={theme.colors.blue[400]}>
                    👑 For Event Organizers:
                  </Text>
                </HStack>
                <VStack align="start" spacing={2} fontSize="sm" color={theme.colors.textColor}>
                  <HStack>
                    <Text>1️⃣</Text>
                    <Text>Create a Treasure Hunt event with custom objectives</Text>
                  </HStack>
                  <HStack>
                    <Text>2️⃣</Text>
                    <Text>Set up teams and invite your clan members</Text>
                  </HStack>
                  <HStack>
                    <Text>3️⃣</Text>
                    <Text>Set up your Discord server to support automatic notifications</Text>
                  </HStack>
                  <HStack>
                    <Text>4️⃣</Text>
                    <Text>Review submissions and watch teams compete in real-time</Text>
                  </HStack>
                </VStack>
              </Box>

              {/* Team/Player Section */}
              <Box
                padding="16px"
                bg="teal.700"
                borderRadius="6px"
                borderLeftWidth="4px"
                borderLeftColor={theme.colors.purple[400]}
              >
                <HStack marginBottom="8px">
                  <Text fontSize="md" fontWeight="bold" color={theme.colors.purple[400]}>
                    ⚔️ For Teams & Players:
                  </Text>
                </HStack>
                <VStack align="start" spacing={2} fontSize="sm" color={theme.colors.textColor}>
                  <HStack>
                    <Text>1️⃣</Text>
                    <Text>Join your team in the event</Text>
                  </HStack>
                  <HStack>
                    <Text>2️⃣</Text>
                    <Text>Complete OSRS objectives and challenges</Text>
                  </HStack>
                  <HStack>
                    <Text>3️⃣</Text>
                    <Text>Submit proof via Discord commands</Text>
                  </HStack>
                  <HStack>
                    <Text>4️⃣</Text>
                    <Text>Earn GP, keys, and buffs as you progress</Text>
                  </HStack>
                  <HStack>
                    <Text>5️⃣</Text>
                    <Text>Compete with other teams to reach the treasure first!</Text>
                  </HStack>
                </VStack>
              </Box>

              <Text fontSize="xs" color="gray.300" textAlign="center" marginTop="8px">
                Perfect for clans, friend groups, and community events. Create your event today and
                bring your clan together!
              </Text>
            </VStack>
          </Box>

          <Flex
            _hover={{
              color: theme.colors.blue[300],
            }}
            color={theme.colors.yellow[300]}
            alignItems="center"
            fontSize="18px"
            fontWeight="bold"
            justifyContent="center"
            textAlign="center"
            textDecoration="underline"
            cursor="pointer"
          >
            <Link to="/treasure-hunt">Read More & Create Your Own →</Link>
          </Flex>
        </VStack>
      </Section>

      <Text marginTop="32px" textAlign="center">
        <span style={{ fontWeight: 'bold' }}>Questions?</span> Go to{' '}
        <NavLink to="/faq">
          <span style={{ color: theme.colors.blue[400], textDecoration: 'underline' }}>
            the FAQ
          </span>
          .
        </NavLink>
      </Text>

      <Flex
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        marginTop="32px"
        width="100%"
      >
        <Text color={theme.colors.gray[400]} marginBottom="24px">
          This project uses assets courtesy of:{' '}
        </Text>
        <Image
          alt="Old School RuneScape Wiki logo"
          maxWidth="450px"
          src={OsrsWikiLogo}
          width={['225px', '325px', '450px']}
          loading="lazy"
        />
      </Flex>
    </Flex>
  );
};

export default Landing;
