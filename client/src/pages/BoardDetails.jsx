import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Spinner,
  Switch,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GET_BOARD, GET_USER } from '../graphql/queries';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import BingoBoard from '../molecules/BingoBoard';
import { useAuth } from '../providers/AuthProvider';
import useBingoCompletion from '../hooks/useBingoCompletion';
import { CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { DELETE_BOARD, DUPLICATE_BINGO_BOARD, UPDATE_BOARD } from '../graphql/mutations';
import EditField from '../molecules/EditField';
import ExpandableText from '../atoms/ExpandableText';
import { useToastContext } from '../providers/ToastProvider';
import BoardEditors from '../organisms/BoardEditors';
import BonusSettingsModal from '../molecules/BonusSettingsModal';

const removeTypename = (obj) => {
  const { __typename, ...rest } = obj;
  return rest;
};

const BoardDetails = () => {
  const { user } = useAuth();
  const params = useParams();
  const location = useLocation();
  const { data, loading } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });
  const { showToast } = useToastContext();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onOpenDeleteAlert,
    onClose: onCloseDeleteAlert,
  } = useDisclosure();
  const {
    isOpen: isDupeAlertOpen,
    onOpen: onOpenDupeAlert,
    onClose: onCloseDupeAlert,
  } = useDisclosure();
  const {
    isOpen: isBonusSettingsModalOpen,
    onOpen: onOpenBonusSettingsModal,
    onClose: onCloseBonusSettingsModal,
  } = useDisclosure();

  const [board, setBoard] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [fieldsEditing, setFieldsEditing] = useState({
    description: false,
    editors: false,
    name: false,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const handleToggle = () => setIsEditMode(!isEditMode);
  const navigate = useNavigate();
  const cancelRef = useRef();

  const { completedPatterns, score, totalPossibleScore } = useBingoCompletion(
    board?.layout,
    board?.bonusSettings
  );

  const [deleteBoard] = useMutation(DELETE_BOARD, {
    update(cache, { data: { deleteBingoBoard } }) {
      const existingData = cache.readQuery({
        query: GET_USER,
        variables: { id: user.id },
      });

      if (existingData) {
        cache.writeQuery({
          query: GET_USER,
          variables: { id: user.id },
          data: {
            getUser: {
              ...existingData.getUser,
              bingoBoards: existingData.getUser.bingoBoards.filter(
                (board) => board.id !== deleteBingoBoard.id
              ),
            },
          },
        });
      }
    },
  });

  const [duplicateBoard] = useMutation(DUPLICATE_BINGO_BOARD);
  const [updateBingoBoard] = useMutation(UPDATE_BOARD);

  const onDelete = useCallback(async () => {
    const { data } = await deleteBoard({
      variables: {
        id: board?.id,
      },
    });

    if (data?.deleteBingoBoard?.success) {
      navigate(`/user/${user?.id}`);
      onCloseDeleteAlert();
    }
  }, [board?.id, deleteBoard, navigate, onCloseDeleteAlert, user?.id]);

  const handleDuplicate = useCallback(async () => {
    try {
      const { data } = await duplicateBoard({ variables: { boardId: board?.id } });
      navigate(`/boards/${data.duplicateBingoBoard?.id}`);
      onCloseDupeAlert();
      showToast('Duplicated board successfully!', 'success');
    } catch (error) {
      console.error('Error duplicating board:', error.message);
    }
  }, [board?.id, duplicateBoard, navigate, onCloseDupeAlert, showToast]);

  useEffect(() => {
    if (data?.getBingoBoard) {
      const { layout, tiles } = data.getBingoBoard;

      // replace IDs in layout with full tile details
      const renderedLayout = layout.map((row) =>
        row.map((tileId) => tiles.find((tile) => tile?.id === tileId))
      );

      // update the board with the processed layout
      setBoard({ ...data.getBingoBoard, layout: renderedLayout });
    } else {
      setBoard('Not Found');
    }
  }, [data?.getBingoBoard, setBoard]);

  useEffect(() => {
    if (board?.editors?.some((editor) => editor.id === user?.id)) {
      setIsEditor(true);
    }
  }, [board, score, user?.id]);

  useEffect(() => {
    if (location.state?.isEditMode) {
      setIsEditMode(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!loading) {
      if (!data?.getBingoBoard) {
        navigate('/error');
      } else {
        const { layout, tiles } = data.getBingoBoard;

        const renderedLayout = layout.map((row) =>
          row.map((tileId) => tiles.find((tile) => tile?.id === tileId))
        );

        setBoard({ ...data.getBingoBoard, layout: renderedLayout });
      }
    }
  }, [data, loading, navigate]);

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      <Flex
        alignItems="center"
        flexDirection={['column', 'row', 'row']}
        justifyContent="space-between"
        marginBottom="16px"
        maxWidth="720px"
        width="100%"
      >
        <Text
          _hover={{
            borderBottom: '1px solid white',
            marginBottom: '0px',
          }}
          fontWeight="bold"
          marginBottom="1px"
        >
          <Link to="/boards">→ View All Boards</Link>
        </Text>
        {isEditor && isEditMode && (
          <Button
            _hover={{ backgroundColor: theme.colors.teal[800] }}
            color={theme.colors.teal[300]}
            onClick={onOpenBonusSettingsModal}
            textDecoration="underline"
            variant="ghost"
            width="fit-content"
          >
            Edit Board Bonus Settings
          </Button>
        )}
      </Flex>
      {board && (
        <BonusSettingsModal
          board={board}
          isOpen={isBonusSettingsModalOpen}
          onOpen={onOpenBonusSettingsModal}
          onClose={onCloseBonusSettingsModal}
          onUpdateField={async (val) => {
            const { data } = await updateBingoBoard({
              variables: {
                id: board.id,
                input: {
                  bonusSettings: {
                    ...val,
                  },
                },
              },
            });

            setBoard({
              ...data.updateBingoBoard,
              ...board,
              bonusSettings: {
                ...removeTypename(data?.updateBingoBoard?.bonusSettings),
                ...val,
              },
            });
          }}
        />
      )}
      {board && board.name ? (
        <>
          <Section
            flexDirection="column"
            maxWidth="720px"
            width="100%
          "
          >
            {fieldsEditing.name ? (
              <EditField
                defaultValue={board.name}
                entityId={board.id}
                fieldName="name"
                MUTATION={UPDATE_BOARD}
                onSave={(data, val) => {
                  setBoard({
                    ...data.updateBingoBoard,
                    ...board,
                    name: val,
                  });
                  setFieldsEditing({
                    ...fieldsEditing,
                    name: false,
                  });
                }}
                value={board.name}
              />
            ) : (
              isEditor &&
              isEditMode && (
                <Button
                  _hover={{ backgroundColor: theme.colors.teal[800] }}
                  color={theme.colors.teal[300]}
                  margin="0 auto"
                  marginBottom="8px"
                  onClick={() =>
                    setFieldsEditing({
                      ...fieldsEditing,
                      name: true,
                    })
                  }
                  textDecoration="underline"
                  variant="ghost"
                  width="fit-content"
                >
                  Edit Name
                </Button>
              )
            )}
            {!fieldsEditing.name && <GemTitle marginBottom="16px">{board.name}</GemTitle>}
            {/* todo: get list of board editor names from list of user ids  */}
            {/* <Text width="100%">
              <Text
                as="span"
                color={theme.colors.teal[300]}
                display="inline"
                fontWeight="bold"
                marginRight="4px"
              >
                Editors:
              </Text>
              {board.editors.join(', ')}
            </Text> */}
            {/* entityId, fieldName, inputType = 'text', MUTATION, onSave, value */}

            {!fieldsEditing.description ? (
              <>
                <Flex position="relative" flexDirection="column" marginX={['0px', '16px']}>
                  {isEditor && isEditMode && (
                    <Button
                      _hover={{ backgroundColor: theme.colors.teal[800] }}
                      color={theme.colors.teal[300]}
                      margin="0 auto"
                      onClick={() =>
                        setFieldsEditing({
                          ...fieldsEditing,
                          description: true,
                        })
                      }
                      position={!board?.description ? 'static' : 'absolute'}
                      right="0"
                      textDecoration="underline"
                      top="0px"
                      variant="ghost"
                      width="fit-content"
                    >
                      {!board?.description ? 'Add description' : <EditIcon />}
                    </Button>
                  )}
                  {board?.description && (
                    <Section>
                      <ExpandableText limit={350} text={board?.description} />
                    </Section>
                  )}
                </Flex>
              </>
            ) : (
              <>
                <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
                  Note: you can use{' '}
                  <a
                    href="https://www.markdownguide.org/basic-syntax/"
                    style={{
                      color: theme.colors.cyan[300],
                    }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Markdown
                  </a>
                  !
                </Text>
                <EditField
                  defaultValue={board.description}
                  flexDirection="column"
                  entityId={board.id}
                  fieldName="description"
                  inputType="textarea"
                  MUTATION={UPDATE_BOARD}
                  onSave={(data, val) => {
                    setBoard({
                      ...data.updateBingoBoard,
                      ...board,
                      description: val,
                    });
                    setFieldsEditing({
                      ...fieldsEditing,
                      description: false,
                    });
                  }}
                  value={board.description}
                />
              </>
            )}

            <Text
              alignItems="center"
              display="flex"
              justifyContent="center"
              marginTop="16px"
              width="100%"
            >
              <Text
                as="span"
                color={theme.colors.teal[300]}
                display="inline"
                fontWeight="bold"
                marginRight="8px"
              >
                Editor(s):
              </Text>
              <Text>
                {board.editors.map((editor, idx) => (
                  <Link to={`/user/${editor.id}`}>
                    {idx !== 0 ? ', ' : ''}
                    {editor.username}
                  </Link>
                ))}
              </Text>
              {isEditor && isEditMode && (
                <Button
                  _hover={{ backgroundColor: theme.colors.teal[800] }}
                  color={theme.colors.teal[300]}
                  marginLeft="8px"
                  onClick={() =>
                    setFieldsEditing({
                      ...fieldsEditing,
                      editors: true,
                    })
                  }
                  textDecoration="underline"
                  variant="ghost"
                  width="fit-content"
                >
                  <EditIcon />
                </Button>
              )}
            </Text>
            {isEditMode && isEditor && fieldsEditing.editors ? (
              <>
                <BoardEditors
                  boardId={board.id}
                  onSubmit={() =>
                    setFieldsEditing({
                      ...fieldsEditing,
                      editors: false,
                    })
                  }
                />
              </>
            ) : null}
            <Text alignItems="center" display="flex" justifyContent="center" width="100%">
              <Text
                as="span"
                color={theme.colors.teal[300]}
                display="inline"
                fontWeight="bold"
                marginRight="8px"
                marginTop="16px"
              >
                Is Public:
              </Text>
              {isEditor && isEditMode ? (
                <Checkbox
                  colorScheme="teal"
                  borderColor={theme.colors.teal[300]}
                  defaultChecked={board.isPublic}
                  marginRight="16px"
                  marginTop="16px"
                  onChange={async () => {
                    const { data } = await updateBingoBoard({
                      variables: {
                        id: board.id,
                        input: {
                          isPublic: !board.isPublic,
                        },
                      },
                    });

                    setBoard({
                      ...data.updateBingoBoard,
                      ...board,
                      isPublic: !board.isPublic,
                    });
                  }}
                  size="lg"
                />
              ) : (
                <Text marginTop="16px">{board.isPublic ? 'Yes' : 'No'}</Text>
              )}
            </Text>
          </Section>

          <Flex alignItems="center" flexDirection="column" justifyContent="center" marginTop="36px">
            <Flex marginBottom="16px">
              Score: {score}/{totalPossibleScore}
            </Flex>
            {isEditor && (
              <FormControl alignItems="center" display="flex" marginBottom="16px" marginLeft="8px">
                <FormLabel htmlFor="edit-mode" marginBottom="0">
                  Edit Mode:
                </FormLabel>
                <Switch id="edit-mode" isChecked={isEditMode} onChange={handleToggle} />
                <Text marginLeft="8px">{isEditMode ? 'Enabled' : 'Disabled'}</Text>
              </FormControl>
            )}
            {board && (
              <BingoBoard
                boardId={board.id}
                completedPatterns={completedPatterns}
                isEditor={isEditor && isEditMode}
                layout={board.layout}
              />
            )}
            <Flex
              alignItems="center"
              flexDirection={['column', 'column', 'row']}
              justifyContent="space-between"
              marginTop="16px"
              width="100%"
            >
              {user?.id === board.userId && isEditMode ? (
                <>
                  <Button
                    _hover={{
                      border: `1px solid ${theme.colors.red[300]}`,
                      padding: '4px',
                    }}
                    color={theme.colors.red[300]}
                    leftIcon={<DeleteIcon />}
                    marginBottom="1px"
                    onClick={onOpenDeleteAlert}
                    padding="6px"
                    textAlign="center"
                    variant="unstyled"
                    width="fit-content"
                  >
                    Delete Board
                  </Button>
                  <AlertDialog
                    isOpen={isDeleteAlertOpen}
                    leastDestructiveRef={cancelRef}
                    onClose={onCloseDeleteAlert}
                  >
                    <AlertDialogOverlay>
                      <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                          Delete Bingo Board
                        </AlertDialogHeader>
                        <AlertDialogBody>
                          Are you sure? You can't undo this action afterwards.
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
              ) : (
                <Flex />
              )}

              <>
                <Button
                  _hover={{
                    border: `1px solid #f2d202`,
                    padding: '4px',
                  }}
                  color="#f2d202"
                  leftIcon={<CopyIcon />}
                  marginBottom="1px"
                  onClick={onOpenDupeAlert}
                  padding="6px"
                  textAlign="center"
                  variant="unstyled"
                  width="fit-content"
                >
                  Duplicate Board
                </Button>
                <AlertDialog
                  isOpen={isDupeAlertOpen}
                  leastDestructiveRef={cancelRef}
                  onClose={onCloseDupeAlert}
                >
                  <AlertDialogOverlay>
                    <AlertDialogContent>
                      <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Duplicate Bingo Board
                      </AlertDialogHeader>
                      <AlertDialogBody>
                        Copy an incomplete version of this board to your own collection?
                      </AlertDialogBody>
                      <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onCloseDupeAlert}>
                          Cancel
                        </Button>
                        <Button colorScheme="teal" onClick={handleDuplicate} ml={3}>
                          Copy
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogOverlay>
                </AlertDialog>
              </>
            </Flex>
          </Flex>
        </>
      ) : (
        <Spinner />
      )}
    </Flex>
  );
};

export default BoardDetails;
