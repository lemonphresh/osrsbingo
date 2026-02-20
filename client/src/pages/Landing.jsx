import React, { useEffect } from 'react';
import { Button, Flex, Image, Text, HStack, Box, SimpleGrid } from '@chakra-ui/react';
import GemTitle from '../atoms/GemTitle';
import OsrsWikiLogo from '../assets/osrswikilogo.png';
import ExampleGR from '../assets/exampleGR.png';
import ExampleBoard from '../assets/ExampleBoard.png';
import OsrsMap from '../assets/osrsmap12112025cropped.jpg';
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
    if (user) navigate(`/user/${user.id}`);
  }, [navigate, user]);

  return (
    <Flex flex="1" flexDirection="column" height="100%">
      {/* ── Hero with panning map background ── */}
      <Box position="relative" overflow="hidden" minHeight={['auto', '460px', '520px']}>
        {/* Map layer */}
        <Box
          position="absolute"
          inset={0}
          sx={{
            backgroundImage: `url(${OsrsMap})`,
            backgroundSize: '140%',
            backgroundRepeat: 'no-repeat',
            animation: 'mapPan 45s ease-in-out infinite alternate',
            transformOrigin: 'center center',
            '@keyframes mapPan': {
              '0%': { backgroundPosition: '0% 40%' },
              '100%': { backgroundPosition: '100% 60%' },
            },
          }}
        />
        {/* Dark vignette so text is readable */}
        <Box
          position="absolute"
          inset={0}
          background="linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.7) 60%, rgba(13,26,38,1) 100%)"
        />

        {/* Hero content */}
        <Flex
          position="relative"
          zIndex={1}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={['250px', '460px', '520px']}
          paddingX={['16px', '24px', '64px']}
          paddingTop={['36px', '36px', '72px']}
          paddingBottom={['24px', '24px', '48px']}
          textAlign="center"
        >
          <GemTitle gemColor="purple">OSRS Bingo Hub</GemTitle>
          <Text
            fontSize={['md', 'lg']}
            marginX={['0px', '32px', '120px']}
            marginBottom="32px"
            color="gray.200"
            maxWidth="640px"
          >
            Custom bingo boards and team treasure hunt events for Old School RuneScape clans.
          </Text>

          <HStack justifyContent="center" spacing={4} flexWrap="wrap">
            <NavLink to="/signup">
              <Button
                backgroundColor={theme.colors.blue[400]}
                height="52px"
                paddingX="36px"
                fontSize="md"
                fontWeight="bold"
                _hover={{ backgroundColor: theme.colors.blue[300] }}
              >
                Sign Up Free
              </Button>
            </NavLink>
            <NavLink to="/login">
              <Button
                variant="outline"
                borderColor="whiteAlpha.500"
                color="white"
                height="52px"
                paddingX="32px"
                _hover={{ borderColor: 'white', backgroundColor: 'whiteAlpha.100' }}
              >
                Log In
              </Button>
            </NavLink>
          </HStack>
        </Flex>
      </Box>

      {/* ── Rest of page ── */}
      <Flex
        flexDirection="column"
        paddingX={['16px', '24px', '64px']}
        paddingBottom={['32px', '64px']}
        paddingTop="40px"
      >
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
                alt="Example OSRS bingo board"
                backgroundColor={theme.colors.gray[900]}
                borderRadius="8px"
                maxHeight="180px"
                padding="8px"
                src={ExampleBoard}
                loading="lazy"
              />
            </Flex>
            <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
              Create custom bingo boards to track any goals: boss kills, collection log slots, skill
              milestones, or anything else. Share with your clan or browse public boards for ideas.
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
                alt="Gielinor Rush treasure hunt map"
                backgroundColor={theme.colors.gray[900]}
                borderRadius="8px"
                maxHeight="180px"
                padding="8px"
                src={ExampleGR}
                loading="lazy"
              />
            </Flex>
            <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
              Team-based treasure hunt competitions with GP prize pools. Generate maps with PvM,
              skilling, and collection objectives. Discord integration for submissions and
              guaranteed GP payouts.
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
            {[
              {
                icon: IronmanIcon,
                alt: 'Ironman Icon',
                color: theme.colors.blue,
                label: 'Ironman Progress',
                desc: 'Track your collection log, boss uniques, and milestones as you push your account forward.',
              },
              {
                icon: ClanIcon,
                alt: 'Clan Icon',
                color: theme.colors.purple,
                label: 'Clan Competitions',
                desc: 'Weekly bingo events, monthly races, team challenges...whatever keeps your clan engaged and grinding.',
              },
              {
                icon: Gold,
                alt: 'Gold coin',
                color: theme.colors.orange,
                label: 'Prize Pool Events',
                desc: 'Host GP tournaments with Gielinor Rush. Set a budget, generate a map, and let teams battle for the prize pool.',
              },
            ].map(({ icon, alt, color, label, desc }) => (
              <Flex
                key={label}
                padding="20px"
                backgroundColor={theme.colors.teal[900]}
                borderRadius="8px"
                borderLeftWidth="3px"
                borderLeftColor={color[400]}
                flexDirection="column"
              >
                <Flex justifyContent="start" marginBottom="8px">
                  <Image src={icon} alt={alt} boxSize="20px" marginRight="8px" />
                  <Text fontWeight="bold" color={color[300]}>
                    {label}
                  </Text>
                </Flex>
                <Text fontSize="sm" color="gray.400" lineHeight="1.6">
                  {desc}
                </Text>
              </Flex>
            ))}
          </SimpleGrid>
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
              flexShrink={0}
            >
              <Image alt="Blonde girlie with makeup and dimples" opacity="0.9" src={Lemon} />
            </Box>
            <Text fontSize="sm" color="gray.300" marginLeft={['0', '0', '16px']} lineHeight="1.8">
              Hey! I'm a cute lil queer software engineer who built this as a passion project. It
              started when my clan wanted to run events but existing tools were clunky or didn't
              quite fit. So I made something better and figured I'd share it! No premium tiers, just
              tools to make OSRS more fun. Happy scaping, and as always: fuck ICE! 💜
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
    </Flex>
  );
};

export default Landing;
