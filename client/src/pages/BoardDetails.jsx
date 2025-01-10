import React, { useCallback, useEffect, useState } from 'react';
import { Flex, FormControl, FormLabel, Icon, Spinner, Switch, Text } from '@chakra-ui/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GET_BOARD, GET_USER } from '../graphql/queries';
import Section from '../atoms/Section';
import theme from '../theme';
import BingoBoard from '../molecules/BingoBoard';
import { useAuth } from '../providers/AuthProvider';
import useBingoCompletion from '../hooks/useBingoCompletion';
import { CopyIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  DELETE_BOARD,
  DUPLICATE_BINGO_BOARD,
  REPLACE_BINGO_BOARD_LAYOUT,
  SHUFFLE_BINGO_BOARD_LAYOUT,
  UPDATE_BOARD,
} from '../graphql/mutations';
import { useToastContext } from '../providers/ToastProvider';
import { MdOutlineStorage, MdShuffle } from 'react-icons/md';
import AlertModal from '../molecules/AlertModal';
import Description from '../molecules/EditField/Description';
import Category from '../molecules/EditField/Category';
import ColorScheme from '../molecules/EditField/ColorScheme';
import Name from '../molecules/EditField/Name';
import ActiveBonusesList from '../atoms/ActiveBonusesList';
import BoardEditorsField from '../molecules/EditField/BoardEditorsField';
import IsPublic from '../molecules/EditField/IsPublic';
import BonusSettings from '../molecules/EditField/BonusSettings';

const removeTypename = (obj) => {
  const { __typename, ...rest } = obj;
  return rest;
};

const BoardDetails = () => {
  const { user, isAuthenticated } = useAuth();
  const params = useParams();
  const location = useLocation();
  const { data, loading } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });
  const { showToast } = useToastContext();

  const [board, setBoard] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [fieldsEditing, setFieldsEditing] = useState({
    category: false,
    description: false,
    editors: false,
    name: false,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const handleToggle = () => setIsEditMode(!isEditMode);
  const navigate = useNavigate();

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
  const [swapBoardLayout] = useMutation(REPLACE_BINGO_BOARD_LAYOUT);
  const [shuffle] = useMutation(SHUFFLE_BINGO_BOARD_LAYOUT);

  const onSwap = useCallback(
    async (newType) => {
      await swapBoardLayout({
        variables: {
          boardId: board?.id,
          newType,
        },
      });
    },
    [board?.id, swapBoardLayout]
  );

  const onDelete = useCallback(async () => {
    const { data } = await deleteBoard({
      variables: {
        id: board?.id,
      },
    });

    if (data?.deleteBingoBoard?.success) {
      navigate(`/user/${user?.id}`);
    }
  }, [board?.id, deleteBoard, navigate, user?.id]);

  const handleDuplicate = useCallback(async () => {
    try {
      const { data } = await duplicateBoard({ variables: { boardId: board?.id } });
      navigate(`/boards/${data.duplicateBingoBoard?.id}`);
      showToast('Duplicated board successfully!', 'success');
    } catch (error) {
      console.error('Error duplicating board:', error.message);
    }
  }, [board?.id, duplicateBoard, navigate, showToast]);

  const handleShuffle = useCallback(async () => {
    try {
      const { data } = await shuffle({ variables: { boardId: board?.id } });
      navigate(`/boards/${data.shuffleBingoBoardLayout?.id}`);
      showToast('Shuffled board successfully!', 'success');
    } catch (error) {
      console.error('Error shuffling board:', error.message);
    }
  }, [board?.id, shuffle, navigate, showToast]);

  const [localLayout, setLocalLayout] = useState([]);
  const [droppedTile, setDroppedTile] = useState(null); // last dropped tile

  useEffect(() => {
    if (data?.getBingoBoard) {
      const { layout, tiles } = data.getBingoBoard;

      const renderedLayout = layout.map((row) =>
        row.map((tileId) => tiles.find((tile) => tile?.id === tileId))
      );

      setBoard({ ...data.getBingoBoard, layout: renderedLayout });
      setLocalLayout(renderedLayout); // separate layout for drag-and-drop
    } else {
      setBoard('Not Found');
    }
  }, [data?.getBingoBoard, setBoard]);

  const onTileSwap = async (source, target) => {
    // Ensure source and target coordinates are valid
    if (source.row === target.row && source.col === target.col) return; // No swap needed if source and target are the same

    // clone the current layout for optimistic update
    const previousLayout = [...localLayout];
    const updatedLayout = [...localLayout];

    // perform the tile swap
    const sourceTile = updatedLayout[source.row][source.col];
    const targetTile = updatedLayout[target.row][target.col];
    updatedLayout[source.row][source.col] = targetTile;
    updatedLayout[target.row][target.col] = sourceTile;

    // optimistically update local layout state
    setLocalLayout(updatedLayout);
    setDroppedTile({ row: target.row, col: target.col });

    // prepare the layout for the backend (convert to just IDs)
    const backendLayout = updatedLayout.map((row) => row.map((tile) => parseInt(tile.id)));

    try {
      // send the updated layout to the backend
      const response = await updateBingoBoard({
        variables: {
          id: board.id,
          input: {
            layout: backendLayout,
          },
        },
      });

      if (response.errors) {
        console.error('Error updating layout on backend:', response.errors);
        // revert to the previous layout if the update fails
        setLocalLayout(previousLayout);
      } else {
        console.log('Board layout successfully updated on backend.');
      }
    } catch (error) {
      console.error('Failed to update board layout on backend:', error);
      // revert to the previous layout if the update fails
      setLocalLayout(previousLayout);
    }
    setTimeout(() => setDroppedTile(null), 500);
  };

  useEffect(() => {
    if (board?.editors?.some((editor) => editor.id === user?.id) || user?.admin) {
      setIsEditor(true);
    }
  }, [board, score, user?.admin, user?.id]);

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

        if (data.getBingoBoard.isPublic || isEditor || user?.admin) {
          setBoard({ ...data.getBingoBoard, layout: renderedLayout });
        } else {
          navigate('/');
        }
      }
    }
  }, [data, loading, navigate, user?.admin]);

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

        <BonusSettings
          board={board}
          canEdit={isEditor && isEditMode}
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
            if (data.updateBingoBoard) {
              setBoard({
                ...data.updateBingoBoard,
                ...board,
                bonusSettings: {
                  ...removeTypename(data?.updateBingoBoard?.bonusSettings),
                  ...val,
                },
              });
            }
          }}
        />
      </Flex>

      {board && board.name ? (
        <>
          <Section flexDirection="column" maxWidth="720px" width="100%">
            <Name
              board={board}
              canEdit={isEditor && isEditMode}
              fieldActive={fieldsEditing.name}
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
              onClickEdit={() =>
                setFieldsEditing({
                  ...fieldsEditing,
                  name: true,
                })
              }
            />
            <Description
              board={board}
              canEdit={isEditor && isEditMode}
              fieldActive={fieldsEditing.description}
              MUTATION={UPDATE_BOARD}
              onClickEdit={() => {
                setFieldsEditing({
                  ...fieldsEditing,
                  description: true,
                });
              }}
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
            />

            <BoardEditorsField
              board={board}
              canEdit={isEditor && isEditMode}
              fieldActive={fieldsEditing.editors}
              onClickEdit={() =>
                setFieldsEditing({
                  ...fieldsEditing,
                  editors: true,
                })
              }
              onSave={() =>
                setFieldsEditing({
                  ...fieldsEditing,
                  editors: false,
                })
              }
            />
            <ActiveBonusesList board={board} />
            <Category
              board={board}
              canEdit={isEditor && isEditMode}
              fieldActive={fieldsEditing.category}
              onChange={async (e) => {
                const { data } = await updateBingoBoard({
                  variables: {
                    id: board.id,
                    input: {
                      category: e.target.value,
                    },
                  },
                });

                setBoard({
                  ...data.updateBingoBoard,
                  ...board,
                  category: e.target.value,
                });
                setFieldsEditing({
                  ...fieldsEditing,
                  category: false,
                });
              }}
              onClickEdit={() =>
                setFieldsEditing({
                  ...fieldsEditing,
                  category: true,
                })
              }
              user={user}
            />
            <ColorScheme
              board={board}
              canEdit={isEditor && isEditMode}
              onChange={async (e) => {
                const { data } = await updateBingoBoard({
                  variables: {
                    id: board.id,
                    input: {
                      theme: e.target.value,
                    },
                  },
                });
                setBoard({
                  ...data.updateBingoBoard,
                  ...board,
                  theme: e.target.value,
                });
              }}
            />
            <IsPublic
              board={board}
              canEdit={isEditor && isEditMode}
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
            />
          </Section>

          <Flex alignItems="center" flexDirection="column" justifyContent="center" marginTop="36px">
            {totalPossibleScore > 0 && (
              <Flex marginBottom="24px">
                <Text fontSize="24px">
                  Score:{' '}
                  <span style={{ color: score > 0 ? theme.colors.green[200] : 'inherit' }}>
                    {score}
                  </span>{' '}
                  / {totalPossibleScore}
                </Text>
              </Flex>
            )}
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
                lastDroppedTile={droppedTile}
                layout={localLayout}
                themeName={board.theme}
                onTileSwap={onTileSwap}
              />
            )}
            <Flex
              alignItems="center"
              flexDirection={['column', 'column', 'row']}
              justifyContent="space-between"
              marginTop="16px"
              width="100%"
            >
              {(user?.id === board.userId || user?.admin) && isEditMode ? (
                <AlertModal
                  actionButtonText="Delete"
                  buttonText="Delete Board"
                  dialogHeader="Delete Bingo Board"
                  dialogBody="Are you sure? You can't undo this action afterwards."
                  icon={<DeleteIcon />}
                  onClickAction={onDelete}
                />
              ) : null}

              {isEditor && isEditMode ? (
                <AlertModal
                  actionButtonText="Swap"
                  buttonText={`Swap to ${board.type === 'FIVE' ? '7x7' : '5x5'} Board`}
                  colorScheme="purple"
                  dialogHeader="Swap Board Type and Replace Tiles"
                  dialogBody="Are you sure? You can't undo this action afterwards, and it will erase any
                          tile data you've changed so far."
                  icon={<EditIcon />}
                  onClickAction={async () => await onSwap(board.type === 'FIVE' ? 'SEVEN' : 'FIVE')}
                />
              ) : (
                <Flex />
              )}

              <AlertModal
                actionButtonText={isAuthenticated() ? 'Duplicate' : 'Okay'}
                buttonText="Duplicate Board"
                colorScheme="yellow"
                dialogHeader={
                  isAuthenticated() ? 'Duplicate Bingo Board' : 'You must log in to do that.'
                }
                dialogBody={
                  isAuthenticated()
                    ? 'Copy an incomplete version of this board to your own collection?'
                    : 'Log in to manage your own boards!'
                }
                icon={<CopyIcon />}
                onClickAction={isAuthenticated() ? handleDuplicate : () => {}}
              />
            </Flex>
            {isEditor && isEditMode && (
              <Flex margin="0 auto" marginTop="16px">
                <AlertModal
                  actionButtonText="Shuffle"
                  buttonText="Shuffle Tiles"
                  colorScheme="cyan"
                  dialogHeader="Shuffle Bingo Board"
                  dialogBody="Are you sure you want to shuffle your board tiles? You can't undo this."
                  icon={<MdShuffle />}
                  onClickAction={handleShuffle}
                />
              </Flex>
            )}
          </Flex>
        </>
      ) : (
        <Spinner />
      )}
    </Flex>
  );
};

export default BoardDetails;
