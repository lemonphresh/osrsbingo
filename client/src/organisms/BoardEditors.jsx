import React, { useState, useEffect } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { Button, Input, List, ListItem, Text, Flex, Checkbox, IconButton } from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { SEARCH_USERS } from '../graphql/queries';
import { SEND_EDITOR_INVITATIONS, UPDATE_BOARD_EDITORS } from '../graphql/mutations';
import { GET_BOARD } from '../graphql/queries';
import { useAuth } from '../providers/AuthProvider';
import theme from '../theme';
import { useToastContext } from '../providers/ToastProvider';
import { CloseIcon } from '@chakra-ui/icons';

const BoardEditors = ({ boardId, onSubmit }) => {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [selectedEditors, setSelectedEditors] = useState([]);

  const [searchUsers, { data, loading: searchLoading }] = useLazyQuery(SEARCH_USERS, {
    variables: { search: searchTerm },
    fetchPolicy: 'no-cache',
  });

  const { data: boardData, loading: boardLoading } = useQuery(GET_BOARD, {
    variables: { id: boardId },
  });

  const [sendEditorInvitations] = useMutation(SEND_EDITOR_INVITATIONS, {
    onCompleted: () => {
      showToast('Invitations sent successfully.', 'success');
      setPendingInvitations([]);
      onSubmit();
    },
    onError: () => {
      showToast('Error sending invitations.', 'error');
    },
  });

  const [updateBoardEditors] = useMutation(UPDATE_BOARD_EDITORS, {
    onCompleted: (data) => {
      showToast('Editors updated successfully.', 'success');
    },
    onError: () => {
      showToast('Error updating editors.', 'error');
    },
  });

  const handleSearchChange = debounce((e) => {
    const query = e.target.value;
    setSearchTerm(query);
    searchUsers();
  }, 500);

  const handleEditorSelect = (userId) => {
    setPendingInvitations((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (pendingInvitations.length > 0) {
      await sendEditorInvitations({
        variables: {
          boardId,
          invitedUserIds: pendingInvitations,
        },
      });
    }
  };

  const handleRemoveEditor = (userId) => {
    const updatedEditors = selectedEditors.filter((id) => id !== userId);
    setSelectedEditors(updatedEditors);
    updateBoardEditors({
      variables: {
        boardId,
        editorIds: updatedEditors,
      },
    });
  };

  useEffect(() => {
    if (boardData && boardData.getBingoBoard) {
      const currentEditors = boardData.getBingoBoard.editors.map((editor) => editor.id);
      setSelectedEditors(currentEditors);
    }
  }, [boardData]);

  const isDisabledAndChecked = (userId) => {
    const isCurrentEditor = selectedEditors.includes(userId);
    const isCurrentUser = user?.id === userId;
    return isCurrentEditor || isCurrentUser;
  };

  const editorDetailsData = data?.searchUsers || [];

  return (
    <Flex direction="column" maxWidth="400px" mx="auto" p={4} width="100%">
      <Text fontSize="14px" marginBottom="4px" marginLeft="8px">
        Search users to invite as editors.
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
          {editorDetailsData.map((u) => (
            <ListItem key={u.id} display="flex" alignItems="center">
              <Checkbox
                isChecked={pendingInvitations.includes(u.id)}
                onChange={() => handleEditorSelect(u.id)}
                mr={2}
                isDisabled={isDisabledAndChecked(u.id)}
              />
              <Text flex="1">
                {u.displayName} {u.rsn ? `(${u.rsn})` : ''}{' '}
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
                )}
              </Text>
              {selectedEditors.includes(u.id) && u.id !== user?.id && (
                <IconButton
                  aria-label="Remove editor"
                  icon={<CloseIcon />}
                  onClick={() => handleRemoveEditor(u.id)}
                  colorScheme="red"
                  size="sm"
                  variant="ghost"
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
      <Button
        margin="0 auto"
        onClick={handleSubmit}
        colorScheme="green"
        mt={4}
        isDisabled={pendingInvitations.length === 0}
        maxWidth="250px"
      >
        Send Invitations
      </Button>
    </Flex>
  );
};

export default BoardEditors;
