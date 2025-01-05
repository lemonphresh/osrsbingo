import { useEffect, useState } from 'react';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';
import { useQuery } from '@apollo/client';
import { GET_ALL_BOARDS } from '../graphql/queries';

const useAllBoardsWithThumbnails = ({ category = 'All', searchQuery = '' }) => {
  const [boards, setBoards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const { data, loading, fetchMore } = useQuery(GET_ALL_BOARDS, {
    variables: {
      limit: 10,
      offset: 0,
      category: category === 'All' ? null : category,
      searchQuery,
    },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data) {
      const boardsWithGrid = data.getAllBoards.boards.map((board) => ({
        ...board,
        grid: getMiniBoardGrid(board),
      }));
      setBoards(boardsWithGrid.filter((board) => board.category !== 'Featured'));
      setTotalCount(data.getAllBoards.totalCount);
    }
  }, [data]);

  const loadMore = async () => {
    if (boards.length < totalCount && fetchMore) {
      try {
        const { data: moreData } = await fetchMore({
          variables: {
            limit: 10,
            offset: boards.length,
            category: category === 'All' ? null : category,
            searchQuery,
          },
        });

        if (moreData) {
          const newBoardsWithGrid = moreData.getAllBoards.boards.map((board) => ({
            ...board,
            grid: getMiniBoardGrid(board),
          }));
          setBoards((prev) => [...prev, ...newBoardsWithGrid]);
        }
      } catch (error) {
        console.error('Error fetching more boards:', error);
      }
    }
  };

  const hasMore = boards.length < totalCount && totalCount > 0;

  return { boards, loading, loadMore, hasMore };
};

export default useAllBoardsWithThumbnails;
