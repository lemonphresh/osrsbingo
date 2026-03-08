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
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';

import EditField from '../molecules/EditField';
import { DELETE_USER, UPDATE_USER } from '../graphql/mutations';
import { DeleteIcon, StarIcon } from '@chakra-ui/icons';
import { MdDoorBack } from 'react-icons/md';
import InvitationSection from '../organisms/InvitationsSection';
import { useToastContext } from '../providers/ToastProvider';
import usePageTitle from '../hooks/usePageTitle';
import MiniStats from '../molecules/MiniStats';
import DiscordLinkSection from '../molecules/DiscordLinkSection';
import { isBlindDraftEnabled } from '../config/featureFlags';

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
  const [shownUser, setShownUser] = useState(null);
  usePageTitle(shownUser ? `User Details - ${shownUser.username}` : 'User Details');

  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

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

        {isCurrentUser && (
          <Section flexDirection="column" width="100%">
            <GemTitle size="sm" textAlign="center" mb={4}>
              Site Tools
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
                  Create and manage your custom bingo boards
                </Text>
              </Box>
              <Box
                as={Link}
                to="/gielinor-rush"
                bg={theme.colors.teal[800]}
                borderRadius="lg"
                border="2px solid"
                borderColor={theme.colors.orange[500]}
                p={5}
                _hover={{ borderColor: theme.colors.orange[300], transform: 'translateY(-2px)' }}
                transition="all 0.15s"
              >
                <Text fontWeight="bold" color={theme.colors.orange[300]} mb={1}>
                  Gielinor Rush
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Host team treasure hunt events with GP prize pools
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
                  Build a champion and battle rival clans
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
                  Anonymous player draft rooms for fair team selection
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
              _hover={{ borderColor: theme.colors.orange[400], transform: 'translateY(-2px)' }}
              transition="all 0.15s"
            >
              <Text fontWeight="bold" color={theme.colors.orange[200]} mb={1}>
                Active Gielinor Rush Events
              </Text>
              <Text fontSize="sm" color="gray.400">
                See all live and recent treasure hunt competitions
              </Text>
            </Box>
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
