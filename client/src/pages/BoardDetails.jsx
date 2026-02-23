import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Icon,
  Spinner,
  Switch,
  Text,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertDescription,
} from '@chakra-ui/react';
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
import RandomTilePickerModal from '../organisms/RandomTilePickerModal';
import usePageTitle from '../hooks/usePageTitle';

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
  usePageTitle(data?.getBingoBoard?.name || 'Bingo Board');
  const { showToast } = useToastContext();
  const { isOpen: isPickerOpen, onOpen: onPickerOpen, onClose: onPickerClose } = useDisclosure();
  const [board, setBoard] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [fieldsEditing, setFieldsEditing] = useState({
    category: false,
    description: false,
    editors: false,
    name: false,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const handleToggle = () => setIsEditMode((prev) => !prev);
  const navigate = useNavigate();

  const { completedPatterns, score, totalPossibleScore } = useBingoCompletion(
    board?.layout,
    board?.bonusSettings
  );

  const [deleteBoard] = useMutation(DELETE_BOARD, {
    update(cache, { data: { deleteBingoBoard } }) {
      try {
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
                  (b) => b.id !== deleteBingoBoard.id
                ),
              },
            },
          });
        }
      } catch (cacheErr) {
        console.warn('Cache update failed:', cacheErr);
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
    const { data } = await deleteBoard({ variables: { id: board?.id } });
    if (data?.deleteBingoBoard?.success) {
      showToast('Board deleted.', 'success');
      navigate(`/user/${user?.id}`);
    }
  }, [board?.id, deleteBoard, navigate, showToast, user?.id]);

  const handleDuplicate = useCallback(async () => {
    try {
      const { data } = await duplicateBoard({ variables: { boardId: board?.id } });
      const newId = data?.duplicateBingoBoard?.id;
      if (!newId) {
        showToast('Failed to duplicate board.', 'error');
        return;
      }
      showToast('Duplicated board successfully!', 'success');
      navigate(`/boards/${newId}`);
    } catch (error) {
      console.error('Error duplicating board:', error.message);
      showToast('Failed to duplicate board.', 'error');
    }
  }, [board?.id, duplicateBoard, navigate, showToast]);

  const handleShuffle = useCallback(async () => {
    try {
      const { data } = await shuffle({ variables: { boardId: board?.id } });
      const newId = data?.shuffleBingoBoardLayout?.id;
      if (!newId) {
        showToast('Failed to shuffle board.', 'error');
        return;
      }
      showToast('Shuffled board successfully!', 'success');
      navigate(`/boards/${newId}`);
    } catch (error) {
      console.error('Error shuffling board:', error.message);
      showToast('Failed to shuffle board.', 'error');
    }
  }, [board?.id, shuffle, navigate, showToast]);

  const [localLayout, setLocalLayout] = useState([]);
  const [droppedTile, setDroppedTile] = useState(null);

  const buildRenderedLayout = (rawBoard) => {
    const { layout, tiles } = rawBoard;
    return layout.map((row) => row.map((tileId) => tiles.find((tile) => tile?.id === tileId)));
  };

  useEffect(() => {
    if (data?.getBingoBoard) {
      const renderedLayout = buildRenderedLayout(data.getBingoBoard);
      setBoard({ ...data.getBingoBoard, layout: renderedLayout });
      setLocalLayout(renderedLayout);
    } else if (!loading) {
      setBoard('Not Found');
    }
  }, [data?.getBingoBoard, loading]);

  const onTileSwap = async (source, target) => {
    if (source.row === target.row && source.col === target.col) return;

    const previousLayout = [...localLayout];
    const updatedLayout = localLayout.map((row) => [...row]);

    const sourceTile = updatedLayout[source.row][source.col];
    const targetTile = updatedLayout[target.row][target.col];
    updatedLayout[source.row][source.col] = targetTile;
    updatedLayout[target.row][target.col] = sourceTile;

    setLocalLayout(updatedLayout);
    setDroppedTile({ row: target.row, col: target.col });

    const backendLayout = updatedLayout.map((row) => row.map((tile) => parseInt(tile.id)));

    try {
      const response = await updateBingoBoard({
        variables: { id: board.id, input: { layout: backendLayout } },
      });

      if (response.errors) {
        console.error('Error updating layout on backend:', response.errors);
        setLocalLayout(previousLayout);
      }
    } catch (error) {
      console.error('Failed to update board layout on backend:', error);
      setLocalLayout(previousLayout);
    }
    setTimeout(() => setDroppedTile(null), 500);
  };

  useEffect(() => {
    if (!board || board === 'Not Found') return;

    if (board?.editors?.some((editor) => editor.id === user?.id) || user?.admin) {
      setIsEditor(true);
    } else if (user && data?.getBingoBoard?.isPublic === false) {
      navigate('/');
    }
  }, [board, data?.getBingoBoard?.isPublic, navigate, user]);

  useEffect(() => {
    if (location.state?.isEditMode) {
      setIsEditMode(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!loading && !data?.getBingoBoard) {
      navigate('/error');
    }
  }, [data, loading, navigate]);

  if (loading || !board) {
    return (
      <Flex alignItems="center" justifyContent="center" flex="1" height="100%">
        <Spinner size="xl" />
      </Flex>
    );
  }

  const boardCreatedBefore = board?.createdAt
    ? new Date(board.createdAt) < new Date('2025-10-01')
    : true;

  const hasMissingIcons =
    boardCreatedBefore &&
    board?.layout?.some((row) => row.some((tile) => tile && tile.icon === null && tile.name));

  if (board === 'Not Found') return null;

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
        flexDirection={['column', 'row']}
        justifyContent="space-between"
        marginBottom="16px"
        maxWidth="720px"
        width="100%"
      >
        <Text
          alignItems="center"
          display="inline-flex"
          _hover={{ borderBottom: '1px solid white', marginBottom: '0px' }}
          fontWeight="semibold"
          marginBottom="1px"
        >
          <Icon as={MdOutlineStorage} marginRight="8px" />
          <Link to="/boards">View Public Boards</Link>
        </Text>

        <BonusSettings
          board={board}
          canEdit={isEditor && isEditMode}
          onUpdateField={async (val) => {
            const { data } = await updateBingoBoard({
              variables: {
                id: board.id,
                input: { bonusSettings: { ...val } },
              },
            });
            if (data.updateBingoBoard) {
              setBoard({
                ...board,
                ...data.updateBingoBoard,
                bonusSettings: {
                  ...removeTypename(data.updateBingoBoard.bonusSettings),
                  ...val,
                },
              });
            }
          }}
        />
      </Flex>

      <Section flexDirection="column" maxWidth="720px" width="100%">
        <Name
          board={board}
          canEdit={isEditor && isEditMode}
          fieldActive={fieldsEditing.name}
          MUTATION={UPDATE_BOARD}
          onSave={(data, val) => {
            setBoard({ ...board, ...data.updateBingoBoard, name: val });
            setFieldsEditing({ ...fieldsEditing, name: false });
          }}
          onClickEdit={() => setFieldsEditing({ ...fieldsEditing, name: true })}
        />
        <Description
          board={board}
          canEdit={isEditor && isEditMode}
          fieldActive={fieldsEditing.description}
          MUTATION={UPDATE_BOARD}
          onClickEdit={() => setFieldsEditing({ ...fieldsEditing, description: true })}
          onSave={(data, val) => {
            setBoard({ ...board, ...data.updateBingoBoard, description: val });
            setFieldsEditing({ ...fieldsEditing, description: false });
          }}
        />
        <BoardEditorsField
          board={board}
          canEdit={isEditor && isEditMode}
          fieldActive={fieldsEditing.editors}
          onClickEdit={() => setFieldsEditing({ ...fieldsEditing, editors: true })}
          onSave={() => setFieldsEditing({ ...fieldsEditing, editors: false })}
        />
        <ActiveBonusesList board={board} />
        <Category
          board={board}
          canEdit={isEditor && isEditMode}
          fieldActive={fieldsEditing.category}
          onChange={async (e) => {
            const { data } = await updateBingoBoard({
              variables: { id: board.id, input: { category: e.target.value } },
            });
            setBoard({ ...board, ...data.updateBingoBoard, category: e.target.value });
            setFieldsEditing({ ...fieldsEditing, category: false });
          }}
          onClickEdit={() => setFieldsEditing({ ...fieldsEditing, category: true })}
          user={user}
        />
        <ColorScheme
          board={board}
          canEdit={isEditor && isEditMode}
          onChange={async (e) => {
            const { data } = await updateBingoBoard({
              variables: { id: board.id, input: { theme: e.target.value } },
            });
            setBoard({ ...board, ...data.updateBingoBoard, theme: e.target.value });
          }}
        />
        <IsPublic
          board={board}
          canEdit={isEditor && isEditMode}
          onChange={async () => {
            const { data } = await updateBingoBoard({
              variables: { id: board.id, input: { isPublic: !board.isPublic } },
            });
            setBoard({ ...board, ...data.updateBingoBoard, isPublic: !board.isPublic });
          }}
        />
      </Section>

      <Flex
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        marginTop="36px"
        width="100%"
        maxWidth="720px"
      >
        {totalPossibleScore > 0 && (
          <Text fontSize="24px" marginBottom="24px">
            Score:{' '}
            <span style={{ color: score > 0 ? theme.colors.green[200] : 'inherit' }}>{score}</span>{' '}
            / {totalPossibleScore}
          </Text>
        )}

        {isEditor && (
          <Flex
            px="6px"
            w="100%"
            alignItems="center"
            justifyContent="space-between"
            marginBottom="8px"
          >
            <Button
              leftIcon={<span>🎲</span>}
              colorScheme="purple"
              onClick={onPickerOpen}
              isDisabled={!board?.layout}
            >
              Pick my next tile!
            </Button>

            <FormControl maxW="fit-content" alignItems="center" display="flex">
              <FormLabel htmlFor="edit-mode" marginBottom="0">
                Edit Mode:
              </FormLabel>
              <Switch id="edit-mode" isChecked={isEditMode} onChange={handleToggle} />
              <Text marginLeft="8px">{isEditMode ? 'Enabled' : 'Disabled'}</Text>
            </FormControl>
          </Flex>
        )}

        {hasMissingIcons && process.env.REACT_APP_MISSING_TILES_BANNER && (
          <Alert
            status="info"
            colorScheme="blue"
            borderRadius="md"
            marginBottom="12px"
            fontSize="sm"
            color="gray.600"
          >
            <AlertIcon />
            <AlertDescription>
              Some old base64 tile icons were removed during a performance cleanup to keep the site
              running smoothly. You can re-select them by clicking any tile and using the icon
              search. Sorry for any inconvenience, love you! ❤️, Lemon The Dev
            </AlertDescription>
          </Alert>
        )}

        <BingoBoard
          boardId={board.id}
          completedPatterns={completedPatterns}
          isEditor={isEditor && isEditMode}
          lastDroppedTile={droppedTile}
          layout={localLayout}
          themeName={board.theme}
          onTileSwap={onTileSwap}
        />

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
          ) : (
            <Flex />
          )}

          {isEditor && isEditMode ? (
            <AlertModal
              actionButtonText="Swap"
              buttonText={`Swap to ${board.type === 'FIVE' ? '7x7' : '5x5'} Board`}
              colorScheme="purple"
              dialogHeader="Swap Board Type and Replace Tiles"
              dialogBody="Are you sure? You can't undo this action afterwards, and it will erase any tile data you've changed so far."
              icon={<EditIcon />}
              onClickAction={async () => await onSwap(board.type === 'FIVE' ? 'SEVEN' : 'FIVE')}
            />
          ) : (
            <Flex />
          )}

          <AlertModal
            actionButtonText={isAuthenticated ? 'Duplicate' : 'Okay'}
            buttonText="Duplicate Board"
            colorScheme="yellow"
            dialogHeader={isAuthenticated ? 'Duplicate Bingo Board' : 'You must log in to do that.'}
            dialogBody={
              isAuthenticated
                ? 'Copy an incomplete version of this board to your own collection?'
                : 'Log in to manage your own boards!'
            }
            icon={<CopyIcon />}
            onClickAction={isAuthenticated ? handleDuplicate : () => {}}
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

      {isPickerOpen && (
        <RandomTilePickerModal
          isOpen={isPickerOpen}
          onClose={onPickerClose}
          tiles={localLayout}
          themeName={board?.theme}
        />
      )}
    </Flex>
  );
};

export default BoardDetails;
