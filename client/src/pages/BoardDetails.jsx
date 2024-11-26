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
import { DeleteIcon } from '@chakra-ui/icons';
import { DELETE_BOARD } from '../graphql/mutations';

const BoardDetails = () => {
  const { user } = useAuth();
  const params = useParams();
  const { data, loading } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [board, setBoard] = useState(data?.getBingoBoard);
  const [isEditor, setIsEditor] = useState(false);
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

    console.log({ data });

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
    }
  }, [data?.getBingoBoard, setBoard]);

  useEffect(() => {
    if (board?.editors?.includes(user?.id)) {
      setIsEditor(true);
    }
  }, [board, user?.id]);

  useEffect(() => {
    if ((board && !isEditor && !board.isPublic) || (!board && !loading)) {
      navigate('/error');
    }

    // if (!board && !loading) {
    //   navigate('/')
    // }
  }, [isEditor, board, navigate, loading]);

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
            <GemTitle>{board.name}</GemTitle>
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
          </Section>

          <Flex alignItems="center" flexDirection="column" justifyContent="center" marginTop="36px">
            <BingoBoard
              completedPatterns={completedPatterns}
              isEditor={isEditor}
              layout={board.layout}
            />
            {isEditor && (
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
