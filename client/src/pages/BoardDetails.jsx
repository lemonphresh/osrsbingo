import React, { useEffect, useState } from 'react';
import { Flex, Heading, Text } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_BOARD } from '../graphql/queries';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import theme from '../theme';
import BingoTile from '../organisms/BingoTile';
import BingoBoard from '../molecules/BingoBoard';
import { useAuth } from '../providers/AuthProvider';

const BoardDetails = () => {
  const { user } = useAuth();
  const params = useParams();
  const { data } = useQuery(GET_BOARD, {
    variables: { id: params.boardId },
  });
  const [board, setBoard] = useState(data?.getBingoBoard);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    if (data?.getBingoBoard) {
      const { layout, tiles } = data.getBingoBoard;

      // Replace IDs in layout with full tile details
      const renderedLayout = layout.map((row) =>
        row.map((tileId) => tiles.find((tile) => tile.id === tileId))
      );

      // Update the board with the processed layout
      setBoard({ ...data.getBingoBoard, layout: renderedLayout });
    }
  }, [data?.getBingoBoard, setBoard]);

  useEffect(() => {
    if (board?.editors?.includes(user.id)) {
      setIsEditor(true);
    }
  }, [board, user.id]);

  console.log({ board });

  return (
    <Flex
      alignItems="center"
      flex="1"
      flexDirection="column"
      height="100%"
      paddingX={['16px', '24px', '64px']}
      paddingY={['72px', '112px']}
      width="100%"
    >
      {board && (
        <>
          <Section flexDirection="column">
            <GemTitle>{board.name}</GemTitle>
            <Text width="100%">
              <Text
                as="span"
                color={theme.colors.teal[300]}
                display="inline"
                fontWeight="bold"
                marginRight="4px"
              >
                Editors:
              </Text>
              {board.editors.join(', ')}
            </Text>
          </Section>

          <Flex flexDirection="column" marginTop="24px">
            <BingoBoard isEditor={isEditor} layout={board.layout} />
          </Flex>
        </>
      )}
    </Flex>
  );
};

export default BoardDetails;
