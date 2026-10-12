import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Flex,
  Icon,
  Text,
  useDisclosure,
  SimpleGrid,
  Box,
  VStack,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import HubButton from '../atoms/HubButton';
import Chip from '../atoms/Chip';
import FeatureCard from '../atoms/FeatureCard';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER, GET_ASSOCIATED_EVENTS } from '../graphql/queries';

import EditField from '../molecules/EditField';
import { DELETE_USER, UPDATE_USER } from '../graphql/mutations';
import { ArrowRightIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
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
import { Switch, Select } from '@chakra-ui/react';
import {
  HOLIDAY_PREF_KEY,
  HOLIDAY_PREF_EVENT,
  HOLIDAY_TEST_EVENT,
  HOLIDAYS,
  isHolidayActive,
} from '../atoms/HolidayEmojiFall';

const UserDetails = () => {
  const { isCheckingAuth, logout, setUser, user } = useAuth();
  const { showToast } = useToastContext();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onOpenDeleteAlert,
    onClose: onCloseDeleteAlert,
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
      <Section flexDirection="column" gridGap="16px" maxWidth="860px" width="100%">
        <Flex flexDirection="column" pt="16px" gridGap="24px">
          <GemTitle textAlign="center">
            {isCurrentUser ? `Howdy, ${user?.displayName}!` : `${shownUser?.displayName}'s Profile`}
          </GemTitle>
          <Text
            fontSize={['sm', 'md']}
            textAlign="center"
            color="whiteAlpha.800"
            fontWeight="500"
            maxWidth="520px"
            mx="auto"
            marginTop="-16px"
          >
            {isCurrentUser
              ? 'Welcome to your Bingo Hub. Kick your feet up.'
              : 'Oh, snooping, I see. Enjoy the view.'}
          </Text>
          <Section
            backgroundColor="rgba(0, 225, 200, 0.4)"
            flexDirection="column"
            gridGap="4px"
            key={user}
            margin="0 auto"
            marginY="16px"
            maxWidth={['100%', '100%', '75%', '50%']}
            minWidth={['100%', '325px']}
          >
            {shownUser?.admin ? (
              <Flex justifyContent="center" width="100%" marginBottom="4px">
                <Chip variant="warn" size="md">
                  <StarIcon marginRight="6px" boxSize="10px" />
                  Admin
                </Chip>
              </Flex>
            ) : null}
            {user?.admin && !isCurrentUser ? (
              <HubButton
                variant="ghost"
                width="100%"
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
            ) : null}
            {isCurrentUser && (
              <Flex alignItems="center" minHeight="40px" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="semibold"
                    marginRight="4px"
                  >
                    Username:
                  </Text>
                  {'  '}
                  {shownUser?.username}
                </Text>
              </Flex>
            )}
            {!fieldsEditing.displayName ? (
              <Flex alignItems="center" minHeight="40px" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="semibold"
                    marginRight="4px"
                  >
                    Public Display Name:
                  </Text>
                  {'  '}
                  {shownUser?.displayName ? shownUser.displayName : 'N/A'}
                </Text>
                {isCurrentUser && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.teal[800] }}
                    color={theme.colors.teal[200]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        displayName: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              <EditField
                entityId={user.id}
                fieldName="displayName"
                MUTATION={UPDATE_USER}
                onSave={(data) => {
                  setUser({
                    token: user.token,
                    ...data.updateUser,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    displayName: false,
                  });
                }}
                value={user.displayName}
              />
            )}
            {!fieldsEditing.rsn ? (
              <Flex alignItems="center" minHeight="40px" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="semibold"
                    marginRight="4px"
                  >
                    RSN:
                  </Text>
                  {'  '}
                  {shownUser?.rsn ? shownUser.rsn : 'N/A'}
                </Text>
                {isCurrentUser && (
                  <Button
                    _hover={{ backgroundColor: theme.colors.teal[800] }}
                    color={theme.colors.teal[200]}
                    marginLeft="16px"
                    onClick={() =>
                      setFieldsEditing({
                        ...fieldsEditing,
                        rsn: true,
                      })
                    }
                    textDecoration="underline"
                    variant="ghost"
                  >
                    Edit
                  </Button>
                )}
              </Flex>
            ) : (
              <EditField
                entityId={user.id}
                fieldName="rsn"
                MUTATION={UPDATE_USER}
                onSave={(data) => {
                  setUser({
                    token: user.token,
                    ...data.updateUser,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    rsn: false,
                  });
                }}
                value={user.rsn}
              />
            )}

            {/* HOLIDAY EMOJIS TOGGLE */}
            {isCurrentUser && isHolidayActive() && (
              <Flex
                alignItems="center"
                minHeight="40px"
                justifyContent="space-between"
                width="100%"
              >
                <Text>
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    fontWeight="semibold"
                    marginRight="4px"
                  >
                    Holiday Emojis:
                  </Text>
                  {holidayEmojisOn ? 'On' : 'Off'}
                </Text>
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
                  marginLeft="16px"
                />
              </Flex>
            )}

            {/* ADMIN: TEST HOLIDAY EFFECTS */}
            {isCurrentUser && user?.admin && (
              <Flex
                alignItems="center"
                minHeight="40px"
                justifyContent="space-between"
                width="100%"
                gap={2}
              >
                <Text flexShrink={0}>
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    fontWeight="semibold"
                    marginRight="4px"
                  >
                    Test Holiday:
                  </Text>
                </Text>
                <Select
                  size="sm"
                  bg="gray.800"
                  borderColor="gray.600"
                  color="gray.100"
                  placeholder="Pick a holiday..."
                  onChange={(e) => {
                    if (!e.target.value) return;
                    window.dispatchEvent(
                      new CustomEvent(HOLIDAY_TEST_EVENT, { detail: HOLIDAYS[e.target.value] })
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
              </Flex>
            )}

            {/* DISCORD INTEGRATION SECTION */}
            {isCurrentUser && (
              <DiscordLinkSection
                user={user}
                shownUser={shownUser}
                setUser={setUser}
                setShownUser={setShownUser}
                showToast={showToast}
              />
            )}
          </Section>
          {isCurrentUser && <InvitationSection setShownUser={setShownUser} />}
        </Flex>

        {isCurrentUser && activeEvents.length > 0 && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Your Active Events
            </GemTitle>
            <VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
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

        {isCurrentUser && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Create Events
            </GemTitle>
            <SimpleGrid columns={[1, 3]} spacing={4}>
              <FeatureCard
                to="/bingo"
                accentColor={theme.colors.purple[300]}
                accentHover={theme.colors.purple[300]}
                title="Bingo Boards"
                description="Create and manage your custom bingo boards. Track your progress and share with friends for some friendly competition."
              />
              {isGielinorRushEnabled(user) && (
                <FeatureCard
                  to="/gielinor-rush"
                  accentColor={theme.colors.yellow[300]}
                  title="Gielinor Rush"
                  description="Host live treasure hunt competitions with your friends and clanmates, complete with an auto-generated map and submission support."
                />
              )}
              {isBattleshipEnabled(user) && (
                <FeatureCard
                  to="/battleship"
                  accentColor="#76e4f7"
                  title="Battleship"
                  description="Two big teams, one big ocean. Place your fleet, fire shots, complete tasks to sink the enemy."
                />
              )}
              {isChampionForgeEnabled(user) && (
                <FeatureCard
                  to="/champion-forge"
                  accentColor={theme.colors.red[300]}
                  title="Champion Forge"
                  description="It takes a village to build a champion. Group up, earn gear, and battle for glory in this competitive clan event. Good for short term events."
                />
              )}
              {isGroupDashboardEnabled(user) && (
                <FeatureCard
                  to="/group"
                  accentColor={theme.colors.orange[300]}
                  title="Group Goals Dashboard"
                  description="Create shared goals and track group progress over time with this dashboard built for clans, GIMs, and pals."
                />
              )}
            </SimpleGrid>
          </Section>
        )}

        {isCurrentUser && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Tools
            </GemTitle>
            <SimpleGrid columns={[1, 3]} spacing={4}>
              <FeatureCard
                to="/team-balancer"
                accentColor={theme.colors.green[300]}
                title="Team Balancer"
                description="Auto-balance a list of RSNs into fair teams using WOM stats. Perfect before planning an event."
              />
              {isBlindDraftEnabled(user) && (
                <FeatureCard
                  to="/blind-draft"
                  accentColor={theme.colors.pink[300]}
                  title="Blind Draft"
                  description="Anonymous player draft rooms for fair team selection. Both captains pick live from anonymous cards."
                />
              )}
            </SimpleGrid>
          </Section>
        )}

        <Section flexDirection="column" width="100%">
          <GemTitle size="sm" gemColor="purple" textAlign="center" mb={4}>
            Discover
          </GemTitle>
          <SimpleGrid columns={[1, 2]} spacing={4}>
            <FeatureCard
              variant="muted"
              to="/boards"
              accentColor={theme.colors.purple[200]}
              accentHover={theme.colors.purple[400]}
              title="Browse Public Bingo Boards"
              description="Explore boards shared by the community"
            />
            <FeatureCard
              variant="muted"
              to="/gielinor-rush/active"
              accentColor={theme.colors.yellow[300]}
              accentHover={theme.colors.yellow[400]}
              title="Active Gielinor Rush Events"
              description="See all live and recent treasure hunt competitions"
            />
            {isChampionForgeEnabled(user) && (
              <FeatureCard
                variant="muted"
                to="/champion-forge/gallery"
                accentColor={theme.colors.red[300]}
                accentHover={theme.colors.red[400]}
                title="Champion Forge: Battle Gallery"
                description="Watch replays from past Champion Forge tourneys"
              />
            )}
          </SimpleGrid>
        </Section>

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
      </Section>

      {!isCurrentUser && user?.admin && (
        <>
          <HubButton
            variant="danger"
            leftIcon={<DeleteIcon />}
            marginTop="48px"
            onClick={onOpenDeleteAlert}
          >
            Delete User
          </HubButton>

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
        </>
      )}

      {isCurrentUser && (
        <HubButton
          variant="ghost"
          size="md"
          leftIcon={<Icon as={MdDoorBack} />}
          marginTop="32px"
          onClick={logout}
          as={Link}
          to="/"
        >
          Logout
        </HubButton>
      )}
    </Flex>
  );
};

export default UserDetails;
