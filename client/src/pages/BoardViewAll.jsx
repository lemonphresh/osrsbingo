import React, { useCallback, useState } from 'react';
import {
  Flex,
  Skeleton,
  Text,
  VStack,
  Button,
  Input,
  HStack,
  IconButton,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePublicBoardsWithThumbnails from '../hooks/usePublicBoardsWithThumbnails';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import { Link } from 'react-router-dom';
import theme from '../theme';
import { debounce } from 'lodash';
import usePageTitle from '../hooks/usePageTitle';

const BOARDS_PER_PAGE = 10;
const CATEGORIES = ['All', 'PvP', 'PvM', 'Skilling', 'Social', 'Other'];

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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
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
      setCurrentPage(1);
    }, 500),
    []
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const showFeatured =
    featuredBoards.length >= 1 &&
    selectedCategory === 'All' &&
    debouncedSearchQuery === '' &&
    currentPage === 1;

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      marginX={['8px', '24px']}
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
    >
      {/* Featured boards */}
      {showFeatured && (
        <Section
          alignItems="center"
          backgroundColor="rgba(0, 225, 200, 0.5)"
          flexDirection="column"
          justifyContent="center"
          marginBottom="32px"
          maxWidth="900px"
          width="100%"
        >
          <GemTitle gemColor="green">Featured Boards</GemTitle>
          <Flex
            width="100%"
            alignItems="center"
            gap="16px"
            flexWrap="wrap"
            justifyContent={['flex-start', 'flex-start', 'space-between']}
            marginTop="8px"
          >
            {featuredBoards.slice(0, 4).map((board, index) => (
              <Link
                key={board.id}
                style={{
                  width: 'calc(50% - 8px)',
                  minWidth: '240px',
                  flex: '1',
                  textDecoration: 'none',
                }}
                to={`/boards/${board.id}`}
              >
                <Section
                  alignItems="center"
                  backgroundColor="rgba(0, 225, 200, 0.4)"
                  _hover={{ backgroundColor: theme.colors.green[500] }}
                  cursor="pointer"
                  flexDirection="row"
                  gap="16px"
                  justifyContent="space-between"
                  padding="16px"
                  transition="0.2s ease all"
                  width="100%"
                >
                  <Flex flexDirection="column" minHeight="72px" width="100%">
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      mb={2}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      <StarIcon color={theme.colors.orange[300]} marginRight="8px" />
                      {board.name}
                    </Text>
                    <Text fontSize="14px" color={theme.colors.gray[300]}>
                      By {board.editors[0].displayName}
                      {board.editors.length > 1 && ` & ${board.editors.length - 1} other(s)`}
                    </Text>
                  </Flex>
                </Section>
              </Link>
            ))}
          </Flex>
        </Section>
      )}

      {/* Search + filter bar */}
      <Flex
        alignItems="center"
        flexDirection={['column', 'column', 'row']}
        gap="12px"
        justifyContent="center"
        marginBottom="24px"
        maxWidth="900px"
        width="100%"
      >
        <InputGroup maxWidth={['100%', '280px']} flexShrink={0}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color={theme.colors.gray[500]} />
          </InputLeftElement>
          <Input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search boards..."
            backgroundColor={theme.colors.gray[200]}
            color={theme.colors.gray[800]}
            borderRadius="8px"
            _placeholder={{ color: theme.colors.gray[500] }}
          />
        </InputGroup>

        <HStack spacing={2} flexWrap="wrap" justifyContent="center">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              onClick={() => handleCategoryChange(category)}
              colorScheme={category === selectedCategory ? 'teal' : 'gray'}
              size="sm"
              variant="solid"
            >
              {category}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Board list */}
      <Section
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        maxWidth="720px"
        width="100%"
      >
        <GemTitle gemColor="blue">All Boards</GemTitle>
        <Text marginX={['0px', '16px', '56px', '16px']} marginBottom="24px" textAlign="center">
          A collection of all public boards created by OSRS Bingo Hub users. Take a look around!
        </Text>

        {totalCount > 0 && (
          <Text
            fontSize="sm"
            color={theme.colors.gray[400]}
            marginBottom="16px"
            alignSelf="flex-start"
          >
            Showing {(currentPage - 1) * BOARDS_PER_PAGE + 1}–
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
          <Flex
            alignItems="center"
            flexDirection="column"
            justifyContent="center"
            paddingY="48px"
            gap="8px"
            width="100%"
          >
            <Text fontSize="32px">🔍</Text>
            <Text fontWeight="semibold">No boards found</Text>
            <Text fontSize="sm" color={theme.colors.gray[400]}>
              {debouncedSearchQuery
                ? `No results for "${debouncedSearchQuery}"`
                : 'Nothing in this category yet.'}
            </Text>
          </Flex>
        ) : (
          <VStack spacing={3} width="100%">
            {boards.map((board) => (
              <Link
                key={board.id}
                style={{ width: '100%', textDecoration: 'none' }}
                to={`/boards/${board.id}`}
              >
                <Section
                  alignItems="center"
                  _hover={{
                    backgroundColor: theme.colors.teal[600],
                    transform: 'translateY(-1px)',
                  }}
                  gap="16px"
                  justifyContent="space-between"
                  padding={['12px 16px', '16px 24px']}
                  transition="0.15s ease all"
                  width="100%"
                >
                  <Flex flexDirection="column" flex="1" minWidth={0}>
                    <Text
                      fontSize="lg"
                      fontWeight="semibold"
                      mb={1}
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {board.name}
                    </Text>
                    <Text fontSize="13px" color={theme.colors.gray[300]}>
                      By {board.editors[0].displayName}
                      {board.editors.length > 1 && ` & ${board.editors.length - 1} other(s)`}
                    </Text>
                    <Text fontSize="13px" color={theme.colors.gray[400]}>
                      {board.category}
                    </Text>
                  </Flex>
                  <Flex
                    backgroundColor={theme.colors.gray[800]}
                    borderRadius="8px"
                    padding="6px"
                    flexShrink={0}
                  >
                    <MiniBingoBoard grid={board.grid} themeName={board.theme} />
                  </Flex>
                </Section>
              </Link>
            ))}

            {totalPages > 1 && (
              <HStack spacing={2} paddingY="24px" justifyContent="center" flexWrap="wrap">
                <IconButton
                  aria-label="Previous page"
                  icon={<ChevronLeftIcon />}
                  onClick={() => goToPage(currentPage - 1)}
                  isDisabled={currentPage === 1}
                  size="sm"
                />
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <Text key={`ellipsis-${idx}`} px={2} color={theme.colors.gray[400]}>
                      …
                    </Text>
                  ) : (
                    <Button
                      key={page}
                      onClick={() => goToPage(page)}
                      size="sm"
                      colorScheme={currentPage === page ? 'teal' : 'gray'}
                      variant={currentPage === page ? 'solid' : 'ghost'}
                      minW="36px"
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
