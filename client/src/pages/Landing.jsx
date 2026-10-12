import React, { useEffect } from 'react';
import { Flex, Image, Text, HStack, Box, SimpleGrid } from '@chakra-ui/react';
import GemTitle from '../atoms/GemTitle';
import HubButton from '../atoms/HubButton';
import Chip from '../atoms/Chip';
import OsrsWikiLogo from '../assets/osrswikilogo.png';
import ExampleGR from '../assets/exampleGR.png';
import ExampleBoard from '../assets/ExampleBoard.png';
import GroupGoalsPreview from '../assets/groupdashboard.webp';
import OsrsMap from '../assets/osrsmap12112025cropped.webp';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import BlindDraft from '../assets/blinddraft.png';
import IronmanIcon from '../assets/ironman.png';
import ClanIcon from '../assets/clanicon.png';
import Gold from '../assets/gold-small.webp';
import Lemon from '../assets/selfie.webp';
import ExampleCf from '../assets/cfoutfittingpreview.webp';
import BsPreview from '../assets/bs.webp';
import TeamBalancerPreview from '../assets/teambalancer.webp';
import usePageTitle from '../hooks/usePageTitle';
import {
  isGielinorRushEnabled,
  isBlindDraftEnabled,
  isChampionForgeEnabled,
  isGroupDashboardEnabled,
  isBattleshipEnabled,
} from '../config/featureFlags';

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
      <Box position="relative" overflow="hidden" minHeight={['auto', '360px', '420px']}>
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
          minHeight={['250px', '360px', '420px']}
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
            Bingo boards, treasure hunt events, blind drafts, and full clan tournaments. All free,
            all built for Old School RuneScape.
          </Text>

          <HStack justifyContent="center" spacing={4} flexWrap="wrap">
            <HubButton as={NavLink} to="/signup" size="lg" px={9}>
              Sign Up Free
            </HubButton>
            <HubButton as={NavLink} to="/login" variant="secondary" size="lg" px={8}>
              Log In
            </HubButton>
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
        {/* Main Features — Row 1: core event tools */}
        <Flex flexDirection={['column', 'column', 'row']} gap="24px" marginBottom="24px">
          {/* Bingo Boards */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="12px"
            padding={['16px', '20px']}
            borderWidth="2px"
            borderColor={theme.colors.purple[400]}
          >
            <Text
              fontSize="xl"
              fontWeight="semibold"
              color={theme.colors.purple[300]}
              marginBottom="16px"
              fontFamily="Raleway"
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
            <HubButton
              as={Link}
              to="/boards"
              width="100%"
              marginTop="auto"
              accentColor={theme.colors.purple[500]}
            >
              Browse Public Boards
            </HubButton>
          </Box>

          {/* Group Dashboard */}
          {isGroupDashboardEnabled(user) && (
            <Box
              flex="1"
              display="flex"
              flexDirection="column"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="12px"
              padding={['16px', '20px']}
              borderWidth="2px"
              borderColor={theme.colors.orange[500]}
            >
              <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
                <Text
                  fontFamily="Raleway"
                  fontSize="xl"
                  fontWeight="semibold"
                  color={theme.colors.orange[300]}
                >
                  Group Goals Dashboard
                </Text>
                <Chip variant="accent">NEW</Chip>
              </HStack>
              <Flex justifyContent="center" marginBottom="20px">
                <Image
                  alt="Group Goals Dashboard showing team progress"
                  backgroundColor={theme.colors.gray[900]}
                  borderRadius="8px"
                  maxHeight="180px"
                  padding="8px"
                  src={GroupGoalsPreview}
                  loading="lazy"
                />
              </Flex>
              <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
                With the power of Wise Old Man, set specific group goals and track progress on a
                clear dashboard across any OSRS activity for any duration. Great for clans, GIMs, or
                any group of friends working towards shared milestones.
              </Text>
              <HubButton
                as={Link}
                to="/group"
                width="100%"
                marginTop="auto"
                accentColor={theme.colors.orange[600]}
              >
                Track Your Group
              </HubButton>
            </Box>
          )}

          {/* Champion Forge */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="12px"
            padding={['16px', '20px']}
            borderWidth="2px"
            borderColor={theme.colors.blue[500]}
          >
            <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
              <Text
                fontFamily="Raleway"
                fontSize="xl"
                fontWeight="semibold"
                color={theme.colors.blue[300]}
              >
                Champion Forge
              </Text>
              <Chip variant={isChampionForgeEnabled(user) ? 'accent' : 'warn'}>
                {isChampionForgeEnabled(user) ? 'NEW' : 'SOON'}
              </Chip>
            </HStack>
            <Flex
              justifyContent="center"
              alignItems="center"
              marginBottom="20px"
              borderRadius="8px"
              height="180px"
              gap={[4, 6]}
            >
              <Image
                alt="Champion Forge outfitting screen"
                backgroundColor={theme.colors.gray[900]}
                borderRadius="8px"
                maxHeight="180px"
                padding="8px"
                src={ExampleCf}
                loading="lazy"
              />
            </Flex>
            <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
              Run full clan tournaments across four phases: gathering, outfitting, and live
              turn-based battles. Earn gear through OSRS tasks, build your champion, and fight for
              glory in a bracket.
            </Text>
            <HubButton
              as={Link}
              to="/champion-forge"
              width="100%"
              marginTop="auto"
              variant={isChampionForgeEnabled(user) ? 'primary' : 'secondary'}
              accentColor={theme.colors.blue[500]}
            >
              {isChampionForgeEnabled(user) ? 'Start Forging' : 'Learn More'}
            </HubButton>
          </Box>
        </Flex>

        {/* Battleship */}
        <Flex
          flexDirection={['column', 'column', 'row']}
          gap="24px"
          marginBottom="48px"
          justifyContent="center"
          order={isBattleshipEnabled(user) ? -1 : 0}
        >
          <Box
            flex="1"
            maxW="800px"
            display="flex"
            flexDirection="column"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="12px"
            padding={['16px', '20px']}
            borderWidth="2px"
            borderColor="#1e4976"
          >
            <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
              <Text fontFamily="Raleway" fontSize="xl" fontWeight="semibold" color="#76e4f7">
                Battleship
              </Text>
              <Chip variant={isBattleshipEnabled(user) ? 'accent' : 'warn'}>
                {isBattleshipEnabled(user) ? 'NEW' : 'SOON'}
              </Chip>
            </HStack>
            <Box
              marginBottom="20px"
              borderRadius="8px"
              overflow="hidden"
              border="1px solid #1e4976"
              height="180px"
              position="relative"
              sx={{
                backgroundColor: '#060f0a',
                backgroundImage: [
                  'linear-gradient(#0d2a3a 1px, transparent 1px)',
                  'linear-gradient(90deg, #0d2a3a 1px, transparent 1px)',
                ].join(', '),
                backgroundSize: '22px 22px',
              }}
            >
              <Image
                src={BsPreview}
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                maxHeight="160px"
                maxWidth="90%"
                objectFit="contain"
              />
            </Box>
            <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
              Big two-team OSRS competition built around the classic game of Battleship. Place your
              fleet, fire shots at the enemy board, and complete OSRS tasks to score hits. First
              team to sink all ships wins.
            </Text>
            <HubButton
              as={Link}
              to="/battleship"
              width="100%"
              marginTop="auto"
              variant={isBattleshipEnabled(user) ? 'primary' : 'secondary'}
              accentColor="#0e7490"
            >
              {isBattleshipEnabled(user) ? 'Set Sail' : 'Learn More'}
            </HubButton>
          </Box>
        </Flex>

        {/* Main Features — Row 2: drafting tools */}
        <Flex flexDirection={['column', 'column', 'row']} gap="24px" marginBottom="48px">
          {/* Blind Draft */}
          {isBlindDraftEnabled(user) && (
            <Box
              flex="1"
              display="flex"
              flexDirection="column"
              backgroundColor={theme.colors.teal[900]}
              borderRadius="12px"
              padding={['16px', '20px']}
              borderWidth="2px"
              borderColor={theme.colors.pink[600]}
            >
              <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
                <Text
                  fontFamily="Raleway"
                  fontSize="xl"
                  fontWeight="semibold"
                  color={theme.colors.pink[300]}
                >
                  Blind Draft
                </Text>
              </HStack>
              <Flex justifyContent="center" marginBottom="20px">
                <Image
                  alt="Blind draft room showing anonymized player cards"
                  backgroundColor={theme.colors.gray[900]}
                  borderRadius="8px"
                  maxHeight="180px"
                  padding="8px"
                  src={BlindDraft}
                  loading="lazy"
                />
              </Flex>
              <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
                Host fair team drafts where captains pick players by stats alone, no names visible
                until it's over. Supports snake, linear, and auction formats with a real-time timer.
              </Text>
              <HubButton
                as={Link}
                to="/blind-draft"
                width="100%"
                marginTop="auto"
                accentColor={theme.colors.pink[600]}
              >
                Draft Teams
              </HubButton>
            </Box>
          )}

          {/* Team Balancer */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="12px"
            padding={['16px', '20px']}
            borderWidth="2px"
            borderColor={theme.colors.green[500]}
          >
            <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
              <Text
                fontFamily="Raleway"
                fontSize="xl"
                fontWeight="semibold"
                color={theme.colors.green[300]}
              >
                Team Balancer
              </Text>
              <Chip variant="accent">NEW</Chip>
            </HStack>
            <Flex justifyContent="center" marginBottom="20px">
              <Image
                alt="Team Balancer showing balanced teams by WOM stats"
                backgroundColor={theme.colors.gray[900]}
                borderRadius="8px"
                maxHeight="180px"
                padding="8px"
                src={TeamBalancerPreview}
                loading="lazy"
              />
            </Flex>
            <Text fontSize="sm" marginBottom="20px" lineHeight="1.7" color="gray.300">
              Paste a list of RSNs and auto-balance them into fair teams using Wise Old Man stats.
              Choose a preset (All-Rounder, PvM, Skilling, or Raid) and get teams sorted by EHB/Y,
              EHP/Y, raid KCs, and more. No account needed.
            </Text>
            <HubButton
              as={Link}
              to="/team-balancer"
              width="100%"
              marginTop="auto"
              accentColor={theme.colors.green[600]}
            >
              Balance Teams
            </HubButton>
          </Box>

          {/* Gielinor Rush */}
          <Box
            flex="1"
            display="flex"
            flexDirection="column"
            backgroundColor={theme.colors.teal[900]}
            borderRadius="12px"
            padding={['16px', '20px']}
            borderWidth="2px"
            borderColor={theme.colors.yellow[400]}
          >
            <HStack marginBottom="16px" justifyContent="space-between" alignItems="center">
              <Text
                fontSize="xl"
                fontFamily="Raleway"
                fontWeight="semibold"
                color={theme.colors.yellow[300]}
              >
                Gielinor Rush
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
            <HubButton
              as={Link}
              to="/gielinor-rush"
              width="100%"
              marginTop="auto"
              accentColor={theme.colors.yellow[500]}
            >
              {isGielinorRushEnabled(user) ? 'Feel the Rush' : 'Learn More'}
            </HubButton>
          </Box>
        </Flex>

        {/* Popular Uses */}
        <Box marginBottom="48px">
          <Text
            fontSize="lg"
            fontWeight="semibold"
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
                color: theme.colors.green,
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
                <Flex justifyContent="start" alignItems="center" marginBottom="8px">
                  <Flex
                    p={2}
                    borderRadius="24px"
                    alignItems="center"
                    justifyContent="center"
                    backgroundColor={color[300]}
                    marginRight="8px"
                  >
                    <Image src={icon} alt={alt} height="20px" width="20px" />
                  </Flex>
                  <Text fontFamily="Raleway" fontWeight="semibold" color={color[300]}>
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
          <Text
            fontSize="md"
            fontWeight="semibold"
            marginBottom="12px"
            color={theme.colors.pink[300]}
            fontFamily="Raleway"
          >
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
