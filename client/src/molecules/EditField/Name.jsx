import React from 'react';
import EditField from '../EditField';
import { Button } from '@chakra-ui/react';
import theme from '../../theme';
import GemTitle from '../../atoms/GemTitle';

const Name = ({ board, canEdit, fieldActive, MUTATION, onClickEdit, onSave }) => (
  <>
    {fieldActive ? (
      <EditField
        defaultValue={board.name}
        entityId={board.id}
        fieldName="name"
        MUTATION={MUTATION}
        onSave={onSave}
        value={board.name}
      />
    ) : (
      canEdit && (
        <Button
          _hover={{ backgroundColor: theme.colors.teal[800] }}
          color={theme.colors.teal[300]}
          margin="0 auto"
          marginBottom="8px"
          onClick={onClickEdit}
          textDecoration="underline"
          variant="ghost"
          width="fit-content"
        >
          Edit Name
        </Button>
      )
    )}
    {!fieldActive && (
      <GemTitle marginBottom="16px" textAlign="center">
        {board.name}
      </GemTitle>
    )}
  </>
);

export default Name;
