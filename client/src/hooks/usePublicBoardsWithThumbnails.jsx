import { useEffect, useState } from 'react';
import getMiniBoardGrid from '../utils/getMiniBoardGrid';
import { useQuery } from '@apollo/client';
import { GET_PUBLIC_BOARDS } from '../graphql/queries';

const usePublicBoardsWithThumbnails = () => {
  const [boards, setBoards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const { data, loading, fetchMore } = useQuery(GET_PUBLIC_BOARDS, {
    variables: { limit: 10, offset: 0 },
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (data) {
      const boardsWithGrid = data.getPublicBoards.boards.map((board) => ({
        ...board,
        grid: getMiniBoardGrid(board),
      }));
      setBoards(boardsWithGrid);
      setTotalCount(data.getPublicBoards.totalCount);
    }
  }, [data]);

  const loadMore = async () => {
    if (boards.length < totalCount && fetchMore) {
      try {
        const { data: moreData } = await fetchMore({
          variables: { limit: 10, offset: boards.length },
        });

        if (moreData) {
          const newBoardsWithGrid = moreData.getPublicBoards.boards.map((board) => ({
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

export default usePublicBoardsWithThumbnails;
