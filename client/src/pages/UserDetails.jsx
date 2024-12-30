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
  Heading,
  Icon,
  Image,
  ListItem,
  Text,
  UnorderedList,
  useDisclosure,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useMutation, useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import GnomeChild from '../assets/gnomechild.png';
import EditField from '../molecules/EditField';
import { DELETE_USER, UPDATE_USER } from '../graphql/mutations';
import { AddIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';
import { MdDoorBack, MdOutlineStorage } from 'react-icons/md';
import InvitationSection from '../organisms/InvitationsSection';
import { useToastContext } from '../providers/ToastProvider';

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
  const [shownBoard, setShownBoard] = useState({
    board: null,
    grid: null,
  });

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

  const navigateToBoard = ({ asEditor, boardId }) => {
    if (asEditor) {
      navigate(`/boards/${boardId}`, { state: { isEditMode: true } });
    } else {
      navigate(`/boards/${boardId}`);
    }
  };

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

  useEffect(() => {
    const grid = getMiniBoardGrid(shownBoard.board);
    setShownBoard((prev) => ({
      ...prev,
      grid,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownBoard.board]);

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
      <Flex alignItems="flex-start" marginBottom="24px" maxWidth="860px" width="100%">
        <Text
          alignItems="center"
          display="inline-flex"
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          fontWeight="bold"
          justifyContent="center"
          marginBottom="1px"
        >
          <Icon as={MdOutlineStorage} marginRight="8px" />
          <Link to="/boards"> View All Boards</Link>
        </Text>
      </Flex>
      <Section flexDirection="column" gridGap="16px" maxWidth="860px" width="100%">
        <Flex flexDirection="column" gridGap="24px">
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
              <Flex alignItems="center" height="40px" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="bold"
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
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="bold"
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
              <Flex alignItems="center" flexDirection="space-between" width="100%">
                <Text width="100%">
                  <Text
                    as="span"
                    color={theme.colors.teal[200]}
                    display="inline"
                    fontWeight="bold"
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
          </Section>
          {isCurrentUser && <InvitationSection setShownUser={setShownUser} />}
        </Flex>
        <Flex flexDirection={['column', 'column', 'row', 'row']} gridGap="16px">
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="purple" size="sm" textAlign="center">
              {isCurrentUser ? 'Your' : 'Their Public'} Bingo Boards
            </GemTitle>
            <Flex flexDirection="column">
              {!shownUser?.editorBoards || shownUser.editorBoards.length === 0 ? (
                <>
                  <Text textAlign="center">
                    Looks like {isCurrentUser ? 'you' : 'they'} haven't made or been added as an
                    editor to any boards yet.
                  </Text>

                  {isCurrentUser && (
                    <Text
                      _hover={{
                        borderBottom: `1px solid ${theme.colors.pink[200]}`,
                        marginBottom: '0px',
                      }}
                      color={theme.colors.pink[200]}
                      fontWeight="bold"
                      margin="0 auto"
                      marginBottom="1px"
                      marginTop="16px"
                    >
                      <Link
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                        to="/boards/create"
                      >
                        <AddIcon marginRight="8px" /> Create a Board
                      </Link>
                    </Text>
                  )}
                </>
              ) : (
                <Flex
                  backgroundColor="rgba(0, 0, 0, 0.1)"
                  borderRadius="16px"
                  flexDirection="column"
                  padding="8px"
                >
                  <UnorderedList
                    css={`
                      scrollbar-width: thin; /* Firefox */
                      scrollbar-color: ${theme.colors.purple[400]} rgba(255, 255, 255, 0.1); /* Firefox */

                      ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                      }

                      ::-webkit-scrollbar-thumb {
                        background: ${theme.colors.purple[400]};
                        border-radius: 4px;
                      }

                      t::-webkit-scrollbar-track {
                        background: rgba(255, 255, 255, 0.1);
                      }
                    `}
                    key={shownUser}
                    maxHeight="212px"
                    margin="0 auto"
                    overflowY="auto"
                    paddingX="16px"
                  >
                    {shownUser.editorBoards
                      .filter((item) => {
                        if (isCurrentUser) {
                          return true;
                        } else {
                          return item.isPublic !== false;
                        }
                      })
                      .map((item) => (
                        <ListItem
                          _hover={{
                            borderBottom: `1px solid white`,
                            marginBottom: 0,
                          }}
                          color={theme.colors.white}
                          cursor="pointer"
                          key={item.id}
                          marginBottom="1px"
                          paddingTop="3px"
                          onClick={() =>
                            setShownBoard((prev) => ({
                              ...prev,
                              board: item,
                            }))
                          }
                          width="fit-content"
                        >
                          {item.name}
                        </ListItem>
                      ))}
                  </UnorderedList>
                  {isCurrentUser && (
                    <Link
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      to="/boards/create"
                    >
                      <Text
                        _hover={{
                          backgroundColor: theme.colors.purple[300],
                        }}
                        backgroundColor={theme.colors.purple[400]}
                        borderRadius="8px"
                        color={theme.colors.pink[900]}
                        cursor="pointer"
                        fontWeight="bold"
                        margin="0 auto"
                        marginTop="8px"
                        opacity="0.85"
                        paddingY="8px"
                        textAlign="center"
                        width="100%"
                      >
                        <AddIcon marginRight="8px" /> Create a Board
                      </Text>
                    </Link>
                  )}
                </Flex>
              )}
            </Flex>
          </Section>

          <Section flexDirection="column" width="100%">
            <Flex flexDirection="column" justifyContent="space-between" height="100%">
              <Heading marginBottom="32px" marginTop="8px" size="sm" textAlign="center">
                {shownBoard.board?.name
                  ? `Preview: ${shownBoard.board.name}`
                  : `Click a board from the "${
                      isCurrentUser ? 'Your' : 'Their Public'
                    } Bingo Boards" list to preview it.`}
              </Heading>
              <Flex flexDirection="column" height="100%">
                <Flex
                  alignItems="center"
                  backgroundColor={
                    shownBoard.board?.name ? theme.colors.gray[700] : theme.colors.teal[800]
                  }
                  borderRadius="10px"
                  flexDirection="column"
                  justifyContent="center"
                  margin="0 auto"
                  padding="8px"
                >
                  {shownBoard.board !== null ? (
                    <MiniBingoBoard grid={shownBoard.grid} themeName={shownBoard.board.theme} />
                  ) : (
                    <Image height="100px" src={GnomeChild} width="100px" loading="lazy" />
                  )}
                </Flex>
                {shownBoard.board !== null ? (
                  <Flex
                    alignItems="center"
                    flexDirection={['column', 'row', 'row']}
                    gridGap={['16px', '24px']}
                    justifyContent="center"
                    marginY={['24px', '32px']}
                  >
                    <Button
                      colorScheme="green"
                      onClick={() =>
                        navigateToBoard({ boardId: shownBoard.board.id, asEditor: false })
                      }
                    >
                      View Details
                    </Button>{' '}
                    {isCurrentUser && (
                      <Button
                        colorScheme="pink"
                        onClick={() =>
                          navigateToBoard({ boardId: shownBoard.board.id, asEditor: true })
                        }
                      >
                        Edit Board
                      </Button>
                    )}
                  </Flex>
                ) : (
                  <Flex height="48px" />
                )}
              </Flex>
            </Flex>
          </Section>

          {/* <Section flexDirection="column" width="100%">
            <GemTitle gemColor="blue" size="sm">
              {isCurrentUser ? 'Your' : 'Their'} Events
            </GemTitle>
            <Flex flexDirection="column">
              <Text textAlign="center">
                Coming soon!
                {!shownUser?.events || shownUser.events.length === 0
                ? 'Looks like ${isCurrentUser ? 'you' : 'they'} are not associated with any events yet.'
                : 'todo event list'}
              </Text>
            </Flex>
          </Section> */}
        </Flex>
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
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
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
        <Text
          alignItems="center"
          display="inline-flex"
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          fontSize="18px"
          marginBottom="1px"
          marginTop="48px"
          justifyContent="center"
          textAlign="center"
        >
          <Icon as={MdDoorBack} marginRight="8px" />
          <Link onClick={logout} to="/">
            Logout
          </Link>
        </Text>
      )}
    </Flex>
  );
};

export default UserDetails;
