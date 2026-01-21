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
  VStack,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Badge,
  HStack,
  Divider,
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
import {
  DELETE_USER,
  UPDATE_USER,
  LINK_DISCORD_ACCOUNT,
  UNLINK_DISCORD_ACCOUNT,
} from '../graphql/mutations';
import { AddIcon, DeleteIcon, StarIcon } from '@chakra-ui/icons';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';
import { MdDoorBack, MdOutlineMap, MdOutlineStorage } from 'react-icons/md';
import InvitationSection from '../organisms/InvitationsSection';
import { useToastContext } from '../providers/ToastProvider';
import { FaMap } from 'react-icons/fa';
import usePageTitle from '../hooks/usePageTitle';

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

  usePageTitle(shownUser ? `User Details - ${shownUser.username}` : 'User Details');

  // Discord linking state
  const [discordId, setDiscordId] = useState('');
  const [isEditingDiscord, setIsEditingDiscord] = useState(false);

  const [updateUser] = useMutation(UPDATE_USER);
  const [deleteUser] = useMutation(DELETE_USER);

  // Discord mutations
  const [linkDiscord, { loading: linkingDiscord }] = useMutation(LINK_DISCORD_ACCOUNT, {
    onCompleted: (data) => {
      setUser({
        ...user,
        discordUserId: data.linkDiscordAccount.discordUserId,
      });
      setShownUser({
        ...shownUser,
        discordUserId: data.linkDiscordAccount.discordUserId,
      });
      setIsEditingDiscord(false);
      setDiscordId('');
      showToast('Discord account linked successfully!', 'success');
    },
    onError: (error) => {
      showToast(`Error linking Discord: ${error.message}`, 'error');
    },
  });

  const [unlinkDiscord, { loading: unlinkingDiscord }] = useMutation(UNLINK_DISCORD_ACCOUNT, {
    onCompleted: () => {
      setUser({
        ...user,
        discordUserId: null,
      });
      setShownUser({
        ...shownUser,
        discordUserId: null,
      });
      setDiscordId('');
      setIsEditingDiscord(false);
      showToast('Discord account unlinked', 'info');
    },
    onError: (error) => {
      showToast(`Error unlinking Discord: ${error.message}`, 'error');
    },
  });

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
      <Flex
        alignItems="flex-start"
        justifyContent="space-between"
        marginBottom="16px"
        maxWidth="860px"
        width="100%"
      >
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
          <Link to="/boards"> View Public Boards</Link>
        </Text>
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
          <Link to="/gielinor-rush">Gielinor Rush</Link>
          <Icon as={FaMap} marginLeft="8px" />
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

            {/* DISCORD INTEGRATION SECTION */}
            {isCurrentUser && (
              <>
                <Divider my={2} />
                {!isEditingDiscord ? (
                  <Flex alignItems="center" flexDirection="column" width="100%" py={2}>
                    <HStack width="100%" justify="space-between" mb={2}>
                      <HStack>
                        <Text color={theme.colors.teal[200]} fontWeight="bold">
                          Discord:
                        </Text>
                        {shownUser?.discordUserId ? (
                          <Badge colorScheme="green" fontSize="sm">
                            Linked
                          </Badge>
                        ) : (
                          <Badge colorScheme="gray" fontSize="sm">
                            Not linked
                          </Badge>
                        )}
                      </HStack>
                      <Button
                        _hover={{ backgroundColor: theme.colors.teal[800] }}
                        color={theme.colors.teal[200]}
                        onClick={() => setIsEditingDiscord(true)}
                        size="sm"
                        textDecoration="underline"
                        variant="ghost"
                      >
                        {shownUser?.discordUserId ? 'Manage' : 'Link'}
                      </Button>
                    </HStack>
                    {shownUser?.discordUserId && (
                      <Text fontSize="sm" color="gray.200" width="100%">
                        ID: {shownUser.discordUserId}
                      </Text>
                    )}
                  </Flex>
                ) : (
                  <VStack width="100%" spacing={3} py={2}>
                    <Text fontSize="md" color={theme.colors.teal[200]} fontWeight="bold">
                      Discord Integration
                    </Text>

                    {shownUser?.discordUserId ? (
                      <>
                        <FormControl>
                          <FormLabel fontSize="sm" color="white">
                            Linked Discord ID
                          </FormLabel>
                          <Input
                            size="sm"
                            color="gray.700"
                            borderRadius="md"
                            bg="white"
                            value={shownUser.discordUserId}
                            isReadOnly
                          />
                        </FormControl>
                        <HStack width="100%" spacing={2}>
                          <Button
                            colorScheme="red"
                            size="sm"
                            onClick={() => unlinkDiscord({ variables: { userId: user.id } })}
                            isLoading={unlinkingDiscord}
                            flex={1}
                          >
                            Unlink
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsEditingDiscord(false)}
                            flex={1}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </>
                    ) : (
                      <>
                        <FormControl>
                          <FormLabel fontSize="sm" color="white">
                            Discord User ID
                          </FormLabel>
                          <Input
                            value={discordId}
                            placeholder="Discord User ID (i.e., 123456789012345678)"
                            onChange={(e) => setDiscordId(e.target.value)}
                            size="sm"
                            color="gray.700"
                            borderRadius="md"
                            bg="white"
                          />
                          <FormHelperText color="white" fontSize="xs">
                            Enable Developer Mode in Discord Settings → Advanced, then right-click
                            your name and select "Copy User ID"
                          </FormHelperText>
                        </FormControl>
                        <HStack width="100%" spacing={2}>
                          <Button
                            colorScheme="purple"
                            size="sm"
                            onClick={() =>
                              linkDiscord({
                                variables: { userId: user.id, discordUserId: discordId },
                              })
                            }
                            isLoading={linkingDiscord}
                            isDisabled={!discordId || discordId.length < 17}
                            flex={1}
                          >
                            Link Discord
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditingDiscord(false);
                              setDiscordId('');
                            }}
                            flex={1}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </>
                    )}

                    <Text fontSize="xs" color="gray.200" textAlign="center">
                      Link your Discord to use bot commands like !trade and !applybuff
                    </Text>
                  </VStack>
                )}
              </>
            )}
          </Section>
          {isCurrentUser && <InvitationSection setShownUser={setShownUser} />}
        </Flex>

        {/* Rest of the component remains the same... */}
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
                      scrollbar-width: thin;
                      scrollbar-color: ${theme.colors.purple[400]} rgba(255, 255, 255, 0.1);

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
                    maxHeight={['132px', '212px']}
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
                        cursor: 'pointer',
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
              <Heading marginBottom="24px" size="sm" textAlign="center">
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
                    gridGap={['16px', '24px']}
                    justifyContent="center"
                    marginY="16px"
                  >
                    <Button
                      colorScheme="green"
                      onClick={() =>
                        navigateToBoard({ boardId: shownBoard.board.id, asEditor: false })
                      }
                    >
                      View
                    </Button>{' '}
                    {isCurrentUser && (
                      <Button
                        colorScheme="pink"
                        onClick={() =>
                          navigateToBoard({ boardId: shownBoard.board.id, asEditor: true })
                        }
                      >
                        Edit
                      </Button>
                    )}
                  </Flex>
                ) : (
                  <Flex />
                )}
              </Flex>
            </Flex>
          </Section>
        </Flex>

        {isCurrentUser && (
          <Section flexDirection="column" width="100%">
            <GemTitle gemColor="yellow" size="sm">
              Gielinor Rush Creator
            </GemTitle>
            <Flex
              flexDirection={['column', 'row']}
              gridGap="16px"
              alignItems="center"
              justifyContent="space-around"
            >
              <Flex
                alignItems="center"
                backgroundColor={theme.colors.teal[800]}
                borderRadius="10px"
                flexDirection="column"
                justifyContent="center"
                h="100%"
                w={['100%', '150px']}
                padding="8px"
              >
                <Image
                  src="https://oldschool.runescape.wiki/images/thumb/Pirate_map.png/1200px-Pirate_map.png?9b490"
                  alt="Gielinor Rush Map"
                  maxWidth="128px"
                  maxHeight="128px"
                  h="100%"
                  w="100%"
                  my={3}
                  borderRadius="8px"
                />
              </Flex>
              <VStack>
                <Text fontSize="16px" lineHeight="1.5">
                  Create and manage your own Gielinor Rush events!
                </Text>
                <Text
                  alignItems="center"
                  display="inline-flex"
                  _hover={{
                    borderBottom: `1px solid ${theme.colors.yellow[200]}`,
                    marginBottom: '0px',
                  }}
                  color={theme.colors.yellow[200]}
                  fontWeight="bold"
                  justifyContent="center"
                  marginBottom="1px"
                >
                  <Icon as={MdOutlineMap} marginRight="8px" />
                  <Link to={`/gielinor-rush`}> Go to Gielinor Rush Dashboard</Link>
                </Text>
              </VStack>
            </Flex>
          </Section>
        )}
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
