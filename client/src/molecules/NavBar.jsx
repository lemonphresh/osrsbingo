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
  Button,
  Switch,
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
import { MdContactSupport, MdClose, MdDoorBack } from 'react-icons/md';
import { GET_PENDING_INVITATIONS } from '../graphql/queries';
import { GET_UNREAD_GROUP_NOTIFICATION_COUNT } from '../graphql/groupDashboardOperations';
import { FaHeart } from 'react-icons/fa';
import { isChampionForgeEnabled, isGroupDashboardEnabled } from '../config/featureFlags';
import PleaseEffect from '../atoms/PleaseEffect';
import HolidayEmojiFall, { HOLIDAY_PREF_KEY, HOLIDAY_PREF_EVENT, isHolidayActive } from '../atoms/HolidayEmojiFall';

const BANNER_STORAGE_KEY = 'navbarBannerDismissed';
const BANNER_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const NavBar = () => {
  const { user, logout } = useAuth();
  const [isBannerOpen, setIsBannerOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const [holidayEmojisOn, setHolidayEmojisOn] = useState(() => !localStorage.getItem(HOLIDAY_PREF_KEY));

  const { data: invitationsData } = useQuery(GET_PENDING_INVITATIONS, {
    skip: !user,
  });

  const { data: unreadData } = useQuery(GET_UNREAD_GROUP_NOTIFICATION_COUNT, {
    skip: !user || !isGroupDashboardEnabled(user),
    pollInterval: 10 * 60 * 1000, // 10 min
  });

  const pendingInviteCount = invitationsData?.getPendingInvitations?.length || 0;
  const unreadGroupCount = unreadData?.getUnreadGroupNotificationCount || 0;
  const totalBadgeCount = pendingInviteCount + unreadGroupCount;

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
                {/* short copy on mobile/tablet, full copy on desktop */}
                <Text fontSize={['sm', 'md']} display={['block', 'block', 'none']}>
                  <Text as="span" color={theme.colors.yellow[400]} fontWeight="semibold">
                    Like the site?
                  </Text>{' '}
                  Solo dev here! No ads, just server bills. If the site helps your clan, consider
                  supporting! 💛
                </Text>
                <Text fontSize="md" display={['none', 'none', 'block']}>
                  <Text as="span" color={theme.colors.yellow[400]} fontWeight="semibold">
                    HEY YOU! Like the site?
                  </Text>{' '}
                  I'm Lemon! Solo dev, no ads, no investors. Just me and my server bills. If OSRS
                  Bingo Hub has helped your clan, consider helping me keep it running 💛
                </Text>
                {isChampionForgeEnabled(user) ? (
                  <Text fontSize={['xs', 'sm']} opacity={0.6}>
                    Also, event runners, go check out <strong>Champion Forge</strong>! Full clan
                    tournaments are here! ⚔️
                  </Text>
                ) : (
                  <Text fontSize={['xs', 'sm']} opacity={0.6}>
                    <strong>Champion Forge</strong> is coming soon... clan tournaments, get hype 👀
                  </Text>
                )}
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
              <PleaseEffect>
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
                    fontWeight="semibold"
                    fontSize="sm"
                    _hover={{ backgroundColor: theme.colors.yellow[300] }}
                  >
                    <FaHeart color={theme.colors.red[500]} /> Support
                  </Flex>
                </Link>
              </PleaseEffect>
              {isChampionForgeEnabled(user) ? (
                <Link to="/champion-forge">
                  <Text color={theme.colors.yellow[400]} fontSize="sm" textAlign="center">
                    Champion Forge →
                  </Text>
                </Link>
              ) : (
                <HStack spacing={1}>
                  <Text color={theme.colors.gray[400]} fontSize="sm" textAlign="center">
                    Champion Forge
                  </Text>
                  <Badge colorScheme="yellow" fontSize="xs">
                    Soon
                  </Badge>
                </HStack>
              )}
            </Flex>
          </Flex>
        </Box>
      </Collapse>

      {/* Main Navigation Bar */}
      <Box position="relative">
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
        zIndex={5}
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
        {/* Arc text around the bottom of the gem circle — desktop only */}
        <Box
          display={['none', 'block']}
          position="absolute"
          left="50%"
          top="50%"
          transform="translate(-50%, -50%)"
          marginTop="25px"
          pointerEvents="none"
          zIndex={6}
        >
          {/* SVG is 120×120; the 100px circle maps to center=(60,60) r=50.
              Arc radius 56 places text just outside the circle's bottom rim. */}
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <path id="navBottomArc" d="M 4,60 A 56,56 0 0,0 116,60" />
            </defs>
            <text
              fill={theme.colors.teal[100]}
              fontSize="8"
              fontWeight="800"
              letterSpacing="3"
              textAnchor="middle"
              fontFamily="sans-serif"
            >
              <textPath href="#navBottomArc" startOffset="50%">OSRS BINGO HUB</textPath>
            </text>
          </svg>
        </Box>

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

        {user ? (
          <>
            {/* Backdrop */}
            {isNavMenuOpen && (
              <Box
                position="fixed"
                inset="0"
                zIndex={98}
                backgroundColor="rgba(0,0,0,0.45)"
                onClick={() => setIsNavMenuOpen(false)}
              />
            )}

            {/* Trigger */}
            <Box
              cursor="pointer"
              display="flex"
              alignItems="center"
              position="relative"
              onClick={() => setIsNavMenuOpen((v) => !v)}
              _hover={{ opacity: 0.8 }}
            >
              <Text display={['none', 'block']} fontWeight="semibold" marginRight="8px">
                {user.username}
              </Text>
              <Box position="relative">
                <Image
                  aria-hidden
                  height={['48px', '32px']}
                  src={GnomeChild}
                  width={['48px', '32px']}
                />
                {totalBadgeCount > 0 && (
                  <Badge
                    position="absolute"
                    top="-4px"
                    right="-4px"
                    backgroundColor={theme.colors.red[500]}
                    color="white"
                    borderRadius="full"
                    fontSize="10px"
                    fontWeight="semibold"
                    minWidth="18px"
                    height="18px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 2px 4px rgba(0,0,0,0.3)"
                  >
                    {totalBadgeCount > 9 ? '9+' : totalBadgeCount}
                  </Badge>
                )}
              </Box>
            </Box>

            {/* Slide-in drawer */}
            <Box
              position="fixed"
              top="0"
              right="0"
              height="100vh"
              width="260px"
              zIndex={99}
              backgroundColor="#0d1520"
              borderLeft="3px solid rgba(50, 104, 107, 0.8)"
              boxShadow={isNavMenuOpen ? '-8px 0 40px rgba(0,0,0,0.8)' : 'none'}
              display="flex"
              flexDirection="column"
              transform={isNavMenuOpen ? 'translateX(0)' : 'translateX(100%)'}
              transition="transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)"
            >
              {/* Drawer header */}
              <Box
                padding="20px 16px 16px"
                borderBottom="1px solid rgba(255,255,255,0.08)"
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <HStack spacing={3}>
                  <Image src={GnomeChild} height="28px" width="28px" aria-hidden />
                  <Text fontWeight="semibold" color="white" fontSize="sm">
                    {user.username}
                  </Text>
                </HStack>
                <IconButton
                  icon={<MdClose />}
                  size="sm"
                  variant="ghost"
                  color="white"
                  opacity={0.5}
                  onClick={() => setIsNavMenuOpen(false)}
                  aria-label="Close menu"
                  _hover={{ opacity: 1, backgroundColor: 'rgba(255,255,255,0.1)' }}
                />
              </Box>

              {/* Holiday toggle */}
              {isHolidayActive() && (
                <Box
                  paddingX="20px"
                  paddingY="10px"
                  borderBottom="1px solid rgba(255,255,255,0.08)"
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Text fontSize="xs" color="rgba(255,255,255,0.5)">
                    Holiday emojis
                  </Text>
                  <Switch
                    size="sm"
                    colorScheme="teal"
                    isChecked={holidayEmojisOn}
                    onChange={() => {
                      const next = !holidayEmojisOn;
                      setHolidayEmojisOn(next);
                      if (next) localStorage.removeItem(HOLIDAY_PREF_KEY);
                      else localStorage.setItem(HOLIDAY_PREF_KEY, '1');
                      window.dispatchEvent(new Event(HOLIDAY_PREF_EVENT));
                    }}
                  />
                </Box>
              )}

              {/* Drawer items */}
              <Box overflowY="auto" flex={1} paddingBottom="16px">
                {[
                  {
                    section: 'My Stuff',
                    items: [
                      { label: 'My Account', to: `/user/${user.id}` },
                      { label: 'My Boards', to: '/bingo' },
                      ...(isGroupDashboardEnabled(user)
                        ? [
                            {
                              label: 'My Group Activity',
                              to: '/group/activity',
                              hasNotif: unreadGroupCount > 0,
                            },
                          ]
                        : []),
                    ],
                  },
                  {
                    section: 'Public',
                    items: [
                      { label: 'View All Boards', to: '/boards' },
                      { label: 'View GR Events', to: '/gielinor-rush/active' },
                    ],
                  },
                  {
                    section: 'Site Tools',
                    items: [
                      { label: 'Bingo Creator', to: '/boards/create' },
                      { label: 'Blind Draft', to: '/blind-draft' },
                      { label: 'Team Balancer', to: '/team-balancer' },
                      { label: 'Gielinor Rush', to: '/gielinor-rush' },
                      ...(isChampionForgeEnabled(user)
                        ? [{ label: 'Champion Forge', to: '/champion-forge', isNew: true }]
                        : []),
                      ...(isGroupDashboardEnabled(user)
                        ? [{ label: 'Group Dashboard Creator', to: '/group', isNew: true }]
                        : []),
                    ],
                  },
                ].map(({ section, items }) => (
                  <Box key={section} paddingTop="16px">
                    <Text
                      paddingX="20px"
                      paddingBottom="4px"
                      fontSize="10px"
                      fontWeight="bold"
                      letterSpacing="0.1em"
                      color="rgba(255,255,255,0.35)"
                      textTransform="uppercase"
                    >
                      {section}
                    </Text>
                    {items.map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setIsNavMenuOpen(false)}>
                        <HStack
                          paddingX="20px"
                          paddingY="11px"
                          justifyContent="space-between"
                          transition="background 0.12s"
                          _hover={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
                        >
                          <HStack spacing={2}>
                            <Text color="white" fontSize="sm" fontWeight="medium">
                              {item.label}
                            </Text>
                            {item.hasNotif && (
                              <Box
                                w="7px"
                                h="7px"
                                borderRadius="full"
                                bg="red.400"
                                flexShrink={0}
                              />
                            )}
                          </HStack>
                          {item.isNew && (
                            <Badge colorScheme="yellow" fontSize="xs">
                              New
                            </Badge>
                          )}
                        </HStack>
                      </Link>
                    ))}
                  </Box>
                ))}
              </Box>

              {/* Support button */}
              <VStack
                alignItems="center"
                padding="16px"
                borderTop="1px solid rgba(255,255,255,0.08)"
                margin="0 auto"
              >
                <PleaseEffect>
                  <Link to="/support" onClick={() => setIsNavMenuOpen(false)}>
                    <HStack
                      justifyContent="center"
                      padding="10px 16px"
                      backgroundColor="rgba(244, 211, 94, 0.12)"
                      borderRadius="8px"
                      border="1px solid rgba(244, 211, 94, 0.3)"
                      _hover={{ backgroundColor: 'rgba(244, 211, 94, 0.2)' }}
                      transition="background 0.12s"
                      spacing={2}
                    >
                      <FaHeart color={theme.colors.red[400]} size={13} />
                      <Text color={theme.colors.yellow[300]} fontSize="sm" fontWeight="semibold">
                        Support the Site
                      </Text>
                    </HStack>
                  </Link>
                </PleaseEffect>
                <Button
                  variant="ghost"
                  leftIcon={<Icon as={MdDoorBack} />}
                  _hover={{
                    backgroundColor: 'gray.600',
                  }}
                  onClick={logout}
                  as={Link}
                  to="/"
                  color="white"
                  fontSize="14px"
                  fontWeight="normal"
                >
                  Logout
                </Button>
              </VStack>
            </Box>
          </>
        ) : (
          <Link style={{ display: 'flex', alignItems: 'center', position: 'relative' }} to="/login">
            <Text display={['none', 'block']} fontWeight="semibold" marginRight="8px">
              log in
            </Text>
            <Image
              aria-hidden
              height={['48px', '32px']}
              src={GnomeChild}
              width={['48px', '32px']}
            />
          </Link>
        )}
      </Flex>
      <HolidayEmojiFall />
      </Box>
    </>
  );
};

export default NavBar;
