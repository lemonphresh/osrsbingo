import { Button, Text } from '@chakra-ui/react';
import React from 'react';
import theme from '../../theme';
import { Link } from 'react-router-dom';
import { EditIcon } from '@chakra-ui/icons';
import BoardEditors from '../../organisms/BoardEditors';

const BoardEditorsField = ({ board, canEdit, fieldActive, onClickEdit, onSave }) => (
  <>
    <Text alignItems="center" display="flex" justifyContent="center" marginTop="16px" width="100%">
      <Text
        as="span"
        color={theme.colors.teal[300]}
        display="inline"
        fontWeight="bold"
        marginRight="8px"
      >
        Editor(s):
      </Text>
      <Text>
        {board.editors.map((editor, idx) => (
          <Link to={`/user/${editor.id}`}>
            {idx !== 0 ? ', ' : ''}
            {editor.displayName}
          </Link>
        ))}
      </Text>
      {canEdit && (
        <Button
          _hover={{ backgroundColor: theme.colors.teal[800] }}
          color={theme.colors.teal[300]}
          marginLeft="8px"
          onClick={onClickEdit}
          textDecoration="underline"
          variant="ghost"
          width="fit-content"
        >
          <EditIcon />
        </Button>
      )}
    </Text>
    {canEdit && fieldActive ? (
      <>
        <BoardEditors boardId={board.id} onSubmit={onSave} />
      </>
    ) : null}
  </>
);

export default BoardEditorsField;
