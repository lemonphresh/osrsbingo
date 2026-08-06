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
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER, GET_ASSOCIATED_EVENTS } from '../graphql/queries';

import EditField from '../molecules/EditField';
import { DELETE_USER, UPDATE_USER } from '../graphql/mutations';
import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { MdDoorBack } from 'react-icons/md';
import InvitationSection from '../organisms/InvitationsSection';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import MiniStats from '../molecules/MiniStats';
import DiscordLinkSection from '../molecules/DiscordLinkSection';
import {
  isBattleshipEnabled,
  isBlindDraftEnabled,
  isChampionForgeEnabled,
  isGroupDashboardEnabled,
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
  const activeEvents = associatedData?.getAssociatedEvents ?? [];

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
      <Section flexDirection="column" gridGap="16px" maxWidth="860px" width="100%">
        <Flex flexDirection="column" pt="16px" gridGap="24px">
          <GemTitle textAlign="center">
            {isCurrentUser ? `Howdy, ${user?.displayName}!` : `${shownUser?.displayName}'s Profile`}
          </GemTitle>
          <Text fontSize="22px" textAlign="center">
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
              <Flex alignItems="baseline" gridGap="8px" justifyContent="center" width="100%">
                <StarIcon color={theme.colors.yellow[400]} /> Admin
              </Flex>
            ) : null}
            {user?.admin && !isCurrentUser ? (
              <Button
                gridGap="8px"
                justifyContent="center"
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
                width="100%"
                variant="ghost"
              >
                <StarIcon color={theme.colors.gray[300]} />{' '}
                {shownUser?.admin ? 'Remove as' : 'Make'} Admin
              </Button>
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
                    <Badge
                      colorScheme={
                        e.type === 'champion-forge'
                          ? 'red'
                          : e.type === 'battleship'
                          ? 'cyan'
                          : 'yellow'
                      }
                      fontSize="xs"
                    >
                      {e.type === 'champion-forge'
                        ? 'Champion Forge'
                        : e.type === 'battleship'
                        ? 'Battleship'
                        : 'Gielinor Rush'}
                    </Badge>
                    <Badge
                      colorScheme={
                        e.role === 'Creator'
                          ? 'purple'
                          : e.role === 'Admin'
                          ? 'orange'
                          : e.role === 'Ref'
                          ? 'blue'
                          : 'gray'
                      }
                      fontSize="xs"
                      variant="outline"
                    >
                      {e.role}
                    </Badge>
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
              <Box
                as={Link}
                to="/bingo"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="2px solid"
                borderColor={theme.colors.purple[500]}
                p={5}
                _hover={{ borderColor: theme.colors.purple[300], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.purple[300]} mb={1}>
                  Bingo Boards
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Create and manage your custom bingo boards. Track your progress and share with
                  friends for some friendly competition.
                </Text>
              </Box>
              <Box
                as={Link}
                to="/gielinor-rush"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="2px solid"
                borderColor={theme.colors.yellow[500]}
                p={5}
                _hover={{ borderColor: theme.colors.yellow[300], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.yellow[300]} mb={1}>
                  Gielinor Rush
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Host live treasure hunt competitions with your friends and clanmates, complete
                  with an auto-generated map and submission support.
                </Text>
              </Box>
              <Box
                as={Link}
                to="/champion-forge"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="2px solid"
                borderColor={theme.colors.red[500]}
                p={5}
                _hover={{ borderColor: theme.colors.red[300], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.red[300]} mb={1}>
                  Champion Forge
                </Text>
                <Text fontSize="sm" color="gray.400">
                  It takes a village to build a champion. Group up, earn gear, and battle for glory
                  in this competitive clan event. Good for short term events.
                </Text>
              </Box>
              {isBattleshipEnabled(user) && (
                <Box
                  as={Link}
                  to="/battleship"
                  bg={theme.colors.teal[800]}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor="#47b3d1"
                  p={5}
                  _hover={{ borderColor: '#76e4f7', transform: 'translateY(-2px)' }}
                  transition="all 0.15s"
                >
                  <Text fontWeight="bold" color="#76e4f7" mb={1}>
                    Battleship
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Two big teams, one big ocean. Place your fleet, fire shots, complete tasks to
                    sink the enemy.
                  </Text>
                </Box>
              )}
              {isGroupDashboardEnabled(user) && (
                <Box
                  as={Link}
                  to="/group"
                  bg={theme.colors.teal[800]}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={theme.colors.orange[500]}
                  p={5}
                  _hover={{ borderColor: theme.colors.orange[300], transform: 'translateY(-2px)' }}
                  transition="all 0.15s"
                >
                  <Text fontWeight="bold" color={theme.colors.orange[300]} mb={1}>
                    Group Goals Dashboard
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Create shared goals and track group progress over time with this dashboard built
                    for clans, GIMs, and pals.
                  </Text>
                </Box>
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
              <Box
                as={Link}
                to="/team-balancer"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="2px solid"
                borderColor={theme.colors.green[500]}
                p={5}
                _hover={{ borderColor: theme.colors.green[300], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.green[300]} mb={1}>
                  Team Balancer
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Auto-balance a list of RSNs into fair teams using WOM stats. Perfect before
                  planning an event.
                </Text>
              </Box>
              {isBlindDraftEnabled(user) && (
                <Box
                  as={Link}
                  to="/blind-draft"
                  bg={theme.colors.teal[800]}
                  borderRadius="lg"
                  border="2px solid"
                  borderColor={theme.colors.pink[500]}
                  p={5}
                  _hover={{ borderColor: theme.colors.pink[300], transform: 'translateY(-2px)' }}
                  transition="all 0.15s"
                >
                  <Text fontWeight="bold" color={theme.colors.pink[300]} mb={1}>
                    Blind Draft
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Anonymous player draft rooms for fair team selection. Both captains pick live
                    from anonymous cards.
                  </Text>
                </Box>
              )}
            </SimpleGrid>
          </Section>
        )}

        <Section flexDirection="column" width="100%">
          <GemTitle size="sm" gemColor="purple" textAlign="center" mb={4}>
            Discover
          </GemTitle>
          <SimpleGrid columns={[1, 2]} spacing={4}>
            <Box
              as={Link}
              to="/boards"
              bg={theme.colors.teal[800]}
              borderRadius="lg"
              border="1px solid"
              borderColor={theme.colors.teal[600]}
              p={5}
              _hover={{ borderColor: theme.colors.purple[400], transform: 'translateY(-2px)' }}
              transition="all 0.15s"
            >
              <Text fontWeight="bold" color={theme.colors.purple[200]} mb={1}>
                Browse Public Bingo Boards
              </Text>
              <Text fontSize="sm" color="gray.400">
                Explore boards shared by the community
              </Text>
            </Box>
            <Box
              as={Link}
              to="/gielinor-rush/active"
              bg={theme.colors.teal[800]}
              borderRadius="lg"
              border="1px solid"
              borderColor={theme.colors.teal[600]}
              p={5}
              _hover={{ borderColor: theme.colors.yellow[400], transform: 'translateY(-2px)' }}
              transition="all 0.15s"
            >
              <Text fontWeight="bold" color={theme.colors.yellow[300]} mb={1}>
                Active Gielinor Rush Events
              </Text>
              <Text fontSize="sm" color="gray.400">
                See all live and recent treasure hunt competitions
              </Text>
            </Box>
            {isChampionForgeEnabled(user) && (
              <Box
                as={Link}
                to="/champion-forge/gallery"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="1px solid"
                borderColor={theme.colors.teal[600]}
                p={5}
                _hover={{ borderColor: theme.colors.red[400], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.red[300]} mb={1}>
                  Champion Forge: Battle Gallery
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Watch replays from past Champion Forge tourneys
                </Text>
              </Box>
            )}
          </SimpleGrid>
        </Section>

        <MiniStats />
      </Section>

      {!isCurrentUser && user?.admin && (
        <>
          <Button
            colorScheme="red"
            leftIcon={<DeleteIcon />}
            marginTop="48px"
            onClick={onOpenDeleteAlert}
          >
            Delete User
          </Button>

          <AlertDialog
            isOpen={isDeleteAlertOpen}
            leastDestructiveRef={cancelRef}
            onClose={onCloseDeleteAlert}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="semibold">
                  Delete User
                </AlertDialogHeader>
                <AlertDialogBody>
                  Are you sure? This will also delete their associated Bingo Boards and any
                  invitations they've sent. You can't undo this action afterwards.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onCloseDeleteAlert}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={onDelete} ml={3}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </>
      )}

      {isCurrentUser && (
        <Button
          variant="ghost"
          leftIcon={<Icon as={MdDoorBack} />}
          marginTop="48px"
          _hover={{
            backgroundColor: 'gray.600',
          }}
          onClick={logout}
          as={Link}
          to="/"
          color="white"
          fontSize="18px"
        >
          Logout
        </Button>
      )}
    </Flex>
  );
};

export default UserDetails;
