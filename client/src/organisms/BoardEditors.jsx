import React, { useState, useEffect } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Input, List, ListItem, Text, Flex, Checkbox } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { SEARCH_USERS } from '../graphql/queries';
import { UPDATE_BOARD_EDITORS } from '../graphql/mutations';
import { GET_BOARD } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { useToastContext } from '../providers/ToastProvider';

const BoardEditors = ({ boardId, onSubmit }) => {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEditors, setSelectedEditors] = useState([]);

  const [searchUsers, { data, loading: searchLoading }] = useLazyQuery(SEARCH_USERS, {
    variables: { search: searchTerm },
    fetchPolicy: 'no-cache',
  });

  const { data: boardData, loading: boardLoading } = useQuery(GET_BOARD, {
    variables: { id: boardId },
  });

  const handleSearchChange = debounce((e) => {
    const query = e.target.value;
    setSearchTerm(query);
    searchUsers();
  }, 500);

  const [updateBoardEditors] = useMutation(UPDATE_BOARD_EDITORS, {
    onCompleted: (data) => {
      showToast('Successfully updated editor list.', 'success');
    },
    onError: (error) => {
      showToast('Error updating board editors.', 'error');
    },
  });

  const handleEditorSelect = (userId) => {
    setSelectedEditors((prevSelected) =>
      prevSelected.includes(userId)
        ? prevSelected.filter((id) => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const handleSubmit = async () => {
    if (boardData && boardData.getBingoBoard) {
      const boardOwnerId = boardData.getBingoBoard.userId;
      await updateBoardEditors({
        variables: {
          boardId,
          editorIds: [...new Set([boardOwnerId, ...selectedEditors])].filter((id) => id != null),
        },
      });
      onSubmit();
    }
  };

  useEffect(() => {
    if (boardData && boardData.getBingoBoard) {
      const boardOwnerId = boardData.getBingoBoard.userId;
      const currentEditors = boardData.getBingoBoard.editors.map((editor) => editor.id);

      setSelectedEditors([...new Set([boardOwnerId, ...currentEditors])]);
    }
  }, [boardData]);

  const isDisabledAndChecked = (userId) => {
    const isOriginalEditor = boardData && boardData.getBingoBoard.editors[0]?.id === userId;
    const isCurrentUser = user?.id === userId;
    return isOriginalEditor || isCurrentUser;
  };

  const editorDetailsData = data?.searchUsers || [];

  return (
    <Flex direction="column" maxWidth="400px" mx="auto" p={4} width="100%">
      <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
        Search users to add to or remove from your editors list.
      </Text>
      <Input
        backgroundColor={theme.colors.gray[300]}
        color={theme.colors.gray[700]}
        onChange={handleSearchChange}
        placeholder="Search users..."
        mb={4}
        defaultValue={searchTerm}
      />
      {searchLoading && <Text>Loading...</Text>}
      {boardLoading && <Text>Loading board data...</Text>}
      {editorDetailsData.length > 0 && (
        <List spacing={2}>
          {editorDetailsData?.length > 0 &&
            editorDetailsData.map((u) => (
              <ListItem key={u.id} display="flex" alignItems="center">
                <Checkbox
                  isChecked={selectedEditors.includes(u.id)}
                  onChange={() => handleEditorSelect(u.id)}
                  mr={2}
                  isDisabled={isDisabledAndChecked(u.id)}
                />
                <Text>
                  {u.username} {u.rsn ? `(${u.rsn})` : ''}{' '}
                  {u.id === user?.id ? (
                    <span
                      style={{
                        color: theme.colors.teal[500],
                      }}
                    >
                      (you)
                    </span>
                  ) : (
                    ''
                  )}{' '}
                  {u.id === boardData.getBingoBoard.userId ? (
                    <span
                      style={{
                        color: theme.colors.yellow[500],
                      }}
                    >
                      (owner)
                    </span>
                  ) : (
                    ''
                  )}
                </Text>
              </ListItem>
            ))}
        </List>
      )}
      <Button
        margin="0 auto"
        onClick={handleSubmit}
        colorScheme="green"
        mt={4}
        isDisabled={selectedEditors.length === 0}
        maxWidth="250px"
      >
        Update Editors
      </Button>
    </Flex>
  );
};

export default BoardEditors;
