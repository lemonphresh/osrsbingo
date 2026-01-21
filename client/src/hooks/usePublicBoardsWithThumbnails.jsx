import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_PUBLIC_BOARDS, GET_FEATURED_BOARDS } from '../graphql/queries';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';

const usePublicBoardsWithThumbnails = ({
  category = 'All',
  searchQuery = '',
  page = 1,
  limit = 10,
}) => {
  const [boards, setBoards] = useState([]);
  const [featuredBoards, setFeaturedBoards] = useState([]);

  // convert page to offset for the backend
  const offset = (page - 1) * limit;

  const { data, loading, error } = useQuery(GET_PUBLIC_BOARDS, {
    variables: {
      limit,
      offset,
      category: category === 'All' ? null : category,
      searchQuery: searchQuery || '',
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data: featuredData } = useQuery(GET_FEATURED_BOARDS, {
    variables: { limit: 4, offset: 0 },
    fetchPolicy: 'cache-first', // featured boards don't change often
  });

  // process regular boards
  useEffect(() => {
    if (data?.getPublicBoards?.boards) {
      const boardsWithGrid = data.getPublicBoards.boards.map((board) => ({
        ...board,
        grid: getMiniBoardGrid(board),
      }));
      setBoards(boardsWithGrid);
    } else {
      setBoards([]);
    }
  }, [data]);

  // process featured boards
  useEffect(() => {
    if (featuredData?.getFeaturedBoards?.boards) {
      const boardsWithGrid = featuredData.getFeaturedBoards.boards.map((board) => ({
        ...board,
        grid: getMiniBoardGrid(board),
      }));
      setFeaturedBoards(boardsWithGrid);
    }
  }, [featuredData]);

  return {
    boards,
    totalCount: data?.getPublicBoards?.totalCount || 0,
    featuredBoards,
    loading,
    error,
  };
};

export default usePublicBoardsWithThumbnails;
