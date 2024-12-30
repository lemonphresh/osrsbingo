import React, { useCallback, useState } from 'react';
import { Flex, Spinner, Text, VStack, Button, Input } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePublicBoardsWithThumbnails from '../hooks/usePublicBoardsWithThumbnails';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import { Link } from 'react-router-dom';
import theme from '../theme';
import { debounce } from 'lodash';
import { StarIcon } from '@chakra-ui/icons';

const BoardViewAll = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  const { boards, loading, loadMore, hasMore, featuredBoards } = usePublicBoardsWithThumbnails({
    category: selectedCategory,
    searchQuery: debouncedSearchQuery,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query) => setDebouncedSearchQuery(query), 500),
    []
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    debouncedSearch(event.target.value);
  };

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      justifyContent="center"
      marginX={['8px', '24px']}
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      {loading ? (
        <Spinner />
      ) : (
        debouncedSearchQuery === '' && (
          <>
            {featuredBoards.length >= 1 && selectedCategory === 'All' && (
              <Section
                alignItems="center"
                backgroundColor="rgba(0, 225, 200, 0.5)"
                flexDirection="column"
                justifyContent="center"
                marginBottom="24px"
                maxWidth="900px"
                width="100%"
              >
                <GemTitle gemColor="green">Featured Boards</GemTitle>
                <Flex
                  width="100%"
                  alignItems="center"
                  gridGap="16px"
                  flexWrap="wrap"
                  justifyContent={['flex-start', 'flex-start', 'space-between']}
                  marginTop="8px"
                >
                  {featuredBoards.slice(0, 4).map((board, index) => (
                    <Section
                      alignItems="center"
                      backgroundColor="rgba(0, 225, 200, 0.4)"
                      _hover={{
                        backgroundColor: theme.colors.green[500],
                      }}
                      cursor="pointer"
                      flexDirection="row"
                      gap="16px"
                      justifyContent="space-between"
                      key={index}
                      margin="0 auto"
                      padding="16px"
                      transition="0.2s ease all"
                      width={['100%', '100%', 'calc(50% - 8px)']}
                    >
                      <Link
                        key={board.id}
                        style={{
                          alignItems: 'center',
                          display: 'flex',
                          justifyContent: 'space-between',
                          width: '100%',
                          textDecoration: 'none',
                        }}
                        to={`/boards/${board.id}`}
                      >
                        <Flex flexDirection="column" minHeight="72px" width="100%">
                          <Text
                            display="-webkit-box"
                            fontSize="lg"
                            fontWeight="bold"
                            mb={2}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            maxWidth="100%"
                            whiteSpace="normal"
                            css={{
                              '-webkit-box-orient': 'vertical',
                              '-webkit-line-clamp': '1',
                            }}
                          >
                            <StarIcon color={theme.colors.orange[300]} marginRight="8px" />
                            {board.name}
                          </Text>
                          <Text fontSize="14px">
                            By: {board.editors[0].displayName}{' '}
                            {board.editors.length > 1 && ` & ${board.editors.length - 1} other(s)`}
                          </Text>
                        </Flex>
                      </Link>
                    </Section>
                  ))}
                </Flex>
              </Section>
            )}

            <Input
              type="text"
              color={theme.colors.gray[800]}
              value={searchQuery}
              backgroundColor={theme.colors.gray[200]}
              marginY="16px"
              onChange={handleSearchChange}
              placeholder="Search boards..."
              style={{
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginLeft: '8px',
                width: '200px',
              }}
            />
            <Flex
              alignItems="baseline"
              justifyContent="center"
              gap="8px"
              marginBottom="24px"
              flexWrap="wrap"
            >
              <Text>Filter by:</Text>
              {['All', 'PvP', 'PvM', 'Skilling', 'Social', 'Other'].map((category) => (
                <Button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  colorScheme={category === selectedCategory ? 'teal' : 'gray'}
                >
                  {category}
                </Button>
              ))}
            </Flex>
            <Section
              alignItems="center"
              flexDirection="column"
              justifyContent="center"
              maxWidth="720px"
              width="100%"
            >
              <GemTitle gemColor="blue">All Boards</GemTitle>
              <Text marginX={['0px', '16px', '56px', '16px']} marginBottom="24px">
                This is a collection of all the public boards created by users of OSRS Bingo Hub.
                Take a look around!
              </Text>

              {boards.length === 0 ? (
                <Text>Sorry, no boards here.</Text>
              ) : (
                <VStack spacing={4} width="100%">
                  {boards.map((board) => (
                    <Link
                      key={board.id}
                      style={{ width: '100%', textDecoration: 'none' }}
                      to={`/boards/${board.id}`}
                    >
                      <Section
                        alignItems="center"
                        _hover={{
                          backgroundColor: theme.colors.teal[500],
                        }}
                        gap="16px"
                        justifyContent="space-between"
                        padding={['16px', '16px', '16px', '24px']}
                        transition="0.2s ease all"
                        width="100%"
                      >
                        <Flex flexDirection="column">
                          <Text
                            display={['-webkit-box']}
                            fontSize="lg"
                            fontWeight="bold"
                            mb={2}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            maxWidth="100%"
                            whiteSpace="normal"
                            css={`
                              -webkit-box-orient: vertical;
                              -webkit-line-clamp: 2;
                            `}
                          >
                            {board.name}
                          </Text>
                          <Text fontSize="14px">
                            By: {board.editors[0].displayName}{' '}
                            {board.editors.length > 1 && ` & ${board.editors.length - 1} other(s)`}
                          </Text>
                          <Text fontSize="14px">Category: {board.category}</Text>
                        </Flex>
                        <Flex
                          backgroundColor={theme.colors.gray[800]}
                          borderRadius="8px"
                          padding="6px"
                        >
                          <MiniBingoBoard grid={board.grid} themeName={board.theme} />
                        </Flex>
                      </Section>
                    </Link>
                  ))}
                  {hasMore && (
                    <Button onClick={loadMore} isLoading={loading}>
                      Load More
                    </Button>
                  )}
                </VStack>
              )}
            </Section>
          </>
        )
      )}
    </Flex>
  );
};

export default BoardViewAll;
