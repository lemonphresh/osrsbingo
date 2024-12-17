import React from 'react';
import { Flex, Text } from '@chakra-ui/react';
import Section from '../atoms/Section';
import GemTitle from '../atoms/GemTitle';
import { useNavigate } from 'react-router-dom';
import BoardCreationForm from '../organisms/BoardCreationForm';
import { useMutation } from '@apollo/client';
import { CREATE_BOARD } from '../graphql/mutations';
import { useAuth } from '../providers/AuthProvider';
import { useToastContext } from '../providers/ToastProvider';
import { GET_USER } from '../graphql/queries';

const BoardCreation = () => {
  const { user } = useAuth();
  const [createBingoBoard] = useMutation(CREATE_BOARD, {
    update(cache, { data: { createBingoBoard } }) {
      const existingData = cache.readQuery({
        query: GET_USER,
        variables: { id: user.id },
      });

      if (existingData) {
        cache.writeQuery({
          query: GET_USER,
          variables: { id: user.id },
          data: {
            getUser: {
              ...existingData.getUser,
              bingoBoards: [...existingData.getUser.bingoBoards, createBingoBoard],
            },
          },
        });
      }
    },
  });
  const { showToast } = useToastContext();
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      const response = await createBingoBoard({
        variables: {
          input: {
            userId: user.id,
            name: values.name,
            category: values.category,
            description: values.description,
            baseTileValue: values.baseTileValue,
            type: values.type,
            isPublic: values.isPublic,
            editors: [user.id],
            team: values.team,
            totalValueCompleted: 0,
            totalValue: 0,
            bonusSettings: {
              allowDiagonals: true,
              horizontalBonus: 1,
              verticalBonus: 1,
              diagonalBonus: 1,
              blackoutBonus: 0,
            },
          },
        },
      });
      navigate(`/boards/${response.data.createBingoBoard.id}`, { state: { isEditMode: true } });
      showToast('Board successfully created!', 'success');
    } catch (err) {
      showToast('Failed to create board.', 'error');
    }
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
      <Section
        alignItems="center"
        flexDirection="column"
        justifyContent="center"
        maxWidth="720px"
        width="100%"
      >
        <GemTitle>Create a Board</GemTitle>
        <Text marginX={['0px', '16px', '56px', '16px']} marginBottom="24px">
          Provide some basic details about your board here. You'll be able to update the individual
          tiles with your exciting gamer goals on the next step!
        </Text>
        <BoardCreationForm onSubmit={handleSubmit} />
      </Section>
    </Flex>
  );
};

export default BoardCreation;
