import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Flex,
  HStack,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '../../providers/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';
import Section from '../../atoms/Section';
import GemTitle from '../../atoms/GemTitle';
import Chip from '../../atoms/Chip';
import HubButton from '../../atoms/HubButton';
import theme from '../../theme';
import { useQuery } from '@apollo/client';
import { GET_USER } from '../../graphql/queries';
import GnomeChild from '../../assets/gnomechild.png';
import { AddIcon, SearchIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { FaDiceD20, FaLightbulb, FaRegClone, FaUserFriends } from 'react-icons/fa';
import MiniBingoBoard from '../../atoms/MiniBingoBoard';
import getMiniBoardGrid from '../../utils/getMiniBoardGrid';
import usePageTitle from '../../hooks/usePageTitle';

const boardStats = (board) => {
  if (!board) return { tileCount: 0, completed: 0, pct: 0, dims: '' };
  const tileCount = board.tiles?.length || 0;
  const completed = board.tiles?.filter((t) => t.isComplete).length || 0;
  const pct = tileCount ? Math.round((completed / tileCount) * 100) : 0;
  const rows = board.layout?.length || 0;
  const cols = board.layout?.[0]?.length || 0;
  const dims = rows && cols ? `${rows}×${cols}` : '';
  return { tileCount, completed, pct, dims };
};

export default function BingoPage() {
  usePageTitle('Bingo Boards');
  const { user, isCheckingAuth } = useAuth();
  const navigate = useNavigate();

  const [shownUser, setShownUser] = useState(null);
  const [shownBoard, setShownBoard] = useState({ board: null, grid: null });
  const [search, setSearch] = useState('');

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

  const boards = shownUser?.editorBoards || [];
  const publicCount = boards.filter((b) => b.isPublic).length;

  const filteredBoards = useMemo(() => {
    if (!search.trim()) return boards;
    const q = search.toLowerCase();
    return boards.filter((b) => b.name.toLowerCase().includes(q));
  }, [boards, search]);

  const navigateToBoard = ({ asEditor, boardId }) => {
    navigate(`/boards/${boardId}`, asEditor ? { state: { isEditMode: true } } : undefined);
  };

  if (!user || loading) return null;

  const previewStats = boardStats(shownBoard.board);

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
      <Section flexDirection="column" gridGap="24px" pt={8} maxWidth="960px" width="100%">
        {/* HERO */}
        <Flex flexDirection="column" gridGap="12px">
          <GemTitle gemColor="purple" textAlign="center">
            Your Bingo Boards
          </GemTitle>
          <Text
            fontSize={['sm', 'md']}
            textAlign="center"
            color="whiteAlpha.800"
            fontWeight="500"
            maxWidth="560px"
            mx="auto"
          >
            Build custom bingo boards for any OSRS goal. Boss kills, collection log slots, skill
            milestones, diary completions, you name it.
          </Text>
          <HStack justify="center" spacing={2} flexWrap="wrap" mt={1}>
            <Chip variant="accent" size="sm">
              {boards.length} {boards.length === 1 ? 'board' : 'boards'}
            </Chip>
            {publicCount > 0 && (
              <Chip variant="info" size="sm">
                {publicCount} public
              </Chip>
            )}
            {boards.length - publicCount > 0 && (
              <Chip variant="default" size="sm">
                {boards.length - publicCount} private
              </Chip>
            )}
          </HStack>
          <Flex justify="center" mt={2}>
            <HubButton
              as={Link}
              to="/boards/create"
              variant="primary"
              accentColor={theme.colors.purple[400]}
              leftIcon={<AddIcon />}
            >
              Create a Board
            </HubButton>
          </Flex>
        </Flex>

        {/* FEATURES BLOCK */}
        <Box>
          <Flex align="center" gap={3} mb={3}>
            <Box flex="1" height="1px" bg="whiteAlpha.200" />
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="purple.200"
              fontWeight="bold"
              fontFamily={theme.fonts.heading}
            >
              What boards can do
            </Text>
            <Box flex="1" height="1px" bg="whiteAlpha.200" />
          </Flex>
          <SimpleGrid columns={[1, 2]} spacing={3}>
            {[
              {
                title: 'Pick a tile for me',
                desc: 'Click once and the board randomly picks an incomplete tile for you.',
                icon: FaDiceD20,
                accent: theme.colors.pink[300],
              },
              {
                title: 'Tile suggestions',
                desc: 'Browse popular tiles from existing community boards to seed yours.',
                icon: FaLightbulb,
                accent: theme.colors.yellow[300],
              },
              {
                title: 'Duplicate boards',
                desc: 'Clone any board (yours or public) as a starting point for a new one.',
                icon: FaRegClone,
                accent: theme.colors.cyan[300],
              },
              {
                title: 'Invite & share',
                desc: 'Add clanmates as co-editors, or make your board public for the community.',
                icon: FaUserFriends,
                accent: theme.colors.green[300],
              },
            ].map((f) => (
              <HStack
                key={f.title}
                align="flex-start"
                spacing={3}
                bg="whiteAlpha.100"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="md"
                px={3}
                py={3}
              >
                <Flex
                  align="center"
                  justify="center"
                  flexShrink={0}
                  w="36px"
                  h="36px"
                  borderRadius="md"
                  bg={`${f.accent}22`}
                  color={f.accent}
                >
                  <Box as={f.icon} fontSize="18px" />
                </Flex>
                <Box minW={0}>
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="white"
                    lineHeight="1.3"
                    fontFamily={theme.fonts.heading}
                  >
                    {f.title}
                  </Text>
                  <Text fontSize="xs" color="gray.400" lineHeight="1.5">
                    {f.desc}
                  </Text>
                </Box>
              </HStack>
            ))}
          </SimpleGrid>
        </Box>

        {/* MAIN AREA */}
        {boards.length === 0 ? (
          <Flex
            flexDirection="column"
            align="center"
            justify="center"
            py={10}
            bg="whiteAlpha.100"
            borderRadius="lg"
            border="1px dashed"
            borderColor="whiteAlpha.300"
          >
            <Image height="120px" src={GnomeChild} width="120px" loading="lazy" mb={4} />
            <Text color="white" fontWeight="semibold" mb={1}>
              No boards yet.
            </Text>
            <Text color="whiteAlpha.700" fontSize="sm" mb={4} textAlign="center" maxW="320px">
              You haven't made or been added as an editor to any boards. Start one from scratch and
              invite your clan.
            </Text>
            <HubButton
              as={Link}
              to="/boards/create"
              variant="primary"
              accentColor={theme.colors.purple[400]}
              leftIcon={<AddIcon />}
            >
              Create your first board
            </HubButton>
          </Flex>
        ) : (
          <Flex flexDirection={['column', 'column', 'row']} gridGap="16px" align="stretch">
            {/* LEFT — board list */}
            <Flex
              flexDirection="column"
              bg="whiteAlpha.100"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={3}
              flex="1"
              minW={0}
            >
              {boards.length > 5 && (
                <InputGroup size="sm" mb={2}>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="whiteAlpha.500" />
                  </InputLeftElement>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search boards..."
                    bg="whiteAlpha.100"
                    borderColor="whiteAlpha.300"
                    color="white"
                    _placeholder={{ color: 'whiteAlpha.500' }}
                    _focus={{ borderColor: theme.colors.purple[300] }}
                  />
                </InputGroup>
              )}
              <VStack
                align="stretch"
                spacing={1}
                maxHeight={['240px', '360px']}
                overflowY="auto"
                css={`
                  scrollbar-width: thin;
                  scrollbar-color: ${theme.colors.purple[400]} rgba(255, 255, 255, 0.08);
                  &::-webkit-scrollbar {
                    width: 8px;
                  }
                  &::-webkit-scrollbar-thumb {
                    background: ${theme.colors.purple[400]};
                    border-radius: 4px;
                  }
                `}
              >
                {filteredBoards.length === 0 ? (
                  <Text color="whiteAlpha.600" fontSize="sm" textAlign="center" py={4}>
                    No boards match "{search}".
                  </Text>
                ) : (
                  filteredBoards.map((item) => {
                    const isSelected = shownBoard.board?.id === item.id;
                    const stats = boardStats(item);
                    return (
                      <Flex
                        key={item.id}
                        onClick={() => setShownBoard({ board: item, grid: getMiniBoardGrid(item) })}
                        align="center"
                        justify="space-between"
                        gap={2}
                        px={3}
                        py={2}
                        borderRadius="md"
                        cursor="pointer"
                        bg={isSelected ? theme.colors.purple[800] : 'transparent'}
                        borderLeft="3px solid"
                        borderLeftColor={isSelected ? theme.colors.purple[300] : 'transparent'}
                        _hover={{ bg: isSelected ? theme.colors.purple[800] : 'whiteAlpha.100' }}
                        transition="all 0.1s"
                      >
                        <Text
                          color="white"
                          fontSize="sm"
                          fontWeight={isSelected ? 'semibold' : 'normal'}
                          noOfLines={1}
                          minW={0}
                          flex={1}
                        >
                          {item.name}
                        </Text>
                        <HStack spacing={1} flexShrink={0}>
                          <Text fontSize="xs" color="whiteAlpha.600">
                            {stats.dims}
                          </Text>
                          {item.isPublic ? (
                            <UnlockIcon color="green.300" boxSize={3} />
                          ) : (
                            <LockIcon color="whiteAlpha.500" boxSize={3} />
                          )}
                        </HStack>
                      </Flex>
                    );
                  })
                )}
              </VStack>
            </Flex>

            {/* RIGHT — preview */}
            <Flex
              flexDirection="column"
              bg="whiteAlpha.100"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={4}
              flex="1.3"
              minW={0}
              minH="320px"
            >
              {shownBoard.board ? (
                <Flex flexDirection="column" align="center" gridGap={3}>
                  <Text
                    fontSize="md"
                    fontWeight="bold"
                    color="white"
                    fontFamily={theme.fonts.heading}
                    textAlign="center"
                  >
                    {shownBoard.board.name}
                  </Text>
                  <HStack justify="center" spacing={2} flexWrap="wrap">
                    {previewStats.dims && (
                      <Chip variant="default" size="sm">
                        {previewStats.dims}
                      </Chip>
                    )}
                    <Chip variant={previewStats.pct === 100 ? 'success' : 'info'} size="sm">
                      {previewStats.completed}/{previewStats.tileCount} ({previewStats.pct}%)
                    </Chip>

                    <Chip variant={shownBoard.board.isPublic ? 'success' : 'default'} size="sm">
                      {shownBoard.board.isPublic ? 'Public' : 'Private'}
                    </Chip>
                  </HStack>
                  <Box
                    bg={theme.colors.gray[700]}
                    borderRadius="10px"
                    padding="16px"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.25)"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    {shownBoard.grid && (
                      <MiniBingoBoard
                        grid={shownBoard.grid}
                        themeName={shownBoard.board.theme}
                        boardPx={['200px', '240px']}
                      />
                    )}
                  </Box>
                  <HStack justify="center" spacing={3}>
                    <Button
                      colorScheme="purple"
                      size="sm"
                      onClick={() =>
                        navigateToBoard({ boardId: shownBoard.board.id, asEditor: false })
                      }
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      bg="transparent"
                      color="purple.200"
                      border="1px solid"
                      borderColor="purple.300"
                      _hover={{ bg: 'purple.900', borderColor: 'purple.200', color: 'white' }}
                      onClick={() =>
                        navigateToBoard({ boardId: shownBoard.board.id, asEditor: true })
                      }
                    >
                      Edit
                    </Button>
                  </HStack>
                </Flex>
              ) : (
                <Flex
                  flex="1"
                  flexDirection="column"
                  align="center"
                  justify="center"
                  textAlign="center"
                  gap={3}
                >
                  <Image height="90px" src={GnomeChild} width="90px" loading="lazy" opacity={0.7} />
                  <Text color="whiteAlpha.700" fontSize="sm" maxW="260px">
                    Pick a board on the left to preview it here.
                  </Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        )}
      </Section>
    </Flex>
  );
}
