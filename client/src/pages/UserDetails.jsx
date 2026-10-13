import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Icon,
  Text,
  useDisclosure,
  Box,
  VStack,
  HStack,
  Select,
  Switch,
  Avatar,
  AvatarBadge,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import HubButton from '../atoms/HubButton';
import Chip from '../atoms/Chip';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER, GET_ASSOCIATED_EVENTS } from '../graphql/queries';

import EditField from '../molecules/EditField';
import { DELETE_USER, UPDATE_USER } from '../graphql/mutations';
import { ArrowRightIcon, CheckIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { MdDoorBack } from 'react-icons/md';
import InvitationSection from '../organisms/InvitationsSection';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import MiniStats from '../molecules/MiniStats';
import PleaseEffect from '../atoms/PleaseEffect';
import { FaHeart } from 'react-icons/fa';
import DiscordLinkSection from '../molecules/DiscordLinkSection';
import AnnouncementBanner from '../molecules/AnnouncementBanner';
import {
  isBattleshipEnabled,
  isBlindDraftEnabled,
  isChampionForgeEnabled,
  isGielinorRushEnabled,
  isGroupDashboardEnabled,
  isWhodunnitEnabled,
  isWhodunnitSeason,
} from '../config/featureFlags';
import {
  HOLIDAY_PREF_KEY,
  HOLIDAY_PREF_EVENT,
  HOLIDAY_TEST_EVENT,
  HOLIDAYS,
  isHolidayActive,
} from '../atoms/HolidayEmojiFall';

const BuildStripe = ({ to, accent, title, description }) => (
  <Box
    as={Link}
    to={to}
    display="flex"
    alignItems="center"
    gap={4}
    bg={theme.colors.teal[800]}
    borderRadius="md"
    borderLeft="4px solid"
    borderLeftColor={accent}
    px={4}
    py={3}
    _hover={{ bg: theme.colors.teal[700], transform: 'translateX(2px)' }}
    transition="all 0.15s"
  >
    <Box flex={1} minW={0}>
      <Text
        fontWeight="bold"
        color={accent}
        fontFamily={theme.fonts.heading}
        letterSpacing="-0.005em"
        fontSize={['sm', 'md']}
      >
        {title}
      </Text>
      <Text fontSize="xs" color="gray.400" lineHeight="1.5">
        {description}
      </Text>
    </Box>
    <ArrowRightIcon color="gray.500" boxSize={3} flexShrink={0} />
  </Box>
);

const UserDetails = () => {
  const { isCheckingAuth, logout, setUser, user } = useAuth();
  const { showToast } = useToastContext();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onOpenDeleteAlert,
    onClose: onCloseDeleteAlert,
  } = useDisclosure();
  const {
    isOpen: isEditProfileOpen,
    onOpen: onOpenEditProfile,
    onClose: onCloseEditProfile,
  } = useDisclosure();
  const cancelRef = useRef();

  const navigate = useNavigate();
  const params = useParams();
  const [isCurrentUser, setIsCurrentUser] = useState(
    user && parseInt(user.id) === parseInt(params.userId, 10)
  );
  const [fieldsEditing, setFieldsEditing] = useState({
    rsn: false,
    username: false,
  });
  const [holidayEmojisOn, setHolidayEmojisOn] = useState(
    () => !localStorage.getItem(HOLIDAY_PREF_KEY)
  );
  const [shownUser, setShownUser] = useState(null);
  usePageTitle(shownUser ? `User Details - ${shownUser.username}` : 'User Details');

  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  const { data: associatedData } = useQuery(GET_ASSOCIATED_EVENTS, { skip: !isCurrentUser });
  const activeEvents = [...(associatedData?.getAssociatedEvents ?? [])].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const onDelete = useCallback(async () => {
    if (shownUser?.id !== user?.id) {
      const { data } = await deleteUser({
        variables: {
          id: shownUser?.id,
        },
      });

      if (data?.deleteUser?.success) {
        navigate(`/user/${user?.id}`);
        onCloseDeleteAlert();
        showToast('Deleted user successfully!', 'success');
      }
    }
  }, [deleteUser, navigate, onCloseDeleteAlert, showToast, shownUser?.id, user?.id]);

  const { loading } = useQuery(GET_USER, {
    variables: { id: parseInt(params.userId, 10) },
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getUser) {
        setShownUser({ ...data.getUser });
      } else {
        setShownUser('Not found');
      }
    },
    onError: () => {
      setShownUser('Not found');
    },
  });

  useEffect(() => {
    if (!isCheckingAuth && !user) {
      navigate('/');
    } else if (shownUser === 'Not found') {
      navigate('/error');
    }
  }, [isCheckingAuth, loading, navigate, shownUser, user]);

  useEffect(() => {
    setIsCurrentUser(user && parseInt(user.id) === parseInt(params.userId, 10));
  }, [isCurrentUser, params.userId, user]);

  useEffect(() => {
    setShownUser(user);
  }, [user]);

  const showWhodunnitBanner = isWhodunnitEnabled(user) && isWhodunnitSeason();
  const discordLinked = Boolean(shownUser?.discordUserId);
  const discordAvatarUrl =
    discordLinked && shownUser?.discordAvatar
      ? `https://cdn.discordapp.com/avatars/${shownUser.discordUserId}/${shownUser.discordAvatar}.png`
      : undefined;

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['48px', '88px']}
      width="100%"
    >
      <Box maxWidth="860px" width="100%">
        <AnnouncementBanner
          visible={showWhodunnitBanner}
          storageKey="profileWhodunnitBannerDismissed"
          background="linear-gradient(135deg, #1a0a08 0%, #2e1a0d 45%, #0d1f14 100%)"
          borderColor="#c9a04c"
          eyebrow="☃️ Seasonal Event"
          title="A Gielinor Whodunnit is live!"
          body="Watson has a case: Snowflake's holiday gift for My Arm has gone missing. Grab up to 3 friends and investigate. Solve puzzles to reveal clues all over Gielinor, playable at your own pace through the holidays."
          ctaTo="/whodunnit"
          ctaLabel="Open the case file →"
          ctaBg="#9e2a2e"
          ctaHoverBg="#c44046"
          ctaBorder="#c44046"
        />
      </Box>

      <Section flexDirection="column" gridGap="24px" maxWidth="860px" width="100%">
        {/* HERO */}
        <Flex flexDirection="column" pt="16px" gridGap="12px">
          <GemTitle textAlign="center">
            {isCurrentUser ? `Howdy, ${user?.displayName}!` : `${shownUser?.displayName}'s Profile`}
          </GemTitle>
          {isCurrentUser && (
            <HStack justify="center" spacing={2} flexWrap="wrap">
              <Chip variant="info" size="sm">
                {activeEvents.length} active {activeEvents.length === 1 ? 'event' : 'events'}
              </Chip>
              {shownUser?.admin && (
                <Chip variant="warn" size="sm">
                  <StarIcon marginRight="6px" boxSize="10px" />
                  Admin
                </Chip>
              )}
              {discordLinked && (
                <Chip variant="accent" size="sm">
                  Discord linked
                </Chip>
              )}
            </HStack>
          )}
          {!isCurrentUser && shownUser?.admin && (
            <Flex justify="center">
              <Chip variant="warn" size="md">
                <StarIcon marginRight="6px" boxSize="10px" />
                Admin
              </Chip>
            </Flex>
          )}
          {user?.admin && !isCurrentUser && (
            <Flex justify="center">
              <HubButton
                variant="ghost"
                leftIcon={<StarIcon />}
                onClick={async () => {
                  const { data } = await updateUser({
                    variables: {
                      id: shownUser?.id,
                      input: {
                        admin: !shownUser?.admin,
                      },
                    },
                  });
                  if (data.updateUser) {
                    setShownUser({
                      ...data.updateUser,
                      ...shownUser,
                      admin: !shownUser?.admin,
                    });
                  }
                }}
              >
                {shownUser?.admin ? 'Remove as' : 'Make'} Admin
              </HubButton>
            </Flex>
          )}
        </Flex>

        {/* ACTIVE EVENTS (promoted) */}
        {isCurrentUser && activeEvents.length > 0 && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Your Active Events
            </GemTitle>
            <VStack align="stretch" spacing={2} maxH="320px" overflowY="auto">
              {activeEvents.map((e) => (
                <HStack
                  key={`${e.type}-${e.eventId}`}
                  as={Link}
                  to={e.url}
                  justify="space-between"
                  px={4}
                  py={3}
                  bg={theme.colors.teal[800]}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor={theme.colors.teal[600]}
                  _hover={{
                    borderColor:
                      e.type === 'champion-forge'
                        ? theme.colors.red[400]
                        : e.type === 'battleship'
                        ? '#76e4f7'
                        : theme.colors.yellow[400],
                  }}
                  transition="all 0.15s"
                >
                  <Text fontWeight="semibold" fontSize="sm" color="white" minW={0} noOfLines={1}>
                    {e.eventName}
                  </Text>
                  <HStack spacing={1} flexShrink={0}>
                    <Chip
                      size="sm"
                      accentColor={
                        e.type === 'champion-forge'
                          ? theme.colors.red[400]
                          : e.type === 'battleship'
                          ? theme.colors.cyan[400]
                          : theme.colors.yellow[400]
                      }
                    >
                      {e.type === 'champion-forge'
                        ? 'Champion Forge'
                        : e.type === 'battleship'
                        ? 'Battleship'
                        : 'Gielinor Rush'}
                    </Chip>
                    <Chip
                      variant={
                        e.role === 'Creator'
                          ? 'accent'
                          : e.role === 'Admin'
                          ? 'warn'
                          : e.role === 'Ref'
                          ? 'info'
                          : 'default'
                      }
                      size="sm"
                    >
                      {e.role}
                    </Chip>
                    <ArrowRightIcon ml={4} />
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Section>
        )}

        {/* INVITATIONS */}
        {isCurrentUser && <InvitationSection setShownUser={setShownUser} />}

        {/* PROFILE SUMMARY ROW */}
        {isCurrentUser && (
          <Flex
            align="center"
            justify="space-between"
            flexDirection={['column', 'row']}
            gap={3}
            bg={theme.colors.teal[800]}
            borderRadius="lg"
            border="1px solid"
            borderColor={theme.colors.teal[700]}
            px={5}
            py={4}
          >
            <Flex
              align="center"
              gap={2}
              flexWrap="wrap"
              justify={['center', 'flex-start']}
              fontSize="sm"
            >
              <Text as="span" color="white" fontWeight="semibold">
                @{shownUser?.username}
              </Text>
              {shownUser?.displayName && (
                <>
                  <Text as="span" color="gray.500">
                    ·
                  </Text>
                  <Text as="span" color="whiteAlpha.800">
                    {shownUser.displayName}
                  </Text>
                </>
              )}
              <Text as="span" color="gray.500">
                ·
              </Text>
              <Text as="span" color="whiteAlpha.700">
                <Text as="span" color={theme.colors.teal[200]} fontWeight="semibold">
                  RSN:
                </Text>{' '}
                {shownUser?.rsn || 'none set'}
              </Text>
              <Text as="span" color="gray.500">
                ·
              </Text>
              {discordLinked ? (
                <HStack
                  spacing={2}
                  bg="rgba(88, 101, 242, 0.15)"
                  border="1px solid"
                  borderColor="rgba(88, 101, 242, 0.5)"
                  borderRadius="full"
                  pl={1}
                  pr={3}
                  py={1}
                >
                  <Avatar
                    size="xs"
                    src={discordAvatarUrl}
                    name={shownUser?.discordUsername || shownUser?.displayName}
                    bg="#5865F2"
                  >
                    <AvatarBadge
                      boxSize="1.1em"
                      bg="green.400"
                      borderColor="rgba(88, 101, 242, 0.9)"
                      borderWidth="2px"
                    >
                      <CheckIcon color="white" boxSize="0.5em" />
                    </AvatarBadge>
                  </Avatar>
                  <Text as="span" fontSize="xs" color="white" fontWeight="semibold">
                    {shownUser?.discordUsername || 'Discord linked'}
                  </Text>
                </HStack>
              ) : (
                <Text as="span" color="whiteAlpha.600">
                  <Text as="span" color={theme.colors.teal[200]} fontWeight="semibold">
                    Discord:
                  </Text>{' '}
                  not linked
                </Text>
              )}
            </Flex>
            <HubButton size="sm" variant="ghost" onClick={onOpenEditProfile}>
              Edit profile
            </HubButton>
          </Flex>
        )}

        {/* BUILD RAIL */}
        {isCurrentUser && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Toolkit
            </GemTitle>
            <VStack align="stretch" spacing={2}>
              <BuildStripe
                to="/bingo"
                accent={theme.colors.purple[300]}
                title="Bingo Boards"
                description="Create and manage custom bingo boards. Track progress and share with friends."
              />
              {isGielinorRushEnabled(user) && (
                <BuildStripe
                  to="/gielinor-rush"
                  accent={theme.colors.yellow[300]}
                  title="Gielinor Rush"
                  description="Host live treasure hunt competitions with an auto-generated map and submission support."
                />
              )}
              {isBattleshipEnabled(user) && (
                <BuildStripe
                  to="/battleship"
                  accent="#76e4f7"
                  title="Battleship"
                  description="Two big teams, one big ocean. Place your fleet, fire shots, complete tasks to sink the enemy."
                />
              )}
              {isChampionForgeEnabled(user) && (
                <BuildStripe
                  to="/champion-forge"
                  accent={theme.colors.red[300]}
                  title="Champion Forge"
                  description="Group up, earn gear, and battle for glory. Good for short-term clan events."
                />
              )}
              {isGroupDashboardEnabled(user) && (
                <BuildStripe
                  to="/group"
                  accent={theme.colors.orange[300]}
                  title="Group Goals Dashboard"
                  description="Shared goals and group progress for clans, GIMs, and pals."
                />
              )}
              <BuildStripe
                to="/team-balancer"
                accent={theme.colors.green[300]}
                title="Team Balancer"
                description="Auto-balance a list of RSNs into fair teams using WOM stats."
              />
              {isBlindDraftEnabled(user) && (
                <BuildStripe
                  to="/blind-draft"
                  accent={theme.colors.pink[300]}
                  title="Blind Draft"
                  description="Anonymous player draft rooms. Both captains pick live from anonymous cards."
                />
              )}
            </VStack>
          </Section>
        )}

        <MiniStats />

        {/* Support the site callout */}
        <Flex
          flexDirection={['column', 'row']}
          align="center"
          justify="space-between"
          gap={4}
          bg="linear-gradient(145deg, rgba(244, 211, 94, 0.10) 0%, rgba(224, 122, 95, 0.12) 100%)"
          borderWidth="1px"
          borderColor="rgba(244, 211, 94, 0.3)"
          borderRadius="xl"
          px={[5, 6]}
          py={4}
          mt={2}
        >
          <VStack
            align={['center', 'flex-start']}
            spacing={1}
            flex={1}
            textAlign={['center', 'left']}
          >
            <Text fontSize={['sm', 'md']} color="white" fontWeight="semibold">
              Like what you see?
            </Text>
            <Text fontSize={['xs', 'sm']} color="whiteAlpha.800">
              This site is ad-free, built and run by one person. Any support helps keep it that way.
            </Text>
          </VStack>
          <PleaseEffect>
            <Link to="/support">
              <HStack
                as="span"
                spacing={2}
                bg={theme.colors.yellow[400]}
                color="gray.900"
                px={5}
                py={2}
                borderRadius="md"
                fontWeight="semibold"
                fontSize="sm"
                _hover={{ bg: theme.colors.yellow[300] }}
                whiteSpace="nowrap"
              >
                <FaHeart color={theme.colors.red[500]} /> Support the Site
              </HStack>
            </Link>
          </PleaseEffect>
        </Flex>

        {/* QUIET FOOTER BAR */}
        {(isCurrentUser || (!isCurrentUser && user?.admin)) && (
          <>
            <Divider borderColor="whiteAlpha.200" mt={4} />
            <Flex
              justify="space-between"
              align="center"
              flexDirection={['column', 'row']}
              gap={3}
              pt={2}
              pb={4}
            >
              {!isCurrentUser && user?.admin ? (
                <Button
                  variant="ghost"
                  size="sm"
                  color="red.300"
                  leftIcon={<DeleteIcon />}
                  onClick={onOpenDeleteAlert}
                  _hover={{ bg: 'whiteAlpha.100', color: 'red.200' }}
                >
                  Delete user
                </Button>
              ) : (
                <Box />
              )}
              {isCurrentUser && (
                <Button
                  variant="ghost"
                  size="sm"
                  color="whiteAlpha.700"
                  leftIcon={<Icon as={MdDoorBack} />}
                  onClick={logout}
                  as={Link}
                  to="/"
                  _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
                >
                  Logout
                </Button>
              )}
            </Flex>
          </>
        )}
      </Section>

      {/* EDIT PROFILE DRAWER */}
      <Drawer isOpen={isEditProfileOpen} placement="right" onClose={onCloseEditProfile} size="md">
        <DrawerOverlay />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton />
          <DrawerHeader
            fontFamily={theme.fonts.heading}
            fontWeight="700"
            letterSpacing="-0.01em"
            borderBottomWidth="1px"
            borderColor="whiteAlpha.200"
          >
            Edit profile
          </DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={5} py={2}>
              {/* DISPLAY NAME */}
              <Box>
                <Text fontSize="xs" color={theme.colors.teal[200]} fontWeight="semibold" mb={2}>
                  Public display name
                </Text>
                {!fieldsEditing.displayName ? (
                  <Flex align="center" justify="space-between">
                    <Text fontSize="sm" color="white">
                      {shownUser?.displayName || 'N/A'}
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      color={theme.colors.teal[200]}
                      textDecoration="underline"
                      _hover={{ bg: theme.colors.teal[700] }}
                      onClick={() => setFieldsEditing({ ...fieldsEditing, displayName: true })}
                    >
                      Edit
                    </Button>
                  </Flex>
                ) : (
                  <EditField
                    entityId={user.id}
                    fieldName="displayName"
                    MUTATION={UPDATE_USER}
                    onSave={(data) => {
                      setUser({ token: user.token, ...data.updateUser });
                      setFieldsEditing({ ...fieldsEditing, displayName: false });
                    }}
                    value={user.displayName}
                  />
                )}
              </Box>

              <Divider borderColor="whiteAlpha.200" />

              {/* RSN */}
              <Box>
                <Text fontSize="xs" color={theme.colors.teal[200]} fontWeight="semibold" mb={2}>
                  RSN
                </Text>
                {!fieldsEditing.rsn ? (
                  <Flex align="center" justify="space-between">
                    <Text fontSize="sm" color="white">
                      {shownUser?.rsn || 'N/A'}
                    </Text>
                    <Button
                      size="sm"
                      variant="ghost"
                      color={theme.colors.teal[200]}
                      textDecoration="underline"
                      _hover={{ bg: theme.colors.teal[700] }}
                      onClick={() => setFieldsEditing({ ...fieldsEditing, rsn: true })}
                    >
                      Edit
                    </Button>
                  </Flex>
                ) : (
                  <EditField
                    entityId={user.id}
                    fieldName="rsn"
                    MUTATION={UPDATE_USER}
                    onSave={(data) => {
                      setUser({ token: user.token, ...data.updateUser });
                      setFieldsEditing({ ...fieldsEditing, rsn: false });
                    }}
                    value={user.rsn}
                  />
                )}
              </Box>

              <Divider borderColor="whiteAlpha.200" />

              {/* DISCORD */}
              <Box>
                <Text fontSize="xs" color={theme.colors.teal[200]} fontWeight="semibold" mb={2}>
                  Discord
                </Text>
                <DiscordLinkSection
                  user={user}
                  shownUser={shownUser}
                  setUser={setUser}
                  setShownUser={setShownUser}
                  showToast={showToast}
                />
              </Box>

              {/* HOLIDAY EMOJIS */}
              {isHolidayActive() && (
                <>
                  <Divider borderColor="whiteAlpha.200" />
                  <Flex align="center" justify="space-between">
                    <Box>
                      <Text fontSize="xs" color={theme.colors.teal[200]} fontWeight="semibold">
                        Holiday emojis
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.800">
                        {holidayEmojisOn ? 'On' : 'Off'}
                      </Text>
                    </Box>
                    <Switch
                      isChecked={holidayEmojisOn}
                      onChange={() => {
                        const next = !holidayEmojisOn;
                        setHolidayEmojisOn(next);
                        if (next) {
                          localStorage.removeItem(HOLIDAY_PREF_KEY);
                        } else {
                          localStorage.setItem(HOLIDAY_PREF_KEY, '1');
                        }
                        window.dispatchEvent(new Event(HOLIDAY_PREF_EVENT));
                      }}
                      colorScheme="teal"
                    />
                  </Flex>
                </>
              )}

              {/* ADMIN HOLIDAY TEST */}
              {user?.admin && (
                <>
                  <Divider borderColor="whiteAlpha.200" />
                  <Box>
                    <Text fontSize="xs" color={theme.colors.teal[200]} fontWeight="semibold" mb={2}>
                      Test holiday (admin)
                    </Text>
                    <Select
                      size="sm"
                      bg="gray.900"
                      borderColor="gray.600"
                      color="gray.100"
                      placeholder="Pick a holiday..."
                      onChange={(e) => {
                        if (!e.target.value) return;
                        window.dispatchEvent(
                          new CustomEvent(HOLIDAY_TEST_EVENT, {
                            detail: HOLIDAYS[e.target.value],
                          })
                        );
                        e.target.value = '';
                      }}
                    >
                      {Object.keys(HOLIDAYS).map((name) => (
                        <option key={name} value={name} style={{ background: '#1A202C' }}>
                          {name}
                        </option>
                      ))}
                    </Select>
                  </Box>
                </>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* DELETE USER ALERT */}
      {!isCurrentUser && user?.admin && (
        <AlertDialog
          isOpen={isDeleteAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={onCloseDeleteAlert}
        >
          <AlertDialogOverlay>
            <AlertDialogContent
              bg="gray.800"
              color="white"
              borderWidth="1px"
              borderColor="gray.700"
            >
              <AlertDialogHeader
                fontFamily={theme.fonts.heading}
                fontSize="lg"
                fontWeight="700"
                letterSpacing="-0.01em"
              >
                Delete User
              </AlertDialogHeader>
              <AlertDialogBody color="whiteAlpha.800" lineHeight="1.6">
                Are you sure? This will also delete their associated Bingo Boards and any
                invitations they've sent. You can't undo this action afterwards.
              </AlertDialogBody>
              <AlertDialogFooter>
                <HubButton ref={cancelRef} variant="neutral" onClick={onCloseDeleteAlert}>
                  Cancel
                </HubButton>
                <HubButton variant="danger" onClick={onDelete} ml={3}>
                  Delete
                </HubButton>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Flex>
  );
};

export default UserDetails;
