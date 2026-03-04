import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Image,
  ListItem,
  SimpleGrid,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '../providers/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../graphql/queries';
import GnomeChild from '../assets/gnomechild.png';
import { AddIcon } from '@chakra-ui/icons';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';
import usePageTitle from '../hooks/usePageTitle';

export default function BingoPage() {
  usePageTitle('Bingo Boards');
  const { user, isCheckingAuth } = useAuth();
  const navigate = useNavigate();

  const [shownUser, setShownUser] = useState(null);
  const [shownBoard, setShownBoard] = useState({ board: null, grid: null });

  const { loading } = useQuery(GET_USER, {
    variables: { id: parseInt(user?.id, 10) },
    skip: !user,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.getUser) setShownUser(data.getUser);
    },
  });

  useEffect(() => {
    if (!isCheckingAuth && !user) navigate('/');
  }, [isCheckingAuth, user, navigate]);

  useEffect(() => {
    const grid = getMiniBoardGrid(shownBoard.board);
    setShownBoard((prev) => ({ ...prev, grid }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownBoard.board]);

  const navigateToBoard = ({ asEditor, boardId }) => {
    navigate(`/boards/${boardId}`, asEditor ? { state: { isEditMode: true } } : undefined);
  };

  if (!user || loading) return null;

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
      <Section flexDirection="column" gridGap="16px" pt={8} maxWidth="860px" width="100%">
        <GemTitle gemColor="purple" textAlign="center">
          Your Bingo Boards
        </GemTitle>

        <Box
          bg="whiteAlpha.200"
          borderRadius="lg"
          p={5}
          border="1px solid"
          borderColor="whiteAlpha.200"
          borderLeft="3px solid"
          borderLeftColor="purple.500"
        >
          <Text fontSize="sm" color="gray.300" mb={3}>
            Build custom bingo boards for any OSRS goal: boss kills, collection log slots, skill
            milestones, diary completions, you name it! Share them with your clan or keep them
            private for personal tracking.
          </Text>
          <SimpleGrid columns={[1, 2]} spacing={3}>
            <VStack
              align="flex-start"
              borderLeft="2px pink solid"
              borderRadius="4px"
              bg="whiteAlpha.100"
              p="4px"
              pl="8px"
              spacing={0}
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.300">
                Pick a tile for me
              </Text>
              <Text fontSize="xs" color="gray.300">
                Randomly selects an incomplete tile to work on next
              </Text>
            </VStack>
            <VStack
              align="flex-start"
              borderLeft="2px pink solid"
              borderRadius="4px"
              bg="whiteAlpha.100"
              p="4px"
              pl="8px"
              spacing={0}
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.300">
                Tile suggestions
              </Text>
              <Text fontSize="xs" color="gray.300">
                Browse popular tiles sourced from existing community boards
              </Text>
            </VStack>
            <VStack
              align="flex-start"
              borderLeft="2px pink solid"
              borderRadius="4px"
              bg="whiteAlpha.100"
              p="4px"
              pl="8px"
              spacing={0}
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.300">
                Duplicate boards
              </Text>
              <Text fontSize="xs" color="gray.300">
                Clone any board as a starting point for a new one
              </Text>
            </VStack>
            <VStack
              align="flex-start"
              borderLeft="2px pink solid"
              borderRadius="4px"
              bg="whiteAlpha.100"
              p="4px"
              pl="8px"
              spacing={0}
            >
              <Text fontSize="xs" fontWeight="bold" color="purple.300">
                Editor invites & sharing
              </Text>
              <Text fontSize="xs" color="gray.300">
                Invite clanmates to co-edit, or make a board public for the community
              </Text>
            </VStack>
          </SimpleGrid>
        </Box>

        <Flex flexDirection={['column', 'column', 'row', 'row']} gridGap="16px">
          {/* Board list */}
          <Section flexDirection="column" width="100%">
            <Flex flexDirection="column">
              {!shownUser?.editorBoards || shownUser.editorBoards.length === 0 ? (
                <>
                  <Text textAlign="center">
                    Looks like you haven't made or been added as an editor to any boards yet.
                  </Text>
                  <Text
                    _hover={{
                      borderBottom: `1px solid ${theme.colors.pink[200]}`,
                      marginBottom: '0px',
                    }}
                    color={theme.colors.pink[200]}
                    fontWeight="semibold"
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
                    {shownUser.editorBoards.map((item) => (
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
                        onClick={() => setShownBoard((prev) => ({ ...prev, board: item }))}
                        width="fit-content"
                      >
                        {item.name}
                      </ListItem>
                    ))}
                  </UnorderedList>
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
                      _hover={{ backgroundColor: theme.colors.purple[300] }}
                      backgroundColor={theme.colors.purple[400]}
                      borderRadius="8px"
                      color={theme.colors.pink[900]}
                      cursor="pointer"
                      fontWeight="semibold"
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
                </Flex>
              )}
            </Flex>
          </Section>

          {/* Board preview */}
          <Section flexDirection="column" width="100%">
            <Flex flexDirection="column" justifyContent="space-between" height="100%">
              <Heading fontWeight="semibold" marginBottom="24px" size="sm" textAlign="center">
                {shownBoard.board?.name
                  ? `Preview: ${shownBoard.board.name}`
                  : 'Click a board from the list to preview it.'}
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
                {shownBoard.board !== null && (
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
                    </Button>
                    <Button
                      colorScheme="pink"
                      onClick={() =>
                        navigateToBoard({ boardId: shownBoard.board.id, asEditor: true })
                      }
                    >
                      Edit
                    </Button>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Section>
        </Flex>
      </Section>
    </Flex>
  );
}
