import { useQuery } from '@apollo/client';
import { GET_PUBLIC_BOARDS } from '../graphql/queries';

const usePublicBoardsWithThumbnails = () => {
  const { data, loading, error } = useQuery(GET_PUBLIC_BOARDS, { fetchPolicy: 'network-only' });

  const boardsWithGrid = data?.getPublicBoards.map((board) => {
    const tileStatusMap = board.tiles.reduce((acc, tile) => {
      acc[tile.id] = tile.isComplete;
      return acc;
    }, {});

    const grid = board.layout.map((row) =>
      row.map((tileId) => ({
        id: tileId,
        isComplete: tileStatusMap[tileId],
      }))
    );

    return { ...board, grid };
  });

  return {
    boards: boardsWithGrid || [],
    loading,
    error,
  };
};

export default usePublicBoardsWithThumbnails;
