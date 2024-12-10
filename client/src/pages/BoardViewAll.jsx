import React from 'react';
import { Flex, Spinner, Text, VStack, Button } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import usePublicBoardsWithThumbnails from '../hooks/usePublicBoardsWithThumbnails';
import MiniBingoBoard from '../atoms/MiniBingoBoard';
import { Link } from 'react-router-dom';
import theme from '../theme';

const BoardViewAll = () => {
  const { boards, loading, loadMore, hasMore } = usePublicBoardsWithThumbnails();
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
      <Section
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        maxWidth="720px"
        width="100%"
      >
        <GemTitle>All Boards</GemTitle>
        <Text marginX={['0px', '16px', '56px', '16px']} marginBottom="24px">
          This is a collection of all the public boards created by users of OSRS Bingo Hub. Take a
          look around!
        </Text>
        {loading && boards.length === 0 ? (
          <Spinner />
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
                  _hover={{
                    backgroundColor: theme.colors.teal[500],
                  }}
                  gap="16px"
                  justifyContent="space-between"
                  transition="0.2s ease all"
                  width="100%"
                >
                  <Flex flexDirection="column">
                    <Text
                      fontSize="lg"
                      fontWeight="bold"
                      mb={2}
                      width="fit-content"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {board.name}
                    </Text>
                    <Text fontSize="14px">Created by: {board.editors[0].username}</Text>
                  </Flex>
                  <Flex backgroundColor={theme.colors.gray[800]} borderRadius="8px" padding="6px">
                    <MiniBingoBoard grid={board.grid} />
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
    </Flex>
  );
};

export default BoardViewAll;
