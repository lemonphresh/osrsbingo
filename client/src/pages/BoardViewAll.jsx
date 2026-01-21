import React, { useCallback, useState } from 'react';
import { Flex, Skeleton, Text, VStack, Button, Input, HStack, IconButton } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePublicBoardsWithThumbnails from '../hooks/usePublicBoardsWithThumbnails';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import { Link } from 'react-router-dom';
import theme from '../theme';
import { debounce } from 'lodash';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import usePageTitle from '../hooks/usePageTitle';

const BOARDS_PER_PAGE = 10;

// skeleton card for loading state
const BoardCardSkeleton = () => (
  <Section
    alignItems="center"
    gap="16px"
    justifyContent="space-between"
    padding={['16px', '16px', '16px', '24px']}
    width="100%"
  >
    <Flex flexDirection="column" flex="1">
      <Skeleton height="24px" width="70%" mb={3} borderRadius="4px" />
      <Skeleton height="14px" width="40%" mb={2} borderRadius="4px" />
      <Skeleton height="14px" width="30%" borderRadius="4px" />
    </Flex>
    <Skeleton height="80px" width="80px" borderRadius="8px" flexShrink={0} />
  </Section>
);

const BoardViewAll = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);

  usePageTitle('All Boards');

  const { boards, loading, totalCount, featuredBoards } = usePublicBoardsWithThumbnails({
    category: selectedCategory,
    searchQuery: debouncedSearchQuery,
    page: currentPage,
    limit: BOARDS_PER_PAGE,
  });

  const totalPages = Math.ceil(totalCount / BOARDS_PER_PAGE);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query) => {
      setDebouncedSearchQuery(query);
      setCurrentPage(1); // reset to first page on new search
    }, 500),
    []
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1); // reset to first page on category change
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsisStart = currentPage > 3;
    const showEllipsisEnd = currentPage < totalPages - 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (showEllipsisStart) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (showEllipsisEnd) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
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
      {featuredBoards.length >= 1 &&
        selectedCategory === 'All' &&
        debouncedSearchQuery === '' &&
        currentPage === 1 && (
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
                  _hover={{ backgroundColor: theme.colors.green[500] }}
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
                        css={{ '-webkit-box-orient': 'vertical', '-webkit-line-clamp': '1' }}
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
            onClick={() => handleCategoryChange(category)}
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
          This is a collection of all the public boards created by users of OSRS Bingo Hub. Take a
          look around!
        </Text>

        {/* results count */}
        {totalCount > 0 && (
          <Text fontSize="sm" color={theme.colors.gray[400]} marginBottom="16px">
            Showing {(currentPage - 1) * BOARDS_PER_PAGE + 1}-
            {Math.min(currentPage * BOARDS_PER_PAGE, totalCount)} of {totalCount} boards
          </Text>
        )}

        {loading ? (
          <VStack spacing={4} width="100%">
            {[...Array(5)].map((_, i) => (
              <BoardCardSkeleton key={i} />
            ))}
          </VStack>
        ) : boards.length === 0 ? (
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
                  _hover={{ backgroundColor: theme.colors.teal[500] }}
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
                  <Flex backgroundColor={theme.colors.gray[800]} borderRadius="8px" padding="6px">
                    <MiniBingoBoard grid={board.grid} themeName={board.theme} />
                  </Flex>
                </Section>
              </Link>
            ))}

            {/* pagination controls */}
            {totalPages > 1 && (
              <HStack spacing={2} paddingY="24px" justifyContent="center" flexWrap="wrap">
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  onClick={() => goToPage(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  size="sm"
                  variant="solid"
                />

                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <Text key={`ellipsis-${idx}`} px={2} color={theme.colors.gray[400]}>
                      ...
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      onClick={() => goToPage(page)}
                      size="sm"
                      color={currentPage === page ? theme.colors.gray[800] : theme.colors.gray[200]}
                      variant={currentPage === page ? 'solid' : 'outline'}
                      colorScheme={currentPage === page ? 'gray' : 'pink'}
                      _hover={{
                        color: theme.colors.gray[600],
                        backgroundColor: theme.colors.teal[200],
                        borderColor: theme.colors.teal[200],
                      }}
                      minW="40px"
                    >
                      {page}
                    </Button>
                  )
                )}

                <IconButton
                  aria-label="Next page"
                  icon={<ChevronRightIcon />}
                  onClick={() => goToPage(currentPage + 1)}
                  isDisabled={currentPage === totalPages}
                  size="sm"
                  variant="solid"
                />
              </HStack>
            )}
          </VStack>
        )}
      </Section>
    </Flex>
  );
};

export default BoardViewAll;
