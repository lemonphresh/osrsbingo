import {
  Flex,
  Icon,
  Image,
  Text,
  Box,
  IconButton,
  Collapse,
  VStack,
  HStack,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import theme from '../theme';
import GemLogo from '../assets/gemlogo-small.png';
import GnomeChild from '../assets/gnomechild-small.webp';
import Lemon from '../assets/selfie.webp';
import { useAuth } from '../providers/AuthProvider';
import { css } from '@emotion/react';
import { MdContactSupport, MdClose } from 'react-icons/md';

const BANNER_STORAGE_KEY = 'navbarBannerDismissed';
const BANNER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const NavBar = () => {
  const { user } = useAuth();
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    // Check if banner was dismissed and if 24 hours have passed
    const dismissedTime = localStorage.getItem(BANNER_STORAGE_KEY);

    if (dismissedTime) {
      const timePassed = Date.now() - parseInt(dismissedTime, 10);
      if (timePassed < BANNER_DURATION_MS) {
        // Still within 24 hours, keep banner closed
        setIsBannerOpen(false);
      } else {
        // 24 hours have passed, remove the storage item and show banner
        localStorage.removeItem(BANNER_STORAGE_KEY);
        setIsBannerOpen(true);
      }
    } else {
      // No dismissal record, show banner
      setIsBannerOpen(true);
    }
  }, []);

  const handleCloseBanner = () => {
    setIsBannerOpen(false);
    localStorage.setItem(BANNER_STORAGE_KEY, Date.now().toString());
  };

  return (
    <>
      {/* Collapsible Banner */}
      <Collapse in={isBannerOpen} animateOpacity>
        <Box
          backgroundColor={theme.colors.red[400]}
          borderBottom={`2px ${theme.colors.red[600]} solid`}
          color="white"
          paddingX={['8px', '32px']}
          paddingY="12px"
          position="relative"
        >
          <Flex alignItems="center" justifyContent="space-between">
            <HStack spacing={4}>
              <Box overflow="hidden" borderRadius="50px" maxH={24} maxW={24}>
                <Image alt="Blonde girlie with makeup and dimples" opacity="0.9" src={Lemon} />
              </Box>
              <VStack>
                <Text fontSize={['sm', 'md']} fontWeight="semibold">
                  Hey gang, it's your resident dev{' '}
                  <span style={{ color: theme.colors.yellow[100] }}>Lemon</span> here! <br />
                </Text>
                <Text fontSize="sm">
                  I've been hard at work on some exciting new features for OSRS Bingo Hub, like the{' '}
                  <strong>new Gielinor Rush game type</strong>, among some other nice-to-haves and
                  QOL improvements.
                  <br />
                </Text>
                <Text
                  fontSize="lg"
                  color={theme.colors.yellow[100]}
                  fontWeight="semibold"
                  textDecoration="underline"
                  w="100%"
                  textAlign="left"
                >
                  <Link to="/gielinor-rush">
                    Give the Gielinor Rush a shot with your clan/friends! 💛
                  </Link>
                </Text>
                <Text w="100%" textAlign="left" fontSize="12px">
                  Also, please consider{' '}
                  <Link to="https://cash.app/$lemonlikesgirls/5.00" target="_blank">
                    <u>supporting me</u>
                  </Link>
                  , hosting ain't cheap and I want to continue developing new features for you
                  sweaty gamers! ;-)
                </Text>
              </VStack>
            </HStack>
            <IconButton
              aria-label="Close banner"
              alignSelf="flex-start"
              icon={<MdClose />}
              size="sm"
              variant="ghost"
              colorScheme="whiteAlpha"
              onClick={handleCloseBanner}
              _hover={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            />
          </Flex>
        </Box>
      </Collapse>

      {/* Main Navigation Bar */}
      <Flex
        alignItems="center"
        backgroundColor={`rgba(50, 104, 107, 1)`}
        borderBottom={`4px ${theme.colors.teal[800]} solid`}
        boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
        color={theme.colors.gray[200]}
        justifyContent="space-between"
        paddingX={['16px', '32px']}
        paddingY="16px"
        position="relative"
      >
        <Link style={{ display: 'flex', alignItems: 'center' }} to="/faq">
          <Icon
            aria-hidden
            as={MdContactSupport}
            color={theme.colors.blue[300]}
            height={['48px', '32px']}
            width={['48px', '32px']}
          />
          <Text display={['none', 'block']} fontWeight="semibold" marginLeft="8px">
            faq
          </Text>
        </Link>
        <Flex
          alignItems="center"
          backgroundColor={theme.colors.gray[400]}
          borderRadius="50%"
          boxShadow="4px 4px 8px 2px rgba(0, 0, 0, 0.07)"
          css={css`
            position: absolute;
            background: ${theme.colors.teal[600]};
            border-radius: 50%;
            overflow: hidden;
            cursor: pointer;

            &::before {
              content: '';
              zindex: 0;
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(
                120deg,
                rgba(255, 255, 255, 0.3) 25%,
                rgba(0, 0, 0, 0.1) 50%,
                rgba(255, 255, 255, 0.3) 75%
              );
              background-size: 200% 100%;
              transition: background 0.4s ease;
              pointer-events: none;
            }

            &:hover::before {
              animation: glimmer 1.5s infinite linear;
            }

            @keyframes glimmer {
              0% {
                background-position: -200% 0;
              }
              100% {
                background-position: 200% 0;
              }
            }
          `}
          height={['125px', '100px']}
          justifyContent="center"
          marginTop={['3px', '25px']}
          padding="8px"
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-50%, -50%)"
          width={['125px', '100px']}
        >
          <NavLink
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              width: '100%',
            }}
            to={user ? `/user/${user.id}` : '/'}
            aria-label="Home"
          >
            <Image
              aria-hidden
              height={['110px', '80px']}
              src={GemLogo}
              width={['110px', '80px']}
              loading="lazy"
            />
          </NavLink>
        </Flex>

        <Link
          style={{ display: 'flex', alignItems: 'center' }}
          to={user ? `/user/${user.id}` : '/login'}
        >
          <Text display={['none', 'block']} fontWeight="semibold" marginRight="8px">
            {user ? user.username : 'log in'}
          </Text>
          <Image aria-hidden height={['48px', '32px']} src={GnomeChild} width={['48px', '32px']} />
        </Link>
      </Flex>
    </>
  );
};

export default NavBar;
