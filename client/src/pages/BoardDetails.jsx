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
  FormControl,
  FormLabel,
  Switch,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@apollo/client';
import { GET_BOARD } from '../graphql/queries';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import BingoBoard from '../molecules/BingoBoard';
import { useAuth } from '../providers/AuthProvider';
import useBingoCompletion from '../hooks/useBingoCompletion';
import { DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { DELETE_BOARD, UPDATE_BOARD } from '../graphql/mutations';
import Markdown from '../atoms/Markdown';
import EditField from '../molecules/EditField';
import ExpandableText from '../atoms/ExpandableText';

const BoardDetails = () => {
  const { user } = useAuth();
  const params = useParams();
  const { data, loading } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [board, setBoard] = useState(null);
  const [isEditor, setIsEditor] = useState(false);
  const [fieldsEditing, setFieldsEditing] = useState({
    description: false,
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const handleToggle = () => setIsEditMode(!isEditMode);
  const navigate = useNavigate();
  const cancelRef = useRef();
  // todo use score from here
  const { completedPatterns, score } = useBingoCompletion(board?.layout, board?.bonusSettings);

  const [deleteBoard] = useMutation(DELETE_BOARD);

  const onDelete = useCallback(async () => {
    const { data } = await deleteBoard({
      variables: {
        id: board?.id,
      },
    });

    if (data?.deleteBingoBoard?.success) {
      navigate(`/user/${user?.id}`);
      onClose();
    }
  }, [board?.id, deleteBoard, navigate, onClose, user?.id]);

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
    if (board?.editors?.includes(user?.id)) {
      setIsEditor(true);
    }
  }, [board, user?.id]);

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
      {board && (
        <>
          <Section flexDirection="column">
            <GemTitle marginBottom={isEditMode ? '16px' : undefined}>{board.name}</GemTitle>
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
                      _hover={{ backgroundColor: theme.colors.green[800] }}
                      color={theme.colors.green[300]}
                      margin="0 auto"
                      onClick={() =>
                        setFieldsEditing({
                          ...fieldsEditing,
                          description: true,
                        })
                      }
                      position="absolute"
                      right="0"
                      textDecoration="underline"
                      top="16px"
                      variant="ghost"
                      width="fit-content"
                    >
                      <EditIcon />
                    </Button>
                  )}
                  {board?.description && <ExpandableText limit={350} text={board?.description} />}
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
          </Section>

          <Flex alignItems="center" flexDirection="column" justifyContent="center" marginTop="36px">
            {isEditor && (
              <FormControl alignItems="center" display="flex" marginBottom="4px" marginLeft="8px">
                <FormLabel htmlFor="edit-mode" marginBottom="0">
                  Edit Mode:
                </FormLabel>
                <Switch id="edit-mode" isChecked={isEditMode} onChange={handleToggle} />
                <Text marginLeft="8px">{isEditMode ? 'Enabled' : 'Disabled'}</Text>
              </FormControl>
            )}
            <BingoBoard
              completedPatterns={completedPatterns}
              isEditor={isEditor && isEditMode}
              layout={board.layout}
            />
            {isEditor && isEditMode && (
              <>
                <Button
                  _hover={{
                    border: '1px solid white',
                    padding: '4px',
                  }}
                  leftIcon={<DeleteIcon />}
                  marginBottom="1px"
                  marginTop="48px"
                  onClick={onOpen}
                  padding="6px"
                  textAlign="center"
                  variant="unstyled"
                  width="fit-content"
                >
                  Delete Board
                </Button>
                <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
                  <AlertDialogOverlay>
                    <AlertDialogContent>
                      <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Delete Bingo Board
                      </AlertDialogHeader>

                      <AlertDialogBody>
                        Are you sure? You can't undo this action afterwards.
                      </AlertDialogBody>

                      <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
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
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default BoardDetails;
