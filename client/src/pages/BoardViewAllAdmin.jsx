import React, { useCallback, useEffect, useState } from 'react';
import { Flex, Spinner, Text, VStack, Button, Input } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import useAllBoardsWithThumbnails from '../hooks/useAllBoardsWithThumbnails';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import { Link, useNavigate } from 'react-router-dom';
import theme from '../theme';
import { debounce } from 'lodash';
import { useAuth } from '../providers/AuthProvider';
import { MdLockOutline, MdPublic } from 'react-icons/md';
import usePageTitle from '../hooks/usePageTitle';

const BoardViewAllAdmin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  usePageTitle('All Boards (ADMIN VIEW)');

  const { boards, loading, loadMore, hasMore } = useAllBoardsWithThumbnails({
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

  useEffect(() => {
    if (user?.admin === false) {
      navigate('/boards');
    }
  }, [navigate, user]);

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
                            fontWeight="semibold"
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
                          <Flex
                            alignItems="center"
                            fontSize="14px"
                            gridGap="8px"
                            justifyContent="center"
                            width="fit-content"
                          >
                            {!board.isPublic ? (
                              <>
                                <MdLockOutline /> Private
                              </>
                            ) : (
                              <>
                                <MdPublic /> Public
                              </>
                            )}
                          </Flex>
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

export default BoardViewAllAdmin;
