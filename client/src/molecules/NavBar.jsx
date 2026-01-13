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
  Badge,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import theme from '../theme';
import GemLogo from '../assets/gemlogo-small.png';
import GnomeChild from '../assets/gnomechild-small.webp';
import Lemon from '../assets/selfie.webp';
import { useAuth } from '../providers/AuthProvider';
import { css } from '@emotion/react';
import { MdContactSupport, MdClose } from 'react-icons/md';
import { GET_PENDING_INVITATIONS } from '../graphql/queries';
import { FaHeart } from 'react-icons/fa';

const BANNER_STORAGE_KEY = 'navbarBannerDismissed';
const BANNER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const NavBar = () => {
  const { user } = useAuth();
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  const { data: invitationsData } = useQuery(GET_PENDING_INVITATIONS, {
    skip: !user,
  });

  const pendingInviteCount = invitationsData?.getPendingInvitations?.length || 0;

  useEffect(() => {
    const dismissedTime = localStorage.getItem(BANNER_STORAGE_KEY);

    if (dismissedTime) {
      const timePassed = Date.now() - parseInt(dismissedTime, 10);
      if (timePassed < BANNER_DURATION_MS) {
        setIsBannerOpen(false);
      } else {
        localStorage.removeItem(BANNER_STORAGE_KEY);
        setIsBannerOpen(true);
      }
    } else {
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
          background="linear-gradient(135deg, #1a202c 0%, #2d3748 100%)"
          borderBottom="3px solid"
          borderColor={theme.colors.yellow[400]}
          color="white"
          paddingX={['16px', '32px']}
          paddingY="16px"
          position="relative"
        >
          <IconButton
            aria-label="Close banner"
            position="absolute"
            right={3}
            top={3}
            icon={<MdClose />}
            size="sm"
            variant="ghost"
            color="white"
            opacity={0.5}
            onClick={handleCloseBanner}
            _hover={{ opacity: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Flex
            direction={['column', 'row']}
            alignItems={['flex-start', 'center']}
            gap={[4, 5]}
            maxW="950px"
            margin="0 auto"
          >
            <HStack spacing={4} alignItems="center">
              <Box
                borderRadius="50%"
                overflow="hidden"
                flexShrink={0}
                width={['60px', '70px']}
                height={['60px', '70px']}
                border="3px solid rgba(255,255,255,0.2)"
              >
                <Image
                  alt="Blonde person with makeup and dimples"
                  src={Lemon}
                  width="100%"
                  height="100%"
                  objectFit="cover"
                />
              </Box>
              <VStack align="start" spacing={1} flex={1}>
                <Text fontSize={['sm', 'md']}>
                  <Text as="span" color={theme.colors.yellow[400]} fontWeight="bold">
                    HEY YOU! Like the site?
                  </Text>{' '}
                  I'm Lemon! Solo dev, no ads, no investors. Just me and my server bills. If OSRS
                  Bingo Hub has helped your clan, consider helping me keep it running 💛
                </Text>
                <Text fontSize={['xs', 'sm']} opacity={0.6}>
                  Also go try <strong>Gielinor Rush</strong>, it's new, sailing and all!
                </Text>
              </VStack>
            </HStack>
            <Flex
              justifyContent="center"
              flexDirection={['row', 'column']}
              alignItems="center"
              gap={3}
              flexShrink={0}
              w={['100%', 'auto']}
            >
              <Link to="/support">
                <Flex
                  as="span"
                  align="center"
                  gap={2}
                  backgroundColor={theme.colors.yellow[400]}
                  color="gray.900"
                  paddingX={5}
                  paddingY={2}
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="sm"
                  _hover={{ backgroundColor: theme.colors.yellow[300] }}
                >
                  <FaHeart color={theme.colors.red[500]} /> Support
                </Flex>
              </Link>
              <Link to="/gielinor-rush">
                <Text color={theme.colors.yellow[400]} fontSize="sm" textAlign="center">
                  Gielinor Rush →
                </Text>
              </Link>
            </Flex>
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
          style={{ display: 'flex', alignItems: 'center', position: 'relative' }}
          to={user ? `/user/${user.id}` : '/login'}
        >
          <Text display={['none', 'block']} fontWeight="semibold" marginRight="8px">
            {user ? user.username : 'log in'}
          </Text>
          <Box position="relative">
            <Image
              aria-hidden
              height={['48px', '32px']}
              src={GnomeChild}
              width={['48px', '32px']}
            />
            {pendingInviteCount > 0 && (
              <Badge
                position="absolute"
                top="-4px"
                right="-4px"
                backgroundColor={theme.colors.red[500]}
                color="white"
                borderRadius="full"
                fontSize="10px"
                fontWeight="bold"
                minWidth="18px"
                height="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                {pendingInviteCount > 9 ? '9+' : pendingInviteCount}
              </Badge>
            )}
          </Box>
        </Link>
      </Flex>
    </>
  );
};

export default NavBar;
